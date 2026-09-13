import {bindHostBridge,reportMapReady} from './bridge.js';
import {places,colors} from './park-data.js?v=implantacao-20260912-2';
const $=s=>document.querySelector(s),mobile=()=>matchMedia('(max-width:760px)').matches;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const category=p=>p.category==='Experiências'?'Lazer':p.category;
let selectedId=null,filter='all',query='',visible=new Set(places.map(p=>p.id)),mapApi=null,lastTrigger=null;
function toggleList(open){$('.explorer').classList.toggle('list-open',open);$('#map-stage').inert=open;$('.mobile-list-open').setAttribute('aria-expanded',String(open));}
function drawList(){
 const found=places.filter(p=>(filter==='all'||p.category===filter)&&normalize(p.name+' '+category(p)).includes(normalize(query)));
 visible=new Set(found.map(p=>p.id));$('#list-count').textContent=`${found.length} espaços para descobrir`;
 $('#place-list').innerHTML=found.length?found.map(p=>`<div class="place-row"><button class="place-focus" type="button" data-locate="${p.id}" aria-label="Localizar ${p.name}"><img class="place-thumb" src="./assets/spaces/${p.id}.webp?v=7" alt="" width="47" height="42" loading="lazy"><span><span class="place-name">${p.name}</span><span class="place-category">${category(p)}</span></span></button>${p.url?`<a class="place-link" data-destination="${p.id}" href="${p.url}" target="_top" aria-label="Conhecer ${p.name}">↗</a>`:''}</div>`).join(''):'<p class="empty">Não encontramos esse espaço.<br>Tente outro nome ou escolha Todos.</p>';
 mapApi?.render();
}
function selectPlace(id,focus=true){
 const p=places.find(p=>p.id===id);if(!p)return;lastTrigger=document.activeElement;selectedId=id;
 const nearest=places.filter(q=>q.id!==id).sort((a,b)=>Math.hypot(a.position[0]-p.position[0],a.position[1]-p.position[1])-Math.hypot(b.position[0]-p.position[0],b.position[1]-p.position[1])).slice(0,3);
 $('#browse-panel').hidden=true;$('#selection').hidden=false;$('.explorer').classList.add('has-selection');$('#selection').style.setProperty('--color',colors[p.category]);
 $('#selection').innerHTML=`<div class="selection-top"><button class="selection-back" type="button">← Todos os espaços</button><button class="selection-close" type="button" aria-label="Fechar detalhes">×</button></div><img class="selection-image" src="./assets/spaces/${p.id}.webp?v=7" alt="${p.name}, referência do projeto"><div class="selection-photo-label">${p.photoCaption||(p.id==='estrutura-e-acesso'?'Planta de implantação':'Imagem do projeto')}</div><div class="selection-copy"><div class="selection-tag">${category(p)}</div><h2 tabindex="-1">${p.name}</h2><p>${p.description}</p>${p.url?`<a class="primary-link" data-destination="${p.id}" href="${p.url}" target="_top">Conhecer o espaço <span aria-hidden="true">↗</span></a>`:''}<div class="selection-location"><strong>Você está explorando</strong>${p.zone||'Parque Novo Mato Grosso'}<br>Veja também as atrações ao redor.</div><div class="nearby"><p>POR PERTO</p>${nearest.map(n=>`<button data-nearby="${n.id}">${n.name} ↗</button>`).join('')}</div></div>`;
 toggleList(false);$('#selection').scrollTop=0;$('#announcement').textContent=p.url?`${p.name} selecionado. Use Conhecer o espaço para abrir a página.`:`${p.name} selecionado. Veja a localização e os detalhes no mapa.`;
 const u=new URL(location.href);u.searchParams.set('espaco',id);history.replaceState(null,'',u);
 if(focus)mapApi?.focus(p);else mapApi?.render();
 if(lastTrigger?.matches('button')&&lastTrigger.matches(':focus-visible'))$('#selection h2').focus({preventScroll:true});
}
function closeSelection(returnFocus=true){selectedId=null;$('#selection').hidden=true;$('#browse-panel').hidden=false;$('.explorer').classList.remove('has-selection');const u=new URL(location.href);u.searchParams.delete('espaco');history.replaceState(null,'',u);mapApi?.render();if(returnFocus&&lastTrigger?.isConnected)lastTrigger.focus({preventScroll:true});}
$('#search').addEventListener('input',e=>{query=e.target.value;drawList();});
$('.filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));drawList();mapApi?.overview();$('#announcement').textContent=$('#list-count').textContent;});
$('#place-list').addEventListener('click',e=>{const b=e.target.closest('[data-locate]');if(b)selectPlace(b.dataset.locate);});
$('#selection').addEventListener('click',e=>{if(e.target.closest('.selection-close,.selection-back')){closeSelection();mapApi?.overview();}const b=e.target.closest('[data-nearby]');if(b)selectPlace(b.dataset.nearby);});
$('.mobile-list-open').addEventListener('click',()=>{if(selectedId)closeSelection(false);toggleList(true);$('#search').focus({preventScroll:true});});
$('.mobile-list-close').addEventListener('click',()=>{toggleList(false);$('.mobile-list-open').focus({preventScroll:true});});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSelection();toggleList(false);mapApi?.overview();}if(e.key==='Tab'&&mobile()&&$('.explorer').classList.contains('list-open')){const els=[...$('#places').querySelectorAll('button,a,input')].filter(x=>x.offsetParent);const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
drawList();
bindHostBridge({places,onChange:()=>{drawList();if(selectedId)selectPlace(selectedId,false);}});
const timer=setTimeout(()=>{$('#loading strong').textContent='Preparando os detalhes…';},4500);

async function init(){
 const [T,{OrbitControls},{createMiniatures,world,loadMaterials},{createRendering},{fitDistance,fitOrtho}]=await Promise.all([import('three'),import('three/addons/controls/OrbitControls.js'),import('./miniatures.js?v=implantacao-20260913-auto1'),import('./rendering.js?v=implantacao-20260912-2'),import('./camera-math.js?v=implantacao-20260912-2')]);
 const host=$('#map'),stage=$('#map-stage'),scene=new T.Scene(),overlay=new T.Scene();
 const perspective=new T.PerspectiveCamera(38,1,5,10000),topCamera=new T.OrthographicCamera(-600,600,500,-500,1,8000);
 let camera=perspective,view='3d',tilted=true,buildings=true,hoveredId=null,animation=null,frame=0,disposed=false,activeTween=0,overviewDistance=2000;
 const engine=createRendering(scene,camera,mobile()),renderer=engine.renderer;
 host.appendChild(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);
 Object.assign(controls,{enableDamping:false,minPolarAngle:.22,maxPolarAngle:1.36,rotateSpeed:.45,zoomSpeed:.8,minDistance:60,maxDistance:5000,minZoom:.65,maxZoom:10,enablePan:true,screenSpacePanning:true});
 controls.touches.ONE=T.TOUCH.ROTATE;controls.touches.TWO=T.TOUCH.DOLLY_PAN;
 const built=createMiniatures();scene.add(built.root);
 window._mapDebug={get camera(){return camera;},controls,render:()=>render(),scene,world};
 const floor=new T.Mesh(new T.PlaneGeometry(6500,6500),new T.MeshStandardMaterial({color:'#2e4424',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-5.3;floor.receiveShadow=true;scene.add(floor);
 const imageShadows=new T.Mesh(new T.PlaneGeometry(1174,1115),new T.ShadowMaterial({color:'#14251e',opacity:.3,depthWrite:false}));imageShadows.rotation.x=-Math.PI/2;imageShadows.position.copy(world([624,566],.22));imageShadows.receiveShadow=true;imageShadows.renderOrder=20;imageShadows.visible=false;scene.add(imageShadows);
 const textures=[],textureLoader=new T.TextureLoader(),layerPromises=new Map();let satellite=null,planImage=null,planOpacity=0.65,overlayActive=false;const texturePromises=new Map();
 async function loadTexture(url){if(texturePromises.has(url))return texturePromises.get(url);const promise=textureLoader.loadAsync(url).then(tex=>{tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),16);textures.push(tex);return tex;});texturePromises.set(url,promise);return promise;}
 function imageTile(tex,corners,height,opacity=1){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(corners.flatMap(p=>world(p,height).toArray()),3));geo.setAttribute('uv',new T.Float32BufferAttribute([0,1,1,1,0,0,1,0],2));geo.setIndex([0,2,1,1,2,3]);geo.computeVertexNormals();return new T.Mesh(geo,new T.MeshBasicMaterial({map:tex,toneMapped:false,transparent:true,opacity,depthWrite:false,side:T.DoubleSide}));}
 async function createImageLayer(kind){
  if(kind==='3d')return;
  if(layerPromises.has(kind))return layerPromises.get(kind);
  const promise=(async()=>{
   if(kind==='satellite'){
    const response=await fetch('./assets/orthophoto/tiles.json?v=7');if(!response.ok)throw new Error('A base aérea não carregou.');const data=await response.json(),group=new T.Group();
    // Original image-to-page matrices: no estimated geographic alignment.
    const tiles=await Promise.all(data.tiles.map(async tile=>{const tex=await loadTexture(mobile()?tile.mobileUrl:tile.url);const mesh=imageTile(tex,tile.corners,-.4+tile.order*.006);mesh.renderOrder=tile.order;return mesh;}));
    tiles.forEach(m=>group.add(m));group.visible=false;satellite=group;scene.add(group);
   }else{
    const tex=await loadTexture('./assets/referencias/prancha-completa.webp?v=r83-r84');
    const parkOutline=[[72,548],[81,480],[120,445],[121,382],[105,337],[128,297],[218,190],[344,14],[520,14],[921,128],[936,170],[914,303],[1004,477],[1124,714],[1176,935],[1158,1009],[998,1049],[594,1111],[394,1118],[362,1076],[320,1003],[255,950],[270,881],[221,810],[160,825],[125,815],[95,740],[135,675],[104,605]];
    const vecs=parkOutline.map(([x,z])=>new T.Vector2(x,z)),indices=T.ShapeUtils.triangulateShape(vecs,[]).flat(),positions=parkOutline.flatMap(([x,z])=>world([x,z],-.22).toArray()),uvs=parkOutline.flatMap(([x,z])=>[x/1600,1-z/1131.8694362]);
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
    planImage=new T.Mesh(geo,new T.MeshBasicMaterial({map:tex,toneMapped:false,transparent:true,opacity:planOpacity,depthWrite:false,side:T.DoubleSide}));
    planImage.renderOrder=6;planImage.visible=false;scene.add(planImage);
   }
  })();layerPromises.set(kind,promise);
  try{await promise;}catch(e){layerPromises.delete(kind);throw e;}
 }
 const selectables=[],outlines=[],markers=new Map(),markerHeights=new Map();built.models.forEach((g,id)=>markerHeights.set(id,new T.Box3().setFromObject(g).max.y+2));
 places.forEach(p=>{
  const radius=p.id==='roda-gigante'?28:p.id==='agroplace'?23:p.id==='arvore-da-vida'?11:p.id==='portico-de-entrada'?35:20;
  const points=p.footprint||Array.from({length:32},(_,i)=>[p.position[0]+Math.cos(i/32*Math.PI*2)*radius,p.position[1]+Math.sin(i/32*Math.PI*2)*radius]);
  const s=new T.Shape();points.forEach((point,i)=>{const v=world(point);i?s.lineTo(v.x,-v.z):s.moveTo(v.x,-v.z);});s.closePath();const geo=new T.ShapeGeometry(s);geo.rotateX(-Math.PI/2);
  const fill=new T.Mesh(geo,new T.MeshBasicMaterial({color:colors[p.category],transparent:true,opacity:0,depthWrite:false,depthTest:false,side:T.DoubleSide,toneMapped:false}));fill.position.y=1.8;fill.userData.placeId=p.id;overlay.add(fill);selectables.push(fill);
  const line=new T.LineLoop(new T.BufferGeometry().setFromPoints(points.map(pt=>world(pt,2))),new T.LineBasicMaterial({color:'#f6eac8',transparent:true,opacity:0,depthWrite:false,depthTest:false,toneMapped:false}));line.userData.placeId=p.id;overlay.add(line);outlines.push(line);
  const m=document.createElement('div');m.className='marker';m.dataset.id=p.id;m.style.setProperty('--color',colors[p.category]);m.innerHTML=`<button type="button" aria-label="Localizar ${p.name}" title="${p.name}"><i aria-hidden="true"></i><span class="pin-name">${p.name}</span></button><span class="pin-stem" aria-hidden="true"></span>`;
  m.querySelector('button').addEventListener('click',()=>selectPlace(p.id));m.addEventListener('pointerenter',()=>{hoveredId=p.id;render();});m.addEventListener('pointerleave',()=>{hoveredId=null;render();});m.addEventListener('focusin',()=>{hoveredId=p.id;render();});m.addEventListener('focusout',()=>{hoveredId=null;render();});$('#markers').appendChild(m);markers.set(p.id,m);
 });
 const raycaster=new T.Raycaster(),mouse=new T.Vector2();let pointerStart=null;
 function hit(e){const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);const objects=buildings?[...built.models.values(),...selectables]:selectables;return raycaster.intersectObjects(objects,true).find(h=>visible.has(h.object.userData.placeId)||h.object.userData.placeId===selectedId)?.object.userData.placeId;}
 renderer.domElement.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};renderer.domElement.classList.add('grabbing');activeTween++;});
 renderer.domElement.addEventListener('pointerup',e=>{renderer.domElement.classList.remove('grabbing');if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)<7){const id=hit(e);if(id)selectPlace(id);}pointerStart=null;});
 renderer.domElement.addEventListener('pointercancel',()=>{pointerStart=null;renderer.domElement.classList.remove('grabbing');});
 renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')return;const id=hit(e);if(id!==hoveredId){hoveredId=id;renderer.domElement.style.cursor=id?'pointer':'grab';render();}});
 renderer.domElement.addEventListener('pointerleave',()=>{hoveredId=null;render();});
 function updateMarkers(){
  const width=stage.clientWidth,height=stage.clientHeight,rects=[],scale=camera.isPerspectiveCamera?overviewDistance/camera.position.distanceTo(controls.target):camera.zoom;
  // Reserve the visible toolbar areas before placing labels.
  for(const el of stage.querySelectorAll('.mode-switch,.scene-settings,.compass,.map-caption')){const r=el.getBoundingClientRect(),s=stage.getBoundingClientRect();rects.push({l:r.left-s.left,r:r.right-s.left,t:r.top-s.top,b:r.bottom-s.top});}
  const priority=[...places].sort((a,b)=>((b.id===selectedId?100:0)+(b.id===hoveredId?50:0)+(b.featured?15:0))-((a.id===selectedId?100:0)+(a.id===hoveredId?50:0)+(a.featured?15:0)));
  for(const p of priority){
   const m=markers.get(p.id),isActive=p.id===selectedId||p.id===hoveredId;
   const v=world(p.position,buildings?Math.min(Math.max(markerHeights.get(p.id),p.height+2),64):2).project(camera),x=(v.x+1)/2*width,y=(1-v.y)/2*height;
   const showing=(visible.has(p.id)||p.id===selectedId)&&v.z>=-1&&v.z<=1&&x>18&&x<width-18&&y>100&&y<height-(mobile()&&selectedId?height*.43:80);
   m.hidden=!showing;if(!showing)continue;m.style.left=x+'px';m.style.top=y+'px';m.classList.toggle('selected',p.id===selectedId);m.style.zIndex=isActive?'50':'10';
   let full=isActive||p.featured||scale>2.6;if(mobile()&&!isActive&&scale<2.6)full=['autodromo','roda-gigante','arena-show','centro-de-eventos'].includes(p.id);
   m.classList.toggle('compact',!full);let mw=m.offsetWidth,mh=m.offsetHeight,r={l:x-mw/2,r:x+mw/2,t:full?y-mh:y-18,b:full?y:y+18};
   const collision=rects.some(a=>r.l<a.r+9&&r.r>a.l-9&&r.t<a.b+8&&r.b>a.t-8);
   if(!isActive&&(r.l<12||r.r>width-12||collision)){m.classList.add('compact');r={l:x-18,r:x+18,t:y-18,b:y+18};if(rects.some(a=>r.l<a.r+4&&r.r>a.l-4&&r.t<a.b+4&&r.b>a.t-4)){m.hidden=true;continue;}}
   rects.push(r);
  }
  const center=controls.target.clone().project(camera),north=controls.target.clone().add(new T.Vector3(0,0,-100)).project(camera);
  const angle=Math.atan2((north.x-center.x)*width,(north.y-center.y)*height)*180/Math.PI;
  $('#north svg').style.transform=`rotate(${angle}deg)`;
 }
 function paint(){frame=0;if(disposed)return;selectables.forEach(m=>{const id=m.userData.placeId;m.material.opacity=id===selectedId?.065:id===hoveredId?.035:0;});outlines.forEach(m=>{m.material.opacity=m.userData.placeId===selectedId?.9:m.userData.placeId===hoveredId?.45:0;});engine.render(view,overlay);updateMarkers();}
 function render(){if(!frame)frame=requestAnimationFrame(paint);}
 controls.addEventListener('change',render);controls.addEventListener('start',()=>{activeTween++;});controls.addEventListener('end',()=>{engine.focusShadow(controls.target,camera.position.distanceTo(controls.target)*.62);render();});
 const corners=[[72,14],[1176,14],[1176,1118],[72,1118]].flatMap(p=>[world(p),world(p,24)]);
 const defaultDirection=new T.Vector3(-.94,.62,.29).normalize();
 function viewport(focused=false){const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);camera.aspect=w/h;camera.clearViewOffset();if(mobile()&&focused)camera.setViewOffset(w,h,0,h*.16,w,h);camera.updateProjectionMatrix();engine.resize(w,h);return w/h;}
 function chooseCamera(){
  camera=tilted?perspective:topCamera;controls.object=camera;engine.setCamera(camera);
  controls.enableRotate=tilted;controls.minPolarAngle=tilted?.22:0;controls.maxPolarAngle=tilted?1.36:Math.PI/2;
  controls.touches.ONE=tilted?T.TOUCH.ROTATE:T.TOUCH.PAN;$('#rotate').disabled=!tilted;
  $('#tilt').setAttribute('aria-pressed',String(tilted));$('#buildings').setAttribute('aria-pressed',String(buildings));
 }
 function overview(){
  activeTween++;chooseCamera();camera.up.set(0,1,0);const aspect=viewport(),target=world([624,566]);controls.target.copy(target);camera.zoom=1;
  const direction=tilted?defaultDirection:new T.Vector3(0,1,.0001);camera.position.copy(target).addScaledVector(direction,2000);camera.lookAt(target);
  if(tilted){overviewDistance=fitDistance(camera,target,corners,aspect,mobile()?.70:1.17);camera.position.copy(target).addScaledVector(direction,overviewDistance);controls.maxDistance=Math.max(overviewDistance*1.5,2200);}
  else fitOrtho(camera,target,corners,aspect,mobile()?.70:1.14);
  camera.updateProjectionMatrix();controls.update();camera.updateMatrixWorld();engine.focusShadow(controls.target,900);
  $('.map-hint span:last-child').textContent=mobile()?'Pince para aproximar · Toque para explorar':tilted?'Arraste para girar · Role para aproximar':'Arraste para mover · Role para aproximar';render();
 }
 function enterPlanComparison(){
  activeTween++;
  const target=controls.target.clone(),offset=camera.position.clone().sub(target),distance=offset.length();
  const span=Math.tan(T.MathUtils.degToRad(camera.fov/2))*distance/camera.zoom;
  const up=new T.Vector3(-offset.x,0,-offset.z);if(up.lengthSq()<1e-8)up.set(0,0,-1);up.normalize();
  tilted=false;chooseCamera();const aspect=viewport(Boolean(selectedId));
  camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;camera.zoom=1;
  camera.up.copy(up);camera.position.copy(target).add(new T.Vector3(0,2000,0));camera.lookAt(target);controls.target.copy(target);
  camera.updateProjectionMatrix();controls.update();camera.updateMatrixWorld();engine.focusShadow(target,900);
  $('.map-hint span:last-child').textContent='Arraste para mover · Role para aproximar';
 }
 function placeBounds(p){
  const bounds=new T.Box3().setFromObject(built.models.get(p.id));
  const radius=p.id==='portico-de-entrada'?38:28;
  for(const pt of p.footprint||[[p.position[0]-radius,p.position[1]-radius],[p.position[0]+radius,p.position[1]+radius]])bounds.expandByPoint(world(pt));
  if(!buildings)bounds.max.y=2;
  return bounds;
 }
 function focus(p){
  const bounds=placeBounds(p),target=bounds.getCenter(new T.Vector3()),points=[];
  for(const x of [bounds.min.x,bounds.max.x])for(const z of [bounds.min.z,bounds.max.z])for(const y of [0,bounds.max.y])points.push(new T.Vector3(x,y,z));
  const aspect=viewport(true),from=camera.position.clone(),fromTarget=controls.target.clone(),off=camera.position.clone().sub(controls.target),z0=camera.zoom;
  let to,zoom=1;
  if(tilted){
   const direction=p.focusDirection?new T.Vector3(...p.focusDirection).normalize():off.normalize();
   const fitted=camera.clone();fitted.position.copy(target).add(direction);fitted.lookAt(target);
   const distance=Math.max(100,fitDistance(fitted,target,points,aspect,mobile()?1.08:1.4));
   to=target.clone().addScaledVector(direction,distance);
  }
  else{to=target.clone().add(off);const inverse=camera.quaternion.clone().invert(),locals=points.map(v=>v.clone().sub(target).applyQuaternion(inverse));const need=Math.max(30,...locals.map(v=>Math.max(Math.abs(v.y),Math.abs(v.x)/aspect)))*(mobile()?1.08:1.55);zoom=Math.min(10,camera.top/need);}
  const token=++activeTween,start=performance.now(),duration=reduced?0:850;
  function step(now){if(disposed||token!==activeTween)return;const t=duration?Math.min((now-start)/duration,1):1,e=1-Math.pow(1-t,3);camera.position.lerpVectors(from,to,e);controls.target.lerpVectors(fromTarget,target,e);camera.zoom=z0+(zoom-z0)*e;camera.updateProjectionMatrix();controls.update();render();if(t<1)animation=requestAnimationFrame(step);else engine.focusShadow(controls.target,Math.max(100,camera.position.distanceTo(controls.target)*.62));}
  animation=requestAnimationFrame(step);
 }
 function zoom(factor){activeTween++;if(tilted){const off=camera.position.clone().sub(controls.target),distance=T.MathUtils.clamp(off.length()/factor,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(off.setLength(distance));controls.update();}else{camera.zoom=T.MathUtils.clamp(camera.zoom*factor,.65,10);camera.updateProjectionMatrix();}engine.focusShadow(controls.target,camera.position.distanceTo(controls.target)*.62);render();}
 $('#zoom-in').addEventListener('click',()=>zoom(1.28));$('#zoom-out').addEventListener('click',()=>zoom(1/1.28));
 $('#rotate').addEventListener('click',()=>{activeTween++;if(!tilted)return;const off=camera.position.clone().sub(controls.target).applyAxisAngle(new T.Vector3(0,1,0),Math.PI/8);camera.position.copy(controls.target).add(off);controls.update();render();});
 const reset=()=>{closeSelection(false);overview();};$('#reset').addEventListener('click',reset);$('#north').addEventListener('click',reset);
  const planSlider=$('#plan-opacity'),opacityVal=$('#opacity-val'),overlayWrap=$('#overlay-control'),overlayBtn=$('#overlay-btn');
  if(planSlider){planSlider.addEventListener('input',e=>{planOpacity=Number(e.target.value)/100;if(opacityVal)opacityVal.textContent=e.target.value+'%';if(planImage){planImage.material.opacity=planOpacity;planImage.visible=planOpacity>0&&(view==='plan'||overlayActive);}render();});}
  if(overlayBtn){overlayBtn.addEventListener('click',async()=>{
   overlayBtn.disabled=true;
   try{const next=!overlayActive;if(next&&!planImage)await createImageLayer('plan');overlayActive=next;
    if(next&&tilted)enterPlanComparison();
    updateLayers();render();
   }catch(e){$('#announcement').textContent='A planta não carregou. Tente novamente.';console.error(e);}
   finally{overlayBtn.disabled=false;}
  });}
  const sidebarToggle=$('#sidebar-toggle');
  if(sidebarToggle){sidebarToggle.addEventListener('click',()=>{const exp=$('.explorer');exp.classList.toggle('sidebar-collapsed');const col=exp.classList.contains('sidebar-collapsed');sidebarToggle.setAttribute('aria-label',col?'Expandir lista de espaços':'Recolher lista de espaços');sidebarToggle.title=col?'Expandir lista de espaços':'Recolher lista de espaços';setTimeout(()=>overview(),280);});}
  function updateLayers(){
   const showPlan=(view==='plan'||overlayActive)&&planImage;
   built.landscape.visible=view==='3d';built.vegetation.visible=view==='3d';built.infrastructure.visible=buildings;built.water.visible=view==='3d';built.modelLayer.visible=buildings;built.circuits.visible=view==='3d'||buildings;floor.visible=view==='3d';imageShadows.visible=view!=='3d'&&buildings;
   if(satellite)satellite.visible=view==='satellite';
   if(planImage){const onTop=overlayActive&&view==='3d';if(planImage.parent!==(onTop?overlay:scene))(onTop?overlay:scene).add(planImage);planImage.material.depthTest=!onTop;planImage.renderOrder=onTop?-100:6;planImage.visible=Boolean(showPlan);planImage.material.opacity=(view==='plan'&&!overlayActive)?Math.max(planOpacity,.85):planOpacity;}
   if(overlayWrap)overlayWrap.hidden=!(view==='plan'||overlayActive);
   if(overlayBtn)overlayBtn.setAttribute('aria-pressed',String(overlayActive));
   $('#map-credit').textContent=view==='satellite'?'Ortofoto aérea da implantação · Fonte: projeto PNMT':(view==='plan'||overlayActive)?'Implantação oficial (Carimbo R83 / Arquivo R84) · Projeto Arquitetônico':'Implantação do projeto · volumes ilustrativos';
   $('.map-caption div>span').textContent=view==='satellite'?'O território e os espaços do projeto':(view==='plan'||overlayActive)?'Conferência da implantação do projeto':'Explore a arquitetura e os espaços';
   stage.dataset.view=view;$('#buildings').setAttribute('aria-pressed',String(buildings));renderer.shadowMap.needsUpdate=true;
  }
  $('#tilt').addEventListener('click',()=>{tilted=!tilted;overview();if(selectedId)focus(places.find(p=>p.id===selectedId));});
  $('#buildings').addEventListener('click',()=>{buildings=!buildings;updateLayers();if(selectedId)focus(places.find(p=>p.id===selectedId));render();});
  let requestedView=0;
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',async()=>{
   const token=++requestedView;try{stage.setAttribute('aria-busy','true');b.classList.add('is-loading');await createImageLayer(b.dataset.view);if(token!==requestedView)return;view=b.dataset.view;tilted=view!=='plan';buildings=true;updateLayers();document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));overview();if(selectedId)focus(places.find(p=>p.id===selectedId));$('#announcement').textContent=`Visualização ${b.textContent} aberta.`;
   }catch(e){$('#announcement').textContent='Não foi possível carregar essa vista. Tente novamente.';console.error(e);}finally{b.classList.remove('is-loading');if(token===requestedView)stage.removeAttribute('aria-busy');}
  }));
 let resizeW=0,resizeH=0;
 const resize=new ResizeObserver(()=>{if(stage.clientWidth===resizeW&&stage.clientHeight===resizeH)return;resizeW=stage.clientWidth;resizeH=stage.clientHeight;overview();if(selectedId)focus(places.find(p=>p.id===selectedId));});resize.observe(stage);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();showFallback();});
 mapApi={render,focus,overview};overview();updateLayers();
 // A vista 3D abre com o terreno verde; a ortofoto só carrega ao abrir Satélite.
 await Promise.allSettled([engine.loadEnvironment(),loadMaterials(renderer).then(ts=>textures.push(...ts))]);
 if(disposed)return;updateLayers();clearTimeout(timer);$('#loading').classList.add('fade-out');setTimeout(()=>{$('#loading').hidden=true;},350);renderer.shadowMap.needsUpdate=true;render();reportMapReady();
 const requested=new URLSearchParams(location.search).get('espaco');if(places.some(p=>p.id===requested))selectPlace(requested);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){activeTween++;cancelAnimationFrame(frame);frame=0;}else render();});
 window.addEventListener('pagehide',()=>{disposed=true;activeTween++;cancelAnimationFrame(frame);cancelAnimationFrame(animation);resize.disconnect();controls.dispose();textures.forEach(t=>t.dispose());for(const layer of [scene,overlay])layer.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});engine.dispose();});
}
function showFallback(){clearTimeout(timer);$('#loading').hidden=true;$('#fallback').hidden=false;$('#markers').hidden=true;$('.map-caption').hidden=true;$('.map-hint').hidden=true;document.querySelectorAll('.map-controls button,.scene-settings button,[data-view],.compass').forEach(b=>b.disabled=true);$('.mobile-list-open').style.display='flex';}
init().catch(error=>{console.error('Não foi possível abrir a maquete.',error);showFallback();});
