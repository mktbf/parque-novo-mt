import * as T from 'three';
import {autodromeFinishData as D} from './autodromo-superficies.js?v=autodromo-acabamento-20260913-2';
export const AUTODROME_FINISH_VERSION='autodromo-acabamento-20260913-2';
export const finishMaterials=new Map();
const palette={asphalt:'#c8cfcc',grass:'#86abb0',shoulder:'#b6ab8d',runoff:'#1c79af',kerbWhite:'#ece7d1',kerbGreen:'#568671',paddock:'#b6baba',pit:'#c0c2ba',plaza:'#c0bbab',edge:'#ececdf',marking:'#eeeadd',drain:'#353e3d',steel:'#87969b',post:'#a5aeae',concrete:'#babdaf',mesh:'#818b87',lampBody:'#253239',lampFace:'#e3e3c9'};
let nighttime=false,glowTexture=null;
function mat(key){
 if(!finishMaterials.has(key)){
  const metal=['steel','post','mesh','lampBody'].includes(key);
  const m=new T.MeshStandardMaterial({color:palette[key],roughness:metal?.43:key==='asphalt'?.86:.94,metalness:metal?.66:0,envMapIntensity:metal?.85:.48});
  m.name='Autódromo acabamento · '+key;m.userData.autodromeFinishKind=key;
  if(key==='grass')m.vertexColors=true;
  if(key==='lampFace'){m.emissive.set('#ffeacf');m.emissiveIntensity=0;}
  if(['edge','marking','drain'].includes(key)){m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-1;}
  finishMaterials.set(key,m);
 }
 return finishMaterials.get(key);
}
function illuminationUV(x,z){const[a,b,c,d]=D.lightBounds;return[(x-a)/(c-a),1-(z-b)/(d-b)];}
function planarGeo(record,kind){
 const p=[],uv=[],uv1=[],colors=[];
 for(let i=0;i<record.points.length;i+=2){const x=record.points[i],z=record.points[i+1];p.push(x,record.y,z);uv.push(x/(kind==='grass'?9:5),z/(kind==='grass'?9:5));uv1.push(...illuminationUV(x,z));
  if(kind==='grass'){const q=.94+.055*Math.sin(x*.052+Math.cos(z*.043)*2)+.045*Math.sin(z*.086+x*.019);colors.push(q,q, q*.97);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('uv1',new T.Float32BufferAttribute(uv1,2));g.setIndex(record.indices);g.computeVertexNormals();if(colors.length)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeBoundingSphere();return g;
}
class Builder{
 constructor(){this.buckets=new Map();}
 mesh(g,key,matrix){
  const geo=g.index?g.toNonIndexed():g.clone();geo.applyMatrix4(matrix);let b=this.buckets.get(key);if(!b){b={p:[],n:[],uv:[]};this.buckets.set(key,b);}
  const p=geo.attributes.position,n=geo.attributes.normal;
  for(let i=0;i<p.count;i++){b.p.push(p.getX(i),p.getY(i),p.getZ(i));b.n.push(n.getX(i),n.getY(i),n.getZ(i));b.uv.push(p.getX(i)/2,p.getY(i)/2);}geo.dispose();
 }
 box(pos,size,key,angle=0){const g=new T.BoxGeometry(1,1,1);this.mesh(g,key,new T.Matrix4().compose(new T.Vector3(...pos),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),new T.Vector3(...size)));g.dispose();}
 beam(a,b,r,key){const p=new T.Vector3(...a),q=new T.Vector3(...b),dir=q.clone().sub(p),len=dir.length();if(len<.001)return;const geo=new T.CylinderGeometry(r,r,len,6);this.mesh(geo,key,new T.Matrix4().compose(p.add(q).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize()),new T.Vector3(1,1,1)));geo.dispose();}
 rail(a,b,y){
  // Perfil ondulado em W, duas lâminas; todos os pontos já estão no sistema canônico.
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
  const profile=[[-.15,0],[-.11,.035],[-.05,.005],[0,-.025],[.05,.005],[.11,.035],[.15,0]],p=[];
  for(let j=1;j<profile.length;j++){
   const vertex=(q,k)=>[q[0]+nx*profile[k][1],y+profile[k][0],q[1]+nz*profile[k][1]];
   const v=[vertex(a,j-1),vertex(b,j-1),vertex(b,j),vertex(a,j)];
   p.push(...v[0],...v[1],...v[2],...v[0],...v[2],...v[3]);
   // Face oposta tem volume visual, sem DoubleSide global nas estruturas.
   p.push(...v[2],...v[1],...v[0],...v[3],...v[2],...v[0]);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();this.mesh(g,'steel',new T.Matrix4());g.dispose();
 }
 finish(parent){for(const[key,b]of this.buckets){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));geo.computeBoundingSphere();const m=new T.Mesh(geo,mat(key));m.name='Acabamento · '+key;m.castShadow=key!=='mesh'&&key!=='lampFace';m.receiveShadow=true;m.userData.placeId='autodromo';m.userData.finishVersion=AUTODROME_FINISH_VERSION;parent.add(m);}}
}
export function createAutodromeFinish(circuits,model){
 const root=new T.Group(),surfaces=new T.Group(),structures=new T.Group();root.name='Autódromo · pista, proteção e ambiente';root.userData.finishVersion=AUTODROME_FINISH_VERSION;root.userData.provenance=D.provenance;root.userData.placeId='autodromo';root.add(surfaces,structures);
 for(const[key,record]of Object.entries(D.surfaces)){
  if(!record.indices.length)continue;const m=new T.Mesh(planarGeo(record,key),mat(key));m.name='Autódromo · '+key;m.receiveShadow=true;m.castShadow=false;m.userData.placeId='autodromo';m.userData.finishSurface=key;surfaces.add(m);
 }
 // Troca somente o material do circuito. Vértices e índices CAD permanecem intactos.
 circuits.traverse(o=>{if(!o.isMesh)return;o.material=mat('asphalt');const p=o.geometry.attributes.position,a=[];for(let i=0;i<p.count;i++)a.push(...illuminationUV(p.getX(i),p.getZ(i)));o.geometry.setAttribute('uv1',new T.Float32BufferAttribute(a,2));});
 const b=new Builder();
 for(const[a,c]of D.barriers){b.rail(a,c,.47);b.rail(a,c,.79);b.box([a[0],.47,a[1]],[.10,.90,.12],'post');}
 for(const[a,c]of D.fence){
  b.rail(a,c,.4);b.rail(a,c,.73);
  const dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
  b.beam([a[0],.08,a[1]],[a[0],1.55,a[1]],.035,'post');b.beam([a[0],1.55,a[1]],[a[0]+nx*.22,1.88,a[1]+nz*.22],.029,'post');
  for(const h of [.2,.95,1.55])b.beam([a[0],h,a[1]],[c[0],h,c[1]],.018,'mesh');
  // Tela em losangos com fios leves; recortada em cada painel.
  for(let s=-1.4;s<len;s+=.18){const t0=Math.max(0,-s),t1=Math.min(1.32,len-s);if(t1<=t0)continue;for(const sign of [-1,1]){const y0=sign>0?.18+t0:1.5-t0,y1=sign>0?.18+t1:1.5-t1;b.beam([a[0]+dx*(s+t0)/len,y0,a[1]+dz*(s+t0)/len],[a[0]+dx*(s+t1)/len,y1,a[1]+dz*(s+t1)/len],.0045,'mesh');}}
 }
 for(const l of D.lamps){
  const[x,z]=l.position,[ax,az]=l.aim,angle=-Math.atan2(az-z,ax-x);b.box([x,.15,z],[.40,.30,.40],'concrete');b.beam([x,.3,z],[x,l.height,z],.065,'post');
  const nx=Math.sin(angle),nz=Math.cos(angle);b.beam([x-nx*.43,l.height,z-nz*.43],[x+nx*.43,l.height,z+nz*.43],.035,'post');
  for(const sign of [-1,1]){const p=[x+nx*.24*sign,l.height,z+nz*.24*sign];b.box(p,[.35,.13,.26],'lampBody',angle);b.box([p[0],p[1]-.073,p[2]],[.30,.014,.23],'lampFace',angle);}
 }
 b.finish(structures);
 const rgba=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const d=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5),i=(y*32+x)*4;rgba.set([220,236,255,Math.round(Math.max(0,1-d)**3*150)],i);}
 glowTexture=new T.DataTexture(rgba,32,32);glowTexture.needsUpdate=true;
 const glowGeometry=new T.BufferGeometry();glowGeometry.setAttribute('position',new T.Float32BufferAttribute(D.lamps.flatMap(l=>[l.position[0],l.height,l.position[1]]),3));
 const glow=new T.Points(glowGeometry,new T.PointsMaterial({color:'#d9e9ff',map:glowTexture,size:3.2,sizeAttenuation:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));glow.name='Halo suave dos refletores';glow.visible=false;structures.add(glow);
 model.userData.finishVersion=AUTODROME_FINISH_VERSION;
 const f=D.frame,{center:c,u,v}=f,point=(x,z)=>[c[0]+u[0]*x+v[0]*z,c[1]+u[1]*x+v[1]*z];
 model.userData.detailViews.reta={name:'Reta e arquibancada',footprint:[point(f.standX-48,f.trackV-24),point(f.standX+45,f.trackV-24),point(f.standX+45,f.trackV+18),point(f.standX-48,f.trackV+18)],height:12,direction:[v[0]-u[0]*.85,.38,v[1]-u[1]*.85]};
 model.userData.detailViews.aerea={name:'Circuito em perspectiva',footprint:[[581,417],[1062,417],[1062,870],[581,870]],height:13,direction:[.9,1.05,1.25]};
 return {root,surfaces,structures,lamps:D.lamps,setNight(value){setAutodromeNight(value);glow.visible=Boolean(value);},setVisible(view,buildings){root.visible=view==='3d';structures.visible=buildings;}};
}
export function setAutodromeNight(value){nighttime=Boolean(value);for(const[key,m]of finishMaterials){if(m.lightMap)m.lightMapIntensity=nighttime?2.4:0;if(key==='lampFace')m.emissiveIntensity=nighttime?5:0;}}
export async function loadAutodromeFinishMaterials(renderer){
 const textures=glowTexture?[glowTexture]:[],loader=new T.TextureLoader();
 const load=async(file,srgb=false)=>{const t=await loader.loadAsync(file);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(srgb)t.colorSpace=T.SRGBColorSpace;textures.push(t);return t;};
 const results=await Promise.allSettled(['clean_asphalt','leafy_grass'].map(async prefix=>({prefix,maps:await Promise.all([load(`./assets/materials/${prefix}_diff_1k.jpg`,true),load(`./assets/materials/${prefix}_rough_1k.jpg`),load(`./assets/materials/${prefix}_nor_gl_1k.jpg`)])})));
 for(const r of results)if(r.status==='fulfilled'){const {prefix,maps}=r.value;for(const key of prefix==='leafy_grass'?['grass']:['asphalt','paddock','pit']){const m=mat(key);[m.map,m.roughnessMap,m.normalMap]=maps;m.normalScale.setScalar(key==='grass'?.20:.18);m.needsUpdate=true;}}
 try{const light=await load('./assets/autodromo-acabamento/luz-piso.png');light.channel=1;light.wrapS=light.wrapT=T.ClampToEdgeWrapping;for(const key of ['asphalt',...Object.keys(D.surfaces)]){const m=mat(key);m.lightMap=light;m.lightMapIntensity=nighttime?2.4:0;m.needsUpdate=true;}}
 catch(e){console.warn('PNMT: luz de piso indisponível; iluminação local continua ativa.');}
 return textures;
}
