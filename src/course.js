import {featuresFor} from './feature-config.js';
export const MAPS=[
 {id:'classic',name:'Bulut Parkuru',difficulty:'Normal',theme:'Renkli kaos',description:'Tokmaklar, su kaydırağı ve sürpriz kapılar.',accent:'#adf04d',finish:430,checkpoints:[4,72,142,208,282,352,426],seesaws:[78,344],gaps:[[332,337],[360,365]],dynamic:[[72,84],[340,348]]},
 {id:'medium',name:'Dalga Dengesi',difficulty:'Orta',theme:'Su ve denge',description:'Dönen denge diskleri, çöken karolar ve top yağmuru.',accent:'#38d9e5',finish:390,checkpoints:[4,26,52,80,108,168,232,280,326,386],seesaws:[64,182],gaps:[[312,316]],dynamic:[[28,52],[56,72],[112,136],[174,190],[240,264]]},
 {id:'hard',name:'Neon Zirve',difficulty:'Zor',theme:'Yüksek irtifa',description:'Ritim kapıları, dar kirişler, buz ve sert yumruklar.',accent:'#e871ff',finish:390,checkpoints:[4,68,108,152,168,192,228,256,292,328,386],seesaws:[84,268],gaps:[[348,356]],dynamic:[[76,92],[116,148],[260,276],[300,324]]}
];
const smooth=t=>t*t*(3-2*t);
const classicNodes=[[-12,0],[26,0],[62,13],[108,-12],[152,-22],[194,7],[230,20],[276,-6],[316,-20],[358,4],[398,18],[446,0]];
const mediumNodes=[[-12,0],[26,0],[72,13],[132,-14],[194,15],[252,-12],[318,12],[406,0]];
const hardNodes=[[-12,0],[26,0],[66,-14],[108,14],[152,-17],[198,18],[240,-15],[286,16],[334,-18],[406,0]];
export function getCourse(id='classic'){
 const info=MAPS.find(m=>m.id===id)||MAPS[0],features=featuresFor(info.id),nodes=info.id==='classic'?classicNodes:info.id==='medium'?mediumNodes:hardNodes;
 function route(s){let i=0;while(i<nodes.length-2&&s>nodes[i+1][0])i++;const[a,x1]=nodes[i],[b,x2]=nodes[i+1],t=Math.max(0,Math.min(1,(s-a)/(b-a))),x=x1+(x2-x1)*smooth(t),dx=(x2-x1)*6*t*(1-t)/(b-a),yaw=Math.atan2(dx,1);let y=0,kind='track',width=s<27?16:13;
  if(info.id==='classic'){if(s>=178&&s<208)y=5*smooth((s-178)/30);else if(s>=208&&s<232)y=5;else if(s>=232&&s<282){y=5-5.8*(s-232)/50;kind='slide';}else if(s>=282&&s<314){y=-.8;kind='water';}else if(s>=314&&s<326)y=-.8+.8*smooth((s-314)/12);if(kind==='slide')width=11;if(kind==='water')width=17;}
  if(info.id==='medium'){width=s<27?16:8;y=s<30?0:1.4*Math.sin((s-30)/42);if(s>=30&&s<52)width=3.8;if(s>=286&&s<314)width=3;if(s>=330&&s<362){kind='water';y=-.8;width=12;}else if(s>=318&&s<330)y=(1-(s-318)/12)*1.4*Math.sin((318-30)/42)-.8*(s-318)/12;else if(s>=362&&s<374)y=-.8+(s-362)/12*(.8+1.4*Math.sin((374-30)/42));}
  if(info.id==='hard'){width=s<27?16:6.8;y=Math.max(0,s-26)*.055;if(s>=32&&s<60||s>=332&&s<358)width=2.6;}
  if(features){const[a,b,h]=features.ramp;if(s>=a&&s<b)y+=h*smooth((s-a)/(b-a));if(s>=b&&s<b+8)y+=h*(1-smooth((s-b)/8));if(s>=features.ice[0]&&s<features.ice[1])kind='ice';}
  width*=1.25;
  return{x,y,z:s,yaw,width,kind};
 }
 function at(s,lateral=0,height=0){const p=route(s);return{x:p.x+Math.cos(p.yaw)*lateral,y:p.y+height,z:p.z-Math.sin(p.yaw)*lateral,yaw:p.yaw};}
 function lateralDistance(x,z){const p=route(z);return(x-p.x)*Math.cos(p.yaw);}
 function hasGap(s){return info.gaps.some(([a,b])=>s>=a&&s<b);}
 function floorEnabled(s){return !(features&&s>=features.fall[0]&&s<features.fall[1])&&!hasGap(s)&&!info.dynamic.some(([a,b])=>s>=a&&s<b);}
 function stageColor(s){if(route(s).kind==='ice')return '#a9edff';const palettes=info.id==='classic'?['#8e50ef','#13c9d6','#ffb135','#f258b0','#19c9ec','#20c9bf','#9c6cf3','#aadf32']:info.id==='medium'?['#36b7cd','#39cbb9','#4f87df','#7c70da','#39bfdf','#40c6ad','#409bd4']:['#433e98','#7746bc','#2b8eb3','#c5439b','#5646aa','#2e9cb0','#b046b3'];return palettes[Math.min(palettes.length-1,Math.floor(Math.max(0,s)/58))];}
 return{...info,features,route,at,lateralDistance,hasGap,floorEnabled,stageColor};
}
const classic=getCourse();export const FINISH=classic.finish,checkpoints=classic.checkpoints,route=classic.route,at=classic.at,lateralDistance=classic.lateralDistance,hasGap=classic.hasGap,stageColor=classic.stageColor;
export function waterWave(x,z,t){return Math.sin(z*.45-t*2)*.055+Math.cos(x*.8+t*1.3)*.035;}
