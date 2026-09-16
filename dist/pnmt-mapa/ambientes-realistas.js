import * as T from 'three';

/**
 * Ambientes Realistas do Parque Novo Mato Grosso
 * Modelagem 3D fiel aos projetos executivos (R84/R83), vídeos de drone e fotos reais de referência.
 * Coordenadas na prancha de 1600 px (fator 1 : 2.10625 da prancha completa).
 */

export const realisticEnvironmentsVersion = 'ambientes-realistas-20260916-2';

// Materiais arquitetônicos PBR com calibragem física
const mats = new Map();
function getMat(key, color, roughness = 0.75, metalness = 0, options = {}) {
  const cacheKey = `${key}|${color}|${roughness}|${metalness}|${options.emissive || ''}`;
  if (!mats.has(cacheKey)) {
    const isGlass = key.includes('glass');
    const m = isGlass
      ? new T.MeshPhysicalMaterial({
          color,
          roughness: 0.15,
          metalness: 0.1,
          transmission: 0.7,
          thickness: 0.8,
          transparent: true,
          opacity: 0.85,
          reflectivity: 0.9,
          ...options
        })
      : new T.MeshStandardMaterial({
          color,
          roughness,
          metalness,
          envMapIntensity: metalness > 0.2 ? 1.2 : 0.8,
          ...options
        });
    m.name = 'PNMT-Ambiente · ' + key;
    mats.set(cacheKey, m);
  }
  return mats.get(cacheKey);
}

const M = {
  // Terra e Pista de Motocross
  dirtRed: getMat('dirt-red', '#9c4e28', 0.96, 0.0),
  dirtDark: getMat('dirt-dark', '#843d1d', 0.98, 0.0),
  dirtLight: getMat('dirt-light', '#b85e33', 0.92, 0.0),
  dirtBerm: getMat('dirt-berm', '#8a3c1c', 0.95, 0.0),
  // Areia de Praia (Arenas Beach)
  beachSand: getMat('beach-sand', '#e5d5ad', 0.96, 0.0),
  sandWet: getMat('sand-wet', '#c7b489', 0.90, 0.0),
  // Concreto, asfalto e pedras
  concrete: getMat('concrete', '#b8bab4', 0.90, 0.05),
  concreteDark: getMat('concrete-dark', '#7a7e7a', 0.92, 0.05),
  pavingStone: getMat('paving', '#cfcbbe', 0.88, 0.02),
  stoneStep: getMat('stone-step', '#8f928c', 0.92, 0.05),
  asphalt: getMat('asphalt', '#26292b', 0.85, 0.05),
  curbRed: getMat('curb-red', '#c62828', 0.75, 0.05),
  curbWhite: getMat('curb-white', '#f5f5f5', 0.75, 0.05),
  tireBlack: getMat('tire-black', '#1c1f21', 0.95, 0.0),
  // Estruturas metálicas e pintura
  steel: getMat('steel', '#5a686e', 0.45, 0.75),
  steelWhite: getMat('steel-white', '#e8ece9', 0.40, 0.25),
  darkSteel: getMat('dark-steel', '#22292d', 0.50, 0.65),
  titanium: getMat('titanium', '#4a555e', 0.35, 0.65),
  gold: getMat('gold', '#bfa157', 0.35, 0.85),
  // Cores institucionais, LED e sinalização
  white: getMat('white', '#f4f6f4', 0.60, 0.05),
  yellow: getMat('yellow', '#fbc02d', 0.65, 0.10),
  blue: getMat('blue', '#0288d1', 0.60, 0.15),
  cyan: getMat('cyan', '#00acc1', 0.55, 0.15),
  coral: getMat('coral', '#ff7043', 0.65, 0.10),
  greenLawn: getMat('lawn', '#5b7e38', 0.95, 0.0),
  greenRoof: getMat('green-roof', '#6a8f3c', 0.92, 0.0),
  // LEDs iluminados
  greenLed: getMat('green-led', '#00e676', 0.2, 0.1, { emissive: '#00e676', emissiveIntensity: 0.75 }),
  cyanLed: getMat('cyan-led', '#00e5ff', 0.2, 0.1, { emissive: '#00e5ff', emissiveIntensity: 0.75 }),
  // Madeira e decks
  woodDeck: getMat('wood-deck', '#93785b', 0.85, 0.05),
  woodDark: getMat('wood-dark', '#634d36', 0.88, 0.05),
  // Pisos emborrachados lúdicos
  rubberCyan: getMat('rubber-cyan', '#00b4d8', 0.85, 0.0),
  rubberYellow: getMat('rubber-yellow', '#ffb703', 0.85, 0.0),
  rubberGreen: getMat('rubber-green', '#55a630', 0.85, 0.0),
  rubberCharcoal: getMat('rubber-charcoal', '#2b2d42', 0.85, 0.0),
  // Fachada geométrica da praça de alimentação
  tileWhite: getMat('tile-white', '#edf2f4', 0.45, 0.1),
  tileSilver: getMat('tile-silver', '#8d99ae', 0.40, 0.3),
  tileDark: getMat('tile-dark', '#343a40', 0.45, 0.2),
  // Vidros
  glass: getMat('glass', '#658d94', 0.15, 0.10),
  glassBlue: getMat('glass-blue', '#437c88', 0.15, 0.10)
};

// Funções primitivas com verificação de integridade geométrica
function mesh(g, geo, mat, name = '', cast = true) {
  const m = new T.Mesh(geo, mat);
  m.name = name;
  m.castShadow = cast;
  m.receiveShadow = true;
  g.add(m);
  return m;
}

function box(g, x, y, z, w, h, d, mat = M.concrete, cast = true) {
  const m = mesh(g, new T.BoxGeometry(w, h, d), mat, '', cast);
  m.position.set(x, y + h / 2, z);
  return m;
}

function cylinder(g, x, y, z, r, h, mat = M.concrete, segments = 16, cast = true) {
  const m = mesh(g, new T.CylinderGeometry(r, r, h, segments), mat, '', cast);
  m.position.set(x, y + h / 2, z);
  return m;
}

function group(g, x = 0, z = 0, angle = 0) {
  const grp = new T.Group();
  grp.position.set(x, 0, z);
  grp.rotation.y = angle;
  g.add(grp);
  return grp;
}

function beam(g, a, b, r = 0.06, mat = M.steel, cast = true) {
  const A = new T.Vector3(...a), B = new T.Vector3(...b), delta = B.clone().sub(A);
  const len = delta.length();
  if (len < 1e-4) return null;
  const m = mesh(g, new T.CylinderGeometry(r, r, len, 6), mat, '', cast);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
  return m;
}

function ring(g, x, y, z, r, t, mat = M.white, vertical = false) {
  const m = mesh(g, new T.TorusGeometry(r, t, 6, r < 5 ? 24 : 48), mat, '', false);
  m.position.set(x, y, z);
  if (!vertical) m.rotation.x = -Math.PI / 2;
  return m;
}

function polygonMesh(g, points, y, depth, mat, cast = false) {
  const s = new T.Shape();
  points.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  s.closePath();
  const geo = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const m = mesh(g, geo, mat, '', cast);
  m.position.y = y;
  return m;
}

function surfaceMesh(g, vertices, indices, mat, name = '', cast = true) {
  const p = new T.Float32BufferAttribute(vertices, 3);
  const valid = [];
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
  for (let i = 0; i < indices.length; i += 3) {
    a.fromBufferAttribute(p, indices[i]);
    b.fromBufferAttribute(p, indices[i + 1]).sub(a);
    c.fromBufferAttribute(p, indices[i + 2]).sub(a);
    if (b.cross(c).lengthSq() > 1e-15) {
      valid.push(indices[i], indices[i + 1], indices[i + 2]);
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', p);
  geo.setIndex(valid);
  geo.computeVertexNormals();
  const m = mesh(g, geo, mat, name, cast);
  m.material.side = T.DoubleSide;
  return m;
}

function clearGroup(g) {
  g.traverse(o => {
    if (o.isMesh) {
      o.geometry?.dispose();
    }
  });
  g.clear();
}

/* ========================================================================== */
/* 1. PISTA DE MOTOCROSS - Relevo de Terra Vermelha e Obstáculos FIM/CBM      */
/* ========================================================================== */
export function buildMotocrossRealistic(g) {
  clearGroup(g);
  g.name = 'Pista de Motocross · Traçado e Relevo 3D Profissional';

  const cx = 362, cz = 952;
  const arena = group(g, cx, cz, -0.42);

  // 1. Platô Base de Terra Vermelha
  const plateauPoints = [
    [-32, -68], [28, -68], [34, -40], [36, 10], [30, 68], [-12, 68], [-28, 45], [-34, -10]
  ];
  polygonMesh(arena, plateauPoints, 0.15, 0.45, M.dirtDark, false);
  polygonMesh(arena, plateauPoints.map(([x, z]) => [x * 0.94, z * 0.94]), 0.58, 0.18, M.dirtRed, false);

  // 2. Traçado 3D Catmull-Rom da Pista
  const trackSpline = [
    new T.Vector3(20, 0.72, -62),
    new T.Vector3(20, 0.72, -15),
    new T.Vector3(22, 1.65, 12),
    new T.Vector3(12, 2.20, 48),
    new T.Vector3(-4, 2.30, 62),
    new T.Vector3(-20, 1.80, 52),
    new T.Vector3(-18, 1.20, 20),
    new T.Vector3(-15, 0.75, -5),
    new T.Vector3(-6, 0.75, -25),
    new T.Vector3(4, 1.10, -35),
    new T.Vector3(5, 1.40, -10),
    new T.Vector3(-2, 1.85, 18),
    new T.Vector3(-12, 1.50, 36),
    new T.Vector3(-24, 0.95, 22),
    new T.Vector3(-25, 0.75, -20),
    new T.Vector3(-20, 0.75, -55),
    new T.Vector3(0, 0.72, -62)
  ];

  const curve = new T.CatmullRomCurve3(trackSpline, true, 'centripetal', 0.35);
  const segments = 120;
  const trackWidth = 7.5;
  const vertices = [], indices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const normal = new T.Vector3(-tangent.z, 0, tangent.x).normalize();

    let camber = 0;
    if (i >= 20 && i <= 35) {
      camber = Math.sin(((i - 20) / 15) * Math.PI) * 0.95;
    }

    const left = pt.clone().addScaledVector(normal, -trackWidth / 2);
    left.y -= camber * 0.5;
    const right = pt.clone().addScaledVector(normal, trackWidth / 2);
    right.y += camber;

    vertices.push(left.x, left.y, left.z, right.x, right.y, right.z);

    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  surfaceMesh(arena, vertices, indices, M.dirtLight, 'Fita da Pista');

  // 3. Gate de Largada Oficial de 24 Posições
  const startX = 20, startZ = -58;
  box(arena, startX, 0.65, startZ, 8.5, 0.12, 2.5, M.concrete);
  box(arena, startX, 0.75, startZ + 0.8, 8.2, 0.35, 0.08, M.steel);
  for (let k = -3.8; k <= 3.8; k += 0.34) {
    box(arena, startX + k, 0.75, startZ + 0.8, 0.22, 0.38, 0.06, M.yellow);
  }
  beam(arena, [startX - 4.5, 0.7, startZ + 2.5], [startX - 4.5, 4.2, startZ + 2.5], 0.12, M.steel);
  beam(arena, [startX + 4.5, 0.7, startZ + 2.5], [startX + 4.5, 4.2, startZ + 2.5], 0.12, M.steel);
  beam(arena, [startX - 4.5, 4.0, startZ + 2.5], [startX + 4.5, 4.0, startZ + 2.5], 0.14, M.steel);
  box(arena, startX, 4.1, startZ + 2.5, 8.0, 0.9, 0.25, M.blue);

  // 4. Obstáculos Reais: Costelas (Whoops), Mesa (Table-top) e Pulo Duplo
  // 6 Costelas de Ritmo
  for (let w = 0; w < 6; w++) {
    const wz = -35 + w * 3.8;
    const whoop = mesh(arena, new T.CylinderGeometry(1.6, 1.6, trackWidth - 0.4, 16), M.dirtBerm);
    whoop.rotation.z = Math.PI / 2;
    whoop.position.set(startX, 0.95, wz);
    whoop.scale.set(0.65, 1.0, 0.9);
  }

  // Grande Mesa (Table-top jump)
  const mx = 21, mz = 6;
  const tableTop = group(arena, mx, mz);
  box(tableTop, 0, 0.7, 0, trackWidth - 0.2, 2.1, 10.0, M.dirtBerm);
  box(tableTop, 0, 2.75, 0, trackWidth - 0.4, 0.15, 6.0, M.dirtLight);

  // Arco da Linha de Chegada
  const fx = -22, fz = -45;
  beam(arena, [fx - 4.2, 0.75, fz], [fx - 4.2, 4.5, fz], 0.12, M.steel);
  beam(arena, [fx + 4.2, 0.75, fz], [fx + 4.2, 4.5, fz], 0.12, M.steel);
  beam(arena, [fx - 4.2, 4.3, fz], [fx + 4.2, 4.3, fz], 0.14, M.steel);
  box(arena, fx, 4.3, fz, 7.8, 0.85, 0.2, M.white);

  // 5. Torres de Iluminação Noturna do Estádio
  const floodlights = [
    [-30, -62], [-30, -25], [-30, 15], [-30, 55],
    [28, -62], [28, -25], [28, 15], [28, 55],
    [-2, 64], [0, -64]
  ];
  floodlights.forEach(([lx, lz]) => {
    beam(arena, [lx, 0.5, lz], [lx, 9.5, lz], 0.14, M.steel);
    box(arena, lx, 9.5, lz, 1.6, 0.65, 0.45, M.white);
    for (let f = -0.55; f <= 0.55; f += 0.55) {
      box(arena, lx + f, 9.5, lz + 0.22, 0.42, 0.52, 0.08, M.cyan, false);
    }
  });

  // Alambrado de proteção perimetral
  for (let z = -65; z <= 65; z += 5) {
    beam(arena, [-30, 0.4, z], [-30, 2.2, z], 0.035, M.steel);
  }
  beam(arena, [-30, 2.1, -65], [-30, 2.1, 65], 0.025, M.steel);
  beam(arena, [-30, 1.2, -65], [-30, 1.2, 65], 0.025, M.steel);

  // 6. Área de Pit-Bike e Sinalização de Mecânicos
  box(arena, 24, 0.75, -25, 6.0, 0.15, 18.0, M.concrete);
  for (let b = -30; b <= -18; b += 4) {
    box(arena, 24, 0.9, b, 4.5, 0.8, 1.8, M.blue);
    cylinder(arena, 24, 1.7, b, 1.2, 0.15, M.white);
  }

  g.userData.detailViews = {
    pista: {
      label: 'Ver pista completa e relevo',
      footprint: [[cx - 40, cz - 60], [cx + 40, cz - 60], [cx + 40, cz + 60], [cx - 40, cz + 60]],
      height: 12,
      direction: [0.95, 0.85, 0.95]
    },
    largada: {
      label: 'Ver gate de largada e holeshot',
      footprint: [[cx + 5, cz - 50], [cx + 30, cz - 50], [cx + 30, cz - 10], [cx + 5, cz - 10]],
      height: 5.5,
      direction: [-0.65, 0.45, 0.85]
    },
    saltos: {
      label: 'Ver mesa e costelas',
      footprint: [[cx - 20, cz - 20], [cx + 15, cz - 20], [cx + 15, cz + 25], [cx - 20, cz + 25]],
      height: 6.0,
      direction: [0.85, 0.55, 0.75]
    }
  };
}

/* ========================================================================== */
/* 2. ARENAS BEACH - Quadras de Areia e Arena Estádio com Arquibancada        */
/* ========================================================================== */
export function buildArenasBeachRealistic(g) {
  clearGroup(g);
  g.name = 'Arenas Beach · Quadras Oficiais e Estádio Central';

  const cx = 201, cz = 306, angle = -0.44;
  const beach = group(g, cx, cz, angle);

  // Platô de base do complexo de praia
  polygonMesh(beach, [
    [-28, -46], [28, -46], [28, 46], [-28, 46]
  ], 0.15, 0.25, M.greenLawn);

  // Calçadão perimetral
  polygonMesh(beach, [
    [-26, -44], [26, -44], [26, 44], [-26, 44]
  ], 0.35, 0.12, M.pavingStone);

  // 4 Quadras Normais de Beach Tennis
  for (let k = 0; k < 4; k++) {
    const qz = -32 + k * 14.5;
    const qw = 18.0, qd = 9.5;

    box(beach, -5, 0.45, qz, qw, 0.35, qd, M.beachSand);
    const lw = 16.0, ld = 8.0;
    box(beach, -5, 0.81, qz - ld / 2, lw, 0.015, 0.08, M.white, false);
    box(beach, -5, 0.81, qz + ld / 2, lw, 0.015, 0.08, M.white, false);
    box(beach, -5 - lw / 2, 0.81, qz, 0.08, 0.015, ld, M.white, false);
    box(beach, -5 + lw / 2, 0.81, qz, 0.08, 0.015, ld, M.white, false);

    beam(beach, [-5, 0.75, qz - ld / 2 - 0.4], [-5, 2.7, qz - ld / 2 - 0.4], 0.05, M.darkSteel);
    beam(beach, [-5, 0.75, qz + ld / 2 + 0.4], [-5, 2.7, qz + ld / 2 + 0.4], 0.05, M.darkSteel);
    box(beach, -5, 1.85, qz, 0.04, 0.85, ld + 0.6, M.darkSteel);
    box(beach, -5, 2.30, qz, 0.06, 0.08, ld + 0.8, M.yellow, false);

    // Cadeira Alta do Árbitro
    beam(beach, [-5 - lw / 2 - 0.8, 0.45, qz], [-5 - lw / 2 - 0.8, 2.2, qz], 0.04, M.steel);
    box(beach, -5 - lw / 2 - 0.8, 2.2, qz, 0.7, 0.5, 0.7, M.blue);
  }

  // QUADRA CENTRAL / ARENA ESTÁDIO (Conforme arenas-beach.webp)
  const sqZ = 30;
  box(beach, -2, 0.45, sqZ, 20.0, 0.35, 12.0, M.beachSand);
  box(beach, -2, 0.81, sqZ - 4.5, 16.0, 0.015, 0.08, M.white, false);
  box(beach, -2, 0.81, sqZ + 4.5, 16.0, 0.015, 0.08, M.white, false);
  box(beach, -10, 0.81, sqZ, 0.08, 0.015, 9.0, M.white, false);
  box(beach, 6, 0.81, sqZ, 0.08, 0.015, 9.0, M.white, false);

  // Rede oficial central
  beam(beach, [-2, 0.75, sqZ - 5], [-2, 2.8, sqZ - 5], 0.06, M.darkSteel);
  beam(beach, [-2, 0.75, sqZ + 5], [-2, 2.8, sqZ + 5], 0.06, M.darkSteel);
  box(beach, -2, 1.9, sqZ, 0.04, 0.9, 10.0, M.darkSteel);

  // Arquibancada Coberta Monumental com Assentos Escalonados
  const standX = 14.5;
  for (let r = 0; r < 7; r++) {
    const rx = standX + r * 1.1;
    const ry = 0.5 + r * 0.55;
    box(beach, rx, ry, sqZ, 1.1, 0.55, 16.0, r % 2 === 0 ? M.white : M.concreteDark);
    for (let sz = -7; sz <= 7; sz += 1.2) {
      box(beach, rx, ry + 0.55, sz, 0.75, 0.18, 0.65, r < 3 ? M.white : M.cyan);
    }
  }

  // Cobertura Metálica da Arquibancada
  box(beach, standX + 3.5, 5.4, sqZ, 9.5, 0.35, 18.0, M.darkSteel);
  for (const p of [sqZ - 8, sqZ + 8]) {
    beam(beach, [standX + 7.5, 0.5, p], [standX + 7.5, 5.5, p], 0.16, M.darkSteel);
    beam(beach, [standX - 0.5, 0.5, p], [standX - 0.5, 5.2, p], 0.14, M.darkSteel);
  }

  // Rede Alta de Fundo de Quadra (Ball-stop net)
  for (let z = sqZ - 6; z <= sqZ + 6; z += 3) {
    beam(beach, [-13, 0.45, z], [-13, 5.5, z], 0.04, M.darkSteel);
  }
  box(beach, -13, 3.0, sqZ, 0.02, 5.0, 13.0, M.darkSteel, false);

  g.userData.detailViews = {
    quadras: {
      label: 'Ver quadras de areia e estádio',
      footprint: [[cx - 25, cz - 40], [cx + 25, cz - 40], [cx + 25, cz + 40], [cx - 25, cz + 40]],
      height: 9,
      direction: [0.8, 0.65, 0.95]
    }
  };
}

/* ========================================================================== */
/* 3. WAKE PARK - Cabos no Lago, Obstáculos e Pavilhão "Wake Bar"             */
/* ========================================================================== */
export function buildWakeParkRealistic(g) {
  clearGroup(g);
  g.name = 'Wake Park · Sistema Full-Size Cable, Obstáculos e Wake Bar';

  const cx = 165, cz = 653;
  const wake = group(g, cx, cz);

  // 1. As 5 Torres do Sistema Cable Wakeboard distribuídas na enseada
  const towerPositions = [
    [-24, -40], [20, -45], [32, 25], [10, 58], [-28, 42]
  ];
  const towerHeight = 11.5;

  for (let i = 0; i < towerPositions.length; i++) {
    const [tx, tz] = towerPositions[i];
    cylinder(wake, tx, -0.3, tz, 0.8, 0.8, M.concreteDark);
    beam(wake, [tx - 0.4, 0.4, tz - 0.4], [tx, towerHeight, tz], 0.06, M.steel);
    beam(wake, [tx + 0.4, 0.4, tz - 0.4], [tx, towerHeight, tz], 0.06, M.steel);
    beam(wake, [tx, 0.4, tz + 0.5], [tx, towerHeight, tz], 0.06, M.steel);
    ring(wake, tx, towerHeight, tz, 0.4, 0.06, M.yellow, true);

    const nextIdx = (i + 1) % towerPositions.length;
    const [nx, nz] = towerPositions[nextIdx];
    beam(wake, [tx, towerHeight - 0.2, tz], [nx, towerHeight - 0.2, nz], 0.02, M.steelWhite);
  }

  // 2. Obstáculos Flutuantes no Lago
  const k1 = group(wake, 6, -10, 0.4);
  box(k1, 0, 0.05, 0, 2.4, 0.9, 5.2, M.white);
  box(k1, 0, 0.52, 0, 2.2, 0.08, 5.0, M.blue);

  const k2 = group(wake, -12, 16, -0.6);
  box(k2, 0, 0.05, 0, 2.4, 0.9, 5.2, M.white);
  box(k2, 0, 0.52, 0, 2.2, 0.08, 5.0, M.yellow);

  const sb = group(wake, 18, 5, 1.1);
  box(sb, 0, 0.08, 0, 0.9, 0.65, 14.0, M.darkSteel);
  box(sb, 0, 0.42, 0, 0.75, 0.06, 13.8, M.white);

  // 3. Píer Flutuante e Deck de Embarque dos Atletas
  const pier = group(wake, -24, -36, 0.35);
  box(pier, 0, 0.08, 0, 6.5, 0.3, 12.0, M.woodDeck);
  box(pier, 0, 0.25, -5.5, 7.0, 0.8, 0.8, M.white);
  box(pier, 0, 0.18, 7.5, 3.2, 0.2, 5.0, M.woodDeck);

  // 4. PAVILHÃO DA ORLA: "WAKE BAR" (Conforme wake-park.webp)
  const barX = 26, barZ = -22;
  const bar = group(wake, barX, barZ, -0.32);

  // Deque de madeira e base com escadaria e rampa
  box(bar, 0, 0.35, 0, 18.0, 0.6, 12.0, M.pavingStone);
  box(bar, 0, 0.95, 3.5, 18.2, 0.15, 6.0, M.woodDeck);

  // Prédio Principal com Fachada Ripada e Vidros
  box(bar, -4.5, 1.0, -1.5, 8.5, 4.2, 8.0, M.woodDeck);
  box(bar, 4.0, 1.0, -1.5, 8.0, 4.2, 8.0, M.glass);

  // Letreiro "WAKE BAR" na fachada
  box(bar, -4.5, 4.2, 2.6, 6.5, 0.5, 0.1, M.white);

  // Cobertura Branca em Balanço e Platibanda Moderna
  box(bar, 0, 5.2, 0, 20.5, 0.8, 14.0, M.steelWhite);
  beam(bar, [7.5, 1.0, 5.5], [7.5, 5.2, 5.5], 0.12, M.steelWhite);
  beam(bar, [-7.5, 1.0, 5.5], [-7.5, 5.2, 5.5], 0.12, M.steelWhite);

  // Pranchas de Wakeboard em Display no Lobby
  for (let s = -1.2; s <= 1.2; s += 0.8) {
    const board = box(bar, 3.5 + s, 1.1, 1.2, 0.35, 1.4, 0.12, s < 0 ? M.coral : M.cyan);
    board.rotation.x = -0.15;
  }

  // Rampa de Acesso Acessível com Corrimão
  for (let r = 0; r <= 8; r += 1.5) {
    beam(bar, [-8.8, 0.4 + r * 0.08, 3.0 + r * 0.4], [-8.8, 1.4 + r * 0.08, 3.0 + r * 0.4], 0.035, M.steelWhite);
  }
  beam(bar, [-8.8, 1.4, 3.0], [-8.8, 2.0, 6.2], 0.035, M.steelWhite);

  g.userData.detailViews = {
    circuito: {
      label: 'Ver circuito de cabos no lago',
      footprint: [[cx - 35, cz - 45], [cx + 35, cz - 45], [cx + 35, cz + 60], [cx - 35, cz + 60]],
      height: 14,
      direction: [0.75, 0.65, 0.85]
    },
    'wake-bar': {
      label: 'Ver Wake Bar e deque',
      footprint: [[cx + 10, cz - 35], [cx + 40, cz - 35], [cx + 40, cz - 5], [cx + 10, cz - 5]],
      height: 7.5,
      direction: [0.65, 0.55, 0.85]
    }
  };
}

/* ========================================================================== */
/* 4. SPLASH PARQUE - Brinquedos Aquáticos e Quiosque com Sombreiros          */
/* ========================================================================== */
export function buildSplashParkRealistic(g) {
  clearGroup(g);
  g.name = 'Splash Parque · Área de Lazer Aquático e Quiosque';

  const cx = 239, cz = 630;
  const splash = group(g, cx, cz, -0.15);

  // 1. Piso Emborrachado com Padrão Colorido Amortecedor
  polygonMesh(splash, [
    [-18, -25], [18, -25], [24, 15], [12, 28], [-15, 26], [-22, 5]
  ], 0.15, 0.22, M.rubberCyan);

  polygonMesh(splash, [
    [-12, -18], [12, -18], [16, 8], [8, 18], [-10, 16]
  ], 0.38, 0.08, M.rubberYellow);

  // 2. Arcos de Aspersão Arco-Íris
  const rainbowColors = [M.coral, M.yellow, M.greenLawn, M.cyan];
  for (let r = 0; r < 4; r++) {
    const rz = -14 + r * 4.5;
    ring(splash, 0, 2.2, rz, 2.4, 0.14, rainbowColors[r], true);
    cylinder(splash, -2.4, 0.38, rz, 0.18, 0.6, M.concreteDark);
    cylinder(splash, 2.4, 0.38, rz, 0.18, 0.6, M.concreteDark);
  }

  // 3. Torre com Balde Maluco (Tipping Bucket)
  const tx = -6, tz = 6;
  cylinder(splash, tx, 0.38, tz, 0.35, 6.2, M.cyan, 12);
  beam(splash, [tx, 5.8, tz], [tx, 5.8, tz + 1.8], 0.12, M.yellow);
  const bucket = mesh(splash, new T.ConeGeometry(1.3, 1.8, 16), M.yellow);
  bucket.position.set(tx, 5.6, tz + 1.8);
  bucket.rotation.x = Math.PI * 0.85;

  // 4. Cogumelo D'água
  const mx = 7, mz = 7;
  cylinder(splash, mx, 0.38, mz, 0.18, 3.2, M.white, 12);
  mesh(splash, new T.SphereGeometry(1.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.coral).position.set(mx, 3.2, mz);

  // 5. QUIOSQUE CURVO E SOMBREIROS HEXAGONAIS (Conforme splash-parque.webp)
  const kx = 10, kz = -8;
  cylinder(splash, kx, 0.38, kz, 5.2, 3.6, M.blue, 32);
  cylinder(splash, kx, 3.98, kz, 5.5, 0.3, M.white, 32);
  cylinder(splash, kx, 1.2, kz + 2.5, 2.8, 2.0, M.glass, 16);

  // Sombreiros Geométricos Hexagonais com Braços Estruturais
  for (const [hx, hz, c] of [[kx - 6, kz + 8, M.coral], [kx + 4, kz + 9, M.yellow], [kx - 8, kz - 3, M.cyan]]) {
    cylinder(splash, hx, 0.38, hz, 0.22, 3.8, M.blue, 12);
    mesh(splash, new T.ConeGeometry(3.2, 0.7, 6), c).position.set(hx, 4.15, hz);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      beam(splash, [hx, 3.2, hz], [hx + Math.cos(a) * 2.8, 3.9, hz + Math.sin(a) * 2.8], 0.045, M.steelWhite);
    }
  }

  g.userData.detailViews = {
    brinquedos: {
      label: 'Ver atrações aquáticas e quiosque',
      footprint: [[cx - 20, cz - 25], [cx + 20, cz - 25], [cx + 20, cz + 25], [cx - 20, cz + 25]],
      height: 8,
      direction: [0.85, 0.7, 0.85]
    }
  };
}

/* ========================================================================== */
/* 5. COMPLEXO CULTURAL - Árvore da Vida, Circo do Futuro, Anfiteatro e Museus*/
/* ========================================================================== */
export function buildCulturalComplexRealistic(gTree, gMuseums) {
  clearGroup(gTree);
  gTree.name = 'Complexo Cultural · Árvore da Vida (Torre 50m)';

  const cx = 283, cz = 598;
  const tree = group(gTree, cx, cz);

  // 1. Base Monumental com Raízes Estruturais Orgânicas
  cylinder(tree, 0, 0.2, 0, 14.0, 0.6, M.pavingStone, 32);
  cylinder(tree, 0, 0.8, 0, 10.0, 0.5, M.concreteDark, 32);

  for (let r = 0; r < 8; r++) {
    const a = (r / 8) * Math.PI * 2;
    const rx = Math.cos(a) * 8.5, rz = Math.sin(a) * 8.5;
    beam(tree, [rx, 0.8, rz], [Math.cos(a) * 3.2, 7.5, Math.sin(a) * 3.2], 0.32, M.woodDark);
  }

  // Portal de Entrada "ÁRVORE DA VIDA"
  box(tree, 0, 1.3, 6.5, 3.6, 4.2, 0.8, M.darkSteel);
  box(tree, 0, 4.5, 6.5, 4.2, 0.8, 0.3, M.gold);

  // 2. Fuste Cilíndrico Central da Torre (50m)
  const towerH = 48.0;
  cylinder(tree, 0, 1.2, 0, 3.2, towerH, M.titanium, 24);

  // 3. Mirante Panorâmico com Mãos Francesas Radiais e Sky Lounge
  const deckY = towerH;
  cylinder(tree, 0, deckY, 0, 8.5, 0.8, M.steelWhite, 32);
  ring(tree, 0, deckY + 0.8, 0, 8.4, 0.15, M.white);
  cylinder(tree, 0, deckY + 0.8, 0, 8.35, 1.2, M.glass, 32, false);

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    beam(tree, [Math.cos(a) * 3.2, deckY - 4.5, Math.sin(a) * 3.2], [Math.cos(a) * 8.2, deckY, Math.sin(a) * 8.2], 0.12, M.steelWhite);
  }

  ring(tree, 0, deckY + 2.0, 0, 8.2, 0.35, M.cyanLed);
  cylinder(tree, 0, deckY + 2.2, 0, 7.8, 6.5, M.glassBlue, 32);
  cylinder(tree, 0, deckY + 8.7, 0, 8.0, 0.9, M.titanium, 32);
  mesh(tree, new T.SphereGeometry(7.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.white).position.set(0, deckY + 9.6, 0);

  // 4. Circo do Futuro - Domo Geodésico Branco
  const domeX = 35, domeZ = -20;
  const dome = group(tree, domeX, domeZ);
  mesh(dome, new T.SphereGeometry(14.0, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.steelWhite).position.set(0, 0.3, 0);
  ring(dome, 0, 0.4, 0, 14.2, 0.3, M.concreteDark);

  // 5. Teatro de Arena Escalonado
  const arenaX = -32, arenaZ = 22;
  const amphitheater = group(tree, arenaX, arenaZ);
  for (let s = 0; s < 6; s++) {
    const sr = 18.0 - s * 2.2;
    ring(amphitheater, 0, 0.4 + s * 0.5, 0, sr, 0.8, M.stoneStep);
  }
  cylinder(amphitheater, 0, 0.3, 0, 4.5, 0.3, M.woodDeck, 24);

  gTree.userData.detailViews = {
    torre: {
      label: 'Ver torre e mirante (50m)',
      footprint: [[cx - 15, cz - 15], [cx + 15, cz - 15], [cx + 15, cz + 15], [cx - 15, cz + 15]],
      height: 52,
      direction: [0.85, 0.45, 0.85]
    },
    circo: {
      label: 'Ver Circo do Futuro (Domo)',
      footprint: [[cx + 20, cz - 35], [cx + 50, cz - 35], [cx + 50, cz - 5], [cx + 20, cz - 5]],
      height: 16,
      direction: [0.75, 0.65, 0.75]
    },
    anfiteatro: {
      label: 'Ver Teatro de Arena',
      footprint: [[cx - 45, cz + 5], [cx - 15, cz + 5], [cx - 15, cz + 35], [cx - 45, cz + 35]],
      height: 8,
      direction: [-0.65, 0.55, 0.85]
    }
  };

  // 6. MUSEUS (Pavilhões Arquitetônicos Conforme museus.webp)
  if (gMuseums) {
    clearGroup(gMuseums);
    gMuseums.name = 'Complexo Cultural · Museus de História Natural e do Povo MT';
    const mus = group(gMuseums, cx - 18, cz - 24, 0.28);

    // Pavilhão A: Museu do Povo Mato-grossense (Pé-direito duplo, portal branco e vidro)
    box(mus, -14, 0.3, 0, 22.0, 7.5, 14.0, M.concrete);
    box(mus, -14, 0.4, 7.1, 21.0, 6.8, 0.4, M.glass);
    for (let x = -24; x <= -4; x += 4.5) {
      beam(mus, [x, 0.4, 7.3], [x, 7.2, 7.3], 0.12, M.woodDark);
    }
    box(mus, -14, 7.6, 0, 23.5, 0.8, 15.5, M.white);

    // Pavilhão B: Museu de História Natural (Teto Hiperbólico Verde)
    box(mus, 16, 0.3, 0, 24.0, 6.0, 16.0, M.woodDeck);
    box(mus, 16, 0.4, 8.1, 23.0, 5.2, 0.4, M.glass);
    const greenLid = mesh(mus, new T.CylinderGeometry(13.0, 13.0, 0.8, 32, 1, false, 0, Math.PI), M.greenRoof);
    greenLid.rotation.z = Math.PI / 2;
    greenLid.position.set(16, 6.4, 0);
  }
}

/* ========================================================================== */
/* 6. VILA DAS NAÇÕES - Setor Portugal Cotado no CAD e Fachadas Mundiais      */
/* ========================================================================== */
export function buildVilaDasNacoesRealistic(g) {
  clearGroup(g);
  g.name = 'Vila das Nações · Setor Portugal e Fachadas Mundiais';

  const cx = 447, cz = 568, angle = -0.52;
  const vila = group(g, cx, cz, angle);

  const totalWidth = 110.0;

  // 1. Calçadão da Orla Paved Waterfront
  polygonMesh(vila, [
    [-totalWidth / 2 - 4, -12], [totalWidth / 2 + 4, -12],
    [totalWidth / 2 + 4, 12], [-totalWidth / 2 - 4, 12]
  ], 0.35, 0.25, M.pavingStone);

  for (let x = -totalWidth / 2; x <= totalWidth / 2; x += 4) {
    beam(vila, [x, 0.55, 9.2], [x, 1.45, 9.2], 0.035, M.steelWhite);
    if (Math.abs(x % 12) < 0.5) {
      beam(vila, [x, 0.55, 8.8], [x, 4.6, 8.8], 0.06, M.darkSteel);
      box(vila, x, 4.6, 8.8, 0.45, 0.45, 0.45, M.white);
    }
  }
  beam(vila, [-totalWidth / 2, 1.4, 9.2], [totalWidth / 2, 1.4, 9.2], 0.03, M.steelWhite);
  beam(vila, [-totalWidth / 2, 0.95, 9.2], [totalWidth / 2, 0.95, 9.2], 0.025, M.steelWhite);

  // 2. SETOR PORTUGAL (Rigorosamente Fiel à Prancha CAD vila-das-nacoes.webp)
  // [A] Santuário de Fátima (Torre 11.5m, colunata 4.3m)
  const portGroup = group(vila, -30, -3.5);
  box(portGroup, -4.0, 0.55, 0, 8.0, 4.3, 2.3, M.white);
  for (let col = -7.0; col <= -1.0; col += 1.8) {
    cylinder(portGroup, col, 0.55, 1.1, 0.16, 4.2, M.concrete, 12);
  }
  box(portGroup, -4.0, 4.3, 0, 2.5, 7.2, 2.0, M.white);
  mesh(portGroup, new T.ConeGeometry(1.6, 3.2, 8), M.darkSteel).position.set(-4.0, 12.5, 0);
  beam(portGroup, [-4.0, 14.1, 0], [-4.0, 15.2, 0], 0.04, M.gold);

  // [B] Arco da Rua Augusta (15.0m larg x 8.6m alt)
  const augusta = group(vila, -8, -3.5);
  box(augusta, 0, 0.55, 0, 15.0, 5.0, 2.3, M.yellow);
  box(augusta, 0, 5.0, 0, 15.2, 0.5, 2.5, M.white);
  box(augusta, 0, 5.5, 0, 8.4, 2.5, 2.0, M.white);
  box(augusta, 0, 8.0, 0, 5.1, 0.6, 1.8, M.white);
  box(augusta, 0, 0.55, 0, 5.1, 4.5, 2.6, M.darkSteel);
  mesh(augusta, new T.BoxGeometry(2.8, 1.6, 1.2), M.darkSteel).position.set(0, 9.4, 0);

  // [C] Estátua Equestre de Dom José I (Diante do Arco)
  const statue = group(vila, -8, 2.5);
  cylinder(statue, 0, 0.55, 0, 2.5, 0.4, M.pavingStone, 24);
  box(statue, 0, 0.95, 0, 1.2, 1.5, 1.8, M.white);
  box(statue, 0, 2.45, 0, 0.9, 1.8, 1.6, M.darkSteel);

  // [D] Torre de Belém (Torre 9.0m, baluarte 3.0m com guaritas)
  const belem = group(vila, 10, -3.5);
  box(belem, 2.6, 0.55, 0, 5.2, 3.0, 4.0, M.white);
  box(belem, -1.5, 0.55, -0.5, 3.0, 9.0, 3.0, M.white);
  for (const [bx, bz] of [[4.8, 1.8], [4.8, -1.8], [0.4, 1.8]]) {
    cylinder(belem, bx, 2.8, bz, 0.45, 1.2, M.white, 12);
    mesh(belem, new T.ConeGeometry(0.5, 0.8, 8), M.darkSteel).position.set(bx, 4.3, bz);
  }

  // 3. DEMAIS MARCOS MUNDIAIS AO LONGO DA ORLA
  // Coliseu Romano
  const coliseu = group(vila, 26, -3.5);
  box(coliseu, 0, 0.55, 0, 13.0, 8.5, 6.5, M.concrete);
  for (let r = 0; r < 2; r++) {
    const ay = 1.0 + r * 3.5;
    for (let col = -5.0; col <= 5.0; col += 2.5) {
      cylinder(coliseu, col, ay, 3.4, 0.35, 3.2, M.concreteDark, 12);
    }
  }

  // Big Ben Inglês
  const bigBen = group(vila, 39, -3.5);
  box(bigBen, 0, 0.55, 0, 5.5, 15.0, 5.5, M.pavingStone);
  cylinder(bigBen, 0, 12.5, 2.9, 1.2, 0.15, M.white, 16, false);
  ring(bigBen, 0, 12.5, 2.92, 1.2, 0.08, M.gold, true);
  mesh(bigBen, new T.ConeGeometry(2.8, 5.0, 4), M.darkSteel).position.set(0, 17.5, 0);

  // Pagode Oriental
  const pagode = group(vila, -46, -3.5);
  box(pagode, 0, 0.55, 0, 8.5, 10.0, 8.5, M.woodDark);
  for (let lvl = 0; lvl < 3; lvl++) {
    const ly = 3.5 + lvl * 2.8;
    box(pagode, 0, ly, 0, 11.5 - lvl * 1.5, 0.35, 11.5 - lvl * 1.5, M.coral);
  }

  g.userData.detailViews = {
    fachadas: {
      label: 'Ver setor Portugal e fachadas mundiais',
      footprint: [[cx - 50, cz - 30], [cx + 50, cz - 30], [cx + 50, cz + 30], [cx - 50, cz + 30]],
      height: 14,
      direction: [0.35, 0.55, 0.95]
    }
  };
}

/* ========================================================================== */
/* 7. CENTRO DE EVENTOS - Pavilhão de Convenções Contemporâneo                */
/* ========================================================================== */
export function buildCentroDeEventosRealistic(g) {
  clearGroup(g);
  g.name = 'Centro de Eventos · Pavilhão de Convenções';

  const cx = 318, cz = 307, angle = 0.72;
  const events = group(g, cx, cz, angle);

  // 1. Base e Esplanada
  polygonMesh(events, [
    [-65, -35], [65, -35], [65, 45], [-65, 45]
  ], 0.15, 0.25, M.concreteDark);

  // 2. Pavilhão Principal com Cobertura Inclinada Aerodinâmica
  const mainW = 108.0, mainD = 54.0, wallH = 11.5;
  box(events, 0, 0.4, 0, mainW, wallH, mainD, M.concrete);

  // Fachada Principal em Pele de Vidro
  box(events, 0, 0.4, mainD / 2 + 0.1, mainW - 4, wallH - 1, 0.3, M.glass);
  for (let x = -mainW / 2 + 4; x <= mainW / 2 - 4; x += 5.5) {
    beam(events, [x, 0.4, mainD / 2 + 0.3], [x, wallH, mainD / 2 + 0.3], 0.09, M.darkSteel);
  }

  // Cobertura Metálica com Sheds
  box(events, 0, wallH + 0.4, 0, mainW + 4, 1.2, mainD + 4, M.steelWhite);
  for (let z = -mainD / 2; z <= mainD / 2; z += 4.5) {
    beam(events, [-mainW / 2 - 1.8, wallH + 1.1, z], [mainW / 2 + 1.8, wallH + 1.1, z], 0.06, M.steel);
  }

  // Marquise de Entrada em Balanço
  box(events, 0, 5.5, mainD / 2 + 8.5, 48.0, 0.4, 16.0, M.steelWhite);
  for (const mx of [-20, -7, 7, 20]) {
    beam(events, [mx, 0.4, mainD / 2 + 16.0], [mx, 5.5, mainD / 2 + 16.0], 0.16, M.darkSteel);
  }

  g.userData.detailViews = {
    pavilhao: {
      label: 'Ver pavilhão principal',
      footprint: [[cx - 50, cz - 40], [cx + 50, cz - 40], [cx + 50, cz + 40], [cx - 50, cz + 40]],
      height: 14,
      direction: [0.85, 0.65, 0.85]
    }
  };
}

/* ========================================================================== */
/* 8. AGROPLACE - Rotunda de Eventos Agropecuários com Brises Verdes          */
/* ========================================================================== */
export function buildAgroPlaceRealistic(g) {
  clearGroup(g);
  g.name = 'AgroPlace · Rotunda e Centro de Eventos Agropecuários';

  const cx = 398, cz = 701;
  const agro = group(g, cx, cz);

  // 1. Esplanada Circular Pavimentada
  cylinder(agro, 0, 0.15, 0, 28.0, 0.35, M.pavingStone, 48);

  // 2. Escadaria Monumental com Linhas de LED Verde Neon (Conforme agroplace.webp)
  for (let s = 0; s < 6; s++) {
    const sr = 26.0 - s * 1.0;
    const sy = 0.5 + s * 0.22;
    cylinder(agro, 0, sy, 0, sr, 0.22, M.stoneStep, 48);
    ring(agro, 0, sy + 0.22, 0, sr - 0.1, 0.04, M.greenLed);
  }

  // 3. Rotunda Cilíndrica Principal (Raio 17.5m, Altura 13m)
  const rRadius = 17.5, rH = 13.0;
  cylinder(agro, 0, 1.8, 0, rRadius, rH, M.titanium, 48);

  // Lobby Térreo Envidraçado Recuado
  cylinder(agro, 0, 1.8, 0, rRadius + 0.1, 3.8, M.glass, 32);

  // Marquise Horizontal Circunferencial em Balanço
  ring(agro, 0, 5.6, 0, rRadius + 1.8, 0.45, M.steelWhite);

  // 4. Brises Verticais de LED Verde (Assinatura Arquitetônica do AgroPlace)
  const finsCount = 42;
  for (let i = 0; i < finsCount; i++) {
    const a = (i / finsCount) * Math.PI * 2;
    const fx = Math.cos(a) * (rRadius + 0.4);
    const fz = Math.sin(a) * (rRadius + 0.4);
    const fin = box(agro, fx, 5.8, fz, 0.18, 7.8, 0.9, M.concreteDark);
    fin.rotation.y = -a;
    const ledStrip = box(agro, fx, 5.8, fz, 0.08, 7.8, 0.08, M.greenLed, false);
    ledStrip.rotation.y = -a;
  }

  // Platibanda superior e ático técnico
  cylinder(agro, 0, 1.8 + rH, 0, rRadius + 0.5, 0.8, M.concreteDark, 48);
  cylinder(agro, 0, 1.8 + rH + 0.8, 0, 11.0, 1.8, M.steel, 24);

  // 5. Paisagismo: Palmeiras Imperiais na Esplanada
  for (let p = 0; p < 8; p++) {
    const pa = (p / 8) * Math.PI * 2;
    const px = Math.cos(pa) * 24.0, pz = Math.sin(pa) * 24.0;
    cylinder(agro, px, 0.5, pz, 0.35, 7.0, M.woodDark, 12);
    mesh(agro, new T.SphereGeometry(2.2, 12, 8), M.greenLawn).position.set(px, 7.5, pz);
  }

  g.userData.detailViews = {
    rotunda: {
      label: 'Ver rotunda e brises verdes',
      footprint: [[cx - 24, cz - 24], [cx + 24, cz - 24], [cx + 24, cz + 24], [cx - 24, cz + 24]],
      height: 15,
      direction: [0.85, 0.55, 0.95]
    },
    esplanada: {
      label: 'Ver esplanada e escadaria',
      footprint: [[cx - 28, cz - 10], [cx + 28, cz - 10], [cx + 28, cz + 30], [cx - 28, cz + 30]],
      height: 9,
      direction: [0.35, 0.45, 1.0]
    }
  };
}

/* ========================================================================== */
/* 9. PRAÇA DE ALIMENTAÇÃO - Pavilhão Curvo, Painéis Facetados e Colunas-Árvore*/
/* ========================================================================== */
export function buildPracaDeAlimentacaoRealistic(g) {
  clearGroup(g);
  g.name = 'Praça de Alimentação · Complexo Gastronômico e Colunata';

  const cx = 330, cz = 573, angle = -0.22;
  const food = group(g, cx, cz, angle);

  // 1. Pavimento da Praça Gastronômica
  polygonMesh(food, [
    [-28, -20], [28, -20], [28, 22], [-28, 22]
  ], 0.15, 0.25, M.pavingStone);

  // 2. Pavilhão Curvo Semicircular com Fachada Geométrica de Triângulos
  const arcLen = 52.0, arcDepth = 14.0, pH = 7.8;
  box(food, 0, 0.4, -4, arcLen, pH, arcDepth, M.concrete);

  const tiles = [M.tileWhite, M.tileSilver, M.tileDark];
  for (let tx = -arcLen / 2 + 2; tx <= arcLen / 2 - 2; tx += 3.2) {
    for (let ty = 3.5; ty < pH; ty += 1.8) {
      const tMat = tiles[Math.abs(Math.round(tx * 3 + ty * 5)) % 3];
      box(food, tx, ty + 0.4, arcDepth / 2 - 3.9, 3.0, 1.6, 0.15, tMat);
    }
  }

  // Térreo Aberto Apoiado por Pilotis Cilíndricos
  for (let c = -arcLen / 2 + 3; c <= arcLen / 2 - 3; c += 6.5) {
    cylinder(food, c, 0.4, arcDepth / 2 - 4.1, 0.48, 3.4, M.concrete, 16);
  }

  // Colunas-Árvore Estruturais Orgânicas Internas
  for (const tx of [-14, 0, 14]) {
    cylinder(food, tx, 0.4, -4, 0.4, 3.4, M.darkSteel);
    for (let b = 0; b < Math.PI * 2; b += Math.PI / 3) {
      beam(food, [tx, 2.6, -4], [tx + Math.cos(b) * 2.5, 3.8, -4 + Math.sin(b) * 2.5], 0.07, M.darkSteel);
    }
  }

  // Mesas e Cadeiras ao Ar Livre
  for (let mx = -18; mx <= 18; mx += 6) {
    cylinder(food, mx, 0.4, 6, 0.9, 0.75, M.white);
    for (const d of [-1.2, 1.2]) {
      box(food, mx + d, 0.4, 6, 0.45, 0.45, 0.45, M.coral);
      box(food, mx, 0.4, 6 + d, 0.45, 0.45, 0.45, M.coral);
    }
  }

  // 3. Pórtico de Entrada Ondulado (Conecta ao Parque da Família)
  const waveX = -24, waveZ = 12;
  const wave = group(food, waveX, waveZ, 0.45);
  mesh(wave, new T.TorusGeometry(3.5, 0.45, 12, 24, Math.PI), M.blue).position.set(0, 0.4, 0);
  mesh(wave, new T.TorusGeometry(4.2, 0.35, 12, 24, Math.PI), M.white).position.set(0, 0.4, 0);

  // Pontos de Iluminação embutida no piso
  for (let lx = -22; lx <= 22; lx += 4) {
    cylinder(food, lx, 0.4, 11, 0.14, 0.05, M.white, 8, false);
  }

  g.userData.detailViews = {
    gastronomia: {
      label: 'Ver praça gastronômica',
      footprint: [[cx - 25, cz - 25], [cx + 25, cz - 25], [cx + 25, cz + 25], [cx - 25, cz + 25]],
      height: 10,
      direction: [0.95, 0.65, 0.75]
    },
    terraco: {
      label: 'Ver colunata e arquitetura',
      footprint: [[cx - 20, cz - 15], [cx + 20, cz - 15], [cx + 20, cz + 20], [cx - 20, cz + 20]],
      height: 7,
      direction: [-0.65, 0.45, 0.85]
    }
  };
}

/* ========================================================================== */
/* 10. PARQUE DA FAMÍLIA - Playground Temático, Gazebos e Bancos de Árvore    */
/* ========================================================================== */
export function buildParqueDaFamiliaRealistic(g) {
  clearGroup(g);
  g.name = 'Parque da Família · Playground e Gazebos';

  const cx = 276, cz = 556, angle = 0.35;
  const fam = group(g, cx, cz, angle);

  // 1. Piso Emborrachado Lúdico em Ondas Coloridas
  polygonMesh(fam, [
    [-30, -22], [30, -22], [32, 22], [-28, 24]
  ], 0.15, 0.22, M.rubberGreen);

  polygonMesh(fam, [
    [-18, -14], [22, -14], [18, 16], [-20, 14]
  ], 0.38, 0.06, M.rubberYellow);

  polygonMesh(fam, [
    [-8, -8], [14, -8], [10, 8], [-10, 6]
  ], 0.44, 0.06, M.rubberCharcoal);

  // 2. Coberturas Triangulares em Balanço / Gazebos (Conforme parque-da-familia.webp)
  for (const [gx, gz, rot] of [[-12, -4, 0.2], [14, 2, -0.4]]) {
    const gzGrp = group(fam, gx, gz, rot);
    const triRoof = mesh(gzGrp, new T.ConeGeometry(8.5, 2.2, 3), M.steelWhite);
    triRoof.position.set(0, 5.8, 0);
    triRoof.rotation.x = 0.15;
    mesh(gzGrp, new T.ConeGeometry(8.3, 2.0, 3), M.woodDeck).position.set(0, 5.65, 0);
    beam(gzGrp, [-3.5, 0.4, -3], [0, 5.5, 0], 0.12, M.steelWhite);
    beam(gzGrp, [3.5, 0.4, -3], [0, 5.5, 0], 0.12, M.steelWhite);
    beam(gzGrp, [0, 0.4, 4], [0, 5.5, 0], 0.12, M.steelWhite);
  }

  // 3. Mega Playground de Aventura
  const play = group(fam, 0, 4);
  box(play, 0, 0.4, 0, 3.5, 4.5, 3.5, M.woodDeck);
  mesh(play, new T.ConeGeometry(2.4, 1.8, 4), M.coral).position.set(0, 5.8, 0);

  for (const [sx, color] of [[-2.5, M.coral], [2.5, M.blue]]) {
    const slide = mesh(play, new T.TorusGeometry(1.8, 0.35, 12, 24, Math.PI * 1.5), color);
    slide.position.set(sx, 2.5, 2.0);
    slide.rotation.x = Math.PI / 3;
  }

  // Balanços Infantis
  const swing = group(fam, -18, 6);
  beam(swing, [-2.5, 0.4, 0], [-2.5, 3.2, 0], 0.08, M.steelWhite);
  beam(swing, [2.5, 0.4, 0], [2.5, 3.2, 0], 0.08, M.steelWhite);
  beam(swing, [-2.5, 3.1, 0], [2.5, 3.1, 0], 0.09, M.steelWhite);
  beam(swing, [-0.8, 0.8, 0], [-0.8, 3.0, 0], 0.02, M.darkSteel);
  beam(swing, [0.8, 0.8, 0], [0.8, 3.0, 0], 0.02, M.darkSteel);
  box(swing, 0, 0.8, 0, 2.0, 0.08, 0.35, M.woodDark);

  // 4. Bancos Circulares Monolíticos em Torno de Árvores Floridas
  for (const [bx, bz] of [[-16, -12], [8, -12], [20, 10]]) {
    ring(fam, bx, 0.75, bz, 2.2, 0.55, M.concreteDark);
    cylinder(fam, bx, 0.4, bz, 0.22, 4.2, M.woodDark, 12);
    mesh(fam, new T.SphereGeometry(1.8, 12, 8), M.coral).position.set(bx, 4.6, bz);
  }

  g.userData.detailViews = {
    playground: {
      label: 'Ver playground temático',
      footprint: [[cx - 30, cz - 25], [cx + 30, cz - 25], [cx + 30, cz + 25], [cx - 30, cz + 25]],
      height: 8,
      direction: [0.85, 0.55, 0.85]
    },
    alameda: {
      label: 'Ver gazebos e alameda',
      footprint: [[cx - 25, cz - 20], [cx + 25, cz - 20], [cx + 25, cz + 20], [cx - 25, cz + 20]],
      height: 6.5,
      direction: [-0.75, 0.45, 0.75]
    }
  };
}

/* ========================================================================== */
/* 11. PÉROLA DO CERRADO - Laje em Gota sobre Pilotis e Cúpula Geodésica      */
/* ========================================================================== */
export function buildPerolaDoCerradoRealistic(g) {
  clearGroup(g);
  g.name = 'Pérola do Cerrado · Laje Esculpida sobre Pilotis e Cúpula Geodésica';

  const cx = 218, cz = 558, angle = 0.42;
  const pearl = group(g, cx, cz, angle);

  // 1. Laje de Concreto em Formato de Gota Aerodinâmica (Conforme perola-do-cerrado.webp)
  const deckWidth = 42.0, deckDepth = 22.0;
  box(pearl, 0, 1.4, 0, deckWidth, 0.9, deckDepth, M.concrete);

  // 2. Pilotis Cilíndricos Elevando a Estrutura sobre a Água do Lago
  for (let x = -deckWidth / 2 + 3; x <= deckWidth / 2 - 3; x += 5.5) {
    for (const z of [-deckDepth / 2 + 2, deckDepth / 2 - 2]) {
      cylinder(pearl, x, -0.4, z, 0.45, 1.9, M.concreteDark, 16);
    }
  }

  // 3. Central Cúpula Elipsoidal Geodésica Metálica ("A Pérola")
  const dome = mesh(pearl, new T.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.glass);
  dome.scale.set(13.5, 6.2, 8.5);
  dome.position.set(-2.0, 1.85, 0);

  // Nervuras de Aço em Arco Cruzado
  for (let z = -7; z <= 7; z += 2.2) {
    const rHalf = 13.5 * Math.sqrt(Math.max(0, 1 - (z / 8.5) ** 2));
    for (let x = -rHalf; x < rHalf; x += 1.8) {
      const nx = Math.min(x + 1.8, rHalf);
      const y1 = 1.85 + 6.2 * Math.sqrt(Math.max(0, 1 - (x / 13.5) ** 2 - (z / 8.5) ** 2));
      const y2 = 1.85 + 6.2 * Math.sqrt(Math.max(0, 1 - (nx / 13.5) ** 2 - (z / 8.5) ** 2));
      beam(pearl, [x - 2, y1, z], [nx - 2, y2, z], 0.08, M.steelWhite);
    }
  }

  ring(pearl, -2.0, 1.9, 0, 11.0, 0.22, M.darkSteel);

  // 4. Rampa de Acesso Conectando ao Passeio da Orla
  const rampLen = 14.0;
  box(pearl, deckWidth / 2 + rampLen / 2 - 1, 0.8, -3, rampLen, 0.4, 4.5, M.pavingStone);

  // Guarda-corpo de Vidro na Borda Voltada para a Água
  for (let x = -deckWidth / 2 + 1; x <= deckWidth / 2 - 1; x += 3.5) {
    beam(pearl, [x, 2.3, deckDepth / 2 - 0.2], [x, 3.4, deckDepth / 2 - 0.2], 0.035, M.steelWhite);
  }
  beam(pearl, [-deckWidth / 2 + 1, 3.3, deckDepth / 2 - 0.2], [deckWidth / 2 - 1, 3.3, deckDepth / 2 - 0.2], 0.03, M.steelWhite);

  g.userData.detailViews = {
    cupula: {
      label: 'Ver cúpula metálica geodésica',
      footprint: [[cx - 22, cz - 20], [cx + 22, cz - 20], [cx + 22, cz + 20], [cx - 22, cz + 20]],
      height: 9,
      direction: [0.85, 0.55, 0.75]
    },
    orla: {
      label: 'Ver deque e pilotis sobre a água',
      footprint: [[cx - 26, cz - 22], [cx + 26, cz - 22], [cx + 26, cz + 22], [cx - 26, cz + 22]],
      height: 6.5,
      direction: [-0.85, 0.45, 0.65]
    }
  };
}

/* ========================================================================== */
/* 12. KARTÓDROMO - Instalações de Boxes, Grid FIA, Zebras e Barreiras de Pneu*/
/* ========================================================================== */
export function buildKartodromoRealistic(g) {
  const cx = 443, cz = 837;
  const kg = group(g, cx, cz);

  // 1. Pórtico de Largada Metálico com Semáforo de Corrida (Conforme kartodromo.webp)
  const gantryZ = -12;
  beam(kg, [-8.5, 0.35, gantryZ], [-8.5, 5.2, gantryZ], 0.14, M.darkSteel);
  beam(kg, [8.5, 0.35, gantryZ], [8.5, 5.2, gantryZ], 0.14, M.darkSteel);
  beam(kg, [-8.5, 5.0, gantryZ], [8.5, 5.0, gantryZ], 0.16, M.darkSteel);
  beam(kg, [-8.5, 4.2, gantryZ], [8.5, 4.2, gantryZ], 0.12, M.darkSteel);
  for (let x = -8; x < 8; x += 2) {
    beam(kg, [x, 4.2, gantryZ], [x + 2, 5.0, gantryZ], 0.05, M.white);
  }
  for (let k = -2; k <= 2; k++) {
    box(kg, k * 1.1, 4.6, gantryZ, 0.45, 0.7, 0.35, M.darkSteel);
    cylinder(kg, k * 1.1, 4.6, gantryZ + 0.18, 0.18, 0.08, M.curbRed);
  }

  // 2. Grid de Largada com Pintura no Asfalto e Karts Alinhados
  const kartColors = [M.coral, M.yellow, M.blue, M.cyan, M.white, M.darkSteel];
  for (let row = 0; row < 6; row++) {
    const kz = -18 - row * 4.2;
    const kx = row % 2 === 0 ? -2.2 : 2.2;
    box(kg, kx, 0.36, kz, 2.4, 0.015, 0.12, M.white, false);
    box(kg, kx - 1.2, 0.36, kz - 0.6, 0.12, 0.015, 1.2, M.white, false);
    box(kg, kx + 1.2, 0.36, kz - 0.6, 0.12, 0.015, 1.2, M.white, false);

    const kart = group(kg, kx, kz);
    box(kart, 0, 0.38, 0, 1.6, 0.35, 2.2, kartColors[row]);
    for (const [wx, wz] of [[-0.85, -0.65], [0.85, -0.65], [-0.85, 0.65], [0.85, 0.65]]) {
      cylinder(kart, wx, 0.36, wz, 0.24, 0.28, M.tireBlack, 12);
    }
    box(kart, 0, 0.65, 0.1, 0.45, 0.45, 0.4, M.darkSteel);
  }

  // 3. Zebras Curvas Alternadas em Vermelho e Branco (Conforme 08-kartodromo.png)
  const curbs = [
    [-18, 22, 1.2], [22, -8, -0.8], [15, 35, 0.6], [-12, -32, -1.1]
  ];
  curbs.forEach(([cxPos, czPos, cAngle]) => {
    const cGrp = group(kg, cxPos, czPos, cAngle);
    for (let c = 0; c < 12; c++) {
      box(cGrp, -5.5 + c * 0.95, 0.36, 0, 0.9, 0.08, 1.1, c % 2 === 0 ? M.curbRed : M.curbWhite);
    }
  });

  // 4. Barreiras de Pneus Protetoras nos Vértices
  for (const [tx, tz] of [[-20, 26], [24, -12], [18, 40]]) {
    for (let p = 0; p < 8; p++) {
      const px = tx + (p % 4) * 0.7;
      const pz = tz + Math.floor(p / 4) * 0.7;
      cylinder(kg, px, 0.36, pz, 0.35, 0.7, M.tireBlack, 12);
    }
  }

  // 5. Mureta Quadriculada dos Boxes com Tela de Proteção
  box(kg, 9.8, 0.36, -5, 0.35, 1.1, 48.0, M.darkSteel);
  for (let z = -28; z <= 18; z += 1.2) {
    box(kg, 10.0, 0.38, z, 0.02, 0.55, 0.6, (Math.round(z) % 2 === 0) ? M.white : M.darkSteel, false);
  }

  g.userData.detailViews = {
    boxes: {
      label: 'Ver edifício dos boxes',
      footprint: [[cx - 25, cz - 40], [cx + 25, cz - 40], [cx + 25, cz + 40], [cx - 25, cz + 40]],
      height: 10,
      direction: [1.0, 0.45, 0.5]
    },
    grid: {
      label: 'Ver grid de largada e karts',
      footprint: [[cx - 15, cz - 30], [cx + 15, cz - 30], [cx + 15, cz - 5], [cx - 15, cz - 5]],
      height: 5.5,
      direction: [-0.85, 0.45, 0.75]
    },
    arquibancada: {
      label: 'Ver arquibancada',
      footprint: [[cx - 30, cz - 20], [cx + 10, cz - 20], [cx + 10, cz + 20], [cx - 30, cz + 20]],
      height: 7,
      direction: [0.95, 0.6, 0.3]
    }
  };
}

/* ========================================================================== */
/* APLICAÇÃO GERAL DOS AMBIENTES REALISTAS                                    */
/* ========================================================================== */
export function applyRealisticEnvironments(models) {
  // 1. Pista de Motocross
  if (models.has('motocross')) {
    buildMotocrossRealistic(models.get('motocross'));
  }

  // 2. Arenas Beach
  if (models.has('arenas-beach')) {
    buildArenasBeachRealistic(models.get('arenas-beach'));
  }

  // 3. Wake Park
  if (models.has('wake-park')) {
    buildWakeParkRealistic(models.get('wake-park'));
  }

  // 4. Splash Parque
  if (models.has('splash-parque')) {
    buildSplashParkRealistic(models.get('splash-parque'));
  }

  // 5. Complexo Cultural (Árvore da Vida e Museus)
  if (models.has('arvore-da-vida')) {
    buildCulturalComplexRealistic(models.get('arvore-da-vida'), models.get('museus'));
  }

  // 6. Vila das Nações
  if (models.has('vila-das-nacoes')) {
    buildVilaDasNacoesRealistic(models.get('vila-das-nacoes'));
  }

  // 7. Centro de Eventos
  if (models.has('centro-de-eventos')) {
    buildCentroDeEventosRealistic(models.get('centro-de-eventos'));
  }

  // 8. AgroPlace
  if (models.has('agroplace')) {
    buildAgroPlaceRealistic(models.get('agroplace'));
  }

  // 9. Praça de Alimentação
  if (models.has('praca-de-alimentacao')) {
    buildPracaDeAlimentacaoRealistic(models.get('praca-de-alimentacao'));
  }

  // 10. Parque da Família
  if (models.has('parque-da-familia')) {
    buildParqueDaFamiliaRealistic(models.get('parque-da-familia'));
  }

  // 11. Pérola do Cerrado
  if (models.has('perola-do-cerrado')) {
    buildPerolaDoCerradoRealistic(models.get('perola-do-cerrado'));
  }

  // 12. Kartódromo
  if (models.has('kartodromo')) {
    buildKartodromoRealistic(models.get('kartodromo'));
  }
}
