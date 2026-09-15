import * as T from 'three';

// Dimensões gráficas da base; referências de fachada registradas no relatório.
// Nenhuma coordenada deste módulo é uma medição de obra.
export const finishVersion='cenario-integral-20260914-2';
export const integralMaterials=new Map();
const emissive=[];
function mat(key,color,roughness=.76,metalness=0,glow=null){
 if(integralMaterials.has(key))return integralMaterials.get(key);
 const m=new T.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:.8});m.name='Integral · '+key;
 m.userData.integralSurface=key;if(glow){m.emissive.set(glow);emissive.push([m,1.5]);}integralMaterials.set(key,m);return m;
}
const M={ivory:mat('aluminio-claro','#d8d7c9',.52,.22),white:mat('pintura-clara','#d9ded9',.58,.08),
 steel:mat('estrutura','#657775',.48,.66),dark:mat('metal-escuro','#233739',.6,.4),
 glass:mat('vidro','#52777a',.26,.22),glassAlt:mat('vidro-variacao','#71928e',.3,.2),
 concrete:mat('concreto','#aeafa4',.94),paving:mat('piso-claro','#c2bba6',.93),stone:mat('piso-escuro','#66716b',.94),
 wood:mat('madeira','#927152',.86),woodAlt:mat('madeira-variacao','#ac8760',.84),
 grass:mat('cobertura-verde','#697e47',.95),terracotta:mat('terracota','#be714c',.91),
 cream:mat('brise-creme','#d7cdb2',.84,.02),creamAlt:mat('brise-creme-variacao','#beb79f',.86),
 warm:mat('luz-quente','#ddd3ae',.6,.05,'#ffdba0'),cool:mat('luz-fria','#adc6c7',.56,.05,'#a6d9f0'),
 led:mat('painel-midias','#163d44',.72,0,'#317e8b')};
M.glass.emissive.set('#ffce83');M.glassAlt.emissive.set('#ffdea2');emissive.push([M.glass,.14],[M.glassAlt,.22]);
M.warm.emissiveIntensity=0;M.cool.emissiveIntensity=0;M.led.emissiveIntensity=.08;
function mesh(g,geo,m,name='',cast=true){const o=new T.Mesh(geo,m);o.name=name;o.castShadow=cast;o.receiveShadow=true;g.add(o);return o;}
function group(g,x=0,z=0,a=0){const o=new T.Group();o.position.set(x,0,z);o.rotation.y=a;g.add(o);return o;}
function box(g,x,y,z,w,h,d,m=M.concrete){const o=mesh(g,new T.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);return o;}
function cylinder(g,x,y,z,r,h,m=M.white,rt=r,n=64){const o=mesh(g,new T.CylinderGeometry(rt,r,h,n),m);o.position.set(x,y+h/2,z);return o;}
function beam(g,a,b,r=.035,m=M.steel){const A=new T.Vector3(...a),B=new T.Vector3(...b),v=B.clone().sub(A);if(v.lengthSq()<1e-12)return;const o=mesh(g,new T.CylinderGeometry(r,r,v.length(),6),m);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
function ring(g,x,y,z,r,t=.05,m=M.white){const o=mesh(g,new T.TorusGeometry(r,t,5,96),m,'',false);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);return o;}
function surface(g,v,idx,m,name=''){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();return mesh(g,geo,m,name);}
function ribbon(g,rows,m,name=''){const v=[],ix=[];for(const r of rows)v.push(...r[0],...r[1]);for(let i=0;i<rows.length-1;i++){const a=i*2;ix.push(a,a+2,a+1,a+1,a+2,a+3);}return surface(g,v,ix,m,name);}
function clear(g){g.traverse(o=>o.geometry?.dispose());g.clear();}
function local(g){const child=g.children[0];if(!child)throw new Error('Grupo arquitetônico ausente: '+g.userData.placeId);return child;}
function glowLine(g,a,b,r=.025,m=M.warm){const o=beam(g,a,b,r,m);if(o)o.castShadow=false;return o;}
function table(g,x,z,{umbrella=false,angle=0,scale=1}={}){
 const t=group(g,x,z,angle);t.scale.setScalar(scale);cylinder(t,0,.23,0,.32,.08,M.dark,undefined,12);beam(t,[0,.3,0],[0,1.0,0],.045,M.dark);cylinder(t,0,.94,0,.64,.07,M.wood,undefined,24);
 for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const c=group(t,Math.cos(a)*1.08,Math.sin(a)*1.08,Math.PI/2-a);box(c,0,.52,0,.49,.065,.48,M.wood);box(c,0,.58,.25,.49,.47,.05,M.wood);
  for(const s of [-1,1])for(const z of [-.2,.2])beam(c,[s*.2,.16,z],[s*.2,.55,z],.024,M.steel);
 }
 if(umbrella){beam(t,[0,1,0],[0,3.18,0],.045,M.steel);const canopy=mesh(t,new T.ConeGeometry(2.05,.62,8,1,true),M.terracotta,'Guarda-sol terracota');canopy.material.side=T.DoubleSide;canopy.position.y=2.92;
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;beam(t,[0,3.22,0],[Math.cos(a)*2.03,2.61,Math.sin(a)*2.03],.013,M.steel);}}
 return t;
}
function rail(g,r,y,h,start=0,end=Math.PI*2){const n=Math.ceil((end-start)*r/1.8);for(let i=0;i<n;i++){const a=start+(end-start)*i/n,b=start+(end-start)*(i+1)/n;beam(g,[Math.cos(a)*r,y,Math.sin(a)*r],[Math.cos(a)*r,y+h,Math.sin(a)*r],.025);for(const hh of [.48,h])beam(g,[Math.cos(a)*r,y+hh,Math.sin(a)*r],[Math.cos(b)*r,y+hh,Math.sin(b)*r],.027);}}
function agro(g){
 const a=local(g);clear(a);a.name='AgroPlace · brises claros e cobertura plana';
 cylinder(a,0,.02,0,26,.18,M.paving);for(let i=0;i<4;i++)cylinder(a,0,.2+i*.13,0,25-i*1.2,.14,M.concrete);
 cylinder(a,0,.73,0,18.7,.32,M.stone);cylinder(a,0,1.05,0,17.0,5.15,M.glass);
 for(let i=0;i<40;i++){const ang=i/40*Math.PI*2;beam(a,[Math.cos(ang)*17.08,1.07,Math.sin(ang)*17.08],[Math.cos(ang)*17.08,6.2,Math.sin(ang)*17.08],.05,M.steel);}
 cylinder(a,0,6.2,0,18.05,.34,M.ivory);cylinder(a,0,6.54,0,16.9,9.9,M.glassAlt);cylinder(a,0,16.44,0,18.0,.36,M.ivory);cylinder(a,0,16.8,0,17.5,.17,M.concrete);
 for(let i=0;i<152;i++){const ang=i/152*Math.PI*2,h=9.72-.38*(.5+.5*Math.sin(i*2.39));const b=box(a,Math.cos(ang)*17.48,6.55,Math.sin(ang)*17.48,.17,h,1.07,i%5?M.cream:M.creamAlt);b.rotation.y=Math.PI/2-ang;}
 for(let i=0;i<16;i++){const ang=i/16*Math.PI*2;const x=Math.cos(ang)*17.48,z=Math.sin(ang)*17.48;cylinder(a,x,1.05,z,.25,5.15,M.ivory,undefined,12);glowLine(a,[x,1.1,z],[x,6.1,z],.026);}
 ring(a,0,6.14,0,17.9,.044,M.warm);ring(a,0,16.80,0,17.65,.024,M.warm);
 // Porta e marquise ocupam o mesmo lado do volume da base.
 box(a,0,1.04,17.05,7.4,3.9,.09,M.dark);for(const x of [-2.7,0,2.7])box(a,x,1.16,17.11,2.55,3.63,.04,M.glassAlt);
 box(a,0,5.18,19.1,11,.19,5.8,M.ivory);glowLine(a,[-5.3,5.12,21.8],[5.3,5.12,21.8]);
 rail(a,22.2,.63,.97,Math.PI*.04,Math.PI*.96);rail(a,22.2,.63,.97,Math.PI*1.09,Math.PI*1.91);
 g.userData.integralRevision={part:'AgroPlace',reference:'AGROP_FACHADA (1).jpg',interpretation:'Cobertura plana, brises verticais, vidro e iluminação; implantação preservada.'};
}
function museums(g){
 const a=local(g);clear(a);a.name='Museus · rampas verdes e brises de madeira';
 for(const side of [-1,1]){
  const maxH=side<0?12:8,start=-1.04+(side>0?0:Math.PI),span=2.1;
  const height=t=>.50+(maxH+.15)*Math.sin(t*Math.PI/2)**1.10;
  const rows=[],outer=[],inner=[];
  for(let i=0;i<=96;i++){const t=i/96,ang=start+t*span,y=height(t);const p=r=>[Math.cos(ang)*r,y,Math.sin(ang)*r];rows.push([p(17),p(29)]);outer.push([p(29),[Math.cos(ang)*29,.24,Math.sin(ang)*29]]);inner.push([[Math.cos(ang)*17,.24,Math.sin(ang)*17],p(17)]);}
  const roof=ribbon(a,rows,M.grass,'Cobertura verde em rampa');roof.material.side=T.DoubleSide;
  ribbon(a,outer,M.wood,'Fachada externa');ribbon(a,inner,M.glass,'Fachada voltada à praça');
  for(let i=1;i<=124;i++){
   const t=i/124,ang=start+t*span,y=height(t);const x=Math.cos(ang)*29.14,z=Math.sin(ang)*29.14;
   const fin=box(a,x,.24,z,.15,Math.max(.15,y-.24),.65,i%4?M.wood:M.woodAlt);fin.rotation.y=Math.PI/2-ang;
   if(i%9===0){const r=17.05;beam(a,[Math.cos(ang)*r,.24,Math.sin(ang)*r],[Math.cos(ang)*r,y,Math.sin(ang)*r],.115,M.ivory);}
   if(i%3===0){const r=17.10;glowLine(a,[Math.cos(ang)*r,Math.max(.3,y-.28),Math.sin(ang)*r],[Math.cos(ang+.012)*r,Math.max(.3,height(Math.min(1,t+.012/span))-.28),Math.sin(ang+.012)*r],.025);}
  }
  for(const r of [17,29])for(let i=0;i<96;i++){const x=start+i/96*span,y=start+(i+1)/96*span;beam(a,[Math.cos(x)*r,height(i/96)+.05,Math.sin(x)*r],[Math.cos(y)*r,height((i+1)/96)+.05,Math.sin(y)*r],.065,M.dark);}
  const ang=start+span;const cap=ribbon(a,[[[Math.cos(ang)*17,.24,Math.sin(ang)*17],[Math.cos(ang)*17,height(1),Math.sin(ang)*17]],[[Math.cos(ang)*29,.24,Math.sin(ang)*29],[Math.cos(ang)*29,height(1),Math.sin(ang)*29]]],M.wood);cap.material.side=T.DoubleSide;
 }
 g.userData.integralRevision={part:'Museus',reference:'MUSEU CELEBRIDADES (8).jpg',interpretation:'Rampas verdes e brises; alturas e perfis interpretados, limites da base preservados.'};
}
function treeOfLife(g){
 const a=local(g);clear(a);a.name='Árvore da Vida · mirante e coluna de mídia';
 cylinder(a,0,.1,0,8,.26,M.paving);cylinder(a,0,.36,0,1.83,40.4,M.led,1.58);
 for(let i=0;i<28;i++){const ang=i/28*Math.PI*2;beam(a,[Math.cos(ang)*1.835,.8,Math.sin(ang)*1.835],[Math.cos(ang)*1.586,40.75,Math.sin(ang)*1.586],.014,M.dark);}
 for(let y=1.2;y<40.5;y+=.48)ring(a,0,y,0,1.83-(y-.36)/40.4*.25,.01,M.dark);
 // Leitura arquitetônica do coroamento mostrado no render, sem mídia publicitária externa.
 cylinder(a,0,40.76,0,1.8,2.65,M.steel,4.3);cylinder(a,0,43.41,0,4.6,.36,M.ivory);cylinder(a,0,43.77,0,4.13,2.52,M.glassAlt);cylinder(a,0,46.29,0,4.62,.25,M.ivory);cylinder(a,0,46.54,0,3.65,.42,M.concrete,3.35);
 for(let i=0;i<28;i++){const ang=i/28*Math.PI*2;beam(a,[Math.cos(ang)*4.19,43.7,Math.sin(ang)*4.19],[Math.cos(ang)*4.19,46.27,Math.sin(ang)*4.19],.035,M.dark);glowLine(a,[Math.cos(ang)*1.88,40.88,Math.sin(ang)*1.88],[Math.cos(ang)*4.25,43.39,Math.sin(ang)*4.25],.017,M.cool);}
 for(const [r,y]of [[4.47,43.48],[4.53,46.3]])ring(a,0,y,0,r,.035,M.cool);
 for(let i=0;i<6;i++){const ang=i/6*Math.PI*2;beam(a,[Math.cos(ang)*5.1,.4,Math.sin(ang)*5.1],[Math.cos(ang)*1.81,8.3,Math.sin(ang)*1.81],.20,M.wood);}
 g.userData.integralRevision={part:'Árvore da Vida',reference:'Cópia de 1.png',interpretation:'Coroamento e LED interpretados, altura da base mantida; conteúdo luminoso abstrato.'};
}
function rounded(w,d,r){const s=new T.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);return s;}
function roundedSlab(g,w,d,r,y,h,m){const geo=new T.ExtrudeGeometry(rounded(w,d,r),{depth:h,bevelEnabled:false,curveSegments:10});geo.rotateX(-Math.PI/2);const o=mesh(g,geo,m);o.position.y=y;return o;}
function food(g,small){
 const a=local(g);clear(a);a.name='Praça de alimentação · painéis triangulares e terraço';
 roundedSlab(a,41,19,2,.2,.23,M.concrete);roundedSlab(a,38.6,16.6,1.8,.43,7.7,M.glass);
 roundedSlab(a,41,19,2,8.13,.53,M.ivory);roundedSlab(a,39.5,17.5,1.8,8.66,.12,M.concrete);
 const palette=[M.ivory,M.steel,M.dark,M.glassAlt];
 for(const side of [-1,1])for(let i=0;i<24;i++){
  const x=-18+i*1.5,w=1.48,za=side*8.37;
  for(let row=0;row<2;row++){const y=3.28+row*2.38,v=[x,y,za,x+w,y,za,x+w*.5,y+2.32,za];const pane=surface(a,v,side<0?[0,2,1]:[0,1,2],palette[(i*7+row*2)%4],'Triângulo de fachada');pane.material.side=T.DoubleSide;}
  if(i%2===0)box(a,x,.47,side*8.40,.045,2.81,.07,M.dark);
 }
 for(const x of [-19.32,19.32])for(let k=0;k<8;k++){const z=-5.6+k*1.6;const q=box(a,x,3.3,z,.045,4.78,1.51,palette[k%4]);}
 for(const side of [-1,1])glowLine(a,[-17.9,3.18,side*8.43],[17.9,3.18,side*8.43]);
 for(const x of [-12,0,12])table(a,x,12,{umbrella:true,scale:1.04});
 if(!small)for(const x of [-15,-7.5,7.5,15])table(a,x,-12,{umbrella:false,angle:.1});
 g.userData.integralRevision={part:'Praça de alimentação',reference:'Enscape_2025-11-17 VISTA 01.png',interpretation:'Fachada e mobiliário, com implantação da base mantida.'};
}
function pearlFinish(g){
 const p=local(g);const remove=[];p.traverse(o=>{if(o.isMesh&&o.geometry.type==='TubeGeometry')remove.push(o);});for(const o of remove){o.removeFromParent();o.geometry.dispose();}
 const under=mat('perola-substrato','#9e5f45',.82),petalWhite=mat('perola-petala','#e3dfd7',.50,.13),petalGold=mat('perola-dourado','#dab755',.61,.08),petalRed=mat('perola-terracota','#af6247',.75);
 const shell=p.children.find(o=>o.geometry?.type==='SphereGeometry');if(shell)shell.material=under;
 const point=(theta,phi,offset=.32)=>[(16.4+offset)*Math.cos(phi)*Math.cos(theta),6.2+(7+offset)*Math.sin(phi),(25.5+offset)*Math.cos(phi)*Math.sin(theta)];
 for(let row=0;row<7;row++){
  const phi=.10+row*.205,tiles=Math.max(12,Math.round(68*Math.cos(phi))),step=Math.PI*2/tiles;
  for(let i=0;i<tiles;i++){
   const a=(i+(row%2)*.5)*step,verts=[],indices=[];
   // Superfície subdividida segue a curvatura: pétalas não atravessam a casca.
   for(let j=0;j<=8;j++){const t=j/8,w=Math.max(.018,Math.sin(Math.PI*t)**.65)*step*.48,ph=Math.min(1.568,Math.max(0,phi-.09+t*.29));for(let k=0;k<=4;k++)verts.push(...point(a+(k/2-1)*w,ph,.14));}
   for(let j=0;j<8;j++)for(let k=0;k<4;k++){const n=j*5+k;indices.push(n,n+5,n+1,n+1,n+5,n+6);}
   const m=(i+row*3)%8===0?petalGold:(i+row*5)%13===0?petalRed:petalWhite,leaf=surface(p,verts,indices,m,'Pétala de cobertura');leaf.material.side=T.DoubleSide;
  }
 }
 for(let i=0;i<96;i++){const a=i/96*Math.PI*2,b=(i+1)/96*Math.PI*2;glowLine(p,[Math.cos(a)*16.6,6.10,Math.sin(a)*25.7],[Math.cos(b)*16.6,6.10,Math.sin(b)*25.7],.034);}
 g.userData.integralRevision={part:'Pérola do Cerrado',reference:'Enscape_2026-02-13-11-09-52.png',interpretation:'Pétalas e faixa de iluminação interpretadas; corpo e implantação preservados.'};
}
function enhanceExistingMaterials(models){
 const clones=new Map();
 models.forEach((g,id)=>g.traverse(o=>{
  if(!o.isMesh||Array.isArray(o.material))return;const m=o.material;if(m.userData.integralSurface)return;
  const n=(m.name||'').toLowerCase(),hex=m.color?.getHexString()||'',isGlass=/glass|vidro|glazing/.test(n)||['345868','365f70','56877d','729995','5b8b90','8aa4a1','427568'].includes(hex),isLamp=/lente|lens|light|luz|led/.test(n);
  if(!isGlass&&!isLamp)return;
  const key=m.uuid;if(!clones.has(key)){
   const c=m.clone();c.name=(m.name||'Vidro')+' · acabamento noturno';c.userData={...m.userData,nightFinish:true};
   if(isGlass){if('transmission'in c)c.transmission=0;c.transparent=false;c.opacity=1;c.depthWrite=true;c.roughness=Math.max(.21,c.roughness||0);c.metalness=.18;c.emissive.set('#ffdca1');c.emissiveIntensity=0;emissive.push([c,.16]);}
   else if(c.emissive){c.emissive.set('#ffd49a');emissive.push([c,1.6]);}
   clones.set(key,c);integralMaterials.set('existente-'+clones.size,c);
  }o.material=clones.get(key);
 }));
 return clones.size;
}
function facadeLights(models){
 // Faixas discretas seguem as faces dos blocos existentes. Não são novas instalações oficiais.
 const out=[];
 const add=(id,g,a,b,power=2)=>{glowLine(g,a,b,.024);g.updateWorldMatrix(true,false);const middle=new T.Vector3(...a).lerp(new T.Vector3(...b),.5).applyMatrix4(g.matrixWorld);out.push({id,position:[middle.x+620,middle.z+570],height:middle.y,aim:[middle.x+620,middle.z+570],kind:'fachada',power,color:'#ffe0ad'});};
 const ev=models.get('centro-de-eventos')?.children[0];if(ev){for(const y of [4.3,8.2])add('centro-de-eventos',ev,[-76,y,46.35],[76,y,46.35]);}
 const wake=models.get('wake-park');if(wake)add('wake-park',wake,[211,6.85,690],[227,6.85,684]);
 const village=models.get('vila-das-nacoes');for(const f of village?.children||[]){if(!f.name.startsWith('Fachada'))continue;add('vila-das-nacoes',f,[-1.6,2.56,1.48],[1.6,2.56,1.48]);}
 const gate=models.get('portico-de-entrada');if(gate)gate.userData.integralLighting=true;
 return out;
}
export function applyIntegralFinish(models,{smallScreen=false}={}){
 agro(models.get('agroplace'));museums(models.get('museus'));treeOfLife(models.get('arvore-da-vida'));food(models.get('praca-de-alimentacao'),smallScreen);pearlFinish(models.get('perola-do-cerrado'));
 const adapted=enhanceExistingMaterials(models),lamps=facadeLights(models);
 return {version:finishVersion,lamps,materials:integralMaterials,adaptedMaterials:adapted,setNight(on){for(const [m,strength]of emissive)m.emissiveIntensity=on?strength:m===M.led?.08:0;},diagnostics(){return {version:finishVersion,rebuilt:['agroplace','museus','arvore-da-vida','praca-de-alimentacao','perola-do-cerrado'],adaptedMaterials:adapted};}};
}

export function configureIntegralMaterials(renderer){
 const out=[];const size=256;
 for(const [key,m]of integralMaterials){if(key.startsWith('existente-')||/luz|vidro|painel-midias/.test(key))continue;
  const pixels=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);const base=m.color.clone().convertLinearToSRGB();
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const i=(y*size+x)*4,n=((Math.imul(x+1,73856093)^Math.imul(y+1,19349663))>>>0)%1024/1024;
   const wood=key.startsWith('madeira'),grain=wood?.93+.035*Math.sin(x*.34+Math.sin(y*.025))+.08*n:.965+.07*n;
   const c=base;pixels[i]=Math.min(255,Math.round(c.r*255*grain));pixels[i+1]=Math.min(255,Math.round(c.g*255*grain));pixels[i+2]=Math.min(255,Math.round(c.b*255*grain));pixels[i+3]=255;
   rough[i]=rough[i+1]=rough[i+2]=Math.round(205+45*n);rough[i+3]=255;
  }
  const tex=new T.DataTexture(pixels,size,size);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.generateMipmaps=true;tex.minFilter=T.LinearMipmapLinearFilter;tex.anisotropy=Math.min(8,renderer?.capabilities?.getMaxAnisotropy?.()||1);tex.needsUpdate=true;
  const r=new T.DataTexture(rough,size,size);r.wrapS=r.wrapT=T.RepeatWrapping;r.needsUpdate=true;
  m.map=tex;m.color.set('#ffffff');m.roughnessMap=r;m.needsUpdate=true;out.push(tex,r);
 }
 return out;
}
