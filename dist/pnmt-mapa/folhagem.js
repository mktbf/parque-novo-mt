import * as T from 'three';
export const foliageUniforms={
 uTime:{value:0},
 uSunDir:{value:new T.Vector3(-0.48,0.8,0.34).normalize()}
};
// Copas com silhueta irregular. Uma geometria compartilhada por todas as instâncias.
export function createCanopyGeometry(small=false){
 const positions=[],normals=[],colors=[],uv=[],o=new T.Object3D();
 const count=small?7:13;
 for(let i=0;i<count;i++){
  const a=i*2.399963,b=Math.sqrt((i+.5)/count),r=i===count-1?.08:.66*b;
  const g=new T.IcosahedronGeometry(1,small?0:1);o.position.set(Math.cos(a)*r,Math.sin(i*1.7)*.23+(1-b)*.28,Math.sin(a)*r);o.scale.set(.47+.06*Math.sin(i),.56+.08*Math.cos(i*2),.49);o.rotation.set(.15*i,a,.13*i);o.updateMatrix();g.applyMatrix4(o.matrix);
  const p=g.attributes.position,n=g.attributes.normal;for(let j=0;j<p.count;j++){positions.push(p.getX(j),p.getY(j),p.getZ(j));normals.push(n.getX(j),n.getY(j),n.getZ(j));const k=.73+.24*((i*7+j*3)%13)/12;colors.push(k,k,k*.91);uv.push(0,0);}g.dispose();
 }
 // Folhas periféricas quebram a aparência de esferas e não dependem de transparência.
 const leafCount=small?28:96;
 for(let i=0;i<leafCount;i++){
  const a=i*2.399963,y=(i/leafCount-.5)*1.15,r=Math.sqrt(Math.max(.05,1-y*y))*(.68+.2*Math.sin(i*7.17)**2),x=Math.cos(a)*r,z=Math.sin(a)*r;
  const length=.10+.045*Math.cos(i*4)**2,w=.06,ax=Math.cos(a),az=Math.sin(a),bx=-az,bz=ax;
  const verts=[[x-ax*length,y,z-az*length],[x+bx*w,y+.055,z+bz*w],[x+ax*length,y+.035,z+az*length],[x-bx*w,y-.015,z-bz*w]];
  for(const ids of [[0,1,2],[0,2,3],[2,1,0],[3,2,0]]){
   const A=new T.Vector3(...verts[ids[0]]),B=new T.Vector3(...verts[ids[1]]),C=new T.Vector3(...verts[ids[2]]),n=B.sub(A).cross(C.sub(A)).normalize();
   for(const k of ids){positions.push(...verts[k]);normals.push(n.x,n.y,n.z);const c=.78+(i%5)*.04;colors.push(c,c,c*.92);uv.push(0,0);}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeBoundingSphere();return g;
}
export function createPalmCrown(){
 const v=[],ix=[];
 for(let leaf=0;leaf<11;leaf++){
  const a=leaf*Math.PI*2/11+(leaf%2)*.1,start=v.length/3;
  for(let j=0;j<=14;j++){
   const t=j/14,r=.10+3.55*t,y=.9*Math.sin(t*Math.PI)-.70*t,w=.32*Math.sin(t*Math.PI)**.6*(j%2?.62:1);
   for(const side of [-1,1])v.push(Math.cos(a)*r-Math.sin(a)*w*side,y,Math.sin(a)*r+Math.cos(a)*w*side);
  }
  for(let j=0;j<14;j++){const b=start+j*2;ix.push(b,b+2,b+1,b+1,b+2,b+3,b+1,b+2,b,b+3,b+2,b+1);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
