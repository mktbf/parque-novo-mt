// Rótulos públicos. Os enquadramentos vêm das construções no sistema da prancha.
export const detailOptions={
 'autodromo':[['boxes','Ver boxes e torre'],['stand','Ver arquibancada'],['','Ver circuito completo']],
 'arena-show':[['cobertura','Ver cobertura'],['bilheteria','Ver bilheteria'],['','Ver Arena completa']],
 'portico-de-entrada':[['estrutura','Ver os arcos'],['','Ver acesso completo']],
 'kartodromo':[['boxes','Ver edifício dos boxes'],['arquibancada','Ver arquibancada'],['','Ver pista completa']],
 'skate-park':[['bowls','Ver bowls e apoios'],['street','Ver área de street'],['','Ver Skate completo']]
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
