// Rótulos públicos. Os enquadramentos vêm das construções no sistema da prancha.
export const detailOptions={
 'roda-gigante':[['pavilhao','Ver pavilhão e embarque'],['roda','Ver roda completa'],['passarela','Ver passarela'],['','Ver espaço completo']],
 'bmx':[['largada','Ver largadas'],['pista','Ver pista e relevo'],['','Ver BMX completo']],
 'casa-cuiabana':[['fachada','Ver fachada e praça'],['cobertura','Ver cobertura'],['','Ver Casa completa']],
 'autodromo':[['reta','Reta e arquibancada'],['aerea','Vista aérea'],['boxes','Ver boxes e torre'],['stand','Ver arquibancada'],['','Ver circuito completo']],
 'arena-show':[['cobertura','Ver cobertura'],['bilheteria','Ver bilheteria'],['','Ver Arena completa']],
 'portico-de-entrada':[['estrutura','Ver os arcos'],['','Ver acesso completo']],
 'kartodromo':[['boxes','Ver edifício dos boxes'],['grid','Ver grid de largada'],['arquibancada','Ver arquibancada'],['','Ver pista completa']],
 'skate-park':[['bowls','Ver bowls e apoios'],['street','Ver área de street'],['','Ver Skate completo']],
 'motocross':[['pista','Ver pista e relevo'],['largada','Ver gate de largada'],['saltos','Ver mesas e saltos'],['','Ver Motocross completo']],
 'arenas-beach':[['quadras','Ver quadras de areia e estádio'],['','Ver Arenas Beach completo']],
 'wake-park':[['circuito','Ver circuito de cabos'],['wake-bar','Ver Wake Bar e deque'],['','Ver Wake Park completo']],
 'splash-parque':[['brinquedos','Ver atrações aquáticas e quiosque'],['','Ver Splash completo']],
 'arvore-da-vida':[['torre','Ver torre e mirante (50m)'],['circo','Ver Circo do Futuro'],['anfiteatro','Ver Teatro de Arena'],['','Ver complexo completo']],
 'vila-das-nacoes':[['fachadas','Ver setor Portugal e fachadas mundiais'],['','Ver Vila completa']],
 'centro-de-eventos':[['pavilhao','Ver pavilhão principal'],['','Ver Centro completo']],
 'agroplace':[['rotunda','Ver rotunda e brises verdes'],['esplanada','Ver esplanada e escadaria'],['','Ver AgroPlace completo']],
 'praca-de-alimentacao':[['gastronomia','Ver praça gastronômica'],['terraco','Ver colunata e arquitetura'],['','Ver Praça completa']],
 'parque-da-familia':[['playground','Ver playground temático'],['alameda','Ver gazebos e alameda'],['','Ver Parque completo']],
 'perola-do-cerrado':[['cupula','Ver cúpula geodésica'],['orla','Ver deque e pilotis'],['','Ver Pérola completa']]
};
export function validDetail(id,key){return Boolean(key&&detailOptions[id]?.some(([k])=>k===key));}
export function detailLabel(id,key){return detailOptions[id]?.find(([k])=>k===(key||''))?.[1]||'Ver espaço completo';}
export function detailView(model,id,key){
 if(!validDetail(id,key))return null;
 if(id==='arena-show')return key==='cobertura'
  ?{footprint:[[445,393.5],[513,393.5],[513,489.5],[445,489.5]],height:21,direction:[1,.55,.65]}
  :{footprint:[[543,455],[585,455],[585,496],[543,496]],height:8,direction:[1,.5,1]};
 return model?.userData.detailViews?.[key]||null;
}
