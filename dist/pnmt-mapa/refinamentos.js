import * as T from 'three';

/**
 * PNMT — interpretação modelada dos prints enviados por Jean.
 * Unidade: a mesma unidade gráfica da implantação existente; NÃO são metros.
 * Nenhuma face oculta, altura ou dimensão sem cota deve ser tratada como levantamento.
 * Edite os parâmetros e valide a implantação antes de usar em produção.
 */
export const referencias = [
  {id:'arena-show',nome:'Arena Show',foto:'03-arena.png',centro:[479,442],vista:[1,.65,.9],ajustes:['Cobertura branca contínua e ondulada','Pavilhão aberto, com estrutura aparente','Bilheteria independente e entrada recuada']},
  {id:'portico-de-entrada',nome:'Pórtico de Entrada',foto:'02-portico.png',centro:[933,968],angulo:1.15,vista:[.28,.36,1],ajustes:['Duas asas arqueadas com encontro central no canteiro','Estrutura fanning e travamentos sob a cobertura','Canteiro central oval e passagem livre para veículos']},
  {id:'bmx',nome:'Pista de BMX',foto:'06-bmx.png',centro:[307,860],angulo:.36,vista:[1,.9,1.15],ajustes:['Quatro retas conectadas por curvas','Superfície azul e curvas amarelas','Ondulações integradas e plataformas de largada abertas']},
  {id:'skate-park',nome:'Skate Park',foto:'07-skate.png',centro:[261,769],angulo:-.25,vista:[1,1.25,1],ajustes:['Bowls rebaixados com formas diferentes','Área street com corrimãos e rampas','Marquises brancas e caminhos entre os setores']},
  {id:'kartodromo',nome:'Kartódromo',foto:'08-kartodromo.png',centro:[443,837],vista:[-1,1.2,1],ajustes:['Traçado existente preservado','Edifício linear e marquise escura','Pilares, estrutura superior e acessos modulados']},
  {id:'motocross',nome:'Pista de Motocross',foto:'05-motocross.png',centro:[362,952],angulo:.74,vista:[1,1.1,1],ajustes:['Percurso de terra serpenteando pela área','Saltos integrados à pista','Taludes de terra com entorno verde']},
  {id:'roda-gigante',nome:'Roda-gigante',foto:'09-roda-gigante.png',centro:[508,738],angulo:.74,vista:[.62,.32,1],ajustes:['Dois aros, raios e 42 cabines','Apoios inclinados e eixo exposto','Passarela elevada 25.2 e plataforma 25.3']},
  {id:'agroplace',nome:'AgroPlace',foto:'19-agroplace.png',centro:[398,701],vista:[.6,.4,1],ajustes:['Rotunda arquitetônica independente (Setor 19)','Brises metálicos e mezanino panorâmico','Esplanada própria de circulação']},
  {id:'arvore-da-vida',nome:'Árvore da Vida',foto:'10-arvore-da-vida.png',centro:[283,598],vista:[1,.5,1],ajustes:['Fuste cilíndrico esbelto','Coroamento compacto conforme o print','Acabamento superior ainda interpretativo']},
  {id:'vila-das-nacoes',nome:'Vila das Nações',foto:'11-vila-das-nacoes.png',centro:[447,568],angulo:-Math.PI/2+.4,vista:[.25,.55,1],ajustes:['Fachadas temáticas com silhuetas distintas','Torres, cúpulas, frontões e arcadas','Passeio contínuo voltado para a orla']},
  {id:'autodromo',nome:'Autódromo',foto:'01-autodromo.png',centro:[828,640],vista:[-1,1.3,1],ajustes:['Circuito e ligação já existentes preservados','Boxes, arquibancadas e postes','Pintura azul concentrada nas áreas de escape']},
  {id:'estrutura-e-acesso',nome:'Estacionamentos',foto:'04-estacionamentos.png',centro:[789,982],vista:[.4,1.5,1],ajustes:['Pavimento cinza e marcações legíveis','Vias internas e ilhas verdes','Vagas conforme as áreas existentes']}
];

const PAL={white:'#f8fafc',concrete:'#c9c8bd',steel:'#3d4b53',dark:'#182228',glass:'#386072',blue:'#0062cc',yellow:'#f2c808',grass:'#466b32',earth:'#9a5332',road:'#24282b',green:'#2d5222',magenta:'#d81b60',purple:'#ab47bc',terracotta:'#a84838'};
export const materialCache=new Map();
function material(c,metalness=0,roughness=.72){
  const isGlass=c===PAL.glass||c==='#365f70'||c==='#345868'||c==='#4a6878';
  const isSteel=[PAL.steel,PAL.dark,'#bdc7ca','#424f56','#37474f'].includes(c);
  const isWhiteRoof=[PAL.white,'#f8fafc','#f5f7f8','#e2e6e5','#ffffff'].includes(c);
  const isConcrete=[PAL.concrete,'#c7c6bd','#c9c8bd','#cfd2cc'].includes(c);
  const m=metalness||(isSteel?.7:isGlass?.08:isWhiteRoof?.05:0);
  const r=roughness||(isSteel?.22:isGlass?.05:isWhiteRoof?.38:isConcrete?.82:.72);
  const key=[c,m,r].join('|');
  if(!materialCache.has(key)){
    const mat=isGlass
      ? new T.MeshPhysicalMaterial({color:c,metalness:.05,roughness:.06,transmission:.85,ior:1.52,clearcoat:1,clearcoatRoughness:.04,transparent:true,opacity:.92,envMapIntensity:2.4})
      : new T.MeshStandardMaterial({color:c,metalness:m,roughness:r,envMapIntensity:isSteel?1.6:isWhiteRoof?1.1:.85});
    mat.name=c; materialCache.set(key,mat);
  }
  return materialCache.get(key);
}
function mesh(g,geo,c=PAL.white,x=0,y=0,z=0,metal=0,rough=.72){
  const m=new T.Mesh(geo,material(c,metal,rough));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
}
function box(g,x,y,z,w,h,d,c=PAL.white){return mesh(g,new T.BoxGeometry(w,h,d),c,x,y+h/2,z);}
function cylinder(g,x,y,z,r,h,c=PAL.concrete,rt=r){return mesh(g,new T.CylinderGeometry(rt,r,h,24),c,x,y+h/2,z);}
function group(g,x=0,z=0,angle=0){const o=new T.Group();o.position.set(x,0,z);o.rotation.y=angle;g.add(o);return o;}
function beam(g,a,b,r=.1,c=PAL.steel){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);if(v.length()<1e-5)return null;const m=mesh(g,new T.CylinderGeometry(r,r,v.length(),6),c,...av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;}
function polygon(g,pts,c=PAL.concrete,y=0,depth=.15){const s=new T.Shape();pts.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false});geo.rotateX(-Math.PI/2);return mesh(g,geo,c,0,y,0);}
function surface(g,vertices,indices,c=PAL.white){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return mesh(g,geo,c);}
function tube(g,pts,r=.1,c=PAL.white,closed=false){const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),closed,'centripetal');return mesh(g,new T.TubeGeometry(curve,Math.max(24,pts.length*4),r,6,closed),c);}
function ring(g,x,y,z,r,t,c=PAL.white,vertical=false){const m=mesh(g,new T.TorusGeometry(r,t,6,72),c,x,y,z);if(!vertical)m.rotation.x=-Math.PI/2;return m;}
function path(g,points,width,color=PAL.road,y=.3,closed=false,smooth=true){
  const ps=points.map(p=>new T.Vector3(p[0],y,p[1]));
  const curve=new T.CatmullRomCurve3(ps,closed,'centripetal');
  if(!smooth){const vs=[],ix=[];for(let i=0;i<points.length-1;i++){const [x,z]=points[i],[xx,zz]=points[i+1],len=Math.hypot(xx-x,zz-z);if(!len)continue;const nx=-(zz-z)/len*width/2,nz=(xx-x)/len*width/2,k=vs.length/3;vs.push(x+nx,y,z+nz,x-nx,y,z-nz,xx+nx,y,zz+nz,xx-nx,y,zz-nz);ix.push(k,k+2,k+1,k+1,k+2,k+3);}return surface(g,vs,ix,color);}
  const v=[],ix=[],n=Math.max(64,points.length*10);for(let i=0;i<=n;i++){const p=curve.getPointAt(i/n),t=curve.getTangentAt(i/n),nx=-t.z*width/2,nz=t.x*width/2;v.push(p.x+nx,y,p.z+nz,p.x-nx,y,p.z-nz);if(i<n){const k=i*2;ix.push(k,k+2,k+1,k+1,k+2,k+3);}}return surface(g,v,ix,color);
}
function lamp(g,x,z,h=7){beam(g,[x,.2,z],[x,h,z],.055,PAL.steel);beam(g,[x,h,z],[x+1,h+.15,z],.045,PAL.steel);box(g,x+1,h,z,.9,.12,.35,PAL.white);}
function canopy(g,x,z,w,d,h=5){const q=group(g,x,z);box(q,0,h,0,w,.22,d,PAL.white);for(const a of [-1,1])for(const b of [-1,1])beam(q,[a*(w/2-.4),.2,b*(d/2-.4)],[a*(w/2-.4),h,b*(d/2-.4)],.075,PAL.steel);for(let i=-w/2;i<=w/2;i+=.75)box(q,i,h+.23,0,.045,.035,d,PAL.concrete);return q;}
function stand(g,x,z,w,d,angle=0){const s=group(g,x,z,angle);for(let k=0;k<6;k++){box(s,0,.2+k*.45,-d/2+k*d/6,w,.45,d/6,PAL.concrete);for(let j=-w/2+1;j<w/2;j+=1.1)box(s,j,.69+k*.45,-d/2+(k+.3)*d/6,.7,.18,.6,'#4a6471');}canopy(s,0,0,w+1,d+1,6);return s;}
function shrub(g,x,z,r=1,c=PAL.green){const m=mesh(g,new T.IcosahedronGeometry(r,1),c,x,.6+r*.55,z);m.scale.y=.65;}
function archWindow(g,x,y,z,w,h,c=PAL.glass){
  const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h-w/2);s.absarc(0,h-w/2,w/2,0,Math.PI,false);s.closePath();mesh(g,new T.ShapeGeometry(s),c,x,y,z);
  const ps=[[-w/2,0],[-w/2,h-w/2],...Array.from({length:15},(_,i)=>{const a=Math.PI-i/14*Math.PI;return [Math.cos(a)*w/2,h-w/2+Math.sin(a)*w/2];}),[w/2,0]];tube(g,ps.map(([a,b])=>[x+a,y+b,z+.03]),.065,PAL.white);
}
function royalPalm(g,x,z,h=10){
  cylinder(g,x,.2,z,.28,h,'#5d4037',.18);
  for(let i=1;i<h;i+=.8)ring(g,x,i,z,.28,.02,'#4e342e');
  cylinder(g,x,h,z,.2,1.2,'#33691e');
  for(let j=0;j<10;j++){
    const a=j/10*Math.PI*2;
    const pts=[];
    for(let k=0;k<=8;k++){
      const t=k/8,r=t*4.2,yy=h+1.2+Math.sin(t*Math.PI)*1.1-t*t*1.6;
      pts.push([x+Math.cos(a)*r,yy,z+Math.sin(a)*r]);
    }
    tube(g,pts,.08,'#2e7d32');
  }
}

export function buildPortico(g){
  g.name='Pórtico (Setor 10) · Duas Asas Arqueadas Monumentais';
  // Alturas e perfis verticais permanecem interpretativos baseados nos renders oficiais; sem cotas na prancha R83.
  // Pistas de tráfego passam livremente por sob as asas; sem base isolada cobrindo as faixas de rolamento.

  // 1. CANTEIRO CENTRAL OVAL AJARDINADO (Conforme o traçado CAD da prancha)
  const islandCurbs=mesh(g,new T.CylinderGeometry(1,1,.38,48),PAL.white,0,.15,0);
  islandCurbs.scale.set(3.8,1,11.5);
  const islandLawn=mesh(g,new T.CylinderGeometry(1,1,.42,48),PAL.grass,0,.2,0);
  islandLawn.scale.set(3.2,1,10.8);

  // Paisagismo do canteiro central: maciço ornamental e arbustos
  shrub(g,0,0,1.8,PAL.magenta);
  shrub(g,0,-3.2,1.4,'#880e4f');
  shrub(g,0,3.2,1.4,'#880e4f');
  for(let i=0;i<16;i++){
    const a=i*Math.PI*2/16;
    shrub(g,Math.cos(a)*2.4,Math.sin(a)*8.4,.85,i%2?'#2e7d32':'#558b2f');
  }

  // 2. DUAS CASCAS ARQUEADAS DE CONCRETO (TRAÇADO FANNING CONFORME PLANTA E FOTO)
  // Asa Norte (cruza pista norte): base estreita no canteiro central (Z ~ +3.8), leque abrindo até a guia externa
  // Asa Sul (cruza pista sul): base estreita no canteiro central (Z ~ -3.8), leque abrindo até a guia externa
  for(const side of [-1,1]){
    const zBase=side*3.8; // Escalonamento entre os apoios no canteiro central
    const span=27.5;     // Vão livre cruzando as pistas até a fundação externa
    const n=64,v=[],ix=[];
    // Parábola de vão livre com altura interpretativa de 18m no ápice
    const y=t=>.5+17.8*Math.pow(Math.sin(Math.PI*t),.85);
    // Leque expandindo de wBase=2.4m no canteiro até wOuter=8m na guia externa
    const halfW=t=>2.4+5.6*t;

    for(let i=0;i<=n;i++){
      const t=i/n,x=side*(1.4+span*t),w=halfW(t);
      v.push(x,y(t),zBase-w,x,y(t)+.85,zBase+w);
      if(i<n){const k=2*i;ix.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
    const skin=surface(g,v,ix,PAL.white);
    skin.material=material(PAL.white).clone();skin.material.side=T.DoubleSide;

    // Bordas tubulares metálicas estruturais
    for(const factor of [-1,-.5,0,.5,1]){
      const pts=Array.from({length:65},(_,i)=>{
        const t=i/64,w=halfW(t);
        return[side*(1.4+span*t),y(t)+.1*(1-t)+(factor*w)/18,zBase+factor*w];
      });
      tube(g,pts,Math.abs(factor)===1?.35:.2,PAL.white);
    }

    // Costelas e fitas de iluminação linear LED magenta no intradorso
    for(let i=2.5;i<span;i+=2.2){
      const t=i/span,x=side*(1.4+span*t),w=halfW(t);
      beam(g,[x,y(t)-.1,zBase-w],[x,y(t)+.65,zBase+w],.08,PAL.white);
      beam(g,[x,y(t)-.18,zBase-w*.9],[x,y(t)+.58,zBase+w*.9],.045,i%4===0?PAL.magenta:PAL.purple);
    }

    // Blocos maciços de fundação chanfrados (apenas no canteiro central e no passeio lateral externo, SEM invadir a via)
    box(g,side*1.6,.3,zBase,1.8,1.4,7.0,PAL.concrete);
    box(g,side*(1.4+span),.3,zBase,2.6,1.5,15.5,PAL.concrete);
  }

  // Linhas de palmeiras imperiais nas calçadas externas
  for(const side of [-1,1]){
    for(let pz=-25;pz<=25;pz+=12.5){
      royalPalm(g,side*33.5,pz,11);
    }
    // Ciclovia lateral delimitada no passeio
    box(g,side*31,.14,0,2.8,.02,58,PAL.terracotta);
  }

  // Iluminação da avenida com postes duplos nos passeios externos
  for(const z of [-22,0,22]){
    cylinder(g,-34,.2,z,.18,9,PAL.steel);
    beam(g,[-34,9,z],[-32,9.6,z],.09,PAL.steel);
    box(g,-31.8,9.55,z,1.2,.2,.45,PAL.white);
    cylinder(g,34,.2,z,.18,9,PAL.steel);
    beam(g,[34,9,z],[32,9.6,z],.09,PAL.steel);
    box(g,31.8,9.55,z,1.2,.2,.45,PAL.white);
  }
}

function rampStrip(g,x,z0,z1,w,heightAt,c){
  const n=Math.ceil(Math.abs(z1-z0)*3),v=[],ix=[];
  for(let i=0;i<=n;i++){const t=i/n,z=z0+(z1-z0)*t,h=heightAt(z,t);v.push(x-w/2,h,z,x+w/2,h,z);if(i<n){const k=i*2;ix.push(k,k+2,k+1,k+1,k+2,k+3);}}
  if(c===PAL.white)for(const side of [-1,1]){
    const sv=[],si=[];for(let i=0;i<=n;i++){const t=i/n,z=z0+(z1-z0)*t;sv.push(x+side*w/2,heightAt(z,t)-.015,z,x+side*(w/2+.7),.39,z);if(i<n){const k=i*2;si.push(k,k+2,k+1,k+1,k+2,k+3);}}
    const bank=surface(g,sv,si,PAL.grass);bank.material=material(PAL.grass).clone();bank.material.side=T.DoubleSide;
  }
  return surface(g,v,ix,c);
}
function berm(g,cx,cz,r,w,start,end){const v=[],ix=[],n=48;for(let i=0;i<=n;i++){const a=start+(end-start)*i/n;for(const side of [-1,1]){const rr=r+side*w/2;v.push(cx+rr*Math.cos(a),.45+(side+1)*.55*Math.pow(Math.sin(i/n*Math.PI),.8),cz+rr*Math.sin(a));}if(i<n){const k=i*2;ix.push(k,k+1,k+2,k+1,k+3,k+2);}}const m=surface(g,v,ix,PAL.yellow);m.material=material(PAL.yellow).clone();m.material.side=T.DoubleSide;}
export function buildBMX(g){
  g.name='BMX · traçado com relevo';box(g,0,.1,0,38,.28,77,PAL.grass);
  const xs=[-13.5,-4.5,4.5,13.5],w=5.7;
  xs.forEach((x,lane)=>{
    const z0=-27,z1=27;
    const bumps=[-19,-10,-1,8,17,23];
    const height=z=>.45+bumps.reduce((s,b,j)=>{const d=Math.abs(z-b);return s+(d<2.8?Math.pow(Math.cos(d/2.8*Math.PI/2),2)*(j%3===0?1.45:.85):0);},0)+(lane===3&&z>17?Math.pow((z-17)/10,2)*4.8:0);
    rampStrip(g,x,z0,z1,w+.35,height,PAL.white);rampStrip(g,x,z0,z1,w,z=>height(z)+.025,PAL.blue);
    for(const z of bumps){const h=height(z)+.045;box(g,x,h,z,w,.025,.09,PAL.white);}
  });
  berm(g,-9,-27,4.5,w,Math.PI,2*Math.PI);berm(g,0,27,4.5,w,0,Math.PI);berm(g,9,-27,4.5,w,Math.PI,2*Math.PI);
  path(g,[[-13.5,27],[-13.5,34],[1,35],[16,34]],5,PAL.yellow,.5,false,true);
  for(const [x,z,w,d,h] of [[13.5,30,7.6,9,5.3],[5.5,31,6.6,7,3.6]]){
    for(const a of [-1,1])for(const b of [-1,1]){beam(g,[x+a*w/2,.4,z+b*d/2],[x+a*w/2,h+2.8,z+b*d/2],.1,PAL.steel);}
    box(g,x,h,z,w,.3,d,PAL.white);box(g,x,h+.35,z+d/2,w,1.1,.12,PAL.glass);box(g,x,h+3,z,w+.7,.24,d+.8,PAL.white);
    for(let i=0;i<12;i++)box(g,x+w/2+1,.4+i*h/12,z+d/2-i*.52,1.9,.18,.58,PAL.steel);
    beam(g,[x+w/2+1.8,1.4,z+d/2],[x+w/2+1.8,h+1,z+d/2-5.7],.055,PAL.steel);
  }
  stand(g,0,-38,32,5);for(const x of [-19,19])for(const z of [-25,-5,16])lamp(g,x,z,7);
}

function bowlCavity(g,cx,cz,rx,rz,depth,phase=0){
  const radius=a=>1+.12*Math.cos(3*a+phase)+.05*Math.sin(2*a);
  const seg=48,rings=16,v=[],ix=[];const yDeck=0.45;
  for(let j=0;j<=rings;j++)for(let i=0;i<=seg;i++){
    const q=j/rings,a=i/seg*Math.PI*2,rr=radius(a);
    v.push(cx+Math.cos(a)*rx*q*rr,yDeck-depth*(1-Math.pow(q,3)),cz+Math.sin(a)*rz*q*rr);
    if(j<rings&&i<seg){const k=j*(seg+1)+i;ix.push(k,k+1,k+seg+1,k+1,k+seg+2,k+seg+1);}
  }
  const m=surface(g,v,ix,'#c2beb2');m.material=material('#c2beb2').clone();m.material.side=T.DoubleSide;
  // Coping metálico tubular de aço ao redor da borda
  const rim=Array.from({length:49},(_,i)=>{const a=i/48*Math.PI*2,rr=radius(a);return[cx+Math.cos(a)*rx*rr,yDeck+.04,cz+Math.sin(a)*rz*rr];});
  tube(g,rim,.075,PAL.steel,true);
}

export function buildSkate(g){
  g.name='Skate Park (Setor 07.2) · 4 Setores: Bowls e Street';
  // Reconstrução sequencial dos 4 setores conforme contornos CAD, com rebaixo físico para os bowls

  // 1. SETOR 1: BOWL TREVO / KIDNEY (Norte)
  bowlCavity(g,-3,-24,7.8,5.8,1.85,0.4);

  // 2. SETOR 2: FLOW BOWL COM HIPS (Centro-norte)
  bowlCavity(g,4,-8,9.2,6.4,2.1,1.2);

  // 3. SETOR 3: DEEP POOL COM REBAIXO PROFUNDO (Centro-sul)
  bowlCavity(g,-2,9,8.5,7.2,2.4,2.0);

  // Deck de concreto do complexo com furos recortados para os 3 bowls:
  const deckShape=new T.Shape();
  deckShape.moveTo(-18,-35);deckShape.lineTo(18,-35);deckShape.lineTo(20,38);deckShape.lineTo(-18,38);deckShape.closePath();

  // Recortes (holes) nos bowls para a laje plana não preencher os bowls:
  for(const [bx,bz,brx,brz] of [[-3,-24,8.2,6.2],[4,-8,9.6,6.8],[-2,9,8.9,7.6]]){
    const hole=new T.Path();
    for(let i=0;i<=36;i++){
      const a=i/36*Math.PI*2;
      const hx=bx+Math.cos(a)*brx,hz=bz+Math.sin(a)*brz;
      if(i===0)hole.moveTo(hx,-hz);else hole.lineTo(hx,-hz);
    }
    deckShape.holes.push(hole);
  }
  const deckGeo=new T.ExtrudeGeometry(deckShape,{depth:.32,bevelEnabled:false});
  deckGeo.rotateX(-Math.PI/2);
  mesh(g,deckGeo,'#c8c4b6',0,.18,0);

  // 4. SETOR 4: STREET PLAZA (Sul - Ledges, rails, pirâmide e escadaria)
  const st=group(g,0,25);
  st.name='Área Street · Ledges, Corrimãos e Escadarias';
  box(st,-6,.2,0,14,.4,18,'#cfcabb');
  box(st,6,.55,0,10,.8,18,'#d5d0c2');
  for(let s=0;s<5;s++)box(st,1,.2+s*.15,s*1.2-3,4,.18,1.2,PAL.concrete);
  beam(st,[1,.6,-3.5],[1,1.35,3.2],.055,PAL.steel);
  beam(st,[1,.3,-3.5],[1,.6,-3.5],.055,PAL.steel);
  beam(st,[1,.3,3.2],[1,1.35,3.2],.055,PAL.steel);
  box(st,-10,.5,-2,2.2,.65,12,PAL.concrete);
  beam(st,[-8.9,1.15,-8],[-8.9,1.15,4],.045,PAL.steel);
  box(st,10,.85,2,2.4,.75,10,PAL.concrete);
  beam(st,[8.8,1.6,-3],[8.8,1.6,7],.045,PAL.steel);
  const qv=[],qi=[];
  for(let i=0;i<=16;i++){
    const t=i/16;
    qv.push(-16,.2+Math.pow(t,2)*2.4,14-t*4,16,.2+Math.pow(t,2)*2.4,14-t*4);
    if(i<16){const k=i*2;qi.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  surface(st,qv,qi,PAL.concrete);
  tube(st,[[-16,2.65,10],[16,2.65,10]],.08,PAL.steel);

  for(const [mx,mz] of [[-14,-15],[14,5],[-14,15]])canopy(g,mx,mz,7,4,4.5);
  for(const [lx,lz] of [[-18,-30],[18,-30],[-18,0],[18,0],[-18,32],[18,32]])lamp(g,lx,lz,8);
}

export function buildKartodromo(g,terrain){
  g.name='Kartódromo (Setor 14) · Circuito, Boxes e Arquibancada';
  const cx=443,cz=837;

  // 1. TERRENO E PLATÔ DO KARTÓDROMO
  const plat=[[-72,-65],[12,-72],[65,-15],[62,42],[18,92],[-40,96],[-72,42]];
  polygon(g,plat,PAL.grass,.08,.15);

  // 2. CIRCUITO OFICIAL COM BORDAS REAIS E TOPOLOGIA FECHADA
  const outerLoop=[
    [-52,-52],[-30,-64],[15,-66],[42,-48],[50,-20],[44,15],[48,32],[38,55],[15,75],
    [-18,80],[-38,62],[-52,35],[-52,-10],[-52,-52]
  ];
  path(g,outerLoop,8.2,PAL.road,.28,true,true);
  path(g,outerLoop,8.8,PAL.concrete,.24,true,true);

  // Corredor dos boxes (Pit Lane) paralelo à reta principal oeste:
  const pitLane=[[-59,-35],[-59,-10],[-59,15],[-59,32]];
  path(g,pitLane,4.8,PAL.road,.29,false,false);
  box(g,-55.5,.3,0,.35,.9,52,PAL.concrete);
  path(g,[[-55.5,-26],[-55.5,26]],.15,PAL.white,.85,false,false);

  // Traçados internos alternativos / atalhos de treino (Conforme linhas da prancha R83):
  path(g,[[-30,-42],[-8,-44],[15,-30],[24,-8],[8,-5],[-12,-18],[-30,-42]],6.2,PAL.road,.28,true,true);
  path(g,[[-12,-18],[-10,12],[12,18],[24,-8]],6.0,PAL.road,.28,false,true);
  path(g,[[-10,12],[-20,38],[-18,52],[5,48],[18,25]],6.0,PAL.road,.28,false,true);

  // Zebras (kerbs) nas tangências
  for(const [kx,kz,ka] of [[-32,-66,.2],[46,-45,-.7],[52,-18,1.5],[46,30,-1.2],[15,78,2.8],[-38,64,-2.2],[-15,-40,1.1],[12,20,.6]]){
    const kb=group(g,kx,kz,ka);
    for(let i=-3;i<=3;i++)box(kb,i*.8,.3,0,.75,.08,1.2,i%2===0?'#d32f2f':PAL.white);
  }

  // 3. EDIFÍCIO DOS BOXES (Setor 14)
  const b=group(g,-68,2,.02);
  b.name='Boxes do Kart · Edifício Linear e Marquise';
  box(b,0,.3,0,10,4.2,74,PAL.concrete);
  box(b,5.1,4.4,0,.15,.5,74,PAL.white);
  box(b,2.5,4.3,0,16,.28,78,'#263238');
  for(let z=-34;z<=34;z+=5.2){
    box(b,5.05,.5,z,.12,3.2,4.2,PAL.dark);
    beam(b,[10,.3,z],[10,4.3,z],.07,PAL.steel);
    beam(b,[-4.8,4.5,z],[-4.8,8.8,z],.09,PAL.steel);
    beam(b,[4.8,4.5,z],[4.8,8.8,z],.09,PAL.steel);
    beam(b,[-4.8,8.6,z],[4.8,8.6,z+2.4],.06,PAL.steel);
  }
  box(b,0,8.8,-4,11,.22,66,PAL.white);

  // 4. ARQUIBANCADA DO KARTÓDROMO (Setor 14 - Atrás dos boxes)
  const stand=group(g,-78,2,.02);
  stand.name='Arquibancada do Kartódromo';
  const sLen=62;
  for(let r=0;r<6;r++){
    const tX=-r*1.1,tY=.3+r*.6;
    box(stand,tX,tY,0,1.15,.65,sLen,PAL.concrete);
    for(let sz=-28;sz<28;sz+=1.6){
      const cSeat=Math.abs(Math.sin(sz*.25+r))>.4?'#e64a19':PAL.white;
      box(stand,tX+.2,tY+.65,sz,.85,.18,.9,cSeat);
    }
  }
  box(stand,-3.2,5.6,0,8.5,.22,sLen+4,'#2d373c');
  for(let sz=-30;sz<=30;sz+=12){
    beam(stand,[-6.5,.3,sz],[-6.5,5.5,sz],.12,PAL.steel);
    beam(stand,[-6.5,5.2,sz],[.8,5.7,sz],.09,PAL.steel);
  }

  // 5. ILUMINAÇÃO DA PISTA
  for(const [lx,lz] of [[-45,-55],[15,-58],[56,-20],[48,45],[0,76],[-48,55],[-22,-10],[18,5]])lamp(g,lx,lz,10);
}

export function buildMotocross(g){
  g.name='Motocross (Setor 05) · Terraplenagem e Platô de Terra';
  // Terraplenagem compatibilizada com prancha R83/R84; traçado interno preliminar pendente de projeto executivo de pistas.
  g.userData.status='Terraplenagem compatibilizada com prancha R83/R84; traçado interno preliminar pendente de projeto executivo de pistas';

  // 1. PLATÔ DE TERRAPLENAGEM (Forma compatível com prancha técnica R83)
  polygon(g,[[-30,-72],[26,-65],[32,68],[20,74],[-30,65]],PAL.earth,.12,.35);
  polygon(g,[[-26,-66],[22,-60],[26,62],[16,68],[-26,59]],'#8d4c2c',.35,.2);

  // 2. TALUDES ESCALONADOS DE TERRA VERMELHA/CERRADO
  for(let s=0;s<4;s++){
    const w=50-s*6,d=120-s*10,y=.4+s*.35;
    box(g,0,y,0,w,.35,d,'#9a5332');
  }

  // 3. TRAÇADO DE TERRA PRELIMINAR (Pendente de homologação de traçado)
  const pts=[[-22,44],[-22,0],[-22,-43],[-13,-56],[4,-56],[18,-43],[20,-13],[20,43],[13,56],[1,55],[-5,45],[-5,27],[6,11],[7,-5],[8,-24],[1,-38],[-6,-41],[-12,-30],[-10,-18],[-4,-6],[-7,8],[-13,23],[-13,43],[-17,50]];
  const curve=new T.CatmullRomCurve3(pts.map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal'),v=[],ix=[],n=600;
  const h=t=>1.6+Math.pow(Math.max(0,Math.sin(t*Math.PI*20)),3)*1.4;
  for(let i=0;i<=n;i++){
    const t=i/n,p=curve.getPointAt(t),tan=curve.getTangentAt(t);
    for(const s of [-1,1])v.push(p.x-tan.z*2.6*s,h(t)+.15,p.z+tan.x*2.6*s);
    if(i<n){const k=i*2;ix.push(k,k+2,k+1,k+1,k+2,k+3);}
  }
  const pista=surface(g,v,ix,'#c47949');pista.material=material('#c47949').clone();pista.material.side=T.DoubleSide;

  for(let z=-57;z<=58;z+=18){lamp(g,24,z,8);for(const x of [-28,28])beam(g,[x,.3,z],[x,1.9,z],.045,PAL.steel);}
}

export function buildWheel(g){
  g.name='Roda-gigante (Setor 25) · Pavilhão Envidraçado, Praça e Roda Panorâmica';

  // 1. PRAÇA CIRCULAR DO SETOR 25 (Diâmetro 43m, raio 21.5m — contida na ilha da rotatória)
  mesh(g,new T.CylinderGeometry(21.5,21.5,.22,48),PAL.concrete,0,.1,0);
  ring(g,0,.23,0,19.5,.4,'#c9d3cc');
  ring(g,0,.23,0,15.5,.35,'#b8c2be');
  ring(g,0,.23,0,11.5,.3,'#c9d3cc');

  // Canteiros concêntricos com folhagem ornamental roxa/vinho conforme roda-gigante.webp
  for(let k=0;k<8;k++){
    const a=k/8*Math.PI*2+Math.PI/8,qx=Math.cos(a)*16.5,qz=Math.sin(a)*16.5;
    // Base de terra/adubo escura
    mesh(g,new T.CylinderGeometry(2.4,2.4,.26,20),'#3e2723',qx,.24,qz);
    // Borda de concreto
    ring(g,qx,.26,qz,2.4,.2,PAL.white);
    // Maciço de folhagem arroxeada e arbustos
    shrub(g,qx,qz,1.2,'#4a1525');
    shrub(g,qx+.6,qz+.6,.9,'#311b24');
    shrub(g,qx-.6,qz-.6,.9,'#2e7d32');
    lamp(g,Math.cos(a)*19.5,Math.sin(a)*19.5,6);
  }

  // 2. MONUMENTAL PAVILHÃO DA BASE (Setor 25.1) - Conforme a foto roda-gigante.webp
  const basePav=group(g,0,0);
  box(basePav,0,.25,0,24,.3,14,PAL.concrete);
  // Pele de vidro structural glazing do térreo e mezanino
  box(basePav,0,1.8,0,22,7.5,12,PAL.glass);
  for(let x=-10;x<=10;x+=4){
    beam(basePav,[x,.3,-6],[x,9.2,-6],.12,PAL.white);
    beam(basePav,[x,.3,6],[x,9.2,6],.12,PAL.white);
  }
  for(const y of [1.8,5.2,9.2]){
    beam(basePav,[-11,y,-6],[11,y,-6],.09,PAL.white);
    beam(basePav,[-11,y,6],[11,y,6],.09,PAL.white);
  }

  // Envoltória escultural em arco translúcido/iridescente na fachada da base
  const archPts=[];
  for(let i=0;i<=32;i++){
    const t=i/32*Math.PI,ax=Math.cos(t)*11.5,ay=1.0+8.0*Math.sin(t);
    archPts.push([ax,ay,6.4]);
  }
  tube(basePav,archPts,.35,PAL.white);
  // Marquise em arco translúcida
  const archShape=new T.Shape();
  archShape.moveTo(-11.5,1.0);
  for(let i=1;i<=32;i++){
    const t=i/32*Math.PI;
    archShape.lineTo(Math.cos(t)*11.5,1.0+8.0*Math.sin(t));
  }
  archShape.closePath();
  const archMesh=mesh(basePav,new T.ShapeGeometry(archShape),PAL.glass,0,0,6.3);
  archMesh.material=material(PAL.glass).clone();
  archMesh.material.color.set('#b388ff');
  archMesh.material.opacity=0.75;
  archMesh.material.transparent=true;

  // 3. FUNDAÇÃO E PYLONS EM "A" DA RODA-GIGANTE
  const r=24.5,cy=30.0;
  for(const s of [-1,1])for(const z of [-5.0,5.0]){
    box(g,s*13.0,.25,z,4.0,1.0,4.0,PAL.concrete);
    box(g,s*13.0,1.0,z,3.0,.5,3.0,PAL.steel);
    beam(g,[s*13.0,1.2,z],[0,cy,z*.35],.85,PAL.white);
    beam(g,[s*13.0,1.2,z*.75],[0,cy,z*.35],.55,PAL.steel);
  }
  beam(g,[-13.0,7,-5.0],[-13.0,7,5.0],.42,PAL.white);
  beam(g,[13.0,7,-5.0],[13.0,7,5.0],.42,PAL.white);
  beam(g,[-13.0,16,-3.5],[-13.0,16,3.5],.35,PAL.white);
  beam(g,[13.0,16,-3.5],[13.0,16,3.5],.35,PAL.white);

  // Eixo central fixo de alta robustez com mancal
  beam(g,[0,cy,-4.5],[0,cy,4.5],1.4,PAL.steel);
  cylinder(g,0,cy,-2.8,1.8,1.0,PAL.white);
  cylinder(g,0,cy,2.8,1.8,1.0,PAL.white);

  // 4. AROS DUPLOS E TRELIÇAS ESPACIAIS EM ZIG-ZAG
  for(const z of [-2.8,2.8]){
    ring(g,0,cy,z,r,.28,PAL.white,true);
    ring(g,0,cy,z,r-1.2,.18,PAL.white,true);
  }
  for(let i=0;i<42;i++){
    const a=i/42*Math.PI*2,x=Math.cos(a)*r,y=cy+Math.sin(a)*r;
    beam(g,[x,y,-2.8],[x,y,2.8],.14,PAL.white);
    const aNext=(i+1)/42*Math.PI*2,nx=Math.cos(aNext)*r,ny=cy+Math.sin(aNext)*r;
    beam(g,[x,y,-2.8],[nx,ny,2.8],.085,PAL.white);
    beam(g,[x,y,2.8],[nx,ny,-2.8],.085,PAL.white);
    for(const z of [-2.8,2.8]){
      beam(g,[0,cy,z*.45],[x,y,z],.055,'#cfd8dc');
    }
  }

  // 5. EXATAMENTE 42 CABINES PANORÂMICAS CLIMATIZADAS
  for(let i=0;i<42;i++){
    const a=i/42*Math.PI*2,x=Math.cos(a)*r,y=cy+Math.sin(a)*r;
    beam(g,[x,y,0],[x,y-1.2,0],.11,PAL.steel);
    const c=group(g,x,0);
    c.position.y=y-1.3;
    c.name='Cabine '+String(i+1).padStart(2,'0')+' (Setor 25)';
    const baseCap=mesh(c,new T.SphereGeometry(1.15,16,10),PAL.white,0,.45,0);
    baseCap.scale.set(1.1,.42,1.35);
    cylinder(c,0,.48,0,1.05,1.35,PAL.glass);
    const roofCap=mesh(c,new T.SphereGeometry(1.12,16,10),PAL.white,0,1.75,0);
    roofCap.scale.set(1.1,.38,1.3);
    for(const sx of [-.9,.9])beam(c,[sx,.5,.65],[sx,1.75,.65],.04,PAL.white);
    beam(c,[0,1.95,0],[0,2.25,0],.1,PAL.steel);
  }

  // 6. PLATAFORMA DE EMBARQUE/DESEMBARQUE (SETOR 25.3)
  const plat=group(g,0,9.0);
  plat.name='Plataforma de Embarque 25.3';
  box(plat,0,.3,0,26,1.8,5.5,PAL.concrete);
  box(plat,0,2.1,0,27,.25,6.0,'#263238');
  box(plat,0,6.0,0,28,.35,6.5,PAL.white);
  for(const px of [-12,-6,0,6,12])for(const pz of [-2.5,2.5]){
    beam(plat,[px,2.1,pz],[px,6.0,pz],.16,PAL.steel);
  }
  box(plat,0,3.1,3.0,26,2.0,.08,PAL.glass);
  box(plat,0,3.1,-3.0,26,2.0,.08,PAL.glass);
  for(let step=0;step<4;step++){
    box(plat,0,.2+step*.35,3.2+step*.9,14,.35,1.0,PAL.concrete);
  }

  // 7. PASSARELA ELEVADA DE PEDESTRES (SETOR 25.2)
  const walkway=group(g,-22,9.0);
  walkway.name='Passarela Elevada de Pedestres 25.2';
  box(walkway,0,4.2,0,34,.38,3.8,'#cfd8dc');
  box(walkway,0,4.45,0,34,.16,3.4,'#37474f');
  for(const side of [-1.8,1.8]){
    box(walkway,0,5.2,side,34,1.2,.06,PAL.glass);
    beam(walkway,[-17,5.8,side],[17,5.8,side],.08,PAL.steel);
    for(let x=-16;x<=16;x+=3){
      beam(walkway,[x,4.5,side],[x,5.8,side],.05,PAL.steel);
    }
  }
  for(const wx of [-10,8]){
    beam(walkway,[wx,.2,-1.5],[wx-1.0,4.2,-1.5],.2,PAL.steel);
    beam(walkway,[wx,.2,1.5],[wx-1.0,4.2,1.5],.2,PAL.steel);
    beam(walkway,[wx,.2,-1.5],[wx+1.0,4.2,-1.5],.2,PAL.steel);
    beam(walkway,[wx,.2,1.5],[wx+1.0,4.2,1.5],.2,PAL.steel);
  }
  const tower=group(g,-39,9.0);
  box(tower,0,.3,0,5.0,11.0,5.0,'#263238');
  box(tower,0,5.5,0,5.2,4.5,5.2,PAL.glass);
  box(tower,0,11.3,0,5.6,.4,5.6,PAL.white);
}

export function buildAgroPlace(g){
  g.name='AgroPlace (Setor 19) · Rotunda de Eventos';
  mesh(g,new T.CylinderGeometry(26,26,.2,48),PAL.concrete,0,.1,0);
  for(let r=21;r<=25;r+=2){
    const step=mesh(g,new T.CylinderGeometry(r,r,.18,48),PAL.concrete,0,.12+(25-r)*.06,0);
    step.castShadow=false;
  }
  cylinder(g,0,.3,0,18.5,1,PAL.concrete);
  cylinder(g,0,1.3,0,17.2,5.2,PAL.glass);
  for(let i=0;i<16;i++){
    const a=i/16*Math.PI*2,px=Math.cos(a)*17.5,pz=Math.sin(a)*17.5;
    cylinder(g,px,1.3,pz,.45,5.2,PAL.concrete);
  }
  box(g,0,6.5,0,38,.4,38,'#36543b');
  cylinder(g,0,6.7,0,18.8,.3,PAL.concrete);
  cylinder(g,0,7.0,0,17,4.8,PAL.glass);
  ring(g,0,7.0,0,17.6,.18,'#8aaf69');
  ring(g,0,11.8,0,17.6,.18,'#8aaf69');
  for(let i=0;i<60;i++){
    const a=i/60*Math.PI*2;
    const b=box(g,Math.cos(a)*17.4,7.0,Math.sin(a)*17.4,.55,4.6,.35,i%3===0?'#8aaf69':'#466b42');
    b.rotation.y=-a;
  }
  const dome=mesh(g,new T.SphereGeometry(18.2,32,16,0,Math.PI*2,0,Math.PI/2),'#4a674e',0,11.8,0);
  dome.scale.y=.35;
  cylinder(g,0,15.8,0,3.5,1.2,PAL.glass);
  cylinder(g,0,17.0,0,4.2,.35,PAL.white);
  box(g,0,3.8,19.5,14,.3,8,PAL.white);
  for(const x of [-6,6])beam(g,[x,.3,23],[x,3.8,23],.2,PAL.steel);
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2+Math.PI/8,lx=Math.cos(a)*23.5,lz=Math.sin(a)*23.5;
    lamp(g,lx,lz,6);
    shrub(g,Math.cos(a)*21,Math.sin(a)*21,.9);
  }
}

export function buildTower(g){
  g.name='Árvore da Vida · torre observada';cylinder(g,0,.1,0,8,.3,PAL.concrete);
  cylinder(g,0,.4,0,1.85,42.5,'#a9aaa3',1.55);
  for(let y=2;y<43;y+=2.9)ring(g,0,y,0,1.86-(y/43)*.29,.025,'#8d918c');
  cylinder(g,0,42.9,0,2.6,.7,PAL.concrete);cylinder(g,0,43.6,0,2.3,2.5,'#b8bcb8');
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const b=box(g,Math.cos(a)*2.3,44.1,Math.sin(a)*2.3,.72,1,.08,PAL.dark);b.rotation.y=Math.PI/2-a;}
  cylinder(g,0,46.1,0,2.65,.35,PAL.concrete);cylinder(g,0,46.45,0,1.7,1.1,'#777c76');
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;beam(g,[Math.cos(a)*2.55,43.1,Math.sin(a)*2.55],[Math.cos(a)*2.55,44.2,Math.sin(a)*2.55],.028,PAL.steel);}ring(g,0,44.2,0,2.55,.035,PAL.steel);
}

const villagePattern=[
  ['torres',4.8,6.8,'#d9e7dc'],['pagode',5,5.7,'#dcc9ae'],['pagode',5,7.3,'#e6e5dc'],['reto',4.3,5.2,'#e9e9df'],['torres',5.7,7.3,'#d9b864'],['cupula',5.6,7.2,'#eee7d5'],['reto',4.7,5.5,'#e0dacc'],['arcada',4.8,4.6,'#eee9de'],['duplo',5.5,6.1,'#eee9dc'],['frontao',4.5,4.8,'#799080'],['colunas',6.5,5.4,'#e4dfd2'],['torres',4.6,6.5,'#efe9db'],['frontao',4.8,4.9,'#eee6d1'],['reto',4.5,6.1,'#b7c3bb'],['torres',4.2,7.1,'#c69179'],['frontao',4.6,5.5,'#a59981'],['reto',4.4,5.2,'#e5e7df']
];
export function buildVillage(g){
  g.name='Vila das Nações · sequência de fachadas na orla';
  const total=villagePattern.reduce((s,p)=>s+p[1]+.2,0);
  const half=total/2;
  const curveZ=(x)=>-6.5*(1-Math.min(1,Math.pow(x/half,2)));
  const curveAngle=(x)=>-Math.atan(13*x/Math.pow(half,2));

  // 1. CALÇADÃO E DECK DA ORLA EM ARCO (setback 12-15m da lâmina d'água)
  const backPts=[],frontPts=[];
  for(let i=0;i<=32;i++){
    const t=i/32,px=-half-3+t*(total+6),pz=curveZ(px);
    backPts.push([px,pz-2.2]);
    frontPts.push([px,pz+8.2]);
  }
  polygon(g,[...backPts,...frontPts.reverse()],PAL.concrete,.1,.35);

  // Guarda-corpo e degraus de contemplação para o lago
  for(let i=0;i<32;i++){
    const p1x=-half-3+i/32*(total+6),p1z=curveZ(p1x)+8.2;
    const p2x=-half-3+(i+1)/32*(total+6),p2z=curveZ(p2x)+8.2;
    beam(g,[p1x,1.05,p1z],[p2x,1.05,p2z],.045,PAL.steel);
    beam(g,[p1x,.4,p1z],[p2x,.4,p2z],.035,PAL.steel);
    if(i%2===0)beam(g,[p1x,.1,p1z],[p1x,1.1,p1z],.045,PAL.steel);
    for(let s=0;s<3;s++){
      const sz1=p1z+.4+s*.5,sz2=p2z+.4+s*.5;
      beam(g,[p1x,.12-s*.08,sz1],[p2x,.12-s*.08,sz2],.18,PAL.concrete);
    }
  }

  // 2. FACHADAS TEMÁTICAS DISTRIBUÍDAS AO LONGO DO ARCO
  let x=-half;
  villagePattern.forEach(([type,w,h,color],i)=>{
    const cx=x+w/2,cz=curveZ(cx),rot=curveAngle(cx);
    const f=group(g,cx,cz,rot);
    f.name='Fachada '+String(i+1).padStart(2,'0')+' · '+type;
    box(f,0,.4,-.8,w,h,1.7,color);
    box(f,0,h+.3,-.8,w+.2,.25,1.9,PAL.white);
    for(let j=0;j<3;j++)archWindow(f,(j-1)*w*.27,.8,.07,w*.18,2.1,PAL.dark);
    if(['reto','torres','colunas'].includes(type))for(let row=0;row<2;row++)for(let j=0;j<4;j++){box(f,(j-1.5)*w*.21,3.3+row*1.1,.075,w*.12,.7,.055,PAL.glass);}
    if(type==='torres')for(const s of [-1,1]){box(f,s*w*.39,.4,0,w*.18,h+1.4,1.8,color);mesh(f,new T.ConeGeometry(w*.13,2.4,6),PAL.white,s*w*.39,h+3,0);}
    if(type==='cupula'){
      cylinder(f,0,h+.5,-.7,w*.28,.8,PAL.white);const d=mesh(f,new T.SphereGeometry(w*.29,18,12,0,Math.PI*2,0,Math.PI/2),PAL.white,0,h+1.3,-.7);d.scale.y=1.2;beam(f,[0,h+2.8,-.7],[0,h+3.4,-.7],.045,PAL.gold||'#b2a171');
    }
    if(type==='duplo')for(const s of [-1,1]){const d=mesh(f,new T.SphereGeometry(w*.22,14,10,0,Math.PI*2,0,Math.PI/2),PAL.white,s*w*.27,h+.5,-.5);d.scale.set(.85,1.3,.8);}
    if(type==='frontao'||type==='colunas'){
      const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,2);shape.closePath();mesh(f,new T.ExtrudeGeometry(shape,{depth:.35,bevelEnabled:false}),PAL.white,0,h+.5,-.05);
      if(type==='colunas')for(let j=0;j<6;j++)cylinder(f,(j-2.5)*w*.15,.4,.6,.11,h-.4,PAL.white);
    }
    if(type==='pagode')for(let k=0;k<3;k++){
      const r=w*.7*(1-k*.18),hh=h*.4+k*1.5;
      const sh=new T.Shape();sh.moveTo(-r,0);sh.quadraticCurveTo(-r*.5,-.4,0,.8);sh.quadraticCurveTo(r*.5,-.4,r,0);sh.lineTo(r,-.25);sh.quadraticCurveTo(0,.1,-r,-.25);sh.closePath();mesh(f,new T.ExtrudeGeometry(sh,{depth:2,bevelEnabled:false,curveSegments:10}),k%2?'#355349':'#533d32',0,hh,-1.5);
    }
    for(const s of [-1,1])box(f,s*(w/2-.15),.4,.09,.16,h,.18,PAL.white);
    box(f,0,.45,1,w+.2,.22,1.5,PAL.concrete);
    if(i%2===0){
      box(f,0,2.6,1.4,w*.8,.12,1.6,['#c94a38','#335c67','#e09f3e','#556b2f'][i%4]);
      beam(f,[-w*.35,.2,2.1],[-w*.35,2.6,2.1],.04,PAL.steel);
      beam(f,[w*.35,.2,2.1],[w*.35,2.6,2.1],.04,PAL.steel);
    }
    x+=w+.2;
  });

  // 3. MOBILIÁRIO URBANO, CAFÉS E ILUMINAÇÃO DA ORLA
  for(let xx=-half+4;xx<=half-4;xx+=9){
    const lz=curveZ(xx)+7.2;
    lamp(g,xx,lz,4.8);
    if(Math.abs(xx%18)<5){
      cylinder(g,xx-1.5,.35,lz-2.2,.6,.7,PAL.concrete);
      cylinder(g,xx-1.5,.7,lz-2.2,.04,1.8,PAL.steel);
      mesh(g,new T.ConeGeometry(1.6,.45,8),['#d4a373','#3a5a40','#b56576'][Math.abs(Math.round(xx))%3],xx-1.5,2.4,lz-2.2);
    }
  }
}

export function buildParking(g){
  g.name='Estacionamento · pavimento e canteiros';box(g,0,.08,0,110,.18,70,PAL.road);
  for(let z=-27;z<=27;z+=18){for(let x=-49;x<48;x+=5.4){path(g,[[x,z],[x+2.4,z+7.8],[x+7.8,z+7.8]],.14,PAL.white,.285,false,false);}box(g,0,.31,z-4,105,.06,.12,'#a8afb1');}
  for(let z=-23;z<=22;z+=18){box(g,-50,.3,z,4,.22,10,PAL.grass);box(g,50,.3,z,4,.22,10,PAL.grass);shrub(g,-50,z,.9);shrub(g,50,z,.9);lamp(g,0,z,8);}
  for(const [x,z,c] of [[-36,-22,PAL.white],[-18,-4,'#697e8b'],[25,14,'#a75245'],[36,-22,'#d4d6d2']]){const car=group(g,x,z,-.3);box(car,0,.3,0,2.7,1,5.2,c);box(car,0,1.3,-.1,2.3,.65,2.7,PAL.glass);box(car,0,1.95,-.1,2.4,.08,2.8,c);}
}

export function buildAutodromo(g,terrain){
  g.name='Autódromo · traçado, zebras e arquibancadas';
  const cx=828,cz=640;
  const local=pts=>pts.map(([x,z])=>[x-cx,z-cz]);
  polygon(g,local([[562,658],[576,614],[760,413],[811,386],[855,383],[890,399],[961,553],[1030,720],[1078,799],[1073,832],[1040,871],[999,882],[928,873],[852,846],[757,811],[654,753],[573,710]]),PAL.grass,.05,.12);
  for(const [w,c,y] of [[16.5,'#9ba18c',.3],[12.3,PAL.white,.36],[11.3,PAL.road,.39]]){path(g,local(terrain.raceTrack),w,c,y,true);for(const p of terrain.raceConnections)path(g,local(p),w,c,y,false,false);}
  // Áreas de escape interpretadas; contorno final depende da planta de sinalização.
  polygon(g,local([[799,451],[817,430],[838,431],[848,449],[853,464],[831,456]]),PAL.blue,.405,.012);
  polygon(g,local([[751,725],[743,743],[726,748],[709,736],[720,718]]),PAL.blue,.405,.012);
  const pits=group(g,706-cx,529-cz,.77);box(pits,0,.5,0,188,6.8,12,PAL.concrete);box(pits,0,7.3,0,193,.4,15,PAL.white);
  for(let i=0;i<36;i++){const x=-89+i*5.08;box(pits,x,.8,6.05,4.3,4.1,.13,PAL.dark);box(pits,x,5,6.1,4.3,1.8,.12,PAL.glass);for(let y=1;y<4.8;y+=.7)box(pits,x,y,6.15,4.2,.04,.04,PAL.steel);}
  stand(g,702-cx,491-cz,147,16,.77);stand(g,808-cx,424-cz,45,14,.7);
  const curve=new T.CatmullRomCurve3(local(terrain.raceTrack).map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal');
  for(let i=0;i<80;i++){const p=curve.getPointAt(i/80),t=curve.getTangentAt(i/80);lamp(g,p.x-t.z*12,p.z+t.x*12,12);}
}

export const builders={'portico-de-entrada':buildPortico,bmx:buildBMX,'skate-park':buildSkate,kartodromo:buildKartodromo,motocross:buildMotocross,'roda-gigante':buildWheel,agroplace:buildAgroPlace,'arvore-da-vida':buildTower,'vila-das-nacoes':buildVillage,'estrutura-e-acesso':buildParking,autodromo:buildAutodromo};

/** Cria o estudo em coordenadas locais. A Arena e o Autódromo usam a base existente. */
export function createRefinedSpace(id,{terrain}={}){
  const fn=builders[id];if(!fn)throw new Error('Modelo dependente da base existente: '+id);
  const g=new T.Group();fn(g,terrain);g.userData={placeId:id,reference:referencias.find(r=>r.id===id)?.foto,units:'unidades gráficas da implantação; escala não levantada'};return g;
}

/** Substitui somente os grupos indicados, antes da consolidação dos meshes existentes. */
export function applyPhotoRefinements(models,{terrain}){
  for(const ref of referencias){
    if(!builders[ref.id]||['estrutura-e-acesso','autodromo'].includes(ref.id))continue;
    const target=models.get(ref.id);if(!target)continue;
    target.traverse(o=>{if(o.isMesh)o.geometry.dispose();});target.clear();
    const g=createRefinedSpace(ref.id,{terrain});g.position.set(ref.centro[0],0,ref.centro[1]);g.rotation.y=ref.angulo||0;if(ref.escala)g.scale.fromArray(ref.escala);target.add(g);
  }
  // Respeita o polígono real do estacionamento, evitando substituí-lo por retângulo genérico.
  models.get('estrutura-e-acesso')?.traverse(o=>{if(o.isMesh&&o.material?.name==='#cfccb6')o.material=material(PAL.road);});
}

export const primitives={add:mesh,box,beam,tube,path,polygon,cylinder,groupAt:group,C:{...PAL,stone:PAL.concrete,water:'#376c7e',gold:'#b2a171',wood:'#795b41'},inPolygon(point,vs){let inside=false;for(let i=0,j=vs.length-1;i<vs.length;j=i++){const [x,z]=point,[xi,zi]=vs[i],[xj,zj]=vs[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;}return inside;}};
