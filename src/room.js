import {COSTUMES,uniqueColor} from './physics.js';
import {getCourse} from './course.js';
export class RoomLobby{
 constructor(){this.roster=[];this.mapId='classic';}
 join(id,profile={}){if(this.roster.some(p=>p.id===id)||this.roster.length>=4)return false;const slot=[0,1,2,3].find(s=>!this.roster.some(p=>p.slot===s));this.roster.push({id,slot,name:String(profile.name||'Gezgin').slice(0,16),costume:Math.abs(Number.isInteger(profile.costume)?profile.costume:0)%COSTUMES.length,color:uniqueColor(profile.color,new Set(this.roster.map(p=>p.color)))});return true;}
 update(id,profile={}){const p=this.roster.find(p=>p.id===id);if(!p)return false;p.name=String(profile.name||p.name).slice(0,16);p.costume=Math.abs(Number.isInteger(profile.costume)?profile.costume:p.costume)%COSTUMES.length;p.color=uniqueColor(Number.isInteger(profile.color)?profile.color:p.color,new Set(this.roster.filter(q=>q!==p).map(q=>q.color)));return true;}
 remove(id){this.roster=this.roster.filter(p=>p.id!==id);}
 setMap(id){this.mapId=getCourse(id).id;}
 clear(){this.roster=[];}
 snapshot(){return{mapId:this.mapId,roster:this.roster.map(p=>({...p}))};}
}
