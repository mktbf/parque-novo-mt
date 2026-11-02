// estilo-realista.js
// Acabamento realista do mapa 3D do Parque Novo Mato Grosso.
// Roda UMA vez, logo depois de aplicarEstiloMinimundo. Não cria nem move nenhuma construção:
// só troca materiais (chão de cerrado, água, copas, base), devolve o céu e suaviza as cores de maquete.
// Onde não existe foto aérea, o chão vira textura de cerrado genérica, sem desenhar prédios.

import { waterUniforms } from './miniatures.js?v=texto-validado-20261102-1';

const TINTA_POR_PERIODO = { manha: '#e4ead6', tarde: '#e8eedb', 'por-do-sol': '#dcbf9e', noite: '#2c3652' };

function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Textura de cerrado: gramado verde-oliva com manchas de capim seco, moitas escuras e solo avermelhado.
function texturaCerrado(THREE, { seed = 7, base = '#6f8a3d', seco = 0.32, solo = 0.14, tam = 1024 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = tam;
  const g = c.getContext('2d'); const r = rnd(seed);
  g.fillStyle = base; g.fillRect(0, 0, tam, tam);
  const mancha = (cor, alfa, n, rMin, rMax) => {
    for (let i = 0; i < n; i++) {
      const x = r() * tam, y = r() * tam, raio = rMin + r() * (rMax - rMin);
      for (const dx of [-tam, 0, tam]) for (const dy of [-tam, 0, tam]) {
        const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, raio);
        gr.addColorStop(0, cor.replace('A', alfa)); gr.addColorStop(1, cor.replace('A', 0));
        g.fillStyle = gr; g.fillRect(x + dx - raio, y + dy - raio, raio * 2, raio * 2);
      }
    }
  };
  mancha('rgba(168,156,92,A)', seco, 60, 40, 160);   // capim seco
  mancha('rgba(74,104,40,A)', 0.38, 70, 20, 110);    // moitas e gramado mais denso
  mancha('rgba(150,98,60,A)', solo, 22, 10, 60);     // solo avermelhado exposto
  mancha('rgba(120,140,70,A)', 0.25, 90, 8, 30);     // variação fina
  const img = g.getImageData(0, 0, tam, tam), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = (r() - 0.5) * 26; d[i] += v; d[i + 1] += v; d[i + 2] += v * 0.7; }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function uvPlanar(geo, escala) {
  const p = geo.attributes.position; const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / escala; uv[i * 2 + 1] = p.getZ(i) / escala; }
  geo.setAttribute('uv', new geo.attributes.position.constructor(uv, 2));
}

function mats(o) { return Array.isArray(o.material) ? o.material : [o.material]; }

export function aplicarRealismo(scene, renderer, THREE) {
  if (scene.userData.estiloRealista) return scene.userData.estiloRealista;
  const res = { grama: 0, copas: 0, agua: 0, base: false, fundo: false, ceu: 0 };
  const gramaTex = texturaCerrado(THREE, { seed: 11 });
  const sateliteTex = texturaCerrado(THREE, { seed: 23, base: '#76884a', seco: 0.4, solo: 0.18 });
  const fundoTex = texturaCerrado(THREE, { seed: 41, base: '#5d7b39', seco: 0.3, solo: 0.08, tam: 512 });

  let base = null, chao = null, copas = null; const gramas = [], aguas = [], ceus = [];
  scene.traverse(o => {
    if (!(o.isMesh || o.isInstancedMesh)) return;
    const m = mats(o)[0]; if (!m) return;
    const hex = m.color ? m.color.getHexString() : '';
    if (o.name === 'Base maquete') base = o;
    else if (o.name === 'Cenário · copas') copas = o;
    else if (m.isMeshBasicMaterial && o.scale.x === 5 && !o.name) chao = o;
    else if (m.isMeshPhysicalMaterial && (m.userData.corOriginal === '345868' || hex === '2f9fd6')) aguas.push(o);
    if (m.isShaderMaterial && !/postes/.test(o.name)) ceus.push(o);
    if (o.isMesh && !m.map && m.color && (o.name === 'Autódromo · grass' || !o.name)) {
      o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox, sx = b.max.x - b.min.x;
      if (o.name === 'Autódromo · grass' || (sx > 1100 && sx < 1300 && !m.isMeshBasicMaterial)) gramas.push(o);
    }
  });

  // 1. Gramados (terreno e áreas verdes do autódromo) com textura de cerrado
  gramas.forEach(o => {
    uvPlanar(o.geometry, 70);
    const nm = mats(o)[0].clone(); nm.map = gramaTex; nm.color.set('#ffffff'); nm.vertexColors = false; nm.roughness = 1; nm.metalness = 0; nm.needsUpdate = true;
    o.material = nm;
    res.grama++;
  });

  // 2. Água mais natural: azul profundo com reflexo suave
  // Lagos (shader de água): azul profundo como nas fotos aéreas, no lugar do turquesa
  if (waterUniforms) { waterUniforms.uDeepColor.value.set('#1b4a60'); waterUniforms.uShallowColor.value.set('#3a7b8e'); }
  scene.traverse(o => { if (!o.isMesh) return; mats(o).forEach(m => {
    if (m && m.isMeshPhysicalMaterial && !m.transmission && (aguas.includes(o) || m.name === '#1d8e9f')) { m.color.set('#2d6f8c'); m.clearcoat = 0.3; m.reflectivity = 0.35; m.envMapIntensity = 0.35; m.roughness = 0.12; m.needsUpdate = true; res.agua++; }
  }); });

  // 3. Copas com forma mais redonda e tons variados de verde do cerrado
  if (copas) {
    copas.geometry = new THREE.IcosahedronGeometry(1, 2);
    const m = copas.material; m.flatShading = false; m.color.set('#ffffff'); m.roughness = 0.95; m.needsUpdate = true;
    const tons = ['#4e7a2f', '#5f8a37', '#46702b', '#6b8f3c', '#557f33', '#7a9346'].map(h => new THREE.Color(h));
    const r = rnd(5);
    for (let i = 0; i < copas.count; i++) copas.setColorAt(i, tons[Math.floor(r() * tons.length)]);
    if (copas.instanceColor) copas.instanceColor.needsUpdate = true;
    res.copas = copas.count;
  }

  // 4. Base da maquete: no topo, cerrado (aparece no modo Satélite onde não há foto); nas laterais, solo escuro
  if (base && base.geometry.groups && base.geometry.groups.length >= 2) {
    sateliteTex.repeat.set(1 / 90, 1 / 90);
    const topo = new THREE.MeshStandardMaterial({ map: sateliteTex, roughness: 1, metalness: 0 });
    const lado = new THREE.MeshStandardMaterial({ color: '#5a3b26', roughness: 1, metalness: 0, fog: false });
    base.material = [topo, lado]; res.base = true;
  } else if (base) {
    base.material = new THREE.MeshStandardMaterial({ color: '#6d7a45', roughness: 1 });
  }

  // 5. Chão em volta: cerrado que se perde no horizonte com a névoa, no lugar do verde chapado
  if (chao) {
    fundoTex.repeat.set(220, 220);
    const m = new THREE.MeshStandardMaterial({ map: fundoTex, roughness: 1, metalness: 0, fog: true });
    chao.material = m; chao.receiveShadow = true;
    let ultimo = '';
    chao.onBeforeRender = () => {
      const p = new URLSearchParams(location.search).get('periodo') || 'tarde';
      if (p !== ultimo) { ultimo = p; m.color.set(TINTA_POR_PERIODO[p] || TINTA_POR_PERIODO.tarde); }
    };
    res.fundo = true;
  }

  // 6. Céu de volta (o estilo maquete escondia)
  ceus.forEach(o => { Object.defineProperty(o, 'visible', { value: true, writable: true, configurable: true }); res.ceu++; });

  // 7. Cores menos "brinquedo": tira parte da saturação extra que o estilo maquete aplicou
  const vistos = new Set(), hsl = { h: 0, s: 0, l: 0 };
  scene.traverse(o => {
    if (!(o.isMesh || o.isInstancedMesh) || o === copas) return;
    mats(o).forEach(m => {
      if (!m || vistos.has(m) || !m.isMeshStandardMaterial || m.map || !m.color || m.isMeshPhysicalMaterial) return;
      vistos.add(m); m.color.getHSL(hsl);
      if (hsl.s > 0.1) m.color.setHSL(hsl.h, hsl.s * 0.82, hsl.l);
      m.envMapIntensity = Math.max(m.envMapIntensity || 0, 0.45);
    });
  });

  // 8. Luz de preenchimento vinda de um chão de cerrado, não de um gramado de brinquedo
  // 8. Motocross: terra batida em tom natural, sem o vermelho de maquete
  scene.traverse(o => {
    if (!o.isMesh) return; let p = o.parent, g = ''; while (p) { if (p.name) g += ' ' + p.name; p = p.parent; }
    if (!/Motocross/.test(g)) return;
    mats(o).forEach(m => { if (m && m.color && !m.map && m.color.r > m.color.g * 1.4) { m.color.set('#8f6d52'); m.needsUpdate = true; } });
  });

  // 9. Luz de preenchimento vinda de um chão de cerrado
  scene.traverse(l => { if (l.isHemisphereLight) l.groundColor.set('#6b7646'); });
  renderer.shadowMap.needsUpdate = true;
  scene.userData.estiloRealista = res;
  try { res.refino = aplicarRefinoFoto(scene, renderer, THREE, waterUniforms); } catch (e) { console.warn('[refino-foto]', e); }
  console.log('[estilo-realista]', JSON.stringify(res));
  return res;
}

// ---- Refino fotografico (v2) ----
// Refino fotografico: aproxima a maquete das fotos aereas de fim de tarde.
// So troca cores, texturas e luz. Nao cria nem move construcao.
function rndR(s) { s >>>= 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function texturaCerradoFoto(THREE, seed, tam) {
  const c = document.createElement('canvas'); c.width = c.height = tam;
  const g = c.getContext('2d'); const r = rndR(seed); const k = tam / 1024;
  g.fillStyle = '#6f7a41'; g.fillRect(0, 0, tam, tam);
  const blob = (col, a, n, r0, r1) => {
    for (let i = 0; i < n; i++) {
      const x = r() * tam, y = r() * tam, R = (r0 + r() * (r1 - r0)) * k;
      for (const dx of [-tam, 0, tam]) for (const dy of [-tam, 0, tam]) {
        const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, R);
        gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0));
        g.fillStyle = gr; g.fillRect(x + dx - R, y + dy - R, 2 * R, 2 * R);
      }
    }
  };
  blob('rgba(168,154,96,A)', 0.38, 60, 70, 240);   // capim seco dourado
  blob('rgba(84,104,52,A)', 0.42, 80, 40, 170);    // gramado mais verde
  blob('rgba(140,132,82,A)', 0.30, 90, 25, 110);   // palha
  blob('rgba(146,90,56,A)', 0.26, 26, 10, 46);     // solo vermelho exposto
  blob('rgba(110,122,66,A)', 0.28, 220, 6, 24);    // variacao fina
  for (let i = 0; i < 9000 * k * k; i++) {         // arbustos e moitas
    const x = r() * tam, y = r() * tam, R = (1.5 + r() * 4) * k;
    g.fillStyle = `rgba(${38 + r() * 24 | 0},${54 + r() * 26 | 0},${26 + r() * 12 | 0},${0.3 + r() * 0.45})`;
    g.beginPath(); g.arc(x, y, R, 0, 7); g.fill();
  }
  const im = g.getImageData(0, 0, tam, tam), D = im.data;
  for (let i = 0; i < D.length; i += 4) { const v = (r() - 0.5) * 26; D[i] += v; D[i + 1] += v; D[i + 2] += v * 0.6; }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const FOLHAS = {
  '49702e': '#45602e', '3a5f25': '#3a5426', '2c4f21': '#2e4520', '3b6639': '#3c5630', '50703a': '#4f6436',
  '406442': '#3f5a33', '66723c': '#5f6838', '34672b': '#3a5a2c', '315d20': '#33501f', '4b7e32': '#4a6a30'
};

function aplicarRefinoFoto(scene, renderer, THREE, waterUniforms) {
  if (scene.userData.refinoFoto) return scene.userData.refinoFoto;
  const res = { grama: 0, vias: 0, folhas: 0, copas: 0, piso: 0, agua: 0, nuvens: 0 };
  const gt = texturaCerradoFoto(THREE, 17, 2048); gt.repeat.set(0.25, 0.25);
  const ft = texturaCerradoFoto(THREE, 29, 512); ft.repeat.set(220, 220);
  const vistos = new Set();
  scene.traverse(o => {
    if (!(o.isMesh || o.isInstancedMesh)) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
      if (!m || vistos.has(m)) return; vistos.add(m);
      if (m.map && m.map.isCanvasTexture) {
        const rx = m.map.repeat.x;
        if (rx === 220) { m.map = ft; m.needsUpdate = true; res.grama++; return; }           // chao em volta
        if (rx === 1 && (o.name === 'Autódromo · grass' || !o.name)) { m.map = gt; m.needsUpdate = true; res.grama++; return; }
      }
      if (!m.color || m.map) return;
      const h = m.color.getHexString();
      if (h === '454b50') { m.color.set('#5e5f5b'); m.roughness = 0.95; res.vias++; }
      else if (FOLHAS[h]) { m.color.set(FOLHAS[h]); res.folhas++; }
      else if (h === 'f1f3f2') { m.color.set('#d9d3c6'); res.piso++; }
      else if (h === 'd2cdbf') { m.color.set('#c7bfae'); res.piso++; }
      else if (h === '328899' || h === '2d6f8c') { m.color.set('#1e3b46'); m.metalness = 0; m.roughness = 0.35; m.envMapIntensity = 0.25; m.needsUpdate = true; res.agua++; }
    });
  });
  scene.traverse(o => {
    if (o.name !== 'Cenário · copas' || !o.isInstancedMesh) return;
    const tons = ['#3c5626', '#48632c', '#2f4a20', '#566b30', '#40592a', '#5f6f35', '#35502a'].map(x => new THREE.Color(x));
    const r = rndR(9); for (let i = 0; i < o.count; i++) o.setColorAt(i, tons[Math.floor(r() * tons.length)]);
    if (o.instanceColor) o.instanceColor.needsUpdate = true; res.copas += o.count;
  });
  if (waterUniforms) { waterUniforms.uDeepColor.value.set('#173540'); waterUniforms.uShallowColor.value.set('#2a5560'); }
  const sois = [], ceus = []; scene.traverse(l => { if (l.isDirectionalLight) sois.push(l); if (l.isHemisphereLight) ceus.push(l); });
  const SOL = { manha: '#fff0d8', tarde: '#ffdcae' };
  // Nuvens de maquete (blocos brancos baixos) saem de cena
  scene.traverse(o => {
    if (o.name && /Vida no mapa/.test(o.name)) o.children.forEach(c => { if (c.isGroup && c.position.y >= 90) { c.visible = false; res.nuvens++; } });
  });
  // Neblina de fim de tarde e chao em volta mais escuro, reaplicados a cada quadro (o ciclo solar reescreve a neblina)
  const NEB = { manha: '#d6dbd2', tarde: '#cfd3c6', 'por-do-sol': '#d9b48e' };
  let chao = null; scene.traverse(o => { if (o.isMesh && o.scale.x === 5 && o.material && o.material.map === ft) chao = o; });
  if (chao) {
    const antes = chao.onBeforeRender;
    chao.onBeforeRender = function (...a) {
      if (antes) antes.apply(this, a);
      const p = new URLSearchParams(location.search).get('periodo') || 'tarde';
      // Neblina proporcional a distancia da camera: de perto e de longe o parque continua nitido e so o horizonte some
      const cam = a[2], dist = cam && cam.position ? Math.hypot(cam.position.x + 200, cam.position.y, cam.position.z - 40) : 1500;
      const perto = Math.max(700, dist * 0.9), longe = Math.max(3800, dist * 2.8);
      if (NEB[p]) { chao.material.color.set('#8f9a7a'); if (scene.fog) { scene.fog.color.set(NEB[p]); scene.fog.near = perto; scene.fog.far = longe; } }
      if (SOL[p]) { sois.forEach(l => l.color.set(SOL[p])); ceus.forEach(l => { l.color.set('#dfe3e8'); l.groundColor.set('#6a5f3c'); }); }
      // Noite: luar suave para o parque continuar legivel, sem apagar a iluminacao dos postes
      if (p === 'noite') { chao.material.color.set('#8a97b8'); ceus.forEach(l => { l.intensity = 1.5; l.color.set('#8fa6cf'); l.groundColor.set('#3a4458'); }); if (scene.fog) { scene.fog.color.set('#1f2c42'); scene.fog.near = Math.max(1200, dist * 1.1); scene.fog.far = Math.max(5200, dist * 3.4); } }
    };
  }
  scene.userData.refinoFoto = res;
  console.log('[refino-foto]', JSON.stringify(res));
  return res;
}
