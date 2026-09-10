/* Comunicação limitada à página que incorporou a maquete na mesma origem. */
const embedded=window.parent!==window;
const siteRoot=new URL('../',import.meta.url);
const send=(type,extra={})=>{if(embedded)window.parent.postMessage({type,...extra},location.origin);};

export function safeRoute(route){
 if(typeof route!=='string'||!route)return null;
 try{
  const url=new URL(route,siteRoot);
  if(url.origin!==location.origin||!['http:','https:'].includes(url.protocol))return null;
  return url.href.replace(/["'<>]/g,c=>encodeURIComponent(c));
 }catch{return null;}
}

export function bindHostBridge({places,onChange}){
 const byId=new Map(places.map(p=>[p.id,p]));let hostConfigured=false;
 const apply=routes=>{
  if(!routes||typeof routes!=='object')return;
  for(const place of places)place.url=Object.hasOwn(routes,place.id)?safeRoute(routes[place.id]):null;
  onChange();
 };
 const message=event=>{
  if(event.source!==window.parent||event.origin!==location.origin)return;
  if(event.data?.type==='pnmt:configure'){hostConfigured=true;apply(event.data.routes);}
 };
 const click=event=>{
  const link=event.target.closest('a[data-destination]');
  if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const place=byId.get(link.dataset.destination);if(!place?.url)return;
  event.preventDefault();
  if(embedded)send('pnmt:navigate',{id:place.id});else window.location.assign(place.url);
 };
 const key=event=>{if(event.key==='Escape'&&embedded)send('pnmt:release');};
 window.addEventListener('message',message);
 document.addEventListener('click',click);
 document.addEventListener('keydown',key);
 // Também permite abrir a maquete em uma aba própria, sem depender do iframe.
 fetch(new URL('./rotas.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Rotas indisponíveis');return r.json();}).then(routes=>{if(!hostConfigured)apply(routes);}).catch(()=>{});
 send('pnmt:bridge-ready');
 window.addEventListener('pagehide',()=>{
  window.removeEventListener('message',message);document.removeEventListener('click',click);document.removeEventListener('keydown',key);
 },{once:true});
}

export function reportMapReady(){send('pnmt:scene-ready');}
