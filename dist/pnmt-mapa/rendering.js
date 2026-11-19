import * as T from 'three';
import {EffectComposer} from './vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/addons/postprocessing/RenderPass.js';
import {GTAOPass} from './vendor/addons/postprocessing/GTAOPass.js';
import {OutputPass} from './vendor/addons/postprocessing/OutputPass.js';
import {ShaderPass} from './vendor/addons/postprocessing/ShaderPass.js';
import {Sky} from './vendor/addons/objects/Sky.js';
import {HDRLoader} from './vendor/addons/loaders/HDRLoader.js';
import {simulation} from './solar-model.js?v=realismo-3d-20261118-1';
import {lakeShaderUniforms} from './estilo-realista.js?v=realismo-3d-20261118-1';

const CinematicShader={
 name:'CinematicShader',
 uniforms:{
  tDiffuse:{value:null},
  uResolution:{value:new T.Vector2(1920,1080)},
  uBloomIntensity:{value:0.24},
  uBloomThreshold:{value:0.78},
  uContrast:{value:1.05},
  uSaturation:{value:1.06},
  uVignetteIntensity:{value:0.16},
  uWarmth:{value:1.0}
 },
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uResolution;uniform float uBloomIntensity;uniform float uBloomThreshold;uniform float uContrast;uniform float uSaturation;uniform float uVignetteIntensity;uniform float uWarmth;varying vec2 vUv;
 void main(){
  vec4 base=texture2D(tDiffuse,vUv);
  vec3 color=base.rgb;
  vec2 texel=1.0/max(uResolution,vec2(1.0));
  vec3 bloom=vec3(0.0);
  vec2 offsets[12]=vec2[12](
   vec2(-1.2,-1.2),vec2(0.0,-1.8),vec2(1.2,-1.2),vec2(-1.8,0.0),
   vec2(1.8,0.0),vec2(-1.2,1.2),vec2(0.0,1.8),vec2(1.2,1.2),
   vec2(-2.8,-2.8),vec2(2.8,-2.8),vec2(-2.8,2.8),vec2(2.8,2.8)
  );
  for(int i=0;i<12;i++){
   float rScale=i<8?2.4:4.2;
   vec3 s=texture2D(tDiffuse,vUv+offsets[i]*texel*rScale).rgb;
   float lum=dot(s,vec3(0.2126,0.7152,0.0722));
   float glint=smoothstep(uBloomThreshold,uBloomThreshold+0.48,lum);
   bloom+=s*glint*(i<8?0.095:0.06);
  }
  color+=bloom*uBloomIntensity;
  color=max(vec3(0.0),color);
  color=pow(color,vec3(uContrast));
  float luma=dot(color,vec3(0.2126,0.7152,0.0722));
  color=mix(vec3(luma),color,uSaturation);
  color.r*=uWarmth;
  color.b*=(2.0-uWarmth);
  vec2 coord=(vUv-0.5)*vec2(uResolution.x/max(uResolution.y,1.0),1.0);
  float dist=length(coord);
  float vig=smoothstep(0.96,0.40,dist);
  color*=mix(1.0-uVignetteIntensity,1.0,vig);
  gl_FragColor=vec4(color,base.a);
 }`
};

// Cena sintética de estúdio arquitetônico para PMREMGenerator imediato (sem depender de rede)
function createStudioEnvScene(T){
 const envScene=new T.Scene();
 const boxGeo=new T.BoxGeometry(1,1,1);
 const room=new T.Mesh(new T.BoxGeometry(30,16,30),new T.MeshStandardMaterial({color:'#4c5c68',roughness:0.9,metalness:0.0,side:T.BackSide}));
 room.position.y=7;
 envScene.add(room);

 const mainLight=new T.PointLight('#fff9ee',35,40,1.5);
 mainLight.position.set(-8,12,6);
 envScene.add(mainLight);

 const panels=[
  {pos:[0,14.5,0],scale:[14,0.2,14],color:'#fffdf8',power:4.5},
  {pos:[-14,8,4],scale:[0.2,6,10],color:'#d8ecff',power:3.2},
  {pos:[14,7,-5],scale:[0.2,5,9],color:'#ffe4be',power:2.8},
  {pos:[0,8,-14],scale:[12,5,0.2],color:'#c9e2f8',power:2.6}
 ];
 for(const p of panels){
  const m=new T.Mesh(boxGeo,new T.MeshBasicMaterial({color:new T.Color(p.color).multiplyScalar(p.power)}));
  m.position.fromArray(p.pos);
  m.scale.fromArray(p.scale);
  envScene.add(m);
 }
 return envScene;
}

export function createRendering(scene,camera,smallScreen){
 const renderer=new T.WebGLRenderer({antialias:!smallScreen,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,smallScreen?1.25:2));
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;
 renderer.toneMappingExposure=0.96;
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.shadowMap.autoUpdate=true;
 renderer.info.autoReset=false;

 // PMREMGenerator inicial imediato (RoomEnvironment arquitetônico)
 const pmremGen=new T.PMREMGenerator(renderer);
 pmremGen.compileCubemapShader();
 const studioEnvScene=createStudioEnvScene(T);
 let environment=pmremGen.fromScene(studioEnvScene,0.04);
 scene.environment=environment.texture;
 pmremGen.dispose();

 const canFloat=renderer.extensions.has('EXT_color_buffer_float');
 const canAO=!smallScreen&&canFloat;
 const target=canFloat?new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:smallScreen?0:4}):null;
 const composer=new EffectComposer(renderer,target||undefined);
 const beauty=new RenderPass(scene,camera);
 composer.addPass(beauty);
 const ao=canAO?new GTAOPass(scene,camera,1,1):null;
 if(ao){
  ao.blendIntensity=.58;
  ao.updateGtaoMaterial({radius:3.0,thickness:.58,distanceExponent:1.35,distanceFallOff:.55,scale:1,samples:14,screenSpaceRadius:false});
  ao.updatePdMaterial({radius:5,samples:8,rings:3});
  composer.addPass(ao);
 }
 const cinematicPass=new ShaderPass(CinematicShader);
 composer.addPass(cinematicPass);
 composer.addPass(new OutputPass());

 const sun=new T.DirectionalLight('#fff8ee',2.6);
 let solar=simulation();
 const sunOffset=new T.Vector3(...solar.direction).multiplyScalar(1600);
 sun.position.copy(sunOffset);
 sun.castShadow=true;
 sun.shadow.radius=smallScreen?1.2:2.0;
 const shadowRes=smallScreen?1024:4096;
 sun.shadow.mapSize.set(shadowRes,shadowRes);
 Object.assign(sun.shadow.camera,{left:-870,right:870,top:840,bottom:-840,near:1,far:5000});
 sun.shadow.bias=-.00015;
 sun.shadow.normalBias=.16;

 const hemisphere=new T.HemisphereLight('#b2d6f4','#4a6335',.84);
 scene.add(sun,sun.target,hemisphere);

 const sky=new Sky();
 sky.scale.setScalar(40000);
 sky.material.uniforms.turbidity.value=2.4;
 sky.material.uniforms.rayleigh.value=1.15;
 sky.material.uniforms.mieCoefficient.value=.0035;
 sky.material.uniforms.mieDirectionalG.value=.82;
 sky.material.uniforms.sunPosition.value.copy(sunOffset.clone().normalize());
 scene.add(sky);

 const atmosphere=new T.Fog('#a8c5d8',2200,8800);
 scene.environmentIntensity=0.92;
 scene.background=new T.Color('#a8c5d8');

 let disposed=false,interacting=false,lastAO=false,activeNight=false,lightingKey='';
 const sources=[],spots=[];
 for(let i=0;i<(smallScreen?4:8);i++){
  const light=new T.SpotLight('#ffe5b8',0,72,.95,.65,1.8);
  light.castShadow=false;
  scene.add(light,light.target);
  spots.push(light);
 }

 // Garante inicialização imediata dos objetos Color do ShaderMaterial do lago
 if(!lakeShaderUniforms.uSunDir.value)lakeShaderUniforms.uSunDir.value=new T.Vector3(-0.48,0.78,0.36).normalize();
 if(!lakeShaderUniforms.uSunColor.value)lakeShaderUniforms.uSunColor.value=new T.Color('#fffaf0');
 if(!lakeShaderUniforms.uSkyZenith.value)lakeShaderUniforms.uSkyZenith.value=new T.Color('#2466a8');
 if(!lakeShaderUniforms.uSkyHorizon.value)lakeShaderUniforms.uSkyHorizon.value=new T.Color('#a4cce8');
 if(!lakeShaderUniforms.uDeepColor.value)lakeShaderUniforms.uDeepColor.value=new T.Color('#0c3e52');
 if(!lakeShaderUniforms.uShallowColor.value)lakeShaderUniforms.uShallowColor.value=new T.Color('#2e8e8e');
 if(!lakeShaderUniforms.uFogColor.value)lakeShaderUniforms.uFogColor.value=new T.Color('#b6d4ec');

 // Domo atmosférico por período (Manhã azul cristalino, Tarde golden hour alaranjada, Noite azul-marinho profundo)
 const dusk=new T.Mesh(
  new T.SphereGeometry(1,32,16),
  new T.ShaderMaterial({
   side:T.BackSide,
   depthWrite:false,
   toneMapped:false,
   uniforms:{
    top:{value:new T.Color('#1e5fa8')},
    mid:{value:new T.Color('#5a9bd8')},
    horizon:{value:new T.Color('#c2dff5')},
    sunDir:{value:new T.Vector3(-0.48,0.78,0.36).normalize()},
    sunGlow:{value:new T.Color('#fff6e0')},
    sunStrength:{value:0.35}
   },
   vertexShader:'varying vec3 direction;void main(){direction=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position=p.xyww;}',
   fragmentShader:'uniform vec3 top;uniform vec3 mid;uniform vec3 horizon;uniform vec3 sunDir;uniform vec3 sunGlow;uniform float sunStrength;varying vec3 direction;void main(){vec3 d=normalize(direction);float h=clamp(d.y,0.0,1.0);vec3 col=mix(horizon,mid,smoothstep(0.0,0.22,h));col=mix(col,top,smoothstep(0.18,0.75,h));float sDot=max(dot(d,normalize(sunDir)),0.0);col+=sunGlow*(pow(sDot,18.0)*0.35+pow(sDot,160.0)*0.85)*sunStrength;gl_FragColor=vec4(col,1.0);\n#include <colorspace_fragment>\n}'
  })
 );
 dusk.scale.setScalar(4500);
 dusk.frustumCulled=false;
 dusk.visible=true;
 dusk.name='Céu atmosférico por período';
 scene.add(dusk);

 function updateExtraNightLamps(isNight){
  scene.traverse(o=>{
   if(!o.isMesh||!o.material)return;
   const m=o.material;
   if(m.userData?.nightLamp){
    m.emissiveIntensity=isNight?4.8:0;
   }
  });
 }

 function lighting(mode){
  const is3d=mode==='3d';
  const period=solar.period||'tarde';
  const night=is3d&&(period==='noite'||solar.elevation<-6);
  const goldenHour=is3d&&!night&&(period==='tarde'||period==='por-do-sol'||solar.elevation<18);
  const key=mode+'|'+period+'|'+solar.instant;

  if(key!==lightingKey){
   lightingKey=key;
   activeNight=night;

   if(night){
    // Noite: céu azul-marinho profundo, luar suave de leitura arquitetônica e todos os postes acesos
    sunOffset.set(-0.38,0.68,-0.32).normalize().multiplyScalar(1600);
    sun.position.copy(sun.target.position).add(sunOffset);
    sun.color.set('#6e96cc');
    sun.intensity=0.44;
    sun.castShadow=false;
    hemisphere.color.set('#5a82b8');
    hemisphere.groundColor.set('#1c2c42');
    hemisphere.intensity=0.76;
    scene.environmentIntensity=0.36;
    renderer.toneMappingExposure=1.16;
   }else if(goldenHour){
    // Tarde / Golden Hour: luz alaranjada quente, sol baixo no oeste e sombras longas dramáticas
    const dir=solar.direction.slice();
    // Garante ângulo baixo para sombras longas mesmo em variações sazonais
    dir[1]=Math.max(0.16,Math.min(0.28,dir[1]));
    sunOffset.fromArray(dir).normalize().multiplyScalar(1600);
    sun.position.copy(sun.target.position).add(sunOffset);
    sun.color.set('#ff9e40');
    sun.intensity=2.55;
    sun.castShadow=true;
    hemisphere.color.set('#ffc896');
    hemisphere.groundColor.set('#6e5236');
    hemisphere.intensity=0.78;
    scene.environmentIntensity=0.75;
    renderer.toneMappingExposure=1.02;
    sky.material.uniforms.sunPosition.value.copy(sunOffset.clone().normalize());
    sky.material.uniforms.turbidity.value=7.8;
    sky.material.uniforms.rayleigh.value=2.65;
    sky.material.uniforms.mieCoefficient.value=.0075;
    sky.material.uniforms.mieDirectionalG.value=.88;
   }else{
    // Manhã: luz clara cristalina, céu azul límpido e sombras nítidas suaves
    sunOffset.fromArray(is3d?solar.direction:[-.48,.8,.34]).normalize().multiplyScalar(1600);
    sun.position.copy(sun.target.position).add(sunOffset);
    sun.color.set('#fffaf0');
    sun.intensity=is3d?2.75:2.1;
    sun.castShadow=true;
    hemisphere.color.set('#b8dcf8');
    hemisphere.groundColor.set('#526e40');
    hemisphere.intensity=0.92;
    scene.environmentIntensity=0.95;
    renderer.toneMappingExposure=0.98;
    sky.material.uniforms.sunPosition.value.copy(sunOffset.clone().normalize());
    sky.material.uniforms.turbidity.value=2.1;
    sky.material.uniforms.rayleigh.value=1.05;
    sky.material.uniforms.mieCoefficient.value=.0032;
    sky.material.uniforms.mieDirectionalG.value=.80;
   }

   updateExtraNightLamps(night);

   // Atualiza uniforms do ShaderMaterial da água do lago conforme o período
   if(lakeShaderUniforms.uSunDir?.value){
    lakeShaderUniforms.uSunDir.value.copy(sunOffset).normalize();
   }
   if(lakeShaderUniforms.uSunColor?.value){
    lakeShaderUniforms.uSunColor.value.set(night?'#90b8ec':goldenHour?'#ffae52':'#fffaf0');
    lakeShaderUniforms.uSkyZenith.value.set(night?'#061326':goldenHour?'#2c527d':'#2466a8');
    lakeShaderUniforms.uSkyHorizon.value.set(night?'#163056':goldenHour?'#eb964a':'#a4cce8');
    lakeShaderUniforms.uDeepColor.value.set(night?'#06182c':goldenHour?'#12384a':'#0c3e52');
    lakeShaderUniforms.uShallowColor.value.set(night?'#133a4e':goldenHour?'#3c847c':'#2e8e8e');
    lakeShaderUniforms.uFogColor.value.set(night?'#0d203b':goldenHour?'#dca06a':'#b6d4ec');
   }

   renderer.shadowMap.needsUpdate=true;
   if(cinematicPass){
    cinematicPass.uniforms.uWarmth.value=night?0.95:goldenHour?1.08:1.0;
    cinematicPass.uniforms.uBloomIntensity.value=smallScreen?(night?0.28:0.08):(night?0.52:goldenHour?0.28:0.16);
    cinematicPass.uniforms.uBloomThreshold.value=night?0.56:goldenHour?0.78:0.86;
    cinematicPass.uniforms.uContrast.value=night?1.08:goldenHour?1.07:1.05;
   }
  }

  const du=dusk.material.uniforms;
  du.top.value.set(night?'#040d1a':goldenHour?'#1d3861':'#2264ab');
  du.mid.value.set(night?'#0b1f3a':goldenHour?'#9e5e3f':'#5c9ed8');
  du.horizon.value.set(night?'#153156':goldenHour?'#f08e3e':'#badbf2');
  du.sunDir.value.copy(sunOffset).normalize();
  du.sunGlow.value.set(night?'#6e96cc':goldenHour?'#ff9838':'#fff8e6');
  du.sunStrength.value=night?0.12:goldenHour?0.95:0.42;
  dusk.visible=is3d;
  dusk.position.copy(beauty.camera.position);
  const lightsActive=is3d&&(night||solar.lightsOn);
  const ordered=lightsActive?sources.map(s=>({s,d:sun.target.position.distanceToSquared(s.p)})).sort((a,b)=>a.d-b.d).slice(0,spots.length):[];
  spots.forEach((light,i)=>{
   const source=ordered[i]?.s;
   light.intensity=source?source.power:0;
   if(source){
    light.position.copy(source.p);
    light.target.position.copy(source.target);
    light.color.set(source.color);
   }
  });
 }

 function setCamera(next){
  beauty.camera=next;
  if(!ao)return;
  ao.camera=next;
  const perspective=next.isPerspectiveCamera?1:0;
  if(ao.gtaoMaterial.defines.PERSPECTIVE_CAMERA!==perspective){
   ao.gtaoMaterial.defines.PERSPECTIVE_CAMERA=perspective;
   ao.gtaoMaterial.needsUpdate=true;
  }
 }

 async function loadEnvironment(){
  try{
   const hdr=await new HDRLoader().loadAsync('./assets/materials/qwantani_noon_puresky_1k.hdr');
   if(disposed){hdr.dispose();return;}
   const pmrem=new T.PMREMGenerator(renderer);
   const nextEnv=pmrem.fromEquirectangular(hdr);
   environment?.dispose();
   environment=nextEnv;
   scene.environment=environment.texture;
   hdr.dispose();
   pmrem.dispose();
  }catch{
   // Mantém o RoomEnvironment procedural já gerado no startup
  }
 }

 return {
  renderer,
  loadEnvironment,
  setCamera,
  setLightSources(lamps){
   sources.splice(0);
   for(const l of lamps){
    sources.push({
     p:new T.Vector3(l.position[0]-620,l.height,l.position[1]-570),
     target:new T.Vector3(l.aim[0]-620,0,l.aim[1]-570),
     power:l.power||(l.kind==='via'?155:l.kind==='passeio'?105:185),
     color:l.color||(l.kind==='via'?'#ffe5b8':'#e9efff')
    });
   }
  },
  setSolar(state){solar=state;lightingKey='';},
  setLighting(value){solar=simulation(solar.date,value?'noite':'tarde');lightingKey='';},
  setInteracting(value){interacting=Boolean(value);},
  focusShadow(targetPos,radius=850){
   const extent=T.MathUtils.clamp(radius,85,900);
   sun.target.position.copy(targetPos);
   sun.position.copy(targetPos).add(sunOffset);
   Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent});
   sun.shadow.camera.updateProjectionMatrix();
   renderer.shadowMap.needsUpdate=true;
  },
  resize(w,h){
   renderer.setSize(w,h,false);
   composer?.setSize(w,h);
   if(cinematicPass)cinematicPass.uniforms.uResolution.value.set(w,h);
  },
  render(mode,overlay){
   renderer.info.reset();
   lighting(mode);
   const isGolden=mode==='3d'&&!activeNight&&(solar.period==='tarde'||solar.period==='por-do-sol'||solar.elevation<18);
   const bgCol=mode==='3d'?(activeNight?'#0a192f':isGolden?'#d89256':'#9ec6e6'):'#27332c';
   scene.background.set(bgCol);
   sky.visible=false;
   const distance=beauty.camera.position.distanceTo(sun.target.position);
   atmosphere.color.set(activeNight?'#0d203b':isGolden?'#dca06a':'#b6d4ec');
   atmosphere.near=Math.max(1800,distance*1.3);
   atmosphere.far=Math.max(7500,distance*3.4+3500);
   scene.fog=mode==='3d'?atmosphere:null;

   if(mode==='3d'){
    if(ao){
     ao.enabled=!smallScreen;
     ao.blendIntensity=activeNight?.28:interacting?.38:.48;
     lastAO=ao.enabled;
    }
    composer.render();
   }else{
    renderer.render(scene,beauty.camera);
   }
   if(overlay){
    renderer.autoClear=false;
    renderer.clearDepth();
    renderer.render(overlay,beauty.camera);
    renderer.autoClear=true;
   }
  },
  diagnostics(){
   return {
    webgl:true,
    solar:{...solar},
    sunDirection:sunOffset.clone().normalize().toArray(),
    sunIntensity:sun.intensity,
    night:activeNight,
    localLights:spots.filter(s=>s.intensity>0).length,
    lightSources:sources.length,
    pixelRatio:renderer.getPixelRatio(),
    aoAvailable:canAO,
    aoActive:lastAO,
    exposure:renderer.toneMappingExposure,
    fog:scene.fog?{near:scene.fog.near,far:scene.fog.far}:null,
    drawCalls:renderer.info.render.calls,
    triangles:renderer.info.render.triangles
   };
  },
  dispose(){
   disposed=true;
   environment?.dispose();
   ao?.dispose();
   composer?.dispose();
   renderer.dispose();
  }
 };
}
