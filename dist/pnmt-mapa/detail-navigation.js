// Rótulos públicos. Os enquadramentos vêm das construções no sistema da prancha.
export const detailOptions={
 'roda-gigante':[['pavilhao','Ver pavilhão e embarque'],['roda','Ver roda completa'],['passarela','Ver passarela'],['','Ver espaço completo']],
 'bmx':[['largada','Ver largadas'],['pista','Ver pista e relevo'],['','Ver BMX completo']],
 'casa-cuiabana':[['fachada','Ver fachada e praça'],['cobertura','Ver cobertura'],['','Ver Casa completa']],
 'autodromo':[['reta','Reta e arquibancada'],['aerea','Vista aérea'],['boxes','Ver boxes e torre'],['stand','Ver arquibancada'],['','Ver circuito completo']],
 'arena-show':[['cobertura','Ver cobertura'],['bilheteria','Ver bilheteria'],['','Ver Arena completa']],
 'portico-de-entrada':[['estrutura','Ver os arcos'],['','Ver acesso completo']],
 'kartodromo':[['boxes','Ver edifício dos boxes'],['arquibancada','Ver arquibancada'],['','Ver pista completa']],
 'skate-park':[['bowls','Ver bowls e apoios'],['street','Ver área de street'],['','Ver Skate completo']],
 'parque-da-familia':[['toldos','Ver toldos e coberturas'],['castelos','Ver castelos e tobogãs'],['aviao','Ver avião e mini-ferrovia'],['','Ver parque completo']]
};
export function validDetail(id,key){return Boolean(key&&detailOptions[id]?.some(([k])=>k===key));}
export function detailLabel(id,key){return detailOptions[id]?.find(([k])=>k===(key||''))?.[1]||'Ver espaço completo';}
export function detailView(model,id,key){
 if(!validDetail(id,key))return null;
 if(id==='parque-da-familia'){
  if(key==='toldos')return {footprint:[[250,538],[295,538],[295,565],[250,565]],height:7.5,direction:[0.5,0.7,0.8]};
  if(key==='castelos')return {footprint:[[245,542],[280,542],[280,560],[245,560]],height:6,direction:[0.7,0.6,0.6]};
  if(key==='aviao')return {footprint:[[298,536],[328,536],[328,552],[298,552]],height:5,direction:[0.8,0.5,0.5]};
 }
 if(id==='arena-show')return key==='cobertura'
  ?{footprint:[[445,393.5],[513,393.5],[513,489.5],[445,489.5]],height:21,direction:[1,.55,.65]}
  :{footprint:[[543,455],[585,455],[585,496],[543,496]],height:8,direction:[1,.5,1]};
 return model?.userData.detailViews?.[key]||null;
}
