import {createRoadDetails,roadFinishData as ROAD03} from './vias-acabamento.js?v=vias-acabamento-20260915-4';
import {createCanopyGeometry,foliageUniforms} from './folhagem.js?v=realismo-3d-20261119-1';
import {createIntegralLandscape} from './cenario-integral.js?v=realismo-3d-20261119-2';
import * as T from 'three';
import {scenarioData as D} from './cenario-dados.js?v=cenario-integral-20260914-2';
export const scenarioMaterials=new Map();
function material(key,color,roughness=.86,metalness=0){
 if(!scenarioMaterials.has(key)){const m=new T.MeshStandardMaterial({color,roughness,metalness});m.name='Cenário · '+key;scenarioMaterials.set(key,m);}
 return scenarioMaterials.get(key);
}
function surface(record,y,m){
 const g=new T.BufferGeometry(),p=[],uv=[];
 for(let i=0;i<record.points.length;i+=2){const x=record.points[i],z=record.points[i+1];p.push(x,y,z);uv.push(x/4,z/4);}
 // All horizontal triangles face up; avoid relying on DoubleSide.
 const position=new T.Float32BufferAttribute(p,3),v=position.array,indices=[];
 for(let i=0;i<record.indices.length;i+=3){let [a,b,c]=record.indices.slice(i,i+3);const ax=v[b*3]-v[a*3],az=v[b*3+2]-v[a*3+2],bx=v[c*3]-v[a*3],bz=v[c*3+2]-v[a*3+2],cross=az*bx-ax*bz;if(Math.abs(cross)<1e-9)continue;if(cross<0)[b,c]=[c,b];indices.push(a,b,c);}
 g.setAttribute('position',position);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();const mesh=new T.Mesh(g,m);mesh.receiveShadow=true;mesh.name=m.name;return mesh;
}
function instances(parent,geo,mat,entries,cast=true){
 const mesh=new T.InstancedMesh(geo,mat,entries.length),o=new T.Object3D();mesh.name=mat.name;mesh.castShadow=cast;mesh.receiveShadow=true;mesh.userData.skipBatch=true;
 for(let i=0;i<entries.length;i++){const e=entries[i];o.position.fromArray(e.p);o.scale.fromArray(e.s);o.rotation.set(0,e.a||0,0);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);if(e.color)mesh.setColorAt(i,new T.Color(e.color));}
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();parent.add(mesh);return mesh;
}
export function createScenario({smallScreen=false,landscape,groundMaterial,integralFinish}){
 const root=new T.Group(),trees=new T.Group(),street=new T.Group(),paint=new T.Group();root.name='Parque · paisagismo, sinalização e iluminação';root.userData.version=D.version;root.userData.provenance=D.provenance;root.add(trees,street,paint,createRoadDetails());
 const integral=createIntegralLandscape({smallScreen});root.add(integral.root);
 const colors={curbs:'#bec1b3',roadEdges:'#eee9d6',roadDashes:'#eee9d6',parkingBays:'#e6e5ce'};
 for(const [key,data]of Object.entries(D.surfaces)){if(key!=='parkingBays'||!data.indices.length)continue;const m=material(key,colors[key]);m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-1;paint.add(surface(data,key==='curbs'?.18:.155,m));}
 const palette=['#264f23','#2f5e2a','#3a6d31','#467b38','#538740','#325f34','#4b7432','#5e8c45','#2a552b'],trunks=[],crowns=[];
 function inPoly(x,z,ring){
  let ok=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const [a,b]=ring[i],[c,d]=ring[j];
   if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)ok=!ok;
  }
  return ok;
 }
 function isClearForTree(x,z){
  // Preserva edificações, pistas, estacionamentos e espelhos d'água livres de árvores
  if(x>=420&&x<=488&&z>=624&&z<=675)return false; // Casa Cuiabana
  if(x>=425&&x<=572&&z>=392&&z<=495)return false; // Arena Show e esplanada
  if(x>=265&&x<=362&&z>=535&&z<=615)return false; // Parque da Família / Museus / Praça
  if(x>=190&&x<=252&&z>=525&&z<=595)return false; // Mirante Oval
  if(x>=250&&x<=372&&z>=672&&z<=805)return false; // Estacionamento Solar E4/E5
  if(x>=362&&x<=435&&z>=668&&z<=735)return false; // AgroPlace
  if(x>=225&&x<=282&&z>=735&&z<=825)return false; // Skate Park
  if(x>=280&&x<=342&&z>=820&&z<=898)return false; // BMX
  if(x>=355&&x<=502&&z>=775&&z<=928)return false; // Kartódromo
  if(x>=300&&x<=462&&z>=896&&z<=1042)return false; // Motocross
  if(x>=485&&x<=885&&z>=855&&z<=1078)return false; // Estacionamentos E1/E2/E3
  if(x>=510&&x<=765&&z>=370&&z<=628)return false; // Estacionamentos E6/E7
  if(x>=568&&x<=1072&&z>=400&&z<=878)return false; // Autódromo
  if(x>=245&&x<=390&&z>=245&&z<=355)return false; // Centro de Eventos
  if(x>=165&&x<=240&&z>=265&&z<=350)return false; // Arenas Beach
  if(x>=885&&x<=970&&z>=925&&z<=1010)return false; // Pórtico de Entrada
  if(x>=1005&&x<=1120&&z>=930&&z<=1030)return false; // Cavalaria PM
  if(x<=230&&z<=735)return false; // Lago Oeste principal
  if(x>=220&&x<=455&&z>=340&&z<=500)return false; // Enseada Norte
  if(x>=350&&x<=452&&z>=500&&z<=645)return false; // Enseada Sul
  return true;
 }
 const reserveZones=[
  {poly:[[388,318],[490,326],[485,384],[392,386]],count:140},
  {poly:[[462,506],[506,508],[504,620],[462,618]],count:110},
  {poly:[[312,614],[380,608],[378,664],[315,662]],count:95},
  {poly:[[228,332],[276,334],[274,390],[226,386]],count:70},
  {poly:[[245,28],[805,24],[885,135],[790,232],[410,225],[240,180]],count:520},
  {poly:[[908,165],[1045,335],[1108,535],[1175,845],[1115,855],[1072,620],[965,360],[875,195]],count:340},
  {poly:[[460,1062],[920,1065],[935,1118],[462,1118]],count:180},
  {poly:[[212,812],[268,882],[300,915],[348,995],[388,1040],[355,1042],[272,925],[195,818]],count:115}
 ];
 let seed=7919;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const extraTrees=[];
 for(const zone of reserveZones){
  const targetCount=smallScreen?Math.round(zone.count*0.42):zone.count;
  const xs=zone.poly.map(p=>p[0]),zs=zone.poly.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  let placed=0,attempts=0;
  while(placed<targetCount&&attempts<targetCount*7){
   attempts++;
   const x=minX+rand()*(maxX-minX),z=minZ+rand()*(maxZ-minZ);
   if(!inPoly(x,z,zone.poly)||!isClearForTree(x,z))continue;
   const h=5.6+rand()*6.8,r=2.1+rand()*2.4,c=Math.floor(rand()*palette.length);
   extraTrees.push([x,z,h,r,c]);
   placed++;
  }
 }
 const baseEntries=integral.trees.filter(([x,z],i)=>(!smallScreen||i%2===0)&&!(x>=420&&x<=488&&z>=624&&z<=675));
 const entries=[...baseEntries,...extraTrees];
 for(let idx=0;idx<entries.length;idx++){
  const [x,z,h,r,c]=entries[idx];
  const sVarX=0.88+((idx*17)%11)*0.026;
  const sVarY=0.34+((idx*13)%9)*0.016;
  const sVarZ=0.88+((idx*23)%11)*0.026;
  const cIdx=(c+idx)%palette.length;
  trunks.push({p:[x,h*.32,z],s:[.18,h*.64,.18],color:cIdx%2?'#5c4936':'#4d3f2f'});
  crowns.push({p:[x,h*.74,z],s:[r*sVarX,h*sVarY,r*sVarZ],a:cIdx*.73+x,color:palette[cIdx]});
 }
 const bark=material('troncos','#ffffff'),leaves=material('copas','#ffffff',.93);leaves.envMapIntensity=.7;leaves.vertexColors=true;
 leaves.onBeforeCompile=(shader)=>{
  shader.uniforms.uTime=foliageUniforms.uTime;
  shader.uniforms.uSunDir=foliageUniforms.uSunDir;
  shader.vertexShader=`
   uniform float uTime;
   ${shader.vertexShader}
  `.replace(
   '#include <begin_vertex>',
   `#include <begin_vertex>
    float wPhase=uTime*1.8+position.x*0.3+position.z*0.3;
    float sway=sin(wPhase)*0.038*max(0.0,position.y);
    transformed.x+=sway;
    transformed.z+=sway*0.65;
   `
  );
  shader.fragmentShader=`
   uniform vec3 uSunDir;
   ${shader.fragmentShader}
  `.replace(
   '#include <dithering_fragment>',
   `#include <dithering_fragment>
    vec3 lDir=normalize((viewMatrix*vec4(uSunDir,0.0)).xyz);
    float sss=pow(max(0.0,dot(-lDir,normal)),2.0)*0.28;
    gl_FragColor.rgb+=vec3(0.12,0.22,0.05)*sss;
   `
  );
 };
 instances(trees,new T.CylinderGeometry(.65,1,1,6),bark,trunks);
 const crownMesh=instances(trees,createCanopyGeometry(smallScreen),leaves,crowns);
 const bases=[],poles=[],arms=[],heads=[],faces=[],pools=[];
 const allLamps=[...D.lamps,...integral.lamps];
 for(const l of allLamps){const[x,z]=l.position,[ax,az]=l.aim,dx=ax-x,dz=az-z,len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len,a=-Math.atan2(uz,ux),reach=1.35;
  bases.push({p:[x,.16,z],s:[.42,.32,.42]});poles.push({p:[x,l.height/2,z],s:[.082,l.height,.082]});
  arms.push({p:[x+ux*reach/2,l.height,z+uz*reach/2],s:[reach,.085,.085],a});
  heads.push({p:[x+ux*reach,l.height-.065,z+uz*reach],s:[.65,.15,.31],a});faces.push({p:[x+ux*reach,l.height-.148,z+uz*reach],s:[.53,.016,.25],a});
  pools.push({p:[ax,.205,az],s:[l.kind==='passeio'?5:8,1,l.kind==='passeio'?5:8]});
 }
 instances(street,new T.BoxGeometry(1,1,1),material('bases','#aaa99a'),bases);
 instances(street,new T.CylinderGeometry(.6,1,1,8),material('postes','#9ca8a5',.5,.68),poles);
 instances(street,new T.BoxGeometry(1,1,1),material('braços','#859392',.48,.7),arms);
 instances(street,new T.BoxGeometry(1,1,1),material('luminárias','#33474a',.42,.65),heads);
 const lampFace=material('lentes','#f2e4c6',.3);lampFace.emissive.set('#ffe2a4');lampFace.emissiveIntensity=0;
 instances(street,new T.BoxGeometry(1,1,1),lampFace,faces,false);
 const poolGeo=new T.PlaneGeometry(2,2);poolGeo.rotateX(-Math.PI/2);
 const poolMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,uniforms:{strength:{value:0}},vertexShader:'varying vec2 vPool;void main(){vPool=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vPool;uniform float strength;void main(){float a=pow(max(0.0,1.0-length(vPool)),2.5)*strength;gl_FragColor=vec4(0.95,0.72,0.40,a);\n#include <colorspace_fragment>\n}'});
 const glow=instances(street,poolGeo,poolMaterial,pools,false);glow.name='Luz ambiente dos postes · simulação visual';glow.visible=false;
 // Changes only the terrain material and vertex colors, never its positions/indices.
 groundMaterial.color.set('#ffffff');
 const detailedGround=groundMaterial.clone();detailedGround.name='Cenário · terreno';detailedGround.userData.surfaceKind='grass';detailedGround.vertexColors=true;scenarioMaterials.set('terreno',detailedGround);
 landscape.traverse(o=>{
  if(!o.isMesh||o.material!==groundMaterial)return;
  const p=o.geometry.attributes.position,colors=[];
   for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);
    const macro1=Math.sin(x*0.012+z*0.007);
    const macro2=Math.cos(z*0.015-x*0.010);
    const micro=Math.sin(x*0.045+z*0.022);
    // Harmonização botânica: base rica com modulação orgânica sobre o mapa de grama
    let r=0.88+0.06*macro1+0.02*micro;
    let g=0.98+0.02*macro2+0.02*micro;
    let b=0.82+0.05*(macro1+macro2);
    // Variação orgânica de solo avermelhado típico do cerrado em encostas
    const earth=Math.max(0.0,Math.sin(x*0.009-z*0.013)*0.18);
    r+=earth*0.10;
    g-=earth*0.06;
    b-=earth*0.04;
    colors.push(r,g,b);
   }
   o.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
   o.material=detailedGround;
 });
 let visible=true,night=false;
 return {root,integral,lamps:allLamps,setNight(value){integralFinish?.setNight(value);night=Boolean(value);lampFace.emissiveIntensity=night?4.6:0;poolMaterial.uniforms.strength.value=night?.38:0;glow.visible=night&&visible;},setVisible(view,buildings){visible=view==='3d';root.visible=visible;street.visible=Boolean(buildings);trees.visible=Boolean(buildings);integral.setBuildings(Boolean(buildings));glow.visible=night&&visible;},diagnostics(){return {version:'cenario-integral-20260914-2',trees:entries.length,lamps:allLamps.length,integral:integral.diagnostics(),architecture:integralFinish?.diagnostics(),sourceTreeCount:D.trees.length,roadFinishVersion:ROAD03.version,paintTriangles:{parkingBays:D.surfaces.parkingBays.indices.length/3,curbs:ROAD03.surfaces.curbs.indices.length/3,roadEdges:ROAD03.surfaces.edges.indices.length/3,roadDashes:ROAD03.surfaces.dashes.indices.length/3},canopyTriangles:crownMesh.count*(crownMesh.geometry.index?.count||crownMesh.geometry.attributes.position.count)/3};}};
}
