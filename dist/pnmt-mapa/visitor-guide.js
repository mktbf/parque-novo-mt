/** Regras de busca e orientação. Não inferir operação de eventos a partir da geometria. */
export const normalizeText = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export const categoryLabel = place => place.category === 'Experiências' ? 'Lazer' : place.category;
export function findPlaces(places, filter, query) {
 const normalized=normalizeText(query);
 const code=normalized.match(/^(?:(?:estacionamento|bolsao)\s*)?e?\s*(\d{1,2})$/);
 const terms=normalized.split(/\s+/).filter(Boolean);
 return places.filter(p=>{
  if(filter!=='all'&&p.category!==filter)return false;
  if(code)return p.id===`estacionamento-e${Number(code[1])}`;
  const haystack=normalizeText([p.name,categoryLabel(p),p.zone,...(p.searchAliases||[])].join(' '));
  return terms.every(term=>haystack.includes(term));
 });
}
export const imageFor = p => p.image || `./assets/spaces/${p.id}.webp?v=7`;
export function relatedPlaces(p,places){
 if(p.relatedIds)return p.relatedIds.map(id=>places.find(x=>x.id===id)).filter(Boolean);
 return places.filter(q=>q.id!==p.id&&!q.parentId).sort((a,b)=>Math.hypot(a.position[0]-p.position[0],a.position[1]-p.position[1])-Math.hypot(b.position[0]-p.position[0],b.position[1]-p.position[1])).slice(0,3);
}
export function accessInfo(p){
 if(p.kind==='parking')return {title:'Antes de estacionar',text:'Confirme com a organização do seu evento qual estacionamento utilizar e siga a sinalização no local.'};
 if(p.id==='estrutura-e-acesso')return {title:'Planeje sua chegada',text:'Selecione um dos bolsões para ver sua localização. A liberação dos estacionamentos e dos portões depende de cada evento.'};
 if(p.id==='portico-de-entrada')return {title:'Entrada e destino',text:'O pórtico identifica a entrada principal. Para chegar ao seu setor, confira o estacionamento e o portão indicados pela organização do evento.'};
 if(p.id==='autodromo')return {title:'Acesso ao seu setor',text:'Arquibancadas, boxes e túnel de pedestres têm acessos específicos. Confira o setor e o portão indicados no ingresso ou nas orientações do evento.'};
 if(p.id==='arena-show')return {title:'Chegada à Arena',text:'Localize os estacionamentos próximos e confira qual deles foi indicado pela organização do seu evento.'};
 return null;
}
export function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function guideHtml(p,places){
 const info=accessInfo(p);
 const children=places.filter(x=>x.parentId===p.id);
 const lots=children.length?`<div class="parking-picker" aria-label="Escolher estacionamento">${children.map(x=>`<button type="button" data-nearby="${x.id}"><strong>${x.shortLabel}</strong><span>${escapeHtml(x.zone)}</span><span aria-hidden="true">↗</span></button>`).join('')}</div>`:'';
 return `${info?`<div class="access-note"><strong>${info.title}</strong><p>${info.text}</p></div>`:''}${lots}${info&&!children.length?'<button class="access-browse" type="button" data-show-access>Ver estacionamentos e entrada <span aria-hidden="true">↗</span></button>':''}`;
}
