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
 renderer.toneMappingExposure=1.04;
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.shadowMap.autoUpdate=false;
 const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:smallScreen?0:4});
 const composer=new EffectComposer(renderer,target);
 const beauty=new RenderPass(scene,camera);
 composer.addPass(beauty);
 const ao=new GTAOPass(scene,camera,1,1);
 ao.blendIntensity=.72;
 ao.updateGtaoMaterial({radius:7,thickness:2.5,distanceExponent:1.4,distanceFallOff:.6,scale:1,samples:12,screenSpaceRadius:false});
 ao.updatePdMaterial({radius:4,samples:8,rings:2});
 composer.addPass(ao);
 composer.addPass(new OutputPass());
 const sun=new T.DirectionalLight('#fff7ea',3.6);
 const sunOffset=new T.Vector3(-540,460,340);sun.position.copy(sunOffset);
 sun.castShadow=true;
 sun.shadow.mapSize.set(smallScreen?2048:4096,smallScreen?2048:4096);
 Object.assign(sun.shadow.camera,{left:-870,right:870,top:840,bottom:-840,near:1,far:2300});
 sun.shadow.bias=-.00012;sun.shadow.normalBias=.24;
 scene.add(sun,sun.target,new T.HemisphereLight('#c4e2f8','#48683a',.95));
 const sky=new Sky();sky.scale.setScalar(40000);sky.material.uniforms.turbidity.value=2.4;sky.material.uniforms.rayleigh.value=1.15;sky.material.uniforms.mieCoefficient.value=.0035;sky.material.uniforms.mieDirectionalG.value=.82;sky.material.uniforms.sunPosition.value.copy(sunOffset.clone().normalize());scene.add(sky);
 const atmosphere=new T.Fog('#c5dce7',1600,6000);
 scene.environmentIntensity=1.05;
 scene.background=new T.Color('#c5dce7');
 let environment=null,disposed=false;
 function setCamera(next){
  beauty.camera=next;ao.camera=next;
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
 return {renderer,loadEnvironment,setCamera,
  focusShadow(target,radius=850){const extent=T.MathUtils.clamp(radius,85,900);sun.target.position.copy(target);sun.position.copy(target).add(sunOffset);Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent});sun.shadow.camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;},
  resize(w,h){renderer.setSize(w,h,false);composer.setSize(w,h);},
  render(mode,overlay){
   // The photo and technical drawing retain their source colors.
   scene.background.set(mode==='3d'?'#c5dce7':mode==='plan'?'#eeeee9':'#27332c');sky.visible=mode==='3d';const distance=beauty.camera.position.distanceTo(sun.target.position);atmosphere.near=Math.max(1400,distance*1.12);atmosphere.far=Math.max(5000,distance+3800);scene.fog=mode==='3d'?atmosphere:null;
   const useAO=mode==='3d'&&!smallScreen&&renderer.extensions.has('EXT_color_buffer_float');
   if(useAO){ao.enabled=true;composer.render();}else renderer.render(scene,beauty.camera);
   if(overlay){renderer.autoClear=false;renderer.clearDepth();renderer.render(overlay,beauty.camera);renderer.autoClear=true;}
  },
  dispose(){disposed=true;environment?.dispose();ao.dispose();composer.dispose();renderer.dispose();}
 };
}
