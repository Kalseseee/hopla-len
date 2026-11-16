export class SampleAudio{
 constructor(urls,{context,fetcher=fetch}={}){this.context=context||new(globalThis.AudioContext||globalThis.webkitAudioContext)();this.buffers=new Map();this.voices=[];this.muted=false;this.failed=[];this.ready=Promise.all(Object.entries(urls).map(async([key,url])=>{try{const response=await fetcher(url);if(!response.ok)throw Error('HTTP '+response.status);const bytes=await response.arrayBuffer();this.buffers.set(key,await this.context.decodeAudioData(bytes));}catch(error){this.failed.push(key);console.warn('Ses yüklenemedi:',key,error.message);}}));}
 unlock(){if(this.context.state==='suspended')this.context.resume().catch(()=>{});}
 setMuted(muted){this.muted=muted;if(muted){for(const source of this.voices){try{source.stop();}catch{}}this.voices=[];}}
 play(key,volume=.7){if(this.muted)return;const buffer=this.buffers.get(key);if(!buffer){const requested=performance.now();this.ready.then(()=>{if(this.buffers.has(key)&&performance.now()-requested<1200)this.play(key,volume);});return;}if(this.context.state!=='running')return;
  while(this.voices.length>=6){try{this.voices.shift().stop();}catch{}}
  const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;gain.gain.value=Math.max(0,Math.min(1,volume));source.connect(gain).connect(this.context.destination);source.onended=()=>{this.voices=this.voices.filter(s=>s!==source);source.disconnect();gain.disconnect();};this.voices.push(source);source.start();
 }
}
