import * as T from 'three';
import {EffectComposer} from './vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/addons/postprocessing/RenderPass.js';
import {GTAOPass} from './vendor/addons/postprocessing/GTAOPass.js';
import {OutputPass} from './vendor/addons/postprocessing/OutputPass.js';
import {Sky} from './vendor/addons/objects/Sky.js';
import {HDRLoader} from './vendor/addons/loaders/HDRLoader.js';
import {simulation} from './solar-model.js?v=cenario-solar-20260914-1';

// One local, version-matched pipeline. No runtime CDN or API key is required.
export function createRendering(scene,camera,smallScreen){
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,smallScreen?1.5:2));
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;
 renderer.toneMappingExposure=0.92;
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.shadowMap.autoUpdate=false;
 renderer.info.autoReset=false;
 const canAO=!smallScreen&&renderer.extensions.has('EXT_color_buffer_float');
 const target=canAO?new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:4}):null;
 const composer=canAO?new EffectComposer(renderer,target):null;
 const beauty=new RenderPass(scene,camera);
 composer?.addPass(beauty);
 const ao=canAO?new GTAOPass(scene,camera,1,1):null;
 if(ao){
 ao.blendIntensity=.65;
 ao.updateGtaoMaterial({radius:2.8,thickness:.55,distanceExponent:1.3,distanceFallOff:.5,scale:1,samples:14,screenSpaceRadius:false});
 ao.updatePdMaterial({radius:6,samples:10,rings:3});
 composer.addPass(ao);
 composer.addPass(new OutputPass());
 }
 const sun=new T.DirectionalLight('#fff8ee',2.55);
 let solar=simulation();const sunOffset=new T.Vector3(...solar.direction).multiplyScalar(1600);sun.position.copy(sunOffset);
 sun.castShadow=true;
 sun.shadow.radius=1.8;
 sun.shadow.mapSize.set(smallScreen?2048:4096,smallScreen?2048:4096);
 Object.assign(sun.shadow.camera,{left:-870,right:870,top:840,bottom:-840,near:1,far:5000});
 sun.shadow.bias=-.0001;sun.shadow.normalBias=.18;
 const hemisphere=new T.HemisphereLight('#9ec8ea','#3a4e2a',.72);scene.add(sun,sun.target,hemisphere);
 const sky=new Sky();sky.scale.setScalar(40000);sky.material.uniforms.turbidity.value=2.4;sky.material.uniforms.rayleigh.value=1.15;sky.material.uniforms.mieCoefficient.value=.0035;sky.material.uniforms.mieDirectionalG.value=.82;sky.material.uniforms.sunPosition.value.copy(sunOffset.clone().normalize());scene.add(sky);
 const atmosphere=new T.Fog('#a8c5d8',2500,9000);
 scene.environmentIntensity=0.95;
 scene.background=new T.Color('#a8c5d8');
 let environment=null,disposed=false,interacting=false,lastAO=false,activeNight=false,lightingKey='';
 const sources=[],spots=[];
 for(let i=0;i<(smallScreen?4:6);i++){const light=new T.SpotLight('#ffe5b8',0,58,.90,.65,2);light.castShadow=false;scene.add(light,light.target);spots.push(light);}
 // Noite sem um Sol falso abaixo do terreno; o céu permanece legível e discreto.
 const dusk=new T.Mesh(new T.SphereGeometry(1,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,toneMapped:false,uniforms:{top:{value:new T.Color('#071322')},horizon:{value:new T.Color('#27394a')}},vertexShader:'varying vec3 direction;void main(){direction=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position=p.xyww;}',fragmentShader:'uniform vec3 top;uniform vec3 horizon;varying vec3 direction;void main(){float h=clamp(normalize(direction).y,0.0,1.0);gl_FragColor=vec4(mix(horizon,top,smoothstep(0.0,0.65,h)),1.0);\n#include <colorspace_fragment>\n}'}));dusk.scale.setScalar(4000);dusk.frustumCulled=false;dusk.visible=false;dusk.name='Céu noturno';scene.add(dusk);
 function lighting(mode){
  const is3d=mode==='3d',night=is3d&&solar.elevation<-6,key=mode+solar.instant;
  if(key!==lightingKey){
   lightingKey=key;activeNight=night;const low=is3d&&solar.elevation<12;
   sunOffset.fromArray(is3d?solar.direction:[-.48,.8,.34]).normalize().multiplyScalar(1600);sun.position.copy(sun.target.position).add(sunOffset);
   sun.color.set(low?'#ffc076':'#fff5df');sun.intensity=is3d?solar.elevation<=-.833?0:low?Math.max(.2,1.35*Math.sin((solar.elevation+8)*Math.PI/70)):2.5:2.0;
   sun.castShadow=sun.intensity>0;
   hemisphere.color.set(night?'#9cbbdf':low?'#b6c9df':'#aecce0');hemisphere.groundColor.set(night?'#283b2c':'#617047');hemisphere.intensity=night?.26:low?.55:.8;
   scene.environmentIntensity=night?.16:low?.5:.85;renderer.toneMappingExposure=night?1.06:low?.93:.91;
   sky.material.uniforms.sunPosition.value.fromArray(solar.direction);sky.material.uniforms.turbidity.value=low?3.4:2.7;sky.material.uniforms.rayleigh.value=low?1.8:1.15;
   renderer.shadowMap.needsUpdate=true;
  }
  dusk.visible=night;dusk.position.copy(beauty.camera.position);
  const ordered=is3d&&solar.lightsOn?sources.map(s=>({s,d:beauty.camera.position.distanceToSquared(s.p)})).sort((a,b)=>a.d-b.d).slice(0,spots.length):[];
  spots.forEach((light,i)=>{const source=ordered[i]?.s;light.intensity=source?source.power:0;if(source){light.position.copy(source.p);light.target.position.copy(source.target);light.color.set(source.color);}});
 }

 function setCamera(next){
  beauty.camera=next;if(!ao)return;ao.camera=next;
  const perspective=next.isPerspectiveCamera?1:0;
  if(ao.gtaoMaterial.defines.PERSPECTIVE_CAMERA!==perspective){ao.gtaoMaterial.defines.PERSPECTIVE_CAMERA=perspective;ao.gtaoMaterial.needsUpdate=true;}
 }
 async function loadEnvironment(){
  const hdr=await new HDRLoader().loadAsync('./assets/materials/qwantani_noon_puresky_1k.hdr');
  if(disposed){hdr.dispose();return;}
  const pmrem=new T.PMREMGenerator(renderer);
  environment=pmrem.fromEquirectangular(hdr);scene.environment=environment.texture;
  hdr.dispose();pmrem.dispose();
 }
 return {renderer,loadEnvironment,setCamera,setLightSources(lamps){sources.splice(0);for(const l of lamps)sources.push({p:new T.Vector3(l.position[0]-620,l.height,l.position[1]-570),target:new T.Vector3(l.aim[0]-620,0,l.aim[1]-570),power:l.kind==='via'?95:135,color:l.kind==='via'?'#ffe5b8':'#e9efff'});},setSolar(state){solar=state;lightingKey='';},setLighting(value){solar=simulation(solar.date,value?'noite':'tarde');lightingKey='';},setInteracting(value){interacting=Boolean(value);},
  focusShadow(target,radius=850){const extent=T.MathUtils.clamp(radius,85,900);sun.target.position.copy(target);sun.position.copy(target).add(sunOffset);Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent});sun.shadow.camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;},
  resize(w,h){renderer.setSize(w,h,false);composer?.setSize(w,h);},
  render(mode,overlay){
   renderer.info.reset();lighting(mode);
   // A ortofoto mantém as próprias cores; a simulação pertence apenas ao 3D.
   scene.background.set(mode==='3d'?(activeNight?'#14243d':solar.elevation<12?'#d6b79c':'#b6cedc'):'#27332c');sky.visible=mode==='3d'&&!activeNight;const distance=beauty.camera.position.distanceTo(sun.target.position);atmosphere.color.set(activeNight?'#27394a':solar.elevation<12?'#d6b79c':'#a8c5d8');atmosphere.near=Math.max(4200,distance*1.6);atmosphere.far=Math.max(11500,distance+7000);scene.fog=mode==='3d'?atmosphere:null;
   // Durante gestos, usa a renderização direta. O acabamento retorna ao soltar.
   const useAO=mode==='3d'&&canAO&&!interacting&&!solar.lightsOn;lastAO=useAO;
   if(useAO){ao.enabled=true;composer.render();}else renderer.render(scene,beauty.camera);
   if(overlay){renderer.autoClear=false;renderer.clearDepth();renderer.render(overlay,beauty.camera);renderer.autoClear=true;}
  },
  diagnostics(){return {webgl:true,solar:{...solar},sunDirection:sunOffset.clone().normalize().toArray(),sunIntensity:sun.intensity,night:activeNight,localLights:spots.filter(s=>s.intensity>0).length,lightSources:sources.length,pixelRatio:renderer.getPixelRatio(),aoAvailable:canAO,aoActive:lastAO,exposure:renderer.toneMappingExposure,fog:scene.fog?{near:scene.fog.near,far:scene.fog.far}:null,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};},
  dispose(){disposed=true;environment?.dispose();ao?.dispose();composer?.dispose();renderer.dispose();}
 };
}
