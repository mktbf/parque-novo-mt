import * as T from 'three';

/**
 * PARQUE DA FAMÍLIA — Complexo de Lazer Infantil e Recreação
 * Modelagem de alta fidelidade baseada nas fotos aéreas oficiais de drone
 * (media_1791753917825_6c14ecd1.jpg, media_1791753917868_f8c732e0.jpg,
 * media_1791753917800_9fdde596.jpg e media_1791753917844_2f8d61d9.jpg).
 *
 * Características arquitetônicas reproduzidas:
 * 1. Piso emborrachado EPDM multicolorido com zonas artísticas lúdicas:
 *    - Zona oeste em asfalto/borracha preta (#1e2227) com marcações
 *    - Rio sinuoso central em azul royal (#1565c0) e núcleo profundo (#0d47a1)
 *    - Zonas vibrantes em laranja vivo (#f57c00), verde esmeralda (#2e7d32) e menta (#81c784)
 *    - Passarela sinuosa em tom areia com trampolins circulares brancos ("bolachas")
 * 2. Constelação icônica de coberturas tensionadas geométricas (12 coberturas):
 *    - Pilares tubulares brancos com treliças espaciais sob os beirais
 *    - Coberturas inclinadas/piramidais com cumeeiras elevadas e normais perfeitas
 *    - Grande pavilhão azul royal no setor leste
 *    - Coberturas em azul royal, laranja vivo, verde menta e azul céu
 * 3. Playgrounds modulares temáticos:
 *    - Avião bimotor no setor oeste (fuselagem laranja, asas duplas, hélice, tobogã espiral e reto)
 *    - Pórtico de entrada em túnel de treliça metálica branca arqueada
 *    - Grande Castelo Central com 4 torres cônicas, ponte pênsil amarela, tobogã espiral e escorregador duplo
 *    - Navio Pirata vermelho no leito do rio azul com mastro e gávea
 *    - Fortaleza Leste moderna sob a cobertura azul com tobogã espiral amarelo
 *    - Balanço duplo com estrutura em A azul e assentos amarelos
 *    - Cúpula geodésica verde de escalada (aranha)
 * 4. Mini-ferrovia infantil com leito de brita, dormentes de madeira, trilhos duplos e estaçãozinha
 * 5. Meio-fio perimetral de contenção, cerca de segurança preta e superpostes LED
 */

export const PARQUE_FAMILIA_VERSION = 'parque-familia-20261011-3';

const PAL = {
  blackRubber: '#1c1f24',
  blueRiver: '#1565c0',
  blueDeep: '#0d47a1',
  blueLight: '#29b6f6',
  blueCyan: '#00b0ff',
  orangeRubber: '#f57c00',
  orangeWarm: '#ff9800',
  greenRubber: '#2e7d32',
  greenMint: '#81c784',
  pathSand: '#dcd7ca',
  white: '#ffffff',
  steelWhite: '#f5f7fa',
  steelDark: '#263238',
  railMetal: '#546e7a',
  ballast: '#9e8c81',
  curb: '#d7d4cc',
  canopyBlue: '#1565c0',
  canopySky: '#0288d1',
  canopyOrange: '#ef6c00',
  canopyMint: '#43a047',
  canopyAmber: '#fbc02d',
  toyRed: '#e53935',
  toyYellow: '#fbc02d',
  toyBlue: '#1976d2',
  toyOrange: '#fb8c00',
  toyGreen: '#388e3c',
  stoneWall: '#b0a495',
  stoneDark: '#8d8070',
  woodTan: '#d7ccc8'
};

const matCache = new Map();
function getMat(color, roughness = 0.65, metalness = 0.08, doubleSide = false) {
  const key = `${color}_${roughness}_${metalness}_${doubleSide}`;
  if (!matCache.has(key)) {
    const m = new T.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      side: doubleSide ? T.DoubleSide : T.FrontSide
    });
    matCache.set(key, m);
  }
  return matCache.get(key);
}

function polyMesh(g, pts, color, y = 0.12, depth = 0.04) {
  const shape = new T.Shape();
  pts.forEach(([x, z], i) => i ? shape.lineTo(x, -z) : shape.moveTo(x, -z));
  shape.closePath();
  const geo = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const m = new T.Mesh(geo, getMat(color, 0.82, 0.02));
  m.position.y = y;
  m.receiveShadow = true;
  g.add(m);
  return m;
}

function boxMesh(g, x, y, z, w, h, d, color, rx = 0, ry = 0, rz = 0) {
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), getMat(color, 0.68, 0.06));
  m.position.set(x, y + h / 2, z);
  if (rx) m.rotation.x = rx;
  if (ry) m.rotation.y = ry;
  if (rz) m.rotation.z = rz;
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}

function cylMesh(g, x, y, z, r, h, color, rTop = r, segments = 16) {
  const m = new T.Mesh(new T.CylinderGeometry(rTop, r, h, segments), getMat(color, 0.65, 0.08));
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}

function beamMesh(g, a, b, r, color) {
  const pA = new T.Vector3(...a), pB = new T.Vector3(...b);
  const dir = pB.clone().sub(pA), len = dir.length();
  if (len < 0.001) return null;
  const m = new T.Mesh(new T.CylinderGeometry(r, r, len, 8), getMat(color, 0.5, 0.15));
  m.position.copy(pA).add(pB).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  g.add(m);
  return m;
}

/**
 * Cria uma cobertura geométrica arquitetônica tridimensional:
 * - Pilares de sustentação tubulares brancos com sapatas cinza
 * - Treliça metálica espacial branca (cordões superior, inferior e diagonais) sob as bordas
 * - Cobertura piramidal/inclinada com cumeeira/ápice elevado
 * - Facetas sólidas volumétricas com normais consistentes voltadas para fora
 */
function createShadeCanopy(root, corners, color, height = 5.8, tiltY = 0.5, peakOffset = 0.95) {
  const g = new T.Group();
  root.add(g);

  const N = corners.length;
  let cx = 0, cz = 0;
  corners.forEach(([x, z]) => { cx += x / N; cz += z / N; });

  const topPts = corners.map(([x, z], i) => {
    const postH = height + ((i % 2 === 0) ? tiltY : -tiltY * 0.6);
    cylMesh(g, x, 0.1, z, 0.13, postH, PAL.steelWhite, 0.11, 12);
    cylMesh(g, x, 0.1, z, 0.26, 0.22, PAL.steelDark, 0.22, 12);
    return [x, postH, z];
  });

  const avgH = topPts.reduce((acc, p) => acc + p[1], 0) / N;
  const apexPt = [cx, avgH + peakOffset, cz];

  const trussDepth = 0.45;
  for (let i = 0; i < N; i++) {
    const p1 = topPts[i], p2 = topPts[(i + 1) % N];
    const b1 = [p1[0], p1[1] - trussDepth, p1[2]];
    const b2 = [p2[0], p2[1] - trussDepth, p2[2]];

    beamMesh(g, p1, p2, 0.07, PAL.steelWhite);
    beamMesh(g, b1, b2, 0.05, PAL.steelWhite);

    const dist = Math.hypot(p2[0] - p1[0], p2[2] - p1[2]);
    const nBays = Math.max(2, Math.round(dist / 2.2));
    for (let k = 0; k < nBays; k++) {
      const tA = k / nBays, tB = (k + 1) / nBays;
      const topA = [p1[0] + (p2[0] - p1[0]) * tA, p1[1] + (p2[1] - p1[1]) * tA, p1[2] + (p2[2] - p1[2]) * tA];
      const botA = [b1[0] + (b2[0] - b1[0]) * tA, b1[1] + (b2[1] - b1[1]) * tA, b1[2] + (b2[2] - b1[2]) * tA];
      const topB = [p1[0] + (p2[0] - p1[0]) * tB, p1[1] + (p2[1] - p1[1]) * tB, p1[2] + (p2[2] - p1[2]) * tB];
      const botB = [b1[0] + (b2[0] - b1[0]) * tB, b1[1] + (b2[1] - b1[1]) * tB, b1[2] + (b2[2] - b1[2]) * tB];

      beamMesh(g, topA, botB, 0.03, PAL.steelWhite);
      beamMesh(g, botA, topB, 0.03, PAL.steelWhite);
    }

    beamMesh(g, p1, apexPt, 0.06, PAL.steelWhite);
  }

  const geom = new T.BufferGeometry();
  const verts = [];
  const indices = [];
  const thickness = 0.06;

  for (let i = 0; i < N; i++) {
    const p1 = topPts[i], p2 = topPts[(i + 1) % N];
    const v12 = new T.Vector3(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]);
    const v1A = new T.Vector3(apexPt[0] - p1[0], apexPt[1] - p1[1], apexPt[2] - p1[2]);
    const cross = new T.Vector3().crossVectors(v12, v1A);
    const ccw = cross.y >= 0;
    const normal = cross.clone().normalize();
    if (!ccw) normal.negate();

    const offset = normal.clone().multiplyScalar(thickness / 2);
    const baseIdx = verts.length / 3;

    verts.push(p1[0] + offset.x, p1[1] + offset.y, p1[2] + offset.z);
    verts.push(p2[0] + offset.x, p2[1] + offset.y, p2[2] + offset.z);
    verts.push(apexPt[0] + offset.x, apexPt[1] + offset.y, apexPt[2] + offset.z);

    verts.push(p1[0] - offset.x, p1[1] - offset.y, p1[2] - offset.z);
    verts.push(p2[0] - offset.x, p2[1] - offset.y, p2[2] - offset.z);
    verts.push(apexPt[0] - offset.x, apexPt[1] - offset.y, apexPt[2] - offset.z);

    if (ccw) {
      indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      indices.push(baseIdx + 3, baseIdx + 5, baseIdx + 4);
    } else {
      indices.push(baseIdx, baseIdx + 2, baseIdx + 1);
      indices.push(baseIdx + 3, baseIdx + 4, baseIdx + 5);
    }

    indices.push(baseIdx, baseIdx + 3, baseIdx + 4);
    indices.push(baseIdx, baseIdx + 4, baseIdx + 1);
  }

  geom.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  const fabricMat = getMat(color, 0.40, 0.05);
  const sail = new T.Mesh(geom, fabricMat);
  sail.castShadow = true;
  sail.receiveShadow = true;
  g.add(sail);

  return g;
}

/**
 * Construtor principal do Parque da Família
 */
export function buildParqueFamilia(fam) {
  fam.clear();
  fam.name = 'Parque da Família · Playgrounds, Toldos e Piso Lúdico';

  // =========================================================================
  // 1. MEIO-FIO PERIMETRAL E CERCA DE SEGURANÇA
  // =========================================================================
  const perimeter = [
    [328, 539],
    [324, 544],
    [314, 550],
    [300, 555],
    [285, 563],
    [270, 568],
    [256, 574],
    [244, 575],
    [234, 565],
    [233, 547],
    [242, 540],
    [256, 536],
    [275, 534],
    [294, 535],
    [312, 536]
  ];

  for (let i = 0; i < perimeter.length; i++) {
    const p1 = perimeter[i], p2 = perimeter[(i + 1) % perimeter.length];
    const dx = p2[0] - p1[0], dz = p2[1] - p1[1], len = Math.hypot(dx, dz) || 1;
    const mx = (p1[0] + p2[0]) / 2, mz = (p1[1] + p2[1]) / 2;
    const ang = Math.atan2(dx, dz);
    const curb = boxMesh(fam, mx, 0.06, mz, 0.45, 0.22, len, PAL.curb);
    curb.rotation.y = ang;

    const nPosts = Math.max(2, Math.round(len / 3.0));
    for (let k = 0; k <= nPosts; k++) {
      const t = k / nPosts;
      const px = p1[0] + dx * t, pz = p1[1] + dz * t;
      cylMesh(fam, px, 0.2, pz, 0.045, 1.25, PAL.steelDark);
    }
    beamMesh(fam, [p1[0], 0.6, p1[1]], [p2[0], 0.6, p2[1]], 0.025, PAL.steelDark);
    beamMesh(fam, [p1[0], 1.25, p1[1]], [p2[0], 1.25, p2[1]], 0.035, PAL.steelDark);
  }

  // =========================================================================
  // 2. PISO EMBORRACHADO EPDM MULTICOLORIDO (FOTOS 3 E 4)
  // =========================================================================

  // A. Setor Oeste em Borracha Preta/Carvão (Área do Avião e Balanços)
  const blackZone = [
    [328, 539],
    [324, 544],
    [314, 550],
    [300, 554],
    [295, 554],
    [293, 536],
    [312, 536]
  ];
  polyMesh(fam, blackZone, PAL.blackRubber, 0.12, 0.05);

  const chalkLines = [
    [[318, 542], [324, 540]],
    [[314, 546], [320, 544]],
    [[308, 543], [308, 548]],
    [[304, 541], [304, 547]]
  ];
  chalkLines.forEach(([p1, p2]) => beamMesh(fam, [p1[0], 0.18, p1[1]], [p2[0], 0.18, p2[1]], 0.05, '#ffffff'));

  // B. Rio Sinuoso Azul Vibrante (Atravessando o centro até o leste)
  const blueRiverOuter = [
    [295, 554],
    [288, 558],
    [278, 563],
    [268, 565],
    [256, 568],
    [246, 568],
    [237, 563],
    [235, 556],
    [237, 550],
    [246, 552],
    [256, 557],
    [268, 554],
    [280, 549],
    [290, 547],
    [293, 536],
    [295, 554]
  ];
  polyMesh(fam, blueRiverOuter, PAL.blueRiver, 0.125, 0.05);

  const blueDeepCore = [
    [285, 556],
    [276, 560],
    [266, 561],
    [255, 564],
    [245, 562],
    [242, 556],
    [252, 556],
    [265, 554],
    [276, 552]
  ];
  polyMesh(fam, blueDeepCore, PAL.blueDeep, 0.128, 0.05);

  // C. Setor Laranja Vivo (Sul e Centro do parquinho)
  const orangeZone = [
    [293, 536],
    [290, 547],
    [280, 549],
    [268, 554],
    [258, 552],
    [248, 544],
    [240, 541],
    [256, 536],
    [275, 534],
    [293, 536]
  ];
  polyMesh(fam, orangeZone, PAL.orangeRubber, 0.122, 0.05);

  // D. Setores Verde Bandeira e Verde Menta (Norte e Leste)
  const greenNorthZone = [
    [300, 555],
    [285, 563],
    [270, 568],
    [268, 565],
    [278, 563],
    [288, 558],
    [295, 554]
  ];
  polyMesh(fam, greenNorthZone, PAL.greenRubber, 0.122, 0.05);

  const greenEastZone = [
    [270, 568],
    [256, 574],
    [244, 575],
    [234, 565],
    [237, 563],
    [246, 568],
    [256, 568]
  ];
  polyMesh(fam, greenEastZone, PAL.greenMint, 0.122, 0.05);

  // E. Passarela / Caminho Sinuoso em Tom Areia com Círculos Brancos ("Bolachas")
  const pathSand = [
    [290, 549],
    [282, 553],
    [272, 555],
    [262, 556],
    [255, 553],
    [260, 550],
    [270, 548],
    [280, 546]
  ];
  polyMesh(fam, pathSand, PAL.pathSand, 0.13, 0.05);

  // Discos / trampolins circulares (borda branca com centro de salto emborrachado)
  const steppingCircles = [
    [287, 551, 0.95],
    [283, 553, 0.85],
    [278, 554, 1.15],
    [274, 556, 0.90],
    [268, 558, 1.05],
    [264, 559, 0.80],
    [259, 561, 0.95],
    [253, 561, 0.85],
    [247, 558, 1.05],
    [244, 554, 0.75]
  ];
  steppingCircles.forEach(([cx, cz, cr]) => {
    cylMesh(fam, cx, 0.135, cz, cr, 0.03, PAL.white, cr, 20);
    cylMesh(fam, cx, 0.138, cz, cr * 0.72, 0.035, '#37474f', cr * 0.72, 20);
  });

  // =========================================================================
  // 3. CONSTELAÇÃO DE COBERTURAS TENSIONADAS E TRELIÇADAS (FOTOS 3, 4 E 5)
  // =========================================================================

  // T1: Triângulo Azul Vivo (Setor Oeste, no piso preto)
  createShadeCanopy(fam, [
    [314, 538],
    [301, 536],
    [309, 545]
  ], PAL.canopyBlue, 5.5, 0.5, 0.9);

  // T2: Triângulo Verde Menta (Noroeste)
  createShadeCanopy(fam, [
    [296, 556],
    [285, 562],
    [289, 551]
  ], PAL.canopyMint, 6.2, 0.6, 0.95);

  // T3: LOSANGO/DIAMANTE AZUL ROYAL (Centro-Oeste — Peça central marcante da foto 3)
  createShadeCanopy(fam, [
    [290, 548],
    [283, 555],
    [276, 548],
    [283, 541]
  ], PAL.canopyBlue, 6.8, 0.8, 1.25);

  // T4: Triângulo Laranja Vivo (Centro-Norte)
  createShadeCanopy(fam, [
    [279, 558],
    [269, 562],
    [273, 551]
  ], PAL.canopyOrange, 6.0, 0.5, 0.9);

  // T5: Triângulo Azul Claro / Céu (Centro)
  createShadeCanopy(fam, [
    [275, 552],
    [266, 548],
    [271, 542]
  ], PAL.canopySky, 5.8, 0.4, 0.85);

  // T6: Triângulo Verde Menta (Centro-Sul)
  createShadeCanopy(fam, [
    [276, 548],
    [267, 543],
    [271, 551]
  ], PAL.canopyMint, 5.5, 0.5, 0.85);

  // T7: Triângulo Laranja Vivo (Sul)
  createShadeCanopy(fam, [
    [282, 543],
    [273, 537],
    [279, 534]
  ], PAL.canopyOrange, 5.3, 0.4, 0.8);

  // T8: Triângulo Azul Claro (Sul)
  createShadeCanopy(fam, [
    [273, 537],
    [263, 535],
    [267, 542]
  ], PAL.canopySky, 5.4, 0.4, 0.8);

  // T9: Triângulo Verde Menta (Centro-Leste)
  createShadeCanopy(fam, [
    [266, 554],
    [255, 559],
    [259, 549]
  ], PAL.canopyMint, 6.3, 0.6, 1.0);

  // T10: Triângulo Laranja / Âmbar Monumental (Leste-Sul)
  createShadeCanopy(fam, [
    [261, 548],
    [249, 542],
    [255, 553]
  ], PAL.canopyOrange, 6.0, 0.5, 0.95);

  // T11: Triângulo Azul Céu (Leste)
  createShadeCanopy(fam, [
    [253, 545],
    [243, 540],
    [248, 548]
  ], PAL.canopySky, 5.6, 0.5, 0.85);

  // T12: GRANDE PAVILHÃO AZUL ROYAL (Extremo Leste, cobrindo o castelo leste)
  // Reproduz o proeminente telhado azul com 4 águas visto em media_1791753917868_f8c732e0.jpg
  createShadeCanopy(fam, [
    [246, 566],
    [235, 562],
    [238, 551],
    [249, 555]
  ], PAL.canopyBlue, 6.7, 0.6, 1.35);

  // T13: Triângulo Verde Claro (Nordeste)
  createShadeCanopy(fam, [
    [255, 566],
    [246, 573],
    [248, 562]
  ], PAL.canopyMint, 5.8, 0.5, 0.85);

  // =========================================================================
  // 4. BRINQUEDOS E PLAYGROUNDS MODULARES REAIS
  // =========================================================================

  // A. PLAYGROUND TEMÁTICO EM FORMATO DE AVIÃO (Setor Oeste, no piso preto)
  const planeG = new T.Group();
  planeG.position.set(321, 0.15, 543);
  planeG.rotation.y = 0.28;
  fam.add(planeG);

  // Fuselagem tubular e cabine
  boxMesh(planeG, 0, 0.4, 0, 6.8, 1.8, 1.8, PAL.toyOrange);
  cylMesh(planeG, 3.4, 0.4, 0, 0.9, 1.5, PAL.toyYellow, 0.2, 16); // Bico cônico
  boxMesh(planeG, 0.8, 1.6, 0, 2.2, 0.8, 1.5, PAL.blueLight); // Cabine com janelas

  // Hélice frontal giratória branca e amarela
  cylMesh(planeG, 4.2, 1.3, 0, 0.2, 0.25, PAL.steelDark, 0.2, 12);
  boxMesh(planeG, 4.25, 0.5, 0, 0.1, 1.8, 0.25, PAL.white);

  // Asas duplas (Biplano real da foto 2)
  boxMesh(planeG, 0.5, 0.5, 0, 1.4, 0.18, 7.6, PAL.toyOrange); // Asa inferior
  boxMesh(planeG, 0.5, 1.9, 0, 1.5, 0.18, 8.0, PAL.white); // Asa superior branca
  for (const wingZ of [-3.2, -1.8, 1.8, 3.2]) {
    beamMesh(planeG, [0.5, 0.6, wingZ], [0.5, 1.9, wingZ], 0.045, PAL.toyBlue);
  }

  // Pontas das asas azuis
  boxMesh(planeG, 0.5, 1.9, -4.0, 1.5, 0.24, 0.35, PAL.toyBlue);
  boxMesh(planeG, 0.5, 1.9, 4.0, 1.5, 0.24, 0.35, PAL.toyBlue);

  // Turbinas sob as asas
  cylMesh(planeG, 0.4, 0.4, -2.1, 0.35, 1.2, PAL.steelDark, 0.35, 12);
  cylMesh(planeG, 0.4, 0.4, 2.1, 0.35, 1.2, PAL.steelDark, 0.35, 12);

  // Leme de cauda e estabilizador horizontal
  boxMesh(planeG, -3.0, 1.5, 0, 1.2, 1.6, 0.22, PAL.toyRed);
  boxMesh(planeG, -2.8, 1.4, 0, 0.9, 0.16, 2.6, PAL.toyYellow);

  // Escorregador reto amarelo saindo da fuselagem
  beamMesh(planeG, [1.0, 1.2, 1.2], [3.4, 0.15, 2.4], 0.38, PAL.toyYellow);

  // Tobogã espiral laranja saindo do compartimento traseiro
  const planeSpiral = [];
  for (let s = 0; s <= 16; s++) {
    const t = s / 16;
    const ang = t * Math.PI * 1.8;
    const rad = 1.3 - t * 0.2;
    planeSpiral.push(new T.Vector3(-2.8 + Math.cos(ang) * rad, 1.4 * (1 - t) + 0.15, -1.2 + Math.sin(ang) * rad));
  }
  planeG.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(planeSpiral), 24, 0.32, 10, false), getMat(PAL.toyOrange, 0.5, 0.05)));

  // Escadas de acesso na cauda
  for (let s = 0; s < 4; s++) {
    boxMesh(planeG, -3.6 - s * 0.4, s * 0.3, 0, 0.4, 0.1, 1.2, PAL.woodTan);
  }

  // B. PÓRTICO DE ENTRADA EM TÚNEL DE TRELIÇA METÁLICA (Foto 2, entrada noroeste)
  const archTunnelG = new T.Group();
  archTunnelG.position.set(315, 0.15, 549);
  archTunnelG.rotation.y = -0.42;
  fam.add(archTunnelG);

  for (let a = -2; a <= 2; a++) {
    const az = a * 1.3;
    for (let deg = 0; deg <= 180; deg += 30) {
      const rad1 = deg * Math.PI / 180, rad2 = (deg + 30) * Math.PI / 180;
      const x1 = Math.cos(rad1) * 2.3, y1 = Math.sin(rad1) * 2.8;
      const x2 = Math.cos(rad2) * 2.3, y2 = Math.sin(rad2) * 2.8;
      beamMesh(archTunnelG, [x1, y1, az], [x2, y2, az], 0.065, PAL.white);
      if (a < 2) beamMesh(archTunnelG, [x1, y1, az], [x1, y1, az + 1.3], 0.045, PAL.white);
    }
  }

  // C. BALANÇOS E GANGORRAS (Setor Oeste, no piso preto)
  const swingG = new T.Group();
  swingG.position.set(304, 0.15, 543);
  fam.add(swingG);
  for (const sx of [-3.2, 3.2]) {
    beamMesh(swingG, [sx, 0.1, -1.2], [sx, 2.8, 0], 0.07, PAL.toyBlue);
    beamMesh(swingG, [sx, 0.1, 1.2], [sx, 2.8, 0], 0.07, PAL.toyBlue);
  }
  beamMesh(swingG, [-3.3, 2.8, 0], [3.3, 2.8, 0], 0.09, PAL.toyBlue);
  for (let sw = -2; sw <= 2; sw += 1.3) {
    beamMesh(swingG, [sw, 2.8, 0], [sw, 0.6, 0], 0.018, '#ffffff');
    boxMesh(swingG, sw, 0.45, 0, 0.5, 0.08, 0.25, PAL.toyYellow);
  }

  // Brinquedos de mola e carrosséis no piso preto
  for (const [bx, bz, bc] of [[310, 545, PAL.toyRed], [308, 541, PAL.toyYellow], [314, 543, PAL.toyGreen]]) {
    cylMesh(fam, bx, 0.15, bz, 0.08, 0.6, PAL.steelDark);
    boxMesh(fam, bx, 0.7, bz, 0.6, 0.45, 0.3, bc);
  }

  // D. GRANDE CASTELO CENTRAL COM TORRES E TOBOGÃS (Fotos 2, 3 e 5)
  const castleG = new T.Group();
  castleG.position.set(271, 0.15, 548);
  fam.add(castleG);

  // 4 Torres principais de castelo em tom de pedra com ameias e cones coloridos
  const castleTowers = [
    [-3.8, -2.2, 4.8, PAL.toyRed],
    [3.8, -2.2, 4.5, PAL.toyYellow],
    [-2.8, 2.4, 4.2, PAL.toyOrange],
    [3.2, 2.6, 5.0, PAL.toyGreen]
  ];

  castleTowers.forEach(([tx, tz, th, roofColor]) => {
    boxMesh(castleG, tx, 0, tz, 2.2, th, 2.2, PAL.stoneWall);
    for (let side = -1; side <= 1; side += 2) {
      boxMesh(castleG, tx + side * 1.1, th, tz, 0.15, 0.5, 2.2, PAL.stoneDark);
      boxMesh(castleG, tx, th, tz + side * 1.1, 2.2, 0.5, 0.15, PAL.stoneDark);
    }
    const roofGeo = new T.ConeGeometry(1.8, 2.0, 4);
    const roof = new T.Mesh(roofGeo, getMat(roofColor, 0.6, 0.05));
    roof.position.set(tx, th + 1.0, tz);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    castleG.add(roof);

    cylMesh(castleG, tx, th + 2.0, tz, 0.03, 0.8, PAL.steelDark);
    boxMesh(castleG, tx + 0.25, th + 2.4, tz, 0.45, 0.3, 0.02, PAL.toyRed);
  });

  // Passarela suspensa e ponte pênsil amarela
  boxMesh(castleG, 0, 2.2, -2.2, 6.2, 0.25, 1.4, PAL.woodTan);
  beamMesh(castleG, [-3.5, 3.2, -1.5], [3.5, 3.2, -1.5], 0.06, PAL.toyYellow);
  beamMesh(castleG, [-3.5, 3.2, -2.9], [3.5, 3.2, -2.9], 0.06, PAL.toyYellow);
  for (let r = -3.0; r <= 3.0; r += 0.8) {
    beamMesh(castleG, [r, 2.3, -1.5], [r, 3.2, -1.5], 0.02, PAL.toyYellow);
    beamMesh(castleG, [r, 2.3, -2.9], [r, 3.2, -2.9], 0.02, PAL.toyYellow);
  }

  // Túnel de rastreamento lúdico laranja
  const crawlTube = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 5.0, 16), getMat(PAL.toyOrange, 0.5, 0.05));
  crawlTube.position.set(0, 2.6, 2.5);
  crawlTube.rotation.z = Math.PI / 2;
  crawlTube.castShadow = true;
  castleG.add(crawlTube);

  // Tobogã Espiral Amarelo Gigante
  const spiralPts = [];
  for (let step = 0; step <= 24; step++) {
    const t = step / 24;
    const ang = t * Math.PI * 2.8;
    const rad = 2.2 - t * 0.4;
    const sx = 3.5 + Math.cos(ang) * rad;
    const sy = 4.2 * (1 - t) + 0.3;
    const sz = 2.6 + Math.sin(ang) * rad;
    spiralPts.push(new T.Vector3(sx, sy, sz));
  }
  const spiralCurve = new T.CatmullRomCurve3(spiralPts);
  const spiralMesh = new T.Mesh(
    new T.TubeGeometry(spiralCurve, 40, 0.48, 12, false),
    getMat(PAL.toyYellow, 0.5, 0.05)
  );
  spiralMesh.castShadow = true;
  castleG.add(spiralMesh);

  // Escorregadores duplos retos vermelhos e laranjas
  beamMesh(castleG, [-3.8, 2.5, -3.2], [-3.8, 0.15, -6.5], 0.42, PAL.toyRed);
  beamMesh(castleG, [-2.8, 2.5, -3.2], [-2.8, 0.15, -6.5], 0.42, PAL.toyOrange);

  // E. NAVIO PIRATA LÚDICO (No leito do rio azul, X=266, Z=556)
  const shipG = new T.Group();
  shipG.position.set(266, 0.15, 556);
  shipG.rotation.y = 0.55;
  fam.add(shipG);

  boxMesh(shipG, 0, 0.6, 0, 4.8, 1.2, 2.2, PAL.toyRed);
  cylMesh(shipG, 2.6, 0.6, 0, 1.1, 1.2, PAL.toyRed, 0.2, 12);
  cylMesh(shipG, 0, 0.6, 0, 0.1, 4.2, PAL.woodTan);
  cylMesh(shipG, 0, 3.4, 0, 0.7, 0.5, PAL.woodTan, 0.6, 12);
  beamMesh(shipG, [2.5, 1.0, 0], [4.6, 0.15, 0], 0.34, PAL.blueLight);
  beamMesh(shipG, [-2.2, 1.0, 0], [-4.0, 0.15, 0], 0.34, PAL.toyRed);

  // F. CÚPULA GEODÉSICA DE ESCALADA / TEIA DE ARANHA (X=273, Z=558)
  const domeClimberG = new T.Group();
  domeClimberG.position.set(273, 0.15, 558);
  fam.add(domeClimberG);
  for (let ring = 1; ring <= 3; ring++) {
    const rad = 2.4 - ring * 0.6;
    const rH = ring * 0.7;
    for (let seg = 0; seg < 8; seg++) {
      const a1 = seg * Math.PI / 4, a2 = (seg + 1) * Math.PI / 4;
      const x1 = Math.cos(a1) * rad, z1 = Math.sin(a1) * rad;
      const x2 = Math.cos(a2) * rad, z2 = Math.sin(a2) * rad;
      beamMesh(domeClimberG, [x1, rH, z1], [x2, rH, z2], 0.035, PAL.toyGreen);
      if (ring > 1) {
        const radPrev = 2.4 - (ring - 1) * 0.6;
        const xPrev = Math.cos(a1) * radPrev, zPrev = Math.sin(a1) * radPrev;
        beamMesh(domeClimberG, [xPrev, (ring - 1) * 0.7, zPrev], [x1, rH, z1], 0.035, PAL.toyGreen);
      }
    }
  }

  // G. FORTALEZA LESTE MODERNA (Sob a grande cobertura azul, X=240, Z=558)
  const eastFortG = new T.Group();
  eastFortG.position.set(240, 0.15, 558);
  fam.add(eastFortG);

  for (const [tx, tz, tc] of [[-2.2, -1.6, '#90a4ae'], [2.2, -1.6, '#90a4ae'], [0, 2.2, '#78909c']]) {
    boxMesh(eastFortG, tx, 0, tz, 2.2, 4.2, 2.2, tc);
    const roof = new T.Mesh(new T.ConeGeometry(1.7, 1.8, 6), getMat(PAL.toyYellow, 0.6, 0.05));
    roof.position.set(tx, 5.1, tz);
    roof.castShadow = true;
    eastFortG.add(roof);
    for (const hY of [1.6, 2.8]) {
      cylMesh(eastFortG, tx + 1.15, hY, tz, 0.35, 0.1, PAL.toyBlue, 0.35);
      cylMesh(eastFortG, tx + 1.15, hY, tz, 0.22, 0.12, PAL.steelDark, 0.22);
    }
  }
  boxMesh(eastFortG, 0, 1.8, 0, 4.2, 0.25, 2.4, PAL.woodTan);

  // Tobogã espiral amarelo na fortaleza leste
  const eastSpiral = [];
  for (let s = 0; s <= 20; s++) {
    const t = s / 20;
    const ang = t * Math.PI * 2.2;
    const rad = 1.8 - t * 0.3;
    eastSpiral.push(new T.Vector3(2.2 + Math.cos(ang) * rad, 3.8 * (1 - t) + 0.2, -1.6 + Math.sin(ang) * rad));
  }
  eastFortG.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(eastSpiral), 30, 0.42, 12, false), getMat(PAL.toyYellow, 0.5, 0.05)));
  beamMesh(eastFortG, [-2.2, 2.0, 1.1], [-2.2, 0.15, 4.5], 0.38, '#90a4ae');

  // =========================================================================
  // 5. MINI-FERROVIA INFANTIL AO LONGO DA ORLA (FOTOS 2 E 3)
  // =========================================================================
  const trainTrackPts = [
    [324, 536.5],
    [314, 534.5],
    [302, 533.0],
    [290, 532.5],
    [278, 531.5],
    [266, 532.0],
    [254, 533.5],
    [242, 536.0],
    [235, 542.0]
  ];

  for (let i = 0; i < trainTrackPts.length - 1; i++) {
    const p1 = trainTrackPts[i], p2 = trainTrackPts[i + 1];
    const dx = p2[0] - p1[0], dz = p2[1] - p1[1], len = Math.hypot(dx, dz) || 1;
    const mx = (p1[0] + p2[0]) / 2, mz = (p1[1] + p2[1]) / 2;
    const ang = Math.atan2(dx, dz);
    const ballastMesh = boxMesh(fam, mx, 0.06, mz, 1.8, 0.16, len, PAL.ballast);
    ballastMesh.rotation.y = ang;

    const nSleepers = Math.max(3, Math.round(len / 1.1));
    for (let k = 0; k <= nSleepers; k++) {
      const t = k / nSleepers;
      const sx = p1[0] + dx * t, sz = p1[1] + dz * t;
      const sleeper = boxMesh(fam, sx, 0.14, sz, 1.4, 0.08, 0.22, '#5d4037');
      sleeper.rotation.y = ang;
    }

    const nx = -dz / len * 0.45, nz = dx / len * 0.45;
    beamMesh(fam, [p1[0] + nx, 0.22, p1[1] + nz], [p2[0] + nx, 0.22, p2[1] + nz], 0.035, PAL.railMetal);
    beamMesh(fam, [p1[0] - nx, 0.22, p1[1] - nz], [p2[0] - nx, 0.22, p2[1] - nz], 0.035, PAL.railMetal);
  }

  // Estaçãozinha da ferrovia
  const stationG = new T.Group();
  stationG.position.set(280, 0.15, 531);
  fam.add(stationG);
  boxMesh(stationG, 0, 0.1, 0, 6.0, 0.35, 2.4, PAL.curb);
  for (const cx of [-2.4, 2.4]) {
    cylMesh(stationG, cx, 0.4, 0, 0.08, 2.8, PAL.steelWhite);
  }
  boxMesh(stationG, 0, 3.2, 0, 6.5, 0.18, 2.8, PAL.toyRed);

  // =========================================================================
  // 6. SUPERPOSTES DE ILUMINAÇÃO DO PARQUE (FOTO 2)
  // =========================================================================
  const lightingMasts = [
    [316, 548],
    [296, 560],
    [272, 567],
    [248, 572],
    [268, 535],
    [292, 534]
  ];
  lightingMasts.forEach(([lx, lz]) => {
    cylMesh(fam, lx, 0.1, lz, 0.18, 8.5, PAL.steelWhite, 0.10);
    cylMesh(fam, lx, 8.5, lz, 0.45, 0.25, PAL.steelDark, 0.45);
    for (let a = 0; a < 4; a++) {
      const ang = a * Math.PI / 2;
      boxMesh(fam, lx + Math.cos(ang) * 0.55, 8.55, lz + Math.sin(ang) * 0.55, 0.35, 0.15, 0.25, '#ffffff');
    }
  });

  return fam;
}
