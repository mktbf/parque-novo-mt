import './explore-parque.js';

/* Integração específica do site atual: #espacos, após o banner e antes dos cards. */
function insertMap(){
 const route=(location.hash.slice(1)||'inicio').split('?')[0];
 if(route!=='espacos')return;
 const main=document.getElementById('main');
 if(!main||main.querySelector('pnmt-explore'))return;
 const intro=main.querySelector('.page-intro');
 // Só insere quando o catálogo da página de espaços estiver presente.
 if(!intro||!main.querySelector('#space-results'))return;
 const block=document.createElement('pnmt-explore');block.id='explore-o-parque';
 intro.after(block);
}

function start(){
 const main=document.getElementById('main');if(!main)return;
 insertMap();
 // O roteador atual troca o conteúdo de main. O bloco acompanha esse ciclo.
 const observer=new MutationObserver(insertMap);observer.observe(main,{childList:true});
 const routeChanged=()=>queueMicrotask(insertMap);
 window.addEventListener('hashchange',routeChanged);
 window.addEventListener('pagehide',()=>{observer.disconnect();window.removeEventListener('hashchange',routeChanged);},{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
