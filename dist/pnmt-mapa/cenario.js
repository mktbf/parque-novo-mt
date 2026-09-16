import {createRoadDetails,roadFinishData as ROAD03} from './vias-acabamento.js?v=vias-acabamento-20260915-4';
import {createCanopyGeometry,foliageUniforms} from './folhagem.js?v=gta-realismo-20260916-1';
import {createIntegralLandscape} from './cenario-integral.js?v=cenario-integral-20260914-2';
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
 const palette=['#3d653b','#516f3d','#5e753f','#315a3c','#687e48'],trunks=[],crowns=[];
 // Stable thinning keeps the same spatial distribution on small screens.
 const entries=integral.trees.filter((_,i)=>!smallScreen||i%2===0);
 for(const [x,z,h,r,c]of entries){
  trunks.push({p:[x,h*.32,z],s:[.18,h*.64,.18],color:c%2?'#68553f':'#594d3d'});
  crowns.push({p:[x,h*.74,z],s:[r,h*.37,r],a:c*.73+x,color:palette[c]});
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
   const r=0.62+0.12*macro1+0.04*micro;
   const g=0.76+0.10*macro2+0.05*micro;
   const b=0.48+0.08*(macro1+macro2);
   colors.push(r,g,b);
  }
  o.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  o.material=detailedGround;
 });
 let visible=true,night=false;
 return {root,integral,lamps:allLamps,setNight(value){integralFinish?.setNight(value);night=Boolean(value);lampFace.emissiveIntensity=night?4.6:0;poolMaterial.uniforms.strength.value=night?.38:0;glow.visible=night&&visible;},setVisible(view,buildings){visible=view==='3d';root.visible=visible;street.visible=Boolean(buildings);trees.visible=Boolean(buildings);integral.setBuildings(Boolean(buildings));glow.visible=night&&visible;},diagnostics(){return {version:'cenario-integral-20260914-2',trees:entries.length,lamps:allLamps.length,integral:integral.diagnostics(),architecture:integralFinish?.diagnostics(),sourceTreeCount:D.trees.length,roadFinishVersion:ROAD03.version,paintTriangles:{parkingBays:D.surfaces.parkingBays.indices.length/3,curbs:ROAD03.surfaces.curbs.indices.length/3,roadEdges:ROAD03.surfaces.edges.indices.length/3,roadDashes:ROAD03.surfaces.dashes.indices.length/3},canopyTriangles:crownMesh.count*(crownMesh.geometry.index?.count||crownMesh.geometry.attributes.position.count)/3};}};
}
