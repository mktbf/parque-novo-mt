import * as T from 'three';

// Horizontal registration: R84 implantation, in the shared 1600 px plan space.
// Roof and facades: aerial photograph supplied by the user, c98b6e81…df05.png.
// Vertical dimensions remain an architectural interpretation of that photograph.
export const arenaLayout={
 pavilion:{position:[479,441.5],rotation:Math.PI/2,width:96,depth:68},
 ticketOffice:{position:[565,476],rotation:Math.PI/4},
};

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
 const pavilion=arenaLayout.pavilion;
 const hall=groupAt(arena,...pavilion.position,pavilion.rotation);
 hall.name='Arena Show · Pavilhão Aberto Ondulado';

 // 1. PISO DO ANFITEATRO / ARENA
 box(hall,0,.12,0,92,.35,64,'#c8c8bc');
 for(let x=-44;x<=44;x+=8){path(hall,[[x,-31],[x,31]],.08,'#aeb2a8',.48,false,false);}
 for(let z=-30;z<=30;z+=8){path(hall,[[-45,z],[45,z]],.08,'#aeb2a8',.49,false,false);}

 for(let k=0;k<5;k++){
  const r=26+k*3.5,pts=[];
  for(let a=-Math.PI*.75;a<=Math.PI*.75;a+=.1){pts.push([Math.cos(a)*r,-18+Math.sin(a)*(r*.55)]);}
  path(hall,pts,2.8,'#b8b8ac',.35+k*.18,false,false);
 }

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

 const skin=add(hall,geometry,C.white,0,0,0,.05,.35);skin.name='Cobertura Branca Ondulada';

 const soffit=geometry.clone();soffit.translate(0,-1.05,0);
 const bottomIndices=indices.slice();
 for(let i=0;i<bottomIndices.length;i+=3)[bottomIndices[i+1],bottomIndices[i+2]]=[bottomIndices[i+2],bottomIndices[i+1]];
 soffit.setIndex(bottomIndices);soffit.computeVertexNormals();
 const underMesh=add(hall,soffit,'#cfd7d5',0,0,0,.1,.65);underMesh.name='Forro Inferior da Cobertura';

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
 const fasciaMesh=add(hall,fasciaGeo,'#5ea8d8',0,0,0,.15,.32);fasciaMesh.name='Testeira Azul-Piscina Contínua';
 tube(hall,edgePoints.filter((_,i)=>i%2===0),.11,C.white,true);

 // 4. PILARES CILÍNDRICOS DE CONCRETO ESTRUTURAL
 const columnCols=[
  {z:-25,xs:[-36,-20,0,20,36]},
  {z:-2,xs:[-40,-22,22,40]},
  {z:25,xs:[-38,-24,24,38]}
 ];
 for(const col of columnCols){
  for(const cx of col.xs){
   const topY=roofHeight(cx,col.z)-1.1;
   cylinder(hall,cx,.2,col.z,.85,topY-.2,'#dadcd5',.85);
   cylinder(hall,cx,topY-.5,col.z,1.25,.45,'#bcc1bc',1.0);
  }
 }

 // Treliças estruturais sob a cobertura
 for(const tz of [-25,-2,25]){
  const ptsTop=[],ptsBot=[];
  for(let tx=-42;tx<=42;tx+=2.5){ptsTop.push([tx,roofHeight(tx,tz)-1.15,tz]);ptsBot.push([tx,roofHeight(tx,tz)-2.15,tz]);}
  tube(hall,ptsTop,.11,'#b8c5c4');tube(hall,ptsBot,.11,'#b8c5c4');
  for(let tx=-42;tx<42;tx+=3.5){
   const nextX=Math.min(tx+3.5,42);
   beam(hall,[tx,roofHeight(tx,tz)-1.15,tz],[nextX,roofHeight(nextX,tz)-2.15,tz],.07,'#c2cecd');
   beam(hall,[tx,roofHeight(tx,tz)-2.15,tz],[nextX,roofHeight(nextX,tz)-1.15,tz],.07,'#c2cecd');
  }
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

 for(const side of [-1,1]){
  const wing=groupAt(hall,side*51,0);
  box(wing,0,.35,0,9,3.8,22,'#485552');
  box(wing,0,4.15,0,9.6,.45,22.8,C.white);
  for(const wz of [-8,0,8])box(wing,side*4.55,.9,wz,.12,2.6,2.2,'#213531');
 }

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

 // 7. PAVILHÃO DE ACESSO / BILHETERIA (SETOR SHOW 13)
 const office=arenaLayout.ticketOffice;
 const ticket=groupAt(arena,...office.position,office.rotation);
 ticket.name='Setor Show 13 · Bilheteria e Controle de Acesso';

 const entryPaving=[[-22,-10],[22,-10],[24,12],[21,42],[-19,42],[-22,12]];
 polygon(ticket,entryPaving,'#c8ccc5',.04,.26);
 path(ticket,[[-22,-10],[-22,12],[-19,42]],.65,C.white,.36,false,false);
 path(ticket,[[22,-10],[24,12],[21,42]],.65,C.white,.36,false,false);

 const officeOutline=[[-17,-7],[18,-7],[18,7.5],[5.5,7.5],[5.5,2.0],[-5.5,2.0],[-5.5,7.5],[-17,7.5]];
 polygon(ticket,officeOutline,C.white,.35,.45);
 polygon(ticket,officeOutline,'#e2e7e4',5.2,.45).name='Platibanda e cobertura plana';

 box(ticket,.5,.8,-6.7,35,4.4,.5,'#dbe2df');
 box(ticket,-16.7,.8,.25,.5,4.4,14.5,'#dbe2df');
 box(ticket,17.7,.8,.25,.5,4.4,14.5,'#dbe2df');

 for(const [px,pw] of [[-14.2,5.5],[14.8,6.5]]){
  box(ticket,px,2.6,7.35,pw,2.6,.25,'#2b393f');
  box(ticket,px<0?-16.95:17.95,2.6,4.8,.25,2.6,4.5,'#2b393f');
 }

 const glassWall=(x0,z0,x1,z1)=>{
  const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz);
  const wall=groupAt(ticket,(x0+x1)/2,(z0+z1)/2,-Math.atan2(dz,dx));
  box(wall,0,.9,0,len,4.2,.15,C.glass);
  for(let i=0,n=Math.ceil(len/1.2);i<=n;i++)box(wall,-len/2+i*len/n,.8,.05,.07,4.3,.2,'#90a4ae');
  for(const gy of [.9,2.5,5.0])box(wall,0,gy,.05,len,.08,.18,'#90a4ae');
 };
 glassWall(-16.5,7.2,-5.5,7.2);glassWall(5.5,7.2,17.5,7.2);
 glassWall(-5.5,7.2,-5.5,1.8);glassWall(5.5,1.8,5.5,7.2);glassWall(-5.5,1.8,5.5,1.8);

 for(const bx of [-3.2,-1.1,1.1,3.2]){
  box(ticket,bx,1.0,2.1,1.5,2.4,.4,'#37474f');
  box(ticket,bx,2.3,2.35,1.3,.35,.1,'#cfd8dc');
 }

 // 8. PRAÇA FRONTAL COM ILHAS DE PAISAGISMO GEOMÉTRICO
 const gardenBeds=[
  [[-4.5,4.0],[-1.0,4.0],[-4.5,7.2]],
  [[1.0,4.0],[4.5,4.0],[4.5,7.2]],
  [[-12.5,11],[-4.5,11],[-8.5,16.5]],
  [[4.5,11],[12.5,11],[8.5,16.5]],
  [[-17.5,19],[-13.5,25],[-17.5,32]],
  [[18.5,19],[14.5,25],[18.5,32]]
 ];
 for(const pts of gardenBeds){
  path(ticket,[...pts,pts[0]],.4,C.white,.45,true,false);
  polygon(ticket,pts,'#4d7c36',.42,.12);
 }

 path(ticket,[[-19,9],[20,36]],.9,'#dadcd2',.44,false,false);
 path(ticket,[[19,9],[-18,36]],.9,'#dadcd2',.44,false,false);
 path(ticket,[[0,8],[0,40]],1.6,'#dadcd2',.45,false,false);

 for(const side of [-1,1])for(let z=14;z<=38;z+=4){
  const shrub=add(ticket,new T.SphereGeometry(.85,10,8),'#335c24',side*19.2,.95,z);
  shrub.scale.set(1.1,.7,1.1);
 }

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
