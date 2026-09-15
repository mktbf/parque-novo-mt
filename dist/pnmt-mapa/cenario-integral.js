import * as T from 'three';
import {integralData as D} from './cenario-integral-dados.js?v=cenario-integral-20260914-2';
import {createPalmCrown} from './folhagem.js?v=cenario-integral-20260914-2';
export {D as integralData};
export const landscapeMaterials=new Map();
function material(key,color,roughness=.86,metalness=0){const m=new T.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:.7});m.name='Parque · '+key;landscapeMaterials.set(key,m);return m;}
function surface(record,y,m){
 const p=[],uv=[];for(let i=0;i<record.points.length;i+=2){p.push(record.points[i],y,record.points[i+1]);uv.push(record.points[i]/4,record.points[i+1]/4);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(record.indices);g.computeVertexNormals();g.computeBoundingSphere();const o=new T.Mesh(g,m);o.name=m.name;o.receiveShadow=true;return o;
}
function instances(parent,geo,m,entries){
 const mesh=new T.InstancedMesh(geo,m,entries.length),o=new T.Object3D();mesh.name=m.name;mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.skipBatch=true;
 for(let i=0;i<entries.length;i++){const e=entries[i];o.position.fromArray(e.p);o.scale.fromArray(e.s||[1,1,1]);o.rotation.set(0,e.a||0,0);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);if(e.color)mesh.setColorAt(i,new T.Color(e.color));}
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();parent.add(mesh);return mesh;
}
function addBridge(root,d){
 const [x,z]=d.start,dx=d.end[0]-x,dz=d.end[1]-z,len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,h=t=>.135+(d.deckHeight-.135)*Math.min(1,t*len/d.rampLength,(1-t)*len/d.rampLength);
 const v=[],uv=[],ix=[],steps=Math.ceil(len/2);for(let j=0;j<=steps;j++){const t=j/steps;for(const s of [-1,1]){v.push(x+dx*t+nx*d.width/2*s,h(t),z+dz*t+nz*d.width/2*s);uv.push(t*len/4,s*.85);}}
 for(let j=0;j<steps;j++){const n=j*2;ix.push(n,n+1,n+2,n+1,n+3,n+2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
 const slab=new T.Mesh(g,material('passarela-piso','#ccc5b2'));slab.material.side=T.DoubleSide;slab.receiveShadow=true;slab.castShadow=true;root.add(slab);
 const m=material('passarela-metal','#707b77',.65,.35),bp=[],bn=[];
 function beam(a,b,r){const start=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(start),obj=new T.Object3D();obj.position.copy(start).add(end).multiplyScalar(.5);obj.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());obj.updateMatrix();const g=new T.CylinderGeometry(r,r,d.length(),6).toNonIndexed();g.applyMatrix4(obj.matrix);bp.push(...g.attributes.position.array);bn.push(...g.attributes.normal.array);g.dispose();}
 const count=Math.ceil(len/4);for(let i=0;i<=count;i++){const t=i/count;for(const s of [-1,1]){const px=x+dx*t+nx*(d.width/2-.08)*s,pz=z+dz*t+nz*(d.width/2-.08)*s,y=h(t);beam([px,y,pz],[px,y+1.1,pz],.05);if(i<count){const tt=(i+1)/count,qx=x+dx*tt+nx*(d.width/2-.08)*s,qz=z+dz*tt+nz*(d.width/2-.08)*s;for(const k of [.38,.72,1.1])beam([px,y+k,pz],[qx,h(tt)+k,qz],.035);}}}
 // Estrutura ilustrativa: não se trata de dimensionamento executivo de passarela.
 for(let d=18;d<len-15;d+=18){const t=d/len;for(const s of [-1,1])beam([x+dx*t+nx*2.35*s,-1,z+dz*t+nz*2.35*s],[x+dx*t+nx*2.35*s,h(t)-.12,z+dz*t+nz*2.35*s],.28);}
 const railGeo=new T.BufferGeometry();railGeo.setAttribute('position',new T.Float32BufferAttribute(bp,3));railGeo.setAttribute('normal',new T.Float32BufferAttribute(bn,3));const rails=new T.Mesh(railGeo,m);rails.castShadow=true;rails.receiveShadow=true;root.add(rails);
}
export function createIntegralLandscape({smallScreen=false}){
 const root=new T.Group(),surfaces=new T.Group(),furniture=new T.Group();root.name='Praças, passeios e orlas';root.add(surfaces,furniture);
 const palette={paving:'#c8c1ab',service:'#646d69',curbs:'#d3cdb8',paverJoints:'#a49f8e',flowerBeds:'#554c37'},heights={paving:.135,service:.13,curbs:.175,paverJoints:.139,flowerBeds:.105};
 for(const [key,data]of Object.entries(D.surfaces)){if(!data.indices.length)continue;const m=material(key,palette[key]);if(key==='service')m.userData.surfaceKind='asphalt';if(key==='paverJoints'){m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-1;}surfaces.add(surface(data,heights[key],m));}
 for(const bridge of D.bridges||[])addBridge(surfaces,bridge);
 const seats=[],steel=[],bins=[];
 for(const[x,z,a]of D.benches){const point=(xx,y,zz)=>({p:[x+Math.cos(a)*xx+Math.sin(a)*zz,y,z-Math.sin(a)*xx+Math.cos(a)*zz],a});
  for(const zz of [-.22,-.07,.08,.23])seats.push({...point(0,.69,zz),s:[2.25,.065,.12]});
  for(const y of [.99,1.19])seats.push({...point(0,y,.3),s:[2.25,.13,.05]});
  for(const xx of [-.8,.8]){steel.push({...point(xx,.4,0),s:[.075,.55,.53]});steel.push({...point(xx,.93,.32),s:[.06,.55,.06]});}
 }
 for(const[x,z]of D.bins)bins.push({p:[x,.61,z],s:[.30,.90,.30]});
 instances(furniture,new T.BoxGeometry(1,1,1),material('bancos-madeira','#9d7954'),seats);instances(furniture,new T.BoxGeometry(1,1,1),material('mobiliario-metal','#314648',.6,.4),steel);instances(furniture,new T.CylinderGeometry(1,1,1,12),material('lixeiras','#4c6460',.8,.15),bins);
 const trunk=[],crown=[];for(const[x,z,h]of D.palms){trunk.push({p:[x,h/2,z],s:[.16,h,.16]});crown.push({p:[x,h,z],a:x*1.71,s:[1,1,1],color:'#56734a'});}
 instances(furniture,new T.CylinderGeometry(.7,1,1,8),material('palmeiras-troncos','#9b9177'),trunk);instances(furniture,createPalmCrown(),material('palmeiras-folhas','#ffffff',.92),crown);
 const shrubs=D.shrubs.filter((_,i)=>!smallScreen||i%2===0).map(([x,z,h,c])=>({p:[x,.15+h/2,z],s:[.52,h,.55],a:x+z,color:['#667b44','#74874b','#70634c'][c]}));
 instances(furniture,new T.IcosahedronGeometry(1,0),material('forracoes','#ffffff',.96),shrubs);
 return {root,surfaces,furniture,lamps:D.lamps,trees:D.trees,materials:landscapeMaterials,setBuildings(on){furniture.visible=on;},diagnostics(){return {version:D.version,lamps:D.lamps.length,benches:D.benches.length,palms:D.palms.length,shrubs:shrubs.length,pavingTriangles:D.surfaces.paving.indices.length/3,serviceTriangles:D.surfaces.service.indices.length/3};}};
}
export function configureLandscapeMaterials(renderer){
 const textures=[];
 for(const key of ['paving','bancos-madeira','flowerBeds']){
  const m=landscapeMaterials.get(key);if(!m)continue;const n=128,a=new Uint8Array(n*n*4),base=m.color.clone().convertLinearToSRGB();
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
   const i=(y*n+x)*4,noise=((Math.imul(x+13,15485863)^Math.imul(y+17,32452843))>>>0)%1024/1024;
   const seam=key==='paving'&&(y%32===0||(x+(Math.floor(y/32)%2)*16)%32===0),k=seam?.78:.955+.08*noise;
   a.set([Math.round(base.r*255*k),Math.round(base.g*255*k),Math.round(base.b*255*k),255],i);
  }
  const t=new T.DataTexture(a,n,n);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;m.map=t;m.color.set('#ffffff');m.needsUpdate=true;textures.push(t);
 }return textures;
}
