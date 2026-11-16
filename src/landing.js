import {Vec3} from 'cannon-es';
export const landingKinds=new Set(['ferry','lift','pulse','seesaw','falltile','rotor']);
// Only downward crossings from above are caught. Undersides and gaps stay open.
export function catchPlatformLanding(player,oldPosition,platform,oldPlatform,radius){
 if(platform.active===false||!platform.body.collisionResponse)return false;
 const b=platform.body,n=b.quaternion.vmult(new Vec3(0,1,0));if(n.y<.6)return false;
 const oldNormal=oldPlatform.q.vmult(new Vec3(0,1,0));
 const before=oldPosition.vsub(oldPlatform.p).dot(oldNormal)-platform.sy/2;
 const distance=player.body.position.vsub(b.position).dot(n)-platform.sy/2;
 if(before<radius-.08||distance>=radius||distance<radius-2)return false;
 const local=b.quaternion.inverse().vmult(player.body.position.vsub(b.position));
 if(platform.kind==='rotor'){if(Math.hypot(local.x,local.z)>platform.radius-.08)return false;}else if(Math.abs(local.x)>platform.sx/2-.05||Math.abs(local.z)>platform.sz/2-.05)return false;
 player.body.position.vadd(n.scale(radius-distance-.002),player.body.position);
 const support=b.getVelocityAtWorldPoint(player.body.position,new Vec3()),relative=player.body.velocity.vsub(support).dot(n);
 if(relative<0)player.body.velocity.vsub(n.scale(relative),player.body.velocity);
 player.body.aabbNeedsUpdate=true;player.grounded=true;return true;
}
