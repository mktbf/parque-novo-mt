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
// =========================================================================
// AMBIENTAÇÃO REAL DA CASA CUIABANA, ANFITEATRO, ESPLANADA E VIAS DE ACESSO
// Conforme fotografias de drone de alta resolução (media_1789656856751.jpg)
// =========================================================================
function buildCasaCuiabanaEnvirons(target) {
 // Geometria e orientação rigorosamente paralelas à fachada frontal da Casa Cuiabana
 const houseFrontDx = -7.0, houseFrontDz = 16.3;
 const grandWidth = 34.0;
 const uLen = Math.hypot(houseFrontDx, houseFrontDz);
 const ux = houseFrontDx / uLen, uz = houseFrontDz / uLen; // [-0.3946, 0.9189] unitário na largura (+u = direita da foto drone, -u = esquerda da foto drone)
 const vx = -uz, vz = ux; // [-0.9189, -0.3946] normal apontando para o lago em frente à fachada
 const houseAngle = -Math.atan2(houseFrontDz, houseFrontDx); // -1.976 rad

 const ccX = 452.0, ccZ = 654.15; // centro da fachada da Casa Cuiabana
 const topX = ccX + vx * 7.2, topZ = ccZ + vz * 7.2; // centro do terraço superior do anfiteatro

 // Extremos da balaustrada superior do anfiteatro
 // pTopR_photo (+u): lado direito da foto do drone (em direção à esplanada leste e AgroPlace)
 // pTopL_photo (-u): lado esquerdo da foto do drone (em direção à Sagrada Família e via de acesso)
 const pTopR_photo = [topX + ux * (grandWidth / 2), topZ + uz * (grandWidth / 2)];
 const pTopL_photo = [topX - ux * (grandWidth / 2), topZ - uz * (grandWidth / 2)];

 // 1. GRANDE ESPLANADA DA CASA CUIABANA (Piso contínuo em placas de concreto claro a y = 1.50)
 const esplanadePts = [
  // Borda da balaustrada superior
  [pTopL_photo[0], pTopL_photo[1]],
  [pTopR_photo[0], pTopR_photo[1]],
  // Expansão da esplanada para a direita (+u, setor dos canteiros)
  [pTopR_photo[0] + ux * 16.0, pTopR_photo[1] + uz * 16.0],
  [pTopR_photo[0] + ux * 16.0 - vx * 16.0, pTopR_photo[1] + uz * 16.0 - vz * 16.0],
  // Faixa posterior atrás da Casa Cuiabana (ao pé da encosta norte)
  [ccX - vx * 12.0 + ux * 10.0, ccZ - vz * 12.0 + uz * 10.0],
  [ccX - vx * 12.0 - ux * 12.0, ccZ - vz * 12.0 - uz * 12.0],
  // Conexão com o platô esquerdo (-u, junto à via e Sagrada Família)
  [pTopL_photo[0] - ux * 8.0 - vx * 10.0, pTopL_photo[1] - uz * 8.0 - vz * 10.0],
  [pTopL_photo[0] - ux * 8.0, pTopL_photo[1] - uz * 8.0]
 ];
 P.polygon(target, esplanadePts, '#ded9cf', 1.50, 0.05);

 // Meio-fio perimetral da esplanada
 for (let i = 0; i < esplanadePts.length; i++) {
  const p1 = esplanadePts[i], p2 = esplanadePts[(i + 1) % esplanadePts.length];
  P.beam(target, [p1[0], 1.52, p1[1]], [p2[0], 1.52, p2[1]], 0.08, '#c8c4b8');
 }

 // 2. CANTEIROS CIRCULARES DE GRAMADO NA ESPLANADA DIREITA (Fotos reais de drone)
 const canteiroCenters = [
  [pTopR_photo[0] + ux * 6.0 - vx * 3.5, pTopR_photo[1] + uz * 6.0 - vz * 3.5],
  [pTopR_photo[0] + ux * 12.0 - vx * 9.0, pTopR_photo[1] + uz * 12.0 - vz * 9.0]
 ];
 for (const cPos of canteiroCenters) {
  P.cylinder(target, cPos[0], 1.50, cPos[1], 4.2, 0.06, '#42782b');
  P.tube(target, Array.from({length: 24}, (_, idx) => {
   const a = idx / 23 * Math.PI * 2;
   return [cPos[0] + Math.cos(a) * 4.2, 1.54, cPos[1] + Math.sin(a) * 4.2];
  }), 0.07, '#ede9e1', true);
  // Arbustos ornamentais baixos no centro do canteiro
  for (let s = 0; s < 3; s++) {
   const sa = s * Math.PI * 2 / 3;
   const sx = cPos[0] + Math.cos(sa) * 1.5, sz = cPos[1] + Math.sin(sa) * 1.5;
   P.cylinder(target, sx, 1.54, sz, 0.06, 0.45, '#5d4037');
   P.add(target, new T.SphereGeometry(0.75, 6, 5), '#3e5c2b', sx, 1.95, sz);
  }
 }

 // 3. O ANFITEATRO REAL (Arquibancada retilínea em 6 patamares com escadarias e balaustrada)
 const aisleW = 2.8; // largura da escadaria central
 const lateralStairW = 1.6; // escadarias laterais

 // Abertura central na balaustrada superior para passagem da escadaria
 const pAisleL = [topX - ux * (aisleW / 2 + 0.1), topZ - uz * (aisleW / 2 + 0.1)];
 const pAisleR = [topX + ux * (aisleW / 2 + 0.1), topZ + uz * (aisleW / 2 + 0.1)];

 // Ala esquerda da balaustrada superior (-u, lado Sagrada Família)
 P.beam(target, [pTopL_photo[0], 2.45, pTopL_photo[1]], [pAisleL[0], 2.45, pAisleL[1]], 0.05, '#ede9e1');
 P.beam(target, [pTopL_photo[0], 1.70, pTopL_photo[1]], [pAisleL[0], 1.70, pAisleL[1]], 0.04, '#ede9e1');
 for (let b = 0; b <= 14; b++) {
  const t = b / 14;
  const bx = pTopL_photo[0] + (pAisleL[0] - pTopL_photo[0]) * t;
  const bz = pTopL_photo[1] + (pAisleL[1] - pTopL_photo[1]) * t;
  P.cylinder(target, bx, 1.55, bz, 0.05, 0.90, '#ede9e1');
 }
 P.box(target, pTopL_photo[0], 1.55, pTopL_photo[1], 0.45, 1.05, 0.45, '#dfdad0');
 P.box(target, pAisleL[0], 1.55, pAisleL[1], 0.42, 1.05, 0.42, '#dfdad0');

 // Ala direita da balaustrada superior (+u, lado canteiros)
 P.beam(target, [pAisleR[0], 2.45, pAisleR[1]], [pTopR_photo[0], 2.45, pTopR_photo[1]], 0.05, '#ede9e1');
 P.beam(target, [pAisleR[0], 1.70, pAisleR[1]], [pTopR_photo[0], 1.70, pTopR_photo[1]], 0.04, '#ede9e1');
 for (let b = 0; b <= 14; b++) {
  const t = b / 14;
  const bx = pAisleR[0] + (pTopR_photo[0] - pAisleR[0]) * t;
  const bz = pAisleR[1] + (pTopR_photo[1] - pAisleR[1]) * t;
  P.cylinder(target, bx, 1.55, bz, 0.05, 0.90, '#ede9e1');
 }
 P.box(target, pAisleR[0], 1.55, pAisleR[1], 0.42, 1.05, 0.42, '#dfdad0');
 P.box(target, pTopR_photo[0], 1.55, pTopR_photo[1], 0.45, 1.05, 0.45, '#dfdad0');

 // 6 Patamares de Arquibancada (descem suavemente de y = 1.55 até y = 0.20 em direção ao lago)
 const numTiers = 6;
 const tierDepth = 1.35;
 const yTop = 1.55, yBottom = 0.20;
 const tierH = (yTop - yBottom) / numTiers; // ~0.225m

 for (let k = 0; k < numTiers; k++) {
  const yCur = yTop - (k + 1) * tierH;
  const dCur = (k + 0.5) * tierDepth;
  const cx = topX + vx * dCur;
  const cz = topZ + vz * dCur;

  // Ala Direita da foto (+u)
  const halfGrandW = (grandWidth - aisleW - 2 * lateralStairW) / 2;
  const rDist = grandWidth / 2 - lateralStairW - halfGrandW / 2;
  const rx = cx + ux * rDist, rz = cz + uz * rDist;
  const rBox = P.box(target, rx, yCur, rz, halfGrandW, tierH, tierDepth, '#dedad0');
  rBox.rotation.y = houseAngle;
  const rSeat = P.box(target, rx, yCur + tierH - 0.02, rz, halfGrandW * 0.98, 0.03, tierDepth * 0.55, '#989386');
  rSeat.rotation.y = houseAngle;

  // Ala Esquerda da foto (-u)
  const lDist = -grandWidth / 2 + lateralStairW + halfGrandW / 2;
  const lx = cx + ux * lDist, lz = cz + uz * lDist;
  const lBox = P.box(target, lx, yCur, lz, halfGrandW, tierH, tierDepth, '#dedad0');
  lBox.rotation.y = houseAngle;
  const lSeat = P.box(target, lx, yCur + tierH - 0.02, lz, halfGrandW * 0.98, 0.03, tierDepth * 0.55, '#989386');
  lSeat.rotation.y = houseAngle;

  // Degraus da Escadaria Central
  for (let s = 0; s < 2; s++) {
   const stepD = (k + s * 0.5 + 0.25) * tierDepth;
   const stepY = yTop - (k + s * 0.5 + 0.5) * tierH;
   const scx = topX + vx * stepD, scz = topZ + vz * stepD;
   const stepMesh = P.box(target, scx, stepY, scz, aisleW * 0.96, tierH * 0.52, tierDepth * 0.52, '#b8b4a8');
   stepMesh.rotation.y = houseAngle;
  }

  // Degraus das Escadarias Laterais
  const rStairDist = grandWidth / 2 - lateralStairW / 2;
  const lStairDist = -grandWidth / 2 + lateralStairW / 2;
  const rsBox = P.box(target, cx + ux * rStairDist, yCur, cz + uz * rStairDist, lateralStairW, tierH, tierDepth, '#c2beb4');
  rsBox.rotation.y = houseAngle;
  const lsBox = P.box(target, cx + ux * lStairDist, yCur, cz + uz * lStairDist, lateralStairW, tierH, tierDepth, '#c2beb4');
  lsBox.rotation.y = houseAngle;

  // Muretas laterais brancas de contenção
  const mRDist = grandWidth / 2 + 0.15;
  const mLDist = -grandWidth / 2 - 0.15;
  const mRBox = P.box(target, cx + ux * mRDist, yCur, cz + uz * mRDist, 0.30, tierH + 0.65, tierDepth * 1.05, '#ede9e1');
  mRBox.rotation.y = houseAngle;
  const mLBox = P.box(target, cx + ux * mLDist, yCur, cz + uz * mLDist, 0.30, tierH + 0.65, tierDepth * 1.05, '#ede9e1');
  mLBox.rotation.y = houseAngle;
 }

 // Corrimãos elegantes da escadaria central (postes verticais a cada patamar)
 for (let k = 0; k <= numTiers; k += 2) {
  const dP = k * tierDepth;
  const yP = yTop - k * tierH;
  const cx = topX + vx * dP, cz = topZ + vz * dP;
  P.cylinder(target, cx, yP, cz, 0.04, 0.85, '#ede9e1');
 }
 const cTopX = topX, cTopZ = topZ;
 const cBotX = topX + vx * (numTiers * tierDepth), cBotZ = topZ + vz * (numTiers * tierDepth);
 P.beam(target, [cTopX, yTop + 0.82, cTopZ], [cBotX, yBottom + 0.82, cBotZ], 0.038, '#ede9e1');

 // Palco e esplanada inferior (conecta a arquibancada à pista da orla de 9m)
 const stageD = numTiers * tierDepth + 1.8;
 const stageX = topX + vx * stageD, stageZ = topZ + vz * stageD;
 const stageMesh = P.box(target, stageX, yBottom, stageZ, grandWidth + 2.0, 0.06, 3.6, '#ded9cf');
 stageMesh.rotation.y = houseAngle;

 // Taludes gramados laterais acompanhando o caimento da arquibancada
 const westBerm = [
  [pTopL_photo[0], pTopL_photo[1]],
  [pTopL_photo[0] + vx * (numTiers * tierDepth), pTopL_photo[1] + vz * (numTiers * tierDepth)],
  [pTopL_photo[0] + vx * (numTiers * tierDepth) - ux * 4.5, pTopL_photo[1] + vz * (numTiers * tierDepth) - uz * 4.5],
  [pTopL_photo[0] - ux * 4.5, pTopL_photo[1] - uz * 4.5]
 ];
 P.polygon(target, westBerm, '#42782b', 0.85, 0.05);

 const eastBerm = [
  [pTopR_photo[0], pTopR_photo[1]],
  [pTopR_photo[0] + vx * (numTiers * tierDepth), pTopR_photo[1] + vz * (numTiers * tierDepth)],
  [pTopR_photo[0] + vx * (numTiers * tierDepth) + ux * 4.5, pTopR_photo[1] + vz * (numTiers * tierDepth) + uz * 4.5],
  [pTopR_photo[0] + ux * 4.5, pTopR_photo[1] + uz * 4.5]
 ];
 P.polygon(target, eastBerm, '#42782b', 0.85, 0.05);

 // 4. VIA DESCENDENTE DA COLINA AO LADO DA SAGRADA FAMÍLIA (Conforme foto drone media_1789656856751.jpg)
 // Curva descendo pelo lado esquerdo da esplanada, estritamente atrás do anfiteatro e conectando à Vila
 const hillRoadPts = [
  [478.0, 696.0],
  [474.0, 678.0],
  [468.0, 658.0],
  [462.0, 638.0],
  [456.0, 622.0]
 ];
 for (let i = 0; i < hillRoadPts.length - 1; i++) {
  const p1 = hillRoadPts[i], p2 = hillRoadPts[i + 1];
  const dx = p2[0] - p1[0], dz = p2[1] - p1[1], len = Math.hypot(dx, dz) || 1;
  const mx = (p1[0] + p2[0]) / 2, mz = (p1[1] + p2[1]) / 2;
  const ang = Math.atan2(dx, dz);
  const rSeg = P.box(target, mx, 0.135, mz, 7.2, 0.03, len, '#363c40');
  rSeg.rotation.y = ang;

  // Faixas brancas de bordo
  const nx = -dz / len * 3.3, nz = dx / len * 3.3;
  P.beam(target, [p1[0] + nx, 0.155, p1[1] + nz], [p2[0] + nx, 0.155, p2[1] + nz], 0.045, '#f5f7f8');
  P.beam(target, [p1[0] - nx, 0.155, p1[1] - nz], [p2[0] - nx, 0.155, p2[1] - nz], 0.045, '#f5f7f8');

  // Meio-fio de concreto elevado
  const curbNx = -dz / len * 3.6, curbNz = dx / len * 3.6;
  P.beam(target, [p1[0] + curbNx, 0.165, p1[1] + curbNz], [p2[0] + curbNx, 0.165, p2[1] + curbNz], 0.12, '#cfcac0');
  P.beam(target, [p1[0] - curbNx, 0.165, p1[1] - curbNz], [p2[0] - curbNx, 0.165, p2[1] - curbNz], 0.12, '#cfcac0');

  // Faixa tracejada central
  P.beam(target, [p1[0], 0.153, p1[1]], [p2[0], 0.153, p2[1]], 0.035, '#ded9cf');
 }

 // 5. PASSEIO / CONEXÃO LESTE SUBINDO EM DIREÇÃO AO AGROPLACE
 const agroWalkPts = [
  [pTopR_photo[0] + ux * 16.0, pTopR_photo[1] + uz * 16.0],
  [pTopR_photo[0] + ux * 24.0 - vx * 4.0, pTopR_photo[1] + uz * 24.0 - vz * 4.0],
  [pTopR_photo[0] + ux * 32.0 - vx * 8.0, pTopR_photo[1] + uz * 32.0 - vz * 8.0]
 ];
 for (let i = 0; i < agroWalkPts.length - 1; i++) {
  const p1 = agroWalkPts[i], p2 = agroWalkPts[i + 1];
  const dx = p2[0] - p1[0], dz = p2[1] - p1[1], len = Math.hypot(dx, dz) || 1;
  const mx = (p1[0] + p2[0]) / 2, mz = (p1[1] + p2[1]) / 2;
  const ang = Math.atan2(dx, dz);
  const wSeg = P.box(target, mx, 1.48, mz, 5.0, 0.03, len, '#ded9cf');
  wSeg.rotation.y = ang;
  const nx = -dz / len * 2.5, nz = dx / len * 2.5;
  P.beam(target, [p1[0] + nx, 1.50, p1[1] + nz], [p2[0] + nx, 1.50, p2[1] + nz], 0.06, '#cfcac0');
  P.beam(target, [p1[0] - nx, 1.50, p1[1] - nz], [p2[0] - nx, 1.50, p2[1] - nz], 0.06, '#cfcac0');
 }
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

  // 2. EIXOS DAS DUAS ALAS (Ao pé da colina arborizada, voltadas para o lago)
  const line1 = [
   [472, 622],
   [470, 606],
   [466, 588],
   [460, 570],
   [452, 552],
   [444, 538]
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
   [444, 538],
   [435, 528],
   [424, 520],
   [412, 514]
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

  // 3. MARGEM REAL DA VILA DAS NAÇÕES JUNTO AO LAGO (Borda leste exata de Poly 2 de R.meshes.water)
  const shore = [
   [404.4, 529.6],
   [409.9, 530.0],
   [415.2, 531.8],
   [420.3, 534.9],
   [424.9, 538.6],
   [429.0, 543.0],
   [432.6, 548.0],
   [435.7, 553.7],
   [438.5, 560.0],
   [441.0, 566.9],
   [443.2, 574.4],
   [445.1, 582.5],
   [446.6, 591.2],
   [447.9, 600.7],
   [448.8, 610.9],
   [449.4, 621.9],
   [449.3, 630.8],
   [448.5, 637.7],
   [446.9, 642.7],
   [444.7, 645.7],
   [442.3, 647.9],
   [435.0, 650.4]
  ];

  // 4. A GRANDE ESPLANADA / PRAÇA DAS NAÇÕES (Entre as fachadas e a orla do lago)
  const plazaPts = [
   ...shore,
   [455.0, 646.0],
   ...line1,
   ...line2.slice(1)
  ];
  P.polygon(target, plazaPts, '#ded9cf', 0.130, 0.02);

  // Faixas transversais listradas fanning através da praça (das fachadas até a margem do lago)
  function getLens(line) {
   const l = [0];
   for (let i = 1; i < line.length; i++) l.push(l.at(-1) + Math.hypot(line[i][0] - line[i-1][0], line[i][1] - line[i-1][1]));
   return l;
  }
  const shoreLens = getLens(shore), totalShore = shoreLens.at(-1);
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
   const pFront = interp(shore, shoreLens, totalShore * t);
   const pBack = interp(spine, spineLens, totalSpine * t);
   const dx = pFront[0] - pBack[0], dz = pFront[1] - pBack[1];
   const len = Math.hypot(dx, dz) || 1;
   const nx = -dz / len * 1.6, nz = dx / len * 1.6;
   const stripe = [
    [pBack[0] - nx, pBack[1] - nz],
    [pBack[0] + nx, pBack[1] + nz],
    [pFront[0] + nx, pFront[1] + nz],
    [pFront[0] - nx, pFront[1] - nz]
   ];
   P.polygon(target, stripe, '#8c8473', 0.134, 0.012);
  }

  // 5. PASSEIO NOBRE ELEVADO EM FRENTE ÀS FACHADAS
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

  // 6. MURO DE CONTENÇÃO DA ÁGUA (PARAPEITO) E ILUMINAÇÃO COLONIAL NA ORLA DO LAGO
  for (let i = 0; i < shore.length - 1; i++) {
   const p1 = shore[i], p2 = shore[i+1];
   const dx = p2[0] - p1[0], dz = p2[1] - p1[1], len = Math.hypot(dx, dz) || 1;
   const mx = (p1[0] + p2[0]) / 2, mz = (p1[1] + p2[1]) / 2;
   const ang = Math.atan2(dx, dz);

   // Mureta de contenção / parapeito no contato com a água
   const wall = P.box(target, mx, 0.06, mz, 0.32, 0.72, len, '#ece8df');
   wall.rotation.y = ang;

   // Guarda-corpo arquitetônico metálico escuro no topo da mureta
   P.beam(target, [p1[0], 0.82, p1[1]], [p2[0], 0.82, p2[1]], 0.045, '#3d4b53');

   // Balaústre / pilar vertical a cada nó
   P.box(target, p1[0], 0.06, p1[1], 0.42, 0.82, 0.42, '#ece8df');

   // Postes pretos coloniais curvados com luminária (fotos reais)
   const hLamp = 4.4;
   P.cylinder(target, p1[0], 0.12, p1[1], 0.075, hLamp, '#1f2428', 0.055);
   const armNx = dz / len * 1.2, armNz = -dx / len * 1.2;
   P.beam(target, [p1[0], hLamp, p1[1]], [p1[0] + armNx, hLamp + 0.28, p1[1] + armNz], 0.042, '#1f2428');
   P.cylinder(target, p1[0] + armNx, hLamp + 0.16, p1[1] + armNz, 0.16, 0.24, '#1f2428', 0.08);
   P.add(target, new T.SphereGeometry(0.12, 6, 6), '#fdf6e2', p1[0] + armNx, hLamp + 0.12, p1[1] + armNz);
  }

  // 7. ESTÁTUAS E MOBILIÁRIO REAL DA PRAÇA (FOTOS REAIS)
  // Estátua do Touro (Charging Bull) em frente à Sagrada Família / Anfiteatro
  const bullPos = [460, 614];
  P.cylinder(target, bullPos[0], 0.14, bullPos[1], 2.4, 0.40, '#ece8df');
  P.cylinder(target, bullPos[0], 0.40, bullPos[1], 2.2, 0.15, '#2e483e');
  P.box(target, bullPos[0], 0.55, bullPos[1], 1.2, 0.85, 2.0, '#2e483e');
  P.cylinder(target, bullPos[0], 0.95, bullPos[1] + 1.1, 0.35, 0.65, '#2e483e');
  P.beam(target, [bullPos[0] - 0.35, 1.35, bullPos[1] + 1.2], [bullPos[0] - 0.65, 1.55, bullPos[1] + 1.45], 0.05, '#dedcd4');
  P.beam(target, [bullPos[0] + 0.35, 1.35, bullPos[1] + 1.2], [bullPos[0] + 0.65, 1.55, bullPos[1] + 1.45], 0.05, '#dedcd4');
  P.cylinder(target, bullPos[0] + 1.3, 0.55, bullPos[1] + 0.4, 0.14, 1.4, '#2e483e');
  P.add(target, new T.SphereGeometry(0.15, 6, 6), '#2e483e', bullPos[0] + 1.3, 2.0, bullPos[1] + 0.4);

  // Estátua do Elefante de Bronze em frente ao Palácio Rosa Indiano
  const elephantPos = [456, 594];
  P.cylinder(target, elephantPos[0], 0.14, elephantPos[1], 2.4, 0.40, '#ece8df');
  P.cylinder(target, elephantPos[0], 0.40, elephantPos[1], 2.2, 0.15, '#2e483e');
  P.box(target, elephantPos[0], 0.55, elephantPos[1], 1.4, 1.2, 2.2, '#2e483e');
  P.cylinder(target, elephantPos[0], 1.2, elephantPos[1] + 1.2, 0.42, 0.85, '#2e483e');
  P.beam(target, [elephantPos[0], 1.6, elephantPos[1] + 1.4], [elephantPos[0], 2.2, elephantPos[1] + 2.1], 0.14, '#2e483e');
  P.beam(target, [elephantPos[0] - 0.28, 1.2, elephantPos[1] + 1.3], [elephantPos[0] - 0.45, 1.0, elephantPos[1] + 1.7], 0.05, '#f4f1ea');
  P.beam(target, [elephantPos[0] + 0.28, 1.2, elephantPos[1] + 1.3], [elephantPos[0] + 0.45, 1.0, elephantPos[1] + 1.7], 0.05, '#f4f1ea');

  // Palhotas tradicionais de palha cônica escalonada
  for (const hPos of [[454, 602], [448, 582]]) {
   P.cylinder(target, hPos[0], 0.14, hPos[1], 1.8, 0.35, '#ece8df');
   P.cylinder(target, hPos[0], 0.45, hPos[1], 0.18, 2.2, '#5d4037');
   P.add(target, new T.ConeGeometry(2.2, 1.4, 16), '#8e734c', hPos[0], 2.4, hPos[1]);
   P.add(target, new T.ConeGeometry(1.5, 1.0, 16), '#7a603c', hPos[0], 3.2, hPos[1]);
  }

 // 9. TALUDE E BOSQUE DENSO DE FUNDO (MATA NATIVA DO CERRADO ATRÁS DAS FACHADAS E DA CASA CUIABANA)
  const treeColors = ['#2d4e23', '#3b5e28', '#4a6f32', '#516f3d', '#3d653b'];
  const w1Coords = D.registered.water[1].coordinates[0];
  const w2Coords = D.registered.water[2].coordinates[0];
  for (let row = 0; row < 6; row++) {
   const distFromSpine = 7.5 + row * 4.8;
   const yBerm = 0.5 + row * 0.9;
  for (let s = 0; s <= 20; s++) {
   const t = s / 20;
   const d = totalSpine * t;
   let j = 1; while (j < spineLens.length - 1 && spineLens[j] < d) j++;
   const a = spine[j-1], b = spine[j], segT = (d - spineLens[j-1]) / (spineLens[j] - spineLens[j-1]);
   const bx = a[0] + (b[0] - a[0]) * segT, bz = a[1] + (b[1] - a[1]) * segT;
   const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1;
   const hillNx = dz / len, hillNz = -dx / len;

   const tx = bx + hillNx * distFromSpine + (s % 2 ? 1.2 : -1.2);
   const tz = bz + hillNz * distFromSpine + (row % 2 ? 0.9 : -0.9);
   const hTree = 4.8 + ((s * 7 + row * 11) % 5) * 0.65;
   const rCrown = 2.2 + ((s * 3 + row * 7) % 4) * 0.45;
   const color = treeColors[(s + row * 2) % treeColors.length];

   // Preservar a esplanada, anfiteatro, acessos e orla completamente limpos de árvores
   if (tx >= 418 && tx <= 490 && tz >= 620 && tz <= 675) continue;
   if (inside([tx, tz], plazaPts) || inside([tx, tz], w1Coords) || inside([tx, tz], w2Coords)) continue;

   P.cylinder(target, tx, yBerm, tz, 0.26, hTree * 0.6, '#523a28', 0.18);
   const crown = P.add(target, new T.SphereGeometry(rCrown, 8, 6), color, tx, yBerm + hTree * 0.75, tz);
   crown.scale.set(1.0 + (s % 3) * 0.1, 0.85, 1.0 + (row % 2) * 0.15);
  }
 }

  // Bosque denso de cerrado na encosta norte subindo atrás da Casa Cuiabana (conforme media_1789656856751.jpg e media_1789670775103.jpg)
  for (let r = 0; r < 5; r++) {
   for (let c = 0; c < 9; c++) {
    const tx = 430 + c * 7.0 + (r % 2 ? 2.0 : -2.0);
    const tz = 682 + r * 6.0 + (c % 2 ? 1.5 : -1.5);
    const yBerm = 1.4 + r * 1.35; // elevação contínua da encosta
    const hTree = 4.4 + ((r * 3 + c * 5) % 4) * 0.55;
    const rCrown = 2.8 + ((r + c) % 3) * 0.45;
    const color = treeColors[(r + c) % treeColors.length];
    P.cylinder(target, tx, yBerm, tz, 0.28, hTree * 0.55, '#523a28', 0.18);
    const crown = P.add(target, new T.SphereGeometry(rCrown, 8, 6), color, tx, yBerm + hTree * 0.7, tz);
    crown.scale.set(1.2, 0.75, 1.2);
   }
  }


  // Bosque nativo na península da margem oposta ao lago (conforme fotos do drone media_1789670991364.jpg e media_1789671125597.jpg)
  for (let r = 0; r < 4; r++) {
   for (let c = 0; c < 7; c++) {
    const tx = 335 + r * 10.0 + (c % 2 ? 2.5 : -2.5);
    const tz = 550 + c * 11.0 + (r % 2 ? 3.0 : -3.0);
    if (tx > 375 && tz > 560) continue;
    if (inside([tx, tz], w1Coords) || inside([tx, tz], w2Coords)) continue;
    const hTree = 5.0 + ((r * 3 + c * 7) % 5) * 0.7;
    const rCrown = 2.4 + ((r + c * 2) % 4) * 0.5;
    const color = treeColors[(r * 2 + c) % treeColors.length];
    P.cylinder(target, tx, 0.2, tz, 0.28, hTree * 0.55, '#523a28', 0.18);
    const crown = P.add(target, new T.SphereGeometry(rCrown, 8, 6), color, tx, 0.2 + hTree * 0.7, tz);
    crown.scale.set(1.05, 0.88, 1.05);
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

 // 11. AMBIENTAÇÃO REAL DA CASA CUIABANA, ANFITEATRO, ESPLANADA E VIAS DE ACESSO
 buildCasaCuiabanaEnvirons(target);

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
 const grass=registeredMaterial('grass','#43752e',.88),asphalt=registeredMaterial('asphalt','#afb2ae',.92),parkingMat=registeredMaterial('parking','#626962',.94),lakeMat=registeredMaterial('water','#1d8e9f',.06),bankMat=registeredMaterial('bank','#92856b',.97);
 const gOrig=ROAD03.surfaces.ground,filteredIndices=[];
 for(let i=0;i<gOrig.indices.length;i+=3){
  const a=gOrig.indices[i],b=gOrig.indices[i+1],c=gOrig.indices[i+2];
  const mx=(gOrig.points[a*2]+gOrig.points[b*2]+gOrig.points[c*2])/3;
  const mz=(gOrig.points[a*2+1]+gOrig.points[b*2+1]+gOrig.points[c*2+1])/3;
  if(mx>=350&&mx<=405&&mz>=500&&mz<=555)continue;
  filteredIndices.push(a,b,c);
 }
 registeredFloor(landscape,{points:gOrig.points,indices:filteredIndices},grass,0,'Terreno recortado');
 registeredFloor(landscape,ROAD03.surfaces.roads,roadAsphaltMaterial(),.12,'Vias · superfícies sem sobreposição');
 const bOrig=R.meshes.banks,filteredBanks=[];
 for(let i=0;i<bOrig.indices.length;i+=3){
  const a=bOrig.indices[i],b=bOrig.indices[i+1],c=bOrig.indices[i+2];
  const mx=(bOrig.points[a*2]+bOrig.points[b*2]+bOrig.points[c*2])/3;
  const mz=(bOrig.points[a*2+1]+bOrig.points[b*2+1]+bOrig.points[c*2+1])/3;
  if(mx>=350&&mx<=405&&mz>=500&&mz<=555)continue;
  filteredBanks.push(a,b,c);
 }
 registeredFloor(landscape,{points:bOrig.points,indices:filteredBanks},bankMat,.01,'Margens · interpretação da prancha');
 registeredFloor(water,R.meshes.water,lakeMat,-.08,'Água · contornos compatibilizados');
 const channelOuter=[
  [384.0,503.0],[404.4,529.6],[398.6,530.5],[392.7,532.8],
  [387.5,534.9],[383.1,537.0],[379.5,539.0],[376.7,540.9],
  [374.1,543.1],[371.9,545.7],[370.1,548.6],[368.5,551.8],
  [368.4,554.3],[353.0,523.0]
 ];
 shapeMesh(water,channelOuter,[],lakeMat,-.08,.04);
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
