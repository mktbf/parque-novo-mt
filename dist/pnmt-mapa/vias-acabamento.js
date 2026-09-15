import * as T from 'three';
import {roadFinishData as D} from './vias-acabamento-dados.js?v=vias-acabamento-20260915-3';
export {roadFinishData} from './vias-acabamento-dados.js?v=vias-acabamento-20260915-3';

const materials=new Map();
const material=(name,color,roughness=.92)=>{
 if(!materials.has(name)){
  const m=new T.MeshStandardMaterial({color,roughness,metalness:0});
  m.name='Vias03 · '+name;materials.set(name,m);
 }
 return materials.get(name);
};

/** Material exclusivo das vias. Autódromo e kart mantêm os acabamentos atuais. */
export function roadAsphaltMaterial(){
 const m=material('asfalto','#3d4243',.96);
 m.userData.surfaceKind='road-finish-03';
 return m;
}

function mesh(record,height,mat,name){
 const positions=[],uv=[];
 for(let i=0;i<record.points.length;i+=2){const x=record.points[i],z=record.points[i+1];positions.push(x,height,z);uv.push(x/4,z/4);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(record.indices);geo.computeVertexNormals();geo.computeBoundingSphere();
 const out=new T.Mesh(geo,mat);out.name=name;out.receiveShadow=true;return out;
}

export function createRoadDetails(){
 const root=new T.Group();root.name='Vias03 · guias contínuas e sinalização';
 const concrete=material('concreto das guias','#aeb3ac');
 const wall=material('laterais das guias','#8e9690');
 const paint=material('pintura viária','#dfe0d6',.94);
 root.add(mesh(D.surfaces.curbs,.31,concrete,'Guias · face superior'));
 const positions=[],normals=[],uv=[],indices=[],geo=new T.BufferGeometry();
 for(const contour of D.curbContours){let distance=0;for(let i=0;i<contour.length-2;i+=2){
  const [ax,az,bx,bz]=contour.slice(i,i+4).map(Math.fround),dx=bx-ax,dz=bz-az,length=Math.hypot(dx,dz);if(length<1e-5)continue;
  const base=positions.length/3;
  positions.push(ax,.12,az,bx,.12,bz,bx,.31,bz,ax,.31,az);
  for(let j=0;j<4;j++)normals.push(dz/length,0,-dx/length);
  uv.push(distance,0,distance+length,0,distance+length,.19,distance,.19);
  indices.push(base,base+2,base+1,base,base+3,base+2);distance+=length;
 }}
 geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeBoundingSphere();
 const sides=new T.Mesh(geo,wall);sides.name='Guias · faces verticais';sides.receiveShadow=true;root.add(sides);
 for(const key of ['edges','dashes']){
  const m=mesh(D.surfaces[key],.142,paint,key==='edges'?'Faixas de bordo · vias':'Faixas segmentadas · vias');
  m.material.polygonOffset=true;m.material.polygonOffsetFactor=-1;m.material.polygonOffsetUnits=-1;root.add(m);
 }
 root.userData.version=D.version;root.userData.provenance=D.scope;
 return root;
}

/** Usa os mapas PBR já existentes no projeto, com alternativa visual se falharem. */
export async function loadRoadMaterials(renderer){
 const m=roadAsphaltMaterial(),loader=new T.TextureLoader(),textures=[];
 const maps=await Promise.allSettled(['diff','rough','nor_gl'].map(async(kind)=>{
  const t=await loader.loadAsync('./assets/materials/clean_asphalt_'+kind+'_1k.jpg');
  t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  if(kind==='diff')t.colorSpace=T.SRGBColorSpace;
  textures.push(t);return t;
 }));
 if(maps[0].status==='fulfilled'){m.map=maps[0].value;m.color.set('#b2b6b6');}
 if(maps[1].status==='fulfilled')m.roughnessMap=maps[1].value;
 if(maps[2].status==='fulfilled'){m.normalMap=maps[2].value;m.normalScale.set(.14,.14);}
 m.needsUpdate=true;return textures;
}
