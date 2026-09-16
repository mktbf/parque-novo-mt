import {createParkIllumination} from './luz-ambiente.js?v=cenario-integral-20260914-2';
import {mountSolarControls} from './solar-controls.js?v=cenario-integral-20260914-2';
import {sunDirection} from './solar-model.js?v=cenario-integral-20260914-2';
import {bindHostBridge,reportMapReady} from './bridge.js?v=autodromo-arquitetura-20260913-1';
import {openPortalPlace,portalSelection,portalSpaceId,reportPortalFallback} from './portal-flow.js?v=portal-espacos-20260914-1';
import {places,colors} from './park-data.js?v=cenario-integral-20260914-2';
const $=s=>document.querySelector(s),mobile=()=>matchMedia('(max-width:760px)').matches;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
import {findPlaces,categoryLabel as category,imageFor,relatedPlaces,guideHtml,escapeHtml} from './visitor-guide.js?v=cenario-integral-20260914-2';
import {detailOptions,validDetail,detailLabel,detailView} from './detail-navigation.js?v=espacos-acabamento-20260914-3';
let autoDetail=null,nightAuto=false;
function autoViewButtons(p){
 const options=detailOptions[p.id];if(!options)return '';
 return `<div class="auto-views" role="group" aria-label="Explorar ${escapeHtml(p.name)}">${options.map(([key,label])=>`<button type="button" data-detail-view="${key}" ${p.id==='autodromo'?`data-auto-view="${key||'circuit'}"`:''} aria-pressed="${String(key===(autoDetail||''))}" ${mapApi?'':'disabled'}>${label}</button>`).join('')}</div>`;
}
let selectedId=null,filter='all',query='',visible=new Set(places.map(p=>p.id)),mapApi=null,lastTrigger=null;
function toggleList(open){$('.explorer').classList.toggle('list-open',open);$('#map-stage').inert=open;$('.mobile-list-open').setAttribute('aria-expanded',String(open));}
function drawList(){
 const found=findPlaces(places,filter,query);
 visible=new Set(found.map(p=>p.id));$('#list-count').textContent=`${found.length} ${found.length===1?'local encontrado':'locais para descobrir'}`;
 $('#place-list').innerHTML=found.length?found.map(p=>`<div class="place-row"><button class="place-focus" type="button" data-locate="${p.id}" aria-label="Localizar ${p.name}"><img class="place-thumb" src="${imageFor(p)}" alt="" width="47" height="42" loading="lazy"><span><span class="place-name">${p.name}</span><span class="place-category">${escapeHtml(p.kind==='parking'?p.zone:category(p))}</span></span></button>${p.url?`<a class="place-link" data-destination="${p.id}" href="${p.url}" target="_top" aria-label="Conhecer ${p.name}">↗</a>`:''}</div>`).join(''):'<p class="empty">Não encontramos esse espaço.<br>Tente outro nome ou escolha Todos.</p>';
 mapApi?.render();
}
function activatePlace(id){const p=places.find(p=>p.id===id);if(!openPortalPlace(p))selectPlace(id);}
function selectPlace(id,focus=true){
 const p=places.find(p=>p.id===id);if(!p)return;if(focus||selectedId!==id)autoDetail=null;lastTrigger=document.activeElement;selectedId=id;
 const nearest=relatedPlaces(p,places);
 $('#browse-panel').hidden=true;$('#selection').hidden=false;$('.explorer').classList.add('has-selection');$('#selection').style.setProperty('--color',colors[p.category]);
 $('#selection').innerHTML=portalSelection(p,autoViewButtons(p),escapeHtml)??`<div class="selection-top"><button class="selection-back" type="button">← Todos os espaços</button><button class="selection-close" type="button" aria-label="Fechar detalhes">×</button></div><img class="selection-image${p.kind==='parking'?' parking-image':''}" src="${imageFor(p)}" alt="${p.name}, referência do projeto"><div class="selection-photo-label">${p.photoCaption||(p.id==='estrutura-e-acesso'?'Vista aérea do parque':'Imagem do projeto')}</div><div class="selection-copy"><div class="selection-tag">${category(p)}</div><h2 tabindex="-1">${p.name}</h2>${autoViewButtons(p)}<p>${p.description}</p>${guideHtml(p,places)}${p.url?`<a class="primary-link" data-destination="${p.id}" href="${p.url}" target="_top">Conhecer o espaço <span aria-hidden="true">↗</span></a>`:''}<div class="selection-location"><strong>Você está explorando</strong>${p.zone||'Parque Novo Mato Grosso'}<br>Selecione um destino para localizá-lo no mapa.</div><div class="nearby"><p>POR PERTO</p>${nearest.map(n=>`<button data-nearby="${n.id}">${n.name} ↗</button>`).join('')}</div></div>`;
 toggleList(false);$('#selection').scrollTop=0;$('#announcement').textContent=id===portalSpaceId?`${p.name}: use os controles para explorar em 3D.`:p.url?`${p.name} selecionado. Use Conhecer o espaço para abrir a página.`:`${p.name} selecionado. Veja a localização e os detalhes no mapa.`;
 const u=new URL(location.href);u.searchParams.set('espaco',id);history.replaceState(null,'',u);
 if(focus){const url=new URL(location.href);url.searchParams.delete('detalhe');history.replaceState(null,'',url);mapApi?.focus(p);}else mapApi?.render();
 if(lastTrigger?.matches('button')&&lastTrigger.matches(':focus-visible'))$('#selection h2').focus({preventScroll:true});
}
function closeSelection(returnFocus=true){selectedId=null;autoDetail=null;$('#selection').hidden=true;$('#browse-panel').hidden=false;$('.explorer').classList.remove('has-selection');const u=new URL(location.href);u.searchParams.delete('espaco');u.searchParams.delete('detalhe');history.replaceState(null,'',u);mapApi?.render();if(returnFocus&&lastTrigger?.isConnected)lastTrigger.focus({preventScroll:true});}
$('#search').addEventListener('input',e=>{query=e.target.value;drawList();});
$('.filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));drawList();mapApi?.overview();$('#announcement').textContent=$('#list-count').textContent;});
$('#place-list').addEventListener('click',e=>{const b=e.target.closest('[data-locate]');if(b)activatePlace(b.dataset.locate);});
$('#selection').addEventListener('click',e=>{const light=e.target.closest('[data-auto-light]');if(light){mapApi?.setNight(light.dataset.autoLight==='entardecer');return;}const detail=e.target.closest('[data-detail-view]');if(detail){if(mapApi)mapApi.focusDetail(detail.dataset.detailView||null);return;}if(e.target.closest('[data-show-access]')){showAccessList();return;}if(e.target.closest('.selection-close,.selection-back')){closeSelection();mapApi?.overview();}const b=e.target.closest('[data-nearby]');if(b)activatePlace(b.dataset.nearby);});
$('.mobile-list-open').addEventListener('click',()=>{if(selectedId)closeSelection(false);toggleList(true);$('#search').focus({preventScroll:true});});
$('.mobile-list-close').addEventListener('click',()=>{toggleList(false);$('.mobile-list-open').focus({preventScroll:true});});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSelection();toggleList(false);mapApi?.overview();}if(e.key==='Tab'&&mobile()&&$('.explorer').classList.contains('list-open')){const els=[...$('#places').querySelectorAll('button,a,input')].filter(x=>x.offsetParent);const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
function showAccessList(){
 closeSelection(false);filter='Acessos';query='';$('#search').value='';
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
 $('.explorer').classList.remove('sidebar-collapsed');drawList();mapApi?.overview();
 if(mobile())toggleList(true);$('#search').focus({preventScroll:true});
}
const sidebarToggle=$('#sidebar-toggle');
if(sidebarToggle)sidebarToggle.addEventListener('click',()=>{
 const exp=$('.explorer');exp.classList.toggle('sidebar-collapsed');const col=exp.classList.contains('sidebar-collapsed');
 sidebarToggle.setAttribute('aria-label',col?'Expandir lista de espaços':'Recolher lista de espaços');sidebarToggle.title=col?'Expandir lista de espaços':'Recolher lista de espaços';
 setTimeout(()=>{if(selectedId)mapApi?.focus(places.find(p=>p.id===selectedId));else mapApi?.overview();},280);
});
drawList();
const requestedSpace=new URLSearchParams(location.search).get('espaco');
if(places.some(p=>p.id===requestedSpace))selectPlace(requestedSpace,false);
bindHostBridge({places,onChange:()=>{drawList();if(selectedId)selectPlace(selectedId,false);}});
const timer=setTimeout(()=>{$('#loading strong').textContent='Preparando os detalhes…';},4500);

async function init(){
 const [T,{OrbitControls},{createMiniatures,world,loadMaterials,createBackdropGeometry,getWaterTexture,waterUniforms},{createRendering},{fitDistance,fitOrtho},{foliageUniforms}]=await Promise.all([import('three'),import('three/addons/controls/OrbitControls.js'),import('./miniatures.js?v=gta-realismo-20260916-1'),import('./rendering.js?v=gta-realismo-20260916-1'),import('./camera-math.js?v=espacos-arquitetura-20260913-2'),import('./folhagem.js?v=gta-realismo-20260916-1')]);
 const host=$('#map'),stage=$('#map-stage'),scene=new T.Scene(),overlay=new T.Scene();
 const perspective=new T.PerspectiveCamera(38,1,5,10000),topCamera=new T.OrthographicCamera(-600,600,500,-500,1,8000);
 let camera=perspective,view='3d',tilted=true,buildings=true,hoveredId=null,animation=null,frame=0,disposed=false,activeTween=0,overviewDistance=2000;
 const engine=createRendering(scene,camera,mobile()),renderer=engine.renderer;
 host.appendChild(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);
 Object.assign(controls,{enableDamping:false,minPolarAngle:.22,maxPolarAngle:1.36,rotateSpeed:.45,zoomSpeed:.8,minDistance:24,maxDistance:5000,minZoom:.65,maxZoom:10,enablePan:true,screenSpacePanning:true});
 controls.touches.ONE=T.TOUCH.ROTATE;controls.touches.TWO=T.TOUCH.DOLLY_PAN;
 const built=createMiniatures({smallScreen:mobile()});scene.add(built.root);engine.setLightSources([...built.autodromeFinish.lamps,...built.scenario.lamps]);const parkIllumination=createParkIllumination(built.root,[...built.autodromeFinish.lamps,...built.scenario.lamps]);let solarControls=null;
 window._mapDebug={get camera(){return camera;},controls,render:()=>render(),scene,world,get state(){return {version:'cenario-integral-20260914-2',solar:solarControls?.state(),selectedId,detail:autoDetail,view,tilted,buildings,nightAuto};},get diagnostics(){return {...engine.diagnostics(),scenario:built.scenario.diagnostics(),parkIllumination:parkIllumination.diagnostics()};}};
 const floor=new T.Mesh(createBackdropGeometry(),built.groundMaterial);floor.position.y=-.3;floor.receiveShadow=true;scene.add(floor);
 const imageShadows=new T.Mesh(new T.PlaneGeometry(1174,1115),new T.ShadowMaterial({color:'#14251e',opacity:.3,depthWrite:false}));imageShadows.rotation.x=-Math.PI/2;imageShadows.position.copy(world([624,566],.22));imageShadows.receiveShadow=true;imageShadows.renderOrder=20;imageShadows.visible=false;scene.add(imageShadows);
 const textures=[parkIllumination.texture],textureLoader=new T.TextureLoader(),layerPromises=new Map();let satellite=null;const texturePromises=new Map();
 async function loadTexture(url){if(texturePromises.has(url))return texturePromises.get(url);const promise=textureLoader.loadAsync(url).then(tex=>{tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),16);textures.push(tex);return tex;});texturePromises.set(url,promise);return promise;}
 function imageTile(tex,corners,height,opacity=1){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(corners.flatMap(p=>world(p,height).toArray()),3));geo.setAttribute('uv',new T.Float32BufferAttribute([0,1,1,1,0,0,1,0],2));geo.setIndex([0,2,1,1,2,3]);geo.computeVertexNormals();return new T.Mesh(geo,new T.MeshBasicMaterial({map:tex,toneMapped:false,transparent:true,opacity,depthWrite:false,side:T.DoubleSide}));}
 async function createImageLayer(kind){
  if(kind==='3d')return;
  if(kind!=='satellite')throw new Error('Visualização indisponível.');
  if(layerPromises.has(kind))return layerPromises.get(kind);
  const promise=(async()=>{
   const response=await fetch('./assets/orthophoto/tiles.json?v=7');if(!response.ok)throw new Error('A base aérea não carregou.');const data=await response.json(),group=new T.Group();
   const tiles=await Promise.all(data.tiles.map(async tile=>{const tex=await loadTexture(mobile()?tile.mobileUrl:tile.url);const mesh=imageTile(tex,tile.corners,-.4+tile.order*.006);mesh.renderOrder=tile.order;return mesh;}));
   tiles.forEach(m=>group.add(m));group.visible=false;satellite=group;scene.add(group);
  })();layerPromises.set(kind,promise);
  try{await promise;}catch(e){layerPromises.delete(kind);throw e;}
 }
 const selectables=[],outlines=[],markers=new Map(),markerHeights=new Map();built.models.forEach((g,id)=>markerHeights.set(id,new T.Box3().setFromObject(g).max.y+2));
 places.filter(p=>p.mapMarker!==false).forEach(p=>{
  const radius=p.id==='roda-gigante'?28:p.id==='agroplace'?23:p.id==='arvore-da-vida'?11:p.id==='portico-de-entrada'?35:20;
  const points=p.footprint||Array.from({length:32},(_,i)=>[p.position[0]+Math.cos(i/32*Math.PI*2)*radius,p.position[1]+Math.sin(i/32*Math.PI*2)*radius]);
  const polygons=p.selectionPolygons||[[points]];
  for(const rings of polygons){
   const makePath=(ring,Type)=>{const path=new Type();ring.forEach((point,i)=>{const v=world(point);i?path.lineTo(v.x,-v.z):path.moveTo(v.x,-v.z);});path.closePath();return path;};
   const shape=makePath(rings[0],T.Shape);shape.holes=rings.slice(1).map(r=>makePath(r,T.Path));
   const geo=new T.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);
   const fill=new T.Mesh(geo,new T.MeshBasicMaterial({color:colors[p.category],transparent:true,opacity:0,depthWrite:false,depthTest:false,side:T.DoubleSide,toneMapped:false}));
   fill.position.y=1.8;fill.userData.placeId=p.id;overlay.add(fill);selectables.push(fill);
   for(const ring of rings){const line=new T.LineLoop(new T.BufferGeometry().setFromPoints(ring.map(pt=>world(pt,2))),new T.LineBasicMaterial({color:'#f6eac8',transparent:true,opacity:0,depthWrite:false,depthTest:false,toneMapped:false}));line.userData.placeId=p.id;overlay.add(line);outlines.push(line);}
  }
  const m=document.createElement('div');m.className=p.kind==='parking'?'marker parking-marker':'marker';m.dataset.id=p.id;m.style.setProperty('--color',colors[p.category]);m.innerHTML=`<button type="button" aria-label="Localizar ${p.name}" title="${p.name}"><i aria-hidden="true"></i><span class="pin-name">${p.shortLabel||p.name}</span></button><span class="pin-stem" aria-hidden="true"></span>`;
  m.querySelector('button').addEventListener('click',()=>activatePlace(p.id));m.addEventListener('pointerenter',()=>{hoveredId=p.id;render();});m.addEventListener('pointerleave',()=>{hoveredId=null;render();});m.addEventListener('focusin',()=>{hoveredId=p.id;render();});m.addEventListener('focusout',()=>{hoveredId=null;render();});$('#markers').appendChild(m);markers.set(p.id,m);
 });
 const raycaster=new T.Raycaster(),mouse=new T.Vector2();let pointerStart=null;
 function hit(e){const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);const objects=buildings?[...built.models.values(),...selectables]:selectables;return raycaster.intersectObjects(objects,true).find(h=>visible.has(h.object.userData.placeId)||h.object.userData.placeId===selectedId)?.object.userData.placeId;}
 renderer.domElement.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};renderer.domElement.classList.add('grabbing');activeTween++;});
 renderer.domElement.addEventListener('pointerup',e=>{renderer.domElement.classList.remove('grabbing');if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)<7){const id=hit(e);if(id)activatePlace(id);}pointerStart=null;});
 renderer.domElement.addEventListener('pointercancel',()=>{pointerStart=null;renderer.domElement.classList.remove('grabbing');});
 renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')return;const id=hit(e);if(id!==hoveredId){hoveredId=id;renderer.domElement.style.cursor=id?'pointer':'grab';render();}});
 renderer.domElement.addEventListener('pointerleave',()=>{hoveredId=null;render();});
 function updateMarkers(){
  const width=stage.clientWidth,height=stage.clientHeight,rects=[],scale=camera.isPerspectiveCamera?overviewDistance/camera.position.distanceTo(controls.target):camera.zoom;
  // Reserve the visible toolbar areas before placing labels.
  for(const el of stage.querySelectorAll('.mode-switch,.scene-settings,.compass,.map-caption,.solar-controls,.solar-date-panel,.mobile-list-open')){if(el.hidden||!el.getClientRects().length)continue;const r=el.getBoundingClientRect(),s=stage.getBoundingClientRect();rects.push({l:r.left-s.left,r:r.right-s.left,t:r.top-s.top,b:r.bottom-s.top});}
  const priority=places.filter(p=>markers.has(p.id)).sort((a,b)=>((b.id===selectedId?100:0)+(b.id===hoveredId?50:0)+(b.featured?15:0))-((a.id===selectedId?100:0)+(a.id===hoveredId?50:0)+(a.featured?15:0)));
  for(const p of priority){
   const m=markers.get(p.id),isActive=p.id===selectedId||p.id===hoveredId;
   m.querySelector('.pin-name').textContent=isActive?p.name:(p.shortLabel||p.name);
   const detail=p.id===selectedId?detailView(built.models.get(p.id),p.id,autoDetail):null;
   const anchor=detail?detail.footprint.reduce((a,pt)=>[a[0]+pt[0]/detail.footprint.length,a[1]+pt[1]/detail.footprint.length],[0,0]):p.position;
   const anchorHeight=detail?detail.height+1:Math.min(Math.max(markerHeights.get(p.id),p.height+2),64);
   const v=world(anchor,buildings?anchorHeight:2).project(camera),x=(v.x+1)/2*width,y=(1-v.y)/2*height;
   const showing=(visible.has(p.id)||p.id===selectedId)&&v.z>=-1&&v.z<=1&&x>18&&x<width-18&&y>100&&y<height-(mobile()&&selectedId?height*.43:80);
   m.hidden=!showing;if(!showing)continue;m.style.left=x+'px';m.style.top=y+'px';m.classList.toggle('selected',p.id===selectedId);m.style.zIndex=isActive?'50':'10';
   let full=isActive||p.featured||p.kind==='parking'||scale>2.6;if(mobile()&&!isActive&&p.kind!=='parking'&&scale<2.6)full=['autodromo','roda-gigante','arena-show','centro-de-eventos'].includes(p.id);
   m.classList.toggle('compact',!full);let mw=m.offsetWidth,mh=m.offsetHeight,r={l:x-mw/2,r:x+mw/2,t:full?y-mh:y-18,b:full?y:y+18};
   const collision=rects.some(a=>r.l<a.r+9&&r.r>a.l-9&&r.t<a.b+8&&r.b>a.t-8);
   if(!isActive&&(r.l<12||r.r>width-12||collision)){m.classList.add('compact');r={l:x-18,r:x+18,t:y-18,b:y+18};if(rects.some(a=>r.l<a.r+4&&r.r>a.l-4&&r.t<a.b+4&&r.b>a.t-4)){m.hidden=true;continue;}}
   rects.push(r);
  }
  const center=controls.target.clone().project(camera),north=controls.target.clone().add(new T.Vector3(...sunDirection(0,0)).multiplyScalar(100)).project(camera);
  const angle=Math.atan2((north.x-center.x)*width,(north.y-center.y)*height)*180/Math.PI;
  $('#north svg').style.transform=`rotate(${angle}deg)`;
 }
 function paint(){frame=0;if(disposed)return;selectables.forEach(m=>{const id=m.userData.placeId;m.material.opacity=id===selectedId?.065:id===hoveredId?.035:0;});outlines.forEach(m=>{m.material.opacity=m.userData.placeId===selectedId?.9:m.userData.placeId===hoveredId?.45:0;});engine.render(view,overlay);updateMarkers();}
 function render(){if(!frame)frame=requestAnimationFrame(paint);}
 controls.addEventListener('change',render);controls.addEventListener('start',()=>{activeTween++;engine.setInteracting(true);});controls.addEventListener('end',()=>{engine.setInteracting(false);engine.focusShadow(controls.target,camera.position.distanceTo(controls.target)*.62);render();});
  let lastWaterTime=performance.now();
  function waterLoop(now){
   if(disposed)return;
   if(view==='3d'&&!document.hidden){
    const elapsed=now-lastWaterTime;
    const interval=mobile()?35:16;
    if(elapsed>=interval){
     const dt=Math.min(elapsed/1000,0.1);
     lastWaterTime=now;
     const t=now*0.001;
     if(waterUniforms)waterUniforms.uTime.value=t;
     if(foliageUniforms)foliageUniforms.uTime.value=t;
     const wt=getWaterTexture();
     if(wt){
      wt.offset.x=(wt.offset.x+dt*0.014)%1;
      wt.offset.y=(wt.offset.y+dt*0.009)%1;
     }
     render();
    }
   }
   requestAnimationFrame(waterLoop);
  }
  requestAnimationFrame(waterLoop);
 const corners=[[72,14],[1176,14],[1176,1118],[72,1118]].flatMap(p=>[world(p),world(p,24)]);
 const defaultDirection=new T.Vector3(-.94,.62,.29).normalize();
 let fitFrame={width:1,height:1};
 function viewport(focused=false){
  const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);camera.aspect=w/h;camera.clearViewOffset();fitFrame={width:1,height:1};
  if(focused){
   const sr=stage.getBoundingClientRect();let top=16,bottom=h-18;
   for(const el of stage.querySelectorAll('.mode-switch,.map-caption,.scene-settings'))if(!el.hidden&&el.offsetHeight)top=Math.max(top,el.getBoundingClientRect().bottom-sr.top+16);
   if(mobile()&&selectedId){const panel=$('#places').getBoundingClientRect();bottom=Math.min(bottom,panel.top-sr.top-16);}else bottom=h-92;
   top=Math.min(top,h*.32);bottom=Math.max(bottom,top+h*.2);
   const center=(top+bottom)/2;fitFrame.height=Math.max(.2,(bottom-top)/h);
   camera.setViewOffset(w,h,0,h/2-center,w,h);
  }
  camera.updateProjectionMatrix();engine.resize(w,h);return w/h;
 }
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
 function placeBounds(p){
  const bounds=new T.Box3().setFromObject(built.models.get(p.id));
  const radius=p.id==='portico-de-entrada'?38:28;
  for(const pt of p.footprint||[[p.position[0]-radius,p.position[1]-radius],[p.position[0]+radius,p.position[1]+radius]])bounds.expandByPoint(world(pt));
  if(!buildings)bounds.max.y=2;
  return bounds;
 }
 function focus(p){
  const detail=detailView(built.models.get(p.id),p.id,autoDetail);
  const bounds=detail?new T.Box3().setFromPoints(detail.footprint.flatMap(pt=>[world(pt,0),world(pt,detail.height)])):placeBounds(p),target=bounds.getCenter(new T.Vector3()),points=[];
  if(detail)points.push(...detail.footprint.flatMap(pt=>[world(pt,0),world(pt,detail.height)]));
  else for(const x of [bounds.min.x,bounds.max.x])for(const z of [bounds.min.z,bounds.max.z])for(const y of [0,bounds.max.y])points.push(new T.Vector3(x,y,z));
  const aspect=viewport(true),from=camera.position.clone(),fromTarget=controls.target.clone(),off=camera.position.clone().sub(controls.target),z0=camera.zoom;
  let to,zoom=1;
  if(tilted){
   const focusDirection=detail?.direction||p.focusDirection;const direction=focusDirection?new T.Vector3(...focusDirection).normalize():off.normalize();
   const fitted=camera.clone();fitted.position.copy(target).add(direction);fitted.lookAt(target);
   const distance=Math.max(detail?24:100,fitDistance(fitted,target,points,aspect,mobile()?1.06:detail?1.1:1.4,fitFrame));
   to=target.clone().addScaledVector(direction,distance);
  }
  else{to=target.clone().add(off);const inverse=camera.quaternion.clone().invert(),locals=points.map(v=>v.clone().sub(target).applyQuaternion(inverse));const need=Math.max(30,...locals.map(v=>Math.max(Math.abs(v.y)/fitFrame.height,Math.abs(v.x)/aspect)))*(mobile()?1.08:1.55);zoom=Math.min(10,camera.top/need);}
  const token=++activeTween,start=performance.now(),duration=reduced?0:850;
  function step(now){if(disposed||token!==activeTween)return;const t=duration?Math.min((now-start)/duration,1):1,e=1-Math.pow(1-t,3);camera.position.lerpVectors(from,to,e);controls.target.lerpVectors(fromTarget,target,e);camera.zoom=z0+(zoom-z0)*e;camera.updateProjectionMatrix();controls.update();render();if(t<1)animation=requestAnimationFrame(step);else engine.focusShadow(controls.target,Math.max(100,camera.position.distanceTo(controls.target)*.62));}
  animation=requestAnimationFrame(step);
 }
 function zoom(factor){activeTween++;if(tilted){const off=camera.position.clone().sub(controls.target),distance=T.MathUtils.clamp(off.length()/factor,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(off.setLength(distance));controls.update();}else{camera.zoom=T.MathUtils.clamp(camera.zoom*factor,.65,10);camera.updateProjectionMatrix();}engine.focusShadow(controls.target,camera.position.distanceTo(controls.target)*.62);render();}
 $('#zoom-in').addEventListener('click',()=>zoom(1.28));$('#zoom-out').addEventListener('click',()=>zoom(1/1.28));
 $('#rotate').addEventListener('click',()=>{activeTween++;if(!tilted)return;const off=camera.position.clone().sub(controls.target).applyAxisAngle(new T.Vector3(0,1,0),Math.PI/8);camera.position.copy(controls.target).add(off);controls.update();render();});
 const reset=()=>{closeSelection(false);overview();};$('#reset').addEventListener('click',reset);$('#north').addEventListener('click',reset);
  function updateLayers(){
   built.autodromeFinish.setVisible(view,buildings);built.autodromeFinish.setNight(nightAuto&&view==='3d');
   built.scenario.setVisible(view,buildings);built.scenario.setNight(nightAuto&&view==='3d');parkIllumination.setNight(nightAuto&&view==='3d');solarControls?.setView(view);
   built.landscape.visible=view==='3d';built.vegetation.visible=view==='3d';built.infrastructure.visible=buildings;built.water.visible=view==='3d';built.modelLayer.visible=buildings;built.circuits.visible=view==='3d'||buildings;floor.visible=view==='3d';imageShadows.visible=view!=='3d'&&buildings;
   if(satellite)satellite.visible=view==='satellite';
   $('#map-credit').textContent=view==='satellite'?'Imagem aérea de referência · Projeto PNMT':'Maquete do parque · Paisagismo e iluminação ilustrativos';
   $('.map-caption div>span').textContent=view==='satellite'?'O território e os espaços do projeto':'Explore a arquitetura e os espaços';
   stage.dataset.view=view;$('#buildings').setAttribute('aria-pressed',String(buildings));renderer.shadowMap.needsUpdate=true;
  }
  $('#tilt').addEventListener('click',()=>{tilted=!tilted;overview();if(selectedId)focus(places.find(p=>p.id===selectedId));});
  $('#buildings').addEventListener('click',()=>{buildings=!buildings;updateLayers();if(selectedId)focus(places.find(p=>p.id===selectedId));render();});
  let requestedView=0;
  document.querySelectorAll('.mode-switch button[data-view]').forEach(b=>b.addEventListener('click',async()=>{
   const token=++requestedView;try{stage.setAttribute('aria-busy','true');b.classList.add('is-loading');await createImageLayer(b.dataset.view);if(token!==requestedView)return;view=b.dataset.view;tilted=true;buildings=true;updateLayers();document.querySelectorAll('.mode-switch button[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));overview();if(selectedId)focus(places.find(p=>p.id===selectedId));$('#announcement').textContent=`Visualização ${b.textContent} aberta.`;
   }catch(e){$('#announcement').textContent='Não foi possível carregar essa vista. Tente novamente.';console.error(e);}finally{b.classList.remove('is-loading');if(token===requestedView)stage.removeAttribute('aria-busy');}
  }));
 let resizeW=0,resizeH=0;
 const resize=new ResizeObserver(()=>{if(stage.clientWidth===resizeW&&stage.clientHeight===resizeH)return;resizeW=stage.clientWidth;resizeH=stage.clientHeight;overview();if(selectedId)focus(places.find(p=>p.id===selectedId));});resize.observe(stage);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();showFallback();});
 function focusDetail(key){
  const p=places.find(p=>p.id===selectedId);if(!p)return;
  if(key&&!validDetail(p.id,key))return;
  autoDetail=key;const url=new URL(location.href);if(key)url.searchParams.set('detalhe',key);else url.searchParams.delete('detalhe');history.replaceState(null,'',url);view='3d';tilted=true;buildings=true;requestedView++;
  chooseCamera();updateLayers();document.querySelectorAll('.mode-switch button[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view==='3d')));
  document.querySelectorAll('[data-detail-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.detailView===(key||''))));
  $('#announcement').textContent=detailLabel(p.id,key)+'.';
  focus(p);
 }
 function setNight(value){solarControls?.set(value?'noite':'tarde');}
 mapApi={render,focus,overview,focusDetail,setNight,focusAutoDetail:focusDetail};
 solarControls=mountSolarControls(stage,state=>{
  nightAuto=state.lightsOn;
  engine.setSolar(state);
  if(waterUniforms)waterUniforms.uSunDir.value.fromArray(state.direction).normalize();
  if(foliageUniforms)foliageUniforms.uSunDir.value.fromArray(state.direction).normalize();
  updateLayers();
  render();
 },render);
 overview();updateLayers();solarControls.apply();
 // A vista 3D abre com o terreno verde; a ortofoto só carrega ao abrir Satélite.
 await Promise.allSettled([engine.loadEnvironment(),loadMaterials(renderer).then(ts=>textures.push(...ts))]);
 if(disposed)return;updateLayers();clearTimeout(timer);$('#loading').classList.add('fade-out');setTimeout(()=>{$('#loading').hidden=true;},350);renderer.shadowMap.needsUpdate=true;render();reportMapReady();
 const incoming=new URLSearchParams(location.search),requested=incoming.get('espaco'),detail=incoming.get('detalhe');if(places.some(p=>p.id===requested))selectPlace(requested);if(validDetail(requested,detail))focusDetail(detail);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){activeTween++;cancelAnimationFrame(frame);frame=0;}else render();});
 window.addEventListener('pagehide',()=>{disposed=true;activeTween++;cancelAnimationFrame(frame);cancelAnimationFrame(animation);resize.disconnect();solarControls?.dispose();controls.dispose();textures.forEach(t=>t.dispose());for(const layer of [scene,overlay])layer.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});engine.dispose();});
}
function showFallback(){reportPortalFallback();mapApi=null;$('.explorer').classList.add('fallback-open');clearTimeout(timer);$('#loading').hidden=true;$('#fallback').hidden=false;$('#markers').hidden=true;$('.map-caption').hidden=true;$('.map-hint').hidden=true;document.querySelectorAll('.map-controls button,.scene-settings button,[data-view],.compass,[data-detail-view],[data-auto-light]').forEach(b=>b.disabled=true);$('.mobile-list-open').style.removeProperty('display');}
init().catch(error=>{console.error('Não foi possível abrir a maquete.',error);showFallback();});
