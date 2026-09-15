/* Compatibilidade para #mapa: reutiliza o mesmo visualizador público. */
(() => {
 class PNMTMapViewer {
  constructor(container){
   this.container=container;
   const frame=document.createElement('iframe');this.frame=frame;
   const url=new URL('pnmt-mapa/index.html',location.href);url.searchParams.set('v','cenario-integral-20260914-2');url.searchParams.set('embed','1');url.searchParams.set('portal','overview');
   frame.src=url.href;frame.title='Mapa 3D e vista aérea do Parque Novo Mato Grosso';frame.allowFullscreen=true;
   frame.style.cssText='display:block;width:100%;height:clamp(520px,76vh,850px);border:0;border-radius:16px;background:#71845e';
   container.replaceChildren(frame);
   this.onMessage=event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=='pnmt:navigate')return;
    const id=event.data.id;if(!/^[a-z0-9-]+$/.test(id||''))return;
    if(window.PNMT_CONTENT?.spaces?.some(p=>p.id===id))location.hash='espaco/'+id;
   };
   window.addEventListener('message',this.onMessage);
  }
  destroy(){window.removeEventListener('message',this.onMessage);this.frame?.remove();this.frame=null;}
 }
 window.PNMTMapViewer=PNMTMapViewer;
})();
