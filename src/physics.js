import * as C from 'cannon-es';
import {getCourse,waterWave} from './course.js';
import {installObstacles,onSeeSaw} from './obstacles.js';
import {installBalanceObstacles} from './balance-obstacles.js';
import {installUniqueObstacles} from './unique-obstacles.js';
import {installPartyObstacles} from './party-obstacles.js';
import {slideAction,resolveStomps} from './movement.js';
import {catchPlatformLanding,landingKinds} from './landing.js';
export {checkpoints} from './course.js';
export const COLORS=['#31c8f3','#f64a9b','#a66bea','#ee553d','#44dba0','#ffd33f'];
export const COSTUMES=['Kasklı','Pofuduk','Canavar','Kahraman','Dino','Şeker'];
export const PLAYER_RADIUS=.52,PLAYER_UPPER=.55,PLAYER_SCALE=1.14;
export function uniqueColor(preferred,used){const first=Math.abs(Number.isInteger(preferred)?preferred:0)%COLORS.length;return used.has(first)?COLORS.findIndex((_,i)=>!used.has(i)):first;}
export function makeGame(mapId='classic'){
 const course=getCourse(mapId),{route,at,lateralDistance,hasGap,stageColor,checkpoints,finish:FINISH}=course;
 const world=new C.World({gravity:new C.Vec3(0,-24,0)});world.broadphase=new C.SAPBroadphase(world);world.solver.iterations=12;
 const ground=new C.Material('ground'),playerMat=new C.Material('player'),crateMat=new C.Material('crate');
 world.addContactMaterial(new C.ContactMaterial(ground,playerMat,{friction:0,restitution:.02}));world.addContactMaterial(new C.ContactMaterial(ground,crateMat,{friction:.001,restitution:.1}));world.addContactMaterial(new C.ContactMaterial(playerMat,crateMat,{friction:0,restitution:.1}));
 const objects=[],players=new Map(),events=[];let t=0;
 function box(id,x,y,z,sx,sy,sz,color,kind='static',extra={}){
  const body=new C.Body({mass:kind==='crate'?2:kind==='seesaw'?7:0,type:['moving','spinner','hammer','piston','ferry','lift','crusher','glove','rhythmGate'].includes(kind)?C.Body.KINEMATIC:undefined,material:kind==='crate'?crateMat:ground,position:new C.Vec3(x,y,z),shape:new C.Box(new C.Vec3(sx/2,sy/2,sz/2)),linearDamping:.22,angularDamping:.4});
  body._id=id;world.addBody(body);const o={id,x,y,z,sx,sy,sz,color,kind,body,...extra};if(extra.yaw)body.quaternion.setFromEuler(0,extra.yaw,0);o.initialQuaternion=body.quaternion.clone();objects.push(o);return o;
 }
 function placed(id,s,lateral,height,sx,sy,sz,color,kind='static',extra={}){const p=at(s,lateral,height);return box(id,p.x,p.y,p.z,sx,sy,sz,color,kind,{s,yaw:p.yaw,...extra});}
 box('start',0,-.5,8,route(8).width,1,32,stageColor(0),'floor',{s:8,yaw:0,from:-8,to:24});
 for(let a=24;a<FINISH+16;a+=4){const s=a+2;if(!course.floorEnabled(s))continue;const p=route(a),q=route(a+4),m=route(s),length=Math.hypot(q.x-p.x,4,q.y-p.y),yaw=Math.atan2(q.x-p.x,4),pitch=-Math.atan2(q.y-p.y,Math.hypot(q.x-p.x,4));
  const o=box('track'+a,m.x,m.y-.45,s,m.width,.9,length+.18,stageColor(s),'floor',{s,yaw,surface:m.kind,from:a,to:a+4});o.body.quaternion.setFromEuler(pitch,yaw,0,'YXZ');const normal=o.body.quaternion.vmult(new C.Vec3(0,.45,0));o.body.position.set(m.x-normal.x,m.y-normal.y,s-normal.z);o.x=o.body.position.x;o.y=o.body.position.y;o.z=o.body.position.z;o.initialQuaternion=o.body.quaternion.clone();
  if(m.kind==='slide'||m.kind==='water'){for(const side of [-1,1]){const wall=placed('wall'+a+side,s,side*(m.width/2-.16),.65,.32,1.5,length+.3,m.kind==='slide'?'#ffc739':'#f8fcdf','wall');wall.body.quaternion.copy(o.body.quaternion);wall.initialQuaternion=wall.body.quaternion.clone();}}
 }
 if(course.id==='classic'){
 function sweeper(s,rate){placed('fan'+s,s,0,.8,11,.5,.65,'#ff4d92','spinner',{rate});placed('fanpost'+s,s,0,.65,.65,1.3,.65,'#7b4bc8','post');}
 sweeper(49,1);sweeper(88,-1.2);sweeper(168,1.35);sweeper(407,-1.4);
 for(const s of [31,127,218,390]){placed('low'+s,s,0,1.5,10,.65,.8,'#ff5696','beam');for(const side of [-1,1])placed('lowpost'+s+side,s,side*5.25,.95,.5,1.9,.8,'#7041b4','post');}
 for(let i=0;i<3;i++)placed('gate'+i,104+i*8,0,1,4,2,1,'#ff9d27','moving',{amp:3.8,rate:.9+i*.15,phase:i*1.5});
 for(const s of [65,148,200,376])for(const side of [-1,1]){const p=at(s,side*3.7,.85),body=new C.Body({mass:0,material:ground,shape:new C.Sphere(.85),position:new C.Vec3(p.x,p.y,p.z)});body._id='bumper'+s+side;world.addBody(body);objects.push({id:body._id,x:p.x,y:p.y,z:p.z,sx:1.7,sy:1.7,sz:1.7,s,color:'#24dcac',kind:'bumper',body,initialQuaternion:body.quaternion.clone()});}
 for(let i=0;i<3;i++){
  const s=184+i*9;placed('hammer'+i,s,0,2,1.8,2,1.8,'#ffbd32','hammer',{amp:4.4,rate:.95,phase:i*1.8});
  // A visible frame physically supports each swinging obstacle.
  for(const side of [-1,1])placed('frame'+i+side,s,side*5.6,2.8,.3,5.6,.45,'#6a45ae','post');placed('framebar'+i,s,0,5.5,11.5,.3,.45,'#6a45ae','post');
 }
 for(let i=0;i<4;i++)placed('crate'+i,154+Math.floor(i/2)*3,(i%2-.5)*2,.65,1.15,1.15,1.15,'#ffcb5a','crate');
 for(const s of [328,356])placed('pad'+s,s,0,.09,4,.18,2.2,'#bef333','pad');
 placed('pad18',18,-3.3,.09,3,.18,2.2,'#bef333','pad');
 for(const s of [372])placed('hurdle'+s,s,0,.35,8,.7,.7,'#ffb447','hurdle');
 }
 const technical=(course.id==='classic'?installObstacles:installBalanceObstacles)({world,objects,placed,ground,course});
 const party=installPartyObstacles({world,objects,placed,ground,course});
 const unique=installUniqueObstacles({world,objects,placed,ground,course});
 function setPose(p,sliding){if(p.sliding===sliding)return;p.sliding=sliding;p.body.shapeOffsets[1].set(sliding?Math.sin(p.angle)*.48:0,sliding?0:PLAYER_UPPER,sliding?Math.cos(p.angle)*.48:0);p.body.aabbNeedsUpdate=true;p.body.updateBoundingRadius();}
 function lane(p){const list=[...players.values()];return (list.indexOf(p)-(list.length-1)/2)*2.1;}
 function spawnPosition(p){const s=checkpoints[p.cp],available=route(s).width/2-PLAYER_RADIUS-.3,l=Math.max(-available,Math.min(available,lane(p)));for(let row=0;row<4;row++){const pos=at(s-row*1.5,l,.55);if(![...players.values()].some(q=>q!==p&&Math.hypot(q.body.position.x-pos.x,q.body.position.z-pos.z)<1.3))return new C.Vec3(pos.x,pos.y,pos.z);}const pos=at(s-6,l,.55);return new C.Vec3(pos.x,pos.y,pos.z);}
 function centerStart(){for(const p of players.values()){const pos=at(checkpoints[0],lane(p),.55);p.body.position.set(pos.x,pos.y,pos.z);p.body.velocity.setZero();p.body.aabbNeedsUpdate=true;}}
 function addPlayer(id,name,color,costume=0){if(players.has(id))return players.get(id);const slot=[0,1,2,3].find(s=>![...players.values()].some(p=>p.slot===s));if(slot===undefined)return null;
  const b=new C.Body({mass:3,material:playerMat,fixedRotation:true,linearDamping:.18,collisionFilterGroup:2,collisionFilterMask:1});b.addShape(new C.Sphere(PLAYER_RADIUS));b.addShape(new C.Sphere(PLAYER_RADIUS),new C.Vec3(0,PLAYER_UPPER,0));b.updateMassProperties();b._id=id;world.addBody(b);
  const p={id,name:name.slice(0,16),slot,color:uniqueColor(color,new Set([...players.values()].map(p=>p.color))),costume:Math.abs(costume)%COSTUMES.length,body:b,input:{},cp:0,falls:0,dash:-5,jump:false,finished:0,angle:0,pad:-3,slidePressed:false,slideUntil:-1,lastSlide:-3,sliding:false,inWater:false,boostUntil:0};players.set(id,p);centerStart();return p;
 }
 function removePlayer(id){const p=players.get(id);if(p)world.removeBody(p.body);players.delete(id);}
 function respawn(p){setPose(p,false);p.slideUntil=-1;p.boostUntil=0;p.airDiveUsed=p.diveLandingPending=p.diving=false;p.flipUntil=0;p.body.position.copy(spawnPosition(p));p.body.velocity.setZero();p.body.angularVelocity.setZero();p.body.aabbNeedsUpdate=true;p.falls++;events.push({id:p.id,kind:'fall'});}
 function reset(){t=0;events.length=0;for(const p of players.values()){Object.assign(p,{cp:0,falls:0,finished:0,dash:-5,jump:false,slidePressed:false,slideUntil:-1,lastSlide:-3,inWater:false,resetPressed:false,input:{}});setPose(p,false);}centerStart();
  for(const o of objects){o.body.position.set(o.x,o.y,o.z);o.body.quaternion.copy(o.initialQuaternion);o.body.velocity.setZero();o.body.angularVelocity.setZero();o.body.aabbNeedsUpdate=true;}technical.reset();party.reset();unique.reset();for(const p of players.values()){p.boostUntil=0;p.airDiveUsed=p.diveLandingPending=p.diving=false;p.flipUntil=0;p.springAt=p.boostAt=p.gloveAt=p.ballAt=p.stompAt=-10;}}
 function step(dt,active=true){t+=dt;const landingPlatforms=objects.filter(o=>landingKinds.has(o.kind)),oldPlatforms=new Map(landingPlatforms.map(o=>[o.id,{p:o.body.position.clone(),q:o.body.quaternion.clone()}])),oldPlayers=new Map([...players.values()].map(p=>[p.id,p.body.position.clone()]));
  for(const o of objects){
   if(o.kind==='spinner'){o.body.quaternion.setFromAxisAngle(new C.Vec3(0,1,0),o.yaw+t*o.rate);o.body.angularVelocity.set(0,o.rate,0);}
   if(o.kind==='moving'||o.kind==='hammer'&&course.id==='classic'){const phase=t*o.rate+(o.phase||0),offset=Math.sin(phase)*o.amp,vel=Math.cos(phase)*o.amp*o.rate;o.body.position.set(o.x+Math.cos(o.yaw)*offset,o.y,o.z-Math.sin(o.yaw)*offset);o.body.velocity.set(Math.cos(o.yaw)*vel,0,-Math.sin(o.yaw)*vel);}
   if(o.kind==='crate'&&o.body.position.y<route(o.s).y-12){o.body.position.set(o.x,o.y,o.z);o.body.velocity.setZero();}
  }
  for(const p of players.values()){
   const b=p.body,where=route(b.position.z),inWater=where.kind==='water'&&Math.abs(lateralDistance(b.position.x,b.position.z))<where.width/2&&b.position.y<where.y+2&&b.position.y>where.y-2;
   if(inWater&&!p.inWater)events.push({id:p.id,kind:'splash'});p.inWater=inWater;
   let grounded=false,supportX=0,supportZ=0;for(const c of world.contacts)if(c.bi===b&&c.ni.y<-.5||c.bj===b&&c.ni.y>.5){grounded=true;const support=c.bi===b?c.bj:c.bi,velocity=support.getVelocityAtWorldPoint(b.position,new C.Vec3());supportX=velocity.x;supportZ=velocity.z;break;}
   if(!grounded&&b.velocity.y<2){const hit=new C.RaycastResult();world.raycastClosest(b.position,new C.Vec3(b.position.x,b.position.y-PLAYER_RADIUS-.08,b.position.z),{collisionFilterMask:1,skipBackfaces:true},hit);if(hit.hasHit&&hit.hitNormalWorld.y>.6){const velocity=hit.body.getVelocityAtWorldPoint(b.position,new C.Vec3());if(b.velocity.y-velocity.y<2){grounded=true;supportX=velocity.x;supportZ=velocity.z;}}}
   if(!grounded&&b.velocity.y<2){for(const o of unique.rotors){const local=o.body.pointToLocalFrame(b.position),height=local.y-o.sy/2;if(Math.hypot(local.x,local.z)<o.radius-.08&&height>PLAYER_RADIUS-.08&&height<PLAYER_RADIUS+.1){grounded=true;const velocity=o.body.getVelocityAtWorldPoint(b.position,new C.Vec3());supportX=velocity.x;supportZ=velocity.z;break;}}}
   p.grounded=grounded;const onSlide=where.kind==='slide'&&grounded&&Math.abs(lateralDistance(b.position.x,b.position.z))<where.width/2;
   if(p.boostSource==='pad'){if(!grounded)p.padAirborne=true;else if(p.padAirborne){p.boostUntil=0;p.boostSource='';}}
   const inp=active&&!p.finished?p.input:{},yaw=Number.isFinite(inp.yaw)?inp.yaw:0,lx=Number(!!inp.left)-Number(!!inp.right),lz=Number(!!inp.up)-Number(!!inp.down),l=Math.hypot(lx,lz)||1;
   const dx=(lx*Math.cos(yaw)+lz*Math.sin(yaw))/l,dz=(lz*Math.cos(yaw)-lx*Math.sin(yaw))/l;
   let justJumped=false;if(inp.jump&&!p.jump&&(grounded||inWater)){b.velocity.y=inWater?9:10.7;grounded=false;p.slideUntil=-1;justJumped=true;events.push({id:p.id,kind:'jump'});}p.jump=!!inp.jump;
   slideAction(p,{input:inp,grounded,water:inWater,dx,dz,t,justJumped},events);
   let sliding=t<p.slideUntil||onSlide;
   if(p.sliding&&!sliding){const hit=new C.RaycastResult();world.raycastClosest(b.position,new C.Vec3(b.position.x,b.position.y+1,b.position.z),{collisionFilterMask:1,skipBackfaces:true},hit);if(hit.hasHit){sliding=true;p.slideUntil=t+.08;}}
   setPose(p,sliding);const accel=inWater?32:where.kind==='ice'?(inp.down?40:22):grounded?48:19;b.velocity.x+=dx*accel*dt;b.velocity.z+=dz*accel*dt;
   if(onSlide&&active){const along=where.yaw;b.velocity.x+=Math.sin(along)*18*dt;b.velocity.z+=Math.cos(along)*18*dt;const correction=-lateralDistance(b.position.x,b.position.z)*1.8*dt;b.velocity.x+=correction*Math.cos(along);b.velocity.z-=correction*Math.sin(along);p.angle=along;}
   if(inWater){b.velocity.y+=(24+(where.y+1+waterWave(b.position.x,b.position.z,t)-b.position.y)*35-b.velocity.y*7)*dt;supportX=Math.sin(where.yaw)*.8+Math.sin(t*.7)*.12;supportZ=Math.cos(where.yaw)*.8;const resistance=Math.exp(-.7*dt);b.velocity.x=supportX+(b.velocity.x-supportX)*resistance;b.velocity.z=supportZ+(b.velocity.z-supportZ)*resistance;}
   if((grounded||inWater)&&!sliding&&t>p.boostUntil){const drag=Math.exp(-(where.kind==='ice'?.55:8)*dt);if(!dx)b.velocity.x=supportX+(b.velocity.x-supportX)*drag;if(!dz)b.velocity.z=supportZ+(b.velocity.z-supportZ)*drag;}
   const vel=Math.hypot(b.velocity.x,b.velocity.z),max=t<p.boostUntil?36:inWater?5.2:onSlide?19:sliding?14:t-p.dash<.28?23:where.kind==='ice'?12.5:8.5;if(vel>max){b.velocity.x*=max/vel;b.velocity.z*=max/vel;}
   if((dx||dz)&&!onSlide)p.angle=Math.atan2(dx,dz);
   
   if(inp.dash&&t-p.dash>1.7){p.dash=t;b.velocity.x+=Math.sin(p.angle)*14;b.velocity.z+=Math.cos(p.angle)*14;b.velocity.y=Math.max(b.velocity.y,2);events.push({id:p.id,kind:'dash'});}
   if(inp.reset&&!p.resetPressed)respawn(p);p.resetPressed=!!inp.reset;
   for(const o of objects)if(o.kind==='bumper'){const x=b.position.x-o.x,z=b.position.z-o.z,d=Math.hypot(x,z);if(d<1.36&&Math.abs(b.position.y-o.y)<1.4&&t-(p.bumpTime??-10)>.3){b.velocity.x+=x/(d||1)*15;b.velocity.z+=z/(d||1)*15;b.velocity.y=6;p.bumpTime=t;events.push({id:p.id,kind:'bump'});}}
   if(active&&!p.finished){for(let c=p.cp+1;c<checkpoints.length;c++)if(b.position.z>checkpoints[c]&&Math.abs(lateralDistance(b.position.x,b.position.z))<where.width/2&&Math.abs(b.position.y-where.y)<4){p.cp=c;events.push({id:p.id,kind:'checkpoint'});}
    if(course.id==='classic')for(const s of [18,328,356]){const point=at(s,s===18?-3.3:0);if(Math.hypot(b.position.x-point.x,b.position.z-point.z)<1.8&&grounded&&t-p.pad>1){const target=at(s+23),dx=target.x-b.position.x,dz=target.z-b.position.z,d=Math.hypot(dx,dz);b.velocity.y=11.8;b.velocity.x=dx/d*25;b.velocity.z=dz/d*25;p.boostUntil=t+1.5;p.boostSource='pad';p.padAirborne=false;p.pad=t;events.push({id:p.id,kind:'boing'});}}
    if(b.position.z>FINISH&&Math.abs(b.position.y-where.y)<4&&Math.abs(lateralDistance(b.position.x,b.position.z))<where.width/2){p.finished=t;events.push({id:p.id,kind:'finish'});}
   }
   if(b.position.y<where.y-12)respawn(p);
  }
  technical.update(dt,t,players,events);party.update(dt,t,players,events);unique.update(dt,t);world.step(dt);technical.afterStep();party.afterStep();resolveStomps(players,t,events);
  for(const p of players.values()){p.grounded=world.contacts.some(c=>(c.bi===p.body&&c.ni.y<-.5)||(c.bj===p.body&&c.ni.y>.5));for(const platform of landingPlatforms)catchPlatformLanding(p,oldPlayers.get(p.id),platform,oldPlatforms.get(platform.id),PLAYER_RADIUS); }
  const list=[...players.values()];for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
   const a=list[i].body,b=list[j].body;if(Math.abs(a.position.y-b.position.y)>1.6)continue;let x=b.position.x-a.position.x,z=b.position.z-a.position.z,d=Math.hypot(x,z);if(d>=1.3)continue;
   if(d<.0001){x=1;z=0;}else{x/=d;z/=d;}const depth=(1.3-d)*.5;a.position.x-=x*depth;a.position.z-=z*depth;b.position.x+=x*depth;b.position.z+=z*depth;const rel=(b.velocity.x-a.velocity.x)*x+(b.velocity.z-a.velocity.z)*z;if(rel<0){const impulse=-rel*.6;a.velocity.x-=x*impulse;a.velocity.z-=z*impulse;b.velocity.x+=x*impulse;b.velocity.z+=z*impulse;}a.aabbNeedsUpdate=b.aabbNeedsUpdate=true;
  }
 }
 function snapshot(drain=true){return {t,mapId:course.id,players:[...players.values()].map(p=>({id:p.id,name:p.name,slot:p.slot,color:p.color,costume:p.costume,pos:p.body.position.toArray(),vel:p.body.velocity.toArray(),angle:p.angle,cp:p.cp,falls:p.falls,finished:p.finished,dash:p.dash,sliding:p.sliding,diving:!!p.diving,flipUntil:p.flipUntil||0,inWater:p.inWater,grounded:!!p.grounded,slideReady:t-p.lastSlide>1.1})),objects:objects.filter(o=>['crate','moving','hammer','spinner','seesaw','door','yeetus','rolling','ferry','lift','crusher','pulse','jet','falltile','rainball','glove','spring','boost','rotor','rhythmGate'].includes(o.kind)).map(o=>({id:o.id,p:o.body.position.toArray(),q:o.body.quaternion.toArray(),broken:!!o.broken,active:o.active!==false,crack:o.crack||0,charge:o.charge||0,punching:!!o.punching})),events:drain?events.splice(0):[...events]};}
 // Invalidate constructor-time AABBs after orienting static slabs.
 for(const body of world.bodies)body.aabbNeedsUpdate=true;world.broadphase.dirty=true;
 return {world,objects,players,addPlayer,removePlayer,step,snapshot,reset,technical,party,unique,course,mapId:course.id,get time(){return t;}};
}
