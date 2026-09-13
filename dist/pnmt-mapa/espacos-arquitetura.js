import * as T from 'three';
import {implantationData as D} from './implantacao-dados.js?v=autodromo-arquitetura-20260913-1';

// Arquitetura sobre a implantação existente. Coordenadas da prancha, sem novo root.
// Alturas e subdivisões interpretadas das imagens; não constituem projeto executivo.
export const architectureVersion='espacos-arquitetura-20260913-2';
export const finishMaterials=new Map();
function material(key,color,roughness=.75,metalness=0){
 if(!finishMaterials.has(key)){
  const m=new T.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:metalness>.1?1:.75});
  m.name='PNMT acabamento · '+key;m.userData.finishSurface=key;finishMaterials.set(key,m);
 }
 return finishMaterials.get(key);
}
const M={
 ivory:material('cladding','#d9dfdd',.53,.16),steel:material('steel','#69777c',.48,.65),
 dark:material('dark-steel','#30464d',.55,.48),concrete:material('concrete','#acaeaa',.9),
 slab:material('slab','#c2c2b8',.86),roof:material('roof','#b6c1c5',.62,.25),
 soffit:material('soffit','#b6a98a',.82),glass:material('glass','#56877d',.24,.25),
 glassAlt:material('glass-alt','#729995',.3,.18),shutter:material('shutter','#818e8e',.68,.25),
 blue:material('blue','#639ab7',.84),joint:material('joint','#777b75',.94),
 wood:material('wood','#a7926a',.9),white:material('mark-white','#cbd2ce',.9),
 charcoal:material('mark-dark','#37464b',.88)
};
function mesh(g,geo,mat,name=''){
 const m=new T.Mesh(geo,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
}
function box(g,x,y,z,w,h,d,mat=M.concrete){
 const m=mesh(g,new T.BoxGeometry(w,h,d),mat);m.position.set(x,y+h/2,z);return m;
}
function beam(g,a,b,r,mat=M.steel){
 const aa=new T.Vector3(...a),bb=new T.Vector3(...b),delta=bb.clone().sub(aa);
 if(delta.lengthSq()<1e-10)return null;
 const m=mesh(g,new T.CylinderGeometry(r,r,delta.length(),6),mat);
 m.position.copy(aa).add(bb).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;
}
function surface(g,vertices,indices,mat,name=''){
 const p=new T.Float32BufferAttribute(vertices,3),valid=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 // Pontas convergentes podem colapsar ao converter para float32; não emitir faces nulas.
 for(let i=0;i<indices.length;i+=3){a.fromBufferAttribute(p,indices[i]);b.fromBufferAttribute(p,indices[i+1]).sub(a);c.fromBufferAttribute(p,indices[i+2]).sub(a);if(b.cross(c).lengthSq()>1e-18)valid.push(indices[i],indices[i+1],indices[i+2]);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',p);geo.setIndex(valid);geo.computeVertexNormals();return mesh(g,geo,mat,name);
}
function clear(g){g.traverse(o=>o.geometry?.dispose());g.clear();}
function group(g,x,z,rotation=0){const o=new T.Group();o.position.set(x,0,z);o.rotation.y=rotation;g.add(o);return o;}
function poly(g,ring,y,depth,mat){
 const s=new T.Shape();ring.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();
 const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false});geo.rotateX(-Math.PI/2);const m=mesh(g,geo,mat);m.position.y=y;return m;
}
function ruled(g,rows,mat,name=''){
 const v=[],idx=[];for(const row of rows)v.push(...row[0],...row[1]);
 for(let i=0;i<rows.length-1;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
 return surface(g,v,idx,mat,name);
}
// Closed ribbon, with independent faces so cladding edges do not get rounded normals.
function ribbon(g,rows,depth,mat,name=''){
 const v=[],idx=[];
 function quad(a,b,c,d){const n=v.length/3;v.push(...a,...b,...c,...d);idx.push(n,n+1,n+2,n,n+2,n+3);}
 const down=p=>[p[0],p[1]-depth,p[2]];
 for(let i=0;i<rows.length-1;i++){
  const [a,b]=rows[i],[c,d]=rows[i+1],aa=down(a),bb=down(b),cc=down(c),dd=down(d);
  quad(a,c,d,b);quad(aa,bb,dd,cc);quad(a,aa,cc,c);quad(b,d,dd,bb);
 }
 const [a,b]=rows[0],[c,d]=rows.at(-1);quad(a,b,down(b),down(a));quad(c,down(c),down(d),d);
 return surface(g,v,idx,mat,name);
}
function worldRing(g,w,d){g.updateMatrix();return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,z])=>{const p=new T.Vector3(x,0,z).applyMatrix4(g.matrix);return [p.x,p.z];});}

export function gateSections(wing){
 const [start,end]=wing.axis,dx=end[0]-start[0],dz=end[1]-start[1],len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len;
 const local=wing.outline.map(([x,z])=>[(x-start[0])*ux+(z-start[1])*uz,-(x-start[0])*uz+(z-start[1])*ux]);
 const lo=Math.min(...local.map(p=>p[0])),hi=Math.max(...local.map(p=>p[0]));
 return Array.from({length:81},(_,i)=>{
  const t=T.MathUtils.clamp(i/80,.00001,.99999),x=lo+(hi-lo)*t,cross=[];
  for(let j=0;j<local.length-1;j++){const a=local[j],b=local[j+1];if((a[0]<=x&&b[0]>x)||(b[0]<=x&&a[0]>x))cross.push(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]));}
  if(cross.length<2)throw new Error('Pórtico: seção CAD inválida');
  const y=.45+D.gate.rise*Math.pow(Math.sin(Math.PI*t),.84);
  return [Math.min(...cross),Math.max(...cross)].map(z=>[start[0]+ux*x-uz*z,y,start[1]+uz*x+ux*z]);
 });
}
function buildGate(g){
 clear(g);g.name='Pórtico · arcos vazados e nervuras';
 const mix=(row,t)=>row[0].map((a,i)=>a+(row[1][i]-a)*t);
 for(const [wi,wing] of D.gate.wings.entries()){
  const rows=gateSections(wing);
  // Renders Enscape de fevereiro/2026: faixas estruturais, vãos abertos, travessas.
  for(let k=0;k<5;k++){
   const f=k/4,half=k===0||k===4?.052:.025;
   const band=rows.map(r=>[mix(r,Math.max(0,f-half)),mix(r,Math.min(1,f+half))]);
   ribbon(g,band,k===0||k===4?.37:.24,M.ivory,`Asa ${wi+1} · nervura ${k+1}`);
   // Juntas de painéis desenhadas sobre cada faixa, nunca preenchendo seus vãos.
   for(let j=3;j<78;j+=4){const [a,b]=band[j];beam(g,[a[0],a[1]+.008,a[2]],[b[0],b[1]+.008,b[2]],.009,M.steel);}
   // Apoios sob os extremos, contidos na projeção da asa.
   for(const section of [band[0],band.at(-1)]){
    const [a,b]=section;beam(g,[a[0],.13,a[2]],[a[0],a[1]-.2,a[2]],.025,M.steel);beam(g,[b[0],.13,b[2]],[b[0],b[1]-.2,b[2]],.025,M.steel);
   }
  }
  for(let j=3;j<79;j+=3){const [a,b]=rows[j];beam(g,[a[0],a[1]-.17,a[2]],[b[0],b[1]-.17,b[2]],.027,M.steel);}
  for(let k=0;k<4;k++)for(let j=9;j<70;j+=12){
   const a=mix(rows[j],k/4+.03),b=mix(rows[j+6],(k+1)/4-.03);
   beam(g,[a[0],a[1]-.21,a[2]],[b[0],b[1]-.21,b[2]],.018,M.steel);
  }
 }
 const footprint=D.gate.wings.flatMap(w=>w.outline);
 g.userData.detailViews={estrutura:{label:'Ver os arcos',footprint,height:8,direction:[.85,.45,.55]}};
 g.userData.architectureVersion=architectureVersion;g.userData.openGate=true;
}

function kartRoofY(z){
 // Silhueta interpretada dos renders; mantém a extensão do bloco já implantado.
 const t=(z+39)/78;return 7.05+2.05*Math.exp(-Math.pow((t-.2)/.34,4))+.22*t;
}
function buildKart(g){
 const b=g.getObjectByName('Boxes do Kart · Edifício Linear e Marquise'),s=g.getObjectByName('Arquibancada do Kartódromo');
 if(!b||!s)throw new Error('Kartódromo: grupos da base Arena ausentes');
 const anchors=[b,s].map(o=>({name:o.name,position:o.position.toArray(),rotation:o.rotation.toArray()}));
 clear(b);clear(s);
 // Não altera a pista registrada nem os pivôs/rotações das duas construções.
 box(b,0,.22,0,10.4,.24,74,M.slab);
 box(b,-4.8,.46,0,.4,3.82,74,M.concrete);
 box(b,0,4.24,0,10.5,.24,74,M.ivory);
 for(let z=-34;z<=34;z+=5.2){
  box(b,4.83,.48,z,.2,3.35,4.6,M.shutter);
  for(let h=.66;h<3.8;h+=.2)box(b,4.955,h,z,.018,.018,4.52,M.steel);
  for(const side of [-2.45,2.45])box(b,4.98,.46,z+side,.28,3.8,.22,M.ivory);
  box(b,4.95,3.85,z,.2,.36,4.7,M.ivory);
  box(b,-4.995,1.3,z,.02,1.1,3.9,M.glassAlt);
  box(b,4.985,2.65,z-1.8,.04,.11,.48,M.charcoal);
 }
 // Marquise térrea independente, com estrutura e forro visíveis.
 box(b,2.45,4.48,0,15.9,.23,78,M.roof);box(b,2.45,4.43,0,15.65,.05,77.8,M.soffit);
 for(let z=-36;z<=36;z+=6){beam(b,[10.12,.34,z],[10.12,4.5,z],.08,M.dark);beam(b,[-4.95,4.35,z],[10.1,4.35,z],.09,M.dark);}
 box(b,0,4.71,0,10.5,.16,74,M.slab);
 // Fachada inclinada e caixilhos. Vidro opaco refletivo dispensa refração no celular.
 for(const side of [-1,1]){
  const cells=42,dz=74/cells;
  for(let i=0;i<cells;i++){
   const za=-37+i*dz,zb=za+dz;
   const lowX=side*4.98,topX=side*(side===1?6.12:5.3),ya=kartRoofY(za)-.43,yb=kartRoofY(zb)-.43;
   const m=ruled(b,[[[lowX,4.91,za],[topX,ya,za]],[[lowX,4.91,zb],[topX,yb,zb]]],i%4===0?M.glassAlt:M.glass,'Painel envidraçado');
   // Outward facing on both elevations, without DoubleSide or transparent sorting.
   if(side===1){const index=m.geometry.index;for(let j=0;j<index.count;j+=3){const a=index.getX(j);index.setX(j,index.getX(j+2));index.setX(j+2,a);}m.geometry.computeVertexNormals();}
   beam(b,[lowX,4.88,za],[topX,ya+.03,za],.035,M.dark);
   const f=.5;beam(b,[T.MathUtils.lerp(lowX,topX,f),T.MathUtils.lerp(4.91,ya,f),za],[T.MathUtils.lerp(lowX,topX,f),T.MathUtils.lerp(4.91,yb,f),zb],.021,M.ivory);
  }
 }
 for(const z of [-37,37])box(b,0,4.85,z,10.1,kartRoofY(z)-5.28,.12,M.glassAlt);
 const rows=Array.from({length:105},(_,i)=>{const z=-39+78*i/104,y=kartRoofY(z);return [[-5.45,y,z],[6.3,y,z]];});
 ribbon(b,rows,.42,M.ivory,'Cobertura e faixa contínua do Kart');
 for(let j=3;j<102;j+=4){const [a,c]=rows[j];beam(b,[a[0],a[1]+.012,a[2]],[c[0],c[1]+.012,c[2]],.014,M.steel);}
 for(let z=-34;z<=34;z+=5.2){beam(b,[-4.8,4.85,z],[-5.2,kartRoofY(z)-.45,z],.065,M.dark);beam(b,[4.8,4.85,z],[6.0,kartRoofY(z)-.45,z],.065,M.dark);}
 // Mureta quadriculada confinada à faixa da antiga marquise, sem pintar a pista.
 box(b,10.18,.25,0,.22,.74,73,M.charcoal);
 for(let iz=0;iz<146;iz++)for(let iy=0;iy<2;iy++)if((iz+iy)%2===0)box(b,10.296,.27+iy*.35,-36.25+iz*.5,.012,.34,.49,M.white);
 beam(b,[10.18,1.04,-36.5],[10.18,1.04,36.5],.035,M.steel);
 // Arquibancada: degraus contínuos, três coberturas leves e guarda-corpos.
 for(let r=0;r<6;r++){
  const rows=Array.from({length:65},(_,i)=>{const z=-30.8+i*61.6/64,front=-.08-r*1.06-.16*Math.sin(z/30.8*Math.PI)**2,y=.9+r*.58;return [[front-1.06,y,z],[front,y,z]];});
  ribbon(s,rows,.66+r*.58,M.concrete,'Degrau contínuo do Kart');
  for(let j=8;j<64;j+=8){const [a,c]=rows[j];beam(s,[a[0],a[1]+.008,a[2]],[c[0],c[1]+.008,c[2]],.009,M.joint);}
 }
 for(const zc of [-22,0,22]){
  const roof=box(s,-3.2,5.5,zc,8.4,.22,20.4,M.roof);roof.rotation.z=-.035;
  const soffit=box(s,-3.2,5.445,zc,8.18,.045,20.1,M.soffit);soffit.rotation.z=-.035;
  for(const z of [zc-8.8,zc+8.8]){beam(s,[-6.75,.28,z],[-6.75,5.72,z],.085,M.dark);beam(s,[-6.75,5.43,z],[.82,5.17,z],.085,M.dark);beam(s,[-6.75,3.8,z],[-3.5,5.4,z],.06,M.dark);}
  for(let z=zc-9;z<=zc+9;z+=1.8)beam(s,[-7.3,5.91,z],[.9,5.63,z],.014,M.steel);
 }
 for(const z of [-31.1,31.1]){
  beam(s,[-.05,1.8,z],[-6.48,5.3,z],.04,M.dark);
  for(let r=0;r<6;r++)beam(s,[-r*1.06-.53,.9+r*.58,z],[-r*1.06-.53,2.07+r*.58,z],.03,M.dark);
 }
 g.userData.kartAnchors=anchors;g.userData.architectureVersion=architectureVersion;
 g.userData.detailViews={boxes:{label:'Ver edifício dos boxes',footprint:worldRing(b,22,80),height:10,direction:[1,.45,.5]},arquibancada:{label:'Ver arquibancada',footprint:worldRing(s,16,67),height:6.5,direction:[.95,.6,.3]}};
}

// Duas projeções de cobertura digitalizadas na prancha R83/R84 (não cotadas).
// A referência do evento não participa do posicionamento.
export const skateShelters=[
 {id:'apoio-central',outline:[[255.375,766.5],[258.75,765],[262.875,772.375],[259.25,774.25]],height:2.35},
 {id:'apoio-sul',outline:[[250.375,792.25],[253.875,790.5],[259.625,801],[256.125,803.125]],height:2.35}
];
function pointInside([x,z],ring){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
function rimPoints(sector){return new T.CatmullRomCurve3(sector.rim.map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal').getPoints(96).slice(0,-1).map(p=>[p.x,p.z]);}
export function createBackdropGeometry(){
 // O plano anterior em y=-.3 cobria os fundos em y=-1.18 a -1.33.
 // O remendo local usa os mesmos 96 pontos por bowl; o restante é uma malha regular.
 // Isso também evita triângulos extremamente finos de 6500 u junto às concavidades.
 const holes=D.skate.sectors.filter(s=>s.rim).map(s=>rimPoints(s).map(([x,z])=>[x-620,z-570]));
 const flat=holes.flat(),minX=Math.min(...flat.map(p=>p[0]))-3,maxX=Math.max(...flat.map(p=>p[0]))+3,minZ=Math.min(...flat.map(p=>p[1]))-3,maxZ=Math.max(...flat.map(p=>p[1]))+3;
 const vertices=[],indices=[];
 function rectangle(x0,x1,z0,z1){
  const nx=Math.max(1,Math.ceil((x1-x0)/80)),nz=Math.max(1,Math.ceil((z1-z0)/80)),base=vertices.length/3;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++)vertices.push(x0+(x1-x0)*i/nx,0,z0+(z1-z0)*j/nz);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=base+j*(nx+1)+i,b=a+nx+1;indices.push(a,b,a+1,a+1,b,b+1);}
 }
 rectangle(-3250,minX,-3250,3250);rectangle(maxX,3250,-3250,3250);rectangle(minX,maxX,-3250,minZ);rectangle(minX,maxX,maxZ,3250);
 const shape=new T.Shape();shape.moveTo(minX,-minZ);shape.lineTo(maxX,-minZ);shape.lineTo(maxX,-maxZ);shape.lineTo(minX,-maxZ);shape.closePath();
 for(const ring of holes){const h=new T.Path();ring.forEach(([x,z],i)=>i?h.lineTo(x,-z):h.moveTo(x,-z));h.closePath();shape.holes.push(h);}
 const patch=new T.ShapeGeometry(shape);patch.rotateX(-Math.PI/2);const base=vertices.length/3;
 vertices.push(...patch.attributes.position.array);indices.push(...Array.from(patch.index.array,i=>i+base));patch.dispose();
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const p=geometry.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push((p.getX(i)+620)/5,(p.getZ(i)+570)/5);
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return geometry;
}
function buildSkate(g){
 const original=[];g.traverse(o=>{if(o.isMesh)original.push(o);});
 // As quatro concavidades e os cinco pisos da base continuam com as mesmas malhas.
 const bowls=original.filter(o=>o.geometry.attributes.position&&[...o.geometry.attributes.position.array].some((v,i)=>i%3===1&&v<-.2));
 for(const bowl of bowls)bowl.material=M.slab;
 for(const sector of D.skate.sectors){
  const ring=sector.outline,c=ring.reduce((a,p)=>[a[0]+p[0]/ring.length,a[1]+p[1]/ring.length],[0,0]);
  const inset=ring.map(p=>{const d=Math.hypot(p[0]-c[0],p[1]-c[1]),s=(d-.36)/d;return[c[0]+(p[0]-c[0])*s,c[1]+(p[1]-c[1])*s];});
  const s=new T.Shape();ring.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const h=new T.Path();inset.forEach(([x,z],i)=>i?h.lineTo(x,-z):h.moveTo(x,-z));h.closePath();s.holes.push(h);
  const geo=new T.ShapeGeometry(s);geo.rotateX(-Math.PI/2);const stripe=mesh(g,geo,M.blue,'Faixa azul periférica');stripe.position.y=.232;stripe.castShadow=false;
  const rim=sector.rim?rimPoints(sector):null;
  // Juntas só nas partes planas. Amostragem curta seguida de contenção no setor.
  const minX=Math.min(...ring.map(p=>p[0])),maxX=Math.max(...ring.map(p=>p[0])),minZ=Math.min(...ring.map(p=>p[1])),maxZ=Math.max(...ring.map(p=>p[1]));
  for(let z=Math.ceil(minZ/4.5)*4.5;z<maxZ;z+=4.5){
   let first=null;
   for(let x=minX;x<=maxX+.12;x+=.12){const ok=pointInside([x,z],inset)&&(!rim||!pointInside([x,z],rim));if(ok&&first===null)first=x;if(!ok&&first!==null){if(x-first>.25)box(g,(first+x-.12)/2,.225,z,x-first-.12,.006,.012,M.joint);first=null;}}
  }
 }
 for(const shelter of skateShelters){
  const p=shelter.outline,y=shelter.height;
  poly(g,p,.13,.1,M.slab);poly(g,p,y,.085,M.roof);poly(g,p,y-.028,.024,M.soffit);
  const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  for(const t of [.045,.27,.5,.73,.955]){
   const a=lerp(p[0],p[3],t),b=lerp(p[1],p[2],t);
   for(const v of [a,b]){beam(g,[v[0],.23,v[1]],[v[0],y,v[1]],.045,M.dark);box(g,v[0],.23,v[1],.16,.05,.16,M.steel);}
   beam(g,[a[0],y-.095,a[1]],[b[0],y-.095,b[1]],.045,M.dark);
  }
  for(let t=.06;t<1;t+=.055){const a=lerp(p[0],p[3],t),b=lerp(p[1],p[2],t);beam(g,[a[0],y+.092,a[1]],[b[0],y+.092,b[1]],.008,M.steel);}
  for(const t of [.27,.73]){
   const a=lerp(p[0],p[3],t),b=lerp(p[1],p[2],t),c=lerp(a,b,.5),angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
   const table=group(g,c[0],c[1],-angle);box(table,0,.86,0,1.65,.07,.74,M.wood);
   for(const z of [-.64,.64]){box(table,0,.54,z,1.65,.06,.28,M.wood);for(const x of [-.56,.56])beam(table,[x,.24,z],[x,.54,z],.035,M.dark);}
   for(const x of [-.56,.56])beam(table,[x,.24,0],[x,.86,0],.04,M.dark);
  }
 }
 // Street: transições e elementos confinados ao setor já implantado.
 const street=group(g,274,811,-.18);
 const quarter=(xc,zc,angle)=>{
  const q=group(street,xc,zc,angle),v=[],idx=[],steps=24;
  for(let i=0;i<=steps;i++){const t=i/steps*Math.PI/2,x=1.35*(1-Math.cos(t)),y=.235+1.35*(1-Math.sin(t));v.push(x,y,-2,x,y,2);if(i){const a=(i-1)*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const m=surface(q,v,idx,M.slab,'Transição street');m.material=M.slab;
  beam(q,[0,1.59,-2],[0,1.59,2],.035,M.steel);box(q,-.12,.23,0,.18,1.32,4,M.concrete);
 };
 quarter(-10,0,0);quarter(10,0,Math.PI);
 box(street,2,.23,4,5,.4,1.4,M.concrete);box(street,2,.63,4,5,.025,1.4,M.steel);
 g.userData.architectureVersion=architectureVersion;g.userData.skateShelters=skateShelters;
 g.userData.detailViews={bowls:{label:'Ver bowls e apoios',footprint:[[240,762],[264,762],[267,786],[240,786]],height:3,direction:[.8,.9,1]},street:{label:'Ver área de street',footprint:D.skate.sectors.at(-1).outline,height:2.4,direction:[.8,.65,1]}};
}

export function applySpaceArchitecture(models){
 buildGate(models.get('portico-de-entrada'));buildKart(models.get('kartodromo'));buildSkate(models.get('skate-park'));
}

// Texturas determinísticas de acabamento; pequenas e sem dependência de rede.
export function configureFinishMaterials(renderer){
 const textures=[],size=128;
 for(const key of ['concrete','slab','roof','cladding','shutter','wood']){
  const m=finishMaterials.get(key),data=new Uint8Array(size*size*4);
  let seed=817;for(let i=0;i<size*size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const value=key==='roof'?220+((Math.floor(i/size)%8===0)?14:0):225+(seed>>>28);data.set([value,value,value,255],i*4);}
  const tex=new T.DataTexture(data,size,size);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());tex.needsUpdate=true;m.roughnessMap=tex;m.needsUpdate=true;textures.push(tex);
 }
 return textures;
}
