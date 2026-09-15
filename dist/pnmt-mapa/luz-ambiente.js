import * as T from 'three';
/** Iluminação artística de apoio em textura compartilhada; não é cálculo luminotécnico.
 * Os postes próximos continuam recebendo luz dinâmica do renderizador.
 * A contribuição aqui alcança o parque inteiro, inclusive na vista aérea.
 */
export function createParkIllumination(root,lamps){
 const W=1024,H=1024,bounds=[50,0,1150,1140],rgb=new Float32Array(W*H*3),rgba=new Uint8Array(W*H*4),sources=[];
 const add=(x,z,r,strength,color)=>{if(!Number.isFinite(x+z+r))return;sources.push({x,z,r,strength,color});};
 for(const l of lamps){const p=l.aim||l.position;add(p[0],p[1],l.kind==='passeio'?8.8:l.kind==='fachada'?12:15,l.kind==='passeio'?.55:.8,l.kind==='via'?[1,.77,.46]:l.kind==='passeio'||l.kind==='fachada'?[1,.79,.5]:[.77,.88,1]);}
 root.updateMatrixWorld(true);
 const occupied=new Set();root.traverse(o=>{
  if(!o.isMesh||Array.isArray(o.material)||!o.geometry.attributes.position)return;const m=o.material;
  if(!m.userData.nightFinish&&!/vidro/.test(m.userData.integralSurface||''))return;
  const p=o.geometry.attributes.position,point=new T.Vector3();for(let i=0;i<p.count;i+=6){point.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(point.y<1||point.y>24)continue;const x=point.x+620,z=point.z+570,key=Math.floor(x/8)+':'+Math.floor(z/8);if(occupied.has(key))continue;occupied.add(key);add(x,z,9.5,.58,[1,.73,.43]);}
 });
 const sx=W/(bounds[2]-bounds[0]),sz=H/(bounds[3]-bounds[1]);
 for(const s of sources){
  const cx=(s.x-bounds[0])*sx,cz=(s.z-bounds[1])*sz,rx=s.r*sx,rz=s.r*sz;
  for(let y=Math.max(0,Math.floor(cz-rz));y<Math.min(H,Math.ceil(cz+rz));y++)for(let x=Math.max(0,Math.floor(cx-rx));x<Math.min(W,Math.ceil(cx+rx));x++){
   const d=Math.hypot((x+.5-cx)/rx,(y+.5-cz)/rz);if(d>=1)continue;const q=Math.pow(1-d,2.2)*s.strength,i=(y*W+x)*3;for(let c=0;c<3;c++)rgb[i+c]+=s.color[c]*q;
  }
 }
 for(let i=0;i<W*H;i++){for(let c=0;c<3;c++)rgba[i*4+c]=Math.round(255*Math.min(1.1,rgb[i*3+c])/1.1);rgba[i*4+3]=255;}
 const texture=new T.DataTexture(rgba,W,H);texture.colorSpace=T.NoColorSpace;texture.wrapS=texture.wrapT=T.ClampToEdgeWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearFilter;texture.needsUpdate=true;
 const night={value:0},map={value:texture},seen=new Set();
 root.traverse(o=>{
  if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
   if(!m?.isMeshStandardMaterial||seen.has(m))continue;seen.add(m);
   const before=m.onBeforeCompile,previousKey=m.customProgramCacheKey.bind(m);
   m.onBeforeCompile=function(shader,renderer){before.call(this,shader,renderer);shader.uniforms.uParkIllumination=map;shader.uniforms.uParkNight=night;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vParkWorld;').replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
vec4 parkPosition = vec4(transformed, 1.0);
#ifdef USE_BATCHING
parkPosition = batchingMatrix * parkPosition;
#endif
#ifdef USE_INSTANCING
parkPosition = instanceMatrix * parkPosition;
#endif
vParkWorld = (modelMatrix * parkPosition).xyz;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vParkWorld;\nuniform sampler2D uParkIllumination;\nuniform float uParkNight;').replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
vec2 parkUV = vec2((vParkWorld.x + 620.0 - 50.0) / 1100.0, (vParkWorld.z + 570.0) / 1140.0);
float parkInside = step(0.0, parkUV.x) * step(parkUV.x, 1.0) * step(0.0, parkUV.y) * step(parkUV.y, 1.0);
vec3 parkLight = texture2D(uParkIllumination, clamp(parkUV, 0.0, 1.0)).rgb;
float parkHeight = exp(-max(0.0, vParkWorld.y) / 18.0);
vec3 lampGlow = parkLight * (uParkNight * parkInside * parkHeight);
reflectedLight.indirectDiffuse += (diffuseColor.rgb * 1.25 + vec3(0.045, 0.038, 0.024)) * lampGlow;`);
   };
   m.customProgramCacheKey=()=>previousKey()+'|pnmt-park-light-v2';m.needsUpdate=true;
  }
 });
 return {texture,setNight(on){night.value=on?1:0;},diagnostics(){return {sources:sources.length,materials:seen.size,texture:[W,H],method:'iluminação artística distribuída + luzes locais'};}};
}
