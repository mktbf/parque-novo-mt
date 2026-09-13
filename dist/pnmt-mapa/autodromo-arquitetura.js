import * as T from 'three';

/** PNMT · arquitetura R03, sobre as duas projeções CAD já registradas.
 * Unidades gráficas da prancha de 1600 px. O root aplica a origem [620,570].
 * Plantas determinam posição/contorno; alturas e repetição visual são aproximações
 * paramétricas das imagens AZM R03. Este módulo não representa um levantamento as built.
 */
export const AUTODROME_VERSION='autodromo-arquitetura-20260913-1';
export const architectureParameters=Object.freeze({
  stand:{lowerRows:14,upperRows:16,structuralBays:16,aisles:8,seatPitch:.425,seatWidth:.285},
  boxes:{modules:36,towerUpperFloors:4},
  footprintInset:.14,
});
export const architectureMaterials=new Map();
const textures=[];
const paint={concrete:'#bcbeb5',lightConcrete:'#d6d6c9',green:'#526345',steel:'#68533c',metal:'#a1a9a5',roof:'#d8dbd1',soffit:'#9b855b',shutter:'#6c7268',dark:'#2c3533',glass:'#5d8594',ochre:'#aa8045',seat:'#c39a4b'};
function material(key){
  if(!architectureMaterials.has(key)){
    const m=new T.MeshStandardMaterial({color:paint[key]||key,roughness:key==='glass'?.19:key==='metal'?.43:key==='roof'?.63:.84,metalness:key==='glass'?.28:key==='metal'?.65:key==='steel'?.45:.02,envMapIntensity:key==='glass'?1.3:.8});
    m.name='PNMT R03 · '+key;m.userData.architectureKind=key;
    architectureMaterials.set(key,m);
  }
  return architectureMaterials.get(key);
}

// Mapas pequenos, determinísticos e sem requisição externa. Microtextura em UV
// de unidade gráfica; nenhum mapa fotográfico ou de implantação é reprojetado.
export function configureArchitectureMaterials(renderer){
  if(!textures.length){
    const n=128,rough=new Uint8Array(n*n*4),normal=new Uint8Array(n*n*4),metalNormal=new Uint8Array(n*n*4);
    const h=(x,y)=>{let s=((x&127)*73856093)^((y&127)*19349663)^49317;s=Math.imul(s^(s>>>13),1274126177);return (s>>>0)/4294967295;};
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const i=(y*n+x)*4,v=190+Math.round(h(x,y)*44),dx=(h(x+1,y)-h(x-1,y))*15,dy=(h(x,y+1)-h(x,y-1))*15;
      rough.set([v,v,v,255],i);normal.set([128+dx,128+dy,254,255],i);
      const wave=Math.sin(y/n*Math.PI*16)*22;metalNormal.set([128,128+wave,253,255],i);
    }
    for(const data of [rough,normal,metalNormal]){const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.needsUpdate=true;textures.push(t);}
  }
  for(const t of textures)t.anisotropy=Math.min(8,renderer?.capabilities?.getMaxAnisotropy?.()||1);
  for(const [key,m] of architectureMaterials){
    if(['concrete','lightConcrete','green','ochre'].includes(key)){m.normalMap=textures[1];m.roughnessMap=textures[0];m.normalScale.setScalar(.18);}
    if(['shutter','roof','soffit'].includes(key)){m.normalMap=textures[2];m.normalScale.setScalar(key==='shutter'?.36:.14);}
    m.needsUpdate=true;
  }
  return textures;
}

/** Eixo longitudinal extraído do maior segmento CAD; não deriva do marcador. */
export function frameFromFootprint(item){
  const ring=item.geometry.coordinates[0];let longest=0,u=[1,0];
  for(let i=1;i<ring.length;i++){const dx=ring[i][0]-ring[i-1][0],dz=ring[i][1]-ring[i-1][1],d=Math.hypot(dx,dz);if(d>longest){longest=d;u=[dx/d,dz/d];}}
  if(u[0]<0)u=u.map(v=>-v);const v=[-u[1],u[0]];
  const xs=ring.map(p=>p[0]*u[0]+p[1]*u[1]),zs=ring.map(p=>p[0]*v[0]+p[1]*v[1]);
  const loX=Math.min(...xs),hiX=Math.max(...xs),loZ=Math.min(...zs),hiZ=Math.max(...zs),cx=(loX+hiX)/2,cz=(loZ+hiZ)/2;
  const center=[u[0]*cx+v[0]*cz,u[1]*cx+v[1]*cz];
  const matrix=new T.Matrix4().makeBasis(new T.Vector3(u[0],0,u[1]),new T.Vector3(0,1,0),new T.Vector3(v[0],0,v[1]));matrix.setPosition(center[0],.12,center[1]);
  return {center,u,v,length:hiX-loX,depth:hiZ-loZ,matrix,ring};
}

const cube=new T.BoxGeometry(1,1,1),unitBeam=new T.CylinderGeometry(1,1,1,6),UP=new T.Vector3(0,1,0);
class GeometryBuilder{
  constructor(frame){this.frame=frame;this.buckets=new Map();this.seats=[];this.parts={};}
  mesh(geo,key,matrix=new T.Matrix4(),part=key){
    let b=this.buckets.get(key);if(!b){b={position:[],normal:[],uv:[]};this.buckets.set(key,b);}
    const transform=this.frame.matrix.clone().multiply(matrix),nm=new T.Matrix3().getNormalMatrix(transform),p=geo.attributes.position,n=geo.attributes.normal,ix=geo.index;
    const local=new T.Vector3(),world=new T.Vector3(),normal=new T.Vector3();
    for(let i=0;i<(ix?.count||p.count);i++){
      const j=ix?ix.getX(i):i;local.fromBufferAttribute(p,j).applyMatrix4(matrix);world.copy(local).applyMatrix4(this.frame.matrix);normal.fromBufferAttribute(n,j).applyMatrix3(nm).normalize();
      b.position.push(...world.toArray());b.normal.push(...normal.toArray());
      const ln=new T.Vector3().fromBufferAttribute(n,j).applyMatrix3(new T.Matrix3().getNormalMatrix(matrix));
      const ax=Math.abs(ln.x),ay=Math.abs(ln.y),az=Math.abs(ln.z);
      b.uv.push((ax>ay&&ax>az?local.z:local.x)*1.8,(ay>=ax&&ay>=az?local.z:local.y)*1.8);
    }
    this.parts[part]=(this.parts[part]||0)+1;
  }
  box(x,y,z,w,h,d,key,part=key,rotation=0){
    if(Math.min(w,h,d)<=0)throw Error('Dimensão não positiva: '+part);
    const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),rotation);
    this.mesh(cube,key,new T.Matrix4().compose(new T.Vector3(x,y+h/2,z),q,new T.Vector3(w,h,d)),part);
  }
  beam(a,b,r,key='steel',part='estrutura'){
    const av=new T.Vector3(...a),bv=new T.Vector3(...b),direction=bv.clone().sub(av),length=direction.length();if(length<1e-6)return;
    const q=new T.Quaternion().setFromUnitVectors(UP,direction.normalize());
    this.mesh(unitBeam,key,new T.Matrix4().compose(av.add(bv).multiplyScalar(.5),q,new T.Vector3(r,length,r)),part);
  }
  profile(x,width,points,key,part){
    // Polígono [z,y] extrudado ao longo de X; laterais, degraus e cobertura.
    const shape=new T.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(z,y):shape.moveTo(z,y));shape.closePath();
    const geo=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false});
    const matrix=new T.Matrix4().set(0,0,-1,x+width/2,0,1,0,0,1,0,0,0,0,0,0,1);
    this.mesh(geo,key,matrix,part);geo.dispose();
  }
  railing(x0,x1,y,z,height=.38){
    for(const h of [height*.45,height])this.beam([x0,y+h,z],[x1,y+h,z],.019,'metal','guarda-corpos');
    const count=Math.ceil((x1-x0)/1.65);for(let j=0;j<=count;j++){const x=x0+(x1-x0)*j/count;this.beam([x,y,z],[x,y+height,z],.022,'metal','guarda-corpos');}
  }
  finish(target,label){
    for(const [key,b] of this.buckets){
      const geo=new T.BufferGeometry();for(const name of ['position','normal','uv'])geo.setAttribute(name,new T.Float32BufferAttribute(b[name],name==='uv'?2:3));geo.computeBoundingBox();geo.computeBoundingSphere();
      const mesh=new T.Mesh(geo,material(key));mesh.name=label+' · '+key;mesh.castShadow=key!=='glass';mesh.receiveShadow=true;mesh.userData.skipBatch=true;mesh.userData.architecturePart=label;target.add(mesh);
    }
    if(this.seats.length){
      const geo=seatGeometry(),m=material('seat'),mesh=new T.InstancedMesh(geo,m,this.seats.length);
      const palette=['#d6ad58','#c5a150','#b69b63','#bd9141'].map(c=>{const p=new T.Color(c);return p.setRGB(p.r/m.color.r,p.g/m.color.g,p.b/m.color.b);});
      for(let i=0;i<this.seats.length;i++){const p=this.seats[i];const local=new T.Matrix4().makeTranslation(p[0],p[1],p[2]);mesh.setMatrixAt(i,this.frame.matrix.clone().multiply(local));mesh.setColorAt(i,palette[(i*17+i%13)%palette.length]);}
      mesh.name=label+' · assentos instanciados';mesh.castShadow=false;mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.userData.architecturePart=label;target.add(mesh);
    }
    return {...this.parts,assentos:this.seats.length};
  }
}

function seatGeometry(){
  // Concha em L com transições inclinadas; assento e encosto fazem uma peça.
  const shape=new T.Shape();[[-.12,0],[.12,0],[.135,.035],[.11,.065],[-.065,.075],[-.09,.27],[-.14,.28],[-.16,.24],[-.14,.035]].forEach(([z,y],i)=>i?shape.lineTo(z,y):shape.moveTo(z,y));shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth:architectureParameters.stand.seatWidth,bevelEnabled:false});
  geo.applyMatrix4(new T.Matrix4().set(0,0,-1,architectureParameters.stand.seatWidth/2,0,1,0,0,1,0,0,0,0,0,0,1));
  return geo;
}

function buildGrandstand(target,item){
  const f=frameFromFootprint(item),b=new GeometryBuilder(f),L=f.length-.30,D=f.depth-.30,front=D/2,back=-D/2;
  const cfg=architectureParameters.stand,bay=L/cfg.structuralBays,aisles=Array.from({length:cfg.aisles+1},(_,i)=>-L/2+L*i/cfg.aisles);
  b.box(0,0,0,L,.12,D,'concrete','piso');
  // Dois planos de assentos com circulação aberta entre os níveis.
  const tiers=[{rows:cfg.lowerRows,z:front-.72,pitch:D*.0215,y:.58,rise:D*.0105},{rows:cfg.upperRows,z:front-D*.465,pitch:D*.022,y:D*.27,rise:D*.0105}];
  for(const [ti,t] of tiers.entries()){
    for(let r=0;r<t.rows;r++){
      const z=t.z-r*t.pitch,y=t.y+r*t.rise;
      b.box(0,y-.12,z,L,.12,t.pitch+.006,'concrete','degraus');
      for(let x=-L/2+.46;x<L/2-.40;x+=cfg.seatPitch){
        if(aisles.some(a=>Math.abs(x-a)<.55))continue;
        b.seats.push([x,y+.045,z]);
      }
      // Dois meios-degraus em cada corredor, alinhados ao patamar da fileira.
      for(const x of aisles.slice(1,-1))b.box(x,y-t.rise/2,z+t.pitch*.25,.82,t.rise/2,t.pitch*.5,'lightConcrete','escadas de circulação');
    }
    for(const x of aisles.slice(1,-1)){
      const z0=t.z+t.pitch/2,z1=t.z-(t.rows-1)*t.pitch;
      b.beam([x-.43,t.y+.39,z0],[x-.43,t.y+(t.rows-1)*t.rise+.39,z1],.018,'metal','corrimãos');
      for(let r=0;r<t.rows;r+=4)b.beam([x-.43,t.y+r*t.rise,t.z-r*t.pitch],[x-.43,t.y+r*t.rise+.39,t.z-r*t.pitch],.018,'metal','corrimãos');
    }
    const z0=t.z+t.pitch/2,z1=t.z-(t.rows-1)*t.pitch-t.pitch/2;
    for(let j=0;j<=cfg.structuralBays;j++){
      const x=-L/2+.16+(L-.32)*j/cfg.structuralBays;
      b.beam([x,t.y-.22,z0],[x,t.y+(t.rows-1)*t.rise-.22,z1],.085,'concrete','vigas inclinadas');
      const top=t.y+(t.rows-1)*t.rise-.2;
      b.box(x,.12,z1,.17,top-.12,.22,'concrete','pilares');
      if(ti===1)b.box(x,.12,z0,.17,t.y-.2,.22,'concrete','pilares');
    }
  }
  const lower=tiers[0],midY=lower.y+(lower.rows-1)*lower.rise,midZ=front-D*.385;
  b.box(0,midY-.16,midZ,L,.16,D*.12,'concrete','circulação intermediária');
  b.railing(-L/2+.12,L/2-.12,midY,midZ+D*.06);
  // Fachadas laterais com vigas aparentes, pano verde e vãos sob a arquibancada.
  for(const x of [-L/2+.10,L/2-.10]){
    for(const t of tiers){const z0=t.z+t.pitch/2,z1=t.z-(t.rows-1)*t.pitch-t.pitch/2,y0=t.y,y1=t.y+(t.rows-1)*t.rise;
      b.profile(x,.18,[[z0,y0-.10],[z0,y0+.32],[z1,y1+.32],[z1,y1-.10]],'lightConcrete','vigas laterais');
      b.profile(x,.13,[[z0,y0-.48],[z0,y0-.08],[z1,y1-.08],[z1,y1-.48]],'green','fechamento lateral');
    }
  }
  // Retaguarda: pilares, fechamentos ventilados e circulação sob os assentos.
  for(let j=0;j<=cfg.structuralBays;j++){
    const x=-L/2+.15+(L-.30)*j/cfg.structuralBays;
    b.box(x,.12,back+.30,.18,D*.65,.22,'concrete','pilares traseiros');
    if(j<cfg.structuralBays){
      const cx=x+bay/2;
      b.box(cx,.12,back+.30,bay-.25,D*.105,.14,'green','parede de apoio');
      b.box(cx,D*.14,back+.30,bay-.25,.17,.14,'lightConcrete','cintas traseiras');
      for(let h=D*.20;h<D*.43;h+=.29)b.box(cx,h,back+.30,bay-.3,.10,.12,'green','venezianas');
    }
  }
  // A cobertura acompanha a projeção CAD, sem uma base que cubra a avenida.
  const roof=[[back,D*.66],[back+D*.17,D*.63],[front-.04,D*.56]];
  b.profile(0,L,[[roof[0][0],roof[0][1]],[roof[1][0],roof[1][1]],[roof[2][0],roof[2][1]],[roof[2][0],roof[2][1]+.08],[roof[1][0],roof[1][1]+.08],[roof[0][0],roof[0][1]+.08]],'roof','cobertura');
  b.profile(0,L,[[roof[0][0],roof[0][1]-.02],[roof[1][0],roof[1][1]-.02],[roof[2][0],roof[2][1]-.02],[roof[2][0],roof[2][1]],[roof[1][0],roof[1][1]],[roof[0][0],roof[0][1]]],'soffit','forro metálico');
  for(let j=0;j<=cfg.structuralBays;j++){
    const x=-L/2+.13+(L-.26)*j/cfg.structuralBays;
    b.beam([x,.12,back+.37],[x,D*.65,back+.37],.07,'steel','apoios da cobertura');
    for(let k=1;k<roof.length;k++){
      const a=[x,roof[k-1][1]-.10,roof[k-1][0]],z=[x,roof[k][1]-.10,roof[k][0]];
      b.beam(a,z,.067,'steel','vigas da cobertura');
      b.beam([x,a[1]-.25,a[2]],[x,z[1]-.06,z[2]],.035,'steel','contraventamentos');
    }
    b.beam([x,D*.43,back+.37],[x,D*.59,back+D*.28],.048,'steel','mãos francesas');
  }
  for(let z=back+.20;z<front-.06;z+=.48){let k=z<roof[1][0]?1:2;const a=roof[k-1],c=roof[k],y=a[1]+(c[1]-a[1])*(z-a[0])/(c[0]-a[0]);b.box(0,y-.055,z,L,.045,.045,'steel','terças');}
  for(const z of [back+.04,front-.04]){const y=z<0?roof[0][1]:roof[2][1];b.box(0,y,z,L,.10,.055,'metal','arremates');}
  b.railing(-L/2+.10,L/2-.10,.12,front-.15,.44);
  return {frame:f,maxHeight:D*.66+.20,parts:b.finish(target,'Arquibancada R03')};
}

function buildPitBuilding(target,item){
  const f=frameFromFootprint(item),b=new GeometryBuilder(f),L=f.length-.30,D=f.depth-.30,N=architectureParameters.boxes.modules,bay=L/N,front=-D/2,back=D/2;
  const deck=D*.36,roofY=D*.73,garageH=deck-.20;
  const tx=-L/2+bay*1.20,tw=bay*1.55,td=D*.82,levelH=D*.235,base=deck;
  b.box(0,0,0,L,.13,D,'concrete','piso dos boxes');
  b.box(0,deck-.15,0,L,.15,D,'lightConcrete','laje da galeria');
  b.box(0,.12,0,L,garageH,.10,'dark','fundo dos boxes');
  for(let i=0;i<N;i++){
    const x=-L/2+bay*(i+.5),w=bay-.19;
    // Portas recuadas deixam a profundidade dos vãos legível.
    for(const side of [-1,1]){
      const z=side*(D/2-.24);
      b.box(x,.15,z,w,garageH-.13,.085,'shutter','portas dos boxes');
      b.box(x,garageH+.015,z,w,.12,.12,'lightConcrete','vergas');
      b.box(x-.16,.26,z+side*.047,.32,.028,.024,'metal','puxadores');
      for(let h=.21;h<garageH-.04;h+=.17)b.box(x,h,z+side*.05,w,.012,.014,'metal','lâminas das portas');
    }
    for(const z of [front+.12,back-.12]){
      b.box(x-bay/2+.08,.13,z,.16,deck-.13,.19,'lightConcrete','pilares térreos');
      b.box(x-bay/2+.08,deck,z,.09,roofY-deck,.12,'steel','pilares da galeria');
    }
    // Parede de fundo da galeria com faixa de vidro e alvenaria verde.
    b.box(x,deck+.02,back-.74,w,.59,.12,'green','parede da galeria');
    b.box(x,deck+.64,back-.74,w,.54,.075,'glass','janelas da galeria');
    b.box(x,deck+1.20,back-.74,w,.18,.12,'lightConcrete','vergas superiores');
    b.beam([x-bay/2+.08,roofY-.07,front+.06],[x-bay/2+.08,roofY+.13,back-.06],.048,'steel','vigas da marquise');
    b.box(x,deck+.03,front+.16,w,.31,.045,'glass','guarda-corpo envidraçado');
  }
  b.railing(-L/2+.1,L/2-.1,deck,front+.10,.37);b.railing(-L/2+.1,L/2-.1,deck,back-.1,.37);
  for(const z of [front+.06,back-.06]){b.box(0,deck-.22,z,L,.18,.13,'steel','testeira');b.box(0,deck-.39,z,L,.11,.09,'green','faixa verde');}
  // Cobertura leve, com inclinação suave e estrutura visível por baixo.
  const left=tx-tw/2-.07,right=tx+tw/2+.07;
  const roofParts=[[-L/2,left,front,back],[right,L/2,front,back],[left,right,front,-td/2-.12],[left,right,td/2+.12,back]];
  for(const [x0,x1,z0,z1] of roofParts){
    const y0=roofY+.20*(z0-front)/D,y1=roofY+.20*(z1-front)/D;
    b.profile((x0+x1)/2,x1-x0,[[z0,y0],[z1,y1],[z1,y1+.08],[z0,y0+.08]],'roof','cobertura linear');
    b.profile((x0+x1)/2,x1-x0,[[z0,y0-.025],[z1,y1-.025],[z1,y1],[z0,y0]],'soffit','forro da galeria');
    for(let z=z0+.08;z<z1;z+=.45){const y=roofY+.2*(z-front)/D;b.box((x0+x1)/2,y-.045,z,x1-x0,.045,.036,'steel','terças da galeria');}
  }
  for(const z of [front+.03,back-.03])b.box(0,roofY+(z>0?.2:0),z,L,.13,.045,'metal','calhas');
  // Torre na extremidade do edifício mostrada em AUT-CUI-CAM07 e AZM R03.
  // Mantida dentro da projeção linear. Níveis/alturas ajustáveis, sem cota oficial.
  for(let floor=0;floor<architectureParameters.boxes.towerUpperFloors;floor++){
    const y=base+floor*levelH;
    b.box(tx,y,0,tw,.14,td,'lightConcrete','lajes da torre');
    b.box(tx,y+.14,0,tw-.30,levelH-.14,td-.28,'dark','miolo da torre');
    for(const side of [-1,1]){
      const z=side*(td/2-.025);
      b.box(tx,y+.27,z,tw-.28,levelH-.37,.055,'glass','vidros da torre');
      for(let x=tx-tw/2+.2;x<tx+tw/2;x+=.75)b.box(x,y+.18,z+side*.038,.036,levelH-.2,.045,'steel','montantes da torre');
      b.box(tx,y+levelH*.57,z+side*.04,tw-.24,.028,.047,'metal','travessas dos vidros');
      b.box(tx,y+levelH-.06,z+side*.05,tw,.10,.085,'lightConcrete','brises horizontais');
    }
    for(const x of [tx-tw/2+.09,tx+tw/2-.09]){
      b.box(x,y+.15,0,.11,levelH-.15,td-.30,'glass','vidros laterais');
      for(let z=-td/2+.15;z<td/2;z+=.68)b.box(x,y+.15,z,.15,levelH-.15,.038,'steel','montantes laterais');
    }
  }
  const top=base+architectureParameters.boxes.towerUpperFloors*levelH;
  b.profile(tx,tw+.10,[[-td/2-.12,top+.22],[0,top+.08],[td/2+.12,top+.22],[td/2+.12,top+.31],[0,top+.17],[-td/2-.12,top+.31]],'roof','cobertura da torre');
  // Escadas nos recuos traseiros, sem avançar o footprint para o paddock.
  for(const fraction of [.29,.60,.86]){
    const x=-L/2+L*fraction,z=back-.36,steps=18,w=bay*1.7,run=w/steps;
    for(let j=0;j<steps;j++)b.box(x-w/2+(j+.5)*run,j*deck/steps+.13,z,run,.07,.62,'concrete','escadas dos boxes');
    b.beam([x-w/2,.48,z+.29],[x+w/2,deck+.48,z+.29],.023,'metal','corrimãos dos boxes');
    for(const xx of [x-w/2-.1,x+w/2+.1])b.box(xx,.13,z,.12,deck+.68,.68,'ochre','molduras de acesso');
  }
  return {frame:f,maxHeight:top+.43,parts:b.finish(target,'Boxes R03')};
}

export function buildAutodromeArchitecture(target,records){
  const stand=records.find(x=>x.role.startsWith('Arquibancada')),boxes=records.find(x=>x.role.startsWith('Boxes'));
  if(!stand||!boxes)throw Error('Autódromo: projeções CAD de boxes e arquibancada ausentes.');
  const result={stand:buildGrandstand(target,stand),boxes:buildPitBuilding(target,boxes)};
  target.name='Autódromo · boxes e arquibancada R03';
  target.userData.architectureVersion=AUTODROME_VERSION;
  target.userData.architectureProvenance={implantation:'R84 / carimbo R83; projeções CAD existentes',architecture:'AZM R03; fotos fornecidas por Jean',verticalDimensions:'Proporções visuais, unidades gráficas; não são cotas de obra',parameters:architectureParameters};
  target.userData.architectureParts=Object.fromEntries(Object.entries(result).map(([key,value])=>[key,value.parts]));
  target.userData.detailViews={};
  for(const [key,r] of Object.entries(result)){
    const {frame:f,maxHeight}=r,sign=key==='stand'?1:-1;
    const point=(x,z)=>[f.center[0]+f.u[0]*x+f.v[0]*z,f.center[1]+f.u[1]*x+f.v[1]*z];
    // Boxes: metade próxima da torre para que a câmera mostre as fachadas.
    const x0=key==='boxes'?-f.length/2:-f.length/2,x1=key==='boxes'?f.length*.02:f.length/2;
    target.userData.detailViews[key]={name:key==='stand'?'Arquibancada':'Boxes e torre',footprint:[point(x0,-f.depth/2),point(x1,-f.depth/2),point(x1,f.depth/2),point(x0,f.depth/2)],height:maxHeight,direction:[f.v[0]*sign-f.u[0]*.45,key==='stand'?.26:.48,f.v[1]*sign-f.u[1]*.45]};
  }
  return result;
}
