// estilo-realista.js
// Acabamento arquitetônico realista do mapa 3D do Parque Novo Mato Grosso:
// 1. Texturas procedurais PBR (grama com variação orgânica, asfalto com rugosidade, concreto paginado nos estacionamentos)
// 2. ShaderMaterial próprio para o Lago Oeste e enseadas (ondas suaves em duas direções, Fresnel refletindo o céu de cada período e margens rasas mais claras)

import { waterUniforms } from './miniatures.js?v=vias-20261120-5';
import { implantationData as IMPLANT_D } from './implantacao-dados.js?v=autodromo-arquitetura-20260913-1';

function rnd(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export const lakeShaderUniforms = {
  uTime: waterUniforms ? waterUniforms.uTime : { value: 0 },
  uSunDir: waterUniforms ? waterUniforms.uSunDir : { value: null },
  uSunColor: { value: null },
  uSkyZenith: { value: null },
  uSkyHorizon: { value: null },
  uDeepColor: { value: null },
  uShallowColor: { value: null },
  uFogColor: { value: null },
  uFogNear: { value: 950.0 },
  uFogFar: { value: 4200.0 },
  uShoreMap: { value: null },
  uShoreBounds: { value: null }
};

// 1. Textura procedural de grama com variação orgânica + mapa de normais e rugosidade
function criarTexturaGramaOrganica(THREE, aniso = 8) {
  const tam = 512;
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  const g = c.getContext('2d');
  const r = rnd(103);

  g.fillStyle = '#477433';
  g.fillRect(0, 0, tam, tam);

  const mancha = (cor, alfa, n, rMin, rMax) => {
    for (let i = 0; i < n; i++) {
      const x = r() * tam, y = r() * tam, raio = rMin + r() * (rMax - rMin);
      for (const dx of [-tam, 0, tam]) {
        for (const dy of [-tam, 0, tam]) {
          const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, raio);
          gr.addColorStop(0, cor.replace('A', String(alfa)));
          gr.addColorStop(1, cor.replace('A', '0'));
          g.fillStyle = gr;
          g.fillRect(x + dx - raio, y + dy - raio, raio * 2, raio * 2);
        }
      }
    }
  };

  mancha('rgba(52,92,36,A)', 0.42, 75, 28, 120);
  mancha('rgba(88,128,54,A)', 0.36, 85, 22, 95);
  mancha('rgba(122,144,68,A)', 0.24, 60, 18, 75);
  mancha('rgba(42,76,30,A)', 0.30, 95, 10, 42);

  const img = g.getImageData(0, 0, tam, tam);
  const d = img.data;
  const nSize = 128;
  const normBytes = new Uint8Array(nSize * nSize * 4);
  const roughBytes = new Uint8Array(nSize * nSize * 4);

  for (let i = 0; i < d.length; i += 4) {
    const v = (r() - 0.5) * 18;
    d[i] = Math.max(0, Math.min(255, d[i] + v));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + v * 1.1));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + v * 0.7));
  }
  g.putImageData(img, 0, 0);

  const rn = rnd(209);
  for (let i = 0; i < nSize * nSize; i++) {
    const nx = (rn() - 0.5) * 26;
    const ny = (rn() - 0.5) * 26;
    normBytes.set([128 + nx, 128 + ny, 252, 255], i * 4);
    const rv = 212 + Math.round((rn() - 0.5) * 28);
    roughBytes.set([rv, rv, rv, 255], i * 4);
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = aniso;
  if ('colorSpace' in map) map.colorSpace = THREE.SRGBColorSpace;

  const normalMap = new THREE.DataTexture(normBytes, nSize, nSize);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.anisotropy = aniso;
  normalMap.needsUpdate = true;

  const roughnessMap = new THREE.DataTexture(roughBytes, nSize, nSize);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = aniso;
  roughnessMap.needsUpdate = true;

  return { map, normalMap, roughnessMap };
}

// 2. Textura procedural de asfalto com rugosidade mineral
function criarTexturaAsfaltoRugoso(THREE, aniso = 8) {
  const tam = 256;
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  const g = c.getContext('2d');
  const r = rnd(311);

  g.fillStyle = '#2d3136';
  g.fillRect(0, 0, tam, tam);

  const img = g.getImageData(0, 0, tam, tam);
  const d = img.data;
  const normBytes = new Uint8Array(tam * tam * 4);
  const roughBytes = new Uint8Array(tam * tam * 4);

  for (let y = 0; y < tam; y++) {
    for (let x = 0; x < tam; x++) {
      const i = (y * tam + x) * 4;
      const grain = (r() - 0.5) * 24 + (r() > 0.88 ? 14 : 0);
      const streak = Math.sin((x + y * 0.3) * 0.08) * 3.5;
      const base = 46 + grain + streak;
      d[i] = Math.max(20, Math.min(95, base));
      d[i + 1] = Math.max(22, Math.min(98, base + 2));
      d[i + 2] = Math.max(25, Math.min(104, base + 5));
      d[i + 3] = 255;

      const nx = (r() - 0.5) * 34;
      const ny = (r() - 0.5) * 34;
      normBytes.set([128 + nx, 128 + ny, 250, 255], i);
      const rv = Math.max(175, Math.min(248, Math.round(215 + (r() - 0.5) * 38)));
      roughBytes.set([rv, rv, rv, 255], i);
    }
  }
  g.putImageData(img, 0, 0);

  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = aniso;
  if ('colorSpace' in map) map.colorSpace = THREE.SRGBColorSpace;

  const normalMap = new THREE.DataTexture(normBytes, tam, tam);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.anisotropy = aniso;
  normalMap.needsUpdate = true;

  const roughnessMap = new THREE.DataTexture(roughBytes, tam, tam);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = aniso;
  roughnessMap.needsUpdate = true;

  return { map, normalMap, roughnessMap };
}

// 3. Textura procedural de concreto paginado para os estacionamentos
function criarTexturaConcretoPaginado(THREE, aniso = 8) {
  const tam = 512;
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  const g = c.getContext('2d');
  const r = rnd(509);

  g.fillStyle = '#9ea39d';
  g.fillRect(0, 0, tam, tam);

  // Placas moduladas de concreto (8x8 placas por tile) com variação sutil entre placas
  const cells = 8, step = tam / cells;
  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      const delta = Math.round((r() - 0.5) * 14);
      const v = 156 + delta;
      g.fillStyle = `rgb(${v},${v + 3},${v - 1})`;
      g.fillRect(cx * step + 2, cy * step + 2, step - 3, step - 3);
      // Chanfro claro da borda da placa
      g.strokeStyle = 'rgba(225,228,222,0.35)';
      g.lineWidth = 1;
      g.strokeRect(cx * step + 2.5, cy * step + 2.5, step - 4, step - 4);
    }
  }

  // Juntas de dilatação escuras
  g.fillStyle = '#6e736e';
  for (let k = 0; k < cells; k++) {
    const pos = k * step;
    g.fillRect(pos, 0, 2, tam);
    g.fillRect(0, pos, tam, 2);
  }

  const img = g.getImageData(0, 0, tam, tam);
  const d = img.data;
  const normBytes = new Uint8Array(tam * tam * 4);
  const roughBytes = new Uint8Array(tam * tam * 4);

  for (let y = 0; y < tam; y++) {
    const isJointY = (y % step) < 2;
    for (let x = 0; x < tam; x++) {
      const i = (y * tam + x) * 4;
      const isJointX = (x % step) < 2;
      const noise = (r() - 0.5) * 10;
      d[i] = Math.max(0, Math.min(255, d[i] + noise));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + noise));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + noise));

      const jx = isJointX ? -24 : (r() - 0.5) * 10;
      const jy = isJointY ? -24 : (r() - 0.5) * 10;
      normBytes.set([128 + jx, 128 + jy, 252, 255], i);
      const rv = (isJointX || isJointY) ? 245 : Math.round(212 + (r() - 0.5) * 20);
      roughBytes.set([rv, rv, rv, 255], i);
    }
  }
  g.putImageData(img, 0, 0);

  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = aniso;
  if ('colorSpace' in map) map.colorSpace = THREE.SRGBColorSpace;

  const normalMap = new THREE.DataTexture(normBytes, tam, tam);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.anisotropy = aniso;
  normalMap.needsUpdate = true;

  const roughnessMap = new THREE.DataTexture(roughBytes, tam, tam);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = aniso;
  roughnessMap.needsUpdate = true;

  return { map, normalMap, roughnessMap };
}

// 4. Mapa SDF 256x256 de distância às margens de terra do Lago Oeste para o efeito de água rasa nas bordas
function criarMapaMargensLago(THREE) {
  const S = 256;
  const x0 = 50, z0 = 10, x1 = 500, z1 = 750;
  const landMask = new Uint8Array(S * S);
  const banksMesh = IMPLANT_D.registered?.meshes?.banks;
  const groundMesh = IMPLANT_D.registered?.meshes?.ground;

  function ptInTri(px, pz, ax, az, bx, bz, cx, cz) {
    const d1 = (px - bx) * (az - bz) - (ax - bx) * (pz - bz);
    const d2 = (px - cx) * (bz - cz) - (bx - cx) * (pz - cz);
    const d3 = (px - ax) * (cz - az) - (cx - ax) * (pz - az);
    return !(((d1 < 0) || (d2 < 0) || (d3 < 0)) && ((d1 > 0) || (d2 > 0) || (d3 > 0)));
  }

  for (const mesh of [banksMesh, groundMesh]) {
    if (!mesh) continue;
    const pts = mesh.points, idx = mesh.indices;
    for (let t = 0; t < idx.length; t += 3) {
      const ax = pts[idx[t] * 2], az = pts[idx[t] * 2 + 1];
      const bx = pts[idx[t + 1] * 2], bz = pts[idx[t + 1] * 2 + 1];
      const cx = pts[idx[t + 2] * 2], cz = pts[idx[t + 2] * 2 + 1];
      if (Math.min(ax, bx, cx) > x1 || Math.max(ax, bx, cx) < x0 || Math.min(az, bz, cz) > z1 || Math.max(az, bz, cz) < z0) continue;
      // Ignora o antigo istmo onde passa o canal sob a ponte da enseada sul
      const mx = (ax + bx + cx) / 3, mz = (az + bz + cz) / 3;
      if (mx >= 350 && mx <= 405 && mz >= 500 && mz <= 555) continue;
      const uMin = Math.max(0, Math.floor(((Math.min(ax, bx, cx) - x0) / (x1 - x0)) * S));
      const uMax = Math.min(S - 1, Math.ceil(((Math.max(ax, bx, cx) - x0) / (x1 - x0)) * S));
      const vMin = Math.max(0, Math.floor(((Math.min(az, bz, cz) - z0) / (z1 - z0)) * S));
      const vMax = Math.min(S - 1, Math.ceil(((Math.max(az, bz, cz) - z0) / (z1 - z0)) * S));
      for (let v = vMin; v <= vMax; v++) {
        const pz = z0 + ((v + 0.5) / S) * (z1 - z0);
        for (let u = uMin; u <= uMax; u++) {
          const px = x0 + ((u + 0.5) / S) * (x1 - x0);
          if (ptInTri(px, pz, ax, az, bx, bz, cx, cz)) landMask[v * S + u] = 1;
        }
      }
    }
  }

  // Transformada de distância Chamfer em 2 passagens a partir das margens de terra (landMask === 1)
  const dist = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) dist[i] = landMask[i] ? 0 : 1e4;
  for (let y = 1; y < S - 1; y++) {
    for (let x = 1; x < S - 1; x++) {
      const i = y * S + x;
      if (!dist[i]) continue;
      dist[i] = Math.min(
        dist[i],
        dist[i - 1] + 1,
        dist[i - S] + 1,
        dist[i - S - 1] + 1.414,
        dist[i - S + 1] + 1.414
      );
    }
  }
  for (let y = S - 2; y >= 1; y--) {
    for (let x = S - 2; x >= 1; x--) {
      const i = y * S + x;
      if (!dist[i]) continue;
      dist[i] = Math.min(
        dist[i],
        dist[i + 1] + 1,
        dist[i + S] + 1,
        dist[i + S + 1] + 1.414,
        dist[i + S - 1] + 1.414
      );
    }
  }

  const rgba = new Uint8Array(S * S * 4);
  const maxWaterCells = 13.5; // ~24 unidades de transição suave da margem rasa ao centro profundo
  for (let i = 0; i < S * S; i++) {
    const f = Math.min(1, dist[i] / maxWaterCells);
    const smooth = f * f * (3 - 2 * f);
    const val = Math.round(smooth * 255);
    rgba.set([val, val, val, 255], i * 4);
  }

  const tex = new THREE.DataTexture(rgba, S, S);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return { texture: tex, bounds: new THREE.Vector4(x0 - 620, z0 - 570, x1 - 620, z1 - 570) };
}

// 5. ShaderMaterial dedicado para a água do lago:
// - Ondas suaves em duas direções cruzadas
// - Efeito Fresnel refletindo a cor do céu de cada período
// - Tom mais claro esmeralda/turquesa nas margens rasas
function criarMaterialAguaShader(THREE) {
  const { texture: shoreMap, bounds } = criarMapaMargensLago(THREE);
  if (!lakeShaderUniforms.uSunDir.value) lakeShaderUniforms.uSunDir.value = new THREE.Vector3(-0.48, 0.78, 0.36).normalize();
  if (!lakeShaderUniforms.uSunColor.value) lakeShaderUniforms.uSunColor.value = new THREE.Color('#fff5e0');
  if (!lakeShaderUniforms.uSkyZenith.value) lakeShaderUniforms.uSkyZenith.value = new THREE.Color('#2d68a8');
  if (!lakeShaderUniforms.uSkyHorizon.value) lakeShaderUniforms.uSkyHorizon.value = new THREE.Color('#a4c8e5');
  if (!lakeShaderUniforms.uDeepColor.value) lakeShaderUniforms.uDeepColor.value = new THREE.Color('#0c3b4e');
  if (!lakeShaderUniforms.uShallowColor.value) lakeShaderUniforms.uShallowColor.value = new THREE.Color('#2e888a');
  if (!lakeShaderUniforms.uFogColor.value) lakeShaderUniforms.uFogColor.value = new THREE.Color('#c7d9ea');
  lakeShaderUniforms.uShoreMap.value = shoreMap;
  lakeShaderUniforms.uShoreBounds.value = bounds;

  return new THREE.ShaderMaterial({
    name: 'Lago · ShaderMaterial realista',
    uniforms: lakeShaderUniforms,
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying float vWaveH;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        // Ondas suaves em duas direções cruzadas
        vec2 d1 = vec2(0.82, 0.57);
        vec2 d2 = vec2(-0.61, 0.79);
        float w1 = sin(dot(wp.xz, d1) * 0.22 + uTime * 1.35) * 0.032;
        float w2 = cos(dot(wp.xz, d2) * 0.31 - uTime * 1.05) * 0.024;
        wp.y += (w1 + w2);
        vWaveH = w1 + w2;
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uSkyZenith;
      uniform vec3 uSkyHorizon;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uFogColor;
      uniform float uFogNear;
      uniform float uFogFar;
      uniform sampler2D uShoreMap;
      uniform vec4 uShoreBounds;

      varying vec3 vWorldPos;
      varying float vWaveH;

      void main() {
        // Coordenada normalizada na bacia do lago para amostrar a profundidade nas margens
        vec2 shoreUV = clamp((vWorldPos.xz - uShoreBounds.xy) / (uShoreBounds.zw - uShoreBounds.xy), 0.0, 1.0);
        float depthFactor = texture2D(uShoreMap, shoreUV).r;

        // Normais analíticas de ondas suaves em duas direções cruzadas com filtro anti-aliasing por distância
        float camDist = length(cameraPosition - vWorldPos);
        float detailFade = 1.0 - smoothstep(220.0, 950.0, camDist);
        vec2 p = vWorldPos.xz;
        vec2 dirA = vec2(0.82, 0.57);
        vec2 dirB = vec2(-0.61, 0.79);

        float phaseA1 = dot(p, dirA) * 0.24 + uTime * 1.35;
        float phaseA2 = dot(p, dirA) * 0.85 - uTime * 1.95;
        float phaseB1 = dot(p, dirB) * 0.31 - uTime * 1.15;
        float phaseB2 = dot(p, dirB) * 1.05 + uTime * 1.70;

        // Ondas ficam ainda mais suaves perto das margens rasas
        float waveAmp = mix(0.012, 0.034, depthFactor);
        vec2 dirC = vec2(0.13, -0.99);
        vec2 dirD = vec2(-0.93, -0.37);
        float phaseC = dot(p, dirC) * 0.57 + uTime * 1.23 + sin(dot(p, dirA) * 0.071) * 2.3;
        float phaseD = dot(p, dirD) * 0.43 - uTime * 0.97 + cos(dot(p, dirB) * 0.053) * 2.9;
        vec2 grad = dirA * (cos(phaseA1) * 0.38 + cos(phaseA2) * 0.22 * detailFade)
                  + dirB * (sin(phaseB1) * 0.36 + sin(phaseB2) * 0.24 * detailFade)
                  + dirC * cos(phaseC) * 0.30 + dirD * sin(phaseD) * 0.30;
        vec3 N = normalize(vec3(-grad.x * waveAmp, 1.0, -grad.y * waveAmp));

        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 R = reflect(-V, N);

        // Tom mais claro esmeralda/turquesa nas margens rasas e azul profundo no centro
        float caustic = (sin(phaseA2 + phaseC) * 0.5 + 0.5) * (1.0 - depthFactor) * 0.05;
        vec3 waterBase = mix(uShallowColor + vec3(caustic * 0.45, caustic * 0.7, caustic * 0.65), uDeepColor, depthFactor);
        // Borda imediata da margem levemente mais luminosa
        float shoreEdge = smoothstep(0.18, 0.0, depthFactor) * 0.16;
        waterBase += vec3(shoreEdge * 0.7, shoreEdge * 0.9, shoreEdge * 0.85);

        // Efeito Fresnel (Schlick) refletindo o gradiente de céu do período atual
        float cosTheta = clamp(dot(N, V), 0.0, 1.0);
        float fresnel = 0.06 + 0.88 * pow(1.0 - cosTheta, 3.8);
        float skyElev = clamp(R.y * 1.65 + 0.15, 0.0, 1.0);
        vec3 skyReflect = mix(uSkyHorizon, uSkyZenith, skyElev);

        // Reflexo especular do sol / lua sobre as cristas das ondas
        vec3 L = normalize(uSunDir);
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 220.0) * 1.35 + pow(max(dot(N, H), 0.0), 36.0) * 0.18;
        vec3 sunGlint = uSunColor * spec * smoothstep(-0.05, 0.2, L.y);

        vec3 col = mix(waterBase, skyReflect, fresnel * 0.78) + sunGlint;

        // Neblina atmosférica suave proporcional à distância
        float fogF = smoothstep(uFogNear, uFogFar, camDist);
        col = mix(col, uFogColor, fogF * 0.65);

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
}

function uvPlanar(geo, escala) {
  const p = geo.attributes.position;
  if (!p) return;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / escala;
    uv[i * 2 + 1] = p.getZ(i) / escala;
  }
  geo.setAttribute('uv', new geo.attributes.position.constructor(uv, 2));
}

function mats(o) {
  return Array.isArray(o.material) ? o.material : [o.material];
}

export function aplicarRealismo(scene, renderer, THREE) {
  if (scene.userData.estiloRealista) return scene.userData.estiloRealista;
  const maxAniso = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 4);
  const res = { grama: 0, asfalto: 0, estacionamento: 0, agua: 0, copas: 0 };

  const gramaPBR = criarTexturaGramaOrganica(THREE, maxAniso);
  const asfaltoPBR = criarTexturaAsfaltoRugoso(THREE, maxAniso);
  const concretoPaginadoPBR = criarTexturaConcretoPaginado(THREE, maxAniso);
  const waterShaderMat = criarMaterialAguaShader(THREE);

  scene.traverse(o => {
    if (!(o.isMesh || o.isInstancedMesh)) return;
    const m = mats(o)[0];
    if (!m) return;

    const mName = m.name || '';
    const hex = m.color ? m.color.getHexString() : '';

    // 1. Grama com variação orgânica (terreno recortado, base contínua, margens e gramados do autódromo)
    const isGrass =
      o.name === 'Terreno recortado' ||
      o.name === 'Terreno base contínua' ||
      o.name === 'Autódromo · grass' ||
      o.name === 'Margens · interpretação da prancha' ||
      m.userData?.surfaceKind === 'grass' ||
      m.userData?.surfaceKind === 'bank' ||
      mName === 'Cenário · terreno' ||
      mName === '#43752e' ||
      mName === '#4d7a36';

    if (o.isMesh && isGrass && m.isMeshStandardMaterial) {
      uvPlanar(o.geometry, 42);
      const nm = m.clone();
      nm.map = gramaPBR.map;
      nm.normalMap = gramaPBR.normalMap;
      nm.roughnessMap = gramaPBR.roughnessMap;
      nm.normalScale = new THREE.Vector2(0.28, 0.28);
      nm.color.set(m.userData?.surfaceKind === 'bank' ? '#d4dcc4' : '#ffffff');
      nm.vertexColors = false;
      nm.roughness = 0.88;
      nm.metalness = 0;
      nm.envMapIntensity = 0.45;
      nm.needsUpdate = true;
      o.material = nm;
      res.grama++;
      return;
    }

    // 2. Asfalto com rugosidade nas vias, autódromo e kartódromo
    const isAsphalt =
      o.name === 'Vias · superfícies sem sobreposição' ||
      o.name === 'Autódromo · bordas CAD preservadas' ||
      o.name === 'Kart · bordas CAD preservadas' ||
      m.userData?.surfaceKind === 'asphalt' ||
      m.userData?.surfaceKind === 'road-finish-03' ||
      m.userData?.autodromeFinishKind === 'asphalt' ||
      mName === 'Vias03 · asfalto' ||
      mName === '#2c3034';

    if (o.isMesh && isAsphalt && m.isMeshStandardMaterial) {
      uvPlanar(o.geometry, 14);
      const nm = m.clone();
      nm.map = asfaltoPBR.map;
      nm.normalMap = asfaltoPBR.normalMap;
      nm.roughnessMap = asfaltoPBR.roughnessMap;
      nm.normalScale = new THREE.Vector2(0.32, 0.32);
      nm.color.set('#ffffff');
      nm.roughness = 0.86;
      nm.metalness = 0.04;
      nm.envMapIntensity = 0.65;
      nm.needsUpdate = true;
      o.material = nm;
      res.asfalto++;
      return;
    }

    // 3. Concreto paginado nos estacionamentos (E1 a E7)
    const isParking =
      /Estacionamentos/.test(o.name || '') ||
      m.userData?.surfaceKind === 'parking' ||
      m.userData?.surfaceKind === 'parking-photo-g04' ||
      mName === '#9ba09a';

    if (o.isMesh && isParking && m.isMeshStandardMaterial) {
      uvPlanar(o.geometry, 18);
      const nm = m.clone();
      nm.map = concretoPaginadoPBR.map;
      nm.normalMap = concretoPaginadoPBR.normalMap;
      nm.roughnessMap = concretoPaginadoPBR.roughnessMap;
      nm.normalScale = new THREE.Vector2(0.26, 0.26);
      nm.color.set('#ffffff');
      nm.roughness = 0.84;
      nm.metalness = 0.02;
      nm.envMapIntensity = 0.55;
      nm.needsUpdate = true;
      o.material = nm;
      res.estacionamento++;
      return;
    }

    // 4. Água realista com ShaderMaterial próprio no Lago Oeste, enseadas e lagoa do Wake Park
    const isLakeWater =
      o.name === 'Água · contornos compatibilizados' ||
      o.name === 'Wake · lagoa' ||
      m.userData?.surfaceKind === 'water' ||
      m.userData?.isWater === true ||
      mName === '#1d8e9f' ||
      (m.isMeshPhysicalMaterial && ['1c8b9d', '1d8e9f', '2f9fd6'].includes(hex));

    if (o.isMesh && isLakeWater) {
      o.material = waterShaderMat;
      o.receiveShadow = true;
      res.agua++;
      return;
    }
  });

  // 5. Remove blocos de nuvens de maquete baixas
  scene.traverse(o => {
    if (o.name && /Vida no mapa/.test(o.name)) {
      o.children.forEach(c => {
        if (c.isGroup && c.position.y >= 90) c.visible = false;
      });
    }
  });

  renderer.shadowMap.needsUpdate = true;
  scene.userData.estiloRealista = res;
  return res;
}
