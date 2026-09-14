import * as T from 'three';

// Lote 03. Posições na prancha de 1600 px; o root existente aplica a origem uma vez.
// Contornos digitalizados da R84/R83; alturas e acabamentos interpretados dos renders.
export const leisureVersion='espacos-acabamento-20260914-3';
export const leisureMaterials=new Map();
export const leisureLayout={
 wheel:{center:[508,738],rotation:.74,radius:24.5,axisHeight:30,cabins:42,plazaRadius:21.5,bridge:[[500,727],[472,709]]},
 bmx:{center:[311,858],rotation:.4,lanes:[-13.5,-4.5,4.5,13.5],width:5.7,top:-25,bottomLeft:22,bottomRight:16},
 house:{corners:[[455.5,646],[466,650.5],[459,666.8],[448.5,662.3]],front:[[455.5,646],[448.5,662.3]],depth:11.43},
 source:{plan:'GOV_U_ParqueNovoMT_ARQ_Implantação_R84.pdf',stamp:'R83',units:'unidades gráficas, não metros',digitizationTolerance:1.2}
};
function mat(key,color,roughness=.8,metalness=0){
 const options={color,roughness,metalness,envMapIntensity:metalness>.1?1.1:.7};
 const m=key==='pearl'?new T.MeshPhysicalMaterial({...options,iridescence:.72,iridescenceIOR:1.3,iridescenceThicknessRange:[150,480]}):new T.MeshStandardMaterial(options);
 m.name='Lazer · '+key;m.userData.leisureSurface=key;leisureMaterials.set(key,m);return m;
}
const M={
 white:mat('paint-white','#dbe1de',.48,.12),steel:mat('steel','#687a7c',.43,.72),dark:mat('dark','#344a4d',.6,.35),
 glass:mat('glass','#5b8b90',.2,.26),glassAlt:mat('glass-alt','#8aa4a1',.27,.22),
 concrete:mat('concrete','#babdb8',.92),paving:mat('paving','#d1cdc0',.92),pavingAlt:mat('paving-alt','#b4b3a8',.94),
 cream:mat('cream','#e0dfb6',.91),yellow:mat('ochre','#d9b35c',.9),pearl:mat('pearl','#ded9e3',.45,.12),
 stone:mat('stone','#a7a99f',.94),stoneDark:mat('stone-dark','#747b78',.92),granite:mat('granite','#8c8985',.9),rose:mat('rose','#9b796b',.92),
 wood:mat('wood','#97866a',.86),soil:mat('soil','#695640',.97),grass:mat('grass','#688647',.96),
 leaf:mat('leaf','#416343',.92),leafAlt:mat('leaf-alt','#65713f',.94),leafWine:mat('leaf-wine','#5b4143',.96),
 blue:mat('bmx-blue','#4e87b6',.85),bank:mat('bmx-yellow','#d6b954',.91),navy:mat('bmx-navy','#183e65',.68),
 bluePanel:mat('panel-blue','#32678c',.6,.12),blueMid:mat('panel-mid','#759cac',.6,.12),joint:mat('joint','#747e79',.95)
};
function mesh(g,geo,m,name='',cast=true){const o=new T.Mesh(geo,m);o.name=name;o.castShadow=cast;o.receiveShadow=true;g.add(o);return o;}
function box(g,x,y,z,w,h,d,m=M.concrete){const o=mesh(g,new T.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);return o;}
function cylinder(g,x,y,z,r,h,m=M.white,segments=16){const o=mesh(g,new T.CylinderGeometry(r,r,h,segments),m);o.position.set(x,y+h/2,z);return o;}
function group(g,x=0,z=0,a=0){const o=new T.Group();o.position.set(x,0,z);o.rotation.y=a;g.add(o);return o;}
function beam(g,a,b,r=.055,m=M.steel){const A=new T.Vector3(...a),B=new T.Vector3(...b),v=B.clone().sub(A);if(v.lengthSq()<1e-10)return;const o=mesh(g,new T.CylinderGeometry(r,r,v.length(),6),m);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
function ring(g,x,y,z,r,t,m=M.white,vertical=false){const o=mesh(g,new T.TorusGeometry(r,t,6,r<3?32:r<10?64:126),m);o.position.set(x,y,z);if(!vertical)o.rotation.x=-Math.PI/2;return o;}
function flat(g,ring,y,m=M.concrete){const s=new T.Shape();ring.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const geo=new T.ShapeGeometry(s);geo.rotateX(-Math.PI/2);const o=mesh(g,geo,m,'',false);o.position.y=y;return o;}
function surface(g,vertices,indices,m,name='',cast=false){
 const p=new T.Float32BufferAttribute(vertices,3),idx=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let i=0;i<indices.length;i+=3){a.fromBufferAttribute(p,indices[i]);b.fromBufferAttribute(p,indices[i+1]).sub(a);c.fromBufferAttribute(p,indices[i+2]).sub(a);if(b.cross(c).lengthSq()>1e-15)idx.push(...indices.slice(i,i+3));}
 // Só vértices usados, para não criar normais nulas em pontas convergentes.
 const used=[...new Set(idx)],remap=new Map(used.map((n,i)=>[n,i])),v=used.flatMap(n=>[p.getX(n),p.getY(n),p.getZ(n)]);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(idx.map(n=>remap.get(n)));geo.computeVertexNormals();return mesh(g,geo,m,name,cast);
}
function ruled(g,rows,m,name='',cast=false){const v=[],idx=[];for(const row of rows)v.push(...row[0],...row[1]);for(let i=0;i<rows.length-1;i++){let a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}return surface(g,v,idx,m,name,cast);}
function reset(g){g.traverse(o=>o.geometry?.dispose());g.clear();g.position.set(0,0,0);g.rotation.set(0,0,0);g.scale.set(1,1,1);}
function outline(g,w,d){g.updateMatrix();return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,z])=>{let p=new T.Vector3(x,0,z).applyMatrix4(g.matrix);return [p.x,p.z];});}
function worldPoint(g,p){g.updateMatrix();return new T.Vector3(...p).applyMatrix4(g.matrix).toArray();}
function rail(g,points,h=1,m=M.steel,step=1.4){
 for(let i=1;i<points.length;i++){const A=new T.Vector3(...points[i-1]),B=new T.Vector3(...points[i]),n=Math.ceil(A.distanceTo(B)/step);
  for(let k=0;k<=n;k++){let p=A.clone().lerp(B,k/n);beam(g,p.toArray(),[p.x,p.y+h,p.z],.032,m);}
  for(const hh of [h*.48,h])beam(g,[A.x,A.y+hh,A.z],[B.x,B.y+hh,B.z],.035,m);
 }
}
function shrub(g,x,z,r=1,color=M.leaf){
 cylinder(g,x,.15,z,r,.26,M.soil);ring(g,x,.37,z,r,.08,M.concrete);
 for(let i=0;i<7;i++){const a=i*2.3999,rr=r*.6*Math.sqrt(i/6);const o=mesh(g,new T.IcosahedronGeometry(r*.48,1),i%3?color:M.leafAlt);o.position.set(x+Math.cos(a)*rr,.7,z+Math.sin(a)*rr);o.scale.set(1,.7,1);}
}
function plazaTree(g,x,z){
 beam(g,[x,.4,z],[x,4.9,z],.13,M.wood);
 for(let i=0;i<5;i++){const a=i*2.4,xx=x+Math.cos(a)*1.05,zz=z+Math.sin(a)*1.05,y=4.7+(i%2)*.45;
  beam(g,[x,3.6,z],[xx,y,zz],.05,M.wood);const crown=mesh(g,new T.IcosahedronGeometry(1.3,2),i%2?M.leaf:M.leafAlt);crown.position.set(xx,y+.4,zz);crown.scale.set(1,1.05,1);
 }
}
function light(g,x,z,h=4){cylinder(g,x,.1,z,.075,h,M.dark,8);const o=box(g,x,h+.1,z,.8,.12,.45,M.white);o.castShadow=false;}
function arch(g,x,y,z,w,h,m=M.glass){
 const s=new T.Shape(),r=w/2;s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI,false);s.closePath();
 const o=mesh(g,new T.ShapeGeometry(s,14),m);o.position.set(x,y,z);
 beam(g,[x-r,y,z+.02],[x-r,y+h-r,z+.02],.075,M.white);beam(g,[x+r,y,z+.02],[x+r,y+h-r,z+.02],.075,M.white);
 for(let i=0;i<20;i++){const a=i/20*Math.PI,b=(i+1)/20*Math.PI;beam(g,[x+r*Math.cos(a),y+h-r+r*Math.sin(a),z+.02],[x+r*Math.cos(b),y+h-r+r*Math.sin(b),z+.02],.075,M.white);}
 beam(g,[x-r,y,z+.02],[x+r,y,z+.02],.075,M.white);beam(g,[x,y,z+.03],[x,y+h,z+.03],.025,M.wood);
 return o;
}

function wheel(g){
 reset(g);g.name='Roda-gigante · cabines, pavilhão e passarela';const D=leisureLayout.wheel,w=group(g,...D.center,D.rotation);
 cylinder(w,0,.02,0,D.plazaRadius,.16,M.paving,96);
 for(const r of [10.8,14.5,18.2,21])ring(w,0,.19,0,r,.045,M.pavingAlt);
 for(let i=0;i<56;i++){const a=i/56*Math.PI*2;beam(w,[Math.cos(a)*18.5,.19,Math.sin(a)*18.5],[Math.cos(a)*21.2,.19,Math.sin(a)*21.2],.012,M.joint);}
 for(const x of [-12,12])for(const z of [-5,5]){box(w,x,.18,z,3.6,.55,3.6);box(w,x,.73,z,2.8,.16,2.8,M.steel);beam(w,[x,.8,z],[0,D.axisHeight,z*.30],.63,M.white);beam(w,[x,.8,z*.72],[0,D.axisHeight,z*.30],.34,M.steel);}
 for(const y of [9,17,24]){const x=12*(1-y/D.axisHeight);for(const z of [-1,1])beam(w,[-x,y,z*(5-3.5*y/D.axisHeight)],[x,y,z*(5-3.5*y/D.axisHeight)],.19,M.white);}
 beam(w,[0,D.axisHeight,-4],[0,D.axisHeight,4],1.05,M.steel);
 for(const z of [-2.4,2.4]){ring(w,0,D.axisHeight,z,D.radius,.23,M.white,true);ring(w,0,D.axisHeight,z,D.radius-1.2,.15,M.white,true);const hub=mesh(w,new T.CylinderGeometry(1.45,1.45,.7,24),M.white);hub.rotation.x=Math.PI/2;hub.position.set(0,D.axisHeight,z);}
 const cabinAnchors=[];
 for(let i=0;i<D.cabins;i++){
  const a=i/D.cabins*Math.PI*2,b=(i+1)/D.cabins*Math.PI*2,x=Math.cos(a)*D.radius,y=D.axisHeight+Math.sin(a)*D.radius,nx=Math.cos(b)*D.radius,ny=D.axisHeight+Math.sin(b)*D.radius;
  for(const z of [-2.4,2.4]){beam(w,[0,D.axisHeight,z*.42],[x,y,z],.039,M.steel);beam(w,[Math.cos(a+.035)*3,D.axisHeight+Math.sin(a+.035)*3,z*.42],[x,y,z],.021,M.white);}
  beam(w,[x,y,-2.4],[x,y,2.4],.095);beam(w,[x,y,-2.4],[nx,ny,2.4],.06);beam(w,[x,y,2.4],[nx,ny,-2.4],.06);
  const c=group(w,x,0);c.position.y=y-2.45;c.name='Cabine '+String(i+1).padStart(2,'0');
  beam(c,[0,1.65,0],[0,2.45,0],.09,M.steel);
  const lower=mesh(c,new T.SphereGeometry(1.06,16,8),M.white);lower.scale.set(1,.24,1.2);lower.position.y=.3;
  const glazing=mesh(c,new T.CylinderGeometry(.99,.99,1.17,16),i%3?M.glass:M.glassAlt);glazing.position.y=.96;glazing.scale.z=1.16;
  const cap=mesh(c,new T.SphereGeometry(1.065,16,8),M.white);cap.scale.set(1,.24,1.2);cap.position.y=1.64;
  for(let k=0;k<8;k++){const aa=k/8*Math.PI*2;beam(c,[Math.cos(aa),.4,Math.sin(aa)*1.16],[Math.cos(aa),1.53,Math.sin(aa)*1.16],.023,M.white);}
  ring(c,0,.43,0,1,.026,M.dark);ring(c,0,1.49,0,1,.027,M.white);
  for(const xx of [-.32,.32])beam(c,[xx,.48,1.12],[xx,1.45,1.12],.024,M.steel);
  cabinAnchors.push(worldPoint(w,[x,y-2.45,0]));
 }
 // Pavilhão aberto no eixo de passagem das cabines. Nenhuma tampa atravessa a roda.
 box(w,0,.18,0,23.4,.22,12.5,M.concrete);
 for(const z of [-6,6]){
  for(let k=0;k<10;k++){const x=-10.55+k*2.34;
   if(z<0&&k===5){box(w,x,.43,z,2.20,5.12,.065,M.glass);box(w,x,8.2,z,2.20,.68,.065,M.glass);}
   else box(w,x,.43,z,2.20,8.45,.065,k%3?M.glass:M.glassAlt);
  }
  for(let x=-11.7;x<11.8;x+=2.34)box(w,x,.4,z+.04,.07,8.7,.14,M.steel);
  for(const y of [3.4,6.1,8.95]){
   if(z<0&&y===6.1){box(w,-5.9,y,z+.08,11.8,.09,.16,M.white);box(w,7.1,y,z+.08,9.4,.09,.16,M.white);}
   else box(w,0,y,z+.08,23.6,.09,.16,M.white);
  }
  const lower=x=>z<0&&x>=-.05&&x<=2.4?8.25:.5+6.35*Math.pow(Math.max(0,Math.sin((x+12)/24*Math.PI)),.8)+(z<0?.45*Math.sin(x*.23):0);
  const rows=Array.from({length:81},(_,i)=>{const x=-12+i*24/80;return [[x,9.3,z*1.06],[x,lower(x),z*1.06]];});
  const sh=ruled(w,rows,M.pearl,'Envoltória com vão em arco',true);sh.material.side=T.DoubleSide;
  for(let x=-11.8;x<=11.8;x+=.32)beam(w,[x,lower(x),z*1.064],[x,9.28,z*1.064],.009,M.white);
 }
 for(const z of [-4.55,4.55])box(w,0,9.24,z,23.9,.14,3.2,M.white);
 for(const x of [-11.75,11.75])for(const z of [-4.6,4.6])box(w,x,.45,z,.09,8.6,2.8,M.glass);
 for(const z of [-2.75,2.75]){box(w,0,3.01,z,20,.2,2,M.stoneDark);rail(w,[[-10,3.2,z*1.3],[10,3.2,z*1.3]],.9);}
 // Ligação interna da passarela ao embarque, fora do volume varrido pelas cabines.
 box(w,1.15,5.44,-5.10,2.4,.18,2.4,M.stoneDark);
 for(let i=0;i<11;i++)box(w,2.50+i*.35,5.40-i*.22,-4.7,.37,.22,1.3,M.stoneDark);
 for(const z of [-5.38,-4.02])rail(w,[[2.5,5.62,z],[6.0,3.42,z]],.8,M.steel);
 box(w,6.15,3.01,-3.75,1.5,.20,1.1,M.stoneDark);
 // Paisagismo da praça confinado à ilha, com corredor frontal livre.
 for(const a of [.12,.7,2.4,3.0,3.65,5.25]){const x=Math.cos(a)*17.3,z=Math.sin(a)*17.3;shrub(w,x,z,1.65,M.leafWine);plazaTree(w,x,z);light(w,x*.93,z*.93,4.3);}
 // Passarela: eixo digitalizado da prancha, não deslocado a partir do marcador.
 const [a,b]=D.bridge,dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),bridge=group(g,(a[0]+b[0])/2,(a[1]+b[1])/2,-Math.atan2(dz,dx));
 box(bridge,0,5.4,0,length,.22,3.2,M.stoneDark);box(bridge,0,8.38,0,length+.4,.11,3.65,M.white);
 for(const s of [-1,1]){
  rail(bridge,[[-length/2,5.62,s*1.51],[length/2,5.62,s*1.51]],1.12,M.white,.43);
  for(let x=-length/2;x<length/2;x+=4){const nx=Math.min(x+4,length/2);beam(bridge,[x,5.6,s*1.58],[nx,8.3,s*1.58],.11,M.white);beam(bridge,[x,8.3,s*1.58],[nx,5.6,s*1.58],.08,M.steel);}
 }
 for(const x of [-length/2,length/2])for(const z of [-1.4,1.4])beam(bridge,[x,.2,z],[x,8.3,z],.14,M.white);
 const entry=worldPoint(w,[1.15,0,-6.35]),joinLength=Math.hypot(entry[0]-a[0],entry[2]-a[1]);
 const join=group(g,(entry[0]+a[0])/2,(entry[2]+a[1])/2,-Math.atan2(entry[2]-a[1],entry[0]-a[0]));
 box(join,0,5.4,0,joinLength+.15,.22,2.2,M.stoneDark);box(join,0,8.38,0,joinLength+.15,.11,2.6,M.white);
 for(const z of [-1.12,1.12])rail(join,[[-joinLength/2,5.62,z],[joinLength/2,5.62,z]],1.12,M.white,.43);
 const t=group(g,b[0],b[1],bridge.rotation.y);box(t,0,.14,0,4.1,10.4,4.1,M.white);box(t,0,.35,2.07,1.25,2.1,.04,M.glass);box(t,0,5.6,2.07,1.25,2.0,.04,M.glass);
 box(t,-2.065,5.62,0,.035,2.05,1.65,M.glass);box(t,2.15,5.40,2.65,3.5,.22,1.5,M.stoneDark);
 for(const yy of [3.3,6.5,9.7])box(t,0,yy,2.09,4.12,.035,.02,M.joint);
 // Escada junto à torre, fora das pistas e sem apoios no vão da via.
 for(let i=0;i<24;i++)box(t,3.1,.2+i*.22,-3+i*.25,1.6,.22,.27,M.stoneDark);
 rail(t,[[2.28,.45,-3],[2.28,5.72,3]],.9);rail(t,[[3.92,.45,-3],[3.92,5.72,3]],.9);
 g.userData.leisureVersion=leisureVersion;g.userData.cabinCount=42;g.userData.cabinAnchors=cabinAnchors;g.userData.registration={center:D.center,rotation:D.rotation,plazaRadius:D.plazaRadius,bridge:D.bridge};
 g.userData.detailViews={pavilhao:{label:'Ver pavilhão e embarque',footprint:outline(w,32,29),height:13,direction:[.95,.36,1]},roda:{label:'Ver a roda completa',footprint:outline(w,54,27),height:57,direction:[.9,.42,1]},passarela:{label:'Ver passarela',footprint:outline(bridge,length+8,13),height:11,direction:[-.8,.55,.75]}};
}

function bmxHeight(lane,z){
 const ranges=[[-13,-4,5,14],[-17,-6,5,16],[-17,-7,4,11],[-14,-5,4,11]],amps=[[.8,1.1,1.35,.9],[1.1,.8,1.2,1],[1,.9,1.15,.7],[.7,1,.85,.65]];
 let y=.37;for(let j=0;j<ranges[lane].length;j++){let t=Math.abs(z-ranges[lane][j])/2.6;if(t<1)y+=amps[lane][j]*Math.cos(t*Math.PI/2)**2;}
 if(lane===0&&z<-14){let t=Math.max(0,Math.min(1,(-z-14)/11));y+=4.93*(t*t*(3-2*t));}
 return y;
}
function bmx(g){
 reset(g);g.name='BMX · largadas, taludes e acabamento';const D=leisureLayout.bmx,b=group(g,...D.center,D.rotation),xs=D.lanes,w=D.width;
 // Polígono local do setor digitalizado; não cobre avenida ou pista do Kart.
 flat(b,[[-26,-35],[18,-35],[21,25],[-20,35],[-26,-12]],.11,M.concrete);
 flat(b,[[-18,-25],[18,-25],[18,20],[-10,31],[-18,20]],.13,M.grass);
 const limits=[[-25,22],[-25,22],[-25,16],[-17,16]],edges=[];
 for(let lane=0;lane<4;lane++){
  const x=xs[lane],[z0,z1]=limits[lane],n=Math.ceil((z1-z0)*5),rows=[];
  for(let i=0;i<=n;i++){const z=z0+(z1-z0)*i/n,y=bmxHeight(lane,z);rows.push([[x-w/2,y,z],[x+w/2,y,z]]);}
  ruled(b,rows,M.blue,'Reta BMX '+(lane+1));
  for(const side of [-1,1]){
   ruled(b,rows.map(r=>{let p=r[side<0?0:1];return [[p[0],p[1]+.008,p[2]],[p[0]+side*.10,p[1]+.008,p[2]]];}),M.white);
   ruled(b,rows.map(r=>{let p=r[side<0?0:1];return [[p[0]+side*.11,p[1]-.015,p[2]],[p[0]+side*1.18,.145,p[2]]];}),M.grass);
  }
  edges.push({lane,x,z0,z1});
 }
 const turns=[[-9,22,0,Math.PI],[0,-25,Math.PI,Math.PI*2],[9,16,0,Math.PI]];
 for(const [cx,cz,a0,a1]of turns){
  const rows=[],bank=[];for(let i=0;i<=72;i++){const t=i/72,a=a0+(a1-a0)*t,y=.37+1.3*Math.sin(t*Math.PI)**.8;rows.push([[cx+Math.cos(a)*(4.5-w/2),.37,cz+Math.sin(a)*(4.5-w/2)],[cx+Math.cos(a)*(4.5+w/2),y,cz+Math.sin(a)*(4.5+w/2)]]);bank.push([rows.at(-1)[1],[cx+Math.cos(a)*(4.5+w/2+1.1),.145,cz+Math.sin(a)*(4.5+w/2+1.1)]]);}
  const q=ruled(b,rows,M.bank,'Curva elevada BMX');q.material.side=T.DoubleSide;ruled(b,bank,M.grass);
 }
 // Duas torres de largada dos renders: painéis verticais, aberturas e apoios.
 for(const [cx,width,h]of [[-13.5,6.8,5.3],[-21.1,6.8,3.65]]){
  const cz=-29.5,depth=8.8;box(b,cx,.12,cz,width,.23,depth,M.concrete);
  for(const xx of [-width/2,width/2])for(const zz of [-depth/2,depth/2])box(b,cx+xx,.34,cz+zz,.17,h+2.5,.17,M.dark);
  box(b,cx,h-.18,cz,width,.18,depth,M.stoneDark);box(b,cx,h+2.7,cz,width+.25,.15,depth+.2,M.white);
  for(const zz of [-depth/2,depth/2])for(let j=0;j<18;j++){
   let xx=cx-width/2+(j+.5)*width/18;
   for(let k=0;k<6;k++){const yy=.35+k*(h+2.3)/6;
    // Vão de saída frontal e portão inferior ficam efetivamente livres.
    if(zz===depth/2&&((yy>=h-.1&&yy<h+2.3)||(Math.abs(xx-cx)<1&&yy<2.1)))continue;
    box(b,xx,yy,cz+zz,width/18-.027,(h+2.3)/6-.026,.075,[M.white,M.bluePanel,M.navy,M.blueMid][(j*7+k*3)%4]);
   }
  }
  for(const side of [-1,1])for(let k=0;k<22;k++){
   const zz=cz-depth/2+(k+.5)*depth/22;
   for(let j=0;j<5;j++)box(b,cx+side*width/2,.35+j*(h+2.3)/5,zz,.075,(h+2.3)/5-.025,depth/22-.028,[M.navy,M.white,M.bluePanel][(k*5+j*7)%3]);
  }
  for(const side of [-1,1])rail(b,[[cx+side*width*.43,h,cz],[cx+side*width*.43,h,cz+depth/2]],.8,M.steel,.7);
  for(let i=0;i<8;i++)box(b,cx-width*.4+i*width*.8/7,h+.20,cz+depth/2+.06,.035,.12,.42,M.white);
 }
 // A rampa principal parte da plataforma e encontra a primeira reta sem degrau.
 ruled(b,[[[-13.5-w/2,5.3,-25.1],[-13.5+w/2,5.3,-25.1]],[[-13.5-w/2,5.3,-25],[-13.5+w/2,5.3,-25]]],M.blue);
 // Segunda rampa mostrada no render: perfil aproximado e união contínua à primeira reta.
 const rampRows=Array.from({length:101},(_,i)=>{const t=i/100,z=-25.1+17.1*t,merge=Math.max(0,(t-.58)/.42),smooth=merge*merge*(3-2*merge),x=-21.1+7.6*smooth;
  const drop=Math.min(1,t/.65),y=.37+3.28*(1-drop*drop*(3-2*drop));return [[x-w/2,y,z],[x+w/2,y,z]];});
 ruled(b,rampRows,M.blue,'Rampa secundária de largada');
 for(const side of [0,1]){
  const edge=rampRows.map(r=>r[side]);ruled(b,edge.map(p=>[[p[0],p[1]-.01,p[2]],[p[0]+(side?1:-1)*.5,.15,p[2]]]),M.grass);
  rail(b,edge.filter((p,i)=>i<=44&&i%11===0),1,M.bank,1);
 }
 for(const side of [-1,1])rail(b,Array.from({length:6},(_,i)=>{const z=-25+2*i;return [-13.5+side*w/2,bmxHeight(0,z),z];}),1,M.bank,1.4);
 // Cobertura da arquibancada no limite sul do desenho.
 const s=group(b,-1,33);for(let row=0;row<5;row++){box(s,0,.15+row*.28,row*.7,31,.3,.72);for(let k=0;k<56;k++){if(k%14===0)continue;box(s,-15+k*.54,.49+row*.28,row*.7, .42,.12,.4,M.white);}}
 for(const x of [-14,-7,0,7,14]){box(s,x,.16,2.8,.16,4.5,.16,M.steel);beam(s,[x,4.7,2.8],[x,4.9,-.8],.07,M.white);}
 box(s,0,4.95,1.05,33,.16,5.8,M.white);
 g.userData.leisureVersion=leisureVersion;g.userData.registration={center:D.center,rotation:D.rotation,lanes:edges,turns};
 g.userData.detailViews={largada:{label:'Ver largadas',footprint:[[-25.5,-34],[ -9,-34],[-9,-9],[-25.5,-9]].map(([x,z])=>{let p=worldPoint(b,[x,0,z]);return [p[0],p[2]];}),height:8.3,direction:[-.9,.4,-.6]},pista:{label:'Ver pista e relevo',footprint:outline(b,54,82),height:8.3,direction:[1,.9,1]}};
}

function house(g){
 reset(g);g.name='Casa Cuiabana · fachada, platibanda e escadarias';
 const D=leisureLayout.house,[a,b]=D.front,dx=b[0]-a[0],dz=b[1]-a[1],width=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx),cx=(a[0]+b[0])/2,cz=(a[1]+b[1])/2;
 // Fachada longa voltada para a praça; corpo para o interior do polígono da prancha.
 const f=group(g,cx,cz,angle),depth=D.depth,base=1.28,wall=4.25;
 box(f,0,.13,-depth/2,width,base,depth,M.stone);box(f,0,base,-depth/2,width,wall,depth,M.cream);
 box(f,0,base,0,width,.62,.16,M.yellow);box(f,0,base+wall-.62,0,width,.8,.16,M.yellow);
 const panels=9,bay=width/panels;
 for(let i=0;i<=panels;i++){const x=-width/2+i*bay;box(f,x,base-.02,.11,.14,wall+.45,.26,M.white);box(f,x,base-.02,.13,.25,.31,.32,M.white);box(f,x,base+3.4,.13,.25,.13,.32,M.white);}
 for(const y of [base+3.5,base+4.42])box(f,0,y,.08,width+.32,.12,.32,M.white);
 const center=0;
 for(let i=0;i<panels;i++){
  const x=-width/2+(i+.5)*bay,w=i===4?bay*.78:bay*.58,y=base+(i===4?.02:.66),h=i===4?2.78:2.20;
  arch(f,x,y,.102,w,h,i===4?M.wood:M.glass);
  if(i!==4){box(f,x,y,.16,w-.11,h-w/2-.04,.06,M.wood);for(let k=0;k<10;k++)box(f,x,y+.08+k*(h-w/2-.12)/10,.20,w-.18,.023,.035,M.stoneDark);}
 }
 box(f,center,base+4.42,-.55,bay*1.12,.62,1.25,M.yellow);box(f,center,base+5.04,-.55,bay*1.22,.11,1.45,M.white);
 // Cobertura recuada atrás da platibanda; duas águas com junta e telhas discretas.
 const yEave=base+wall-.15,yRidge=yEave+.8;
 for(const side of [-1,1]){
  const rows=Array.from({length:36},(_,i)=>{let x=-width/2+i*width/35;return [[x,yEave,side<0?-depth+.1:-.18],[x,yRidge,-depth/2]];});const q=ruled(f,rows,M.stoneDark,'Cobertura recuada',true);q.material.side=T.DoubleSide;
  for(let x=-width/2+.15;x<width/2;x+=.26)beam(f,[x,yEave+.018,side<0?-depth+.1:-.18],[x,yRidge+.018,-depth/2],.018,M.granite);
 }
 box(f,0,base+wall-.17,-depth,width,.18,.20,M.white);
 for(const side of [-1,1]){box(f,side*width/2,base,-depth/2,.12,wall,depth,M.cream);for(let j=0;j<4;j++){const q=group(f,side*(width/2+.075),-1.3-j*2.5,side*Math.PI/2);arch(q,0,base+.65,0,.95,2.1,M.wood);}}
 // Praça e escadaria: piso e patamares curtos, sem base retangular sobre o lago.
 const plaza=[[-width/2-1.1,-.2],[width/2+1.1,-.2],[width/2+1.5,3.5],[width*.38,6.0],[-width*.35,6.0],[-width/2-1.5,3.5]];
 flat(f,plaza,.15,M.paving);box(f,0,base-.17,1.1,width+1.7,.16,2.3,M.paving);
 // Centro e duas passagens laterais; entre elas há patamares para sentar.
 for(const x of [-width/2+.7,0,width/2-.7]){
  const n=8;for(let i=0;i<n;i++){const y=.16+(n-i)*.14,z=2.35+i*.37;box(f,x,y,z,1.15,.14,.39,i%2?M.granite:M.stoneDark);}
  for(const side of [-1,1])rail(f,[[x+side*.60,1.44,2.15],[x+side*.60,.33,5.10]],.70,M.steel,1.3);
 }
 for(const s of [-1,1])for(let i=0;i<4;i++){
  const w=width/2-2.1,x=s*(width/4-.1),z=2.55+i*.68,y=1.04-i*.22;
  box(f,x,.14,z,w,y,.70,i%2?M.granite:M.rose);box(f,x,y+.12,z-.13,w-.12,.06,.38,M.wood);
 }
 // Balaustrada e molduras são geometria, sem imagem de fachada colada.
 for(const s of [-1,1]){
  const x0=s<0?-width/2:-width/2+width*.58,x1=s<0?-width*.08:width/2;
  beam(f,[x0,base+.75,1.85],[x1,base+.75,1.85],.045,M.white);
  for(let x=x0;x<x1;x+=.34){cylinder(f,x,base+.04,1.85,.047,.63,M.white,8);const o=mesh(f,new T.SphereGeometry(.085,8,6),M.white);o.position.set(x,base+.32,1.85);o.scale.y=1.6;}
 }
 for(const x of [-width*.36,width*.36]){shrub(f,x,1.0,.58);light(f,x,1.45,3.2);}
 g.userData.leisureVersion=leisureVersion;g.userData.registration={corners:D.corners,front:D.front,center:[cx,cz],rotation:angle,width,depth};
 const fp=[[-width/2-2,-depth-1],[width/2+2,-depth-1],[width/2+2,6.5],[-width/2-2,6.5]].map(([x,z])=>{let p=worldPoint(f,[x,0,z]);return [p[0],p[2]];});
 const outward=new T.Vector3(0,.42,1).applyAxisAngle(new T.Vector3(0,1,0),angle);
 g.userData.detailViews={fachada:{label:'Ver fachada e praça',footprint:fp,height:6.5,direction:outward.toArray()},cobertura:{label:'Ver cobertura',footprint:D.corners,height:6.5,direction:[.6,1,.8]}};
}

function batch(g){
 g.updateWorldMatrix(true,true);const inv=g.matrixWorld.clone().invert(),buckets=new Map();
 g.traverse(o=>{if(!o.isMesh)return;const key=o.material.uuid+o.castShadow,geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(inv.clone().multiply(o.matrixWorld));
  if(!buckets.has(key))buckets.set(key,{m:o.material,cast:o.castShadow,v:[],n:[],uv:[]});const b=buckets.get(key),p=geo.attributes.position,n=geo.attributes.normal;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));b.v.push(x,y,z);b.n.push(n.getX(i),n.getY(i),n.getZ(i));b.uv.push((nx>ny&&nx>nz?z:x)/3,(ny>=nx&&ny>=nz?z:y)/3);}geo.dispose();o.geometry.dispose();
 });g.clear();for(const b of buckets.values()){let geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.v,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));geo.computeBoundingSphere();let o=mesh(g,geo,b.m,b.m.name,b.cast);o.userData.skipBatch=true;}
}
export function applyLeisureArchitecture(models){for(const[id,fn]of [['roda-gigante',wheel],['bmx',bmx],['casa-cuiabana',house]]){const g=models.get(id);if(!g)throw new Error('Espaço ausente: '+id);fn(g);batch(g);g.userData.provenance={type:'modelo interpretado de projeto',plan:leisureLayout.source,notes:'Ver docs/pnmt/lazer-arquitetura/ORIGEM.md'};}}

export function configureLeisureMaterials(renderer){
 const textures=[],size=128,aniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 for(const key of ['concrete','paving','paving-alt','cream','ochre','stone','stone-dark','granite','rose','wood','grass','bmx-blue','bmx-yellow']){
  const m=leisureMaterials.get(key),data=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4);let seed=3913;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){let i=(y*size+x)*4;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=(seed>>>24)/255;
   const vein=key==='wood'?Math.sin(x*.8+Math.sin(y*.12)*.5)*.07:0;let c=Math.round(224+20*noise+vein*80);data.set([c,c,c,255],i);
   const amp=key==='grass'?16:key==='stone'?10:4;normal.set([128+(noise-.5)*amp,128+((seed>>>16&255)/255-.5)*amp,254,255],i);
  }
  for(const [field,bytes]of [['roughnessMap',data],['normalMap',normal]]){let t=new T.DataTexture(bytes,size,size);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=aniso;t.needsUpdate=true;m[field]=t;textures.push(t);}m.normalScale.setScalar(key==='grass'?.28:.16);m.needsUpdate=true;
 }
 return textures;
}
