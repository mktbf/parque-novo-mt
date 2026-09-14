import * as T from 'three';
import {EffectComposer} from './vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/addons/postprocessing/RenderPass.js';
import {GTAOPass} from './vendor/addons/postprocessing/GTAOPass.js';
import {OutputPass} from './vendor/addons/postprocessing/OutputPass.js';
import {Sky} from './vendor/addons/objects/Sky.js';
import {HDRLoader} from './vendor/addons/loaders/HDRLoader.js';

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
 const sunOffset=new T.Vector3(-560,520,380);sun.position.copy(sunOffset);
 sun.castShadow=true;
 sun.shadow.radius=1.8;
 sun.shadow.mapSize.set(smallScreen?2048:4096,smallScreen?2048:4096);
 Object.assign(sun.shadow.camera,{left:-870,right:870,top:840,bottom:-840,near:1,far:2500});
 sun.shadow.bias=-.0001;sun.shadow.normalBias=.18;
 const hemisphere=new T.HemisphereLight('#9ec8ea','#3a4e2a',.72);scene.add(sun,sun.target,hemisphere);
 const sky=new Sky();sky.scale.setScalar(40000);sky.material.uniforms.turbidity.value=2.4;sky.material.uniforms.rayleigh.value=1.15;sky.material.uniforms.mieCoefficient.value=.0035;sky.material.uniforms.mieDirectionalG.value=.82;sky.material.uniforms.sunPosition.value.copy(sunOffset.clone().normalize());scene.add(sky);
 const atmosphere=new T.Fog('#a8c5d8',2500,9000);
 scene.environmentIntensity=0.95;
 scene.background=new T.Color('#a8c5d8');
 let environment=null,disposed=false,interacting=false,lastAO=false,wantedNight=false,activeNight=false;
 const sources=[],spots=[];
 for(let i=0;i<4;i++){const light=new T.SpotLight('#e9efff',0,58,.90,.65,2);light.castShadow=false;scene.add(light,light.target);spots.push(light);}
 // Céu ilustrativo de entardecer. Não representa data, latitude solar ou lux de obra.
 const dusk=new T.Mesh(new T.SphereGeometry(1,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,toneMapped:false,uniforms:{top:{value:new T.Color('#101d38')},horizon:{value:new T.Color('#7a7881')},warm:{value:new T.Color('#b78763')}},vertexShader:'varying vec3 direction;void main(){direction=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position=p.xyww;}',fragmentShader:'uniform vec3 top;uniform vec3 horizon;uniform vec3 warm;varying vec3 direction;void main(){vec3 d=normalize(direction);float h=clamp(d.y,0.0,1.0);vec3 color=mix(horizon,top,smoothstep(0.0,0.55,h));color=mix(color,warm,pow(max(0.0,d.x),6.0)*exp(-h*18.0)*0.6);gl_FragColor=vec4(color,1.0);\n#include <colorspace_fragment>\n}'}));dusk.scale.setScalar(4000);dusk.frustumCulled=false;dusk.visible=false;dusk.name='Céu de entardecer ilustrativo';scene.add(dusk);
 function lighting(mode){
  const night=wantedNight&&mode==='3d';
  if(night!==activeNight){activeNight=night;sun.color.set(night?'#97b6da':'#fff8ee');sun.intensity=night?.16:2.55;hemisphere.intensity=night?.21:.72;scene.environmentIntensity=night?.14:.95;renderer.shadowMap.needsUpdate=true;}
  dusk.visible=night;dusk.position.copy(beauty.camera.position);
  const ordered=night?sources.map((s,i)=>({s,d:beauty.camera.position.distanceToSquared(s.p)})).sort((a,b)=>a.d-b.d).slice(0,spots.length):[];
  spots.forEach((light,i)=>{const source=ordered[i]?.s;light.intensity=source?135:0;if(source){light.position.copy(source.p);light.target.position.copy(source.target);}});
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
 return {renderer,loadEnvironment,setCamera,setLightSources(lamps){sources.splice(0);for(const l of lamps)sources.push({p:new T.Vector3(l.position[0]-620,l.height,l.position[1]-570),target:new T.Vector3(l.aim[0]-620,0,l.aim[1]-570)});},setLighting(value){wantedNight=Boolean(value);},setInteracting(value){interacting=Boolean(value);},
  focusShadow(target,radius=850){const extent=T.MathUtils.clamp(radius,85,900);sun.target.position.copy(target);sun.position.copy(target).add(sunOffset);Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent});sun.shadow.camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;},
  resize(w,h){renderer.setSize(w,h,false);composer?.setSize(w,h);},
  render(mode,overlay){
   renderer.info.reset();lighting(mode);
   // The photo and technical drawing retain their source colors.
   scene.background.set(mode==='3d'?(activeNight?'#14243d':'#b6cedc'):mode==='plan'?'#eeeee9':'#27332c');sky.visible=mode==='3d'&&!activeNight;const distance=beauty.camera.position.distanceTo(sun.target.position);atmosphere.color.set(activeNight?'#344257':'#a8c5d8');atmosphere.near=Math.max(3200,distance*1.25);atmosphere.far=Math.max(9500,distance+6000);scene.fog=mode==='3d'?atmosphere:null;
   // Durante gestos, usa a renderização direta. O acabamento retorna ao soltar.
   const useAO=mode==='3d'&&canAO&&!interacting;lastAO=useAO;
   if(useAO){ao.enabled=true;composer.render();}else renderer.render(scene,beauty.camera);
   if(overlay){renderer.autoClear=false;renderer.clearDepth();renderer.render(overlay,beauty.camera);renderer.autoClear=true;}
  },
  diagnostics(){return {webgl:true,night:activeNight,localLights:spots.filter(s=>s.intensity>0).length,lightSources:sources.length,pixelRatio:renderer.getPixelRatio(),aoAvailable:canAO,aoActive:lastAO,exposure:renderer.toneMappingExposure,fog:scene.fog?{near:scene.fog.near,far:scene.fog.far}:null,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};},
  dispose(){disposed=true;environment?.dispose();ao?.dispose();composer?.dispose();renderer.dispose();}
 };
}
