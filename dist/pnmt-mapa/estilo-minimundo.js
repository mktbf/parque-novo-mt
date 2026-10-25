// estilo-minimundo.js
// Acabamento de maquete estilizada para o mapa 3D do Parque Novo Mato Grosso.
// Roda UMA vez depois que a cena está montada e as texturas carregaram.
// Não cria nem move nenhuma peça: só troca materiais, luz, fundo, copas e adiciona a base de maquete.
//
// Uso (app.js, logo depois do await Promise.allSettled([... loadMaterials ...])):
//   aplicarEstiloMinimundo(scene, renderer, T);

const PALETA = {
  grama: '#8ccf52',
  asfalto: '#454b50',
  agua: '#2f9fd6',
  fundo: '#1d5f3d',
  terra: '#b85a33',
  copa: '#6fb848',
  tronco: '#7a4a2a',
};

// grupo (regex sobre o ancestral nomeado mais alto) | mesh.name OU cor original (#hex) | nova cor
const RECOLORIR = [
  [/Casa Cuiabana/, 'Lazer · clay-tile', '#b94a33'],
  [/Casa Cuiabana/, 'Lazer · clay-ridge', '#8f3626'],
  [/Casa Cuiabana/, 'Lazer · wood', '#b0342a'],
  [/Casa Cuiabana/, 'Lazer · cream', '#f3ead8'],
  [/Casa Cuiabana/, 'Lazer · ochre', '#efe6d2'],
  [/Autódromo · pista/, 'Autódromo · runoff', '#2b7fc4'],
  [/Autódromo · pista/, 'Autódromo · kerbGreen', '#cc3a2e'],
  [/Autódromo · pista/, 'Autódromo · kerbWhite', '#f4f1ea'],
  [/Autódromo · pista/, 'Autódromo · shoulder', '#c9b48a'],
  [/BMX/, 'Lazer · bmx-blue', '#1f6fc2'],
  [/BMX/, 'Lazer · bmx-yellow', '#f2c230'],
  [/BMX/, 'Lazer · bmx-navy', '#15467a'],
  [/Kartódromo/, '#56877d', '#1f9d6b'],
  [/Kartódromo/, '#729995', '#2bb27a'],
  [/Roda-gigante/, 'Lazer · steel', '#d83a2b'],
  [/Roda-gigante/, 'Lazer · dark', '#d9d3dd'],
  [/Roda-gigante/, 'Lazer · paint-white', '#f4f1f6'],
  [/Pórtico/, '#d9dfdd', '#f3f3ee'],
  [/Pórtico/, '#69777c', '#b58fd6'],
  [/Motocross/, '#9a7554', '#b2552c'],
  [/Skate Park/, '#639ab7', '#2f86c9'],
  [/Cobertura Branca Ondulada/, 'Cobertura Branca Ondulada', '#f6f6f2'],
  [/paisagismo/, 'Parque · flowerBeds', '#5aa83a'],
];

function materiaisDe(obj) {
  if (!obj.material) return [];
  return Array.isArray(obj.material) ? obj.material : [obj.material];
}

function grupoDe(obj, scene) {
  let p = obj, ultimo = null;
  while (p && p !== scene) { if (p.name) ultimo = p.name; p = p.parent; }
  return ultimo || '';
}

function tamanho(geo) {
  if (!geo.boundingBox) geo.computeBoundingBox();
  const b = geo.boundingBox;
  return { x: b.max.x - b.min.x, y: b.max.y - b.min.y, z: b.max.z - b.min.z };
}

function limparMapas(m) {
  m.map = null; m.normalMap = null; m.roughnessMap = null; m.aoMap = null; m.metalnessMap = null;
  m.needsUpdate = true;
}

// Borda externa de uma malha plana: arestas usadas por 1 só triângulo, encadeadas em um laço.
function contornoDaIlha(geo) {
  const pos = geo.attributes.position;
  const idx = geo.index ? geo.index.array : null;
  const n = idx ? idx.length : pos.count;
  const chave = i => `${pos.getX(i).toFixed(2)}|${pos.getZ(i).toFixed(2)}`;
  const ids = new Map(); const pontos = []; const vert = new Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const k = chave(i);
    if (!ids.has(k)) { ids.set(k, pontos.length); pontos.push([pos.getX(i), pos.getZ(i)]); }
    vert[i] = ids.get(k);
  }
  const arestas = new Map();
  const add = (a, b) => { const k = a < b ? `${a}_${b}` : `${b}_${a}`; arestas.set(k, (arestas.get(k) || 0) + 1); };
  for (let i = 0; i < n; i += 3) {
    const a = vert[idx ? idx[i] : i], b = vert[idx ? idx[i + 1] : i + 1], c = vert[idx ? idx[i + 2] : i + 2];
    add(a, b); add(b, c); add(c, a);
  }
  const viz = new Map();
  for (const [k, c] of arestas) {
    if (c !== 1) continue;
    const [a, b] = k.split('_').map(Number);
    (viz.get(a) || viz.set(a, []).get(a)).push(b);
    (viz.get(b) || viz.set(b, []).get(b)).push(a);
  }
  const visitado = new Set(); let melhor = [];
  for (const inicio of viz.keys()) {
    if (visitado.has(inicio)) continue;
    const laco = []; let atual = inicio, anterior = -1;
    while (atual !== undefined && !visitado.has(atual)) {
      visitado.add(atual); laco.push(atual);
      const prox = (viz.get(atual) || []).find(v => v !== anterior && !visitado.has(v));
      anterior = atual; atual = prox;
    }
    if (laco.length > melhor.length) melhor = laco;
  }
  return melhor.length >= 8 ? melhor.map(i => pontos[i]) : null;
}

export function aplicarEstiloMinimundo(scene, renderer, THREE) {
  if (scene.userData.estiloMinimundo) return scene.userData.estiloMinimundo;
  const resultado = { materiais: 0, copas: 0, triangulos: 0, base: 'nenhuma' };

  let ilha = null, chao = null, copas = null, troncos = null, assentos = null, torre = null;
  const asfaltos = [], aguas = [], ceus = [], todosMateriais = new Set();

  scene.traverse(o => {
    if (!(o.isMesh || o.isInstancedMesh)) return;
    const ms = materiaisDe(o); if (!ms.length) return;
    const m = ms[0]; const t = tamanho(o.geometry);
    const grupo = grupoDe(o, scene);
    ms.forEach(x => { todosMateriais.add(x); if (x.color && !x.userData.corOriginal) x.userData.corOriginal = x.color.getHexString(); });
    if (!o.name && t.x > 6000) chao = o;
    else if (!o.name && t.x > 1200 && t.x < 1300 && m.vertexColors) ilha = o;
    if (o.name === 'Cenário · copas') copas = o;
    if (o.name === 'Cenário · troncos') troncos = o;
    if (o.name === 'Arquibancada R03 · assentos instanciados') assentos = o;
    if (!grupo && o.isMesh && t.y > 35 && t.x < 6) torre = o;
    const src = (m.map && m.map.image && m.map.image.src) || '';
    if (src.includes('clean_asphalt')) asfaltos.push(o);
    if (m.isMeshPhysicalMaterial && m.color && m.color.getHexString() === '345868') aguas.push(o);
    if (m.isShaderMaterial && !/postes/.test(o.name)) ceus.push(o);
  });

  // 1 e 2. Terreno e autódromo em verde chapado
  const grama = [ilha];
  scene.traverse(o => { if (o.name === 'Autódromo · grass') grama.push(o); });
  grama.filter(Boolean).forEach(o => materiaisDe(o).forEach(m => {
    limparMapas(m); m.vertexColors = false; m.color.set(PALETA.grama); m.roughness = 1;
  }));

  // 3. Asfalto chapado
  asfaltos.forEach(o => materiaisDe(o).forEach(m => { limparMapas(m); m.color.set(PALETA.asfalto); m.roughness = 0.95; }));

  // 4. Água
  aguas.forEach(o => materiaisDe(o).forEach(m => { m.color.set(PALETA.agua); m.roughness = 0.3; m.metalness = 0; m.needsUpdate = true; }));

  // 5. Todos os materiais: menos reflexo, mais fosco, cores mais vivas
  const hsl = { h: 0, s: 0, l: 0 };
  for (const m of todosMateriais) {
    if (!m.isMeshStandardMaterial) continue;
    m.envMapIntensity = 0.25;
    if (!m.isMeshPhysicalMaterial && m.roughness < 0.75 && !/glass|vidro/i.test(m.name || '')) m.roughness = 0.8;
    if (m.color && !m.map) {
      m.color.getHSL(hsl);
      if (hsl.s > 0.08) m.color.setHSL(hsl.h, Math.min(1, hsl.s * 1.3), hsl.l);
    }
    m.needsUpdate = true;
    resultado.materiais++;
  }
  scene.environment = null;

  // 6. Copas leves (80 triângulos cada) e troncos
  if (copas) {
    copas.geometry = new THREE.IcosahedronGeometry(1, 1);
    const m = copas.material; m.vertexColors = false; m.flatShading = true; m.color.set(PALETA.copa); limparMapas(m);
    resultado.copas = copas.count;
  }
  if (troncos) troncos.material.color.set(PALETA.tronco);

  // 7. Assentos da arquibancada em caixinha (12 triângulos cada)
  if (assentos) assentos.geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

  // 8. Fundo verde chapado da marca, sem céu
  if (chao) {
    chao.material = new THREE.MeshBasicMaterial({ color: PALETA.fundo, fog: false });
    chao.receiveShadow = false; chao.scale.set(5, 1, 5);
  }
  ceus.forEach(o => {
    o.visible = false;
    Object.defineProperty(o, 'visible', { get: () => false, set: () => {}, configurable: true });
  });

  // 9. Base de maquete: extrusão do contorno da ilha, 30 unidades para baixo, em terra vermelha
  if (ilha) {
    const material = new THREE.MeshStandardMaterial({ color: PALETA.terra, roughness: 1, fog: false });
    const pts = contornoDaIlha(ilha.geometry);
    let base = null;
    if (pts) {
      const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 30, bevelEnabled: false });
      geo.rotateX(Math.PI / 2); // extrusão em z vira y negativo; y da forma vira z do mundo
      base = new THREE.Mesh(geo, material);
      base.applyMatrix4(ilha.matrixWorld);
      base.position.y -= 0.2;
      resultado.base = 'extrusao';
    } else {
      const n = 6; base = new THREE.InstancedMesh(ilha.geometry, material, n);
      const m4 = new THREE.Matrix4();
      for (let i = 0; i < n; i++) { m4.makeTranslation(0, -5 * (i + 1), 0); m4.multiply(ilha.matrixWorld); base.setMatrixAt(i, m4); }
      base.instanceMatrix.needsUpdate = true;
      resultado.base = 'copias';
    }
    base.name = 'Base maquete'; base.receiveShadow = true;
    scene.add(base);
  }

  // 10. Luzes: sol mais forte e quente, preenchimento com céu claro e chão verde.
  // Os períodos (manhã/tarde/pôr do sol/noite) continuam mandando: aqui só multiplicamos a intensidade que eles definem.
  scene.traverse(l => {
    if (l.isDirectionalLight && !l.userData.estiloMinimundo) {
      let v = l.intensity; l.userData.estiloMinimundo = true;
      Object.defineProperty(l, 'intensity', { get: () => v * 1.28, set: x => { v = x; }, configurable: true });
    }
    if (l.isHemisphereLight && !l.userData.estiloMinimundo) {
      let v = l.intensity; l.userData.estiloMinimundo = true;
      Object.defineProperty(l, 'intensity', { get: () => v * 1.4, set: x => { v = x; }, configurable: true });
      l.groundColor.set('#5a8a37');
    }
  });
  renderer.toneMappingExposure = Math.max(renderer.toneMappingExposure, 1.08);

  // 11. Cores por espaço (clonando o material quando ele é compartilhado com outro grupo)
  scene.traverse(o => {
    if (!(o.isMesh || o.isInstancedMesh)) return;
    const grupo = grupoDe(o, scene); const m = materiaisDe(o)[0]; if (!m || !m.color) return;
    for (const [rx, alvo, cor] of RECOLORIR) {
      if (!rx.test(grupo)) continue;
      const original = m.userData.corOriginal || m.color.getHexString();
      const bate = alvo.startsWith('#') ? original === alvo.slice(1) : o.name === alvo;
      if (!bate) continue;
      const nm = m.clone(); nm.userData = { corOriginal: original };
      limparMapas(nm); nm.vertexColors = false; nm.color.set(cor); nm.roughness = 0.85; nm.metalness = 0; nm.envMapIntensity = 0.25;
      o.material = nm; break;
    }
  });
  if (torre) {
    const nm = torre.material.clone(); nm.color.set('#2aa7c9'); nm.emissive.set('#1b6f9a'); nm.emissiveIntensity = 0.25; nm.roughness = 0.6;
    torre.material = nm;
  }

  // 12. Contagem de triângulos visíveis
  scene.traverse(o => {
    if (!(o.isMesh || o.isInstancedMesh) || !o.visible) return;
    const g = o.geometry; const n = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
    resultado.triangulos += n * (o.isInstancedMesh ? o.count : 1);
  });
  resultado.triangulos = Math.round(resultado.triangulos);
  renderer.shadowMap.needsUpdate = true;
  scene.userData.estiloMinimundo = resultado;
  console.log('[estilo-minimundo] materiais:', resultado.materiais, 'copas:', resultado.copas, 'base:', resultado.base, 'triangulos:', resultado.triangulos);
  return resultado;
}
