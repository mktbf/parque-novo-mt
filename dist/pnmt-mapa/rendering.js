import * as T from 'three';
import {EffectComposer} from './vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/addons/postprocessing/RenderPass.js';
import {GTAOPass} from './vendor/addons/postprocessing/GTAOPass.js';
import {OutputPass} from './vendor/addons/postprocessing/OutputPass.js';
import {ShaderPass} from './vendor/addons/postprocessing/ShaderPass.js';
import {Sky} from './vendor/addons/objects/Sky.js';
import {HDRLoader} from './vendor/addons/loaders/HDRLoader.js';
import {simulation,localInstant,solarPosition,sunDirection} from './solar-model.js?v=realismo-3d-20261119-2';
import {lakeShaderUniforms} from './estilo-realista.js?v=leve-20261119-3';

const CinematicShader={
 name:'CinematicShader',
 uniforms:{
  tDiffuse:{value:null},
  uResolution:{value:new T.Vector2(1920,1080)},
  uBloomIntensity:{value:0.18},
  uBloomThreshold:{value:0.86},
  uSharpen:{value:0.16},
  uSaturation:{value:1.04},
  uVignetteIntensity:{value:0.10},
  uWarmth:{value:1.0},
  uSmallScreen:{value:0.0}
 },
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uResolution;uniform float uBloomIntensity;uniform float uBloomThreshold;uniform float uSharpen;uniform float uSaturation;uniform float uVignetteIntensity;uniform float uWarmth;uniform float uSmallScreen;varying vec2 vUv;
 void main(){
  vec4 base=texture2D(tDiffuse,vUv);
  vec3 color=max(base.rgb,vec3(0.0));
  vec2 texel=1.0/max(uResolution,vec2(1.0));

  // Micro-nitidez adaptativa (CAS leve) apenas em desktop para definir guias, brises e folhagem
  if(uSmallScreen<0.5 && uSharpen>0.001){
   vec3 n=texture2D(tDiffuse,vUv+vec2(0.0,-texel.y)).rgb;
   vec3 s=texture2D(tDiffuse,vUv+vec2(0.0,texel.y)).rgb;
   vec3 e=texture2D(tDiffuse,vUv+vec2(texel.x,0.0)).rgb;
   vec3 w=texture2D(tDiffuse,vUv+vec2(-texel.x,0.0)).rgb;
   vec3 avg=0.25*(n+s+e+w);
   vec3 detail=color-avg;
   float lumaEdge=abs(dot(detail,vec3(0.2126,0.7152,0.0722)));
   float weight=uSharpen*(1.0-smoothstep(0.08,0.45,lumaEdge));
   color=max(vec3(0.0),color+detail*weight);
  }

  // Bloom suave em espaço linear HDR (4 amostras leves no celular, 12 em dois raios no desktop)
  if(uBloomIntensity>0.001){
   vec3 bloom=vec3(0.0);
   if(uSmallScreen>0.5){
    vec2 mOff[4]=vec2[4](vec2(-1.4,-1.4),vec2(1.4,-1.4),vec2(-1.4,1.4),vec2(1.4,1.4));
    for(int i=0;i<4;i++){
     vec3 sc=texture2D(tDiffuse,vUv+mOff[i]*texel*2.0).rgb;
     float lum=dot(sc,vec3(0.2126,0.7152,0.0722));
     float glint=smoothstep(uBloomThreshold,uBloomThreshold+0.55,lum);
     bloom+=sc*glint*0.25;
    }
   }else{
    vec2 offsets[12]=vec2[12](
     vec2(-1.1,-1.1),vec2(0.0,-1.7),vec2(1.1,-1.1),vec2(-1.7,0.0),
     vec2(1.7,0.0),vec2(-1.1,1.1),vec2(0.0,1.7),vec2(1.1,1.1),
     vec2(-2.9,-2.9),vec2(2.9,-2.9),vec2(-2.9,2.9),vec2(2.9,2.9)
    );
    for(int i=0;i<12;i++){
     float rScale=i<8?2.1:4.4;
     vec3 sc=texture2D(tDiffuse,vUv+offsets[i]*texel*rScale).rgb;
     float lum=dot(sc,vec3(0.2126,0.7152,0.0722));
     float glint=smoothstep(uBloomThreshold,uBloomThreshold+0.52,lum);
     bloom+=sc*glint*(i<8?0.092:0.066);
    }
   }
   color+=bloom*uBloomIntensity;
  }

  // Balanço cromático sutil antes do ACESFilmicToneMapping (sem pow destrutivo nos pretos)
  color.r*=uWarmth;
  color.b*=(2.0-uWarmth);
  float luma=dot(color,vec3(0.2126,0.7152,0.0722));
  color=max(vec3(0.0),mix(vec3(luma),color,uSaturation));

  vec2 coord=(vUv-0.5)*vec2(uResolution.x/max(uResolution.y,1.0),1.0);
  float dist=length(coord);
  float vig=smoothstep(1.02,0.42,dist);
  color*=mix(1.0-uVignetteIntensity,1.0,vig);

  gl_FragColor=vec4(color,base.a);
 }`
};

// Cena sintética inicial para reflexos imediatos antes do HDRI ou PMREM atmosférico
function createStudioEnvScene(){
 const envScene=new T.Scene();
 const boxGeo=new T.BoxGeometry(1,1,1);
 const room=new T.Mesh(
  new T.BoxGeometry(30,16,30),
  new T.MeshStandardMaterial({color:'#566876',roughness:0.9,metalness:0.0,side:T.BackSide})
 );
 room.position.y=7;
 envScene.add(room);

 const mainLight=new T.PointLight('#fffaf0',34,42,1.5);
 mainLight.position.set(-8,12,6);
 envScene.add(mainLight);

 const panels=[
  {pos:[0,14.5,0],scale:[14,0.2,14],color:'#fffef9',power:4.4},
  {pos:[-14,8,4],scale:[0.2,6,10],color:'#d8ecff',power:3.2},
  {pos:[14,7,-5],scale:[0.2,5,9],color:'#ffe7c4',power:2.6},
  {pos:[0,8,-14],scale:[12,5,0.2],color:'#cae3f8',power:2.6}
 ];
 for(const p of panels){
  const m=new T.Mesh(boxGeo,new T.MeshBasicMaterial({color:new T.Color(p.color).multiplyScalar(p.power)}));
  m.position.fromArray(p.pos);
  m.scale.fromArray(p.scale);
  envScene.add(m);
 }
 return envScene;
}

// Gera cena atmosférica dedicada por período para PMREM (reflexos coerentes no pôr do sol, tarde e noite)
function buildAtmosphericEnvScene(kind,sunDir){
 const envScene=new T.Scene();
 if(kind==='noite'){
  const dome=new T.Mesh(
   new T.SphereGeometry(40,24,16),
   new T.ShaderMaterial({
    side:T.BackSide,
    uniforms:{
     uTop:{value:new T.Color('#050e1d')},
     uMid:{value:new T.Color('#0d2240')},
     uHor:{value:new T.Color('#19365c')},
     uGround:{value:new T.Color('#09111a')}
    },
    vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 uTop;uniform vec3 uMid;uniform vec3 uHor;uniform vec3 uGround;varying vec3 vP;void main(){vec3 c=vP.y<0.0?mix(uHor*0.45,uGround,clamp(-vP.y*3.0,0.0,1.0)):mix(mix(uHor,uMid,smoothstep(0.0,0.25,vP.y)),uTop,smoothstep(0.22,0.85,vP.y));gl_FragColor=vec4(c,1.0);}'
   })
  );
  envScene.add(dome);
  // Pequenos acentos quentes distantes simulando brilho urbano/parque nos vidros à noite
  const glowGeo=new T.BoxGeometry(3.5,0.8,0.4);
  const warmGlow=new T.MeshBasicMaterial({color:new T.Color('#ffb86b').multiplyScalar(1.35)});
  const coolGlow=new T.MeshBasicMaterial({color:new T.Color('#7eb0ef').multiplyScalar(0.95)});
  for(let i=0;i<6;i++){
   const a=(i/6)*Math.PI*2;
   const p=new T.Mesh(glowGeo,i%2===0?warmGlow:coolGlow);
   p.position.set(Math.cos(a)*26,1.2+(i%2)*1.4,Math.sin(a)*26);
   p.lookAt(0,1.5,0);
   envScene.add(p);
  }
  return envScene;
 }

 const envSky=new Sky();
 envSky.scale.setScalar(120);
 const u=envSky.material.uniforms;
 if(kind==='por-do-sol'){
  u.turbidity.value=8.4;
  u.rayleigh.value=2.85;
  u.mieCoefficient.value=0.0085;
  u.mieDirectionalG.value=0.88;
 }else if(kind==='tarde'){
  u.turbidity.value=3.2;
  u.rayleigh.value=1.45;
  u.mieCoefficient.value=0.0045;
  u.mieDirectionalG.value=0.82;
 }else{
  u.turbidity.value=2.1;
  u.rayleigh.value=1.08;
  u.mieCoefficient.value=0.0032;
  u.mieDirectionalG.value=0.80;
 }
 u.sunPosition.value.copy(sunDir);
 envScene.add(envSky);

 // Hemisfério inferior representando o rebote difuso do gramado/solo do Cerrado
 const groundBounce=new T.Mesh(
  new T.SphereGeometry(38,20,10,0,Math.PI*2,Math.PI*0.5,Math.PI*0.5),
  new T.MeshBasicMaterial({
   color:kind==='por-do-sol'?'#4a3726':kind==='tarde'?'#3b522c':'#39542d',
   side:T.BackSide
  })
 );
 envScene.add(groundBounce);
 return envScene;
}

// Em 'tarde', garante posição solar real das 15:00 locais de Cuiabá (sol alto da tarde, sem golden hour)
function resolveAfternoon15h(day,fallbackDir){
 try{
  const inst15=localInstant(day,15,0);
  const pos=solarPosition(inst15);
  return {
   direction:sunDirection(pos.azimuth,pos.apparentElevation),
   elevation:pos.apparentElevation
  };
 }catch{
  const d=(fallbackDir||[-0.72,0.62,0.31]).slice();
  d[1]=Math.max(0.58,d[1]);
  return {direction:d,elevation:42};
 }
}

export function createRendering(scene,camera,smallScreen){
 const renderer=new T.WebGLRenderer({
  antialias:!smallScreen,
  alpha:false,
  powerPreference:'high-performance'
 });
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,smallScreen?1.1:1.5));
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;
 renderer.toneMappingExposure=0.98;
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.shadowMap.autoUpdate=true;
 renderer.info.autoReset=false;

 // Cache de PMREM por período (evita reflexo de meio-dia no pôr do sol e à noite)
 const envCache=new Map();
 let hdrDayEnv=null;
 {
  const pmremGen=new T.PMREMGenerator(renderer);
  pmremGen.compileCubemapShader();
  const studioScene=createStudioEnvScene();
  const fallbackEnv=pmremGen.fromScene(studioScene,0.04);
  envCache.set('fallback',fallbackEnv);
  scene.environment=fallbackEnv.texture;
  pmremGen.dispose();
 }

 function getOrBuildPeriodEnv(periodKey,sunDirVec){
  if(periodKey==='manha'&&hdrDayEnv)return hdrDayEnv.texture;
  if(envCache.has(periodKey))return envCache.get(periodKey).texture;
  try{
   const pmrem=new T.PMREMGenerator(renderer);
   pmrem.compileCubemapShader();
   const envScene=buildAtmosphericEnvScene(periodKey,sunDirVec);
   const rt=pmrem.fromScene(envScene,0.035);
   envScene.traverse(o=>{
    o.geometry?.dispose?.();
    if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());
    else o.material?.dispose?.();
   });
   pmrem.dispose();
   envCache.set(periodKey,rt);
   return rt.texture;
  }catch{
   return (hdrDayEnv||envCache.get('fallback'))?.texture||null;
  }
 }

 const canFloat=renderer.extensions.has('EXT_color_buffer_float');
 const canAO=false;
 const target=canFloat
  ?new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:smallScreen?0:4})
  :null;
 const composer=new EffectComposer(renderer,target||undefined);
 const beauty=new RenderPass(scene,camera);
 composer.addPass(beauty);

 const ao=canAO?new GTAOPass(scene,camera,1,1):null;
 if(ao){
  ao.blendIntensity=0.52;
  ao.updateGtaoMaterial({
   radius:2.8,
   thickness:0.55,
   distanceExponent:1.35,
   distanceFallOff:0.55,
   scale:1,
   samples:8,
   screenSpaceRadius:false
  });
  ao.updatePdMaterial({radius:5,samples:8,rings:3});
  composer.addPass(ao);
 }

 const cinematicPass=new ShaderPass(CinematicShader);
 cinematicPass.uniforms.uSmallScreen.value=smallScreen?1.0:0.0;
 composer.addPass(cinematicPass);
 composer.addPass(new OutputPass());

 const sun=new T.DirectionalLight('#fff8ee',2.7);
 let solar=simulation();
 const sunOffset=new T.Vector3(...solar.direction).multiplyScalar(1600);
 sun.position.copy(sunOffset);
 sun.castShadow=true;
 // No celular reduz resolução e raio do filtro de sombra para fluidez constante
 sun.shadow.radius=smallScreen?1.0:1.85;
 const shadowRes=smallScreen?1024:2048;
 sun.shadow.mapSize.set(shadowRes,shadowRes);
 Object.assign(sun.shadow.camera,{
  left:-870,
  right:870,
  top:840,
  bottom:-840,
  near:220,
  far:3400
 });
 sun.shadow.bias=smallScreen?-0.00028:-0.00012;
 sun.shadow.normalBias=smallScreen?0.14:0.095;

 const hemisphere=new T.HemisphereLight('#b6daf6','#4c6638',0.86);
 scene.add(sun,sun.target,hemisphere);

 // Céu físico Rayleigh/Mie ativo para manhã, tarde (15h) e pôr do sol
 const sky=new Sky();
 sky.name='Céu físico Rayleigh-Mie';
 sky.scale.setScalar(40000);
 sky.frustumCulled=false;
 sky.material.uniforms.turbidity.value=2.4;
 sky.material.uniforms.rayleigh.value=1.15;
 sky.material.uniforms.mieCoefficient.value=0.0035;
 sky.material.uniforms.mieDirectionalG.value=0.82;
 sky.material.uniforms.sunPosition.value.copy(sunOffset.clone().normalize());
 scene.add(sky);

 const atmosphere=new T.Fog('#b2cfe6',2100,8600);
 scene.environmentIntensity=0.92;
 scene.background=new T.Color('#a8c5d8');

 let disposed=false,interacting=false,lastAO=false,activeNight=false,activeSunset=false,activeAfternoon=false,lightingKey='';
 const sources=[],spots=[];
 for(let i=0;i<0;i++){
  const light=new T.SpotLight('#ffe5b8',0,74,0.95,0.65,1.8);
  light.castShadow=false;
  scene.add(light,light.target);
  spots.push(light);
 }

 // Inicialização garantida dos uniforms de cor compartilhados com o lago
 if(!lakeShaderUniforms.uSunDir.value)lakeShaderUniforms.uSunDir.value=new T.Vector3(-0.48,0.78,0.36).normalize();
 if(!lakeShaderUniforms.uSunColor.value)lakeShaderUniforms.uSunColor.value=new T.Color('#fffaf0');
 if(!lakeShaderUniforms.uSkyZenith.value)lakeShaderUniforms.uSkyZenith.value=new T.Color('#2466a8');
 if(!lakeShaderUniforms.uSkyHorizon.value)lakeShaderUniforms.uSkyHorizon.value=new T.Color('#a4cce8');
 if(!lakeShaderUniforms.uDeepColor.value)lakeShaderUniforms.uDeepColor.value=new T.Color('#0c3e52');
 if(!lakeShaderUniforms.uShallowColor.value)lakeShaderUniforms.uShallowColor.value=new T.Color('#2e8e8e');
 if(!lakeShaderUniforms.uFogColor.value)lakeShaderUniforms.uFogColor.value=new T.Color('#b6d4ec');

 // Domo estrelado/noturno dedicado exclusivamente para o período 'noite'
 const nightDome=new T.Mesh(
  new T.SphereGeometry(1,32,16),
  new T.ShaderMaterial({
   side:T.BackSide,
   depthWrite:false,
   toneMapped:false,
   uniforms:{
    top:{value:new T.Color('#040c18')},
    mid:{value:new T.Color('#0b1d36')},
    horizon:{value:new T.Color('#163154')},
    moonDir:{value:new T.Vector3(-0.38,0.68,-0.32).normalize()},
    moonGlow:{value:new T.Color('#7fa4d8')}
   },
   vertexShader:'varying vec3 direction;void main(){direction=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position=p.xyww;}',
   fragmentShader:`uniform vec3 top;uniform vec3 mid;uniform vec3 horizon;uniform vec3 moonDir;uniform vec3 moonGlow;varying vec3 direction;
   void main(){
    vec3 d=normalize(direction);
    float h=clamp(d.y,0.0,1.0);
    vec3 col=mix(horizon,mid,smoothstep(0.0,0.24,h));
    col=mix(col,top,smoothstep(0.20,0.78,h));
    float mDot=max(dot(d,normalize(moonDir)),0.0);
    col+=moonGlow*(pow(mDot,28.0)*0.16+pow(mDot,240.0)*0.45);
    gl_FragColor=vec4(col,1.0);
    #include <colorspace_fragment>
   }`
  })
 );
 nightDome.scale.setScalar(4500);
 nightDome.frustumCulled=false;
 nightDome.visible=false;
 nightDome.name='Domo atmosférico noturno';
 scene.add(nightDome);

 function updateExtraNightLamps(isNight){
  scene.traverse(o=>{
   if(!o.isMesh||!o.material)return;
   const m=o.material;
   if(m.userData?.nightLamp){
    m.emissiveIntensity=isNight?4.8:0;
   }
  });
 }

 const tmpSunNorm=new T.Vector3();

 function lighting(mode){
  const is3d=mode==='3d';
  const period=solar.period||'tarde';
  const night=is3d&&(period==='noite'||solar.elevation<-6);
  const sunset=is3d&&!night&&period==='por-do-sol';
  const afternoon=is3d&&!night&&!sunset&&period==='tarde';
  const key=mode+'|'+period+'|'+solar.date+'|'+solar.instant;

  if(key!==lightingKey){
   lightingKey=key;
   activeNight=night;
   activeSunset=sunset;
   activeAfternoon=afternoon;

   if(night){
    // NOITE: céu azul-marinho profundo, luar sutil sem sombra dura solar e todos os postes/emissivos ativos
    sunOffset.set(-0.38,0.68,-0.32).normalize().multiplyScalar(1600);
    sun.position.copy(sun.target.position).add(sunOffset);
    sun.color.set('#759cd0');
    sun.intensity=0.42;
    sun.castShadow=false;

    hemisphere.color.set('#5880b5');
    hemisphere.groundColor.set('#182638');
    hemisphere.intensity=1.0;

    tmpSunNorm.copy(sunOffset).normalize();
    const nightEnv=getOrBuildPeriodEnv('noite',tmpSunNorm);
    if(nightEnv)scene.environment=nightEnv;
    scene.environmentIntensity=0.45;
    renderer.toneMappingExposure=1.3;
   }else if(sunset){
    // PÔR DO SOL (Golden Hour): sol rasante a oeste, luz âmbar-dourada, sombras longas e reflexo quente
    const dir=solar.direction.slice();
    dir[1]=T.MathUtils.clamp(dir[1],0.24,0.34);
    sunOffset.fromArray(dir).normalize().multiplyScalar(1600);
    sun.position.copy(sun.target.position).add(sunOffset);
    sun.color.set('#ff9b3d');
    sun.intensity=3.6;
    sun.castShadow=true;

    hemisphere.color.set('#ffc28c');
    hemisphere.groundColor.set('#6b4a2e');
    hemisphere.intensity=0.9;

    tmpSunNorm.copy(sunOffset).normalize();
    sky.material.uniforms.sunPosition.value.copy(tmpSunNorm);
    sky.material.uniforms.turbidity.value=8.2;
    sky.material.uniforms.rayleigh.value=2.75;
    sky.material.uniforms.mieCoefficient.value=0.0082;
    sky.material.uniforms.mieDirectionalG.value=0.89;

    const sunsetEnv=getOrBuildPeriodEnv('por-do-sol',tmpSunNorm);
    if(sunsetEnv)scene.environment=sunsetEnv;
    scene.environmentIntensity=0.7;
    renderer.toneMappingExposure=1.14;
   }else if(afternoon){
    // TARDE (15h Cuiabá, SEM golden hour): sol alto inclinado a oeste, luz branca-quente natural e céu azul vivo
    const aft=resolveAfternoon15h(solar.date,solar.direction);
    sunOffset.fromArray(aft.direction).normalize().multiplyScalar(1600);
    sun.position.copy(sun.target.position).add(sunOffset);
    sun.color.set('#fff3df');
    sun.intensity=2.85;
    sun.castShadow=true;

    hemisphere.color.set('#aed6f5');
    hemisphere.groundColor.set('#556d3d');
    hemisphere.intensity=0.68;

    tmpSunNorm.copy(sunOffset).normalize();
    sky.material.uniforms.sunPosition.value.copy(tmpSunNorm);
    sky.material.uniforms.turbidity.value=3.1;
    sky.material.uniforms.rayleigh.value=1.38;
    sky.material.uniforms.mieCoefficient.value=0.0042;
    sky.material.uniforms.mieDirectionalG.value=0.82;

    const aftEnv=hdrDayEnv?hdrDayEnv.texture:getOrBuildPeriodEnv('tarde',tmpSunNorm);
    if(aftEnv)scene.environment=aftEnv;
    scene.environmentIntensity=0.72;
    renderer.toneMappingExposure=0.9;
   }else{
    // MANHÃ (e modo satélite): luz solar matinal limpa e fresca vinda do leste, céu cristalino
    sunOffset.fromArray(is3d?solar.direction:[-0.48,0.80,0.34]).normalize().multiplyScalar(1600);
    sun.position.copy(sun.target.position).add(sunOffset);
    sun.color.set('#fffaf2');
    sun.intensity=is3d?2.75:2.15;
    sun.castShadow=true;

    hemisphere.color.set('#bce0fa');
    hemisphere.groundColor.set('#506c3f');
    hemisphere.intensity=0.66;

    tmpSunNorm.copy(sunOffset).normalize();
    sky.material.uniforms.sunPosition.value.copy(tmpSunNorm);
    sky.material.uniforms.turbidity.value=2.0;
    sky.material.uniforms.rayleigh.value=1.05;
    sky.material.uniforms.mieCoefficient.value=0.0030;
    sky.material.uniforms.mieDirectionalG.value=0.80;

    const morningEnv=getOrBuildPeriodEnv('manha',tmpSunNorm);
    if(morningEnv)scene.environment=morningEnv;
    scene.environmentIntensity=0.7;
    renderer.toneMappingExposure=0.88;
   }

   updateExtraNightLamps(night);

   // Sincroniza o shader da água do lago com a paleta exata de cada um dos 4 períodos
   if(lakeShaderUniforms.uSunDir?.value){
    lakeShaderUniforms.uSunDir.value.copy(sunOffset).normalize();
   }
   if(lakeShaderUniforms.uSunColor?.value){
    if(night){
     lakeShaderUniforms.uSunColor.value.set('#8db4e8');
     lakeShaderUniforms.uSkyZenith.value.set('#051224');
     lakeShaderUniforms.uSkyHorizon.value.set('#163154');
     lakeShaderUniforms.uDeepColor.value.set('#06182b');
     lakeShaderUniforms.uShallowColor.value.set('#12394c');
     lakeShaderUniforms.uFogColor.value.set('#0d2038');
    }else if(sunset){
     lakeShaderUniforms.uSunColor.value.set('#ffab4c');
     lakeShaderUniforms.uSkyZenith.value.set('#2a4e78');
     lakeShaderUniforms.uSkyHorizon.value.set('#eb9246');
     lakeShaderUniforms.uDeepColor.value.set('#123748');
     lakeShaderUniforms.uShallowColor.value.set('#3b837b');
     lakeShaderUniforms.uFogColor.value.set('#dc9d66');
    }else if(afternoon){
     lakeShaderUniforms.uSunColor.value.set('#fff3dc');
     lakeShaderUniforms.uSkyZenith.value.set('#2160a2');
     lakeShaderUniforms.uSkyHorizon.value.set('#9dc7e6');
     lakeShaderUniforms.uDeepColor.value.set('#0c3f54');
     lakeShaderUniforms.uShallowColor.value.set('#2b908f');
     lakeShaderUniforms.uFogColor.value.set('#b4d1e8');
    }else{
     lakeShaderUniforms.uSunColor.value.set('#fffbf2');
     lakeShaderUniforms.uSkyZenith.value.set('#2569ad');
     lakeShaderUniforms.uSkyHorizon.value.set('#abd2ee');
     lakeShaderUniforms.uDeepColor.value.set('#0b3e52');
     lakeShaderUniforms.uShallowColor.value.set('#2e9391');
     lakeShaderUniforms.uFogColor.value.set('#bad7ee');
    }
   }

   renderer.shadowMap.needsUpdate=true;

   if(cinematicPass){
    cinematicPass.uniforms.uWarmth.value=night?0.96:sunset?1.06:afternoon?1.015:1.0;
    // Bloom reduzido no celular e calibrado para não estourar fachadas brancas de dia
    cinematicPass.uniforms.uBloomIntensity.value=smallScreen
     ?(night?0.18:sunset?0.08:0.03)
     :(night?0.44:sunset?0.24:afternoon?0.11:0.10);
    cinematicPass.uniforms.uBloomThreshold.value=night?0.58:sunset?0.80:0.90;
    cinematicPass.uniforms.uSaturation.value=night?1.05:sunset?1.06:1.04;
    cinematicPass.uniforms.uVignetteIntensity.value=smallScreen?0.07:night?0.14:0.10;
   }
  }

  // Visibilidade correta dos domos celestes
  sky.visible=false;
  nightDome.visible=is3d&&night;
  if(nightDome.visible){
   nightDome.position.copy(beauty.camera.position);
   nightDome.material.uniforms.moonDir.value.copy(sunOffset).normalize();
  }

  // Spotlights dinâmicos locais apenas à noite (ou crepúsculo com luzes ligadas, nunca às 15h)
  const lightsActive=is3d&&(night||(period!=='tarde'&&period!=='manha'&&solar.lightsOn));
  const ordered=lightsActive
   ?sources
     .map(s=>({s,d:sun.target.position.distanceToSquared(s.p)}))
     .sort((a,b)=>a.d-b.d)
     .slice(0,spots.length)
   :[];

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
   pmrem.compileEquirectangularShader();
   const nextEnv=pmrem.fromEquirectangular(hdr);
   hdrDayEnv?.dispose();
   hdrDayEnv=nextEnv;
   hdr.dispose();
   pmrem.dispose();
   // Força atualização do environment coerente com o período ativo no próximo frame
   lightingKey='';
  }catch{
   // Se o HDR externo falhar, o PMREM físico gerado a partir do Sky assume automaticamente
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
  setSolar(state){
   solar=state;
   lightingKey='';
  },
  setLighting(value){
   solar=simulation(solar.date,value?'noite':'tarde');
   lightingKey='';
  },
  setInteracting(value){
   interacting=Boolean(value);
  },
  focusShadow(targetPos,radius=850){
   const extent=T.MathUtils.clamp(radius,85,900);
   const tNorm=(extent-85)/(900-85);
   sun.target.position.copy(targetPos);
   sun.position.copy(targetPos).add(sunOffset);
   Object.assign(sun.shadow.camera,{
    left:-extent,
    right:extent,
    top:extent,
    bottom:-extent,
    near:Math.max(120,1600-extent*1.35),
    far:Math.min(4200,1600+extent*1.65)
   });
   // Ajusta normalBias proporcionalmente ao zoom para eliminar prédios/carros "flutuando" de perto
   sun.shadow.normalBias=smallScreen
    ?T.MathUtils.lerp(0.055,0.16,tNorm)
    :T.MathUtils.lerp(0.024,0.105,tNorm);
   sun.shadow.bias=smallScreen
    ?T.MathUtils.lerp(-0.00014,-0.00032,tNorm)
    :T.MathUtils.lerp(-0.00005,-0.00014,tNorm);
   sun.shadow.camera.updateProjectionMatrix();
   renderer.shadowMap.needsUpdate=true;
  },
  resize(w,h){
   renderer.setSize(w,h,false);
   // pos-processamento desligado: render direto, mais leve
   const pr=renderer.getPixelRatio();
   if(cinematicPass)cinematicPass.uniforms.uResolution.value.set(w*pr,h*pr);
  },
  render(mode,overlay){
   renderer.info.reset();
   lighting(mode);

   const bgCol=mode==='3d'
    ?(activeNight?'#09172b':activeSunset?'#d99154':activeAfternoon?'#96c1e3':'#9fc8e8')
    :'#27332c';
   scene.background.set(bgCol);

   const distance=beauty.camera.position.distanceTo(sun.target.position);
   atmosphere.color.set(
    activeNight?'#0d2038':activeSunset?'#dc9d66':activeAfternoon?'#b4d1e8':'#bad7ee'
   );
   atmosphere.near=Math.max(1850,distance*1.32);
   atmosphere.far=Math.max(7600,distance*3.4+3500);
   scene.fog=mode==='3d'?atmosphere:null;

   if(mode==='3d'){
    if(ao){
     ao.enabled=!smallScreen;
     ao.blendIntensity=activeNight?0.26:interacting?0.36:0.48;
     lastAO=ao.enabled;
    }
    if(cinematicPass){
     cinematicPass.uniforms.uSharpen.value=smallScreen?0.0:(interacting?0.08:0.16);
    }
    renderer.render(scene,beauty.camera);
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
   hdrDayEnv?.dispose();
   for(const env of envCache.values())env?.dispose?.();
   envCache.clear();
   nightDome.geometry?.dispose();
   nightDome.material?.dispose();
   sky.geometry?.dispose();
   sky.material?.dispose();
   ao?.dispose();
   target?.dispose();
   composer?.dispose();
   renderer.dispose();
  }
 };
}
// FIM DO ARQUIVO
