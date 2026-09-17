import {roadFinishData as ROAD03,roadAsphaltMaterial} from './vias-acabamento.js?v=vias-acabamento-20260915-4';
import * as T from 'three';
import {buildAutodromeArchitecture} from './autodromo-arquitetura.js?v=autodromo-arquitetura-20260913-1';
import {implantationData as D} from './implantacao-dados.js?v=autodromo-arquitetura-20260913-1';
import {primitives as P} from './refinamentos.js?v=pista-caminhada-20260916-1';

/** Todas as coordenadas deste módulo são da prancha de 1600 px.
 * O root de miniatures aplica [-620, 0, -570]. Não repetir essa transformação.
 * Contornos CAD, digitalizações e alturas interpretativas estão distinguidos em D.
 */
const mat=(color,roughness=.83)=>new T.MeshStandardMaterial({color,roughness,metalness:0});
const floorMat=mat('#bab6ac');
const soilMat=mat('#9a7554',.96);
export const registeredMaterials=new Map();
function registeredMaterial(kind,color,roughness){
 if(!registeredMaterials.has(kind)){const m=mat(color,roughness);m.name=color;m.userData.surfaceKind=kind;registeredMaterials.set(kind,m);}return registeredMaterials.get(kind);
}
// Superfícies sem paredes ou faces inferiores coincidentes. Cada área tem um único proprietário.
function registeredFloor(group,record,material,y,name){
 if(!record.indices.length)return null;
 const positions=[];for(let i=0;i<record.points.length;i+=2)positions.push(record.points[i],y,record.points[i+1]);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(record.indices);geo.computeVertexNormals();
 const uv=record.points.map(v=>v/5);geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 const mesh=new T.Mesh(geo,material);mesh.name=name;mesh.receiveShadow=true;mesh.castShadow=false;group.add(mesh);return mesh;
}

function linePath(points, Type=T.Shape){
 const p=new Type();points.forEach(([x,z],i)=>i?p.lineTo(x,-z):p.moveTo(x,-z));p.closePath();return p;
}
function shapeMesh(g,outer,holes=[],material=floorMat,y=.1,depth=.12){
 const sh=linePath(outer);sh.holes=holes.map(h=>linePath(h,T.Path));
 const geo=new T.ExtrudeGeometry(sh,{depth,bevelEnabled:false});geo.rotateX(-Math.PI/2);
 const m=new T.Mesh(geo,material);m.position.y=y;m.castShadow=false;m.receiveShadow=true;g.add(m);return m;
}
function surface(g,positions,indices,material){
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
 const m=new T.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
}
function clearGeometry(g){g.traverse(o=>{if(o.isMesh)o.geometry.dispose();});g.clear();g.position.set(0,0,0);g.rotation.set(0,0,0);g.scale.set(1,1,1);}
function ringPoints(points){
 const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal');
 return curve.getPoints(96).slice(0,-1).map(p=>[p.x,p.z]);
}
const skateHoles=D.skate.sectors.filter(s=>s.rim).map(s=>ringPoints(s.rim));
/** Rebaixo real do terreno: evita bowls preenchidos pela malha plana do parque. */
export function registeredTerrain(g,outline,color,y,depth){
 return shapeMesh(g,outline,skateHoles,mat(color,.94),y,depth);
}
function bowl(g,rim,depth){
 const c=rim.reduce((s,p)=>[s[0]+p[0]/rim.length,s[1]+p[1]/rim.length],[0,0]);
 const v=[c[0],.22-depth,c[1]],idx=[],rings=18,n=rim.length;
 for(let j=1;j<=rings;j++)for(const p of rim){const t=j/rings;v.push(c[0]+(p[0]-c[0])*t,.22-depth+depth*Math.pow(t,3.2),c[1]+(p[1]-c[1])*t);}
 for(let i=0;i<n;i++)idx.push(0,1+(i+1)%n,1+i);
 for(let j=0;j<rings-1;j++)for(let i=0;i<n;i++){const a=1+j*n+i,b=1+j*n+(i+1)%n,c1=a+n,d=b+n;idx.push(a,b,c1,b,d,c1);}
 const m=mat('#c1bdb4');m.side=T.DoubleSide;surface(g,v,idx,m);
 P.tube(g,rim.map(([x,z])=>[x,.255,z]),.065,'#707b80',true);
}
function rebuildSkate(target){
 clearGeometry(target);target.name='Skate Park · implantação em cinco setores';
 let h=0;for(const sector of D.skate.sectors){
  const rim=sector.rim?skateHoles[h++]:null;
  const m=shapeMesh(target,sector.outline,rim?[rim]:[]);m.name=sector.id;
  if(rim)bowl(target,rim,sector.depth);
 }
 // Street: equipamentos indicativos confinados ao último setor; cotas a confirmar.
 const s=P.groupAt(target,274,811,-.18);
 for(let i=0;i<5;i++)P.box(s,3,.22+i*.17,-3+i*.75,4,.18,.8,'#b8b5ae');
 P.box(s,-5,.22,1,2,.55,5,'#b8b5ae');
 P.beam(s,[-1,1,-4],[-1,1,3],.055,'#424f56');
 for(const z of [-4,3])P.beam(s,[-1,.22,z],[-1,1,z],.05,'#424f56');
 target.userData.provenance=D.skate.provenance;
}
function rebuildGate(target){
 clearGeometry(target);target.name='Pórtico · projeção dos perfis da prancha';
 const material=mat('#dce2df',.52);material.side=T.DoubleSide;
 for(const wing of D.gate.wings){
  const [start,end]=wing.axis,dx=end[0]-start[0],dz=end[1]-start[1],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length;
  const local=wing.outline.map(([x,z])=>[(x-start[0])*ux+(z-start[1])*uz,-(x-start[0])*uz+(z-start[1])*ux]);
  const lo=Math.min(...local.map(p=>p[0])),hi=Math.max(...local.map(p=>p[0]));
  const rows=[],v=[],idx=[],steps=80;
  for(let i=0;i<=steps;i++){
   const t=Math.min(.99999,Math.max(.00001,i/steps)),x=lo+(hi-lo)*t,cross=[];
   for(let j=0;j<local.length-1;j++){const a=local[j],b=local[j+1];if((a[0]<=x&&b[0]>x)||(b[0]<=x&&a[0]>x))cross.push(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]));}
   if(cross.length<2)throw new Error('Perfil do pórtico sem seção válida');
   const y=.45+D.gate.rise*Math.pow(Math.sin(Math.PI*t),.84),min=Math.min(...cross),max=Math.max(...cross);
   const row=[min,max].map(z=>[start[0]+ux*x-uz*z,y,start[1]+uz*x+ux*z]);rows.push(row);v.push(...row[0],...row[1]);
   if(i){const a=(i-1)*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  surface(target,v,idx,material);
  for(let k=0;k<5;k++){
   const rib=rows.map(([a,b])=>a.map((p,i)=>p+(b[i]-p)*k/4+(i===1?.07:0)));
   P.tube(target,rib,.065,'#f5f7f8');
  }
  for(let i=8;i<steps;i+=8)P.beam(target,rows[i][0],rows[i][1],.045,'#f5f7f8');
 }
 target.userData.provenance=D.gate.provenance;
}
function correctVillage(target){
 const facades = [];
 target.traverse(o => {
  if (o.isGroup && o.name.startsWith('Fachada ')) facades.push(o);
 });
 for (const f of facades) {
  if (f.parent) f.parent.remove(f);
 }
 clearGeometry(target);

 // 1. SEPARAÇÃO DAS FACHADAS POR ALA (CONFORME FOTOS REAIS DO DRONE)
 const wing1Facades = facades.filter(f => f.userData?.wing === 1);
 const wing2Facades = facades.filter(f => f.userData?.wing === 2);
 const w1 = wing1Facades.length ? wing1Facades : facades.slice(0, 8);
 const w2 = wing2Facades.length ? wing2Facades : facades.slice(8);

 // 2. EIXOS DAS DUAS ALAS
 // Ala 1 - Longitudinal (Norte -> Sul, iniciando junto à Casa Cuiabana e Anfiteatro, ao pé da colina)
 const line1 = [
  [456, 622],
  [453, 606],
  [448, 588],
  [442, 570],
  [435, 552],
  [428, 538]
 ];
 const len1 = [0];
 for (let i = 1; i < line1.length; i++) len1.push(len1.at(-1) + Math.hypot(line1[i][0] - line1[i-1][0], line1[i][1] - line1[i-1][1]));
 const total1 = len1.at(-1);

 w1.forEach((f, i) => {
  const d = total1 * (i + 0.5) / w1.length;
  let j = 1;
  while (j < len1.length - 1 && len1[j] < d) j++;
  const a = line1[j-1], b = line1[j], t = (d - len1[j-1]) / (len1[j] - len1[j-1]);
  f.position.set(a[0] + (b[0] - a[0]) * t, 0, a[1] + (b[1] - a[1]) * t);
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1;
  const nx = dz / len, nz = -dx / len;
  f.rotation.y = Math.atan2(nx, nz);
  f.scale.set(0.85, 0.85, 0.85);
  target.add(f);
 });

 // Ala 2 - Curva Sul (virando para a praça/lago e em direção ao Grande Pavilhão)
 const line2 = [
  [428, 538],
  [420, 528],
  [410, 522],
  [398, 516]
 ];
 const len2 = [0];
 for (let i = 1; i < line2.length; i++) len2.push(len2.at(-1) + Math.hypot(line2[i][0] - line2[i-1][0], line2[i][1] - line2[i-1][1]));
 const total2 = len2.at(-1);

 w2.forEach((f, i) => {
  const d = total2 * (i + 0.5) / w2.length;
  let j = 1;
  while (j < len2.length - 1 && len2[j] < d) j++;
  const a = line2[j-1], b = line2[j], t = (d - len2[j-1]) / (len2[j] - len2[j-1]);
  f.position.set(a[0] + (b[0] - a[0]) * t, 0, a[1] + (b[1] - a[1]) * t);
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1;
  const nx = dz / len, nz = -dx / len;
  f.rotation.y = Math.atan2(nx, nz);
  f.scale.set(0.85, 0.85, 0.85);
  target.add(f);
 });

 // 3. LINHA DA ORLA DO LAGO (Contorno real da margem da água em frente à Vila)
 const shore = [
  [404.4, 529.6],
  [406.8, 548.0],
  [409.2, 568.0],
  [412.2, 591.7],
  [414.9, 601.3],
  [416.8, 612.7],
  [418.7, 623.7],
  [422.4, 637.7],
  [426.0, 644.4],
  [430.3, 648.7],
  [435.0, 650.4],
  [442.0, 652.0],
  [448.0, 650.0]
 ];

 // Normais internas ao longo da orla apontando para o interior da praça
 const nShore = shore.length;
 const inNormals = [];
 for (let i = 0; i < nShore; i++) {
  let dx, dz;
  if (i === 0) {
   dx = shore[1][0] - shore[0][0]; dz = shore[1][1] - shore[0][1];
  } else if (i === nShore - 1) {
   dx = shore[nShore-1][0] - shore[nShore-2][0]; dz = shore[nShore-1][1] - shore[nShore-2][1];
  } else {
   dx = shore[i+1][0] - shore[i-1][0]; dz = shore[i+1][1] - shore[i-1][1];
  }
  const len = Math.hypot(dx, dz) || 1;
  inNormals.push([dz / len, -dx / len]);
 }

 // Linha interna que delimita a Pista de Caminhada (largura real de 9.0m) da Esplanada
 const roadWidth = 9.0;
 const promenadeInner = shore.map((p, i) => [
  +(p[0] + inNormals[i][0] * roadWidth).toFixed(2),
  +(p[1] + inNormals[i][1] * roadWidth).toFixed(2)
 ]);

 // 4. PISTA DE CAMINHADA DA ORLA (PAVIMENTO ASFÁLTICO DEDICADO DE 9M CONFORME O PROJETO E FOTOS 02, 03, 04 E 05)
 const pistaPolygon = [...shore, ...promenadeInner.slice().reverse()];
 P.polygon(target, pistaPolygon, '#363c40', 0.118, 0.026);

 // Faixas brancas de bordo e sinalização da pista de caminhada
 for (let i = 0; i < shore.length - 1; i++) {
  const p1 = shore[i], p2 = shore[i+1];
  const q1 = promenadeInner[i], q2 = promenadeInner[i+1];
  const inNx = inNormals[i][0], inNz = inNormals[i][1];
  const inNx2 = inNormals[i+1][0], inNz2 = inNormals[i+1][1];

  // Faixa de bordo externa (junto ao parapeito/guarda-corpo da água)
  P.beam(target, [p1[0] + inNx * 0.45, 0.146, p1[1] + inNz * 0.45], [p2[0] + inNx2 * 0.45, 0.146, p2[1] + inNz2 * 0.45], 0.045, '#f5f7f8');

  // Faixa de bordo interna (junto ao meio-fio da praça)
  P.beam(target, [q1[0] - inNx * 0.45, 0.146, q1[1] - inNz * 0.45], [q2[0] - inNx2 * 0.45, 0.146, q2[1] - inNz2 * 0.45], 0.045, '#f5f7f8');

  // Meio-fio de concreto elevado delimitando a pista da esplanada
  P.beam(target, [q1[0], 0.150, q1[1]], [q2[0], 0.150, q2[1]], 0.15, '#cfcac0');
 }

 // Conexão norte da pista de caminhada contornando o anfiteatro em direção à Casa Cuiabana e margem oeste
 const northLoop = [
  [448.0, 650.0],
  [446.0, 656.0],
  [438.0, 658.0],
  [430.0, 656.0],
  [426.0, 646.0]
 ];
 for (let i = 0; i < northLoop.length - 1; i++) {
  const p1 = northLoop[i], p2 = northLoop[i+1];
  const dx = p2[0] - p1[0], dz = p2[1] - p1[1], len = Math.hypot(dx, dz) || 1;
  const mx = (p1[0] + p2[0]) / 2, mz = (p1[1] + p2[1]) / 2;
  const ang = Math.atan2(dx, dz);
  const roadSegment = P.box(target, mx, 0.118, mz, 8.0, 0.026, len, '#363c40');
  roadSegment.rotation.y = ang;
  P.beam(target, [p1[0], 0.146, p1[1]], [p2[0], 0.146, p2[1]], 0.04, '#f5f7f8');
 }

 // 5. A GRANDE ESPLANADA / PRAÇA DAS NAÇÕES (Inicia no meio-fio da pista de caminhada e sobe até as fachadas)
 const backEdge = [
  [456.0, 648.0], // junto à Casa Cuiabana
  [458.0, 636.0], // anfiteatro norte
  [457.0, 622.0], // início Ala 1 (Sagrada Família)
  [454.0, 606.0],
  [449.0, 588.0],
  [443.0, 570.0],
  [436.0, 552.0],
  [429.0, 538.0], // transição Ala 1 / Ala 2
  [421.0, 528.0],
  [411.0, 522.0],
  [404.0, 518.0]  // conexão sul
 ];
 const plazaPts = [
  ...promenadeInner,
  ...backEdge
 ];
 P.polygon(target, plazaPts, '#ded9cf', 0.130, 0.02);

 // Faixas transversais listradas fanning através da praça (param no meio-fio da pista, sem invadir a água)
 function getLens(line) {
  const l = [0];
  for (let i = 1; i < line.length; i++) l.push(l.at(-1) + Math.hypot(line[i][0] - line[i-1][0], line[i][1] - line[i-1][1]));
  return l;
 }
 const innerLens = getLens(promenadeInner), totalInner = innerLens.at(-1);
 const spine = [...line2.slice().reverse(), ...line1.slice().reverse().slice(1)];
 const spineLens = getLens(spine), totalSpine = spineLens.at(-1);

 function interp(line, lens, d) {
  let j = 1; while (j < lens.length - 1 && lens[j] < d) j++;
  const a = line[j-1], b = line[j], t = (d - lens[j-1]) / (lens[j] - lens[j-1]);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
 }

 for (let s = 1; s <= 20; s++) {
  if (s % 2 !== 0) continue;
  const t = s / 21;
  const pFront = interp(promenadeInner, innerLens, totalInner * t);
  const pBack = interp(spine, spineLens, totalSpine * t);
  const dx = pFront[0] - pBack[0], dz = pFront[1] - pBack[1];
  const len = Math.hypot(dx, dz) || 1;
  const nx = -dz / len * 2.0, nz = dx / len * 2.0;
  const stripe = [
   [pBack[0] - nx, pBack[1] - nz],
   [pBack[0] + nx, pBack[1] + nz],
   [pFront[0] + nx, pFront[1] + nz],
   [pFront[0] - nx, pFront[1] - nz]
  ];
  P.polygon(target, stripe, '#8c8473', 0.152, 0.018);
 }

 // 6. PASSEIO NOBRE ELEVADO EM FRENTE ÀS FACHADAS
 for (let i = 0; i < line1.length - 1; i++) {
  P.beam(target, [line1[i][0], 0.155, line1[i][1]], [line1[i+1][0], 0.155, line1[i+1][1]], 0.18, '#e8e4db');
 }
 for (let i = 0; i < line2.length - 1; i++) {
  P.beam(target, [line2[i][0], 0.155, line2[i][1]], [line2[i+1][0], 0.155, line2[i+1][1]], 0.18, '#e8e4db');
 }

 // Balizadores com correntes delimitando o passeio das fachadas
 for (let i = 0; i <= 22; i++) {
  const d = total1 * i / 22;
  let j = 1; while (j < len1.length - 1 && len1[j] < d) j++;
  const a = line1[j-1], b = line1[j], segT = (d - len1[j-1]) / (len1[j] - len1[j-1]);
  const px = a[0] + (b[0] - a[0]) * segT, pz = a[1] + (b[1] - a[1]) * segT;
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1;
  const nx = dz / len, nz = -dx / len;
  const bx = px + nx * 3.4, bz = pz + nz * 3.4;
  P.cylinder(target, bx, 0.14, bz, 0.065, 0.85, '#3d4b53');
  P.add(target, new T.SphereGeometry(0.08, 6, 6), '#3d4b53', bx, 1.0, bz);
 }

 // 7. MURO DE CONTENÇÃO DA ÁGUA (PARAPEITO) E ILUMINAÇÃO COLONIAL
 for (let i = 0; i < shore.length - 1; i++) {
  const p1 = shore[i], p2 = shore[i+1];
  const dx = p2[0] - p1[0], dz = p2[1] - p1[1], len = Math.hypot(dx, dz) || 1;
  const mx = (p1[0] + p2[0]) / 2, mz = (p1[1] + p2[1]) / 2;
  const ang = Math.atan2(dx, dz);

  // Mureta de contenção / parapeito no contato com a água
  const wall = P.box(target, mx, 0.14, mz, 0.32, 0.82, len, '#ece8df');
  wall.rotation.y = ang;

  // Guarda-corpo arquitetônico metálico escuro no topo da mureta
  P.beam(target, [p1[0], 0.98, p1[1]], [p2[0], 0.98, p2[1]], 0.045, '#3d4b53');

  // Balaústre / pilar vertical a cada nó
  P.box(target, p1[0], 0.14, p1[1], 0.42, 0.92, 0.42, '#ece8df');

  // Postes pretos coloniais curvados com luminária (fotos reais)
  const hLamp = 4.4;
  P.cylinder(target, p1[0], 0.14, p1[1], 0.075, hLamp, '#1f2428', 0.055);
  const armNx = dz / len * 1.2, armNz = -dx / len * 1.2;
  P.beam(target, [p1[0], hLamp, p1[1]], [p1[0] + armNx, hLamp + 0.28, p1[1] + armNz], 0.042, '#1f2428');
  P.cylinder(target, p1[0] + armNx, hLamp + 0.16, p1[1] + armNz, 0.16, 0.24, '#1f2428', 0.08);
  P.add(target, new T.SphereGeometry(0.12, 6, 6), '#fdf6e2', p1[0] + armNx, hLamp + 0.12, p1[1] + armNz);
 }

 // 7. PISTA DE CAMINHADA DA MARGEM OPOSTA (WEST BANK)
 const westShore = [
  [392.5, 564.1],
  [396.1, 566.7],
  [399.3, 569.5],
  [402.1, 572.7],
  [404.5, 576.1],
  [406.7, 579.7],
  [408.7, 583.5],
  [410.5, 587.5],
  [412.2, 591.7],
  [414.0, 605.0],
  [416.0, 620.0],
  [420.0, 635.0],
  [426.0, 646.0],
  [435.0, 650.4]
 ];
 for (let i = 0; i < westShore.length - 1; i++) {
  const p1 = westShore[i], p2 = westShore[i+1];
  const dx = p2[0] - p1[0], dz = p2[1] - p1[1], len = Math.hypot(dx, dz) || 1;
  const mx = (p1[0] + p2[0]) / 2, mz = (p1[1] + p2[1]) / 2;
  const ang = Math.atan2(dx, dz);
  const outNx = -dz / len * 2.2, outNz = dx / len * 2.2;

  // Faixa pavimentada de caminhada de 4.4m de largura na margem oposta
  const wRoad = P.box(target, mx + outNx, 0.118, mz + outNz, 4.4, 0.026, len, '#363c40');
  wRoad.rotation.y = ang;
  P.beam(target, [p1[0] + outNx * 1.9, 0.144, p1[1] + outNz * 1.9], [p2[0] + outNx * 1.9, 0.144, p2[1] + outNz * 1.9], 0.04, '#f5f7f8');

  // Mureta baixa de proteção da margem oeste
  const wWall = P.box(target, mx, 0.14, mz, 0.28, 0.65, len, '#ece8df');
  wWall.rotation.y = ang;
  P.beam(target, [p1[0], 0.78, p1[1]], [p2[0], 0.78, p2[1]], 0.04, '#3d4b53');

  if (i % 2 === 0) {
   P.cylinder(target, p1[0], 0.14, p1[1], 0.065, 4.0, '#1f2428', 0.05);
   P.add(target, new T.SphereGeometry(0.12, 6, 6), '#fdf6e2', p1[0], 4.1, p1[1]);
  }
 }

 // 8. ESTÁTUAS E MOBILIÁRIO REAL DA PRAÇA (FOTOS REAIS)
 // Estátua do Touro (Charging Bull) em frente à Sagrada Família / Anfiteatro
 const bullPos = [438, 612];
 P.cylinder(target, bullPos[0], 0.14, bullPos[1], 2.4, 0.40, '#ece8df');
 P.cylinder(target, bullPos[0], 0.40, bullPos[1], 2.2, 0.15, '#2e483e');
 P.box(target, bullPos[0], 0.55, bullPos[1], 1.2, 0.85, 2.0, '#2e483e');
 P.cylinder(target, bullPos[0], 0.95, bullPos[1] + 1.1, 0.35, 0.65, '#2e483e');
 P.beam(target, [bullPos[0] - 0.35, 1.35, bullPos[1] + 1.2], [bullPos[0] - 0.65, 1.55, bullPos[1] + 1.45], 0.05, '#dedcd4');
 P.beam(target, [bullPos[0] + 0.35, 1.35, bullPos[1] + 1.2], [bullPos[0] + 0.65, 1.55, bullPos[1] + 1.45], 0.05, '#dedcd4');
 P.cylinder(target, bullPos[0] + 1.3, 0.55, bullPos[1] + 0.4, 0.14, 1.4, '#2e483e');
 P.add(target, new T.SphereGeometry(0.15, 6, 6), '#2e483e', bullPos[0] + 1.3, 2.0, bullPos[1] + 0.4);

 // Estátua do Elefante de Bronze em frente ao Palácio Rosa Indiano
 const elephantPos = [434, 594];
 P.cylinder(target, elephantPos[0], 0.14, elephantPos[1], 2.4, 0.40, '#ece8df');
 P.cylinder(target, elephantPos[0], 0.40, elephantPos[1], 2.2, 0.15, '#2e483e');
 P.box(target, elephantPos[0], 0.55, elephantPos[1], 1.4, 1.2, 2.2, '#2e483e');
 P.cylinder(target, elephantPos[0], 1.2, elephantPos[1] + 1.2, 0.42, 0.85, '#2e483e');
 P.beam(target, [elephantPos[0], 1.6, elephantPos[1] + 1.4], [elephantPos[0], 2.2, elephantPos[1] + 2.1], 0.14, '#2e483e');
 P.beam(target, [elephantPos[0] - 0.28, 1.2, elephantPos[1] + 1.3], [elephantPos[0] - 0.45, 1.0, elephantPos[1] + 1.7], 0.05, '#f4f1ea');
 P.beam(target, [elephantPos[0] + 0.28, 1.2, elephantPos[1] + 1.3], [elephantPos[0] + 0.45, 1.0, elephantPos[1] + 1.7], 0.05, '#f4f1ea');

 // Palhotas tradicionais de palha cônica escalonada
 for (const hPos of [[438, 602], [430, 586]]) {
  P.cylinder(target, hPos[0], 0.14, hPos[1], 1.8, 0.35, '#ece8df');
  P.cylinder(target, hPos[0], 0.45, hPos[1], 0.18, 2.2, '#5d4037');
  P.add(target, new T.ConeGeometry(2.2, 1.4, 16), '#8e734c', hPos[0], 2.4, hPos[1]);
  P.add(target, new T.ConeGeometry(1.5, 1.0, 16), '#7a603c', hPos[0], 3.2, hPos[1]);
 }

 // 9. TALUDE E BOSQUE DENSO DE FUNDO (MATA NATIVA DO CERRADO ATRÁS DAS FACHADAS E DA CASA CUIABANA)
 const treeColors = ['#2d4e23', '#3b5e28', '#4a6f32', '#516f3d', '#3d653b'];
 for (let row = 0; row < 6; row++) {
  const distFromSpine = 4.2 + row * 4.8;
  const yBerm = 0.5 + row * 0.9;
  for (let s = 0; s <= 20; s++) {
   const t = s / 20;
   const d = totalSpine * t;
   let j = 1; while (j < spineLens.length - 1 && spineLens[j] < d) j++;
   const a = spine[j-1], b = spine[j], segT = (d - spineLens[j-1]) / (spineLens[j] - spineLens[j-1]);
   const bx = a[0] + (b[0] - a[0]) * segT, bz = a[1] + (b[1] - a[1]) * segT;
   const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1;
   const hillNx = dz / len, hillNz = -dx / len; // normal apontando para o interior da colina (Leste / atrás das fachadas)

   const tx = bx + hillNx * distFromSpine + (s % 2 ? 1.2 : -1.2);
   const tz = bz + hillNz * distFromSpine + (row % 2 ? 0.9 : -0.9);
   const hTree = 4.8 + ((s * 7 + row * 11) % 5) * 0.65;
   const rCrown = 2.2 + ((s * 3 + row * 7) % 4) * 0.45;
   const color = treeColors[(s + row * 2) % treeColors.length];

   P.cylinder(target, tx, yBerm, tz, 0.26, hTree * 0.6, '#523a28', 0.18);
   const crown = P.add(target, new T.SphereGeometry(rCrown, 8, 6), color, tx, yBerm + hTree * 0.75, tz);
   crown.scale.set(1.0 + (s % 3) * 0.1, 0.85, 1.0 + (row % 2) * 0.15);
  }
 }

 // Árvores adicionais na encosta atrás da Casa Cuiabana
 for (let r = 0; r < 4; r++) {
  for (let c = 0; c < 5; c++) {
   const tx = 464 + r * 5.2 + (c % 2 ? 1.4 : -1.4);
   const tz = 646 + c * 5.0 + (r % 2 ? 1.0 : -1.0);
   const yBerm = 1.0 + r * 1.1;
   const hTree = 5.2 + ((r * 3 + c * 5) % 4) * 0.6;
   const rCrown = 2.4 + ((r + c) % 3) * 0.4;
   const color = treeColors[(r + c) % treeColors.length];
   P.cylinder(target, tx, yBerm, tz, 0.28, hTree * 0.6, '#523a28', 0.18);
   const crown = P.add(target, new T.SphereGeometry(rCrown, 8, 6), color, tx, yBerm + hTree * 0.75, tz);
   crown.scale.set(1.05, 0.85, 1.05);
  }
 }

 // 10. ELEMENTOS DE AMBIENTAÇÃO DISTANTE
 // Grande Pavilhão de Eventos com teto curvo metálico (ao SUL da esplanada, perto da curva e do lago)
 const pavX = 405, pavZ = 495, pavW = 52, pavL = 34, pavH = 13.5;
 for (const px of [-pavW/2 + 2, pavW/2 - 2]) {
  for (let z = -pavL/2; z <= pavL/2; z += 8.5) {
   P.cylinder(target, pavX + px, 0.3, pavZ + z, 0.45, pavH, '#2a353c');
  }
 }
 const archRoof = new T.Shape();
 archRoof.moveTo(-pavW/2 - 2, 0);
 archRoof.quadraticCurveTo(0, 5.5, pavW/2 + 2, 0);
 archRoof.lineTo(pavW/2 + 2, 0.6);
 archRoof.quadraticCurveTo(0, 6.1, -pavW/2 - 2, 0.6);
 archRoof.closePath();
 const archGeo = new T.ExtrudeGeometry(archRoof, {depth: pavL, bevelEnabled: false});
 archGeo.rotateY(Math.PI/2);
 P.add(target, archGeo, '#cfd8dc', pavX - pavL/2, pavH, pavZ);

 // Anfiteatro escalonado na curva norte do lago (em frente à Casa Cuiabana)
 const amphiX = 440, amphiZ = 642;
 for (let st = 0; st < 5; st++) {
  const rSt = 7.5 - st * 1.1;
  const stepGeo = new T.CylinderGeometry(rSt, rSt, 0.35, 24, 1, false, Math.PI * 0.15, Math.PI * 0.95);
  P.add(target, stepGeo, '#dedad0', amphiX, 0.15 + st * 0.32, amphiZ);
 }

 target.name = 'Vila das Nações · fachadas, praça e orla completa';
 target.userData.provenance = D.village.provenance;
}

function geoSurface(group,geometry,material,y=.06,depth=.04,extraHoles=[]){
 if(geometry.type!=='Polygon')throw new Error('Implantação: geometria não poligonal');
 const [outer,...holes]=geometry.coordinates;
 return shapeMesh(group,outer,[...holes,...extraHoles],material,y,depth);
}
function inside([x,z],ring){let ok=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [a,b]=ring[i],[c,d]=ring[j];if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)ok=!ok;}return ok;}
export function applyRegisteredLayout({models,landscape,water,circuits,vegetation,infrastructure}){
 const R=D.registered;
 for(const g of [landscape,water,circuits,vegetation,infrastructure])clearGeometry(g);
 const grass=registeredMaterial('grass','#506344',.96),asphalt=registeredMaterial('asphalt','#afb2ae',.92),parkingMat=registeredMaterial('parking','#626962',.94),lakeMat=registeredMaterial('water','#163e48',.06),bankMat=registeredMaterial('bank','#92856b',.97);
 registeredFloor(landscape,ROAD03.surfaces.ground,grass,0,'Terreno recortado');
 registeredFloor(landscape,ROAD03.surfaces.roads,roadAsphaltMaterial(),.12,'Vias · superfícies sem sobreposição');
 registeredFloor(landscape,R.meshes.banks,bankMat,.01,'Margens · interpretação da prancha');
 registeredFloor(water,R.meshes.water,lakeMat,-.08,'Água · contornos compatibilizados');
 registeredFloor(circuits,R.meshes.autodrome,asphalt,.12,'Autódromo · bordas CAD preservadas');
 const auto=models.get('autodromo');clearGeometry(auto);
 buildAutodromeArchitecture(auto,R.autoBuildings);
 const kart=models.get('kartodromo');
 const boxes=kart.getObjectByName('Boxes do Kart · Edifício Linear e Marquise');
 const stand=kart.getObjectByName('Arquibancada do Kartódromo');
 for(const o of [boxes,stand])if(o)o.removeFromParent();
 clearGeometry(kart);
 registeredFloor(kart,R.meshes.kart,asphalt,.12,'Kart · bordas CAD preservadas');
 if(boxes){boxes.position.set(379,0,852);boxes.rotation.y=.12;kart.add(boxes);}
 if(stand){stand.position.set(366,0,849);stand.rotation.y=.12;kart.add(stand);}
 kart.name='Kartódromo · contorno e ilhas CAD';
 rebuildGate(models.get('portico-de-entrada'));
 rebuildSkate(models.get('skate-park'));
 correctVillage(models.get('vila-das-nacoes'));
 const parking=models.get('estrutura-e-acesso');clearGeometry(parking);
 registeredFloor(parking,R.meshes.parking,parkingMat,.10,'Estacionamentos · bolsões recortados');
 // PNMT-G04-BEGIN
 // Piso fotográfico registrado: origem e escala iguais às da implantação.
 const parkingFloorG04=parking.getObjectByName('Estacionamentos · bolsões recortados');
 const photoG04=R.parkingSurface;
 if(parkingFloorG04&&photoG04){
  const [x0,z0,x1,z1]=photoG04.bounds,uv=[];
  for(let i=0;i<R.meshes.parking.points.length;i+=2){
   uv.push((R.meshes.parking.points[i]-x0)/(x1-x0),1-(R.meshes.parking.points[i+1]-z0)/(z1-z0));
  }
  const photoMatG04=registeredMaterial('parking-photo-g04','#bec4ba',.96);
  if(!photoMatG04.map){
   const textureG04=new T.TextureLoader().load(photoG04.dataURI,undefined,undefined,()=>{
    photoMatG04.map=null;photoMatG04.color.set('#626962');photoMatG04.needsUpdate=true;
    console.warn('PNMT: a superfície fotográfica dos estacionamentos não carregou.');
   });
   textureG04.colorSpace=T.SRGBColorSpace;
   textureG04.wrapS=T.ClampToEdgeWrapping;textureG04.wrapT=T.ClampToEdgeWrapping;
   textureG04.minFilter=T.LinearMipmapLinearFilter;textureG04.magFilter=T.LinearFilter;
   photoMatG04.map=textureG04;photoMatG04.needsUpdate=true;
  }
  parkingFloorG04.geometry.setIndex(photoG04.otherIndices);
  const southFloorG04=registeredFloor(parking,{points:R.meshes.parking.points,indices:photoG04.southIndices},photoMatG04,.10,'Estacionamentos E1/E2/E3 · superfície registrada');
  southFloorG04.geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  southFloorG04.userData.skipBatch=true;
 }
 // PNMT-G04-END
 const moto=models.get('motocross');clearGeometry(moto);
 shapeMesh(moto,D.motocross.outline,[],soilMat,.015,.03);moto.name='Motocross · setor, traçado a confirmar';
 const wake=models.get('wake-park');
 // Existing water polygon was elevated and displaced. Keep the equipment, remove only the water meshes.
 const drop=[];wake.traverse(o=>{if(o.isMesh&&o.geometry.type==='ExtrudeGeometry'&&o.material?.color){const c=o.material.color.getHexString();if(['163e46','426c6c','377c80','4e8e91','426f70'].includes(c))drop.push(o);}});
 // Water ownership is centralized; the current wake refinement contains a broad flat water slab.
 wake.traverse(o=>{if(o.isMesh&&o.geometry.type==='BoxGeometry'){const p=o.geometry.parameters;if(p.width>40&&p.depth>70&&p.height<2)drop.push(o);}});
 for(const o of new Set(drop)){o.removeFromParent();o.geometry.dispose();}
 for(const [id,g] of models)g.userData.placeId=id;
 landscape.userData.provenance=R.provenance;
}
