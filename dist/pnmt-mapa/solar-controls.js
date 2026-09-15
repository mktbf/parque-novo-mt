import {PERIODS,localDate,validDate,simulation,localParts} from './solar-model.js?v=cenario-integral-20260914-2';
const labels={manha:'Manhã',tarde:'Tarde','por-do-sol':'Pôr do sol',noite:'Noite'};
const paths={manha:'M3 17h18M5 13l-2-1m16 1 2-1M12 3v3M5 5l2 2m10 0 2-2M7 17a5 5 0 0 1 10 0M12 10v5m-2-2 2-2 2 2',tarde:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0','por-do-sol':'M3 17h18M5 13l-2-1m16 1 2-1M12 3v5m-2-2 2 2 2-2M7 17a5 5 0 0 1 10 0M5 21h14',noite:'M20 15a8 8 0 0 1-11-11 8.5 8.5 0 1 0 11 11Z'};
const icon=d=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const storageKey='pnmt-solar-01';
export function mountSolarControls(stage,onChange,onLayout=()=>{}){
 const url=new URL(location.href);let stored={};try{stored=JSON.parse(sessionStorage.getItem(storageKey)||'{}');}catch{}
 let day=validDate(url.searchParams.get('data'))?url.searchParams.get('data'):validDate(stored.date)?stored.date:localDate();
 let period=PERIODS.includes(url.searchParams.get('periodo'))?url.searchParams.get('periodo'):url.searchParams.get('atmosfera')==='entardecer'?'por-do-sol':PERIODS.includes(stored.period)?stored.period:'tarde';
 const root=document.createElement('section');root.className='solar-controls';root.setAttribute('aria-label','Luz do parque');
 root.innerHTML=`<div class="solar-periods" role="group" aria-label="Período do dia">${PERIODS.map(p=>`<button type="button" data-period="${p}" aria-pressed="false" title="${labels[p]}" aria-label="${labels[p]}">${icon(paths[p])}<span>${labels[p]}</span></button>`).join('')}</div><button type="button" class="solar-date-toggle" aria-expanded="false" aria-controls="solar-date-panel" title="Escolher a data da simulação" aria-label="Escolher a data da simulação">${icon('M7 3v4m10-4v4M3 10h18M4 5h16v16H4Z')}<span class="solar-time"></span></button><div id="solar-date-panel" class="solar-date-panel" hidden><strong>Luz ao longo do ano</strong><label>Escolher data<input type="date" min="2000-01-01" max="2100-12-31" value="${day}"></label><button type="button" class="solar-today">Usar hoje</button><p class="solar-summary"></p><small>Horário de Cuiabá. Simulação solar; o clima pode variar.</small></div><span class="sr-only solar-status" aria-live="polite"></span>`;
 stage.appendChild(root);
 const input=root.querySelector('input'),toggle=root.querySelector('.solar-date-toggle'),panel=root.querySelector('.solar-date-panel');
 function close(){panel.hidden=true;toggle.setAttribute('aria-expanded','false');onLayout();}
 function set(nextPeriod=period,nextDay=day,persist=true){
  if(!PERIODS.includes(nextPeriod)||!validDate(nextDay))return;
  period=nextPeriod;day=nextDay;const state=simulation(day,period);input.value=day;
  root.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.period===period)));
  root.querySelector('.solar-time').textContent=state.localTime;toggle.setAttribute('aria-label',`${labels[period]}, ${state.localTime}. Escolher data.`);
  const fmt=iso=>{const p=localParts(new Date(iso));return `${p.hour}:${p.minute}`;};
  root.querySelector('.solar-summary').textContent=`Nascer do sol ${fmt(state.events.sunrise)} · Pôr do sol ${fmt(state.events.sunset)}`;
  root.querySelector('.solar-status').textContent=`${labels[period]}, ${state.localTime}, ${day.split('-').reverse().join('/')}.`;
  if(persist){try{sessionStorage.setItem(storageKey,JSON.stringify({date:day,period}));}catch{}const u=new URL(location.href);u.searchParams.set('periodo',period);u.searchParams.set('data',day);u.searchParams.delete('atmosfera');history.replaceState(null,'',u);}
  onChange(state);onLayout();return state;
 }
 const click=e=>{const b=e.target.closest('[data-period]');if(b)set(b.dataset.period);if(e.target.closest('.solar-date-toggle')){panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));onLayout();}if(e.target.closest('.solar-today'))set(period,localDate());};
 const change=()=>{if(validDate(input.value)){input.setCustomValidity('');set(period,input.value);}else{input.setCustomValidity('Escolha uma data entre 2000 e 2100.');input.reportValidity();}};
 const outside=e=>{if(!root.contains(e.target))close();};const key=e=>{if(e.key==='Escape'&&!panel.hidden){e.stopPropagation();close();toggle.focus();}};
 root.addEventListener('click',click);input.addEventListener('change',change);root.addEventListener('keydown',key);document.addEventListener('pointerdown',outside);
 return {apply:()=>set(period,day),set,state:()=>simulation(day,period),setView:view=>{root.hidden=view!=='3d';if(root.hidden)close();},dispose(){document.removeEventListener('pointerdown',outside);root.remove();}};
}
