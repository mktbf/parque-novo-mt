/* Bloco independente: não altera estilos, roteador ou dados do site principal. */
const assets=new URL('./',import.meta.url),siteRoot=new URL('../',import.meta.url);
const safeHref=value=>{
 try{const url=new URL(value,siteRoot);return url.origin===location.origin&&['http:','https:'].includes(url.protocol)?url.href:null;}
 catch{return null;}
};

class ParqueExplorer extends HTMLElement{
 connectedCallback(){
  if(this._mounted)return;this._mounted=true;this._active=false;this._routes=null;
  const shadow=this.shadowRoot||this.attachShadow({mode:'open'});
  shadow.innerHTML=`<style>
   :host{display:block;color:#0c2340;font-family:Barlow,Arial,sans-serif;scroll-margin-top:32px}
   *{box-sizing:border-box}[hidden]{display:none!important}
   section{max-width:1600px;margin:0 auto;padding:60px 5vw 16px}
   header{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:24px}
   h2{font-size:clamp(2rem,3.1vw,3rem);line-height:1.12;letter-spacing:-.035em;margin:0 0 12px;font-weight:700}
   p{font-size:1.0625rem;line-height:1.5;color:#5c7081;margin:0;max-width:620px}
   .actions{display:flex;align-items:center;gap:16px;flex-shrink:0;flex-wrap:wrap}
   button,a{font:inherit;font-size:.9375rem;font-weight:700;line-height:1.3;min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;cursor:pointer;border-radius:8px}
   a{color:#0c2340;padding:8px 0}button{padding:12px 20px;border:1px solid #bfcbd5;background:#fff;color:#0c2340}
   a:focus-visible,button:focus-visible{outline:3px solid #45b847;outline-offset:4px}
   .viewport{height:clamp(560px,72svh,760px);min-height:0;position:relative;overflow:hidden;border-radius:18px;border:1px solid #d7e0e3;background:#c8d8c0;box-shadow:0 18px 54px #0c23400d}
   iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#c8d8c0}
   .lock{position:absolute;inset:0;z-index:2;display:flex;align-items:flex-end;justify-content:center;padding:26px;background:linear-gradient(transparent 80%,#0c234014)}
   .activate{border:1px solid #bad6b6;background:#0c2340;color:white;box-shadow:0 7px 24px #0c234035;padding:15px 24px;border-radius:50px}
   .activate:hover{background:#18436d}.activate span{color:#72d261;font-size:20px}
   .note{font-size:.875rem;margin-top:13px;color:#627586}
   .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
   @media(max-width:760px){
    section{padding:36px 18px 8px}header{align-items:flex-start;gap:15px;flex-direction:column;margin-bottom:18px}
    h2{font-size:2rem;margin-bottom:10px}p{font-size:1rem}.actions{width:100%;justify-content:space-between}
    .viewport{height:clamp(490px,calc(100svh - 140px),640px);border-radius:12px}.lock{padding:24px 18px}
    button,a{min-height:44px}.activate{font-size:.9375rem}.note{line-height:1.5}
   }
  </style><section aria-labelledby="explore-title">
   <header><div><h2 id="explore-title">Explore o Parque</h2><p>Veja onde fica cada espaço. Toque em uma atração para conhecer mais.</p></div>
    <div class="actions"><button class="release" type="button" hidden>Voltar à página</button><a class="expand" target="_blank" rel="noopener">Ampliar mapa <span aria-hidden="true">↗</span></a></div>
   </header>
   <div class="viewport"><div class="lock"><button class="activate" type="button"><span aria-hidden="true">⌖</span> Interagir com o mapa</button></div></div>
   <p class="note">As fotos e os detalhes de cada espaço continuam logo abaixo.</p><p class="sr" role="status" aria-live="polite"></p>
  </section>`;
  shadow.querySelector('.expand').href=new URL('index.html',assets).href;
  shadow.querySelector('.activate').addEventListener('click',()=>this.activate());
  shadow.querySelector('.release').addEventListener('click',()=>this.release());
  this._message=event=>{
   if(!this._frame||event.source!==this._frame.contentWindow||event.origin!==location.origin)return;
   if(event.data?.type==='pnmt:bridge-ready')this._configureFrame();
   else if(event.data?.type==='pnmt:release')this.release();
   else if(event.data?.type==='pnmt:navigate')this._navigate(event.data.id);
  };
  window.addEventListener('message',this._message);
  fetch(new URL('rotas.json',assets)).then(r=>{if(!r.ok)throw Error('Rotas indisponíveis');return r.json();}).then(routes=>{
   if(!this.isConnected)return;
   const current=window.PNMT_CONTENT?.spaces;
   if(Array.isArray(current)){
    const ids=new Set(current.map(p=>p.id));
    routes=Object.fromEntries(Object.keys(routes).map(id=>[id,ids.has(id)?'#espaco/'+id:null]));
   }
   this.configure({routes});
  }).catch(()=>{});
  if('IntersectionObserver' in window){
   this._observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){this._start();this._observer.disconnect();}},{rootMargin:'220px'});
   this._observer.observe(this);
  }else this._start();
 }

 configure({routes}){
  this._routes=Object.fromEntries(Object.entries(routes||{}).map(([id,value])=>[id,value?safeHref(value):null]));
  this._configureFrame();
 }
 _configureFrame(){
  if(this._frame&&this._routes)this._frame.contentWindow?.postMessage({type:'pnmt:configure',routes:this._routes},location.origin);
 }
 _start(){
  if(this._frame||!this.isConnected)return;
  const frame=document.createElement('iframe');
  frame.title='Mapa interativo 3D do Parque Novo Mato Grosso';frame.tabIndex=-1;frame.inert=true;
  frame.setAttribute('aria-hidden','true');frame.style.pointerEvents='none';frame.referrerPolicy='same-origin';
  frame.addEventListener('load',()=>this._configureFrame());
  frame.src=new URL('index.html?embed=1',assets).href;this._frame=frame;
  this.shadowRoot.querySelector('.viewport').prepend(frame);
 }
 activate(){
  this._start();if(!this._frame)return;this._active=true;
  this._frame.inert=false;this._frame.tabIndex=0;this._frame.removeAttribute('aria-hidden');this._frame.style.pointerEvents='auto';
  this.shadowRoot.querySelector('.lock').hidden=true;this.shadowRoot.querySelector('.release').hidden=false;
  this.shadowRoot.querySelector('[role=status]').textContent='Mapa ativado. Arraste para girar, use os controles para aproximar e pressione Esc para voltar à página.';
  this._frame.focus();
 }
 release(){
  this._active=false;if(!this._frame)return;
  this._frame.inert=true;this._frame.tabIndex=-1;this._frame.setAttribute('aria-hidden','true');this._frame.style.pointerEvents='none';
  this.shadowRoot.querySelector('.lock').hidden=false;this.shadowRoot.querySelector('.release').hidden=true;
  this.shadowRoot.querySelector('[role=status]').textContent='Interação com o mapa pausada. Você pode continuar a página.';
  this.shadowRoot.querySelector('.activate').focus({preventScroll:true});
 }
 _navigate(id){
  if(!this._routes||typeof id!=='string'||!Object.hasOwn(this._routes,id))return;
  const href=this._routes[id];if(!href)return;
  const event=new CustomEvent('pnmt-navigate',{detail:{id,href},bubbles:true,composed:true,cancelable:true});
  if(this.dispatchEvent(event))window.location.assign(href);
 }
 disconnectedCallback(){
  this._observer?.disconnect();window.removeEventListener('message',this._message);
  if(this._frame){this._frame.src='about:blank';this._frame.remove();this._frame=null;}
  this._mounted=false;
 }
}

if(!customElements.get('pnmt-explore'))customElements.define('pnmt-explore',ParqueExplorer);
