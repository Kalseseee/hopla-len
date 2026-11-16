import './style.css';
import './v7.css';
import Peer from 'peerjs';
import {SampleAudio} from './sample-audio.js';
import {RaceAudioCues} from './audio-cues.js';
import jumpSample from './assets/audio/jump.js';
import shiftSample from './assets/audio/shift.js';
import roundSample from './assets/audio/round.js';
const samples=new SampleAudio({jump:jumpSample,shift:shiftSample,round:roundSample});
const raceCues=new RaceAudioCues((key,volume)=>samples.play(key,volume));
for(const event of ['pointerdown','keydown'])window.addEventListener(event,()=>samples.unlock(),{capture:true});
import {RoomLobby} from './room.js';
import {makeGame,COLORS,COSTUMES,checkpoints} from './physics.js';
import {MAPS,getCourse} from './course.js';
import {INPUT_KEYS,PROTOCOL,sanitizeInput} from './session.js';
import {createVisuals} from './visuals.js';

const $=id=>document.getElementById(id),show=(id,on)=>$(id).classList.toggle('hidden',!on);
let selectedMapId='classic',preview=makeGame(),view=createVisuals($('scene'),preview.objects,preview.course);
function applyMap(id){id=getCourse(id).id;if(id===selectedMapId)return;selectedMapId=id;view.dispose();preview=makeGame(id);view=createVisuals($('scene'),preview.objects,preview.course);view.selectCostume(costume,color);view.mode(mode);rebuildPreview();}
function rebuildPreview(){for(const id of [...preview.players.keys()])preview.removePlayer(id);for(const p of roster)preview.addPlayer(p.id,p.name,p.color,p.costume);}
const simulation=new Worker(new URL('./simulation.worker.js',import.meta.url),{type:'module'});
let color=Number(localStorage.getItem('skyhop-color')||0)%COLORS.length,costume=Number(localStorage.getItem('hopla-costume')||0)%COSTUMES.length,mode='menu',solo=false,isHost=false,peer=null,hostConn=null,ownId='',room='',snap=null,snapAt=0,muted=false,audio=null,lastBeat='',toastUntil=0,connectGeneration=0;
const peers=new Map(),roomModel=new RoomLobby();let roster=[],characterChosen=true;
const input=Object.fromEntries(INPUT_KEYS.map(k=>[k,false]));
const binds={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',ShiftLeft:'slide',ShiftRight:'slide',KeyE:'dash',KeyR:'reset'};
$('name').value=localStorage.getItem('skyhop-name')||'Bulut Gezgin';
function playerName(){const n=$('name').value.trim()||'Bulut Gezgin';localStorage.setItem('skyhop-name',n);return n;}
function tone(kind){if(muted)return;try{audio??=new AudioContext();audio.resume();const patterns={dive:[600,150,.22],crack:[330,120,.13],collapse:[160,55,.3],spring:[220,1200,.42],speed:[330,880,.24],punch:[110,60,.18],stomp:[170,80,.18],stomped:[140,70,.2],splash:[160,550,.32],jump:[430,780,.13],dash:[180,800,.2],slide:[500,110,.28],break:[120,60,.2],solid:[80,60,.12],yeet:[120,980,.5],bump:[120,420,.18],fall:[260,70,.4],checkpoint:[660,1100,.26],boing:[230,1100,.3],finish:[520,1040,.7],tick:[700,700,.08],go:[440,1200,.3]};const [a,b,d]=patterns[kind]||patterns.tick;const o=audio.createOscillator(),g=audio.createGain();o.type=kind==='slide'?'triangle':'sine';o.frequency.setValueAtTime(a,audio.currentTime);o.frequency.exponentialRampToValueAtTime(b,audio.currentTime+d);g.gain.setValueAtTime(.001,audio.currentTime);g.gain.exponentialRampToValueAtTime(.12,audio.currentTime+.012);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d+.02);}catch{}}
COLORS.forEach((c,i)=>{const b=document.createElement('button');b.style.background=c;b.setAttribute('aria-label',['Mavi','Pembe','Mor','Kırmızı','Yeşil','Sarı'][i]);b.onclick=()=>{color=i;localStorage.setItem('skyhop-color',i);paintColors();view.selectCostume(costume,color);};$('colors').append(b);});
function chooseCharacter(i){costume=i;color=i%COLORS.length;characterChosen=true;localStorage.setItem('hopla-costume',costume);localStorage.setItem('skyhop-color',color);$('costume').value=String(i);paintColors();view.selectCostume(costume,color);document.querySelectorAll('[data-costume]').forEach(b=>b.classList.toggle('chosen',Number(b.dataset.costume)===i));$('create').disabled=$('join').disabled=$('solo').disabled=false;$('status').textContent=COSTUMES[i]+' seçildi. Hazırsın!';}
const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Karakterini seç…';placeholder.disabled=true;placeholder.selected=true;$('costume').append(placeholder);
for(const [i,name]of COSTUMES.entries()){const o=document.createElement('option');o.value=i;o.textContent=name;$('costume').append(o);const b=document.createElement('button');b.type='button';b.dataset.costume=i;b.setAttribute('aria-label',name+' karakterini seç');b.innerHTML='<b>'+['⛑','🐺','😎','🦸','🦖','🐤'][i]+'</b><span>'+name+'</span>';b.style.setProperty('--skin',COLORS[i]);b.onclick=()=>chooseCharacter(i);$('characterGrid').append(b);}$('costume').value=String(costume);$('costume').onchange=()=>chooseCharacter(Number($('costume').value));view.selectCostume(costume,color);$('create').disabled=$('join').disabled=$('solo').disabled=false;$('status').textContent='Hazırsın! İstersen karakterini değiştir.';
function selectionReady(){return true;}
function paintColors(){[...$('colors').children].forEach((b,i)=>b.classList.toggle('selected',i===color));}paintColors();
$('sound').onclick=()=>{muted=!muted;samples.setMuted(muted);$('sound').textContent=muted?'×':'♫';if(!muted)tone('tick');};$('quality').onclick=()=>{$('quality').textContent=view.quality()?'HD':'ECO';};
function toast(s){$('toast').textContent=s;toastUntil=performance.now()+2800;}
function escaped(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function send(c,data){if(c?.open){try{c.send(data);}catch{}}}
function broadcast(d){for(const c of peers.values())send(c,d);}
function sendInput(){if(mode!=='race')return;const state=sanitizeInput({...input,yaw:view.inputYaw()});if(isHost)simulation.postMessage({type:'input',id:ownId,input:state});else send(hostConn,{type:'input',input:state});}
function clearInput(){for(const key of INPUT_KEYS)input[key]=false;sendInput();}
// Inputs go directly to the host simulation, independently of drawing frames.
window.addEventListener('keydown',e=>{if(mode!=='race'||!binds[e.code])return;e.preventDefault();input[binds[e.code]]=true;sendInput();},true);
window.addEventListener('keyup',e=>{if(!binds[e.code])return;input[binds[e.code]]=false;sendInput();},true);
window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput();});
setInterval(sendInput,50);
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);input[binds[b.dataset.key]]=true;sendInput();});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{input[binds[b.dataset.key]]=false;sendInput();});});
function setMode(next){if(mode!==next)clearInput();mode=next;for(const section of ['menu','lobby','hud','results'])show(section,section===(next==='race'?'hud':next));show('footer',next==='menu');document.body.classList.toggle('playing',next==='race'||next==='results');document.body.classList.toggle('showing-results',next==='results');show('quit',next!=='menu');if(next==='race'||next==='menu'){show('roomSetup',false);show('profileSetup',false);}view.mode(next);if(next==='race'){$('scene').tabIndex=0;document.activeElement?.blur();$('scene').focus({preventScroll:true});}}
function receiveState(state){if(!state||state.protocol!==PROTOCOL)return;applyMap(state.mapId);snap=state;snapAt=performance.now();if(state.phase==='race'&&mode!=='race')setMode('race');view.sync(state,ownId);raceCues.consume(state,ownId);
 for(const e of state.events||[]){if(e.id!==ownId)continue;if(!['jump','slide','dive','finish'].includes(e.kind))tone(e.kind);const p=state.players.find(p=>p.id===ownId);if(p&&['checkpoint','finish','boing','splash','break'].includes(e.kind))view.burst(p.pos,e.kind==='splash'?'#b8f7ff':COLORS[p.color]);if(e.kind==='splash'&&p)view.splash(p.pos);if(e.kind==='checkpoint'&&p)toast('Checkpoint '+p.cp+' kaydedildi');if(e.kind==='solid')toast('Sağlam kapı! Diğerini dene.');if(e.kind==='yeet')toast('TOKMAK!');if(e.kind==='fall')toast('Tekrar hopla!');}
 if(state.phase==='results'&&mode!=='results')resultsUI();
}
simulation.onmessage=({data:d})=>{if(!isHost||mode!=='race')return;receiveState(d.state);broadcast({type:d.type,state:d.state});};
simulation.onerror=()=>{toast('Fizik işlemi durdu. Lobiye dönüp yarışı tekrar başlat.');};
function rosterUI(){
 $('changeMap').disabled=!isHost;$('copy').classList.toggle('hidden',solo);
 $('lobbyMap').textContent=preview.course.name+' · '+preview.course.difficulty;
 $('players').innerHTML=roster.map((p,i)=>`<div class="playerrow"><i style="background:${COLORS[p.color]}"></i><strong>${escaped(p.name)}</strong><span>${p.id===ownId?'SEN':i===0?'ODA SAHİBİ':'HAZIR'} / ${i+1}</span></div>`).join('');
 $('start').disabled=!isHost;$('start').firstChild.textContent=isHost?'YARIŞI BAŞLAT ':'ODA SAHİBİ BEKLENİYOR ';$('copy').firstChild.textContent=room+' ';$('roomLabel').textContent=solo?'ANTRENMAN':room;
}
function lobbyState(){roomModel.setMap(selectedMapId);roster=roomModel.snapshot().roster;rebuildPreview();broadcast({type:'lobby',roster,room,mapId:selectedMapId,protocol:PROTOCOL});rosterUI();}
function cleanup(){connectGeneration++;simulation.postMessage({type:'stop'});const oldPeer=peer,oldHost=hostConn,connections=[...peers.values()];peer=hostConn=null;peers.clear();connections.forEach(c=>c.close());oldHost?.close();oldPeer?.destroy();for(const id of [...preview.players.keys()])preview.removePlayer(id);roster=[];roomModel.clear();snap=null;view.clear();}
function menuError(msg){$('status').textContent=msg;$('create').disabled=$('join').disabled=false;}
function errorText(e){if(e?.type==='peer-unavailable')return 'Oda bulunamadı. İkiniz de güncel V9 sürümünü açıp kodu kontrol edin.';if(e?.type==='unavailable-id')return 'Bu kod kullanımda. Tekrar oda oluştur.';return 'Bağlantı kurulamadı. İnternetini veya farklı bir ağı kontrol et.';}
async function openPeer(id){return new Promise((resolve,reject)=>{let opened=false;const p=id?new Peer(id,{debug:0}):new Peer({debug:0});peer=p;const timer=setTimeout(()=>{p.destroy();reject(new Error('Bağlantı zaman aşımına uğradı. Tekrar dene.'));},15000);p.once('open',()=>{opened=true;clearTimeout(timer);resolve(p);});p.on('error',e=>{clearTimeout(timer);if(!opened)reject(new Error(errorText(e)));else if(mode==='menu')menuError(errorText(e));else toast(errorText(e));});});}
async function createRoom(){if(!selectionReady())return;tone('tick');cleanup();solo=false;isHost=true;const generation=connectGeneration;const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';room=Array.from(crypto.getRandomValues(new Uint8Array(6)),v=>alphabet[v%alphabet.length]).join('');$('status').textContent='Oda hazırlanıyor…';$('create').disabled=$('join').disabled=true;
 try{const p=await openPeer('hopla-v9-'+room);if(generation!==connectGeneration)return;ownId=p.id;roomModel.join(ownId,{name:playerName(),color,costume});
  p.on('connection',c=>{c.on('data',d=>{if(!d||typeof d!=='object')return;
   if(d.type==='hello'){
    if(peers.has(c.peer))return;
    if(d.protocol!==PROTOCOL||mode!=='lobby'||roomModel.roster.length>=4){send(c,{type:'reject',message:d.protocol!==PROTOCOL?'İkiniz de V9 sürümünü açın.':mode!=='lobby'?'Yarış başladı. Yeni turda lobiye katılabilirsin.':'Oda dolu (4/4).'});setTimeout(()=>c.close(),300);return;}
    peers.set(c.peer,c);roomModel.join(c.peer,d);send(c,{type:'welcome',selfId:c.peer,protocol:PROTOCOL});lobbyState();
   }else if(d.type==='profile'&&peers.get(c.peer)===c&&mode==='lobby'){roomModel.update(c.peer,d.profile);lobbyState();}
   else if(d.type==='lobby-request'&&peers.get(c.peer)===c){enterLobby();}
   else if(d.type==='rematch'&&peers.get(c.peer)===c&&mode==='results'){startRace();}
   else if(d.type==='input'&&peers.get(c.peer)===c&&mode==='race')simulation.postMessage({type:'input',id:c.peer,input:sanitizeInput(d.input)});
  });c.on('close',()=>{if(peers.get(c.peer)!==c)return;peers.delete(c.peer);roomModel.remove(c.peer);preview.removePlayer(c.peer);simulation.postMessage({type:'remove',id:c.peer});if(mode==='lobby')lobbyState();else toast('Bir oyuncu ayrıldı.');});c.on('error',()=>c.close());});
  setMode('lobby');lobbyState();$('status').textContent='';
 }catch(e){cleanup();setMode('menu');menuError(e.message);}finally{$('create').disabled=$('join').disabled=false;}}
async function joinRoom(){if(!selectionReady())return;tone('tick');const code=$('code').value.trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))return menuError('6 haneli oda kodunu yaz.');cleanup();solo=isHost=false;room=code;const generation=connectGeneration;$('status').textContent='Arkadaşının odasına bağlanılıyor…';$('create').disabled=$('join').disabled=true;
 try{const p=await openPeer();if(generation!==connectGeneration)return;ownId=p.id;const c=p.connect('hopla-v9-'+room,{reliable:true});hostConn=c;let joined=false;const timeout=setTimeout(()=>{if(!joined&&generation===connectGeneration){cleanup();setMode('menu');menuError('Odaya ulaşılamadı. İkiniz de V9 sürümünü açın; gerekirse farklı ağla deneyin.');}},15000);
  c.on('open',()=>send(c,{type:'hello',protocol:PROTOCOL,name:playerName(),color,costume}));c.on('data',d=>{if(generation!==connectGeneration||!d||typeof d!=='object')return;
   if(d.type==='reject'){clearTimeout(timeout);cleanup();setMode('menu');menuError(d.message);return;}
   if(d.type==='welcome'){ownId=d.selfId;joined=true;clearTimeout(timeout);}
   if(d.type==='lobby'){joined=true;clearTimeout(timeout);roster=d.roster;applyMap(d.mapId);rebuildPreview();view.clear();setMode('lobby');rosterUI();$('status').textContent='';}
   if(d.type==='start'){applyMap(d.mapId);lastBeat='';raceCues.reset();setMode('race');sendInput();}
   if(d.type==='state'||d.type==='results')receiveState(d.state);
  });c.on('close',()=>{clearTimeout(timeout);if(hostConn!==c)return;cleanup();setMode('menu');menuError('Oda sahibi ayrıldı. Yeni bir oda açabilirsiniz.');});c.on('error',()=>{clearTimeout(timeout);if(hostConn===c){cleanup();setMode('menu');menuError('Oda bağlantısı kurulamadı.');}});
 }catch(e){cleanup();setMode('menu');menuError(e.message);}finally{$('create').disabled=$('join').disabled=false;}}
function startRace(){if(!isHost)return;lastBeat='';raceCues.reset();snap=null;setMode('race');broadcast({type:'start',mapId:selectedMapId,protocol:PROTOCOL});simulation.postMessage({type:'start',roster,mapId:selectedMapId});sendInput();}
function leave(){setMode('menu');cleanup();$('status').textContent='';$('lobbyStatus').textContent='';}
function enterLobby(){if(!isHost)return;simulation.postMessage({type:'stop'});snap=null;view.clear();setMode('lobby');lobbyState();}
function backToLobby(){if(isHost)enterLobby();else send(hostConn,{type:'lobby-request'});}
$('create').onclick=()=>openSetup('room');$('join').onclick=joinRoom;$('code').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom();});
function launchSolo(){if(!selectionReady())return;tone('tick');cleanup();solo=isHost=true;ownId='solo';room='';roomModel.join(ownId,{name:playerName(),color,costume});roster=roomModel.snapshot().roster;$('roomLabel').textContent='ANTRENMAN';startRace();}
$('solo').onclick=()=>openSetup('solo');
$('start').onclick=startRace;$('again').onclick=()=>isHost?startRace():send(hostConn,{type:'rematch'});$('leave').onclick=leave;$('back').onclick=backToLobby;$('exit').onclick=backToLobby;$('quit').onclick=leave;$('changeMap').onclick=()=>openSetup('edit');document.querySelector('.brand').onclick=e=>{e.preventDefault();if(peer||solo)backToLobby();else setMode('menu');};
$('map').onclick=()=>{clearInput();$('map').setAttribute('aria-pressed',String(view.toggleMap()));};
$('copy').onclick=async()=>{try{const url=new URL(location.href);url.searchParams.set('room',room);await navigator.clipboard.writeText(url.href);$('copy').querySelector('small').textContent='DAVET BAĞLANTISI KOPYALANDI ✓';}catch{$('lobbyStatus').textContent='Oda kodun: '+room;}};
function time(t){return Math.floor(Math.max(0,t)/60).toString().padStart(2,'0')+':'+Math.floor(Math.max(0,t)%60).toString().padStart(2,'0');}
function resultsUI(){setMode('results');const list=[...(snap.participants||snap.players)].sort((a,b)=>(a.finished||1e5)-(b.finished||1e5)||b.cp-a.cp||b.pos[2]-a.pos[2]);view.showResults(list);$('podium').innerHTML=list.map((p,i)=>`<div class="playerrow"><b>${i+1}.</b><i style="background:${COLORS[p.color]}"></i><strong>${escaped(p.name)}</strong><span>${p.finished?time(p.finished-3):'TAMAMLAMADI'} · ${p.falls} DÜŞÜŞ</span></div>`).join('');$('again').disabled=$('back').disabled=false;$('back').textContent='LOBİYE DÖN';$('resultNote').textContent='Aynı oda, aynı ekip. Karakter ve parkur lobide değişir.';}
let hudAt=0;function updateHUD(now){if(!snap)return;const count=snap.t<3?String(Math.ceil(3-snap.t)):snap.t<3.7?'HOPLA!':'';if(count&&count!==lastBeat){if(count!=='HOPLA!')tone('tick');lastBeat=count;}$('countdown').textContent=count;if(now-hudAt<100)return;hudAt=now;$('timer').textContent=time((snap.players.find(p=>p.id===ownId)?.finished||snap.t)-3);const me=snap.players.find(p=>p.id===ownId);const sorted=[...snap.players].sort((a,b)=>(a.finished||1e5)-(b.finished||1e5)||b.cp-a.cp||b.pos[2]-a.pos[2]);$('checkpoint').textContent=me?.finished?'BİTTİ!':(sorted.findIndex(p=>p.id===ownId)+1)+' / '+snap.players.length;$('progressFill').style.width=Math.max(0,Math.min(100,(me?.pos[2]||0)/preview.course.finish*100))+'%';if(me?.finished)$('countdown').textContent='';$('ability').textContent='';if(me?.finished)$('toast').textContent='Bitirdin! '+snap.waitingFor+' oyuncu bekleniyor';$('ranks').textContent='';document.body.classList.toggle('race-started',snap.t>9);if(now>toastUntil&&!me?.finished)$('toast').textContent='';if(now-snapAt>2500)toast('Bağlantı bekleniyor…');}
let last=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.06);last=now;if(mode==='menu'||mode==='lobby')preview.step(dt,false);if(mode==='race')updateHUD(now);view.tick(dt,now,preview.objects);}requestAnimationFrame(frame);
addEventListener('resize',()=>view.resize());
const invite=new URL(location.href).searchParams.get('room');if(invite){$('code').value=invite.toUpperCase().slice(0,6);$('status').textContent='Davetin hazır! İsmini yazıp odaya katıl.';}

let setupAction='room',draftMapId=selectedMapId;
function openSetup(action){if(!selectionReady())return;setupAction=action;draftMapId=selectedMapId;$('confirmSetup').textContent=action==='edit'?'PARKURU KAYDET →':'DEVAM ET →';show('roomSetup',true);paintMaps();}
function paintMaps(){document.querySelectorAll('[data-map]').forEach(b=>{b.classList.toggle('chosen',b.dataset.map===draftMapId);b.setAttribute('aria-pressed',String(b.dataset.map===draftMapId));});}
for(const m of MAPS){const b=document.createElement('button');b.type='button';b.dataset.map=m.id;b.style.setProperty('--accent',m.accent);const points=[];for(let z=0;z<=m.finish;z+=4){const r=getCourse(m.id).route(z);points.push((75+r.x*2)+','+(92-z/m.finish*82));}b.innerHTML='<div class="map-art"><svg viewBox="0 0 150 100" aria-hidden="true"><path d="M'+points.join(' L')+'"/></svg><span>'+m.difficulty+'</span></div><strong>'+m.name+'</strong><small>'+m.theme+' · ~1 dk</small><p>'+m.description+'</p>';b.onclick=()=>{draftMapId=m.id;paintMaps();};$('mapChoices').append(b);}
$('cancelSetup').onclick=()=>show('roomSetup',false);$('confirmSetup').onclick=()=>{show('roomSetup',false);applyMap(draftMapId);if(setupAction==='edit')lobbyState();else setupAction==='solo'?launchSolo():createRoom();};

let profileCostume=costume;
function openProfile(){if(mode!=='lobby')return;profileCostume=costume;$('profileName').value=roster.find(p=>p.id===ownId)?.name||playerName();show('profileSetup',true);paintProfile();}
function paintProfile(){document.querySelectorAll('[data-profile]').forEach(b=>b.classList.toggle('chosen',Number(b.dataset.profile)===profileCostume));}
for(const [i,name]of COSTUMES.entries()){const b=document.createElement('button');b.type='button';b.dataset.profile=i;b.style.setProperty('--skin',COLORS[i]);b.innerHTML='<b>'+['⛑','🐺','😎','🦸','🦖','🐤'][i]+'</b><strong>'+name+'</strong>';b.onclick=()=>{profileCostume=i;paintProfile();};$('profileChoices').append(b);}
$('changeCharacter').onclick=openProfile;$('cancelProfile').onclick=()=>show('profileSetup',false);$('saveProfile').onclick=()=>{chooseCharacter(profileCostume);$('name').value=$('profileName').value.trim().slice(0,16)||playerName();const profile={name:playerName(),color,costume};if(isHost){roomModel.update(ownId,profile);lobbyState();}else send(hostConn,{type:'profile',profile});show('profileSetup',false);};
chooseCharacter(costume);
