import {roadFinishData as ROAD03,roadAsphaltMaterial} from './vias-acabamento.js?v=vias-acabamento-20260915-4';
import * as T from 'three';
import {buildAutodromeArchitecture} from './autodromo-arquitetura.js?v=autodromo-arquitetura-20260913-1';
import {implantationData as D} from './implantacao-dados.js?v=autodromo-arquitetura-20260913-1';
import {primitives as P} from './refinamentos.js?v=autodromo-arquitetura-20260913-1';

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

 const line = D.village.spine;
 const lengths = [0];
 for (let i = 1; i < line.length; i++) lengths.push(lengths.at(-1) + Math.hypot(line[i][0] - line[i-1][0], line[i][1] - line[i-1][1]));
 const total = lengths.at(-1);

 facades.forEach((f, i) => {
  const d = total * (i + 0.5) / facades.length;
  let j = 1;
  while (j < lengths.length - 1 && lengths[j] < d) j++;
  const a = line[j-1], b = line[j], t = (d - lengths[j-1]) / (lengths[j] - lengths[j-1]);
  f.position.set(a[0] + (b[0] - a[0]) * t, 0, a[1] + (b[1] - a[1]) * t);
  f.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  f.scale.set(0.85, 0.85, 0.85);
  target.add(f);
 });

 const steps = 36;
 const backEdge = [], frontEdge = [], midEdge = [];
 for (let i = 0; i <= steps; i++) {
  const t = i / steps, d = total * t;
  let j = 1;
  while (j < lengths.length - 1 && lengths[j] < d) j++;
  const a = line[j-1], b = line[j], segT = (d - lengths[j-1]) / (lengths[j] - lengths[j-1]);
  const px = a[0] + (b[0] - a[0]) * segT, pz = a[1] + (b[1] - a[1]) * segT;
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1;
  const nx = -dz / len, nz = dx / len;

  // Largura suave da esplanada: mais larga no centro onde ficam as estátuas e afunilando nas pontas
  const esplanadeWidth = 5.5 + 7.0 * Math.sin(t * Math.PI);
  backEdge.push([px - nx * 1.2, pz - nz * 1.2]);
  midEdge.push([px + nx * (esplanadeWidth * 0.55), pz + nz * (esplanadeWidth * 0.55)]);
  frontEdge.push([px + nx * esplanadeWidth, pz + nz * esplanadeWidth]);

  // Vegetação nativa no talude atrás das fachadas (conforme fotos 01, 02 e 03)
  if (i % 3 === 0) {
   const tx = px - nx * 4.2 + (i % 2 ? 0.8 : -0.8);
   const tz = pz - nz * 4.2 + (i % 2 ? -0.8 : 0.8);
   P.cylinder(target, tx, 0.4, tz, 0.22, 3.2, '#5d4037', 0.16);
   P.add(target, new T.SphereGeometry(1.6, 8, 6), i % 2 ? '#3b5e28' : '#4a6f32', tx, 3.4, tz);
  }
 }

 const esplanadePts = [...backEdge, ...frontEdge.slice().reverse()];
 P.polygon(target, esplanadePts, '#cec8bc', 0.135, 0.08);

 // Faixas transversais listradas da esplanada (fotos 04 e 05)
 for (let i = 2; i < steps - 2; i += 2) {
  const p1 = backEdge[i], p2 = frontEdge[i];
  const p1b = backEdge[i+1], p2b = frontEdge[i+1];
  P.polygon(target, [p1, p2, p2b, p1b], '#b8b2a5', 0.142, 0.02);
 }

 for (let i = 0; i < steps; i++) {
  const p1 = frontEdge[i], p2 = frontEdge[i+1];
  P.beam(target, [p1[0], 0.15, p1[1]], [p2[0], 0.15, p2[1]], 0.16, '#cec8bc');
  P.beam(target, [p1[0], 0.85, p1[1]], [p2[0], 0.85, p2[1]], 0.035, '#3d4b53');
  if (i % 2 === 0) {
   P.beam(target, [p1[0], 0.15, p1[1]], [p1[0], 0.85, p1[1]], 0.04, '#3d4b53');
  }
  if (i % 4 === 1) {
   P.beam(target, [p1[0], 0.15, p1[1]], [p1[0], 4.0, p1[1]], 0.05, '#3d4b53');
   P.beam(target, [p1[0], 4.0, p1[1]], [p1[0] - 0.8, 4.2, p1[1] - 0.8], 0.04, '#3d4b53');
   P.box(target, p1[0] - 0.9, 4.15, p1[1] - 0.9, 0.4, 0.12, 0.22, '#f8fafc');
  }
 }

 if (midEdge[18]) {
  const ex = midEdge[18][0], ez = midEdge[18][1];
  P.cylinder(target, ex, 0.14, ez, 1.4, 0.4, '#cec8bc', 1.4);
  P.box(target, ex, 0.55, ez, 1.3, 0.85, 1.8, '#2e483e');
  P.cylinder(target, ex, 1.0, ez + 1.0, 0.32, 0.65, '#2e483e');
  P.beam(target, [ex, 1.3, ez + 1.1], [ex, 1.8, ez + 1.6], 0.11, '#2e483e');
 }

 if (midEdge[22]) {
  const bx = midEdge[22][0], bz = midEdge[22][1];
  P.cylinder(target, bx, 0.14, bz, 1.3, 0.35, '#cec8bc', 1.3);
  P.box(target, bx, 0.50, bz, 1.0, 0.70, 1.6, '#2e483e');
  P.cylinder(target, bx, 0.85, bz + 0.85, 0.28, 0.5, '#2e483e');
  P.beam(target, [bx - 0.32, 1.2, bz + 0.9], [bx - 0.55, 1.4, bz + 1.1], 0.045, '#dcd7c4');
  P.beam(target, [bx + 0.32, 1.2, bz + 0.9], [bx + 0.55, 1.4, bz + 1.1], 0.045, '#dcd7c4');
 }

 for (const idx of [15, 25]) {
  if (midEdge[idx]) {
   const qx = midEdge[idx][0], qz = midEdge[idx][1];
   P.cylinder(target, qx, 0.14, qz, 1.1, 0.22, '#cec8bc', 1.1);
   P.cylinder(target, qx, 0.36, qz, 0.75, 1.3, '#d8d2c4', 0.75);
   P.add(target, new T.ConeGeometry(1.5, 1.1, 14), '#8e734c', qx, 2.0, qz);
  }
 }

 target.name = 'Vila das Nações · fachadas ao longo da orla';
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
