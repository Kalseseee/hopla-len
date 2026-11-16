// All axes and moving surfaces share one delayed host timeline.
export class SnapshotBuffer{
 constructor(delay=.075){this.delay=delay;this.frames=[];this.receivedAt=0;}
 clear(){this.frames=[];}
 push(state,now){const last=this.frames.at(-1);if(last&&state.t<last.t)this.clear();if(this.frames.at(-1)?.t===state.t)this.frames.pop();this.frames.push(state);this.frames=this.frames.slice(-10);this.receivedAt=now;}
 sample(now){const last=this.frames.at(-1);if(!last)return null;const time=Math.min(last.t,last.t+Math.max(0,(now-this.receivedAt)/1000)-this.delay);let a=this.frames[0],b=last;for(let i=1;i<this.frames.length;i++)if(this.frames[i].t>=time){a=this.frames[i-1];b=this.frames[i];break;}const alpha=Math.max(0,Math.min(1,(time-a.t)/(b.t-a.t||1)));
 const mix=(arr,key,position,quaternion=false)=>arr.map(p=>{const old=a[key].find(q=>q.id===p.id);if(!old)return p;const v=p[position],u=old[position];if(v.some((x,i)=>Math.abs(x-u[i])>6)||p.falls!==old.falls)return p;const out={...p,[position]:v.map((x,i)=>u[i]+(x-u[i])*alpha)};if(!quaternion&&Number.isFinite(p.angle)){const d=Math.atan2(Math.sin(p.angle-old.angle),Math.cos(p.angle-old.angle));out.angle=old.angle+d*alpha;}if(quaternion&&p.q){const dot=p.q.reduce((sum,x,i)=>sum+x*old.q[i],0),q=p.q.map((x,i)=>old.q[i]+((dot<0?-x:x)-old.q[i])*alpha),norm=Math.hypot(...q)||1;out.q=q.map(x=>x/norm);}return out;});
 return{...b,t:time,players:mix(b.players,'players','pos'),objects:mix(b.objects,'objects','p',true)};
 }
}
