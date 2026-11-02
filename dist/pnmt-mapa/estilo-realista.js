// estilo-realista.js
// Acabamento realista do mapa 3D do Parque Novo Mato Grosso.
// Roda UMA vez, logo depois de aplicarEstiloMinimundo. Não cria nem move nenhuma construção:
// só troca materiais (chão de cerrado, água, copas, base), devolve o céu e suaviza as cores de maquete.
// Onde não existe foto aérea, o chão vira textura de cerrado genérica, sem desenhar prédios.

import { waterUniforms } from './miniatures.js?v=parque-familia-20261011-3';

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
  console.log('[estilo-realista]', JSON.stringify(res));
  return res;
}
