import * as T from 'three';

// Fit both ground and roof points in a true perspective frustum, at any aspect.
// Positions are plan units, not surveyed elevations or geographic coordinates.
export function fitDistance(camera,target,points,aspect,padding=1.15,frame={width:1,height:1}){
 const inverse=camera.quaternion.clone().invert(),tan=Math.tan(T.MathUtils.degToRad(camera.fov/2));
 return Math.max(15,...points.map(p=>{
  const v=p.clone().sub(target).applyQuaternion(inverse);
  return v.z+Math.max(Math.abs(v.x)*padding/(tan*aspect*frame.width),Math.abs(v.y)*padding/(tan*frame.height));
 }));
}

export function fitOrtho(camera,target,points,aspect,padding=1.15){
 const inverse=camera.quaternion.clone().invert();
 const locals=points.map(p=>p.clone().sub(target).applyQuaternion(inverse));
 const half=Math.max(...locals.map(v=>Math.max(Math.abs(v.y),Math.abs(v.x)/aspect)))*padding;
 camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;
 camera.zoom=1;camera.updateProjectionMatrix();
 return half;
}
