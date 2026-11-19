import * as T from 'three';

export const foliageUniforms = {
  uTime: { value: 0 },
  uSunDir: { value: new T.Vector3(-0.48, 0.8, 0.34).normalize() }
};

/**
 * Copas volumétricas com normais esféricas misturadas (65% radial global + 35% local),
 * Ambient Occlusion gravado em vertex colors (base/miolo sombreados e topo externo quente)
 * e geometria indexada compacta para máximo desempenho em InstancedMesh.
 */
export function createCanopyGeometry(small = false) {
  const positions = [];
  const normals = [];
  const colors = [];
  const uv = [];
  const indices = [];

  const o = new T.Object3D();
  const vPos = new T.Vector3();
  const vLocalN = new T.Vector3();
  const vRadialN = new T.Vector3();
  const normalMat = new T.Matrix3();
  const canopyCenter = new T.Vector3(0, -0.16, 0);

  // Sub-volumes orgânicos de folhagem
  const lobeCount = small ? 6 : 11;
  const detail = small ? 0 : 1;
  const baseIco = new T.IcosahedronGeometry(1, detail);
  const srcPos = baseIco.attributes.position;
  const srcNorm = baseIco.attributes.normal;
  const srcIdx = baseIco.index;

  for (let i = 0; i < lobeCount; i++) {
    const golden = i * 2.39996323;
    const t = (i + 0.5) / lobeCount;
    const radialDist = i === lobeCount - 1 ? 0.06 : 0.62 * Math.sqrt(t);
    const lobeY = Math.sin(i * 1.73) * 0.20 + (1 - Math.sqrt(t)) * 0.26 - 0.04;

    o.position.set(
      Math.cos(golden) * radialDist,
      lobeY,
      Math.sin(golden) * radialDist
    );
    const sx = 0.48 + 0.07 * Math.sin(i * 1.3);
    const sy = 0.52 + 0.08 * Math.cos(i * 2.1);
    const sz = 0.48 + 0.06 * Math.cos(i * 1.7);
    o.scale.set(sx, sy, sz);
    o.rotation.set(0.19 * i, golden, 0.14 * i);
    o.updateMatrix();
    normalMat.getNormalMatrix(o.matrix);

    const vOffset = positions.length / 3;
    const lobeTint = ((i * 7) % 11) / 10; // 0..1 variação sutil entre tufos

    for (let j = 0; j < srcPos.count; j++) {
      vPos.fromBufferAttribute(srcPos, j).applyMatrix4(o.matrix);
      vLocalN.fromBufferAttribute(srcNorm, j).applyMatrix3(normalMat).normalize();

      // Normal radial suave da copa inteira evita o aspecto de "bolinhas facetadas"
      vRadialN.copy(vPos).sub(canopyCenter);
      if (vRadialN.lengthSq() > 1e-6) vRadialN.normalize();
      else vRadialN.set(0, 1, 0);

      vLocalN.lerp(vRadialN, 0.66).normalize();

      positions.push(vPos.x, vPos.y, vPos.z);
      normals.push(vLocalN.x, vLocalN.y, vLocalN.z);

      // Ambient Occlusion interno (radial + vertical) gravado nas cores de vértice
      const heightFactor = T.MathUtils.clamp((vPos.y + 0.62) / 1.38, 0, 1);
      const shellDist = T.MathUtils.clamp(vPos.length() / 0.98, 0, 1);
      const ao = T.MathUtils.lerp(0.46, 1.0, 0.56 * heightFactor + 0.44 * shellDist);
      const sunWarmth = Math.pow(heightFactor, 1.6) * 0.09;
      const micro = 0.95 + 0.08 * lobeTint;

      const rCol = (ao + sunWarmth * 1.05) * micro;
      const gCol = (ao + sunWarmth * 0.85) * micro;
      const bCol = (ao * 0.90 + sunWarmth * 0.25) * micro;

      colors.push(rCol, gCol, bCol);
      uv.push(vPos.x * 0.5 + 0.5, vPos.z * 0.5 + 0.5);
    }

    if (srcIdx) {
      for (let k = 0; k < srcIdx.count; k++) {
        indices.push(vOffset + srcIdx.getX(k));
      }
    } else {
      for (let k = 0; k < srcPos.count; k++) {
        indices.push(vOffset + k);
      }
    }
  }
  baseIco.dispose();

  // Folhas periféricas indexadas (frente e verso com normais suaves e sem alpha-test pesado)
  const leafCount = small ? 22 : 68;
  const vA = new T.Vector3();
  const vB = new T.Vector3();
  const vC = new T.Vector3();
  const vFaceN = new T.Vector3();

  for (let i = 0; i < leafCount; i++) {
    const a = i * 2.39996323;
    const u = (i + 0.5) / leafCount;
    const y = (u - 0.46) * 1.12;
    const r = Math.sqrt(Math.max(0.06, 1 - y * y * 0.88)) * (0.68 + 0.18 * Math.sin(i * 7.17) ** 2);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;

    const length = 0.105 + 0.045 * Math.cos(i * 4.1) ** 2;
    const width = 0.062;
    const ax = Math.cos(a);
    const az = Math.sin(a);
    const bx = -az;
    const bz = ax;
    const droop = -0.025 * (1 - u);

    const pts = [
      [x - ax * length * 0.8, y - 0.01, z - az * length * 0.8],
      [x + bx * width, y + 0.048, z + bz * width],
      [x + ax * length * 1.15, y + 0.02 + droop, z + az * length * 1.15],
      [x - bx * width, y - 0.012, z - bz * width]
    ];

    vA.fromArray(pts[0]);
    vB.fromArray(pts[1]).sub(vA);
    vC.fromArray(pts[2]).sub(vA);
    vFaceN.copy(vB).cross(vC).normalize();

    const heightFactor = T.MathUtils.clamp((y + 0.62) / 1.38, 0, 1);
    const ao = T.MathUtils.lerp(0.58, 1.06, heightFactor);
    const warm = Math.pow(heightFactor, 1.5) * 0.08;
    const leafVar = 0.94 + (i % 5) * 0.028;
    const lr = (ao + warm) * leafVar;
    const lg = (ao + warm * 0.82) * leafVar;
    const lb = ao * 0.88 * leafVar;

    // Duas faces (superior e inferior) com 4 vértices cada para manter geometria 100% indexada
    for (const sign of [1, -1]) {
      const base = positions.length / 3;
      for (let k = 0; k < 4; k++) {
        const px = pts[k][0];
        const py = pts[k][1];
        const pz = pts[k][2];
        vRadialN.set(px, py - canopyCenter.y, pz).normalize();
        vLocalN.copy(vFaceN).multiplyScalar(sign).lerp(vRadialN, 0.58).normalize();

        positions.push(px, py, pz);
        normals.push(vLocalN.x, vLocalN.y, vLocalN.z);
        const shade = sign > 0 ? 1.0 : 0.82;
        colors.push(lr * shade, lg * shade, lb * shade);
        uv.push(k === 1 || k === 2 ? 1 : 0, k >= 2 ? 1 : 0);
      }
      if (sign > 0) {
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
      } else {
        indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
      }
    }
  }

  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/**
 * Coroa de palmeira imperial com nervura central arqueada, caimento gravitacional natural,
 * normais duplas independentes (sem artefato escuro no verso) e gradiente de oclusão na base.
 */
export function createPalmCrown() {
  const positions = [];
  const normals = [];
  const colors = [];
  const uv = [];
  const indices = [];

  const fronds = 13;
  const segs = 12;
  const vTang = new T.Vector3();
  const vSide = new T.Vector3();
  const vNorm = new T.Vector3();

  for (let leaf = 0; leaf < fronds; leaf++) {
    const tier = leaf % 3; // 0: mais alta/jovem, 1: intermediária, 2: mais baixa/arqueada
    const a = (leaf * Math.PI * 2) / fronds + tier * 0.085;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const maxReach = 3.35 + (tier === 1 ? 0.35 : tier === 2 ? 0.15 : -0.22);
    const archLift = tier === 0 ? 1.18 : tier === 1 ? 0.92 : 0.68;
    const tipDrop = tier === 0 ? 0.52 : tier === 1 ? 0.82 : 1.12;

    for (const faceSign of [1, -1]) {
      const start = positions.length / 3;

      for (let j = 0; j <= segs; j++) {
        const t = j / segs;
        const r = 0.08 + maxReach * t;
        const y = archLift * Math.sin(t * Math.PI * 0.86) - tipDrop * (t * t);
        const leafletNotch = j % 2 === 1 ? 0.76 : 1.0;
        const w = 0.34 * Math.pow(Math.sin(t * Math.PI), 0.62) * leafletNotch;
        // Leve perfil em "V" da folha de palmeira para captar luz especular realista
        const vFold = w * 0.18;

        // Tangente radial aproximada para calcular normal limpa
        const dt = 0.02;
        const t2 = Math.min(1, t + dt);
        const dr = maxReach * dt;
        const dy = (archLift * Math.sin(t2 * Math.PI * 0.86) - tipDrop * (t2 * t2)) - y;
        vTang.set(ca * dr, dy, sa * dr).normalize();

        // Ponto central da ráquis + duas bordas laterais por segmento (3 vértices por linha)
        for (const side of [-1, 0, 1]) {
          const px = ca * r - sa * w * side;
          const py = y - Math.abs(side) * vFold;
          const pz = sa * r + ca * w * side;

          vSide.set(-sa, -0.22 * side, ca).normalize();
          vNorm.crossVectors(vSide, vTang).multiplyScalar(faceSign);
          if (vNorm.y * faceSign < 0) vNorm.negate();
          // Suaviza levemente em direção ao topo da coroa
          vNorm.y += 0.22 * faceSign;
          vNorm.normalize();

          positions.push(px, py, pz);
          normals.push(vNorm.x, vNorm.y, vNorm.z);

          // Oclusão na inserção do tronco (t próximo de 0) e leve clareamento nas pontas solares
          const baseAO = T.MathUtils.lerp(0.52, 1.04, Math.pow(t, 0.55));
          const tierShade = tier === 2 ? 0.88 : tier === 1 ? 0.96 : 1.03;
          const backShade = faceSign > 0 ? 1.0 : 0.84;
          const k = baseAO * tierShade * backShade;

          colors.push(k * 0.98, k * 1.02, k * 0.86);
          uv.push(side * 0.5 + 0.5, t);
        }
      }

      for (let j = 0; j < segs; j++) {
        const row0 = start + j * 3;
        const row1 = row0 + 3;
        if (faceSign > 0) {
          indices.push(
            row0, row1, row0 + 1,
            row0 + 1, row1, row1 + 1,
            row0 + 1, row1 + 1, row0 + 2,
            row0 + 2, row1 + 1, row1 + 2
          );
        } else {
          indices.push(
            row0, row0 + 1, row1,
            row0 + 1, row1 + 1, row1,
            row0 + 1, row0 + 2, row1 + 1,
            row0 + 2, row1 + 2, row1 + 1
          );
        }
      }
    }
  }

  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}
// FIM DO ARQUIVO
