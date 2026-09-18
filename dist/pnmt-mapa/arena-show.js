import * as T from 'three';

// Horizontal registration: R84 implantation, in the shared 1600 px plan space.
// Roof, glazing and detached support blocks: the existing aerial photograph
// assets/spaces/arena-show.webp, compared with the registered R83/R84 plant.
// Drive retrofit renders are proposals; their sculpture and plaza redesign are
// deliberately not part of this existing-building interpretation.
// Heights, details and material values are visual parameters, not surveyed meters.
export const arenaLayout={
 pavilion:{position:[479,441.5],rotation:Math.PI/2,width:96,depth:68},
 plaza:{position:[555,478],rotation:Math.PI/4},
};

export const ARENA_ARCHITECTURE_VERSION='arena-arquitetura-20260913-1';
const arenaMaterials=new Map();
const finish={
 roof:{color:'#e5e8e3',roughness:.48,metalness:.12,envMapIntensity:.85},
 seam:{color:'#dfe4df',roughness:.48,metalness:.15},
 soffit:{color:'#cbd1ce',roughness:.82,metalness:.04},
 fascia:{color:'#639fc0',roughness:.48,metalness:.12},
 frame:{color:'#99a7a9',roughness:.38,metalness:.6},
 steel:{color:'#becac8',roughness:.53,metalness:.42},
 glass:{color:'#344c53',roughness:.14,metalness:.24,envMapIntensity:1.55},
 panel:{color:'#455355',roughness:.69,metalness:.08},
 white:{color:'#e1e5df',roughness:.8,metalness:.01},
 concrete:{color:'#c4c8c0',roughness:.93,metalness:0},
 dark:{color:'#243437',roughness:.67,metalness:.04},
};
function surface(name){
 if(!arenaMaterials.has(name)){
  const material=new T.MeshStandardMaterial(finish[name]);
  material.name='arena:'+name;material.userData.arenaSurface=name;
  arenaMaterials.set(name,material);
 }
 return arenaMaterials.get(name);
}
const painted=(mesh,kind)=>{mesh.material=surface(kind);return mesh;};
let arenaTextures=null;
export function configureArenaMaterials(renderer){
 if(!arenaTextures){
  const n=128,data=new Uint8Array(n*n*4);let seed=9013;
  for(let i=0;i<n*n;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const value=225+(seed>>>28);data.set([value,value,value,255],i*4);
  }
  const rough=new T.DataTexture(data,n,n,T.RGBAFormat);
  rough.name='arena:paint-roughness';rough.wrapS=rough.wrapT=T.RepeatWrapping;
  rough.minFilter=T.LinearMipmapLinearFilter;rough.magFilter=T.LinearFilter;
  rough.generateMipmaps=true;rough.needsUpdate=true;arenaTextures=[rough];
 }
 for(const tex of arenaTextures)tex.anisotropy=Math.min(8,renderer?.capabilities?.getMaxAnisotropy?.()??1);
 for(const name of ['roof','fascia','panel']){
  const material=surface(name);material.roughnessMap=arenaTextures[0];material.needsUpdate=true;
 }
 return arenaTextures;
}
// Only the roof needs its original parametric UVs. Flatten its local transform
// before skipBatch: the common batcher reparents kept meshes into the place root.
function keepRoofUV(mesh,arena){
 arena.updateWorldMatrix(true,true);
 const m=arena.matrixWorld.clone().invert().multiply(mesh.matrixWorld);
 mesh.geometry.applyMatrix4(m);mesh.position.set(0,0,0);mesh.quaternion.identity();mesh.scale.set(1,1,1);
 mesh.userData.skipBatch=true;mesh.userData.arenaPart='roof';arena.add(mesh);
}

const halfWidth=arenaLayout.pavilion.width/2,halfDepth=arenaLayout.pavilion.depth/2;
export function roofHalfDepth(x){
 const corner=9.0,dx=Math.max(0,Math.abs(x)-(halfWidth-corner));
 return halfDepth-corner+Math.sqrt(Math.max(0,corner*corner-dx*dx));
}
export function roofHeight(x,z){
 const u=x/halfWidth,v=z/halfDepth;
 const archHeight=8.5+7.8*Math.cos(u*1.55)-2.2*(u*u);
 const backHeight=7.2+2.8*Math.cos(u*1.45)-1.0*(u*u);
 const t=(v+1)*0.5;
 const wave=0.85*Math.sin(u*Math.PI*2)*(1-v*v);
 return (1-t)*backHeight+t*archHeight+wave;
}

export function buildArenaShow(arena,{add,box,beam,tube,path,polygon,cylinder,groupAt,inPolygon,C}){
 arena.userData.arenaArchitectureVersion=ARENA_ARCHITECTURE_VERSION;
 arena.userData.arenaEvidence='R83/R84 + aerial photograph; visual vertical proportions';
 const pavilion=arenaLayout.pavilion;
 const hall=groupAt(arena,...pavilion.position,pavilion.rotation);
 hall.name='Arena Show · Pavilhão Aberto Ondulado';

 // 1. PISO DO ANFITEATRO / ARENA
 box(hall,0,.12,0,92,.35,64,'#c8c8bc');
 for(let x=-44;x<=44;x+=8){path(hall,[[x,-31],[x,31]],.08,'#aeb2a8',.48,false,false);}
 for(let z=-30;z<=30;z+=8){path(hall,[[-45,z],[45,z]],.08,'#aeb2a8',.49,false,false);}

 // Remove the previous decorative semicircles: the aerial reference shows
 // an open event floor, not a set of permanent concentric seating rings.

 // 2. COBERTURA ONDULADA ORGÂNICA (MALHA CONTÍNUA)
 const nx=140,nz=56,positions=[],indices=[],uvs=[];
 for(let j=0;j<=nz;j++){
  for(let i=0;i<=nx;i++){
   const uFrac=i/nx,vFrac=j/nz;
   const x=(uFrac-.5)*pavilion.width,maxZ=roofHalfDepth(x),z=(vFrac*2-1)*maxZ,y=roofHeight(x,z);
   positions.push(x,y,z);uvs.push(uFrac*12,vFrac*8);
   if(i<nx&&j<nz){
    const k=j*(nx+1)+i;indices.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);
   }
  }
 }

 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);geometry.computeVertexNormals();

 const skin=painted(add(hall,geometry,C.white), 'roof');skin.name='Cobertura Branca Ondulada';
 keepRoofUV(skin,arena);

 // Clone the original local grid: the upper mesh now uses canonical coordinates.
 const soffit=new T.BufferGeometry();soffit.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 soffit.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));soffit.translate(0,-1.05,0);
 const bottomIndices=indices.slice();
 for(let i=0;i<bottomIndices.length;i+=3)[bottomIndices[i+1],bottomIndices[i+2]]=[bottomIndices[i+2],bottomIndices[i+1]];
 soffit.setIndex(bottomIndices);soffit.computeVertexNormals();
 const underMesh=painted(add(hall,soffit,'#cfd7d5'),'soffit');underMesh.name='Forro Inferior da Cobertura';
 keepRoofUV(underMesh,arena);

 // 3. TESTEIRA AZUL-PISCINA / TURQUESA CONTÍNUA (FASCIA PERIMETRAL)
 const boundary=[];
 for(let i=0;i<=nx;i++)boundary.push(i);
 for(let j=1;j<=nz;j++)boundary.push(j*(nx+1)+nx);
 for(let i=nx-1;i>=0;i--)boundary.push(nz*(nx+1)+i);
 for(let j=nz-1;j>0;j--)boundary.push(j*(nx+1));

 const edgePoints=boundary.map(i=>positions.slice(i*3,i*3+3));
 const sidePositions=[],sideIndices=[];
 for(let i=0;i<=edgePoints.length;i++){
  const [x,y,z]=edgePoints[i%edgePoints.length];
  sidePositions.push(x,y+.05,z,x,y-1.05,z);
  if(i<edgePoints.length){const k=i*2;sideIndices.push(k,k+2,k+1,k+1,k+2,k+3);}
 }
 const fasciaGeo=new T.BufferGeometry();
 fasciaGeo.setAttribute('position',new T.Float32BufferAttribute(sidePositions,3));
 fasciaGeo.setIndex(sideIndices);fasciaGeo.computeVertexNormals();
 const fasciaMesh=painted(add(hall,fasciaGeo,'#5ea8d8'),'fascia');fasciaMesh.name='Testeira Azul-Piscina Contínua';
 tube(hall,edgePoints.filter((_,i)=>i%2===0),.11,C.white,true);

 // Standing seams follow exactly the existing roof height and boundary.
 // Their spacing is a visual finish parameter, not a manufacturer specification.
 const seamPositions=[],seamIndices=[];
 for(let sx=-46.25;sx<47;sx+=1.25){
  const max=roofHalfDepth(sx)-.32,base=seamPositions.length/3,segments=36;
  for(let j=0;j<=segments;j++){
   const z=-max+2*max*j/segments;
   for(const [dx,dy] of [[-.026,.035],[0,.083],[.026,.035]])
    seamPositions.push(sx+dx,roofHeight(sx+dx,z)+dy,z);
   if(j<segments){const k=base+j*3;seamIndices.push(k,k+3,k+1,k+1,k+3,k+4,k+1,k+4,k+2,k+2,k+4,k+5);}
  }
 }
 const seamGeo=new T.BufferGeometry();seamGeo.setAttribute('position',new T.Float32BufferAttribute(seamPositions,3));
 seamGeo.setIndex(seamIndices);seamGeo.computeVertexNormals();
 painted(add(hall,seamGeo,C.white),'seam').name='Juntas longitudinais da cobertura';

 // 4. PILARES CILÍNDRICOS DE CONCRETO ESTRUTURAL
 const columnCols=[
  {z:-25,xs:[-36,-20,0,20,36]},
  {z:-2,xs:[-40,-22,22,40]},
  {z:25,xs:[-38,-24,24,38]}
 ];
 for(const col of columnCols){
  for(const cx of col.xs){
   const topY=roofHeight(cx,col.z)-1.1;
   painted(cylinder(hall,cx,.2,col.z,.85,topY-.2,'#dadcd5',.85),'concrete');
   painted(cylinder(hall,cx,.2,col.z,1.08,.24,'#dadcd5'),'concrete');
   cylinder(hall,cx,topY-.5,col.z,1.25,.45,'#bcc1bc',1.0);
  }
 }

 // Treliças estruturais sob a cobertura
 for(const tz of [-25,-2,25]){
  const ptsTop=[],ptsBot=[];
  for(let tx=-42;tx<=42;tx+=2.5){ptsTop.push([tx,roofHeight(tx,tz)-1.15,tz]);ptsBot.push([tx,roofHeight(tx,tz)-2.15,tz]);}
  painted(tube(hall,ptsTop,.11,'#b8c5c4'),'steel');painted(tube(hall,ptsBot,.11,'#b8c5c4'),'steel');
  for(let tx=-42;tx<42;tx+=3.5){
   const nextX=Math.min(tx+3.5,42);
   beam(hall,[tx,roofHeight(tx,tz)-1.15,tz],[nextX,roofHeight(nextX,tz)-2.15,tz],.07,'#c2cecd');
   beam(hall,[tx,roofHeight(tx,tz)-2.15,tz],[nextX,roofHeight(nextX,tz)-1.15,tz],.07,'#c2cecd');
  }
 }

 // Secondary purlins and connections stay beneath the existing roof.
 for(let px=-38;px<=38;px+=4.75){
  const points=[];for(let pz=-26;pz<=26;pz+=2)points.push([px,roofHeight(px,pz)-1.18,pz]);
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  painted(add(hall,new T.TubeGeometry(curve,24,.065,6,false),'#becac8'),'steel');
 }

 // 5. PALCO E BACKSTAGE (FACILIDADES TÉCNICAS E DOCAS VOLTADAS AO LAGO)
 box(hall,0,.4,-22,42,1.4,15,'#555d5b');
 box(hall,0,1.8,-21.5,36,.2,12,'#373f3d');
 box(hall,0,1.8,-29,44,7.8,1.2,C.dark);

 box(hall,0,.35,-38,34,6.4,13,'#45514e');
 box(hall,0,6.75,-38,35,.5,14,C.white);
 for(const dx of [-12,0,12]){
  box(hall,dx,.8,-44.6,4.2,3.4,.25,'#263330');
  beam(hall,[dx-2.2,.2,-44.7],[dx-2.2,4.3,-44.7],.1,C.white);
  beam(hall,[dx+2.2,.2,-44.7],[dx+2.2,4.3,-44.7],.1,C.white);
  box(hall,dx,4.25,-45.2,5.0,.25,1.5,'#78909c');
 }

 // The plan labels two bathrooms and one bar along each lateral edge.
 // Keep the established lateral setback; separate the formerly generic volume.
 // These local subdivisions follow the plant/photo visually, not measured CAD.
 const supportBlocks=[];
 for(const side of [-1,1])for(const [z,depth,kind] of [[-24,12,'bwc'],[0,11,'bar'],[27,11,'bwc']]){
  const wing=groupAt(hall,side*51,z),front=-side*4.55;
  supportBlocks.push({side,z,depth,kind});
  painted(box(wing,0,.35,0,9,3.8,depth,'#485552'),'panel');
  painted(box(wing,0,4.15,0,9.6,.32,depth+.5,C.white),'roof');
  painted(box(wing,0,.35,0,9.12,.45,depth+.12,'#aaa'),'concrete');
  // Light roof curb and edge flashing.
  for(const end of [-1,1])painted(box(wing,0,4.47,end*(depth/2),9.6,.16,.16,C.white),'white');
  if(kind==='bar'){
   painted(box(wing,front,1.55,0,.18,1.95,depth-1.2,'#213531'),'dark');
   painted(box(wing,front-side*.32,1.50,0,.8,.16,depth-1,C.white),'concrete');
   painted(box(wing,front-side*.60,3.65,0,1.55,.22,depth+.2,C.white),'white');
   for(let zz=-depth/2+.9;zz<depth/2;zz+=2.2)painted(box(wing,front-side*.12,1.5,zz,.18,2.14,.10,C.white),'frame');
  }else{
   painted(box(wing,front,.78,1.4,.18,2.65,2.6,'#213531'),'dark');
   painted(box(wing,front-side*.6,3.58,1.4,1.65,.22,4.1,C.white),'white');
   for(const zz of [-depth/2+1.1,-depth/2+3])painted(box(wing,side*4.56,2.55,zz,.18,.8,1.45,'#213531'),'glass');
  }
  // Sparse cladding joints, baked into material batches rather than individual draw calls.
  for(let zz=-depth/2+.4;zz<depth/2;zz+=.8)painted(box(wing,side*4.56,.85,zz,.08,3.2,.035,'#667174'),'frame');
 }
 arena.userData.arenaSupportBlocks=supportBlocks;

 // 6. ESPLANADA DA ARENA (ENTRE ARENA E BILHETERIA)
 const curve=new T.CurvePath();
 const v=(x,z)=>new T.Vector3(x,0,z);
 curve.add(new T.CubicBezierCurve3(v(511,398),v(530,400),v(561,424),v(565,442)));
 curve.add(new T.CubicBezierCurve3(v(565,442),v(566,461),v(540,487),v(516,491)));
 const edge=curve.getPoints(64).map(p=>[p.x,p.z]);
 const apron=[[498,398],...edge,[498,491]];
 polygon(arena,apron,'#d6d5cb',.05,.25).name='Esplanada frontal da Arena';
 path(arena,edge,.7,C.white,.36,false,false);

 for(let z=405;z<489;z+=12){
  let start=null,end=null;
  for(let x=510;x<567;x+=.8)if(inPolygon([x,z],apron)){start??=x;end=x;}
  if(start!==null&&end>start)path(arena,[[start,z],[end,z]],.08,'#b8bcb3',.34,false,false);
 }

 const length=curve.getLength();let previous=null;
 for(let d=0;d<=length;d+=4.2){
  const point=curve.getPointAt(d/length);
  if(point.x>540&&point.z>467){previous=null;continue;}
  beam(arena,[point.x,.35,point.z],[point.x,2.1,point.z],.045,'#78909c');
  if(previous)for(const y of [.8,1.9])beam(arena,[previous.x,y,previous.z],[point.x,y,point.z],.025,'#78909c');
  previous=point;
 }

 // 7. PRAÇA ABERTA — TELÃO DE LED E PÉRGOLA
 // Fotos aéreas: não há bilheteria fechada nesta posição. A área entre
 // a Arena e a orla/Vila das Nações é uma praça aberta com pavimento,
 // um telão de LED sobre suporte metálico e uma pérgola em Y na borda.
 const plazaRef=arenaLayout.plaza;
 const plaza=groupAt(arena,...plazaRef.position,plazaRef.rotation);
 plaza.name='Praça Aberta · Telão e Pérgola';

 // Piso pavimentado aberto
 const plazaPaving=[[-22,-10],[22,-10],[24,14],[21,42],[-19,42],[-22,14]];
 polygon(plaza,plazaPaving,'#c4c6be',.04,.26);
 path(plaza,[[-22,-10],[-22,14],[-19,42]],.55,C.white,.36,false,false);
 path(plaza,[[22,-10],[24,14],[21,42]],.55,C.white,.36,false,false);

 // Juntas do piso
 for(let z=-6;z<40;z+=3.2)
  path(plaza,[[-20,z],[20,z]],.05,'#aaada5',.30,false,false);
 for(let x=-19;x<=20;x+=3.2)
  path(plaza,[[x,-8],[x,40]],.05,'#aaada5',.30,false,false);

 // Telão de LED sobre suporte metálico (referência: prints 3 e 4)
 painted(box(plaza,0,3.4,4,8.5,5,.30,'#181c1c'),'dark');
 painted(box(plaza,0,.50,4,9.2,.22,.85,'#363a3a'),'concrete');
 for(const dx of [-3.2,3.2]){
  beam(plaza,[dx,.6,4],[dx,6,4],.14,'#556062');
  beam(plaza,[dx,.6,4.5],[dx,5.2,4.15],.065,'#556062');
 }
 painted(box(plaza,0,5.95,4,9,.14,.38,'#404444'),'panel');
 painted(box(plaza,0,.88,4,9,.14,.38,'#404444'),'panel');
 for(const s of [-1,1])painted(box(plaza,s*4.35,3.4,4,.14,5.2,.38,'#404444'),'panel');

 // Pérgola em Y na borda junto à orla (referência: print 3 close-up)
 const perg=groupAt(plaza,2,34);
 // Tronco do Y
 polygon(perg,[[-2,-5],[2,-5],[2.5,0],[-2.5,0]],'#d8d4c6',3.5,.10);
 // Braço esquerdo
 polygon(perg,[[-2.5,0],[-6.5,6],[-3.5,6],[0,0]],'#d8d4c6',3.5,.10);
 // Braço direito
 polygon(perg,[[0,0],[3.5,6],[6.5,6],[2.5,0]],'#d8d4c6',3.5,.10);
 // Pilares
 for(const [px,pz] of [[0,-3],[-5,5],[5,5],[0,0],[-1.5,-3.5],[1.5,-3.5]])
  beam(perg,[px,.05,pz],[px,3.5,pz],.09,'#889088');
 // Drip edge (borda contínua)
 path(perg,[[-2,-5],[2,-5],[2.5,0],[6.5,6],[-6.5,6],[-2.5,0],[-2,-5]],.05,C.white,3.6,true,false);

 // 8. FAIXAS DE GRAMADO LATERAIS
 // Fotos aéreas: gramado entre a calçada da praça e o passeio da orla.
 for(const pts of [
  [[-21,-6],[-23,-6],[-23,38],[-21,38]],
  [[21,-6],[23,-6],[24,38],[22,38]],
  [[-16,40],[-10,44],[10,44],[16,40]]
 ]) polygon(plaza,pts,'#4d7636',.06,.12);

 // Superpostes de iluminação de estádio
 for(const [lx,lz] of [[548,420],[567,448],[545,488],[583,501]]){
  cylinder(arena,lx,.1,lz,.4,.8,'#bcc4be');
  beam(arena,[lx,.7,lz],[lx,16.5,lz],.14,'#455a64');
  box(arena,lx,16.4,lz,3.2,.3,.8,'#263238');
  box(arena,lx,17.1,lz,3.8,.25,.8,'#263238');
  for(let rx=-1.5;rx<=1.5;rx+=.75){
   box(arena,lx+rx,16.8,lz+.4,.5,.45,.15,C.white);
   box(arena,lx+rx,16.8,lz-.4,.5,.45,.15,C.white);
  }
 }
}
