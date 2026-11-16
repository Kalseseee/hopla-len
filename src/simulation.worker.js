import {makeGame} from './physics.js';
import {RaceSession} from './session.js';
const session=new RaceSession(makeGame());let last=performance.now(),sendAt=0;
self.onmessage=({data:d})=>{if(d.type==='start'){session.start(d.roster,d.mapId);last=performance.now();sendAt=0;self.postMessage({type:'state',state:session.snapshot()});}if(d.type==='input')session.input(d.id,d.input);if(d.type==='remove')session.removePlayer(d.id);if(d.type==='stop')session.phase='lobby';};
setInterval(()=>{const now=performance.now(),dt=(now-last)/1000;last=now;if(session.phase!=='race')return;session.advance(dt);sendAt+=dt;if(sendAt>=.05||session.phase==='results'){sendAt=0;self.postMessage({type:session.phase==='results'?'results':'state',state:session.snapshot()});}},1000/60);
