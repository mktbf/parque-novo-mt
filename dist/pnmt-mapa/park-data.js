/**
 * Coordenadas locais em pixels da planta renderizada a 1600 px de largura (fator 1 : 2.10625 da prancha completa 3370 x 2384 px).
 * Fonte primária: GOV_U_ParqueNovoMT_ARQ_Implantação_R84.pdf, página 1, rotação 270°.
 * Carimbo oficial: IMPLANTAÇÃO REVISÃO R83 (escala 1:2500).
 * Divergência documental: Arquivo R84 / Carimbo R83 preservada para rastreabilidade de projeto.
 * @typedef {{id:string,name:string,category:string,position:number[],sector?:string,footprint?:number[][],height:number,description:string,number:number,url:string,featured?:boolean,focusDirection?:number[],photoCaption?:string}} ParkPlace
 */
export const sourceMetadata = {
 document: 'GOV_U_ParqueNovoMT_ARQ_Implantação_R84.pdf',
 driveFileId: '1tmTfEGBpxk7W752ftdckDCRuJ3KmFJBo',
 sha256: '366b5825834fea554ab3794dd71c547f103f66e17608f431ca4b018f6134a39f',
 fileNameRevision: 'R84',
 titleBlockRevision: 'IMPLANTAÇÃO REVISÃO R83',
 scaleNominal: '1:2500',
 pranchaCompleta: {
  arquivo: './assets/referencias/prancha-completa.webp',
  larguraPx: 3370,
  alturaPx: 2384,
  rotacaoPdf: 270,
  escalaPara1600: 3370 / 1600
 },
 notaDivergencia: 'Divergência entre o nome do arquivo (R84) e o carimbo do desenho (R83) documentada conforme diretriz técnica.'
};

export const colors={Esportes:'#246dad',Experiências:'#239467',Cultura:'#aa703e',Eventos:'#7754b2',Convivência:'#657a87'};
/** @type {ParkPlace[]} */
export const places=[
 {id:'autodromo',name:'Autódromo Internacional',category:'Esportes',position:[743,490],sector:'23/24',height:12,featured:true,focusDirection:[-.7,.55,.6],photoCaption:'Autódromo Internacional e Pista de Arrancada',description:'Circuito oficial FIA com reta principal, complexo de boxes e paddock, arquibancada coberta e pista de arrancada ("Dragstrip").',footprint:[[562,658],[576,614],[760,413],[811,386],[855,383],[890,399],[924,461],[961,553],[1001,643],[1030,720],[1078,799],[1073,832],[1040,871],[999,882],[928,873],[852,846],[757,811],[654,753],[573,710]]},
 {id:'arena-show',name:'Arena Show',category:'Eventos',position:[479,442],sector:'01',height:18,featured:true,focusDirection:[1,.65,.65],photoCaption:'Fotografia aérea da Arena Show',description:'Ampla cobertura branca ondulada contínua com forro acústico, pilares inclinados e bilheteria independente recuada diante da praça de acesso Show 13.',footprint:[[435,389],[515,389],[550,417],[568,442],[583,470],[576,491],[514,496],[435,496]]},
 {id:'roda-gigante',name:'Roda-gigante',category:'Experiências',position:[508,738],sector:'25',height:52,featured:true,photoCaption:'Roda-gigante (Setor 25) · Praça, plataforma e passarela',description:'Marco visual do parque (Setor 25), com 42 cabines panorâmicas climatizadas, plataforma de embarque (25.3), passarela elevada (25.2) e praça circular integrada.',footprint:[[476,706],[540,706],[540,770],[476,770]]},
 {id:'centro-de-eventos',name:'Centro de Eventos',category:'Eventos',position:[318,307],sector:'31',height:22,featured:true,description:'Espaço previsto para feiras, congressos e encontros, junto à parte norte da orla.',footprint:[[212,377],[252,415],[300,386],[391,300],[425,270],[405,227],[374,213],[304,246],[255,298]]},
 {id:'kartodromo',name:'Kartódromo',category:'Esportes',position:[443,837],sector:'14',height:3,description:'A pista de kart fica ao sul da praça da roda-gigante, próxima ao complexo de esportes.',footprint:[[391,780],[450,777],[479,796],[502,838],[500,863],[478,902],[438,925],[406,922],[376,888],[373,818]]},
 {id:'bmx',name:'Pista de BMX',category:'Esportes',position:[307,860],sector:'07.1',height:5,description:'Pista de BMX Racing no setor esportivo, próxima ao Skate Park e ao Kartódromo.',footprint:[[277,838],[307,827],[338,889],[306,904]]},
 {id:'skate-park',name:'Skate Park',category:'Esportes',position:[261,769],sector:'07.2',height:5,description:'O espaço das manobras fica no complexo de esportes, a oeste do Kartódromo.',footprint:[[241,756],[286,768],[301,797],[270,817],[241,805],[229,780]]},
 {id:'wake-park',name:'Wake Park',category:'Esportes',position:[165,653],height:2,featured:true,description:'Esporte sobre a água, no lago da área Sunset, ao lado dos espaços de lazer.',footprint:[[126,601],[181,593],[207,664],[204,726],[180,737],[158,710],[140,675]]},
 {id:'arenas-beach',name:'Arenas Beach',category:'Esportes',position:[203,305],height:4,description:'Quadras de areia próximas à orla, junto ao Centro de Eventos.',footprint:[[202,272],[222,285],[202,332],[179,320]]},
 {id:'arvore-da-vida',name:'Árvore da Vida',category:'Experiências',position:[283,598],height:61,description:'Torre panorâmica com mirante elevado e base integrada aos museus. Um novo ângulo para descobrir o parque.'},
 {id:'parque-da-familia',name:'Parque da Família',category:'Experiências',position:[276,556],height:3,description:'Área de lazer junto ao lago, próxima ao complexo cultural e aos espaços de alimentação.',footprint:[[232,543],[252,536],[288,535],[330,537],[317,550],[302,567],[254,577],[243,572],[237,558]]},
 {id:'splash-parque',name:'Splash Parque',category:'Experiências',position:[239,630],height:4,description:'Área de lazer aquático na faixa entre o Wake Park e o complexo cultural.',footprint:[[212,598],[225,590],[261,641],[259,661],[240,671],[228,646]]},
 {id:'museus',name:'Museus',category:'Cultura',position:[281,599],height:13,description:'Museu do Povo Mato-grossense e Museu de História Natural, no complexo cultural.',footprint:[[255,571],[281,574],[310,579],[316,601],[307,624],[282,625],[253,614],[248,590]]},
 {id:'praca-de-alimentacao',name:'Praça de Alimentação',category:'Convivência',position:[330,573],height:13,description:'O ponto de encontro para uma pausa no passeio, perto dos museus e do Parque da Família.',footprint:[[320,554],[354,564],[350,580],[313,573]]},
 {id:'vila-das-nacoes',name:'Vila das Nações',category:'Cultura',position:[447,568],height:11,description:'Fachadas temáticas, arquitetura e experiências ao longo do Lago das Nações.',footprint:[[424,529],[440,542],[456,571],[464,598],[454,614],[444,600],[442,575],[429,552]]},
 {id:'casa-cuiabana',name:'Casa Cuiabana',category:'Cultura',position:[453,659],height:12,description:'Um espaço ligado à identidade cuiabana, junto à orla e à área do AgroPlace.',footprint:[[436,653],[458,648],[470,666],[449,681]]},
 {id:'agroplace',name:'AgroPlace',category:'Eventos',position:[398,701],sector:'19',height:17,photoCaption:'AgroPlace (Setor 19) · Centro de Eventos Agro',description:'Espaço de encontro e eventos agropecuários (Setor 19), com rotunda circular autônoma, brises verdes, mezanino panorâmico e esplanada própria.',footprint:[[376,679],[420,679],[420,723],[376,723]]},
 {id:'portico-de-entrada',name:'Pórtico de Entrada',category:'Convivência',position:[933,968],sector:'10',height:23,featured:true,description:'Acesso principal do parque (Setor 10), com duas amplas cascas de concreto no eixo da avenida de entrada.',footprint:[[908,944],[956,944],[956,992],[908,992]]},
 {id:'estrutura-e-acesso',name:'Estacionamentos',category:'Convivência',position:[789,982],height:1,description:'Bolsões de estacionamento distribuídos pelo parque. O acesso varia conforme cada evento.',footprint:[[709,918],[825,930],[900,973],[875,1023],[716,1053],[696,1000]]},
 {id:'perola-do-cerrado',name:'Pérola do Cerrado',category:'Cultura',position:[218,558],height:15,description:'Edificação de cobertura oval na orla, ao lado do Parque da Família e do conjunto dos museus.',footprint:[[203,535],[216,531],[239,563],[235,582],[220,585],[202,559]]},
 {id:'motocross',name:'Pista de Motocross',category:'Esportes',position:[362,952],sector:'05',height:3,description:'Área destinada ao motocross ao sul do setor de kart e BMX.',footprint:[[303,915],[337,898],[372,933],[411,957],[430,989],[411,1028],[384,1018],[345,982]]}
].map((p,i)=>({...p,number:i+1,url:null}));

export const terrain={
 outline:[[72,548],[81,480],[120,445],[121,382],[105,337],[128,297],[218,190],[344,14],[520,14],[921,128],[936,170],[914,303],[1004,477],[1124,714],[1176,935],[1158,1009],[998,1049],[594,1111],[394,1118],[362,1076],[320,1003],[270,881],[221,810],[195,741],[140,679],[104,605]],
 lakes:[
  // Laguna das Nações (Margem oeste oficial do parque)
  [[170,160],[195,250],[195,320],[215,370],[210,420],[240,460],[220,530],[180,580],[150,640],[140,710],[160,750],[180,780],[160,820],[130,810],[100,740],[72,548],[82,490],[120,445],[121,382],[105,337],[128,297],[170,160]],
  // Lago das Palmeiras (Canal e bacia da orla diante da Arena Show)
  [[240,460],[270,450],[330,425],[360,435],[380,445],[365,475],[330,480],[280,490],[240,460]]
 ],
 greens:[
  // Talude e morro ao norte da Arena Show
  [[450,319],[479,310],[517,302],[599,307],[690,301],[727,319],[744,360],[741,391],[681,378],[608,373],[531,375],[483,369]],
  // Área verde entre Vila das Nações e AgroPlace
  [[430,501],[492,504],[521,535],[511,592],[471,645],[444,653],[460,606],[455,559]],
  // Parque da Família e entorno dos museus
  [[306,618],[344,583],[375,593],[396,648],[376,675],[326,679]],
  // Bosque e miolo do Autódromo
  [[768,682],[786,641],[820,588],[849,553],[843,601],[824,650],[848,694],[878,711],[901,695],[919,668],[929,708],[948,767],[904,754],[850,742],[803,746],[780,756]]
 ],
 parking:[
  // E6 - Estacionamento Arena Show Norte (54.297 m²)
  [[540,375],[745,378],[655,515],[565,495],[540,430]],
  // E7 - Estacionamento Arena Show Sul (24.824 m²)
  [[645,530],[565,635],[490,615],[555,510]],
  // E5 - Estacionamento Principal Sul
  [[500,890],[860,890],[890,960],[500,980]],
  // E8 - Estacionamento Centro de Eventos (Norte)
  [[280,175],[420,155],[450,215],[315,235]]
 ],
 roundabouts:[
  {name:'Rotatória Norte 1',center:[808,348],outerRadius:25,innerRadius:14},
  {name:'Rotatória Roda-gigante',center:[508,740],outerRadius:34,innerRadius:22},
  {name:'Rotatória Sudoeste',center:[470,990],outerRadius:22,innerRadius:12}
 ],
 roads:[
  // 1. Avenida de Entrada (Pórtico Setor 10 -> Rotatória Sudoeste)
  [[1040,955],[980,962],[933,968],[850,980],[750,990],[650,996],[550,998],[470,990]],
  // 2. Avenida Oeste (Rotatória Sudoeste -> Rotatória Roda-gigante)
  [[470,990],[476,930],[490,850],[504,790],[508,740]],
  // 3. Avenida Central (Rotatória Roda-gigante -> leste dos Estacionamentos -> Rotatória Norte 1)
  [[508,740],[512,720],[530,688],[560,642],[596,594],[634,548],[672,504],[708,462],[744,420],[780,378],[808,348]],
  // 4. Acesso Norte / Rodovia
  [[808,348],[810,280],[800,200],[780,100],[770,30]],
  // 5. Avenida Noroeste (Rotatória Norte 1 -> Centro de Eventos -> Orla)
  [[808,348],[740,320],[650,310],[550,300],[456,260],[422,275],[385,342],[337,370],[275,385],[223,380],[195,323]],
  // 6. Conexão Esportiva (Rotatória Roda-gigante -> Complexo Esportivo Oeste)
  [[508,740],[463,745],[392,757],[320,770],[270,790],[260,840],[265,900],[280,950]],
  // 7. Circuito do Kartódromo / Motocross Sul
  [[392,757],[420,770],[480,780],[510,830],[515,890],[490,950],[420,980],[350,970],[280,950]]
 ],
 paths:[
  // Passeio da Orla (Centro de Eventos -> Complexo Beach -> Wake Park)
  [[195,320],[210,370],[215,420],[240,460],[230,530],[210,590],[195,660],[205,730]],
  // Conexão de Pedestres: Praça da Roda-gigante -> AgroPlace
  [[476,738],[440,730],[415,720]],
  // Esplanada de Acesso Show 13 (Praça de Pedestres diante da Arena Show)
  [[560,490],[530,490],[490,490],[450,480]]
 ],
 raceTrack:[[716,757],[696,739],[651,711],[615,682],[593,650],[595,618],[637,570],[683,518],[736,466],[783,424],[817,409],[844,411],[859,428],[884,480],[913,539],[948,621],[992,728],[1017,791],[1038,813],[1038,836],[1017,854],[986,864],[945,858],[909,847],[862,829],[814,807],[780,786],[772,778],[798,767],[840,765],[879,774],[930,790],[960,803],[974,798],[973,777],[950,707],[930,659],[919,644],[907,652],[893,684],[879,698],[864,691],[843,675],[841,655],[855,601],[869,553],[863,538],[851,547],[826,575],[796,620],[777,651],[768,694],[773,716],[753,731],[737,751]],
 raceConnections:[[[716,757],[814,807]]],
 kartTrack:[[407,794],[428,788],[446,793],[452,805],[444,817],[463,831],[476,822],[486,835],[485,854],[471,874],[460,892],[445,902],[426,906],[415,895],[423,881],[411,868],[410,852],[396,840],[394,817]]
};
