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
  {id:'bmx',nome:'Pista de BMX',foto:'06-bmx.png',centro:[307,865],angulo:.36,escala:[.9,1,.86],vista:[1,.9,1.15],ajustes:['Quatro retas conectadas por curvas','Superfície azul e curvas amarelas','Ondulações integradas e plataformas de largada abertas']},
  {id:'skate-park',nome:'Skate Park',foto:'07-skate.png',centro:[261,786],angulo:-.25,escala:[.9,1,.77],vista:[1,1.25,1],ajustes:['Bowls rebaixados com formas diferentes','Área street com corrimãos e rampas','Marquises brancas e caminhos entre os setores']},
  {id:'kartodromo',nome:'Kartódromo',foto:'08-kartodromo.png',centro:[443,837],vista:[-1,1.2,1],ajustes:['Traçado existente preservado','Edifício linear e marquise escura','Pilares, estrutura superior e acessos modulados']},
  {id:'motocross',nome:'Pista de Motocross',foto:'05-motocross.png',centro:[363,963],angulo:.74,vista:[1,1.1,1],ajustes:['Percurso de terra serpenteando pela área','Saltos integrados à pista','Taludes de terra com entorno verde']},
  {id:'roda-gigante',nome:'Roda-gigante',foto:'09-roda-gigante.png',centro:[508,738],angulo:.74,vista:[.62,.32,1],ajustes:['Dois aros, raios e 42 cabines','Apoios inclinados e eixo exposto','Passarela elevada 25.2 e plataforma 25.3']},
  {id:'agroplace',nome:'AgroPlace',foto:'19-agroplace.png',centro:[398,701],vista:[.6,.4,1],ajustes:['Rotunda arquitetônica independente (Setor 19)','Brises metálicos e mezanino panorâmico','Esplanada própria de circulação']},
  {id:'arvore-da-vida',nome:'Árvore da Vida',foto:'10-arvore-da-vida.png',centro:[283,598],vista:[1,.5,1],ajustes:['Fuste cilíndrico esbelto','Coroamento compacto conforme o print','Acabamento superior ainda interpretativo']},
  {id:'vila-das-nacoes',nome:'Vila das Nações',foto:'11-vila-das-nacoes.png',centro:[447,568],angulo:-Math.PI/2+.4,vista:[.25,.55,1],ajustes:['Fachadas temáticas com silhuetas distintas','Torres, cúpulas, frontões e arcadas','Passeio contínuo voltado para a orla']},
  {id:'autodromo',nome:'Autódromo',foto:'01-autodromo.png',centro:[828,640],vista:[-1,1.3,1],ajustes:['Circuito e ligação já existentes preservados','Boxes, arquibancadas e postes','Pintura azul concentrada nas áreas de escape']},
  {id:'estrutura-e-acesso',nome:'Estacionamentos',foto:'04-estacionamentos.png',centro:[789,982],vista:[.4,1.5,1],ajustes:['Pavimento cinza e marcações legíveis','Vias internas e ilhas verdes','Vagas conforme as áreas existentes']}
];

const PAL={white:'#f5f7f8',concrete:'#c7c6bd',steel:'#424f56',dark:'#182026',glass:'#365f70',blue:'#0060c0',yellow:'#f2c808',grass:'#466934',earth:'#9a5332',road:'#25292c',green:'#2c4c23'};
const materialCache=new Map();
function material(c,metalness=0,roughness=.72){
  const isGlass=c===PAL.glass;
  const isSteel=[PAL.steel,PAL.dark,'#bdc7ca'].includes(c);
  const m=metalness||(isSteel?.65:0);
  const r=roughness||(isSteel?.26:isGlass?.12:.72);
  const key=[c,m,r].join('|');
  if(!materialCache.has(key)){
    const mat=isGlass
      ? new T.MeshPhysicalMaterial({color:c,metalness:.2,roughness:.1,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:2})
      : new T.MeshStandardMaterial({color:c,metalness:m,roughness:r,envMapIntensity:isSteel?1.5:.85});
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
function shrub(g,x,z,r=1){const m=mesh(g,new T.IcosahedronGeometry(r,1),PAL.green,x,.6+r*.55,z);m.scale.y=.65;}
function archWindow(g,x,y,z,w,h,c=PAL.glass){
  const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h-w/2);s.absarc(0,h-w/2,w/2,0,Math.PI,false);s.closePath();mesh(g,new T.ShapeGeometry(s),c,x,y,z);
  const ps=[[-w/2,0],[-w/2,h-w/2],...Array.from({length:15},(_,i)=>{const a=Math.PI-i/14*Math.PI;return [Math.cos(a)*w/2,h-w/2+Math.sin(a)*w/2];}),[w/2,0]];tube(g,ps.map(([a,b])=>[x+a,y+b,z+.03]),.065,PAL.white);
}

export function buildPortico(g){
  g.name='Pórtico · duas asas';
  // Canteiro central oval e ajardinado no encontro das duas cascas
  const islandCurbs=mesh(g,new T.CylinderGeometry(1,1,.32,48),PAL.concrete,0,.2,0);
  islandCurbs.scale.set(3.8,1,11);
  const islandLawn=mesh(g,new T.CylinderGeometry(1,1,.36,48),PAL.grass,0,.22,0);
  islandLawn.scale.set(3.2,1,10.2);
  for(let i=0;i<16;i++){
    const a=i*Math.PI*2/16;
    shrub(g,Math.cos(a)*2.4,Math.sin(a)*8.5,.9);
  }

  // Duas cascas arqueadas de concreto com envoltória fanning e encontro escalonado
  for(const side of [-1,1]){
    const zOffset=side*3.2; // Escalonamento entre as asas conforme a implantação
    const span=27.5; // Vão livre cruzando a pista até a base externa no meio-fio
    const n=64,v=[],ix=[];
    const y=t=>.5+16.5*Math.pow(Math.sin(Math.PI*t),.84);
    const halfW=t=>3.4+3.8*t; // Mais estreito no canteiro central e expande na guia externa
    
    for(let i=0;i<=n;i++){
      const t=i/n,x=side*(1.2+span*t),w=halfW(t);
      v.push(x,y(t),zOffset-w,x,y(t)+.75,zOffset+w);
      if(i<n){const k=2*i;ix.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
    const skin=surface(g,v,ix,'#dce2df');
    skin.material=material('#dce2df').clone();skin.material.side=T.DoubleSide;

    // Bordas tubulares e vigas longitudinais
    for(const factor of [-1,-.5,0,.5,1]){
      const pts=Array.from({length:65},(_,i)=>{
        const t=i/64,w=halfW(t);
        return[side*(1.2+span*t),y(t)+.08*(1-t)+(factor*w)/18,zOffset+factor*w];
      });
      tube(g,pts,Math.abs(factor)===1?.32:.18,PAL.white);
    }

    // Travamentos transversais e nervuras estruturais sob a cobertura
    for(let i=2;i<span;i+=2.5){
      const t=i/span,x=side*(1.2+span*t),w=halfW(t);
      beam(g,[x,y(t)-.12,zOffset-w],[x,y(t)+.62,zOffset+w],.075,PAL.white);
    }

    // Blocos de fundação e pilares de engaste: no canteiro central e no meio-fio
    box(g,side*1.5,.3,zOffset,1.8,1.2,7.6,PAL.concrete);
    box(g,side*(1.2+span),.3,zOffset,2.2,1.3,15.2,PAL.concrete);
  }

  // Postes de iluminação viária nas margens do acesso
  for(const z of [-18,0,18])lamp(g,-34,z,6);
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

function bowl(g,cx,cz,rx,rz,depth,phase=0){
  const radius=(a)=>1+.12*Math.cos(3*a+phase)+.05*Math.sin(2*a);
  const seg=72,rings=18,v=[],ix=[];const y0=3.3;
  for(let j=0;j<=rings;j++)for(let i=0;i<=seg;i++){const q=j/rings,a=i/seg*Math.PI*2,rr=radius(a);v.push(cx+Math.cos(a)*rx*q*rr,y0-depth+depth*Math.pow(q,4.5),cz+Math.sin(a)*rz*q*rr);if(j<rings&&i<seg){const k=j*(seg+1)+i;ix.push(k,k+1,k+seg+1,k+1,k+seg+2,k+seg+1);}}
  const m=surface(g,v,ix,'#c8c4b8');m.material=material('#c8c4b8').clone();m.material.side=T.DoubleSide;
  const rim=Array.from({length:73},(_,i)=>{const a=i/72*Math.PI*2,rr=radius(a);return[cx+Math.cos(a)*rx*rr,y0+.055,cz+Math.sin(a)*rz*rr];});tube(g,rim,.09,'#768895',true);
  return rim.map(([x,,z])=>[x,z]);
}
export function buildSkate(g){
  g.name='Skate · bowls e street';box(g,0,.1,0,48,.22,66,PAL.grass);
  const sectors=[{x:-4,z:-20,w:31,d:20,b:[[-3,-20,7.6,5.5,2.4,.7]]},{x:4,z:3,w:36,d:25,b:[[5,3,10,6.8,2.6,2.1]]}];
  for(const s of sectors){const sh=new T.Shape();sh.moveTo(s.x-s.w/2,-s.z-s.d/2);sh.lineTo(s.x+s.w/2,-s.z-s.d/2);sh.lineTo(s.x+s.w/2,-s.z+s.d/2);sh.lineTo(s.x-s.w/2,-s.z+s.d/2);sh.closePath();for(const b of s.b){const rim=bowl(g,...b),hole=new T.Path();rim.forEach(([x,z],i)=>i?hole.lineTo(x,-z):hole.moveTo(x,-z));hole.closePath();sh.holes.push(hole);}const geo=new T.ExtrudeGeometry(sh,{depth:2.95,bevelEnabled:false});geo.rotateX(-Math.PI/2);mesh(g,geo,'#c0b7a7',0,.35,0);}
  box(g,-4,.35,25,35,2.95,19,'#c0b7a7');
  for(let j=0;j<5;j++)box(g,4,3.3+j*.22,21+j*.75,6,.23,.8,PAL.concrete);
  beam(g,[-10,4,24],[-1,4,27],.07,PAL.steel);for(const [x,z] of [[-10,24],[-1,27]])beam(g,[x,3.3,z],[x,4,z],.07,PAL.steel);
  for(const [x,z] of [[-12,17],[8,27]]){box(g,x,3.3,z,3,.75,5,PAL.concrete);box(g,x,4.05,z,3.1,.08,5.1,PAL.steel);}
  const rv=[],ri=[];for(let i=0;i<=20;i++){const t=i/20;rv.push(-19,3.3+2.3*t*t,30-t*6,-9,3.3+2.3*t*t,30-t*6);if(i<20){const k=i*2;ri.push(k,k+2,k+1,k+1,k+2,k+3);}}surface(g,rv,ri,PAL.concrete);
  for(const a of [[-16,-7,9,5],[15,-15,8,5],[14,17,8,5],[-13,35,12,4]])canopy(g,...a,6.2);
  for(const x of [-23,23])for(const z of [-27,-4,26])lamp(g,x,z,8);
  path(g,[[21,-32],[23,0],[23,33]],3,'#b88e67',.36,false,false);
}

export function buildKartodromo(g,terrain){
  g.name='Kartódromo · edifício e circuito';const cx=443,cz=837;
  const pts=terrain.kartTrack.map(([x,z])=>[x-cx,z-cz]);
  polygon(g,[[-69,-54],[9,-64],[60,-12],[58,37],[15,85],[-42,91],[-69,38]],PAL.grass,.1,.15);
  path(g,pts,11.4,PAL.concrete,.35,true);path(g,pts,9.8,PAL.road,.39,true);path(g,pts,9.4,'#666d70',.41,true);
  const b=group(g,379-cx,852-cz,.12);b.name='Boxes do kart · marquise linear';
  box(b,0,.4,0,12,4.7,80,PAL.concrete);box(b,6.1,4.85,0,.12,.5,80,PAL.white);
  box(b,3.1,4.7,0,20,.35,84,'#354149');
  for(let z=-38;z<=38;z+=5.4){box(b,6.08,.7,z,.13,3.3,4.4,PAL.dark);beam(b,[12,.4,z],[12,4.7,z],.075,PAL.steel);beam(b,[-5.4,5.1,z],[-5.4,9.4,z],.1,PAL.steel);beam(b,[5.4,5.1,z],[5.4,9.4,z],.1,PAL.steel);beam(b,[-5.4,9.2,z],[5.4,9.2,z+2.7],.065,PAL.steel);}
  box(b,0,9.4,-8,13,.22,68,PAL.white);
  for(const x of [-5.4,5.4]){beam(b,[x,9.1,-40],[x,9.1,40],.12,PAL.steel);beam(b,[x,8.1,-40],[x,8.1,40],.1,PAL.steel);for(let z=-39;z<39;z+=3)beam(b,[x,8.1,z],[x,9.1,z+3],.065,PAL.steel);}
  box(b,0,5.1,34,11,.25,14,PAL.concrete);
  for(let k=0;k<14;k++)box(b,9,1+k*.27,37-k*.6,3,.26,.7,PAL.concrete);
  for(const [x,z] of [[-35,-45],[8,-55],[50,-12],[25,66],[-43,71]])lamp(g,x,z,10);
}

export function buildMotocross(g){
  g.name='Motocross · pista de terra';polygon(g,[[-25,-67],[22,-60],[26,63],[18,68],[-25,60]],PAL.earth,.15,.3);
  const pts=[[-22,44],[-22,0],[-22,-43],[-13,-56],[4,-56],[18,-43],[20,-13],[20,43],[13,56],[1,55],[-5,45],[-5,27],[6,11],[7,-5],[8,-24],[1,-38],[-6,-41],[-12,-30],[-10,-18],[-4,-6],[-7,8],[-13,23],[-13,43],[-17,50]];
  const curve=new T.CatmullRomCurve3(pts.map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal'),v=[],ix=[],n=800;
  const h=t=>.66+Math.pow(Math.max(0,Math.sin(t*Math.PI*24)),3)*1.3+.5*Math.pow(Math.sin(t*Math.PI*4),2);
  for(let i=0;i<=n;i++){const t=i/n,p=curve.getPointAt(t),tan=curve.getTangentAt(t);for(const s of [-1,1])v.push(p.x-tan.z*2.5*s,h(t)+.18,p.z+tan.x*2.5*s);if(i<n){const k=i*2;ix.push(k,k+2,k+1,k+1,k+2,k+3);}}
  const pista=surface(g,v,ix,'#d98b59');pista.material=material('#d98b59').clone();pista.material.side=T.DoubleSide;
  for(const side of [-1,1]){const vs=[],ids=[];for(let i=0;i<=n;i++){const t=i/n,p=curve.getPointAt(t),tan=curve.getTangentAt(t);vs.push(p.x-tan.z*2.5*side,h(t)+.17,p.z+tan.x*2.5*side,p.x-tan.z*3.7*side,.53,p.z+tan.x*3.7*side);if(i<n){const k=i*2;ids.push(k,k+2,k+1,k+1,k+2,k+3);}}const edge=surface(g,vs,ids,'#ac643f');edge.material=material('#ac643f').clone();edge.material.side=T.DoubleSide;}
  for(let z=-57;z<=58;z+=18){lamp(g,24,z,8);for(const x of [-25,25])beam(g,[x,.3,z],[x,1.9,z],.045,PAL.steel);}
  for(const x of [-25,25])beam(g,[x,1.8,-63],[x,1.8,61],.03,PAL.steel);
}

export function buildWheel(g){
  g.name='Roda-gigante (Setor 25) · Praça, Plataforma 25.3 e Passarela 25.2';

  // 1. PRAÇA CIRCULAR DO SETOR 25 (Diâmetro 68m, raio 34)
  mesh(g,new T.CylinderGeometry(34,34,.22,64),PAL.concrete,0,.1,0);
  ring(g,0,.23,0,32,.5,'#b8c2be');
  ring(g,0,.23,0,24,.35,'#c9d1cc');
  ring(g,0,.23,0,16,.25,'#b8c2be');

  // Canteiros radiais e iluminação
  for(let k=0;k<6;k++){
    const a=k/6*Math.PI*2+Math.PI/6,qx=Math.cos(a)*27,qz=Math.sin(a)*27;
    mesh(g,new T.CylinderGeometry(3.5,3.5,.25,24),PAL.grass,qx,.24,qz);
    shrub(g,qx,qz,1.2);
    lamp(g,Math.cos(a)*32,Math.sin(a)*32,7);
  }

  // 2. FUNDAÇÃO E PYLONS EM "A" DA RODA-GIGANTE
  const r=23.5,cy=28.5; // Raio 23.5m, centro a 28.5m de altura
  for(const s of [-1,1])for(const z of [-5.5,5.5]){
    box(g,s*13.5,.25,z,4.2,.8,4.2,PAL.concrete);
    box(g,s*13.5,.85,z,3.2,.4,3.2,PAL.steel);
    beam(g,[s*13.5,1.0,z],[0,cy,z*.4],.65,PAL.white);
    beam(g,[s*13.5,1.0,z*.8],[0,cy,z*.4],.45,PAL.steel);
  }
  beam(g,[-13.5,6,-5.5],[-13.5,6,5.5],.35,PAL.white);
  beam(g,[13.5,6,-5.5],[13.5,6,5.5],.35,PAL.white);
  beam(g,[-13.5,14,-3.8],[-13.5,14,3.8],.3,PAL.white);
  beam(g,[13.5,14,-3.8],[13.5,14,3.8],.3,PAL.white);

  // Eixo central fixo de alta robustez com mancal
  beam(g,[0,cy,-4.5],[0,cy,4.5],1.2,PAL.steel);
  cylinder(g,0,cy,-2.8,1.8,.9,PAL.white);
  cylinder(g,0,cy,2.8,1.8,.9,PAL.white);

  // 3. AROS DUPLOS E TRELIÇAS EM ZIG-ZAG
  for(const z of [-2.8,2.8]){
    ring(g,0,cy,z,r,.24,PAL.white,true);
    ring(g,0,cy,z,r-1.1,.16,PAL.white,true);
  }
  for(let i=0;i<42;i++){
    const a=i/42*Math.PI*2,x=Math.cos(a)*r,y=cy+Math.sin(a)*r;
    beam(g,[x,y,-2.8],[x,y,2.8],.11,PAL.white);
    const aNext=(i+1)/42*Math.PI*2,nx=Math.cos(aNext)*r,ny=cy+Math.sin(aNext)*r;
    beam(g,[x,y,-2.8],[nx,ny,2.8],.075,PAL.white);
    beam(g,[x,y,2.8],[nx,ny,-2.8],.075,PAL.white);
    for(const z of [-2.8,2.8]){
      beam(g,[0,cy,z*.45],[x,y,z],.055,'#c4cfd2');
    }
  }

  // 4. EXATAMENTE 42 CABINES CLIMATIZADAS COM ORIENTAÇÃO GRAVITACIONAL VERTICAL
  for(let i=0;i<42;i++){
    const a=i/42*Math.PI*2,x=Math.cos(a)*r,y=cy+Math.sin(a)*r;
    beam(g,[x,y,0],[x,y-1.1,0],.1,PAL.steel);
    const c=group(g,x,0);
    c.position.y=y-1.2;
    c.name='Cabine '+String(i+1).padStart(2,'0')+' (Setor 25)';
    const baseCap=mesh(c,new T.SphereGeometry(1.1,14,8),PAL.white,0,.42,0);
    baseCap.scale.set(1.05,.4,1.3);
    cylinder(c,0,.45,0,.98,1.25,PAL.glass);
    const roofCap=mesh(c,new T.SphereGeometry(1.08,14,8),PAL.white,0,1.65,0);
    roofCap.scale.set(1.05,.35,1.25);
    for(const sx of [-.85,.85])beam(c,[sx,.5,.6],[sx,1.65,.6],.035,PAL.white);
    beam(c,[0,1.85,0],[0,2.15,0],.1,PAL.steel);
  }

  // 5. PLATAFORMA DE EMBARQUE/DESEMBARQUE (SETOR 25.3)
  const plat=group(g,0,14);
  plat.name='Plataforma de Embarque 25.3';
  box(plat,0,.3,0,32,1.8,12,PAL.concrete);
  box(plat,0,2.1,0,33,.2,13,'#37474f');
  box(plat,0,6.2,0,35,.35,14,PAL.white);
  for(const px of [-14,-7,0,7,14])for(const pz of [-5.5,5.5]){
    beam(plat,[px,2.1,pz],[px,6.2,pz],.16,PAL.steel);
  }
  box(plat,0,3.2,6.3,32,2.0,.08,PAL.glass);
  box(plat,0,3.2,-6.3,32,2.0,.08,PAL.glass);
  for(let step=0;step<5;step++){
    box(plat,0,.2+step*.35,6.8+step*1.1,16,.36,1.2,PAL.concrete);
  }

  // 6. PASSARELA ELEVADA DE PEDESTRES (SETOR 25.2)
  const walkway=group(g,-24,14);
  walkway.name='Passarela Elevada de Pedestres 25.2';
  box(walkway,0,3.8,0,38,.4,4.8,'#c4cec9');
  box(walkway,0,4.1,0,38,.18,4.2,'#4e6572');
  for(const side of [-2.2,2.2]){
    box(walkway,0,4.9,side,38,1.2,.06,PAL.glass);
    beam(walkway,[-19,5.5,side],[19,5.5,side],.08,PAL.steel);
    for(let x=-18;x<=18;x+=3){
      beam(walkway,[x,4.2,side],[x,5.5,side],.055,PAL.steel);
    }
  }
  for(const wx of [-12,8]){
    beam(walkway,[wx,.2,-1.8],[wx-1.2,3.8,-1.8],.2,PAL.steel);
    beam(walkway,[wx,.2,1.8],[wx-1.2,3.8,1.8],.2,PAL.steel);
    beam(walkway,[wx,.2,-1.8],[wx+1.2,3.8,-1.8],.2,PAL.steel);
    beam(walkway,[wx,.2,1.8],[wx+1.2,3.8,1.8],.2,PAL.steel);
  }
  const tower=group(g,-43,14);
  box(tower,0,.3,0,5.6,11.2,5.6,'#2c3d46');
  box(tower,0,5.5,0,5.8,4.5,5.8,PAL.glass);
  box(tower,0,11.4,0,6.2,.4,6.2,PAL.white);
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
  g.name='Vila das Nações · sequência de fachadas';const total=villagePattern.reduce((s,p)=>s+p[1]+.2,0);let x=-total/2;
  polygon(g,[[-total/2-2,-2],[0,-4],[total/2+2,-2],[total/2+2,10],[0,8],[-total/2-2,10]],PAL.concrete,.1,.3);
  villagePattern.forEach(([type,w,h,color],i)=>{
    const cx=x+w/2,z=-1.2*Math.pow(cx/(total/2),2),f=group(g,cx,z);f.name='Fachada '+String(i+1).padStart(2,'0')+' · '+type;
    box(f,0,.4,-.8,w,h,1.7,color);box(f,0,h+.3,-.8,w+.2,.25,1.9,PAL.white);
    for(let j=0;j<3;j++)archWindow(f,(j-1)*w*.27,.8,.07,w*.18,2.1,PAL.dark);
    if(['reto','torres','colunas'].includes(type))for(let row=0;row<2;row++)for(let j=0;j<4;j++){box(f,(j-1.5)*w*.21,3.3+row*1.1,.075,w*.12,.7,.055,PAL.glass);}
    if(type==='torres')for(const s of [-1,1]){box(f,s*w*.39,.4,0,w*.18,h+1.4,1.8,color);const c=mesh(f,new T.ConeGeometry(w*.13,2.4,6),PAL.white,s*w*.39,h+3,0);}
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
    box(f,0,.45,1,w+.2,.22,1.5,PAL.concrete);x+=w+.2;
  });
  for(let s=0;s<4;s++)box(g,0,.15+s*.1,9+s*.5,total+3,.11,.6,PAL.concrete);
  for(let xx=-total/2;xx<=total/2;xx+=8)lamp(g,xx,7,4.8);
}

export function buildParking(g){
  g.name='Estacionamento · pavimento e canteiros';box(g,0,.08,0,110,.18,70,PAL.road);
  for(let z=-27;z<=27;z+=18){for(let x=-49;x<48;x+=5.4){path(g,[[x,z],[x+2.4,z+7.8],[x+7.8,z+7.8]],.14,PAL.white,.285,false,false);}box(g,0,.31,z-4,105,.06,.12,'#a8afb1');}
  for(let z=-23;z<=22;z+=18){box(g,-50,.3,z,4,.22,10,PAL.grass);box(g,50,.3,z,4,.22,10,PAL.grass);shrub(g,-50,z,.9);shrub(g,50,z,.9);lamp(g,0,z,8);}
  for(const [x,z,c] of [[-36,-22,PAL.white],[-18,-4,'#697e8b'],[25,14,'#a75245'],[36,-22,'#d4d6d2']]){const car=group(g,x,z,-.3);box(car,0,.3,0,2.7,1,5.2,c);box(car,0,1.3,-.1,2.3,.65,2.7,PAL.glass);box(car,0,1.95,-.1,2.4,.08,2.8,c);}
}

export function buildAutodromo(g,terrain){
  g.name='Autódromo · estudo do conjunto';const cx=828,cz=640;
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
  // A fotografia confirma a cobertura e a bilheteria já modeladas. Refinamento do acesso.
  const arena=models.get('arena-show');arena?.traverse(o=>{if(o.name==='Bilheteria · acesso independente'){o.scale.x=1.18;o.scale.z=1.08;}});
  // Respeita o polígono real do estacionamento, evitando substituí-lo por retângulo genérico.
  models.get('estrutura-e-acesso')?.traverse(o=>{if(o.isMesh&&o.material?.name==='#cfccb6')o.material=material(PAL.road);});
}

export const primitives={add:mesh,box,beam,tube,path,polygon,cylinder,groupAt:group,C:{...PAL,stone:PAL.concrete,water:'#376c7e',gold:'#b2a171',wood:'#795b41'},inPolygon(point,vs){let inside=false;for(let i=0,j=vs.length-1;i<vs.length;j=i++){const [x,z]=point,[xi,zi]=vs[i],[xj,zj]=vs[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;}return inside;}};
