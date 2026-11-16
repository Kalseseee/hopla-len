import {makeGame} from './physics.js';
import {getCourse} from './course.js';
export const PROTOCOL=9;
export const INPUT_KEYS=['up','down','left','right','jump','slide','dash','reset'];
export function sanitizeInput(input){return {...Object.fromEntries(INPUT_KEYS.map(k=>[k,input?.[k]===true])),yaw:Number.isFinite(input?.yaw)?Math.atan2(Math.sin(input.yaw),Math.cos(input.yaw)):0};}
export function applyRemoteInput(game,id,input){const p=game.players.get(id);if(!p)return false;p.input=sanitizeInput(input);return true;}
// Shared by the Worker and regression tests; simulation never depends on requestAnimationFrame.
export class RaceSession{
 constructor(game){this.game=game;this.phase='lobby';this.accumulator=0;this.departed=[];}
 start(roster,mapId=this.game.mapId){const id=getCourse(mapId).id;if(this.game.mapId!==id)this.game=makeGame(id);for(const id of [...this.game.players.keys()])this.game.removePlayer(id);for(const p of roster)this.game.addPlayer(p.id,p.name,p.color,p.costume);this.game.reset();this.phase='race';this.accumulator=0;this.departed=[];}
 removePlayer(id){const p=this.game.snapshot(false).players.find(p=>p.id===id);if(p)this.departed.push({...p,disconnected:true});this.game.removePlayer(id);}
 input(id,input){return applyRemoteInput(this.game,id,input);}
 advance(seconds){if(this.phase!=='race')return;this.accumulator+=Math.min(seconds,2);while(this.accumulator>=1/60){this.game.step(1/60,this.game.time>=3);this.accumulator-=1/60;}
 const list=[...this.game.players.values()];if(list.length&&list.every(p=>p.finished))this.phase='results';}
 snapshot(){const s=this.game.snapshot();return {...s,participants:[...s.players,...this.departed],waitingFor:s.players.filter(p=>!p.finished).length,phase:this.phase,protocol:PROTOCOL};}
}
