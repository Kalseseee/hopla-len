import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from 'cannon-es';
import {makeGame,checkpoints,PLAYER_RADIUS} from '../src/physics.js';
import {at,route,FINISH,hasGap} from '../src/course.js';
import {RaceSession,applyRemoteInput,sanitizeInput} from '../src/session.js';
const step=(g,n=120,active=true)=>{for(let i=0;i<n;i++)g.step(1/60,active);};
function teleport(p,s,lateral=0,height=.46){const pos=at(s,lateral,height);p.body.position.set(pos.x,pos.y,pos.z);p.body.velocity.setZero();p.body.aabbNeedsUpdate=true;p.angle=pos.yaw;}
test('one through four runners start side by side around the exact center',()=>{
 for(let count=1;count<=4;count++){const g=makeGame();for(let i=0;i<count;i++)g.addPlayer(String(i),'Player',0,i);g.reset();const ps=[...g.players.values()];assert.ok(Math.abs(ps.reduce((s,p)=>s+p.body.position.x,0))<1e-8);for(const p of ps)assert.equal(p.body.position.z,checkpoints[0]);for(let i=1;i<count;i++)assert.ok(Math.abs(ps[i].body.position.x-ps[i-1].body.position.x-2.1)<.001);}
});
test('runner settles, moves on ground, then jumps once per press',()=>{
 const g=makeGame(),p=g.addPlayer('a','A',0);step(g);assert.ok(Math.abs(p.body.position.y-PLAYER_RADIUS)<.03);p.input={up:true};step(g,30);assert.ok(p.body.velocity.z>7);p.input={jump:true};g.step(1/60);assert.ok(p.body.velocity.y>9);step(g,10);assert.ok(p.body.velocity.y<9);
});
test('course is curved and supports roughly one minute of running',()=>{
 let length=0,min=Infinity,max=-Infinity;for(let s=0;s<FINISH;s++){const p=route(s),q=route(s+1);length+=Math.hypot(q.x-p.x,1,q.y-p.y);min=Math.min(min,p.x);max=Math.max(max,p.x);}assert.ok(max-min>35);assert.ok(length/8.5>50&&length/8.5<65);assert.equal(route(250).kind,'slide');assert.equal(route(295).kind,'water');
});
test('physical floors follow the curved and elevated route without unsupported seams',()=>{
 const g=makeGame();for(const s of [15,37,76,133,180,196,214,245,270,295,321,350,410]){const p=at(s,0),hit=new C.RaycastResult();g.world.raycastClosest(new C.Vec3(p.x,p.y+8,p.z),new C.Vec3(p.x,p.y-4,p.z),{collisionFilterMask:1},hit);assert.ok(hit.hasHit,'missing surface '+s);assert.ok(Math.abs(hit.hitPointWorld.y-p.y)<.15,'height mismatch '+s+' '+hit.hitPointWorld.y);}
});
test('checkpoint respawn follows the curved route and reset clears progress',()=>{
 const g=makeGame(),p=g.addPlayer('a','A',0);teleport(p,checkpoints[2]+.2,0,1);g.step(1/60);assert.equal(p.cp,2);p.body.position.y=-30;g.step(1/60);const point=at(checkpoints[2]);assert.ok(Math.abs(p.body.position.x-point.x)<.1);assert.equal(p.falls,1);g.reset();assert.equal(p.cp,0);assert.equal(p.falls,0);
});
test('horizontal player contacts prevent towers and transfer momentum',()=>{
 const g=makeGame(),a=g.addPlayer('a','A',0),b=g.addPlayer('b','B',0);a.body.position.set(0,.5,5);b.body.position.set(0,.5,5);step(g,45);assert.ok(Math.hypot(a.body.position.x-b.body.position.x,a.body.position.z-b.body.position.z)>1.11);assert.ok(Math.abs(a.body.position.y-b.body.position.y)<.05);
 teleport(a,5,0);teleport(b,6.2,0);a.input={up:true};step(g,30);assert.ok(b.body.position.z>6.6);
});
test('sliding lowers the collider and clears a supported low gate',()=>{
 const g=makeGame(),p=g.addPlayer('a','A',0);teleport(p,28.5);step(g,5);p.input={up:true,slide:true,yaw:route(31).yaw};g.step(1/60);assert.equal(p.sliding,true);assert.equal(p.body.shapeOffsets[1].y,0);step(g,30);assert.ok(p.body.position.z>33);p.input={};step(g,40);assert.equal(p.sliding,false);
});
test('standing runner cannot pass through the low gate',()=>{
 const g=makeGame(),p=g.addPlayer('a','A',0);teleport(p,28.5);p.input={up:true,yaw:route(31).yaw};step(g,40);assert.ok(p.body.position.z<30.5);assert.equal(p.sliding,false);
});
test('water buoyancy keeps the runner afloat and reports a splash',()=>{
 const g=makeGame(),p=g.addPlayer('a','A',0);teleport(p,296,0,.6);step(g);assert.equal(p.inWater,true);assert.ok(p.body.position.y>route(296).y+.6);assert.ok(p.body.position.y<route(296).y+1.5);assert.ok(g.snapshot().events.some(e=>e.kind==='splash'));p.input={jump:true};g.step(1/60);assert.ok(p.body.velocity.y>7);
});
test('water slide supplies forward flow and a lowered pose',()=>{
 const g=makeGame(),p=g.addPlayer('a','A',0);teleport(p,245,0,1);step(g,60);assert.ok(p.body.position.z>247);assert.equal(p.sliding,true);assert.equal(p.falls,0);
});
test('launch pad clears a deliberate gap and finish uses the host clock',()=>{
 const g=makeGame(),p=g.addPlayer('a','A',0);teleport(p,328,0,.9);step(g,15);assert.ok(p.body.velocity.y>3);assert.ok(hasGap(334));teleport(p,FINISH+1,0,1);g.step(1/60);assert.ok(p.finished>0);const time=p.finished;step(g,2);assert.equal(p.finished,time);
});
test('moving obstacles and crates have physical bodies and visible supports',()=>{
 const g=makeGame();const gate=g.objects.find(o=>o.kind==='moving'),x=gate.body.position.x;step(g,25);assert.notEqual(gate.body.position.x,x);assert.ok(g.objects.filter(o=>o.id.startsWith('frame')).length>=9);const crate=g.objects.find(o=>o.kind==='crate');assert.equal(crate.body.mass,2);
});
test('guest controls are routed independently and costume is shared',()=>{
 const session=new RaceSession(makeGame());session.start([{id:'host',name:'H',color:0,costume:0},{id:'guest',name:'G',color:0,costume:4}]);session.advance(2);session.advance(1.1);assert.equal(applyRemoteInput(session.game,'missing',{up:true}),false);session.input('guest',{up:true});session.advance(.5);const state=session.snapshot(),h=state.players.find(p=>p.id==='host'),g=state.players.find(p=>p.id==='guest');assert.ok(g.pos[2]>h.pos[2]+1);assert.equal(g.costume,4);assert.ok(Math.abs(h.vel[2])<.1);
});
test('camera-relative movement follows the orbit and validates untrusted angles',()=>{
 const session=new RaceSession(makeGame());session.start([{id:'a',name:'A',color:0}]);session.advance(2);session.advance(1.1);session.input('a',{up:true,yaw:Math.PI/2});session.advance(.5);const p=session.game.players.get('a');assert.ok(p.body.position.x>1);assert.ok(Math.abs(p.body.position.z-checkpoints[0])<.1);assert.equal(sanitizeInput({yaw:Infinity}).yaw,0);
});
test('four identical color requests become four distinct race colors',()=>{
 const session=new RaceSession(makeGame());session.start(Array.from({length:4},(_,i)=>({id:String(i),name:'A',color:0,costume:0})));const colors=session.snapshot().players.map(p=>p.color);assert.equal(new Set(colors).size,4);session.advance(1);assert.deepEqual(session.snapshot().players.map(p=>p.color),colors);
});
test('boost pad retains its launch speed and travels far beyond a normal jump',()=>{
 const g=makeGame(),p=g.addPlayer('a','A',0);teleport(p,328,0,.9);step(g,30);assert.ok(Math.hypot(p.body.velocity.x,p.body.velocity.z)>20);assert.ok(p.boostUntil>g.time);step(g,40);assert.ok(p.body.position.z>345);assert.equal(p.falls,0);
});
test('giant hammer delivers a persistent large knockback',()=>{
 const g=makeGame(),p=g.addPlayer('a','A',0),o=g.technical.hammers[0];const head=o.body.quaternion.vmult(new C.Vec3(0,-3.1,0)).vadd(o.body.position);p.body.position.copy(head);p.body.position.y+=.1;p.body.aabbNeedsUpdate=true;g.step(1/60);assert.ok(g.snapshot().events.some(e=>e.kind==='yeet'));assert.ok(p.boostUntil>g.time);assert.ok(Math.hypot(p.body.velocity.x,p.body.velocity.z)>15);
});
test('see-saw reacts to weight and stays within its angle limit',()=>{
 const g=makeGame(),p=g.addPlayer('a','A',0),o=g.technical.seesaws[0];teleport(p,78,3,.6);step(g,50,false);const up=o.body.quaternion.vmult(new C.Vec3(0,1,0));assert.ok(up.y<.999);assert.ok(up.y>=Math.cos(.35));assert.ok(g.world.constraints.length>=2);
});
test('only the breakable door opens, and shared state records the opening',()=>{
 const g=makeGame(),p=g.addPlayer('a','A',0),door=g.technical.doors.find(o=>o.breakable);const dir=new C.Vec3(Math.sin(door.yaw),0,Math.cos(door.yaw));p.body.position.set(door.x-dir.x*.9,PLAYER_RADIUS,door.z-dir.z*.9);p.body.velocity.copy(dir.scale(8));p.body.aabbNeedsUpdate=true;g.step(1/60);assert.equal(door.broken,true);assert.equal(door.body.collisionFilterMask,0);assert.equal(g.snapshot().objects.find(o=>o.id===door.id).broken,true);
 g.reset();assert.equal(door.broken,false);assert.ok(g.technical.doors.some(o=>o.breakable));const fake=g.technical.doors.find(o=>!o.breakable);p.body.position.set(fake.x-dir.x*.9,PLAYER_RADIUS,fake.z-dir.z*.9);p.body.velocity.copy(dir.scale(8));g.step(1/60);assert.equal(fake.broken,false);
});
test('bowling balls physically roll toward approaching runners',()=>{
 const g=makeGame(),o=g.technical.balls[0],z=o.body.position.z;step(g,90);assert.ok(o.body.position.z<z-1);assert.equal(o.body.mass,8);
});
test('shortened wall can be cleared by a normal jump without using a crate',()=>{
 const g=makeGame(),p=g.addPlayer('a','A',0),wall=g.objects.find(o=>o.id==='climbwall');for(const o of g.objects.filter(o=>o.kind==='crate'))g.world.removeBody(o.body);
 teleport(p,158.1,0,.55);step(g,8);p.input={up:true,jump:true,yaw:wall.yaw};let crossed=false;
 for(let i=0;i<55;i++){g.step(1/60);const along=(p.body.position.x-wall.x)*Math.sin(wall.yaw)+(p.body.position.z-wall.z)*Math.cos(wall.yaw);if(along>1.1){crossed=true;break;}}
 assert.equal(crossed,true);assert.equal(p.falls,0);
});
test('shortened wall also leaves a safe side lane for a player who does not jump',()=>{
 const g=makeGame(),p=g.addPlayer('a','A',0),wall=g.objects.find(o=>o.id==='climbwall');teleport(p,158.1,5.7,.55);step(g,8);p.input={up:true,yaw:wall.yaw};let crossed=false;
 for(let i=0;i<55;i++){g.step(1/60);const along=(p.body.position.x-wall.x)*Math.sin(wall.yaw)+(p.body.position.z-wall.z)*Math.cos(wall.yaw);if(along>1.1){crossed=true;break;}}
 assert.equal(crossed,true);assert.equal(p.falls,0);
});
