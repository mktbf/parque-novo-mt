import * as T from 'three';
import {terrain,places} from './park-data.js?v=7';
import {buildArenaShow} from './arena-show.js?v=7';
import {applyPhotoRefinements} from './refinamentos.js?v=prints-1';

// Plan coordinates are retained in all three views. Heights are illustrative.
export const origin=[620,570];
export const world=(p,y=0)=>new T.Vector3(p[0]-origin[0],y,p[1]-origin[1]);
const mats=new Map();
const C={stone:'#cfd2cc',white:'#f8fafc',glass:'#345868',dark:'#182026',roof:'#f1f5f4',wood:'#6d4c41',gold:'#b8af8d',green:'#2d4e23',grass:'#486e34',water:'#163e46',road:'#24282b',blue:'#0062cc'};
function material(color,metalness=0,roughness=.72){
 const key=[color,metalness,roughness].join();
 if(!mats.has(key)){
  const glass=color===C.glass||color==='#345868'||color==='#365f70';
  const water=color===C.water||color==='#163e46'||color==='#1a4146';
  const isSteel=[C.dark,'#182026','#212121','#37474f','#455a64','#424f56'].includes(color);
  const isWhiteRoof=[C.white,'#f8fafc','#f5f7f8','#f1f5f4','#ffffff'].includes(color);
  const m=glass
   ? new T.MeshPhysicalMaterial({color,transmission:.86,roughness:.05,metalness:.05,clearcoat:1,clearcoatRoughness:.04,ior:1.52,envMapIntensity:2.4,transparent:true,opacity:.92})
   : water
   ? new T.MeshPhysicalMaterial({color,transmission:.65,roughness:.04,metalness:.12,clearcoat:1,clearcoatRoughness:.03,ior:1.333,reflectivity:.92,envMapIntensity:2.8,transparent:true,opacity:.95,depthWrite:false})
   : new T.MeshStandardMaterial({color,metalness:metalness||(isSteel?.68:isWhiteRoof?.05:0),roughness:roughness||(isSteel?.24:isWhiteRoof?.38:.74),envMapIntensity:isSteel?1.5:isWhiteRoof?1.1:.85});
  m.name=color;mats.set(key,m);
 }
 return mats.get(key);
}

export async function loadMaterials(renderer){
 const loader=new T.TextureLoader(),textures=[];
 const load=async(name,color=false)=>{const t=await loader.loadAsync('./assets/materials/'+name);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(12,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=T.SRGBColorSpace;textures.push(t);return t;};
 const sets=await Promise.allSettled(['clean_asphalt','leafy_grass'].map(async name=>({name,maps:await Promise.all([name==='leafy_grass'?null:load(name+'_diff_1k.jpg',true),load(name+'_rough_1k.jpg'),load(name+'_nor_gl_1k.jpg')])})));
 for(const result of sets){if(result.status!=='fulfilled')continue;const {name,maps}=result.value;
  for(const m of mats.values()){
   const asphalt=[C.road,'#4a554e','#677166','#697064','#889282','#cccab4','#cfccb6','#1a1e21','#1e2225','#23292d','#101214','#24282b','#25292c'].includes(m.name);
   const grass=[C.grass,'#b7c49a','#82986a','#b0ad82','#486e34','#466934'].includes(m.name);
   if(name==='clean_asphalt'&&asphalt){[m.map,m.roughnessMap,m.normalMap]=maps;m.normalScale.setScalar(.32);m.color.set('#24282b');m.needsUpdate=true;}
   if(name==='leafy_grass'&&grass){m.map=null;m.roughnessMap=maps[1];m.normalMap=maps[2];m.normalScale.setScalar(.22);m.roughness=.92;m.color.set(m.name===C.grass?C.grass:'#385626');m.needsUpdate=true;}
  }
 }
 const size=256,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,u=x/size*Math.PI*2,v=y/size*Math.PI*2;const dx=Math.cos(u*4+v*2)*16+Math.cos(u*8-v*6)*8+Math.cos(u*14+v*10)*4,dy=Math.sin(v*4+u*2)*16+Math.sin(v*8-u*6)*8+Math.sin(v*14+u*10)*4;data[i]=Math.min(255,Math.max(0,128+dx));data[i+1]=Math.min(255,Math.max(0,128+dy));data[i+2]=254;data[i+3]=255;}
 const normal=new T.DataTexture(data,size,size);normal.wrapS=normal.wrapT=T.RepeatWrapping;normal.repeat.set(12,12);normal.needsUpdate=true;textures.push(normal);
 for(const m of mats.values())if(m.name===C.water||m.name==='#163e46'||m.name==='#1a4146'){m.normalMap=normal;m.normalScale.setScalar(.55);m.needsUpdate=true;}
 return textures;
}
function add(g,geo,color,x=0,y=0,z=0,metal=0,rough=.72){const m=new T.Mesh(geo,material(color,metal,rough));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function box(g,x,y,z,w,h,d,c=C.white){return add(g,new T.BoxGeometry(w,h,d),c,x,y+h/2,z);}
function cylinder(g,x,y,z,r,h,c=C.stone,rTop=r){return add(g,new T.CylinderGeometry(rTop,r,h,40),c,x,y+h/2,z);}
function polygon(g,points,color,y=0,depth=.7){const s=new T.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false});geo.rotateX(-Math.PI/2);return add(g,geo,color,0,y,0);}
function path(g,points,width,color,y=.4,closed=false,smooth=true){const p=points.map(v=>new T.Vector3(v[0],y,v[1]));if(closed&&!smooth)p.push(p[0].clone());const curve=smooth?new T.CatmullRomCurve3(p,closed,'centripetal',.25):new T.CurvePath();if(!smooth)for(let i=1;i<p.length;i++)curve.add(new T.LineCurve3(p[i-1],p[i]));const ns=Math.max(8,points.length*5),vertices=[],uvs=[],indices=[];for(let i=0;i<=ns;i++){const t=i/ns,pt=curve.getPointAt(t),tan=curve.getTangentAt(t),nx=-tan.z,nz=tan.x;vertices.push(pt.x+nx*width/2,y,pt.z+nz*width/2,pt.x-nx*width/2,y,pt.z-nz*width/2);uvs.push(0,t,1,t);if(i<ns){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();const m=add(g,geo,color);m.castShadow=false;return m;}
function beam(g,a,b,r,c=C.white){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);const m=add(g,new T.CylinderGeometry(r,r,v.length(),8),c,...av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;}
function tube(g,pts,r,c,closed=false){const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),closed,'centripetal');return add(g,new T.TubeGeometry(curve,Math.max(32,pts.length*6),r,6,closed),c);}
function ring(g,x,y,z,r,t,c,vertical=false){const m=add(g,new T.TorusGeometry(r,t,8,64),c,x,y,z);if(!vertical)m.rotation.x=-Math.PI/2;return m;}
function groupAt(root,x,z,angle=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);return g;}
function glazing(g,w,d,h){box(g,0,1,0,w,h,d,C.glass);box(g,0,1+h,0,w+2,.7,d+2,C.white);for(let x=-w/2;x<=w/2;x+=Math.max(4,w/13)){box(g,x,1,-d/2,.45,h,.6,C.gold);box(g,x,1,d/2,.45,h,.6,C.gold);}for(let z=-d/2;z<=d/2;z+=6){box(g,-w/2,1,z,.6,h,.45,C.gold);box(g,w/2,1,z,.6,h,.45,C.gold);}}
function treesSmall(g,points,size=1){for(const [x,z] of points){cylinder(g,x,.5,z,.65*size,5*size,C.wood);const m=add(g,new T.SphereGeometry(3*size,8,6),C.green,x,6.2*size,z);m.scale.y=1.15;}}
function archRoof(g,w,d,h,color=C.white){const cross=new T.Shape();cross.moveTo(-w/2,0);cross.quadraticCurveTo(0,h,w/2,0);cross.lineTo(w/2,-.7);cross.quadraticCurveTo(0,h-.7,-w/2,-.7);cross.closePath();const mesh=add(g,new T.ExtrudeGeometry(cross,{depth:d,bevelEnabled:false,curveSegments:20}),color,0,0,-d/2);return mesh;}
function stand(g,x,z,w,d,angle=0){const s=groupAt(g,x,z,angle);for(let j=0;j<6;j++)box(s,0,j*.7,j*d/6-d/2,w,.8,d/6,C.stone);box(s,0,9,0,w+3,.7,d+3,C.dark);for(const ix of [-w/2,w/2])for(const iz of [-d/2,d/2])cylinder(s,ix,0,iz,.5,9,C.dark);for(let j=0;j<6;j++)for(let i=-w/2+1.5;i<w/2;i+=2.4){box(s,i,j*.7+.9,j*d/6-d/2,1.4,.23,1,'#acbdc3');box(s,i,j*.7+1.05,j*d/6-d/2+.5,1.4,.9,.18,C.white);}for(let i=-w/2;i<w/2;i+=8){beam(s,[i,8,-d/2],[i+8,9,d/2],.13,C.white);beam(s,[i,9,d/2],[i+8,8,-d/2],.13,C.white);}return s;}
function court(g,x,z,w,d){box(g,x,.7,z,w,1,d,'#e2cc9b');path(g,[[x-w/2+1,z-d/2+1],[x+w/2-1,z-d/2+1],[x+w/2-1,z+d/2-1],[x-w/2+1,z+d/2-1]],.3,C.white,1.75,true,false);beam(g,[x-w/2-1,1,z],[x-w/2-1,6,z],.18,C.dark);beam(g,[x+w/2+1,1,z],[x+w/2+1,6,z],.18,C.dark);for(let h=3;h<=5;h+=.5)beam(g,[x-w/2, h,z],[x+w/2,h,z],.045,C.white);}

function buildAutodromo(auto,circuits){
 const ag=groupAt(auto,705,520,.77);
 ag.name='Autódromo Internacional · Circuito e Instalações FIA';

 // 1. RETA PRINCIPAL - GRID FIA, PÓRTICO E SINALIZAÇÃO
 for(let z=-5.7;z<=5.7;z+=.95){const isW=Math.round((z+6)/.95)%2===0;box(ag,-10,.72,z,.95,.02,.95,isW?C.white:C.dark);}
 for(let row=0;row<12;row++){
  const x=-75+row*5.2,zSlot=(row%2===0)?-2.8:2.8;
  box(ag,x,.72,zSlot,3.8,.02,.15,C.white);box(ag,x-1.9,.72,zSlot-.7,.15,.02,1.4,C.white);box(ag,x+1.9,.72,zSlot-.7,.15,.02,1.4,C.white);box(ag,x+1.5,.72,zSlot-.7,.4,.02,.4,'#bc5942');
 }
 for(let x=-95;x<85;x+=3.6){
  const isRed=Math.round(x/3.6)%2===0;
  box(ag,x,.71,-5.9,3.6,.08,.8,isRed?'#bc5942':C.white);
  box(ag,x,.71,5.9,3.6,.08,.8,isRed?'#bc5942':C.white);
 }
 // Carros de competição na pista conforme autodromo.webp
 const raceCars=[
  {x:-52,z:-2.8,c:'#d32f2f'}, // Vermelho Ferrari
  {x:-40,z:2.8,c:'#ff9800'},  // Laranja McLaren
  {x:-22,z:-2.8,c:'#0288d1'}, // Azul Alpine
  {x:-10,z:2.8,c:'#2e7d32'},  // Verde Aston
  {x:25,z:-1.6,c:'#ffffff'},  // Branco Porsche
  {x:55,z:1.8,c:'#ffd600'}    // Amarelo GT
 ];
 for(const rc of raceCars){
  const car=groupAt(ag,rc.x,rc.z);
  box(car,0,.74,0,4.6,.68,2.0,rc.c);
  box(car,-.4,1.18,0,1.9,.48,1.4,C.glass);
  box(car,-2.1,1.25,0,.45,.08,1.9,C.dark); // Asa traseira aerodinâmica
  beam(car,[-2.1,.76,-.65],[-2.1,1.25,-.65],.05,C.dark);
  beam(car,[-2.1,.76,.65],[-2.1,1.25,.65],.05,C.dark);
  box(car,2.1,.75,0,.5,.06,2.0,C.dark); // Splitter dianteiro
 }

 // Pórtico de Largada com semáforo oficial de 5 pares vermelhos
 for(const zSide of [-6.8,6.8]){beam(ag,[-10,.7,zSide],[-10,8.5,zSide],.22,C.dark);beam(ag,[-10,.7,zSide+.6*Math.sign(zSide)],[-10,8.5,zSide],.15,C.dark);}
 beam(ag,[-10,8.2,-6.8],[-10,8.2,6.8],.25,C.dark);beam(ag,[-10,7.2,-6.8],[-10,7.2,6.8],.18,C.dark);
 for(let z=-6;z<=6;z+=1.5){beam(ag,[-10,7.2,z],[-10,8.2,z+.75],.08,C.white);beam(ag,[-10,8.2,z],[-10,7.2,z+.75],.08,C.white);}
 for(let i=-2;i<=2;i++){box(ag,-10,7.7,i*.9,.35,.6,.5,C.dark);cylinder(ag,-9.8,7.7,i*.9,.18,.1,'#e53935',.18);}
 box(ag,-10,9.1,0,.3,1.2,7.5,'#102027');box(ag,-9.8,9.1,0,.05,.8,7.0,'#37474f');

 // 2. PISTA DE ARRANCADA ("Dragstrip")
 box(ag,-5,.69,-21,180,.03,10.2,'#1a1e21');
 box(ag,-84,.71,-18.7,16,.02,3.8,'#101214');box(ag,-84,.71,-23.3,16,.02,3.8,'#101214');
 path(ag,[[-94,-21],[80,-21]],.25,C.white,.72,false,false);path(ag,[[-94,-16.2],[80,-16.2]],.2,C.white,.72,false,false);path(ag,[[-94,-25.8],[80,-25.8]],.2,C.white,.72,false,false);
 box(ag,-74,.72,-21,.5,.02,9.8,C.white);box(ag,-74.8,.72,-21,.3,.02,9.8,'#fbc02d');
 cylinder(ag,-74.5,.7,-21,.12,5.5,C.dark);box(ag,-74.5,3.8,-21,.3,3.2,.65,C.dark);
 for(const side of [-.22,.22]){
  cylinder(ag,-74.3,5.1,-21+side,.08,.08,'#0288d1');cylinder(ag,-74.3,4.8,-21+side,.08,.08,'#0288d1');
  cylinder(ag,-74.3,4.4,-21+side,.09,.08,'#fbc02d');cylinder(ag,-74.3,4.0,-21+side,.09,.08,'#fbc02d');cylinder(ag,-74.3,3.6,-21+side,.09,.08,'#fbc02d');
  cylinder(ag,-74.3,3.2,-21+side,.09,.08,'#43a047');cylinder(ag,-74.3,2.8,-21+side,.09,.08,'#e53935');
 }
 box(ag,-5,.7,-15.6,180,1.1,.55,C.stone);box(ag,-5,1.8,-15.6,180,.08,.35,C.dark);
 for(let x=-92;x<84;x+=12){beam(ag,[x,1.8,-15.6],[x,3.2,-15.6],.06,C.dark);if(x+12<84)beam(ag,[x,3.1,-15.6],[x+12,3.1,-15.6],.03,C.white);}
 box(ag,-5,.7,-26.4,180,1.1,.55,C.stone);box(ag,-5,1.8,-26.4,180,.08,.35,C.dark);
 for(let x=-92;x<84;x+=12){beam(ag,[x,1.8,-26.4],[x,3.6,-26.4],.06,C.dark);if(x+12<84)beam(ag,[x,3.5,-26.4],[x+12,3.5,-26.4],.03,C.white);}
 box(ag,55,.72,-21,.6,.02,9.8,C.white);
 beam(ag,[55,.7,-15.6],[55,6.5,-15.6],.16,C.dark);beam(ag,[55,.7,-26.4],[55,6.5,-26.4],.16,C.dark);beam(ag,[55,6.2,-15.6],[55,6.2,-26.4],.18,C.dark);
 box(ag,55,6.2,-21,.4,1.4,6.5,'#102027');box(ag,78,.7,-21,22,.35,9.6,'#c4b595');
 box(ag,-5,.68,-10.8,180,.02,8.8,C.grass);

 // 3. ARQUIBANCADA PRINCIPAL COBERTA (Com assentos esportivos conforme autodromo.webp)
 const standLen=155;
 for(let r=0;r<10;r++){
  const tZ=-28-r*1.4,tY=.7+r*.75;
  box(ag,-2.5,tY,tZ,standLen,.8,1.45,C.stone);
  for(let sx=-78;sx<73;sx+=1.35){
   if(Math.abs((sx+3)%26)<1.8)continue;
   // Padrão vibrante de assentos esportivos em laranja, vermelho e branco
   const cSeat=(Math.abs(Math.sin(sx*.14+r))>.4)?'#e64a19':(r%2===0?'#d32f2f':C.white);
   box(ag,sx,tY+.8,tZ-.25,.95,.2,.65,cSeat);box(ag,sx,tY+.95,tZ-.55,.95,.55,.15,cSeat);
  }
 }
 box(ag,-2.5,1.5,-27.2,standLen,1.0,.08,C.glass);box(ag,-2.5,2.0,-27.2,standLen,.06,.12,C.white);
 box(ag,-2.5,5.5,-42.8,standLen,9.5,.6,C.stone);
 for(let sx=-75;sx<70;sx+=12.5){
  box(ag,sx+5.5,7.8,-41.6,11,2.8,1.8,C.glass);box(ag,sx+5.5,9.3,-41.6,11.5,.2,2.0,C.white);box(ag,sx,7.8,-41.5,.4,3.0,2.0,C.dark);
 }
 // Cobertura metálica escura em balanço
 box(ag,-2.5,11.6,-34.5,standLen+6,.5,19,'#212b30');box(ag,-2.5,11.9,-34.5,standLen+6,.12,19,'#37474f');
 box(ag,-2.5,11.6,-25.2,standLen+6,.6,.35,C.white);box(ag,-2.5,11.6,-43.8,standLen+6,.6,.35,C.white);
 for(let sx=-78;sx<=73;sx+=13){
  cylinder(ag,sx,.7,-43.5,.45,11.2,C.dark);beam(ag,[sx,10.5,-43.5],[sx,11.4,-26.0],.18,C.white);beam(ag,[sx,8.5,-43.5],[sx,11.3,-33.0],.14,C.white);
 }

 // 4. ESPLANADA E PAVILHÃO DE ACESSO DA ARQUIBANCADA
 box(ag,-2.5,.68,-51,170,.04,15,'#b0b8b8');
 for(const sx of [-60,-20,20,60]){
  for(let st=0;st<6;st++)box(ag,sx,.7+st*.45,-44.5-st*1.1,9,.5,1.2,C.stone);
  beam(ag,[sx-4.6,1.2,-50.5],[sx-4.6,3.8,-44.5],.05,C.white);beam(ag,[sx+4.6,1.2,-50.5],[sx+4.6,3.8,-44.5],.05,C.white);
 }
 for(const sx of [-45,-5,35]){box(ag,sx,.7,-56,14,3.2,5,C.white);box(ag,sx,2.5,-53.4,12,1.4,.3,C.glass);box(ag,sx,4.0,-56,15,.25,6,'#24333c');}
 for(let sx=-80;sx<=75;sx+=15.5){ring(ag,sx,.7,-59,1.8,.35,C.stone);palm(ag,sx,-59,8.5);}

 // 5. COMPLEXO DE BOXES & PADDOCK (INFIELD)
 // Mureta dos boxes e telemetry stands voltados para a pista
 box(ag,0,.7,7.5,150,1.15,.5,C.stone);box(ag,0,1.85,7.5,150,.06,.25,C.dark);
 for(let x=-72;x<=72;x+=9){beam(ag,[x,1.85,7.5],[x,3.4,7.5],.05,C.dark);if(x+9<=72)beam(ag,[x,3.3,7.5],[x+9,3.3,7.5],.03,C.white);}
 for(const px of [-55,-35,-15,5,25,45,65]){
  box(ag,px,1.4,7.5,4.2,1.2,1.6,'#1a262c');box(ag,px,2.7,7.5,4.4,.12,1.8,C.white);
  for(let mon=-1.2;mon<=1.2;mon+=1.2)box(ag,px+mon,2.0,7.0,.7,.45,.1,'#00e5ff');
 }
 box(ag,0,.69,12.2,155,.03,8.5,'#1e2225');
 for(let b=0;b<24;b++){
  const bx=-70+b*6.0;box(ag,bx,.71,14.5,5.4,.02,3.8,'#bcc4c7');box(ag,bx,.72,12.7,5.2,.02,.15,'#fbc02d');box(ag,bx,.72,16.3,5.2,.02,.15,'#fbc02d');
 }

 // Edifício dos Boxes (Térreo com 30 garagens e piso superior VIP envidraçado)
 const pitLen=150;
 box(ag,0,.7,23.5,pitLen,9.2,13,C.white);
 for(let bay=0;bay<30;bay++){
  const gx=-72.5+bay*5.0;
  box(ag,gx,.7,16.9,4.4,3.8,.35,'#1e252b'); // Portão de enrolar escuro
  for(let sy=1.3;sy<4.2;sy+=.55)box(ag,gx,sy,16.8,4.3,.05,.2,'#37474f');
  box(ag,gx,4.3,16.8,4.6,.7,.25,C.white);box(ag,gx,4.3,16.7,1.8,.45,.1,'#bc5942');
  box(ag,gx+2.45,.7,17.0,.55,4.5,.6,C.stone);
 }
 // Mezanino VIP panorâmico no 2º andar com vidro structural glazing
 box(ag,0,5.2,17.1,pitLen,4.0,.4,C.glass);
 for(let fx=-75;fx<=75;fx+=5.0)box(ag,fx,5.2,17.0,.25,4.0,.6,C.dark);
 box(ag,0,5.2,16.0,pitLen,.25,2.0,C.stone);box(ag,0,5.5,15.0,pitLen,.9,.08,C.glass);box(ag,0,6.4,15.0,pitLen,.06,.12,C.white);
 box(ag,0,10.0,23.5,pitLen+6,.6,15.5,'#263238');box(ag,0,10.3,23.5,pitLen+4,.15,12,'#b0bec5');

 // TORRE DE CRONOMETRAGEM E CONTROLE COM ALETAS LARANJAS CONFORME AUTODROMO.WEBP
 box(ag,-75,.7,23.5,12,15.5,13,'#1c252a');
 box(ag,-75,11.5,23.5,14,3.8,15,C.glass);
 box(ag,-75,15.3,23.5,15,.6,16,C.white);
 // Aletas arquitetônicas verticais laranjas/vermelhas características na fachada da torre
 for(let fin=-4.5;fin<=4.5;fin+=2.25){
  box(ag,-75+fin,1.2,30.3,.28,14.2,.75,'#ff5722');
 }
 cylinder(ag,-75,15.9,23.5,.15,7.5,C.white);beam(ag,[-75,21.0,23.5],[-73,21.0,23.5],.06,C.white);
 box(ag,-71,5.2,16.5,6.5,.3,3.5,C.stone);box(ag,-71,5.5,14.8,6.5,.9,.1,C.glass);
 box(ag,-71,5.5,16.0,1.4,.7,1.2,C.white);box(ag,-72.6,5.5,16.0,1.2,.45,1.2,'#cfd8dc');box(ag,-69.4,5.5,16.0,1.2,.3,1.2,'#b0bec5');box(ag,-71,6.5,17.5,6.0,2.2,.15,'#1e88e5');

 // Semáforo de Saída dos Boxes (Pit Exit Gantry)
 beam(ag,[76,.7,12.5],[76,5.5,12.5],.1,C.dark);beam(ag,[76,.7,15.5],[76,5.5,15.5],.1,C.dark);beam(ag,[76,5.2,12.5],[76,5.2,15.5],.12,C.dark);
 box(ag,76,5.2,14,.3,.8,1.4,'#102027');cylinder(ag,76.2,5.2,13.6,.18,.08,'#43a047');cylinder(ag,76.2,5.2,14.4,.18,.08,'#e53935');

 // Postos de Sinalização / Fiscais de Pista (Marshal Posts)
 for(const mx of [-65,-20,25,65]){
  box(ag,mx,1.2,-15.6,1.4,.9,1.4,C.white);box(ag,mx,1.8,-15.6,1.6,.08,1.6,'#ff6f00');
  beam(ag,[mx,1.8,-15.6],[mx,3.5,-15.6],.04,C.dark);box(ag,mx+.3,3.3,-15.6,.6,.4,.02,'#fbc02d');
 }

 for(const wx of [-50,-10,30])box(ag,wx,.67,-66,4.5,.02,15,'#cfd5d4');
 for(const lx of [-65,-20,25,65]){cylinder(ag,lx,11.8,-43.5,.25,5.5,C.dark);box(ag,lx,17.2,-43.0,3.6,.8,.8,C.white);}

 // PADDOCK (Infield - Carretas de equipes de corrida)
 box(ag,0,.68,44,165,.03,27,'#23292d');
 const truckLiveries=['#d32f2f','#ff9800','#212121','#1565c0','#43a047','#f44336','#37474f','#00acc1'];
 for(let t=0;t<8;t++){
  const tx=-62+t*17.5,tz=42,col=truckLiveries[t%truckLiveries.length];
  box(ag,tx,1.3,tz,12.5,3.4,3.2,col);box(ag,tx,4.7,tz,12.5,.15,3.2,C.white);
  box(ag,tx-7.5,1.1,tz,3.0,3.0,2.8,col);box(ag,tx-8.2,2.4,tz,1.6,1.4,2.7,C.glass);
  box(ag,tx,.7,tz+4.5,12,3.2,5.5,C.white);
 }
 box(ag,58,.7,46,22,6.5,14,'#37474f');box(ag,58,7.2,46,23,.5,15,C.white);box(ag,48,1.5,46,.3,4.2,7.0,'#455a64');
 box(ag,-40,.7,48,16,4.5,10,C.white);box(ag,-40,5.2,48,17,.3,11,'#263238');box(ag,-40,5.5,48,4.0,.05,1.2,'#e53935');box(ag,-40,5.5,48,1.2,.05,4.0,'#e53935');
 ring(ag,-10,.72,51,6.5,.35,C.white);box(ag,-10,.72,51,.6,.02,5.0,C.white);box(ag,-11.8,.72,51,3.0,.02,.6,C.white);box(ag,-8.2,.72,51,3.0,.02,.6,C.white);
 for(const lx of [-70,0,70]){cylinder(ag,lx,.7,56,.3,18,C.dark);box(ag,lx,18.2,56,4.2,1.2,1.0,C.white);}

 // 6. MONUMENTO & PRAÇA DO HAIRPIN ("CASA INDÍGENA")
 const hp=groupAt(auto,665,705,.25);
 polygon(hp,[[-18,-18],[18,-18],[18,18],[-18,18]],C.stone,.7,.15);polygon(hp,[[-13,-13],[13,-13],[13,13],[-13,13]],'#b8c0ba',.85,.12);
 cylinder(hp,0,.9,0,7.5,.6,C.stone);cylinder(hp,0,1.4,0,6.5,.2,C.water);cylinder(hp,0,1.5,0,1.2,2.5,C.gold);
 for(let i=0;i<8;i++){
  const a=(i/8)*Math.PI*2,px=Math.cos(a)*11,pz=Math.sin(a)*11;
  beam(hp,[px,.8,pz],[Math.cos(a)*3,6.8,Math.sin(a)*3],.25,C.wood);beam(hp,[px,.8,pz],[px*1.15,.8,pz*1.15],.15,C.wood);
 }
 add(hp,new T.ConeGeometry(8.5,3.2,8),'#bcaaa4',0,7.8,0);

 // 7. ESCAPE AZUL FIA & BARREIRAS TECPRO (Turn 1)
 polygon(circuits,[[785,442],[828,408],[855,412],[862,432],[842,452],[798,458]],'#25292c',.69,.02);
 for(let s=0;s<7;s++){const frac=s/7,px=795+frac*50,pz=445-frac*32;box(circuits,px,.71,pz,1.8,.02,14,s%2===0?'#0060c0':C.white);}
 const barrierPts=[[802,452],[820,442],[844,438],[860,428],[865,412]];
 for(let i=0;i<barrierPts.length-1;i++){
  const p1=barrierPts[i],p2=barrierPts[i+1],dist=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),numB=Math.floor(dist/2.2);
  for(let b=0;b<numB;b++){const t=b/numB,bx=p1[0]+(p2[0]-p1[0])*t,bz=p1[1]+(p2[1]-p1[1])*t;box(circuits,bx,.72,bz,1.8,.9,.9,b%2===0?'#d32f2f':C.white);}
 }
}

export function createMiniatures(){
 const root=new T.Group();root.position.set(-origin[0],0,-origin[1]);const modelLayer=new T.Group();root.add(modelLayer);
 const landscape=new T.Group();root.add(landscape);const vegetation=new T.Group(),infrastructure=new T.Group(),water=new T.Group();root.add(vegetation,infrastructure,water);

 // 1. BACIAS HIDROGRÁFICAS NATURAIS (Laguna das Nações e Lago das Palmeiras)
 for(const ps of terrain.lakes){
  // Leito escavado com talude de terra/areia
  polygon(landscape,ps,'#6d4c41',-.32,.35);
  // Faixa de praia/enrocamento pedregoso na orla
  path(landscape,ps,3.5,'#a1887f',-.04,true,true);
  // Espelho d'água ligeiramente rebaixado (-0.05m)
  const lake=polygon(water,ps,C.water,-.05,.03);
  lake.castShadow=false;
 }

 // 2. TERRENO CONTÍNUO NIVELADO (Sem paredes verticais de maquete)
 polygon(landscape,terrain.outline,C.grass,0,.05);
 for(const ps of terrain.greens)polygon(landscape,ps,'#355225',.01,.02);
 for(const ps of terrain.parking){polygon(landscape,ps,'#4c5257',.005,.012);const xs=ps.map(p=>p[0]),zs=ps.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);for(let x=minX+12;x<maxX-12;x+=9){const rows=[];for(let z=minZ+12;z<maxZ-12;z+=18)if(inPolygon([x,z],ps)&&inPolygon([x+5,z+9],ps))rows.push(z);for(const z of rows)path(landscape,[[x,z],[x,z+9],[x+5,z+9]],.32,'#f0f4f7',.023,false,false);}}
 for(const ps of terrain.roads){path(landscape,ps,19,'#875438',.045);path(landscape,ps,16,C.stone,.055);path(landscape,ps,13,C.road,.07);roadMarks(landscape,ps);}
 if(terrain.roundabouts){
  for(const rb of terrain.roundabouts){
   const [cx,cz]=rb.center;
   const roadRing=add(landscape,new T.RingGeometry(rb.innerRadius,rb.outerRadius,48),C.road,cx,.07,cz);
   roadRing.rotation.x=-Math.PI/2;
   ring(landscape,cx,.08,cz,rb.outerRadius,.5,C.stone);
   ring(landscape,cx,.08,cz,rb.innerRadius,.5,C.stone);
   ring(landscape,cx,.085,cz,(rb.innerRadius+rb.outerRadius)/2,.2,'#f0f4f7');
   const island=add(landscape,new T.CircleGeometry(rb.innerRadius-.3,40),C.grass,cx,.08,cz);
   island.rotation.x=-Math.PI/2;
   for(let i=0;i<8;i++){
    const a=i*Math.PI*2/8,rr=(rb.innerRadius-.3)*.62;
    treesSmall(landscape,[[cx+Math.cos(a)*rr,cz+Math.sin(a)*rr]],.45);
   }
  }
 }
 for(const ps of terrain.paths)path(landscape,ps,5.2,'#d5ceb8',.095);
 // Pista e ligação usam as mesmas camadas, sem bordas atravessando as junções.
 const circuits=new T.Group();root.add(circuits);
 for(const [width,color,y] of [[17.3,'#8a5236',.48],[13.2,'#e6e6de',.58],[11.3,'#222629',.68]]){
  path(circuits,terrain.raceTrack,width,color,y,true);
  for(const link of terrain.raceConnections)path(circuits,link,width,color,y,false,false);
 }

 const models=new Map();
 for(const p of places){const g=new T.Group();g.userData.placeId=p.id;modelLayer.add(g);models.set(p.id,g);}
 const auto=models.get('autodromo');
 buildAutodromo(auto,circuits);
 buildArenaShow(models.get('arena-show'),{add,box,beam,tube,path,polygon,cylinder,groupAt,inPolygon,C});
 const events=models.get('centro-de-eventos');const eg=groupAt(events,318,307,.72);for(let i=0;i<5;i++){const h=groupAt(eg,(i-2)*30,(i%2)*6);glazing(h,27,67,10+(i%2)*2);box(h,0,12,0,29,1,70,'#f1f3f2');for(let k=-32;k<=32;k+=2.5)box(h,0,13,k,29,.12,.13,'#b2c1c5');box(h,0,13.2,0,5,.5,56,'#b6c9cc');for(let x=-12;x<12;x+=5)box(h,x,0,-33.7,4.5,8,.4,'#bbbeb7');}box(eg,0,2,41,155,5,10,C.glass);for(let x=-72;x<=72;x+=12)palm(eg,x,52,10+(x%3));for(const y of [4.5,8])box(eg,0,y,46.2,155,.35,.3,C.dark);box(eg,0,12,42,160,.8,12,C.white);for(let x=-68;x<=68;x+=17)box(eg,x,0,46,.5,12,.5,C.white);
 const wheel=models.get('roda-gigante');const wg=groupAt(wheel,508,738,.74);cylinder(wg,0,.8,0,27,1.2,'#d9cfaa');ring(wg,0,2.2,0,25,.4,'#aeac83');for(const z of [-4,4]){beam(wg,[-12,2,z],[0,27,0],1,C.white);beam(wg,[12,2,z],[0,27,0],1,C.white);ring(wg,0,27,z,22,.8,C.white,true);}for(let i=0;i<42;i++){const a=i*Math.PI*2/42,x=Math.cos(a)*22,y=27+Math.sin(a)*22;beam(wg,[0,27,0],[x,y,3],.12,C.gold);if(i%2===0)beam(wg,[0,27,0],[x,y,-3],.12,C.white);cylinder(wg,x,y-2.8,0,1.5,2.2,C.glass);cylinder(wg,x,y-.6,0,1.65,.3,C.white);}const axle=add(wg,new T.CylinderGeometry(1.8,1.8,11,32),C.white,0,27,0);axle.rotation.x=Math.PI/2;const boarding=groupAt(wg,0,0);glazing(boarding,39,17,6);box(boarding,0,3.8,8.8,39,.18,.2,C.white);for(const z of [-9,9]){tube(boarding,[[-20,7,z],[-12,8.7,z],[0,5.8,z],[12,7,z],[20,9,z]],.85,C.white);tube(boarding,[[-20,5.5,z],[-10,6.8,z],[1,3.9,z],[12,5.2,z],[20,7,z]],.4,C.white);}for(let i=-18;i<=18;i+=2)beam(boarding,[i,1,9],[i,6,9],.07,C.white);
 const kart=models.get('kartodromo');polygon(kart,places.find(p=>p.id==='kartodromo').footprint,'#b0ad82',1,.2);path(kart,terrain.kartTrack,12,'#d8cbae',1.3,true);path(kart,terrain.kartTrack,8,'#697064',1.5,true);path(kart,terrain.kartTrack,6.6,'#889282',1.55,true);const kg=groupAt(kart,379,852,.12);glazing(kg,12,78,12);waveRoof(kg,16,82,13,4);for(const y of [5.5,11.5])box(kg,6.5,y,0,.4,.5,78,C.white);for(let z=-37;z<39;z+=3.4)box(kg,6.3,1,z,.22,12,.23,C.white);for(let z=-35;z<37;z+=7)box(kg,7,1,z,.8,3.5,5,C.dark);for(let z=-37;z<38;z+=2)for(let y=0;y<2;y++)box(kg,8,y*.7+1,z,1,.7,1.9,(Math.round((z+37)/2)+y)%2?C.white:C.dark);stand(kart,359,855,65,10,Math.PI/2);
 const bmx=models.get('bmx');const bg=groupAt(bmx,307,860,.36);box(bg,0,.7,0,30,1,68,'#d9c79d');for(let lane=-1;lane<=1;lane++){const x=lane*8;path(bg,[[x-3,-29],[x+3,-20],[x-3,-6],[x+3,9],[x-3,23]],5.2,'#d6ba58',1.85);path(bg,[[x-3,-29],[x+3,-20],[x-3,-6],[x+3,9],[x-3,23]],4,'#3980ac',1.9);for(let z=-23;z<27;z+=8){rollingRamp(bg,x,z,4.8,6,1.6);}}for(const [cx,cz,w,d,h] of [[-4,-29,10,9,8],[7,-33,7,9,12]]){box(bg,cx,1,cz,w,h,d,'#184575');box(bg,cx,1.2,cz+d/2+.1,w*.4,3,.3,C.dark);for(let row=0;row<4;row++)for(let k=0;k<Math.round(w*2);k++){const x=cx-w/2+k*.52;box(bg,x,1+row*h/4,cz+d/2+.23,.26,h/4-.12,.2,[C.white,'#225a8c','#4d91bb','#163d70'][(k*3+row*7)%4]);}for(let k=0;k<16;k++)box(bg,cx+w/2+.12,1,cz-d/2+k*d/16,.23,h,.28,k%3?C.blue:C.white);}box(bg,1,7,-30,5,1,8,C.blue);const bcan=groupAt(bg,0,0,Math.PI/2);stand(bcan,0,20,50,8);
 const skate=models.get('skate-park');const sg=groupAt(skate,261,769,-.25);skateSurface(sg);
 box(sg,10,2.5,-8,3,1.6,12,C.white);beam(sg,[-12,4,7],[0,4,10],.16,C.dark);beam(sg,[-12,2.3,7],[-12,4,7],.15,C.dark);beam(sg,[0,2.3,10],[0,4,10],.15,C.dark);
 for(let i=0;i<5;i++)box(sg,12,2.3+i*.3,14+i*1.1,6,.3,1.1,C.stone);

 const wake=models.get('wake-park');const wp=places.find(p=>p.id==='wake-park').footprint;polygon(wake,wp,C.water,.9,.2);path(wake,[[142,618],[166,686],[184,712]],1,'#d8efda',1.3);for(const [x,z] of [[141,612],[172,691],[195,706],[184,609]]){beam(wake,[x,1,z],[x,14,z],.55,C.white);}tube(wake,[[141,14,612],[184,14,609],[195,14,706],[172,14,691]],.12,C.dark,true);for(const [x,z] of [[157,650],[167,672],[186,700]])box(wake,x,1.6,z,4,.9,12,C.white);const wk=groupAt(wake,220,684,-.36);glazing(wk,18,12,6);box(wk,0,7,0,23,1,16,C.white);for(let i=-8;i<=0;i+=.8)box(wk,i,1,6.3,.23,5,.6,C.wood);palm(wake,211,691,8);palm(wake,230,689,9);
 const beach=models.get('arenas-beach');const bc=groupAt(beach,201,306,-.44);for(let j=0;j<4;j++)court(bc,0,(j-1.5)*15,15,12);stand(bc,14,0,60,8,Math.PI/2);for(const z of [-30,30])for(const x of [-10,20])beam(bc,[x,1,z],[x,18,z],.45,C.dark);
 // Árvore da Vida: reference is a panoramic tower, not a botanical tree.
 const tower=models.get('arvore-da-vida');const tw=groupAt(tower,283,598);cylinder(tw,0,.8,0,13,1,C.stone);ring(tw,0,2,0,11,.5,C.gold);cylinder(tw,0,2,0,3.3,42,'#427568',2.4);cylinder(tw,0,44,0,4.2,4,C.white,7.6);cylinder(tw,0,48,0,8.2,7,C.glass);cylinder(tw,0,55,0,8.6,1.4,C.gold);const dome=add(tw,new T.SphereGeometry(8.6,32,12,0,Math.PI*2,0,Math.PI/2),'#597e73',0,56,0);dome.scale.y=.48;for(let i=0;i<18;i++){const a=i/18*Math.PI*2;beam(tw,[Math.cos(a)*8.25,48,Math.sin(a)*8.25],[Math.cos(a)*8.25,55,Math.sin(a)*8.25],.15,C.gold);}for(let a=0;a<6;a++)beam(tw,[Math.cos(a)*8,2,Math.sin(a)*8],[Math.cos(a)*2.7,12,Math.sin(a)*2.7],.65,C.wood);
 const fam=models.get('parque-da-familia');polygon(fam,places.find(p=>p.id==='parque-da-familia').footprint,'#cab77c',1,.3);path(fam,[[243,548],[255,546],[278,551],[300,544],[318,542]],9,'#709e9b',1.5);for(const [x,z,r] of [[253,552,6],[285,546,6],[305,546,5]]){cylinder(fam,x,1.7,z,r,.3,'#d6c86b');ring(fam,x,2,z,r,.8,C.white);}const fc=groupAt(fam,288,542,-.2);for(let i=0;i<4;i++){const cv=groupAt(fc,(i-1.5)*12,0);for(const side of [-1,1]){const b=box(cv,side*2.8,7,0,6,.35,12,C.white);b.rotation.z=side*.3;box(cv,side*5.5,0,-5,.28,8,.28,C.white);box(cv,side*5.5,0,5,.28,8,.28,C.white);beam(cv,[0,6.4,-6],[side*5.7,8,-6],.16,C.white);beam(cv,[0,6.4,6],[side*5.7,8,6],.16,C.white);}}for(const [x,z] of [[240,547],[270,544],[293,536]]){cylinder(fam,x,1,z,2,5,'#c56943');add(fam,new T.ConeGeometry(3.5,2,6),'#d8be58',x,7,z);beam(fam,[x+1,5,z],[x+5,2,z+5],.6,'#6797a5');}
 const splash=models.get('splash-parque');polygon(splash,places.find(p=>p.id==='splash-parque').footprint,'#80b8b7',1,.3);path(splash,[[219,611],[233,624],[245,643],[245,658]],7,'#d9c97d',1.5);for(const [x,z,r] of [[225,615,4],[235,633,7],[246,656,4]]){cylinder(splash,x,1.7,z,r,.2,'#478f9d');ring(splash,x,2,z,r,.5,C.white);beam(splash,[x,2,z],[x,7,z],.3,C.gold);add(splash,new T.ConeGeometry(r*.55,1.8,10),'#dfb65e',x,7,z);}for(const [x,z] of [[216,608],[232,654]]){const s=groupAt(splash,x,z);cylinder(s,0,1,0,.5,6,C.blue);const roof=add(s,new T.ConeGeometry(5.5,1.8,4),'#d79152',0,8,0);roof.rotation.y=Math.PI/4;}
 const sp=groupAt(splash,239,639,-.48);glazing(sp,18,10,6);box(sp,0,7,0,20,1.5,12,'#174e6a');for(let z=-4;z<=4;z+=.6)box(sp,9.3,1,z,.25,6,.22,'#568296');
 for(const [x,z,color] of [[-11,-10,'#e4bb54'],[9,10,'#247797'],[-9,11,'#e4bb54']]){cylinder(sp,x,1,z,.32,7,color);const roof=add(sp,new T.CylinderGeometry(5,5,.35,6),'#c06940',x,8,z);for(let i=0;i<6;i++){const a=i/6*Math.PI*2,b=(i+1)/6*Math.PI*2;beam(sp,[x,7,z],[x+Math.cos(a)*5,8,z+Math.sin(a)*5],.18,color);beam(sp,[x+Math.cos(a)*5,8,z+Math.sin(a)*5],[x+Math.cos(b)*5,8,z+Math.sin(b)*5],.22,color);}}
 const museums=models.get('museus');const mg=groupAt(museums,281,599,-.13);for(const side of [-1,1]){const pts=[];for(let i=0;i<=24;i++){const a=(-1.04+i/24*2.1)+(side===1?0:Math.PI);pts.push([Math.cos(a)*29,Math.sin(a)*29]);}for(let i=24;i>=0;i--){const a=(-1.04+i/24*2.1)+(side===1?0:Math.PI);pts.push([Math.cos(a)*17,Math.sin(a)*17]);}const mh=side===-1?12:8;polygon(mg,pts,'#a89070',1,mh);polygon(mg,pts,'#779453',mh+1,.7);for(let i=0;i<=22;i++){const a=(-1.04+i/22*2.1)+(side===1?0:Math.PI);const w=box(mg,Math.cos(a)*29,1,Math.sin(a)*29,1,mh-1,2,C.glass);w.rotation.y=-a;const rib=box(mg,Math.cos(a)*29.3,1,Math.sin(a)*29.3,.27,mh,1.4,i%4?C.wood:C.white);rib.rotation.y=-a;}}
 const food=models.get('praca-de-alimentacao');const fd=groupAt(food,330,573,-.22);glazing(fd,39,17,7);box(fd,0,8,0,41,1.2,19,C.white);for(const side of [-1,1])for(let row=0;row<2;row++)for(let i=0;i<20;i++){const x=-19+i*1.95,tri=new T.Shape();tri.moveTo(-.97,0);tri.lineTo(.97,0);tri.lineTo(0,2.3);tri.closePath();const m=add(fd,new T.ShapeGeometry(tri),['#304657','#8498aa','#d7e0de'][((i+row)*7)%3],x,3.2+row*2.35,side*8.7);if(i%2)m.rotation.z=Math.PI;m.material.side=T.DoubleSide;}for(const x of [-12,0,12]){cylinder(fd,x,1,12,.3,3,C.wood);add(fd,new T.ConeGeometry(3.5,1.1,8),C.white,x,4,12);}
 const village=models.get('vila-das-nacoes');const vb=groupAt(village,447,568,.18);for(let i=0;i<11;i++){const z=-36+i*7;const h=[6,9,7,5,11,7,8,6,10,6,8][i],c=[C.stone,'#cf9b73','#dacaa4','#b8c5b6'][i%4];box(vb,0,1,z,9,h,6,c);for(const zz of [-1.4,1.4])box(vb,-4.6,3,z+zz,.3,2,1.2,C.glass);const roof=add(vb,new T.ConeGeometry(5.5,3,4),'#a57750',0,h+2,z);roof.rotation.y=Math.PI/4;roof.scale.z=.68;if(i===4||i===8){cylinder(vb,0,h+1,z,1.3,4,C.stone);add(vb,new T.ConeGeometry(2,4,12),C.gold,0,h+7,z);}}
 const casa=models.get('casa-cuiabana');const cg=groupAt(casa,453,659,.4);
 box(cg,0,1,0,24,6.8,12,'#e4d5a5');box(cg,0,6.6,0,24,1.5,12,'#c98e65');box(cg,0,1,0,24,.8,12,'#cd916b');
 for(const y of [6.5,8.1])box(cg,0,y,0,24.6,.22,12.6,C.white);
 box(cg,0,8.2,0,5.5,1,12,'#c98e65');box(cg,0,9.2,0,6,.25,12.5,C.white);
 for(let x=-10.5;x<=10.5;x+=3){box(cg,x-1.4,1,6.1,.24,7.2,.3,C.white);archedWindow(cg,x,1.9,6.2,1.8,3.8);}
 for(let i=0;i<7;i++){box(cg,0,.8-i*.1,8+i*1.0,27,.35,1.1,C.stone);for(const x of [-3.5,3.5])beam(cg,[x,1.4-i*.1,8+i],[x,2.2-i*.1,8+i],.07,C.dark);}
 for(let x=-12;x<=12;x+=1)beam(cg,[x,1.1,14],[x,2.1,14],.065,C.white);beam(cg,[-12,2.1,14],[12,2.1,14],.09,C.white);
 treesSmall(cg,[[-8,8],[8,8]],.65);
 const agro=models.get('agroplace');const ap=groupAt(agro,398,701);cylinder(ap,0,1,0,19,1,C.stone);cylinder(ap,0,2,0,16,11,C.glass);cylinder(ap,0,13,0,17,1.2,'#466347');ring(ap,0,2,0,17,.14,'#99b670');ring(ap,0,12.8,0,17,.14,'#99b670');for(let i=0;i<60;i++){const a=i/60*Math.PI*2;const b=box(ap,Math.cos(a)*16.8,2,Math.sin(a)*16.8,.6,12,1.3,i%3===0?'#8aaf69':'#466b42');b.rotation.y=-a;}for(let r=21;r<=25;r+=2){const step=cylinder(ap,0,.15+(25-r)*.1,0,r,.3,C.stone);step.castShadow=false;}
 const gate=models.get('portico-de-entrada');const ga=groupAt(gate,933,968,1.15);
 // Two broad, curved concrete shells, as shown in the entrance rendering.
 for(const x of [-17,17]){const shell=new T.Shape();shell.moveTo(-17,1);shell.absellipse(0,1,17,19,Math.PI,0,true);shell.lineTo(15.8,1);shell.absellipse(0,1,15.8,17.8,0,Math.PI,false);shell.closePath();const m=add(ga,new T.ExtrudeGeometry(shell,{depth:11,bevelEnabled:true,bevelThickness:.15,bevelSize:.15,bevelSegments:2,curveSegments:40}),C.white,x,0,-5.5);for(const side of [-1,1]){box(ga,x+side*16.4,.5,0,1.6,2,12,C.stone);beam(ga,[x+side*15.7,2,-5.7],[x+side*12.5,11,-5.7],.1,C.gold);}}
 box(ga,0,1,0,5,2,9,C.green);for(const x of [-25,-8,8,25])path(ga,[[x,-15],[x,15]],.28,C.white,1.1);
 const park=models.get('estrutura-e-acesso');const parkFoot=places.find(p=>p.id==='estrutura-e-acesso').footprint;polygon(park,parkFoot,'#cfccb6',.6,.15);for(let x=720;x<=864;x+=11)for(let z=948;z<1029;z+=18)if(inPolygon([x,z],parkFoot)&&inPolygon([x+6,z+9],parkFoot)){path(park,[[x,z],[x,z+8],[x+6,z+8]],.35,C.white,.9,false,false);if((x+z)%4===0){box(park,x+3,1,z+4,3,1.6,6,'#eef0d9');box(park,x+3,2.3,z+4,2.6,.8,3,C.glass);}}
 const moto=models.get('motocross');const mp=places.find(p=>p.id==='motocross').footprint;polygon(moto,mp,'#c4a27a',.9,.2);const mt=[[327,931],[346,943],[368,958],[390,971],[406,995],[395,1007],[371,981],[357,966],[338,952],[327,931]];path(moto,mt,9,'#976e48',1.4,true);for(let i=0;i<14;i++){const x=336+i*4.2,z=940+i*4.3;const b=add(moto,new T.SphereGeometry(4,10,6),'#ad865c',x,1.5,z);b.scale.set(1.6,.5,.85);}stand(moto,333,952,50,8,-.85);
 pearl(models.get('perola-do-cerrado'));
 kerbs(circuits,terrain.raceTrack,terrain.raceConnections);roadFurniture(infrastructure);addVegetation(vegetation);
 buildInfrastructure(infrastructure);
 // Batch static architecture by material: fine detail without thousands of draw calls.
 applyPhotoRefinements(models,{terrain});
 models.forEach((g,id)=>{batchStatic(g);g.traverse(o=>{o.userData.placeId=id;});});
 batchStatic(landscape);batchStatic(infrastructure);batchStatic(water);batchStatic(circuits);
 circuits.traverse(o=>{o.userData.placeId='autodromo';});
 return {root,modelLayer,models,landscape,vegetation,infrastructure,water,circuits};
}

function batchStatic(g){
 g.updateWorldMatrix(true,true);const inverse=g.matrixWorld.clone().invert(),buckets=new Map(),keep=[];
 g.traverse(o=>{if(!o.isMesh)return;if(o.isInstancedMesh){keep.push(o);return;}const key=o.material.uuid+o.castShadow+o.receiveShadow;let b=buckets.get(key);if(!b){b={material:o.material,cast:o.castShadow,receive:o.receiveShadow,positions:[],normals:[],uvs:[]};buckets.set(key,b);}const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(inverse.clone().multiply(o.matrixWorld));const pos=geo.getAttribute('position'),normal=geo.getAttribute('normal');for(let i=0;i<pos.array.length;i++)b.positions.push(pos.array[i]);for(let i=0;i<normal.array.length;i++)b.normals.push(normal.array[i]);
  // Plan-space projection survives merged geometry and keeps PBR scale consistent.
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),nx=Math.abs(normal.getX(i)),ny=Math.abs(normal.getY(i)),nz=Math.abs(normal.getZ(i));b.uvs.push((nx>ny&&nx>nz?z:x)/5,(ny>=nx&&ny>=nz?z:y)/5);}o.geometry.dispose();geo.dispose();});
 g.clear();keep.forEach(m=>g.add(m));for(const b of buckets.values()){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.uvs,2));geo.computeBoundingSphere();const m=new T.Mesh(geo,b.material);m.castShadow=b.cast;m.receiveShadow=b.receive;g.add(m);}
}

export function inPolygon([x,y],vs){let inside=false;for(let i=0,j=vs.length-1;i<vs.length;j=i++){const [xi,yi]=vs[i],[xj,yj]=vs[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;}return inside;}
function addVegetation(g){
 let seed=237;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const positions=[],palms=[];
 function nearRoad(x,z,minDist=14){
  for(const pts of terrain.roads){
   for(let i=0;i<pts.length-1;i++){
    const p1=pts[i],p2=pts[i+1],dx=p2[0]-p1[0],dz=p2[1]-p1[1],lenSq=dx*dx+dz*dz;
    if(!lenSq)continue;
    const t=Math.max(0,Math.min(1,((x-p1[0])*dx+(z-p1[1])*dz)/lenSq));
    const px=p1[0]+t*dx,pz=p1[1]+t*dz;
    if(Math.hypot(x-px,z-pz)<minDist)return true;
   }
  }
  for(const park of terrain.parking){if(inPolygon([x,z],park))return true;}
  for(const rb of(terrain.roundabouts||[])){if(Math.hypot(x-rb.center[0],z-rb.center[1])<rb.outerRadius+4)return true;}
  return false;
 }

 // Palmeiras Imperiais ao longo das avenidas principais (bulevares)
 for(const road of terrain.roads.slice(0,3)){
  const c=new T.CatmullRomCurve3(road.map(([x,z])=>new T.Vector3(x,0,z)),false,'centripetal'),length=c.getLength();
  for(let d=35;d<length-25;d+=42){
   const p=c.getPointAt(d/length),t=c.getTangentAt(d/length);
   for(const s of [-1,1]){
    const px=p.x-t.z*10.5*s,pz=p.z+t.x*10.5*s;
    if(!nearRoad(px,pz,7))palms.push([px,pz,10+rand()*3]);
   }
  }
 }

 for(const poly of terrain.greens){
  const xs=poly.map(p=>p[0]),zs=poly.map(p=>p[1]);
  for(let i=0;i<450;i++){
   const x=Math.min(...xs)+rand()*(Math.max(...xs)-Math.min(...xs)),z=Math.min(...zs)+rand()*(Math.max(...zs)-Math.min(...zs));
   if(inPolygon([x,z],poly)&&!nearRoad(x,z))positions.push([x,z,2.8+rand()*3.2]);
  }
 }
 for(let i=0;i<terrain.outline.length;i++){
  const a=terrain.outline[i],b=terrain.outline[(i+1)%terrain.outline.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  for(let d=8;d<len;d+=13){
   const t=d/len,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
   if(!nearRoad(x,z,16))positions.push([x,z,3+rand()*3.4]);
  }
 }

 // Árvores com copas facetadas de visualização paisagística
 const crownGeo=new T.IcosahedronGeometry(1.25,1);
 const crown=new T.InstancedMesh(crownGeo,material('#2d5022',0,.82),positions.length*4);
 const trunk=new T.InstancedMesh(new T.CylinderGeometry(.2,.38,1,8),material('#4a3826',0,.88),positions.length);
 const dummy=new T.Object3D();
 positions.forEach(([x,z,s],i)=>{
  for(let j=0;j<4;j++){
   const a=j/3*Math.PI*2;
   dummy.position.set(x+(j?Math.cos(a)*s*.48:0),2.2+s*(j?.85:1.3),z+(j?Math.sin(a)*s*.48:0));
   dummy.scale.set(s*(j?.68:.82),s*(j?.78:.98),s*(j?.74:.82));
   dummy.rotation.set(rand()*.3,rand()*Math.PI,rand()*.3);
   dummy.updateMatrix();
   crown.setMatrixAt(i*4+j,dummy.matrix);
   // Variação tonal do cerrado/tropical: verde oliva, verde folha, dourado suave
   crown.setColorAt(i*4+j,new T.Color().setHSL(.23+rand()*.12,.52+rand()*.2,.17+rand()*.11));
  }
  dummy.position.set(x,2.6,z);dummy.scale.set(s*.65,5.2,s*.65);dummy.rotation.set(0,0,0);dummy.updateMatrix();
  trunk.setMatrixAt(i,dummy.matrix);
 });
 crown.castShadow=true;crown.receiveShadow=true;trunk.castShadow=true;g.add(crown,trunk);

 // Adiciona palmeiras imperiais nas vias
 for(const [px,pz,ph] of palms){
  palm(g,px,pz,ph);
 }
}

function roadMarks(g,points){
 const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,.085,z)),false,'centripetal'),length=curve.getLength();
 for(let d=8;d<length-4;d+=14){const p=curve.getPointAt(d/length),t=curve.getTangentAt(d/length);const stripe=box(g,p.x,p.y,p.z,.32,.035,5,'#eee6c6');stripe.rotation.y=Math.atan2(t.x,t.z);stripe.castShadow=false;}
}
function kerbs(g,points,connections=[]){
 const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,1.35,z)),true,'centripetal'),length=curve.getLength();
 const junctions=connections.map(([a,b])=>new T.Line3(new T.Vector3(a[0],0,a[1]),new T.Vector3(b[0],0,b[1]))),probe=new T.Vector3(),nearest=new T.Vector3();
 for(let d=0;d<length;d+=4){const p=curve.getPointAt(d/length),t=curve.getTangentAt(d/length);for(const side of [-1,1]){
  const x=p.x-t.z*5.25*side,z=p.z+t.x*5.25*side;probe.set(x,0,z);
  if(junctions.some(line=>line.closestPointToPoint(probe,true,nearest).distanceTo(probe)<7.9))continue;
  const curb=box(g,x,p.y,z,1.1,.12,3.8,Math.floor(d/4)%2?'#f6f7f4':'#c65a43');curb.rotation.y=Math.atan2(t.x,t.z);curb.castShadow=false;}}
}
function roadFurniture(g){
 for(const road of terrain.roads.slice(0,1)){const c=new T.CatmullRomCurve3(road.map(([x,z])=>new T.Vector3(x,0,z)),false,'centripetal'),length=c.getLength();for(let d=25;d<length;d+=38){const p=c.getPointAt(d/length),t=c.getTangentAt(d/length),x=p.x-t.z*10,z=p.z+t.x*10;beam(g,[x,1,z],[x,10,z],.15,C.dark);beam(g,[x,10,z],[x+t.z*2,10,z-t.x*2],.12,C.dark);box(g,x+t.z*2,9.8,z-t.x*2,1,.25,1.8,C.white);}}
}

function archedWindow(g,x,y,z,w,h){
 const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(w/2,h-w/2);shape.absarc(0,h-w/2,w/2,0,Math.PI,false);shape.closePath();const m=add(g,new T.ShapeGeometry(shape),C.glass,x,y,z);m.material.side=T.DoubleSide;
 const pts=[[-w/2,0],[-w/2,h-w/2],...Array.from({length:17},(_,i)=>{const a=Math.PI-i/16*Math.PI;return [Math.cos(a)*w/2,h-w/2+Math.sin(a)*w/2];}),[w/2,0]];tube(g,pts.map(([a,b])=>[x+a,y+b,z+.03]),.09,C.white);box(g,x,y,z+.04,.09,h,.1,C.white);
}
function waveRoof(g,w,d,base,amplitude){
 const p=new T.Shape();p.moveTo(-d/2,0);p.bezierCurveTo(-d*.35,amplitude,-d*.12,amplitude,-d*.02,.5);p.bezierCurveTo(d*.08,-1,d*.26,-.5,d/2,1.3);p.lineTo(d/2,.4);p.bezierCurveTo(d*.26,-1.4,d*.08,-1.9,-d*.02,-.4);p.bezierCurveTo(-d*.12,amplitude-.9,-d*.35,amplitude-.9,-d/2,-.9);p.closePath();const mesh=add(g,new T.ExtrudeGeometry(p,{depth:w,bevelEnabled:false,curveSegments:32}),C.white,-w/2,base,0);mesh.rotation.y=Math.PI/2;
}
function palm(g,x,z,h){
 cylinder(g,x,1,z,.32,h,'#584432',.2);ring(g,x,.8,z,2.6,.6,C.stone);
 const leaves=[];
 for(let j=0;j<10;j++){const a=j/10*Math.PI*2;for(let k=0;k<7;k++){const t=k/6,r=t*5.2,yy=1+h+Math.sin(t*Math.PI)*1.4-t*t*2,w=Math.sin(t*Math.PI)*.6;leaves.push(x+Math.cos(a)*r-Math.sin(a)*w,yy,z+Math.sin(a)*r+Math.cos(a)*w,x+Math.cos(a)*r+Math.sin(a)*w,yy-.1,z+Math.sin(a)*r-Math.cos(a)*w);}}
 const indices=[];for(let j=0;j<10;j++)for(let k=0;k<6;k++){const n=j*14+k*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(leaves,3));geo.setIndex(indices);geo.computeVertexNormals();const m=add(g,geo,'#36662e');m.material.side=T.DoubleSide;
}

function solarCanopy(g,x,z,width,depth){
 const frame=groupAt(g,x,z);box(frame,0,5.2,0,width,.18,depth,'#152b37');
 // As divisões das células e as molduras respondem à iluminação da cena.
 for(let ix=-width/2;ix<width/2;ix+=2.5)for(let iz=-depth/2;iz<depth/2;iz+=1.5){box(frame,ix+1.19,5.35,iz+.7,2.35,.06,1.35,'#315265');}
 for(let ix=-width/2;ix<=width/2;ix+=5)box(frame,ix,5.47,0,.055,.06,depth,'#adb9bc');
 for(let iz=-depth/2;iz<=depth/2;iz+=1.5)box(frame,0,5.47,iz,width,.06,.055,'#adb9bc');
 for(let ix=-width/2+3;ix<width/2;ix+=10){beam(frame,[ix,0,-1.5],[ix,5.2,0],.14,C.dark);beam(frame,[ix,4.4,0],[ix,5.2,-depth/2],.12,C.dark);beam(frame,[ix,4.4,0],[ix,5.2,depth/2],.12,C.dark);}
}
function bridge(g,points){
 path(g,points,7.5,'#b4b5aa',1.3,false,false);path(g,points,6.6,'#d5d4c8',1.5,false,false);
 const c=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,1.5,z)),false,'centripetal'),len=c.getLength();
 for(let d=0;d<=len;d+=4){const p=c.getPointAt(Math.min(d/len,1)),t=c.getTangentAt(Math.min(d/len,1));for(const side of [-1,1]){const x=p.x-t.z*3.55*side,z=p.z+t.x*3.55*side;beam(g,[x,1.5,z],[x,2.8,z],.065,C.white);if(d+4<=len){const q=c.getPointAt((d+4)/len);beam(g,[x,2.8,z],[q.x-t.z*3.55*side,2.8,q.z+t.x*3.55*side],.07,C.white);}}if(Math.round(d)%16===0)cylinder(g,p.x,-2,p.z,.65,3.5,C.stone);}
}
function buildInfrastructure(g){
 const solar=groupAt(g,306,740,.61);
 for(let row=0;row<4;row++)solarCanopy(solar,0,-24+row*14,36,6);
 for(let row=0;row<4;row++)for(const side of [-1,1])path(solar,[[side*18,-27+row*14],[side*18,-21+row*14]],.25,C.white,.5,false,false);
 for(const points of terrain.paths){path(g,points,4.2,C.stone,.42);path(g,points,3.6,'#b9b9ad',.55);}
}

function pearl(g){
 const p=groupAt(g,218,558,.48),rx=15,rz=24;
 const plinth=cylinder(p,0,.3,0,1,.9,'#b9b6a9');plinth.scale.set(18,1,28);
 const facade=cylinder(p,0,1,0,1,5.2,C.glass);facade.scale.set(rx,1,rz);
 const roof=new T.SphereGeometry(1,64,24,0,Math.PI*2,0,Math.PI/2);roof.scale(rx+1.4,7,rz+1.5);const shell=add(p,roof,'#d5e4e5',0,6.2,0,.28,.3);
 // Lâminas e arcos da estrutura oval observada nas fotos aéreas.
 for(let i=0;i<36;i++){const a=i/36*Math.PI*2;beam(p,[Math.cos(a)*rx,1,Math.sin(a)*rz],[Math.cos(a)*rx,6.2,Math.sin(a)*rz],.18,C.white);}
 for(let z=-21;z<=21;z+=4.2){const half=(rx+1.4)*Math.sqrt(Math.max(0,1-Math.pow(z/(rz+1.5),2))),pts=[];for(let i=0;i<=24;i++){const x=-half+i/24*half*2,y=6.4+7*Math.sqrt(Math.max(0,1-Math.pow(x/(rx+1.4),2)-Math.pow(z/(rz+1.5),2)));pts.push([x,y,z]);}tube(p,pts,.16,C.white);}
 for(let x=-12;x<=12;x+=4){const half=(rz+1.5)*Math.sqrt(Math.max(0,1-Math.pow(x/(rx+1.4),2))),pts=[];for(let i=0;i<=32;i++){const z=-half+i/32*half*2,y=6.4+7*Math.sqrt(Math.max(0,1-Math.pow(x/(rx+1.4),2)-Math.pow(z/(rz+1.5),2)));pts.push([x,y,z]);}tube(p,pts,.13,C.white);}
 const rim=ring(p,0,6.2,0,1,.018,C.white);rim.scale.set(rx+1.7,rz+1.7,1);
 for(let i=0;i<3;i++){const step=cylinder(p,0,.18+i*.1,0,1,.12,C.stone);step.scale.set(19-i*.5,1,29-i*.5);}
}

function skateSurface(g){
 const points=[[-18,-25],[9,-24],[20,-10],[17,20],[4,34],[-14,22],[-22,2]],bowls=[[-7,-12,8],[4,3,6.2],[-1,22,6.2]],shape=new T.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 for(const [x,z,r] of bowls){const hole=new T.Path();hole.absellipse(x,-z,r,r,0,Math.PI*2,true);shape.holes.push(hole);}
 const base=new T.ExtrudeGeometry(shape,{depth:1.8,bevelEnabled:false});base.rotateX(-Math.PI/2);add(g,base,'#b6bebd',0,.5,0);
 for(const [x,z,r] of bowls){const verts=[],ind=[],segments=64,rings=16;for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){const q=j/rings,a=i/segments*Math.PI*2;verts.push(x+Math.cos(a)*r*q,.68+1.62*Math.pow(q,4),z+Math.sin(a)*r*q);if(j<rings&&i<segments){const k=j*(segments+1)+i;ind.push(k,k+segments+1,k+1,k+1,k+segments+1,k+segments+2);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(ind);geo.computeVertexNormals();const m=add(g,geo,'#a1b4bd');m.material.side=T.DoubleSide;ring(g,x,2.34,z,r,.13,C.white);}
}
function rollingRamp(g,x,z,width,length,height){
 const verts=[],indices=[],n=18;for(let i=0;i<=n;i++){const t=i/n,y=1.91+Math.pow(Math.sin(t*Math.PI),2)*height;verts.push(x-width/2,y,z+(t-.5)*length,x+width/2,y,z+(t-.5)*length);if(i<n){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();const m=add(g,geo,'#3980ac');m.material.side=T.DoubleSide;
}
