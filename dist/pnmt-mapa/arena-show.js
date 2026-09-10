import * as T from 'three';

// Horizontal registration: R84 implantation, in the shared 1600 px plan space.
// Roof and facades: aerial photograph supplied by the user, c98b6e81…df05.png.
// Vertical dimensions remain an architectural interpretation of that photograph.
export const arenaLayout={
 pavilion:{position:[479,441.5],rotation:Math.PI/2,width:92,depth:64},
 ticketOffice:{position:[565,476],rotation:Math.PI/4},
};

const halfWidth=arenaLayout.pavilion.width/2,halfDepth=arenaLayout.pavilion.depth/2;
export function roofHalfDepth(x){
 const corner=7.5,dx=Math.max(0,Math.abs(x)-(halfWidth-corner));
 return halfDepth-corner+Math.sqrt(Math.max(0,corner*corner-dx*dx));
}
export function roofHeight(x,z){
 const u=x/halfWidth,v=z/halfDepth;
 return 8.4+6.7*Math.exp(-Math.pow((u+.06)/.5,2))+.35*u+1.3*(1-v*v)-.35*v;
}

export function buildArenaShow(arena,{add,box,beam,tube,path,polygon,cylinder,groupAt,inPolygon,C}){
 const pavilion=arenaLayout.pavilion;
 const hall=groupAt(arena,...pavilion.position,pavilion.rotation);
 hall.name='Arena · pavilhão aberto';

 // Open concrete floor. The long east facade has no enclosing glass wall.
 box(hall,0,.18,0,88,.32,60,'#c4c4b9');
 for(let x=-42;x<=42;x+=7)path(hall,[[x,-29],[x,29]],.055,'#aeb2ab',.505,false,false);
 for(let z=-28;z<=28;z+=7)path(hall,[[-43,z],[43,z]],.055,'#aeb2ab',.51,false,false);

 // One curved shell with a white skin, a separate soffit and a blue-gray fascia.
 const nx=120,nz=48,positions=[],indices=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const x=(i/nx-.5)*pavilion.width,z=(j/nz*2-1)*roofHalfDepth(x);
  positions.push(x,roofHeight(x,z),z);
  if(i<nx&&j<nz){const k=j*(nx+1)+i;indices.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);}
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 const skin=add(hall,geometry,C.white,0,0,0,.12,.48);skin.name='Cobertura branca ondulada';
 const soffit=geometry.clone();soffit.translate(0,-.9,0);
 const bottomIndices=indices.slice();
 for(let i=0;i<bottomIndices.length;i+=3)[bottomIndices[i+1],bottomIndices[i+2]]=[bottomIndices[i+2],bottomIndices[i+1]];
 soffit.setIndex(bottomIndices);soffit.computeVertexNormals();
 add(hall,soffit,'#cdd5d3',0,0,0,.15,.58).name='Forro inferior da cobertura';

 const boundary=[];
 for(let i=0;i<=nx;i++)boundary.push(i);
 for(let j=1;j<=nz;j++)boundary.push(j*(nx+1)+nx);
 for(let i=nx-1;i>=0;i--)boundary.push(nz*(nx+1)+i);
 for(let j=nz-1;j>0;j--)boundary.push(j*(nx+1));
 const edgePoints=boundary.map(i=>positions.slice(i*3,i*3+3));
 const sidePositions=[],sideIndices=[];
 for(let i=0;i<=edgePoints.length;i++){
  const [x,y,z]=edgePoints[i%edgePoints.length];
  sidePositions.push(x,y-.06,z,x,y-.9,z);
  if(i<edgePoints.length){const k=i*2;sideIndices.push(k,k+2,k+1,k+1,k+2,k+3);}
 }
 const fascia=new T.BufferGeometry();
 fascia.setAttribute('position',new T.Float32BufferAttribute(sidePositions,3));
 fascia.setIndex(sideIndices);fascia.computeVertexNormals();
 add(hall,fascia,'#a7c6d1',0,0,0,.18,.4).name='Testeira azul-cinza contínua';
 tube(hall,edgePoints.filter((_,i)=>i%2===0),.085,C.white,true);

 // Fine standing seams run down the roof pitch; no oversized decorative ribs.
 for(let x=-44.8;x<45;x+=1.4){
  const end=roofHalfDepth(x)-.2,points=[];
  for(let j=0;j<=24;j++){const z=-end+2*end*j/24;points.push([x,roofHeight(x,z)+.027,z]);}
  tube(hall,points,.025,'#e0e6e3');
 }

 // Exposed curved steel trusses under the shell and sparse concrete supports.
 for(const z of [-24,-3,24.5]){
  const top=[],bottom=[];
  for(let x=-43;x<=43;x+=2){top.push([x,roofHeight(x,z)-1.04,z]);bottom.push([x,roofHeight(x,z)-2.02,z]);}
  tube(hall,top,.105,'#b9c6c5');tube(hall,bottom,.105,'#b9c6c5');
  for(let x=-43,i=0;x<42;x+=3.4,i++){
   const end=Math.min(x+3.4,43);
   beam(hall,[x,roofHeight(x,z)-(i%2?1.04:2.02),z],[end,roofHeight(end,z)-(i%2?2.02:1.04),z],.065,'#cdd5d3');
  }
 }
 for(let x=-40;x<=40;x+=8){
  const points=[];
  for(let z=-29;z<=29;z+=2)points.push([x,roofHeight(x,z)-1.1,z]);
  tube(hall,points,.075,'#b9c6c5');
 }
 const post=(a,b)=>{
  const from=new T.Vector3(...a),to=new T.Vector3(...b),axis=to.clone().sub(from);
  const mesh=add(hall,new T.BoxGeometry(.64,axis.length(),.82),C.white,...from.clone().add(to).multiplyScalar(.5).toArray());
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());
 };
 for(const z of [-23,-2,24]){
  const columns=z===24?[-39,-23,22,40]:[-40,-22,0,22,40];
  for(const x of columns){
   const top=roofHeight(x,z)-2.04;
   if(z===24){
    for(const side of [-1,1])post([x+side*.45,.5,z],[x+side*1.05,top,z-.6]);
    box(hall,x,top-.2,z-.6,3,.42,1.1,C.white);
   }else post([x,.5,z],[x,top,z]);
  }
 }

 // Backstage at the lake-facing rear; low support blocks along both ends.
 box(hall,0,.5,-22,37,1.15,13,'#666e6b');
 box(hall,0,1.65,-28.5,41,7.1,1.1,C.dark);
 box(hall,0,.35,-37,29,6,11,'#47534f');
 box(hall,0,6.35,-37,30,.48,12,C.white);
 for(const x of [-11,11])box(hall,x,1,-42.6,3.6,3,.15,'#69736f');
 for(const side of [-1,1])for(const z of [-22,0,22]){
  const wing=groupAt(hall,side*49,z);
  box(wing,0,.35,0,8.2,3.7,11.5,'#45534f');
  box(wing,0,4.05,0,8.9,.44,12.1,C.white);
  box(wing,0,.35,0,8.35,.5,11.6,'#aeb8b3');
  for(const dz of [-3.3,0,3.3]){
   box(wing,side*4.13,.95,dz,.1,2.6,1.8,'#253c37');
   box(wing,side*4.22,3.65,dz,.1,.16,2,C.white);
  }
  for(let dz=-4.5;dz<=4.5;dz+=.65)box(wing,0,4.51,dz,8.3,.035,.06,'#d8dfdb');
 }

 // The forecourt follows the curved east apron in the implantation drawing.
 const curve=new T.CurvePath();
 const v=(x,z)=>new T.Vector3(x,0,z);
 curve.add(new T.CubicBezierCurve3(v(511,398),v(530,400),v(561,424),v(565,442)));
 curve.add(new T.CubicBezierCurve3(v(565,442),v(566,461),v(540,487),v(516,491)));
 const edge=curve.getPoints(64).map(p=>[p.x,p.z]);
 const apron=[[498,398],...edge,[498,491]];
 polygon(arena,apron,'#c9c6b9',.04,.28).name='Praça aberta entre arena e bilheteria';
 path(arena,edge,.6,C.white,.35,false,false);
 for(let z=405;z<489;z+=10){
  let start=null,end=null;
  for(let x=510;x<567;x+=.7)if(inPolygon([x,z],apron)){start??=x;end=x;}
  if(start!==null&&end>start)path(arena,[[start,z],[end,z]],.06,'#b2b5aa',.33,false,false);
 }
 // Low perimeter fence, with an opening toward the ticket-office approach.
 const length=curve.getLength();
 let previous=null;
 for(let d=0;d<=length;d+=4){
  const point=curve.getPointAt(d/length);
  if(point.x>540&&point.z>467){previous=null;continue;}
  beam(arena,[point.x,.35,point.z],[point.x,1.9,point.z],.045,'#8d9e98');
  if(previous)for(const y of [.7,1.7])beam(arena,[previous.x,y,previous.z],[point.x,y,point.z],.025,'#8d9e98');
  previous=point;
 }

 const office=arenaLayout.ticketOffice;
 const ticket=groupAt(arena,...office.position,office.rotation);
 ticket.name='Bilheteria · acesso independente';
 const entryPaving=[[-18,-9],[19,-9],[21,12],[19,38],[-17,38],[-19,12]];
 polygon(ticket,entryPaving,'#b8bcb6',.03,.28);
 path(ticket,[[-18,-9],[-19,12],[-17,38]],.55,C.white,.36,false,false);
 path(ticket,[[19,-9],[21,12],[19,38]],.55,C.white,.36,false,false);

 // White U-shaped roof, recessed glazed entrance and two unequal end wings.
 const officeOutline=[[-15,-6],[16,-6],[16,6.5],[4.5,6.5],[4.5,1.8],[-4.5,1.8],[-4.5,6.5],[-15,6.5]];
 polygon(ticket,officeOutline,C.white,.36,.42);
 polygon(ticket,officeOutline,C.white,4.82,.44).name='Cobertura plana com recuo central';
 box(ticket,.5,.78,-5.75,31,4.04,.5,C.white);
 box(ticket,-14.75,.78,.25,.5,4.04,12.5,C.white);
 box(ticket,15.75,.78,.25,.5,4.04,12.5,C.white);

 const curtain=(a,b)=>{
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
  const wall=groupAt(ticket,(a[0]+b[0])/2,(a[1]+b[1])/2,-Math.atan2(dz,dx));
  box(wall,0,.9,0,length,3.87,.13,C.glass);
  for(let i=0,n=Math.ceil(length/1.15);i<=n;i++)box(wall,-length/2+i*length/n,.78,.04,.065,4,.17,'#b9c7c6');
  for(const y of [.88,2.3,4.61])box(wall,0,y,.04,length,.075,.17,'#b9c7c6');
 };
 curtain([-14.5,6.25],[-4.5,6.25]);curtain([4.5,6.25],[15.5,6.25]);
 curtain([-4.5,6.25],[-4.5,1.55]);curtain([4.5,1.55],[4.5,6.25]);
 curtain([-4.5,1.55],[4.5,1.55]);
 // The large graphite end panels seen in the photograph wrap the corners.
 for(const [x,w] of [[-12.6,4.8],[13.1,5.8]]){
  box(ticket,x,2.52,6.38,w,2.31,.22,'#48534f');
  box(ticket,x<0?-15.03:16.03,2.52,4.48,.2,2.31,3.9,'#48534f');
 }
 // Recessed entrance doors and glazed ticket-counter bays.
 for(const x of [-1.15,1.15]){
  box(ticket,x,1.05,1.68,2.15,2.65,.045,'#49635e');
  for(const side of [-1,1])box(ticket,x+side*1.07,.91,1.73,.065,2.85,.07,'#c4cfcb');
  beam(ticket,[x+.67,1.8,1.81],[x+.67,2.45,1.81],.035,C.white);
 }
 for(const x of [-8.9,-6.3,6.3,8.9]){
  box(ticket,x,1.67,6.4,1.65,.12,.34,'#d8dfd8');
  for(const side of [-1,1])box(ticket,x+side*.78,1.76,6.38,.05,1.1,.06,'#c9d3cc');
  box(ticket,x,2.86,6.38,1.6,.06,.06,'#c9d3cc');
 }
 path(ticket,[...officeOutline,officeOutline[0]],.095,'#d6e0db',5.29,false,false);
 for(let x=-14;x<=15;x+=2){
  const front=x>-4.5&&x<4.5?1.5:6.2;
  path(ticket,[[x,-5.7],[x,front]],.035,'#e1e6e1',5.27,false,false);
 }

 // Angular paving and low planting retain the photographic entrance character.
 for(const pts of [
  [[-3.8,3.6],[-.9,3.6],[-3.8,6.5]],[[.9,3.6],[3.8,3.6],[3.8,6.5]],
  [[-11,10],[-4,10],[-7.3,14.8]],[[4,10],[11.5,10],[7.5,15.5]],
  [[-15.7,17],[-12.1,22.7],[-15.5,29]],[[16.7,17],[13.1,23.2],[16.3,29]],
 ])polygon(ticket,pts,'#688d49',.34,.08);
 for(const pts of [
  [[-17,8],[18,33]],[[17,8],[-16,33]],
  [[-17,24],[3,9]],[[18,24],[-2,9]],
 ])path(ticket,pts,.74,'#d9dcd2',.435,false,false);
 path(ticket,[[0,7],[0,37]],1.3,'#dadcd2',.44,false,false);
 for(const side of [-1,1])for(let z=12;z<=36;z+=3.5){
  const shrub=add(ticket,new T.SphereGeometry(.7,8,6),'#547b45',side*(side===1?19.5:17.6),.86,z);
  shrub.scale.y=.65;
 }
 // Slender light poles, outside the main roof and pedestrian approach.
 for(const [x,z] of [[548,420],[567,448],[545,488],[583,501]]){
  cylinder(arena,x,.1,z,.32,.65,'#c9c9bd');
  beam(arena,[x,.5,z],[x,10.5,z],.075,'#687c75');
  for(const side of [-1,1]){
   beam(arena,[x,10.2,z],[x+side*1.15,10.55,z],.055,'#687c75');
   box(arena,x+side*1.15,10.51,z,.9,.12,.4,'#dce0d8');
  }
 }
}
