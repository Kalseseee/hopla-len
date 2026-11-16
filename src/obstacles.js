import * as C from 'cannon-es';
import {at,route} from './course.js';
export const SEESAWS=[78,344];
export const onSeeSaw=s=>SEESAWS.some(center=>Math.abs(s-center)<6);
export function installObstacles({world,objects,placed,ground,course}){
 const {at,route}=course;
 const seesaws=[],doors=[],hammers=[],balls=[],launches=[];let previousDoor=0;
 for(const s of SEESAWS){
  const a=route(s-6),b=route(s+6),length=Math.hypot(b.x-a.x,12)+.45;
  const o=placed('seesaw'+s,s,0,-.25,route(s).width-.4,.5,length,'#ffb63d','seesaw');
  const anchor=new C.Body({mass:0,position:o.body.position.clone()});world.addBody(anchor);
  const axis=new C.Vec3(Math.sin(o.yaw),0,Math.cos(o.yaw));
  const hinge=new C.HingeConstraint(anchor,o.body,{pivotA:new C.Vec3(),pivotB:new C.Vec3(),axisA:axis,axisB:new C.Vec3(0,0,1),collideConnected:false,maxForce:1e6});world.addConstraint(hinge);
  const stand=placed('fulcrum'+s,s,0,-1.35,1.2,1.7,2,'#8855c5','post');stand.body.collisionFilterMask=0;
  seesaws.push({...o,axis});
 }
 for(let i=0;i<3;i++){
  const o=placed('door'+i,96,(i-1)*3.7,1.5,3.55,3,.5,'#f46aaf','door');o.breakable=false;o.broken=false;doors.push(o);
 }
 for(const l of [-6.2,-1.85,1.85,6.2])placed('doorpost'+l,96,l,1.8,.3,3.6,.8,'#7247b1','post');
 placed('doorlintel',96,0,3.5,12.7,.3,.8,'#7247b1','post');
 // Optional low hurdle: clear it with a normal jump, or use either side lane.
 placed('climbwall',160,0,.55,8.8,1.1,.65,'#8c6be1','climbwall');
 for(const [index,s]of [174,383].entries()){
  const p=at(s,index?-3:3,4.2),body=new C.Body({mass:0,type:C.Body.KINEMATIC,material:ground,position:new C.Vec3(p.x,p.y,p.z)});
  body.addShape(new C.Box(new C.Vec3(.14,1.55,.14)),new C.Vec3(0,-1.55,0));body.addShape(new C.Box(new C.Vec3(1.6,.75,.9)),new C.Vec3(0,-3.1,0));body.quaternion.setFromEuler(0,p.yaw,0);body._id='yeetus'+s;world.addBody(body);
  const o={id:body._id,kind:'yeetus',body,x:p.x,y:p.y,z:p.z,s,yaw:p.yaw,rate:index?2.2:-2.2,phase:index?1.2:0,color:'#ff4e9b',initialQuaternion:body.quaternion.clone()};objects.push(o);hammers.push(o);
  for(const side of [-1,1])placed('yeetpost'+s+side,s,side*5.8,2.2,.45,4.4,.8,'#7045ac','post');placed('yeetbar'+s,s,0,4.3,12,.45,.7,'#7045ac','post');
 }
 for(let i=0;i<3;i++){
  const s=138+i*2.3,p=at(s,(i-1)*3.5,2.1),body=new C.Body({mass:8,material:ground,shape:new C.Sphere(1.05),position:new C.Vec3(p.x,p.y,p.z),linearDamping:.02,angularDamping:.04});body._id='rolling'+i;world.addBody(body);
  const o={id:body._id,kind:'rolling',s,body,x:p.x,y:p.y,z:p.z,sx:2.1,sy:2.1,sz:2.1,color:['#f778af','#8c78ec','#ffca42'][i],initialQuaternion:body.quaternion.clone()};objects.push(o);balls.push(o);
 }
 // Two heights: jump the low arm, slide underneath the upper one.
 placed('fan88high',88,0,1.65,10,.42,.6,'#ffa63a','spinner',{rate:1.3});
 function reset(){previousDoor=(previousDoor+1+Math.floor(Math.random()*2))%3;doors.forEach((o,i)=>{o.breakable=i===previousDoor;o.broken=false;o.body.collisionResponse=true;o.body.collisionFilterMask=-1;o.body.aabbNeedsUpdate=true;});}
 function roll(o){const up=o.body.quaternion.vmult(new C.Vec3(0,1,0)),right=new C.Vec3(Math.cos(o.yaw),0,-Math.sin(o.yaw));return Math.atan2(-up.dot(right),up.y);}
 function update(dt,t,players,events){
  for(const o of seesaws){const angle=roll(o),omega=o.body.angularVelocity.dot(o.axis),torque=-angle*95-omega*12;o.body.torque.vadd(o.axis.scale(torque),o.body.torque);}
  for(const o of hammers){const base=new C.Quaternion().setFromEuler(0,o.yaw,0),rotation=new C.Quaternion().setFromAxisAngle(new C.Vec3(1,0,0),t*o.rate+o.phase);base.mult(rotation,o.body.quaternion);o.body.angularVelocity.set(Math.cos(o.yaw)*o.rate,0,-Math.sin(o.yaw)*o.rate);}
  for(const o of balls){if(o.body.position.z<122||o.body.position.y<route(o.body.position.z).y-6){o.body.position.set(o.x,o.y,o.z);o.body.velocity.setZero();o.body.aabbNeedsUpdate=true;}const forward=route(o.body.position.z).yaw;o.body.velocity.x-=Math.sin(forward)*dt*5;o.body.velocity.z-=Math.cos(forward)*dt*5;const speed=Math.hypot(o.body.velocity.x,o.body.velocity.z);if(speed>9){o.body.velocity.x*=9/speed;o.body.velocity.z*=9/speed;}}
  for(const p of players.values()){
   const b=p.body;
   for(const o of doors){if(o.broken)continue;const delta=b.position.vsub(o.body.position),side=delta.x*Math.cos(o.yaw)-delta.z*Math.sin(o.yaw),ahead=delta.x*Math.sin(o.yaw)+delta.z*Math.cos(o.yaw),speed=b.velocity.x*Math.sin(o.yaw)+b.velocity.z*Math.cos(o.yaw);
    if(Math.abs(side)<1.75&&Math.abs(ahead)<1.05&&Math.abs(b.position.y-o.y)<2&&Math.abs(speed)>4.3){if(o.breakable){o.broken=true;o.body.collisionResponse=false;o.body.collisionFilterMask=0;events.push({id:p.id,kind:'break',pos:[o.x,o.y,o.z],objectId:o.id});}else if(t-(p.doorHit??-10)>.6){p.doorHit=t;events.push({id:p.id,kind:'solid'});}}
   }
   for(const o of hammers){const head=o.body.quaternion.vmult(new C.Vec3(0,-3.1,0));head.vadd(o.body.position,head);if(head.distanceTo(b.position)<2.15&&t-(p.yeetAt??-10)>.8){const v=o.body.getVelocityAtWorldPoint(head,new C.Vec3()),sign=(v.x*Math.sin(o.yaw)+v.z*Math.cos(o.yaw))>=0?1:-1;launches.push({body:b,v:new C.Vec3(Math.sin(o.yaw)*sign*31,13,Math.cos(o.yaw)*sign*31),clearY:head.y+1.32});p.boostUntil=t+1.6;p.boostSource='hammer';p.yeetAt=t;events.push({id:p.id,kind:'yeet'});}}
   for(const o of balls){const delta=b.position.vsub(o.body.position);if(delta.length()<1.7&&t-(p.ballHit??-10)>.6){const d=Math.hypot(delta.x,delta.z)||1;b.velocity.x+=delta.x/d*14;b.velocity.z+=delta.z/d*14;b.velocity.y=Math.max(b.velocity.y,4);p.ballHit=t;p.boostUntil=t+.65;events.push({id:p.id,kind:'bump'});}}
  }
 }
 function afterStep(){for(const o of seesaws){const angle=roll(o);if(Math.abs(angle)>.34){o.body.quaternion.setFromEuler(0,o.yaw,Math.sign(angle)*.34,'YXZ');const along=o.body.angularVelocity.dot(o.axis);o.body.angularVelocity.vsub(o.axis.scale(along*.8),o.body.angularVelocity);o.body.aabbNeedsUpdate=true;}}for(const launch of launches){launch.body.velocity.copy(launch.v);launch.body.position.y=Math.max(launch.body.position.y,launch.clearY);launch.body.aabbNeedsUpdate=true;}launches.length=0;}
 reset();return {reset,update,afterStep,seesaws,doors,hammers,balls};
}
