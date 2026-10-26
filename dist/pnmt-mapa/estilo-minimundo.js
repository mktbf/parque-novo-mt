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
  // Casa Cuiabana conforme drone de out/2026: paredes amarelo claro, faixa ouro, molduras brancas, madeira, laje clara
  [/Casa Cuiabana/, 'Lazer · cream', '#f2e3a0'],
  [/Casa Cuiabana/, 'Lazer · ochre', '#d9a92a'],
  [/Casa Cuiabana/, 'Lazer · paint-white', '#f6f4ee'],
  [/Casa Cuiabana/, 'Lazer · wood', '#b5763c'],
  [/Casa Cuiabana/, 'Lazer · glass', '#c99a5e'],
  [/Casa Cuiabana/, 'Lazer · clay-tile', '#cfcbc1'],
  [/Casa Cuiabana/, 'Lazer · stone', '#bdb4a3'],
  [/Casa Cuiabana/, 'Lazer · stone-dark', '#8a7f6e'],
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
  // Pórtico conforme drone: cascas brancas com nervuras cinza claro
  [/Pórtico/, '#d9dfdd', '#f4f4f0'],
  [/Pórtico/, '#69777c', '#b8bdc1'],
  [/Motocross/, '#9a7554', '#b2552c'],
  [/Skate Park/, '#639ab7', '#2f86c9'],
  [/Cobertura Branca Ondulada/, 'Cobertura Branca Ondulada', '#dcdedb'],
  // Parque da Família conforme drone: piso laranja, azul, verde e cinza; toldos azul claro, verde água e laranja
  ...[['#1565c0','#3b74b6'],['#0d47a1','#2f62a3'],['#1976d2','#4a86c4'],['#f57c00','#de7a3e'],['#ef6c00','#de7a3e'],['#fb8c00','#e99760'],['#2e7d32','#2f9058'],['#43a047','#3ea56a'],['#388e3c','#2f9058'],['#81c784','#93c9b3'],['#0288d1','#86b6d9'],['#29b6f6','#86b6d9'],['#263238','#2b2e33'],['#37474f','#8f949a'],['#d7d4cc','#9da1a6']].map(([a, b]) => [/Parque da Família/, a, b]),
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

// Espaços sem grupo nomeado: identificados pela posição no mapa (centro x,z e raio) + cor original.
const POR_POSICAO = [
  // Arena Show: fachada cinza
  { x: -141, z: -128, r: 80, cor: '#639fc0', nova: '#6a6f74' },
  // Árvore da Vida: fuste em concreto claro
  { x: -337, z: 28, r: 12, cor: '#163d44', nova: '#e6e4de' },
  // Splash Parque (render do projeto): guarda-sóis amarelos com miolo laranja, piscina azul clara
  { x: -382.5, z: 64.9, r: 45, cor: '#d79152', nova: '#f2bf2e' },
  { x: -382.5, z: 64.9, r: 45, cor: '#c06940', nova: '#e0662f' },
  { x: -382.5, z: 64.9, r: 45, cor: '#e4bb54', nova: '#f2bf2e' },
  { x: -382.5, z: 64.9, r: 45, cor: '#dfb65e', nova: '#f6c93c' },
  { x: -382.5, z: 64.9, r: 45, cor: '#80b8b7', nova: '#a7dcea' },
  { x: -382.5, z: 64.9, r: 45, cor: '#478f9d', nova: '#62bcd8' },
  { x: -382.5, z: 64.9, r: 45, cor: '#b8af8d', nova: '#d8dde2' },
  // Arenas Beach (render): cobertura cinza grafite, arquibancada branca, areia clara
  { x: -419, z: -264, r: 45, cor: '#182026', nova: '#5a6066' },
  { x: -419, z: -264, r: 45, cor: '#acbdc3', nova: '#f2f2ef' },
  { x: -419, z: -264, r: 45, cor: '#e2cc9b', nova: '#e9d29c' },
  // AgroPlace: miolo escuro atrás das lâminas
  { x: -222, z: 131, r: 25, cor: '#52777a', nova: '#5b5f63' },
  { x: -222, z: 131, r: 25, cor: '#71928e', nova: '#5b5f63' },
];

function texturaTriangulos(THREE) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
  const g = cv.getContext('2d'); const cores = ['#1c1e21', '#3a3d42', '#5e6268', '#8d9197', '#c3c6ca', '#eeeeec'];
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const w = 32, h = 32;
  for (let y = 0; y < 128; y += h) {
    for (let x = -w; x < 512 + w; x += w / 2) {
      const up = ((x / (w / 2)) + (y / h)) % 2 === 0;
      g.fillStyle = cores[Math.floor(rnd() * cores.length)]; g.beginPath();
      if (up) { g.moveTo(x, y + h); g.lineTo(x + w / 2, y); g.lineTo(x + w, y + h); }
      else { g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w / 2, y + h); }
      g.closePath(); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

// Escamas da cobertura da Pérola do Cerrado (render do projeto): brancas com miolo vermelho, amarelo, azul e laranja.
function texturaPetalas(THREE) {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'); g.fillStyle = '#d9d4c8'; g.fillRect(0, 0, S, S);
  const acc = ['#c8372b', '#e3a92a', '#2f62a8', '#d9772b', '#c8372b', '#e3a92a'];
  let seed = 5; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const n = 4, cw = S / n, ch = S / n;
  for (let r = -1; r <= n; r++) {
    for (let c = -1; c <= n; c++) {
      const x = c * cw + (r % 2 ? cw / 2 : 0), y = r * ch;
      g.save(); g.translate(x + cw / 2, y + ch * 0.15);
      g.beginPath(); g.moveTo(-cw * 0.55, 0); g.quadraticCurveTo(-cw * 0.55, ch * 1.05, 0, ch * 1.15); g.quadraticCurveTo(cw * 0.55, ch * 1.05, cw * 0.55, 0); g.closePath();
      g.fillStyle = '#f6f4ee'; g.fill(); g.strokeStyle = '#b9b3a6'; g.lineWidth = 3; g.stroke();
      g.beginPath(); g.moveTo(-cw * 0.38, ch * 0.35); g.quadraticCurveTo(-cw * 0.3, ch * 0.95, 0, ch * 1.05); g.quadraticCurveTo(cw * 0.3, ch * 0.95, cw * 0.38, ch * 0.35); g.quadraticCurveTo(0, ch * 0.62, -cw * 0.38, ch * 0.35);
      g.fillStyle = acc[Math.floor(rnd() * acc.length)]; g.fill(); g.restore();
    }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.38, 0.38); t.anisotropy = 4;
  return t;
}

// Piso da orla da Vila das Nações (drone): faixas largas claras com faixas cinza.
function texturaFaixas(THREE) {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128;
  const g = cv.getContext('2d'); g.fillStyle = '#dcd9d2'; g.fillRect(0, 0, 64, 128);
  g.fillStyle = '#a3a3a1'; g.fillRect(0, 88, 64, 28); g.fillStyle = '#c9c6bf'; g.fillRect(0, 0, 64, 6);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1.1);
  return t;
}

// Pórtico (drone out/2026 + render): duas cascas de nervuras brancas que nascem juntas no canteiro central
// e abrem em leque até a borda de cada pista; canteiro em forma de oito com meio-fio branco e flores.
function construirPortico(scene, THREE) {
  const antigos = []; scene.traverse(o => { if (o.isMesh && /Pórtico/.test(grupoDe(o, scene))) antigos.push(o); });
  if (!antigos.length) return 0;
  antigos.forEach(o => { o.visible = false; });
  const g = new THREE.Group(); g.name = 'Pórtico · cascas em nervuras';
  const C = new THREE.Vector2(303, 398);
  const m = new THREE.Vector2(0.919, 0.393).normalize();
  const branco = new THREE.MeshStandardMaterial({ color: '#f2f2ee', roughness: 0.7 });
  const arcos = [new THREE.Vector2(321, 387), new THREE.Vector2(301.5, 417)];
  const N = 9;
  for (const O of arcos) {
    const H = O.distanceTo(C) * 0.62; const ribs = [];
    for (let k = 0; k < N; k++) {
      const f = k - (N - 1) / 2;
      const c0 = C.clone().addScaledVector(m, f * 0.55), o0 = O.clone().addScaledVector(m, f * 2.7);
      const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; const p = c0.clone().lerp(o0, t); pts.push(new THREE.Vector3(p.x, H * Math.sin(Math.PI * t) + 0.1, p.y)); }
      ribs.push(pts);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.26, 6, false), branco));
    }
    for (const t of [0.12, 0.25, 0.38, 0.5, 0.62, 0.75, 0.88]) {
      const i = Math.round(t * 24);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ribs.map(r => r[i])), 24, 0.16, 5, false), branco));
    }
  }
  const perp = new THREE.Vector2(-m.y, m.x);
  const elipse = (cx, cz, a, b, y, r) => {
    const pts = []; for (let i = 0; i < 64; i++) { const ang = i / 64 * Math.PI * 2; const p = new THREE.Vector2(cx, cz).addScaledVector(m, Math.cos(ang) * a).addScaledVector(perp, Math.sin(ang) * b); pts.push(new THREE.Vector3(p.x, y, p.y)); }
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, r, 5, true), branco);
  };
  const disco = (cx, cz, a, b, y, cor) => {
    const geo = new THREE.CircleGeometry(1, 40); geo.rotateX(-Math.PI / 2);
    const d = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cor, roughness: 1 }));
    d.scale.set(a, 1, b); d.position.set(cx, y, cz); d.rotation.y = -Math.atan2(m.y, m.x); return d;
  };
  for (const sgn of [-1, 1]) {
    const c = C.clone().addScaledVector(m, sgn * 4.8);
    g.add(elipse(c.x, c.y, 5, 1.5, 0.3, 0.24)); g.add(elipse(c.x, c.y, 3.2, 0.85, 0.28, 0.18));
    g.add(disco(c.x, c.y, 4.8, 1.35, 0.2, '#3f8f3a')); g.add(disco(c.x, c.y, 3, 0.7, 0.24, '#c8452f'));
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(g); return 1;
}

// Praça de Alimentação (drone out/2026 + render): volume oval de um pavimento sobre pilotis,
// fachada contínua de triângulos preto, cinza e branco e cobertura branca de borda arredondada.
function construirPraca(scene, THREE) {
  const cx = -290, cz = 3, L = 44, W = 26, R = W / 2, reta = L - W;
  const box = new THREE.Box3(), c = new THREE.Vector3(), sz = new THREE.Vector3(); let n = 0;
  scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || !o.visible) return;
    box.setFromObject(o); box.getCenter(c); box.getSize(sz);
    if (Math.hypot(c.x - cx, c.z - cz) > 26 || sz.x > 80 || (sz.x < 15 && sz.z < 15)) return;
    if (box.max.y > 2.5) { o.visible = false; n++; }
  });
  if (!n) return 0;
  const g = new THREE.Group(); g.name = 'Praça de Alimentação · volume oval';
  const contorno = (inset, k = 120) => {
    const pts = []; const r = R - inset, hx = reta / 2; const per = 2 * reta + 2 * Math.PI * r;
    for (let i = 0; i < k; i++) {
      let d = i / k * per, p;
      if (d < reta) p = [-hx + d, -r];
      else if ((d -= reta) < Math.PI * r) { const a = -Math.PI / 2 + d / r; p = [hx + Math.cos(a) * r, Math.sin(a) * r]; }
      else if ((d -= Math.PI * r) < reta) p = [hx - d, r];
      else { d -= reta; const a = Math.PI / 2 + d / r; p = [-hx + Math.cos(a) * r, Math.sin(a) * r]; }
      pts.push(p);
    }
    return pts;
  };
  const anel = (inset, y0, y1, mat, uvU, uvV) => {
    const pts = contorno(inset); pts.push(pts[0]);
    const pos = [], uv = [], idx = []; let acc = 0;
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const x = cx + pts[i][0], z = cz + pts[i][1];
      pos.push(x, y0, z, x, y1, z); uv.push(acc / uvU, 0, acc / uvU, (y1 - y0) / uvV);
      if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals(); return new THREE.Mesh(geo, mat);
  };
  g.add(anel(0, 2.4, 8.1, new THREE.MeshStandardMaterial({ map: texturaTriangulos(THREE), roughness: 0.75, side: THREE.DoubleSide }), 24, 5.8));
  g.add(anel(1.4, 0.2, 2.4, new THREE.MeshStandardMaterial({ color: '#3b4045', roughness: 0.6, side: THREE.DoubleSide }), 10, 10));
  const colGeo = new THREE.CylinderGeometry(0.35, 0.35, 2.2, 8); const claro = new THREE.MeshStandardMaterial({ color: '#e8e8e4', roughness: 0.8 });
  contorno(0.6, 28).forEach(p => { const col = new THREE.Mesh(colGeo, claro); col.position.set(cx + p[0], 1.3, cz + p[1]); g.add(col); });
  const laje = new THREE.ExtrudeGeometry(new THREE.Shape(contorno(0, 96).map(p => new THREE.Vector2(p[0], p[1]))), { depth: 0.3, bevelEnabled: false });
  laje.rotateX(Math.PI / 2); const mLaje = new THREE.Mesh(laje, claro); mLaje.position.set(cx, 2.45, cz); g.add(mLaje);
  const cob = new THREE.ExtrudeGeometry(new THREE.Shape(contorno(-0.3, 96).map(p => new THREE.Vector2(p[0], p[1]))), { depth: 0.35, bevelEnabled: true, bevelThickness: 0.45, bevelSize: 0.45, bevelSegments: 3, curveSegments: 24 });
  cob.rotateX(Math.PI / 2); const mCob = new THREE.Mesh(cob, new THREE.MeshStandardMaterial({ color: '#f3f3f0', roughness: 0.85 })); mCob.position.set(cx, 8.75, cz); g.add(mCob);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(g); return 1;
}

// Splash Parque (render do projeto): torre treliçada Tcha Bum com dois toboáguas laranja
// e a escultura de ondas amarela e azul na entrada, do lado da Pérola do Cerrado.
function construirSplash(scene, THREE) {
  const C = new THREE.Vector2(-382.5, 64.9), d = new THREE.Vector2(0.438, 0.899), q = new THREE.Vector2(-0.899, 0.438);
  const P = (t, u) => C.clone().addScaledVector(d, t).addScaledVector(q, u);
  const g = new THREE.Group(); g.name = 'Splash Parque · torre Tcha Bum, toboáguas e onda';
  const base = P(27, 7), H = 36, L = 4.4, ang = Math.atan2(d.x, d.y);
  const aco = new THREE.MeshStandardMaterial({ color: '#a9afb5', roughness: 0.55, metalness: 0.25 });
  const mats = []; const tmp = new THREE.Object3D();
  const barra = (a, b, esp) => { tmp.position.copy(a).add(b).multiplyScalar(0.5); tmp.lookAt(b); tmp.scale.set(esp, esp, a.distanceTo(b)); tmp.updateMatrix(); mats.push(tmp.matrix.clone()); };
  const canto = (i, y) => {
    const lx = ((i === 0 || i === 3) ? -1 : 1) * L / 2, lz = (i < 2 ? -1 : 1) * L / 2;
    return new THREE.Vector3(base.x + lx * Math.cos(ang) + lz * Math.sin(ang), y, base.y - lx * Math.sin(ang) + lz * Math.cos(ang));
  };
  for (let i = 0; i < 4; i++) barra(canto(i, 1), canto(i, H), 0.35);
  for (let y = 1; y <= H; y += 3) {
    for (let i = 0; i < 4; i++) {
      barra(canto(i, y), canto((i + 1) % 4, y), 0.2);
      if (y + 3 <= H) { barra(canto(i, y), canto((i + 1) % 4, y + 3), 0.12); barra(canto((i + 1) % 4, y), canto(i, y + 3), 0.12); }
    }
  }
  const trelica = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), aco, mats.length);
  mats.forEach((m, i) => trelica.setMatrixAt(i, m)); trelica.instanceMatrix.needsUpdate = true; g.add(trelica);
  const laje = (y, cor) => { const m = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.45, 6.5), new THREE.MeshStandardMaterial({ color: cor, roughness: 0.7 })); m.position.set(base.x, y, base.y); m.rotation.y = ang; g.add(m); };
  laje(H + 0.2, '#d9dde0'); laje(H + 3.2, '#f1f1ee');
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512; const cx = cv.getContext('2d');
  cx.fillStyle = '#1f5fa8'; cx.fillRect(0, 0, 256, 512); cx.fillStyle = '#58b6e6'; cx.beginPath(); cx.arc(128, 110, 80, 0, Math.PI * 2); cx.fill();
  cx.fillStyle = '#f39a1e'; cx.font = 'bold 92px Arial Black, Arial, sans-serif'; cx.textAlign = 'center'; cx.fillText('TCHA', 128, 300); cx.fillText('BUM', 128, 410);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 7.2), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.6, side: THREE.DoubleSide }));
  const frente = P(27 - L / 2 - 0.4, 7); placa.position.set(frente.x, H - 6, frente.y); placa.rotation.y = Math.atan2(-d.x, -d.y); g.add(placa);
  const laranja = new THREE.MeshStandardMaterial({ color: '#f07a1a', roughness: 0.45 });
  const pilar = new THREE.CylinderGeometry(0.18, 0.18, 1, 6);
  const tobo = pts => {
    const curva = new THREE.CatmullRomCurve3(pts.map(([t, u, y]) => { const p = P(t, u); return new THREE.Vector3(p.x, y, p.y); }));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 90, 0.75, 10, false), laranja));
    for (let i = 1; i < 10; i++) { const p = curva.getPoint(i / 10); if (p.y < 3) continue; const c = new THREE.Mesh(pilar, aco); c.scale.y = p.y - 1; c.position.set(p.x, (p.y + 1) / 2, p.z); g.add(c); }
  };
  tobo([[25, 7, H - 0.5], [20, 10, H - 6], [12, 12, 26], [4, 11, 17], [-4, 8, 9], [-10, 5, 3.5], [-14, 3, 1.4]]);
  tobo([[25, 5, H - 4], [20, 2, 28], [13, 0, 21], [7, -1, 13], [1, 0, 6], [-4, 1, 2.2], [-7, 1, 1.4]]);
  const onda = (cor, fase, dt, r) => {
    const pts = []; for (let i = 0; i <= 80; i++) { const k = i / 80; const p = P(-36 + k * 26, -19 + dt); pts.push(new THREE.Vector3(p.x, 1.4 + 2.6 * (1 + Math.sin(k * Math.PI * 4 + fase)), p.y)); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, r, 10, false), new THREE.MeshStandardMaterial({ color: cor, roughness: 0.5 })));
  };
  onda('#f2b632', 0, 0, 0.7); onda('#2f86c9', 0.5, 0.9, 0.55); onda('#56c0d8', 1.0, -0.9, 0.4);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(g); return 1;
}

// Arenas Beach (render + drone): marcação branca das quatro quadras de areia na beira do lago.
function construirArenas(scene, THREE) {
  const C = new THREE.Vector2(-419, -264), d = new THREE.Vector2(0.426, -0.905), q = new THREE.Vector2(0.905, 0.426), y0 = 1.72;
  const g = new THREE.Group(); g.name = 'Arenas Beach · marcação das quadras';
  const branco = new THREE.MeshStandardMaterial({ color: '#f7f7f4', roughness: 0.8 }); const ang = Math.atan2(d.x, d.y);
  const faixa = (t, u, lt, lu) => { const p = C.clone().addScaledVector(d, t).addScaledVector(q, u); const m = new THREE.Mesh(new THREE.BoxGeometry(lu, 0.04, lt), branco); m.position.set(p.x, y0, p.y); m.rotation.y = ang; g.add(m); };
  for (const tc of [-22.5, -7.5, 7.5, 22.5]) {
    const LT = 8.5, LU = 13, e = 0.18;
    faixa(tc - LT / 2, 0, e, LU); faixa(tc + LT / 2, 0, e, LU); faixa(tc, -LU / 2, LT, e); faixa(tc, LU / 2, LT, e);
  }
  scene.add(g); return 1;
}

// AgroPlace (render do projeto): cilindro revestido de lâminas verticais claras, com a fachada da entrada em verde.
function construirAgro(scene, THREE) {
  const cx = -222, cz = 131, R = 18.4, y0 = 1, y1 = 16.6, N = 110;
  const box = new THREE.Box3(), c = new THREE.Vector3();
  scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || !o.material || Array.isArray(o.material) || !o.material.map) return;
    box.setFromObject(o); box.getCenter(c);
    if (Math.hypot(c.x - cx, c.z - cz) < 25 && box.max.y > 15 && box.min.y > 6) { const nm = o.material.clone(); nm.map = null; nm.color.set('#f2f2ef'); nm.needsUpdate = true; o.material = nm; }
  });
  const g = new THREE.Group(); g.name = 'AgroPlace · lâminas verticais';
  const geo = new THREE.BoxGeometry(0.4, y1 - y0, 1.1); const tmp = new THREE.Object3D();
  const bege = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#d6cdbb', roughness: 0.75 }), N);
  const verde = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#3fbf5a', roughness: 0.5, emissive: '#1f8a33', emissiveIntensity: 0.35 }), N);
  let nb = 0, nv = 0;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2;
    tmp.position.set(cx + Math.sin(a) * R, (y0 + y1) / 2, cz + Math.cos(a) * R); tmp.rotation.y = a; tmp.updateMatrix();
    if (Math.abs(((a + Math.PI) % (2 * Math.PI)) - Math.PI) < 0.9) verde.setMatrixAt(nv++, tmp.matrix); else bege.setMatrixAt(nb++, tmp.matrix);
  }
  bege.count = nb; verde.count = nv; bege.instanceMatrix.needsUpdate = true; verde.instanceMatrix.needsUpdate = true;
  bege.castShadow = verde.castShadow = true; g.add(bege); g.add(verde);
  scene.add(g); return 1;
}

// Vida no mapa: carros na avenida do Pórtico, wakeboard no Wake Park e nuvens passando.
// Atualiza a cada quadro que o mapa já desenha (o mapa redesenha continuamente por causa da água).
// Na vista geral, mostra o nome só dos espaços principais; os outros ficam como ponto (o nome volta ao aproximar).
function adicionarVida(scene, THREE) {
  const g = new THREE.Group(); g.name = 'Vida no mapa · carros, wakeboard e nuvens';
  const agora = () => performance.now() / 1000;
  const C = new THREE.Vector2(303, 398), m = new THREE.Vector2(0.919, 0.393), p = new THREE.Vector2(-0.393, 0.919);
  const cores = ['#e8e8e6', '#2a2d31', '#b8bcc0', '#c0392b', '#1f4e8c', '#e8e8e6', '#7a7f85', '#d9a32b'];
  const carros = []; [[6, -1], [11, -1], [-6, 1], [-11, 1]].forEach((f, fi) => { for (let k = 0; k < 4; k++) carros.push({ u: f[0], dir: f[1], fase: k / 4 + fi * 0.13, vel: 8 + ((k * 7 + fi * 3) % 5) }); });
  const corpo = new THREE.BoxGeometry(1.9, 1.1, 4.3); corpo.translate(0, 0.55, 0);
  const cabine = new THREE.BoxGeometry(1.7, 0.75, 2.2); cabine.translate(0, 1.45, -0.2);
  const iC = new THREE.InstancedMesh(corpo, new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1 }), carros.length);
  const iV = new THREE.InstancedMesh(cabine, new THREE.MeshStandardMaterial({ color: '#20262c', roughness: 0.3 }), carros.length);
  carros.forEach((c, i) => iC.setColorAt(i, new THREE.Color(cores[i % cores.length])));
  iC.castShadow = true; iC.frustumCulled = false; iV.frustumCulled = false; g.add(iC); g.add(iV);
  const t0 = -50, t1 = 60, L = t1 - t0, tmp = new THREE.Object3D(), ang = Math.atan2(m.x, m.y);
  const atualizaCarros = t => {
    carros.forEach((c, i) => {
      const pos = ((c.fase * L + t * c.vel) % L + L) % L; const tt = c.dir > 0 ? t0 + pos : t1 - pos;
      const q = C.clone().addScaledVector(m, tt).addScaledVector(p, c.u);
      tmp.position.set(q.x, 0.08, q.y); tmp.rotation.set(0, ang + (c.dir > 0 ? 0 : Math.PI), 0); tmp.updateMatrix();
      iC.setMatrixAt(i, tmp.matrix); iV.setMatrixAt(i, tmp.matrix);
    });
    iC.instanceMatrix.needsUpdate = true; iV.instanceMatrix.needsUpdate = true;
  };
  const wake = new THREE.Group(); wake.scale.setScalar(1.5);
  const prancha = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 1.5), new THREE.MeshStandardMaterial({ color: '#f07a1a' })); prancha.position.y = 0.75; wake.add(prancha);
  const atleta = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.9, 3, 6), new THREE.MeshStandardMaterial({ color: '#1f2a36' })); atleta.position.y = 1.5; atleta.rotation.x = 0.25; wake.add(atleta);
  const espuma = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 4), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 }));
  espuma.rotation.x = -Math.PI / 2; espuma.position.set(0, 0.72, -2.6); wake.add(espuma); g.add(wake);
  const atualizaWake = t => { const a = t * 0.16; wake.position.set(-457 + 15 * Math.cos(a), 0, 95 + 38 * Math.sin(a)); wake.rotation.y = Math.atan2(-15 * Math.sin(a), 38 * Math.cos(a)); };
  const nuvGeo = new THREE.IcosahedronGeometry(1, 1);
  const nuvMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true, transparent: true, opacity: 0.92 });
  const nuvens = []; let seed = 3; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 7; i++) {
    const n = new THREE.Group(); const k = 4 + Math.floor(rnd() * 3);
    for (let j = 0; j < k; j++) { const b = new THREE.Mesh(nuvGeo, nuvMat); const r = 6 + rnd() * 6; b.scale.set(r * 1.3, r * 0.7, r); b.position.set((j - k / 2) * 8 + rnd() * 4, rnd() * 3, rnd() * 8 - 4); n.add(b); }
    n.position.set(-600 + rnd() * 1200, 95 + rnd() * 30, -500 + rnd() * 1000); n.userData.vel = 3 + rnd() * 3; nuvens.push(n); g.add(n);
  }
  const principais = new Set(['autodromo', 'arena-show', 'roda-gigante', 'centro-de-eventos', 'wake-park', 'portico-de-entrada', 'parque-da-familia', 'splash-parque', 'vila-das-nacoes', 'casa-cuiabana', 'perola-do-cerrado']);
  if (!document.getElementById('estilo-nomes')) {
    const st = document.createElement('style'); st.id = 'estilo-nomes';
    st.textContent = '#markers.visao-geral .marker.secundario:not(.selected) .pin-name{display:none}#markers.visao-geral .marker.secundario:not(.selected) .pin-stem{opacity:.5}';
    document.head.appendChild(st);
  }
  const marcar = () => document.querySelectorAll('#markers .marker').forEach(el => { if (!principais.has(el.dataset.id || '') && !el.classList.contains('parking-marker')) el.classList.add('secundario'); });
  marcar(); atualizaCarros(agora());
  let ultimo = agora(), visao = null;
  iC.onBeforeRender = (renderer, sc, cam) => {
    const t = agora(), dt = Math.min(t - ultimo, 0.1); ultimo = t;
    atualizaCarros(t); atualizaWake(t);
    nuvens.forEach(n => { n.position.x += n.userData.vel * dt; if (n.position.x > 650) n.position.x = -650; });
    const geral = cam.isOrthographicCamera ? (cam.top - cam.bottom) / cam.zoom > 700 : cam.position.y > 420;
    if (geral !== visao) { visao = geral; const mk = document.getElementById('markers'); if (mk) { marcar(); mk.classList.toggle('visao-geral', geral); } }
  };
  scene.add(g); return 1;
}

// Carros parados nos estacionamentos: lê as faixas brancas das vagas (4 vértices por faixa)
// e estaciona um carrinho entre duas faixas vizinhas, em cerca de 4 de cada 10 vagas.
function estacionarCarros(scene, THREE) {
  let vagas = null; scene.traverse(o => { if (!vagas && o.isMesh && /parkingBays/.test(o.name)) vagas = o; });
  if (!vagas) return 0;
  vagas.updateMatrixWorld(true);
  const pos = vagas.geometry.attributes.position, v = new THREE.Vector3(), faixas = [];
  for (let i = 0; i + 3 < pos.count; i += 4) {
    const q = [0, 1, 2, 3].map(k => v.fromBufferAttribute(pos, i + k).applyMatrix4(vagas.matrixWorld).clone());
    const c = q.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(0.25);
    let d = q[1].clone().sub(q[0]); if (q[2].distanceTo(q[1]) > d.length()) d = q[2].clone().sub(q[1]);
    faixas.push({ c, d: d.clone().normalize(), len: d.length() });
  }
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const cores = ['#e8e8e6', '#2a2d31', '#b8bcc0', '#c0392b', '#1f4e8c', '#e8e8e6', '#7a7f85', '#d9a32b', '#f2f2ef'];
  const lugares = [];
  for (let i = 0; i + 1 < faixas.length; i++) {
    const a = faixas[i], b = faixas[i + 1], dist = a.c.distanceTo(b.c);
    if (dist < 0.6 || dist > 2.2 || a.len < 3 || rnd() > 0.42) continue;
    lugares.push({ c: a.c.clone().add(b.c).multiplyScalar(0.5), ang: Math.atan2(a.d.x, a.d.z) + (rnd() < 0.5 ? Math.PI : 0), cor: cores[Math.floor(rnd() * cores.length)] });
    i++; // pula a próxima faixa para dois carros não ocuparem a mesma vaga
  }
  if (!lugares.length) return 0;
  const corpo = new THREE.BoxGeometry(1.05, 0.6, 2.3); corpo.translate(0, 0.3, 0);
  const cabine = new THREE.BoxGeometry(0.95, 0.42, 1.2); cabine.translate(0, 0.8, -0.1);
  const iC = new THREE.InstancedMesh(corpo, new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1 }), lugares.length);
  const iV = new THREE.InstancedMesh(cabine, new THREE.MeshStandardMaterial({ color: '#20262c', roughness: 0.3 }), lugares.length);
  const tmp = new THREE.Object3D();
  lugares.forEach((l, i) => { tmp.position.set(l.c.x, l.c.y + 0.1, l.c.z); tmp.rotation.set(0, l.ang, 0); tmp.updateMatrix(); iC.setMatrixAt(i, tmp.matrix); iV.setMatrixAt(i, tmp.matrix); iC.setColorAt(i, new THREE.Color(l.cor)); });
  iC.name = 'Carros parados · estacionamentos'; iV.name = 'Carros parados · cabines';
  scene.add(iC); scene.add(iV); return lugares.length;
}

// Cor do fundo acompanha o horário escolhido (manhã, tarde, pôr do sol, noite).
const FUNDO_POR_PERIODO = { manha: '#2f8556', tarde: '#1d5f3d', 'por-do-sol': '#6e4a2c', noite: '#0e2130' };
function fundoPorPeriodo(chao) {
  let ultimo = '';
  chao.onBeforeRender = () => {
    const p = new URLSearchParams(location.search).get('periodo') || 'tarde';
    if (p !== ultimo) { ultimo = p; chao.material.color.set(FUNDO_POR_PERIODO[p] || FUNDO_POR_PERIODO.tarde); }
  };
}

// Roda-gigante girando: tira a roda original (aro, cabines, raios e cubo, que vieram fundidos com o pavilhão)
// e monta uma roda nova no mesmo lugar. A roda gira devagar e as 42 cabines ficam sempre em pé.
function construirRoda(scene, THREE) {
  const n = new THREE.Vector3(0.674, 0, 0.738).normalize(), e2 = new THREE.Vector3(0.738, 0, -0.674).normalize(), up = new THREE.Vector3(0, 1, 0);
  const AX = 48.75, HZ = -196, HY = 29.6; // eixo, posição ao longo do plano e altura do cubo
  const H = new THREE.Vector3().addScaledVector(n, AX).addScaledVector(e2, HZ); H.y = HY;
  const alvo = [];
  scene.traverse(o => { if (o.isMesh && /Roda-gigante/.test(o.parent?.name || '') && /steel|paint-white|glass|dark/.test(o.name)) alvo.push(o); });
  if (!alvo.length) return 0;
  const v = new THREE.Vector3(); let tirados = 0;
  for (const o of alvo) {
    const g = o.geometry, p = g.attributes.position; o.updateMatrixWorld(true);
    const idx = g.index ? g.index.array : null, nTri = (idx ? idx.length : p.count) / 3, fica = [];
    const aco = /steel/.test(o.name);
    for (let t = 0; t < nTri; t++) {
      let cx = 0, cy = 0, cz = 0;
      for (let k = 0; k < 3; k++) { const i = idx ? idx[t * 3 + k] : t * 3 + k; v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); cx += v.x; cy += v.y; cz += v.z; }
      cx /= 3; cy /= 3; cz /= 3;
      const ax = cx * n.x + cz * n.z, hz = cx * e2.x + cz * e2.z - HZ, r = Math.hypot(hz, cy - HY);
      const dev = Math.abs(ax - AX);
      // aro e cabines (anel externo), cubo (centro) e raios vermelhos; as pernas do cavalete ficam
      const sai = (dev < 3.3 && r > 21.3 && r < 27.5) || (r < 2.6 && dev < 7) || (aco && r < 23.5 && dev < 4.8 * (1 - r / 23) + 0.8);
      if (sai) { tirados++; continue; }
      for (let k = 0; k < 3; k++) fica.push(idx ? idx[t * 3 + k] : t * 3 + k);
    }
    const ng = g.clone(); ng.setIndex(fica); ng.clearGroups(); o.geometry = ng;
  }
  // roda nova, montada no plano XY e virada para o eixo real
  const base = new THREE.Group(); base.name = 'Roda-gigante · roda que gira';
  base.position.copy(H); base.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(e2, up, n));
  const roda = new THREE.Group(); base.add(roda);
  const branco = new THREE.MeshStandardMaterial({ color: '#f4f2f0', roughness: 0.5, metalness: 0.15 });
  const vermelho = new THREE.MeshStandardMaterial({ color: '#d83a2b', roughness: 0.5, metalness: 0.2 });
  const R = 23.2;
  [-0.9, 0.9].forEach(z => { const aro = new THREE.Mesh(new THREE.TorusGeometry(R, 0.32, 6, 112), branco); aro.position.z = z; aro.castShadow = true; roda.add(aro); });
  const aroInt = new THREE.Mesh(new THREE.TorusGeometry(R - 1.6, 0.18, 5, 96), branco); roda.add(aroInt);
  const cubo = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 7.5, 16), vermelho); cubo.rotation.x = Math.PI / 2; roda.add(cubo);
  const tampa = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.6, 20), vermelho); tampa.rotation.x = Math.PI / 2; roda.add(tampa);
  const N = 42, cil = new THREE.CylinderGeometry(0.09, 0.09, 1, 4); cil.translate(0, 0.5, 0);
  const raios = new THREE.InstancedMesh(cil, vermelho, N * 2 + N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), a = new THREE.Vector3(), b = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  let k = 0;
  const liga = (p0, p1) => { const d = b.copy(p1).sub(p0); const len = d.length(); q.setFromUnitVectors(Y, d.normalize()); m4.compose(p0, q, new THREE.Vector3(1, len, 1)); raios.setMatrixAt(k++, m4); };
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
    liga(new THREE.Vector3(0, 0, 3.6), new THREE.Vector3(R * c, R * s, 0.9));
    liga(new THREE.Vector3(0, 0, -3.6), new THREE.Vector3(R * c, R * s, -0.9));
    liga(new THREE.Vector3(R * c, R * s, -0.9), new THREE.Vector3(R * c, R * s, 0.9));
  }
  roda.add(raios);
  // cabines: corpo branco e faixa de vidro, sempre em pé
  const corpo = new THREE.IcosahedronGeometry(1.2, 1); corpo.scale(1, 1.15, 1);
  const vidro = new THREE.CylinderGeometry(1.24, 1.24, 0.62, 12);
  const iCorpo = new THREE.InstancedMesh(corpo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, flatShading: true }), N);
  const iVidro = new THREE.InstancedMesh(vidro, new THREE.MeshStandardMaterial({ color: '#4f9096', roughness: 0.15, metalness: 0.3 }), N);
  iCorpo.castShadow = true; iCorpo.frustumCulled = false; iVidro.frustumCulled = false; raios.frustumCulled = false;
  base.add(iCorpo); base.add(iVidro);
  const tmp = new THREE.Object3D(), RC = R + 1.5;
  const atualiza = ang => {
    roda.rotation.z = ang;
    for (let i = 0; i < N; i++) {
      const th = ang + (i / N) * Math.PI * 2;
      tmp.position.set(RC * Math.cos(th), RC * Math.sin(th), 0); tmp.rotation.set(0, 0, 0); tmp.updateMatrix();
      iCorpo.setMatrixAt(i, tmp.matrix); iVidro.setMatrixAt(i, tmp.matrix);
    }
    iCorpo.instanceMatrix.needsUpdate = true; iVidro.instanceMatrix.needsUpdate = true;
  };
  atualiza(0);
  const t0 = performance.now();
  cubo.onBeforeRender = () => atualiza(-((performance.now() - t0) / 1000) * (Math.PI * 2 / 90)); // uma volta a cada 1 min e meio
  scene.add(base);
  return tirados;
}

// Skate Park: o fundo dos bowls aparecia como grama. Coloca piso de concreto dentro de cada bowl,
// usando a borda de baixo das paredes de cada bowl como molde.
function pisoDosBowls(scene, THREE) {
  let w = null; scene.traverse(o => { if (!w && o.isMesh && /Skate Park/.test(o.parent?.name || '') && o.material?.color?.getHexString() === 'c2c2b8') w = o; });
  if (!w) return 0;
  w.updateMatrixWorld(true);
  const p = w.geometry.attributes.position, v = new THREE.Vector3(), cel = new Map();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).applyMatrix4(w.matrixWorld); if (v.y > -0.8) continue;
    const k = Math.round(v.x / 2) + ',' + Math.round(v.z / 2); if (!cel.has(k)) cel.set(k, []); cel.get(k).push([v.x, v.z]);
  }
  const visto = new Set(), bowls = [];
  for (const c of cel.keys()) {
    if (visto.has(c)) continue; visto.add(c); const pilha = [c], pts = [];
    while (pilha.length) { const k = pilha.pop(); pts.push(...cel.get(k)); const [a, b] = k.split(',').map(Number);
      for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) { const kk = (a + da) + ',' + (b + db); if (cel.has(kk) && !visto.has(kk)) { visto.add(kk); pilha.push(kk); } } }
    if (pts.length > 8) bowls.push(pts);
  }
  const casca = P => { P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], hi = [];
    for (const q of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of P.reverse()) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
    hi.pop(); lo.pop(); return lo.concat(hi); };
  const mat = new THREE.MeshStandardMaterial({ color: '#cdc6b6', roughness: 0.95 }), g = new THREE.Group(); g.name = 'Skate Park · fundo de concreto dos bowls';
  for (const b of bowls) {
    const h = casca(b), cx = h.reduce((a, q) => a + q[0], 0) / h.length, cz = h.reduce((a, q) => a + q[1], 0) / h.length;
    const geo = new THREE.ShapeGeometry(new THREE.Shape(h.map(q => new THREE.Vector2(cx + (q[0] - cx) * 1.4, -(cz + (q[1] - cz) * 1.4)))));
    geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, mat); m.position.y = 0.08; m.receiveShadow = true; g.add(m);
  }
  scene.add(g); return bowls.length;
}

// Wake Park: água da raia em verde-água e torres do cabo e rampas brancas, como nas fotos do parque.
function aguaDoWake(scene, THREE) {
  const box = new THREE.Box3(), c = new THREE.Vector3(); let n = 0;
  scene.traverse(o => {
    if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
    const cor = o.material.color?.getHexString(); if (cor !== '008c9f' && cor !== 'f7fafd') return;
    box.setFromObject(o); box.getCenter(c); if (Math.hypot(c.x + 450, c.z - 100) > 40) return;
    o.material = o.material.clone();
    if (cor === '008c9f') o.material.color.set('#2fbcb0'); // água
    else { o.material.color.set('#ffffff'); o.material.emissive?.set('#5a5a5a'); } // torres do cabo e rampas bem brancas
    n++;
  });
  return n;
}

export function aplicarEspacosReais(scene, THREE) {
  let n = 0; const box = new THREE.Box3(), c = new THREE.Vector3(); let tri = null;
  // Casa Cuiabana: laje plana atrás da platibanda, sem cumeeiras de telha
  scene.traverse(o => { if (o.name === 'Lazer · clay-ridge' && /Casa Cuiabana/.test(grupoDe(o, scene))) { o.visible = false; n++; } });
  const alvos = [];
  scene.traverse(o => { if (o.isMesh && !o.isInstancedMesh && o.material && !Array.isArray(o.material) && o.material.color) alvos.push(o); });
  for (const o of alvos) {
    const m = o.material; const original = m.userData.corOriginal || m.color.getHexString();
    box.setFromObject(o); box.getCenter(c);
    for (const regra of POR_POSICAO) {
      if (Math.hypot(c.x - regra.x, c.z - regra.z) > regra.r) continue;
      const bate = regra.cor === 'ffffff-com-textura'
        ? (m.map && original === 'ffffff' && !m.userData.texturaNova)
        : original === regra.cor.slice(1);
      if (!bate) continue;
      const nm = m.clone(); nm.userData = { corOriginal: original };
      limparMapas(nm); nm.vertexColors = false; nm.color.set(regra.nova); nm.roughness = 0.85; nm.metalness = 0; nm.envMapIntensity = 0.25;
      if (regra.textura === 'triangulos') { tri = tri || texturaTriangulos(THREE); nm.map = tri; nm.userData.texturaNova = true; }
      o.material = nm; n++; break;
    }
  }
  // Pérola do Cerrado: casca de escamas conforme o render do projeto
  let petalas = null;
  for (const o of alvos) {
    const m = o.material; if (!m.map || (m.userData.corOriginal || '') !== 'ffffff') continue;
    box.setFromObject(o); box.getCenter(c);
    if (Math.hypot(c.x + 402, c.z + 12) > 30 || c.y < 8) continue;
    petalas = petalas || texturaPetalas(THREE);
    const nm = m.clone(); nm.userData = { corOriginal: 'ffffff' }; nm.map = petalas; nm.color.set('#ffffff'); nm.roughness = 0.7; nm.needsUpdate = true;
    o.material = nm; n++;
  }
  // Vila das Nações: piso da orla em faixas
  let faixas = null;
  for (const o of alvos) {
    const m = o.material; if ((m.userData.corOriginal || '') !== 'ded9cf' || !/Vila das Nações/.test(grupoDe(o, scene))) continue;
    box.setFromObject(o); if (box.max.x - box.min.x < 80) continue;
    faixas = faixas || texturaFaixas(THREE);
    const nm = m.clone(); nm.userData = { corOriginal: 'ded9cf' }; nm.map = faixas; nm.color.set('#ffffff'); nm.needsUpdate = true;
    o.material = nm; n++;
  }
  n += construirPortico(scene, THREE);
  n += construirPraca(scene, THREE);
  n += construirSplash(scene, THREE);
  n += construirArenas(scene, THREE);
  n += construirAgro(scene, THREE);
  n += adicionarVida(scene, THREE);
  window.__carrosParados = estacionarCarros(scene, THREE);
  n += construirRoda(scene, THREE) ? 1 : 0;
  n += pisoDosBowls(scene, THREE);
  n += aguaDoWake(scene, THREE);
  return n;
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
    chao.receiveShadow = false; chao.scale.set(5, 1, 5); fundoPorPeriodo(chao);
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
  aplicarEspacosReais(scene, THREE);
  if (torre) {
    const nm = torre.material.clone(); nm.color.set('#eeece6'); nm.roughness = 0.85; // Árvore da Vida: hoje em concreto branco (drone out/2026)
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
