export class RaceAudioCues{
 constructor(play){this.play=play;this.reset();}
 reset(){this.lastT=-1;this.started=false;this.firstFinished=false;}
 consume(state,ownId){if(!state||!['race','results'].includes(state.phase))return;if(state.t<this.lastT)this.reset();if(state.t===this.lastT)return;this.lastT=state.t;
  if(!this.started&&state.t>=3){this.started=true;this.play('round',.8);}
  for(const e of state.events||[]){const volume=e.id===ownId?.7:.4;if(e.kind==='jump')this.play('jump',volume);else if(e.kind==='slide'||e.kind==='dive')this.play('shift',volume);}
  if(!this.firstFinished&&(state.participants||state.players||[]).some(p=>p.finished>0)){this.firstFinished=true;this.play('round',.9);}
 }
}
