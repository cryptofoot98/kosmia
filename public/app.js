(function(){
'use strict';
const A = window.Astronomy, K = window.KosmiaSky, N = window.KosmiaNumbers;
const C = window.KosmiaCloud||{enabled:false,user:null,onAuth(){},onError(){},init:async()=>null};
const $ = (s,r=document)=>r.querySelector(s);
const esc = s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* crafted art from scripts/craft-images.mjs; falls back to the SVG symbols when absent */
const ART=window.KOSMIA_ART||{};
const pic=(kind,id,cls='art')=>(ART[kind]||[]).includes(id)?Kit.img(kind+'/'+id,{cls}):'';
const DEVICE_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const DAY=864e5;
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));

/* ---------- data ---------- */
const SIGNS=[
 ['aries','Aries','♈︎','Fire','Cardinal','Mars','21 Mar – 19 Apr'],['taurus','Taurus','♉︎','Earth','Fixed','Venus','20 Apr – 20 May'],
 ['gemini','Gemini','♊︎','Air','Mutable','Mercury','21 May – 20 Jun'],['cancer','Cancer','♋︎','Water','Cardinal','Moon','21 Jun – 22 Jul'],
 ['leo','Leo','♌︎','Fire','Fixed','Sun','23 Jul – 22 Aug'],['virgo','Virgo','♍︎','Earth','Mutable','Mercury','23 Aug – 22 Sep'],
 ['libra','Libra','♎︎','Air','Cardinal','Venus','23 Sep – 22 Oct'],['scorpio','Scorpio','♏︎','Water','Fixed','Pluto','23 Oct – 21 Nov'],
 ['sagittarius','Sagittarius','♐︎','Fire','Mutable','Jupiter','22 Nov – 21 Dec'],['capricorn','Capricorn','♑︎','Earth','Cardinal','Saturn','22 Dec – 19 Jan'],
 ['aquarius','Aquarius','♒︎','Air','Fixed','Uranus','20 Jan – 18 Feb'],['pisces','Pisces','♓︎','Water','Mutable','Neptune','19 Feb – 20 Mar']
].map(a=>({id:a[0],name:a[1],g:a[2],el:a[3],mod:a[4],ruler:a[5],dates:a[6]}));
const sg=id=>SIGNS.find(s=>s.id===id)||SIGNS[0];
const sIdx=i=>SIGNS[((i%12)+12)%12];

/* the whispers (daily cards) live in whispers.js, shared with the server */
const ORACLE=(window.KOSMIA_WHISPERS||[]).map(a=>({id:a[0],title:a[1],sym:a[2],msg:a[3],ref:a[4],art:a[6]||a[0]}));   // art: the painting it shares
const oc=id=>ORACLE.find(c=>c.id===id);
const THOUGHTS=['You cannot command the stars, but you can choose how you navigate beneath them.','Even the night sky is mostly space. Leave room in your day.','What you pay attention to becomes the shape of your life.','Be curious about your feelings before you judge them.','Small, kind choices repeated are their own kind of constellation.','The present moment is the only place a new beginning can start.','You are allowed to grow quietly.'];

/* gold line-art symbols (original, drawn in code) */
function symbol(k){
 const s='fill="none" stroke="#8B6A3E" stroke-width="1.4" stroke-linecap="round"';
 let rays='';for(let i=0;i<16;i++){const a=i/16*Math.PI*2;rays+=`<line x1="${50+Math.cos(a)*26}" y1="${50+Math.sin(a)*26}" x2="${50+Math.cos(a)*42}" y2="${50+Math.sin(a)*42}" ${s}/>`}
 const m={
  moon:`<path d="M62 14A36 36 0 1 0 62 86A28 28 0 1 1 62 14Z" ${s}/><circle cx="76" cy="30" r="1.8" fill="#8B6A3E"/>`,
  sun:`<circle cx="50" cy="50" r="18" ${s}/>${rays}`,
  star:`<path d="M50 8L58 40L92 50L58 60L50 92L42 60L8 50L42 40Z" ${s}/>`,
  path:`<path d="M30 92C40 60 60 60 50 36C46 24 54 16 50 8" ${s}/><path d="M70 92C62 66 70 54 56 38" ${s}/><circle cx="50" cy="8" r="2" fill="#8B6A3E"/>`,
  key:`<circle cx="34" cy="34" r="16" ${s}/><path d="M46 46L84 84M70 70L78 62M78 78L86 70" ${s}/>`,
  flower:[0,72,144,216,288].map(r=>`<path d="M50 50C36 34 44 14 50 12C56 14 64 34 50 50" transform="rotate(${r} 50 50)" ${s}/>`).join('')+`<circle cx="50" cy="50" r="4" ${s}/><path d="M50 56L50 94" ${s}/>`,
  eye:`<path d="M8 50C28 20 72 20 92 50C72 80 28 80 8 50Z" ${s}/><circle cx="50" cy="50" r="12" ${s}/><circle cx="50" cy="50" r="4" fill="#8B6A3E"/>`,
  ship:`<path d="M18 66L82 66L72 82L28 82Z" ${s}/><path d="M50 66L50 14M50 20L78 58L50 58M50 26L26 58L50 58" ${s}/><path d="M10 90C24 84 34 94 48 88C62 82 72 94 90 88" ${s}/>`,
  tree:`<path d="M50 94L50 56M50 70L34 56M50 64L66 50" ${s}/><circle cx="50" cy="34" r="22" ${s}/><circle cx="32" cy="46" r="12" ${s}/><circle cx="68" cy="46" r="12" ${s}/>`,
  wheel:`<circle cx="50" cy="50" r="40" ${s}/><circle cx="50" cy="50" r="8" ${s}/>`+[0,45,90,135].map(r=>`<line x1="50" y1="10" x2="50" y2="90" transform="rotate(${r} 50 50)" ${s}/>`).join(''),
  lily:[-28,0,28].map(r=>`<path d="M50 60C40 40 46 18 50 10C54 18 60 40 50 60" transform="rotate(${r} 50 60)" ${s}/>`).join('')+`<path d="M50 60L50 94" ${s}/>`,
  crystal:`<path d="M50 8L72 30L72 70L50 92L28 70L28 30Z" ${s}/><path d="M28 30L72 30M50 8L50 92M28 70L72 70" ${s}/>`
 };
 return `<svg viewBox="0 0 100 100" aria-hidden="true">${m[k]||m.star}</svg>`;
}

/* ---------- storage ---------- */
const KEY='kosmia.v1';
const fresh=()=>({wfy:'',dreamAsk:'',intentAsk:'',released:'',email:'',sign:'',name:'',fullName:'',altName:'',birth:{date:'',time:'',unk:false,place:'',lat:'',lon:'',tz:''},birthConsent:false,
 revealed:{},days:{},saved:[],notes:{},matches:[],conns:[],readings:[],journal:[],bookmarks:[],
 notif:{on:false,time:'08:00',monthly:true,annual:true,events:false,sign2:'',whisper:false,quiet:false,quietFrom:'22:00',quietTo:'07:00'},
 settings:{tz:'',reduce:false,large:false,kPersonal:false,voiceOut:false,yMode:'auto'},intro:false,kcur:[],intent:{}});
let S=fresh();
try{const r=localStorage.getItem(KEY);if(r){const o=JSON.parse(r);S=Object.assign(fresh(),o);['birth','notif','settings'].forEach(k=>S[k]=Object.assign(fresh()[k],o[k]||{}))}}catch(e){}
// saved sign pairings from before Connections become zodiac connections
if(S.matches.length&&!S.conns.some(c=>c.kind==='zodiac')){S.matches.forEach(m=>S.conns.push({id:uuid(),kind:'zodiac',name:'',data:{a:m[0],b:m[1]},note:''}));}
S.readings.forEach(r=>{if(!r.id)r.id=r.rid||uuid()});
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
// a page opened inside a sheet over Today runs as its own small copy of the app, without the menu; when the sheet closes, Today reads back what it kept
const EMB=window.self!==window.top&&/[?&]emb=1/.test(location.search);if(EMB)document.documentElement.classList.add('emb');
function reloadS(){try{const r=localStorage.getItem(KEY);if(r){const o=JSON.parse(r);S=Object.assign(fresh(),o);['birth','notif','settings'].forEach(k=>S[k]=Object.assign(fresh()[k],o[k]||{}))}}catch(e){}}
function openSheet(sec,t,q){const u=pathFor(sec,t,q);V.xsrc=u+(u.includes('?')?'&':'?')+'emb=1';V.xopen=true;mountSheet()}
function mountSheet(){let x=document.getElementById('xsheet');if(!V.xopen){if(x)x.remove();return}
 if(x)return;x=document.createElement('div');x.id='xsheet';x.dataset.act='xclose';x.innerHTML=`<div class="xs-box" role="dialog" aria-modal="true" aria-label="Opened from Today"><iframe title="Opened from Today" src="${V.xsrc}"></iframe></div>`;document.body.append(x)}
function closeSheet(){if(!V.xopen)return;V.xopen=false;mountSheet();reloadS();if(V.xnext){V.hstep=V.xnext;V.xnext=null;V.hdir=1}render()}
addEventListener('message',e=>{if(e.origin===location.origin&&e.data==='kosmia-close')closeSheet()});
const TZ=()=>S.settings.tz||DEVICE_TZ;

/* ---------- cloud sync (Supabase) ---------- */
const syncProfile=()=>C.saveProfile&&C.saveProfile({sign:S.sign,name:S.name,intro:S.intro,notif:S.notif,fullName:S.fullName,altName:S.altName,birth:S.birth,birthConsent:S.birthConsent,settings:S.settings});
const syncFortune=k=>C.saveFortune&&C.saveFortune(k,cardFor(k).id,S.saved.some(x=>x.date===k),S.notes[k]||'');
// Items confirmed on the server carry sy:true. On the next pull, a confirmed item missing from the server was deleted
// on another device and is dropped here; an unconfirmed one is new on this device and is uploaded.
function mergeList(local,remote,toLocal,push){
 const ids=new Set(remote.map(r=>r.id)),out=remote.map(r=>Object.assign(toLocal(r),{sy:true}));
 local.forEach(l=>{if(ids.has(l.id))return;if(l.sy)return;out.push(l);push(l).then(()=>{l.sy=true;save()},()=>{})});
 return out;
}
async function pullMerge(){
 const u=C.user;if(!u)return;
 let R;try{R=await C.pull()}catch(e){return toast('Could not load your synced data')}
 S.email=u.email||S.email;
 const p=R.profile;
 if(p&&p.sign){S.welcomed=true;S.sign=p.sign;S.name=p.name||S.name;S.intro=S.intro||p.intro_seen;if(p.notif)S.notif=Object.assign(S.notif,p.notif);
  if(p.full_name!=null){S.fullName=p.full_name||S.fullName;S.altName=p.alt_name||S.altName;if(p.birth_consent&&p.birth){S.birth=Object.assign(S.birth,p.birth);S.birthConsent=true}if(p.settings)S.settings=Object.assign(S.settings,p.settings)}}
 else if(S.sign)syncProfile();
 const remoteDays=new Set();
 R.fortunes.forEach(f=>{remoteDays.add(f.day);S.revealed[f.day]=true;S.days[f.day]=f.card_id;
  if(f.saved&&!S.saved.some(x=>x.date===f.day))S.saved.push({id:f.card_id,date:f.day});
  if(!f.saved){const i=S.saved.findIndex(x=>x.date===f.day);if(i>=0&&S.saved[i].sy)S.saved.splice(i,1)}
  if(f.note&&!S.notes[f.day])S.notes[f.day]=f.note});
 S.saved.forEach(x=>x.sy=true);
 S.saved.sort((a,b)=>a.date<b.date?-1:1);
 new Set([...Object.keys(S.revealed),...S.saved.map(x=>x.date),...Object.keys(S.notes)]).forEach(k=>{if(!remoteDays.has(k))syncFortune(k)});
 S.readings=mergeList(S.readings.map(r=>r.rid?Object.assign(r,{id:r.rid}):r),R.readings,
  r=>({id:r.id,rid:r.id,spread:r.spread,q:r.question,date:r.day,at:r.created_at,cards:r.cards,note:r.note||''}),
  l=>C.saveReading(l).then(id=>{if(id){l.id=l.rid=id}}));
 {const L={};S.journal.forEach(j=>L[j.id]=j);const has=d=>d&&Object.keys(d).length;S.journal=mergeList(S.journal,R.journal,r=>({id:r.id,day:r.day,kind:has(r.data)?r.kind:((L[r.id]||{}).kind||r.kind),title:r.title,body:r.body,at:r.created_at,data:has(r.data)?r.data:(L[r.id]||{}).data}),l=>C.saveJournal(l))}
 // until the connections table exists, the older matches table still supplies saved pairings
 const remoteConns=R.connections.length||!R.matches.length?R.connections:[];
 S.conns=mergeList(S.conns,remoteConns,r=>({id:r.id,kind:r.kind,name:r.name,data:r.data,note:r.note,at:r.created_at}),l=>C.saveConnection(l));
 if(!R.connections.length&&R.matches.length)R.matches.forEach(m=>{if(!S.conns.some(c=>c.kind==='zodiac'&&c.data.a===m.sign_a&&c.data.b===m.sign_b))S.conns.push({id:uuid(),kind:'zodiac',name:'',data:{a:m.sign_a,b:m.sign_b},note:''})});
 S.bookmarks=mergeList(S.bookmarks,R.bookmarks,r=>({id:r.id,kind:r.kind,ref:r.ref,data:r.data,at:r.created_at}),l=>C.saveBookmark(l));
 save();
 // a returning reader goes straight in; one who signed in without a sign yet chooses it first
 if(S.sign&&onboarding()&&!V.obHold&&V.sec!=='reset'){applyLocation();if(onboarding())V.sec='home'}else if(!S.sign&&onboarding())V.ob='sign';
 render();
}

/* ---------- time helpers (always in the reader's time zone) ---------- */
const dkey=(d=new Date())=>K.ymdIn(TZ(),d);
const fmt=(o,d)=>new Intl.DateTimeFormat(LOC(),Object.assign({timeZone:TZ()},o.hour&&!o.hourCycle?{hour12:S.settings&&S.settings.clock==='12'}:{},o)).format(d);
const long=d=>fmt({weekday:'long',day:'numeric',month:'long',year:'numeric'},d);
const evt=d=>fmt({weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'},d);
const shortD=d=>fmt({day:'numeric',month:'short',year:'numeric'},d);
// a calendar date (YYYY-MM-DD) shown as itself, whatever the time zone
const LOC=()=>S.settings&&S.settings.datefmt==='mdy'?'en-US':'en-GB';
const ymdLong=(k,o={weekday:'long',day:'numeric',month:'long',year:'numeric'})=>new Intl.DateTimeFormat(LOC(),Object.assign({timeZone:'UTC'},o)).format(new Date(k+'T12:00:00Z'));
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function seeded(a,seed){a=a.slice();let t=seed;const r=()=>{t=(t+0x6D2B79F5)|0;let x=Math.imul(t^(t>>>15),1|t);x=(x+Math.imul(x^(x>>>7),61|x))^x;return((x^(x>>>14))>>>0)/4294967296};for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
const plain=s=>String(s).replace(/<[^>]*>/g,'');

/* ---------- Whispers: one card per local day, a per-reader shuffled cycle with no repeats until every card has appeared ---------- */
const EPOCH=Date.UTC(2026,0,1);
const dayNum=k=>Math.round((K.parseYmd(k)-EPOCH)/DAY);
function rotation(k){
 const n=ORACLE.length,d=dayNum(k),cyc=Math.floor(d/n),seed=(C.user&&C.user.id)||(S.email||'guest').toLowerCase();
 const perm=seeded(ORACLE.map(c=>c.id).sort(),hash(seed+':'+cyc));
 const seen=new Set(Object.entries(S.days).filter(([x])=>x!==k&&Math.floor(dayNum(x)/n)===cyc).map(x=>x[1]));
 const i=((d%n)+n)%n;for(let j=0;j<n;j++){const id=perm[(i+j)%n];if(!seen.has(id))return id}return perm[i];
}
const cardFor=k=>oc(S.days[k])||oc((S.saved.find(x=>x.date===k)||{}).id)||oc(rotation(k))||ORACLE[0];
const todayCard=()=>cardFor(dkey());

/* ---------- interpretation tables ---------- */
const PM={Sun:'identity and vitality',Moon:'emotional needs and habits',Mercury:'thinking and communication',Venus:'love, values and pleasure',Mars:'drive and assertion',Jupiter:'growth and meaning',Saturn:'structure and responsibility',Uranus:'change and individuality',Neptune:'imagination and ideals',Pluto:'transformation and depth',Ascendant:'the way you meet the world',Midheaven:'vocation and public life'};
const STYLE={aries:'directly, with courage and some impatience',taurus:'steadily, through the senses and with loyalty',gemini:'curiously, through words, wit and variety',cancer:'protectively, through feeling, memory and care',leo:'warmly, with pride, play and generosity',virgo:'carefully, through craft, service and detail',libra:'gracefully, seeking balance, fairness and partnership',scorpio:'intensely, through depth, privacy and loyalty',sagittarius:'expansively, through adventure, humour and belief',capricorn:'patiently, through ambition, structure and duty',aquarius:'independently, through ideas, friendship and reform',pisces:'gently, through empathy, imagination and devotion'};
const HOUSE=['self, body and first impressions','money, possessions and self-worth','siblings, learning and everyday talk','home, family and roots','creativity, romance, children and play','work, health and daily routine','partnership and close one-to-one bonds','intimacy, shared resources and change','travel, study and belief','career, reputation and calling','friends, groups and hopes','solitude, the unconscious and retreat'];
const ASPT={conjunction:'blend and intensify one another',sextile:'cooperate easily when invited',square:'press against each other, a friction that asks for growth',trine:'flow together naturally',opposition:'pull in opposite directions, asking for balance'};
const ORD=n=>n+(['th','st','nd','rd'][(n%100>10&&n%100<14)?0:n%10]||'th');
const placement=p=>`Your ${PM[p.n]} (${p.n}) tends to express itself ${STYLE[sIdx(p.sign).id]}.${p.house?` In the ${ORD(p.house)} house, the life area of ${HOUSE[p.house-1]}.`:''}${p.retro?' Retrograde at birth, traditionally read as a more inward, reflective expression.':''}`;
const degTxt=(l)=>`${Math.floor(K.norm(l)%30)}° ${sIdx(K.signIdx(l)).name} ${String(Math.floor((K.norm(l)%1)*60)).padStart(2,'0')}′`;

/* ---------- horoscopes ---------- */
const HCATS=[['overview','Overview'],['love','Love'],['family','Family'],['health','Health'],['career','Career'],['money','Money']];
const PERIODS=[['daily','Daily'],['weekly','Weekly'],['monthly','Monthly'],['yearly','Yearly']];
const PWORD={daily:'day',weekly:'week',monthly:'month',yearly:'year'};
// readings are written in the app from the period's real sky (forecast.js); the same sign, area and period always
// read the same, and each new day, week, month or year brings a new one
function horoscope(signId,cat,period){
 const per=K.period(period,TZ()),h=Object.assign({id:`${period}/${per.key}/${signId}/${cat}`,per},KosmiaForecast.write(K,signId,cat,period,per,TZ()));
 const ai=(S.hai||{})['v2:'+h.id];if(ai&&ai.body)return Object.assign(h,{body:ai.body,focus:ai.focus||h.focus,ai:true});
 askHoro(signId,cat,period,per.key,'v2:'+h.id);return h;
}
// each forecast is written once by Claude for everyone of that sign (on the server) and kept here for the period
const horoAsk={};
function askHoro(sign,cat,period,key,id){
 if(!C.user||!C.horoscope||horoAsk[id])return;horoAsk[id]=1;
 C.horoscope(sign,cat,period,key).then(r=>{if(!r||!r.body)return;S.hai=S.hai||{};S.hai[id]={body:r.body,focus:r.focus||''};
  Object.keys(S.hai).slice(0,-80).forEach(x=>delete S.hai[x]);save();clearTimeout(horoAsk.t);horoAsk.t=setTimeout(render,250)}).catch(()=>{});
}
const rangeTxt=per=>per.start===per.end?ymdLong(per.start):`${ymdLong(per.start,{day:'numeric',month:'long'})} – ${ymdLong(per.end,{day:'numeric',month:'long',year:'numeric'})}`;
const periodHead=(period,per)=>period==='daily'?ymdLong(per.start):period==='weekly'?`Week of ${rangeTxt(per)}`:period==='monthly'?ymdLong(per.start,{month:'long',year:'numeric'}):'The year '+per.key;

/* ---------- Zodiac Match: traditional themes from the angle between the signs, their elements and modalities ---------- */
const DIST=[['Same sign','You share a sign: instant recognition, and the same blind spots. The relationship mirrors you back to yourself.'],['Neighbouring signs','One sign apart (semi-sextile): close but different, each holding what the other is still learning.'],['Sextile','Two signs apart: complementary elements that spark easily. Friendship is often the foundation.'],['Square','Three signs apart: a dynamic angle. Attraction and friction come together, and growth comes from working through it.'],['Trine','Four signs apart: the same element, so you understand each other with little explanation.'],['Quincunx','Five signs apart: very different needs. Curiosity and patience turn strangeness into fascination.'],['Opposition','Opposite signs: the classic magnetic pairing. You see in each other what you lack, which can balance or polarise.']];
const ELP={'Fire-Fire':['Fast, playful and direct; you finish each other’s sentences or talk over them.','Passionate and warm, though both may need space to cool down.'],'Earth-Earth':['Practical and unhurried; you say what you mean.','Steady and loyal; affection is shown through care and reliability.'],'Air-Air':['Endless conversation and shared ideas.','Friendly and light; feelings may be talked about more than felt.'],'Water-Water':['Much is understood without words.','Deep and intuitive, with a risk of drowning in shared moods.'],'Air-Fire':['Ideas meet enthusiasm: talk turns quickly into plans.','Lively and encouraging; each fans the other’s flame.'],'Earth-Water':['Quiet understanding; listening matters more than talking.','Nurturing and secure; feeling finds a safe shape.'],'Earth-Fire':['Fire leaps, Earth checks the plan; patience bridges the pace.','Warmth meets steadiness; it works when each respects the other’s tempo.'],'Air-Water':['Head and heart speak different languages; translation is part of the romance.','Tender, if Air makes room for feeling and Water for words.'],'Fire-Water':['Spontaneity meets sensitivity; tone matters as much as content.','Steamy and intense; reassurance keeps it from boiling over.'],'Air-Earth':['Ideas meet practicality; brainstorming needs a deadline.','Slow to warm; trust grows from keeping small promises.']};
const MODP={'Cardinal-Cardinal':'Two initiators: exciting, as long as you take turns leading.','Fixed-Fixed':'Two stabilisers: deeply loyal, and occasionally immovable.','Mutable-Mutable':'Two adapters: flexible and forgiving, though decisions can drift.','Cardinal-Fixed':'One starts, one sustains: a strong team when roles are clear.','Cardinal-Mutable':'One leads, one adapts: momentum with room to manoeuvre.','Fixed-Mutable':'One anchors, one explores: security and freshness in the same house.'};
function zodiacMatch(a,b){
 const A1=sg(a),B1=sg(b),ia=SIGNS.indexOf(A1),ib=SIGNS.indexOf(B1),d=Math.min((ib-ia+12)%12,(ia-ib+12)%12);
 const el=ELP[A1.el+'-'+B1.el]||ELP[B1.el+'-'+A1.el],mod=MODP[A1.mod+'-'+B1.mod]||MODP[B1.mod+'-'+A1.mod];
 const rulers=A1.ruler===B1.ruler?`You share a ruling planet (${A1.ruler}), a thread of common motivation.`:`${A1.name} is ruled by ${A1.ruler} (${PM[A1.ruler]||'its own themes'}), ${B1.name} by ${B1.ruler} (${PM[B1.ruler]||'its own themes'}).`;
 return {angle:DIST[d],themes:[['Communication',el[0]],['Emotional connection',el[1]],['Attraction',DIST[d][1]],['Shared rhythm',mod],['Values',rulers]]};
}

/* ---------- tarot ---------- */
/* the full 78-card deck lives in tarot.js; each card carries upright/reversed meanings and love/work/money/growth readings */
const DECK=(window.KOSMIA_TAROT||[]);
const dk=id=>DECK.find(c=>c.id===id);
const CTX={love:'Love',work:'Work',money:'Money',growth:'Growth'};
const SPREAD_CTX={love:'love',career:'work'};
const SPREADS={
 one:{s:'One Card',n:'One Card — Cosmic Guidance',p:['Guidance']},
 ppf:{s:'Past · Present · Future',n:'Three Cards — Past, Present, Future',p:['Past','Present','Future']},
 scg:{s:'Situation · Challenge',n:'Three Cards — Situation, Challenge, Guidance',p:['Situation','Challenge','Guidance']},
 love:{s:'Love',n:'Love Reading',p:['You','Them','The connection','The challenge','The direction']},
 career:{s:'Career',n:'Career Reading',p:['Where you are','Your strengths','The obstacle','Action to take','Where it tends']},
 celtic:{s:'Celtic Cross',n:'Celtic Cross',p:['The present','The challenge','The foundation','The past','The crown','The near future','Yourself','Your surroundings','Hopes and fears','The outcome']}
};
const SPREAD_FOR={one:'A clear word for today',ppf:'How you got here, where it leads',scg:'When you feel stuck',love:'You, them and what lies between',career:'Strengths, obstacle, next step',celtic:'The deepest look of all'};
function shuffle(a){a=a.slice();const r=new Uint32Array(a.length);crypto.getRandomValues(r);for(let i=a.length-1;i>0;i--){const j=r[i]%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
/* ---------- sections and routes: five destinations in the bottom bar, each with its own pages; the profile opens from the avatar ---------- */
// [page slug, title]; the first page of each section is its landing
const SECTIONS={
 home:{label:'Home',tabs:[['today','Home']]},
 horoscope:{label:'Sky',tabs:[['overview','Your Sky'],['sign','Horoscope']]},
 tarot:{label:'Oracle',tabs:[['home','Oracle'],['spreads','Tarot'],['whisper','Daily Whisper'],['reading','Card Reading'],['journal','Journal'],['entry','Journal Entry'],['calendar','Journal Calendar'],['insights','Your Journal'],['history','Journal'],['reflections','My Reflections'],['intentions','My Intentions'],['gratitude','My Gratitude'],['library','My Library'],['write','Write'],['page','Journal Entry'],['month','Your Journey']]},
 discover:{label:'Discover',tabs:[['home','Discover'],['dreams','Dream Interpretation'],['new-dream','New Dream'],['dream','Your Dream Meaning'],['dream-journal','Dream Archive'],['dream-patterns','Dream Patterns'],['birth-chart','Birth Chart'],['profile','My Birth Details'],['affinity','Zodiac Compatibility'],['resonance','Compatibility'],['synastry','Birth Chart Comparison'],['connections','Connections'],['insights','Relationship Insights'],['people','My Relationships'],['person','My Relationships'],['conn-reading','Your Reading'],['event','Cosmic Event'],['event-ritual','Event Ritual'],['saved-events','Saved Events'],['readings','Your Readings'],['saved','Your Reading'],['life-path','Life Path'],['name-within','The Name Within'],['signs','Signs & Synchronicities'],['numbers','Sacred Numbers'],['number','Sacred Number'],['sync','Synchronicities'],['sync-reading','Synchronicity'],['patterns','Patterns'],['pattern','Pattern'],['numerology','Numerology'],['cycles','Personal Year'],['calendar','Cosmic Calendar'],['moon','The Moon'],['planets','Planets'],['events','Celestial Events'],['library','Astrology Library']]},
 kassandra:{label:'Kassandra',tabs:[['chat','Kassandra'],['history','Past Conversations']]},
 you:{label:'My Cosmos',tabs:[['home','My Cosmos'],['chart','My Birth Chart'],['placement','Cosmic Placement'],['zodiac','My Zodiac'],['identity','My Cosmic Identity'],['cycles','My Cosmic Cycles'],['transit','Personal Transit'],['people','My Relationships'],['person','Relationship Profile'],['person-edit','Add Someone'],['preferences','My Preferences']]},
 settings:{label:'Profile',tabs:[['account','My Account'],['birth','My Birth Details'],['notifications','Notifications'],['privacy','Privacy & My Data'],['display','Display & Accessibility'],['subscription','My Membership'],['ritual','My Ritual Times'],['region','Language & Region']]}
};
const MAIN=['home','horoscope','tarot','discover','kassandra','you'];
// the five places: Today (the day's path), Sky (look up), Oracle (ask: Kassandra, the cards, a dream), Journal
// (remember) and You (your Codex, your Circle and your settings)
// the blueprint's five places (Ritual, Sky, Oracle, Calendar, Journal); My Cosmos opens from the round symbol at the top
const NAV=[{key:'home',label:'Ritual'},{key:'horoscope',label:'Sky'},{key:'tarot',label:'Oracle'},{key:'calendar',label:'Calendar'},{key:'journal',label:'Journal'}];
const CPAGES=['calendar','moon','planets','events','event','event-ritual','saved-events'];
const JPAGES=['journal','entry','insights','calendar','history','notebook','reflections','intentions','gratitude','library','write','page','month'],DPAGES=['readings','saved','dreams','new-dream','dream','dream-journal','dream-patterns','connections','affinity','insights','synastry','people','person','conn-reading','signs','numbers','number','sync','sync-reading','patterns','pattern','numerology'],YPAGES=['profile','birth-chart','life-path','name-within','cycles','affinity','resonance','synastry'];
// the place a page belongs to, lit in the menu: dreams are asked of the Oracle and kept in the Journal; the chart, the
// numbers and the bonds are You; the calendar, the Moon, the planets and the library are Sky
function navCur(){const t=tab();
 if(V.sec==='tarot')return JPAGES.includes(t)?'journal':'tarot';
 if(V.sec==='kassandra')return 'tarot';
 if(V.sec==='settings'||V.sec==='you')return 'you';
 if(V.sec==='discover')return DPAGES.includes(t)?'tarot':YPAGES.includes(t)?'you':CPAGES.includes(t)?'calendar':'horoscope';
 return V.sec}
// where a page's back arrow leads, when it is not the section's landing
const PARENT={'tarot/entry':'tarot/journal','kassandra/chat':'tarot/home',
 'discover/new-dream':'discover/dreams','discover/dream':'discover/dream-journal','discover/dream-journal':'discover/dreams','discover/connections':'tarot/home','discover/readings':'tarot/home','discover/saved':'discover/readings','tarot/reading':'tarot/spreads','discover/affinity':'discover/connections','discover/insights':'discover/connections','discover/synastry':'discover/connections','discover/people':'discover/connections','discover/person':'discover/people','discover/conn-reading':'discover/connections','discover/dream-patterns':'discover/dreams','discover/dreams':'tarot/home','discover/signs':'tarot/home','discover/numbers':'discover/signs','discover/number':'discover/numbers','discover/sync':'discover/signs','discover/sync-reading':'discover/sync','discover/patterns':'discover/signs','discover/pattern':'discover/patterns','discover/numerology':'discover/signs',
 'discover/moon':'discover/calendar','you/chart':'you/home','you/placement':'you/chart','you/zodiac':'you/home','you/identity':'you/home','you/cycles':'you/home','you/transit':'you/cycles','you/people':'you/home','you/person':'you/people','you/person-edit':'you/people','you/preferences':'you/home','discover/event':'discover/calendar','discover/event-ritual':'discover/event','discover/saved-events':'discover/calendar','tarot/reflections':'tarot/journal','tarot/intentions':'tarot/journal','tarot/gratitude':'tarot/journal','tarot/library':'tarot/journal','tarot/write':'tarot/journal','tarot/page':'tarot/reflections','tarot/month':'tarot/journal','discover/planets':'discover/calendar','discover/events':'discover/calendar','discover/cycles':'discover/life-path','kassandra/history':'kassandra/chat'};
function parentOf(sec,t){
 const p=PARENT[sec+'/'+t];if(p)return p.split('/');
 if(sec==='discover')return YPAGES.includes(t)?['you','home']:['horoscope','overview'];
 if(sec==='settings')return ['you','preferences'];
 return [sec,SECTIONS[sec].tabs[0][0]];
}
// earlier addresses keep working: the six-section release and the first release's single words
const OLD={'/oracle':'/tarot','/oracle/whispers':'/tarot/whisper','/oracle/tarot':'/tarot/reading','/oracle/readings':'/tarot/journal','/oracle/journal':'/tarot/journal',
 '/home/journal':'/tarot/journal','/home/saved':'/tarot/journal','/home/insights':'/tarot/insights','/home/today':'/','/affinity/connections':'/tarot/journal',
 '/affinity':'/discover/affinity','/affinity/zodiac-match':'/discover/affinity','/affinity/soul-resonance':'/discover/resonance','/affinity/synastry':'/discover/synastry',
 '/blueprint':'/discover/profile','/blueprint/profile':'/discover/profile','/blueprint/birth-chart':'/discover/birth-chart','/blueprint/life-path':'/discover/life-path','/blueprint/the-name-within':'/discover/name-within','/blueprint/my-cycles':'/discover/cycles',
 '/cosmos':'/discover/calendar','/cosmos/calendar':'/discover/calendar','/cosmos/moon':'/discover/moon','/cosmos/planets':'/discover/planets','/cosmos/celestial-events':'/discover/events',
 '/fortune':'/tarot/whisper','/whispers':'/tarot/whisper','/daily-fortune':'/tarot/whisper','/love':'/discover/affinity','/love-match':'/discover/affinity','/name-match':'/discover/resonance',
 '/chart':'/discover/birth-chart','/birth-chart':'/discover/birth-chart','/name-numerology':'/discover/name-within','/birth-numerology':'/discover/life-path','/calendar':'/discover/calendar','/universe':'/settings','/horoscopes':'/horoscope'};
const V={sec:'welcome',tab:{},period:'daily',hcat:'overview',exploreSign:null,q:{},love:{a:'',b:'',done:false},res:{a:'',b:'',done:false},syn:{name:'',date:'',time:'',unk:true,place:'',lat:'',lon:'',tz:'',done:false},
 tarot:{spread:'one',q:'',stage:'setup',picks:[],drawn:null,deck:null},chartSel:null,chartTab:'chart',paint:{},painting:false,say:null,auth:'up',busy:false,ob:'welcome',
 places:{},filter:{},search:'',edit:null,cal:{view:'list',month:'',day:''},jcal:{month:'',day:''},evOpen:null,birthDraft:null,jkey:'',jfilter:'all',jsearch:null,sheet:null,
 dream:{text:'',mood:'',symbols:[],busy:false},ns:{},dreamId:'',lib:{tab:'guides',q:''},insTab:'insights'};
const tab=()=>{const s=SECTIONS[V.sec];return s?(V.tab[V.sec]||s.tabs[0][0]):''};
const tabLabel=(sec,t)=>{const x=(SECTIONS[sec]||{tabs:[]}).tabs.find(x=>x[0]===t);return x?x[1]:''};
const landing=sec=>SECTIONS[sec].tabs[0][0];
function pathFor(sec,t,q={}){
 t=t||landing(sec);
 const p=sec==='home'?'/':t===landing(sec)?'/'+sec:`/${sec}/${t}`;
 const qs=Object.entries(q).filter(([,v])=>v).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');
 return p+(qs?'?'+qs:'');
}
function applyLocation(){
 let path=location.pathname.replace(/\/+$/,'')||'/',search=location.search;
 const hm=/^\/horoscopes\/([a-z]+)$/.exec(path);
 if(hm){path='/horoscope/sign';search='?cat='+({general:'overview',finance:'money'}[hm[1]]||hm[1])}
 if(OLD[path]){path=OLD[path]}
 if(path+search!==location.pathname+location.search)history.replaceState(history.state,'',path+search);
 const [,sec='home',t='']=path.split('/'),q=Object.fromEntries(new URLSearchParams(search));
 if(!SECTIONS[sec]||sec==='home'){V.sec='home';V.tab.home='today';return}
 if(sec==='discover'&&(!t||t==='home')){history.replaceState(history.state,'','/horoscope');V.sec='horoscope';V.tab.horoscope='overview';return}
 V.sec=sec;V.tab[sec]=SECTIONS[sec].tabs.some(x=>x[0]===t)?t:landing(sec);V.q=q;
 if(sec==='horoscope'){V.period=PERIODS.some(p=>p[0]===q.period)?q.period:'daily';V.exploreSign=SIGNS.some(s=>s.id===q.sign)?q.sign:null;V.hcat=HCATS.some(c=>c[0]===q.cat)?q.cat:'overview'}
 if(sec==='tarot'&&q.k){V.jkey=q.k;V.jxk=q.k}if(sec==='tarot'&&q.m)V.jxm=q.m;if(sec==='discover'&&q.e)V.calRef=q.e;if(sec==='you'){if(q.p){V.mcP=q.p;V.cnPid=q.p}if(q.t)V.mcT=q.t}
 if(sec==='discover'){if(q.id){V.dreamId=q.id;V.ssId=q.id}if(q.k)V.ssPat=q.k;if(q.id)V.cnId=q.id;if(q.p)V.cnPid=q.p;if(q.r)V.rk=q.r;if(q.month)V.cal.month=q.month;if(q.view)V.cal.view=q.view;if(q.lib)V.lib.tab=q.lib}
}
// the query string mirrors the page's own choices, so a forecast, an entry or a month can be shared and reopened
function viewQuery(){
 const t=tab();
 if(V.sec==='horoscope')return t==='sign'?{sign:V.exploreSign||S.sign,period:V.period!=='daily'?V.period:'',cat:V.hcat!=='overview'?V.hcat:''}:{period:V.period!=='daily'?V.period:''};
 if(V.sec==='tarot'&&t==='entry')return {k:V.jkey};
 if(V.sec==='tarot'&&t==='page')return {k:V.jxk};
 if(V.sec==='you'&&t==='placement')return {p:V.mcP};
 if(V.sec==='you'&&t==='transit')return {t:V.mcT};
 if(V.sec==='you'&&(t==='person'||t==='person-edit'))return {p:V.cnPid};
 if(V.sec==='tarot'&&t==='month')return {m:V.jxm};
 if(V.sec==='discover'&&(t==='event'||t==='event-ritual'))return {e:V.calRef};
 if(V.sec==='discover'&&t==='dream')return {id:V.dreamId};
 if(V.sec==='discover'&&(t==='number'||t==='sync-reading'))return {id:V.ssId};
 if(V.sec==='discover'&&t==='pattern')return {k:V.ssPat};
 if(V.sec==='discover'&&t==='conn-reading')return {id:V.cnId};
 if(V.sec==='discover'&&t==='saved')return {r:V.rk};
 if(V.sec==='discover'&&t==='person')return {p:V.cnPid};
 if(V.sec==='discover'&&t==='calendar')return {view:V.cal.view!=='list'?V.cal.view:'',month:V.cal.month&&V.cal.month!==dkey().slice(0,7)?V.cal.month:''};
 if(V.sec==='discover'&&t==='library')return {lib:V.lib.tab!=='guides'?V.lib.tab:''};
 return {};
}
const syncUrl=()=>{const u=pathFor(V.sec,tab(),viewQuery());if(u!==location.pathname+location.search)history.replaceState(history.state,'',u)};
history.scrollRestoration='manual';
// a fresh Card Reading: back to the choice of spread, with no question, cards or interpretation
function newReading(){const T=V.tarot;T.stage='setup';T.q='';T.picks=[];T.drawn=null;T.ai='';T.aiState='';T.savedId=null;V.tpop=null}
function go(sec,t,opt={}){
 if(sec==='discover'&&(!t||t==='home')){sec='horoscope';t=null}
 stopAudio();V.confirmDel=false;V.edit=null;V.tpop=null;V.cpEdit=false;V.spop=null;V.sheet=null;V.wpop=false;V.spk=false;V.jsub=null;V.insPop=false;V.letter=null;jLeave();jeLeave();
 history.replaceState(Object.assign({},history.state,{scroll:scrollY}),'');
 if(sec==='tarot'&&t==='reading')newReading();
 if(sec==='discover')V.ns={};
 V.sec=sec;V.tab[sec]=t||landing(sec);
 // each page records how many steps into the app it is (d), so Back can return to the page it was opened from
 const d=(history.state&&history.state.d)||0;
 if(SECTIONS[sec])history[opt.replace?'replaceState':'pushState']({scroll:0,d:opt.replace?d:d+1},'',pathFor(sec,tab(),viewQuery()));
 render();window.scrollTo(0,0);
}
// Back returns to the page the reader came from; a page opened straight from a link (nothing to return to) goes to its parent
const goBack=()=>{
 if(V.sec==='tarot'&&tab()==='reading'&&V.tarot.stage!=='setup'){newReading();render();return window.scrollTo(0,0)}
 if(((history.state&&history.state.d)||0)>0)return history.back();
 const [s,t]=parentOf(V.sec,tab());go(s,t,{replace:true})};
addEventListener('popstate',e=>{stopAudio();jLeave();jeLeave();V.tpop=null;V.edit=null;V.sheet=null;if(!S.sign)return;applyLocation();render();const y=(e.state&&e.state.scroll)||0;requestAnimationFrame(()=>window.scrollTo(0,y))});

// a passing message, with an action (Undo) when there is one
function toast(t,act,label){const e=$('#toast');e.innerHTML=esc(t)+(act?` <button class="toast-a" data-act="${act}">${label||'Undo'}</button>`:'');e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,act?(label?9000:6500):2600)}
// leaving the journal: the page being written is kept, and next time it opens on a new page
function jLeave(){jDone();jflushSave();V.jx=false;V.jpage=null}

/* ---------- the parts every page is built from ---------- */
// the atlas paintings (art/atlas, painted after the Kosmia mockups by scripts/craft-atlas.mjs); a few older names lead to them
const ATLAS_AS={'ev-moon':'ev-full','d-chart':'hero-chart','d-affinity':'hero-affinity','d-resonance':'ex-resonance','d-name':'hero-name','d-lifepath':'hero-lifepath','d-dream':'hero-dream',
 'd-calendar':'banner-calendar','d-library':'banner-library','landscape2':'landscape','ne-tarot':'t-reading','ne-horoscope':'ico-overview','ne-event':'t-whisper'};
const atlasId=id=>/^m-/.test(id)?'med-'+id.slice(2):/^sign-/.test(id)?'plate-'+id.slice(5):ATLAS_AS[id]||id;
// (the parts themselves, and the scene system they sit in, are in kit.js)
const ui=(id,cls='',alt='',priority=false)=>Kit.img('atlas/'+atlasId(id),{cls,alt,priority});
// the scenery that carries on below a page's header scene (Home after Cosmic Energy, Discover's library): the night lake
// from the top, the floral night band in the middle and the closing garden at the foot, overlapping and blended, never
// stretched or repeated; it sits under its content and takes no taps
const scenic=(content,cls='',bg)=>`<div class="kscenic ${cls}"><div class="ksc-bg" aria-hidden="true">${bg||ui('home-vines','ksc-m')+ui('home-lake','ksc-c')+ui('home-garden','ksc-d')}</div><div class="ksc-in">${content}</div></div>`;
const panel=(h,cls='')=>Kit.panel(h,{cls});
// a page's own header on parchment: the back arrow, its title (and a line under it), and an action at the right
// the painted objects for the app's actions: the crystal ball asks Kassandra, the feather pen opens the Journal, the little
// constellation shares, the heart keeps (dimmer until kept)
const OBJ={kas:'ic-orb-k',pen:'ic-quill-k',share:'ic-share-k',like:'ic-like-k',speak:'ic-speak-k'};
const obj=(k,attrs,label,cls='')=>`<button class="obj-b obj-${k}${cls?' '+cls:''}" ${attrs} aria-label="${label}">${ui(OBJ[k],'obj-i')}</button>`;
const IC={
 back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 chev:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 heart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7.2 3.8 4 7.1 4c2 0 3.6 1.1 4.9 3 1.3-1.9 2.9-3 4.9-3 3.3 0 5.5 3.2 4.3 6.6C19.5 15.4 12 20 12 20z" fill="var(--fill,none)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
 speak:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
 stop:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor"/></svg>',
 help:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9.6 9.4a2.5 2.5 0 114 2c-.9.6-1.6 1.1-1.6 2.3M12 16.8v.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
 share:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3.5M8 7.5l4-4 4 4M6 11H5v9.5h14V11h-1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 more:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="18.5" r="1.5" fill="currentColor"/></svg>',
 search:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
 plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
 cal:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
 chart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V11M10 20V5M15 20v-7M20 20V9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
 book:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5c3-1.2 5.6-.8 8 1 2.4-1.8 5-2.2 8-1v13c-3-1.2-5.6-.8-8 1-2.4-1.8-5-2.2-8-1z M12 6.5v13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
 mic:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
 send:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
 bell:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 1.5h-15zM10 20.5a2.2 2.2 0 004 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
 eye:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
 mail:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 6.5l8.5 7 8.5-7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
 lock:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 10.5V8a4 4 0 018 0v2.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
 history:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 102.4-5.7M4 4.5v3.8h3.8M12 8v4.5l3 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 star:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" fill="currentColor"/></svg>',
 mark:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h10v17l-5-3.8-5 3.8z" fill="currentColor"/></svg>',
 refresh:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 12a7.5 7.5 0 11-2.2-5.3M19.5 4.5v4h-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 quill:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 3.5C13 4.5 8 9.5 6.5 16.5M20 3.5c-.5 6-4.5 10.5-11 12.5M4 20.5l2.5-4M9.5 11.5h4.5M8 14h3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 chat:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5c4.7 0 8.5 3 8.5 6.8s-3.8 6.7-8.5 6.7c-1 0-2-.1-2.9-.4L5 19.5l1.2-3.4C4.5 14.9 3.5 13.2 3.5 11.3 3.5 7.5 7.3 4.5 12 4.5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="8.5" cy="11.3" r="1" fill="currentColor"/><circle cx="12" cy="11.3" r="1" fill="currentColor"/><circle cx="15.5" cy="11.3" r="1" fill="currentColor"/></svg>',
 trash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9.5 7V4.5h5V7M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'
};
const iconBtn=(ic,attrs,label)=>`<button class="ibtn" ${attrs} aria-label="${esc(label)}">${IC[ic]}</button>`;
// the Journal's door, the same quill on every section's first page
const jdoor=()=>'';
function hdr(title,o={}){
 return `<header class="phd"><div class="ph-l">${o.back===false?'':iconBtn('back','data-act="back"','Back')}</div><div class="ph-t"><h1>${title}</h1>${o.sub?`<p class="ph-sub">${o.sub}</p>`:''}</div><div class="ph-r">${o.right||(V.sec==='you'||V.sec==='settings'?'':avatar())}</div></header>`;
}
// a dark, illustrated hero at the head of a section (a scene): stars that softly twinkle, a picture that drifts as the page
// scrolls, and the title set over it in live type
const STARS=Kit.STARS;
const hero=(img,inner='',cls='',title='',sub='')=>Kit.scene({cls:`hero ${cls} ${img}`,bg:'atlas/'+atlasId(img),imgCls:'hero-img',parallax:true,priority:true,stars:true,bare:true,
 content:`${title?`<div class="hero-t"><h1 class="cz${title.length>12?' long':''}">${title}</h1>${sub?`<p>${sub}</p>`:''}</div>`:''}${inner}`});
// a heading with a small engraved star either side, like the mockups' section titles
const orn=(t,more='')=>Kit.heading(t,more);
const seeAll=(sec,t,label='See all')=>`<button class="see" data-go="${sec}" data-t="${t}">${label} ${IC.chev}</button>`;
// one row of a list: a picture, a title and a line, and a chevron; it opens a page or acts
const lrow=(img,title,sub,attrs,more='')=>`<button class="lrow" ${attrs}>${img?`<span class="lr-i">${img}</span>`:''}<span class="lr-t"><strong>${title}</strong>${sub?`<span>${sub}</span>`:''}${more}</span><span class="lr-c">${IC.chev}</span></button>`;
// an expandable reading: the summary row, and the reading beneath it when opened
const acc=(img,title,sub,body,open=false)=>`<details class="acc"${open?' open':''}><summary>${img?`<span class="lr-i">${img}</span>`:''}<span class="lr-t"><strong>${title}</strong>${sub?`<span>${sub}</span>`:''}</span><span class="lr-c">${IC.chev}</span></summary><div class="acc-b">${body}</div></details>`;
// a zodiac sign's illustrated medallion (art/atlas/med-<sign>)
const med=(id,cls='med')=>ui('m-'+id,cls,sg(id).name);
// the sign's painted medallion: a gold engraved rim round a night-blue field with the glyph in gold
const glyphMed=(id,cls='')=>`<span class="gmed ${cls}" aria-hidden="true">${Kit.size('atlas/sgm-'+id)?ui('sgm-'+id,'gmed-i'):`<span class="glyph">${sg(id).g}</span>`}</span>`;
const keys=a=>a.map(esc).join(' <i class="dot">•</i> ');
const paras=t=>String(t||'').split(/\n+/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('');
const needLib=()=>A&&K?'':panel('<h3>Astronomy library unavailable</h3><p>The ephemeris could not load, so astronomical data is not shown rather than guessed. Check your connection and reload.</p>');
const chips=(name,opts,sel,act)=>`<div class="fchips" role="radiogroup" aria-label="${name}">${opts.map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${sel===k}" data-act="${act}" data-k="${k}">${l}</button>`).join('')}</div>`;
const seg=(opts,sel,attr)=>`<div class="seg" role="tablist">${opts.map(([k,l])=>`<button role="tab" aria-selected="${sel===k}" data-${attr}="${k}">${l}</button>`).join('')}</div>`;
const empty=(h,p,btn='')=>panel(`<h3>${h}</h3><p>${p}</p>${btn}`,'empty');
const linkBtn=(label,sec,t,cls='btn ghost')=>`<button class="${cls}" data-go="${sec}" data-t="${t||''}">${label}</button>`;
const isSaved=(kind,ref)=>S.bookmarks.some(b=>b.kind===kind&&b.ref===ref);
// sign grid with the illustrated medallions; attr picks data-sign or data-sign2
const signGrid=(name,sel,attr='sign')=>`<div class="signs sign-grid" role="radiogroup" aria-label="${name}">${SIGNS.map(s=>`<button class="chip" role="radio" aria-checked="${sel===s.id}" data-${attr}="${s.id}">${med(s.id,'sign-ico')}<span class="sign-nm">${s.name}</span></button>`).join('')}</div>`;
const plate=()=>'';
const relDay=k=>{const d=Math.round((K.parseYmd(dkey())-K.parseYmd(k))/DAY);return d<=0?'Today':d===1?'Yesterday':d<7?d+' days ago':ymdLong(k,{day:'numeric',month:'short'})};

/* ---------- words for the illustrated pages ---------- */
const SIGN_KEYS={aries:['Courage','Passion','Initiative'],taurus:['Stability','Sensuality','Patience'],gemini:['Curiosity','Wit','Connection'],cancer:['Nurture','Intuition','Home'],leo:['Radiance','Heart','Creativity'],virgo:['Devotion','Craft','Clarity'],libra:['Harmony','Beauty','Balance'],scorpio:['Depth','Passion','Transformation'],sagittarius:['Freedom','Wisdom','Adventure'],capricorn:['Discipline','Ambition','Wisdom'],aquarius:['Vision','Freedom','Humanity'],pisces:['Dreams','Compassion','Intuition']};
const SIGN_DESC={aries:'You are the spark that starts the fire, first through the door and brave enough to begin.',taurus:'You are the keeper of what lasts, patient, sensual and loyal to what you love.',gemini:'You are the messenger between worlds, curious, quick and always finding the connection.',cancer:'You are the shelter in the storm, tender, intuitive and fiercely protective of your own.',leo:'You are the warmth at the centre of the room, generous, playful and proud of heart.',virgo:'You are the quiet craftsperson, attentive, thoughtful and devoted to doing things well.',libra:'You are the bridge between worlds, always seeking beauty, truth and deeper connection.',scorpio:'You are the diver of deep waters, intense, loyal and unafraid of what lies beneath.',sagittarius:'You are the seeker on the open road, hopeful, honest and hungry for meaning.',capricorn:'You are the builder of dreams, turning vision into reality with patience and determination.',aquarius:'You are the visionary of tomorrow, original, humane and true to your own ideas.',pisces:'You are the dreamer by the sea, compassionate, imaginative and deeply intuitive.'};
// each sign's constellation, drawn in the sky of its Horoscope page: stars [x,y,size] on a 100x80 field, and the lines
// joining them as pairs of star indexes
const CONST={
 aries:[[[8,22,2],[48,34,3],[74,52,2],[80,64,1.5]],[[0,1],[1,2],[2,3]]],
 taurus:[[[8,6,2],[44,32,1.5],[52,42,1.5],[60,50,2],[48,54,1.5],[38,56,3],[6,44,1.5],[74,62,1.5],[94,72,1.5]],[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[3,7],[7,8]]],
 gemini:[[[20,8,2.5],[42,4,3],[24,40,1.5],[16,74,2],[46,36,1.5],[56,72,2],[6,26,1.5],[66,24,1.5]],[[0,2],[2,3],[1,4],[4,5],[2,4],[0,6],[1,7]]],
 cancer:[[[46,6,1.5],[48,30,2],[50,46,2],[80,72,2.5],[14,68,2]],[[0,1],[1,2],[2,3],[2,4]]],
 leo:[[[6,22,1.5],[16,10,1.5],[26,20,2],[32,34,2.5],[26,46,1.5],[26,62,3],[70,50,2],[96,58,2.5],[68,36,2]],[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,3]]],
 virgo:[[[46,74,3],[40,54,1.5],[35,38,2],[20,32,1.5],[5,28,1.5],[50,28,1.5],[60,10,2],[62,46,1.5],[86,50,1.5]],[[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[5,7],[7,0],[7,8]]],
 libra:[[[20,46,2.5],[50,14,3],[80,30,2],[24,72,1.5],[86,68,1.5]],[[0,1],[1,2],[0,2],[0,3],[2,4]]],
 scorpio:[[[10,6,2],[8,20,2],[10,32,1.5],[26,26,1.5],[34,32,3],[40,40,1.5],[46,50,1.5],[50,60,1.5],[58,70,1.5],[72,76,1.5],[86,72,1.5],[92,60,1.5],[88,48,1.5],[78,44,2.5]],[[0,1],[1,2],[1,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13]]],
 sagittarius:[[[14,56,2],[30,44,2],[26,70,2.5],[56,66,2],[66,58,1.5],[72,44,2.5],[50,46,2],[40,26,2],[92,36,1.5]],[[0,1],[1,2],[2,3],[3,6],[6,1],[6,7],[7,1],[6,5],[5,4],[4,3],[5,8]]],
 capricorn:[[[10,12,2.5],[16,24,2],[30,56,1.5],[36,68,1.5],[60,60,1.5],[90,28,2.5],[80,26,2],[56,28,1.5],[40,24,1.5]],[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,1]]],
 aquarius:[[[6,24,1.5],[26,16,2.5],[46,12,2.5],[56,20,1.5],[64,18,1.5],[70,26,1.5],[56,44,1.5],[50,60,1.5],[40,72,1.5],[72,52,1.5],[86,68,2]],[[0,1],[1,2],[2,3],[3,4],[4,5],[2,6],[6,7],[7,8],[6,9],[9,10]]],
 pisces:[[[46,74,2.5],[36,60,1.5],[26,52,1.5],[16,46,1.5],[6,40,1.5],[10,30,1.5],[22,32,1.5],[26,42,1.5],[56,56,1.5],[62,40,1.5],[68,24,2],[72,8,1.5],[82,16,1.5]],[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,3],[0,8],[8,9],[9,10],[10,11],[11,12],[12,10]]]};
// a sparkle: four long points round a bright core
const sparkle=(x,y,r)=>`<path d="M${x} ${y-r*1.9}Q${x+r*.28} ${y-r*.28} ${x+r*1.9} ${y}Q${x+r*.28} ${y+r*.28} ${x} ${y+r*1.9}Q${x-r*.28} ${y+r*.28} ${x-r*1.9} ${y}Q${x-r*.28} ${y-r*.28} ${x} ${y-r*1.9}Z"/><circle cx="${x}" cy="${y}" r="${r*.42}" fill="#FFF6DA"/>`;
const constellation=id=>{const [st,ln]=CONST[id]||[[],[]];
 return `<svg class="hsp-c" viewBox="0 0 100 80" aria-hidden="true"><g class="hsp-cl">${ln.map(([a,b])=>`<line x1="${st[a][0]}" y1="${st[a][1]}" x2="${st[b][0]}" y2="${st[b][1]}"/>`).join('')}</g><g class="hsp-cs">${st.map(([x,y,r])=>sparkle(x,y,r*.75)).join('')}</g></svg>`};
const SIGN_BLURB={aries:'Ariens are natural pioneers, bold and direct. You bring energy, honesty and a fresh start to everything you touch.',taurus:'Taureans are natural steadiers, calm and dependable. You bring comfort, beauty and a patient strength to the world.',gemini:'Geminis are natural connectors, bright and adaptable. You bring wit, ideas and a gift for conversation to the world.',cancer:'Cancerians are natural carers, sensitive and wise. You bring warmth, memory and a sense of home to the world.',leo:'Leos are natural performers, warm and loyal. You bring joy, courage and a generous heart to the world.',virgo:'Virgos are natural healers, precise and kind. You bring order, care and quiet usefulness to the world.',libra:'Libras are natural peacemakers, always seeking harmony, truth and deeper connection. You bring beauty, fairness and a unique perspective to the world.',scorpio:'Scorpios are natural alchemists, passionate and perceptive. You bring depth, loyalty and transformation to the world.',sagittarius:'Sagittarians are natural explorers, optimistic and free. You bring adventure, humour and big questions to the world.',capricorn:'Capricorns are natural builders, steady and wise. You bring discipline, ambition and lasting foundations to the world.',aquarius:'Aquarians are natural reformers, inventive and friendly. You bring vision, independence and a love of humanity to the world.',pisces:'Pisceans are natural mystics, gentle and imaginative. You bring compassion, art and intuition to the world.'};
const SHORT_DATES=s=>s.dates.replace(/(\d+) (\w{3})\w*/g,'$1 $2');
// a few words for each area of life, from how its planet sits with the reader's sign this period
const THEME={overview:{same:'All eyes on you',ease:'Flow and ease',friction:'Growth through challenge',mirror:'Find the balance',quiet:'A quieter, inward time'},
 love:{same:'Magnetic and seen',ease:'Deeper emotional connection',friction:'Honest words heal',mirror:'Meet them halfway',quiet:'Gentle, steady warmth'},
 family:{same:'Your voice matters',ease:'Warm energy',friction:'Patience at home',mirror:'Make room for theirs',quiet:'Simple time together'},
 health:{same:'Energy runs high',ease:'Rest and recharge',friction:'Ease the pressure',mirror:'Balance give and take',quiet:'Small routines help'},
 career:{same:'Step into view',ease:'Progress through collaboration',friction:'Push with patience',mirror:'Listen, then lead',quiet:'Quiet, steady work'},
 money:{same:'Trust your judgement',ease:'Favourable for long-term plans',friction:'Review before you spend',mirror:'Clear shared terms',quiet:'Good time to plan and save'}};
// the same, in two words for Home's five insight tiles (as the mockup words them: "Deeper connection", "Rest and recharge")
const TILE={love:{same:'Magnetic and seen',ease:'Deeper connection',friction:'Honest words heal',mirror:'Meet halfway',quiet:'Gentle warmth'},
 family:{same:'Your voice matters',ease:'Warm energy',friction:'Patience at home',mirror:'Make room',quiet:'Time together'},
 health:{same:'Energy runs high',ease:'Rest and recharge',friction:'Ease the pressure',mirror:'Find balance',quiet:'Small routines'},
 career:{same:'Step into view',ease:'Progress ahead',friction:'Push with patience',mirror:'Listen, then lead',quiet:'Steady work'},
 money:{same:'Trust yourself',ease:'Favourable day',friction:'Review spending',mirror:'Clear terms',quiet:'Plan and save'}};
const CAT_INFO={overview:['Overall','Your big picture','general'],love:['Love','Relationships','love'],family:['Family','Home & loved ones','family'],health:['Health','Wellbeing','health'],career:['Career','Work & purpose','career'],money:['Money','Finances','finance']};
const catIco=(cat,cls='cat-ico')=>ui('ico-'+cat,cls);
// the whispers' symbols, each with three words to carry through the day
const WKEYS={moon:['Intuition','Rest','Reflection'],sun:['Vitality','Joy','Clarity'],star:['Hope','Renewal','Guidance'],path:['Patience','Direction','Trust'],key:['Insight','Opportunity','Answers'],flower:['Growth','Beauty','Openness'],eye:['Awareness','Truth','Intuition'],ship:['Journey','Courage','Change'],tree:['Roots','Strength','Patience'],wheel:['Cycles','Change','Timing'],lily:['Peace','Grace','Healing'],crystal:['Clarity','Focus','Protection']};
const wKeys=c=>WKEYS[c.sym]||WKEYS.star;
const AFFIRM=['I am supported, even when I don’t see it','I can move forward with more trust','I choose to stay open to new possibilities','I give myself permission to rest','I trust the timing of my life','I speak to myself with kindness','I let go of what I cannot control','I notice the small gifts of today','I am allowed to change my mind','I honour what I feel without judging it','I make room for joy','I take one brave step today'];
const PROMPTS={n:['What is this card teaching me right now?','Where can I invite more of this energy?','What do I want to manifest or release?'],
 r:['Which card spoke to me first, and why?','What are these cards asking me to change?','What would I tell a friend who drew this spread?'],
 h:['Where did I feel this forecast today?','What would I like to nurture this period?','What am I ready to let go of?'],
 e:['What is coming into view for me?','What does this moment in the sky stir in me?','What intention will I set?'],
 c:['What do I value most in this bond?','Where could we meet each other halfway?','What do I want to say but haven’t yet?'],
 d:['What feeling stayed with me after waking?','Where in my waking life do I feel like this?','What might this dream be asking me to notice?'],
 j:['What happened today that I want to remember?','What am I grateful for?','What is on my mind right now?']};
// what each kind of kept item is called, the star it wears in the journal list, and its filter
const JKIND={n:['Daily Whisper','gold','tarot'],r:['Tarot Reading','burg','tarot'],h:['Horoscope','ink','horoscope'],e:['Cosmic Event','navy','horoscope'],c:['Connection','burg','connections'],d:['Dream','navy','dreams'],j:['Free Write','gold','free']};
const EVKEY={new_moon:'New beginnings • Intention',first_quarter:'Action • Decision',full_moon:'Culmination • Clarity • Gratitude',last_quarter:'Reflection • Letting go',lunar_eclipse:'Transformation • Letting go',solar_eclipse:'Fresh starts • New chapters',station_retro:'Review • Revise • Reflect',station_direct:'Momentum returns',equinox:'Balance • Turning point',solstice:'Threshold • Light and rest',conjunction:'A new cycle • Meeting',opposition:'Visibility • Culmination',elongation:'Sky-watching',perihelion:'Rhythm',aphelion:'Rhythm',meteor:'Wishes • Wonder'};
const evKeys=e=>e.k==='ingress'?`${SIGN_KEYS[sIdx(e.sign).id][2]} • ${SIGN_KEYS[sIdx(e.sign).id][0]}`:EVKEY[e.k]||'';
// a picture for each kind of sky event: the painted Moon for its phases, and the mockups' eclipse, planet and full moon plates
function evArt(e,round){
 const ph=e.type==='moon'?phaseSlug(e.name):'';
 if(round&&ph)return pic('moons',ph,'ev-r');
 // in a circle: the planet's own painting (the same as on the Planets pages), the Sun's for the seasons and the Sun's
 // signs, and frameless crops of the eclipse and meteor plates
 if(round){const pn=(String(e.name).match(/Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto/)||[])[0]||(e.planet!=='Sun'&&e.planet!=='Moon'&&e.planet)||'';
  if(/eclipse/.test(e.k))return ui('ev-eclipse-r','ev-r');
  if(e.type==='meteor')return ui('ev-meteor-r','ev-r');
  if(pn)return ui('pl-'+pn.toLowerCase(),'ev-r');
  if(e.type==='season'||e.planet==='Sun')return ui('pl-sun','ev-r')}
 const id=/eclipse/.test(e.k)?'ev-eclipse':ph==='full-moon'?'ev-full':ph==='new-moon'?'ev-new':ph?'ev-quarter':e.type==='season'||(e.k==='ingress'&&e.planet==='Sun')?'ev-sun':e.type==='meteor'?'ev-meteor':'ev-planet';
 return ui(id,round?'ev-r':'ev-img');
}

/* ---------- birth details and calculated profile ---------- */
const hasBirthDate=()=>/^\d{4}-\d\d-\d\d$/.test(S.birth.date||'');
const hasPlace=b=>b.lat!==''&&b.lat!=null&&b.lon!==''&&b.lon!=null&&!!b.tz;
let chartCache={k:'',c:null};
function myChart(){
 if(!A||!hasBirthDate())return null;
 const b=Object.assign({},S.birth);if(!b.tz){b.unk=true;b.tz=TZ()}const k=JSON.stringify(b);
 if(chartCache.k!==k){try{chartCache={k,c:K.chart(b)}}catch(e){chartCache={k,c:null}}}
 return chartCache.c;
}
// a chart for anyone's birth details (a New search on Birth Chart), without touching the reader's own
function chartOf(b){if(!A||!b||!/^\d{4}-\d\d-\d\d$/.test(b.date||''))return null;const x=Object.assign({},b);if(!x.tz){x.unk=true;x.tz=TZ()}try{return K.chart(x)}catch(e){return null}}
// the readings drawn from the Cosmic Profile. Without the reader's details: an invitation to complete the profile, or a
// New search for anyone else. With them: the reader's own reading first, and New search beneath it. A search never
// changes the profile.
const invite=(what,k)=>mbox(`<p class="lead">${what}</p><button class="btn" data-act="cpopen">Complete my Birth Details</button><button class="btn ghost" data-act="nsearch" data-k="${k}">New search</button>`);
const nsBtn=k=>`<button class="btn ghost" data-act="nsearch" data-k="${k}">New search</button>`;
const mineBtn=(k,has)=>has?`<button class="btn ghost" data-act="nsmine" data-k="${k}">Back to my own reading</button>`:`<button class="btn ghost" data-act="cpopen">Complete my Birth Details</button>`;
const nameNums=nm=>nm&&N.clean(nm)?N.name(nm,S.settings.yMode):null;

/* ---------- views ---------- */
const views={};
/* Onboarding: four pages of one illustrated book (docs/mockups/ob2-*). Welcome; Ancient Wisdom, the woman before the
   moon and what Kosmia holds; the sign, chosen with one tap on its medallion; the account, which asks the reader's name;
   then, if they wish, When Were You Born? (without accounts, local mode, the tap on the sign leads straight there; when
   already signed in, it opens Kosmia). Signing in has its own page, Welcome Back. Notifications wait in the profile. */
const needAcct=()=>C.enabled&&!C.user;
// the sign the reader would be, from a birthday (by the Sun's usual dates; the chart confirms it later)
function signFromDate(d){const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(d||'');if(!m)return '';const md=+m[2]*100+ +m[3];
 const cut=[[120,'capricorn'],[219,'aquarius'],[320,'pisces'],[420,'aries'],[521,'taurus'],[621,'gemini'],[722,'cancer'],[823,'leo'],[923,'virgo'],[1023,'libra'],[1122,'scorpio'],[1222,'sagittarius'],[1232,'capricorn']];
 return cut.find(([c])=>md<c)[1]}
function pwRules(p){return [[p.length>=8,'At least 8 characters'],[/\d/.test(p),'Include a number'],[/[a-z]/i.test(p),'Include a letter']]}
const pwField=(id,label,ph,auto)=>`<div class="field"><label for="${id}">${label}</label><div class="inp">${IC.lock}<input id="${id}" type="password" autocomplete="${auto}" placeholder="${ph}" minlength="6" required><button type="button" class="eye" data-act="pweye" data-for="${id}" aria-label="Show password">${IC.eye}</button></div></div>`;
// the painted layers behind an onboarding page, each in its own place (.obl-*): out of the way of taps and of screen readers
const obBg=(...layers)=>`<div class="obg" aria-hidden="true">${layers.map(([id,cls,pri])=>ui(id,'obl '+cls,'',pri!==false)).join('')}</div>`;
// the fine gold rule with a star at its centre, as the mockups set under their titles and above their last links
const obRule=(cls='')=>`<span class="ob-rule${cls?' '+cls:''}" aria-hidden="true">${Kit.icon('star')}</span>`;
// the golden sunset rising from the foot of every page, and the crown of night with its crescent over a parchment page
const SUNSET=['ob-sunset','obl-foot',false],CROWN=['ob-crescent','obl-crown'];
// the name Kosmia speaks to the reader by, asked first on Create Your Account
const nameField=()=>`<div class="field"><label for="obn">What shall the stars call you?</label><div class="inp">${IC.star}<input id="obn" type="text" autocomplete="given-name" autocapitalize="words" placeholder="Your first name" value="${esc(S.name)}"></div></div>`;
// Not sure of your sign?: a card of the app's own (the atlas frame on Written for You's night glass) over the zodiac,
// asking the birthday; the sign it names appears beneath, its medallion, name and dates, with the button that chooses it
const bdayPop=()=>`<div class="obz" role="dialog" aria-modal="true" aria-labelledby="obzt"><button class="obz-veil" data-act="bdayclose" tabindex="-1" aria-label="Close"></button>
 <div class="obz-card"><button class="obz-x" data-act="bdayclose" aria-label="Close">×</button>
 <p class="pz-k">${Kit.icon('star')}<span>Your Sun Sign</span>${Kit.icon('star')}</p><h2 class="obz-t" id="obzt">Find Your Sign</h2>
 <p class="obz-d">It is written in the day you were born.</p>
 <div class="field"><label for="obd">Your birthday</label><div class="inp">${IC.cal}<input type="date" id="obd" value="${esc(V.joinBirth||'')}"></div></div>${bdayRes()}</div></div>`;
const bdayRes=()=>{const id=signFromDate(V.joinBirth),s=id?sg(id):null;
 return `<div class="obz-res" role="status" data-k="${id}">${s?`${ui('zm-'+id,'obz-m')}<p class="obz-s">You are ${s.name}</p><p class="obz-d">${s.dates}</p><button class="btn" data-sign="${id}">Continue as ${s.name} →</button>`:''}</div>`};
const OB_FEATS=[['obm-sun','Personalised horoscopes','Daily, weekly, monthly and beyond'],['obm-tarot','Tarot and daily Whispers','Guidance for your journey'],['obm-moon','Astrology and numerology','Discover your unique blueprint'],['obm-star','Cosmic calendar','Follow the energy of the universe'],['obm-dream','Dream interpretation','Decode the messages within'],['kassandra','Kassandra, your AI oracle','Always here for your questions']];
views.welcome=()=>{
 const st=V.ob,s=V.joinSign?sg(V.joinSign):null;
 // Ancient Wisdom: the painting of the woman under the full Moon by the bay (ob-intro2), its words set where the painting
 // leaves room for them, the six gifts on parchment rows with their medallions, and the night button at its foot
 if(st==='intro')return `<div class="ob ob2 ob2-intro">${ui('ob-intro2','ob2-bg','',true)}${iconBtn('back','data-act="obstep" data-to="welcome"','Back')}
  <div class="ob2-in"><div class="ob2-hd"><h1 class="ob2-h">Ancient Wisdom<br>for Modern Life</h1><p class="ob2-lead">Explore the cosmos and discover a deeper<br>understanding of yourself.</p></div><div class="ob2-md"></div>
  <ul class="ob2-list">${OB_FEATS.map(([i,t,d])=>`<li><span class="obi-med">${ui(i,'obi-k')}</span><span><strong>${t}</strong><span>${d}</span></span></li>`).join('')}</ul>
  <div class="ob2-ft"><button class="ob2-btn ob2-go" data-act="obnext" data-to="sign">Let’s Begin <span aria-hidden="true">→</span></button></div></div></div>`;
 // the zodiac: the Sun and the crescent over the lake at dawn (zs-night), the twelve medallions in the night between
 if(st==='sign')return `<div class="ob ob2 ob2-sign">${ui('zs-night','ob2-bg','',true)}${iconBtn('back','data-act="obstep" data-to="intro"','Back')}<div class="ob2-in">
  <div class="ob2-hd"><h1 class="ob2-h">What’s your<br>zodiac sign?</h1><p class="ob2-lead">Choose your sun sign to personalise<br>your cosmic experience.</p></div>
  <div class="ob2-md"><div class="zgrid ob2-z${s?' has':''}" role="radiogroup" aria-label="Your zodiac sign">${SIGNS.map(x=>`<button class="zg-s" role="radio" aria-checked="${V.joinSign===x.id}" data-sign="${x.id}" aria-label="${x.name}, ${x.dates}">${ui('zm-'+x.id,'zg-m')}<span>${x.name}</span></button>`).join('')}</div></div>
  <div class="ob2-ft"><button class="ob2-ns" data-act="bdayopen">Not sure of your sign?</button></div></div>${V.bdayOpen?bdayPop():''}</div>`;
 // When Were You Born? (optional): the birthday given on the zodiac page already in place, the time and place if known,
 // and the reader's choice to keep them in their account, as on the Profile; Skip for now leads straight in
 if(st==='birth'){const b=V.birthDraft||(V.birthDraft=Object.assign({},S.birth,!S.birth.date&&V.joinBirth?{date:V.joinBirth}:{}));
  return `<div class="ob ob3 ob3-acct ob3-birth">${C.enabled?'':iconBtn('back','data-act="obstep" data-to="sign"','Back')}
  <div class="ob3-head"><h1>When Were<br>You Born?</h1>${obRule()}<p class="ob3-lead">${firstName()?esc(firstName())+', your':'Your'} birth chart and cycles begin with this moment.</p></div>
  <div class="ob3-panel">${C.enabled?'':nameField()}
  <div class="field"><label for="bd">Date of birth</label><div class="inp">${IC.cal}<input type="date" id="bd" value="${esc(b.date)}"></div></div>
  ${b.unk?'':`<div class="field"><label for="bt">Time of birth</label><div class="inp">${IC.history}<input type="time" id="bt" value="${esc(b.time)}"></div></div>`}
  <label class="row"><input type="checkbox" id="bu" ${b.unk?'checked':''} class="cb"> I don’t know my birth time</label>${placeField('birth',b)}
  <label class="row consent"><input type="checkbox" id="bcons" ${S.birthConsent?'checked':''} class="cb"> <span>Keep them in my account so they sync across my devices. Private to me.</span></label>
  <button class="btn" data-act="obbirth">Continue →</button><p class="auth-alt"><button type="button" class="link" data-act="obskip">Skip for now</button></p></div></div>`}
 // Create Your Account and Welcome Back: the night paintings (acct-*, wb-*: their heads at the top, their dawns at the foot,
 // the night between) and the form on night glass framed in gold, as every page of the app
 if(st==='account')return `<div class="ob ob3 ob3-acct">${iconBtn('back','data-act="obstep" data-to="sign"','Back')}
  <div class="ob3-head"><h1>Create Your<br>Account</h1>${obRule()}<p class="ob3-lead">Join Kosmia and start your<br>journey of self-discovery.</p></div>
  <form id="authForm" class="ob3-panel" novalidate>${nameField()}<div class="field"><label for="em">Email address</label><div class="inp">${IC.mail}<input id="em" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" value="${esc(S.email)}" required></div></div>
  ${pwField('pw','Create a password','At least 8 characters','new-password')}
  <ul class="pw-rules" id="pwRules" aria-live="polite">${pwRules('').map(([ok,t])=>`<li class="${ok?'ok':''}">${t}</li>`).join('')}</ul>
  <p class="auth-err" id="authErr" role="alert"></p><button class="btn" id="joinBtn" type="submit">Continue →</button>
  <p class="auth-alt">Already have an account? <button type="button" class="link" data-act="obstep" data-to="signin">Sign in</button></p></form></div>`;
 if(st==='signin')return `<div class="ob ob3 ob3-wb">${iconBtn('back','data-act="obstep" data-to="welcome"','Back')}
  <div class="ob3-head"><h1>Welcome Back</h1>${obRule()}<p class="ob3-lead">Sign in to return to your cosmic journey.</p></div>
  <form id="authForm" class="ob3-panel" novalidate><div class="field"><label for="em">Email address</label><div class="inp">${IC.mail}<input id="em" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" value="${esc(S.email)}" required></div></div>
  ${pwField('pw','Password','Your password','current-password')}<p class="auth-err" id="authErr" role="alert"></p><button class="btn" id="joinBtn" type="submit">Sign in →</button>
  <p class="auth-alt"><button type="button" class="link" data-act="forgot">Forgot password?</button></p>${obRule()}<p class="auth-alt">New to Kosmia? <button type="button" class="link" data-act="obstep" data-to="sign">Begin your journey</button></p></form></div>`;
 if(st==='verify')return `<div class="ob ob-paper ob-form ob-signin">${obBg(CROWN,SUNSET)}<div class="ob-mail">${IC.mail}</div><h1>Check Your Inbox</h1><p class="ob-lead">We’ve sent a link to <strong>${esc(S.email)}</strong>. Open it to activate your account, then sign in here.</p>
  <div class="ob-fields"><button class="btn" data-act="obstep" data-to="signin">I’ve verified, sign in →</button><button class="btn ghost" data-act="resend">Send the link again</button></div></div>`;
 // the welcome: the Sun and the crescent over the bay at night (ob-welcome2), the name and its promise in the sky, the
 // night button glowing over the water
 return `<div class="ob ob2 ob2-wel">${ui('ob-welcome2','ob2-bg','',true)}<div class="ob2-in">
  <div class="ob2-hd"><h1 class="ob2-logo">Kosmia</h1><p class="ob2-tag">Your cosmic guide<br>for a more aligned you</p></div>
  <div class="ob2-ft"><p class="ob2-tags">Astrology <i>✦</i> Tarot <i>✦</i> Guidance<br>Self discovery <i>✦</i> Cosmic connection</p>
  <button class="ob2-btn ob2-begin" data-act="obnext" data-to="intro">Begin Your Journey <span aria-hidden="true">→</span></button>
  ${C.enabled&&!C.user?'<p class="ob2-alt">Already have an account? <button class="link" data-act="obstep" data-to="signin">Sign in</button></p>':''}</div></div></div>`;
};
views.join=views.welcome;
views.reset=()=>`<div class="ob ob-paper ob-form ob-signin">${obBg(CROWN,SUNSET)}${obRule('lone')}<h1>Choose a New Password</h1><div class="ob-fields">${pwField('npw','New password','At least 8 characters','new-password')}<button class="btn" data-act="setpw">Save password</button></div></div>`;
// a sign's framed plate, its glyph set in a medallion at the foot of the arch
// a wide cartouche (Cancer, Capricorn) takes a medallion painted to its own outline; the others the round one
const signArt=id=>`<span class="sp-plate g-${id}">${ui('plate-'+id,'sign-plate',sg(id).name)}${Kit.size('atlas/sgmw-'+id)?ui('sgmw-'+id,'sp-gmw'):glyphMed(id,'sp-gm')}</span>`;
function obValid(){
 const em=$('#em'),pw=$('#pw'),up=V.ob==='account';
 const okEm=!!em&&/^\S+@\S+\.\S+$/.test(em.value.trim()),p=pw?pw.value:'';
 if(!up)return {ok:okEm&&p.length>=6};
 const rules=pwRules(p),n=rules.filter(r=>r[0]).length;
 return {ok:okEm&&n===3,rules,n};
}
function syncJoin(){
 const b=$('#joinBtn');if(!b)return;const v=obValid();
 if(v.rules){$('#pwRules').innerHTML=v.rules.map(([ok,t])=>`<li class="${ok?'ok':''}">${t}</li>`).join('');
  const err=$('#authErr');if(err&&!V.busy)err.textContent=''}
 b.disabled=!v.ok||V.busy;b.textContent=V.busy?'One moment…':V.ob==='account'?'Continue →':'Sign in →';
}
const authMsg=x=>{const m=(x&&x.message)||'';
 if(/invalid login/i.test(m))return 'That email and password don’t match.';
 if(/not confirmed/i.test(m))return 'Please open the link we emailed you to activate your account first.';
 if(/already (registered|exists)/i.test(m))return 'An account already exists for this email. Sign in instead.';
 if(/rate limit|too many/i.test(m))return 'Too many attempts. Please wait a minute and try again.';
 return m||'Something went wrong. Please try again.'};
// into Kosmia from onboarding
function enterApp(){V.obHold=false;V.bdayOpen=false;V.ob='welcome';go('home','today',{replace:true})}
// one tap on a medallion chooses the sign: it lights for a moment, then the account (or, without one to make, When Were
// You Born?; already signed in, Kosmia)
let pickT=0;
function pickSign(id){
 V.joinSign=id;V.bdayOpen=false;render();clearTimeout(pickT);
 pickT=setTimeout(()=>{if(!onboarding()||V.ob!=='sign')return;
  if(needAcct()){V.ob='account';V.bdayOpen=false;render();return window.scrollTo(0,0)}
  S.sign=id;save();if(C.user){syncProfile();return enterApp()}
  V.obHold=true;V.ob='birth';V.bdayOpen=false;render()},matchMedia('(prefers-reduced-motion: reduce)').matches?60:320)}
// leaving When Were You Born?: the name (asked there when there was no account to make) and, on Continue, the birth
// details, kept as the Profile keeps them
function obBirth(keep){
 const n=$('#obn');if(n&&n.value.trim())S.name=n.value.trim();
 if(keep){readBirth();const b=V.birthDraft;if(!b.date)return toast('Add your date of birth, or skip for now');
  S.birth=Object.assign({},b,{time:b.unk?'':b.time});delete S.birth.name;S.birthConsent=$('#bcons').checked}
 V.birthDraft=null;save();syncProfile();enterApp()}
async function submitJoin(e){
 e.preventDefault();if($('#joinBtn').disabled)return;
 const email=$('#em').value.trim(),pw=$('#pw').value,err=$('#authErr');
 V.busy=true;syncJoin();if(err)err.textContent='';
 try{
  if(V.ob==='account'){
   const nm=$('#obn').value.trim();if(nm)S.name=nm;
   S.email=email;S.sign=V.joinSign;save();
   const r=await C.signUp(email,pw,V.joinSign);
   // with email confirmation on, the account waits for its link; otherwise the reader is signed in and asked, if they
   // wish, when they were born
   V.busy=false;V.obHold=true;V.ob=r.session?'birth':'verify';render();
  }else{if(S.email&&S.email.toLowerCase()!==email.toLowerCase()){const js=V.joinSign;try{localStorage.removeItem('kosmia.h')}catch(x){}S=fresh();KS.msgs=[];V.joinSign=js}await C.signIn(email,pw);S.email=email;save();V.busy=false}
  // signing in: the auth listener runs pullMerge, which opens Kosmia once the profile has a sign
 }catch(x){V.busy=false;syncJoin();if(err)err.textContent=authMsg(x)}
}
function bindJoin(){const f=$('#authForm');if(!f)return;f.addEventListener('input',syncJoin);f.addEventListener('submit',submitJoin);syncJoin()}
// a screen shorter than the painting (the app's column wider than half the screen's height): the zodiac in four columns
// and Ancient Wisdom's button nearer the foot; shorter still, the lines that can give way do (measured by the column, so
// a wide window is judged by the app's own width)
function obShape(){const o=$('.ob.ob2'),i=o&&o.querySelector('.ob2-in');if(!i)return;const r=i.offsetWidth/document.documentElement.clientHeight;
 o.classList.toggle('ob2-short',r>=.5);o.classList.toggle('ob2-shorter',r>=.65)}
addEventListener('resize',obShape);
/* ----- Home: a personal celestial dashboard, like opening an enchanted almanac. The day's forecast at the top, the daily
   rituals in the middle (insights for each area of life, the Whisper, the Moon's energy), discoveries further down. ----- */
// a small engraved moon showing the lit fraction (waxing lit on the right, as seen from the northern hemisphere)
// the painted phase (art/moons) for the Moon's current phase, falling back to the drawn disc
const moonPic=(m,cls='moon-pic')=>pic('moons',m.name.toLowerCase().replace(/ /g,'-'),cls)||moonSvg(m);
function moonSvg(m,size=64){
 const r=28,k=Math.cos(m.ang*Math.PI/180),rx=Math.abs(k)*r,lit=m.waxing?1:0;
 const outer=`M50 ${50-r}A${r} ${r} 0 0 ${lit} 50 ${50+r}`,inner=`A${rx} ${r} 0 0 ${(k>0)===!lit?1:0} 50 ${50-r}`;
 return `<svg class="moon-svg" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="${r}" fill="#1B2440" stroke="#B8924F" stroke-width="1"/><path d="${outer}${inner}Z" fill="#F3E6C8" stroke="#B8924F" stroke-width="1"/><circle cx="50" cy="50" r="${r}" fill="none" stroke="#B8924F" stroke-width="1.2"/></svg>`;
}
const MOON_LINE={'New Moon':'A dark sky for new beginnings. Plant one quiet intention and let it grow in its own time.','Waxing Crescent':'A first thin light. Take the smallest step towards what you hope for.','First Quarter':'Half lit and gathering strength: a time to decide, and to act on it.','Waxing Gibbous':'Nearly full. Refine your plans and trust what is already growing.','Full Moon':'Fully lit: a time of clarity, culmination and gratitude for how far you have come.','Waning Gibbous':'A time to release what no longer serves you and create space for new possibilities.','Last Quarter':'Half dark again: forgive, clear away and make room.','Waning Crescent':'The last sliver before the dark. Rest, and let the cycle close gently.'};
const nextEvent=now=>upcoming().find(e=>e.date>now);
const greet=()=>{const h=Number(fmt({hour:'numeric',hour12:false},new Date()));return h<5||h>=18?'Good evening':h<12?'Good morning':'Good afternoon'};
const firstName=()=>(S.name||S.fullName||'').trim().split(/\s+/)[0]||'';
// the reader's own medallion, at the top right of Home: their profile, birth details, notifications and plan
const myFace=(cls='av-i')=>S.photo?`<img class="${cls}" src="${S.photo}" alt="">`:med(S.sign||'aries',cls);
const avatar=()=>`<button class="avatar" data-go="you" aria-label="My Cosmos">${myFace()}</button>`;
// a picture chosen from the device, cut to a square at its centre and kept small (320 px) on this device and in the account
function setPhoto(file){
 if(!file||!/^image\//.test(file.type))return toast('Please choose a picture.');
 const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const n=320,c=document.createElement('canvas');c.width=c.height=n;const s0=Math.min(im.width,im.height);
  c.getContext('2d').drawImage(im,(im.width-s0)/2,(im.height-s0)/2,s0,s0,0,0,n,n);S.photo=c.toDataURL('image/jpeg',.82);save();render();toast('Your picture is in place.')};
  im.onerror=()=>toast('That picture could not be opened.');im.src=r.result};r.readAsDataURL(file)}
// a whisper's number in the deck of 100, as the numeral on its card
const ROMAN=n=>[[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']].reduce((s,[v,r])=>{while(n>=v){s+=r;n-=v}return s},'');
const wNum=c=>{const i=(globalThis.KOSMIA_WHISPERS||[]).findIndex(w=>w[0]===c.id);return i<0?'':ROMAN(i+1)};
// the forecast on Home's card: whole sentences, as many as fit the card (about 150 letters), always at least one
// a horoscope's summary for a card: its opening sentences, up to about two lines' worth
const hSum=t=>(t.match(/[^.!?]+[.!?]+/g)||[t]).reduce((o,x)=>!o||(o+x).trim().length<=190?(o+x):o,'').trim();
const hShort=t=>(t.match(/[^.!?]+[.!?]+/g)||[t]).reduce((o,x)=>!o||(o+x).trim().length<=150?(o+x):o,'').trim();
// Today's Cosmic Energy as a carousel: the Moon, the next event in the sky, a planet turning retrograde, the season's sign
// and the day's energy for the reader's sign, each in the same floating panel and each opening its own page
function energySlides(now,m,sign,h){
 const sl=[[moonPic(m,'en-moon'),`${m.name}<br>in ${sIdx(m.sign).name}`,MOON_LINE[m.name]||'','data-go="discover" data-t="moon"']];
 const ev=upcoming().find(e=>['eclipse','meteor','conjunction','season','planet'].includes(e.type)&&e.date>now);
 const pn=ev&&(ev.name.match(/Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto/)||[])[0];
 if(ev)sl.push([pn?ui('pl-'+pn.toLowerCase(),'en-moon'):ev.type==='season'?ui('pl-sun','en-moon'):evArt(ev,true).replace('ev-r','en-moon'),esc(ev.name),`${ymdLong(dkey(ev.date),{day:'numeric',month:'long'})} · ${esc(evKeys(ev))}`,`data-cal="open" data-ref="${esc(evRef(ev))}"`]);
 const rx=K.retrogrades(now,new Date(+now+120*DAY)).find(w=>w.start&&w.start<=now&&(!w.end||w.end>=now))||K.retrogrades(now,new Date(+now+120*DAY)).find(w=>w.start&&w.start>now);
 if(rx){const on=rx.start<=now;sl.push([ui('pl-'+rx.planet.toLowerCase(),'en-moon'),`${rx.planet} ${on?'retrograde':'turns retrograde'}`,on?`Until ${rx.end?ymdLong(dkey(rx.end),{day:'numeric',month:'long'}):'next year'}: a time to review ${PM[rx.planet]}.`:`From ${ymdLong(dkey(rx.start),{day:'numeric',month:'long'})}: a time to review ${PM[rx.planet]}.`,'data-go="discover" data-t="planets"'])}
 const sun=sIdx(K.signIdx(K.positions(now)[0].lon));
 sl.push([ui('pl-sun','en-moon'),`The Sun<br>in ${sun.name}`,`${sun.name} season colours everyone’s days: ${SIGN_KEYS[sun.id].join(', ').toLowerCase()}.`,`data-act="tohoroscope"`]);
 sl.push([ui('m-'+sign.id,'en-moon'),`${sign.name}’s energy today`,esc(h.focus||''),`data-act="tohoroscope"`]);
 return sl;
}
const energyCarousel=sl=>`<div class="energy en-car"><span class="en-in"><span class="orn-s">${Kit.icon('star')} Today’s Cosmic Energy ${Kit.icon('star')}</span>
 <span class="en-track" aria-roledescription="carousel">${sl.map(([img,t,line,attrs],i)=>`<span class="en-slot"><button class="en-row en-slide" ${attrs}>${img}<span><strong>${t}</strong><span>${line}</span></span><span class="en-go">${IC.chev}</span><span class="sr-only">, ${i+1} of ${sl.length}</span></button></span>`).join('')}</span>
 <span class="en-dots" aria-hidden="true">${sl.map((_,i)=>`<i${i?'':' class="on"'}></i>`).join('')}</span></span></div>`;
// the Daily Whisper's card enlarged, to see it in detail
// the Daily Whisper's card opened from Home on the parchment sheet a tarot card opens on: its name, the card, its message
// and its question
/* ----- shareable cards: a reading drawn onto its approved design (art/share/*, 1080 px wide) on a canvas, the words set
   in the space each design leaves for them and shrunk until they fit; then the phone's own share sheet (WhatsApp,
   Telegram, Instagram…), or the picture to save where sharing files is not offered. Places are in the design's own
   pixels (w wide) and scaled to the canvas. ----- */
const SHARE_T={
 horo:{w:402,med:[202,190,78],glyph:[201,234,24],name:[203,278],label:[202,309],body:[58,333,344,415]},
 whisper:{w:403,card:[58,272,90,135],text:[164,284,336,404],q:[118,464,292,516]},
 tarot:{w:402,cards:[[139,167,124,215]],plate:[202,403],text:[64,463,340,511]},
 t3:{w:297,cards:[[30,125,74,126],[111,125,75,126],[193,125,75,126]],plate:[150,102],labels:265,text:[50,321,250,395]},
 t5:{w:298,cards:[[19,137,49,95],[72,137,49,95],[125,137,49,95],[178,137,49,95],[232,137,49,95]],plate:[150,101],text:[50,321,250,395]},
 t10:{w:297,cards:[30,78,127,175,224].map(x=>[x,120,44,72]).concat([30,78,127,175,224].map(x=>[x,196,44,73])),plate:[149,101],text:[50,321,250,395]}
};
const INK='#3B2412',SH_FONTS=['600 40px Cinzel','500 40px "Cormorant Garamond"','italic 500 40px "Cormorant Garamond"'];
const shImg=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src});
// words wrapped into a box, the largest size from max down to min at which they fit; failing that the last sentences
// give way, and at the end the last words
function shFit(x,txt,[x0,y0,x1,y1],o){
 const k=o.k,W=(x1-x0)*k,H=(y1-y0)*k,face=s=>`${o.italic?'italic ':''}${o.weight||500} ${s}px ${o.family||'"Cormorant Garamond"'}`;
 const wrap=(t,s)=>{x.font=face(s);const out=[];let line='';for(const w of t.split(/\s+/)){const tr=line?line+' '+w:w;if(x.measureText(tr).width>W&&line){out.push(line);line=w}else line=tr}if(line)out.push(line);return out};
 let t=String(txt||'').replace(/\s+/g,' ').trim(),s,lines;
 for(;;){for(s=o.max*k;s>=o.min*k;s-=k*.5){lines=wrap(t,s);if(lines.length*s*(o.lh||1.28)<=H)break}
  if(lines.length*s*(o.lh||1.28)<=H)break;
  const sent=t.match(/[^.!?]+[.!?]+/g);if(sent&&sent.length>1){t=sent.slice(0,-1).join('').trim();continue}
  s=o.min*k;lines=wrap(t,s);const n=Math.max(1,Math.floor(H/(s*(o.lh||1.28))));lines=lines.slice(0,n);lines[n-1]=lines[n-1].replace(/\s*\S*$/,'')+'…';break}
 x.font=face(s);x.fillStyle=o.color||INK;x.textAlign='center';x.textBaseline='middle';
 const lh=s*(o.lh||1.28),top=y0*k+(H-lines.length*lh)/2+lh/2;
 lines.forEach((l,i)=>x.fillText(l,(x0+x1)/2*k,top+i*lh));
}
function shCaps(x,t,cx,cy,size,k,o={}){x.font=`${o.weight||600} ${size*k}px Cinzel`;x.fillStyle=o.color||INK;x.textAlign='center';x.textBaseline='middle';
 if(x.letterSpacing!==undefined)x.letterSpacing=`${(o.track||.08)*size*k}px`;let s=size;
 while(x.measureText(t).width>(o.max||999)*k&&s>5){s-=.25;x.font=`${o.weight||600} ${s*k}px Cinzel`}
 x.fillText(t,cx*k,cy*k);if(x.letterSpacing!==undefined)x.letterSpacing='0px'}
// a card's face laid over its place in the design, framed in fine gold; reversed cards turned
async function shCard(x,src,[cx,cy,w,h],k,rv,name){
 const im=await shImg(src);x.save();const X=cx*k,Y=cy*k,Wp=w*k,Hp=h*k,r=Math.min(Wp,Hp)*.06;
 x.beginPath();x.roundRect(X,Y,Wp,Hp,r);x.fillStyle='#0E1430';x.fill();x.clip();
 if(im){const s=Math.max(Wp/im.width,Hp/im.height),iw=im.width*s,ih=im.height*s;if(rv){x.translate(X+Wp/2,Y+Hp/2);x.rotate(Math.PI);x.translate(-X-Wp/2,-Y-Hp/2)}x.drawImage(im,X+(Wp-iw)/2,Y+(Hp-ih)/2,iw,ih)}
 x.restore();x.beginPath();x.roundRect(X,Y,Wp,Hp,r);x.lineWidth=Math.max(2,k*1.1);x.strokeStyle='#C9A253';x.stroke();
 if(name){const ph=Hp*.13;x.fillStyle='rgba(246,233,207,.94)';x.fillRect(X+Wp*.08,Y+Hp-ph-Hp*.04,Wp*.84,ph);x.strokeStyle='#C9A253';x.lineWidth=k*.6;x.strokeRect(X+Wp*.08,Y+Hp-ph-Hp*.04,Wp*.84,ph);
  shCaps(x,name.toUpperCase(),(X+Wp/2)/k,(Y+Hp-ph/2-Hp*.04)/k,6.4,k,{max:w*.78,track:.06})}
}
async function renderShare(kind,d){
 await Promise.all(SH_FONTS.map(f=>document.fonts.load(f).catch(()=>{})));
 const tpl=kind==='reading'?({one:'tarot',ppf:'t3',scg:'t3',love:'t5',career:'t5',celtic:'t10'}[d.spread]||'t3'):kind,T=SHARE_T[tpl];
 const bg=await shImg(`/art/share/${tpl}.webp`),c=document.createElement('canvas');c.width=bg.width;c.height=bg.height;const x=c.getContext('2d'),k=c.width/T.w;
 x.drawImage(bg,0,0);
 if(kind==='horo'){const s=sg(d.sign),h=horoscope(d.sign,d.cat,d.period),[mx,my,mr]=T.med,[gx,gy,gr]=T.glyph;
  const m=await shImg(`/art/atlas/zm-${d.sign}.webp`);x.save();x.beginPath();x.arc(mx*k,my*k,mr*k,0,7);x.clip();if(m)x.drawImage(m,(mx-mr)*k,(my-mr)*k,2*mr*k,2*mr*k);x.restore();
  x.beginPath();x.arc(mx*k,my*k,mr*k,0,7);x.lineWidth=k*1.4;x.strokeStyle='#C9A253';x.stroke();
  const gm=await shImg(`/art/atlas/sgm-${d.sign}.webp`);if(gm)x.drawImage(gm,(gx-gr*1.12)*k,(gy-gr*1.12)*k,gr*2.24*k,gr*2.24*k);
  shCaps(x,s.name.toUpperCase(),T.name[0],T.name[1],17,k,{max:96,weight:700});
  const per={daily:'Daily',weekly:'Weekly',monthly:'Monthly',yearly:'Yearly'}[d.period],lab=d.cat==='overview'?`${per} Horoscope`:`${CAT_INFO[d.cat][0]} · ${PLABEL[d.period][0]}`;
  shCaps(x,lab.toUpperCase(),T.label[0],T.label[1],9,k,{max:160,track:.14,weight:700});
  shFit(x,h.body,T.body,{k,max:15.5,min:12.5,weight:600})}
 if(kind==='whisper'){const cd=d.card;await shCard(x,`/art/whispers/${cd.id}.webp`,T.card,k,false,cd.title);
  shFit(x,`“${cd.msg}”`,T.text,{k,max:16,min:9,italic:true,weight:600});
  shFit(x,cd.ref,T.q,{k,max:13,min:8,italic:true,lh:1.22})}
 if(kind==='reading'){const cards=d.cards,many=cards.length>1;
  for(let i=0;i<cards.length&&i<T.cards.length;i++)await shCard(x,`/art/deck/${cards[i].id}.webp`,T.cards[i],k,cards[i].rv);
  if(tpl==='tarot')shCaps(x,'YOUR CARD',T.plate[0],T.plate[1],9.4,k,{max:96});
  else shCaps(x,`${cards.length} CARD READING`,T.plate[0],T.plate[1],8.6,k,{max:110});
  if(T.labels)cards.slice(0,3).forEach((cd,i)=>{const [cx,,w]=T.cards[i];shCaps(x,(cd.pos||'').toUpperCase(),cx+w/2,T.labels,7.6,k,{color:'#F3E2B8',max:w+8,track:.04})});
  const txt=!many?`${cards[0].name}${cards[0].rv?' (reversed)':''}: ${cards[0].rv?cards[0].revm:cards[0].upm}`
   :d.ai&&d.ai.whole?d.ai.whole
   :cards.length<=5?cards.map(c=>`${c.pos}: ${c.name}${c.rv?' (reversed)':''}, ${(c.rv?c.rev:c.up).split(/,\s*/)[0].toLowerCase()}`).join('. ')+'.'
   :cards.map(c=>c.name+(c.rv?' (rev.)':'')).join(' · ');
  shFit(x,txt,T.text,{k,max:many?13:15,min:many?8.5:11,weight:600})}
 return new Promise(r=>c.toBlob(r,'image/png'));
}
/* ----- the keepsake: a reading shared as one moment of the reader's sky, 1080 × 1920 (a phone's story): the night
   painting behind, a fine gold double frame, the sign's medallion or the drawn cards glowing at the centre, an
   inscription with the reader's name, sign, the day and the Moon over it, the heart of the reading in large gold italic,
   and its question, offered to whoever receives it ----- */
const KEEP_BG={page:'/art/atlas/dream-night.webp',horo:'/art/atlas/sign-sky.webp',whisper:'/art/atlas/jrn-night.webp',reading:'/art/atlas/reading-night.webp'};
const kGold='#F1D79A',kCream='#F4E8CC';
function kMoonLine(day){try{const m=K.moon(new Date(day+'T21:00:00'));return `under ${/^(New|Full)/.test(m.name)?'the':'a'} ${m.name} in ${sIdx(m.sign).name}`}catch(e){return ''}}
function kFirst(t,n=2){const s=String(t||'').match(/[^.!?]+[.!?]+/g)||[String(t||'')];return s.slice(0,n).join(' ').trim()}
function kGlow(x,cx,cy,r,a=.55){const g=x.createRadialGradient(cx,cy,r*.2,cx,cy,r);g.addColorStop(0,`rgba(246,210,140,${a})`);g.addColorStop(1,'rgba(246,210,140,0)');x.fillStyle=g;x.fillRect(cx-r,cy-r,2*r,2*r)}
function kRule(x,cy,w=360){x.strokeStyle='rgba(233,201,133,.8)';x.lineWidth=2;x.beginPath();x.moveTo(540-w/2,cy);x.lineTo(540-18,cy);x.moveTo(540+18,cy);x.lineTo(540+w/2,cy);x.stroke();
 x.font='26px "Cormorant Garamond"';x.fillStyle='#F3D896';x.textAlign='center';x.textBaseline='middle';x.fillText('✦',540,cy+1)}
async function kCardFace(x,src,X,Y,W,H,rot,rv,name){
 const im=await shImg(src);x.save();x.translate(X+W/2,Y+H/2);x.rotate(rot);
 x.shadowColor='rgba(246,200,120,.55)';x.shadowBlur=60;x.fillStyle='#0E1430';x.beginPath();x.roundRect(-W/2,-H/2,W,H,18);x.fill();x.shadowBlur=0;
 x.save();x.beginPath();x.roundRect(-W/2,-H/2,W,H,18);x.clip();if(im){if(rv)x.rotate(Math.PI);const s=Math.max(W/im.width,H/im.height);x.drawImage(im,-im.width*s/2,-im.height*s/2,im.width*s,im.height*s)}x.restore();
 x.lineWidth=4;x.strokeStyle='#D9B66E';x.beginPath();x.roundRect(-W/2,-H/2,W,H,18);x.stroke();
 if(name){x.fillStyle='rgba(246,233,207,.95)';x.fillRect(-W*.4,H/2-H*.15,W*.8,H*.1);x.strokeStyle='#C9A253';x.lineWidth=2;x.strokeRect(-W*.4,H/2-H*.15,W*.8,H*.1);
  x.font=`600 ${Math.round(H*.042)}px Cinzel`;x.fillStyle='#3B2412';x.textAlign='center';x.textBaseline='middle';x.fillText(name.toUpperCase(),0,H/2-H*.1)}
 x.restore()}
async function renderKeep(kind,d){
 await Promise.all(SH_FONTS.map(f=>document.fonts.load(f).catch(()=>{})));
 const c=document.createElement('canvas');c.width=1080;c.height=1920;const x=c.getContext('2d'),k=1;
 const bg=await shImg(KEEP_BG[kind]);if(bg){const s=Math.max(1080/bg.width,1920/bg.height);x.drawImage(bg,(1080-bg.width*s)/2,0,bg.width*s,bg.height*s)}
 // the night deepened toward the words, so they read clearly
 let g=x.createLinearGradient(0,0,0,1920);g.addColorStop(0,'rgba(6,9,22,.35)');g.addColorStop(.45,'rgba(6,9,22,.25)');g.addColorStop(.62,'rgba(6,9,22,.78)');g.addColorStop(1,'rgba(6,9,22,.9)');x.fillStyle=g;x.fillRect(0,0,1080,1920);
 // the gold double frame
 x.strokeStyle='rgba(233,201,133,.9)';x.lineWidth=3;x.strokeRect(36,36,1008,1848);x.strokeStyle='rgba(233,201,133,.45)';x.lineWidth=1.5;x.strokeRect(50,50,980,1820);
 shCaps(x,'KOSMIA',540,118,40,k,{color:kGold,track:.3,weight:600});
 x.font='italic 500 30px "Cormorant Garamond"';x.fillStyle='rgba(244,232,204,.85)';x.textAlign='center';x.fillText('your cosmic guide',540,166);
 const day=d.day||dkey(),nm=firstName(),date=ymdLong(day,{day:'numeric',month:'long',year:'numeric'});
 let title,sub,heart,ask,signName;
 if(kind==='horo'){const s=sg(d.sign),h=horoscope(d.sign,d.cat,d.period);signName=s.name;
  kGlow(x,540,560,380,.5);const m=await shImg(`/art/atlas/zm-${d.sign}.webp`);
  x.save();x.beginPath();x.arc(540,560,250,0,7);x.clip();if(m)x.drawImage(m,290,310,500,500);x.restore();
  x.beginPath();x.arc(540,560,250,0,7);x.lineWidth=4;x.strokeStyle='#D9B66E';x.stroke();
  title=s.name.toUpperCase();sub=d.cat==='overview'?`${PLABEL[d.period][1]} Horoscope`:`${CAT_INFO[d.cat][0]} · ${PLABEL[d.period][0]}`;
  heart=kFirst(h.body,2);ask=h.reflection||'What is the sky asking of you?'}
 if(kind==='whisper'){const cd=d.card;kGlow(x,540,560,420,.55);await kCardFace(x,`/art/whispers/${cd.id}.webp`,350,275,380,570,0,false,cd.title);
  title=cd.title.toUpperCase();sub='Today’s Whisper';heart=cd.msg;ask=cd.ref;signName=sg(S.sign).name}
 if(kind==='reading'){const cs=d.cards,n=cs.length,sp=SPREADS[d.spread]||{s:'Tarot',n:'Tarot Reading'};signName=sg(S.sign).name;kGlow(x,540,560,460,.5);
  const W=n===1?380:n<=3?300:n<=5?210:150,H=W*1.5,step=n===1?0:Math.min(W*.82,820/(n-1)),spread=n===1?0:Math.min(.5,.11*(n-1));
  for(let i=0;i<n;i++){const t=n===1?0:i/(n-1)-.5,cx=540+(i-(n-1)/2)*step,cy=560+Math.abs(t)*70;await kCardFace(x,`/art/deck/${cs[i].id}.webp`,cx-W/2,cy-H/2,W,H,t*spread,cs[i].rv)}
  title=sp.s.toUpperCase();sub=n===1?cs[0].name+(cs[0].rv?' · reversed':''):n<=5?cs.map(c=>c.name).join(' · '):`${n} cards · ${cs[0].name} at its heart`;
  heart=n===1?`${cs[0].rv?cs[0].revm:cs[0].upm} ${cs[0][SPREAD_CTX[d.spread]||'growth']||''}`.trim():d.ai&&d.ai.whole?kFirst(d.ai.whole,2):cs.slice(0,5).map(c=>`${c.pos}: ${(c.rv?c.rev:c.up).split(/,\s*/)[0].toLowerCase()}`).join(' · ');
  ask=d.q?`“${d.q}”`:'Which card spoke to you first, and why?'}
 if(kind==='page'){signName=sg(S.sign).name;kGlow(x,540,560,400,.5);const im=d.img?await shImg(d.img):null;
  if(d.round){x.save();x.beginPath();x.arc(540,560,250,0,7);x.clip();if(im){const s=Math.max(500/im.width,500/im.height);x.drawImage(im,540-im.width*s/2,560-im.height*s/2,im.width*s,im.height*s)}x.restore();x.beginPath();x.arc(540,560,250,0,7);x.lineWidth=4;x.strokeStyle='#D9B66E';x.stroke()}
  else if(im){const W=560,H=W*im.height/im.width>620?620:W*im.height/im.width;await kCardFace(x,d.img,540-W/2,560-H/2,W,H,0,false)}
  title=(d.title||'Kosmia').toUpperCase();sub=d.sub||'';heart=d.heart||'';ask=d.ask}
 // the title and what it is
 shCaps(x,title,540,930,kind==='reading'&&title.length>16?52:62,k,{color:kGold,max:900,track:.08,weight:600});
 shFit(x,sub,[120,975,960,1045],{k,max:34,min:22,italic:true,color:kCream,lh:1.2});
 // the inscription: who, and under which sky
 kRule(x,1080,420);
 shFit(x,`${nm?nm+' · ':''}${signName} · ${date}`,[120,1105,960,1150],{k,max:34,min:24,color:kGold,weight:600,lh:1.1});
 shFit(x,kMoonLine(day),[120,1150,960,1195],{k,max:30,min:22,italic:true,color:'rgba(244,232,204,.85)',lh:1.1});
 // the heart of the reading
 shFit(x,heart,[110,1250,970,1560],{k,max:58,min:36,italic:true,color:kCream,weight:500,lh:1.24});
 kRule(x,1600,300);
 shFit(x,ask,[150,1630,930,1760],{k,max:38,min:26,italic:true,color:kGold,weight:500,lh:1.25});
 shCaps(x,'KOSMIA · YOUR COSMIC GUIDE',540,1818,20,k,{color:'rgba(233,201,133,.75)',track:.24,weight:600});
 return new Promise(r=>c.toBlob(r,'image/png'));
}
// a share button's work: the card drawn, then shown with the phone's share sheet one tap away (the sheet must open
// from a tap, so it is offered on the picture rather than opened while the picture is still being drawn)
// a page's keepsake from what the page shows: its title, its picture, its first words and its question
const PAGE_ART={'birth-chart':'ex-chart','life-path':'ex-lifepath','name-within':'ex-name',affinity:'hero-affinity',resonance:'hero-affinity',synastry:'ex-chart',profile:'ex-chart'};
function pageShare(){
 const q=sel=>document.querySelector(sel),txt=e=>e?e.textContent.replace(/\s+/g,' ').trim():'',t=tab();
 const ps=[...document.querySelectorAll('.mnp .mbox p,.mnp .mbox .read p,.mnp .card p')].map(txt).filter(x=>x.length>50&&!/^For reflection|not as scientific|not predictions/i.test(x));
 const img=q('.dm-art img')||q('.mnp .mbox img.dm-img');let src=img&&img.src;
 if(!src){const id=t==='cycles'?'zm-'+S.sign:t==='moon'?null:PAGE_ART[t];if(id)src=(ui(id).match(/src="([^"]+)"/)||[])[1]}
 if(!src&&t==='moon'){const m=q('.mnp img');src=m&&m.src}
 const score=txt(q('.score strong'));
 // the reader's own findings first, where the page knows them; otherwise the page's first words that are not its welcome
 let own='',sub2='';
 try{const bd=hasBirthDate()?S.birth.date:'';
  if(t==='birth-chart'&&bd&&S.fullName&&K){const ch=myChart(),pl=n=>{const x=ch.pl.find(p=>p.n===n);return x?sIdx(x.sign).name:''},asc=ch.ang&&!S.birth.unk?sIdx(Math.floor(ch.ang.asc/30)).name:'';
   sub2=[pl('Sun')&&pl('Sun')+' Sun',pl('Moon')&&pl('Moon')+' Moon',asc&&asc+' Rising'].filter(Boolean).join(' · ');own=placement(ch.pl[0])}
  if(t==='life-path'&&bd&&N){const l=N.lifePath(bd).r.n;sub2=`Life Path ${l} · ${N.MEANING[l][0]}`;own=`As a Life Path ${l}, ${N.MEANING[l][0]}, you walk with ${N.MEANING[l][1].replace(/, ([^,]*)$/,' and $1')}.`}
  if(t==='name-within'&&S.fullName&&N){const e=N.name(S.fullName,S.settings.yMode).expression.r.n;sub2=`Expression ${e} · ${N.MEANING[e][0]}`;own=`Your name carries the music of ${N.MEANING[e][0]}: ${N.MEANING[e][1].replace(/, ([^,]*)$/,' and $1')}.`}
 }catch(e){}
 const fresh=ps.filter(x=>!/^(Discover|Explore|Your name carries|Find anyone|Compare)/.test(x));
 return {title:txt(q('.mn-t h1')),sub:score?`${score} overall compatibility`:sub2||txt(q('.mn-t .mn-sub'))||txt(q('.mn-greet')),heart:kFirst(own||fresh[0]||ps[0]||'',2),ask:txt(q('.mnp .quote'))||'What does this stir in you?',img:src,round:t!=='dream'}}
async function shareCard(t){
 const k=t.dataset.k;let d,caption='';
 if(k==='page'){d=pageShare();caption=`${d.title} · from Kosmia ✦`}
 if(k==='horo'){d={sign:t.dataset.s,cat:t.dataset.cat,period:V.period};caption=`My ${sg(d.sign).name} horoscope from Kosmia ✦`}
 if(k==='whisper'){const day=t.dataset.day||dkey();d={card:cardFor(day),day};caption=`“${d.card.msg}” My Whisper from Kosmia ✦`}
 if(k==='reading'){const T=V.tarot;if(!T.drawn)return;d={spread:T.spread,cards:T.drawn,ai:T.ai,q:T.q};caption=`My ${(SPREADS[T.spread]||{s:'tarot'}).s} reading from Kosmia ✦`}
 toast('Preparing your card…');
 const blob=await renderKeep(k==='horo'||k==='whisper'||k==='page'?k:'reading',d);if(!blob)return toast('The card could not be drawn.');
 if(V.share&&V.share.url)URL.revokeObjectURL(V.share.url);
 V.share={url:URL.createObjectURL(blob),file:new File([blob],`kosmia-${k}.png`,{type:'image/png'}),caption};render();
}
function sharePop(){const s=V.share,can=navigator.canShare&&navigator.canShare({files:[s.file]});
 return `<div class="cpop sh-pop" role="dialog" aria-modal="true" aria-label="Share your card" data-act="shareclose"><button class="cp-x" data-act="shareclose" aria-label="Close">×</button><div class="cp-in">
 <p class="cp-k">Share your insight</p><img class="sh-img" src="${s.url}" alt="Your card, ready to share">
 <div class="sh-acts">${can?`<button class="btn" data-act="sharego">${IC.share} Share</button>`:''}<a class="btn${can?' ghost':''}" href="${s.url}" download="${s.file.name}">Save image</a></div></div></div>`}
// the day's horoscope for each area of life, opened from Your Stars in the same window as the enlarged Whisper
const HPOP=HCATS.filter(([x])=>x!=='overview');
function horoPop(sign){
 const k=dkey(),cat=HPOP.some(([x])=>x===V.hpop)?V.hpop:HPOP[0][0],h=horoscope(sign.id,cat,'daily');
 HPOP.forEach(([x])=>horoscope(sign.id,x,'daily'));   // the other areas are asked for now, so each tab opens written
 const still=!!document.querySelector('.cpop.hpz');
 return `<div class="cpop wpz hpz${still?' still':''}" data-s="${sign.id}" role="dialog" aria-modal="true" aria-label="${sign.name}, today in every area of life" data-act="hpopclose"><button class="cp-x" data-act="hpopclose" aria-label="Close">×</button><div class="cp-in">
 <p class="cp-k">Your Stars · ${ymdLong(k,{day:'numeric',month:'long'})}</p><h2 class="cp-t">${sign.name}</h2>
 <div class="hpz-top">${glyphMed(sign.id,'hpz-med')}<p class="hpz-dt">${esc(sign.dates)}</p></div>
 <div class="cp-box"><nav class="hpz-tabs" role="tablist" aria-label="Areas of life">${HPOP.map(([x,l])=>`<button role="tab" class="hpz-tab${x===cat?' on':''}" data-act="hpopcat" data-k="${x}" aria-selected="${x===cat}"><span>${l}</span></button>`).join('')}</nav>
 <div class="hpz-scr"><h3 class="hpz-f">${esc(h.focus||CAT_INFO[cat][1])}</h3><div class="hpz-b">${paras(h.body)}</div></div></div>
 </div></div>`}
function whisperPop(c,k=dkey()){markRead({k:'whisper',card:c,from:{sec:'tarot',t:'whisper'}});
 const saved=S.saved.some(x=>x.date===k);
 return `<div class="cpop wpz" role="dialog" aria-modal="true" aria-label="${esc(c.title)}" data-act="wpopclose"><button class="cp-x" data-act="wpopclose" aria-label="Close">×</button><div class="cp-in">
 <p class="cp-k">Daily Whisper · ${ymdLong(k,{day:'numeric',month:'long'})}</p><h2 class="cp-t">${esc(c.title)}</h2>
 <div class="cp-card"><div class="scene flat" role="img" aria-label="${esc(c.title)}"><div class="face front">${Kit.tarot({art:'whispers/'+c.art,num:wNum(c),name:c.title})}</div></div></div>
 <div class="cp-box"><p class="cp-keys">${keys(wKeys(c))}</p><p class="cp-msg">${esc(c.msg)}</p>
 ${k===dkey()?`<p class="cp-you"><span>For you</span>${esc(myWhisper(c))}</p>`:''}<div class="cp-rule" aria-hidden="true"></div><p class="cp-ref">${esc(c.ref)}</p>
 <div class="wpc-acts obj-row">${obj('pen',`data-act="jopen" data-k="fortune:${k}"`,S.notes[k]?'Keep writing in your Journal':'Reflect in your Journal')}${k===dkey()?obj('like',`data-act="savecard" aria-pressed="${saved}"`,'Save to your journal',saved?'on':''):''}${obj('share',`data-act="sharecard" data-k="whisper" data-day="${k}"`,'Share this Whisper')}</div></div>
 </div></div>`}
/* Home, after docs/mockups/home-top and home-bottom: the header scene (sky, halo, the sign's figure overlapping the
   forecast card, the five insights at its foot), the night band with the Daily Whisper and the Cosmic Energy landscape,
   then the parchment sheet */
// the day's path: its four steps, each lighting a Moon a quarter further, and the screen it opens on: on mornings
// "Did you dream?" first, until answered; otherwise the first step not yet done, and once all four are, the day held
// the Moon's chapter: from one New Moon to the next, with its Full Moon, the sign it began in and how far in today is
let chCache={k:'',v:null};const LETGO='What I let go of tonight';
const dayGap=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/DAY);
function chapterAt(d=new Date()){
 const k=dkey(d);if(chCache.k===k)return chCache.v;let v=null;
 try{const ev=K.lunarPhases(new Date(+d-34*DAY),new Date(+d+34*DAY)),nm=ev.filter(e=>e.k==='new_moon');
  const prev=nm.filter(e=>dkey(e.date)<=k).pop(),next=nm.find(e=>dkey(e.date)>k);
  if(prev&&next){const key=dkey(prev.date),endKey=dkey(next.date),full=ev.find(e=>e.k==='full_moon'&&e.date>prev.date&&e.date<next.date);
   v={key,endKey,sign:prev.sign,fullKey:full?dkey(full.date):'',fullSign:full?full.sign:0,day:dayGap(key,k)+1,len:dayGap(key,endKey)}}}catch(e){}
 if(dkey()===k)chCache={k,v};return v;
}
const lastChapter=ch=>ch?chapterAt(new Date(Date.parse(ch.key+'T12:00:00Z')-2*DAY)):null;
// the wish the reader planted at a chapter's New Moon (a page of their Journal)
const WISH='A wish for the New Moon',isWish=j=>String(j.title||'').startsWith(WISH);
const chWish=ch=>ch?S.journal.find(j=>isWish(j)&&j.day>=ch.key&&j.day<ch.endKey&&j.body):null;
const ritualTexts=()=>new Set(S.journal.filter(j=>j.title===LETGO||isWish(j)).map(j=>plain([j.title,j.body].filter(Boolean).join('. '))));
const clip=(t,n)=>{t=plain(String(t||'')).replace(/\s+/g,' ').trim();return t.length<=n?t:t.slice(0,t.lastIndexOf(' ',n)>n*.6?t.lastIndexOf(' ',n):n)+'…'};
// a thread back to the reader's own words: a page from about a Moon ago, else about a week ago, else from the last weeks;
// never when what they wrote suggests real distress, and only while personal writing is on
function myThread(){
 if(!personalOn()||myPortrait().care)return null;const k=dkey();
 const skip=ritualTexts();
 const it=myItems().filter(x=>['journal','reflection','dream'].includes(x.kind)&&x.text.length>24&&!skip.has(x.text)).map(x=>Object.assign({ago:dayGap(x.day,k)},x));
 const pickIn=(a,b)=>it.filter(x=>x.ago>=a&&x.ago<=b).sort((x,y)=>x.ago-y.ago);
 const pool=[pickIn(27,32),pickIn(6,8),pickIn(3,24)].find(p=>p.length);if(!pool)return null;
 const x=pool[Number(k.replace(/-/g,''))%pool.length];
 const when=x.ago>=27?'A Moon ago':x.ago>=6&&x.ago<=8?'A week ago':x.ago+' days ago';
 return {label:`${when} ${x.kind==='dream'?'you dreamt':'you wrote'}`,text:clip(x.text,150),ask:x.kind==='dream'?'Does it still visit you?':'How is it now?',day:x.day,kind:x.kind};
}
// the letter at the close of a chapter: written here, from the reader's own pages of that Moon, and never sent anywhere
function moonLetter(ch){
 const nm=firstName(),end=ch.endKey<=dkey(),it=myItems().filter(x=>x.day>=ch.key&&x.day<ch.endKey),skip=ritualTexts(),own=it.filter(x=>['journal','reflection','dream'].includes(x.kind)&&!skip.has(x.text));
 const days=new Set(it.map(x=>x.day)).size,P=PZ.portrait(it,end?ch.endKey:dkey()),wish=chWish(ch),signN=sIdx(ch.sign).name;
 const cards=[...new Set(Object.keys(S.revealed).filter(d=>S.revealed[d]&&d>=ch.key&&d<ch.endKey).sort().map(d=>cardFor(d).title))];
 const ps=[`This Moon began in ${signN} on ${ymdLong(ch.key,{day:'numeric',month:'long'})}${end?` and closed on ${ymdLong(ch.endKey,{day:'numeric',month:'long'})}`:`, and it is still with us: tonight is night ${ch.day} of ${ch.len}`}.`];
 if(wish)ps.push(`At its beginning you wished: “${esc(clip(wish.body,160))}”. ${end?'Look at where you are now. Whatever came of it, the wish was yours, and wishing is a kind of courage.':'Hold it lightly. There is still time for it to find you.'}`);
 if(!days)ps.push('This Moon you mostly listened, and that is allowed. Nothing here needs to be earned.');
 else ps.push(`You came back on ${days===1?'one night':days+' nights'}${own.length?` and kept ${own.length===1?'one page':own.length+' pages'}`:''}.${P.themes.length&&personalOn()?` Your words kept returning to ${P.themes.slice(0,2).map(x=>PZ.THEMES[x.k].name).join(' and ')}.`:''}`);
 if(own.length&&personalOn()&&!P.care){const a=own.slice().sort((x,y)=>x.day<y.day?-1:1),f=a[0],l=a[a.length-1];
  ps.push(f===l?`You wrote: “${esc(clip(f.text,170))}”`:`Early on you wrote: “${esc(clip(f.text,130))}” And later: “${esc(clip(l.text,130))}”`)}
 if(cards.length)ps.push(`The Whispers that found you: ${cards.slice(-4).map(esc).join(', ')}.`);
 ps.push(P.care?'It was a heavy Moon. Please let someone you trust hold some of it with you; you do not have to carry it alone.':P.mood==='tender'?'It was a tender Moon. You carried more than you showed, and you kept going.':P.mood==='bright'?'There was light in your words this Moon. Remember it on darker nights.':'It was a quiet, steady Moon, and it was yours.');
 ps.push(end?'Whatever you carry into the next chapter, carry it gently.':'Come back to this letter as the Moon grows. It will grow with you.');
 return `<div class="pop" role="dialog" aria-modal="true" aria-label="Your letter for this Moon" data-act="letterclose"><div class="pop-box ins-box lt-box"><button class="pop-x" data-act="letterclose" aria-label="Close">×</button>
 <p class="cp-k">Your letter for this Moon</p><h2 class="center">${nm?'Dear '+esc(nm)+',':'Dear you,'}</h2><div class="lt-b">${ps.map(p=>`<p>${p}</p>`).join('')}<p class="lt-sig">Kosmia</p></div>
 <p class="muted small center">Written here, from your own pages. It is never sent anywhere.</p></div></div>`;
}
// the day's moon, drawn in the temple's own gold: lit or still dark
const tmoon=on=>`<span class="hp-full tm-hpm"><img src="/art/temple/moon-base.webp" alt=""><img class="lit" src="/art/temple/moon-full.webp" alt="" style="opacity:${on?1:0}"></span>`;
const PATH=[['stars','Your Stars'],['whisper','Whisper'],['wfy','Written for You'],['carry','Carry'],['reflect','Reflect']],PHASES=['waxing-crescent','first-quarter','waxing-gibbous','full-moon'];
const pathDone=k=>({stars:S.readDay===k,wfy:S.wfy===k,whisper:!!S.revealed[k],carry:!!((S.carry||{})[k]||(evening()&&(S.ncarry||{})[k])),reflect:!!S.notes[k]});
// what is offered to carry through the night, when the evening comes and nothing was chosen for the day
const NSEEK={peace:['Let the day be finished, exactly as it is','Take three slow breaths before you sleep'],
 love:['Fall asleep thinking of someone who loves you','Forgive yourself one thing from today'],
 direction:['Let the question rest; morning may answer it','Name one thing today has taught you'],
 healing:['Put down what was heavy, just until morning','Let your body be tired, without judging it'],
 courage:['Remember one brave thing you did today','Let tomorrow’s fear wait until tomorrow']};
// what the reader came looking for, asked once: it colours the day's message and what is offered to carry
const SEEK={peace:['Peace','You came here seeking peace. Let today give you one quiet minute of it, and notice that it was always yours to take.',['Give yourself one quiet minute before the day begins','Do one thing slowly, on purpose']],
 love:['Love','You came here seeking love. Begin where it always begins: with how you speak to yourself today.',['Say one kind thing to yourself, aloud','Tell one person what they mean to you']],
 direction:['Direction','You came here seeking direction. You do not need the whole road today, only the next true step.',['Take one small step you have been putting off','Ask yourself what you already know']],
 healing:['Healing','You came here seeking healing. It rarely arrives all at once; today it may come as one soft hour.',['Be as gentle with yourself as you would be with a friend','Rest once today without earning it']],
 courage:['Courage','You came here seeking courage. It is already in you: it only needs one small thing to practise on.',['Say the one true thing you have been holding back','Do one thing today that scares you a little']]};
const mySeek=()=>SEEK[(S.settings||{}).seek]||null;
const askSeek=()=>!(S.settings||{}).seek;
const hourNow=()=>Number(fmt({hour:'numeric',hour12:false},new Date()));
const askDream=k=>{const h=hourNow();return h>=4&&h<12&&S.dreamAsk!==k};
// in the first three nights of a chapter, a wish for it; in the evening, something to let go of before sleep
const askIntent=()=>{const ch=chapterAt();return !!ch&&ch.day<=3&&!chWish(ch)&&S.intentAsk!==ch.key};
const askNight=k=>{const h=hourNow();return (h>=18||h<4)&&S.released!==k};
// Reflect belongs to the evening: by day, once the Whisper is turned, the morning is complete and the day is carried
const GOODNIGHT=['The day has done what it could. Let the candle hold the rest, and sleep.','Whatever today was, it was enough, and so are you. Rest well.','The stars kept watch all day above you. Now let them keep watch while you dream.','Be gentle with yourself tonight. Tomorrow arrives only when you are ready for it.','One small flame is all the dark needs. Carry yours into sleep.','You showed up for your day. That is a quiet kind of courage. Goodnight.','Let the night take what you no longer need to carry. Morning will bring you what you do.','The Moon is awake so you can rest. Close your eyes; you are held.'];
const goodnight=k=>GOODNIGHT[[...k].reduce((a,x)=>a+x.charCodeAt(0),0)%GOODNIGHT.length];
const evening=()=>{const h=hourNow();let s=18;try{s=Math.max(12,+ritTimes().e.split(':')[0]-3)}catch(e){}return h>=s||h<4};
const pathOrder=k=>[...(askSeek()?['seek']:[]),...(askIntent()?['intent']:[]),'stars','whisper','wfy','carry',...(evening()||S.notes[k]?['reflect']:[]),...(askNight(k)?['night']:[]),'held'];
function pathStep(){
 const k=dkey(),dn=pathDone(k),ev=evening();
 // a new day, a new visit, or the evening arriving: land on the first page not yet seen or completed
 if(V.hday!==k||V.hev!==ev){V.hday=k;V.hev=ev;V.hstep=null}
 return V.hstep||(askSeek()?'seek':askIntent()?'intent':(PATH.find(([x])=>!dn[x]&&(x!=='reflect'||ev))||[askNight(k)?'night':'held'])[0]);
}
// to the next step (or back): leaving Your Stars counts it as read; the page returns to its head
function pathMove(dir){
 const k=dkey(),o=pathOrder(k),st=pathStep(),i=Math.max(0,o.indexOf(st)),n=Math.min(o.length-1,Math.max(0,i+dir));
 if(n===i)return;V.hstep=o[n];V.hdir=n>i?1:-1;render();window.scrollTo(0,0);
}
views.home=()=>{
 if(!A||!K)return needLib();
 const sign=sg(S.sign),now=new Date(),c=todayCard(),k=dkey(),rev=!!S.revealed[k],m=K.moon(now),h=horoscope(sign.id,'overview','daily');
 const nm=firstName(),short=hSum(h.body),fig='atlas/fg-'+sign.id,d=myDay(),st=pathStep();
 V.hstep=st;   // the step in view stays in view until the reader moves on, even once it counts as done
 if(st==='wfy'&&S.wfy!==k){S.wfy=k;save()}
 if(st==='stars'&&S.readDay!==k){S.readDay=k;save()}
 const dn=pathDone(k),done=PATH.filter(([x])=>dn[x]).length,whole=done===PATH.length;
 Temple.arc(PATH.map(([x,l])=>({k:x,label:l,on:!!dn[x],cur:st===x})),whole);
 const next=(l='Continue')=>`<button class="btn" data-act="hnext">${l}</button>`;
 const playing=V.say===d.body;
 const sd=V.hdir||0;V.hdir=0;
 const ord=pathOrder(k),LB={seek:'What you seek',dream:'Your dream',intent:'Your wish',wfy:'Written for You',stars:'Your Stars',whisper:'Your Whisper',carry:'Carry it with you',reflect:'Reflect',night:'Before You Sleep',held:'Your day'};
 const oi=ord.indexOf(st),dots=`<nav class="hp-dots" aria-label="Today’s pages, swipe to move between them"><button class="hp-ch l${oi<=0?' off':''}" data-act="hprev" aria-label="Previous page" tabindex="-1"><svg viewBox="0 0 10 16"><path d="M8 2L2 8l6 6"/></svg></button>${ord.map(x=>`<button data-act="hgo" data-k="${x}" aria-label="${LB[x]||x}"${x===st?' aria-current="step" class="on"':''}></button>`).join('')}<button class="hp-ch r${oi>=ord.length-1?' off':''}" data-act="hnext" aria-label="Next page" tabindex="-1"><svg viewBox="0 0 10 16"><path d="M2 2l6 6-6 6"/></svg></button></nav>`;
 let ttl='';
 const card=(title,body,cls='')=>{ttl=title;return panel(body,`gilt hp-card ${cls}`)};
 let stage;
 if(st==='dream')stage=card('Good Morning',`<div class="hp-in"><p class="hp-big">Did you dream?</p><p class="hp-sub">Dreams fade within minutes of waking. Tell it while it is still close, however small or strange.</p>
  <div class="pz-acts">${obj('pen','data-act="hdream"','Write it down in your Journal')}<button class="btn ghost" data-act="hnodream">Not today</button></div></div>`,'hp-dream');
 else if(st==='intent'){const ch=chapterAt();stage=card('A New Chapter',`<div class="hp-in">${tmoon(false)}<p class="hp-big">The New Moon in ${sIdx(ch.sign).name}</p><p class="hp-sub">A new chapter of your month begins. What would you like to grow before this Moon is full?</p><textarea class="hp-ta" id="hpwish" rows="3" placeholder="A wish, a hope, one small thing." aria-label="Your wish for this Moon"></textarea>
  <div class="pz-acts"><button class="btn" data-act="hwish">Plant it</button><button class="btn ghost" data-act="hnowish">Not this time</button></div><p class="hp-sub">It stays in your Journal, and the Moon will bring it back to you.</p></div>`,'hp-intent')}
 else if(st==='night')stage=card('Before You Sleep',`<div class="hp-in">${tmoon(true)}<p class="hp-big">What are you ready to let go of tonight?</p><p class="hp-sub">A worry, a word you wish you hadn’t said, a day that asked too much. Write it, then let it go.</p><textarea class="hp-ta" id="hprel" rows="4" placeholder="Nothing written here is kept unless you ask." aria-label="What you are letting go of"></textarea>
  <div class="pz-acts"><button class="btn" data-act="hlet">Let it go</button><button class="btn ghost" data-act="hrelkeep">Keep it instead</button></div><button class="jp-new" data-act="hnonight">Not tonight ${IC.chev}</button></div>`,'hp-night');
 else if(st==='seek')stage=card('Before We Begin',`<div class="hp-in"><p class="hp-big">${nm?esc(nm)+', what':'What'} are you seeking these days?</p><p class="hp-sub">Choose the one that is truest now. Everything written for you here will remember it.</p>
  <div class="hp-seek">${Object.entries(SEEK).map(([x,v])=>`<button class="hp-chip" data-act="hseek" data-k="${x}">${v[0]}</button>`).join('')}</div><button class="jp-new" data-act="hseek" data-k="open">I am not sure yet ${IC.chev}</button></div>`,'hp-seekp');
 else if(st==='wfy'){const sk=mySeek();stage=card('Written for You',`<div class="hp-in"><h2 class="pz-t">${esc(d.focus)}</h2><p class="pz-moon">${moonPic(m,'pz-mi')}<span>${esc(m.name)} in ${sIdx(d.sky.moonSign).name}</span></p>
  <div class="pz-b">${esc(d.body)}${sk&&!d.ai&&!d.care?' '+esc(sk[1]):''}</div>${(()=>{const th=myThread(),ch=chapterAt(),w=chWish(ch);
   if(w&&ch.fullKey&&Math.abs(dayGap(ch.fullKey,k))<=1)return `<p class="cp-you hp-you"><span>At the New Moon you wished</span>“${esc(clip(w.body,150))}” The Moon is full now. What has grown?</p>`;
   return th?`<p class="cp-you hp-you"><span>${th.label}</span>“${esc(clip(th.text,90))}” ${th.ask}</p>`:''})()}</div>`,'hp-wfy')}
 else if(st==='carry'){const eve=evening(),day=(S.carry||{})[k],ngt=eve&&!day?(S.ncarry||{})[k]:'',mine=day||ngt,sk=mySeek(),sn=NSEEK[(S.settings||{}).seek],up=x=>x?x[0].toUpperCase()+x.slice(1):x,ai=(S.daily||{})[k]||{},
   mineAi=(eve?((ai.eve&&ai.eve.ncarry&&ai.eve.ncarry.length?ai.eve.ncarry:ai.ncarry)||[]):(ai.carry||[])).map(up),   // written for them today
   opts=[...new Set((eve?[...mineAi,...(sn||[]),rev?`Take “${c.title}” with you into your dreams`:'','Name one good thing today gave you','Let the night be quiet; the day can wait']
    :[...mineAi,up(d.step),...(sk?sk[2]:[]),rev?`Keep “${c.title}” close, and watch where it appears`:'','Do one thing slowly, on purpose','Notice one thing that is going well']).filter(Boolean))].slice(0,3);
  stage=card('Carry It With You',`<div class="hp-in"><p class="hp-big">${ngt?'Tonight you carry':day?(eve?'Today you carried':'Today you carry'):eve?'One thing to carry through the night':'One thing to carry through today'}</p>${mine?`<p class="pz-q">“${esc(mine)}”</p><p class="hp-sub">${ngt?'Let it go with you into sleep.':eve?'The evening has come to ask how it went.':'Tonight I will ask you how it went.'}</p>${day&&eve?'':`<button class="jp-new" data-act="hcarryx">Choose another ${IC.chev}</button>`}`
   :`<p class="hp-sub">Choose one, or write your own.</p><div class="hp-carry">${opts.map(x=>`<button class="hp-chip" data-act="hcarry" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
   <div class="hp-own"><input type="text" id="hpcarry" maxlength="90" placeholder="Or in your own words" aria-label="Your own intention"><button class="btn" data-act="hcarry">Carry it</button></div>`}</div>`,'hp-carryp')}
 else if(st==='stars')stage=card('Your Stars',`<div class="hp-in hp-st"><div class="hp-sth">${glyphMed(sign.id,'hp-med')}<p class="hp-sn">${sign.name}<span>${esc(sign.dates)}</span></p></div><h2 class="pz-t">${esc(h.focus||'Your day in the sky')}</h2>
  <div class="pz-b">${esc(h.body)}</div><button class="jp-new" data-act="hpop">Love, work and more ${IC.chev}</button></div>`,'hp-stars');
 else if(st==='whisper')stage=card('Your Daily Whisper',`<div class="dw dw-row${rev?'':' dw-wait'}"><div class="scene mini-w ${rev?'flipped':''}" data-act="${rev?'wpop':'reveal'}" role="button" tabindex="0" aria-label="${rev?esc(c.title)+'. Enlarge the card':'Today’s whisper, face down. Press to reveal.'}"><div class="card3d"><div class="face back"></div><div class="face front">${Kit.tarot({art:'whispers/'+c.art,num:wNum(c),name:c.title})}</div></div></div>
   <div class="dw-side">${rev?`<h3 class="dw-t">${esc(c.title)}</h3><p class="dw-msg">${esc(c.msg)}</p>`:'<h3 class="dw-t">One card already knows your day</h3><p class="dw-msg">It was drawn before you woke. Take one slow breath, then touch it.</p>'}</div></div>
   ${rev?`<p class="cp-you hp-you"><span>For you</span>${esc(myWhisper(c))}</p>`:''}`,'hp-whisper');
 else if(st==='reflect'){const eve=evening(),ai=(S.daily||{})[k]||{},rq=(ai.eve&&ai.eve.reflect)||(d.ai&&d.question)||(rev?c.ref:eve?'What stayed with you from today?':d.question);stage=card(eve?'Reflect on Your Day':'Reflect',`<div class="hp-in"><p class="hp-sub hp-wq">${(S.carry||{})[k]?`This morning you chose to carry: “${esc((S.carry||{})[k])}”. How did it go?`:eve?'The day is almost done. How was it?':rev?`Your Whisper was “${esc(c.title)}”.`:'A question for your day.'}</p><p class="pz-q">“${esc(rq)}”</p><textarea class="hp-ta" id="hpta" rows="4" placeholder="Write anything. It doesn’t need to make sense." aria-label="Your reflection">${esc(S.notes[k]||'')}</textarea>
  <div class="pz-acts"><button class="btn" data-act="hkeep">${IC.quill}Keep it</button>${obj('kas',`data-act="kasask" data-q="${esc(rq)}"`,'Ask Kassandra')}</div></div>`,'hp-reflect')}
 else{const eve=hourNow()>=18||hourNow()<4,ch=chapterAt(),lt=ch&&(ch.len-ch.day<=2||ch.day<=3);
  stage=card(eve?'Goodnight':'Your Day Is Held',`<div class="hp-in">${tmoon(eve||whole)}<p class="hp-big">${eve?(nm?esc(nm)+', rest now':'Rest now'):whole?'The full Moon of your day':(S.carry||{})[k]?'Today you carry':'Your morning is held'}</p>${!eve&&(S.carry||{})[k]?`<p class="pz-q">“${esc((S.carry||{})[k])}”</p>`:''}
  ${eve?`<p class="hp-bless">${esc(goodnight(k))}</p><p class="hp-sub hp-dawn">Your next card is already drawn. It will be waiting for you at dawn.</p>`:''}${eve?'':`<p class="hp-sub">${eve&&S.released===k?'What you let go of is gone. ':''}${rev?`“${esc(c.title)}” walks with you.`:'Your card is still waiting, whenever you are.'} ${S.notes[k]?'Your reflection is kept in your Journal.':''}</p>`}
  ${lt?`<button class="btn ghost" data-act="hletter">${ch.day<=3?'Your letter from the last Moon':'Your letter for this Moon'}</button>`:''}${ch?`<p class="hp-sub hp-chap">Night ${ch.day} of ${ch.len} in the ${sIdx(ch.sign).name} Moon’s chapter.</p>`:''}${eve||whole?'':`<p class="hp-sub hp-tonight hp-eve"><span>Tonight</span>Come back when the day is done. I will ask how it went, and help you set down what you do not need to carry into sleep.</p>`}</div>`,'hp-held')};if(st==='held'&&!evening())stage+=energyCarousel(energySlides(now,m,sign,h));
 return `<div class="home hbay hmoon hsun hpath"><div class="hbar">${ui('home-bar','hb-art')}<span class="hb-logo"><span class="hb-word">Kosmia</span>${Kit.icon('star',{cls:'hb-star'})}</span>${avatar()}</div>
 <header class="hh-head stay"><div class="hh-top"><div class="brand"><span class="hh-word">Kosmia</span><small>Come as you are. <span>You are known here.</span></small></div></div>
  ${st==='held'&&evening()?'':`<h1 class="hh-greet">${greet()}${nm?', '+esc(nm):''}</h1>`}<p class="hh-date">${ymdLong(k,{weekday:'long',day:'numeric',month:'long'})}</p>${dots}${ttl?orn(ttl):''}</header>
 ${Kit.scene({cls:'hhero',bg:'atlas/home-sky',ratio:'auto',bgPos:'50% 0',priority:true,stars:true,bare:true,content:`<div class="hp-stage${sd?' sl'+(sd>0?'r':'l'):''}" data-step="${st}" aria-live="polite">${stage}</div>`})}
 ${V.wpop?whisperPop(c):''}${V.hpop?horoPop(sign):''}${V.letter?moonLetter(V.letter):''}</div>`;
};

/* ---------- the personal voice (personal.js): what the reader has written, read on this device and woven into the
   day's message, the Whisper's note and Kassandra's sense of them. When the AI is available it writes the day's words
   once from the same portrait (kept in S.daily); otherwise they are written here, so the day is always personal. ---------- */
const PZ=window.KosmiaPersonal;
const personalOn=()=>S.settings.personal!==false;
function myItems(){
 const out=[],add=(day,text,kind)=>{if(day&&text&&String(text).trim())out.push({day:String(day).slice(0,10),text:plain(String(text)),kind})};
 S.journal.forEach(j=>add(j.day,[j.title,j.body].filter(Boolean).join('. '),'journal'));
 Object.entries(S.notes).forEach(([d,n])=>add(d,n,'reflection'));
 S.readings.forEach(r=>{add(r.date,r.q,'question');add(r.date,r.note,'reflection')});
 S.bookmarks.forEach(b=>{const d=b.data||{};if(b.kind==='dream')add(d.day||(b.at||'').slice(0,10),d.text,'dream');
  else if(b.kind==='sign')add(d.day,d.type==='number'?`Noticed the number ${d.number} again${d.context?': '+d.context:''}`:d.text,'sign');
  else if(b.kind==='chat')(d.msgs||[]).filter(m=>m.role==='user').forEach(m=>add((b.at||'').slice(0,10),m.content,'kassandra'));
  else if(b.note)add((b.at||'').slice(0,10),b.note,'reflection')});
 (typeof KS!=='undefined'?KS.msgs:[]).filter(m=>m.role==='user').forEach(m=>add(dkey(),m.content,'kassandra'));
 return out;
}
let pzCache={k:'',p:null};
function myPortrait(){
 const items=personalOn()?myItems():[],k=dkey()+'|'+items.length+'|'+items.reduce((n,x)=>n+x.text.length,0);
 if(pzCache.k!==k)pzCache={k,p:PZ.portrait(items,dkey())};
 return pzCache.p;
}
// the reader's story, for the writer and Kassandra: who they are, what Kosmia has come to know of them over time, and
// the last three weeks day by day in their own words (cards turned, what they chose to carry, reflections, journal
// pages, questions to the cards, dreams and what they told Kassandra), newest first. Only when personal words are on.
function myStory(){
 if(!personalOn())return '';
 const k=dkey(),days={},add=(d,s)=>{d=String(d||'').slice(0,10);if(!s||!/^\d{4}-\d\d-\d\d$/.test(d)||d>k||dayGap(d,k)>21)return;(days[d]=days[d]||[]).push(s)};
 const LBL={sign:'A sign noticed',journal:'Journal page',reflection:'Reflection',question:'Asked the cards',dream:'Dream',kassandra:'Said to Kassandra'};
 myItems().forEach(x=>add(x.day,`${LBL[x.kind]}: “${clip(x.text,x.kind==='journal'?500:300)}”`));
 S.readings.forEach(r=>{const sp=SPREADS[r.spread];if(r.cards&&r.cards.length)add(r.date,`Tarot reading${sp?' ('+sp.n+')':''}: ${r.cards.map(c=>`${c.pos?c.pos+': ':''}${c.name}${c.rev?' reversed':''}`).join(', ')}`)});
 Object.entries(S.days).forEach(([d,id])=>{const c=oc(id);if(c)add(d,`Turned the Whisper card “${c.title}”`)});
 Object.entries(S.carry||{}).forEach(([d,v])=>add(d,`Chose to carry through the day: “${clip(v,90)}”`));
 Object.entries(S.ncarry||{}).forEach(([d,v])=>add(d,`Chose to carry through the night: “${clip(v,90)}”`));
 const P=myPortrait(),sk=mySeek(),ch=chapterAt(),w=chWish(ch),first=Object.keys(S.days).sort()[0];
 const head=[`Name: ${firstName()||'not given'}. Sun sign: ${sg(S.sign).name}.`,
  sk?`What they came to Kosmia seeking: ${sk[0].toLowerCase()}.`:'',
  w?`Their wish for this Moon’s chapter: “${clip(w.body,200)}”.`:'',
  first?`With Kosmia since ${ymdLong(first,{day:'numeric',month:'long',year:'numeric'})}: ${[[Object.keys(S.days).length,'day','days'],[S.journal.length,'journal page','journal pages'],[Object.keys(S.notes).length,'reflection','reflections'],[S.readings.length,'saved reading','saved readings']].map(([n,a,b])=>n+' '+(n===1?a:b)).join(', ')}.`:'This is one of their first days with Kosmia.',
  P.all&&P.all.length?`Themes in what they write (strongest first): ${P.all.slice(0,6).map(x=>PZ.THEMES[x.k].name).join('; ')}. Their mood lately: ${P.mood}.`:'',
  P.care?'Some of what they wrote suggests real distress: be especially tender and gently encourage them to reach out to someone they trust or a local support line.':''].filter(Boolean);
 const out=[];let n=0;
 for(const d of Object.keys(days).sort().reverse()){const blk=`${d===k?'Today':ymdLong(d,{weekday:'long',day:'numeric',month:'long'})}:\n- ${[...new Set(days[d])].join('\n- ')}`;if(n+blk.length>6500)break;out.push(blk);n+=blk.length}
 return [head.join('\n'),out.length?'Their recent days, newest first:\n'+out.join('\n'):'They have not written anything yet.'].join('\n\n');
}
// what Kosmia has come to understand of the reader over time, rewritten by the writer each day from the story
const myMemory=()=>personalOn()&&S.memory&&S.memory.text||'';
// the day's personal words: the AI's when it has written them today, otherwise Kosmia's own from the same portrait
function myDay(){
 const k=dkey(),ch=myChart(),P=myPortrait();
 const local=PZ.message({seek:!!mySeek(),K,now:new Date(),today:k,name:firstName(),sign:SIGNS.indexOf(sg(S.sign)),chart:ch,exact:!!(ch&&ch.known),portrait:P,uid:(C.user&&C.user.id)||S.email||''});
 const ai=(S.daily||{})[k];
 return ai&&ai.v===P.count?Object.assign({},local,ai,{ai:true}):local;
}
function myWhisper(c){const ai=(S.daily||{})[dkey()];if(ai&&ai.whisper&&ai.card===c.id)return ai.whisper;return PZ.whisper(c,wKeys(c),{portrait:myPortrait(),name:firstName(),today:dkey(),uid:(C.user&&C.user.id)||''})}
// once a day (and again when the reader has written something new), ask the AI to write the day from the portrait
let dailyAsk='';
function askDaily(){
 if(!C.user||!personalOn()||!C.daily)return;
 const k=dkey(),P=myPortrait(),have=(S.daily||{})[k],key=k+'/'+P.count;
 if((have&&have.v===P.count)||dailyAsk===key)return;dailyAsk=key;
 const ch=myChart(),c=todayCard(),loc=myDay();
 C.daily({day:k,name:firstName(),sign:S.sign,natal:ch?ch.pl.filter(x=>!(x.n==='Moon'&&ch.moonRange)).map(x=>`${x.n} ${sIdx(x.sign).name}${x.house?' house '+x.house:''}`).join(', '):'',
  sky:`The Moon is ${loc.sky.phase.toLowerCase()} in ${sIdx(loc.sky.moonSign).name}, lighting ${loc.sky.area}.`,portrait:PZ.forKassandra(P),story:myStory(),memory:myMemory(),card:{id:c.id,title:c.title,msg:c.msg,ref:c.ref,words:wKeys(c)}})
  .then(r=>{if(!r||!r.body)return;const was=(S.daily||{})[k]||{};
   S.daily={[k]:{v:P.count,card:c.id,body:r.body,question:r.question||loc.question,focus:r.focus||loc.focus,whisper:r.whisper||'',carry:r.carry||[],ncarry:r.ncarry||[],eve:was.eve}};
   if(r.memory)S.memory={text:r.memory,day:k};save();render()})
  .catch(()=>{});
}
// in the evening, once the day is lived: a question about how it went, written from what they chose to carry
let eveAsk='';
function askEvening(){
 if(!C.user||!personalOn()||!C.daily||!evening())return;
 const k=dkey(),ai=(S.daily||{})[k],carried=(S.carry||{})[k]||'';
 if(!ai||(ai.eve&&ai.eve.carried===carried)||eveAsk===k+carried)return;eveAsk=k+carried;
 const c=todayCard();
 C.daily({day:k,evening:true,carried,name:firstName(),sign:S.sign,story:myStory(),memory:myMemory(),card:{id:c.id,title:c.title,msg:c.msg,ref:c.ref,words:wKeys(c)}})
  .then(r=>{if(!r||!r.reflect||!(S.daily||{})[k])return;S.daily[k].eve={carried,reflect:r.reflect,ncarry:r.ncarry||[]};save();render()})
  .catch(()=>{});
}
// the day written for this reader: its theme, the Moon, their message, a question, and where to take it next
function pzCard(cls=''){
 const d=myDay(),k=dkey(),m=K.moon(new Date()),fold=cls==='hpz'&&!V.pzOpen;
 return `<section class="pz atl${cls?' '+cls:''}${fold?' fold':''}" aria-label="Written for you today"><p class="pz-k">${Kit.icon('star')}<span>Written for You</span>${Kit.icon('star')}</p>
 <h2 class="pz-t">${esc(d.focus)}</h2>
 <p class="pz-moon">${moonPic(m,'pz-mi')}<span>${esc(m.name)} in ${sIdx(d.sky.moonSign).name}</span></p>
 <p class="pz-b">${esc(d.body)}</p>${fold?'<button class="pz-more" data-act="pzmore">Read all of it</button>':''}<p class="pz-q">“${esc(d.question)}”</p>
 <div class="pz-acts obj-row">${obj('pen','data-act="jnew" data-k="pz"','Reflect in your Journal')}${obj('kas',`data-act="kasask" data-q="${esc(d.question)}"`,'Ask Kassandra')}</div>
 ${myPortrait().count?'':'<p class="pz-n">The more you write in your Journal, the more these words become your own.</p>'}</section>`;
}
function forYou(){
 const ch=hasBirthDate()&&S.fullName?myChart():null,rows=[];
 if(ch){const pl=n=>{const x=ch.pl.find(p=>p.n===n);return x?sIdx(x.sign).name:''},asc=ch.ang&&!S.birth.unk?sIdx(Math.floor(ch.ang.asc/30)).name:'';
  rows.push(lrow(ui('ex-chart','th round'),'Your Birth Chart',[pl('Sun')&&pl('Sun')+' Sun',pl('Moon')&&pl('Moon')+' Moon',asc&&asc+' Rising'].filter(Boolean).join(' · '),'data-go="you" data-t="chart"'))}
 else rows.push(lrow(ui('ex-chart','th round'),'Complete your Birth Details','Your birth day, time and place open your chart','data-go="discover" data-t="profile"'));
 const last=journalItems().sort((a,b)=>(b.day+(b.at||''))>(a.day+(a.at||''))?1:-1)[0];
 rows.push(last?lrow(ui('t-journal','th oval'),'Your Journal',`Last written: ${jHeading(last)}, ${relDay(last.day).toLowerCase()}`,'data-go="tarot" data-t="journal"'):lrow(ui('t-journal','th oval'),'Your Journal','Every thought you write is a star in your own sky','data-go="tarot" data-t="journal"'));
 const ev=A?upcoming().find(e=>e.k!=='ingress'):null;
 if(ev)rows.push(lrow(evArt(ev,true),esc(ev.name),evWhen(ev),`data-cal="open" data-ref="${esc(evRef(ev))}"`));
 return panel(`${orn('For You')}<div class="list">${rows.join('')}</div>`,'gilt hfor');
}
const sunSign=date=>{try{return sIdx(K.chart({date,unk:true,tz:'UTC'}).pl[0].sign).id}catch(e){return ''}};
function connSigns(c){
 if(c.kind==='zodiac')return [c.data.a,c.data.b];
 if(c.kind==='synastry'&&K){const t=c.data.them||{},me=hasBirthDate()?sunSign(S.birth.date):S.sign,them=t.date?sunSign(t.date):'';return me&&them?[me,them]:[]}
 return [];
}
function findEvent(ref,iso){if(!K||!iso)return null;const d=new Date(iso);return K.events(new Date(+d-2*DAY),new Date(+d+2*DAY)).find(e=>evRef(e)===ref)||null}
// lunar events reuse the painted phases: "Full Moon", "First Quarter Moon", "Total Lunar Eclipse" (a full moon)
const phaseSlug=n=>/^New Moon/.test(n)?'new-moon':/^Full Moon|Lunar Eclipse/.test(n)?'full-moon':/^First Quarter/.test(n)?'first-quarter':/^Last Quarter/.test(n)?'last-quarter':'';
// a tarot card's face: its painted artwork (art/deck) and the numeral and title set by the app
const tarotFace=c=>`${pic('deck',c.id,'tarot-art')}<div class="tf-num">${c.arcana==='major'?c.num:''}</div><div class="tf-plate"><span>${c.name}</span></div>`;
function cardScene(c,flipped,id){
 const sp=Array.from({length:10},(_,i)=>`<i class="spark" style="left:${10+i*8}%;top:${30+(i%4)*14}%;--dx:${(i%2?1:-1)*(10+i*4)}px;--dy:${-30-i*6}px"></i>`).join('');
 return `<div class="scene ${flipped?'flipped':''}" id="${id}" role="button" tabindex="0" aria-label="${flipped?esc(c.title)+'. Open the card':'Today’s whisper, face down. Press to reveal.'}" data-act="${flipped?'wpop':'reveal'}"><div class="card3d"><div class="face back"></div><div class="face front daily kt">${whisperFace(c)}</div></div>${sp}</div>`;
}
// a whisper's face: its artwork (art/whispers) and the engraved plaque with title and message
const whisperFace=c=>(ART.whispers||[]).includes(c.art)?Kit.tarot({art:'whispers/'+c.art,num:wNum(c),name:c.title}):`<div class="ph">${symbol(c.sym)}</div><div class="card-banner"><div class="cb-in"><div class="cb-title">${c.title}</div><p>${c.msg}</p></div></div>`;

/* ---------- AI read-aloud (ElevenLabs), signed-in only ---------- */
const AUDIO=new Map();let player=null;
function stopAudio(){if(player){player.pause();player=null}V.say=null}
function playText(txt){
 stopAudio();V.say=txt;
 return (AUDIO.has(txt)?Promise.resolve(AUDIO.get(txt)):C.speak(txt).then(b=>{const u=URL.createObjectURL(b);AUDIO.set(txt,u);return u}))
  .then(u=>{if(V.say!==txt)return;player=new Audio(u);player.onended=()=>{player=null;V.say=null;render()};return player.play()})
  .catch(e=>{if(V.say===txt){V.say=null;render()}toast(e.message||'Could not play the reading')});
}
/* ----- Horoscope: the landing (the reader's own sign first with the period and a glimpse of its reading, then their
   six areas of life with each one's theme, then every sign to read for someone else), then a sign's own
   page: its illustration, its words, the period, a row of the areas of life with a gold line under the chosen one, and
   the chosen area's reading; tapping an area, or swiping sideways, brings its reading in ----- */
const PLABEL={daily:['Today','Today’s'],weekly:['This Week','This Week’s'],monthly:['This Month','This Month’s'],yearly:['This Year','This Year’s']};
const periodSeg=()=>`<div role="group" aria-label="Time period">${seg(PERIODS.map(([k])=>[k,PLABEL[k][0]]),V.period,'period')}</div>`;
// Read for Someone Else: every sign as a carousel to swipe, the reader's own marked
const readOthers=()=>`<section class="hl-sec rfse">${Kit.divider('Read for Someone Else')}
 <p class="hso">A partner, a friend, a child: open the sky they were born beneath.</p>
 <div class="signs12 sg-car">${SIGNS.map(s=>`<button class="sgn${s.id===S.sign?' me':''}" data-act="tohoroscope" data-sign="${s.id}">${med(s.id,'sgn-i')}<span>${s.id===S.sign?'✦ '+s.name:s.name}</span></button>`).join('')}</div>
 </section>`;
// Sky, read for the reader: each thing in the sky with what it is, what it means for them (how its sign sits with theirs,
// the area of life it touches by their Sun sign, whether the planet is their ruler), one thing to do and a question
const RULER={aries:'Mars',taurus:'Venus',gemini:'Mercury',cancer:'Moon',leo:'Sun',virgo:'Mercury',libra:'Venus',scorpio:'Pluto',sagittarius:'Jupiter',capricorn:'Saturn',aquarius:'Uranus',pisces:'Neptune'};
const REL_IN={same:'in your own sign',mirror:'in your opposite sign',ease:'in a sign that flows with yours',friction:'in a sign that presses on yours',quiet:'in a sign that sits apart from yours'};
const REL_FEEL={same:'You feel this one first, and most directly.',mirror:'It reaches you through other people: watch what they reflect back to you.',ease:'It works with you, so things here come more easily.',friction:'It asks something of you: expect a little tension, and growth from it.',quiet:'It works quietly in the background for you.'};
const REL_S={same:'This one is yours',mirror:'It comes through someone close',ease:'It moves with you',friction:'It asks something of you',quiet:'It works quietly for you'};
const skyRel=si=>{const me=SIGNS.indexOf(sg(S.sign)),d=((si-me)%12+12)%12;return {rel:d===0?'same':d===6?'mirror':[2,4,8,10].includes(d)?'ease':[3,9].includes(d)?'friction':'quiet',area:HOUSE[d]}};
const areaShort=a=>a.split(',')[0].split(' and ')[0];
// an optional ritual for each thing in the sky, beside the Moon's own (RITUAL)
const RX_RITE={Mercury:'Light a candle and reread something you wrote a while ago: a letter, a journal page, an old message. Notice what you would say differently now.',Venus:'Take out a photograph of someone you have loved and write them a few lines you never have to send.',Mars:'Before you act on urgency or anger, sit still for five slow breaths and let the fire settle into strength.',Jupiter:'Write down one belief you hold about luck or meaning, and ask whether it still fits the person you are becoming.',Saturn:'Clear one small corner of your home and choose one simple promise to keep for the month ahead.',Uranus:'Change one small habit for a day: a different route, a different chair, a different morning.',Neptune:'Before sleep, set a glass of water by your bed and ask your dreams one gentle question.',Pluto:'Write what you are ready to release on a slip of paper, then tear it up and let it go.'};
const EV_RITE={lunar_eclipse:'At dusk, write one habit or fear you are ready to outgrow, fold the paper away, and open it again at the next New Moon.',solar_eclipse:'Sit in silence for a few minutes at the hour of the eclipse and write, in one line, the chapter you wish to begin.',equinox:'Light two candles, one for what you are grateful for and one for what you hope for, and let them burn side by side for a while.',solstice:'At nightfall, light a single candle and sit with it for a few minutes, honouring the turning of the light.',conjunction:'Write down two parts of your life that could meet and help each other, and one small way to bring them together.',opposition:'Draw a line down a page: what you give on one side, what you need on the other. Look for the balance between them.',meteor:'Go outside after dark, find the darkest sky you can, and make one quiet wish for each shooting star you see.'};
const SUN_RITE={Fire:'At sunrise or sunset, light a candle and name one thing you want to bring alive this month.',Earth:'Stand barefoot on grass or soil for a few minutes, or hold a stone in your hand, and name what you want to build this month.',Air:'Open a window, breathe slowly for a minute, and write down one idea you want to follow this month.',Water:'Wash your hands slowly in warm water and let it carry away one thing you no longer need this month.'};
// each thing in the sky has its own painting behind its window (art/sky): the Moon in its phase, each planet, the
// Sun, the eclipses and the meteor showers
const skyBgEv=(e,pn)=>e.k==='solar_eclipse'?'ev-solar-eclipse':e.k==='lunar_eclipse'?'ev-lunar-eclipse':e.type==='meteor'?'ev-meteor':pn?'pl-'+pn.toLowerCase():e.type==='moon'&&phaseSlug(e.name)?'moon-'+phaseSlug(e.name):'sun';
// where each painting's body is (its top and bottom, in px of a 390-wide painting): the painting is lifted so the body
// sits just inside the gold frame, and the title begins just under it
const SKY_POS={'moon-new-moon':[65,215],'moon-waxing-crescent':[72,215],'moon-first-quarter':[65,215],'moon-waxing-gibbous':[65,218],'moon-full-moon':[65,220],'moon-waning-gibbous':[62,220],'moon-last-quarter':[65,218],'moon-waning-crescent':[72,205],sun:[40,200],'ev-solar-eclipse':[60,200],'ev-lunar-eclipse':[70,238],'ev-meteor':[30,200],'pl-mercury':[72,200],'pl-venus':[65,180],'pl-mars':[72,215],'pl-jupiter':[60,222],'pl-saturn':[70,200],'pl-uranus':[48,232],'pl-neptune':[68,232],'pl-pluto':[80,220]};
const skyPos=bg=>{const [t,b]=SKY_POS[bg]||[65,220],y=Math.max(0,t-26);return `--sky-y:${(-y/390).toFixed(4)};--sky-t:${((b-y+4)/390).toFixed(4)}`};
function skyItems(){
 const now=new Date(),m=K.moon(now),dm=d=>ymdLong(dkey(d),{day:'numeric',month:'long'}),up=upcoming().filter(e=>e.date>now),out=[];
 {const r=skyRel(m.sign),sn=sIdx(m.sign).name;
  out.push({id:'moon',date:now,bg:'moon-'+m.name.toLowerCase().replace(/ /g,'-'),img:moonPic(m,'sky-i'),title:`Moon in ${sn}`,when:`Today · ${m.name}`,line:`${cap(REL_IN[r.rel])}. Today your feelings turn towards ${areaShort(r.area)}.`,
   fact:`Tonight the Moon is a ${m.name} in ${sn}. ${MOON_LINE[m.name]||''}`,
   you:`The Moon is ${REL_IN[r.rel]}. ${REL_FEEL[r.rel]} It lights ${r.area}, so that is where your feelings gather today.`,
   act:`Give ${areaShort(r.area)} ten quiet minutes today: notice what you feel there, without trying to fix it.`,rit:RITUAL[m.name]||'Give yourself ten quiet minutes tonight.',q:'What am I feeling today that I have not yet said aloud?',more:'moon',moreL:'The Moon’s full page'})}
 const rxs=K.retrogrades(now,new Date(+now+120*DAY)),rx=rxs.find(w=>w.start&&w.start<=now&&(!w.end||w.end>=now))||rxs.find(w=>w.start&&w.start>now);
 if(rx){const on=rx.start<=now,P=rx.planet,mine=RULER[S.sign]===P,r=skyRel(K.signIdx(K.lon(P,on?now:rx.start)));
  out.push({id:'rx',date:on?now:rx.start,soon:on,bg:'pl-'+P.toLowerCase(),img:ui('pl-'+P.toLowerCase(),'sky-i'),title:`${P} retrograde`,when:on?`Now, until ${rx.end?dm(rx.end):'next year'}`:`From ${dm(rx.start)}${rx.end?' to '+dm(rx.end):''}`,
   line:`${mine?P+' is your ruling planet, so you feel this more than most.':'A time to review '+PM[P]+'.'} It touches ${areaShort(r.area)}.`,
   fact:`${P} appears to stop and move backwards against the stars. It is an effect of Earth’s own orbit; the planet never truly reverses.`,
   you:`${mine?`${P} is the ruling planet of ${sg(S.sign).name}, so you feel this more than most. `:''}Traditionally a time to review ${PM[P]}: to revisit and revise rather than launch. ${P} is ${REL_IN[r.rel]}, touching ${r.area}. ${REL_FEEL[r.rel]}`,
   act:'Finish or revisit one thing you left half-done before you begin anything new.',rit:RX_RITE[P],q:'What deserves a second look?',more:'planets',moreL:'Where the planets are now'})}
 up.filter(e=>['moon','eclipse','conjunction','season','meteor','planet'].includes(e.type)&&!/elongation/i.test(e.name)).slice(0,5).forEach(e=>{const i=evInfo(e),r=e.sign!=null?skyRel(e.sign):null,sn=e.sign!=null?sIdx(e.sign).name:'';
  const pn=(e.name.match(/Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto/)||[])[0];
  out.push({id:'ev:'+evRef(e),date:e.date,ev:true,bg:skyBgEv(e,pn),sig:!!r,img:pn?ui('pl-'+pn.toLowerCase(),'sky-i'):e.type==='season'?ui('pl-sun','sky-i'):evArt(e,true).replace('ev-r','sky-i'),title:esc(e.name)+(sn&&e.type==='moon'?` in ${sn}`:''),when:dm(e.date),
   line:r?`${REL_S[r.rel]}: ${areaShort(r.area)}.`:'A night to step outside and look up.',
   fact:i.fact,you:r?`${i.sym} For you it falls ${REL_IN[r.rel]}, lighting ${r.area}. ${REL_FEEL[r.rel]}`:`${i.sym} There is no sign to read here, only something beautiful to see.`,
   act:r?`Mark the date, and give ${areaShort(r.area)} ten quiet minutes that day.`:'Mark the date, step outside and look up.',rit:RITUAL[e.name]||EV_RITE[e.k]||EV_RITE[e.type]||'Step outside that night, look up for one whole minute, and breathe.',q:i.ref||'What would I like to notice that day?',more:'',moreA:`data-cal="open" data-ref="${esc(evRef(e))}"`,moreL:'Its page in the Calendar'})});
 {const si=K.signIdx(K.positions(now)[0].lon),sun=sIdx(si),r=skyRel(si);
  out.push({id:'sun',date:now,season:true,bg:'sun',img:ui('pl-sun','sky-i'),title:`Sun in ${sun.name}`,when:`${sun.name} season`,line:`${cap(REL_IN[r.rel])}. This month’s light falls on ${areaShort(r.area)}.`,
   fact:`The Sun is moving through ${sun.name}, as it does at this time every year. Each season lasts about a month.`,
   you:`${sun.name} season colours everyone’s days: ${SIGN_KEYS[sun.id].join(', ').toLowerCase()}. The Sun is ${REL_IN[r.rel]}, so for about a month it lights ${r.area}. ${REL_FEEL[r.rel]}`,
   act:`Choose one small thing to tend this month in ${areaShort(r.area)}.`,rit:SUN_RITE[sun.el],q:`What is asking for my attention in ${areaShort(r.area)}?`,more:'planets',moreL:'Where the planets are now'})}
 return out;
}
// For you: what matters most today, at most three; Ahead: what is coming, in order
const skyToday=()=>{const it=skyItems(),now=new Date(),pick=[it.find(x=>x.id==='moon'),it.find(x=>x.id==='rx'&&(x.soon||x.date-now<30*DAY)),it.find(x=>x.ev&&x.sig&&x.date-now<21*DAY),it.find(x=>x.id==='sun')].filter(Boolean);return pick.slice(0,3)};
const skyAhead=()=>skyItems().filter(x=>x.ev||(x.id==='rx'&&!x.soon)).sort((a,b)=>a.date-b.date).slice(0,4);
const skyRow=x=>`<button class="sky-c" data-act="skd" data-id="${esc(x.id)}">${x.img}<span class="sky-x"><strong>${x.title}</strong><em>${x.when}</em><span>${x.line}</span></span><span class="sky-go">${IC.chev}</span></button>`;
// the tiles as a carousel: one large tile at a time, turning by itself, swiped by hand
const skyCar=l=>`<div class="sky-l"><div class="en-track sky-t" aria-roledescription="carousel">${l.map(skyRow).join('')}</div><nav class="hp-dots sky-dn" aria-label="Swipe to move between them"><button class="hp-ch l" data-act="skymove" data-d="-1" aria-label="Previous"><svg viewBox="0 0 10 16"><path d="M8 2L2 8l6 6"/></svg></button><span class="en-dots sky-d" aria-hidden="true">${l.map((_,i)=>`<i${i?'':' class="on"'}></i>`).join('')}</span><button class="hp-ch r" data-act="skymove" data-d="1" aria-label="Next"><svg viewBox="0 0 10 16"><path d="M2 2l6 6-6 6"/></svg></button></nav></div>`;
function skyPop(x){
 const tiles=[[['What is happening',x.fact]],[['What it means for me',x.you]],[['One thing to do',x.act],['An optional ritual',x.rit]].filter(t=>t[1]),[['A question to sit with',x.q]]].map(t=>t.filter(u=>u[1])).filter(t=>t.length);
 return `<div class="cpop wpz skz skb" style="--skbg:url(art/sky/${x.bg||'sun'}.webp);${skyPos(x.bg||'sun')}" role="dialog" aria-modal="true" aria-label="${x.title}" data-act="skdx"><i class="skb-bg" aria-hidden="true"></i><button class="cp-x" data-act="skdx" aria-label="Close">×</button><div class="cp-in">
 <p class="cp-k">${x.when}</p><h2 class="cp-t">${x.title}</h2>
 <div class="skz-car"><div class="skz-track" aria-roledescription="carousel">${tiles.map((parts,i)=>`<section class="cp-box skz-tile${i===1?' you':''}${parts[0][0]==='A question to sit with'?' q':''}${parts.length>1?' two':''}" aria-label="${parts.map(u=>u[0]).join(' and ')}, ${i+1} of ${tiles.length}">${parts.map(([h,t])=>`<div class="skz-part"><h3>${h}</h3><p>${esc(t)}</p></div>`).join('')}</section>`).join('')}</div>
  <nav class="hp-dots skz-dn" aria-label="Swipe to move between them"><button class="hp-ch l" data-act="skzmove" data-d="-1" aria-label="Previous"><svg viewBox="0 0 10 16"><path d="M8 2L2 8l6 6"/></svg></button><span class="skz-d" aria-hidden="true">${tiles.map((_,i)=>`<i${i?'':' class="on"'}></i>`).join('')}</span><button class="hp-ch r" data-act="skzmove" data-d="1" aria-label="Next"><svg viewBox="0 0 10 16"><path d="M2 2l6 6-6 6"/></svg></button></nav></div>
  <div class="skz-obj"><button data-act="kasask" data-q="${esc(x.q)}" aria-label="Ask Kassandra about it">${ui('ic-orb-k','skz-o')}</button><button class="skd-m" ${x.moreA||`data-go="discover" data-t="${x.more}"`}>${x.moreL} ${IC.chev}</button><button data-act="skdwrite" data-t="${esc(x.title)}" aria-label="Write about it in your Journal">${ui('ic-quill-k','skz-o')}</button><button class="skz-heart" data-heart="sky:${esc(x.id)}:${dkey()}" aria-pressed="${hearted('sky:'+x.id+':'+dkey())}" aria-label="${hearted('sky:'+x.id+':'+dkey())?'In My Library':'Keep in My Library'}" style="--fill:${hearted('sky:'+x.id+':'+dkey())?'currentColor':'none'}">${IC.heart}</button></div></div></div>`}
// the window's tiles: the dots follow the swipe; one step is a tile and the gap after it
const skzStep=T=>T.children.length>1?T.children[1].offsetLeft-T.children[0].offsetLeft:Math.max(1,T.clientWidth);
function skzCar(){const t=$('.skz-track');if(!t||t._on)return;t._on=1;
 // a tile longer than the room the window has: its words are set a little smaller until they fit (never below 13px)
 const fitT=()=>t.querySelectorAll('.skz-tile').forEach(x=>{const ps=[...x.querySelectorAll('p')];if(!ps.length)return;const cs=getComputedStyle(x),room=()=>x.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom),need=()=>[...x.children].reduce((a,c)=>a+c.offsetHeight+parseFloat(getComputedStyle(c).marginTop)+parseFloat(getComputedStyle(c).marginBottom),0);let f=21;const set=()=>ps.forEach(p=>p.style.setProperty('font-size',f+'px','important'));set();while(need()>room()-2&&f>14){f-=.5;set()}});requestAnimationFrame(()=>requestAnimationFrame(fitT));const dots=[...document.querySelectorAll('.skz-d i')];
 t.addEventListener('scroll',()=>requestAnimationFrame(()=>{const i=Math.round(t.scrollLeft/skzStep(t));dots.forEach((d,j)=>d.classList.toggle('on',j===i))}),{passive:true})}
function skyDetail(x){
 return `<div class="land hland hnight skyp pg pg-sky skd"><div class="skd-bar">${iconBtn('back','data-act="skdx"','Back')}</div>
 <header class="skd-h">${x.img}<div><h1 class="pg-t">${x.title}</h1><p class="pg-s">${x.when}</p></div></header>
 <div class="skd-b"><section><h3>What is happening</h3><p>${esc(x.fact)}</p></section>
 <section class="you"><h3>What it means for you</h3><p>${esc(x.you)}</p></section>
 <section><h3>One thing to do</h3><p>${esc(x.act)}</p></section>
 <p class="skd-q">“${esc(x.q)}”</p>
 <div class="sx-acts obj-row">${obj('kas',`data-act="kasask" data-q="${esc(x.q)}"`,'Ask Kassandra')}${obj('pen',`data-act="skdwrite" data-t="${esc(x.title)}"`,'Write about it in your Journal')}<button class="skz-heart" data-heart="sky:${esc(x.id)}:${dkey()}" aria-pressed="${hearted('sky:'+x.id+':'+dkey())}" aria-label="Keep in My Library" style="--fill:${hearted('sky:'+x.id+':'+dkey())?'currentColor':'none'}">${IC.heart}</button></div>
 <button class="skd-m" ${x.moreA||`data-go="discover" data-t="${x.more}"`}>${x.moreL} ${IC.chev}</button></div></div>`}
views.horoscope=()=>{
 if(!A||!K)return needLib();
 if(tab()==='sign')return horoSign();
 const skx=V.skd&&skyItems().find(i=>i.id===V.skd);if(V.skd&&!skx)V.skd=null;
 const sign=sg(S.sign),nm=firstName(),pl=PLABEL[V.period],pw=PWORD[V.period];
 const ov=horoscope(S.sign,'overview',V.period),first=(String(ov.body||'').match(/^[^.!?]*[.!?]/)||[''])[0].trim();
 const read=V.period==='daily'&&S.readDay===dkey();
 // Your Sky is a row of pages under one head: Horoscope, the sky now, the Calendar and the Library, each on one screen
 const now=new Date(),mn=K.moon(now),ev=nextEvent(now),qt=V.period==='daily'?(String(myDay().body).match(/^[^.!?]*[.!?]/)||[''])[0]:first,sc=pgCur('sky');
 let pg;
 if(sc==='hor')pg=`<div class="sk-who">${glyphMed(sign.id,'sk-med')}<div><h2 class="sk-n">${sign.name}</h2><p class="sk-dt">${sign.dates}</p><p class="sk-ky">${keys(SIGN_KEYS[sign.id])}</p></div><button class="btn hm-go sk-go${read?' on':''}" data-act="tohoroscope">${read?'Read again':'Read'}</button></div>
  <p class="sky-k">${Kit.icon('star')}<span>Your sky today</span>${Kit.icon('star')}</p>${skyCar(skyToday())}`;
 else if(sc==='ahead')pg=`<div class="sky-l sky-list">${skyAhead().map(skyRow).join('')}</div>`;
 else pg=`<p class="pg-in">The old knowledge, open to you</p><div class="sky-l sky-list or-list jn-list yo-list lib-grid"><button class="sky-c" data-act="libgo" data-tab="guides">${ui('ic-book','sky-i')}<span class="sky-x"><strong>Guides</strong><span class="jn-x">Where to begin, in plain words</span></span><span class="sky-go">${IC.chev}</span></button><button class="sky-c" data-act="libgo" data-tab="signs">${ui('m-'+S.sign,'sky-i')}<span class="sky-x"><strong>The twelve signs</strong><span class="jn-x">Yours, and everyone you love</span></span><span class="sky-go">${IC.chev}</span></button><button class="sky-c" data-act="libgo" data-tab="planets">${pic('cats','planets','sky-i')}<span class="sky-x"><strong>The planets</strong><span class="jn-x">What each one speaks of</span></span><span class="sky-go">${IC.chev}</span></button><button class="sky-c" data-act="libgo" data-tab="houses">${pic('cats','houses','sky-i')}<span class="sky-x"><strong>The houses</strong><span class="jn-x">Twelve areas of a life</span></span><span class="sky-go">${IC.chev}</span></button></div>`;
 return `<div class="land hland hnight skyp pg pg-sky"><header class="hl-top stay sk-head"><h1 class="pg-t">${nm?esc(nm)+'’s sky':'Your sky'}</h1><p class="pg-s">What the stars say, now</p>${pgStrip('sky')}</header>
 <div class="sk-body"><div class="pg-page${pgDir()}">${pg}</div></div></div>
 ${V.spk?signPick(S.sign):''}${skx?skyPop(skx):''}`;
};
function horoSign(){
 const ex=V.exploreSign||S.sign,s=sg(ex),cat=V.hcat,h=horoscope(ex,cat,V.period);markRead({k:'horo',sign:ex,cat,period:V.period,from:{sec:'horoscope',t:'sign'}});
 if(ex===S.sign&&V.period==='daily'&&S.readDay!==dkey()){S.readDay=dkey();save()}
 const ref=`${ex}/${cat}/${V.period}/${h.per.key}`,saved=isSaved('horoscope',ref),n=HCATS.length,ci=Math.max(0,HCATS.findIndex(x=>x[0]===cat));
 // one area's reading: its words alone
 const reading=k=>{const h=horoscope(ex,k,V.period);
  return `<div class="read">${paras(h.body)}</div>
  ${ex!==S.sign?`<div class="acts"><button class="btn ghost" data-act="setsign" data-sign="${ex}">Set ${s.name} as my sign</button></div>`:''}
  ${k==='money'?'<p class="muted small">For reflection only. This is not financial advice.</p>':''}${k==='health'?'<p class="muted small">For reflection only. This is not medical advice.</p>':''}`};
 // beneath the time, the area being read: its medallion lit between an arrow back and an arrow forward, the
 // medallions passing through like a carousel as the reading changes
 const pv=HCATS[(ci+n-1)%n][0],nx=HCATS[(ci+1)%n][0],playing=V.say===h.body;
 const ctl=`<div class="hc-ctl"><button class="hc-arr hc-pv" data-act="hcat" data-k="${pv}" data-dir="-1" aria-label="Back to ${CAT_INFO[pv][0]}">${IC.chev}</button>
  <div class="hc-win" role="group" aria-label="Areas of life"><div class="hc-track" style="--p:${ci}">${HCATS.map(([k],x)=>`<button class="hc-s${x===ci?' on':''}" data-act="hcat" data-k="${k}" aria-pressed="${x===ci}" aria-label="${CAT_INFO[k][0]}">${ui('hz-'+k,'hc-m','',true)}<span class="hc-sl">${CAT_INFO[k][0]}</span></button>`).join('')}</div></div>
  <button class="hc-arr hc-nx" data-act="hcat" data-k="${nx}" data-dir="1" aria-label="Next, ${CAT_INFO[nx][0]}">${IC.chev}</button></div>`;
 const PSHORT={daily:'Today',weekly:'Week',monthly:'Month',yearly:'Year'};
 const per=`<div class="sx-per" role="tablist" aria-label="Time period">${PERIODS.map(([k])=>`<button role="tab" aria-selected="${V.period===k}" data-period="${k}">${PSHORT[k]}</button>`).join('')}</div>`;
 const listen=obj('speak','data-act="hspeak"',playing?'Stop reading aloud':'Read aloud',playing?'on':'');
 const heart=obj('like',`data-act="bookhoro" data-ref="${ref}" aria-pressed="${saved}"`,saved?'Saved to your journal':'Save to your journal',saved?'on':'');
 // the whole page on one screen: at its head the sign's painting dissolved into the night, its constellation, symbol,
 // name, dates and soul in the open sky at its left; right beneath it the time and the area's medallion between the
 // arrows, then the reading on an invisible card in the app's own reading size, laid out in pages that each sit whole
 // (a swipe turns the page, and after the last brings in the next area of life while the head stays still); at the
 // foot, above the menu, an invitation to write about it and another to read for someone else, a mark for each page
 // between them
 return `<div class="hsp hframe sx s-${s.id} skyp pg pg-hs"><div class="hsp-bar">${iconBtn('back','data-act="back"','Back')}<span class="hsp-r">${listen}${obj('share',`data-act="sharecard" data-k="horo" data-s="${ex}" data-cat="${cat}"`,'Share this reading')}${heart}</span></div>
 <header class="sx-head"><span class="sx-pic" aria-hidden="true" style="${figVars(s.id)}"><span class="sp-moon"><img src="/art/atlas/home-halo.webp" alt=""></span><img class="wf-fg" src="/art/atlas/fg-${s.id}.webp" alt=""></span><h1 class="pg-t" style="--nl:${s.name.length}">${s.name}</h1><p class="pg-s">${s.dates}</p>${per}</header>
 <div class="sx-main">${ctl}
 <div class="hcar"><div class="hc-read" aria-live="polite">${HCATS.map(([k])=>`<div class="hc-slide${k===cat?' cur':''}" data-k="${k}" data-ref="${ex}/${k}/${V.period}/${horoscope(ex,k,V.period).per.key}"${k===cat?'':' hidden'}>${reading(k)}</div>`).join('')}</div></div>
 <div class="sx-ft"><div class="hc-pgs" role="group" aria-label="Pages"></div></div>
 <div class="sx-acts obj-bar">${obj('kas',`data-act="kasask" data-q="${esc(`What does ${PSHORT[V.period]==='Today'?'today':'this '+PSHORT[V.period].toLowerCase()} hold for my ${CAT_INFO[cat][0].toLowerCase()}?`)}"`,'Ask Kassandra about it')}<button class="sx-other" data-act="spkopen">Read for someone else ${IC.chev}</button>${obj('pen',`data-act="hreflect" data-ref="${ref}"`,'Write about it in your Journal')}</div></div>
 ${V.spk?signPick(ex):''}
 </div>`;
}
// reading a page aloud: Kassandra's own voice when signed in, otherwise the device's
function speakText(txt){
 if(V.say===txt){stopAudio();if(window.speechSynthesis)speechSynthesis.cancel();return render()}
 if(C.user){playText(txt);return render()}
 if(!window.speechSynthesis)return toast('Reading aloud is not supported in this browser.');
 speechSynthesis.cancel();V.say=txt;const u=new SpeechSynthesisUtterance(txt);u.lang='en-GB';u.rate=.95;u.onend=u.onerror=()=>{if(V.say===txt){V.say=null;render()}};speechSynthesis.speak(u);render();
}
/* ----- Tarot: the daily ritual (Whispers, with its reflection) and the intentional readings (spreads) share the tab,
   with the Journal beside them, where any reading the reader chooses to keep is saved ----- */
// the five places share one layout: a head that stands still, a few doors or one action under it, and no scrolling
const SVGI=(p,s=1.2)=>`<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="${s}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const door=(at,label,inner)=>`<button class="sk-d" ${at}>${inner}<span>${label}</span></button>`;
const doorArt=(at,label,img)=>door(at,label,`<i class="sk-di">${ui(img,'')}</i>`);
const DI={profile:'<circle cx="16" cy="12" r="5"/><path d="M6 27c1-6 5-9 10-9s9 3 10 9"/>',birth:'<path d="M16 4v6M16 22v6M4 16h6M22 16h6"/><circle cx="16" cy="16" r="4"/>',bell:'<path d="M8 23h16l-2-3v-6a6 6 0 0 0-12 0v6zM13 26a3 3 0 0 0 6 0"/>',lock:'<rect x="8" y="14" width="16" height="12" rx="2"/><path d="M11 14v-3a5 5 0 0 1 10 0v3"/>',star:'<path d="M16 5l3 8 8 .6-6.2 5.2 2 8.2L16 22.6 9.2 27l2-8.2L5 13.6 13 13z"/>',book:'<path d="M6 7h6v18H6zM13 5h6v20h-6zM21 9l5 1.4-4 15.2-5-1.4z"/>',cal:'<rect x="6" y="8" width="20" height="18" rx="2"/><path d="M6 14h20M11 5v6M21 5v6"/>',list:'<path d="M9 9h16M9 16h16M9 23h16M5 9h.1M5 16h.1M5 23h.1"/>',pen:'<path d="M8 25l1-5L22 7l4 4L13 24zM19 10l4 4"/>',two:'<circle cx="12" cy="13" r="5"/><circle cx="21" cy="13" r="5"/><path d="M6 26c1-4 4-6 6-6M26 26c-1-4-4-6-6-6"/>'};
const PGC={sky:[['hor','For you'],['ahead','Ahead'],['lib','Library']],jn:[['tonight','Write'],['pages','Pages'],['ins','Patterns']],or:[['kas','Kassandra'],['cards','Cards'],['dreams','Dreams']],you:[['codex','Your sky'],['circle','Your circle'],['details','Account']]};
// a place opened from the menu always opens on its first page (Sky on For you, Oracle on Kassandra, Journal on Write,
// You on Your sky), never where the reader last left it; Today instead opens on the step not yet seen or done
function navFresh(nav){
 const g={horoscope:'sky',tarot:'or',journal:'jn',you:'you'}[nav];if(!g)return;
 if(S.pgc&&S.pgc[g]){delete S.pgc[g];save()}
 V.pdir=0;
 if(g==='sky'){V.skd=null;V.exploreSign=null;V.hcat='overview';V.period='daily';V.spk=false}
 if(g==='or'&&V.tarot&&V.tarot.stage!=='setup')newReading();
}
const pgCur=g=>{const c=(S.pgc||{})[g],l=PGC[g];return l.some(x=>x[0]===c)?c:l[0][0]};
const pgStrip=g=>`<div class="seg pg-strip" role="tablist" aria-label="Sections">${PGC[g].map(([k,l])=>`<button role="tab" aria-selected="${k===pgCur(g)}" data-act="pgcat" data-g="${g}" data-k="${k}">${l}</button>`).join('')}</div>`;
const pgDir=()=>{const d=V.pdir||0;V.pdir=0;return d?` sl${d>0?'r':'l'}`:''};
const tile=(at,label,sub,inner)=>`<button class="pg-tile" ${at}><i class="pg-ti">${inner}</i><b>${label}</b>${sub?`<span>${sub}</span>`:''}</button>`;
const tileArt=(at,label,sub,img)=>tile(at,label,sub,ui(img,''));
const pgl=t=>`<p class="pg-l"><span>${t}</span></p>`;
views.tarot=()=>{
 const t=tab();
 if(t==='whisper')return whisperView();
 if(t==='reading')return tarotView();
 if(t==='journal')return journalLib();
 if(t==='entry')return entryView();
 // the Notebook, the Reading History and the Journal Calendar page were removed (the calendar now opens the Journal);
 // an old link to any of them opens the Journal, and one to the insights opens them over it
 if(['notebook','history','calendar','insights'].includes(t)){if(t==='insights')V.insPop=true;V.tab.tarot='journal';history.replaceState(history.state,'',pathFor('tarot','journal',viewQuery()));return journalLib()}
 // the night with the old card and the lilies holds still behind the page; the title under the arc, then today's card
 // (the daily step, the same Whisper as on Home) and the readings, each way of reading one tap from its own spread
 const nm=firstName();
 const oc=t==='spreads'?'cards':pgCur('or');let pg;
 if(oc==='kas'){const has=KS.msgs.length>0,last=has?[...KS.msgs].reverse().find(m=>m.role==='user'):null;
  pg=`<section class="or-k"><span class="tk-m">${ui('kassandra','tk-i')}</span><div><h3>${has?'She remembers':'She is listening'}</h3><p>${has&&last?`You last asked: “${esc(clip(last.content,70))}”`:'Speak or write your question. She knows your sign, your chart and your day.'}</p>${obj('kas','data-act="kasgo"',has?'Continue with Kassandra':'Ask Kassandra','obj-big')}</div></section>
  <section>${pgl(has?'Or ask her':'Or begin with')}<div class="or-pr">${kasPrompts().slice(0,2).map(q=>`<button class="or-p" data-act="kasask" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div></section>`}
 else if(oc==='cards')pg=`<div class="sky-l sky-list or-list">${Object.entries(SPREADS).map(([sk,x])=>`<button class="sky-c" data-act="tspreadgo" data-k="${sk}">${ui('ic-'+sk,'sky-i')}<span class="sky-x"><strong>${x.s}</strong><span>${SPREAD_FOR[sk]}</span></span><span class="or-n">${x.p.length} card${x.p.length>1?'s':''}</span><span class="sky-go">${IC.chev}</span></button>`).join('')}</div>`;
 else{const ld=dreams()[0];pg=`<section class="dr-in"><p class="dr-lead">Tell Kassandra what you saw, and uncover what it is asking you to notice.</p><div class="or-two"><button class="btn" data-go="discover" data-t="new-dream">Bring a dream</button><button class="btn ghost" data-go="discover" data-t="dream-journal">Dream journal</button></div></section>
  ${ld&&ld.text?`<div class="sky-l sky-list or-list"><button class="sky-c" data-go="discover" data-t="dream-journal">${ui('d-dream','sky-i')}<span class="sky-x"><strong>Your last dream</strong><span>“${esc(clip(ld.text,60))}”</span></span><span class="sky-go">${IC.chev}</span></button></div>`:''}
  <section>${pgl('Common symbols')}<div class="symrow">${['water','flying','snake','house','death'].map(id=>{const x=dsym(id);return `<button data-act="libgo" data-tab="dreams" data-q="${esc(x.name.replace(/^(The|A|An) /,''))}">${artOf(x.art,'sym-i')}<strong>${x.name.replace(/^The /,'')}</strong></button>`}).join('')}</div></section>`}
 return `<div class="land tland hnight tnight skyp pg pg-or"><header class="hl-top stay sk-head"><h1 class="pg-t">Oracle</h1><p class="pg-s">${nm?esc(nm)+', what':'What'} do you seek?</p>${pgStrip('or')}</header>
 <div class="sk-body"><div class="pg-page${pgDir()}">${pg}</div></div></div>`;
};
function whisperView(){
 const k=dkey(),c=todayCard(),rev=!!S.revealed[k],sv=S.saved.some(x=>x.date===k);
 return `<div class="mnp wh">${mnHead('Daily Whisper',iconBtn('help','data-act="whelp"','About the Daily Whisper'))}
 ${V.whelp?mbox(`<p>One card a day, drawn from ${ORACLE.length} Whispers. You will not see the same card again until you have met them all. Read it, sit with it, and write what it stirs in you: every reflection is kept in your Journal.</p>`):''}
 ${cardScene(c,rev,'fortuneCard')}
 ${rev?mbox(`<p class="kpills">${keys(wKeys(c))}</p><p class="w-msg">${esc(c.msg)}</p><p class="w-ref">${esc(c.ref)}</p>
  <div class="acts row-acts obj-row">${obj('pen',`data-act="jopen" data-k="fortune:${k}"`,S.notes[k]?'Keep writing in your Journal':'Write your reflection in your Journal')}${obj('share','data-act="sharecard" data-k="whisper"','Share this Whisper')}${obj('like',`data-act="savecard" aria-pressed="${sv}"`,sv?'Saved to your journal':'Save to your journal',sv?'on':'')}</div>`)
 :`<button class="btn" data-act="reveal">Turn over my Whisper</button><p class="muted center small">One card a day, drawn from ${ORACLE.length}. Tap the card or the button to turn it over.</p>`}${V.wpop?whisperPop(c):''}</div>`;
}
function tarotView(){
 const T=V.tarot,sp=SPREADS[T.spread];
 // 1. the reading type and the question; Shuffle draws a fresh deck
 if(T.stage==='setup')return `<div class="mnp trd trs">${mnHead('Card Reading')}
  <div class="trs-sp">${ui('ic-'+T.spread,'trs-i')}<h2>${sp.s}</h2><p class="trs-f">${SPREAD_FOR[T.spread]||''}</p>${sp.p.join(' · ')===sp.s?`<p class="trs-p">${sp.p.length} cards</p>`:`<p class="trs-p">${sp.p.length>5?sp.p.length+' cards, from the present to the outcome':sp.p.join(' · ')}</p>`}</div>
  <div class="field"><label for="q">Your question (optional)</label><input type="text" id="q" value="${esc(T.q)}" placeholder="Ask about anything: love, work, a choice…"></div><button class="btn" data-act="shuffle">Shuffle the cards</button>
  <button class="skd-m" data-act="tspreadback">Choose another reading ${IC.chev}</button></div>`;
 // 2. pick face-down cards; the reveal opens by itself once enough are chosen
 if(T.stage==='pick')return `<div class="mnp trd">${mnHead(`Choose ${sp.p.length} card${sp.p.length>1?'s':''}`)}<p class="mn-sub">${sp.n} · ${T.picks.length} of ${sp.p.length} chosen</p><div class="grid5">${T.deck.slice(0,20).map((c,i)=>`<button class="mini" aria-label="Card ${i+1}" aria-pressed="${T.picks.includes(i)}" data-pick="${i}"></button>`).join('')}</div></div>`;
 // 3. the drawn cards, each flipped by a tap; a revealed card opens its full details
 const cards=T.drawn,done=cards.every(c=>c.shown);if(done)markRead({k:'reading',cards,from:{sec:'tarot',t:'reading'}});
 return `<div class="mnp trd">${mnHead(sp.s.replace(/ · /g,' · '))}<p class="mn-sub">${sp.n}</p>${T.q?`<p class="quote center">“${esc(T.q)}”</p>`:''}<p class="muted center">${done?'Tap a card to read it in full.':'Tap each card to reveal it.'}</p><div class="rd-grid${cards.length===1?' solo':''}">${cards.map((c,i)=>`<div class="rd-cell"><div class="label">${c.pos}</div><div class="scene ${c.shown?'flipped':''} ${c.rv?'rev':''}" role="button" tabindex="0" data-act="tflip" data-k="${i}" aria-label="${c.shown?esc(c.name)+(c.rv?', reversed':'')+'. Open details':esc(c.pos)+', face down. Reveal'}"><div class="card3d"><div class="face back"></div><div class="face front tarot-face bare">${pic('deck',c.id,'tarot-art')}</div></div></div></div>`).join('')}</div>
 ${done?mbox(`<div class="int-hd"><h2>Interpretation</h2><span class="int-ic obj-row">${obj('share','data-act="sharecard" data-k="reading"','Share this reading')}${obj('like',`data-act="${T.savedId?'jopen':'saveread'}"${T.savedId?` data-k="reading:${esc(T.savedId)}"`:''} aria-pressed="${!!T.savedId}"`,T.savedId?'Saved to your journal':'Save to your journal',T.savedId?'on':'')}</span></div>${T.ai?`<div class="ai-read read">${(T.ai.cards||[]).map((x,i)=>cards[i]?`<p class="kick">${cards[i].pos} · ${cards[i].name}${cards[i].rv?' · reversed':''}</p><p>${esc(x)}</p>`:'').join('')}${T.ai.whole?`<div class="rule"></div><p class="kick">The reading as a whole</p>${paras(T.ai.whole)}`:''}<p class="muted small">Written with AI for this spread and question.</p></div>`:T.aiState==='loading'?'<p class="muted">The cards are speaking…</p>':`<div class="read">${cards.map(c=>{const k=SPREAD_CTX[T.spread]||'growth';return `<p><strong>${c.pos}.</strong> ${c.name}${c.rv?' reversed':''}: ${c.rv?c.revm:c.upm} <em>${c[k]}</em></p>`}).join('')}</div><p class="quote">${T.q?'Held against your question, notice which of these themes you already recognise in your own life, and which you resist.':'Notice which of these themes you already recognise in your own life, and which you resist.'}</p>${C.enabled&&!C.user?'<p class="muted">Sign in for a personal AI interpretation.</p>':''}`}<p class="muted small">Symbols for reflection, not predictions.</p>
 ${T.savedId?obj('pen',`data-act="jopen" data-k="reading:${esc(T.savedId)}"`,'Write tonight’s reflection in your Journal'):''}<button class="btn ghost" data-act="newread">A new reading</button>`):''}
 ${V.tpop!=null?tarotPop(cards[V.tpop]):''}</div>`;
}
// pop-up with a drawn card's full details: card, number, keywords, meanings and readings by context
function tarotPop(c){const k=V.tctx||'love';
 return `<div class="cpop" role="dialog" aria-modal="true" aria-label="${esc(c.name)}" data-act="tpopclose"><button class="cp-x" data-act="tpopclose" aria-label="Close">×</button><div class="cp-in">
 <p class="cp-k">${esc(c.pos||'')}${c.pos?' · ':''}${c.arcana==='major'?'Major Arcana · '+c.num:'Minor Arcana · '+c.suit}${c.rv?' · reversed':''}</p><h2 class="cp-t">${c.name}</h2>
 <div class="cp-card ${c.rv?'rev':''}"><div class="scene flat ${c.rv?'rev':''}" role="img" aria-label="${esc(c.name)}"><div class="face front tarot-face">${tarotFace(c)}</div></div></div>
 <div class="cp-box"><p class="cp-lab">Upright · ${c.up}</p><p class="cp-msg">${c.upm}</p><p class="cp-lab">Reversed · ${c.rev}</p><p class="cp-msg">${c.revm}</p><div class="cp-rule" aria-hidden="true"></div>
 <div class="seg" role="tablist">${Object.entries(CTX).map(([x,l])=>`<button role="tab" aria-selected="${k===x}" data-act="tctx" data-k="${x}">${l}</button>`).join('')}</div><p class="cp-ref">${c[k]}</p>
 <button class="obj-b obj-kas" data-act="kasask" data-q="What does ${esc(c.name)}${c.rv?' reversed':''} suggest in the ${esc(c.pos)} position of my reading?" aria-label="Ask Kassandra about this card">${ui(OBJ.kas,'obj-i')}</button></div></div></div>`}
// once every card is face up, ask the server for a personal interpretation (signed-in only)
function interpret(){const T=V.tarot;if(!C.user||T.aiState)return;T.aiState='loading';
 C.interpret(T.spread,T.q,T.drawn.map(c=>({id:c.id,reversed:c.rv}))).then(r=>{if(V.tarot===T&&(r.cards||r.whole)){T.ai=r}},e=>console.warn('interpret',e&&e.message)).then(()=>{T.aiState='done';render()})}
function noteBlock(kind,id,note){
 const open=V.edit===kind+':'+id;
 if(open)return `<div class="field"><label for="ed">Note</label><textarea id="ed">${esc(note||'')}</textarea></div><div class="row"><button class="btn sm" data-act="savenoteed" data-kind="${kind}" data-id="${esc(id)}">Save note</button><button class="btn ghost sm" data-act="canceledit">Cancel</button></div>`;
 return `${note?`<p class="item-note">“${esc(note)}”</p>`:''}<button class="link" data-act="editnote" data-kind="${kind}" data-id="${esc(id)}">${note?'Edit note':'Add a note'}</button>`;
}
/* ----- Journal: a leather-bound notebook. The cover comes first, then everything kept (journal pages, Whispers, tarot
   readings, horoscopes, events and matches), oldest first, ending on a blank page for a new entry. Every page is laid out
   alike: its date in the header, a title beneath, then ruled lines to the foot. Pages turn by swiping; ribbons hanging
   from between the pages edit, enlarge or tear out the open one, and whatever is written is kept as it is written. ----- */
const JPAPER=['sleeping-moon','sun-face','pressed-roses','compass-rose','night-sky','moon-phases'];
// the journal's owner: a name given in the journal itself, or else the name from Birth Chart
const journalName=()=>((S.settings||{}).jname||S.fullName||S.name||'').trim();
function journalPages(){
 // a Whisper is kept when it was saved or written about; horoscopes and events are the bookmarks; matches the connections.
 // Each is placed on the day it was kept, so a new page always comes last
 const wd=[...new Set([...S.saved.map(x=>x.date),...Object.keys(S.notes).filter(d=>S.notes[d])])],kept=x=>(x.at||'').slice(0,10)||dkey();
 const e=[...S.journal.map(j=>({t:'j',day:j.day,at:j.at,j})),
  ...wd.map(d=>({t:'n',day:d,n:S.notes[d]||'',o:cardFor(d)})),
  ...S.readings.map(r=>({t:'r',day:r.date,at:r.at,r})),
  ...S.bookmarks.filter(b=>!['chat','sign','person','conn','tarot','rmeta'].includes(b.kind)).map(b=>b.kind==='dream'?{t:'d',day:(b.data||{}).day||kept(b),at:b.at,b,d:b.data||{}}:{t:b.kind==='horoscope'?'h':'e',day:kept(b),at:b.at,b}),
  ...S.conns.map(c=>({t:'c',day:kept(c),at:c.at,c}))]
  .sort((a,b)=>a.day>b.day?1:a.day<b.day?-1:((a.at||'')>(b.at||'')?1:-1));
 return [{t:'cover'},...e,{t:'new'}];
}
// a name for each page that stays the same while pages come and go around it
const jKey=p=>p.t==='j'?'j:'+p.j.id:p.t==='n'?'fortune:'+p.day:p.t==='r'?'reading:'+p.r.id:p.t==='c'?'conn:'+p.c.id:p.t==='h'||p.t==='e'||p.t==='d'?'bk:'+p.b.kind+':'+p.b.ref:p.t;
const jAt=(key,i)=>{const pages=journalPages(),k=pages.findIndex(p=>jKey(p)===key);return k>=0?k:Math.max(0,Math.min(pages.length-1,i))};
// a kept item's own reflection, and where it is written
const jNote=p=>p.t==='n'?S.notes[p.day]||'':p.t==='r'?p.r.note:p.t==='c'?p.c.note:p.t==='h'||p.t==='e'||p.t==='d'?(p.b.data||{}).note:'';
function jSetNote(p,v){if(p.t==='n')S.notes[p.day]=v;else if(p.t==='r')p.r.note=v;else if(p.t==='c')p.c.note=v;else (p.b.data||(p.b.data={})).note=v}
function jPush(p){
 if(p.t==='j')return C.saveJournal&&C.saveJournal(p.j).then(()=>{p.j.sy=true;save()});
 if(p.t==='n')return syncFortune(p.day);
 if(p.t==='r')return p.r.rid&&C.updateReading&&C.updateReading(p.r.rid,p.r.note||'');
 if(p.t==='c')return C.saveConnection&&C.saveConnection(p.c);
 return C.saveBookmark&&C.saveBookmark(p.b);
}
// the page being written in: a new page always, any other once its Edit ribbon is drawn
const jEditable=p=>p.t==='new'||(!!V.jw&&V.jw.key===jKey(p));
// what writing changes is kept at once on this device, and sent to the account when the writer pauses
let JS=null;
function jflushSave(){if(!JS)return;const p=JS.p;clearTimeout(JS.t);JS=null;jPush(p)}
function jsaveSoon(p){save();if(JS&&JS.p!==p)jflushSave();if(JS)clearTimeout(JS.t);JS={p,t:setTimeout(jflushSave,900)}}
// done writing: the words are tidied and kept, and a page left blank is taken out again
function jDone(){
 const w=V.jw&&V.jw.p;V.jw=null;if(!w)return;
 if(w.t==='j'){const j=w.j;j.title=j.title.trim();j.body=j.body.trim();
  if(!j.title&&!j.body){S.journal=S.journal.filter(x=>x!==j);if(JS&&JS.p===w){clearTimeout(JS.t);JS=null}save();C.deleteJournal&&C.deleteJournal(j.id);return}}
 else jSetNote(w,(jNote(w)||'').trim());
 save();if(JS&&JS.p===w)jflushSave();
}
document.addEventListener('input',e=>{
 const el=e.target;if(!el.closest||!el.closest('.jpage'))return;
 if(el.id==='jn'){V.jnameEdit=true;S.settings.jname=el.value.trim();save();return}
 if(el.tagName==='TEXTAREA')jfit(el);
 let w=V.jw&&V.jw.p;
 if(!w){
  // the first words on the new page make it an entry of the journal, and a fresh page waits after it
  const pages=journalPages(),p=pages[jIdx(pages)];if(!p||p.t!=='new')return;
  const j={id:uuid(),day:dkey(),kind:'reflection',title:'',body:'',at:new Date().toISOString()};S.journal.push(j);
  w={t:'j',day:j.day,at:j.at,j};V.jw={key:jKey(w),p:w};V.jpage=jAt(jKey(w),V.jpage);jRibsNow(w);
 }
 if(w.t==='j'){if(el.id==='jt')w.j.title=el.value;else if(el.id==='jb')w.j.body=el.value}
 else if(el.id==='ed')jSetNote(w,el.value);
 jsaveSoon(w);
});
addEventListener('pagehide',()=>{jflushSave();jCommit()});
// the cover's name is written straight onto it; tapping it later lets it be written again
function jnameDone(){
 const el=$('#jn');if(!el)return;const v=el.value.trim();
 S.settings.jname=v;if(v&&!S.fullName)S.fullName=v;V.jnameEdit=false;save();syncProfile();
 const c=el.closest('.jpage');if(c&&v)c.innerHTML=jCover();
}
document.addEventListener('focusout',e=>{if(e.target.id==='jn')jnameDone()});
// what each kind of page is called, written on its title line
function jTitle(p){
 if(p.t==='n')return esc(p.o.title);
 if(p.t==='r')return p.r.cards.map(x=>esc(x.name)).join(', ');
 if(p.t==='h'){const d=p.b.data||{};return `${sg(d.sign).name} · ${(HCATS.find(c=>c[0]===d.cat)||['',''])[1]}`}
 if(p.t==='e')return esc((p.b.data||{}).name||'');
 if(p.t==='d')return esc((p.d.interp||{}).title||'A Dream');
 return esc(connTitle(p.c));
}
// the two signs of a match, pasted in side by side
const jPair=ids=>{const im=ids.map(id=>pic('icons',id,'jp-card jp-sign')||`<span class="jp-glyph">${sg(id).g}</span>`);return `<div class="jp-cards jp-pair">${im[0]}<span class="jp-amp">+</span>${im[1]}</div>`};
// what a kept item brings to its page, above the reflection: its cards, signs or moon pasted in, and a line or two about it
function jHead(p){
 if(p.t==='n')return `${jWhisperArt(p.o)}<p class="jp-info">${p.o.ref}</p>`;
 if(p.t==='r')return `${jTarotArt(p.r)}<p class="jp-info">${esc((SPREADS[p.r.spread]||{n:p.r.spread}).n)}${p.r.q?` · “${esc(p.r.q)}”`:''}${p.r.cards.some(x=>x.rev)?` · reversed: ${p.r.cards.filter(x=>x.rev).map(x=>esc(x.name)).join(', ')}`:''}</p>`;
 if(p.t==='h'){const d=p.b.data||{},im=pic('icons',d.sign,'jp-card jp-sign');
  return `${im?`<div class="jp-cards one">${im}</div>`:''}<p class="jp-info">${cap(d.period||'')} horoscope</p>${d.focus?`<p class="jp-info">${esc(d.focus)}</p>`:''}<p class="jp-info">${esc(d.body||'')}</p>`}
 if(p.t==='e'){const d=p.b.data||{},ph=phaseSlug(d.name||''),im=ph?pic('moons',ph,'jp-card jp-moon'):'',ev=findEvent(p.b.ref,d.date),x=ev?evInfo(ev):null;
  return `${im?`<div class="jp-cards one">${im}</div>`:''}<p class="jp-info">${esc(d.when||'')}</p>${x?`<p class="jp-info">${x.sym}</p>`:''}`}
 if(p.t==='d'){const I=p.d.interp||{};return `<p class="jp-info">${keys((I.keywords||[]).slice(0,3))}</p><p class="jp-info">${esc((p.d.text||'').slice(0,200))}</p>`}
 const c=p.c,two=connSigns(c),nums=c.kind==='resonance'?[c.data.a,c.data.b].map(x=>N.clean(x)?N.name(x,S.settings.yMode).expression.r.n:'·'):null;
 return `${two.length===2?jPair(two):''}<p class="jp-info">${KIND_LABEL[c.kind]}${nums?` · Expression ${nums[0]} and ${nums[1]}`:''}</p><p class="jp-info jp-open"><button class="link" data-act="openconn" data-id="${esc(c.id)}">Read the full ${c.kind==='zodiac'?'match':'comparison'}</button></p>`;
}
const jIdx=pages=>V.jpage==null?0:Math.max(0,Math.min(pages.length-1,V.jpage));
// the card a reflection was written about, pasted onto the page beside the words
const jWhisperArt=o=>{const p=pic('whispers',o.id,'jp-card');return p?`<div class="jp-cards one">${p}</div>`:''};
const jTarotArt=r=>{const c=r.cards.slice(0,5).map(x=>pic('deck',x.id,'jp-card'+(x.rev?' rev':''))).filter(Boolean);return c.length?`<div class="jp-cards${c.length<2?' one':c.length>2?' many':''}">${c.join('')}</div>`:''};
// the leather front cover: "This journal belongs to", then the owner's name, or a place to write it
function jCover(){
 const nm=journalName(),ask=!nm||V.jnameEdit;
 return `<div class="jp-front jp-leather"><div class="jc-in"><p class="jc-l">This journal<br><span>belongs to</span></p>
 ${ask?`<label class="sr-only" for="jn">Your name for this journal</label><input type="text" id="jn" class="jc-name-in" value="${esc(nm)}" placeholder="Write your name" autocomplete="nickname" maxlength="40" enterkeyhint="done">`
  :`<button class="jc-name" data-act="jnameedit" aria-label="${esc(nm)}. Tap to change the name">${esc(nm)}</button>`}
 </div><p class="jc-hint" aria-hidden="true">Swipe to open</p></div>`;
}
// a page: its date centred in the header, the title beneath, then ruled lines to the foot with a bar at their right
function jPage(p,i,n){
 if(p.t==='cover')return `<div class="jpage is-cover">${jCover()}</div>`;
 const art=JPAPER[(i-1)%JPAPER.length],day=p.t==='new'?dkey():p.day,ed=jEditable(p);let h;
 if(p.t==='new'||p.t==='j'){const j=p.j||{title:'',body:''};
  h=ed?`<label class="sr-only" for="jt">Title</label><input type="text" id="jt" class="jp-title jp-tline" value="${esc(j.title)}" placeholder="Give this page a title" maxlength="80"><label class="sr-only" for="jb">Entry</label><textarea id="jb" class="jp-lines" placeholder="What happened, and what did it stir in you?">${esc(j.body)}</textarea>`
   :`<p class="jp-title">${esc(j.title)||'&nbsp;'}</p><p class="jp-lines jp-text">${esc(j.body)}</p>`}
 else{const note=jNote(p)||'';
  h=`<p class="jp-title">${jTitle(p)}</p>${jHead(p)}${ed?`<label class="sr-only" for="ed">My reflection</label><textarea id="ed" class="jp-lines" placeholder="What does it stir in you?">${esc(note)}</textarea>`:note?`<p class="jp-lines jp-text">${esc(note)}</p>`:''}`}
 return `<div class="jpage"><div class="jp-front p-${art}${art==='night-sky'?' dark':''}" style="--paper:url(/art/pages/${art}.webp)"><p class="jp-date" data-w="${ymdLong(day,{weekday:'long'})}" data-d="${ymdLong(day,{day:'numeric',month:'long',year:'numeric'})}">${ymdLong(day,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p><div class="jp-in">${h}</div><div class="jp-bar" aria-hidden="true"><i></i></div><span class="jp-num">${i}</span></div></div>`;
}
// silk ribbons hanging from between the pages: Edit on the left, Enlarge in the middle, Delete on the right
const JIC={edit:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13l1-3.5L11.5 2 14 4.5 6.5 12z M10 3.5l2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
 grow:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6V2.5H6 M10 2.5h3.5V6 M13.5 10v3.5H10 M6 13.5H2.5V10" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
 tear:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2.5h6l4 4v7H3z M9 2.5v4h4 M3 9l2 1.5 2-2 2 2 2-1.5 2 1.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>'};
function jRibs(p){
 if(V.jx||!p||p.t==='cover')return '';
 const ed=jEditable(p),blank=p.t==='new',r=(act,cls,ic,l,lab)=>`<button class="jrib ${cls}" data-act="${act}" aria-label="${lab}">${JIC[ic]}<span>${l}</span></button>`;
 return `<div class="jribs">${blank?'':r('jedit','r-edit'+(ed?' on':''),'edit',ed?'Done':'Edit',ed?'Finish writing on this page':'Edit this page')}${r('jexpand','r-grow','grow','Enlarge','Enlarge this page')}${blank?'':r('jdel','r-del','tear','Delete','Tear out this page')}</div>`;
}
const jRibsNow=p=>{const r=$('.jbook .jribs');if(r)r.outerHTML=jRibs(p)};
// the date is written as large as its header allows, on one line
function jfitDate(el){
 if(el.classList.contains('two')){el.textContent=`${el.dataset.w}, ${el.dataset.d}`;el.classList.remove('two')}
 const fit=min=>{el.style.fontSize='';let f=parseFloat(getComputedStyle(el).fontSize);while(el.scrollWidth>el.clientWidth+1&&f>min){f-=1;el.style.fontSize=f+'px'}return el.scrollWidth<=el.clientWidth+1};
 // too long even when small: the weekday goes above the date
 if(!fit(13)&&el.dataset.w){el.innerHTML=`${el.dataset.w}<br>${el.dataset.d}`;el.classList.add('two');fit(11)}
}
// a page's textarea grows by whole lines and always reaches the foot of the page, so every line can be written on
function jfit(el){
 el.style.height='auto';const lh=parseFloat(getComputedStyle(el).lineHeight)||28,box=el.closest('.jp-in');
 const room=box&&box.clientHeight?Math.floor((box.clientHeight-el.offsetTop)/lh):4;
 el.style.height=Math.max(2,room,Math.ceil((el.scrollHeight-1)/lh))*lh+'px';jbar(el.closest('.jp-front'));
}
// the scroll bar beside the writing: its thumb shows when the words run past the page, sized to what is in view
function jbar(f){
 const s=f&&f.querySelector('.jp-in'),bar=f&&f.querySelector('.jp-bar');if(!s||!bar)return;
 // the box ends on a whole line, so no line of writing is cut through at the foot
 if(!s.dataset.snap&&s.clientHeight){const lh=parseFloat(getComputedStyle(s).lineHeight)||28;s.style.height=Math.max(lh,Math.floor(s.clientHeight/lh)*lh)+'px';s.style.bottom='auto';bar.style.bottom='auto';bar.style.height=s.style.height;s.dataset.snap=1}
 const over=s.scrollHeight-s.clientHeight>1;bar.classList.toggle('on',over);if(!over)return;
 const th=bar.firstChild,H=bar.clientHeight,h=Math.max(24,H*s.clientHeight/s.scrollHeight);
 th.style.height=h+'px';th.style.transform=`translateY(${((H-h)*s.scrollTop/(s.scrollHeight-s.clientHeight)).toFixed(1)}px)`;
}
// lay out a page: its date, its box of lines, then the writing in it
function jlay(f){f.querySelectorAll('.jp-date').forEach(jfitDate);jbar(f);f.querySelectorAll('textarea').forEach(jfit)}
addEventListener('resize',()=>document.querySelectorAll('.jpage .jp-front').forEach(f=>{const s=f.querySelector('.jp-in'),b=f.querySelector('.jp-bar');if(s){delete s.dataset.snap;s.style.height=s.style.bottom=b.style.height=b.style.bottom=''}jlay(f)}));
document.addEventListener('scroll',e=>{if(e.target.classList&&e.target.classList.contains('jp-in'))jbar(e.target.closest('.jp-front'))},true);
// the bar can be dragged, or tapped to jump there
let JB=null;
const jbarTo=e=>{const r=JB.bar.getBoundingClientRect(),s=JB.s;s.scrollTop=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))*(s.scrollHeight-s.clientHeight)};
document.addEventListener('pointerdown',e=>{const bar=e.target.closest&&e.target.closest('.jp-bar.on');if(!bar)return;
 e.preventDefault();JB={bar,s:bar.parentElement.querySelector('.jp-in'),id:e.pointerId};jbarTo(e)});
document.addEventListener('pointermove',e=>{if(JB&&e.pointerId===JB.id)jbarTo(e)});
document.addEventListener('pointerup',()=>{JB=null});document.addEventListener('pointercancel',()=>{JB=null});
// how thick the block of pages still to come looks beneath the open one
const jDepth=left=>Math.round(Math.max(12,Math.min(26,11+left*1.8)));
function jBook(pages,i){const n=pages.length;
 return `<div class="jbook${i?' open':' closed'}" style="--T:${jDepth(n-1-i)}px" aria-label="${i?`Journal, page ${i} of ${n-1}`:'Journal cover'}"><div class="jboard" aria-hidden="true"></div><div class="jblock" aria-hidden="true"></div>${jPage(pages[i],i,n)}${jRibs(pages[i])}</div>`}
let jPre=false;
function journalView(){
 const pages=journalPages();
 // the first time, the journal opens at its cover, to be read through; after that, on a new page ready for writing
 if(V.jpage==null){V.jpage=S.settings.jopened?pages.length-1:0;V.jfresh=true;if(!S.settings.jopened){S.settings.jopened=true;save();syncProfile()}}
 const i=jIdx(pages);
 if(!jPre){jPre=true;['cover','edge-h','edge-v',...JPAPER].forEach(a=>{const im=new Image();im.src=`/art/pages/${a}.webp`;im.decode&&im.decode().catch(()=>{})})}
 return `<div class="stack jstack">${V.jx?'<div class="jbook-ph" aria-hidden="true"></div>':jBook(pages,i)}
 <div class="sr-only"><button data-act="jflip" data-d="-1">Previous page</button><button data-act="jflip" data-d="1">Next page</button></div></div>`;
}
// the open page enlarged to the whole screen, above everything else; its pages still turn, but nothing is edited or torn
function jxRender(){
 let ov=$('#jxov');const on=V.jx&&V.sec==='tarot'&&tab()==='notebook';
 if(!on){if(ov)ov.remove();document.body.classList.remove('jx-on');V.jx=false;return}
 if(!ov){ov=document.createElement('div');ov.id='jxov';ov.className='jx';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Enlarged journal page');document.body.appendChild(ov)}
 const pages=journalPages();ov.innerHTML=`<button class="jx-x" data-act="jexpand" aria-label="Close the enlarged page">×</button>${jBook(pages,jIdx(pages))}`;
 document.body.classList.add('jx-on');
}
/* Tearing a page out: the leaf tears down along the spine, leaving a ragged stub for a moment, and falls away, the next
   page showing beneath. The item is put back if Undo is tapped within a few seconds; only then is it gone from the account */
function jrip(p,done){
 const book=$('.jbook'),cur=book&&book.querySelector('.jpage');
 if(!cur||JT||matchMedia('(prefers-reduced-motion: reduce)').matches)return done();
 const pages=journalPages(),i=jIdx(pages),tmp=document.createElement('div');
 tmp.innerHTML=jPage(pages[i+1],i,pages.length-1);const np=tmp.firstElementChild;np.classList.add('jp-abs','under');cur.before(np);np.querySelectorAll('.jp-front').forEach(jlay);
 const W=cur.offsetWidth,H=cur.offsetHeight,tear=[];for(let k=0;k<=26;k++)tear.push({x:W*(.03+Math.random()*.035)+(k%2?2:-1),y:H*k/26});
 const poly=a=>`polygon(${a.map(q=>`${q.x.toFixed(1)}px ${q.y.toFixed(1)}px`).join(',')})`,dx=(a,d)=>a.map(q=>({x:q.x+d,y:q.y}));
 const leaf=a=>[...a,{x:W,y:H},{x:W,y:0}],stub=a=>[{x:0,y:0},...a,{x:0,y:H}];
 const wrap=document.createElement('div');wrap.className='jrip';wrap.setAttribute('aria-hidden','true');
 wrap.innerHTML='<div class="jr-stub"><i></i></div><div class="jr-piece"><i></i></div>';
 const [st,pc]=wrap.children,front=cur.querySelector('.jp-front');
 [[st,stub,2.5],[pc,leaf,-2.5]].forEach(([el,shape,d])=>{const c=front.cloneNode(true);c.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
  el.appendChild(c);c.style.clipPath=c.style.webkitClipPath=poly(shape(tear));const fib=el.firstChild;fib.style.clipPath=fib.style.webkitClipPath=poly(shape(dx(tear,d)))});
 book.appendChild(wrap);cur.style.visibility='hidden';book.classList.add('ripping');
 book.animate([{transform:'none'},{transform:'translateX(-2px) rotate(-.4deg)',offset:.18},{transform:'translateX(1px)',offset:.32},{transform:'none',offset:.45}],{duration:1200});
 st.animate([{opacity:1},{opacity:1,offset:.6},{opacity:0}],{duration:1200,fill:'forwards'});
 pc.animate([{transform:'none'},{transform:'rotate(2.5deg)',offset:.2},{transform:'translate(2%,-2%) rotate(7deg)',offset:.4},
  {transform:'translate(26%,5%) rotate(17deg)',opacity:1,offset:.62},{transform:'translate(115%,50%) rotate(36deg)',opacity:0}],
  {duration:1200,easing:'cubic-bezier(.45,0,.6,1)',fill:'forwards'}).onfinish=()=>{wrap.remove();np.remove();cur.style.visibility='';book.classList.remove('ripping');done()};
}
// take a page's item out of the journal, keeping what is needed to put it back
let JU=null;
function jCommit(){if(!JU)return;const u=JU;JU=null;clearTimeout(u.t);u.commit()}
function jRemove(p){
 jCommit();const key=jKey(p);let undo,commit;
 if(p.t==='j'){const j=p.j,k=S.journal.indexOf(j);S.journal.splice(k,1);undo=()=>{S.journal.splice(k,0,j);C.saveJournal&&C.saveJournal(j)};commit=()=>C.deleteJournal&&C.deleteJournal(j.id)}
 else if(p.t==='n'){const d=p.day,sv=S.saved,nt=S.notes[d];S.saved=S.saved.filter(x=>x.date!==d);S.notes[d]='';undo=()=>{S.saved=sv;S.notes[d]=nt};commit=()=>syncFortune(d)}
 else if(p.t==='r'){const r=p.r,k=S.readings.indexOf(r);S.readings.splice(k,1);undo=()=>S.readings.splice(k,0,r);commit=()=>r.rid&&C.deleteReading&&C.deleteReading(r.rid)}
 else if(p.t==='c'){const c=p.c,k=S.conns.indexOf(c);S.conns.splice(k,1);undo=()=>S.conns.splice(k,0,c);commit=()=>{C.deleteConnection&&C.deleteConnection(c.id);if(c.kind==='zodiac'&&C.deleteMatch)C.deleteMatch(c.data.a,c.data.b)}}
 else{const b=p.b,k=S.bookmarks.indexOf(b);S.bookmarks.splice(k,1);undo=()=>S.bookmarks.splice(k,0,b);commit=()=>C.deleteBookmark&&C.deleteBookmark(b.kind,b.ref)}
 save();JU={key,undo,commit,t:setTimeout(jCommit,6500)};
}
/* Turning a page. A paper page is flexible: pulled by its corner P, it lifts from the page along a line across it and rolls
   over on itself, like a sheet bent around a soft cylinder, its back lying over the page once past the roll. The leaf is
   drawn in narrow strips across that line, each placed in 3D at its angle in the roll and lit by how it faces the light;
   the sheet is never quite flat, so faint ripples run through it. The line is chosen so the corner lands under the finger.
   The leather cover is a stiff board and swings on its hinge instead. Forward, the open leaf turns away to the left; back,
   the previous leaf comes in from the left over the open one. */
let JT=null;
const jlerp=(a,b,k)=>a+(b-a)*k,jease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
// keep the polygon's part on the side of the line through M (normal n) where sign*(X-M)·n >= 0
function jclip(poly,M,n,sign){const out=[],s=p=>sign*((p.x-M.x)*n.x+(p.y-M.y)*n.y);
 for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],sa=s(a),sb=s(b);if(sa>=0)out.push(a);
  if((sa>=0)!==(sb>=0)){const k=sa/(sa-sb);out.push({x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k})}}
 return out}
const jpoly=pts=>pts.length>2?`polygon(${pts.map(p=>`${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(',')})`:'polygon(0 0,0 0,0 0)';
// a gradient band laid along the line, reaching `w` px in direction u from it
const jband=(el,M,u,w,D)=>{el.style.width=Math.max(1,w).toFixed(1)+'px';el.style.height=2*D+'px';el.style.transform=`translate(${M.x.toFixed(1)}px,${M.y.toFixed(1)}px) rotate(${Math.atan2(u.y,u.x)}rad) translateY(${-D}px)`};
// the sheet's shape past the line where it leaves the page, 1px at a time: its angle F rises smoothly through the roll to
// lie back over itself (a little short of flat while the page is in the air), with ripples; X and Z are where it has got to
function jshape(t,R,air,N){
 const F=new Float32Array(N+1),X=new Float32Array(N+1),Z=new Float32Array(N+1),L=Math.PI*R,rp=t.rip;
 for(let s=0;s<=N;s++){const k=Math.min(1,s/L),w=Math.min(1,s/24);
  F[s]=Math.PI*k*k*(3-2*k)-air*k+w*air*(.8*Math.sin(s/rp[0]+rp[1])+.35*Math.sin(s/rp[2]+rp[3]));
  if(s){const f=(F[s]+F[s-1])/2;X[s]=X[s-1]+Math.cos(f);Z[s]=Z[s-1]+Math.sin(f)}}
 return {F,X,Z,N}}
// how much a strip facing along normal N is lightened (+) or shaded (-), for light from the upper left, in front
const JL=(()=>{const l=[-.55,-.45,.7],m=Math.hypot(...l);return l.map(c=>c/m)})();
function jlight(n,f,back){const s=back?-1:1,N=[-Math.sin(f)*n.x*s,-Math.sin(f)*n.y*s,Math.cos(f)*s];
 const d=N[0]*JL[0]+N[1]*JL[1]+N[2]*JL[2]-JL[2],h=Math.pow(Math.max(0,(N[0]*JL[0]+N[1]*JL[1]+N[2]*(JL[2]+1))/Math.hypot(JL[0],JL[1],JL[2]+1)),60);
 return d+(h-JH0)*.35}
const JH0=Math.pow((JL[2]+1)/Math.hypot(JL[0],JL[1],JL[2]+1),60);
const jtone=v=>v>=0?`rgba(255,250,236,${Math.min(.6,v*1.1).toFixed(3)})`:`rgba(40,24,12,${Math.min(.55,-v*.75).toFixed(3)})`;
function jstrip(t,i){
 let e=t.pool[i];if(e)return e;
 const el=document.createElement('div');el.className='jt-s';el.innerHTML='<i></i>';t.els.strips.appendChild(el);
 e=t.pool[i]={el,sh:el.firstChild,front:null,back:null};return e}
function jface(t,e,back){
 const k=back?'back':'front';if(!e[k]){
  if(back){e.back=document.createElement('div');e.back.className='jt-bk '+t.paperCls;e.back.setAttribute('style',t.paperStyle)}
  else{const o=t.leaf.querySelector('.jp-front'),c=o.cloneNode(true),src=o.querySelectorAll('textarea,input'),dst=c.querySelectorAll('textarea,input');
   dst.forEach((d,j)=>{d.value=src[j].value});c.querySelectorAll('[id]').forEach(d=>d.removeAttribute('id'));
   c.style.width=t.W+'px';c.style.height=t.H+'px';e.front=c}
  const f=e[k];e.el.insertBefore(f,e.sh);
  if(!back){const a=t.leaf.querySelector('.jp-in'),b=f.querySelector('.jp-in');if(a&&b)b.scrollTop=a.scrollTop}}
 if(e.front)e.front.style.display=back?'none':'';if(e.back)e.back.style.display=back?'':'none';
 return e[k]}
function jsoft(t,P){
 const {W,H,cy}=t,C={x:W,y:cy},A={x:0,y:cy},B={x:0,y:H-cy},D=Math.hypot(W,H);
 // the corner stays bound to the spine, as a real leaf is
 let v={x:P.x-A.x,y:P.y-A.y},L=Math.hypot(v.x,v.y);if(L>W)P={x:A.x+v.x*W/L,y:A.y+v.y*W/L};
 v={x:P.x-B.x,y:P.y-B.y};L=Math.hypot(v.x,v.y);if(L>D)P={x:B.x+v.x*D/L,y:B.y+v.y*D/L};
 t.P=P;t.p=Math.max(0,Math.min(1,(W-P.x)/(2*W)));
 const d=Math.hypot(C.x-P.x,C.y-P.y),rect=[{x:0,y:0},{x:W,y:0},{x:W,y:H},{x:0,y:H}],e=t.els;
 if(d<.5){t.leaf.style.clipPath=t.leaf.style.webkitClipPath='none';e.wrap.style.visibility='hidden';return}
 e.wrap.style.visibility='visible';
 // the roll is widest mid-turn and tightens as the page settles at either end
 const lift=Math.sin(Math.PI*t.p),R=2+W*.17*Math.pow(lift,.6),air=.16*lift;
 const n={x:(C.x-P.x)/d,y:(C.y-P.y)/d},tv={x:-n.y,y:n.x},N=Math.ceil(d+2*D+Math.PI*R+8),sh=jshape(t,R,air,N);
 // place the line so the corner, carried over the roll, comes down under P
 let lo=0,hi=N;for(let k=0;k<26;k++){const s=(lo+hi)/2,j=Math.floor(s),f=sh.X[j]+(s-j)*Math.cos(sh.F[j])-s+d;f>0?lo=s:hi=s}
 const sC=(lo+hi)/2,M={x:C.x-n.x*sC,y:C.y-n.y*sC},th=Math.atan2(n.y,n.x);
 t.leaf.style.clipPath=t.leaf.style.webkitClipPath=jpoly(jclip(rect,M,n,-1));
 const folded=jclip(rect,M,n,1),um=Math.min(N,Math.ceil(Math.max(0,...folded.map(q=>(q.x-M.x)*n.x+(q.y-M.y)*n.y)))),inv=`rotate(${-th}rad) translate(${-M.x}px,${-M.y}px)`;
 let i=0,s0=0,xmax=0;
 while(s0<um&&i<60){
  let s1=s0+1;const fr=sh.F[s0]<1.4;while(s1<um&&s1-s0<(fr?44:30)&&Math.abs(sh.F[s1]-sh.F[s0])<(fr?.3:.17))s1++;
  const band=jclip(jclip(rect,{x:M.x+n.x*s0,y:M.y+n.y*s0},n,1),{x:M.x+n.x*(s1+3),y:M.y+n.y*(s1+3)},n,-1);
  if(band.length>2){
   const vs=band.map(q=>(q.x-M.x)*tv.x+(q.y-M.y)*tv.y),v0=Math.min(...vs),v1=Math.max(...vs),f=(sh.F[s0]+sh.F[s1])/2,back=Math.cos(f)<0;
   const st=jstrip(t,i),el=st.el;el.style.display='';el.style.width=(s1-s0+3).toFixed(1)+'px';el.style.height=(v1-v0).toFixed(1)+'px';
   // the strip is cut to the page's own outline, and a hair wider than its share so no seam opens in the roll
   const wide=jclip(jclip(rect,{x:M.x+n.x*s0,y:M.y+n.y*s0},n,1),{x:M.x+n.x*(s1+3),y:M.y+n.y*(s1+3)},n,-1);
   el.style.clipPath=el.style.webkitClipPath=jpoly(wide.map(q=>({x:(q.x-M.x)*n.x+(q.y-M.y)*n.y-s0,y:(q.x-M.x)*tv.x+(q.y-M.y)*tv.y-v0})));
   el.style.transform=`translate(${M.x.toFixed(2)}px,${M.y.toFixed(2)}px) rotate(${th}rad) translate3d(${sh.X[s0].toFixed(2)}px,${v0.toFixed(2)}px,${sh.Z[s0].toFixed(2)}px) rotateY(${-f}rad)`;
   jface(t,st,back).style.transform=`translate(${-s0}px,${(-v0).toFixed(2)}px) ${inv}`;
   st.sh.style.background=`linear-gradient(to right,${jtone(jlight(n,sh.F[s0],back))},${jtone(jlight(n,sh.F[s1],back))})`;
   xmax=Math.max(xmax,sh.X[s1]);i++}
  s0=s1}
 for(let k=i;k<t.pool.length;k++)t.pool[k].el.style.display='none';
 // the roll's shadow on the page beneath, deepest close under it
 e.cast.style.clipPath=e.cast.style.webkitClipPath=jpoly(folded);
 jband(e.castg,{x:M.x+n.x*xmax*.92,y:M.y+n.y*xmax*.92},n,Math.min(W*.4,18+R*1.6),D);e.castg.style.opacity=(.45+.55*lift).toFixed(3);
}
function jhard(t,p){
 t.p=p=Math.max(0,Math.min(1,p));const q=t.fwd?p:1-p,leaf=t.leaf;
 leaf.style.transform=`rotateY(${-180*q}deg) translateZ(${(Math.sin(q*Math.PI)*10).toFixed(1)}px)`;
 leaf.style.setProperty('--lit',(Math.min(q*2,1)*.55).toFixed(3));leaf.style.setProperty('--dim',(Math.max(0,1-q*2)*.4+Math.sin(q*Math.PI)*.25).toFixed(3));
 t.under.style.setProperty('--cast',(q>0?(1-q)*.5:0).toFixed(3));
}
function jstart(to,grab){
 if(JT)return null;
 // the writing put down first (the cover's name is kept as it is let go)
 const ae=document.activeElement;if(ae&&ae.closest&&ae.closest('.jbook'))ae.blur();
 const pages=journalPages(),from=jIdx(pages),book=$('.jbook');to=Math.max(0,Math.min(pages.length-1,to));
 if(to===from||!book)return null;
 const fwd=to>from,cur=book.querySelector('.jpage'),tmp=document.createElement('div');
 tmp.innerHTML=jPage(pages[to],to,pages.length);const np=tmp.firstElementChild,leaf=fwd?cur:np,under=fwd?np:cur;
 np.classList.add('jp-abs');if(fwd)cur.before(np);else book.appendChild(np);
 np.querySelectorAll('.jp-front').forEach(jlay);
 leaf.classList.add('leaf');under.classList.add('under');book.classList.add('turning');
 const r=cur.getBoundingClientRect(),W=r.width,H=r.height;
 if(Math.min(from,to)===0){
  leaf.insertAdjacentHTML('beforeend','<div class="jp-back endpaper" aria-hidden="true"></div>');leaf.classList.add('hard');
  JT={hard:true,to,toKey:jKey(pages[to]),fwd,leaf,under,p:0};jhard(JT,0);return JT;
 }
 // the leaf's paper, seen from behind: its own painting showing faintly through, under the ruled lines
 const fr=leaf.querySelector('.jp-front');
 book.insertAdjacentHTML('beforeend','<div class="jturn" aria-hidden="true"><div class="jt-cast"><i class="jt-castg"></i></div><div class="jt-strips"></div></div>');
 const wrap=book.querySelector('.jturn'),q=s=>wrap.querySelector(s);
 const cy=grab&&grab.y<H/2?0:H,rnd=Math.random;
 JT={soft:true,to,toKey:jKey(pages[to]),fwd,leaf,under,W,H,cy,p:0,pool:[],rip:[5.5+rnd()*1.5,rnd()*6,2.2+rnd(),rnd()*6],
  paperCls:[...fr.classList].filter(c=>c.startsWith('p-')||c==='dark').join(' '),paperStyle:(fr.getAttribute('style')||'')+`;width:${W}px;height:${H}px`,
  els:{wrap,cast:q('.jt-cast'),castg:q('.jt-castg'),strips:q('.jt-strips')}};
 jsoft(JT,fwd?{x:W,y:cy}:{x:-W,y:cy});return JT;
}
// carry a turn on to its end (land) or back to where it began; a soft page's corner travels in a gentle arc
function jrun(land,ms=1000){
 const t=JT;if(!t)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return jland(land);
 const t0=performance.now();let step;
 if(t.hard){const p0=t.p,p1=land?1:0,dur=Math.max(200,ms*Math.abs(p1-p0));
  step=now=>{const k=Math.min(1,(now-t0)/dur);jhard(t,p0+(p1-p0)*jease(k));k<1?requestAnimationFrame(step):jland(land)}}
 else{const P0=t.P,end=(t.fwd===land)?-t.W:t.W,P1={x:end,y:t.cy},dur=Math.max(260,ms*Math.abs(P1.x-P0.x)/(2*t.W)),lift=t.H*.2*(t.cy?1:-1)*Math.min(1,Math.abs(P1.x-P0.x)/t.W);
  step=now=>{const k=Math.min(1,(now-t0)/dur),e=jease(k);jsoft(t,{x:jlerp(P0.x,P1.x,e),y:jlerp(P0.y,P1.y,e)-lift*Math.sin(Math.PI*e)});k<1?requestAnimationFrame(step):jland(land)}}
 requestAnimationFrame(step);
}
// a page turned over is finished with: what was written on it is kept, and the page it lands on opens
function jland(land){const t=JT;JT=null;if(t&&land){jDone();V.jpage=jAt(t.toKey,t.to)}render()}
function jflip(to){if(jstart(to))jrun(true)}
// turning by hand: swipe across the page, even over its lines, and the corner follows; let go past a third to turn it
let JD=null;
document.addEventListener('pointerdown',e=>{
 const book=e.target.closest&&e.target.closest('.jbook');
 if(!book||JT||e.button>0||e.target.closest('select,button,a,label,.jp-bar')||(e.pointerType==='mouse'&&e.target.closest('input,textarea')))return;
 const r=book.querySelector('.jpage').getBoundingClientRect();
 JD={x:e.clientX,y:e.clientY,g:{x:e.clientX-r.left,y:e.clientY-r.top},t:performance.now(),id:e.pointerId};
});
document.addEventListener('pointermove',e=>{
 if(!JD||e.pointerId!==JD.id)return;const dx=e.clientX-JD.x,dy=e.clientY-JD.y;
 if(!JT){if(Math.abs(dx)<10||Math.abs(dx)<Math.abs(dy)*1.2){if(Math.abs(dy)>14)JD=null;return}
  if(!jstart(jIdx(journalPages())+(dx<0?1:-1),JD.g)){JD=null;return}}
 const t=JT;
 if(t.hard){const w=t.leaf.offsetWidth*.85;jhard(t,t.fwd?-dx/w:dx/w)}
 else jsoft(t,t.fwd?{x:t.W+dx,y:t.cy+dy*.6}:{x:-t.W+2*dx,y:t.cy+dy*.6});
});
const jdrop=e=>{if(!JD||e.pointerId!==JD.id)return;const d=JD;JD=null;if(!JT)return;
 const fast=Math.abs(e.clientX-d.x)/(performance.now()-d.t)>.5,p=JT.hard||JT.fwd?JT.p:1-JT.p;jrun(p>.33||fast,800)};
document.addEventListener('pointerup',jdrop);document.addEventListener('pointercancel',jdrop);

/* ----- Connections: zodiac match, soul resonance and synastry ----- */
const KIND_LABEL={zodiac:'Zodiac Match',resonance:'Soul Resonance',synastry:'Synastry'};
const connTitle=c=>c.name||(c.kind==='zodiac'?`${sg(c.data.a).name} + ${sg(c.data.b).name}`:c.kind==='resonance'?`${c.data.a} + ${c.data.b}`:`You + ${(c.data.them||{}).name||'them'}`);
// the zodiac match reading for two signs (Zodiac Match page and the saved connection pop-up)
function matchBody(a,b){const r=zodiacMatch(a,b);
 return `<div class="row pair"><span class="pair-s">${pic('icons',a,'sign-ico')}<span class="sign-nm">${sg(a).name}</span></span><svg width="70" height="30" viewBox="0 0 80 30" aria-hidden="true"><path d="M2 15C20 2 30 28 40 15S62 2 78 15" fill="none" stroke="#8B6A3E" stroke-width="1.2"/><circle cx="40" cy="15" r="3" fill="#8B6A3E"/></svg><span class="pair-s">${pic('icons',b,'sign-ico')}<span class="sign-nm">${sg(b).name}</span></span></div><div class="center"><div class="label">${r.angle[0]}</div></div>${r.themes.map(([k,v])=>`<div class="label">${k}</div><p>${v}</p>`).join('')}<div class="rule"></div><p class="muted small">Method: traditional astrology compares the angle between two signs around the zodiac, their elements and their modalities. For a fuller picture, compare birth charts in Synastry.</p>`;
}
function numBlock(title,x,steps){
 if(!x||!x.r.n)return `<div class="label">${title}</div><p class="muted">Not enough letters to calculate.</p>`;
 return `<div class="label">${title}</div><div class="num-line"><span class="num">${x.r.n}</span><div><strong>${N.MEANING[x.r.n][0]}</strong><p class="muted small">${N.MEANING[x.r.n][1]}</p></div></div>${steps?`<p class="calc">${x.parts.map(p=>`${p.word}: ${p.vals.join('+')} = ${p.total}${p.r.chain.length>1?' → '+p.r.chain.slice(1).join(' → '):''}`).join('<br>')}<br>Total ${x.parts.map(p=>p.r.n).join(' + ')} = ${x.total}${x.r.chain.length>1?' → '+x.r.chain.slice(1).join(' → '):''}</p>`:''}`;
}
// the three numerology comparisons for two names, each wrapped as a panel (page) or a section (pop-up)
function resonanceRows(a,b,wrap){const x=N.name(a,S.settings.yMode),y=N.name(b,S.settings.yMode);
  const rows=[['Expression (Destiny)','expression','how each of you acts in the world'],['Soul Urge','soul','what each of you longs for'],['Personality','personality','how each of you first comes across']];
  return rows.map(([t,k,d])=>{const p=x[k].r.n,q=y[k].r.n;if(!p||!q)return wrap(`<h3>${t}</h3><p class="muted">One of the names has no ${k==='soul'?'vowels':'consonants'} to count.</p>`);const r=N.resonance(p,q);
   return wrap(`<h3>${t}</h3><p class="muted small">${d}</p><div class="row pair"><div class="center"><span class="num">${p}</span><div class="small">${esc(a.split(' ')[0])}</div></div><span class="muted">and</span><div class="center"><span class="num">${q}</span><div class="small">${esc(b.split(' ')[0])}</div></div></div><p><strong>${N.MEANING[p][0]}</strong> meets <strong>${N.MEANING[q][0]}</strong>. ${r.text}</p><details><summary>Show the calculation</summary>${numBlock(esc(a),x[k],true)}${numBlock(esc(b),y[k],true)}</details>`)}).join('')
   }
const resMethod=()=>`<p class="muted small">Method: Pythagorean numerology. Each letter has a value from 1 to 9 (A, J, S = 1 … I, R = 9). Each name is reduced word by word, then added and reduced again, keeping the master numbers 11, 22 and 33. Vowels give the Soul Urge, consonants the Personality; Y is counted as ${S.settings.yMode==='auto'?'a vowel when no other vowel sits beside it':S.settings.yMode==='vowel'?'a vowel':'a consonant'}. Number families (1-5-7, 2-4-8, 3-6-9) are a traditional guide, not a verdict.</p>`;
// place search (Open-Meteo geocoding): gives coordinates and the place's IANA time zone
function placeField(id,obj){
 const P=V.places[id]||{};
 return `<div class="field"><label for="${id}-q">Place of birth</label><div class="row nowrap"><input type="text" id="${id}-q" value="${esc(P.q!=null?P.q:obj.place)}" placeholder="Town or city" autocomplete="off"><button class="btn ghost sm" data-act="placesearch" data-id="${id}">Search</button></div>
 ${P.busy?'<p class="muted small">Searching…</p>':''}${P.err?`<p class="err small">${esc(P.err)}</p>`:''}
 ${P.results?(P.results.length?`<ul class="places">${P.results.map((r,i)=>`<li><button class="link" data-act="placepick" data-id="${id}" data-i="${i}">${esc([r.name,r.admin1,r.country].filter(Boolean).join(', '))}</button></li>`).join('')}</ul>`:'<p class="muted small">No places found. Try a nearby larger town.</p>'):''}
 ${obj.place&&!P.results?`<p class="muted small">${esc(obj.place)} · ${Number(obj.lat).toFixed(2)}°, ${Number(obj.lon).toFixed(2)}° · ${esc(obj.tz)}</p>`:''}</div>`;
}
// the synastry reading between the reader's chart and another person's birth details
function synBody(Y){
  const me=myChart(),them=K.chart({date:Y.date,time:Y.time,unk:Y.unk||!Y.time||!Y.tz,lat:Y.lat,lon:Y.lon,tz:Y.tz||'UTC'});
  // the Moon moves about 13° a day, so without a birth time its aspects are left out
  const myT=!(S.birth.unk||!S.birth.time||!S.birth.tz),thT=!(Y.unk||!Y.time||!Y.tz);
  const keep=(c,known,timed)=>c.pl.filter(p=>['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'].includes(p.n)&&!(p.n==='Moon'&&!timed)).concat(known&&c.ang?[{n:'Ascendant',lon:c.ang.asc,sign:K.signIdx(c.ang.asc)}]:[]);
  const asp=K.aspects(keep(me,me.known,myT),keep(them,them.known,thT),'synastry').slice(0,14);
  const nm=esc(Y.name||'them');
  return `<h3>You and ${nm}</h3><p class="muted small">Your ${sIdx(me.pl[0].sign).name} Sun and ${sIdx(them.pl[0].sign).name} Sun; your Moon in ${me.moonRange?'an uncertain sign':sIdx(me.pl[1].sign).name}, theirs in ${them.moonRange?'an uncertain sign':sIdx(them.pl[1].sign).name}.</p>${asp.length?asp.map(x=>`<div class="asp"><div><strong>Your ${x.a.n}</strong> <span class="glyph">${x.g}</span> <strong>their ${x.b.n}</strong> <span class="muted small">${x.n}, orb ${x.orb.toFixed(1)}°</span></div><p class="small">Your ${PM[x.a.n]} and their ${PM[x.b.n]} ${ASPT[x.n]}.</p></div>`).join(''):'<p>No close aspects between your personal planets within the orbs used.</p>'}
  ${(!myT||!thT||!me.known||!them.known)?`<p class="note">${[!myT||!thT?`Without ${!myT&&!thT?'both birth times':!myT?'your birth time':'their birth time'}, the Moon’s position is uncertain by several degrees, so its aspects are left out.`:'',!me.known||!them.known?'Without both birth times and places, Ascendants and houses are left out rather than guessed.':''].filter(Boolean).join(' ')}</p>`:''}
  <p class="muted small">Method: tropical, geocentric positions from an ephemeris; aspects between Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn${me.known&&them.known?' and the Ascendants':''}, with tighter orbs than a natal chart (conjunction and opposition 6°, square and trine 5°, sextile 3°). Symbolic, not predictive.</p>`;
}
function synastryView(){
 if(!A)return needLib();
 const Y=V.syn,mine=hasBirthDate();
 const form=panel(`${plate('synastry')}<h3>Their birth details</h3><div class="field"><label for="sn">Their name</label><input type="text" id="sn" value="${esc(Y.name)}"></div><div class="field"><label for="sd">Date of birth</label><input type="date" id="sd" value="${esc(Y.date)}"></div><label class="row"><input type="checkbox" id="su" ${Y.unk?'checked':''} class="cb"> Birth time unknown</label>${Y.unk?'':`<div class="field"><label for="st">Time of birth</label><input type="time" id="st" value="${esc(Y.time)}"></div>`}${placeField('syn',Y)}<button class="btn" data-act="dosyn">Compare our charts</button><p class="muted small">Their details are private to you and are only kept if you save the connection.</p>`);
 if(!mine)return `<div class="stack"><h1>Synastry</h1>${empty('Your birth details first','Synastry compares two birth charts, so it needs your date of birth (and, for the most detail, your time and place).',linkBtn('Complete my Birth Details','discover','profile','btn'))}</div>`;
 let out='';
 if(Y.done&&Y.date){
  const saved=S.conns.some(c=>c.kind==='synastry'&&(c.data.them||{}).date===Y.date&&(c.data.them||{}).name===Y.name);
  out=panel(synBody(Y)+`<div class="row"><button class="btn ghost sm" data-act="saveconn" data-kind="synastry">${saved?'Saved':'Save connection'}</button></div>`);
 }
 return `<div class="stack"><h1>Synastry</h1><p class="mn-sub">How two birth charts speak to each other.</p>${form}${out}</div>`;
}
// the Personal Cosmic Profile: birth details, the big three and the numbers, each linking to its page
function profileView(){
 const ch=myChart(),L=hasBirthDate()?N.lifePath(S.birth.date):null,nm=nameNums(S.fullName),b=S.birth,yr=Number(dkey().slice(0,4));
 const val=v=>v?`<span>${v}</span>`:`<span class="muted">Not added yet</span>`;
 const sun=ch?sIdx(ch.pl[0].sign):null;
 return `<div class="stack"><h1>My Birth Details</h1>
 ${panel(`<button class="link cp-edit" data-act="cpedit">Edit</button><div class="prof-h">${pic('icons',S.sign,'sign-ico')}<div><h2>${esc(S.name||S.fullName||'Traveller')}</h2><p class="muted">${sg(S.sign).name} · ${sg(S.sign).el} · ruled by ${sg(S.sign).ruler}</p></div></div>
  <dl class="dl"><dt>Birth date</dt><dd>${val(hasBirthDate()?ymdLong(b.date):'')}</dd><dt>Birth time</dt><dd>${val(b.unk?'Unknown':b.time)}</dd><dt>Birth place</dt><dd>${val(b.place)}</dd><dt>Full birth name</dt><dd>${val(esc(S.fullName))}</dd></dl>
  <p class="muted small">${S.birthConsent?'Birth details are kept privately in your account.':'Birth details stay on this device unless you keep them in your account.'}</p>`)}
 ${hasBirthDate()?mbox(soulBlock(L.r.n,firstOf(S.name||S.fullName),'Your soul’s reading')+`<p>Your Sun in ${sg(ch?sIdx(ch.pl[0].sign).id:S.sign).name} colours how you shine: ${SIGN_DESC[ch?sIdx(ch.pl[0].sign).id:S.sign]}</p>`):`<p class="cp-intro">Add your details once for a reading that is yours alone: your full birth name for your numerology, and your date, time and place of birth for your birth chart, Life Path and cycles.</p><button class="btn" data-act="cpedit">Add my details</button>`}
 ${panel(`<div class="label">The big three</div>${plate('astro')}<dl class="dl"><dt>Sun</dt><dd>${ch?sun.name+` <span class="muted small">calculated</span>`:`<span class="muted">Needs birth date</span>`}</dd><dt>Moon</dt><dd>${ch?(ch.moonRange?`${sIdx(ch.moonRange[0]).name} or ${sIdx(ch.moonRange[1]).name} <span class="muted small">needs birth time</span>`:sIdx(ch.pl[1].sign).name+' <span class="muted small">calculated</span>'):'<span class="muted">Needs birth date</span>'}</dd><dt>Rising</dt><dd>${ch&&ch.ang?sIdx(K.signIdx(ch.ang.asc)).name+' <span class="muted small">calculated</span>':`<span class="muted">Needs birth time and place</span>`}</dd></dl>${ch&&sun.id!==S.sign?`<p class="note">Your calculated Sun sign is ${sun.name}, but your chosen sign is ${sg(S.sign).name}. Births near the edge of a sign can fall either side; you can change your chosen sign in Settings.</p>`:''}`)}
 ${panel(`<div class="label">Numerology</div><dl class="dl"><dt>Life Path</dt><dd>${L?L.r.n+' · '+N.MEANING[L.r.n][0]:'<span class="muted">Needs birth date</span>'}</dd><dt>Expression</dt><dd>${nm?nm.expression.r.n+' · '+N.MEANING[nm.expression.r.n][0]:'<span class="muted">Needs full birth name</span>'}</dd><dt>Soul Urge</dt><dd>${nm&&nm.soul.r.n?nm.soul.r.n+' · '+N.MEANING[nm.soul.r.n][0]:'<span class="muted">Needs full birth name</span>'}</dd><dt>Personality</dt><dd>${nm&&nm.personality.r.n?nm.personality.r.n+' · '+N.MEANING[nm.personality.r.n][0]:'<span class="muted">Needs full birth name</span>'}</dd><dt>Personal Year ${yr}</dt><dd>${hasBirthDate()?N.personalYear(S.birth.date,yr).r.n:'<span class="muted">Needs birth date</span>'}</dd></dl>`)}
 ${V.cpEdit?`<div class="pop" role="dialog" aria-modal="true" aria-label="Edit your birth details" data-act="cpclose"><div class="pop-box cp-box"><button class="pop-x" data-act="cpclose" aria-label="Close">×</button><h2 class="center">Your Cosmic Profile</h2><p class="center muted">Your details are read in your birth chart, numerology, Life Path and cycles.</p>${birthForm()}</div></div>`:''}
 </div>`;
}
function birthForm(other){
 const b=other?(V.oDraft||(V.oDraft=Object.assign({},fresh().birth,{name:''}))):(V.birthDraft||(V.birthDraft=Object.assign({},S.birth)));
 return panel(`${other?'':plate('natal')}<h3>${other?'Their':'Your'} birth details</h3><div class="field"><label for="bn">${other?'Their name':'Your full name at birth'}</label><input type="text" id="bn" value="${esc(b.name!=null?b.name:S.fullName)}" ${other?'':'autocomplete="name"'} placeholder="${other?'Their name':'Your full name'}"></div><div class="field"><label for="bd">Date of birth</label><input type="date" id="bd" value="${esc(b.date)}"></div><label class="row"><input type="checkbox" id="bu" ${b.unk?'checked':''} class="cb"> I don’t know my birth time</label>${b.unk?'':`<div class="field"><label for="bt">Time of birth (local time)</label><input type="time" id="bt" value="${esc(b.time)}"></div>`}${placeField(other?'other':'birth',b)}
 ${other?'':`<details class="more"><summary>More options</summary><div class="field"><label for="an">Name you use now (optional)</label><input type="text" id="an" value="${esc(S.altName)}" placeholder="A married name, a chosen name, a nickname"></div><div class="field"><label for="ym">The letter Y counts as</label><select id="ym"><option value="auto" ${S.settings.yMode==='auto'?'selected':''}>Vowel when no other vowel is beside it</option><option value="vowel" ${S.settings.yMode==='vowel'?'selected':''}>Always a vowel</option><option value="consonant" ${S.settings.yMode==='consonant'?'selected':''}>Always a consonant</option></select></div></details>
 <label class="row consent"><input type="checkbox" id="bcons" ${S.birthConsent?'checked':''} class="cb"> <span>Keep my birth details in my Kosmia account so they sync across my devices. They are private to me and I can delete them in Settings.</span></label>`}
 <button class="btn" data-act="savebirth"${other?' data-other="1"':''}>${other?'Calculate Their Chart':'Save my Birth Details'}</button><p class="muted small">${other?'This search is not saved to your profile.':'Without a time and place, the Ascendant and houses are not calculated.'}</p>`);
}
function cyclesView(){
 const other=!!V.ns.cy;
 if(!other&&!hasBirthDate())return `<div class="stack"><h1>Personal Year</h1>${invite('Your personal cycles are counted from your birth day and month. Add your date of birth to your birth details, or look up anyone’s cycles.','cy')}</div>`;
 if(other&&!V.cyOther)return `<div class="stack"><h1>Personal Year</h1>${mbox(`<p class="lead">Find anyone’s personal cycles from their date of birth.</p><div class="field"><label for="cyd">Their date of birth</label><div class="inp">${IC.cal}<input type="date" id="cyd"></div></div>`)}<button class="btn" data-act="cygo">See their cycles →</button>${mineBtn('cy',hasBirthDate())}</div>`;
 const [y,mo,d]=dkey().split('-').map(Number),b=other?V.cyOther:S.birth.date,py=N.personalYear(b,y),pyn=N.personalYear(b,y+1),pm=N.personalMonth(b,y,mo),pdd=N.personalDay(b,y,mo,d),uy=N.universalYear(y),by=Number(b.slice(0,4));
 const mname=ymdLong(dkey(),{month:'long',year:'numeric'});
 return `<div class="stack"><h1>Personal Year</h1>
 ${panel(`${plate('cycles')}<div class="label">Personal Year · ${y}</div><div class="num-line"><span class="num">${py.r.n}</span><p>${cap(N.CYCLE[py.r.n])}.</p></div><p class="calc">Birth month ${Number(b.slice(5,7))} + birth day ${Number(b.slice(8,10))} + year ${y}, each reduced: total ${py.total} → ${py.r.n}</p><p class="muted small">Your Personal Year runs with the calendar year, 1 January to 31 December ${y}.</p><div class="soul"><p class="soul-t">${other?'':esc(firstOf(S.name||S.fullName))+', '}${(YEAR[py.r.n]||YEAR[py.r.n%9||9]).replace(/^This/,other?'This':'this')}</p><p class="soul-q">“${soul(py.r.n)[2][0]}”<span>${soul(py.r.n)[2][1]}</span></p></div>`)}
 ${panel(`<div class="label">Personal Month · ${mname}</div><div class="num-line"><span class="num">${pm.r.n}</span><p>${cap(N.CYCLE[pm.r.n].replace('a year','a month'))}.</p></div><div class="rule"></div><div class="label">Personal Day · ${ymdLong(dkey(),{weekday:'long',day:'numeric',month:'long'})}</div><div class="num-line"><span class="num">${pdd.r.n}</span><p>${cap(N.CYCLE[pdd.r.n].replace('a year','a day'))}.</p></div>`)}
 ${panel(`<div class="label">Next year · ${y+1}</div><p>Personal Year <strong>${pyn.r.n}</strong>: ${N.CYCLE[pyn.r.n]}.</p><div class="label">Universal Year · ${y}</div><p>${uy.n}: the shared backdrop for everyone, ${N.CYCLE[uy.n]}.</p>`)}
 ${panel(`<h3>Pinnacles and challenges</h3><p class="muted small">Four long chapters of life, counted from your birth date.</p><div class="tbl"><table><tr><th>Ages</th><th>Years</th><th>Pinnacle</th><th>Challenge</th></tr>${N.pinnacles(b).map(p=>`<tr><td>${p.from}${p.to!=null?'–'+p.to:'+'}</td><td>${by+p.from}${p.to!=null?'–'+(by+p.to):' onward'}</td><td>${p.p} · ${N.MEANING[p.p][0]}</td><td>${p.c}</td></tr>`).join('')}</table></div><p class="muted small">The first pinnacle ends at age 36 minus your Life Path number; the next two last nine years each; the fourth runs for the rest of life.</p>`)}
 ${V.ns.cy?`<p class="mn-note">Cycles for someone born ${ymdLong(b)}</p>`:''}${nsBtn('cy')}${V.ns.cy?mineBtn('cy',hasBirthDate()):''}
 </div>`;
}
/* ----- Cosmos ----- */
const MT={
 new_moon:['The Moon sits between Earth and the Sun, so its lit side faces away from us.','Traditionally a time for beginnings and quiet intention-setting.','What would I like to begin, or begin again?'],
 first_quarter:['The Moon is a quarter of the way around its orbit, with half its face lit.','Traditionally linked with action, decision and momentum.','Where am I ready to commit a little more energy?'],
 full_moon:['Earth lies between the Sun and Moon, so the Moon’s face is fully lit.','Traditionally a time of culmination, clarity and gratitude.','What has grown in my life that I am grateful for?'],
 last_quarter:['The Moon is three-quarters through its orbit, with the opposite half lit.','Traditionally a time for release, forgiveness and clearing space.','What am I ready to put down?'],
 equinox:['The Sun crosses the celestial equator, giving near-equal day and night everywhere on Earth.','Traditionally a moment of balance and turning points.','Where in my life do I want more balance?'],
 solstice:['The Sun reaches its greatest distance north or south of the celestial equator: the longest day in one hemisphere, the shortest in the other.','Traditionally a threshold of light and rest, depending on the season.','What does this turning of the year ask of me?'],
 lunar_eclipse:['Earth’s shadow falls across the Moon. It can be seen from anywhere on the night side of Earth while it lasts.','Traditionally seen as a moment of endings and revelation.','What is coming into view that I had not noticed?'],
 solar_eclipse:['The Moon passes in front of the Sun. It is visible only from part of Earth; check a local eclipse map for where.','Traditionally seen as a powerful new-beginning moment.','What fresh chapter do I want to write?']
};
const RITUAL={'New Moon':'Write one intention on a slip of paper and keep it somewhere you will see it.','Waxing Crescent':'Take the smallest first step toward your intention.','First Quarter':'Choose one obstacle and decide how you will meet it.','Waxing Gibbous':'Refine: adjust a plan rather than abandoning it.','Full Moon':'Step outside, look up, and name three things you are grateful for.','Waning Gibbous':'Share something you have learned with someone else.','Last Quarter':'Clear one drawer, one inbox, one lingering apology.','Waning Crescent':'Rest. Go to bed a little earlier and let the cycle close.'};
function evInfo(e){
 const sn=e.sign!=null?sIdx(e.sign).name:'';
 if(MT[e.k])return {fact:MT[e.k][0]+(e.type==='moon'||e.type==='eclipse'?` The Moon is in ${sn}.`:''),sym:MT[e.k][1],ref:MT[e.k][2]};
 if(e.k==='ingress'&&e.planet==='Sun')return {fact:`The Sun’s position along the ecliptic crosses ${e.sign*30}°, entering ${sn}.`,sym:`The start of ${sn} season: ${STYLE[sIdx(e.sign).id]}.`,ref:`What would it mean to live a little more ${STYLE[sIdx(e.sign).id].split(',')[0]} this month?`};
 if(e.k==='ingress')return {fact:`Seen from Earth, ${e.planet} crosses ${e.sign*30}° of ecliptic longitude into ${sn}${e.retro?', moving retrograde':''}.`,sym:`${e.planet} (${PM[e.planet]}) takes on the style of ${sn}: ${STYLE[sIdx(e.sign).id]}.`,ref:`Where might ${PM[e.planet].split(' and ')[0]} want a new style?`};
 if(e.k==='station_retro')return {fact:`${e.planet} appears to stop and reverse against the stars, in ${sn}. Apparent retrograde motion is an effect of Earth’s own orbit; the planet does not move backwards.`,sym:`Traditionally a time to review ${PM[e.planet]}: revisit and revise rather than launch.`,ref:'What deserves a second look before I move forward?'};
 if(e.k==='station_direct')return {fact:`${e.planet} appears to stop and resume its usual eastward motion, in ${sn}.`,sym:`Traditionally, momentum in ${PM[e.planet]} returns.`,ref:'What have I learned during the pause?'};
 if(e.k==='conjunction')return {fact:`${e.planet} and ${e.planet2} share the same ecliptic longitude, about ${e.sep.toFixed(1)}° apart in the sky, in ${sn}.`,sym:`Themes of ${PM[e.planet]} and ${PM[e.planet2]} meet, traditionally said to begin a new cycle between them.`,ref:'Which two parts of my life are ready to work together?'};
 if(e.k==='opposition')return {fact:`${e.planet} is opposite the Sun in our sky: closest to Earth for the year, at its brightest, and up all night.`,sym:`Traditionally a moment of culmination and visibility for ${PM[e.planet]}.`,ref:'What is ready to be seen?'};
 if(e.k==='elongation')return {fact:`${e.planet} is at its greatest angle from the Sun (${e.elong.toFixed(1)}°), well placed in the ${e.visibility} sky.`,sym:'No traditional astrological meaning; a good night (or morning) for sky-watching.',ref:'When did I last watch the sky at dawn or dusk?'};
 if(e.k==='perihelion'||e.k==='aphelion')return {fact:`Earth is at its ${e.k==='perihelion'?'closest to':'farthest from'} the Sun for the year, ${e.au.toFixed(4)} astronomical units away. Seasons come from Earth’s tilt, not this distance.`,sym:'No traditional astrological meaning.',ref:'What keeps its rhythm in my life whatever the distance?'};
 if(e.k==='meteor')return {fact:`Peak of the ${e.name.replace(' meteor shower peak','')}: up to about ${e.zhr} meteors an hour under ideal dark skies, debris from ${e.parent}. The date is approximate; the best views are usually after midnight, away from city light.`,sym:'No traditional astrological meaning; shooting stars have long been read as moments for wishes.',ref:'If I made one wish tonight, what would it be?'};
 return {fact:'',sym:'',ref:''};
}
const TYPE_L={moon:'Moon',season:'Season',ingress:'Ingress',retrograde:'Retrograde',conjunction:'Conjunction',eclipse:'Eclipse',meteor:'Meteors',planet:'Planets'};
const evWhen=e=>e.dateOnly?ymdLong(e.date.toISOString().slice(0,10))+' · approximate':evt(e.date);
const evRef=e=>e.k+':'+(e.planet||'')+(e.planet2||'')+':'+e.date.toISOString().slice(0,13);
function evCard(e,open){
 const i=evInfo(e),ref=evRef(e),sv=isSaved('event',ref);
 return `<article class="ev${open?' open':''}"><button class="ev-h" data-act="evtoggle" data-ref="${ref}" aria-expanded="${!!open}"><span class="badge">${TYPE_L[e.type]||''}</span><span class="ev-t"><strong>${esc(e.name)}</strong>${e.sign!=null&&e.type!=='ingress'&&e.k!=='ingress'?` <span class="muted">in ${sIdx(e.sign).name}</span>`:''}<br><span class="muted small">${evWhen(e)}</span></span></button>${open?`<div class="ev-b"><div class="label">Astronomy</div><p>${i.fact}</p><div class="label">Astrological symbolism</div><p>${i.sym}</p><div class="label">Reflection</div><p class="quote sm-q">“${i.ref}”</p><button class="btn ghost sm" data-act="bookev" data-ref="${ref}">${sv?'Saved':'Save event'}</button></div>`:''}</article>`;
}
let EVC={k:'',list:[]};
// the sky's lists show what is coming from today for the next three months
const ahead3=()=>{const d=new Date();d.setMonth(d.getMonth()+3);return d};
const soon=e=>e.date<=ahead3();
function upcoming(){const k=dkey();if(EVC.k!==k){const now=new Date();EVC={k,list:K.events(now,new Date(+now+366*DAY))}}return EVC.list}
// The Moon: the whole screen is the night bay (atlas/moon-bg), the title set in gold in its sky; the readings sit on
// gilded, slightly see-through parchment with a star at each corner, and the first rises in a bump where today's Moon sits
const STAR4='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0l1.5 8.5L20 10l-8.5 1.5L10 20l-1.5-8.5L0 10l8.5-1.5z" fill="currentColor"/></svg>';
const mrule=(cls='')=>`<div class="mrule ${cls}"><i></i>${STAR4}<i></i></div>`;
const mbox=(h,cls='')=>`<section class="mbox ${cls}">${['tl','tr','bl','br'].map(c=>`<i class="mb-c ${c}">${STAR4}</i>`).join('')}${h}</section>`;
// the gold title set in the painting's sky, with its line, circles and star beneath
// the title stays in place with the painting while the boxes scroll up over it; Back and the page's own buttons float
// above everything in a bar of their own, so they can always be reached
const SHARE_PAGES=['affinity','resonance','synastry','birth-chart','life-path','name-within','cycles','dream','moon','profile'];
const mnHead=(t,right='',back=true)=>{if(V.sec==='discover'&&SHARE_PAGES.includes(tab()))right=obj('share','data-act="sharecard" data-k="page"','Share this','pg-share')+right;return mnHead0(t,right,back)};
// the fine gold rule beneath every page's title: a line, a ring and a star at its heart
const MN_ORN='<svg class="mn-orn" viewBox="0 0 160 16" aria-hidden="true"><path d="M0 8h56M104 8h56" stroke="currentColor" stroke-width=".8"/><circle cx="62" cy="8" r="2.6" fill="none" stroke="currentColor" stroke-width=".9"/><circle cx="98" cy="8" r="2.6" fill="none" stroke="currentColor" stroke-width=".9"/><path d="M80 0l1.6 6.4L88 8l-6.4 1.6L80 16l-1.6-6.4L72 8l6.4-1.6z" fill="currentColor"/></svg>';
const mnHead0=(t,right='',back=true)=>`<div class="mn-bar">${back?iconBtn('back','data-act="back"','Back'):''}${right?`<div class="mn-r">${right}</div>`:''}</div><header class="mn-hd stay"><div class="mn-t"><h1>${t}</h1>${MN_ORN}${mnGreet()}</div></header>`;
// a line for the reader beneath the title of each inner page, in the voice of the page
const MN_GREET={whisper:'the card that found you today',resonance:'the music two names make together',calendar:'the sky above you, night by night',moon:'the Moon above you tonight',planets:'the wanderers that move through your sky',events:'what the heavens are preparing',
 'birth-chart':'the sky you were born beneath','life-path':'the road your soul chose','name-within':'the music in your name',cycles:'the season you are walking through',library:'the old knowledge, open to you',profile:'the sky that is yours alone',notifications:'what the stars will whisper to you',settings:'your Kosmia, as you wish it'};
const mnGreet=()=>{const g=MN_GREET[tab()],n=firstName();return g&&n?`<p class="mn-greet">${esc(n)}, ${g}</p>`:''};
// a page built as a stack of parchment panels, set as a night page instead: its painting behind (cls picks it), the
// gold title in the sky, and each panel a gilded see-through box with a star at each corner
const gild=h=>h.replace(/<section class="card([^"]*)"([^>]*)>/g,(_,c,a)=>`<section class="mbox${c}"${a}>${['tl','tr','bl','br'].map(k=>`<i class="mb-c ${k}">${STAR4}</i>`).join('')}`);
const nightPage=(h,cls)=>gild(h.replace(/^<div class="stack"><h1>([\s\S]*?)<\/h1>/,(_,t)=>`<div class="mnp ${cls}">${mnHead(t)}`));
// a page under the old beige title bar (hdr), set as a night page the same way: the bar's title, line and buttons move into the sky
const nightSub=(h,cls)=>gild(h.replace(/^\s*<div class="sub([^"]*)">\s*<header class="phd"><div class="ph-l">([\s\S]*?)<\/div><div class="ph-t"><h1>([\s\S]*?)<\/h1>(?:<p class="ph-sub">([\s\S]*?)<\/p>)?<\/div><div class="ph-r">([\s\S]*?)<\/div><\/header>/,
 (_,c,l,t,sub,r)=>`<div class="mnp ${cls}${c}">${mnHead(t,r,!!l)}${sub?`<p class="mn-sub">${sub}</p>`:''}`));
// one look for every section across the app: a box's opening title (h3) rises out of it as the divider between
// sections, the same carved title between fine rules as Stars' "by area of life"; a box that holds several labelled
// parts becomes a tile for each, every one under its own divider
function tileUp(){
 const sep=t=>{const d=document.createElement('div');d.className='k-div msec';d.setAttribute('role','separator');const s=document.createElement('span');s.textContent=t;d.append(s);return d};
 document.querySelectorAll('#app .mnp .mbox:not([data-t])').forEach(b=>{
  b.dataset.t=1;
  const own=()=>[...b.children].filter(e=>!e.matches('.mb-c'));
  const h=own()[0];
  if(h&&h.tagName==='H3'&&!h.children.length){b.before(sep(h.textContent.trim()));h.remove();const r=own()[0];if(r&&r.matches('.mrule'))r.remove()}
  if(!own().some(e=>e.matches('.label')))return;
  const pre=[],parts=[];let cur=null;
  for(const e of own()){if(e.matches('.label')){cur={t:e.textContent.trim(),els:[]};parts.push(cur);e.remove()}else(cur?cur.els:pre).push(e)}
  const trim=a=>{while(a.length&&a[a.length-1].matches('.mrule'))a.pop().remove();while(a.length&&a[0].matches('.mrule'))a.shift().remove();return a};
  trim(pre);parts.forEach(x=>trim(x.els));
  // a picture alone before the first part travels with that part
  if(pre.length&&pre.every(e=>!e.textContent.trim())){parts[0].els.unshift(...pre.splice(0))}
  let at=b;
  if(!pre.length){const x=parts.shift();b.before(sep(x.t));b.append(...x.els)}
  for(const x of parts){const t=document.createElement('section');t.className='mbox tile';t.dataset.t=1;t.append(...x.els);const d=sep(x.t);at.after(d);d.after(t);at=t}
 });
 // every page's title at one size (the Tarot page's), smaller only where its longest word would not fit the width
 document.querySelectorAll('#app :is(.hl-top h1.cz,.mn-hd h1,.pf-hero h1.cz,.hh-word)').forEach(e=>e.style.setProperty('--lw',e.matches('.pf-hero h1')?e.innerText.trim().length:Math.max(...e.innerText.trim().split(/\s+/).map(x=>x.length))));
 // a card that opens with its own ornamented title gives it up to the divider above it
 document.querySelectorAll('#app section.card>.orn:first-child').forEach(o=>{const h=o.querySelector('h2');if(!h||o.children.length>1)return;o.parentElement.before(sep(h.textContent.trim()));o.remove()});
 // a box that only holds a list of rows stands aside, so the rows themselves are the tiles
 document.querySelectorAll('#app :is(.mnp .mbox,.hl-card,section.card)').forEach(b=>{const own=[...b.children].filter(e=>!e.matches('.mb-c'));b.classList.toggle('bare',own.length===1&&own[0].matches('.list')||own.length>1&&own.every(e=>e.matches('.asp')))});
}
function moonView(now){
 const m=K.moon(now),ing=K.moonIngress(now),ph=K.lunarPhases(now,ahead3()),nn=ph.find(e=>e.k==='new_moon'),nf=ph.find(e=>e.k==='full_moon');
 const next=(l,e)=>`<div><div class="label">${l}</div><p>${e?evt(e.date)+'<br><span class="muted">in '+sIdx(e.sign).name+'</span>':''}</p></div>`;
 return `<div class="mnp">${mnHead('The Moon')}
 ${mbox(`<span class="mb-bump"></span><span class="mb-moon">${pic('moons',m.name.toLowerCase().replace(/ /g,'-'),'mb-mi')||moonSvg(m,100)}</span><div class="mb-flank">${mrule('l')}${mrule('r')}</div>
 <div class="center"><h2>${m.name}</h2><p>About ${Math.round(m.ill*100)}% lit · ${m.waxing?'waxing':'waning'} · in ${sIdx(m.sign).name}</p><p class="muted small">Enters ${sIdx(ing.sign).name} ${evt(ing.date)}</p></div>${mrule()}
 <div class="label">Traditional reading</div><p>${m.name==='New Moon'?'A moment associated with beginnings. Consider what you would like to plant.':m.name==='Full Moon'?'A moment associated with fullness and gratitude. Notice what has grown.':m.waxing?'A waxing Moon is associated with growth and intention: what would you like to nurture?':'A waning Moon is associated with release: what are you ready to let go of?'} With the Moon in ${sIdx(m.sign).name}, feelings tend to move ${STYLE[sIdx(m.sign).id]}.</p><div class="label">An optional ritual</div><p>${RITUAL[m.name]}</p>`,'first')}
 ${mbox(`<div class="mb-two">${next('Next New Moon',nn)}<span class="mb-vr">${STAR4}</span>${next('Next Full Moon',nf)}</div>`)}
 ${mbox(`<h3>Lunar phases ahead</h3>${mrule()}<div class="list">${ph.map(e=>evRow(e)).join('')}</div>`,'phases')}
 <p class="mn-note">Times are for ${esc(TZ())}. The Moon’s sign is its geocentric position on the tropical zodiac.</p></div>`;
}
// Planets: the same night page as The Moon, over the planets' painting (atlas/planets-bg)
function planetsView(now){
 const pos=K.positions(now),rx=K.retrogrades(now,ahead3()),ing=upcoming().filter(e=>e.k==='ingress'&&soon(e));
 const d=x=>x?shortD(x):'';
 return `<div class="mnp pl">${mnHead('Planets')}
 ${mbox(`<h3>Where the planets are now</h3>${mrule()}<div class="tbl"><table><tr><th></th><th>Planet</th><th>Position</th><th></th></tr>${pos.map(p=>`<tr><td class="glyph">${p.g}</td><td>${p.n}</td><td>${degTxt(p.lon)}</td><td>${p.retro?'℞ retrograde':''}</td></tr>`).join('')}</table></div><details class="how"><summary>How this is worked out</summary><p>Geocentric, tropical zodiac, ${evt(now)}.</p></details>`)}
 ${mbox(`<h3>Retrograde windows</h3>${mrule()}${rx.length?rx.map(w=>`<div class="asp"><strong>${w.planet}</strong> ${w.start&&w.start<=now&&(!w.end||w.end>=now)?'<span class="badge">now</span>':''}<p class="small">${w.start?d(w.start)+(w.sign!=null?' in '+sIdx(w.sign).name:''):'Before the search window'} → ${w.end?d(w.end)+(w.endSign!=null?' in '+sIdx(w.endSign).name:''):'beyond the next year'}</p><p class="muted small">Traditionally a time to review ${PM[w.planet]}.</p></div>`).join(''):'<p>No retrograde periods in the next year.</p>'}`)}
 ${mbox(`<h3>Coming sign changes</h3>${mrule()}<div class="list">${ing.map(e=>evRow(e)).join('')}</div>`,'phases')}</div>`;
}
// Celestial Events: a night page over the eclipse and meteor shower (atlas/events-bg); the filters with their introduction,
// then the year's events, each on a gilded see-through box
function eventsView(){
 const f=V.filter.events||'all',ev=upcoming().filter(e=>['eclipse','season','meteor','conjunction','planet'].includes(e.type)&&e.k!=='ingress'&&soon(e)&&(f==='all'||e.type===f));
 return `<div class="mnp ev">${mnHead('Celestial Events')}
 ${mbox(`<p class="center">Eclipses, solstices, equinoxes, meteor showers and meetings of planets over the next three months. Each separates the astronomy from its traditional symbolism.</p>${mrule()}${chips('Show',[['all','All'],['eclipse','Eclipses'],['season','Seasons'],['meteor','Meteors'],['conjunction','Conjunctions'],['planet','Planets']],f,'fevents')}`,'ev-intro')}
 ${mbox(`<h3>The next three months</h3>${mrule()}${ev.length?`<div class="list">${ev.map(e=>evRow(e)).join('')}</div>`:'<p class="center">Nothing of this kind in the next three months. Try another filter.</p>'}`,'phases')}</div>`;
}
/* ----- Discover: a mystical library of self-discovery, in six categories: Dream Interpretation, Your Cosmic Blueprint,
   Cosmic Connections, The Language of Numbers, the Celestial Calendar and the Mystical Library ----- */
// the pages kept from the six-section release open under their own header
const subPage=h=>h.replace(/^<div class="stack"><h1>([\s\S]*?)<\/h1>/,(_,t)=>`<div class="sub">${hdr(t)}`);
// Discover's shelves (the sky you were born beneath, two souls, the sky above, the night's dreams), shown on Stars
function discoverLib(part){
 const nm=firstName(),shelf=(t,sub)=>`<div class="dshelf"><h2>${t}</h2><p>${sub}</p></div>`;
 const bd=hasBirthDate()?S.birth.date:'',yr=Number(dkey().slice(0,4));
 let chSub='Your cosmic blueprint';try{if(bd&&S.fullName&&K){const ch=myChart(),pl=n=>{const x=ch.pl.find(q=>q.n===n);return x?sIdx(x.sign).name:''};chSub=[pl('Sun')&&pl('Sun')+' Sun',pl('Moon')&&pl('Moon')+' Moon'].filter(Boolean).join(' · ')||chSub}}catch(e){}
 let lpSub='Your soul’s journey',cySub='Your personal year, month and day';try{if(bd&&N){const l=N.lifePath(bd).r.n;lpSub=`Your number ${l} · ${N.MEANING[l][0]}`;cySub=`Your Personal Year ${N.personalYear(bd,yr).r.n}`}}catch(e){}
 const ft=(img,title,sub,t,shape)=>`<button class="dft ${shape}" data-go="discover" data-t="${t}"><span class="dft-art">${ui(img,'dft-i')}</span><span class="dft-t"><strong>${title}</strong><span>${sub}</span></span></button>`;
 return `<div class="dlib">
  ${part==='codex'?`${hasBirthDate()&&S.fullName?'':`<button class="dprof" data-go="discover" data-t="profile">${ui('m-'+S.sign,'dp-i')}<span><strong>Complete your Birth Details</strong><span>Your birth day, time and place open your chart, your Life Path and your cycles.</span></span>${IC.chev}</button>`}
  ${shelf('Your Codex',`${nm?esc(nm)+', the':'The'} sky you were born beneath`)}
  ${ft('ex-chart','Birth Chart',esc(chSub),'birth-chart','round')}${ft('ex-lifepath','Life Path',esc(lpSub),'life-path','round')}
  ${ft('ex-name','The Name Within','The numbers in your name','name-within','round')}${ft('m-'+S.sign,'Personal Year',esc(cySub),'cycles','round')}`:''}
  ${part==='circle'?`${shelf('Your Circle','Read for the people you love')}
  ${ft('hero-affinity','Compatibility','Signs · Names · Birth charts','affinity','night wide')}`:''}
  ${part==='sky'?`${shelf('The Sky Above','What the heavens are doing now')}
  ${ft('banner-calendar','Cosmic Calendar','The Moon, the planets and every event','calendar','night wide')}${ft('banner-library','Astrology Library','Signs, planets, houses and tarot','library','night wide')}`:''}
  ${part==='oracle'?`${shelf('What the Night Brings','The dreams you carry back with you')}
  ${ft('hero-dream','Dream Interpretation','Tell it, and its symbols answer','dreams','night wide')}`:''}
 </div>`;
}
views.discover=()=>{
 const t=tab();
 const map={'birth-chart':chartView,profile:()=>nightPage(profileView(),'cp'),affinity:affinityView,resonance:resonanceView,synastry:()=>nightPage(synastryView(),'sy'),'life-path':()=>nightSub(lifePathView(),'lp'),'name-within':()=>nightSub(nameView(),'nm'),cycles:()=>nightPage(cyclesView(),'cy'),
  calendar:()=>nightSub(calendarView(),'cc'),moon:()=>moonView(new Date()),planets:()=>planetsView(new Date()),events:eventsView,dreams:dreamsView,'new-dream':()=>nightSub(newDreamView(),'nd'),dream:()=>nightSub(dreamView(),'dm'),'dream-journal':()=>nightSub(dreamJournalView(),'dj'),library:()=>nightSub(libraryView(),'lb')};
 if(map[t]&&GROUPS[t])return groupTabs(t,(!A&&['synastry','calendar','moon','planets','events'].includes(t))?`<div class="sub">${hdr(tabLabel('discover',t))}${needLib()}</div>`:map[t]());
 if(map[t]){if(!A&&['birth-chart','synastry','calendar','moon','planets','events'].includes(t))return `<div class="sub">${hdr(tabLabel('discover',t))}${needLib()}</div>`;return map[t]()}
 V.chartOpen=false;
 // the lake under the crescent Moon with the zodiac wheel in its water holds still behind the page, its lilies and roses
 // rising at the foot; the title in its sky, then three shelves of night glass, each door telling the reader what it
 // already knows of them
 const nm=firstName();
 return `<div class="land dland dnight">${jdoor()}<header class="hl-top stay"><h1 class="cz">Discover</h1><p class="hgreet">${nm?esc(nm)+', the sky':'The sky'} has more to tell you</p></header>
 ${discoverLib()}</div>`
};
const GROUP_COMPAT=[['affinity','Signs'],['resonance','Names'],['synastry','Birth Charts']],GROUP_SKY=[['calendar','Calendar'],['moon','Moon'],['planets','Planets'],['events','Events']];
const GROUPS={};GROUP_COMPAT.forEach(([k])=>GROUPS[k]=GROUP_COMPAT);GROUP_SKY.forEach(([k])=>GROUPS[k]=GROUP_SKY);
function groupTabs(t,h){
 const g=GROUPS[t],bar=`<div class="gtabs" role="tablist">${g.map(([k,l])=>`<button role="tab" aria-selected="${k===t}" class="${k===t?'on':''}" data-act="gtab" data-k="${k}">${l}</button>`).join('')}</div>`;
 if(g===GROUP_COMPAT)h=h.replace(/<h1>(Zodiac Affinity|Soul Resonance|Synastry)<\/h1>/,'<h1>Compatibility</h1>');
 return h.replace('</header>','</header>'+bar);
}
/* Birth Chart: the reader's own celestial map, drawn for their chart over Kosmia's paintings. At its heart the sun
   rising over the mountains and the village (the horizon is the Ascendant's line, so it always lies level); around it
   the night where their planets shine at their exact degrees, set apart where they crowd; then their houses in Roman
   numerals and the zodiac engraved in gold, turned to their Ascendant. Then the planets, aspects and houses as their own
   tabs */
function chartWheel(c){
 const asc=c.ang?c.ang.asc:0,C=200,R0=198,R1=195,R2=158,R3=106,R4=94,f=n=>n.toFixed(1),
  pt=(lon,r)=>{const ph=(180+lon-asc)*Math.PI/180;return [C+r*Math.cos(ph),C-r*Math.sin(ph)]},
  line=(l,r1,r2,k)=>{const [x1,y1]=pt(l,r1),[x2,y2]=pt(l,r2);return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="${k}"/>`},
  ring=(r1,r2)=>`M${C-r1} ${C}a${r1} ${r1} 0 1 0 ${2*r1} 0a${r1} ${r1} 0 1 0 ${-2*r1} 0ZM${C-r2} ${C}a${r2} ${r2} 0 1 1 ${2*r2} 0a${r2} ${r2} 0 1 1 ${-2*r2} 0Z`;
 // the zodiac engraved in gold: a tick for every degree, and in each sign its painted figure between a small star and
 // its glyph
 const zod=SIGNS.map((s,i)=>{const m=(R1+R2)/2+.5,[ix,iy]=pt(i*30+15,m),[gx,gy]=pt(i*30+26,m),[sx,sy]=pt(i*30+4,m);
  return line(i*30,R2,R1,'cw-zl')+`<image href="/art/atlas/csg-${s.id}.webp" x="${f(ix-17)}" y="${f(iy-17)}" width="34" height="34"/><text x="${f(gx)}" y="${f(gy)}" class="zg">${s.g}</text><circle cx="${f(sx)}" cy="${f(sy)}" r=".9" class="cw-zs"/>`}).join('');
 const deg=Array.from({length:360},(_,i)=>line(i,R2,R2+(i%10?i%5?2.4:3.8:5.4),'cw-t')).join('');
 // whole-sign houses: each sign is one house, numbered from the rising sign
 const hs=c.known&&c.ang?K.signIdx(c.ang.asc):-1;
 const houses=hs<0?'':SIGNS.map((s,i)=>{const [hx,hy]=pt(i*30+15,(R3+R4)/2);return line(i*30,R4,R3,'cw-hl')+`<text x="${f(hx)}" y="${f(hy)}" class="cw-hn">${ROMAN((i-hs+12)%12+1)}</text>`}).join('');
 // the planets on two circles, the outer first; where they crowd they take turns on the inner one, then ease apart
 // along their circles until no two touch, each still pointing to its exact degree
 const LV=[144,121],D=30,gap=(a,b)=>{const d=Math.abs(a-b)%360;return Math.min(d,360-d)},sp=[...c.pl].sort((a,b)=>a.lon-b.lon).map(p=>({p,a:p.lon,k:0})),xy=q=>pt(q.a,LV[q.k]);
 sp.forEach((q,i)=>{const o=sp[i-1];if(o&&gap(o.p.lon,q.p.lon)<2*Math.asin(D/2/LV[0])*180/Math.PI)q.k=1-o.k});
 for(let t=0;t<200;t++){let moved=0;
  for(let i=0;i<sp.length;i++)for(let j=i+1;j<sp.length;j++){const A=sp[i],B=sp[j],[ax,ay]=xy(A),[bx,by]=xy(B),d=Math.hypot(ax-bx,ay-by);
   if(d<D){const dir=((B.a-A.a+540)%360)-180>=0?1:-1,st=Math.min(2,(D-d)/2/(LV[1]*Math.PI/180)+.2);A.a-=dir*st;B.a+=dir*st;moved=1}}
  if(!moved)break}
 const pls=sp.map(({p,a,k})=>{const r=LV[k],[x,y]=pt(a,r),[tx,ty]=pt(p.lon,R2-1),sel=V.chartSel===p.n;
  return `<g data-planet="${p.n}" tabindex="0" role="button" aria-label="${p.n} in ${sIdx(p.sign).name}"><line x1="${f(tx)}" y1="${f(ty)}" x2="${f(x)}" y2="${f(y)}" class="cw-pp"/><circle cx="${f(tx)}" cy="${f(ty)}" r="1.6" class="cw-pd"/><circle cx="${f(x)}" cy="${f(y)}" r="15" class="cw-ph${sel?' sel':''}"/><image href="/art/atlas/orb-${p.n.toLowerCase()}.webp" x="${f(x-19)}" y="${f(y-19)}" width="38" height="38"/>${p.retro?`<text x="${f(x+11)}" y="${f(y+11)}" class="cw-rx">℞</text>`:''}</g>`}).join('');
 // the Ascendant's line is the horizon of the painting; the Midheaven's crosses it
 const axes=c.ang?[[c.ang.asc,'AC'],[c.ang.mc,'MC']].map(([l,n])=>{const [x,y]=pt(l,R4-12);return line(l,R2,R4,'cw-ax'+(n==='MC'?' mc':''))+line(l+180,R2,R4,'cw-ax'+(n==='MC'?' mc':''))+`<text x="${f(x)}" y="${f(y)}" class="cw-tg">${n}</text>`}).join(''):'';
 const axin=c.ang?[c.ang.asc,c.ang.mc].map((l,i)=>line(l,R4,0,'cw-ax'+(i?' mc':''))+line(l+180,R4,0,'cw-ax'+(i?' mc':''))).join(''):'';
 return `<svg class="wheel-c cw" viewBox="0 0 400 400" role="img" aria-label="Your natal chart, drawn as a map of the sky"><defs>
 <clipPath id="cw-all"><circle cx="${C}" cy="${C}" r="${R0}"/></clipPath><clipPath id="cw-in"><circle cx="${C}" cy="${C}" r="${R4}"/></clipPath>
 <radialGradient id="cw-v" gradientUnits="userSpaceOnUse" cx="${C}" cy="${C}" r="${R2}"><stop offset=".6" stop-color="#05070F" stop-opacity="0"/><stop offset="1" stop-color="#05070F" stop-opacity=".55"/></radialGradient></defs>
 <image href="/art/atlas/chart-sky.webp" x="${C-R0}" y="${C-R0}" width="${2*R0}" height="${2*R0}" preserveAspectRatio="xMidYMid slice" clip-path="url(#cw-all)"/><circle cx="${C}" cy="${C}" r="${R2}" fill="url(#cw-v)"/>
 <path d="${ring(R0,R2)}" fill-rule="evenodd" class="cw-band"/>${deg}${zod}<circle cx="${C}" cy="${C}" r="${R0}" class="cw-l b"/><circle cx="${C}" cy="${C}" r="${R1}" class="cw-l"/><circle cx="${C}" cy="${C}" r="${R2}" class="cw-l b"/>
 <image href="/art/atlas/chart-scene.webp" x="${C-R4}" y="${C-R4}" width="${2*R4}" height="${2*R4}" preserveAspectRatio="xMidYMid slice" clip-path="url(#cw-in)"/>${axin}
 ${hs<0?'':`<path d="${ring(R3,R4)}" fill-rule="evenodd" class="cw-band h"/>${houses}`}<circle cx="${C}" cy="${C}" r="${R3}" class="cw-l"/><circle cx="${C}" cy="${C}" r="${R4}" class="cw-l b"/>${axes}${pls}</svg>`;
}
const CHART_ROWS=[['planets',()=>pic('cats','planets','acc-i'),'Planetary Positions','Where the planets were at your birth'],['houses',()=>ui('ico-family','acc-i'),'Houses','The 12 areas of your life'],['aspects',()=>pic('cats','aspects','acc-i'),'Aspects','The connections between planets'],['interp',()=>pic('cats','insights','acc-i'),'Full Interpretation','A complete analysis of your chart']];
function chartView(){
 const other=!!V.ns.chart,c=other?V.oChart:myChart(),oname=(V.oBirthName||'').trim(),H=`${mnHead(other&&c?(oname?esc(oname.split(' ')[0])+'’s Chart':'Their Birth Chart'):c?'Your Birth Chart':'Birth Chart')}<p class="mn-sub">${other?'Another cosmic blueprint':'Your cosmic blueprint'}</p>`;
 if(other&&!c)return `<div class="mnp ch">${H}${mbox('<p class="lead">Calculate anyone’s birth chart from their date, time and place of birth.</p>')}${birthForm(true)}${mineBtn('chart',!!myChart())}</div>`;
 if(!c)return `<div class="mnp ch">${H}${invite('A personalised map of the sky at the moment you were born. Add your date, time and place of birth to your birth details, or look up anyone’s chart.','chart')}</div>`;
 const b=other?V.oBirth:S.birth,sel=c.pl.find(p=>p.n===V.chartSel),ct=V.chartTab;
 const note=b.unk||!b.time?`<p class="note">Without a birth time, planets are taken at noon on your birth date. ${!hasPlace(b)?'Add your birth place to calculate the Ascendant, Midheaven and houses. ':''}${c.moonRange?`The Moon moves from ${sIdx(c.moonRange[0]).name} to ${sIdx(c.moonRange[1]).name} during your birth day, so its sign depends on your birth time.`:''}</p>`:!hasPlace(b)?'<p class="note">Add your birth place so your birth time can be used for the Ascendant, Midheaven and houses.</p>':'';
 const big=[['Sun',c.pl[0]],['Moon',c.pl[1]]].map(([n,p])=>`<div class="b3"><span class="glyph">${p.g}</span><span>${n}</span><span class="b3-s"><span class="glyph">${sIdx(p.sign).g}</span> ${n==='Moon'&&c.moonRange?'Uncertain':sIdx(p.sign).name}</span><span class="b3-d">${n==='Moon'&&c.moonRange?'':degTxt(p.lon).replace(/ \S+ /,'° ').replace('°°','°')}</span></div>`).join('')
  +`<div class="b3"><span class="glyph">↑</span><span>Rising</span><span class="b3-s">${c.ang?`<span class="glyph">${sIdx(K.signIdx(c.ang.asc)).g}</span> ${sIdx(K.signIdx(c.ang.asc)).name}`:'Needs time and place'}</span><span class="b3-d">${c.ang?degTxt(c.ang.asc).replace(/ \S+ /,'° ').replace('°°','°'):''}</span></div>`;
 let body;
 if(ct==='planets')body=`<div class="list">${c.pl.map(p=>acc(`<span class="glyph pgl">${p.g}</span>`,`${p.n} in ${p.n==='Moon'&&c.moonRange?'an uncertain sign':sIdx(p.sign).name}`,`${p.n==='Moon'&&c.moonRange?'Needs birth time':degTxt(p.lon)}${p.house?' · House '+p.house:''}${p.retro?' · retrograde':''}`,`<p>${placement(p)}</p>`)).join('')}</div>`;
 else if(ct==='aspects')body=`<div class="list">${c.asp.slice(0,18).map(a=>acc(`<span class="glyph pgl">${a.g}</span>`,`${a.a.n} ${a.n} ${a.b.n}`,`orb ${a.orb.toFixed(1)}°`,`<p>Your ${PM[a.a.n]} and ${PM[a.b.n]} ${ASPT[a.n]}.</p>`)).join('')||'<p class="muted center">No major aspects within the orbs used.</p>'}</div>`;
 else if(ct==='houses')body=c.known?`<p class="muted small center">Whole-sign houses: each sign is one house, starting from the rising sign.</p><div class="list">${HOUSE.map((h,i)=>{const s=sIdx(K.signIdx(c.ang.asc)+i),inn=c.pl.filter(p=>p.house===i+1).map(p=>p.n);return acc(`<span class="hn">${i+1}</span>`,`${ORD(i+1)} house · ${s.name}`,h,`<p>The ${ORD(i+1)} house is the life area of ${h}. In your chart it falls in ${s.name}, so you tend to meet it ${STYLE[s.id]}.${inn.length?` ${inn.join(', ')} ${inn.length>1?'are':'is'} placed here, bringing ${inn.map(n=>PM[n]).join('; ')} into this area.`:''}</p>`)}).join('')}</div>`:empty('Houses need your birth time and place','Add them below to see the twelve houses of your chart.');
 else body=`<div class="wheel-wrap wheel-free">${chartWheel(c)}</div>${sel?mbox(`<h3><span class="glyph">${sel.g}</span> ${sel.n} in ${sIdx(sel.sign).name}</h3><p>${placement(sel)}</p>`):'<p class="muted center small ch-tap">Tap a planet to read it.</p>'}<div class="big3">${big}</div>
  ${acc('','Full Interpretation','A complete analysis of your chart',`<div class="read">${c.pl.filter(p=>!(p.n==='Moon'&&c.moonRange)).map(p=>`<p><strong>${p.n} in ${sIdx(p.sign).name}.</strong> ${placement(p)}</p>`).join('')}${c.ang?`<p><strong>${sIdx(K.signIdx(c.ang.asc)).name} rising.</strong> You tend to meet the world ${STYLE[sIdx(K.signIdx(c.ang.asc)).id]}.</p>`:''}</div>`,!!V.chartInterp)}`;
 return `<div class="mnp ch">${H}<p class="muted center ch-who">${ymdLong(b.date)}${b.unk||!b.time?'':' · '+esc(b.time)}${b.place?' · '+esc(b.place):''}</p>
 ${other?'':`<button class="link ch-ns" data-act="nsearch" data-k="chart">Search another person’s chart</button>`}
 <div role="group" aria-label="Chart views">${seg([['chart','Chart'],['planets','Planets'],['aspects','Aspects'],['houses','Houses']],ct,'ctab')}</div>${note}${body}
 <details class="how"><summary>How this is worked out</summary><p>Tropical zodiac, geocentric positions on the true ecliptic of date from the Astronomy Engine ephemeris. Your local birth time is converted to UTC with the historical rules for ${esc(b.tz||TZ())}. Houses are whole-sign; aspect orbs are 8° for conjunctions and oppositions, 6° for squares and trines, 4° for sextiles.</p></details>
 ${other?'':obj('kas','data-act="kasask" data-q="Explain my rising sign and what my chart’s big three suggest."','Ask Kassandra about my chart')}
 ${other?nsBtn('chart')+mineBtn('chart',!!myChart()):'<button class="btn ghost" data-go="discover" data-t="profile">Edit my Birth Details</button>'}</div>`;
}
/* Zodiac Affinity: a symbolic score from the angle between the signs, their elements and modalities */
const AFF_T=['A Mirror Connection','A Curious Connection','A Friendly Spark','A Dynamic Tension','A Harmonious Connection','An Unlikely Pairing','A Magnetic Pull'];
function affScore(a,b){
 const A1=sg(a),B1=sg(b),ia=SIGNS.indexOf(A1),ib=SIGNS.indexOf(B1),d=Math.min((ib-ia+12)%12,(ia-ib+12)%12);
 const base=[78,66,84,63,90,58,76][d],pair=[A1.el,B1.el].sort().join('-'),el=A1.el===B1.el?4:pair==='Air-Fire'||pair==='Earth-Water'?3:-3,md=A1.mod===B1.mod?-2:2,rul=A1.ruler===B1.ruler?6:0;
 const air=(A1.el==='Air')+(B1.el==='Air'),wat=(A1.el==='Water')+(B1.el==='Water'),cl=x=>Math.max(42,Math.min(97,Math.round(x)));
 const love=cl(base+el+(d===6?6:0)+wat*2),friend=cl(base+(d===2||d===4?5:0)+md+air),comm=cl(base+el+air*4-(d===3?4:0)),values=cl(base+rul+(A1.mod===B1.mod?3:-1)-(d===5?4:0));
 return {d,title:AFF_T[d],love,friend,comm,values,overall:Math.round((love+friend+comm+values)/4)};
}
const signSelect=(id,label,v)=>`<div class="field"><label for="${id}">${label}</label><div class="inp sel"><span class="glyph">${v?sg(v).g:'✦'}</span><select id="${id}">${v?'':'<option value="">Choose</option>'}${SIGNS.map(s=>`<option value="${s.id}" ${v===s.id?'selected':''}>${s.name}</option>`).join('')}</select></div></div>`;
function affinityView(){
 const a=V.love.a||S.sign,b=V.love.b;let res='';
 if(V.love.done&&a&&b){const r=zodiacMatch(a,b),sc=affScore(a,b),A1=sg(a),B1=sg(b),saved=S.conns.some(c=>c.kind==='zodiac'&&c.data.a===a&&c.data.b===b);
  const el=r.themes;
  res=`<div class="result" id="affres">${mbox(`<div class="pairm">${med(a,'pm')}<span class="pm-h">${IC.heart}</span>${med(b,'pm')}</div><div class="pair-n"><span>${A1.name}</span><span>${B1.name}</span></div>
  <h2 class="center">${sc.title}</h2><p class="center lead">${el[1][1]} ${r.angle[1]}</p>
  <div class="score"><span class="sc-h">${IC.heart}</span><strong>${sc.overall}%</strong><span>Overall compatibility</span></div>
  <div class="pills4"><span class="p-love">Love <b>${sc.love}%</b></span><span class="p-friend">Friendship <b>${sc.friend}%</b></span><span class="p-comm">Communication <b>${sc.comm}%</b></span><span class="p-val">Values <b>${sc.values}%</b></span></div>
  `)}
  <div class="list">${acc(pic('cats','love','acc-i'),'Love Compatibility','Romance and emotional connection',`<p>${el[1][1]}</p><p>${r.angle[1]}</p>`)}${acc(pic('cats','connections','acc-i'),'Friendship Compatibility','Shared values and support',`<p>${el[0][1]}</p><p>${el[4][1]}</p>`)}${acc(pic('cats','career','acc-i'),'Work Compatibility','How you collaborate',`<p>${el[3][1]}</p>`)}${acc(pic('cats','moon','acc-i'),'Detailed Analysis','Strengths, challenges and advice',matchBody(a,b))}</div>
  <div class="acts"><button class="btn" data-act="saveconn" data-kind="zodiac">${saved?'Saved to your journal':'Save connection'}</button>${obj('kas',`data-act="kasask" data-q="What do ${A1.name} and ${B1.name} traditionally bring out in each other?"`,'Ask Kassandra')}<button class="btn ghost" data-go="discover" data-t="synastry">Compare birth charts</button></div></div>`}
 return `<div class="mnp af">${mnHead('Zodiac Affinity')}<p class="mn-sub">Love • Friendship • Connection</p>${mbox(`<p class="lead">Explore the natural flow between two signs and discover your strengths, challenges and unique connection.</p>
 <div class="two">${signSelect('za','Your sign',a)}${signSelect('zb','Their sign',b)}</div>`)}<button class="btn" data-act="domatch" ${b?'':'disabled'}>See how you meet →</button>${res||`<div class="list dim">${[['love','love','Love Compatibility','Romance and emotional connection'],['connections','friend','Friendship Compatibility','Shared values and support'],['career','work','Work Compatibility','How you collaborate'],['moon','more','Detailed Analysis','Strengths, challenges and advice']].map(([i,,a2,b2])=>lrow(pic('cats',i,'acc-i'),a2,b2,'disabled')).join('')}</div><p class="muted small center">Choose their sign to see your compatibility.</p>`}</div>`;
}
// the three numerology comparisons for two names, each an expandable reading
function resonanceView(){
 const R=V.res,a=R.a||S.fullName||S.name,b=R.b;
 let out='';
 if(R.done&&N.clean(a)&&N.clean(b)){const saved=S.conns.some(c=>c.kind==='resonance'&&c.data.a===a&&c.data.b===b);
  out=`<div class="list">${resonanceRows(a,b,h=>{const m=/^<h3>(.*?)<\/h3>([\s\S]*)$/.exec(h);return m?acc('',m[1],'',m[2],true):h})}</div>`+mbox(resMethod())+`<div class="acts"><button class="btn" data-act="saveconn" data-kind="resonance">${saved?'Saved to your journal':'Save connection'}</button></div>`}
 return `<div class="mnp rs">${mnHead('Soul Resonance')}<p class="mn-sub">Name match</p>${mbox(`<p class="lead">Compare two names through numerology, using full birth names where you know them.</p>
 <div class="field"><label for="ra">Your name</label><div class="inp">${IC.star}<input type="text" id="ra" value="${esc(a)}" autocomplete="name" placeholder="Your full name"></div></div><div class="field"><label for="rb">Their name</label><div class="inp">${IC.heart}<input type="text" id="rb" value="${esc(b)}" placeholder="Their full name"></div></div>`)}<button class="btn" data-act="doresonance">Compare our names →</button><p class="muted small center">Names stay private to you.</p>${out}</div>`;
}
/* Life Path: the number, then its strengths, challenges and guidance as expandable readings */
/* the soul of each number, spoken to the reader: who they are at their best, a practice in the spirit of the Stoics,
   and a line from one of them. The same details always give the same words; nothing is drawn at random. */
const SOUL={
 1:['You are here to begin things. The courage to take the first step lives in you, and others find their own courage watching you take it.','Each morning, choose one thing that is yours to start and give it your whole attention. What others think of it is theirs; the effort is yours.',['No man is free who is not master of himself.','Epictetus']],
 2:['You are a bridge between people. Your quiet attention notices what others feel before they say it, and peace grows where you stand.','Listen fully today, then say the one honest thing that matters. Kindness and truth are not rivals; in you they work together.',['We were born to work together, like feet, like hands, like eyelids.','Marcus Aurelius']],
 3:['You carry a light that wants to be shared. Your words, your laughter and your creativity remind people that life can be beautiful.','Make one small thing today, a sentence, a sketch, a kind message, and finish it. Joy grows deeper when it is given form.',['Begin at once to live, and count each separate day as a separate life.','Seneca']],
 4:['You are a builder of lasting things. Your steadiness is a gift: what you tend with patience becomes a shelter for others.','Lay one good stone today. Do the next right task well, and trust that small steps, faithfully taken, become a road.',['Well-being is realised by small steps, but is truly no small thing.','Zeno of Citium']],
 5:['You are made for discovery. Change does not frighten you for long; it calls you forward into a larger life.','Welcome what changes today as a teacher rather than a thief. Freedom is not escaping your life; it is choosing how you meet it.',['The universe is change; our life is what our thoughts make it.','Marcus Aurelius']],
 6:['You are a keeper of hearts. Where you are, people feel at home, and your care makes the world gentler than you know.','Offer one act of care today, and include yourself in it. The love you give is strongest when it also rests in you.',['Wherever there is a human being, there is an opportunity for a kindness.','Seneca']],
 7:['You are a seeker of what is true. Your inner world is deep, and the wisdom you gather in quiet becomes a lantern for others.','Give yourself a little silence today and ask one honest question. Then trust what you find; your mind is a sanctuary, tend it well.',['The happiness of your life depends upon the quality of your thoughts.','Marcus Aurelius']],
 8:['You are here to hold power gently. You can build, lead and provide, and your strength is greatest when it serves something good.','Act today with integrity in one decision, large or small. Let your work be your character made visible.',['Waste no more time arguing what a good man should be. Be one.','Marcus Aurelius']],
 9:['You are an old soul with a wide heart. You see the whole picture, and your compassion reaches further than you realise.','Let go of one thing that has already ended, and give something away freely. What you release makes room for what is meant for you.',['What is not good for the swarm is not good for the bee.','Marcus Aurelius']],
 11:['You are a messenger of inspiration. Your intuition is a bright, sensitive instrument, and your presence can wake hope in others.','Trust one quiet intuition today, and ground it in a simple action. Inspiration becomes real when your feet stay on the earth.',['Dwell on the beauty of life. Watch the stars, and see yourself running with them.','Marcus Aurelius']],
 22:['You are a master builder. You can turn great visions into real foundations that serve many people.','Choose the one part of your vision you can build today, and build it honestly. Great works are made of small true actions.',['If it is not right, do not do it; if it is not true, do not say it.','Marcus Aurelius']],
 33:['You are a teacher of the heart. Your love is meant to heal and uplift, and your example speaks louder than any lesson.','Be the kindness you wish to see in one moment today, without needing it returned. Love freely given is never lost.',['He who lives in harmony with himself lives in harmony with the universe.','Marcus Aurelius']]};
const soul=n=>SOUL[n]||SOUL[n%9||9];
// what a Personal Year asks, in the same voice
const YEAR={1:'This is your year to begin. Plant the seeds you have been carrying; the soil is ready for you.',2:'This is a year to let things grow. Patience is not waiting, it is trusting the roots you have already planted.',3:'This is a year to express yourself. Share your voice, your joy and your gifts; they were never meant to stay hidden.',4:'This is a year to build. Steady work now becomes the home your future self will live in.',5:'This is a year of change and fresh air. Say yes to what expands you, and let go of what keeps you small.',6:'This is a year of love and responsibility. The care you give at home and to yourself comes back to you.',7:'This is a year to go inward. Rest, reflect and learn; the answers you seek are quietly forming within you.',8:'This is a year of harvest and strength. Step into your power with integrity, and let your effort be rewarded.',9:'This is a year of completion. Close the chapters that are finished with gratitude, and make room for a new beginning.'};
// a reading spoken to the reader (or about someone else), from one number
function soulBlock(n,who,label){const x=soul(n);
 return `<div class="soul"><p class="soul-l">${label}</p><p class="soul-t">${who?esc(who)+', ':''}${who?x[0].charAt(0).toLowerCase()+x[0].slice(1):x[0]}</p><p>${x[1]}</p><p class="soul-q">“${x[2][0]}”<span>${x[2][1]}</span></p></div>`}
const firstOf=nm=>(nm||'').trim().split(/\s+/)[0]||'';
const LPX={1:['Courage, originality and the drive to begin what others only imagine.','Going it alone, impatience, and pride that will not ask for help.','Lead by example and let others walk beside you; independence is strongest when it is generous.'],
 2:['Sensitivity, diplomacy and a gift for bringing people together.','Self-doubt, over-giving and losing your own voice in the harmony.','Your quiet way is a strength. Speak your needs as gently as you listen to others.'],
 3:['Expression, warmth, humour and a creative spark that lifts a room.','Scattered energy, unfinished projects and hiding feelings behind a smile.','Choose one creative thread and follow it; joy grows deeper when it is given form.'],
 4:['Discipline, loyalty and the patience to build what lasts.','Rigidity, overwork and fear of change.','Leave room for rest and play inside the structure; foundations are for living on.'],
 5:['Curiosity, adaptability and a love of freedom and the senses.','Restlessness, excess and leaving before things deepen.','Seek freedom through commitment you choose; adventure is richest with roots.'],
 6:['Care, responsibility and a gift for making a home of any place.','Perfectionism, control and carrying everyone else’s weight.','Care for yourself as you care for others; love needs no sacrifice to be real.'],
 7:['Insight, depth and a mind that seeks the truth beneath the surface.','Isolation, suspicion and living too much in the head.','Trust your inner knowing and share it; wisdom grows when it is spoken.'],
 8:['Ambition, resilience and a natural sense of authority.','Workaholism, control and measuring worth in results.','Use your power to lift others; true abundance includes time, love and rest.'],
 9:['Compassion, wisdom and a wide, generous heart.','Martyrdom, holding on to the past and difficulty with endings.','Let go with grace; every ending you honour makes room for a greater giving.'],
 11:['Intuition, inspiration and a sensitivity that lights the way for others.','Nervous tension, self-doubt and feeling the world too keenly.','Ground your visions in daily life; your light is steadiest when you rest.'],
 22:['Vision with the practical power to build it on a grand scale.','Pressure, overwhelm and fear of not living up to the dream.','Build one stone at a time; the great work is made of small, faithful days.'],
 33:['Selfless love, healing and the gift of teaching through example.','Over-responsibility and neglecting your own needs.','Serve from fullness, not depletion; your care heals best when it includes you.']};
const LPREL={1:'You love with loyalty and fire, and need a partner who respects your independence. Growth comes from letting others lead sometimes.',2:'You are a natural partner: attentive, gentle and devoted. Choose people who meet your care with their own.',3:'You bring lightness and play to love, and need to be heard and enjoyed. Depth grows when you share the quieter feelings too.',4:'You show love through constancy and practical care. You flourish with someone steady, and with room for a little spontaneity.',5:'You need freedom and adventure in love. The right bond feels like an open door, not a cage.',6:'You love by nurturing and making a home of every bond. Let yourself be cared for as well as caring.',7:'You value depth and meaningful connection above all. Trust grows slowly in you, and once given it runs deep.',8:'You love with strength and generosity, and respect a partner with their own purpose. Tenderness matters as much as achievement.',9:'You love widely and compassionately. Your bonds flourish when you also let others give back to you.',11:'You feel others deeply and seek a soul connection. Protect your sensitivity with people who are gentle with it.',22:'You build love like you build everything: to last. Shared vision and steady trust are your foundations.',33:'You love selflessly and heal those around you. Love flows best when it includes yourself.'};
const LPQ={1:'Where am I being asked to lead my own life more boldly?',2:'Where am I giving more than I let myself receive?',3:'What would I create if no one were watching?',4:'What am I building, and does it still feel like mine?',5:'Where do I need more freedom, and where more roots?',6:'How can I care for myself as I care for others?',7:'What do I already know, deep down, that I have not yet trusted?',8:'What does true abundance look like for me, beyond results?',9:'What am I ready to complete, so that something new can begin?',11:'Which quiet insight am I ready to honour?',22:'What is the first stone of the great work I dream of?',33:'Where can my love heal without depleting me?'};
function lifePathView(){
 const other=!!V.ns.lp,d=other?V.lpOther:(hasBirthDate()?S.birth.date:''),H=hdr('Life Path',{sub:other?'Another soul’s journey':'Your soul’s journey'});
 const lead='Discover the meaning behind your numbers and the path you are here to walk. Your Life Path reveals your gifts, lessons and the opportunities that shape your journey.';
 if(other&&!d)return `<div class="sub">${H}${mbox(`<p class="lead">Find anyone’s Life Path from their date of birth.</p><div class="field"><label for="lpd">Their date of birth</label><div class="inp">${IC.cal}<input type="date" id="lpd"></div></div>`)}<button class="btn" data-act="lpgo">Their Life Path →</button>${mineBtn('lp',hasBirthDate())}</div>`;
 const form=other?'':mbox(`<p class="lead">${lead}</p>`);
 if(!d)return `<div class="sub">${H}${invite(lead+' Add your date of birth to your birth details, or look up anyone’s Life Path.','lp')}<div class="list dim">${[['ex-lifepath','Your Life Path Number','Your core purpose'],['t-whisper','Key Strengths','Your natural gifts'],['ds-flying','Challenges','Lessons to grow from'],['t-journal','Guidance','How to align with your path']].map(([i,a2,b2])=>lrow(ui(i,'acc-i round'),a2,b2,'disabled')).join('')}</div></div>`;
 const L=N.lifePath(d),bd=N.birthday(d),M=N.MEANING[L.r.n],X=LPX[L.r.n]||LPX[L.r.n%9||9],ch=x=>x.chain.length>1?x.chain.join(' → '):String(x.n);
 return `<div class="sub">${H}${form}
 ${panel(`<div class="lp"><span class="num big">${L.r.n}</span><div><p class="kick">${other?'Their':'Your'} Life Path Number</p><h2>${M[0]}</h2><p class="muted">${M[1]}</p></div></div><p>${M[2]}</p>${soulBlock(L.r.n,other?'':firstOf(S.name||S.fullName),'A message for '+(other?'this path':'you'))}`,'ornate')}
 <div class="list">${acc(ui('t-whisper','acc-i round'),'Key Strengths','Your natural gifts',`<p>${X[0]}</p>`,true)}${acc(ui('ds-flying','acc-i round'),'Challenges','Lessons to grow from',`<p>${X[1]}</p>`)}${acc(ui('t-journal','acc-i round'),'Purpose &amp; Growth','How to align with your path',`<p>${X[2]}</p>`)}${acc(pic('cats','love','acc-i'),'Relationships','How you love and connect',`<p>${LPREL[L.r.n]||LPREL[L.r.n%9||9]}</p>`)}${acc(pic('cats','insights','acc-i'),'Reflection','A question to carry',`<p class="quote">“${LPQ[L.r.n]||LPQ[L.r.n%9||9]}”</p>`)}
 ${acc(ui('ex-name','acc-i round'),'The Calculation','How your number was found',`<p class="calc">Birth date ${ymdLong(d)}<br>Month ${L.m}: ${ch(L.parts.month)}<br>Day ${L.d}: ${ch(L.parts.day)}<br>Year ${L.y}: ${String(L.y).split('').join(' + ')} = ${L.parts.year.chain.slice(1).join(' → ')}<br>Together: ${L.parts.month.n} + ${L.parts.day.n} + ${L.parts.year.n} = ${L.total}${L.r.chain.length>1?' → '+L.r.chain.slice(1).join(' → '):''}</p><p class="muted small">Method: month, day and year are each reduced to a single digit or a master number (11, 22, 33), then added and reduced again.</p>`)}
 ${acc(ui('ex-lifepath','acc-i round'),`Birthday Number · ${bd.n}`,N.MEANING[bd.n][0],`<p>The day you were born adds a gift to your path: ${N.MEANING[bd.n][1]}.</p>`)}</div>
 ${other?'':'<button class="btn ghost" data-ss="savelp">Save to Your Readings</button>'}${nsBtn('lp')}${other?mineBtn('lp',hasBirthDate()):'<button class="btn ghost" data-go="discover" data-t="cycles">Personal Year</button>'}</div>`;
}
/* The Name Within: the numbers in a full birth name, each an expandable reading with its working */
function nameView(){
 const other=!!V.ns.nw,nm=nameNums(other?V.oName:S.fullName),alt=other?null:nameNums(S.altName),L=!other&&hasBirthDate()?N.lifePath(S.birth.date):null;
 const tbl=`<table class="ltable"><tr>${N.TABLE.map(([v])=>`<th>${v}</th>`).join('')}</tr>${[0,1,2].map(r=>`<tr>${N.TABLE.map(([,ls])=>`<td>${ls[r]||''}</td>`).join('')}</tr>`).join('')}</table>`;
 const letters=x=>`<div class="letters">${x.letters.map(l=>`<span class="lt${l.vowel?' v':''}"><b>${l.c}</b><i>${l.v}</i></span>`).join('')}</div>`;
 const one=(x,k)=>x[k]&&x[k].r.n?`<span class="num">${x[k].r.n}</span> <strong>${N.MEANING[x[k].r.n][0]}</strong>`:'';
 const rows=x=>acc(pic('cats','general','acc-i'),'Expression Number',`Your natural abilities and purpose ${one(x,'expression')}`,`${numBlock('Expression (Destiny): who you are becoming',x.expression,true)}<p>${N.MEANING[x.expression.r.n]?N.MEANING[x.expression.r.n][2]:''}</p>`,true)
  +acc(pic('cats','love','acc-i'),'Soul Urge Number',`Your inner desires ${one(x,'soul')}`,numBlock('Soul Urge: what your heart longs for',x.soul,true),true)
  +acc(pic('cats','insights','acc-i'),'Personality Number',`How you show up to the world ${one(x,'personality')}`,numBlock('Personality: how others first meet you',x.personality,true),true)
  +(L&&x.expression.r.n?(()=>{const m=N.reduce(L.r.n+x.expression.r.n);return acc(pic('cats','lifepath','acc-i'),'Maturity Number',`Who you grow into · <span class="num">${m.n}</span>`,`<p>Your Life Path (${L.r.n}) and Expression (${x.expression.r.n}) together: ${L.r.n} + ${x.expression.r.n} = ${L.r.n+x.expression.r.n}${m.chain.length>1?' → '+m.chain.slice(1).join(' → '):''}. <strong>${N.MEANING[m.n][0]}</strong>: ${N.MEANING[m.n][1]}, the qualities that tend to ripen in the second half of life.</p>`)})():'')
  +acc('','Your letters','Vowels are highlighted',letters(x));
 const lead='Your name carries a vibration and a story. Discover what your name reveals about your personality, purpose and life path.';
 const dim=`<div class="list dim">${[['general','Expression Number','Your natural abilities'],['love','Soul Urge Number','Your inner desires'],['insights','Personality Number','How you show up to the world'],['lifepath','Destiny Number','Your life purpose']].map(([i,a2,b2])=>lrow(pic('cats',i,'acc-i'),a2,b2,'disabled')).join('')}</div>`;
 const H=hdr('The Name Within',{sub:other?'Another name’s numbers':'Name numerology'});
 if(other&&!nm)return `<div class="sub">${H}${mbox(`<p class="lead">Discover the numbers in anyone’s name: use their full name at birth.</p><div class="field"><label for="fn2">Their full name</label><div class="inp">${IC.star}<input type="text" id="fn2" value="${esc(V.oName||'')}" placeholder="Their full name at birth"></div></div>`)}<button class="btn" data-act="nwgo">Reveal their numbers →</button>${mineBtn('nw',!!nameNums(S.fullName))}</div>`;
 if(!nm)return `<div class="sub">${H}${invite(lead+' Add your full name at birth to your birth details, or look up anyone’s name.','nw')}${dim}</div>`;
 return `<div class="sub">${H}${mbox(`<p class="lead">${other?`The numbers in the name <strong>${esc(V.oName)}</strong>.`:lead}</p>`)}
 ${nm.expression.r.n?mbox(soulBlock(nm.expression.r.n,other?firstOf(V.oName):firstOf(S.name||S.fullName),other?'What this name carries':'What your name carries')):''}
 <div class="list">${rows(nm)}</div>
 ${alt?`<h3 class="sec-h">The name you use now</h3><div class="list">${rows(alt)}</div><p class="muted small">Your birth name is read as the blueprint you arrived with; the name you use now as the way you have chosen to express it.</p>`:''}
 ${acc('','The Pythagorean letter table','How each letter is counted',`${tbl}<p class="muted small">Accents are ignored (É counts as E), as are hyphens, apostrophes and spaces. Each word of a name is reduced on its own, then the words are added and reduced again, keeping master numbers 11, 22 and 33.</p>`)}
 ${other?'':'<button class="btn ghost" data-ss="savenw">Save to Your Readings</button>'}${nsBtn('nw')}${other?mineBtn('nw',!!nameNums(S.fullName)):''}</div>`;
}
/* Cosmic Calendar: a month of the sky, each event with its picture, its words and, when opened, its astronomy and meaning */
function calendarView(){
 const now=new Date(),m=K.moon(now),pos=K.positions(now),rx=pos.filter(p=>p.retro),today=dkey(),cur=today.slice(0,7),mk=(V.cal.month||'')>cur?V.cal.month:cur,[y,mo]=mk.split('-').map(Number);
 const prev=new Date(Date.UTC(y,mo-2,1)).toISOString().slice(0,7),next=new Date(Date.UTC(y,mo,1)).toISOString().slice(0,7);
 const first=Date.UTC(y,mo-1,1),evs=K.events(new Date(first-14*36e5),new Date(Date.UTC(y,mo,1)+14*36e5)).filter(e=>{const k=evDay(e);return k.slice(0,7)===mk&&k>=today});
 const weather=panel(`<p class="kick">Today’s cosmic weather</p><div class="ce"><span class="ce-art">${moonPic(m,'ce-moon')}</span><p>The Moon is ${m.name==='Full Moon'?'full':m.name==='New Moon'?'new':'a '+m.name.toLowerCase()} in ${sIdx(m.sign).name}; the Sun is in ${sIdx(pos[0].sign).name}.${rx.length?` ${rx.map(p=>p.n).join(', ')} ${rx.length>1?'are':'is'} retrograde.`:' No planets are retrograde.'}</p></div>`,'ornate');
 let body;
 if(V.cal.view==='month'){
  const days=new Date(Date.UTC(y,mo,0)).getUTCDate(),lead=(new Date(first).getUTCDay()+6)%7,byDay={};
  evs.forEach(e=>{const k=e.dateOnly?e.date.toISOString().slice(0,10):dkey(e.date);(byDay[k]=byDay[k]||[]).push(e)});
  const sel=V.cal.day&&V.cal.day.slice(0,7)===mk?V.cal.day:'';
  body=`<div class="jcal" role="grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="jc-d" role="columnheader">${d}</div>`).join('')}${Array.from({length:lead},()=>'<div></div>').join('')}${Array.from({length:days},(_,i)=>{const k=`${mk}-${String(i+1).padStart(2,'0')}`,es=byDay[k]||[],ph=es.find(e=>e.type==='moon');if(k<today)return `<div class="jc-c past" aria-hidden="true"><span>${i+1}</span></div>`;return `<button class="jc-c${k===today?' today':''}${k===sel?' sel':''}" data-act="calday" data-k="${k}" aria-label="${ymdLong(k)}${es.length?', '+es.length+' event'+(es.length>1?'s':''):''}"><span>${i+1}</span>${ph?pic('moons',phaseSlug(ph.name),'jc-moon'):es.length?'<i class="jc-star">✦</i>':''}</button>`}).join('')}</div>
  ${sel?`<h3 class="sec-h">${ymdLong(sel)}</h3><div class="list">${(byDay[sel]||[]).map(e=>evRow(e)).join('')||'<p class="muted center">A quiet sky that day. Nothing is asked of you.</p>'}</div>`:'<p class="muted center small">Tap a day to see its events.</p>'}`;
 }else{
  const start=new Date(today+'T00:00:00'),ahead=K.events(new Date(+start-14*36e5),ahead3()).filter(e=>evDay(e)>=today),days={};
  ahead.forEach(e=>(days[evDay(e)]=days[evDay(e)]||[]).push(e));
  body=`<div class="cal-list">${[today,...Object.keys(days).filter(k=>k!==today).sort()].map(k=>`<div class="cal-day${k===today?' today':''}"><h3>${k===today?'<b>Today</b> · ':''}${ymdLong(k,{weekday:'long',day:'numeric',month:'long'})}</h3><div class="list">${(days[k]||[]).map(e=>evRow(e)).join('')||'<p class="muted center small">A quiet sky today. Nothing is asked of you.</p>'}</div></div>`).join('')}</div>`;
 }
 return `<div class="sub">${hdr('Cosmic Calendar',{back:false,right:iconBtn('refresh','data-act="calmonth" data-k=""','Back to this month')})}
 ${seg([['list','List'],['month','Month']],V.cal.view,'calview')}
 ${V.cal.view==='month'?`<div class="mnav">${mk>cur?`<button class="ibtn" data-act="calmonth" data-k="${prev}" aria-label="Previous month">${IC.back}</button>`:'<span></span>'}<h2>${ymdLong(mk+'-01',{month:'long',year:'numeric'})}</h2>${next<=ahead3().toISOString().slice(0,7)?`<button class="ibtn flip" data-act="calmonth" data-k="${next}" aria-label="Next month">${IC.back}</button>`:'<span></span>'}</div>`:'<p class="mn-note">From today, the next three months</p>'}${body}${weather}</div>`;
}
const evDay=e=>e.dateOnly?e.date.toISOString().slice(0,10):dkey(e.date);
// one event in a list: its picture, date, name and words; opened, the astronomy, the symbolism and a question
function evRow(e){
 const ref=evRef(e),open=V.evOpen===ref,i=evInfo(e),sv=isSaved('event',ref),d=e.dateOnly?e.date.toISOString().slice(0,10):dkey(e.date);
 return `<div class="evr${open?' open':''}${d===dkey()?' today':''}" id="ev-${esc(ref).replace(/[^\w-]/g,'')}"><button class="lrow" data-act="evtoggle" data-ref="${ref}" aria-expanded="${open}"><span class="lr-i">${evArt(e,true)}</span><span class="lr-t"><span class="evr-d">${d===dkey()?'<b class="evr-now">Today</b> ':''}${ymdLong(d,{day:'numeric',month:'short'})}</span><strong>${esc(e.name)}${e.sign!=null&&e.k!=='ingress'?` in ${sIdx(e.sign).name}`:''}</strong><span>${esc(evKeys(e))}</span></span><span class="lr-c">${IC.chev}</span></button>
 ${open?`<div class="acc-b"><p class="muted small">${evWhen(e)}</p><p class="kick">Astronomy</p><p>${i.fact}</p><p class="kick">Astrological symbolism</p><p>${i.sym}</p><p class="quote">“${i.ref}”</p><div class="acts"><button class="btn sm" data-act="bookev" data-ref="${ref}">${sv?'Saved to your journal':'Save to my journal'}</button>${sv?obj('pen',`data-act="jopen" data-k="bk:event:${esc(ref)}"`,'Write a reflection in your Journal'):''}</div></div>`:''}</div>`;
}
/* ----- Journal: a personal celestial diary. A dark, illustrated library for browsing what was kept (Whispers, readings,
   horoscopes, events, connections, dreams and free writing), and a clean parchment page for writing. Each reflection is
   linked to its original reading, so nothing is copied by hand; everything is kept as it is written. ----- */
const journalItems=()=>journalPages().filter(p=>p.t!=='cover'&&p.t!=='new');
// a kept item by its key; a Whisper revealed but not yet kept can still be written about
function jFind(key){
 const p=journalItems().find(x=>jKey(x)===key);if(p)return p;
 const m=/^fortune:(\d{4}-\d\d-\d\d)$/.exec(key||'');
 return m&&S.revealed[m[1]]?{t:'n',day:m[1],n:S.notes[m[1]]||'',o:cardFor(m[1])}:null;
}
// the small picture beside each item in a list
function jThumb(p,cls='th'){
 if(p.t==='n')return pic('whispers',p.o.id,cls);
 if(p.t==='r')return pic('deck',(p.r.cards[0]||{}).id,cls);
 if(p.t==='h')return med((p.b.data||{}).sign||S.sign,cls+' round');
 if(p.t==='e'){const ph=phaseSlug((p.b.data||{}).name||'');return ph?pic('moons',ph,cls+' round'):ui(/Eclipse/.test((p.b.data||{}).name||'')?'ev-eclipse':'ev-planet',cls)}
 if(p.t==='c')return ui(p.c.kind==='zodiac'?'ex-compat':p.c.kind==='resonance'?'ex-resonance':'ex-chart',cls+' round');
 if(p.t==='d')return dreamArt(p.d,cls);
 return ui('ne-free',cls);
}
const jSub=p=>p.t==='n'?keys(wKeys(p.o)):p.t==='r'?esc((SPREADS[p.r.spread]||{s:p.r.spread}).s):p.t==='h'?`${sg((p.b.data||{}).sign).name} · ${cap((p.b.data||{}).period||'')}`:p.t==='e'?esc((p.b.data||{}).when||''):p.t==='c'?KIND_LABEL[p.c.kind]:p.t==='d'?keys(((p.d.interp||{}).keywords||[]).slice(0,3)):'Free Write';
const jText=p=>p.t==='j'?p.j.body:jNote(p)||'';
const jHeading=p=>p.t==='h'?`${(HCATS.find(c=>c[0]===(p.b.data||{}).cat)||['','Overview'])[1]==='Overview'?cap((p.b.data||{}).period||'')+' Horoscope':(HCATS.find(c=>c[0]===(p.b.data||{}).cat)||['',''])[1]+' Horoscope'}`:p.t==='j'?esc(p.j.title||'Free Write'):p.t==='d'?esc((p.d.interp||{}).title||'A Dream'):jTitle(p);
function jrow(p){
 const x=jText(p),K2=JKIND[p.t];
 return `<button class="jrow" data-act="jopen" data-k="${esc(jKey(p))}"><span class="jr-i">${jThumb(p)}</span><span class="jr-t"><strong>${jHeading(p)}</strong><span class="jr-s">${jSub(p)}</span>${x?`<span class="jr-x">${esc(x)}</span>`:''}</span><span class="jr-d">${ymdLong(p.day,{day:'numeric',month:'short'})}<br>${p.day.slice(0,4)}<i class="jr-star ${K2[1]}">${p.t==='j'?IC.mark:IC.star}</i></span></button>`;
}
/* the Journal: the night under the arc of the Moon's phases runs the length of the page (its head, its middle repeated,
   its dawn at the foot); the title and the reader's name in its sky; then tonight's question, drawn from today's card when
   it has been turned and from today's horoscope otherwise, the path so far, the latest pages and the Moon calendar, each
   on night glass framed in gold */
function journalLib(){
 const q=(V.jsearch||'').trim().toLowerCase(),it=journalItems(),byNew=(a,b)=>(b.day+(b.at||''))>(a.day+(a.at||''))?1:-1;
 const items=q?it.filter(p=>plain(jHeading(p)+' '+jSub(p)+' '+jText(p)).toLowerCase().includes(q)).sort(byNew):[];
 const k=dkey(),nm=firstName(),c=todayCard(),rev=!!S.revealed[k],note=S.notes[k],m=K?K.moon(new Date()):null;
 const h=A&&K?horoscope(S.sign,'overview','daily'):null;
 const [ask,act,lab]=rev?[c.ref,`data-act="jopen" data-k="fortune:${k}"`,note?'Continue your reflection':'Write about '+esc(c.title)]
  :h?[h.reflection||'What do you want to remember about today?',`data-act="hreflect" data-ref="${S.sign}/overview/daily/${h.per.key}"`,'Write tonight’s reflection']
  :['What do you want to remember about today?','data-act="sheet" data-k="new"','Begin a new page'];
 const ch=chapterAt(),wish=chWish(ch),chDays=ch?new Set(it.filter(p=>p.day>=ch.key&&p.day<ch.endKey).map(p=>p.day)).size:0;
 const theme=THEMES.map(([l,,re])=>[l,it.reduce((n,p)=>n+((jText(p)||'').toLowerCase().match(re)||[]).length,0)]).sort((a,b)=>b[1]-a[1])[0];
 const recent=it.slice().sort(byNew).slice(0,3);
 const sec=(t,h,cls='')=>`<section class="hl-sec">${Kit.divider(t)}<div class="hl-card ${cls}">${h}</div></section>`;
 const recAll=it.slice().sort(byNew),jc=pgCur('jn');
 const bar=`<div class="jl-bar">${iconBtn('back','data-act="back"','Back')}<div class="jl-acts"><button class="ibtn" data-act="sheet" data-k="new" aria-label="New entry">${IC.plus}</button></div></div>`;
 let pg;
 const jr=(p,sub)=>{const x=plain(jText(p)||'');return `<button class="sky-c" data-act="jopen" data-k="${esc(jKey(p))}">${jThumb(p,'sky-i')}<span class="sky-x"><strong>${jHeading(p)}</strong><em>${sub||JKIND[p.t][0]+' · '+relDay(p.day)}</em>${x?`<span class="jn-x">${esc(clip(x,80))}</span>`:''}</span><span class="sky-go">${IC.chev}</span></button>`};
 if(jc==='tonight')pg=`<section class="jr-q">${m?`<p class="jp-k">${esc(m.name)} in ${sIdx(m.sign).name}${rev?' · '+esc(c.title):''}</p>`:''}<p class="jp-q">“${esc(ask)}”</p><button class="btn" ${act}>${lab}</button></section>
  <div class="sky-l sky-list or-list jn-list"><button class="sky-c" data-act="sheet" data-k="new">${ui('ne-free','sky-i')}<span class="sky-x"><strong>A new page</strong><span class="jn-x">A dream, a reading, a free thought</span></span><span class="sky-go">${IC.chev}</span></button>
  ${recAll[0]?jr(recAll[0],'Your last page · '+relDay(recAll[0].day)):''}</div>`;
 else if(jc==='pages'&&V.jcalOn)pg=`<button class="skd-m sky-cal" data-act="jcaltog">All pages as a list ${IC.chev}</button>${journalCal()}`;
 else if(jc==='pages')pg=`<div class="jn-top"><div class="field"><div class="inp">${IC.search}<input type="search" id="jq" value="${esc(V.jsearch||'')}" placeholder="Search your pages"></div></div><button class="skd-m sky-cal" data-act="jcaltog">By date ${IC.chev}</button></div>
  <div class="sky-l sky-list or-list jn-list">${(q?items:recAll).map(p=>jr(p)).join('')||`<p class="jp-empty">${q?'No page holds those words yet.':'Your first page is waiting. Whatever you write tonight will be kept here.'}</p>`}</div>`;
 else{const sc=THEMES.map(([l,ic,re])=>[l,ic,it.reduce((n,p)=>n+((jText(p)+' '+(p.t==='j'?p.j.title:'')).toLowerCase().match(re)||[]).length,0)]).filter(x=>x[2]).sort((a,b)=>b[2]-a[2]).slice(0,4),tot=sc.reduce((n,x)=>n+x[2],0);
  const cards={};it.forEach(p=>{if(p.t==='n')cards[p.o.title]=(cards[p.o.title]||0)+1;if(p.t==='r')p.r.cards.forEach(x=>cards[x.name]=(cards[x.name]||0)+1)});
  const tc=Object.entries(cards).sort((a,b)=>b[1]-a[1]).slice(0,4);
  pg=`<p class="jn-lead">${sc.length?`${nm?esc(nm)+', you':'You'} return most to <b>${sc[0][0]}</b>${sc[1]?` and <b>${sc[1][0]}</b>`:''}.`:'Write a few pages, and the themes you return to will appear here.'}</p>
  ${sc.length?`<div class="jn-bars">${sc.map(([l,ic,n])=>`<div class="jn-bar">${pic('cats',ic,'jn-bi')}<span>${l}</span><i><b style="width:${Math.round(n/sc[0][2]*100)}%"></b></i></div>`).join('')}</div>`:''}
  ${tc.length?`<section class="jn-sec">${pgl('Cards that keep finding you')}<div class="jn-pills">${tc.map(([n,v])=>`<span>${esc(n)}${v>1?` <b>${v}</b>`:''}</span>`).join('')}</div></section>`:''}
  <p class="jn-count">${it.length} ${it.length===1?'page':'pages'} kept${ch?` · ${chDays} ${chDays===1?'day':'days'} written this Moon`:''}</p>`}
 const main=`<header class="hl-top stay sk-head"><h1 class="pg-t">Journal</h1><p class="pg-s">${nm?esc(nm)+', your own sky':'Your own sky'}</p>${pgStrip('jn')}</header>
 <div class="sk-body${jc==='pages'?' pg-scroll':''}"><div class="pg-page${pgDir()}">${pg}</div></div>`;
 return `<div class="land jlib jnight skyp pg pg-jn">${bar}${main}</div>`+`${V.letter?moonLetter(V.letter):''}${sheetView()}${V.insPop?`<div class="pop" role="dialog" aria-modal="true" aria-label="Your journal insights" data-act="inspopclose"><div class="pop-box ins-box"><button class="pop-x" data-act="inspopclose" aria-label="Close">×</button><p class="cp-k">Insights &amp; Themes</p><h2 class="center">${firstName()?esc(firstName())+', your words so far':'Your words so far'}</h2>${journalInsights()}</div></div>`:''}`;
}
// the sheet that starts a new entry, from any of the things a reflection can belong to
// Signs & Synchronicities lives in a later block; what earlier code needs of it is reached through here
const SSX={};
function sheetView(){
 if(!V.sheet)return '';
 let body='',title=firstName()?`${esc(firstName())}, what will you keep?`:'New Entry';
 if(V.sheet==='new')body=[['ne-card','Today’s Card','Reflect on your Daily Whisper','card'],['ne-tarot','Tarot Reading','Write about a recent reading','reading'],['ne-horoscope','Horoscope','Journal your astrological insights','horoscope'],['ne-event','Cosmic Event','Reflect on a moon, eclipse or transit','event'],['d-dream','Dream','Record a dream and its meaning','dream'],['ne-free','Free Write','A space for anything on your mind','free']]
  .map(([i,t,s,k])=>lrow(ui(i,'th'),t,s,`data-act="ne" data-k="${k}"`)).join('');
 if(V.sheet==='event'){title='Cosmic Event';const now=new Date(),m=K.moon(now);
  body=lrow(moonPic(m,'th round'),`${m.name} in ${sIdx(m.sign).name}`,'The Moon tonight','data-act="ne" data-k="moon"')+upcoming().slice(0,8).map(e=>lrow(evArt(e,true),esc(e.name),evWhen(e),`data-act="ne" data-k="ev" data-ref="${evRef(e)}"`)).join('')}
 if(V.sheet==='reading'){title='Your Readings';
  const all=[...S.readings.map(r=>({at:r.at||r.date,h:lrow(`<span class="fan">${r.cards.slice(0,3).map(x=>pic('deck',x.id,'fan-c'+(x.rev?' rev':''))).join('')}</span>`,esc((SPREADS[r.spread]||{s:r.spread}).s),'Tarot · '+relDay(r.date),`data-act="jopen" data-k="reading:${esc(r.id)}"`)})),
   ...dreams().map(d=>({at:d.at||d.day,h:lrow(dreamArt(d),esc((d.interp||{}).title||'A Dream'),'Dream · '+relDay(d.day),`data-act="dreamopen" data-id="${esc(d.id)}"`)})),
   ...(SSX.list?SSX.list():[]).map(d=>({at:d.at||d.day,h:lrow(SSX.glyph(d.type==='number'?esc(d.number.slice(0,4)):'✧','sm'),esc(d.type==='number'?`${d.number} · ${(d.r||{}).title||''}`:(d.r||{}).title||'A Synchronicity'),(d.type==='number'?'Sacred Number · ':'Synchronicity · ')+relDay(d.day),`data-ss="open" data-id="${esc(d.id)}"`)})),
   ...(SSX.cnReads?SSX.cnReads():[]).map(d=>({at:d.at||d.day,h:lrow(SSX.glyph(d.type==='zodiac'?'☉':d.type==='insight'?'♡':'✶','sm'),esc(d.type==='zodiac'?`${sg(d.signs[0]).name} & ${sg(d.signs[1]).name}`:`${d.na} & ${d.nb}`),SSX.CN_TYPES[d.type]+' · '+relDay(d.day),`data-ss-cn="1" data-id="${esc(d.id)}"`)}))]
   .sort((a,b)=>String(b.at)>String(a.at)?1:-1).slice(0,20);
  body=all.length?all.map(x=>x.h).join(''):'<p class="muted center">Your readings will be kept here: tarot, dreams, numbers and synchronicities.</p>';
  body+=lrow(ui('t-reading','th oval'),'Draw a new reading','Shuffle the deck and choose your cards','data-go="tarot" data-t="reading"')}
 if(0){body=S.readings.slice().reverse().slice(0,10).map(r=>lrow(`<span class="fan">${r.cards.slice(0,3).map(x=>pic('deck',x.id,'fan-c'+(x.rev?' rev':''))).join('')}</span>`,esc((SPREADS[r.spread]||{s:r.spread}).s),relDay(r.date),`data-act="jopen" data-k="reading:${esc(r.id)}"`)).join('')+lrow(ui('t-reading','th oval'),'Draw a new reading','Shuffle the deck and choose your cards','data-go="tarot" data-t="reading"')}
 return `<div class="pop" role="dialog" aria-modal="true" aria-label="${title}" data-act="sheetclose"><div class="pop-box sheet-box"><button class="pop-x" data-act="sheetclose" aria-label="Close">×</button><h2 class="center">${title}</h2><div class="list">${body}</div></div></div>`;
}
/* the entry page: what the reflection belongs to above, the writing below with its prompts, and what the day is taken
   forward with. The writing is kept as it is typed, here and (after a pause) in the account. */
let JE=null;
function jeLeave(){
 if(!JE)return;const p=JE;JE=null;
 if(p.t==='j'){const j=p.j;j.title=(j.title||'').trim();j.body=(j.body||'').trim();
  if(!j.title&&!j.body){S.journal=S.journal.filter(x=>x!==j);if(JS&&JS.p===p){clearTimeout(JS.t);JS=null}save();C.deleteJournal&&C.deleteJournal(j.id);return}}
 else jSetNote(p,(jNote(p)||'').trim());
 save();if(JS&&JS.p===p)jflushSave();
}
document.addEventListener('input',e=>{
 const el=e.target;if(!JE||!el.closest||!el.closest('.entry'))return;
 if(el.id==='je'){if(JE.t==='j')JE.j.body=el.value;else{jSetNote(JE,el.value);if(JE.t==='n'&&!S.saved.some(x=>x.date===JE.day)){S.saved.push({id:JE.o.id,date:JE.day})}}}
 else if(el.id==='jet')JE.j.title=el.value;else return;
 if(el.tagName==='TEXTAREA')grow(el);
 jsaveSoon(JE);const s=$('#jsaved');if(s){s.textContent='Saving…';clearTimeout(s.t);s.t=setTimeout(()=>s.textContent='Saved',900)}
});
const grow=el=>{el.style.height='auto';el.style.height=Math.max(150,el.scrollHeight+2)+'px'};
// three things to carry forward, chosen for the entry and kept with it
const intents=key=>{const h=hash(key);return [0,1,2].map(i=>AFFIRM[(h+i*5)%AFFIRM.length])};
function entryTop(p){
 const date=`<p class="et-date">${ymdLong(p.day,{day:'numeric',month:'long',year:'numeric'})}</p>`;
 if(p.t==='n')return `<div class="et"><div class="et-art" role="button" tabindex="0" data-act="wpop" data-k="${p.day}" aria-label="Open ${esc(p.o.title)}">${Kit.tarot({art:'whispers/'+p.o.art,num:wNum(p.o),name:p.o.title})}</div><div>${date}<h2>${esc(p.o.title)}</h2><p class="et-keys">${keys(wKeys(p.o))}</p><p class="et-q">“${esc(p.o.msg)}”</p></div></div>`;
 if(p.t==='r'){const r=p.r;return `<div class="et col">${date}<h2>${esc((SPREADS[r.spread]||{n:r.spread}).n)}</h2>${r.q?`<p class="et-q">“${esc(r.q)}”</p>`:''}<div class="et-cards">${r.cards.map(x=>`<figure>${pic('deck',x.id,'et-card'+(x.rev?' rev':''))}<figcaption><strong>${esc(x.pos||'')}</strong>${esc(x.name)}${x.rev?' (reversed)':''}</figcaption></figure>`).join('')}</div></div>`}
 if(p.t==='h'){const d=p.b.data||{};return `<div class="et">${med(d.sign,'et-med')}<div>${date}<h2>${jHeading(p)}</h2><p class="et-keys">${sg(d.sign).name} · ${d.start?rangeTxt({start:d.start,end:d.end}):''}</p>${d.focus?`<p class="et-q">${esc(d.focus)}</p>`:''}</div></div><details class="acc plain"><summary><span class="lr-t"><strong>The forecast</strong></span><span class="lr-c">${IC.chev}</span></summary><div class="acc-b read">${paras(d.body)}</div></details>`}
 if(p.t==='e'){const d=p.b.data||{},ev=findEvent(p.b.ref,d.date),x=ev?evInfo(ev):null,ph=phaseSlug(d.name||'');return `<div class="et">${ph?pic('moons',ph,'et-med'):ui('ev-planet','et-med')}<div>${date}<h2>${esc(d.name||'')}</h2><p class="et-keys">${esc(d.when||'')}</p>${x?`<p class="et-q">${x.sym}</p>`:''}</div></div>${x?`<p class="muted small">${x.fact}</p>`:''}`}
 if(p.t==='c'){const c=p.c,two=connSigns(c);return `<div class="et">${two.length===2?`<span class="et-pair">${med(two[0],'et-m2')}${med(two[1],'et-m2')}</span>`:jThumb(p,'et-med')}<div>${date}<h2>${esc(connTitle(c))}</h2><p class="et-keys">${KIND_LABEL[c.kind]}</p><button class="link" data-act="openconn" data-id="${esc(c.id)}">Read the full ${c.kind==='zodiac'?'match':'comparison'}</button></div></div>`}
 if(p.t==='d'){const d=p.d,I=d.interp||{};return `<div class="et">${dreamArt(d,'et-med sq')}<div>${date}<h2>${esc(I.title||'A Dream')}</h2><p class="et-keys">${keys((I.keywords||[]).slice(0,3))}</p><button class="link" data-act="dreamopen" data-id="${esc(d.id)}">Open the full meaning</button></div></div><p class="et-q">“${esc((d.text||'').slice(0,240))}${(d.text||'').length>240?'…':''}”</p>`}
 return `<div class="et col">${date}<label class="sr-only" for="jet">Title</label><input id="jet" class="et-title" type="text" value="${esc(p.j.title)}" placeholder="Give this page a title" maxlength="80"></div>`;
}
// the writing tools: plain-text marks, so the reflection stays the plain text it has always been
const JTOOLS=[['list','Start a list','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6.5h11M9 12h11M9 17.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="4.5" cy="6.5" r="1.3" fill="currentColor"/><circle cx="4.5" cy="12" r="1.3" fill="currentColor"/><circle cx="4.5" cy="17.5" r="1.3" fill="currentColor"/></svg>'],
 ['quote','Quote','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17c0-4 1-7 5-9M14 17c0-4 1-7 5-9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'],
 ['star','A line to remember','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.6 7.4L21 12l-7.4 1.6L12 21l-1.6-7.4L3 12l7.4-1.6z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>'],
 ['time','Note the time','<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'],
 ['rule','A break between thoughts','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h7M14 12h7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M12 10l2 2-2 2-2-2z" fill="currentColor"/></svg>']];
function jfmt(k){
 const x=$('#je');if(!x)return;const v=x.value,a=x.selectionStart,b=x.selectionEnd,ls=v.lastIndexOf('\n',a-1)+1;
 let ins,pos;
 if(k==='list'){const pre=v.slice(ls,a).startsWith('• ')?'':'• ';x.value=v.slice(0,ls)+pre+v.slice(ls);pos=b+pre.length}
 else if(k==='quote'){ins=`“${v.slice(a,b)}”`;x.value=v.slice(0,a)+ins+v.slice(b);pos=a===b?a+1:a+ins.length}
 else{ins=k==='star'?(a>ls?'\n':'')+'✦ ':k==='time'?(a>ls?' ':'')+fmt({hour:'2-digit',minute:'2-digit'},new Date())+' — ':(a>0?'\n':'')+'~ ✦ ~\n';x.value=v.slice(0,a)+ins+v.slice(b);pos=a+ins.length}
 x.dispatchEvent(new Event('input',{bubbles:true}));x.focus();x.setSelectionRange(pos,pos);
}
/* the entry's own words: what kind of page it is, its title in the sky, and a line spoken to the reader about it */
function entryHead(p){
 const nm=firstName(),to=x=>nm?`${esc(nm)}, ${x}`:x.charAt(0).toUpperCase()+x.slice(1);
 if(p.t==='n')return ['Daily Whisper · Your Reflection',esc(p.o.title),to(`what is ${esc(p.o.title)} stirring in you?`)];
 if(p.t==='r')return ['Tarot · Your Reflection',esc((SPREADS[p.r.spread]||{s:'Your Reading'}).s),to('the cards have spoken. What did they say to you?')];
 if(p.t==='h'){const d=p.b.data||{};return ['Horoscope · Your Reflection',sg(d.sign).name,to(d.sign===S.sign?'how did your sky move you?':`what did ${sg(d.sign).name}’s sky show you?`)]}
 if(p.t==='e')return ['The Sky · Your Reflection',esc((p.b.data||{}).name||'A Cosmic Event'),to('the heavens are turning. What turns in you?')];
 if(p.t==='c')return ['Between Two Souls',esc(connTitle(p.c)),to('what does this bond ask of you?')];
 if(p.t==='d')return ['Your Dreams',esc((p.d.interp||{}).title||'A Dream'),to('what was the night telling you?')];
 return ['Free Write','A Page of Your Own',to('this page is yours. Write whatever the night brings.')];
}
// the night a page was written under: its Moon and the sign it stood in
const entrySky=day=>{try{const m=K.moon(new Date(day+'T21:00:00'));return `Written under ${/^(New|Full)/.test(m.name)?'the ':'a '}${esc(m.name)} in ${sIdx(m.sign).name}`}catch(e){return ymdLong(day,{day:'numeric',month:'long',year:'numeric'})}};
// the prompts, the first drawn from the page itself: the card's own question, the forecast's focus, the first card drawn,
// the dream's strongest symbol, or the question of the reader's card that day
function entryPrompts(p){
 const pr=(PROMPTS[p.t]||PROMPTS.j).slice();let own='';
 if(p.t==='n')own=p.o.ref;
 else if(p.t==='h'){const d=p.b.data||{};own=d.reflection||''}
 else if(p.t==='r'&&p.r.cards[0])own=`What is ${p.r.cards[0].name} asking of me as my ${(p.r.cards[0].pos||'first card').toLowerCase()}?`;
 else if(p.t==='d'){const sy=((p.d.interp||{}).symbols||[])[0];if(sy)own=`What does ${sy.name.toLowerCase()} mean in my waking life?`}
 else if(p.t==='j'&&S.revealed[p.day]){own=cardFor(p.day).ref}
 if(own&&!pr.includes(own))pr.splice(0,1,own);
 return pr;
}
function entryView(){
 const p=jFind(V.jkey);
 if(!p)return `<div class="sub">${hdr('Journal Entry')}${empty('This page is no longer in your journal','It may have been torn out on another device.',linkBtn('Back to the journal','tarot','journal','btn'))}</div>`;
 if(!JE||jKey(JE)!==jKey(p)){jeLeave();JE=p}
 markRead({k:'entry',p,from:{sec:'tarot',t:'entry'}});const key=jKey(p),on=(S.intent||{})[key]||[],txt=jText(p),pr=entryPrompts(p),hd=entryHead(p);
 // the page over the night with the armillary sphere, the candle and the lily, under the arc of the Moon's phases: what
 // the page belongs to and a line for the reader in its sky, the night the page was written under, then the page itself
 return `<div class="mnp jn entry enight"><div class="mn-bar">${iconBtn('back','data-act="back"','Back')}<div class="mn-r"><button class="hsave" data-act="jsavenow">Save</button>${p.t==='n'&&!S.saved.some(x=>x.date===p.day)&&!S.notes[p.day]?'':iconBtn('more','data-act="jmenu"','Entry options')}</div></div>
 <header class="en-top stay"><h1 class="cz">${hd[1]}</h1>${MN_ORN}<p class="en-k">${hd[0]}</p><p class="en-sky">${entrySky(p.day)}</p><p class="en-l">${hd[2]}</p></header>
 ${V.jmenu?`<div class="menu-pop"><button data-act="jdelentry">${IC.trash} Tear out this page</button></div>`:''}
 ${mbox(entryTop(p))}
 ${mbox(`<h2 class="sec-h">My Reflection <span id="jsaved" class="saved">${txt?'Saved':''}</span></h2>
 <div class="je-box"><div class="je-tools" role="toolbar" aria-label="Writing tools">${JTOOLS.map(([k,l,g])=>`<button type="button" data-act="jfmt" data-k="${k}" aria-label="${l}" title="${l}">${g}</button>`).join('')}</div>
 <label class="sr-only" for="je">My reflection</label><textarea id="je" class="je" placeholder="${esc(pr[0])}">${esc(txt)}</textarea></div>`)}
 ${mbox(`<div class="prompts"><p class="kick">Guiding prompts <span class="muted">(optional)</span></p>${pr.map((q,i)=>`<button class="pr" data-act="jprompt" data-i="${i}">${ui(['t-whisper','t-reading','t-journal'][i],'pr-i')}<span>${esc(q)}</span>${IC.chev}</button>`).join('')}</div>`)}
 ${V.wpop&&p.t==='n'?whisperPop(p.o,p.day):''}
 ${p.t!=='j'?mbox(`<div class="intent"><h3>Today I’m taking with me…</h3>${intents(key).map((x,i)=>`<label class="ck"><input type="checkbox" class="cb" data-act="jint" data-i="${i}" ${on[i]?'checked':''}><span>${esc(x)}</span></label>`).join('')}</div>`):''}</div>`;
}
// a small engraved Moon for a calendar day: the lit part drawn from how much of the Moon is lit that night
const phaseGlyph=d=>{const m=K.moon(d),o=((m.waxing?-1:1)*m.ill*2).toFixed(2),id='pg'+d.getTime();
 return `<svg class="jc-ph" viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"><defs><clipPath id="${id}"><circle r="1"/></clipPath></defs><g clip-path="url(#${id})"><circle r="1" fill="#EADCBC"/><circle cx="${o}" r="1" fill="#1E2740"/></g><circle r="1" fill="none" stroke="#8A6430" stroke-width=".12"/></svg>`};
/* the Journal's calendar: each month with its Moon's phases and the days that hold entries; tapping a day opens the
   readings kept and the reflections written that day beneath it, and tapping it again closes them */
function journalCal(){
 const mk=V.jcal.month||dkey().slice(0,7),[y,mo]=mk.split('-').map(Number),first=Date.UTC(y,mo-1,1),days=new Date(Date.UTC(y,mo,0)).getUTCDate(),lead=(new Date(first).getUTCDay()+6)%7;
 const prev=new Date(Date.UTC(y,mo-2,1)).toISOString().slice(0,7),next=new Date(Date.UTC(y,mo,1)).toISOString().slice(0,7);
 const byDay={};journalItems().forEach(p=>{if(p.day.slice(0,7)===mk)(byDay[p.day]=byDay[p.day]||[]).push(p)});
 const ph={};if(K)K.lunarPhases(new Date(first-DAY),new Date(Date.UTC(y,mo,1)+DAY)).forEach(e=>{const k=dkey(e.date);if(k.slice(0,7)===mk)ph[k]=e.k.replace('_','-')});
 const sel=V.jcal.day&&V.jcal.day.slice(0,7)===mk?V.jcal.day:'';
 return `<div class="jcal-w"><div class="mnav"><button class="ibtn" data-act="jcalm" data-k="${prev}" aria-label="Previous month">${IC.back}</button><h2>${ymdLong(mk+'-01',{month:'long',year:'numeric'})}</h2><button class="ibtn flip" data-act="jcalm" data-k="${next}" aria-label="Next month">${IC.back}</button></div>
 <div class="jcal" role="grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="jc-d" role="columnheader">${d}</div>`).join('')}${Array.from({length:lead},()=>'<div></div>').join('')}
 ${Array.from({length:days},(_,i)=>{const k=`${mk}-${String(i+1).padStart(2,'0')}`,n=(byDay[k]||[]).length;return `<button class="jc-c${k===dkey()?' today':''}${k===sel?' sel':''}" data-act="jcald" data-k="${k}" aria-label="${ymdLong(k)}${n?', '+n+' entr'+(n>1?'ies':'y'):''}${ph[k]?', '+ph[k].replace('-',' '):''}"><span>${i+1}</span>${ph[k]?pic('moons',ph[k],'jc-moon'):K?phaseGlyph(new Date(Date.UTC(y,mo-1,i+1,20))):'<i class="jc-sp"></i>'}${n?`<i class="jc-dot">${'•'.repeat(Math.min(3,n))}</i>`:''}</button>`}).join('')}</div>
 ${sel?`<div class="jc-drop"><h3 class="sec-h">${ymdLong(sel,{weekday:'long',day:'numeric',month:'long'})}</h3><div class="list">${(byDay[sel]||[]).map(p=>lrow(jThumb(p),jHeading(p),`${JKIND[p.t][0]}${p.at?' • '+fmt({hour:'2-digit',minute:'2-digit'},new Date(p.at)):''}`,`data-act="jopen" data-k="${esc(jKey(p))}"`)).join('')||'<p class="muted center">Nothing kept or written on this day.</p>'}</div></div>`:''}</div>`;
}
/* insights: how much has been written, and the themes the reflections keep returning to */
const THEMES=[['Self Love','reflections',/\b(myself|self|worth|enough|confiden|proud|kind to me)/g],['Career','career',/\b(work|job|career|boss|project|office|business|colleague)/g],['Relationships','love',/\b(love|partner|relationship|friend|together|heart|him|her)\b/g],['Growth','lifepath',/\b(grow|learn|change|progress|better|heal|journey)/g],['Abundance','finance',/\b(money|abundan|grateful|gratitude|prosper|wealth)/g],['Wellbeing','health',/\b(rest|sleep|tired|body|health|calm|anxi|stress|energy)/g],['Family','family',/\b(family|mother|mum|father|dad|sister|brother|home|child)/g]];
function journalInsights(){
 const it=journalItems(),n=t=>it.filter(p=>p.t===t).length,months=new Set(it.map(p=>p.day.slice(0,7))).size;
 const score=THEMES.map(([l,ic,re])=>{let c=0;it.forEach(p=>{c+=((jText(p)+' '+(p.t==='j'?p.j.title:'')).toLowerCase().match(re)||[]).length;
  const cat=p.t==='h'?(p.b.data||{}).cat:'';if((l==='Relationships'&&(cat==='love'||p.t==='c'))||(l==='Career'&&cat==='career')||(l==='Abundance'&&cat==='money')||(l==='Wellbeing'&&cat==='health')||(l==='Family'&&cat==='family'))c+=2});return [l,ic,c]}).filter(x=>x[2]).sort((a,b)=>b[2]-a[2]).slice(0,5);
 const tot=score.reduce((s,x)=>s+x[2],0);
 let body;
 if(V.insTab==='themes'){
  const cards={};it.forEach(p=>{if(p.t==='n')cards[p.o.title]=(cards[p.o.title]||0)+1;if(p.t==='r')p.r.cards.forEach(c=>cards[c.name]=(cards[c.name]||0)+1)});
  const signs={};it.forEach(p=>{if(p.t==='h'){const s=(p.b.data||{}).sign;signs[s]=(signs[s]||0)+1}});
  const sym={};(S.dreams||[]).forEach(d=>((d.interp||{}).symbols||[]).forEach(x=>sym[x.name]=(sym[x.name]||0)+1));
  const top=(o,f)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,6).map(f).join('')||'<p class="muted">Nothing yet.</p>';
  body=`<h3 class="sec-h">Cards that keep finding you</h3><div class="pills">${top(cards,([k,v])=>`<span class="pill">${esc(k)} <b>${v}</b></span>`)}</div>
  <h3 class="sec-h">Signs you have read</h3><div class="pills">${top(signs,([k,v])=>`<span class="pill">${sg(k).name} <b>${v}</b></span>`)}</div>
  <h3 class="sec-h">Symbols in your dreams</h3><div class="pills">${top(sym,([k,v])=>`<span class="pill">${esc(k)} <b>${v}</b></span>`)}</div>`;
 }else body=`<div class="stats">${[[it.length,'Entries'],[months,'Months'],[n('r'),'Tarot Readings'],[n('h'),'Horoscope Notes'],[n('e'),'Cosmic Events'],[n('j'),'Free Writes']].map(([v,l])=>`<div class="stat"><strong>${v}</strong><span>${l}</span></div>`).join('')}</div>
  <h3 class="sec-h">Your most explored themes</h3>${score.length?`<div class="bars">${score.map(([l,ic,c],i)=>`<div class="tbar">${pic('cats',ic,'tb-i')}<span>${l}</span><i class="tb${i}"><b style="width:${Math.round(c/tot*100)}%"></b></i><em>${Math.round(c/tot*100)}%</em></div>`).join('')}</div>`:'<p class="muted">Write a few reflections and the themes you return to will appear here.</p>'}`;
 return `${seg([['insights','Insights'],['themes','Themes']],V.insTab,'ins')}${body}`;
}
/* ----- Dream Interpretation: describe a dream by text or voice, and its symbols, feelings and possible themes are read
   back, with Kassandra's personal reading when signed in and the dream dictionary otherwise. Every dream is kept in the
   Dream Journal (and the Journal), where recurring symbols become Dream Patterns. Dream meanings are symbolic and
   subjective, never predictions. ----- */
// [id, name, keywords, meaning, picture (ui: mockup art, w: a Whisper's painting), words that bring it to mind, a question]
const DREAMS=[
 ['water','Water',['Emotions','Depth','Flow'],'Water mirrors your emotional life. Calm, clear water suggests peace with what you feel; rough or murky water can point to feelings asking for attention.','ui:ds-water',/\b(water|lake|swim|swimming|pool|flood|wave)/,'What feeling has been rising in me lately?'],
 ['flying','Flying',['Freedom','Perspective','Ambition'],'Flying often speaks of freedom and of rising above a situation. Effortless flight can reflect confidence; struggling to stay up may echo a fear of losing control.','ui:ds-flying',/\b(fly|flying|flew|float|floating|soar)/,'Where in my life do I long for more freedom?'],
 ['snake','The Snake',['Transformation','Healing','Fear'],'The snake sheds its skin, so it is an ancient symbol of transformation and healing. It can also stand for a hidden worry or someone you are unsure of.','ui:ds-snake',/\b(snake|serpent|viper|python)/,'What am I ready to shed?'],
 ['house','The House',['Inner self','Security','Memory'],'A house is often read as the self: its rooms are parts of your life and mind. Discovering a new room can mean finding a new side of yourself.','ui:ds-house',/\b(house|home|room|rooms|attic|basement|cellar)/,'Which part of myself have I not visited in a while?'],
 ['death','Death',['Endings','New beginnings','Change'],'Death in dreams rarely means a literal death. It usually marks an ending: a chapter, a habit or an identity closing so something new can begin.','ui:ds-death',/\b(death|dead|die|died|dying|funeral|grave)/,'What is ending in my life, and what might begin?'],
 ['falling','Falling',['Insecurity','Letting go','Surrender'],'Falling can reflect a sense of losing your footing, at work, in love or in yourself. It can also be an invitation to let go and trust.','w:the-feather',/\b(fall|falling|fell|drop)/,'Where do I feel unsupported right now?'],
 ['teeth','Teeth',['Confidence','Image','Change'],'Teeth falling out is one of the most common dreams. It is often linked to worries about how we appear, about speaking up, or about a change we cannot control.','w:the-mirror',/\b(teeth|tooth)/,'Is there something I am afraid to say?'],
 ['chase','Being Chased',['Avoidance','Pressure','Fear'],'Being chased usually points to something you are avoiding: a feeling, a decision or a conversation. Turning to face the pursuer often changes the dream.','w:wild-geese',/\b(chase|chased|chasing|run|running|ran|escape)/,'What have I been running from?'],
 ['owl','The Owl',['Wisdom','Intuition','Transformation'],'The owl in your dream is a powerful symbol of intuition and hidden knowledge. It suggests you are entering a period of deeper awareness and inner guidance, seeing beyond the surface.','ui:owl',/\b(owl|owls)/,'What does my intuition already know?'],
 ['moon','The Moon',['Cycles','Intuition','The unconscious'],'The Moon speaks of cycles, intuition and the parts of us that live in shadow. A bright moon can mean clarity arriving; a hidden one, a mystery still unfolding.','w:quiet-moon',/\b(moon|moonlight)/,'Which cycle in my life is turning?'],
 ['sun','The Sun',['Vitality','Clarity','Joy'],'The Sun brings warmth, clarity and life force. Dreaming of sunlight often reflects optimism, success or something coming into the light.','w:rising-sun',/\b(sun|sunlight|sunrise|sunset|dawn)/,'What is coming into the light for me?'],
 ['fire','Fire',['Passion','Transformation','Anger'],'Fire can be passion and creativity, or anger and destruction. A warm hearth comforts; a blaze out of control may mirror strong feelings.','w:sacred-flame',/\b(fire|flame|flames|burn|burning|candle)/,'What is burning brightly in me?'],
 ['forest','The Forest',['Exploration','The unknown','Growth'],'A forest is the unknown, the wild and the unconscious. Being lost in it may mirror uncertainty; walking through it calmly suggests trust in your own path.','w:old-tree',/\b(forest|woods|trees|tree|jungle)/,'Where am I exploring new ground?'],
 ['door','A Door',['Opportunity','Transition','Choice'],'Doors are thresholds. An open door invites a new opportunity; a locked one may reflect a barrier, or something you are not yet ready to face.','w:open-door',/\b(door|doors|gate|doorway)/,'Which door is opening for me?'],
 ['key','A Key',['Answers','Access','Secrets'],'A key suggests the solution to a problem, access to something hidden, or a part of yourself you are ready to unlock.','w:golden-key',/\b(key|keys|lock|locked|unlock)/,'What am I ready to unlock?'],
 ['baby','A Baby',['New beginnings','Potential','Vulnerability'],'A baby often represents something new and fragile: a project, an idea or a tender part of yourself that needs care.','w:the-nest',/\b(baby|babies|infant|pregnant|newborn)/,'What new thing in my life needs gentle care?'],
 ['wedding','A Wedding',['Union','Commitment','Integration'],'A wedding can speak of commitment, a new partnership or two sides of yourself coming together.','w:the-chalice',/\b(wedding|marry|married|bride|groom)/,'What am I ready to commit to?'],
 ['exam','An Exam',['Self-judgement','Preparation','Pressure'],'Dreams of exams or being unprepared often reflect feeling tested or judged, even long after school.','w:the-hourglass',/\b(exam|test|school|class|teacher|late)/,'Where do I feel I am being tested?'],
 ['lost','Being Lost',['Uncertainty','Searching','Direction'],'Being lost reflects uncertainty about direction or identity. It can be a sign you are between chapters, still finding your way.','w:the-labyrinth',/\b(lost|maze|wander|wandering|can't find|cannot find)/,'What am I searching for?'],
 ['bridge','A Bridge',['Transition','Connection','Crossing'],'A bridge links two places: a transition, a decision or a reconciliation. How sturdy it feels may echo your confidence in the change.','w:the-bridge',/\b(bridge|crossing|cross)/,'What am I crossing towards?'],
 ['mountain','A Mountain',['Challenge','Achievement','Perspective'],'A mountain is a goal or an obstacle. Climbing it speaks of effort and ambition; standing on top, of a new perspective.','w:the-mountain',/\b(mountain|hill|climb|climbing|peak)/,'What summit am I working towards?'],
 ['mirror','A Mirror',['Self-image','Truth','Reflection'],'A mirror asks how you see yourself. A clear reflection suggests self-acceptance; a distorted one may point to doubts about your image.','w:the-mirror',/\b(mirror|reflection)/,'How do I truly see myself?'],
 ['stairs','Stairs',['Progress','Ascent','Transition'],'Climbing stairs often reflects progress and growth; going down may mean exploring deeper feelings or the past.','w:stepping-stones',/\b(stairs|staircase|steps|ladder)/,'Which step am I ready to take next?'],
 ['money','Money',['Worth','Security','Value'],'Money in dreams often stands for self-worth, energy and what you value, more than actual finances.','w:quiet-harvest',/\b(money|coins|cash|gold|treasure|rich)/,'What do I truly value?'],
 ['horse','A Horse',['Strength','Freedom','Drive'],'A horse carries power, freedom and drive. Riding it with ease suggests you are in tune with your own energy.','w:wild-horse',/\b(horse|horses|riding|gallop)/,'Where is my strength carrying me?'],
 ['spider','A Spider',['Creativity','Patience','Entanglement'],'The spider is a weaver: creativity and patience, or feeling caught in a web of circumstances.','w:the-web',/\b(spider|web|cobweb)/,'What am I weaving in my life?'],
 ['bird','A Bird',['Messages','Hope','Freedom'],'Birds bring messages and hope. Singing birds often signal joy; a bird in a cage may echo feeling restricted.','w:nightingale',/\b(bird|birds|wings|feather|feathers)/,'What message am I waiting to hear?'],
 ['cat','A Cat',['Independence','Intuition','Mystery'],'Cats are independent, intuitive and a little mysterious. A cat may point to your own instincts or to a part of you that needs freedom.','w:watchful-eye',/\b(cat|cats|kitten)/,'Where am I trusting my instincts?'],
 ['dog','A Dog',['Loyalty','Friendship','Protection'],'A dog often represents loyalty, friendship and protection, or your own faithful, instinctive nature.','w:the-fox',/\b(dog|dogs|puppy|wolf)/,'Who has been loyal to me, and to whom am I loyal?'],
 ['storm','A Storm',['Turmoil','Release','Change'],'A storm reflects emotional turmoil or sudden change. After the storm, the air is often clearer.','w:the-wind',/\b(storm|thunder|lightning|wind|tornado|hurricane)/,'What is stirring beneath the surface?'],
 ['journey','A Journey',['Life path','Change','Discovery'],'Travelling by car, train or ship mirrors the course of your life: who is driving, and where you are heading.','w:distant-ship',/\b(car|train|bus|ship|boat|plane|travel|journey|road)/,'Who is steering my journey?'],
 ['garden','A Garden',['Growth','Care','Abundance'],'A garden shows what you are cultivating. Flowers and green growth suggest flourishing; weeds may mean something needs tending.','w:hidden-garden',/\b(garden|flower|flowers|bloom|roses)/,'What am I growing?'],
 ['ocean','The Ocean',['The unconscious','Vastness','Emotion'],'The ocean is the vast unconscious. Its calm or wildness may mirror your inner weather, and its depths what you have yet to explore.','w:the-whale',/\b(ocean|sea|beach|shore|tide)/,'What lies in my depths?']
].map(a=>({id:a[0],name:a[1],keys:a[2],m:a[3],art:a[4],re:a[5],q:a[6]}));
const dsym=id=>DREAMS.find(x=>x.id===id);
const MOODS=[['peaceful','Peaceful'],['joyful','Joyful'],['curious','Curious'],['confused','Confused'],['anxious','Anxious'],['afraid','Afraid'],['sad','Sad'],['loving','Loving']];
const MOOD_LINE={peaceful:'You felt at peace in the dream, which often suggests these themes are settling well within you.',joyful:'The joy you felt suggests this change may be welcome, even exciting.',curious:'Your curiosity suggests you are ready to explore what this dream is showing you.',confused:'Feeling confused may mirror a situation in waking life that has not yet come into focus.',anxious:'The anxiety you felt may echo a worry you are carrying; naming it gently can loosen its hold.',afraid:'Fear in a dream is often the mind rehearsing a challenge; it rarely predicts one.',sad:'Sadness in a dream can be a release, a way of letting feelings move through you.',loving:'The love you felt points to connection and warmth at the heart of this dream.'};
const artOf=(spec,cls)=>{const [k,id]=(spec||'').split(':');return k==='ui'?ui(id,cls):k==='w'?pic('whispers',id,cls):''};
const dreamArt=(d,cls='th')=>{const I=(d&&d.interp)||{},s=dsym(I.art)||dsym((d&&d.symbols||[])[0]);return (s&&artOf(s.art,cls))||ui('d-dream',cls)};
const dreams=()=>S.bookmarks.filter(b=>b.kind==='dream').map(b=>b.data).sort((a,b)=>(b.at||'')>(a.at||'')?1:-1);
// the dictionary's reading: the symbols chosen or named in the dream, the feeling it carried, and a question to sit with
function localInterpret(D){
 const found=[...new Set([...D.symbols,...DREAMS.filter(s=>s.re.test(D.text.toLowerCase())).map(s=>s.id)])].map(dsym).filter(Boolean),main=found[0];
 const meaning=[main?main.m:'Your dream speaks in images that are personal to you. Notice which moment, person or place stays with you most: that is often where its meaning lives.',
  found.length>1?`Alongside it: ${found.slice(1,4).map(s=>`${s.name.replace(/^(The|A|An) /,'').toLowerCase()} (${s.keys[0].toLowerCase()})`).join(', ')}. Together they may point to ${found.slice(0,3).map(s=>s.keys[0].toLowerCase()).join(', ')} moving through your life right now.`:'',
  D.mood?MOOD_LINE[D.mood]:''].filter(Boolean).join('\n');
 return {title:main?main.name:'Your Dream',keywords:main?main.keys:['Mystery','Reflection','Intuition'],meaning,symbols:found.slice(1,5).map(s=>({id:s.id,name:s.name.replace(/^(The|A|An) /,''),meaning:s.keys[0]})),reflection:main?main.q:PROMPTS.d[2],art:main?main.id:'',ai:false};
}
function saveDream(D,I){
 const id=uuid(),now=new Date().toISOString(),b={id,kind:'dream',ref:id,data:{id,day:dkey(),at:now,text:D.text,mood:D.mood,symbols:D.symbols.slice(),interp:I,note:''},at:now};
 S.bookmarks.push(b);save();C.saveBookmark&&C.saveBookmark(b).then(()=>{b.sy=true;save()},()=>{});return id;
}
async function interpretDream(){
 const D=V.dream;D.text=(($('#dt')||{}).value||D.text).trim();
 if(D.text.length<8)return toast('Describe your dream in a few more words first.');
 D.busy=true;render();let I=null;
 if(C.user&&C.dream){try{const r=await C.dream({text:D.text,mood:D.mood,symbols:D.symbols.map(id=>dsym(id).name),dictionary:DREAMS.map(s=>s.id)});if(r&&r.meaning)I=Object.assign({ai:true},r)}catch(e){toast(e.message||'Kassandra could not read this dream, so the dictionary did.')}}
 if(!I)I=localInterpret(D);
 if(I.symbols)I.symbols=I.symbols.map(s=>Object.assign({},s,{id:s.id||(DREAMS.find(x=>x.name.replace(/^(The|A|An) /,'').toLowerCase()===String(s.name||'').toLowerCase())||{}).id||''}));
 const id=saveDream(D,I);V.dream={text:'',mood:'',symbols:[],busy:false};V.dreamId=id;go('discover','dream');
}
function dreamPatterns(list){
 if(list.length<3)return '';
 const sym={},mood={};list.forEach(d=>{const I=d.interp||{};[I.art,...(I.symbols||[]).map(s=>s.id)].filter(Boolean).forEach(x=>sym[x]=(sym[x]||0)+1);if(d.mood)mood[d.mood]=(mood[d.mood]||0)+1});
 const top=Object.entries(sym).sort((a,b)=>b[1]-a[1]).slice(0,5),mx=top.length?top[0][1]:1;
 return panel(`<p class="kick">Dream patterns</p><h3>What keeps returning</h3>${top.length?`<div class="bars">${top.map(([k,v],i)=>`<div class="tbar">${artOf((dsym(k)||{}).art,'tb-i round')}<span>${esc((dsym(k)||{name:k}).name)}</span><i class="tb${i}"><b style="width:${Math.round(v/mx*100)}%"></b></i><em>${v}×</em></div>`).join('')}</div>`:''}${Object.keys(mood).length?`<p class="muted small">Feelings you wake with: ${Object.entries(mood).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${MOODS.find(m=>m[0]===k)[1].toLowerCase()} (${v})`).join(', ')}.</p>`:''}`,'ornate');
}
function dreamsView(){
 const list=dreams(),nm=firstName();
 return `<div class="land drm skyp pg pg-dr">${iconBtn('back','data-act="back"','Back')}<header class="hl-top stay sk-head"><h1 class="pg-t">Dreams</h1><p class="pg-s">${nm?esc(nm)+', what':'What'} the night left with you</p></header>
 <div class="sk-body">
 <section class="dr-in"><p class="dr-lead">Tell Kassandra what you saw, and uncover what it is asking you to notice.</p><div class="or-two"><button class="btn" data-go="discover" data-t="new-dream">Bring a dream</button><button class="btn ghost" data-go="discover" data-t="dream-journal">Dream journal</button></div></section>
 <section>${pgl('Common symbols')}<div class="symrow">${['water','flying','snake','house','death'].map(id=>{const x=dsym(id);return `<button data-act="libgo" data-tab="dreams" data-q="${esc(x.name.replace(/^(The|A|An) /,''))}">${artOf(x.art,'sym-i')}<strong>${x.name.replace(/^The /,'')}</strong></button>`}).join('')}</div></section>
 ${list.length?`<section>${pgl('Your latest dream')}<div class="list">${list.slice(0,1).map(dreamRow).join('')}</div></section>`:`<p class="dr-note">Dream meanings are symbolic and personal, offered for reflection rather than prediction.</p>`}
 </div></div>`;
}
const dreamRow=d=>lrow(dreamArt(d),esc((d.interp||{}).title||'A Dream'),esc((d.text||'').slice(0,70))+((d.text||'').length>70?'…':''),`data-act="dreamopen" data-id="${esc(d.id)}"`,`<span class="lr-m">${relDay(d.day)}${d.note?' • Reflection added':''}</span>`);
function newDreamView(){
 const D=V.dream,rec=KS.state!=='idle'&&KS.target==='dream';
 if(D.busy)return `<div class="sub">${hdr('New Dream')}<div class="reading-anim">${ui('owl','ra-owl')}<p class="quote center">Kassandra is reading your dream…</p></div></div>`;
 return `<div class="sub">${hdr('New Dream')}
 <div class="field"><label for="dt" class="kick">Describe your dream</label><textarea id="dt" maxlength="1000" placeholder="Write your dream in as much detail as you can. Include people, places, emotions and anything that stood out, even if it feels strange.">${esc(D.text)}</textarea><span class="count" id="dtc">${D.text.length}/1000</span></div>
 <div class="list">
 <button class="lrow" data-act="dmic" ${C.user?'':'aria-disabled="true"'}><span class="lr-i ico">${IC.mic}</span><span class="lr-t"><strong>${rec?(KS.state==='listening'?'Listening… tap to finish':'Hearing your dream…'):'Add a voice note'}</strong><span>${C.user?'Speak your dream and it is written down for you':'Sign in to describe your dream by voice'}</span></span><span class="lr-c">${IC.chev}</span></button>
 ${acc(`<span class="ico">☺</span>`,'How did you feel in the dream?',D.mood?MOODS.find(m=>m[0]===D.mood)[1]:'Optional',`<div class="fchips">${MOODS.map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${D.mood===k}" data-act="dmood" data-k="${k}">${l}</button>`).join('')}</div>`,!!D.mood)}
 ${acc(`<span class="ico">${IC.star}</span>`,'Select dream symbols',D.symbols.length?D.symbols.map(id=>dsym(id).name.replace(/^(The|A|An) /,'')).join(', '):'Optional',`<div class="fchips">${DREAMS.map(s=>`<button class="fchip" role="checkbox" aria-checked="${D.symbols.includes(s.id)}" data-act="dsym" data-k="${s.id}">${s.name.replace(/^(The|A|An) /,'')}</button>`).join('')}</div>`,D.symbols.length>0)}
 </div>
 <button class="btn" data-act="dgo">What does it mean? →</button>
 <p class="muted small center">${C.user?'Kassandra reads your dream with AI; only what you write here is sent.':'Without signing in, your dream is read with Kosmia’s dream dictionary. Sign in for Kassandra’s personal reading.'} Your dream is kept privately in your Dream Journal.</p></div>`;
}
function dreamView(){
 const d=dreams().find(x=>x.id===V.dreamId);
 if(!d)return `<div class="sub">${hdr('Your Dream Meaning')}${empty('This dream is no longer in your journal','It may have been removed on another device.',linkBtn('Dream Journal','discover','dream-journal','btn'))}</div>`;
 const I=d.interp||{};markRead({k:'dream',d,from:{sec:'discover',t:'dream'}});
 return `<div class="sub">${hdr('Your Dream Meaning',{sub:ymdLong(d.day,{day:'numeric',month:'long',year:'numeric'})})}
 <div class="dm-art">${dreamArt(d,'dm-img')}</div>${mbox(`<h2 class="center dm-t">${esc(I.title||'Your Dream')}</h2><p class="keys">${keys((I.keywords||[]).slice(0,3))}</p>
 <div class="read">${paras(I.meaning)}</div>
 ${(I.symbols||[]).length?`${orn('Other Symbols in Your Dream')}<div class="symrow">${I.symbols.map(s=>{const x=dsym(s.id);return `<button data-act="libgo" data-tab="dreams" data-q="${esc(s.name)}">${x?artOf(x.art,'sym-i sq'):ui('d-dream','sym-i sq')}<strong>${esc(s.name)}</strong><span>${esc(s.meaning||'')}</span></button>`}).join('')}</div>`:''}`)}
 ${panel(`<p class="kick">A question to sit with</p><p class="quote">“${esc(I.reflection||PROMPTS.d[2])}”</p>${obj('pen',`data-act="jopen" data-k="bk:dream:${esc(d.id)}"`,d.note?'Keep writing in your Journal':'Write a reflection in your Journal')}`,'ornate')}
 <details class="acc plain"><summary><span class="lr-t"><strong>Your dream, as you wrote it</strong></span><span class="lr-c">${IC.chev}</span></summary><div class="acc-b"><p class="pre">${esc(d.text)}</p></div></details>
 <p class="muted small center">${I.ai?'Read by Kassandra with AI. ':'Read with Kosmia’s dream dictionary. '}Dream meanings are symbolic and subjective, offered for reflection rather than as scientifically established predictions.</p>
 <div class="acts">${obj('kas',`data-act="kasask" data-q="I dreamt: ${esc((d.text||'').slice(0,300))} What might it mean?"`,'Ask Kassandra about it')}<button class="btn ghost" data-go="discover" data-t="new-dream">Bring another dream</button></div></div>`;
}
function dreamJournalView(){
 const list=dreams();
 return `<div class="sub">${hdr('Dream Journal',{sub:'Your dreams and what they revealed'})}${dreamPatterns(list)}<div class="list">${list.map(dreamRow).join('')||'<p class="muted center">No dreams recorded yet.</p>'}</div><button class="btn" data-go="discover" data-t="new-dream">Tell me a dream</button></div>`;
}
/* ----- The Mystical Library: guides, the signs, planets, houses, the tarot, the Moon's phases and the dream dictionary ----- */
const GUIDES=[
 ['chart','Understanding Your Birth Chart','A beginner’s guide','ex-chart',['A birth chart is a map of the sky at the moment you were born, seen from the place you were born. It shows where the Sun, Moon and planets stood along the zodiac, and which part of the sky was rising on the eastern horizon.','Each planet describes a kind of energy (the Moon your feelings, Venus how you love), its sign describes the style of that energy, and its house the area of life where it tends to play out. The angles between planets, called aspects, show how those energies speak to one another.','Start with your big three: your Sun (your core self), your Moon (your emotional needs) and your Rising sign (the way you meet the world). Then read one planet at a time, asking how it feels in your own life.']],
 ['moon','The Meaning of the Moon Phases','And how they affect you','m:full-moon',['The Moon takes about 29.5 days to move through its cycle of phases, from dark New Moon to bright Full Moon and back. Astrologers and many traditions have long read this rhythm as a guide to the pace of life.','The New Moon is for beginnings and intentions; the waxing Moon for building and acting; the Full Moon for culmination, clarity and gratitude; and the waning Moon for release, rest and clearing space.','You do not need to plan your life around the Moon. Simply noticing its phase can be a gentle way to check in with yourself: what am I starting, and what am I ready to let go?']],
 ['retro','Planetary Retrogrades','What they mean and how to work with them','ev-planet',['A planet is retrograde when, seen from Earth, it appears to move backwards against the stars. It is an optical effect of Earth overtaking it (or it overtaking Earth) in orbit; the planet never actually reverses.','Traditionally a retrograde is a time to review the themes of that planet rather than launch new ones: Mercury for communication and plans, Venus for love and values, Mars for drive and action.','Use a retrograde to revisit, revise and reconnect. Many people find these periods are good for finishing what was left undone.']],
 ['elements','The Elements in Astrology','Fire, Earth, Air and Water','ex-name',['The twelve signs are grouped into four elements. Fire (Aries, Leo, Sagittarius) is enthusiasm and spirit; Earth (Taurus, Virgo, Capricorn) is the practical and the sensual; Air (Gemini, Libra, Aquarius) is thought and connection; Water (Cancer, Scorpio, Pisces) is feeling and intuition.','Signs of the same element usually understand each other easily. Fire and Air feed one another, as do Earth and Water.','Looking at which elements are strong or missing in your chart can show what comes naturally to you and what you may need to cultivate.']],
 ['houses','The 12 Houses Explained','And what they reveal about your life','ex-lifepath',['The houses divide the sky into twelve areas of life, starting from the rising sign. The first house is the self and the body; the fourth home and roots; the seventh partnership; the tenth career and calling.','A planet in a house brings its energy into that area. An empty house is not empty of meaning: its sign and its ruling planet still describe how you meet that part of life.','Houses need your birth time and place to be calculated, because they depend on the rotation of the Earth through the day.']],
 ['rising','Your Rising Sign','First impressions and outer self','ex-compat',['Your rising sign, or Ascendant, is the sign that was rising on the eastern horizon at your birth. It changes about every two hours, so it needs an accurate birth time.','It describes the way you meet the world, the first impression you give and the lens through which you begin things. Many people find their rising sign describes them better at first meeting than their Sun sign.','Read your Sun, Moon and Rising together: the Sun is who you are becoming, the Moon what you need, and the Rising how you show up.']],
 ['eclipses','Eclipses and Their Influence','Periods of change and transformation','ev-eclipse',['An eclipse happens when the Sun, Moon and Earth line up. A solar eclipse falls at a New Moon, when the Moon passes in front of the Sun; a lunar eclipse at a Full Moon, when the Earth’s shadow falls on the Moon.','Traditionally, eclipses mark turning points: solar eclipses open new chapters, lunar eclipses bring endings or revelations to light. They come in seasons about every six months.','Eclipse seasons can feel intense. Go gently, notice what is coming to an end or a beginning, and avoid forcing outcomes.']]
];
const LIB_TABS=[['guides','Guides'],['signs','Zodiac Signs'],['planets','Planets'],['houses','Houses'],['tarot','Tarot'],['moon','Moon'],['dreams','Dreams']];
function libraryView(){
 const t=V.lib.tab,q=V.lib.q.trim().toLowerCase(),hit=s=>!q||plain(s).toLowerCase().includes(q),thumb=s=>s.startsWith('m:')?pic('moons',s.slice(2),'th round'):ui(s,'th');
 let rows='';
 if(t==='guides')rows=GUIDES.filter(g=>hit(g[1]+g[2]+g[4].join(' '))).map(g=>acc(thumb(g[3]),g[1],g[2],`<div class="read">${g[4].map(p=>`<p>${p}</p>`).join('')}</div>`)).join('');
 if(t==='signs')rows=SIGNS.filter(s=>hit(s.name+SIGN_KEYS[s.id].join(' '))).map(s=>acc(med(s.id,'th round'),s.name,`${s.dates} · ${s.el} · ${s.mod}`,`<p class="keys">${keys(SIGN_KEYS[s.id])}</p><p>${SIGN_BLURB[s.id]}</p><p>Ruled by ${s.ruler}, ${s.name} meets the world ${STYLE[s.id]}.</p><button class="link" data-act="tohoroscope" data-sign="${s.id}">Read ${s.name}’s horoscope</button>`)).join('');
 if(t==='planets')rows=Object.entries(PM).filter(([n,m])=>hit(n+m)).map(([n,m])=>acc(`<span class="glyph pgl">${(K&&K.positions?(K.positions(new Date()).find(p=>p.n===n)||{}).g:'')||'✦'}</span>`,n,cap(m),`<p>${n==='Ascendant'?'The Ascendant is the degree of the zodiac rising in the east at birth: ':n==='Midheaven'?'The Midheaven is the highest point of the zodiac at birth: ':`${n} speaks of `}${m}. In a birth chart, its sign describes the style of that energy and its house where in life it tends to show.</p>`)).join('');
 if(t==='houses')rows=HOUSE.filter(h=>hit(h)).map(h=>{const i=HOUSE.indexOf(h);return acc(`<span class="hn">${i+1}</span>`,`The ${ORD(i+1)} House`,cap(h.split(',')[0]),`<p>The ${ORD(i+1)} house is the life area of ${h}. The sign on it and any planets inside it describe how you meet this part of life.</p>`)}).join('');
 if(t==='tarot')rows=DECK.filter(c=>hit(c.name+c.up+c.rev)).map(c=>acc(pic('deck',c.id,'th card'),c.name,c.arcana==='major'?`Major Arcana · ${c.num}`:`Minor Arcana · ${cap(c.suit||'')}`,`<p class="kick">Upright · ${c.up}</p><p>${c.upm}</p><p class="kick">Reversed · ${c.rev}</p><p>${c.revm}</p><p class="kick">In love</p><p>${c.love}</p><p class="kick">In work</p><p>${c.work}</p>`)).join('');
 if(t==='moon')rows=Object.entries(RITUAL).filter(([n,r])=>hit(n+r+(MOON_LINE[n]||''))).map(([n,r])=>acc(pic('moons',n.toLowerCase().replace(/ /g,'-'),'th round'),n,(MOON_LINE[n]||'').split('.')[0],`<p>${MOON_LINE[n]||''}</p><p class="kick">An optional ritual</p><p>${r}</p>`)).join('');
 if(t==='dreams')rows=DREAMS.filter(s=>hit(s.name+s.keys.join(' ')+s.m)).map(s=>acc(artOf(s.art,'th round'),s.name,s.keys.join(' • '),`<p>${s.m}</p><p class="quote">“${s.q}”</p>`,!!q&&q.length>2)).join('');
 return `<div class="sub">${hdr('Astrology Library',{sub:'Zodiac, planets, tarot and dreams'})}
 <div class="fscroll">${chips('Library',LIB_TABS,t,'libtab')}</div>
 <div class="field"><label class="sr-only" for="libq">Search the library</label><div class="inp">${IC.search}<input type="search" id="libq" value="${esc(V.lib.q)}" placeholder="Search the library"></div></div>
 <div class="list">${rows||'<p class="muted center">Nothing found.</p>'}</div></div>`;
}

/* ---------- Kassandra: Kosmia's fortune teller, by voice or by text, with her past conversations kept ---------- */
const KS={msgs:(S.kcur||[]).slice(),busy:false,rec:null,state:'idle',chunks:[],target:'kas'};
function kasPrompts(){
 return KS.msgs.length?['What should I focus on this week?','Tell me more','What question should I sit with?']:['What do I need to know today?','Ask about love','What opportunities are coming?'];
}
// what the reader was last looking at, in a sentence or two, so Kassandra can answer about it
function kasContext(){
 const ctx={section:'Kassandra',view:'Conversation'},T=V.tarot,k=dkey(),L=V.kasFrom||{};
 if(L.sec)Object.assign(ctx,{section:(SECTIONS[L.sec]||{label:L.sec}).label,view:tabLabel(L.sec,L.t)});
 if(L.sec==='tarot'&&L.t==='reading'&&T.stage==='read'&&T.drawn)ctx.reading=`Tarot spread ${SPREADS[T.spread].n}${T.q?', question “'+T.q+'”':''}. Cards: `+T.drawn.map(c=>`${c.pos}: ${c.shown?c.name+(c.rv?' (reversed)':''):'face down'}`).join('; ');
 else if(L.sec==='horoscope'){const ex=V.exploreSign||S.sign,h=horoscope(ex,V.hcat,V.period);ctx.reading=`${sg(ex).name} ${CAT_INFO[V.hcat][0]} horoscope, ${V.period}: ${h.body}`}
 else if(L.sec==='discover'&&L.t==='affinity'&&V.love.done&&V.love.b)ctx.reading=`Comparing ${sg(V.love.a||S.sign).name} with ${sg(V.love.b).name}.`;
 else if(L.sec==='discover'&&L.t==='dream'&&V.lastRead&&V.lastRead.d){const d=V.lastRead.d,I=d.interp||{};ctx.reading=`Their dream: “${String(d.text||'').slice(0,600)}”. Its reading: ${I.title||''}. ${String(I.meaning||'').slice(0,500)}`}
 else if(L.sec==='tarot'&&L.t==='entry'&&V.lastRead&&V.lastRead.p){ctx.reading=`Their journal page “${jHeading(V.lastRead.p)}”: ${String(jText(V.lastRead.p)||'').slice(0,800)}`}
 else if(L.sec==='tarot'&&L.t==='whisper'&&V.lastRead&&V.lastRead.card){const c=V.lastRead.card;ctx.reading=`Today’s Whisper card: “${c.title}”: ${c.msg} Reflection question: ${c.ref}`}
 else if(S.revealed[k]){const c=todayCard();ctx.reading=`Today’s Whisper card: “${c.title}”: ${c.msg} Reflection question: ${c.ref}`}
 if(personalOn()){const pt=PZ.forKassandra(myPortrait()),th=myThread(),ch=chapterAt(),w=chWish(ch);
  const more=[th?`${th.label} (${th.day}): “${th.text}”. You may gently ask how it is now, if it fits.`:'',w?`Their wish for this Moon's chapter (begun at the New Moon in ${sIdx(ch.sign).name}): “${clip(w.body,200)}”.`:''].filter(Boolean).join('\n');
  const mem=myMemory(),story=myStory();   // Kassandra reads the whole of their time in Kosmia
  ctx.portrait=[mem?'What Kosmia has come to understand of them over time:\n'+mem:'',story,more].filter(Boolean).join('\n\n')||pt}
 if(S.settings.kPersonal){
  const ch=myChart(),p=[`Chosen sign ${sg(S.sign).name}`];
  if(S.name)p.push('Name '+S.name);
  if(ch){p.push('Sun '+sIdx(ch.pl[0].sign).name);p.push(ch.moonRange?'Moon sign uncertain (no birth time)':'Moon '+sIdx(ch.pl[1].sign).name);if(ch.ang)p.push('Rising '+sIdx(K.signIdx(ch.ang.asc)).name);ch.pl.slice(2).forEach(x=>p.push(`${x.n} ${sIdx(x.sign).name}${x.house?' house '+x.house:''}`))}
  else p.push('No birth chart (birth details not added)');
  if(hasBirthDate()){p.push('Life Path '+N.lifePath(S.birth.date).r.n);p.push('Personal Year '+N.personalYear(S.birth.date,Number(dkey().slice(0,4))).r.n)}
  const nm=nameNums(S.fullName);if(nm)p.push(`Expression ${nm.expression.r.n}, Soul Urge ${nm.soul.r.n}, Personality ${nm.personality.r.n}`);
  ctx.personal=p.join('; ');
 }
 return ctx;
}
views.kassandra=()=>{
 if(tab()==='history'){const past=S.bookmarks.filter(b=>b.kind==='chat').sort((a,b)=>(b.at||'')>(a.at||'')?1:-1);
  return `<div class="sub">${hdr('Past Conversations',{sub:'Your conversations with Kassandra'})}<div class="list">${past.map(b=>acc(ui('kassandra','th round'),esc((b.data||{}).title||'A conversation'),relDay((b.at||'').slice(0,10)||dkey()),`<div class="thread">${((b.data||{}).msgs||[]).map(m=>`<div class="kas-m ${m.role}">${esc(m.content).replace(/\n+/g,'<br>')}</div>`).join('')}</div><button class="link danger-t" data-act="kasdel" data-id="${esc(b.id)}">Delete this conversation</button>`)).join('')||'<p class="muted center">No past conversations yet. Start a new one and the last will be kept here.</p>'}</div></div>`}
 const signed=!!C.user,rec=KS.state,has=KS.msgs.length>0,on=KS.target==='kas';
 return `<div class="sub kas-page${has?' has':''}">${hdr('Kassandra',{sub:'Your AI Fortune Teller',back:false,right:iconBtn('history','data-go="kassandra" data-t="history"','Past conversations')+jdoor()})}
 <div class="kp-frame"><svg class="kp-ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="98" fill="none" stroke="#B98A4E" stroke-width=".8"/><circle cx="100" cy="100" r="93" fill="none" stroke="#B98A4E" stroke-width=".5" stroke-dasharray="1 2.5"/>${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,x=(100+Math.cos(a)*95.5).toFixed(1),y=(100+Math.sin(a)*95.5).toFixed(1);return `<path d="M${x} ${(+y-3).toFixed(1)}l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#B98A4E"/>`}).join('')}</svg><div class="kp-por">${STARS}${ui('kassandra','kp-img','Kassandra, the fortune teller',true)}</div></div>
 <div class="kp-bub">${signed?(has?'Ask me anything else, or tap the mic to speak with me.':'Hello, I’m Kassandra.<br>Ask me anything or tap the mic to speak with me.'):'Hello, I’m Kassandra.<br>Sign in and I will read the cards, the stars and your numbers with you.'}</div>
 ${signed?`<button class="kp-mic${on&&rec==='listening'?' on':''}" data-act="kasmic" aria-label="${on&&rec==='listening'?'Stop recording':'Ask with your voice'}" ${rec==='processing'||KS.busy?'disabled':''}>${on&&rec==='listening'?IC.stop:IC.mic}</button>${on&&rec!=='idle'?`<p class="muted center small">${rec==='listening'?'Listening… tap again when you have finished.':'Hearing your question…'}</p>`:''}
 <div class="kp-pr">${kasPrompts().map(p=>`<button class="pill-b" data-act="kasask" data-q="${esc(p)}">${esc(p)}</button>`).join('')}</div>
 ${has||KS.busy?`<div class="thread" id="kthread" aria-live="polite">${KS.msgs.map(m=>`<div class="kas-m ${m.role}">${esc(m.content).replace(/\n+/g,'<br>')}</div>`).join('')}${KS.busy?'<div class="kas-m assistant muted">Kassandra is gazing into the crystal…</div>':''}</div>`:''}
 <form id="kas-f" class="kas-f"><label class="sr-only" for="kas-in">Your question for Kassandra</label><input type="text" id="kas-in" placeholder="Ask Kassandra…" maxlength="600" ${rec!=='idle'?'disabled':''}><button type="submit" class="kas-send" aria-label="Send" ${KS.busy||rec!=='idle'?'disabled':''}>${IC.send}</button></form>
 <label class="ck small"><input type="checkbox" id="kas-p" class="cb" ${S.settings.kPersonal?'checked':''}><span>Share my sign, chart and numbers with Kassandra</span></label>
 ${has?'<button class="btn ghost sm" data-act="kasnew">Begin a new conversation</button>':''}`
 :`<button class="kp-mic" data-act="toauth" aria-label="Sign in to speak with Kassandra">${IC.mic}</button>
 <div class="kp-pr">${kasPrompts().map(p=>`<button class="pill-b" data-act="toauth">${esc(p)}</button>`).join('')}</div>
 <button class="btn" data-act="toauth">Sign in to talk with Kassandra</button><p class="muted small center">Kassandra’s readings are written by AI, so she listens once you are signed in.</p>`}
 <p class="muted small center">Kassandra speaks in symbols, not certainties. She cannot give medical, legal or financial advice.</p></div>`;
};
// Kassandra and her past conversations as night pages, on her crystal ball
{const kas=views.kassandra;views.kassandra=()=>tab()==='history'?nightSub(kas(),'ks'):kasScene()}
/* ----- Kassandra's chamber: she is reached through a magic fog that rolls in and clears, revealing her behind the
   crystal ball (art/atlas/kas-scene); the ball wakes, light passes across it as her hand would, and she greets the
   reader by name, asking about what they last read (V.lastRead, kept for three hours), with three ways to answer ----- */
const markRead=o=>{V.lastRead=Object.assign({at:Date.now()},o);V.kasFrom=o.from};
function kasGreet(){
 const nm=firstName(),hi=nm?`${nm}… `:'',L=V.lastRead&&Date.now()-V.lastRead.at<3*36e5?V.lastRead:null;
 if(L&&L.k==='horo'){const s=sg(L.sign),pw={daily:'today',weekly:'this week',monthly:'this month',yearly:'this year'}[L.period],
  what=L.cat==='overview'?`of your ${pw==='today'?'day':pw.replace('this ','')}`:`of ${CAT_INFO[L.cat][0].toLowerCase()} ${pw}`,mine=L.sign===S.sign;
  return [`${hi}the stars spoke to you ${what}${mine?'':`, through ${s.name}’s sky`}. Did something in it stir you? I can look closer.`,
   ['Help me understand my reading',L.cat==='overview'?'What should I focus on?':`What does it mean for my ${CAT_INFO[L.cat][0].toLowerCase()}?`,'I need guidance on something else']]}
 if(L&&L.k==='whisper'){const c=L.card;return [`${hi}${c.title} found you today. Shall we ask it what door it is opening for you?`,[`What does ${c.title} mean for me?`,'How do I live its message today?','Something else is on my mind']]}
 if(L&&L.k==='reading'){const cs=L.cards,names=cs.slice(0,3).map(c=>c.name).join(', ');
  return [`${hi}${cs.length>1?`${names}… a curious path. Which card is still speaking to you?`:`${names} came to you. Shall we listen to it together?`}`,['Read the cards together for me',`Tell me more about ${cs[0].name}`,'What should I do next?']]}
 if(L&&L.k==='dream')return [`${hi}your dream still lingers around you. Shall we follow where it leads?`,['What is my dream telling me?','Why do I keep dreaming this?','Something else']];
 if(L&&L.k==='entry')return [`${hi}you have just been writing. Would you like to sit with it a little longer, together?`,['Help me reflect on what I wrote','What is beneath this feeling?','Something else']];
 let moon='';try{const m=K.moon(new Date());moon=` ${/^(New|Full)/.test(m.name)?`The ${m.name} rests`:`The Moon is ${m.waxing?'growing':'waning'}`} in ${sIdx(m.sign).name} tonight…`}catch(e){}
 const th0=personalOn()?myThread():null,felt=personalOn()?(PZ.greeting(myPortrait())||(th0?`${th0.label} about something close to you. ${th0.ask}`:'')):'';
 return [`${nm?`Welcome back, ${nm}.`:'Welcome. Sit with me a while.'}${moon}${felt?' '+felt:''} What is on your heart?`,[...(felt&&myPortrait().themes[0]?[`Guide me with ${PZ.THEMES[myPortrait().themes[0].k].short.replace(/you (come|long|have)/,'I $1').replace(/your/g,'my').replace(/you/g,'me')}`]:[]),'What do I need to know today?','What opportunities are coming?'].slice(0,3)];
}
// the fog rolls in over the page the reader is on; once it hides everything, her chamber is opened behind it and the fog
// thins away from the centre
function kasVeil(open){
 if(S.settings.reduce||matchMedia('(prefers-reduced-motion: reduce)').matches)return open();
 let v=$('#kzveil');if(v)v.remove();v=document.createElement('div');v.id='kzveil';v.className='kz-fog in';v.setAttribute('aria-hidden','true');v.innerHTML='<i></i><i></i><i></i><i></i><i></i><em class="kz-shim"></em><u class="kz-wisp a"></u><u class="kz-wisp b"></u>'+Array.from({length:130},()=>{const r=Math.random,big=r()<.22;return `<b style="left:${(r()*100).toFixed(1)}%;top:${(r()*100).toFixed(1)}%;--s:${(big?14+r()*16:3+r()*6).toFixed(1)}px;--d:${(r()*2.2).toFixed(2)}s;--t:${(1.2+r()*1.6).toFixed(2)}s;--x:${((r()-.5)*60).toFixed(0)}px;--y:${(-20-r()*70).toFixed(0)}px" class="${big?'st':''}"></b>`}).join('');document.body.appendChild(v);
 setTimeout(()=>{V.kasFogged=true;open();requestAnimationFrame(()=>{v.className='kz-fog out';setTimeout(()=>v.remove(),3400)})},1300)}
function kasScene(){
 const signed=!!C.user,rec=KS.state,has=KS.msgs.length>0,on=KS.target==='kas',fog=V.prevSec!=='kassandra'&&(V.kasFogged?(V.kasFogged=false,'veil'):true),[greet,prs]=kasGreet();V.kasGreet=greet;
 const words=greet.split(' ').map((w,i)=>`<span style="--d:${(fog?3.1:.2)+i*.07}s">${esc(w)}</span>`).join(' ');
 return `<div class="kz${fog?' fog':''}"><div class="kz-sky" aria-hidden="true"></div><div class="kz-box" aria-hidden="true">${ui('kas-scene2','kz-img','',true)}<i class="kz-glow"></i><i class="kz-sweep"></i></div>
 ${fog===true?'<div class="kz-fog" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>':''}
 <div class="kz-back">${iconBtn('back','data-act="back"','Back')}</div><div class="kz-corner">${iconBtn('history','data-go="kassandra" data-t="history"','Past conversations')}${jdoor()}${avatar()}</div>
 <div class="kz-talk"><div class="kz-card">
  <div class="kz-thread" id="kthread" aria-live="polite"><p class="kz-say">${words}</p>${KS.msgs.map(m=>`<div class="kas-m ${m.role}">${esc(m.content).replace(/\n+/g,'<br>')}</div>`).join('')}${KS.busy?'<div class="kas-m assistant kz-wait">Kassandra gazes into the crystal…</div>':''}</div>
  ${signed?`${has?'':`<div class="kz-pr" style="--d:${fog?4.2:1}s">${prs.map((p,i)=>i===2&&/^(Something|I need guidance)/.test(p)?`<button class="pill-b" data-act="kasfocus">${esc(p)}</button>`:`<button class="pill-b" data-act="kasask" data-q="${esc(p)}">${esc(p)}</button>`).join('')}</div>`}
  <form id="kas-f" class="kas-f kz-f"><label class="sr-only" for="kas-in">Your question for Kassandra</label><input type="text" id="kas-in" placeholder="Speak to Kassandra…" maxlength="600" ${rec!=='idle'?'disabled':''}>
   <button type="button" class="kz-mic${on&&rec==='listening'?' on':''}" data-act="kasmic" aria-label="${on&&rec==='listening'?'Stop recording':'Ask with your voice'}" ${rec==='processing'||KS.busy?'disabled':''}>${on&&rec==='listening'?IC.stop:IC.mic}</button>
   <button type="submit" class="kas-send" aria-label="Send" ${KS.busy||rec!=='idle'?'disabled':''}>${IC.send}</button></form>
  ${on&&rec!=='idle'?`<p class="kz-note">${rec==='listening'?'Listening… tap again when you have finished.':'Hearing your question…'}</p>`:''}
  ${has&&!KS.busy?`<div class="kz-next"><button class="pill-b" data-flow="kaskeep">${S.kcurId?'Kept in Your Readings ✓':'Keep this conversation'}</button><button class="pill-b" data-flow="kaswrite">Write about it</button></div>`:''}
  ${has?'<button class="link kz-new" data-act="kasnew">Begin a new conversation</button>':''}`
  :`<p class="kz-in">${firstName()?esc(firstName())+', she':'She'} speaks with those she knows. Sign in, and she will remember you, your sign and what you have told her.</p><button class="btn" data-act="toauth">Sign in to speak</button>`}
  <p class="kz-note">Kassandra speaks in symbols, not certainties. She cannot give medical, legal or financial advice.</p>
 </div></div></div>`;
}
function kasKeep(){S.kcur=KS.msgs.slice(-40);save();if(S.kcurId&&!KS.busy&&KS.msgs.length)try{kasSaveNow()}catch(e){}}
function kasSend(q){
 q=String(q||'').trim();if(!q||KS.busy)return;if(!C.user)return render();
 if(!KS.msgs.length&&V.kasGreet)KS.msgs.push({role:'assistant',content:V.kasGreet});KS.msgs.push({role:'user',content:q});KS.busy=true;kasKeep();render();kasScroll();
 C.kassandra(KS.msgs.slice(-12),kasContext()).then(r=>{KS.msgs.push({role:'assistant',content:r.reply||'…'});if(S.settings.voiceOut&&r.reply)playText(r.reply.slice(0,1400))},e=>{KS.msgs.push({role:'assistant',content:e.message||'The crystal is clouded. Try again in a moment.'})})
  .then(()=>{KS.busy=false;kasKeep();if(V.sec==='kassandra'){render();kasScroll()}});
}
const kasScroll=()=>requestAnimationFrame(()=>{const t=$('#kthread');if(t)t.lastElementChild&&t.lastElementChild.scrollIntoView({block:'nearest',behavior:'smooth'})});
// a conversation set aside is kept among the past ones (and in the account), and a fresh one begins
function kasNew(){
 if(!KS.msgs.length)return;kasSaveNow();S.kcurId=null;KS.msgs=[];kasKeep();render();toast('Kept in your past conversations');
}
// voice: record only while the reader has pressed the microphone, for Kassandra or for a dream
async function voiceRec(target){
 if(KS.state==='listening')return kasStopRec(false);
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder)return toast('Voice is not supported in this browser. You can type instead.');
 let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){return toast('Microphone permission was not given. You can type instead.')}
 const type=['audio/webm','audio/mp4','audio/ogg'].find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||'';
 const rec=new MediaRecorder(stream,type?{mimeType:type}:undefined);KS.chunks=[];KS.rec=rec;KS.state='listening';KS.target=target;
 rec.ondataavailable=e=>{if(e.data.size)KS.chunks.push(e.data)};
 rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());if(KS.cancel){KS.cancel=false;KS.state='idle';render();return}
  const blob=new Blob(KS.chunks,{type:(rec.mimeType||type||'audio/webm').split(';')[0]});KS.state='processing';render();
  C.transcribe(blob).then(r=>{KS.state='idle';if(!r.text){toast('That was not caught. Try again or type.');return render()}
   if(target==='dream'){const t=$('#dt');V.dream.text=((t?t.value:V.dream.text)+' '+r.text).trim().slice(0,1000);(S.dreamDraft||(S.dreamDraft={text:'',mood:''})).text=V.dream.text;save();render()}else if(target==='sync'){const t=$('#sst'),F=SSX.form();F.text=((t?t.value:F.text)+' '+r.text).trim().slice(0,1200);render()}else kasSend(r.text)},e=>{KS.state='idle';toast(e.message||'Could not hear that. Try typing.');render()})};
 rec.start();render();
 clearTimeout(KS.timer);KS.timer=setTimeout(()=>kasStopRec(false),target==='kas'?45000:90000);
}
function kasStopRec(cancel){if(KS.rec&&KS.rec.state!=='inactive'){KS.cancel=!!cancel;KS.rec.stop()}KS.rec=null;clearTimeout(KS.timer)}

/* ---------- Your Profile (from the avatar on Home): the account, sign, birth details, notifications, display, privacy and plan ---------- */
const delBlock=()=>V.confirmDel?`<section class="yo-del"><h3>Delete ${C.user?'your account and ':''}everything</h3><p>This permanently removes ${C.user?'your account and ':''}all you have kept: journal pages, reflections, saved cards, readings, dreams and your birth details. It cannot be undone.</p>
  <div class="field"><label for="delc">Type DELETE to confirm</label><input type="text" id="delc" autocomplete="off" autocapitalize="characters"></div>
  <div class="sx-acts"><button class="btn" data-act="canceldel">Keep it all</button><button class="btn ghost" data-act="delacct">Delete</button></div></section>`
 :`<button class="skd-m sky-cal yo-dl" data-act="askdel">Delete ${C.user?'my account and ':''}everything I have kept ${IC.chev}</button>`;
views.you=()=>{
 const nm=firstName(),sign=sg(S.sign);let line=`${sign.name} Sun`;
 try{if(hasBirthDate()&&K){const ch=myChart(),pl=n=>{const x=ch.pl.find(q=>q.n===n);return x?sIdx(x.sign).name:''},asc=ch.ang&&!S.birth.unk?sIdx(Math.floor(ch.ang.asc/30)).name:'';
  line=[pl('Sun')&&'Sun '+pl('Sun'),pl('Moon')&&!ch.moonRange&&'Moon '+pl('Moon'),asc&&'Rising '+asc].filter(Boolean).join(' · ')||line}}catch(e){}
 const yc=pgCur('you'),gt=(t,l,s,im)=>tileArt(`data-go="discover" data-t="${t}"`,l,s,im),ICD={profile:'ic-profile',birth:'ic-birth',bell:'ic-alerts',list:'ic-display',lock:'ic-privacy',star:'ic-sanctuary'},st=(sec,t,l,s,k)=>tile(`data-go="${sec}" data-t="${t}"`,l,s,ui(ICD[k],''));
 let pg;
 // one row for each thing: its picture, its name, and what it holds for this reader
 const row=(at,img,t,sub,x)=>`<button class="sky-c" ${at}>${img}<span class="sky-x"><strong>${t}</strong>${sub?`<em>${sub}</em>`:''}${x?`<span class="jn-x">${x}</span>`:''}</span><span class="sky-go">${IC.chev}</span></button>`;
 const dr=(t,im,l,sub,x)=>row(`data-go="discover" data-t="${t}"`,ui(im,'sky-i'),l,sub,x),sr=(t,k,l,x)=>row(`data-go="settings" data-t="${t}"`,ui(ICD[k],'sky-i'),l,'',x);
 if(yc==='codex'){const bd=hasBirthDate()?S.birth.date:'',N2=typeof N!=='undefined'?N:null;let lp='Add your birth date to find your number',nmL=S.fullName?'':'Add your full birth name to hear it',cy='Add your birth date to see your year',miss='';
  try{if(bd&&N2){const l=N2.lifePath(bd).r.n;lp=`${l} · ${N2.MEANING[l][0]}`;cy=`You are in a Personal Year ${N2.personalYear(bd,Number(dkey().slice(0,4))).r.n}`}
   if(S.fullName&&N2){const e=N2.name(S.fullName,S.settings.yMode).expression.r.n;nmL=`Expression ${e} · ${N2.MEANING[e][0]}`}}catch(e){}
  miss=!bd?'Add your birth date to open them all':S.birth.unk||!S.birth.time?'Add your birth time for your Rising':!S.fullName?'Add your full birth name for its number':'';
  pg=`<div class="sky-l sky-list or-list jn-list yo-list">${dr('birth-chart','ex-chart','Birth chart','',esc(line))}${dr('life-path','ex-lifepath','Life path','',lp)}${dr('name-within','ex-name','Your name','',nmL)}${dr('cycles','m-'+S.sign,'Personal year','',cy)}
  ${row('data-go="discover" data-t="profile"',ui('ic-birth','sky-i'),'Birth details','',miss||'Your day, time and place of birth')}</div>`}
 else if(yc==='circle')pg=`<p class="pg-in">Read for the people you love.</p><div class="sky-l sky-list or-list jn-list yo-list">${dr('people','ex-compat','My Relationships','','The people you have kept')}${dr('affinity','ex-compat','Two signs','','How your sign flows with theirs')}${dr('resonance','ex-resonance','Two names','','The numbers in both your names')}${dr('synastry','ex-chart','Two birth charts','','Your skies side by side')}${row('data-act="spkopen"',ui('ic-someone','sky-i'),'Someone else’s sky','','Read today for another sign')}</div>`;
 else pg=`<p class="yo-acct">${!C.enabled?'Kept on this device':C.user?'Signed in as '+esc(C.user.email||''):'Not signed in · kept on this device'}</p><div class="sky-l sky-list or-list jn-list yo-list">${sr('account','profile','Name and photo',esc(S.name||'Not set'))}${sr('notifications','bell','Notifications','Your daily horoscope, Whispers and events')}${sr('display','list','Display','Text size, motion, time zone and voice')}${sr('privacy','lock','Privacy and data','Consent, download and deletion')}${sr('subscription','star','Membership','Early access · everything is open')}</div>
  ${C.user?'<button class="btn ghost yo-out" data-act="signout">Sign out</button>':C.enabled?'<button class="btn ghost yo-out" data-act="toauth">Sign in or create an account</button>':''}`;
 return `<div class="land hland hnight yland skyp pg pg-you"><header class="hl-top stay sk-head"><h1 class="pg-t">${nm?esc(nm):'You'}</h1><p class="pg-s">${esc(line)}</p>${pgStrip('you')}</header>
 <div class="sk-body pg-scroll"><div class="pg-page${pgDir()}">${pg}</div></div></div>${V.spk?signPick(S.sign):''}`;
};
views.settings=()=>{
 const t=tab();
 if(t==='birth'){V.sec='discover';V.tab.discover='profile';history.replaceState(history.state,'',pathFor('discover','profile',{}));return nightPage(profileView(),'cp')}
 if(t==='birth-old')return nightSub(`<div class="sub">${hdr('Birth Details',{sub:'For your chart, Life Path and cycles'})}${birthForm()}</div>`,'bd');
 // Kosmia Premium: what stays free, what Premium opens, and the two plans. Payments are not switched on yet, so during
 // early access everything is open and nothing can be bought here
 if(t==='subscription'){const li=a=>`<ul>${a.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  return nightSub(`<div class="sub">${hdr('My Membership')}<div class="prem">
  <p class="prem-l">${firstName()?esc(firstName())+', a':'A'} place that knows you a little more each Moon</p>
  ${panel(`<p class="kick prem-now">Your plan · Early Access</p><p class="prem-now">Everything in Kosmia is open to you, free, while it is in early access. Nothing is charged, and nothing ever will be without your clear agreement.</p>`,'ornate')}
  ${panel(`<div class="prem-cols"><div class="prem-col"><h3>Always free</h3>${li(['Your Daily Whisper','Your sign’s horoscope','Journal and reflections','Moon and Cosmic Calendar','One-card and three-card readings'])}</div>
   <div class="prem-col"><h3>The Sanctuary</h3>${li(['Written for You, every day','Kassandra, whenever you need her','Your birth chart and transits','Love, Career and Celtic Cross spreads','Compatibility in depth','Dream interpretation','Readings in Kassandra’s voice'])}</div></div>`,'ornate')}
  <div class="prem-plans"><div class="plan best"><i>Best value</i><b>Yearly</b><strong>$49.99</strong><small>$4.17 a month</small><small>7 days free</small></div><div class="plan"><b>Monthly</b><strong>$9.99</strong><small>a month</small><small>cancel anytime</small></div></div>
  <button class="btn" disabled>The Sanctuary opens soon</button><p class="muted small center">Until then, everything above is yours.</p><div class="prem-del">${delBlock()}</div></div></div>`,'st')}
 if(t!=='account')return nightSub(subPage(settingsPage(t)),'st');
 const s=sg(S.sign),acct=!C.enabled?'<p class="muted">Accounts are not configured for this build, so everything stays in this browser.</p>'
  :C.user?`<p class="muted">Signed in as ${esc(C.user.email||'')} · synced across your devices.</p>`:`<p class="muted">Not signed in. Create an account or sign in to keep your universe in sync across devices.</p><button class="btn" data-act="toauth">Sign in or create an account</button>`;
 // the night garden runs the length of the page: the title set in its sky, the sign's figure whole before its moon with the
 // identity on parchment beside it, and the settings on parchment rows over the lilies and roses below
 return `<div class="mnp pfn">${mnHead0('My Account','',true)}
 <div class="pf-id"><label class="pf-pic" aria-label="${S.photo?'Change':'Add'} your profile picture">${myFace('pf-img')}<span class="pf-cam" aria-hidden="true">${IC.plus}</span><input type="file" id="pfphoto" accept="image/*" class="sr-only"></label>
  <div><h2>${esc(S.name||S.fullName||'Traveller')}</h2><p class="pf-sign"><span class="glyph" aria-hidden="true">${s.g}</span> ${s.name} · ${SHORT_DATES(s)}</p><p class="keys">${keys(SIGN_KEYS[s.id])}</p>${S.photo?'<button class="link pf-rm" data-act="rmphoto">Remove picture</button>':''}</div></div>
 <div class="pf-body">${acct}
 <div class="list">
 ${acc(glyphMed(s.id),'Your sign',s.name,`${signGrid('My sign',S.sign)}`)}
 ${acc(ui('ne-free','th'),'Display name',esc(S.name||'Not set'),`<div class="field"><label for="nm">Display name</label><input type="text" id="nm" value="${esc(S.name)}"></div><button class="btn sm" data-act="savename">Save</button>`)}
 ${C.user?acc(ui('t-history','th'),'Password','Change your password',`<div class="field"><label for="npw">New password</label><input id="npw" type="password" autocomplete="new-password" minlength="8"></div><button class="btn sm" data-act="setpw">Change password</button>`):''}
 </div>${C.user?'<button class="btn ghost" data-act="signout">Sign out</button>':''}</div></div>`;
};
/* ----- the profile's own pages: notifications, privacy and display ----- */
function settingsPage(t){
 const n=S.notif,st=S.settings;
 if(t==='notifications')return `<div class="stack"><h1>Notifications</h1><p class="note">Kosmia saves these choices now. Delivery is not switched on yet: it needs push messaging, which is coming in a later release. Nothing will be sent until then, and your browser will ask permission first.</p>${panel(`${[['n_on','Daily horoscope',n.on],['n_wh','Daily Whisper',n.whisper],['n_ev','Important celestial events',n.events],['n_mo','Monthly forecast reminder',n.monthly],['n_an','Yearly forecast reminder',n.annual]].map(([id,l,v])=>`<label class="row"><input type="checkbox" id="${id}" ${v?'checked':''} class="cb"> ${l}</label>`).join('')}<div class="field"><label for="n_mn">Every New Moon and Full Moon</label><select id="n_mn">${[['','No reminder'],['before','The day before'],['day','On the day'],['both','The day before and on the day']].map(([v,l])=>`<option value="${v}" ${(n.moons||'')===v?'selected':''}>${l}</option>`).join('')}</select></div><p class="muted small">A reminder set on a single event replaces this one for that event, so nothing arrives twice.</p><div class="field"><label for="n_time">Delivery time</label><input type="time" id="n_time" value="${n.time}"></div><label class="row"><input type="checkbox" id="n_q" ${n.quiet?'checked':''} class="cb"> Quiet hours</label><div class="row two"><div class="field"><label for="n_qf">From</label><input type="time" id="n_qf" value="${n.quietFrom}"></div><div class="field"><label for="n_qt">Until</label><input type="time" id="n_qt" value="${n.quietTo}"></div></div><p class="muted small">Times are in your time zone (${esc(TZ())}).</p>`)}</div>`;
 if(t==='privacy')return `<div class="stack"><h1>Privacy &amp; My Data</h1>
  ${panel(`<h3>What Kosmia keeps</h3><p>Your email, chosen sign and name; your Whispers, reflections, journal, readings, bookmarks and connections; and, only if you agree, your birth details. Everything is private to your account and protected so that only you can read it.</p><p class="muted small">AI features send only what they need: the tarot cards drawn, a forecast’s sign and period, or what you type to Kassandra. While personalisation is on, a short summary of the themes you have been writing about, with a few lines in your own words, is sent each day to write your message and to help Kassandra know you. It is never shared or used for anything else.</p>`)}
  ${panel(`<h3>Consent</h3><label class="row consent"><input type="checkbox" id="p_birth" ${S.birthConsent?'checked':''} class="cb"> <span>Keep my birth details in my account</span></label><label class="row consent"><input type="checkbox" id="p_pz" ${st.personal!==false?'checked':''} class="cb"> <span>Personalise my daily message, Whisper and Kassandra from what I write in my Journal, reflections, tarot questions and dreams</span></label><label class="row consent"><input type="checkbox" id="p_kas" ${st.kPersonal?'checked':''} class="cb"> <span>Let Kassandra see my sign, chart placements and numbers when I talk with her</span></label>`)}
  ${panel(`<h3>Your data</h3><button class="btn ghost" data-act="export">Download my data</button><button class="btn ghost" data-act="delbirth">Delete my birth details</button><div class="rule"></div><h3>Delete account</h3><p class="muted small">This permanently removes your account and everything in it. It cannot be undone.</p>${V.confirmDel?`<div class="field"><label for="delc">Type DELETE to confirm</label><input type="text" id="delc" autocomplete="off"></div><div class="row"><button class="btn danger" data-act="delacct">Delete my account</button><button class="btn ghost" data-act="canceldel">Cancel</button></div>`:`<button class="btn ghost danger-t" data-act="askdel" ${C.user?'':'disabled'}>Delete my account</button>${C.user?'':'<p class="muted small">Sign in to manage an account.</p>'}`}`)}</div>`;
 if(t==='display')return `<div class="stack"><h1>Display &amp; Accessibility</h1>${panel(`<label class="row"><input type="checkbox" id="d_rm" ${st.reduce?'checked':''} class="cb"> Reduce motion</label><label class="row"><input type="checkbox" id="d_lg" ${st.large?'checked':''} class="cb"> Larger text</label><label class="row"><input type="checkbox" id="d_hp" ${st.haptics!==false?'checked':''} class="cb"> Soft haptics (a light tap as you move)</label><p class="muted small">Kosmia also follows your device’s reduced-motion setting.</p>`)}${panel(`<h3>Time zone</h3><div class="field"><label for="d_tz">Days, weeks and events use</label><select id="d_tz"><option value="">This device (${esc(DEVICE_TZ)})</option>${(Intl.supportedValuesOf?Intl.supportedValuesOf('timeZone'):[]).map(z=>`<option ${st.tz===z?'selected':''}>${z}</option>`).join('')}</select></div>`)}${panel(`<h3>Kassandra</h3><label class="row"><input type="checkbox" id="d_vo" ${st.voiceOut?'checked':''} class="cb"> Read Kassandra’s replies aloud</label>`)}</div>`;
 const acct=!C.enabled?'<h3>Local mode</h3><p class="muted">Accounts and sync are not configured for this build, so everything stays in this browser.</p>'
  :C.user?`<h3>Signed in</h3><p class="muted">${esc(C.user.email||'')} · synced across your devices.</p>`
  :`<h3>Not signed in</h3><p class="muted">Create an account or sign in to keep your universe in sync across devices.</p><button class="btn" data-act="toauth">Sign in or create an account</button>`;
 return `<div class="stack"><h1>Account</h1>${panel(acct)}${panel(`<h3>My sign</h3>${signGrid('My sign',S.sign)}<div class="field"><label for="nm">Display name</label><input type="text" id="nm" value="${esc(S.name)}"></div><button class="btn" data-act="savename">Save</button>`)}${C.user?panel(`<h3>Password</h3><div class="field"><label for="npw">New password</label><input id="npw" type="password" autocomplete="new-password" minlength="6"></div><button class="btn ghost" data-act="setpw">Change password</button>`):''}${panel(`<button class="btn ghost" data-act="signout">Sign out${C.user?'':' and clear this device'}</button>`)}</div>`;
}
/* ---------- render + events ---------- */
const onboarding=()=>['welcome','join','reset'].includes(V.sec);
// a redraw of the same screen (the Whisper revealed, a card opened, an answer arriving) keeps the reader where they
// were: on the page, and in any pop-up or carousel on it (swapping the page in would otherwise scroll it to the top)
const SCROLLS='.pop-box,.cpop,.en-track,.skz-track,.hpz-scr,.hscroll,.sg-car,.fscroll,.kp-pr,.tbl,.hc-read';
const scrollsOf=r=>[...r.querySelectorAll(SCROLLS)].map(e=>[e.className,e.scrollLeft,e.scrollTop]);
const screenOf=r=>{const h=r.querySelector('h1');return [V.sec,tab(),V.sec==='tarot'?V.tarot.stage:'',h?h.textContent.trim():''].join('/')};
// the painted scene behind the place: Today's follows the hour (dawn by day, the lake in the evening, the candle at night's end)
function sceneKey(){
 const cur=navCur();
 if(cur!=='horoscope')V.skd=null;
 if(cur==='home'){const st=V.hstep,eve=evening();return st==='night'||(st==='held'&&eve)?'candle':eve?'lake':'dawn'}
 return cur==='horoscope'?(tab()==='sign'?'skyplain':'sky'):cur==='tarot'?'oracle':cur==='journal'?'journal':'you';
}
const FIGP={"aries":[105.0,-1.2,4.8],"taurus":[107.1,-1.6,1.7],"gemini":[111.1,-6.8,-0.0],"cancer":[102.2,-1.6,4.9],"leo":[109.6,-4.0,5.5],"virgo":[101.2,-0.8,7.1],"libra":[103.3,-3.9,4.0],"scorpio":[105.0,-1.6,5.7],"sagittarius":[119.5,-10.8,-0.6],"capricorn":[104.5,-5.0,4.5],"aquarius":[104.2,-1.2,7.2],"pisces":[98.6,-1.0,12.7]};
const figVars=id=>{const f=FIGP[id]||[95,2,8];return `--fw:${f[0]}%;--fl:${f[1]}%;--ft:${f[2]}%`};
// the first time in, three quiet scenes say how the place works, each in the golden ring of the sign's own sky
function welcomeView(){
 if(!S.welcomed&&S.sign&&(Object.keys(S.revealed||{}).length||(S.journal||[]).length||Object.keys(S.notes||{}).length||S.intro)){S.welcomed=true;save()}   // anyone with a history here has already been welcomed
 if(S.welcomed||!(S.sign&&!onboarding())||V.sec!=='home')return '';
 const i=Math.min(2,V.wl||0),nm=firstName(),sg0=sg(S.sign);
 const phase=n=>{const rx=[0,.56,0,.56][n%4]*48,sw=n===3?1:0,lit=n>=4?'<circle cx="50" cy="50" r="49" fill="#fff"/>':n?`<path d="M50 2A48 48 0 0 1 50 98A${rx} 48 0 0 ${sw} 50 2Z" fill="#fff"/>`:'';
  return `<svg viewBox="0 0 100 100" class="wl-ph"><defs><filter id="wf${n}"><feGaussianBlur stdDeviation="1.1"/></filter><mask id="wm${n}"><g filter="url(#wf${n})">${lit}</g></mask></defs><image href="/art/temple/moon-base.webp" width="100" height="100"/><image href="/art/temple/moon-full.webp" width="100" height="100" mask="url(#wm${n})"/></svg>`};
 const art=[
  `<div class="wl-moon">${phase(0)}<div class="wl-ph wl-lit">${phase(1)}</div></div>`,
  `<div class="wl-moon wl-cycle">${[0,1,2,3,4].map(n=>`<div class="f f${n}">${phase(n)}</div>`).join('')}</div>`,
  `<div class="wl-fig" style="${figVars(sg0.id)}"><span class="sp-moon"><img src="/art/atlas/home-halo.webp" alt=""></span><img class="wf-fg" src="/art/atlas/fg-${sg0.id}.webp" alt=""></div>`][i];
 const W=[
  [`Welcome${nm?', '+esc(nm):''}`,'Kosmia is a quiet place to meet yourself beneath the stars. Come as you are. Nothing here is a test.','Kosmia'],
  ['Today is a small ritual','A few pages each day: written for you, your stars, your Whisper. The Moon grows with each one, and is full when your day is whole.','Each day'],
  ['Swipe, then go deeper','Swipe sideways to move between pages. Under every title, a row of sections takes you further into that place.',`${sg0.name} · your sky`]][i];
 const extra=[
  `<div class="wl-ex wl-sparks"><i></i><i></i><i></i></div>`,
  `<div class="wl-ex wl-steps">${['Written for you','Your stars','Your Whisper','Reflect'].map((t,k)=>`<span style="--k:${k}"><b></b>${t}</span>`).join('')}</div>`,
  `<div class="wl-ex wl-mock"><div class="wl-pill"><span>Stars</span><span>Now</span><span>Calendar</span><i></i></div><div class="wl-hand"></div></div>`][i];
 const tw=Array.from({length:18},(_,k)=>`<i style="left:${(k*53+11)%97}%;top:${(k*37+7)%58}%;--d:${(k%6)*.6}s"></i>`).join('');
 return `<div class="wl" role="dialog" aria-modal="true" aria-label="Welcome"><div class="wl-in" data-i="${i}"><div class="wl-sky"></div><div class="wl-tw" aria-hidden="true">${tw}</div>
  <div class="wl-art${i===2?' open':''}">${art}</div>
  <div class="wl-flow"><p class="wl-k">${W[2]}</p><h2>${W[0]}</h2><p class="wl-p">${W[1]}</p>${extra}</div>
  <div class="wl-foot"><div class="wl-dots">${[0,1,2].map(x=>`<i class="${x===i?'on':''}"></i>`).join('')}</div>
  <div class="wl-acts">${i<2?'<button class="btn ghost" data-act="wlskip">Skip</button>':''}<button class="btn" data-act="wlnext">${i<2?'Next':'Begin'}</button></div></div></div></div>`;
}
let ritAfter=()=>{};
function render(){
 const ritY=(document.getElementById('rth')||{}).scrollTop||0;
 const app=$('#app'),sec=V.sec,authed=!!S.sign&&!onboarding();
 // a night page's subtitle belongs with its title, so it stays in place with it
 const html=(views[sec]||views.home)().replace(/<\/header>(\s*)(<p class="mn-sub">[\s\S]*?<\/p>)/g,'$2</header>$1');
 // the notebook stays where it was on the screen while its pages turn (swapping the page in would scroll to the top)
 const keep=sec==='tarot'&&tab()==='notebook'?scrollY:null,y=scrollY,sc=scrollsOf(app);
 const mst=(app.querySelector('.mn-scroll')||{}).scrollTop||0;
 app.innerHTML=html+(V.share?sharePop():'')+welcomeView();V.prevSec=sec;
 const scr=screenOf(app);
 render.keepMs=scr===render.scr?mst:0;
 if(scr===render.scr){window.scrollTo(0,y);app.querySelectorAll(SCROLLS).forEach((e,i)=>{const s=sc[i];if(s&&s[0]===e.className){e.scrollLeft=s[1];e.scrollTop=s[2]}})}
 render.scr=scr;
 // behind the floating menu, a strip of the page's own painting at the very spot it would be, laid over the cards, so
 // what scrolls under the menu disappears into the art instead of showing through
 {const pg=app.firstElementChild,nav=$('#nav');if(pg&&nav){const one=pg.matches('.land.hnight,.land.dnight,.jnight'),f=one?'url(/art/atlas/home-sun.webp) 50% 0/var(--bw) var(--bh) no-repeat':pg.matches('.home.hbay')?`url(/art/atlas/${pg.matches('.hsun')?'home-sun-today':pg.matches('.hmoon')?'home-moon':pg.matches('.hdawn')?'home-dawn':'home-bay'}.webp) 50% 0/var(--bw) var(--bh) no-repeat`:(getComputedStyle(pg).getPropertyValue('--fbg').trim());
  nav.style.setProperty('--navbg',f&&f!=='none'?(one||pg.matches('.home.hbay')?f:pg.matches('.hframe')?f+' 50% 0/100% auto no-repeat':f+' 50% 100%/100% auto no-repeat')+(one||pg.matches('.home.hbay')?',#030D1A':',#0B0F1E'):'none')}}
 jxRender();enCar();skzCar();hcar();hswipe();skswipe();subFix();tileUp();stayHeads();stayFade();footFit();document.querySelectorAll('.jpage .jp-front').forEach(jlay);if(keep!=null&&scrollY!==keep)window.scrollTo(0,keep);
 if(V.jfresh){V.jfresh=false;requestAnimationFrame(()=>{const b=$('#app .jbook');if(b)window.scrollTo(0,Math.max(0,b.getBoundingClientRect().top+scrollY-8))})}
 document.querySelectorAll('textarea.je').forEach(grow);
 $('#nav').hidden=!authed||EMB;document.body.classList.toggle('has-nav',authed&&!EMB);document.body.classList.add('nv-d','cb-c');document.body.classList.toggle('obfit',onboarding());
 if(authed)$('#navin').innerHTML=Kit.nav(NAV,navCur());
 if(authed){const yb=$('#navin [data-nav=you]');if(yb)yb.style.setProperty('--ico',`url(/art/atlas/sgm-${S.sign||'aries'}.webp)`)}
 if(authed){askDaily();askEvening()}
 if(sec==='home')V.ret=null;
 {let rp=$('#rtpill');if(authed&&V.ret&&sec!=='home'){if(!rp){rp=document.createElement('button');rp.id='rtpill';rp.dataset.act='hreturn';document.body.append(rp)}rp.innerHTML=`<span aria-hidden="true">‹</span> Back to your day<small>${V.ret.label}</small>`}else if(rp)rp.remove();document.body.classList.toggle('has-ret',!!(authed&&V.ret&&sec!=='home'))}
 document.body.classList.toggle('onboarding',!authed);
 document.body.dataset.sec=sec;document.body.classList.remove('still');
 if(authed)Temple.set(sceneKey());else Temple.off();
 document.documentElement.classList.toggle('nos',authed&&!!document.querySelector('#app .home.hpath,#app .skyp,#app .mnp,#app .kz'));
 if(authed&&sec==='home'&&!V.arrived&&!S.settings.reduce&&!matchMedia('(prefers-reduced-motion: reduce)').matches){V.arrived=true;document.body.classList.add('arrive');haptic();setTimeout(()=>document.body.classList.remove('arrive'),2800)}else if(authed&&sec==='home')V.arrived=true;
 document.body.classList.toggle('reduce',!!S.settings.reduce);document.body.classList.toggle('large',!!S.settings.large);
 navH();tarotFit();ritAfter(ritY);
 document.title=authed&&SECTIONS[sec]?(sec==='home'?'Kosmia':`${tabLabel(sec,tab())} · Kosmia`):'Kosmia';
 if(onboarding()){bindJoin();obShape()}
 if(authed&&SECTIONS[sec])syncUrl();
 drift();
 const vk=sec+'/'+tab()+(sec==='tarot'?'/'+V.tarot.stage:'');if(vk!==render.vk&&sec==='tarot'&&tab()==='reading')requestAnimationFrame(()=>window.scrollTo(0,0));render.vk=vk;
}
// Today's path: a clearly sideways swipe on the step, once let go, brings the next step (or the one before)
// the night pages: their title, tabs and search stand still, and only what is under them moves, between them and the menu
function subFix(){
 const m=$('#app .mnp');if(!m||m.querySelector('.mn-scroll'))return;
 let from=m.querySelector('.mn-hd,.en-top');if(!from)return;from=from.nextElementSibling;
 while(from&&from.matches('.mn-sub,.gtabs,.seg,.fscroll,.field,[role=group],.pf-id'))from=from.nextElementSibling;
 if(!from)return;
 const w=document.createElement('div');w.className='mn-scroll';let n=from;const ks=[];while(n){ks.push(n);n=n.nextElementSibling}
 from.before(w);ks.forEach(k=>w.append(k));w.scrollTop=render.keepMs||0;
}
function skswipe(){
 const s=$('.skyp');if(!s||s.classList.contains('hsp'))return;let x0=null,y0=0;
 s.addEventListener('touchstart',e=>{const t=e.touches[0];x0=t.clientX;y0=t.clientY},{passive:true});
 s.addEventListener('touchend',e=>{if(x0==null)return;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;x0=null;
  if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5&&!e.target.closest('textarea,input,.mn-scroll')){const st=s.querySelectorAll('.pg-strip button');if(st.length){const i=[...st].findIndex(b=>b.getAttribute('aria-selected')==='true');st[i+(dx<0?1:-1)]?.click();return}const i=PERIODS.findIndex(x=>x[0]===V.period),n=PERIODS[i+(dx<0?1:-1)];if(n)$(`.skyp [data-period="${n[0]}"]`)?.click()}},{passive:true});
}
function hswipe(){
 const s=$('.home.hpath');if(!s)return;let x0=null,y0=0;
 s.addEventListener('touchstart',e=>{const t=e.touches[0];x0=t.clientX;y0=t.clientY},{passive:true});
 s.addEventListener('touchend',e=>{if(x0==null)return;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;x0=null;
  if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5&&!e.target.closest('textarea,.en-car'))pathMove(dx<0?1:-1)},{passive:true});
}
// the Cosmic Energy carousel: its dots follow the slide in view, and it moves on by itself every few seconds unless the
// reader has just touched it or motion is reduced
let enT=0;
/* the sign page: the painting and the sign's name stay in place while its words, the period bar, the areas and the
   reading roll up over them; the areas then stay at the top of the screen as its menu. */
/* the areas of life on a sign page. The reading never moves sideways under the finger (so scrolling stays steady): a
   clearly sideways swipe on the reading, once let go, turns its page (or back), and after its last page brings in the
   next area (or, back from its first, the one before at its last page); the arrows above it go to the next area or
   the one before, at its start. The new page or reading slides in without redrawing the page; the marks beneath the
   reading follow its page, and Write about it the area in view; the medallion between the arrows turns to the new area like a carousel; the painting and
   the sign's name stay still. */
function hcar(){
 const c=$('.hcar');if(!c)return;
 const R=c.querySelector('.hc-read'),T=$('.hc-track'),n=HCATS.length,arr=d=>$('.hc-ctl .hc-'+d),pg=c.closest('.hsp')||c;
 const line=(j,jump)=>{if(T){T.classList.toggle('jump',!!jump);T.style.setProperty('--p',j);T.querySelectorAll('.hc-s').forEach((b,x)=>{b.classList.toggle('on',x===j);b.setAttribute('aria-pressed',x===j)});if(jump)requestAnimationFrame(()=>requestAnimationFrame(()=>T.classList.remove('jump')))}
  [['pv',(j+n-1)%n,'Back to '],['nx',(j+1)%n,'Next, ']].forEach(([d,x,w])=>{const b=arr(d);if(b){b.dataset.k=HCATS[x][0];b.setAttribute('aria-label',w+CAT_INFO[HCATS[x][0]][0])}})};
 const cur=()=>Math.max(0,HCATS.findIndex(x=>x[0]===V.hcat));
 line(cur());
 // one page of the area being read in view, its mark lit (and kept when the page is drawn again, as when the reading
 // is saved or read aloud)
 const pages=()=>[...R.children[cur()].querySelectorAll('.hc-pg')];
 const show=(p,dir)=>{const P=pages(),D=$('.sx .hc-pgs');p=Math.max(0,Math.min(P.length-1,p));c.pg=p;V.hpg=[R.children[cur()].dataset.ref,p];
  P.forEach((e,x)=>{const on=x===p;e.hidden=!on;e.classList.toggle('cur',on);e.classList.toggle('turn',on&&!!dir);e.classList.toggle('from-l',on&&dir<0)});
  if(D)D.innerHTML=P.length>1?P.map((e,x)=>`<button class="hc-pd${x===p?' on':''}" data-act="hpg" data-pg="${x}" aria-label="Page ${x+1} of ${P.length}"${x===p?' aria-current="true"':''}></button>`).join(''):'';
  R.scrollTop=0;sxOvf()};
 const take=(j,dir,last)=>{j=(j+n)%n;const k=HCATS[j][0];if(k===V.hcat)return;const cur0=cur();
  const was=V.say;V.hcat=k;stopAudio();line(j,Math.abs(j-cur0)>1);
  const back=dir?dir<0:j<cur0,turn=(sl,x)=>{const on=x===j;sl.hidden=!on;sl.classList.toggle('cur',on);sl.classList.toggle('from-l',on&&back)};
  [...R.children].forEach(turn);sxLay(R.children[j]);
  const sl=R.children[j],r=sl.dataset.ref,hb=$('.hsp-bar [data-act=bookhoro]'),sh=$('.hsp-bar [data-act=sharecard]'),wr=$('.sx [data-act=hreflect]');
  if(hb){const on=isSaved('horoscope',r);hb.dataset.ref=r;hb.classList.toggle('on',on);hb.setAttribute('aria-pressed',on);hb.setAttribute('aria-label',on?'Saved to your journal':'Save to your journal')}
  if(sh)sh.dataset.cat=k;if(wr)wr.dataset.ref=r;
  syncUrl();
  show(last?1e9:0);if(R.getBoundingClientRect().top<0)window.scrollTo(0,0);
  if(was)render()};
 // the next page, or the next area once its last page is read; back the same way
 const step=d=>take(cur()+d,d);
 // a clearly sideways swipe turns the page; anything more up-and-down is left to scrolling
 let sx=0,sy=0;
 pg.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
 pg.addEventListener('touchend',e=>{const t=e.changedTouches[0],x=t.clientX-sx,y=t.clientY-sy;if(Math.abs(x)>50&&Math.abs(x)>2*Math.abs(y))step(x<0?1:-1)},{passive:true});
 c.go=(j,d)=>take(j,d);c.show=show;c.pg=V.hpg&&V.hpg[0]===R.children[cur()].dataset.ref?V.hpg[1]:0;
 sxPage();
}
// Read for someone else: the Whisper's floating frame, asking whose sign to read, the twelve medallions as the zodiac
// shows them when one first arrives; the sign chosen opens its own page at the same area and time
function signPick(ex){
 return `<div class="cpop wpc spk" role="dialog" aria-modal="true" aria-labelledby="spkt" data-act="spkclose"><div class="cp-in wpc-in">
 <button class="cp-x" data-act="spkclose" aria-label="Close">×</button>
 <p class="cp-k">Read for someone else</p><h2 class="cp-t" id="spkt">Choose Their Sign</h2><p class="spk-d">Whose sky shall the stars read?</p>
 <div class="zgrid spk-z">${SIGNS.map(x=>`<button class="zg-s" data-act="tohoroscope" data-sign="${x.id}" data-cat="${V.hcat}" data-period="${V.period}"${x.id===ex?' aria-current="true"':''} aria-label="${x.name}, ${x.dates}">${ui('zm-'+x.id,'zg-m')}<span>${x.name}</span></button>`).join('')}</div>
 </div></div>`}
// a sign's page is one screen: each area's reading is laid out in pages that sit whole on the invisible card, in the
// app's own reading size, broken between sentences (a paragraph carries on over the page) into as few pages as hold
// it, the breaks chosen so its pages are as alike as they can be, the button to choose the sign and its small print
// at the end of its last; all on one page where the card holds it whole. Measured on a hidden page so the reading
// itself does not stir, and laid out again only when the card changes size. A page still longer than the card (only
// on the smallest screens) scrolls within it, fading at its foot
function sxLay(sl){
 const R=$('.sx .hc-read'),c=$('.hcar');if(!R||!sl)return;
 const H=R.clientHeight,at=R.clientWidth+'x'+H;if(sl._at===at)return;sl._at=at;
 const M=document.createElement('div');M.className='hc-slide';M.setAttribute('aria-hidden','true');
 M.style.cssText=`position:absolute;left:0;top:0;width:${R.clientWidth}px;height:auto;visibility:hidden;pointer-events:none`;
 c.appendChild(M);
 const html=us=>{let o='',rd=0,p=0;const end=()=>{if(p)o+='</p>';if(rd)o+='</div>';rd=p=0};
  us.forEach(u=>{if(u.s==null){end();o+=u.h;return}if(!rd){o+='<div class="read">';rd=1}if(u.np&&p){o+='</p>';p=0}if(!p){o+='<p>';p=1}o+=esc(u.s)});
  end();return `<div class="hc-pg">${o}</div>`};
 const fits=(us,h)=>{M.innerHTML=html(us);return M.offsetHeight<=h+1};
 // the fewest pages, then the breaks that make them most alike; every page holds some of the reading
 const even=us=>{const n=us.length,h=us.map(()=>[]),memo={},last=us.map(u=>u.s!=null).lastIndexOf(true);
  for(let i=0;i<n;i++)for(let j=i+1;j<=n;j++){const ok=fits(us.slice(i,j),H);if(ok||j===i+1)h[i][j]=M.offsetHeight;if(!ok)break}
  const f=(i,k)=>{if(i===n)return k?Infinity:0;if(!k||i>last&&last>=0)return Infinity;const key=i+'/'+k;if(key in memo)return memo[key][0];
   let b=[Infinity,i+1];for(let j=i+1;j<=n&&h[i][j]!=null;j++){const v=h[i][j]**2+f(j,k-1);if(v<=b[0])b=[v,j]}memo[key]=b;return b[0]};
  let P=1;while(P<n&&f(0,P)===Infinity)P++;f(0,P);
  const pgs=[];for(let i=0,k=P;i<n;k--){const j=memo[i+'/'+k][1];pgs.push(us.slice(i,j));i=j}return pgs};
 {
  const t=document.createElement('template');t.innerHTML=sl._src=sl._src||sl.innerHTML;const us=[];
  [...t.content.children].forEach(e=>{
   if(e.classList.contains('read'))[...e.children].forEach(q=>(q.textContent.match(/[^.!?…]+(?:[.!?…]+[’”"')\]]*\s*|$)/g)||[]).filter(x=>x.trim()).forEach((x,i)=>us.push({s:x,np:!i})));
   else us.push({h:e.outerHTML})});
  // the reading is set as large as it can be while still sitting whole on the card; only when it cannot at the smallest size does it turn pages
  let z=26;for(const f of [26,25,24,23,22,21,20,19,18.5,18,17.5,17,16.5,16,15.5,15]){z=f;M.style.setProperty('--rf',f+'px');if(fits(us,H))break}sl.style.setProperty('--rf',z+'px');
  sl.innerHTML=(fits(us,H)?[us]:even(us)).map(html).join('')}
 M.remove()}
// the area in view laid out again (the others when they are next turned to), its page kept
function sxPage(){
 const R=$('.sx .hc-read'),c=$('.hcar');if(!R)return;
 [...R.children].forEach(x=>x._at='');sxLay(R.querySelector('.hc-slide.cur'));if(c.show)c.show(c.pg||0)}
const sxOvf=()=>{const R=$('.sx .hc-read');if(!R)return;R.classList.remove('ovf');R.classList.toggle('ovf',R.scrollHeight>R.clientHeight+1)};
addEventListener('resize',()=>{clearTimeout(sxPage.t);sxPage.t=setTimeout(sxPage,150)});if(document.fonts)document.fonts.ready.then(()=>sxPage());
function enCar(){
 clearInterval(enT);const t=$('.en-track');if(!t)return;
 const dots=[...document.querySelectorAll('.en-dots i')],at=()=>Math.round(t.scrollLeft/Math.max(1,t.clientWidth));let hold=0;
 t.addEventListener('scroll',()=>requestAnimationFrame(()=>{const i=at();dots.forEach((d,j)=>d.classList.toggle('on',j===i))}),{passive:true});
 t.addEventListener('pointerdown',()=>{hold=Date.now()},{passive:true});
 if(S.settings.reduce||matchMedia('(prefers-reduced-motion: reduce)').matches||dots.length<2)return;
 enT=setInterval(()=>{if(!t.isConnected)return clearInterval(enT);if(Date.now()-hold<12000||document.hidden)return;t.scrollTo({left:((at()+1)%dots.length)*t.clientWidth,behavior:'smooth'})},6000);
}
// the page keeps room for the bottom bar, whatever its height on this phone
// Tarot's landing: its options sit under the painting, lifted above the menu only on a screen too short to show them
const tarotFit=()=>{const t=$('body.still .tland .tpanel');if(!t)return;t.classList.remove('lift');
 const nav=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navh'))||0;
 if(t.getBoundingClientRect().bottom>innerHeight-nav-12)t.classList.add('lift')};
addEventListener('resize',tarotFit);
const navH=()=>{const n=$('#nav');document.documentElement.style.setProperty('--navh',(n.hidden?0:n.offsetHeight)+'px')};
addEventListener('resize',navH);
// living details: a hero's picture drifts more slowly than the page (parallax), and Home's header folds into a slim bar
let driftF=0;
// a page's head stands still while the page rises over it, fading as the first card reaches it
// a page's line beneath its title belongs to its head, so it holds still with it
function stayHeads(){document.querySelectorAll('.mnp>.mn-sub').forEach(e=>{const t=e.parentElement.querySelector(':scope>.mn-hd .mn-t');if(t)t.appendChild(e)})}
// every page ends the same height above the screen's foot (--t-foot in styles.css: just above the Moon's rim in the
// night's painting), so once a page is read to its end the Moon shows over the menu. The page is measured as it is
// drawn: the space it already leaves beneath its last words and boxes counts towards it, and where it leaves more, its
// own padding at the foot gives way. Kassandra's chamber and a sign's page (one screen) keep their own foot.
function footFit(){
 const app=$('#app'),pg=app.firstElementChild;if(!pg||pg.matches('.kz,.ob,.sx')){app.style.removeProperty('padding-bottom');return}
 if(footRO&&footFit.pg!==pg){footRO.disconnect();footRO.observe(pg);footFit.pg=pg}
 const pr=document.createElement('i');pr.style.cssText='position:absolute;visibility:hidden;width:0;height:var(--t-foot)';app.append(pr);const T=pr.offsetHeight;pr.remove();
 const sy=scrollY;app.style.setProperty('padding-bottom','0px','important');(footFit.cut||[]).forEach(e=>e.style.removeProperty('padding-bottom'));footFit.cut=[];
 let last=-1e9;
 // what scrolls inside a night page's own panel ends, for the page, at the panel's foot
 const ms=pg.querySelector('.mn-scroll'),msB=ms?ms.getBoundingClientRect().bottom:Infinity;
 if(ms&&ms.scrollHeight>ms.clientHeight+1){app.style.removeProperty('padding-bottom');if(scrollY!==sy)scrollTo(0,sy);return}
 for(const e of pg.querySelectorAll('*')){const r=e.getBoundingClientRect(),bot=ms&&e!==ms&&ms.contains(e)?Math.min(r.bottom,msB):r.bottom;if(!r.width||!r.height||bot<=last)continue;
  const c=getComputedStyle(e);if(c.position==='fixed'||c.visibility==='hidden'||+c.opacity===0||(e.tagName==='IMG'&&c.position==='absolute'))continue;
  const own=!e.children.length||/^(IMG|svg|CANVAS|INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.tagName)||parseFloat(c.borderBottomWidth)>0||c.backgroundImage!=='none'||c.backgroundColor!=='rgba(0, 0, 0, 0)'||[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
  if(own)last=bot}
 if(last<-1e8){if(scrollY!==sy)scrollTo(0,sy);return}
 // the page's end is found by measuring, adjusted until it lies the right height below the last words (the margins of
 // a page and of its sheets fold into one another, so the space added is not always the space gained): more room is
 // added beneath the column, or where there is too much, the padding of whatever reaches lowest gives way
 const end=()=>document.documentElement.scrollHeight-(last+sy);let pad=0,F=end();
 for(let k=0;k<6&&Math.abs(F-T)>1;k++){
  if(F<T){pad+=T-F;app.style.setProperty('padding-bottom',Math.round(pad)+'px','important')}
  else if(pad>0){pad=Math.max(0,pad-(F-T));app.style.setProperty('padding-bottom',Math.round(pad)+'px','important')}
  else{let low=pg,lb=-1e9;for(const e of [pg,...pg.querySelectorAll('*')]){const b=e.getBoundingClientRect().bottom;if(b>lb+.5&&(parseFloat(getComputedStyle(e).paddingBottom)||0)>0){lb=b;low=e}}
   const p0=parseFloat(getComputedStyle(low).paddingBottom)||0;if(!p0)break;low.style.setProperty('padding-bottom',Math.max(0,Math.round(p0-(F-T)))+'px','important');footFit.cut=(footFit.cut||[]).concat(low)}
  F=end()}
 // the reader stays where they were while the page was measured
 if(scrollY!==sy)scrollTo(0,sy)}
// measured again whenever the page changes size (its pictures and fonts arriving, a reading opening)
let footF=0;const footSoon=()=>{if(!footF)footF=requestAnimationFrame(()=>{footF=0;footFit()})};
const footRO=window.ResizeObserver?new ResizeObserver(footSoon):null;
addEventListener('resize',footSoon);
if(document.fonts)document.fonts.ready.then(footSoon);
function stayFade(y=scrollY){document.querySelectorAll('.stay').forEach(e=>{e.style.opacity=Math.max(0,1-y/Math.max(1,e.offsetHeight*.8)).toFixed(3);e.style.pointerEvents=y>e.offsetHeight*.5?'none':''})}
function drift(){
 const y=scrollY;document.body.classList.toggle('scrolled',y>120);stayFade(y);
 if(S.settings.reduce||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 document.querySelectorAll('.parallax').forEach(el=>{el.style.transform=`translate3d(0,${(Math.min(y,700)*.22).toFixed(1)}px,0)`});
}
addEventListener('scroll',()=>{if(!driftF)driftF=requestAnimationFrame(()=>{driftF=0;drift()})},{passive:true});
function drawCards(){const T=V.tarot,sp=SPREADS[T.spread];
 T.drawn=T.picks.map((i,x)=>{const r=new Uint8Array(1);crypto.getRandomValues(r);return Object.assign({},T.deck[i],{pos:sp.p[x],rv:r[0]<64,shown:false})});
 T.stage='read';T.savedId=null;T.note='';V.tpop=null;render();window.scrollTo(0,0)}
function reveal(){
 const k=dkey();if(S.revealed[k])return;
 const sc=$('.scene');if(sc&&!S.settings.reduce)sc.classList.add('rise');
 S.days[k]=todayCard().id;S.revealed[k]=true;save();syncFortune(k);
 if(S.settings.reduce||matchMedia('(prefers-reduced-motion: reduce)').matches)return render();
 setTimeout(()=>{sc&&sc.classList.add('flipped');setTimeout(render,1500)},450);
}
function bookmark(kind,ref,data){
 const i=S.bookmarks.findIndex(b=>b.kind===kind&&b.ref===ref);
 if(i>=0){S.bookmarks.splice(i,1);C.deleteBookmark&&C.deleteBookmark(kind,ref);toast(kind==='horoscope'?'Removed from My Library':kind==='event'?'Removed from Saved Events':'Removed from your journal')}
 else{const b={id:uuid(),kind,ref,data,at:new Date().toISOString()};S.bookmarks.push(b);C.saveBookmark&&C.saveBookmark(b).then(()=>{b.sy=true;save()});toast(kind==='horoscope'?'Kept in My Library':kind==='event'?'Saved to Saved Events':'Saved to your journal')}
 save();render();
}
// kept in the journal if it is not already, so a reflection can be written about it; its journal key comes back
function ensureBook(kind,ref,data){
 if(!isSaved(kind,ref)){const b={id:uuid(),kind,ref,data,at:new Date().toISOString()};S.bookmarks.push(b);save();C.saveBookmark&&C.saveBookmark(b).then(()=>{b.sy=true;save()})}
 return `bk:${kind}:${ref}`;
}
const horoData=(sign,cat,period,key)=>{const h=horoscope(sign,cat,period);return {sign,cat,period,key,start:h.per.start,end:h.per.end,body:h.body,focus:h.focus}};
const evData=e=>({name:e.name,date:e.date.toISOString(),when:evWhen(e)});
async function placeSearch(id){
 const inp=$('#'+id+'-q'),q=inp?inp.value.trim():'';const P=V.places[id]={q};
 if(q.length<2){P.err='Type at least two letters of the place.';return render()}
 P.busy=true;render();
 try{const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=${encodeURIComponent(q)}`);const j=await r.json();P.results=(j.results||[]).filter(x=>x.timezone)}
 catch(e){P.err='The place search is unavailable right now. Check your connection and try again.'}
 P.busy=false;render();
}
function connOpen(c){
 if(c.kind==='zodiac'){V.love={a:c.data.a,b:c.data.b,done:true};return go('discover','affinity')}
 if(c.kind==='resonance'){V.res={a:c.data.a,b:c.data.b,done:true};return go('discover','resonance')}
 V.syn=Object.assign({},c.data.them,{done:true});go('discover','synastry');
}
function saveConn(kind){
 let data,dupe;
 if(kind==='zodiac'){const a=V.love.a||S.sign,b=V.love.b;data={a,b};dupe=S.conns.find(c=>c.kind==='zodiac'&&c.data.a===a&&c.data.b===b)}
 else if(kind==='resonance'){data={a:V.res.a||S.fullName||S.name,b:V.res.b};dupe=S.conns.find(c=>c.kind==='resonance'&&c.data.a===data.a&&c.data.b===data.b)}
 else{const Y=V.syn;data={them:{name:Y.name,date:Y.date,time:Y.unk?'':Y.time,unk:!!Y.unk||!Y.time,place:Y.place,lat:Y.lat,lon:Y.lon,tz:Y.tz}};dupe=S.conns.find(c=>c.kind==='synastry'&&(c.data.them||{}).date===Y.date&&(c.data.them||{}).name===Y.name)}
 if(dupe)return toast('Already in your journal');
 const c={id:uuid(),kind,name:kind==='synastry'?(V.syn.name||''):'',data,note:'',at:new Date().toISOString()};
 S.conns.push(c);save();C.saveConnection&&C.saveConnection(c).then(()=>{c.sy=true;save()});
 if(kind==='zodiac'&&C.saveMatch)C.saveMatch(data.a,data.b);
 toast('Saved to your journal');render();
}
function exportData(){
 const blob=new Blob([JSON.stringify({exported:new Date().toISOString(),account:S.email,profile:{sign:S.sign,name:S.name,fullName:S.fullName,altName:S.altName,birth:S.birth,birthConsent:S.birthConsent,settings:S.settings,notifications:S.notif},whispers:Object.keys(S.revealed).sort().map(d=>({day:d,card:cardFor(d).title,saved:S.saved.some(x=>x.date===d),note:S.notes[d]||''})),journal:S.journal,tarotReadings:S.readings,connections:S.conns,dreams:dreams(),bookmarks:S.bookmarks.filter(b=>b.kind!=='dream'),kassandra:S.kcur||[]},null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`kosmia-data-${dkey()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
function signOutLocal(){try{localStorage.removeItem(KEY);localStorage.removeItem('kosmia.h')}catch(x){}S=fresh();V.joinSign='';V.paint={};V.auth='in';V.ob='welcome';KS.msgs=[];V.sec='welcome';history.replaceState(null,'','/');render();window.scrollTo(0,0)}
function openEntry(k){V.jkey=k;V.jmenu=false;go('tarot','entry')}
// start a page of free writing; it is let go again if it is left blank
function jNew(){const j={id:uuid(),day:dkey(),kind:'reflection',title:'',body:'',at:new Date().toISOString()};S.journal.push(j);save();openEntry('j:'+j.id);const t=$('#jet');if(t)t.focus()}
// re-rendering a search keeps the caret where the reader is typing
function refocus(id){const el=$('#'+id);if(el){el.focus();const n=el.value.length;try{el.setSelectionRange(n,n)}catch(e){}}}

document.addEventListener('submit',e=>{if(e.target.id==='kas-f'){e.preventDefault();const i=$('#kas-in');const v=i.value;i.value='';kasSend(v)}});
// a light tap under the finger where the device allows it: vibration on phones that have it, and on iPhone (iOS 17.4+) the
// tap a hidden switch gives when it is toggled in answer to a touch. It never fires with reduced motion or when switched off.
const HAP={el:null};
function haptic(kind){
 if(S.settings.reduce||S.settings.haptics===false)return;
 try{if(navigator.vibrate){navigator.vibrate(kind==='done'?[10,50,16]:6);return}
  if(!HAP.el){const l=document.createElement('label');l.setAttribute('aria-hidden','true');l.style.cssText='position:fixed;left:-99px;top:-99px;opacity:0;pointer-events:none';const i=document.createElement('input');i.type='checkbox';i.setAttribute('switch','');l.append(i);document.body.append(l);HAP.el=l}
  HAP.el.click();if(kind==='done')setTimeout(()=>HAP.el&&HAP.el.click(),90)}catch(e){}
}
const HAP_DONE=['hkeep','hlet','hwish','reveal','hdream','hnodream','hrelkeep','hnonight','hnowish'];
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-go],[data-nav],[data-act],[data-sign],[data-sign2],[data-period],[data-pick],[data-planet],[data-calview],[data-ctab],[data-ins]');
 if(!t)return;
 haptic(HAP_DONE.includes(t.dataset.act)?'done':'tap');
 if(t.dataset.go)return go(t.dataset.go,t.dataset.t||null);
 if(t.dataset.nav)navFresh(t.dataset.nav);
 if(t.dataset.nav==='journal')return go('tarot','journal');
 if(t.dataset.nav==='calendar')return go('discover','calendar');
 if(t.dataset.nav)return go(t.dataset.nav);
 if(t.dataset.period&&!t.dataset.act){V.period=t.dataset.period;render();
  // on a sign's page the new reading opens at its start
  if(t.closest('.hsp')&&V.sec==='horoscope'){const r=$('.hsp .hc-read');if(r){r.scrollTop=0;if(r.getBoundingClientRect().top<0)window.scrollTo(0,0)}}return}
 if(t.dataset.calview){V.cal.view=t.dataset.calview;return render()}
 if(t.dataset.ctab){V.chartTab=t.dataset.ctab;return render()}
 if(t.dataset.ins){V.insTab=t.dataset.ins;return render()}
 if(t.dataset.planet){V.chartSel=t.dataset.planet;V.chartTab='chart';return render()}
 if(t.dataset.pick!==undefined){const T=V.tarot,i=Number(t.dataset.pick),n=SPREADS[T.spread].p.length,x=T.picks.indexOf(i);if(x>=0)T.picks.splice(x,1);else if(T.picks.length<n)T.picks.push(i);render();if(T.picks.length===n)setTimeout(drawCards,450);return}
 if(t.dataset.sign&&!t.dataset.act){
  const id=t.dataset.sign;
  if(onboarding())return pickSign(id);
  if(V.sec==='settings'){S.sign=id;save();syncProfile();toast('Your sign is now '+sg(id).name);return render()}
 }
 const a=t.dataset.act;if(!a)return;
 if(a==='jint')return;
 if(a==='back'){if(EMB)return parent.postMessage('kosmia-close',location.origin);return goBack()}
 if(a==='xclose'){if(e.target.id==='xsheet')closeSheet();return}
 if(a==='chartopen'){V.chartOpen=true;V.chartInterp=t.dataset.k==='interp';V.chartTab=V.chartInterp?'chart':t.dataset.k;render();return window.scrollTo(0,0)}
 if(a==='reveal')return reveal();
 if(a==='rmphoto'){delete S.photo;save();render();return toast('Your picture has been removed.')}
 if(a==='gtab'){if(t.dataset.k!==tab())go('discover',t.dataset.k,{replace:true});return}
 // onboarding
 if(a==='obnext'||a==='obstep'){const to=t.dataset.to;
  if(to==='account'||to==='signin'){const em=$('#em');if(em)S.email=em.value.trim()}
  {const n=$('#obn');if(n)S.name=n.value.trim()}
  V.ob=to;render();return window.scrollTo(0,0)}
 if(a==='enter')return enterApp();
 if(a==='bdayopen'||a==='bdayclose'){V.bdayOpen=a==='bdayopen';return render()}
 if(a==='obbirth'||a==='obskip')return obBirth(a==='obbirth');
 if(a==='pweye'){const i=$('#'+t.dataset.for);if(i){i.type=i.type==='password'?'text':'password';t.setAttribute('aria-label',i.type==='password'?'Show password':'Hide password')}return}
 if(a==='resend'){if(C.resend)C.resend(S.email).then(()=>toast('A new link is on its way.'),x=>toast(authMsg(x)));return}
 // Kassandra
 if(a==='kasmic')return voiceRec('kas');
 if(a==='kasfocus'){const i=$('#kas-in');if(i)i.focus();return}
 if(a==='kasask'){V.tpop=null;V.hpop=false;if(V.sec==='home'&&pathStep()==='reflect')V.ret={step:'reflect',label:'Reflect'};if(V.sec!=='kassandra')V.kasFrom={sec:V.sec,t:tab()};if(V.sec!=='kassandra')go('kassandra','chat');return kasSend(t.dataset.q)}
 if(a==='kasnew')return kasNew();
 if(a==='kasdel'){const i=S.bookmarks.findIndex(b=>b.id===t.dataset.id);if(i>=0){const b=S.bookmarks[i];S.bookmarks.splice(i,1);save();C.deleteBookmark&&C.deleteBookmark('chat',b.ref)}return render()}
 // horoscope
 if(a==='tohoroscope'&&V.sec==='home'&&!EMB){S.readDay=dkey();save();V.xnext='whisper';return openSheet('horoscope','sign',{sign:t.dataset.sign&&t.dataset.sign!==S.sign?t.dataset.sign:''})}
 if(a==='tohoroscope'){V.exploreSign=t.dataset.sign&&t.dataset.sign!==S.sign?t.dataset.sign:null;V.hcat=t.dataset.cat||'overview';if(t.dataset.period)V.period=t.dataset.period;else if(V.sec!=='horoscope')V.period='daily';return go('horoscope','sign')}
 if(a==='hpg'){const c=$('.hcar');return c&&c.show&&c.show(+t.dataset.pg,+t.dataset.pg<(c.pg||0)?-1:1)}
 if(a==='hcat'){const c=$('.hcar');if(c&&c.go)return c.go(HCATS.findIndex(x=>x[0]===t.dataset.k),t.dataset.dir?+t.dataset.dir:0);V.hcat=t.dataset.k;render();const r=$('.hread');return r&&r.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}
 if(a==='hspeak'){const ex=V.exploreSign||S.sign;return speakText(horoscope(ex,V.hcat,V.period).body)}
 if(a==='spkopen'){V.spk=true;return render()}
 if(a==='wlnext'){V.wl=(V.wl||0)+1;if(V.wl>=3){S.welcomed=true;V.wl=0;save()}return render()}
 if(a==='wlskip'){S.welcomed=true;V.wl=0;save();return render()}
 if(a==='skymove'){const T=$('.sky-t');if(!T)return;const n=T.children.length,i=Math.round(T.scrollLeft/Math.max(1,T.clientWidth));return T.scrollTo({left:((i+ +t.dataset.d+n)%n)*T.clientWidth,behavior:'smooth'})}
 if(a==='skd'){V.skd=t.dataset.id;return render()}
 if(a==='skdx'){if(e.target.closest('.cp-in')&&!e.target.closest('.cp-x'))return;V.skd=null;return render()}
 if(a==='skzmove'){const T=$('.skz-track');if(!T)return;const n=T.children.length,w=skzStep(T),i=Math.round(T.scrollLeft/w);return T.scrollTo({left:Math.min(n-1,Math.max(0,i+ +t.dataset.d))*w,behavior:'smooth'})}
 if(a==='skdwrite'){const j={id:uuid(),day:dkey(),kind:'reflection',title:t.dataset.t,body:'',at:new Date().toISOString(),data:{src:'sky',link:{k:'',t:'Sky — '+plain(t.dataset.t)}}};S.journal.push(j);save();V.skd=null;openEntry('j:'+j.id);const x=$('#jet');if(x)x.focus();return}
 if(a==='pgcat'){const g=t.dataset.g,l=PGC[g].map(x=>x[0]),f=l.indexOf(pgCur(g)),n=l.indexOf(t.dataset.k);if(n<0||n===f)return;V.pdir=n>f?1:-1;S.pgc=S.pgc||{};S.pgc[g]=t.dataset.k;save();return render()}
 if(a==='jsub'){V.jsub=t.dataset.k||null;if(!V.jsub)V.jsearch=null;return render()}
 if(a==='spkclose'){if(e.target.closest('.cp-in')&&!e.target.closest('.cp-x'))return;V.spk=false;return render()}
 if(a==='hreflect'){const [sign,cat,period,key]=t.dataset.ref.split('/');return openEntry(ensureBook('horoscope',t.dataset.ref,horoData(sign,cat,period,key)))}
 if(a==='bookhoro'){const [sign,cat,period,key]=t.dataset.ref.split('/');return bookmark('horoscope',t.dataset.ref,horoData(sign,cat,period,key))}
 if(a==='setsign'){S.sign=t.dataset.sign;V.exploreSign=null;save();syncProfile();toast('Your sign is now '+sg(S.sign).name);return render()}
 // whispers and tarot
 if(a==='whelp'){V.whelp=!V.whelp;return render()}
 if(a==='sharecard')return shareCard(t);
 if(a==='sharego'){const s=V.share;if(s)navigator.share({files:[s.file],title:'Kosmia',text:s.caption}).catch(()=>{});return}
 if(a==='shareclose'){if(e.target.closest('.cp-in')&&!e.target.closest('.cp-x'))return;URL.revokeObjectURL(V.share.url);V.share=null;return render()}
 if(a==='share'){const c=todayCard(),txt=`“${c.msg}” (${c.title}, my Whisper from Kosmia)`;
  if(navigator.share)return navigator.share({title:'Kosmia',text:txt,url:location.origin}).catch(()=>{});
  return (navigator.clipboard?navigator.clipboard.writeText(txt+' '+location.origin):Promise.reject()).then(()=>toast('Copied to share'),()=>toast('Sharing is not available here'))}
 if(a==='savecard'){const k=dkey(),c=todayCard(),i=S.saved.findIndex(x=>x.date===k);if(i>=0){S.saved.splice(i,1);toast('Removed from your journal')}else{S.saved.push({id:c.id,date:k});toast('Saved to your journal')}save();syncFortune(k);return render()}
 // journal
 if(a==='jopen')return openEntry(t.dataset.k);
 if(a==='jsearch'){V.jsearch=V.jsearch==null?'':null;render();return refocus('jq')}
 if(a==='jfilter'){V.jfilter=t.dataset.k;return render()}
 if(a==='sheet'){V.sheet=t.dataset.k;return render()}
 if(a==='sheetclose'){if(e.target.closest('.pop-box')&&!e.target.closest('.pop-x'))return;V.sheet=null;return render()}
 // a reflection on the day written for the reader, its theme as the page's title
 if(a==='pzspeak')return speakText(myDay().body);
 if(a==='hseek'){S.settings.seek=t.dataset.k;save();syncProfile();V.hstep=null;V.hdir=1;render();return window.scrollTo(0,0)}
 if(a==='hcarry'){const v=(t.dataset.v||($('#hpcarry')||{}).value||'').trim(),k=dkey();if(!v){toast('Choose one, or write a few words');const x=$('#hpcarry');if(x)x.focus();return}
  // in the evening it is carried through the night, and the path moves on to whatever has not been done yet
  const ev=evening(),f=ev?'ncarry':'carry';S[f]=S[f]||{};S[f][k]=v.slice(0,90);Object.keys(S[f]).sort().slice(0,-40).forEach(x=>delete S[f][x]);save();V.hstep=ev?null:'held';V.hdir=1;render();return window.scrollTo(0,0)}
 if(a==='hcarryx'){const k=dkey();if((S.carry||{})[k])delete S.carry[k];else delete (S.ncarry||{})[k];save();return render()}
 if(a==='hnext')return pathMove(1);
 if(a==='hprev')return pathMove(-1);
 if(a==='hreturn'){const r=V.ret;V.ret=null;if(r)V.hstep=r.step;return go('home')}
 if(a==='hwish'){const v=(($('#hpwish')||{}).value||'').trim(),ch=chapterAt();if(!v){toast('Write a few words first');const x=$('#hpwish');if(x)x.focus();return}
  const j={id:uuid(),day:dkey(),kind:'reflection',title:`${WISH} in ${sIdx(ch.sign).name}`,body:v,at:new Date().toISOString()};S.journal.push(j);save();C.saveJournal&&C.saveJournal(j);
  V.hstep=null;render();window.scrollTo(0,0);return toast('Planted. The Moon will bring it back to you')}
 if(a==='hnowish'){const ch=chapterAt();S.intentAsk=ch?ch.key:'';save();V.hstep=null;render();return window.scrollTo(0,0)}
 if(a==='hlet'||a==='hrelkeep'||a==='hnonight'){const x=$('#hprel'),v=((x||{}).value||'').trim(),k=dkey();
  if(a!=='hnonight'&&!v){toast('Write a few words first');if(x)x.focus();return}
  if(a==='hrelkeep'){const j={id:uuid(),day:k,kind:'reflection',title:LETGO,body:v,at:new Date().toISOString()};S.journal.push(j);C.saveJournal&&C.saveJournal(j)}
  S.released=k;save();const done=()=>{V.hstep='held';render();window.scrollTo(0,0);if(a==='hlet')toast('Let go');if(a==='hrelkeep')toast('Kept in your Journal')};
  if(a==='hlet'&&x&&!S.settings.reduce){x.classList.add('hp-gone');x.value='';return setTimeout(done,1400)}return done()}
 if(a==='hletter'){const ch=chapterAt();V.letter=ch&&ch.day<=3&&V.sec==='home'?lastChapter(ch)||ch:ch;return render()}
 if(a==='letterclose'){if(e.target.closest('.pop-box')&&!e.target.closest('.pop-x'))return;V.letter=null;return render()}
 if(a==='hgo'){const o=pathOrder(dkey());V.hdir=o.indexOf(t.dataset.k)<o.indexOf(pathStep())?-1:1;V.hstep=t.dataset.k;render();return window.scrollTo(0,0)}
 if(a==='hdream'){S.dreamAsk=dkey();save();return openSheet('discover','new-dream')}
 if(a==='hnodream'){S.dreamAsk=dkey();save();V.hstep=null;render();return window.scrollTo(0,0)}
 if(a==='hkeep'){const v=($('#hpta')||{}).value||'',k=dkey();if(!v.trim()){toast('Write a few words first');const x=$('#hpta');if(x)x.focus();return}
  S.notes[k]=v.trim();save();syncFortune(k);V.hstep=askNight(k)?'night':'held';render();window.scrollTo(0,0);return toast('Kept in your Journal')}
 if(a==='kasgo')return kasVeil(()=>go('kassandra'));
 if(a==='pzmore'){V.pzOpen=true;const c=t.closest('.pz');if(c){c.classList.remove('fold');t.remove();return}return render()}
 if(a==='jnew'){const j={id:uuid(),day:dkey(),kind:'reflection',title:myDay().focus,body:'',at:new Date().toISOString()};S.journal.push(j);save();openEntry('j:'+j.id);const x=$('#jet');if(x)x.focus();return}
 if(a==='ne'){const k=t.dataset.k,today=dkey();V.sheet=null;
  if(k==='card'){if(!S.revealed[today]){toast('Reveal today’s Whisper first');return go('tarot','whisper')}return openEntry('fortune:'+today)}
  if(k==='reading'){V.sheet='reading';return render()}
  if(k==='horoscope'){const h=horoscope(S.sign,'overview','daily'),ref=`${S.sign}/overview/daily/${h.per.key}`;return openEntry(ensureBook('horoscope',ref,horoData(S.sign,'overview','daily',h.per.key)))}
  if(k==='event'){V.sheet='event';return render()}
  if(k==='moon'){const now=new Date(),ph=K.lunarPhases(new Date(+now-16*DAY),now),e=ph[ph.length-1];if(!e)return;return openEntry(ensureBook('event',evRef(e),evData(e)))}
  if(k==='ev'){const e=upcoming().find(x=>evRef(x)===t.dataset.ref);if(e)openEntry(ensureBook('event',evRef(e),evData(e)));return}
  if(k==='dream')return go('discover','new-dream');
  return jNew()}
 if(a==='jmenu'){V.jmenu=!V.jmenu;return render()}
 if(a==='jdelentry'){const p=jFind(V.jkey);if(!p)return;if(JS&&JS.p===JE){clearTimeout(JS.t);JS=null}JE=null;V.jmenu=false;jRemove(p);go('tarot','journal');return toast('Page torn out','jundo')}
 if(a==='jnotebook'){const k=V.jkey;go('tarot','notebook');V.jpage=jAt(k,0);V.jfresh=false;return render()}
 if(a==='jfmt')return jfmt(t.dataset.k);
 if(a==='jsavenow'){if(JE&&JS&&JS.p===JE)jflushSave();save();const s=$('#jsaved');if(s)s.textContent='Saved';return toast('Saved to your journal')}
 if(a==='jprompt'){const x=$('#je');if(!x)return;const q=(PROMPTS[(JE||{}).t]||PROMPTS.j)[+t.dataset.i];x.value=(x.value.trim()?x.value.replace(/\s+$/,'')+'\n\n':'')+q+'\n';x.dispatchEvent(new Event('input',{bubbles:true}));x.focus();x.setSelectionRange(x.value.length,x.value.length);return}
 if(a==='jcaltog'){V.jcalOn=!V.jcalOn;return render()}
 if(a==='jcalm'){V.jcal={month:t.dataset.k,day:''};return render()}
 if(a==='jcald'){V.jcal.day=V.jcal.day===t.dataset.k?'':t.dataset.k;return render()}
 if(a==='inspop'){V.insPop=true;return render()}
 if(a==='inspopclose'){if(e.target.closest('.pop-box')&&!e.target.closest('.pop-x'))return;V.insPop=false;return render()}
 if(a==='jnameedit'){V.jnameEdit=true;render();const x=$('#jn');if(x){x.focus();x.select()}return}
 if(a==='jedit'){const pages=journalPages(),i=jIdx(pages),p=pages[i];if(!p)return;
  if(V.jw&&V.jw.key===jKey(p)){const k=V.jw.key;jDone();V.jpage=jAt(k,i);return render()}
  V.jw={key:jKey(p),p};render();const x=$('.jbook #ed')||$('.jbook #jb');if(x){x.focus({preventScroll:true});const n=x.value.length;x.setSelectionRange(n,n)}return}
 if(a==='jexpand'){V.jx=!V.jx;return render()}
 if(a==='jdel'){const pages=journalPages(),i=jIdx(pages),p=pages[i];if(!p||p.t==='cover'||p.t==='new')return;
  if(V.jw&&V.jw.key===jKey(p)){if(JS&&JS.p===V.jw.p){clearTimeout(JS.t);JS=null}V.jw=null}
  return jrip(p,()=>{jRemove(p);V.jpage=Math.min(i,journalPages().length-1);render();toast('Page torn out','jundo')})}
 if(a==='jundo'){if(!JU)return;const u=JU;JU=null;clearTimeout(u.t);u.undo();save();$('#toast').hidden=true;if(V.sec==='tarot'&&tab()==='notebook')V.jpage=jAt(u.key,V.jpage);render();return toast('Page put back')}
 if(a==='jflip'){const n=journalPages().length;return jflip(t.dataset.to==='last'?n-1:jIdx(journalPages())+(+t.dataset.d))}
 // discover
 if(a==='domatch'){V.love.a=($('#za')||{}).value||S.sign;V.love.b=($('#zb')||{}).value;if(!V.love.b)return toast('Choose their sign');V.love.done=true;render();const r=$('#affres');if(r)r.scrollIntoView({behavior:'smooth',block:'start'});return}
 if(a==='saveconn')return saveConn(t.dataset.kind);
 if(a==='doresonance'){V.res={a:$('#ra').value.trim(),b:$('#rb').value.trim(),done:true};if(!N.clean(V.res.a)||!N.clean(V.res.b)){V.res.done=false;toast('Enter both names')}return render()}
 if(a==='dosyn'){readSyn();if(!V.syn.date)return toast('Add their date of birth');V.syn.done=true;return render()}
 if(a==='openconn'){const c=S.conns.find(x=>x.id===t.dataset.id);return c&&connOpen(c)}
 if(a==='lpgo'){const d=($('#lpd')||{}).value;if(!/^\d{4}-\d\d-\d\d$/.test(d||''))return toast('Add a date of birth');V.lpOther=d;return render()}
 if(a==='cygo'){const d=($('#cyd')||{}).value;if(!/^\d{4}-\d\d-\d\d$/.test(d||''))return toast('Add a date of birth');V.cyOther=d;return render()}
 if(a==='nwgo'){const n=(($('#fn2')||{}).value||'').trim();if(!N.clean(n))return toast('Enter a full name');V.oName=n;return render()}
 if(a==='nsearch'){const k=t.dataset.k;V.ns[k]=true;if(k==='chart'){V.oBirth=null;V.oChart=null;V.oBirthName='';V.oDraft=null;V.chartSel=null}if(k==='lp')V.lpOther='';if(k==='cy')V.cyOther='';if(k==='nw')V.oName='';render();return window.scrollTo(0,0)}
 if(a==='nsmine'){V.ns[t.dataset.k]=false;if(t.dataset.k==='chart')V.chartSel=null;render();return window.scrollTo(0,0)}
 if(a==='fevents'){V.filter.events=t.dataset.k;return render()}
 if(a==='bookev'){const e=upcoming().find(x=>evRef(x)===t.dataset.ref)||(K?K.events(new Date(Date.parse(t.dataset.ref.split(':').pop()+':00Z')-DAY),new Date(Date.parse(t.dataset.ref.split(':').pop()+':00Z')+DAY)).find(x=>evRef(x)===t.dataset.ref):null);if(e)bookmark('event',t.dataset.ref,evData(e));return}
 if(a==='evtoggle'){V.evOpen=V.evOpen===t.dataset.ref?null:t.dataset.ref;return render()}
 if(a==='evgo'){const e=upcoming().find(x=>evRef(x)===t.dataset.ref);if(!e)return;V.evOpen=t.dataset.ref;V.cal.view='list';V.cal.month=(e.dateOnly?e.date.toISOString().slice(0,10):dkey(e.date)).slice(0,7);go('discover','calendar');
  const el=document.getElementById('ev-'+t.dataset.ref.replace(/[^\w-]/g,''));if(el)requestAnimationFrame(()=>el.scrollIntoView({block:'center'}));return}
 if(a==='calmonth'){V.cal.month=t.dataset.k;V.cal.day='';return render()}
 if(a==='calday'){V.cal.day=t.dataset.k;return render()}
 if(a==='libgo'){V.lib={tab:t.dataset.tab,q:t.dataset.q||''};return go('discover','library')}
 if(a==='libtab'){V.lib.tab=t.dataset.k;return render()}
 if(a==='dreamopen'){V.dreamId=t.dataset.id;return go('discover','dream')}
 if(a==='dmic'){if(!C.user)return toast('Sign in to describe your dream by voice');const x=$('#dt');if(x)V.dream.text=x.value;return voiceRec('dream')}
 if(a==='dmood'){const x=$('#dt');if(x)V.dream.text=x.value;V.dream.mood=V.dream.mood===t.dataset.k?'':t.dataset.k;return render()}
 if(a==='dsym'){const x=$('#dt');if(x)V.dream.text=x.value;const s=V.dream.symbols,i=s.indexOf(t.dataset.k);if(i>=0)s.splice(i,1);else s.push(t.dataset.k);return render()}
 if(a==='dgo')return interpretDream();
 if(a==='placesearch'){if(t.dataset.id==='syn')readSyn();else readBirth();return placeSearch(t.dataset.id)}
 if(a==='placepick'){const P=V.places[t.dataset.id],r=P.results[+t.dataset.i],obj=t.dataset.id==='syn'?V.syn:t.dataset.id==='other'?V.oDraft:V.birthDraft;
  if(t.dataset.id==='syn')readSyn();else readBirth();
  Object.assign(obj,{place:[r.name,r.admin1,r.country].filter(Boolean).join(', '),lat:r.latitude,lon:r.longitude,tz:r.timezone});V.places[t.dataset.id]={};return render()}
 if(a==='savebirth'&&t.dataset.other){readBirth();const b=V.oDraft;if(!b.date)return toast('Add their date of birth');
  V.oBirth=Object.assign({},b,{time:b.unk?'':b.time});V.oBirthName=b.name||'';delete V.oBirth.name;V.oChart=chartOf(V.oBirth);V.oDraft=null;V.chartOpen=true;V.chartSel=null;V.chartTab='chart';render();return window.scrollTo(0,0)}
 if(a==='savebirth'){readBirth();const b=V.birthDraft;if(!b.date)return toast('Add your date of birth');{const an=$('#an'),ym=$('#ym');if(an)S.altName=an.value.trim();if(ym)S.settings.yMode=ym.value}
  if(b.name!=null)S.fullName=b.name.trim();S.birth=Object.assign({},b,{time:b.unk?'':b.time});delete S.birth.name;S.birthConsent=$('#bcons').checked;V.birthDraft=null;V.cpEdit=false;save();syncProfile();toast(S.birthConsent?'Saved to your account':'Saved on this device');return render()}
 if(a==='savenames'){S.fullName=$('#fn').value.trim();const an=$('#an'),ym=$('#ym');if(an)S.altName=an.value.trim();if(ym)S.settings.yMode=ym.value;save();syncProfile();if(!N.clean(S.fullName))toast('Enter your full name');return render()}
 // profile and account
 if(a==='savename'){S.name=$('#nm').value.trim();save();syncProfile();toast('Saved');return render()}
 if(a==='signout'){Promise.resolve(C.user&&C.signOut()).catch(()=>{});V.auth='in';V.ob='welcome';V.sec='welcome';history.replaceState(null,'','/');render();window.scrollTo(0,0);return toast('Signed out. Everything you have kept will be here when you return.')}
 if(a==='export')return exportData();
 if(a==='delbirth'){if(!confirm('Delete your birth details from this device and your account?'))return;S.birth=fresh().birth;S.birthConsent=false;V.birthDraft=null;save();syncProfile();toast('Birth details deleted');return render()}
 if(a==='askdel'){V.confirmDel=true;return render()}
 if(a==='canceldel'){V.confirmDel=false;return render()}
 if(a==='delacct'){if(($('#delc').value||'').trim().toUpperCase()!=='DELETE')return toast('Type DELETE to confirm');t.disabled=true;
  if(!C.user){V.confirmDel=false;signOutLocal();return toast('Everything has been deleted from this device')}
  C.deleteAccount().then(()=>{V.confirmDel=false;signOutLocal();toast('Your account has been deleted')},x=>{t.disabled=false;toast(/function|does not exist|schema/i.test(x.message||'')?'Account deletion is not available yet. Please try again later.':(x.message||'Could not delete the account'))});return}
 if(a==='toauth'){V.joinSign=S.sign;V.ob=S.email?'signin':'account';V.sec='welcome';render();return window.scrollTo(0,0)}
 if(a==='forgot'){const em=$('#em'),email=em?em.value.trim():'';
  if(!/^\S+@\S+\.\S+$/.test(email)){toast('Enter your email first');if(em)em.focus();return}
  C.resetPassword(email).then(()=>toast('If an account exists for that email, a reset link is on its way.'),x=>toast(authMsg(x)));return}
 if(a==='setpw'){const v=$('#npw').value;if(v.length<8)return toast('Use at least 8 characters');
  t.disabled=true;C.updatePassword(v).then(()=>{toast('Password updated');if(V.sec==='reset')go('home','today',{replace:true});else{t.disabled=false;$('#npw').value=''}},x=>{t.disabled=false;toast(authMsg(x))});return}
 const T=V.tarot;
 if(a==='tspreadgo'){newReading();V.tarot.spread=t.dataset.k;return go('tarot','reading')}
 if(a==='tspreadback')return go('tarot','spreads');
 if(a==='tspread'){T.q=($('#q')||{value:T.q}).value;T.spread=t.dataset.k;return render()}
 if(a==='shuffle'){T.q=($('#q')||{value:T.q}).value.trim();T.deck=shuffle(DECK);T.picks=[];T.stage='pick';T.ai='';T.aiState='';render();return window.scrollTo(0,0)}
 if(a==='tflip'){const c=T.drawn[+t.dataset.k];if(!c.shown){c.shown=true;render();if(T.drawn.every(x=>x.shown))setTimeout(interpret,1200);return}V.tpop=+t.dataset.k;V.tctx=SPREAD_CTX[T.spread]||'love';return render()}
 if(a==='wpop'){V.wpop=t.dataset.k||true;return render()}
 if(a==='hpopcat'){const w=$('.cpop.hpz');V.hpop=t.dataset.k||'love';if(!w)return render();
  const o=w.querySelector('.hpz-scr'),d=document.createElement('div');d.innerHTML=horoPop(SIGNS.find(x=>x.id===w.dataset.s));const n=d.querySelector('.hpz-scr');
  w.querySelectorAll('.hpz-tab').forEach(b=>{const on=b.dataset.k===V.hpop;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
  if(!o||!n)return;clearTimeout(o._sw);o.classList.add('out');o._sw=setTimeout(()=>{o.innerHTML=n.innerHTML;o.scrollTop=0;o.classList.remove('out')},220);return}
 if(a==='hpop'){V.hpop=t.dataset.k||'love';return render()}
 if(a==='hpopclose'){if(e.target.closest('.cp-in')&&!e.target.closest('.cp-x'))return;V.hpop=false;return render()}
 if(a==='wpopclose'){if(e.target.closest('.cp-in')&&!e.target.closest('.cp-x'))return;V.wpop=false;return render()}
 if(a==='cpedit'){V.cpEdit=true;V.birthDraft=null;return render()}
 if(a==='cpopen'){go('discover','profile');V.cpEdit=true;V.birthDraft=null;return render()}
 if(a==='cpclose'){if(e.target.closest('.pop-box')&&!e.target.closest('.pop-x'))return;V.cpEdit=false;V.birthDraft=null;return render()}
 if(a==='tpopclose'){if(e.target.closest('.cp-in')&&!e.target.closest('.cp-x'))return;V.tpop=null;return render()}
 if(a==='saveread'){const r={id:uuid(),spread:T.spread,q:T.q,date:dkey(),at:new Date().toISOString(),note:'',cards:T.drawn.map(c=>({id:c.id,pos:c.pos,name:c.name,rev:c.rv}))};
  S.readings.push(r);T.savedId=r.id;save();C.saveReading&&C.saveReading(r).then(id=>{if(id){r.rid=id;r.id=id;r.sy=true;T.savedId=id;save()}});toast('Saved to your journal');return render()}
 if(a==='tctx'){V.tctx=t.dataset.k;return render()}
 if(a==='newread'){newReading();render();return window.scrollTo(0,0)}
});
function readSyn(){const Y=V.syn,g=id=>$('#'+id);if(g('sn'))Y.name=g('sn').value.trim();if(g('sd'))Y.date=g('sd').value;if(g('su'))Y.unk=g('su').checked;if(g('st'))Y.time=g('st').value}
// the birth form on the page is someone else's (a New search) when its button says so
function readBirth(){const other=!!$('[data-act=savebirth][data-other]'),b=other?(V.oDraft||(V.oDraft=Object.assign({},fresh().birth))):(V.birthDraft||(V.birthDraft=Object.assign({},S.birth))),g=id=>$('#'+id);if(g('bn'))b.name=g('bn').value;if(g('bd'))b.date=g('bd').value;if(g('bu'))b.unk=g('bu').checked;if(g('bt'))b.time=g('bt').value}
const tap=el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true}));
document.addEventListener('input',e=>{
 const el=e.target;
 if(el.id==='dt'){V.dream.text=el.value;const c=$('#dtc');if(c)c.textContent=el.value.length+'/1000';return}
 if(el.id==='libq'){V.lib.q=el.value;render();return refocus('libq')}
 if(el.id==='jq'){V.jsearch=el.value;render();return refocus('jq')}
});
document.addEventListener('keydown',e=>{
 if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&$('.jbook')&&!e.target.closest('input,textarea,select')){e.preventDefault();return jflip(jIdx(journalPages())+(e.key==='ArrowRight'?1:-1))}
 if(e.key==='Enter'&&e.target.id==='jn'){e.preventDefault();return e.target.blur()}
 if(e.key==='Escape'&&V.bdayOpen&&onboarding()){V.bdayOpen=false;return render()}
 if(e.key==='Escape'&&V.letter){V.letter=null;return render()}
 if(e.key==='Escape'&&V.jx){V.jx=false;return render()}
 if(e.key==='Escape'&&V.sheet){V.sheet=null;return render()}
 if(e.key==='Escape'&&V.tpop!=null){V.tpop=null;return render()}
 if(e.key==='Escape'&&V.spk){V.spk=false;return render()}
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('.scene[data-act],[data-planet]')){e.preventDefault();tap(e.target)}
 if(e.key==='Enter'&&e.target.matches('input[id$="-q"]')){e.preventDefault();placeSearch(e.target.id.slice(0,-2))}
});
document.addEventListener('change',e=>{
 const i=e.target,id=i.id;
 if(id==='pfphoto'){setPhoto(i.files&&i.files[0]);i.value='';return}
 if(i.dataset.act==='jint'){S.intent=S.intent||{};const a=S.intent[V.jkey]||[];a[+i.dataset.i]=i.checked;S.intent[V.jkey]=a;save();return}
 // the birthday's sign appears in its card (and lights on the zodiac behind) in place, and only when the sign changes
 // (the field also reports a change as it closes, under the finger tapping Continue): redrawing would swallow that tap
 if(id==='obd'){V.joinBirth=i.value;const s=signFromDate(i.value);if(s)V.joinSign=s;
  document.querySelectorAll('.ob2-z .zg-s').forEach(b=>b.setAttribute('aria-checked',b.dataset.sign===V.joinSign));
  const z=$('.ob2-z'),r=$('.obz-res');if(z)z.classList.toggle('has',!!V.joinSign);if(r&&r.dataset.k!==s)r.outerHTML=bdayRes();return}
 if(id==='za'||id==='zb'){V.love[id==='za'?'a':'b']=i.value;V.love.done=false;return render()}
 if(id==='bu'){readBirth();render()}
 if(id==='su'){readSyn();render()}
 if(id==='kas-p'){S.settings.kPersonal=i.checked;save();syncProfile()}
 if(V.sec!=='settings')return;
 const n=S.notif,st=S.settings;
 const map={n_on:()=>n.on=i.checked,n_wh:()=>n.whisper=i.checked,n_ev:()=>n.events=i.checked,n_mo:()=>n.monthly=i.checked,n_an:()=>n.annual=i.checked,n_time:()=>n.time=i.value,n_q:()=>n.quiet=i.checked,n_qf:()=>n.quietFrom=i.value,n_qt:()=>n.quietTo=i.value,
  p_kas:()=>st.kPersonal=i.checked,p_pz:()=>{st.personal=i.checked;pzCache.k=''},d_rm:()=>st.reduce=i.checked,d_lg:()=>st.large=i.checked,d_hp:()=>st.haptics=i.checked,d_vo:()=>st.voiceOut=i.checked,d_tz:()=>{st.tz=i.value;EVC.k='';chartCache.k=''},
  p_birth:()=>{S.birthConsent=i.checked}};
 if(map[id]){map[id]();save();syncProfile();toast('Saved');if(/^d_/.test(id))render()}
});
/* ---------- The Ritual: the landing place. Morning is a half wheel of three (Horoscope, Whisper, Intention) held by the
   woman at dawn; evening is the full wheel of five around the Moon on the lake (adding Unwind and Reflection). Touch a
   part of the wheel and it opens as an immersive pop-up over the dimmed Ritual; a finished part glows along its gold
   frame and takes its tick. The paintings are placed in their own pixels; fit() sets their scales. ---------- */
{
const R='/art/ritual/';
// where each lit part sits on its painting [left, top, width, height], and the shape a touch must land in
// each part's light (laid over the painting as light, so neighbours never cover one another) and its tick: [left, top, width, height]
const POS={"m":[[[323,408,381,333],[429,598,168,168]],[[144,467,304,388],[186,766,168,168]],[[583,468,347,387],[681,766,168,168]]],"e":[[[168,412,291,285],[241,544,168,168]],[[382,390,260,240],[429,491,168,168]],[[573,411,284,284],[628,548,168,168]],[[139,630,233,270],[166,771,168,168]],[[653,630,229,270],[696,769,168,168]]]};
const POLY={m:[[[322,482],[400,442],[513,426],[626,442],[704,482],[588,722],[513,700],[438,722]],[[304,490],[250,545],[220,610],[200,700],[190,828],[215,872],[325,872],[346,792],[392,746],[438,724]],[[720,490],[792,530],[852,592],[902,672],[930,760],[938,828],[905,872],[705,872],[688,792],[640,746],[590,724]]],
 e:[[[390,415],[300,450],[228,515],[183,595],[170,630],[350,690],[385,650],[435,620]],[[390,415],[513,385],[635,415],[595,620],[513,628],[435,620]],[[635,415],[725,450],[797,515],[842,595],[852,632],[675,690],[640,650],[595,620]],[[170,630],[152,750],[175,850],[240,905],[335,920],[352,870],[337,800],[350,690]],[[852,632],[888,750],[872,860],[830,940],[690,935],[673,870],[689,800],[675,690]]]};
const NAMES=['Horoscope','Whisper','Intention','Unwind','Reflection'],KEYS=['h','w','i','u','r'],TILES=['rth','rtw','rti','rtu','rtq'];
const CHIPS=[['Clarity',178,964,208],['Self-Love',408,964,210],['Balance',638,964,208],['Productivity',170,1046,232],['Peace',414,1046,198],['Confidence',630,1046,226]];
const QS=[['What made you happy today?',30,668,225],['What did you learn?',266,668,218],['What would you like to release?',30,749,225],['What are you grateful for?',266,749,218]];
const VS='︎';
// each full-screen painting: its width and height in its own pixels, the height of its foot (kept at the screen's
// bottom, with the button), and how far down its words reach (the top scrolls if the screen cannot hold both)
const PANE={rtw:[592,1312,162,0],rti:[1024,1888,0,0],rtu:[512,992,0,0],rtq:[512,992,0,0],rmoon:[1024,2240,0,0],rsun:[1024,2240,0,0],rpl:[1024,2224,0,0],rsg:[1024,2176,0,0]};
// Intention is painted whole at three heights; the one nearest the screen's shape fills it exactly
const IH=[1664,1888,2112];
// Unwind and Reflection: each painted at three heights to fit one screen; every piece placed from the user's full-length
// painting (in its own 512-wide units) and mapped into the fitted one
const UQL={"u":{"top":140,"cEnd":1665,"bS":2505,"v":{"872":[0.6944,1478],"992":[0.8087,1691],"1120":[0.86,1934]}},"q":{"top":140,"cEnd":1785,"bS":2505,"v":{"872":[0.6487,1416],"992":[0.7545,1619],"1120":[0.86,1838]}}};
const uq=(x,y,w,h,f)=>`data-u="${x},${y},${w},${h},${f||0}"`;
const pane=(id,label,cls,top,foot,bar='')=>`<section class="rt${cls}" id="${id}" aria-label="${label}"><div class="rsc"><div class="rsz"><div class="rcv rtop">${top}</div></div></div><div class="rft"><div class="rcv rcvf">${foot}</div></div>${bar}</section>`;
// every pop-up: the arrow back at the top left and the share button at the top right, the same size and place on each
const ICB='<svg viewBox="0 0 50 50" aria-hidden="true"><circle cx="25" cy="25" r="22.5"/><path d="M34 25H16M23.5 17.5 16 25l7.5 7.5"/></svg>';
const ICS='<svg viewBox="0 0 50 50" aria-hidden="true"><circle cx="25" cy="25" r="22.5"/><path d="M25 29V13.5M19.5 19 25 13.5l5.5 5.5M20 23h-3v12h16V23h-3"/></svg>';
const rbar=share=>`<button class="rbar rbk" data-ract="back" aria-label="Back to Ritual">${ICB}</button><button class="rbar rsh" ${share} aria-label="Share">${ICS}</button>`;
// the painted button of the Intention screen (its rim and side ornaments), its words set on it
const rbtn=(label,i)=>`<button class="rbtn" data-ract="done" data-i="${i}"><span>${label}</span></button>`;

const day=()=>{const k=dkey();S.rit=S.rit||{};return S.rit[k]||{}};
function mark(i){const k=dkey();S.rit=S.rit||{};S.rit[k]=Object.assign({},S.rit[k],{[KEYS[i]]:1});Object.keys(S.rit).sort().slice(0,-60).forEach(x=>delete S.rit[x]);save()}
// a part is done when it was completed here today (or, for the older path, when its record already exists)
function done(i){const k=dkey(),d=day();
 return !!(d[KEYS[i]]||[S.readDay===k,false,!!(S.carry||{})[k],false,!!S.notes[k]][i])}
const isEve=()=>V.ritEve!=null?V.ritEve:evening();
const count=()=>isEve()?5:3;
const nextUndone=()=>[...Array(count()).keys()].find(i=>!done(i));

// the intention spoken back in the evening: one or two words read as a quality ("patience"), longer ones as a whole
function intentWords(){const v=((S.carry||{})[dkey()]||'').trim();if(!v)return null;
 const short=v.split(/\s+/).length<=2&&v.length<=22;return {v,short,q:short?v.toLowerCase().replace(/[.!]$/,''):''}}

function horoPop(){
 const sign=sg(S.sign),h=horoscope(sign.id,'overview','daily'),fold=(c,img,t)=>{const x=horoscope(sign.id,c,'daily');
  return `<button class="fold" data-ract="fold"><div class="sec"><img src="${R}${img}.webp" alt=""><h3>${t}</h3></div><div class="more"><div class="rp">${esc(x.body)}</div></div></button>`};
 const ch=myChart&&myChart(),pl=[];
 if(ch){const p=n=>ch.pl.find(x=>x.n===n);const sun=p('Sun'),mo=p('Moon');
  if(sun)pl.push(['Sun',sIdx(sun.sign)]);if(mo&&!ch.moonRange)pl.push(['Moon',sIdx(mo.sign)]);
  if(ch.ang&&S.birth&&!S.birth.unk)pl.push(['Rising',sIdx(Math.floor(ch.ang.asc/30))])}
 const plh=pl.length>1?pl.map(([n,s])=>`<span>${n} <b aria-label="${s.name}">${s.g}${VS}</b></span>`).join(''):`<span>${esc(sign.dates||'')}</span>`;
 return `<section class="rt" id="rth" aria-label="Horoscope, your reading for today. ${sign.name}.">
  <div class="hd"><img class="sl" src="${R}h-top.webp" alt=""><span class="hglyph" aria-hidden="true">${sign.g}${VS}</span><div class="hname">${sign.name}</div><div class="hpl">${plh}</div></div>
  <div class="roll"><div class="parch"><div>
   <div class="sec"><img src="${R}h-sun.webp" alt=""><div><h3>${esc(h.focus||'Today’s Guidance')}</h3><div class="rp">${esc(h.body)}</div></div></div>
   <div class="line star"><span>✦</span></div>
   ${fold('love','h-heart','Love &amp; Relationships')}<div class="line"></div>
   ${fold('career','h-leaf','Career &amp; Purpose')}<div class="line"></div>
   ${fold('health','h-lotus','Wellbeing')}
  </div></div>
  <div class="ft"><img class="sl" src="${R}h-bot.webp" alt="">${rbtn('Carry This Wisdom',0)}</div></div>
  ${rbar(`data-act="sharecard" data-k="horo" data-s="${sign.id}" data-cat="overview"`)}
 </section>`;
}
function whisperPop(){
 const k=dkey(),c=todayCard(),rev=!!S.revealed[k],sv=S.saved.some(x=>x.date===k);
 return pane('rtw','Whisper',rev?' rev':'',`<div class="rwline">A whisper, just for you.</div>
  <div id="rcard" role="button" tabindex="0" data-ract="flip" aria-label="${rev?'Your Whisper: '+esc(c.title):'Tap the card to reveal your message'}"><div class="rflip"><div class="rface rbk"></div><div class="rface rfr"><span id="rwmsg">${esc(myWhisper(c))}</span></div></div></div>
  <div id="rwhint"><img src="${R}w-hand.webp" alt=""><div class="rp">Tap the card to reveal your message.</div></div>`,
  '',rbar('data-act="sharecard" data-k="whisper"')).replace('</section>',`${rbtn('Carry This With Me',1)}</section>`);
}
function intentPop(){
 const cur=(S.carry||{})[dkey()]||'';
 return pane('rti','Intention. Set your intention for the day.','',`<textarea id="riin" maxlength="60" rows="2" placeholder="Write your intention..." aria-label="Write your intention">${esc(cur)}</textarea>
  ${CHIPS.map(([v])=>`<button class="rchip${v===cur?' on':''}" data-ract="chip" data-v="${v}"><img src="${R}ci-${v.toLowerCase()}.webp" alt=""><span>${v}</span></button>`).join('')}
  <button class="rit-hot" data-ract="done" data-i="2" aria-label="Set my intention" id="riset" style="left:258px;width:512px;height:116px;border-radius:58px"></button>`,'',rbar('data-ract="share" data-k="intent"'));
}
function unwindPop(){
 const w=intentWords(),pill=!w?'This morning was yours, however it went.':w.short?`This morning you invited ${esc(w.q)}.`:'This morning you set an intention.',
  q=!w?'Did today treat you gently?':w.short?`Did ${esc(w.q)} find you today?`:'Did your intention find you today?',a=(S.unwind||{})[dkey()];
 return pane('rtu','A moment to unwind. You have done enough for today.','',`<div class="rupill" ${uq(112,488,340,42,23)}>${pill}</div><div class="ruq" ${uq(20,572,472,60,32)}>${q}</div>
  ${[['Yes',62],['Partly',208],['Not yet',355]].map(([v,x])=>`<button class="rpick${a===v?' on':''}" data-ract="pick" data-v="${v}" aria-label="${v}" ${uq(x,640,100,100)}></button>`).join('')}

  <button class="rit-hot" data-ract="done" data-i="3" aria-label="Continue to Reflection" ${uq(45,1265,425,92)} style="border-radius:46px"></button>`,'',rbar('data-ract="share" data-k="unwind"'));
}
function reflectPop(){
 const cur=S.notes[dkey()]||'';
 return pane('rtq','Your daily reflection. How did today make you feel?','',`<textarea id="rqin" maxlength="600" placeholder="Write your thoughts here..." aria-label="How did today make you feel?" ${uq(58,450,398,176,28)}>${esc(cur)}</textarea>
  ${QS.map(([v,x,y,w])=>`<button class="rchip" data-ract="q" data-v="${v}" aria-label="${v}" ${uq(x,y,w,64)}></button>`).join('')}

  <button class="rit-hot" data-ract="done" data-i="4" aria-label="Save Reflection" ${uq(52,1265,412,92)} style="border-radius:46px"></button>
  <button class="rit-hot" data-ract="skip" aria-label="Not tonight" ${uq(180,1370,152,48)} style="border-radius:24px"></button>`,'',rbar('data-ract="share" data-k="reflect"'));
}
const POPS=[horoPop,whisperPop,intentPop,unwindPop,reflectPop];

// the menu of the five places: painted icons on a glowing golden arc, laid straight over each painting
const KN=[['home','Ritual','ritual'],['horoscope','Sky','sky'],['tarot','Oracle','oracle'],['calendar','Calendar','calendar'],['journal','Journal','journal']];
const knStar=(x,y,r)=>{const k=r*.16;return `<circle cx="${x}" cy="${y}" r="${r*1.5}" fill="url(#knh)"/><path d="M${x} ${y-r} L${x+k} ${y-k} L${x+r*1.5} ${y} L${x+k} ${y+k} L${x} ${y+r} L${x-k} ${y+k} L${x-r*1.5} ${y} L${x-k} ${y-k}Z" fill="#FFF3D6"/>`};
const KNARC='M42 38 Q195 6 348 38',KNSVG=`<svg viewBox="0 0 390 86" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="kng" x1="0" x2="1"><stop offset="0" stop-color="#F6B25E" stop-opacity=".15"/><stop offset=".12" stop-color="#FFC878"/><stop offset=".5" stop-color="#FFE2A8"/><stop offset=".88" stop-color="#FFC878"/><stop offset="1" stop-color="#F6B25E" stop-opacity=".15"/></linearGradient><radialGradient id="knh"><stop offset="0" stop-color="#FFE9B8" stop-opacity=".95"/><stop offset=".3" stop-color="#FFB25A" stop-opacity=".5"/><stop offset="1" stop-color="#FF9A3C" stop-opacity="0"/></radialGradient><filter id="knb1" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="3.2"/></filter><filter id="knb2" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="1.1"/></filter></defs><path d="${KNARC}" fill="none" stroke="#FF9A3C" stroke-width="5" opacity=".42" filter="url(#knb1)"/><path d="${KNARC}" fill="none" stroke="#FFB85E" stroke-width="2" opacity=".8" filter="url(#knb2)"/><path d="${KNARC}" fill="none" stroke="url(#kng)" stroke-width="1"/>${[[84,4.2],[158,4.6],[232,4.6],[306,4.2]].map(([x,r])=>{const t=(x-42)/306;return knStar(x,+(38-64*t*(1-t)).toFixed(1),r)}).join('')}</svg>`;
const knNav=cur=>`<nav class="rit-nav kn" aria-label="Kosmia">${KNSVG}${KN.map(([n,l,i])=>`<button data-nav="${n}" aria-label="${n==='calendar'?'Cosmic Calendar':l}"${n===cur?' aria-current="page"':''}><i style="background-image:url(/art/nav2/kn-${i}.webp)"></i>${l}</button>`).join('')}</nav>`;
function view(){
 if(!A||!K)return needLib();
 const eve=isEve(),m=eve?'e':'m',n=count(),nx=nextUndone(),op=V.rp!=null&&V.rp<n?V.rp:null;
 const box=b=>`left:${b[0]}px;top:${b[1]}px;width:${b[2]}px;height:${b[3]}px`;
 const lits=POS[m].map(([l,t],i)=>`<img id="rl${i}" class="rl ${done(i)?'done':i===nx?'now':''}" src="${R}${m}l${i}.webp" alt="" style="${box(l)}"><img id="rk${i}" class="rk${done(i)?' done':''}" src="${R}${m}t${i}.webp" alt="" style="${box(t)}">`).join('');
 const pans=POLY[m].map((p,i)=>`<polygon class="rit-pan" data-p="${i}" role="button" tabindex="0" aria-label="${i+1}. ${NAMES[i]}${done(i)?', done':''}" points="${p.map(q=>q.join(',')).join(' ')}"/>`).join('');
 return `<div class="rit${eve?' eve':''}" role="main" aria-label="${eve?'Your evening ritual':'Your daily ritual'}"><div class="rit-in">
  <div class="rit-sc"><div class="rit-lit">${lits}</div><svg class="rit-ws" viewBox="0 0 1024 2192" aria-label="The parts of your ritual">${pans}</svg>
   <button class="rit-hot" data-ract="time" aria-label="${eve?'Show the morning ritual':'Show the evening ritual'}" style="left:330px;top:40px;width:364px;height:120px;border-radius:40%"></button>
   <button class="rit-hot" data-go="you" aria-label="My Cosmos" style="left:900px;top:80px;width:88px;height:88px"></button></div>
  <div class="rit-ft"></div>
  ${knNav('home')}
 </div>
 <div class="rit-ov${op!=null?' on now':''}" id="rov">${op!=null?POPS[op]().replace('class="rt','class="rt on in'+(op===1&&S.revealed[dkey()]?' now':'')):''}</div></div>`;
}

// the scales: the painting fills the phone's width (and its height, above the menu); each pop-up fills the screen
function fit(){
 const r=document.documentElement.style,W=Math.min(innerWidth,520),H=innerHeight,nh=W*86/390;
 const s=Math.max(W/1024,H/2192);
 r.setProperty('--rw',W+'px');r.setProperty('--rs',s);r.setProperty('--rx',(W-1024*s)/2+'px');r.setProperty('--rnh',nh+'px');
 r.setProperty('--pw',W+'px');
 const o=document.querySelector('.or0');if(o){const v=H/W>1.93?'b':'a',sc=o.querySelector('.or-sc');if(sc&&sc.dataset.v!==v)return render();const os=Math.max(W/1024,H/ORV[v].h);o.style.setProperty('--os',os);o.style.setProperty('--ox',(W-1024*os)/2+'px')}
 for(const id in PANE){const t=document.getElementById(id);if(!t)continue;
  let [cw,ch,fh,C]=PANE[id],sc=W/cw,hr=H/sc,th=Math.max(hr,C+fh),st=t.style,sy=sc;
  if(id==='rtu'||id==='rtq'){const n=id==='rtu'?'u':'q',L=UQL[n],hs=Object.keys(L.v).map(Number);ch=hs.reduce((a,b)=>Math.abs(Math.log(b/hr))<Math.abs(Math.log(a/hr))?b:a);th=ch;sy=H/ch;
   st.setProperty('--img',`url(${R}${n}-bg-${ch*2}.webp)`);const [k,b1]=L.v[ch];
   const my=y=>{const ys=2*y;return (ys>=L.bS?b1+(ys-L.bS)*k:L.top+(ys-L.top)*k)/2};
   t.querySelectorAll('[data-u]').forEach(e=>{const [x,y,w,h,f]=e.dataset.u.split(',').map(Number);e.style.left=(256+(x-256)*k)+'px';e.style.top=my(y)+'px';e.style.width=w*k+'px';e.style.height=h*k+'px';if(f)e.style.fontSize=f*k+'px'})}
  if(id==='rti'){ch=IH.reduce((a,b)=>Math.abs(Math.log(b/hr))<Math.abs(Math.log(a/hr))?b:a);th=ch;sy=H/ch;
   st.setProperty('--img',`url(${R}i-bg-${ch}.webp)`);const b=document.getElementById('riset');if(b)b.style.top=(ch-228)+'px';
   const top=952,bot=ch-228-26,hh=104,A=bot-top,gap=Math.min(90,Math.max(14,(A-3*hh)/4)),y0=top+(A-3*hh-2*gap)/2;
   t.querySelectorAll('.rchip').forEach((c,i)=>{c.style.left=(i%2?522:92)+'px';c.style.top=(y0+Math.floor(i/2)*(hh+gap))+'px'})}
  if(id==='rmoon'||id==='rsun'||id==='rpl')({ch,th,sy}=skLay(t,id.slice(1),sc,hr,H));
  if(id==='rsg')({ch,th}=sgLay(t,hr));
  st.setProperty('--s',sc);st.setProperty('--sy',sy);st.setProperty('--cw',cw);st.setProperty('--ch',ch);st.setProperty('--fh',fh);st.setProperty('--th',th);
  // the Whisper's card fills the room between the title and the foot, turned or not
  if(id==='rtw'){const bot=hr-112,ah=Math.max(260,bot-250),h=Math.min(775,ah),w=h*504/775,hb=hr-fh-92,bb=hb-14,bh=Math.min(582,Math.max(240,bb-350)),bw=bh*416/582;
   st.setProperty('--ht',hb+'px');
   st.setProperty('--cl',(592-w)/2+'px');st.setProperty('--ct',250+Math.max(0,(ah-h)/2)+'px');st.setProperty('--cwd',w+'px');st.setProperty('--chd',h+'px');
   st.setProperty('--bl',(592-bw)/2+'px');st.setProperty('--bt',350+Math.max(0,(bb-350-bh)/2)+'px');st.setProperty('--bw',bw+'px');st.setProperty('--bh',bh+'px');
   t.dataset.cw=w;t.dataset.ch=h}}
 const msg=document.getElementById('rwmsg');if(msg){
  // measured against the card as it is once turned, so the words keep one size through the turn
  const tw=document.getElementById('rtw'),cw=+tw.dataset.cw||504,ch=+tw.dataset.ch||775,k=cw/504;
  const m=document.createElement('div');m.style.cssText="position:absolute;visibility:hidden;left:-9999px;width:"+(cw*.68)+"px;font:italic 600 "+Math.round(40*k)+"px/1.2 'Cormorant Garamond',serif;text-align:center";m.textContent=msg.textContent;document.body.append(m);
  let f=Math.round(40*k);while(m.offsetHeight>ch*.28&&f>12){f-=.5;m.style.fontSize=f+'px'}m.remove();msg.style.fontSize=f+'px'}
}

function wheel(){const n=count(),nx=nextUndone();
 for(let i=0;i<n;i++){const l=document.getElementById('rl'+i),p=document.querySelector(`.rit-pan[data-p="${i}"]`);if(!l)continue;
  l.classList.toggle('done',done(i));l.classList.toggle('now',!done(i)&&i===nx);const k=document.getElementById('rk'+i);if(k)k.classList.toggle('done',done(i));if(p)p.setAttribute('aria-label',`${i+1}. ${NAMES[i]}${done(i)?', done':''}`)}}
function open(i){
 const ov=document.getElementById('rov');if(!ov)return;V.rp=i;
 ov.classList.remove('now');ov.innerHTML=POPS[i]();const t=document.getElementById(TILES[i]);
 if(i===1&&S.revealed[dkey()])t.classList.add('now');
 t.classList.add('on');ov.classList.add('on');fit();
 requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('in')));
 const f=t.querySelector('[data-ract=back]');if(f)setTimeout(()=>{try{f.focus({preventScroll:true})}catch(e){}},400);
}
function close(){
 const ov=document.getElementById('rov');V.rp=null;if(!ov)return;
 const t=ov.querySelector('.rt');if(t)t.classList.remove('in');ov.classList.remove('on');setTimeout(()=>{if(V.rp==null)ov.innerHTML=''},600);
}
function complete(i,msg,to){
 mark(i);close();
 setTimeout(()=>{wheel();const n=count(),all=[...Array(n).keys()].every(done);
  const dreamt=(S.bookmarks||[]).some(b=>b.kind==='dream'&&(b.data||{}).day===dkey());
  if(all&&!isEve()&&!dreamt)return toast('Your morning ritual is complete. Your day is held.','drask','Do you remember your dreams?');
  const fin=isEve()?goodnight(dkey()):'Your morning ritual is complete. Your day is held.',nl=all?nextLunar(3.5):null;
  if(nl)return toastGo(`${fin} The ${calName(nl)} arrives ${calCount(nl).toLowerCase()}.`,'Prepare for it',{ref:evRef(nl)});
  if(to)return toastGo(all?fin:msg,to[0],{s:to[1],t:to[2]});
  toast(all?fin:msg)},500);
}
function flip(){
 const k=dkey();if(S.revealed[k])return;
 S.days[k]=todayCard().id;S.revealed[k]=true;save();syncFortune(k);
 const t=document.getElementById('rtw'),c=document.getElementById('rcard');t.classList.remove('now');t.classList.add('rev');
 c.classList.add('shim');setTimeout(()=>c.classList.remove('shim'),1300);
 c.setAttribute('aria-label','Your Whisper: '+todayCard().title);
}
function act(t,e){
 const a=t.dataset.ract,k=dkey();
 if(typeof haptic==='function')haptic('tap');
 if(a==='back')return close();
 if(a==='time'){V.ritEve=!isEve();V.rp=null;return render()}
 if(a==='flip')return flip();
 if(a==='fold')return t.classList.toggle('open');
 if(a==='chip'){document.querySelectorAll('#rti .rchip').forEach(x=>x.classList.toggle('on',x===t));document.getElementById('riin').value=t.dataset.v;return}
 if(a==='pick'){const on=!t.classList.contains('on');document.querySelectorAll('#rtu .rpick').forEach(x=>x.classList.toggle('on',x===t&&on));S.unwind=S.unwind||{};if(on)S.unwind[k]=t.dataset.v;else delete S.unwind[k];save();return}
 if(a==='q'){document.querySelectorAll('#rtq .rchip').forEach(x=>x.classList.toggle('on',x===t));const q=document.getElementById('rqin');q.placeholder=t.dataset.v;V.ritQ=t.dataset.v;q.focus();return}
 if(a==='share'){const w=t.dataset.k,val=id=>((document.getElementById(id)||{}).value||'').trim();let txt='';
  if(w==='intent'){const v=val('riin');txt=v?`My intention for today: “${v}”. Set in my daily ritual with Kosmia ✦`:'Setting my intention for the day with Kosmia ✦'}
  if(w==='unwind')txt='You have done enough for today. A moment to unwind with Kosmia ✦';
  if(w==='reflect'){const v=val('rqin');txt=v?`${v} (my reflection tonight, with Kosmia ✦)`:'Ending my day with a quiet reflection, with Kosmia ✦'}
  if(navigator.share)return navigator.share({title:'Kosmia',text:txt,url:location.origin}).catch(()=>{});
  return (navigator.clipboard?navigator.clipboard.writeText(txt+' '+location.origin):Promise.reject()).then(()=>toast('Copied to share'),()=>toast('Sharing is not available here'))}
 if(a==='skip'){close();return setTimeout(()=>toast('Rest well. Tonight needs no words.'),500)}
 if(a==='done'){const i=+t.dataset.i;
  if(i===0){S.readDay=k;save();return complete(0,'Your Horoscope is kept for today')}
  if(i===1){if(!S.saved.some(x=>x.date===k)){S.saved.push({id:todayCard().id,date:k});save();syncFortune(k)}return complete(1,'Your Whisper walks with you today.',['See it in My Library','tarot','library'])}
  if(i===2){const v=(document.getElementById('riin').value||'').trim();if(!v){toast('Write an intention, or choose one');document.getElementById('riin').focus();return}
   S.carry=S.carry||{};S.carry[k]=v.slice(0,60);Object.keys(S.carry).sort().slice(0,-40).forEach(x=>delete S.carry[x]);save();return complete(2,'Your intention is set for today.',['See it in My Intentions','tarot','intentions'])}
  if(i===3){mark(3);wheel();return open(4)}
  if(i===4){const x=document.getElementById('rqin'),v=(x.value||'').trim();if(!v){toast('Write a few words, or choose Not tonight');x.focus();return}
   S.notes[k]=V.ritQ&&!S.notes[k]?`${V.ritQ} ${v}`:v;
   // a gratitude kept here is also kept among the reader's gratitude in the Journal
   if(V.ritQ==='What are you grateful for?'){const j={id:uuid(),day:k,kind:'reflection',title:'My Gratitude',body:v,at:new Date().toISOString()};S.journal.push(j);C.saveJournal&&C.saveJournal(j)}
   V.ritQ=null;save();syncFortune(k);return complete(4,'Your reflection is kept.',['See it in My Reflections','tarot','reflections'])}
 }
}
document.addEventListener('click',e=>{
 if(V.sec!=='home')return;
 const p=e.target.closest('.rit-pan');if(p)return open(+p.dataset.p);
 const t=e.target.closest('[data-ract]');if(t)return act(t,e);
 if(e.target.id==='rov')close();
});
document.addEventListener('keydown',e=>{
 if(V.sec!=='home')return;
 if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('rit-pan')){e.preventDefault();open(+e.target.dataset.p)}
 if((e.key==='Enter'||e.key===' ')&&e.target.id==='rcard'){e.preventDefault();flip()}
 if(e.key==='Escape'&&V.rp!=null)close();
});
addEventListener('resize',fit);
// after every render the scales and the Whisper's words are fitted again; a re-render while a pop-up is open keeps it
// still and keeps the manuscript where the reader was
ritAfter=(y)=>{if(document.querySelector('.or0'))fit();if(V.sec==='home'){fit();const h=document.getElementById('rth');if(h&&y)h.scrollTop=y}else{V.rp=null;if(document.querySelector('.sky0')){fit();const t=document.querySelector('#rov .rt');if(t){t.classList.add('on');spFit();(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>{fit();spFit()});if(V.skpIn)t.classList.add('in');else requestAnimationFrame(()=>requestAnimationFrame(()=>{t.classList.add('in');V.skpIn=true}))}}else V.skp=null}};
views.home=view;
// Sky: the painting of the heavens held between two hands, the reader's own sign at its heart. The Sun opens today's
// Sun, the Moon the Moon of the day, each planet where the planets are now, and the sign the full horoscope
const SKY='/art/sky/';
const SKYPL=[[163,789,74,0,'Jupiter'],[292,810,30,0,'Mercury'],[284,917,46,0,'Venus'],[216,1084,131,56,'Saturn'],[893,862,46,0,'Neptune'],[770,950,50,0,'Mars'],[741,1137,66,0,''],[863,1175,30,0,'Pluto'],[870,995,48,0,'Uranus']];
// each body's name, delicate, beneath it
const SKYLB=[['Sun',510,1190],['Moon',764,828],['Mercury',292,756],['Venus',284,965],['Earth',735,1207],['Mars',762,1003],['Jupiter',163,866],['Saturn',216,1144],['Uranus',870,1054],['Neptune',893,910],['Pluto',866,1207]];
function skyHome(){
 const s=sg(S.sign),sk=V.skd&&skyItems().find(i=>i.id===V.skd);if(V.skd&&!sk)V.skd=null;
 const circ=(x,y,r,a,attr)=>`<button class="rit-hot" ${attr} aria-label="${a}" style="left:${x-r}px;top:${y-r}px;width:${2*r}px;height:${2*r}px"></button>`;
 const pl=SKYPL.map(([x,y,rx,ry,n])=>{const at=n?`data-skp="pl:${n}"`:'data-go="discover" data-t="planets"',lb=n?`${n} today`:'Where the planets are now';
  return ry?`<button class="rit-hot" ${at} aria-label="${lb}" style="left:${x-rx}px;top:${y-ry}px;width:${2*rx}px;height:${2*ry}px"></button>`:circ(x,y,rx,lb,at)}).join('');
 return `<div class="rit sky0" role="main" aria-label="The Sky"><div class="rit-in">
  <div class="rit-sc">
   <img class="sk0-fig" src="${SKY}sk-fig-${s.id}.webp" alt="" style="left:330px;top:495px;width:370px;height:325px">
   <img class="sk0-g" src="${SKY}sk-g-${s.id}.webp" alt="" style="left:458px;top:732px;width:112px;height:112px">
   <div class="kt" style="left:30px;top:96px;width:440px"><h1>The Sky</h1><p>The universe right now,<br>and what it means for you.</p></div>
   <div class="sk0-n"><span>${s.name}</span></div>
   ${circ(510,1043,150,'The Sun today','data-skp="sun"')}
   ${circ(764,757,66,'The Moon today','data-skp="moon"')}
   ${pl}
   ${SKYLB.map(([n,x,y])=>`<span class="sk0-l" style="left:${x}px;top:${y}px">${n}</span>`).join('')}
   <button class="rit-hot" data-skp="sign" aria-label="Your horoscope, ${s.name}" style="left:340px;top:500px;width:350px;height:370px;border-radius:30%"></button>
   <button class="rit-hot" data-go="you" aria-label="My Cosmos" style="left:904px;top:84px;width:88px;height:88px"></button>
  </div>
  <div class="rit-ft"></div>
  <div class="sk0-tip">Tap on the Sun, Moon, planets or your sign<br>to explore their meaning for you.</div>
  ${knNav('horoscope')}
 </div>${V.spk&&V.skp==='sign'?signPick(V.exploreSign||S.sign):''}${V.skp?`<div class="rit-ov on${V.skpIn?' now':''}" id="rov">${V.skp==='moon'?moonPop():V.skp==='sun'?sunPop():V.skp==='sign'?signPop():planetPop(V.skp.slice(3))}</div>`:''}</div>${sk?skyPop(sk):''}`;
}
// Oracle: the user's painting of the seeker by the lake at dusk; each thing in it opens its own way of asking. The Sun
// is Omens (signs, numbers and synchronicities), the Moon Dreams, the doves Connections, the book Your Readings, the
// cards Tarot and the crystal ball Kassandra. The painting is laid out in its own 850-wide units; a short screen narrows
// it a little and squeezes it very slightly, its edges melting into the frame's shadow, so all of it stays above the bar
// two paintings of the one scene, each 1170 wide: A for shorter screens, B for full-height ones; shown at the screen's
// width, never stretched. Each thing's place [x, y, w, h] in its own painting
const ORV={a:{h:1744,img:'or-body-s',t:[512,208],l:{omens:[190,505],dreams:[842,470],conn:[850,725],read:[272,1488],kas:[516,1488],tarot:[736,1488]},hot:{omens:[60,200,270,340],dreams:[750,260,190,240],conn:[730,520,250,240],read:[160,1240,250,250],kas:[420,1170,185,320],tarot:[600,1270,280,220],me:[840,94,88,88]}},
 b:{h:2192,img:'or-body',t:[512,246],l:{omens:[194,560],dreams:[850,522],conn:[850,864],read:[226,1812],kas:[510,1932],tarot:[800,1824]},hot:{omens:[50,230,290,390],dreams:[750,300,200,260],conn:[730,620,260,280],read:[50,1590,300,300],kas:[375,1590,270,380],tarot:[610,1620,380,240],me:[890,110,88,88]}}};
const ORT={omens:['data-go="discover" data-t="signs"','Signs and Synchronicities','Signs &amp;<br>Synchronicity'],dreams:['data-go="discover" data-t="dreams"','Dreams','Dreams'],conn:['data-go="discover" data-t="connections"','Connections','Connections'],read:['data-go="discover" data-t="readings"','Your Readings','Your Readings'],tarot:['data-go="tarot" data-t="spreads"','Tarot','Tarot'],kas:['data-act="kasgo"','Kassandra','Kassandra'],me:['data-go="you"','My Cosmos']};
function oracleHome(){
 const v=innerHeight/Math.min(innerWidth,520)>1.93?'b':'a',P=ORV[v];
 return `<div class="rit or0" role="main" aria-label="Oracle"><div class="rit-in">
  <div class="or-sc" data-v="${v}" style="height:${P.h}px"><img class="or-bg" src="${SKY}${P.img}.webp" alt="" style="height:${P.h}px">
   <div class="kt" style="left:${P.t[0]-330}px;top:${P.t[1]}px;width:660px"><h1>Oracle</h1><p>Guidance, insight and deeper<br>meaning for your journey.</p></div>
   ${Object.entries(P.l).map(([k,[x,y]])=>`<span class="or-l${k==='kas'?' or-lk':''}${/read|kas|tarot/.test(k)?' or-lo':''}${v==='b'&&k==='read'?' or-l2':''}" style="left:${x}px;top:${y}px">${v==='b'&&k==='read'?'Your<br>Readings':ORT[k][2]}</span>`).join('')}
   ${Object.entries(P.hot).map(([k,[x,y,w,h]])=>`<button class="rit-hot" ${ORT[k][0]} aria-label="${ORT[k][1]}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${k==='me'?'50%':'48px'}"></button>`).join('')}
  </div>
  ${knNav('tarot')}
 </div>${sheetView()}</div>`;
}
// ---- Signs & Synchronicities (Oracle): three intentions, four entrances. Interpret: Sacred Numbers and Synchronicities,
// read by Kassandra when signed in and from Kosmia's own book of signs otherwise. Discover: Patterns, the themes that keep
// returning across dreams, tarot, signs, the Ritual and the Journal, each with the entries behind it. Understand:
// Numerology (Life Path and The Name Within). Readings are kept in Your Readings (bookmarks of kind 'sign'); the heart
// keeps one in the Journal. Signs are offered for reflection, never as predictions or messages that must be obeyed.
// [id, name, words that bring it to mind, meaning, a question, a phrase for the thread, a gentle action]
const SS_THEMES=[
 ['water','Water',/\b(water|sea|ocean|rain\w*|river|lake|swim\w*|waves?|tears?|flood\w*|tide)\b/,'Water often carries emotion, intuition and the need for things to flow.','What feeling is asking to move through me?','emotion and flow','Spend a few quiet minutes near water, even a glass of it, and notice what you feel.'],
 ['beginnings','New beginnings',/\b(begin\w*|new start|fresh start|new chapter|seeds?|dawn|birth\w*|baby|first step)\b/,'New beginnings speak of intention, possibility and the courage to start.','What is quietly asking to begin in my life?','renewal','Write down one small thing you could begin this week.'],
 ['lettinggo','Letting go',/\b(let\w* go|releas\w*|forgiv\w*|goodbye|endings?|surrender\w*|move on|moving on)\b/,'Letting go often makes room: an ending honoured so that something new can arrive.','What am I ready to release?','emotional release','Write what you are ready to release on a scrap of paper, and let it go.'],
 ['love','Love',/\b(love\w*|partner|romance|heart|kiss\w*|soulmate|relationships?)\b/,'Love in its many forms: connection, tenderness and how you give and receive care.','Where am I being invited to open my heart?','love and connection','Send a few kind words to someone you love, without waiting for a reason.'],
 ['change','Transformation',/\b(chang\w*|transform\w*|shift\w*|butterfl\w*|snakes?|rebirth|reborn)\b/,'Transformation is the old shape giving way to a new one, rarely comfortable and often necessary.','What in me is changing shape?','transformation','Notice one way you are not who you were a year ago, and honour it.'],
 ['freedom','Freedom',/\b(free\w*|fly\w*|flight|flew|wings?|birds?|travel\w*|escap\w*|journey\w*)\b/,'Freedom points to space, movement and the wish to live more on your own terms.','Where do I long for more space?','freedom','Take a short walk with no destination and let your mind wander.'],
 ['guidance','Messages & guidance',/\b(feathers?|signs?|messages?|angels?|guid\w*|synchronicit\w*|coinciden\w*)\b/,'Messages and guidance reflect a wish to feel accompanied and to trust your next step.','What guidance have I been hoping to hear?','guidance','Ask yourself tonight what you most need to hear, and write the answer.'],
 ['intuition','Intuition',/\b(intuit\w*|gut feeling|instinct\w*|dream\w*|moon\w*|knew|knowing|deja vu|déjà vu|owls?)\b/,'Intuition is the quiet knowing beneath thought, often louder in dreams and coincidences.','What does my intuition already know?','intuition','Before your next decision, pause and notice your first, quiet answer.'],
 ['home','Home & belonging',/\b(home|house|family|mother|mum|mom|father|dad|belong\w*|roots)\b/,'Home and belonging speak of safety, roots and the people who hold you.','Where do I feel most at home?','belonging','Make one corner of your home a little more yours today.'],
 ['abundance','Abundance',/\b(money|abundan\w*|wealth|prosper\w*|grateful|gratitude|harvest|coins?)\b/,'Abundance is about what you value and what you allow yourself to receive.','What am I ready to receive?','abundance','Name three things you already have that you once wished for.'],
 ['growth','Growth',/\b(grow\w*|learn\w*|heal\w*|progress\w*|bloom\w*|garden\w*|trees?|patien\w*)\b/,'Growth is slow and faithful: learning, healing and becoming.','What is growing in me, even slowly?','growth','Tend to something living today: a plant, a friendship, or yourself.'],
 ['balance','Balance',/\b(balanc\w*|calm\w*|peace\w*|rest\w*|harmon\w*|stillness|breath\w*)\b/,'Balance is the return to centre: rest, calm and the harmony between giving and receiving.','What would bring me back to centre?','balance and peace','Take five slow breaths before you next pick up your phone.'],
 ['light','Light & clarity',/\b(light|sun\w*|clarity|clear\w*|bright\w*|rainbows?|stars?)\b/,'Light and clarity speak of things coming into view and of hope returning.','What is becoming clearer to me?','clarity','Step into the daylight for a few minutes and let it warm your face.'],
 ['courage','Courage',/\b(courag\w*|brave\w*|fears?|afraid|confiden\w*|strength|strong)\b/,'Courage is not the absence of fear but the step taken with it.','What would I do if I were a little braver?','courage','Take one small step today towards something that frightens you a little.']
].map(a=>({id:a[0],name:a[1],re:a[2],m:a[3],q:a[4],ph:a[5],act:a[6]}));
const ssTheme=id=>SS_THEMES.find(x=>x.id===id);
const ssFind=t=>{const low=String(t||'').toLowerCase();return SS_THEMES.filter(x=>x.re.test(low)).map(x=>x.id)};
// dream symbols and number roots, each read as one of the themes
const SS_DT={water:'water',ocean:'water',flying:'freedom',bird:'guidance',snake:'change',death:'lettinggo',baby:'beginnings',door:'beginnings',key:'intuition',house:'home',moon:'intuition',sun:'light',fire:'change',garden:'growth',forest:'growth',money:'abundance',storm:'change',falling:'lettinggo',owl:'intuition',bridge:'change',mountain:'courage',chase:'courage',journey:'freedom',horse:'freedom',wedding:'love',mirror:'intuition',stairs:'growth',lost:'guidance',exam:'courage',teeth:'change',spider:'growth',cat:'intuition',dog:'love'};
const SS_NT={0:'guidance',1:'beginnings',2:'love',3:'growth',4:'home',5:'change',6:'love',7:'intuition',8:'abundance',9:'lettinggo',11:'intuition',22:'growth',33:'love'};
// the book of signs: each number's title, symbolism, what it may mean and a question
const SS_NUM={
 0:['The Open Circle','Zero is the circle with no beginning or end: potential, wholeness and the space before something takes form.','It may be inviting you to rest in possibility for a while, rather than rush towards an answer.','What wants to take shape if I give it space?'],
 1:['The Beginning of Something New','In numerology, one is associated with beginnings, intention and possibility: the first step, and the self that takes it.','Consider whether something in your life is asking for a fresh perspective or a new beginning.','What would I begin today if I trusted myself a little more?'],
 2:['Trust in Timing','Two is the number of partnership, balance and patience: two things meeting and learning to move together.','It may be a gentle reminder that some things grow best with cooperation, and with time.','Where can I trust that things are unfolding at the right pace?'],
 3:['The Voice Within','Three is associated with expression, creativity and joy: what is inside finding its way out.','You might be invited to speak, create or share something you have been holding back.','What would I express if I were not afraid of how it sounds?'],
 4:['Steady Foundations','Four is the number of structure, stability and care: the four corners of a home, the four seasons.','It may point to the quiet work of building something that lasts, one faithful step at a time.','What foundation am I building, and does it still feel true?'],
 5:['Change on the Wind','Five is associated with change, freedom and movement: the restless, curious part of us.','Something may be shifting. Consider where you are ready for more space, or a new direction.','What change am I resisting that might set me free?'],
 6:['Care and Harmony','Six is the number of love, home and responsibility: the heart that tends to others.','It may be inviting you to include yourself in the care you give so easily to others.','How can I care for myself as tenderly as I care for others?'],
 7:['The Inner Seeker','Seven is associated with reflection, intuition and the search for deeper meaning.','You may be in a season of looking inward. Quiet time could bring the answers you seek.','What does my inner voice already know?'],
 8:['Abundance and Flow','Eight is the number of abundance and of balance between giving and receiving: an infinity standing upright.','Consider what you value, and whether you allow yourself to receive as well as to give.','What am I ready to receive?'],
 9:['Completion and Release','Nine is the last of the single numbers: completion, compassion and the wisdom of endings.','Something may be coming to a natural close, making room for what comes next.','What am I ready to let go of with grace?'],
 11:['The Awakened Light','Eleven is a master number, often linked with intuition, inspiration and moments of sudden awareness.','You may be noticing more than usual. Trust the quiet insights arriving now.','What insight have I been brushing aside?'],
 22:['The Master Builder','Twenty-two is a master number, associated with turning a vision into something real and lasting.','It may encourage you to give your dream a practical first step.','Which dream of mine deserves a first practical step?'],
 33:['The Healing Heart','Thirty-three is a master number, associated with compassion, teaching and love offered freely.','It may be inviting you to lead with kindness, including towards yourself.','Where can my kindness make a difference today?']};
const SS_NK={0:'potential',1:'beginnings',2:'partnership',3:'expression',4:'stability',5:'change',6:'care',7:'reflection',8:'abundance',9:'completion'};
const SS_FREQ=['111','222','333','444','555','11:11','1212'];
function ssLocalNumber(s){
 const ds=s.split('').map(Number),tot=ds.reduce((a,b)=>a+b,0),R=N.reduce(tot),root=R.n,B=SS_NUM[root]||SS_NUM[root%9||9];
 let title=B[0],sym=B[1],mean=B[2],q=B[3],themes=[SS_NT[root]];
 if(/^(\d)\1+$/.test(s)){const d=ds[0],D=SS_NUM[d];title=D[0];sym=`${D[1]} Seen as ${s}, the ${d} repeats ${s.length} times, which is often read as the same quiet message, amplified.`;mean=D[2];q=D[3];themes=[SS_NT[d]]}
 else if(s.length>2&&ds.every((d,i)=>!i||d===ds[i-1]+1)){title='Step by Step';sym=`A rising sequence such as ${s} is often read as progress: one step leading naturally to the next.`;mean='It may be a reassurance that you are moving in the right order, even if it feels slow.';q='What is my next simple step?';themes=['growth']}
 else if(/^(\d\d)\1+$/.test(s)&&ds[0]!==ds[1]){const [a,b]=ds;title=`${cap(SS_NK[a])} and ${SS_NK[b]}`;sym=`${s} weaves ${a} and ${b} together: ${SS_NK[a]} and ${SS_NK[b]}, returning in rhythm. ${SS_NUM[a][1]}`;mean=`${SS_NUM[b][2]}`;q=SS_NUM[a][3];themes=[SS_NT[a],SS_NT[b]]}
 else if(s.length>2&&s===s.split('').reverse().join('')){title='The Mirror';sym=`${s} reads the same in both directions, so it is often seen as a mirror: what you give returns to you. It reduces to ${root}. ${B[1]}`}
 else sym=`${s} reduces to ${root} (${ds.join(' + ')} = ${tot}${R.chain.length>1?' → '+R.chain.slice(1).join(' → '):''}). ${B[1]}`;
 return {title,symbolism:sym,meaning:mean,reflection:q,themes:[...new Set(themes.filter(Boolean))],ai:false};
}
// what a coincidence may hold: a few things that often appear, then the feeling it left
const SS_SYM=[
 [/\bfeathers?\b/,'A feather is often read as a sign of lightness and protection, a reminder that you are not as alone as you may feel.'],
 [/\bbutterfl\w*/,'The butterfly is one of the oldest symbols of transformation: something emerging, changed, from a time of waiting.'],
 [/\bdragonfl\w*/,'The dragonfly, at home in water and air, is often linked with change, lightness and seeing through illusion.'],
 [/\b(robin|cardinal|birds?|crow|raven|dove)s?\b/,'Birds have long been read as messengers between worlds, carrying hope, news or a reminder of freedom.'],
 [/\b(song|music|lyrics?|radio)\b/,'A song arriving at just the right moment often carries words you needed to hear.'],
 [/\b(thinking|thought) (of|about)\b[^.]*\b(call\w*|text\w*|messag\w*|appear\w*|saw|met|ran into)\b|\b(called|texted|messaged) me\b/,'Thinking of someone just before they appear is one of the most common synchronicities, often read as a thread of connection between you.'],
 [/\b(\d)\1{1,}\b|11:11|\bnumbers?\b/,'Numbers that keep returning are often read as a nudge to pay attention, each carrying its own symbolism.'],
 [/\b(coin|penny|pennies)\b/,'Finding a coin is often read as a small sign of abundance, or of someone thinking of you.'],
 [/\brainbows?\b/,'A rainbow appears after rain: hope, promise and the light returning.'],
 [/\b(deja vu|déjà vu)\b/,'Déjà vu is often read as a moment of alignment, a pause that asks you to notice where you are.'],
 [/\b(same|again|keeps?|kept|repeat\w*)\b[^.]*\b(word|name|phrase|book|title)s?\b/,'When the same word, name or phrase keeps finding you, it may be a theme asking for your attention.']];
const SS_FEEL=[['curious','Curious'],['peaceful','Peaceful'],['surprised','Surprised'],['hopeful','Hopeful'],['unsettled','Unsettled'],['confused','Confused']];
const SS_FEELM={curious:'Your curiosity suggests you are open to what this moment might be showing you. Let the question stay open for a while.',peaceful:'The peace it left with you may be the meaning itself: a moment of feeling held, in step with your life.',surprised:'Surprise wakes us up. This moment may be asking you to look again at something you had stopped noticing.',hopeful:'The hope it stirred is worth trusting. It may point towards something you are ready to welcome.',unsettled:'Feeling unsettled is natural; a coincidence can stir what we have not yet put into words. It does not have to mean anything is wrong.',confused:'Not everything needs an explanation straight away. Let the moment settle, and notice whether it returns.'};
function ssLocalSync(text,feel){
 const low=text.toLowerCase(),found=SS_SYM.filter(([re])=>re.test(low)).map(x=>x[1]),themes=ssFind(text).slice(0,3),T=themes.map(ssTheme);
 const clip=text.length>170?text.slice(0,170).replace(/\s+\S*$/,'')+'…':text;
 return {title:T[0]?T[0].name:'A Meaningful Moment',moment:`You noticed: “${clip}”${feel?` It left you feeling ${feel.toLowerCase()}.`:''}`,
  symbolism:found.slice(0,2).join(' ')||'Meaningful coincidences are moments when the outer world seems to echo the inner one. Their meaning lives less in the event itself than in what it stirs in you.',
  deeper:[feel?SS_FEELM[feel.toLowerCase()]:'',T.length?`It seems to touch on ${T.map(x=>x.ph).join(' and ')}. ${T[0].m}`:'Notice what you were thinking about, or longing for, just before it happened: that is often where its meaning lives.'].filter(Boolean).join(' '),
  reflection:T[0]?T[0].q:'What did this moment stir in me?',action:T[0]?T[0].act:'Write one line about this moment in your Journal tonight, and notice whether it returns.',themes,ai:false};
}
// the readings kept in Your Readings
const ssList=()=>S.bookmarks.filter(b=>b.kind==='sign').map(b=>b.data||{}).filter(d=>d.type==='number'||d.type==='sync').sort((a,b)=>(b.at||'')>(a.at||'')?1:-1);
const ssGet=id=>ssList().find(d=>d.id===id);
function ssKeepSnap(o){const d=Object.assign({id:uuid(),day:dkey(),at:new Date().toISOString()},o);ssKeep(d);toast('Saved to Your Readings')}
function ssKeep(d){const b={id:d.id,kind:'sign',ref:d.id,data:d,at:d.at};S.bookmarks.push(b);save();C.saveBookmark&&C.saveBookmark(b).then(()=>{b.sy=true;save()},()=>{})}
const ssN=()=>V.ssN||(V.ssN={num:'',ctx:'',busy:false});
const ssS=()=>V.ssS||(V.ssS={text:'',feel:'',busy:false});
async function ssReadNumber(){
 const F=ssN(),i=$('#ssn'),c=$('#ssc');if(i)F.num=i.value;if(c)F.ctx=c.value;
 const num=F.num.replace(/[^0-9]/g,'').slice(0,12);if(!num){toast('Enter the number you noticed first.');const x=$('#ssn');if(x)x.focus();return}
 F.busy=true;render();let r=null;
 if(C.user&&C.signs){try{const x=await C.signs({kind:'number',number:num,context:F.ctx.trim(),themes:SS_THEMES.map(t=>t.id)});if(x&&x.meaning)r=Object.assign({ai:true},x)}catch(e){toast(e.message||'Kassandra could not read this just now, so Kosmia’s book of signs has.')}}
 const L=ssLocalNumber(num);if(!r)r=L;else if(!(r.themes||[]).length)r.themes=L.themes;
 const now=new Date().toISOString(),id=uuid();ssKeep({id,type:'number',day:dkey(),at:now,number:num,shown:F.num.trim(),context:F.ctx.trim(),r,themes:r.themes});
 V.ssN={num:'',ctx:'',busy:false};V.ssId=id;go('discover','number');
}
async function ssReadSync(){
 const F=ssS(),t=$('#sst');if(t)F.text=t.value;const text=F.text.trim();
 if(text.length<8){toast('Tell a little more about what happened first.');return}
 F.busy=true;render();let r=null;const feel=(SS_FEEL.find(f=>f[0]===F.feel)||['',''])[1];
 if(C.user&&C.signs){try{const x=await C.signs({kind:'sync',text,feel,themes:SS_THEMES.map(t=>t.id)});if(x&&x.deeper)r=Object.assign({ai:true},x)}catch(e){toast(e.message||'Kassandra could not read this just now, so Kosmia’s book of signs has.')}}
 const L=ssLocalSync(text,feel);if(!r)r=L;else if(!(r.themes||[]).length)r.themes=L.themes;
 const now=new Date().toISOString(),id=uuid();ssKeep({id,type:'sync',day:dkey(),at:now,text,feel,r,themes:r.themes});
 V.ssS={text:'',feel:'',busy:false};V.ssId=id;go('discover','sync-reading');
}
// the heart: the reading written into the Journal, where it can be added to; once kept, it opens the page
function ssToJournal(d){
 if(d.kept&&S.journal.some(j=>j.id===d.kept))return openEntry('j:'+d.kept);
 const r=d.r||{},title=d.type==='number'?`Sacred Number ${d.number} · ${r.title}`:`Synchronicity · ${r.title}`;
 const body=(d.type==='number'?[d.context&&`What was happening: ${d.context}`,r.symbolism,r.meaning,r.reflection&&`To reflect on: ${r.reflection}`]:[`What happened: ${d.text}`,r.symbolism,r.deeper,r.reflection&&`To reflect on: ${r.reflection}`,r.action&&`A gentle action: ${r.action}`]).filter(Boolean).join('\n\n');
 const j={id:uuid(),day:d.day||dkey(),kind:'synchronicity',title,body,at:new Date().toISOString()};S.journal.push(j);C.saveJournal&&C.saveJournal(j);
 d.kept=j.id;const b=S.bookmarks.find(x=>x.kind==='sign'&&x.ref===d.id);if(b)C.saveBookmark&&C.saveBookmark(b);save();toast('Kept in your Journal');render();
}
// ---- Patterns: the evidence behind each theme, from every corner of Kosmia
const SS_SRC={dream:'Dreams',tarot:'Tarot',number:'Sacred Numbers',sync:'Synchronicities',reflection:'Reflections',journal:'Journal'};
const SS_RIT=/intention|gratitude|reflection|let(ting)? go|wish/i;
function ssEvidence(){
 const ev=[],add=(day,text,src,title,open,extra=[])=>{if(!day)return;const t=new Set([...extra.filter(Boolean),...ssFind(text)]);if(t.size)ev.push({day:String(day).slice(0,10),src,title,open,themes:[...t]})};
 S.journal.filter(j=>j.kind!=='synchronicity').forEach(j=>add(j.day,[j.title,j.body].filter(Boolean).join('. '),SS_RIT.test(j.title||'')?'reflection':'journal',j.title||'A Journal page',`data-act="jopen" data-k="j:${esc(j.id)}"`));
 Object.entries(S.notes||{}).forEach(([d,n])=>n&&add(d,n,'reflection','Your note on the Whisper',`data-act="jopen" data-k="fortune:${d}"`));
 dreams().filter(d=>!d.noPat).forEach(d=>{const I=d.interp||{};add(d.day,[d.text,I.title].filter(Boolean).join('. '),'dream',I.title||'A Dream',`data-act="dreamopen" data-id="${esc(d.id)}"`,[I.art,...(I.symbols||[]).map(s=>s.id)].map(x=>SS_DT[x]))});
 S.bookmarks.filter(b=>b.kind==='tarot').map(b=>b.data||{}).filter(d=>!(SSX.noPat&&SSX.noPat('tarot:'+d.id))).forEach(d=>add(d.day,[d.q,(d.cards||[]).map(c=>{const x=dk(c.id)||{};return [x.name,c.rv?x.rev:x.up].join(' ')}).join('. ')].join('. '),'tarot',(d.r||{}).title||'A tarot reading',`data-rd="open" data-k="tarot:${esc(d.id)}"`));
 S.readings.filter(r=>!(SSX.noPat&&SSX.noPat('old:'+r.id))).forEach(r=>add(r.date,[r.q,r.note,...(r.cards||[]).map(c=>{const x=dk(c.id);return x?[x.name,c.rev?x.rev:x.up].join(' '):c.name||''})].filter(Boolean).join('. '),'tarot',`${(SPREADS[r.spread]||{s:'Tarot'}).s} reading`,`data-act="jopen" data-k="reading:${esc(r.id)}"`));
 ssList().filter(d=>!(SSX.noPat&&SSX.noPat('sign:'+d.id))).forEach(d=>add(d.day,d.type==='number'?d.context:d.text,d.type,d.type==='number'?`Sacred Number ${d.number}`:(d.r||{}).title||'A Synchronicity',`data-ss="open" data-id="${esc(d.id)}"`,d.themes||[]));
 return ev;
}
const SS_RANGES=[['7','7 days'],['30','30 days'],['all','All time']];
function ssPatterns(range){
 const from=range==='all'?'':dkey(new Date(Date.now()-(+range-1)*DAY)),ev=ssEvidence().filter(e=>e.day>=from),out=[];
 SS_THEMES.forEach(t=>{const it=ev.filter(e=>e.themes.includes(t.id));if(it.length>1)out.push({k:'t:'+t.id,name:t.name,n:it.length,it,t})});
 const nums={};ssList().filter(d=>d.type==='number'&&d.day>=from).forEach(d=>(nums[d.number]=nums[d.number]||[]).push(d));
 Object.entries(nums).forEach(([n,l])=>{if(l.length>1)out.push({k:'n:'+n,name:n,num:true,n:l.length,it:l.map(d=>({day:d.day,src:'number',title:`Sacred Number ${n}`,open:`data-ss="open" data-id="${esc(d.id)}"`}))})});
 out.forEach(p=>{const c={};p.it.forEach(e=>c[e.src]=(c[e.src]||0)+1);p.srcs=Object.entries(c).sort((a,b)=>b[1]-a[1]);p.where=p.srcs.slice(0,2).map(([s],i)=>i?SS_SRC[s].toLowerCase():SS_SRC[s]).join(' & ')});
 return {ev,list:out.sort((a,b)=>b.n-a.n).slice(0,8)};
}
const ssRange=()=>V.ssRange||'30';
const ssTimes=n=>n===1?'once':n===2?'twice':n+' times';
// ---- the pages
const ssGlyph=(g,cls='')=>`<span class="ss-g ${cls}" aria-hidden="true">${g}</span>`;
const ssHead=(k)=>`<p class="ss-k">${k}</p>`;
const ssDoor=(g,title,line,attrs,cls='')=>`<button class="lrow ss-door ${cls}" ${attrs}><span class="lr-i">${ssGlyph(g)}</span><span class="lr-t"><strong>${title}</strong><span>${line}</span></span><span class="lr-c">${IC.chev}</span></button>`;
const ssTile=(g,title,line,attrs)=>`<button class="ss-tile" ${attrs}>${ssGlyph(g)}<strong>${title}</strong><span>${line}</span></button>`;
function ssHome(){
 return nightSub(`<div class="sub">${hdr('Signs &amp; Synchronicities',{sub:'Discover the meaning woven into everyday life.'})}
 <p class="ss-lead">Sometimes, the smallest things invite us to look a little deeper.</p>
 ${ssHead('What have you noticed?')}<div class="ss-pair">${ssTile('11','Sacred Numbers','Explore the numbers you keep seeing.','data-go="discover" data-t="numbers"')}${ssTile('✧','Synchronicities','Explore meaningful coincidences.','data-go="discover" data-t="sync"')}</div>
 <div class="ss-pair ss-two"><div>${ssHead('What keeps returning?')}${ssTile('⁂','Patterns','Discover what keeps returning.','data-go="discover" data-t="patterns"')}</div>
 <div>${ssHead('What lies within?')}${ssTile('9','Numerology','Discover the numbers within you.','data-go="discover" data-t="numerology"')}</div></div></div>`,'dj ss ssh');
}
function ssNumbersView(){
 const F=ssN();
 if(F.busy)return `<div class="sub">${hdr('Sacred Numbers')}<div class="reading-anim">${ui('owl','ra-owl')}<p class="quote center">Kassandra is reading your number…</p></div></div>`;
 const recent=ssList().filter(d=>d.type==='number').slice(0,3);
 return nightSub(`<div class="sub">${hdr('Sacred Numbers',{sub:'What number has been finding its way into your day?'})}
 <div class="field"><label for="ssn">The number you noticed</label><input type="text" id="ssn" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="111" value="${esc(F.num)}" class="ss-in"></div>
 ${ssHead('Frequently explored')}<div class="fchips ss-chips">${SS_FREQ.map(n=>`<button class="fchip" data-ss="num" data-v="${n}" aria-pressed="${F.num===n}">${n}</button>`).join('')}</div>
 <div class="field"><label for="ssc">What was happening when you noticed it? <i>(Optional)</i></label><textarea id="ssc" maxlength="400" rows="3" placeholder="A thought, a place, a feeling…">${esc(F.ctx)}</textarea></div>
 <button class="btn" data-ss="numgo">Reveal Its Meaning</button>
 ${recent.length?`${ssHead('Recently explored')}<div class="list">${recent.map(ssRow).join('')}</div>`:''}</div>`,'dj ss');
}
function ssSyncView(){
 const F=ssS(),rec=KS.state!=='idle'&&KS.target==='sync';
 if(F.busy)return `<div class="sub">${hdr('Synchronicities')}<div class="reading-anim">${ui('owl','ra-owl')}<p class="quote center">Kassandra is listening to your moment…</p></div></div>`;
 const recent=ssList().filter(d=>d.type==='sync').slice(0,3);
 return nightSub(`<div class="sub">${hdr('Synchronicities',{sub:'Not everything needs an explanation. Some moments simply invite reflection.'})}
 <div class="field"><label for="sst">What happened?</label><textarea id="sst" maxlength="1200" rows="6" placeholder="A feather on your doorstep, a song at the right moment, someone calling just as you thought of them…">${esc(F.text)}</textarea></div>
 <div class="list"><button class="lrow" data-ss="mic"><span class="lr-i ico">${IC.mic}</span><span class="lr-t"><strong>${rec?(KS.state==='listening'?'Listening… tap to finish':'Hearing you…'):'Tell it by voice'}</strong><span>${C.user?'Speak, and it is written down for you':'Sign in to describe it by voice'}</span></span><span class="lr-c">${IC.chev}</span></button></div>
 ${ssHead('How did it make you feel? (Optional)')}<div class="fchips ss-chips">${SS_FEEL.map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${F.feel===k}" data-ss="feel" data-v="${k}">${l}</button>`).join('')}</div>
 <button class="btn" data-ss="syncgo">Explore Its Meaning</button>
 ${recent.length?`${ssHead('Recent moments')}<div class="list">${recent.map(ssRow).join('')}</div>`:''}</div>`,'dj ss');
}
const ssRow=d=>lrow(ssGlyph(d.type==='number'?esc(d.number.length>4?d.number.slice(0,4)+'…':d.number):'✧','sm'),esc(d.type==='number'?`${d.number} · ${(d.r||{}).title||''}`:(d.r||{}).title||'A Synchronicity'),relDay(d.day),`data-ss="open" data-id="${esc(d.id)}"`);
function ssReadActs(d){
 const kept=d.kept&&S.journal.some(j=>j.id===d.kept);
 return `<div class="ss-acts">${ssList().some(x=>x.id===d.id)?heartBtn('sign:'+d.id):''}<button class="btn ghost" data-ss="refl" data-id="${esc(d.id)}">Reflect in My Journal</button></div><div class="ss-acts"><button class="btn ghost" data-go="discover" data-t="readings">Your Readings</button></div>
 <p class="muted small center">${(d.r||{}).ai?'Read by Kassandra with AI. ':'Read from Kosmia’s book of signs. '}Kept in Your Readings. Signs are offered for reflection, not as predictions.</p>`;
}
function ssNumberReading(){
 const d=ssGet(V.ssId||(V.q||{}).id);if(!d||d.type!=='number')return `<div class="sub">${hdr('Sacred Numbers')}${empty('This reading is no longer here','It may have been removed on another device.',linkBtn('Explore a number','discover','numbers','btn'))}</div>`;
 const r=d.r||{},since=dkey(new Date(Date.now()-29*DAY)),seen=ssList().filter(x=>x.type==='number'&&x.number===d.number&&x.day>=since).length;
 return nightSub(`<div class="sub">${hdr('Sacred Numbers',{sub:ymdLong(d.day,{day:'numeric',month:'long',year:'numeric'})})}
 <div class="ss-hero n"><div class="ss-num" aria-label="${esc(d.number)}">${esc(d.number).split('').join(' ')}</div><h2>${esc(r.title||'')}</h2></div>
 ${mbox(`<h3>The Symbolism</h3><p>${esc(r.symbolism||'')}</p>`)}
 ${mbox(`<h3>What It May Mean for You</h3><p>${esc(r.meaning||'')}</p>${d.context?`<p class="muted small">You noticed it when: ${esc(d.context)}</p>`:''}`)}
 ${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(r.reflection||'')}”</p>`)}
 ${seen>1?`<div class="ss-link"><p>You have explored this number ${ssTimes(seen)} recently. Discover how it connects with other themes in your journey.</p><button class="btn ghost" data-go="discover" data-t="patterns">Explore Your Patterns</button></div>`:''}
 ${ssReadActs(d)}</div>`,'dj ss');
}
function ssSyncReading(){
 const d=ssGet(V.ssId||(V.q||{}).id);if(!d||d.type!=='sync')return `<div class="sub">${hdr('Synchronicities')}${empty('This reading is no longer here','It may have been removed on another device.',linkBtn('Share a moment','discover','sync','btn'))}</div>`;
 const r=d.r||{};
 return nightSub(`<div class="sub">${hdr('Synchronicities',{sub:ymdLong(d.day,{day:'numeric',month:'long',year:'numeric'})})}
 <div class="ss-hero">${ssGlyph('✧','lg')}<h2>${esc(r.title||'A Meaningful Moment')}</h2></div>
 ${mbox(`<h3>The Moment</h3><p>${esc(r.moment||'')}</p>`)}
 ${mbox(`<h3>The Symbolism</h3><p>${esc(r.symbolism||'')}</p>`)}
 ${mbox(`<h3>A Deeper Meaning</h3>${paras(r.deeper)}`)}
 ${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(r.reflection||'')}”</p>`)}
 ${r.action?mbox(`<h3>A Gentle Action</h3><p>${esc(r.action)}</p>`):''}
 ${(d.themes||[]).length?`<div class="ss-link"><p>This moment touches ${d.themes.map(ssTheme).filter(Boolean).map(t=>t.name.toLowerCase()).join(' and ')}. See where else it appears in your journey.</p><button class="btn ghost" data-go="discover" data-t="patterns">Explore Your Patterns</button></div>`:''}
 ${ssReadActs(d)}</div>`,'dj ss');
}
const ssRangeBar=()=>`<div class="fchips ss-chips ss-range" role="radiogroup" aria-label="Time">${SS_RANGES.map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${ssRange()===k}" data-ss="range" data-v="${k}">${l}</button>`).join('')}</div>`;
function ssPatternsView(){
 const R=ssRange(),{list}=ssPatterns(R),T=list.filter(p=>p.t).slice(0,3);
 let thread='';
 if(T.length>1)thread=`Themes of ${T[0].t.ph} and ${T[1].t.ph} have appeared across several of your ${R==='all'?'':'recent '}experiences. You may find it meaningful to ask yourself: “${T[0].t.q}”`;
 else if(T.length)thread=`${T[0].name} has appeared ${ssTimes(T[0].n)}, in your ${T[0].where.toLowerCase()}. ${T[0].t.m} You may find it meaningful to ask yourself: “${T[0].t.q}”`;
 return nightSub(`<div class="sub">${hdr('Patterns',{sub:'The invisible threads woven through your journey.'})}
 ${ssRangeBar()}
 ${list.length?`${ssHead('Your recurring themes')}<div class="list">${list.map(p=>lrow(ssGlyph(p.num?esc(p.name.length>4?p.name.slice(0,4)+'…':p.name):'⁂','sm'),esc(p.name),esc(p.where),`data-ss="pat" data-k="${esc(p.k)}"`,`<span class="lr-m">${ssTimes(p.n)}</span>`)).join('')}</div>
 ${thread?mbox(`<h3>The Thread Connecting Them</h3><p>${esc(thread)}</p>`):''}`
 :mbox(`<h3>Every journey begins with a single thread</h3><p>As you record your dreams, signs and reflections, your recurring themes will begin to unfold here.</p><div class="ss-acts"><button class="btn ghost" data-go="discover" data-t="numbers">A number</button><button class="btn ghost" data-go="discover" data-t="new-dream">A dream</button><button class="btn ghost" data-go="discover" data-t="sync">A moment</button></div>`)}
 <p class="muted small center">Patterns are found in what you have kept in Kosmia, on this device and in your account. Nothing is invented.</p></div>`,'dj ss');
}
function ssPatternView(){
 const R=ssRange(),{list}=ssPatterns(R),p=list.find(x=>x.k===V.ssPat)||ssPatterns('all').list.find(x=>x.k===V.ssPat);
 if(!p)return `<div class="sub">${hdr('Patterns')}${empty('This thread has faded for now','It may appear again as you keep exploring.',linkBtn('Your Patterns','discover','patterns','btn'))}</div>`;
 const t=p.t,nm=p.num?SS_NUM[N.reduce(p.name.split('').reduce((a,b)=>a+ +b,0)).n]:null;
 const items=p.it.slice().sort((a,b)=>a.day>b.day?1:-1);
 return nightSub(`<div class="sub">${hdr(esc(p.name),{sub:`Appeared ${ssTimes(p.n)}${R==='all'?'':' in the last '+R+' days'}`})}
 ${mbox(`<h3>Where It Appeared</h3><div class="pills">${p.srcs.map(([s,n])=>`<span class="pill">${SS_SRC[s]} <b>${n}</b></span>`).join('')}</div>`)}
 ${mbox(`<h3>What It May Mean</h3><p>${esc(t?t.m:(nm?nm[1]:''))}</p>`)}
 ${ssHead('Its thread through your journey')}<div class="list">${items.map(e=>lrow('',esc(e.title),`${SS_SRC[e.src]} · ${relDay(e.day)}`,e.open)).join('')}</div>
 ${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(t?t.q:(nm?nm[3]:''))}”</p>`)}
 <button class="btn ghost" data-ss="snap">Save this thread to Your Readings</button></div>`,'dj ss');
}
function ssNumerologyView(){
 const bd=hasBirthDate()?S.birth.date:'',L=bd?N.lifePath(bd).r.n:0,nm=nameNums(S.fullName),E=nm&&nm.expression.r.n;
 return nightSub(`<div class="sub">${hdr('Numerology',{sub:'The hidden symbolism of your birth and name.'})}
 <div class="list">${ssDoor(L||'✶','Life Path',L?`${L} · ${N.MEANING[L][0]}. The symbolic journey revealed through your date of birth.`:'The symbolic journey revealed through your date of birth.','data-go="discover" data-t="life-path"','big')}
 ${ssDoor(E||'✶','The Name Within',E?`${E} · ${N.MEANING[E][0]}. The qualities, desires and expression in your name.`:'Explore the qualities, desires and expression associated with your name.','data-go="discover" data-t="name-within"','big')}</div>
 <p class="muted small center">${L?'Calculated from your birth date':'Add your birth date to your birth details to reveal your Life Path'}${E?' and your full birth name.':'; the Name Within reads your full birth name.'}</p></div>`,'dj ss');
}
{const SSV={signs:ssHome,numbers:ssNumbersView,number:ssNumberReading,sync:ssSyncView,'sync-reading':ssSyncReading,patterns:ssPatternsView,pattern:ssPatternView,numerology:ssNumerologyView};
 const vd=views.discover;views.discover=()=>SSV[tab()]?SSV[tab()]():vd()}
Object.assign(SSX,{list:ssList,glyph:ssGlyph,form:ssS});
// ---- Dreams (Oracle): three screens. Dreams is the entrance, the writing and the reading on one page: write or speak the
// dream (kept as a draft until it is read or saved), an optional feeling on waking, then Explore My Dream unfolds the
// reading beneath it, the dream folding into "Your Dream". Dream Patterns gathers the symbols that return across saved
// dreams (two distinct dreams make a pattern) with the feelings around them; Dream Archive is every dream by month, with
// search. A saved dream opens in the same reading layout, where it can be added to, read again, kept out of patterns or
// deleted. Meanings are possible emotional associations, never predictions.
const DR_MOODS=[['peaceful','Peaceful'],['curious','Curious'],['anxious','Anxious'],['happy','Happy'],['confused','Confused'],['sad','Sad']];
const DR_MOODL=Object.fromEntries([...MOODS,...DR_MOODS]);
const DR_FEELM={happy:'The happiness you woke with suggests these themes may be welcome in your life right now.',...MOOD_LINE};
// recurring symbols are named as they return (Doorways, Birds); the ocean and water are read as one
const DR_PL={snake:'Snakes',house:'Houses',owl:'Owls',forest:'Forests',door:'Doorways',key:'Keys',baby:'Babies',wedding:'Weddings',exam:'Exams',bridge:'Bridges',mountain:'Mountains',mirror:'Mirrors',horse:'Horses',spider:'Spiders',bird:'Birds',cat:'Cats',dog:'Dogs',storm:'Storms',journey:'Journeys',garden:'Gardens',chase:'Being Chased',lost:'Being Lost',moon:'The Moon',sun:'The Sun'};
const DR_ALIAS={ocean:'water'};
const drBare=n=>String(n||'').replace(/^(The|A|An) /,'');
const drName=k=>k.startsWith('x:')?cap(k.slice(2)):DR_PL[k]||drBare((dsym(k)||{name:k}).name);
// the symbols a dream holds, as pattern keys: the reading's own, and any the dictionary recognises in the words
function drKeys(d){
 const I=d.interp||{},ks=new Set(),add=k=>{if(k)ks.add(DR_ALIAS[k]||k)};
 add(I.art);(I.symbols||[]).forEach(s=>add(s.id||(s.name?'x:'+drBare(s.name).toLowerCase():'')));
 const low=String(d.text||'').toLowerCase();DREAMS.forEach(s=>{if(s.re.test(low))add(s.id)});
 return [...ks];
}
const drDraft=()=>S.dreamDraft||(S.dreamDraft={text:'',mood:''});
const drPending=()=>S.dreamPending||null;
const drTime=n=>n===1?'once':n===2?'twice':n+' times';
// the dictionary's reading, in the same shape as Kassandra's
function drLocal(text,mood){
 const low=text.toLowerCase(),at=s=>{const m=low.match(s.re);return m?m.index:1e9},found=DREAMS.filter(s=>s.re.test(low)).sort((a,b)=>at(a)-at(b)).slice(0,4),main=found[0];
 const beneath=[found.length>1?`Together, ${found.slice(0,3).map(s=>drBare(s.name).toLowerCase()).join(', ').replace(/, ([^,]*)$/,' and $1')} may point to ${found.slice(0,3).map(s=>s.keys[0].toLowerCase()).join(', ').replace(/, ([^,]*)$/,' and $1')} moving through your inner life right now.`:main?main.m:'Your dream speaks in images that are personal to you. Notice which moment, person or place stays with you most: that is often where its meaning lives.',
  mood?DR_FEELM[mood]:''].filter(Boolean).join(' ');
 return {title:main?main.name:'Your Dream',keywords:main?main.keys:['Mystery','Reflection','Intuition'],symbols:found.map(s=>({id:s.id,name:s.name,keys:s.keys.slice(0,2),meaning:s.m})),beneath,meaning:beneath,reflection:main?main.q:PROMPTS.d[2],art:main?main.id:'',ai:false};
}
async function drRead(text,mood){
 let I=null;
 if(C.user&&C.dream){try{const r=await C.dream({text,mood:DR_MOODL[mood]||'',symbols:[],dictionary:DREAMS.map(s=>s.id)});if(r&&(r.beneath||r.meaning))I=Object.assign({ai:true},r)}catch(e){toast(e.message||'Kassandra could not read this dream, so the dictionary did.')}}
 return I||drLocal(text,mood);
}
async function drExplore(){
 const D=drDraft(),t=$('#dt');if(t)D.text=t.value;const text=D.text.trim();
 if(text.length<8){toast('Tell a few more words of your dream first.');if(t)t.focus();return}
 V.drBusy=true;render();const I=await drRead(text,D.mood);V.drBusy=false;
 V.drShow=null;S.dreamPending={id:uuid(),day:dkey(),at:new Date().toISOString(),text,mood:D.mood,symbols:[],interp:I,note:''};S.dreamDraft={text:'',mood:''};save();if(S.settings.autosave!==false)drSavePending();render();window.scrollTo(0,0);
}
function drStore(d){
 const b={id:d.id,kind:'dream',ref:d.id,data:d,at:d.at};S.bookmarks.push(b);save();C.saveBookmark&&C.saveBookmark(b).then(()=>{b.sy=true;save()},()=>{});
}
function drSavePending(){const d=drPending();if(!d)return null;S.dreamPending=null;drStore(d);V.drShow=d.id;toast('Saved to My Dreams');return d}
const drBm=id=>S.bookmarks.find(b=>b.kind==='dream'&&b.ref===id);
function drUpdate(d){const b=drBm(d.id);if(b){b.data=d;save();C.saveBookmark&&C.saveBookmark(b)}}
// Dream Patterns: every saved dream that is not kept out, within the chosen time
const DR_RANGES=[['7','7 days'],['30','30 days'],['90','90 days'],['all','All time']];
const drRange=()=>V.drRange||'30';
function drPatterns(range,except){
 const from=range==='all'?'':dkey(new Date(Date.now()-(+range-1)*DAY)),list=dreams().filter(d=>!d.noPat&&d.id!==except&&(d.day||'')>=from),by={};
 list.forEach(d=>drKeys(d).forEach(k=>(by[k]=by[k]||[]).push(d)));
 const rec=Object.entries(by).filter(([,l])=>l.length>1).map(([k,l])=>({k,name:drName(k),list:l.sort((a,b)=>a.day<b.day?1:-1),n:l.length})).sort((a,b)=>b.n-a.n);
 return {list,rec};
}
// ---- the reading, on the Dreams page and for any saved dream
function drSymbols(I){
 const S2=(I.symbols||[]).slice(0,4);
 if(!S2.length)return '';
 return `${ssHead('Symbols Within Your Dream')}<div class="dr-syms">${S2.map(s=>{const x=dsym(s.id)||DREAMS.find(y=>drBare(y.name).toLowerCase()===drBare(s.name).toLowerCase()),keys=(s.keys&&s.keys.length?s.keys:x?x.keys.slice(0,2):[s.meaning]).filter(Boolean),m=s.keys&&s.keys.length?s.meaning:(x?x.m:'');
  return `<div class="dr-sym">${x?artOf(x.art,'dr-art'):`<span class="dr-art dr-none">✦</span>`}<div><strong>${esc(s.name)}</strong><span class="dr-keys">${keys.map(esc).join(' · ')}</span>${m?`<p>${esc(m)}</p>`:''}</div></div>`}).join('<i class="dr-div" aria-hidden="true">✦</i>')}</div>`;
}
function drReading(d,saved){
 const I=d.interp||{},since=dkey(new Date(Date.now()-29*DAY)),ks=drKeys(d);
 let fam='';if(!d.noPat){const P=drPatterns('30',d.id);for(const k of ks){const l=dreams().filter(x=>!x.noPat&&x.id!==d.id&&(x.day||'')>=since&&drKeys(x).includes(k));if(l.length){fam=`${drName(k)} has appeared in ${l.length+1} of your dreams this month.`;V.drFamK=k;break}}}
 const kept=saved&&d.note;
 return `<div class="dr-hero"><h2>${esc(I.title||'Your Dream')}</h2><p class="dr-sub">Your dream interpretation${d.day?' · '+ymdLong(d.day,{day:'numeric',month:'long'}):''}</p>${(I.keywords||[]).length?`<p class="dr-kw">${I.keywords.slice(0,3).map(esc).join(' · ')}</p>`:''}</div>
 <details class="acc dr-yours"><summary><span class="lr-t"><strong>Your Dream</strong><span>${d.mood?'You woke feeling '+esc((DR_MOODL[d.mood]||d.mood).toLowerCase()):'As you remembered it'}</span></span><span class="lr-c">${IC.chev}</span></summary><div class="acc-b"><p class="pre">${esc(d.text||'')}</p></div></details>
 ${drSymbols(I)}
 ${ssHead('Beneath the Surface')}<div class="dr-text">${paras(I.beneath||I.meaning)}</div>
 ${fam?`${ssHead('A Familiar Symbol')}<div class="dr-text"><p>${esc(fam)}</p><button class="dr-link" data-dr="fam" data-k="${esc(V.drFamK)}">Explore this pattern ${IC.chev}</button></div>`:''}
 ${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(I.reflection||PROMPTS.d[2])}”</p>`,'dr-q')}
 <div class="ss-acts">${saved?`<button class="btn ghost" disabled>✓ In My Dreams</button>${heartBtn('dream:'+d.id)}`:`<button class="btn" data-dr="save">Save to My Dreams</button>`}<button class="btn ghost" data-dr="journal" data-id="${esc(d.id)}">${kept?'Keep writing in My Journal':'Reflect in My Journal'}</button></div>
 <p class="muted small center">${I.ai?'Read by Kassandra with AI. ':I.ai===false?'Read with Kosmia’s dream dictionary. ':''}Dream meanings are possible emotional associations, offered for reflection rather than prediction.</p>`;
}
const drDoors=()=>`<div class="ss-pair dr-doors">${ssTile('⁂','Dream Patterns','Symbols that return to you','data-go="discover" data-t="dream-patterns"')}${ssTile('❦','Dream Archive','Revisit your dreams','data-go="discover" data-t="dream-journal"')}</div>`;
function drHome(){
 if(V.drBusy)return `<div class="sub">${hdr('Dreams')}<div class="reading-anim">${ui('owl','ra-owl')}<p class="quote center">Your dream is unfolding…</p></div></div>`;
 const P=drPending(),H=hdr('Dreams',{sub:'Explore the world that unfolds while you sleep.'}),SV=!P&&V.drShow&&dreams().find(x=>x.id===V.drShow);
 if(SV)return nightSub(`<div class="sub">${H}${drReading(SV,true)}<button class="dr-link dr-new" data-dr="new">Record another dream ${IC.chev}</button>${drDoors()}</div>`,'dj ss dr');
 if(P)return nightSub(`<div class="sub">${H}${drReading(P,false)}<button class="dr-link dr-new" data-dr="new">Record another dream ${IC.chev}</button>${drDoors()}</div>`,'dj ss dr');
 const D=drDraft(),rec=KS.state!=='idle'&&KS.target==='dream';
 return nightSub(`<div class="sub">${H}
 <p class="ss-lead dr-ask">What do you remember from your dreams?</p>
 <div class="field dr-parch"><label for="dt" class="sr-only">Tell me your dream</label><textarea id="dt" maxlength="1000" rows="${D.text?7:4}" placeholder="Tell me your dream… Describe the places, people, feelings or moments you remember. Even the smallest detail is welcome.">${esc(D.text)}</textarea>
  <button class="dr-mic${rec?' on':''}" data-dr="mic" aria-label="${rec?'Finish speaking':'Speak your dream'}">${IC.mic}<span>${rec?(KS.state==='listening'?'Listening… tap to finish':'Writing it down…'):'Speak'}</span></button></div>
 ${ssHead('How did you feel when you woke up? · Optional')}<div class="fchips ss-chips">${DR_MOODS.map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${D.mood===k}" data-dr="mood" data-v="${k}">${l}</button>`).join('')}</div>
 <button class="btn" data-dr="go">Explore My Dream</button>
 <button class="dr-link dr-later" data-dr="later">Save without interpreting</button>
 ${drDoors()}</div>`,'dj ss dr');
}
// a saved dream, read again in the same layout: add forgotten details, read it again, keep it out of patterns, or delete it
function drOpen(){
 const d=dreams().find(x=>x.id===V.dreamId);
 if(!d)return `<div class="sub">${hdr('Your Dream')}${empty('This dream is no longer here','It may have been removed on another device.',linkBtn('Dream Archive','discover','dream-journal','btn'))}</div>`;
 const E=V.drEdit===d.id,I=d.interp;
 if(V.drBusy)return `<div class="sub">${hdr('Dreams')}<div class="reading-anim">${ui('owl','ra-owl')}<p class="quote center">Your dream is unfolding…</p></div></div>`;
 const edit=E?`<div class="field dr-parch"><label for="dte" class="sr-only">Your dream</label><textarea id="dte" maxlength="1000" rows="8">${esc(d.text||'')}</textarea></div><div class="ss-acts"><button class="btn" data-dr="reread" data-id="${esc(d.id)}">Update the Interpretation</button><button class="btn ghost" data-dr="keepedit" data-id="${esc(d.id)}">Save the details only</button></div>`:'';
 const body=I&&!E?drReading(d,true):E?edit:`<div class="dr-hero"><h2>A Dream Not Yet Read</h2><p class="dr-sub">${ymdLong(d.day,{day:'numeric',month:'long',year:'numeric'})}</p></div><div class="dr-text"><p class="pre">${esc(d.text||'')}</p></div><button class="btn" data-dr="reread" data-id="${esc(d.id)}">Explore My Dream</button>`;
 const del=V.drDel===d.id?`<div class="dr-confirm"><p>Delete this dream and its interpretation? This cannot be undone.</p><div class="ss-acts"><button class="btn ghost" data-dr="delno">Keep it</button><button class="btn" data-dr="delyes" data-id="${esc(d.id)}">Delete</button></div></div>`:'';
 return nightSub(`<div class="sub">${hdr('Your Dream',{sub:ymdLong(d.day,{weekday:'long',day:'numeric',month:'long'})})}${body}
 ${E?'':`<div class="dr-tools"><button class="dr-link" data-dr="edit" data-id="${esc(d.id)}">Add forgotten details</button>${I?`<button class="dr-link" data-dr="reread" data-id="${esc(d.id)}">Read it again</button>`:''}<button class="dr-link" role="switch" aria-checked="${!d.noPat}" data-dr="pat" data-id="${esc(d.id)}">${d.noPat?'Kept out of patterns · include it':'Included in patterns · keep it out'}</button><button class="dr-link" data-dr="del" data-id="${esc(d.id)}">Delete this dream</button></div>${del}`}</div>`,'dj ss dr');
}
function drPatternsView(){
 const R=drRange(),{list,rec}=drPatterns(R),all=dreams();
 const rows=rec.map(p=>{const x=dsym(p.k),moods={};p.list.forEach(d=>{if(d.mood)moods[d.mood]=(moods[d.mood]||0)+1});
  const others={};p.list.forEach(d=>drKeys(d).forEach(k=>{if(k!==p.k&&rec.some(r=>r.k===k))others[k]=(others[k]||0)+1}));
  const mood=Object.entries(moods).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${(DR_MOODL[k]||k).toLowerCase()} ${drTime(n)}`);
  const con=Object.entries(others).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>drName(k));
  return `<details class="acc dr-pat"${V.drOpenK===p.k?' open':''} data-k="${esc(p.k)}"><summary><span class="lr-i">${x?artOf(x.art,'dr-art sm'):'<span class="dr-art dr-none sm">✦</span>'}</span><span class="lr-t"><strong>${esc(p.name)}</strong><span>${x?x.keys.join(', '):'A symbol of your own'}</span></span><span class="lr-m">${p.n} dreams</span><span class="lr-c">${IC.chev}</span></summary><div class="acc-b">
   <p>${esc(p.name)} has appeared in ${p.n} distinct dreams.${x?' '+esc(x.m):''}</p>
   ${mood.length?`<p><strong>The feeling around it:</strong> you woke ${mood.join(', ').replace(/, ([^,]*)$/,' and $1')}. Consider whether it felt peaceful, overwhelming or inviting, and how that relates to your waking life.</p>`:`<p>Consider how it felt each time it appeared, and how that relates to your waking life.</p>`}
   <p class="dr-where">Where it appeared</p>${p.list.map(d=>`<button class="dr-ent" data-act="dreamopen" data-id="${esc(d.id)}"><span>${ymdLong(d.day,{day:'numeric',month:'long'})}</span>${esc((d.interp||{}).title||'A Dream')}</button>`).join('')}
   ${con.length?`<p><strong>It often appears with:</strong> ${con.map(esc).join(', ')}.</p>`:''}
   <p class="quote">“${esc(x?x.q:'What is this symbol asking me to notice?')}”</p></div></details>`}).join('');
 const top=rec.slice(0,3),story=top.length>1?`${top.map(p=>p.name).join(', ').replace(/, ([^,]*)$/,' and $1')} have returned to you in your dreams. Together, they may offer a meaningful starting point for exploring your feelings about ${[...new Set(top.map(p=>((dsym(p.k)||{keys:['the unknown']}).keys[0]||'').toLowerCase()))].join(', ').replace(/, ([^,]*)$/,' and $1')}.`:'';
 return nightSub(`<div class="sub">${hdr('Dream Patterns',{sub:'Discover the symbols that return to you in your sleep.'})}
 <div class="dr-stats"><div><b>${all.length}</b><span>Dreams recorded</span></div><div><b>${rec.length}</b><span>Recurring symbols</span></div></div>
 <div class="fchips ss-chips ss-range" role="radiogroup" aria-label="Time">${DR_RANGES.map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${R===k}" data-dr="range" data-v="${k}">${l}</button>`).join('')}</div>
 ${rec.length?`${ssHead('Your Recurring Symbols')}<div class="list">${rows}</div>${story?mbox(`<h3>The Story Your Dreams May Be Telling</h3><p>${esc(story)}</p>`):''}`
 :mbox(`<h3>Your dream world is beginning to unfold</h3><p>As you record more dreams, familiar symbols may begin to emerge. A symbol becomes a pattern once it appears in two different dreams.</p><button class="btn ghost" data-go="discover" data-t="dreams">Record a dream</button>`)}
 <p class="muted small center">Only your saved dreams are read here, and none you have kept out of patterns.</p></div>`,'dj ss dr');
}
function drArchiveList(q){
 q=(q||'').trim().toLowerCase();
 const hit=d=>{if(!q)return true;const I=d.interp||{};return [I.title,d.text,(I.keywords||[]).join(' '),drKeys(d).map(drName).join(' '),(I.symbols||[]).map(s=>s.name).join(' '),DR_MOODL[d.mood]||'',ymdLong(d.day,{day:'numeric',month:'long',year:'numeric'})].join(' ').toLowerCase().includes(q)};
 const l=dreams().filter(hit),by={};l.forEach(d=>(by[(d.day||'').slice(0,7)]=by[(d.day||'').slice(0,7)]||[]).push(d));
 if(!l.length)return `<p class="muted center">${q?'No dream holds those words yet.':'Your dreams will be kept here, month by month.'}</p>`;
 return Object.keys(by).sort().reverse().map(m=>`<p class="dr-month">${ymdLong(m+'-01',{month:'long',year:'numeric'})}</p>${by[m].map(d=>{const I=d.interp||{},syms=drKeys(d).slice(0,3).map(drName);
  return `<button class="dr-entry" data-act="dreamopen" data-id="${esc(d.id)}"><span class="dr-d">${ymdLong(d.day,{day:'numeric',month:'long'})}</span><strong>${esc(I.title||'A Dream Not Yet Read')}</strong><span class="dr-x">${esc((d.text||'').slice(0,80))}${(d.text||'').length>80?'…':''}</span>${syms.length?`<span class="dr-s">${syms.map(esc).join(' · ')}</span>`:''}${d.mood?`<span class="dr-f">Feeling: ${esc(DR_MOODL[d.mood]||d.mood)}</span>`:''}</button>`}).join('')}`).join('');
}
function drArchive(){
 return nightSub(`<div class="sub">${hdr('Dream Archive',{sub:'The worlds you have visited while you slept.'})}
 <div class="field"><label for="drq" class="sr-only">Search dreams or symbols</label><input type="search" id="drq" placeholder="Search dreams or symbols…" value="${esc(V.drQ||'')}" autocomplete="off"></div>
 <div class="dr-book" id="drlist">${drArchiveList(V.drQ)}</div></div>`,'dj ss dr');
}
// ---- Compatibility & Connections (Oracle): one entrance to three readings, from general curiosity to the most personal.
// Zodiac Compatibility (two signs, no personal details), Relationship Insights (two people and the nature of their bond,
// with an optional question) and Birth Chart Comparison (synastry from real birth details; without birth times the
// houses, Ascendant and an uncertain Moon are left out). The input and the reading share one page; the people chosen,
// the signs and the relationship type carry from one reading to the next. People are kept in My Relationships only when
// the reader chooses (their birth details only with the reader's word that they have permission); readings are kept in
// Your Readings. No percentages, no verdicts: astrology as a symbolic mirror for reflection.
const CN_RELS=[['romantic','Romantic'],['friendship','Friendship'],['family','Family'],['professional','Professional'],['other','Other']];
const CN_RELN=Object.fromEntries(CN_RELS);
const CN_TYPES={zodiac:'Zodiac Compatibility',insight:'Relationship Insights',chart:'Birth Chart Comparison'};
// ---- the book of connections: the words for each pairing when Kassandra is not asked
const CN_EL={'Fire-Fire':'Two fires feed each other: warmth, courage and a shared appetite for life, as long as both leave room to breathe.','Earth-Earth':'Two earth signs build on common ground: patience, loyalty and a love of what is real and lasting.','Air-Air':'Two air signs meet in the mind: ideas, conversation and a lightness that keeps the bond curious.','Water-Water':'Two water signs feel each other deeply: intuition, tenderness and an unspoken understanding.','Air-Fire':'Air feeds fire: inspiration, enthusiasm and a lively exchange that can lift you both.','Earth-Water':'Water nourishes earth: care, devotion and a quiet sense of safety that can grow over time.','Earth-Fire':'Fire brings spark to earth, earth gives fire a place to land: vision meets patience, if both respect the other’s pace.','Fire-Water':'Fire and water meet as passion and feeling: intense and transforming, asking for gentleness on both sides.','Air-Earth':'Air brings ideas, earth brings form: a meeting of the possible and the practical that can build something real.','Air-Water':'Air thinks, water feels: a meeting of head and heart that can teach each of you the other’s language.'};
const CN_FRIEND=['As friends, you recognise each other instantly and may share the same humour and the same blind spots.','As friends, you bring each other fresh perspectives, even when you do not quite understand one another.','As friends, you are natural companions: easy, encouraging and good at having fun together.','As friends, you challenge each other to grow, and the respect you earn is real.','As friends, you understand each other with little effort and tend to support one another naturally.','As friends, you learn from your differences, offering care in ways the other may not expect.','As friends, you balance each other, each holding what the other lacks.'];
const CN_CHAL=['Sharing the same nature can mean sharing the same blind spots; remember to give each other space.','Your instincts differ, so assumptions can slip in; asking rather than guessing helps.','Ease can become complacency; keep choosing each other’s company with intention.','Different rhythms and needs can create friction, which asks for patience rather than winning.','Harmony can make it tempting to avoid hard conversations; honesty keeps the bond alive.','What feels natural to one may feel foreign to the other; small adjustments go a long way.','You may pull in opposite directions; the meeting point lies in valuing what the other brings.'];
const CN_NUR={'Fire-Fire':'Share adventures, take turns leading, and cool down before difficult talks.','Earth-Earth':'Build rituals together, honour each other’s pace, and make room for the unexpected now and then.','Air-Air':'Keep talking, learn something new together, and remember to turn ideas into shared moments.','Water-Water':'Create a safe space for feelings, check in gently, and keep a little lightness close.','Air-Fire':'Dream out loud together, then choose one idea and bring it to life.','Earth-Water':'Show care in practical ways, and make time to talk about what you feel as well as what you do.','Earth-Fire':'Agree on a shared plan, but leave room for spontaneity; patience and enthusiasm both have a place.','Fire-Water':'Pause before reacting, speak your feelings gently, and celebrate the passion you share.','Air-Earth':'Give ideas a timeline and plans a little freedom; listen for what the other values most.','Air-Water':'Name feelings as well as thoughts, and give each other time to answer in your own way.'};
const CN_Q=['What do I see of myself in this person?','What could I learn from the way this person sees the world?','How can we keep this ease meaningful?','What is this friction inviting me to understand?','How can harmony make room for honesty between us?','What small adjustment would show my care in their language?','What does this person bring that I need more of?'];
const CN_REL={romantic:{support:'In love, support often looks like presence: listening, tenderness and making each other feel chosen.',bounds:'Romantic bonds flourish when each keeps a life of their own; closeness and independence can live together.',growth:'Growing together means letting each other change, and choosing each other again as you do.',q:'What helps me feel truly close to this person, and how can I offer the same?'},
 friendship:{support:'Friends support each other through loyalty, humour and simply showing up.',bounds:'Friendships stay healthy when both can say no without fear and yes with joy.',growth:'Friendship deepens through shared experiences and through honesty when it matters.',q:'How can I be the kind of friend I would love to have?'},
 family:{support:'Family support is often quiet: shared history, practical help and the steadiness of being known.',bounds:'Family roles can harden over time; gentle boundaries let each person be who they are now.',growth:'Growing together in a family means meeting each other as you are today, not only as you once were.',q:'What would I like this person to understand about who I am now?'},
 professional:{support:'At work, support means reliability, clear agreements and recognising each other’s strengths.',bounds:'Clear roles and expectations protect both the work and the relationship.',growth:'Growing together professionally means sharing goals and learning from each other’s ways of working.',q:'What working agreement would help us both do our best work?'},
 other:{support:'Support grows from attention: noticing what the other needs and offering what you can.',bounds:'Every bond needs space; knowing your limits helps the connection stay kind.',growth:'Growth comes from curiosity about each other and patience with your differences.',q:'What does this connection ask of me, and what does it give me?'}};
// aspects between two charts: the strengths, challenges and a suggestion for each kind of meeting
const CN_ASP={conjunction:['Your energies blend and amplify each other.','The intensity can be overwhelming at times.','Notice when you need the same thing at the same time.'],trine:['This tends to flow naturally, with little effort.','Ease can be taken for granted.','Appreciate this gift aloud from time to time.'],sextile:['This offers opportunities that grow when you both reach for them.','It asks for initiative to come alive.','Plan something that draws on this together.'],square:['Friction here can become a source of growth and energy.','It may create tension or repeated disagreements.','Approach it with curiosity rather than defence.'],opposition:['You can balance and complete each other.','You may pull in different directions.','Look for the middle ground where both needs are honoured.']};
const CN_GROUPS=[['Sun','sun','Sun Connections','Identity and mutual understanding'],['Moon','moon','Moon Connections','Emotional needs and emotional dynamics'],['Mercury','mercury','Mercury Connections','Communication and intellectual connection'],['Venus','venus','Venus Connections','Affection, appreciation and shared values'],['Mars','mars','Mars Connections','Motivation, attraction and conflict'],['Jupiter','jupiter','Jupiter Connections','Growth, encouragement and expansion'],['Saturn','saturn','Saturn Connections','Responsibility, boundaries and commitment'],['outer','outer','Outer Planet Connections','Deeper symbolic and transformative themes']];
const CN_HARM=['trine','sextile'],CN_TENS=['square','opposition'];
// ---- people: the reader, someone kept in My Relationships, or someone new entered on the page
const cnPeople=()=>S.bookmarks.filter(b=>b.kind==='person').map(b=>b.data||{}).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
const cnPerson=id=>cnPeople().find(p=>p.id===id);
const cnReads=()=>S.bookmarks.filter(b=>b.kind==='conn').map(b=>b.data||{}).sort((a,b)=>(b.at||'')>(a.at||'')?1:-1);
const cnX=()=>V.cx||(V.cx={a:{who:'me'},b:{who:''},rel:'',q:'',na:{},nb:{},res:null,busy:false});
const cnMe=()=>({me:true,name:firstName()||'You',sign:S.sign,date:hasBirthDate()?S.birth.date:'',time:S.birth.unk?'':S.birth.time||'',unk:!!S.birth.unk||!S.birth.time,place:S.birth.place||'',lat:S.birth.lat,lon:S.birth.lon,tz:S.birth.tz||''});
function cnWho(slot){
 const X=cnX(),s=X[slot];if(!s||!s.who)return null;
 if(s.who==='me')return cnMe();
 if(s.who==='new'){const n=X['n'+slot]||{};const sign=n.sign||(n.date?sunSign(n.date):'');return Object.assign({},n,{sign,isNew:true,name:(n.name||'').trim()})}
 const p=cnPerson(s.who);return p?Object.assign({},p,{sign:p.sign||(p.date?sunSign(p.date):'')}):null;
}
function cnSaveBm(kind,d){const b=S.bookmarks.find(x=>x.kind===kind&&x.ref===d.id);if(b){b.data=d}else S.bookmarks.push({id:d.id,kind,ref:d.id,data:d,at:d.at||new Date().toISOString()});save();const bb=S.bookmarks.find(x=>x.kind===kind&&x.ref===d.id);C.saveBookmark&&C.saveBookmark(bb).then(()=>{bb.sy=true;save()},()=>{})}
// a new person kept in My Relationships; their birth details only with the reader's word that they agreed
function cnKeepNew(slot){
 const X=cnX(),n=X['n'+slot]||{};if(!(n.name||'').trim())return null;
 const p={id:uuid(),at:new Date().toISOString(),name:n.name.trim(),rel:X.rel||'',sign:n.sign||(n.date?sunSign(n.date):''),consent:!!n.consent};
 if(n.consent)Object.assign(p,{date:n.date||'',time:n.unk?'':n.time||'',unk:!!n.unk||!n.time,place:n.place||'',lat:n.lat,lon:n.lon,tz:n.tz||''});
 cnSaveBm('person',p);X[slot]={who:p.id};X['n'+slot]={};toast(`${p.name} is kept in My Relationships`);return p;
}
// ---- the readings
function cnZodiac(a,b){
 const A1=sg(a),B1=sg(b),ia=SIGNS.indexOf(A1),ib=SIGNS.indexOf(B1),d=Math.min((ib-ia+12)%12,(ia-ib+12)%12),r=zodiacMatch(a,b),ep=[A1.el,B1.el].sort().join('-'),el=ELP[A1.el+'-'+B1.el]||ELP[B1.el+'-'+A1.el];
 return {title:AFF_T[d],sections:[['The Essence of Their Connection',`${A1.name} and ${B1.name}: ${AFF_T[d].toLowerCase().replace(/^a /,'a ')}. ${DIST[d][1]}`],['Elemental Connection',`${A1.name} is ${A1.el.toLowerCase()} and ${B1.name} is ${B1.el.toLowerCase()}. ${CN_EL[ep]}`],['Natural Harmony',`${r.themes[3][1]} ${r.themes[4][1]}`],['Emotional Connection',el[1]],['Communication',el[0]],['Love & Romance',`${A1.name} tends to love ${STYLE[a]}; ${B1.name} ${STYLE[b]}. ${DIST[d][1]}`],['Friendship',CN_FRIEND[d]],['Areas of Challenge',CN_CHAL[d]],['Nurturing the Connection',CN_NUR[ep]]],reflect:CN_Q[d]};
}
function cnInsightLocal(A,B,rel,q){
 const z=cnZodiac(A.sign,B.sign),R=CN_REL[rel]||CN_REL.other,s=Object.fromEntries(z.sections);
 return {essence:`In this ${({romantic:'romantic relationship',friendship:'friendship',family:'family bond',professional:'working relationship'})[rel]||'connection'}, ${A.name} and ${B.name} meet as ${sg(A.sign).name} and ${sg(B.sign).name}. ${s['The Essence of Their Connection']}`,
  together:s['Natural Harmony'],emotional:s['Emotional Connection'],communication:s['Communication'],support:R.support,tension:s['Areas of Challenge'],boundaries:R.bounds,growth:R.growth,
  answer:q?`You asked: “${q}” Astrology cannot answer for another person, but it can offer a way in: ${s['Communication'].charAt(0).toLowerCase()+s['Communication'].slice(1)} Consider asking them gently how it feels from their side.`:'',
  nurture:s['Nurturing the Connection'],reflection:R.q,ai:false};
}
const CN_INS=[['essence','The Essence of Your Bond'],['together','What Brings You Together'],['emotional','Emotional Dynamics'],['communication','Communication'],['support','Mutual Support'],['tension','Areas of Tension'],['boundaries','Boundaries & Expectations'],['growth','Growth Together'],['answer','Your Personal Question'],['nurture','Nurturing Your Connection']];
// the synastry itself, calculated from both birth details
function cnSynastry(A,B){
 const ch=p=>K.chart({date:p.date,time:p.unk?'':p.time,unk:!!p.unk||!p.time||!p.tz,lat:p.lat,lon:p.lon,tz:p.tz||'UTC'});
 const ca=ch(A),cb=ch(B),ta=ca.known,tb=cb.known,full=ta&&tb;
 const pts=(c,timed)=>c.pl.filter(p=>!(p.n==='Moon'&&c.moonRange)).concat(timed&&c.ang?[{n:'Ascendant',lon:c.ang.asc,sign:K.signIdx(c.ang.asc)}]:[]);
 const asp=K.aspects(pts(ca,ta),pts(cb,tb),'synastry').filter(x=>!(['Uranus','Neptune','Pluto'].includes(x.a.n)&&['Uranus','Neptune','Pluto'].includes(x.b.n)));
 const order=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'],grp=x=>{const i=Math.min(...[x.a.n,x.b.n].map(n=>{const k=order.indexOf(n);return k<0?99:k}));return i<99?order[i]:'outer'};
 const list=asp.map(x=>({a:x.a.n,b:x.b.n,n:x.n,g:x.g,orb:+x.orb.toFixed(1),sa:sIdx(x.a.sign).name,sb:sIdx(x.b.sign).name,grp:grp(x)})).sort((p,q)=>p.orb-q.orb).slice(0,24);
 const hs=[];if(full){const h=(lon,asc)=>((K.signIdx(lon)-K.signIdx(asc)+12)%12)+1;
  ca.pl.filter(p=>['Sun','Moon','Venus','Mars'].includes(p.n)).forEach(p=>hs.push({who:A.name,p:p.n,in:B.name,h:h(p.lon,cb.ang.asc)}));
  cb.pl.filter(p=>['Sun','Moon','Venus','Mars'].includes(p.n)).forEach(p=>hs.push({who:B.name,p:p.n,in:A.name,h:h(p.lon,ca.ang.asc)}))}
 const place=c=>c.pl.map(p=>({n:p.n,s:p.n==='Moon'&&c.moonRange?`${sIdx(c.moonRange[0]).name} or ${sIdx(c.moonRange[1]).name}`:sIdx(p.sign).name})).concat(c.known&&c.ang?[{n:'Ascendant',s:sIdx(K.signIdx(c.ang.asc)).name}]:[]);
 return {aspects:list,houses:hs,pa:place(ca),pb:place(cb),limited:!full,ta,tb};
}
function cnChartLocal(A,B,rel,syn){
 const h=syn.aspects.filter(x=>CN_HARM.includes(x.n)).length,t=syn.aspects.filter(x=>CN_TENS.includes(x.n)).length,R=CN_REL[rel]||CN_REL.other,groups={};
 CN_GROUPS.forEach(([pl,k])=>{const l=syn.aspects.filter(x=>x.grp===pl);groups[k]=l.length?l.slice(0,2).map(x=>`${x.a===x.b?'Your two':''}${A.name}’s ${x.a} and ${B.name}’s ${x.b} ${ASPT[x.n]}`).join('. ')+'.':''});
 return {essence:`Between ${A.name}’s and ${B.name}’s charts there are ${syn.aspects.length} significant meetings: ${h} flowing and ${t} challenging. ${h>=t?'Ease tends to outweigh friction here, which may make the connection feel natural.':'Friction is part of this connection, which can bring both tension and growth.'}`,
  groups,story:`The story of your two skies is written in these meetings: where your planets flow, there is ease to rely on; where they press against each other, there is something to learn. ${R.growth}`,nurture:R.support+' '+R.bounds,reflection:R.q,ai:false};
}
// ---- the pages
const cnHd=(t,sub)=>hdr(t,{sub});
const cnPage=(h)=>nightSub(`<div class="sub">${h}</div>`,'dj ss cn');
function cnHome(){
 const n=cnPeople().length;
 return cnPage(`${cnHd('Connections','Discover the invisible threads that bring us together.')}
 <div class="list cn-doors">${ssDoor('☉','Zodiac Compatibility','Explore the natural harmony, differences and potential between two zodiac signs.','data-go="discover" data-t="affinity"','big')}
 ${ssDoor('♡','Relationship Insights','Understand the dynamics, strengths and challenges between two people, in love, friendship or another meaningful relationship.','data-go="discover" data-t="insights"','big')}
 ${ssDoor('✶','Birth Chart Comparison','Explore a deeper connection through the planetary placements and interactions between two birth charts.','data-go="discover" data-t="synastry"','big')}</div>
 <button class="dr-link" data-go="you" data-t="people">My Relationships${n?` · ${n} ${n===1?'person':'people'}`:''} ${IC.chev}</button>`);
}
const cnSec=(t,body)=>body?`${ssHead(t)}<div class="dr-text"><p>${esc(body)}</p></div>`:'';
const cnSignSel=(id,label,v)=>`<div class="field"><label for="${id}">${label}</label><select id="${id}" data-cn="sign">${v?'':'<option value="">Choose a sign</option>'}${SIGNS.map(s=>`<option value="${s.id}" ${v===s.id?'selected':''}>${s.g} ${s.name}</option>`).join('')}</select></div>`;
function cnActs(kind,R){
 const saved=R.saved;
 return `<div class="ss-acts"><button class="btn${saved?' ghost':''}" data-cn="keep" ${saved?'disabled':''}>${saved?'✓ In Your Readings':'Save to Your Readings'}</button><button class="btn ghost" data-cn="journal">Reflect in My Journal</button></div>`;
}
function cnZodiacView(){
 const L=V.love,a=L.a||S.sign,b=L.b,z=L.done&&a&&b?cnZodiac(a,b):null,X=cnX();
 return cnPage(`${cnHd('Zodiac Compatibility','The natural harmony between two signs.')}
 <div class="two cn-two">${cnSignSel('za','First sign',a)}${cnSignSel('zb','Second sign',b)}</div>
 <button class="btn" data-cn="zgo" ${b?'':'disabled'}>Explore Their Connection</button>
 ${z?`<div class="dr-hero" id="cnres"><h2>${sg(a).name} &amp; ${sg(b).name}</h2><p class="dr-kw">${esc(z.title)}</p></div>
 ${z.sections.map(([t,x])=>cnSec(t,x)).join('')}
 ${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(z.reflect)}”</p>`,'dr-q')}
 ${cnActs('zodiac',{saved:L.saved})}
 <div class="cn-next">${ssHead('Go deeper')}<div class="list">${ssDoor('♡','Relationship Insights','Add the people and the nature of your bond.','data-cn="tonext" data-t="insights"')}${ssDoor('✶','Birth Chart Comparison','Compare two complete birth charts.','data-cn="tonext" data-t="synastry"')}</div></div>
 <p class="muted small center">Sign compatibility is a symbolic starting point for reflection, not a measure of any relationship.</p>`:''}`);
}
// choosing a person: the reader, someone kept, or someone new (their details entered here)
function cnPick(slot,label,chart){
 const X=cnX(),s=X[slot]||{},ppl=cnPeople(),other=X[slot==='a'?'b':'a']||{},n=X['n'+slot]||{};
 const opt=(who,l)=>`<button class="fchip" role="radio" aria-checked="${s.who===who}" data-cn="who" data-slot="${slot}" data-v="${who}">${l}</button>`;
 let form='';
 if(s.who==='new')form=`<div class="cn-new">
  <div class="field"><label for="cn-${slot}-name">Name or nickname</label><input type="text" id="cn-${slot}-name" data-cn="f" data-slot="${slot}" data-k="name" value="${esc(n.name||'')}" autocomplete="off"></div>
  <div class="two cn-two"><div class="field"><label for="cn-${slot}-date">Birth date${chart?'':' <i>or a sign</i>'}</label><input type="date" id="cn-${slot}-date" data-cn="f" data-slot="${slot}" data-k="date" value="${esc(n.date||'')}"></div>
  ${chart?'':`<div class="field"><label for="cn-${slot}-sign">Zodiac sign</label><select id="cn-${slot}-sign" data-cn="f" data-slot="${slot}" data-k="sign"><option value="">${n.date?sg(sunSign(n.date)).name+' (from the date)':'Choose'}</option>${SIGNS.map(x=>`<option value="${x.id}" ${n.sign===x.id?'selected':''}>${x.name}</option>`).join('')}</select></div>`}</div>
  ${chart?cnBirthMore(slot,n,true):`<details class="cn-more"${n.time||n.place?' open':''}><summary>Birth time and place · Optional</summary>${cnBirthMore(slot,n)}</details>`}
  <label class="row cn-cb"><input type="checkbox" class="cb" data-cn="f" data-slot="${slot}" data-k="keep" ${n.keep?'checked':''}> <span>Save to My Relationships</span></label>
  ${n.keep?`<label class="row cn-cb"><input type="checkbox" class="cb" data-cn="f" data-slot="${slot}" data-k="consent" ${n.consent?'checked':''}> <span>They are happy for me to keep their birth details</span></label>`:''}</div>`;
 return `<div class="cn-pick">${ssHead(label)}<div class="fchips ss-chips">${other.who==='me'?'':opt('me','Me')}${ppl.filter(p=>p.id!==other.who).map(p=>opt(p.id,esc(p.name))).join('')}${opt('new','+ Someone new')}</div>${form}</div>`;
}
function cnBirthMore(slot,n,chart){
 const P=V.places['cn'+slot]||{};
 return `${chart?`<label class="row cn-cb"><input type="checkbox" class="cb" data-cn="f" data-slot="${slot}" data-k="unk" ${n.unk?'checked':''}> <span>Birth time unknown</span></label>`:''}${n.unk?'':`<div class="field"><label for="cn-${slot}-time">Birth time${chart?'':' (optional)'}</label><input type="time" id="cn-${slot}-time" data-cn="f" data-slot="${slot}" data-k="time" value="${esc(n.time||'')}"></div>`}
 <div class="field"><label for="cn${slot}-q">Birthplace${chart?'':' (optional)'}</label><div class="row nowrap"><input type="text" id="cn${slot}-q" value="${esc(P.q!=null?P.q:n.place||'')}" placeholder="Town or city" autocomplete="off"><button class="btn ghost sm" data-cn="psearch" data-slot="${slot}">Search</button></div>
 ${P.busy?'<p class="muted small">Searching…</p>':''}${P.err?`<p class="err small">${esc(P.err)}</p>`:''}${P.results?(P.results.length?`<ul class="places">${P.results.map((r,i)=>`<li><button class="link" data-cn="ppick" data-slot="${slot}" data-i="${i}">${esc([r.name,r.admin1,r.country].filter(Boolean).join(', '))}</button></li>`).join('')}</ul>`:'<p class="muted small">No places found. Try a nearby larger town.</p>'):''}
 ${n.place&&!P.results?`<p class="muted small">${esc(n.place)}</p>`:''}</div>`;
}
const cnRelPick=()=>{const X=cnX();return `${ssHead('The nature of your connection')}<div class="fchips ss-chips">${CN_RELS.map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${X.rel===k}" data-cn="rel" data-v="${k}">${l}</button>`).join('')}</div>`};
function cnNewSaveBtns(){
 return ['a','b'].map(sl=>{const s=cnX()[sl]||{},n=cnX()['n'+sl]||{};return s.who==='new'&&(n.name||'').trim()?`<button class="btn ghost" data-cn="keepp" data-slot="${sl}">Save ${esc(n.name.trim())} to My Relationships</button>`:''}).join('');
}
function cnInsightsView(){
 const X=cnX(),R=X.res&&X.res.kind==='insight'?X.res:null;
 if(X.busy)return `<div class="sub">${hdr('Relationship Insights')}<div class="reading-anim">${ui('owl','ra-owl')}<p class="quote center">Kassandra is reading your connection…</p></div></div>`;
 const A=cnWho('a'),B=cnWho('b');
 return cnPage(`${cnHd('Relationship Insights','The dynamics, strengths and challenges between two people.')}
 ${cnPick('a','First person')}${cnPick('b','Second person')}${cnRelPick()}
 <div class="field"><label for="cnq">What would you like to understand? <i>(Optional)</i></label><textarea id="cnq" rows="2" maxlength="300" placeholder="Why do we communicate so differently?">${esc(X.q||'')}</textarea></div>
 <button class="btn" data-cn="igo">Explore Their Connection</button>
 ${R?`<div class="dr-hero" id="cnres"><h2>${esc(R.na)} &amp; ${esc(R.nb)}</h2><p class="dr-kw">${esc(CN_RELN[R.rel]||'')} · ${esc(sg(R.sa).name)} and ${esc(sg(R.sb).name)}</p></div>
 ${CN_INS.map(([k,t])=>cnSec(t,R.r[k])).join('')}
 ${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(R.r.reflection||'')}”</p>`,'dr-q')}
 ${cnActs('insight',R)}<div class="ss-acts">${cnNewSaveBtns()}</div>
 <div class="cn-next"><div class="list">${ssDoor('✶','Birth Chart Comparison','Continue with these two people and their full birth charts.','data-cn="tonext" data-t="synastry"')}</div></div>
 <p class="muted small center">${R.r.ai?'Read by Kassandra with AI. ':'Read from Kosmia’s book of connections. '}Astrology is offered as a symbolic mirror for reflection; it cannot know another person’s thoughts or feelings.</p>`:''}`);
}
// what a chart still needs: a date always; a time and place for houses and the Ascendant
function cnNeeds(p){if(!p)return null;return {date:!!p.date,time:!p.unk&&!!p.time,place:!!(p.place&&p.tz)}}
function cnChartView(){
 const X=cnX(),R=X.res&&X.res.kind==='chart'?X.res:null;
 if(X.busy)return `<div class="sub">${hdr('Birth Chart Comparison')}<div class="reading-anim">${ui('owl','ra-owl')}<p class="quote center">Kosmia is calculating both skies…</p></div></div>`;
 if(!A)return `<div class="sub">${hdr('Birth Chart Comparison')}${needLib()}</div>`;
 const PA=cnWho('a'),PB=cnWho('b'),na=cnNeeds(PA),nb=cnNeeds(PB);
 const cell=(ok,req)=>ok?'<span class="cn-ok">✓</span>':`<span class="cn-miss">${req?'Needed':'For full chart'}</span>`;
 const fix=(P,slot)=>!P||P.isNew?'':P.me?(!P.date||P.unk||!P.place?`<button class="dr-link" data-go="discover" data-t="profile">Complete my birth details ${IC.chev}</button>`:''):(!P.date||P.unk||!P.place)?`<button class="dr-link" data-cn="editp" data-id="${esc(P.id)}">Complete ${esc(P.name)}’s birth details ${IC.chev}</button>`:'';
 const table=PA&&PB?`${ssHead('Birth details')}<table class="cn-tab"><tr><th></th><th>${esc(PA.name||'First')}</th><th>${esc(PB.name||'Second')}</th></tr><tr><td>Birth date</td><td>${cell(na.date,1)}</td><td>${cell(nb.date,1)}</td></tr><tr><td>Birth time</td><td>${cell(na.time)}</td><td>${cell(nb.time)}</td></tr><tr><td>Birthplace</td><td>${cell(na.place)}</td><td>${cell(nb.place)}</td></tr></table>${fix(PA,'a')}${fix(PB,'b')}
 ${na.date&&nb.date&&(!na.time||!nb.time||!na.place||!nb.place)?'<p class="muted small">Without both birth times and places, you can still compare: houses, Ascendants and other time-sensitive details are left out rather than guessed.</p>':''}`:'';
 return cnPage(`${cnHd('Birth Chart Comparison','Two skies, read side by side.')}
 ${cnPick('a','First person',true)}${cnPick('b','Second person',true)}${table}${cnRelPick()}
 <button class="btn" data-cn="cgo">Compare Birth Charts</button>
 ${R?cnChartReading(R):''}`);
}
function cnChartReading(R){
 const s=R.syn,r=R.r,line=x=>`${esc(R.na)}’s ${x.a} ${x.g} ${esc(R.nb)}’s ${x.b}`;
 const aspCard=x=>{const c=CN_ASP[x.n]||['','',''];return `<details class="acc cn-asp"><summary><span class="lr-t"><strong>${line(x)}</strong><span>${cap(x.n)} · ${PM[x.a]} and ${PM[x.b]}</span></span><span class="lr-c">${IC.chev}</span></summary><div class="acc-b">
  <p><strong>Its meaning:</strong> ${esc(R.na)}’s ${x.a} (${PM[x.a]}) and ${esc(R.nb)}’s ${x.b} (${PM[x.b]}) ${ASPT[x.n]}.</p><p><strong>A possible strength:</strong> ${c[0]}</p><p><strong>A possible challenge:</strong> ${c[1]}</p><p><strong>To nurture it:</strong> ${c[2]}</p>
  <details class="cn-tech"><summary>Technical details</summary><p class="small">${x.a} in ${x.sa}, ${x.b} in ${x.sb}; ${x.n} with an orb of ${x.orb}°.</p></details></div></details>`};
 const grp=CN_GROUPS.map(([pl,k,t,sub])=>{const l=s.aspects.filter(x=>x.grp===pl);if(!l.length)return '';return `${ssHead(t)}<p class="cn-gsub">${sub}</p>${r.groups&&r.groups[k]?`<div class="dr-text"><p>${esc(r.groups[k])}</p></div>`:''}<div class="list">${l.map(aspCard).join('')}</div>`}).join('');
 const harm=s.aspects.filter(x=>CN_HARM.includes(x.n)),tens=s.aspects.filter(x=>CN_TENS.includes(x.n));
 return `<div class="dr-hero" id="cnres"><h2>${esc(R.na)} &amp; ${esc(R.nb)}</h2><p class="dr-kw">${esc(CN_RELN[R.rel]||'')} · ${s.aspects.length} meetings between your skies</p></div>
 ${ssHead('Your Two Birth Charts')}<table class="cn-tab cn-pl"><tr><th></th><th>${esc(R.na)}</th><th>${esc(R.nb)}</th></tr>${s.pa.map((p,i)=>`<tr><td>${p.n}</td><td>${esc(p.s)}</td><td>${esc((s.pb.find(q=>q.n===p.n)||{s:'·'}).s)}</td></tr>`).join('')}${!s.pa.some(p=>p.n==='Ascendant')&&s.pb.some(p=>p.n==='Ascendant')?`<tr><td>Ascendant</td><td>·</td><td>${esc(s.pb.find(p=>p.n==='Ascendant').s)}</td></tr>`:''}</table>
 ${s.limited?`<p class="muted small">${!s.ta&&!s.tb?'Both birth times or places are':(!s.ta?esc(R.na)+'’s':esc(R.nb)+'’s')+' birth time or place is'} missing, so houses and the Ascendant are left out${s.pa.concat(s.pb).some(p=>/ or /.test(p.s))?', and the Moon’s sign is uncertain, so its aspects are left out too':''}.</p>`:''}
 ${cnSec('The Essence of Your Connection',r.essence)}
 ${grp}
 ${s.houses.length?`${ssHead('House Connections')}<div class="dr-text">${s.houses.map(h=>`<p>${esc(h.who)}’s ${h.p} falls in ${esc(h.in)}’s ${h.h}${['st','nd','rd'][h.h-1]||'th'} house: ${HOUSE[h.h-1]}.</p>`).join('')}</div>`:''}
 ${ssHead('Harmonious Aspects')}<div class="dr-text"><p>${harm.length?harm.map(line).join('; ')+'.':'No flowing aspects within orb; ease may come from elsewhere.'}</p></div>
 ${ssHead('Challenging Aspects')}<div class="dr-text"><p>${tens.length?tens.map(line).join('; ')+'.':'No challenging aspects within orb.'}</p></div>
 ${cnSec('The Story of Your Two Skies',r.story)}${cnSec('Nurturing Your Connection',r.nurture)}
 ${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(r.reflection||'')}”</p>`,'dr-q')}
 ${R.view?'':`${cnActs('chart',R)}<div class="ss-acts">${cnNewSaveBtns()}</div>`}
 <p class="muted small center">${r.ai?'Interpreted by Kassandra with AI from positions calculated by Kosmia. ':'Positions calculated by Kosmia (tropical, geocentric); words from Kosmia’s own book. '}Symbolic, for reflection, never a verdict on a relationship.</p>`;
}
// a saved reading, read again exactly as it was
function cnReadView(){
 const d=cnReads().find(x=>x.id===(V.cnId||(V.q||{}).id));
 if(!d)return `<div class="sub">${hdr('Your Reading')}${empty('This reading is no longer here','It may have been removed on another device.',linkBtn('Connections','discover','connections','btn'))}</div>`;
 let body='';
 if(d.type==='zodiac'){const z=d.z;body=`<div class="dr-hero"><h2>${esc(sg(d.signs[0]).name)} &amp; ${esc(sg(d.signs[1]).name)}</h2><p class="dr-kw">${esc(z.title)}</p></div>${z.sections.map(([t,x])=>cnSec(t,x)).join('')}${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(z.reflect)}”</p>`,'dr-q')}`}
 else if(d.type==='insight')body=`<div class="dr-hero"><h2>${esc(d.na)} &amp; ${esc(d.nb)}</h2><p class="dr-kw">${esc(CN_RELN[d.rel]||'')}</p></div>${d.q?`<p class="cn-q">You asked: “${esc(d.q)}”</p>`:''}${CN_INS.map(([k,t])=>cnSec(t,d.r[k])).join('')}${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(d.r.reflection||'')}”</p>`,'dr-q')}`;
 else body=cnChartReading(Object.assign({view:true},d));
 const del=V.cnDel===d.id?`<div class="dr-confirm"><p>Delete this reading?</p><div class="ss-acts"><button class="btn ghost" data-cn="delno">Keep it</button><button class="btn" data-cn="delread" data-id="${esc(d.id)}">Delete</button></div></div>`:'';
 return cnPage(`${cnHd(CN_TYPES[d.type],ymdLong(d.day,{day:'numeric',month:'long',year:'numeric'}))}${body}<div class="ss-acts"><button class="btn ghost" data-cn="rjournal" data-id="${esc(d.id)}">Reflect in My Journal</button></div><div class="dr-tools"><button class="dr-link" data-cn="del" data-id="${esc(d.id)}">Delete this reading</button></div>${del}`);
}
// My Relationships: the people kept, each with their details and readings
function cnPeopleView(){
 const l=cnPeople();
 return cnPage(`${cnHd('My Relationships','The people you have chosen to keep.')}
 ${l.length?`<div class="list">${l.map(p=>lrow(ssGlyph(p.sign?sg(p.sign).g:'✦','sm'),esc(p.name),[p.rel?CN_RELN[p.rel]:'',p.sign?sg(p.sign).name:'',p.date?'birth details kept':''].filter(Boolean).join(' · '),`data-cn="openp" data-id="${esc(p.id)}"`)).join('')}</div>`:mbox(`<h3>No one kept yet</h3><p>When you explore a connection with someone new, you can choose to keep them here, so you never have to enter their details twice.</p>`)}
 <button class="btn ghost" data-cn="addp">Add someone</button>
 <p class="muted small center">People you keep stay private to you. Their birth details are kept only when you say they are happy for you to keep them.</p>`);
}
function cnPersonView(){
 const id=V.cnPid,isNew=id==='new',p=isNew?(V.cnDraft||(V.cnDraft={name:'',rel:'',sign:'',date:'',time:'',unk:false,place:'',consent:false})):(V.cnDraft&&V.cnDraft.id===id?V.cnDraft:(V.cnDraft=Object.assign({},cnPerson(id)||{})));
 if(!isNew&&!cnPerson(id))return `<div class="sub">${hdr('My Relationships')}${empty('This person is no longer here','They may have been removed on another device.',linkBtn('My Relationships','discover','people','btn'))}</div>`;
 const reads=isNew?[]:cnReads().filter(r=>(r.pids||[]).includes(id)),P=V.places.cnp||{};
 const del=V.cnDel===id?`<div class="dr-confirm"><p>Remove ${esc(p.name)} from My Relationships?${reads.length?` ${reads.length===1?'One saved reading includes':reads.length+' saved readings include'} them.`:''}</p><div class="ss-acts">${reads.length?`<button class="btn ghost" data-cn="delp" data-id="${esc(id)}" data-all="0">Remove, keep the readings</button><button class="btn" data-cn="delp" data-id="${esc(id)}" data-all="1">Remove them and the readings</button>`:`<button class="btn" data-cn="delp" data-id="${esc(id)}" data-all="0">Remove</button>`}<button class="btn ghost" data-cn="delno">Cancel</button></div></div>`:'';
 return cnPage(`${cnHd(isNew?'Someone New':esc(p.name),isNew?'Kept in My Relationships':'In My Relationships')}
 <div class="field"><label for="cp-name">Name or nickname</label><input type="text" id="cp-name" data-cn="pf" data-k="name" value="${esc(p.name||'')}" autocomplete="off"></div>
 <div class="field"><label for="cp-rel">Your relationship</label><select id="cp-rel" data-cn="pf" data-k="rel"><option value="">Choose</option>${CN_RELS.map(([k,l])=>`<option value="${k}" ${p.rel===k?'selected':''}>${l}</option>`).join('')}</select></div>
 <div class="field"><label for="cp-sign">Zodiac sign</label><select id="cp-sign" data-cn="pf" data-k="sign"><option value="">${p.date?sg(sunSign(p.date)).name+' (from the date)':'Choose'}</option>${SIGNS.map(x=>`<option value="${x.id}" ${p.sign===x.id?'selected':''}>${x.name}</option>`).join('')}</select></div>
 ${ssHead('Birth details')}<label class="row cn-cb"><input type="checkbox" class="cb" data-cn="pf" data-k="consent" ${p.consent?'checked':''}> <span>They are happy for me to keep their birth details</span></label>${`<div class="field"><label for="cp-date">Birth date</label><input type="date" id="cp-date" data-cn="pf" data-k="date" value="${esc(p.date||'')}"></div>
 <label class="row cn-cb"><input type="checkbox" class="cb" data-cn="pf" data-k="unk" ${p.unk?'checked':''}> <span>Birth time unknown</span></label>${p.unk?'':`<div class="field"><label for="cp-time">Birth time</label><input type="time" id="cp-time" data-cn="pf" data-k="time" value="${esc(p.time||'')}"></div>`}
 <div class="field"><label for="cnp-q">Birthplace</label><div class="row nowrap"><input type="text" id="cnp-q" value="${esc(P.q!=null?P.q:p.place||'')}" placeholder="Town or city" autocomplete="off"><button class="btn ghost sm" data-cn="psearch" data-slot="p">Search</button></div>
 ${P.busy?'<p class="muted small">Searching…</p>':''}${P.results?(P.results.length?`<ul class="places">${P.results.map((r,i)=>`<li><button class="link" data-cn="ppick" data-slot="p" data-i="${i}">${esc([r.name,r.admin1,r.country].filter(Boolean).join(', '))}</button></li>`).join('')}</ul>`:'<p class="muted small">No places found.</p>'):''}${p.place&&!P.results?`<p class="muted small">${esc(p.place)}</p>`:''}</div>`}<p class="muted small">Birth details are kept only when they are happy for you to keep them; otherwise only their name, sign and your relationship are kept.</p>
 <button class="btn" data-cn="savep">${isNew?'Keep in My Relationships':'Save changes'}</button>
 ${isNew?'':`<div class="list cn-next">${ssDoor('♡','Relationship Insights',`You and ${esc(p.name)}`,`data-cn="withp" data-t="insights" data-id="${esc(id)}"`)}${ssDoor('✶','Birth Chart Comparison',`Your chart and ${esc(p.name)}’s`,`data-cn="withp" data-t="synastry" data-id="${esc(id)}"`)}</div>
 ${reads.length?`${ssHead('Previous readings')}<div class="list">${reads.map(r=>lrow('',CN_TYPES[r.type],relDay(r.day),`data-cn="openr" data-id="${esc(r.id)}"`)).join('')}</div>`:''}
 <div class="dr-tools"><button class="dr-link" data-cn="del" data-id="${esc(id)}">Remove from My Relationships</button></div>${del}`}`);
}
{const CNV={connections:cnHome,affinity:cnZodiacView,insights:cnInsightsView,synastry:cnChartView,people:cnPeopleView,person:cnPersonView,'conn-reading':cnReadView};
 const vd=views.discover;views.discover=()=>CNV[tab()]?CNV[tab()]():vd()}
Object.assign(SSX,{cnReads,CN_TYPES});
// ---- reading, keeping and moving between the three
function cnPeopleOf(){const A=cnWho('a'),B=cnWho('b');return [A,B]}
function cnCheck(chart){
 const [A,B]=cnPeopleOf();
 if(!A||!B){toast('Choose both people first.');return null}
 for(const P of [A,B]){if(!P.name){toast('Add a name or nickname for each person.');return null}
  if(chart&&!P.date){toast(`${P.me?'Your':P.name+'’s'} birth date is needed to compare charts.`);return null}
  if(!chart&&!P.sign){toast(`Add ${P.me?'your':P.name+'’s'} sign or birth date.`);return null}}
 if(!cnX().rel){toast('Choose the nature of the connection.');return null}
 return [A,B];
}
const cnBrief=(P,ch)=>{const o={name:P.name,sun:sg(P.sign).name};if(ch){const g=n=>{const p=ch.pl.find(x=>x.n===n);return p?sIdx(p.sign).name:''};if(!ch.moonRange)o.moon=g('Moon');o.mercury=g('Mercury');o.venus=g('Venus');o.mars=g('Mars')}return o};
const cnChartOf=P=>{if(!A||!P.date)return null;try{return K.chart({date:P.date,time:P.unk?'':P.time,unk:!!P.unk||!P.time||!P.tz,lat:P.lat,lon:P.lon,tz:P.tz||'UTC'})}catch(e){return null}};
function cnKeepNewOnRead(){['a','b'].forEach(sl=>{const X=cnX();if(X[sl].who==='new'&&(X['n'+sl]||{}).keep)cnKeepNew(sl)})}
async function cnInsight(){
 const q=$('#cnq');if(q)cnX().q=q.value.trim();const AB=cnCheck(false);if(!AB)return;const [A,B]=AB,X=cnX();
 X.busy=true;render();let r=null;
 if(C.user&&C.connect){try{const x=await C.connect({kind:'insight',rel:X.rel,q:X.q,me:!!A.me,a:cnBrief(A,cnChartOf(A)),b:cnBrief(B,cnChartOf(B))});if(x&&x.essence)r=Object.assign({ai:true},x)}catch(e){toast(e.message||'Kassandra could not read this just now, so Kosmia’s own book has.')}}
 if(!r)r=cnInsightLocal(A,B,X.rel,X.q);
 X.busy=false;X.res={kind:'insight',id:uuid(),na:A.name,nb:B.name,sa:A.sign,sb:B.sign,rel:X.rel,q:X.q,r,pids:[A.id,B.id].filter(Boolean)};cnKeepNewOnRead();X.res.pids=[cnX().a.who,cnX().b.who].filter(w=>w&&w!=='me'&&w!=='new');if(S.settings.autosave!==false)cnKeepRead(true);render();cnScroll();
}
async function cnChart(){
 const AB=cnCheck(true);if(!AB)return;const [A,B]=AB,X=cnX();
 X.busy=true;render();await new Promise(r=>setTimeout(r,30));
 let syn;try{syn=cnSynastry(A,B)}catch(e){X.busy=false;render();return toast('These birth details could not be calculated. Check the dates and places.')}
 let r=null;
 if(C.user&&C.connect){try{const x=await C.connect({kind:'chart',rel:X.rel,a:cnBrief(A,cnChartOf(A)),b:cnBrief(B,cnChartOf(B)),limited:syn.limited,aspects:syn.aspects.map(x=>`${A.name}'s ${x.a} in ${x.sa} ${x.n} ${B.name}'s ${x.b} in ${x.sb} (orb ${x.orb})`),houses:syn.houses.map(h=>`${h.who}'s ${h.p} in ${h.in}'s house ${h.h}`)});if(x&&x.essence)r=Object.assign({ai:true},x)}catch(e){toast(e.message||'Kassandra could not read this just now, so Kosmia’s own book has.')}}
 if(!r)r=cnChartLocal(A,B,X.rel,syn);
 X.busy=false;X.res={kind:'chart',id:uuid(),na:A.name,nb:B.name,rel:X.rel,syn,r};cnKeepNewOnRead();X.res.pids=[cnX().a.who,cnX().b.who].filter(w=>w&&w!=='me'&&w!=='new');if(S.settings.autosave!==false)cnKeepRead(true);render();cnScroll();
}
const cnScroll=()=>requestAnimationFrame(()=>{const e=$('#cnres');if(e)e.scrollIntoView({behavior:'smooth',block:'start'})});
function cnKeepRead(quiet){
 const t=tab(),now=new Date().toISOString();let d;
 if(t==='affinity'){const L=V.love,a=L.a||S.sign;d={id:uuid(),type:'zodiac',day:dkey(),at:now,signs:[a,L.b],z:cnZodiac(a,L.b)};L.saved=true}
 else{const R=cnX().res;if(!R)return;d=Object.assign({type:R.kind,day:dkey(),at:now},R);delete d.kind;delete d.saved;R.saved=true}
 cnSaveBm('conn',d);if(!quiet)toast('Saved to Your Readings');render();
}
function cnJournal(title,q){const j={id:uuid(),day:dkey(),kind:'reflection',title:q||title,body:'',at:new Date().toISOString()};S.journal.push(j);save();openEntry('j:'+j.id)}
// moving on carries the signs, the people and the nature of the bond
function cnCarry(to){
 const X=cnX(),L=V.love;
 if(tab()==='affinity'&&L.b){const a=L.a||S.sign;if(!X.a.who)X.a={who:'me'};if(a!==S.sign&&X.a.who==='me'){X.a={who:'new'};X.na=Object.assign({},X.na,{sign:a})}if(!X.b.who||X.b.who==='new'){X.b={who:'new'};X.nb=Object.assign({},X.nb,{sign:X.nb.sign||L.b})}}
 X.res=null;go('discover',to);
}
function cnReadField(el){
 const X=cnX(),sl=el.dataset.slot,k=el.dataset.k,n=X['n'+sl]||(X['n'+sl]={});n[k]=el.type==='checkbox'?el.checked:el.value;
 return ['keep','consent','unk','sign'].includes(k)||el.type==='date';
}
document.addEventListener('input',e=>{const t=e.target;if(!t.dataset)return;
 if(t.dataset.cn==='f'){if(cnReadField(t)&&t.type!=='date')render()}
 else if(t.dataset.cn==='pf'){const p=V.cnDraft;if(!p)return;p[t.dataset.k]=t.type==='checkbox'?t.checked:t.value;if(t.type==='checkbox')render()}
 else if(t.id==='cnq')cnX().q=t.value});
document.addEventListener('change',e=>{const t=e.target;if(!t.dataset)return;
 if(t.id==='za'||t.id==='zb'){V.love[t.id==='za'?'a':'b']=t.value;V.love.done=false;V.love.saved=false;return render()}
 if(t.dataset.cn==='f'&&(t.type==='date'||t.tagName==='SELECT'))return render();
 if(t.dataset.cn==='pf'&&t.tagName==='SELECT'){V.cnDraft[t.dataset.k]=t.value;return render()}});
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-cn]');if(!t||t.tagName==='INPUT'||t.tagName==='SELECT')return;const a=t.dataset.cn,X=cnX();
 if(a==='zgo'){V.love.done=true;V.love.saved=false;if(S.settings.autosave!==false)cnKeepRead(true);render();return cnScroll()}
 if(a==='who'){X[t.dataset.slot]={who:t.dataset.v};X.res=null;return render()}
 if(a==='rel'){X.rel=t.dataset.v;return render()}
 if(a==='igo')return cnInsight();
 if(a==='cgo')return cnChart();
 if(a==='keep')return cnKeepRead();
 if(a==='journal'){const t2=tab(),q=t2==='affinity'?cnZodiac(V.love.a||S.sign,V.love.b).reflect:((X.res||{}).r||{}).reflection;return cnJournal('Reflecting on a connection',q)}
 if(a==='rjournal'){const d=cnReads().find(x=>x.id===t.dataset.id);if(!d)return;return cnJournal('Reflecting on a connection',d.type==='zodiac'?d.z.reflect:(d.r||{}).reflection)}
 if(a==='tonext')return cnCarry(t.dataset.t);
 if(a==='keepp'){cnKeepNew(t.dataset.slot);if(X.res)X.res.pids=[X.a.who,X.b.who].filter(w=>w&&w!=='me'&&w!=='new');return render()}
 if(a==='psearch'){const sl=t.dataset.slot,inp=$(sl==='p'?'#cnp-q':'#cn'+sl+'-q'),q=inp?inp.value.trim():'';const P=V.places['cn'+sl]={q};if(q.length<2){P.err='Type at least two letters of the place.';return render()}
  P.busy=true;render();fetch(`https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=${encodeURIComponent(q)}`).then(r=>r.json()).then(j=>{P.results=(j.results||[]).filter(x=>x.timezone)},()=>{P.err='The place search is unavailable right now.'}).then(()=>{P.busy=false;render()});return}
 if(a==='ppick'){const sl=t.dataset.slot,P=V.places['cn'+sl],r=P.results[+t.dataset.i],o=sl==='p'?V.cnDraft:(X['n'+sl]||(X['n'+sl]={}));Object.assign(o,{place:[r.name,r.admin1,r.country].filter(Boolean).join(', '),lat:r.latitude,lon:r.longitude,tz:r.timezone});V.places['cn'+sl]={};return render()}
 if(a==='openp'||a==='editp'){V.cnPid=t.dataset.id;V.cnDraft=null;V.cnDel=null;return go('you',a==='editp'?'person-edit':'person')}
 if(a==='addp'){V.cnPid='new';V.cnDraft=null;return go('you','person-edit')}
 if(a==='savep'){const p=V.cnDraft;if(!p||!(p.name||'').trim())return toast('Add a name or nickname.');if(!p.consent&&(p.date||p.time||p.place))return toast('Tick that they are happy for you to keep their birth details, or clear them.');const keep={id:p.id||uuid(),at:p.at||new Date().toISOString(),name:p.name.trim(),rel:p.rel||'',cat:p.cat||'',sign:p.sign||(p.consent&&p.date?sunSign(p.date):''),consent:!!p.consent};
  if(p.consent)Object.assign(keep,{date:p.date||'',time:p.unk?'':p.time||'',unk:!!p.unk||!p.time,place:p.place||'',lat:p.lat,lon:p.lon,tz:p.tz||''});
  cnSaveBm('person',keep);V.cnDraft=null;toast(`${keep.name} is kept in My Relationships`);if(V.cnPid==='new'){V.cnPid=keep.id;return go('you','person',{replace:true})}return goBack()}
 if(a==='withp'){X.a={who:'me'};X.b={who:t.dataset.id};X.rel=(cnPerson(t.dataset.id)||{}).rel||X.rel;X.res=null;return go('discover',t.dataset.t)}
 if(a==='openr'){V.cnId=t.dataset.id;return go('discover','conn-reading')}
 if(a==='del'){V.cnDel=t.dataset.id;return render()}
 if(a==='delno'){V.cnDel=null;return render()}
 if(a==='delread'){const b=S.bookmarks.find(x=>x.kind==='conn'&&x.ref===t.dataset.id);if(b){S.bookmarks.splice(S.bookmarks.indexOf(b),1);save();C.deleteBookmark&&C.deleteBookmark('conn',b.ref)}V.cnDel=null;toast('The reading is deleted');return goBack()}
 if(a==='delp'){const id=t.dataset.id,all=t.dataset.all==='1';
  const rm=(kind,ref)=>{const b=S.bookmarks.find(x=>x.kind===kind&&x.ref===ref);if(b){S.bookmarks.splice(S.bookmarks.indexOf(b),1);C.deleteBookmark&&C.deleteBookmark(kind,ref)}};
  if(all)cnReads().filter(r=>(r.pids||[]).includes(id)).forEach(r=>rm('conn',r.id));rm('person',id);save();
  ['a','b'].forEach(sl=>{if(X[sl]&&X[sl].who===id)X[sl]={who:''}});V.cnDel=null;toast(all?'Removed, with their readings':'Removed from My Relationships');return goBack()}
});
document.addEventListener('click',e=>{const t=e.target.closest('[data-ss-cn]');if(!t)return;V.cnId=t.dataset.id;V.sheet=null;go('discover','conn-reading')});

// ---- Tarot (Oracle): a ritual of discovery in four steps. The Tarot entrance (Daily Card, Ask the Tarot, the spreads
// opened in place, Explore the Deck), Prepare Your Reading (a question or "I'm open to guidance", an optional area of
// focus; skipped for the Daily Card), Draw Your Cards (a shuffled 78-card deck, cards chosen face down or drawn for the
// reader, each revealed in its position) and Your Tarot Reading (from the overall message to each card and on to
// guidance). A reading in progress is kept (S.tt) so leaving never loses it; a finished one is kept in Your Readings
// unless the reader turned automatic saving off.
const TT={
 daily:{n:'Daily Card',s:'A moment of guidance and reflection for today.',p:['Your card for today'],f:'general'},
 ask:{n:'Ask the Tarot',s:'Explore a question or situation on your mind.',p:['Your situation','What to understand','Your guidance'],f:''},
 present:{n:'The Present Moment',s:'Understand your current circumstances.',p:['What surrounds you','What needs attention','What may support you'],f:'general'},
 love:{n:'Love & Relationships',s:'Explore emotional connections and relationship dynamics.',p:['Your heart','The other heart','What connects you','What challenges you','What may help it grow'],f:'love'},
 career:{n:'Career & Purpose',s:'Reflect on your direction and professional journey.',p:['Where you are','Your strengths','What holds you back','What to develop','Where it may lead'],f:'career'},
 crossroads:{n:'The Crossroads',s:'Explore the possibilities surrounding a decision.',p:['The heart of the decision','One path','The other path','What you may be overlooking','What may guide your choice'],f:'decisions'},
 growth:{n:'Inner Growth',s:'Discover opportunities for personal development.',p:['Where you stand','What is ready to grow','What to release','Your hidden strength','Your next step'],f:'growth'},
 ppf:{n:'Past, Present & Future',s:'Reflect on how your journey is unfolding.',p:['Past','Present','Future'],f:'general'},
 celtic:{n:'The Celtic Cross',s:'An extensive exploration of a complex situation.',p:['The present','The challenge','The foundation','The past','The crown','The near future','Yourself','Your surroundings','Hopes and fears','The outcome'],f:''}};
const TT_SPREADS=['present','love','career','crossroads','growth','ppf','celtic'];
const TT_CELTIC=[[0,1,'The Heart of the Matter'],[2,5,'What Shapes It'],[6,9,'You and the Way Ahead']];
const TT_FOCUS=[['general','General guidance'],['love','Love & Relationships'],['career','Career & Purpose'],['growth','Personal Growth'],['wellbeing','Wellbeing'],['decisions','Decisions & Change']];
const TT_EX=['What should I pay more attention to right now?','What can I learn from my current relationship?','What is holding me back from making a change?','How can I move forward with greater confidence?'];
const TT_CTX={love:'love',career:'work',growth:'growth',wellbeing:'growth',decisions:'growth',general:'growth'};
const TT_SUIT={Cups:'feelings and relationships',Wands:'energy, passion and action',Swords:'thoughts, choices and truth',Pentacles:'work, the body and practical matters'};
const TT_Q={general:'What is this moment inviting me to notice?',love:'What does my heart need me to understand?',career:'What step would bring me closer to work that feels like mine?',growth:'What part of me is ready to grow?',wellbeing:'What would caring for myself look like today?',decisions:'What do I already know about this choice?'};
const ttX=()=>S.tt||null;
const ttSave=()=>save();
const ttCard=id=>dk(id)||{};
// the reading from Kosmia's own book, when Kassandra is not asked
function ttLocal(T){
 const cs=T.drawn.map(d=>Object.assign({},ttCard(d.id),{pos:d.pos,rv:d.rv})),ctx=TT_CTX[T.focus||'general'],kw=c=>String(c.rv?c.rev:c.up).split(/,\s*/)[0];
 const lc=s=>s?s.charAt(0).toLowerCase()+s.slice(1):s;
 const cards=cs.map(c=>`In the position of ${c.pos.toLowerCase()}, ${c.name}${c.rv?' reversed':''} invites reflection: ${lc(c.rv?c.revm:c.upm)}${cs.length<=5&&c[ctx]?' '+c[ctx]:''}`);
 const last=cs[cs.length-1],K=cap(kw(last));
 const titles=[`Finding ${K}`,`The Gift of ${K}`,`A Path Towards ${K}`,`The Season of ${K}`];
 const title=cs.length===1?`${cs[0].name}${cs[0].rv?' Reversed':''}`:titles[cs.reduce((a,c)=>a+c.name.length,0)%titles.length];
 const majors=cs.filter(c=>c.arcana==='major').length,suits={};cs.forEach(c=>{if(c.suit)suits[c.suit]=(suits[c.suit]||0)+1});const top=Object.entries(suits).sort((a,b)=>b[1]-a[1])[0];
 const message=cs.length===1?`${cs[0].name}${cs[0].rv?', reversed,':''} comes to you today, speaking of ${String(cs[0].rv?cs[0].rev:cs[0].up).toLowerCase()}. ${cs[0].rv?cs[0].revm:cs[0].upm}`
  :`Together, ${cs.map(c=>c.name).join(', ').replace(/, ([^,]*)$/,' and $1')} invite you to consider ${cs.slice(0,3).map(c=>kw(c).toLowerCase()).join(', ').replace(/, ([^,]*)$/,' and $1')}.${T.q?` In light of your question, they suggest looking at it through ${kw(last).toLowerCase()}.`:''}`;
 const connect=cs.length===1?'':[majors?`${majors===1?'One card is':majors+' cards are'} from the Major Arcana, which often marks themes of deeper significance.`:'All your cards come from the Minor Arcana, which tends to speak of everyday choices and situations.',top&&top[1]>1?`${top[0]} appear ${top[1]} times, drawing attention to ${TT_SUIT[top[0]]}.`:'',cs.some(c=>c.rv)?`${cs.filter(c=>c.rv).length===1?'One card is':cs.filter(c=>c.rv).length+' cards are'} reversed, which may point to energy that is turned inward or still unfolding.`:''].filter(Boolean).join(' ');
 const up=cs.filter(c=>!c.rv),rv=cs.filter(c=>c.rv);
 return {title,message,cards,connect,embrace:cs.length===1?'':`Embrace ${(up.length?up:cs).slice(0,2).map(c=>kw(c).toLowerCase()).join(' and ')}: qualities your cards bring forward.`,
  mindful:cs.length===1?'':`Be mindful of ${(rv.length?rv:cs.slice(1,2)).slice(0,2).map(c=>String(c.rv?c.rev:c.up).split(/,\s*/).slice(-1)[0].toLowerCase()).join(' and ')}, which may need gentle attention.`,
  guidance:last[ctx]||(last.rv?last.revm:last.upm),reflection:TT_Q[T.focus||'general'],ai:false};
}
// a fresh reading of a kind; the Daily Card goes straight to the draw
function ttStart(kind){
 const t=TT[kind];S.tt={id:uuid(),kind,q:'',open:false,focus:t.f||'',stage:kind==='daily'?'draw':'prep',deck:shuffle(DECK).map(c=>c.id),picks:[],drawn:[],res:null,key:''};ttSave();
}
function ttDraw(i){
 const T=ttX(),n=TT[T.kind].p.length;if(!T||T.drawn.length>=n||T.picks.includes(i))return;
 const r=new Uint8Array(1);crypto.getRandomValues(r);T.picks.push(i);T.drawn.push({id:T.deck[i],pos:TT[T.kind].p[T.drawn.length],rv:r[0]<64});ttSave();
}
async function ttRead(){
 const T=ttX();if(!T)return;T.stage='read';T.res=null;ttSave();render();window.scrollTo(0,0);
 let r=null;
 if(C.user&&C.interpret){V.ttBusy=true;render();try{const x=await C.interpret(T.kind,T.q,T.drawn.map(d=>({id:d.id,reversed:d.rv})),T.focus);if(x&&x.message)r=Object.assign({ai:true},x)}catch(e){toast(e.message||'The cards are quiet right now, so Kosmia’s own book has read them.')}V.ttBusy=false}
 if(!r)r=ttLocal(T);
 if(S.tt!==T)return;T.res=r;T.at=new Date().toISOString();T.day=dkey();
 if(S.settings.autosave!==false)ttKeep(T,true);
 if(T.kind==='daily')S.tdaily={day:dkey(),id:T.id};
 ttSave();render();
}
function ttKeep(T,quiet){
 if(!T||!T.res)return;const d={id:T.id,type:T.kind,q:T.q,open:T.open,focus:T.focus,day:T.day||dkey(),at:T.at||new Date().toISOString(),cards:T.drawn.map(c=>({id:c.id,name:ttCard(c.id).name,pos:c.pos,rv:c.rv})),r:T.res};
 const b=S.bookmarks.find(x=>x.kind==='tarot'&&x.ref===d.id);if(b)b.data=d;else S.bookmarks.push({id:d.id,kind:'tarot',ref:d.id,data:d,at:d.at});
 T.key='tarot:'+d.id;save();const bb=S.bookmarks.find(x=>x.kind==='tarot'&&x.ref===d.id);C.saveBookmark&&C.saveBookmark(bb).then(()=>{bb.sy=true;save()},()=>{});if(!quiet)toast('Saved to Your Readings');
}
const ttSaved=()=>S.bookmarks.filter(b=>b.kind==='tarot').map(b=>b.data||{}).sort((a,b)=>(b.at||'')>(a.at||'')?1:-1);
const ttToday=()=>{const D=S.tdaily;if(!D||D.day!==dkey())return null;return ttSaved().find(x=>x.id===D.id)||(S.tt&&S.tt.id===D.id&&S.tt.res?S.tt:null)};
// the reading itself, for a reading just drawn and for a saved one alike
function ttBody(d){
 const r=d.r||d.res||{},cards=(d.cards||d.drawn||[]).map(c=>Object.assign({},ttCard(c.id),{pos:c.pos,rv:c.rv})),daily=d.type==='daily'||d.kind==='daily',kind=d.type||d.kind;
 const thumb=c=>`<figure class="tt-th${c.rv?' rev':''}">${pic('deck',c.id,'tt-img')}<figcaption><strong>${esc(c.name)}${c.rv?' <i>reversed</i>':''}</strong><span>${esc(c.pos)}</span></figcaption></figure>`;
 const one=(c,i)=>`<div class="dr-sym tt-one">${pic('deck',c.id,'tt-mini'+(c.rv?' rev':''))}<div><strong>${esc(c.name)}${c.rv?' reversed':''}</strong><span class="dr-keys">${esc(c.pos)} · ${esc(String(c.rv?c.rev:c.up).split(/,\s*/).slice(0,3).join(' · '))}</span><p>${esc((r.cards||[])[i]||'')}</p></div></div>`;
 const under=kind==='celtic'&&cards.length===10?TT_CELTIC.map(([a,b,t])=>`<details class="acc tt-ch"${a===0?' open':''}><summary><span class="lr-t"><strong>${t}</strong><span>${cards.slice(a,b+1).map(c=>esc(c.pos)).join(' · ')}</span></span><span class="lr-c">${IC.chev}</span></summary><div class="acc-b">${cards.slice(a,b+1).map((c,k)=>one(c,a+k)).join('')}</div></details>`).join('')
  :cards.map(one).join('<i class="dr-div" aria-hidden="true">✦</i>');
 return `<div class="dr-hero"><h2>${esc(r.title||TT[kind]?.n||'Your Reading')}</h2><p class="dr-kw">${esc((TT[kind]||{n:''}).n)}${d.focus&&d.focus!=='general'&&!daily?' · '+esc((TT_FOCUS.find(f=>f[0]===d.focus)||['',''])[1]):''}</p>${d.q?`<p class="cn-q">“${esc(d.q)}”</p>`:d.open?'<p class="cn-q">Open to guidance</p>':''}</div>
 <div class="tt-cards${cards.length===1?' solo':''}">${cards.map(thumb).join('')}</div>
 ${ssHead(daily?'Your Card Today':'The Message of Your Reading')}<div class="dr-text"><p>${esc(r.message||r.whole||'')}</p></div>
 ${daily?'':`${ssHead('Understanding Your Cards')}<div class="dr-syms">${under}</div>`}
 ${r.connect?`${ssHead('How the Cards Connect')}<div class="dr-text"><p>${esc(r.connect)}</p></div>`:''}
 ${r.embrace?`${ssHead('What to Embrace')}<div class="dr-text"><p>${esc(r.embrace)}</p></div>`:''}
 ${r.mindful?`${ssHead('What to Be Mindful Of')}<div class="dr-text"><p>${esc(r.mindful)}</p></div>`:''}
 ${r.guidance?`${ssHead(daily?'Guidance for Today':'Your Guidance')}<div class="dr-text"><p>${esc(r.guidance)}</p></div>`:''}
 ${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(r.reflection||'What is this reading inviting me to notice?')}”</p>`,'dr-q')}`;
}
const ttKasQ=d=>{const cards=(d.cards||d.drawn||[]).map(c=>`${ttCard(c.id).name}${c.rv?' reversed':''} (${c.pos})`).join(', ');return `About my tarot reading${d.q?` on “${d.q}”`:''}: ${cards}. The message was: ${String((d.r||d.res||{}).message||'').slice(0,240)} What else might it be inviting me to see?`};
const ttPage=h=>nightSub(`<div class="sub">${h}</div>`,'dj ss tt');
function ttHome(){
 const T=ttX(),open=V.ttOpen,resume=T&&!T.res&&T.kind!=='daily'&&(T.drawn.length||T.stage!=='prep'||T.q);
 return ttPage(`${hdr('Tarot',{sub:'Discover what the cards invite you to see.'})}
 ${resume?`<button class="dr-link tt-resume" data-tt="resume">Continue your ${esc(TT[T.kind].n)} reading · ${T.drawn.length} of ${TT[T.kind].p.length} cards ${IC.chev}</button>`:''}
 <div class="list tt-doors">${ssDoor('3','Ask the Tarot','Explore a question or situation on your mind. Three cards.','data-tt="start" data-k="ask"','big')}
 <button class="lrow ss-door big" data-tt="spreads" aria-expanded="${!!open}"><span class="lr-i">${ssGlyph('✶')}</span><span class="lr-t"><strong>Tarot Spreads</strong><span>Explore a particular area of your life in greater depth. 3 to 10 cards.</span></span><span class="lr-c tt-chev${open?' up':''}">${IC.chev}</span></button></div>
 ${open?`${ssHead('Choose your tarot spread')}<div class="list">${TT_SPREADS.map(k=>{const s=TT[k];return `<details class="acc tt-sp"${V.ttSp===k?' open':''} data-k="${k}"><summary><span class="lr-t"><strong>${s.n}</strong><span>${s.s}</span></span><span class="lr-m">${s.p.length} cards</span><span class="lr-c">${IC.chev}</span></summary><div class="acc-b"><p class="tt-pos-h">Card positions</p><ol class="tt-pos">${s.p.map(p=>`<li>${esc(p)}</li>`).join('')}</ol><button class="btn" data-tt="start" data-k="${k}">Begin this reading</button></div></details>`}).join('')}</div>`:''}
 <button class="dr-link" data-act="libgo" data-tab="tarot">Explore the Deck · all 78 cards ${IC.chev}</button>`);
}
function ttPrep(T){
 const s=TT[T.kind];
 return ttPage(`${hdr('Prepare Your Reading',{sub:s.n})}
 ${ssHead('What is on your mind?')}<p class="tt-lead">Take a moment to consider what you would like to explore.</p>
 <div class="field"><label for="ttq" class="sr-only">Your question</label><textarea id="ttq" rows="3" maxlength="300" placeholder="Write a question or describe a situation…" ${T.open?'disabled':''}>${esc(T.q)}</textarea></div>
 <div class="fchips ss-chips tt-ex">${TT_EX.map(q=>`<button class="fchip" data-tt="ex" data-v="${esc(q)}">${esc(q)}</button>`).join('')}<button class="fchip" role="switch" aria-checked="${!!T.open}" data-tt="openg">I’m open to guidance</button></div>
 ${ssHead('Area of focus · Optional')}<div class="fchips ss-chips">${TT_FOCUS.map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${T.focus===k}" data-tt="focus" data-v="${k}">${l}</button>`).join('')}</div>
 <p class="muted small">${s.p.length} cards: ${s.p.map(esc).join(' · ')}</p>
 <button class="btn" data-tt="todraw">Draw My Cards</button>`);
}
function ttDrawView(T){
 const s=TT[T.kind],n=s.p.length,done=T.drawn.length>=n;
 return ttPage(`${hdr(T.kind==='daily'?'Your Daily Card':'Draw Your Cards',{sub:done?'Your cards are drawn.':'Choose the cards you feel drawn towards.'})}
 <p class="tt-count" aria-live="polite">${T.drawn.length} of ${n} card${n>1?'s':''} selected</p>
 <div class="tt-slots${n>5?' many':''}">${s.p.map((p,i)=>{const d=T.drawn[i],c=d?ttCard(d.id):null;return `<div class="tt-slot${c?' on':''}"><span class="tt-n">${i+1}</span>${c?`<span class="tt-face${d.rv?' rev':''}">${pic('deck',c.id,'tt-img')}</span><strong>${esc(c.name)}${d.rv?' <i>reversed</i>':''}</strong>`:'<span class="tt-back"></span>'}<span class="tt-p">${esc(p)}</span></div>`}).join('')}</div>
 ${done?`<button class="btn" data-tt="read">${T.kind==='daily'?'Read My Card':'Explore My Reading'}</button>`:`<div class="tt-deck" role="group" aria-label="The deck, face down">${T.deck.slice(0,24).map((id,i)=>`<button class="tt-c" data-tt="pick" data-i="${i}" aria-label="Card ${i+1}" ${T.picks.includes(i)?'disabled':''}></button>`).join('')}</div>
 <div class="ss-acts">${T.drawn.length?'':`<button class="btn ghost" data-tt="shuffle">Shuffle again</button>`}<button class="btn ghost" data-tt="auto">Draw for me</button></div>`}`);
}
function ttReadView(T){
 if(!T.res)return `<div class="sub">${hdr('Your Tarot Reading')}<div class="reading-anim">${ui('owl','ra-owl')}<p class="quote center">The cards are speaking…</p></div></div>`;
 const kept=!!T.key;
 return ttPage(`${hdr('Your Tarot Reading',{sub:ymdLong(T.day||dkey(),{day:'numeric',month:'long'})})}${ttBody(T)}
 <div class="ss-acts">${kept?`<button class="btn ghost" data-go="discover" data-t="readings">✓ In Your Readings</button>`:`<button class="btn" data-tt="keep">Save Reading</button>`}<button class="btn ghost" data-tt="journal">Reflect in My Journal</button></div>
 <div class="ss-acts">${kept?heartBtn(T.key):''}<button class="btn ghost" data-act="kasask" data-q="${esc(ttKasQ(T))}">Ask Kassandra</button></div>
 <div class="dr-tools"><button class="dr-link" data-tt="home">Return to Tarot</button><button class="dr-link" data-go="tarot" data-t="home">Return to Oracle</button></div>
 <p class="muted small center">${T.res.ai?'Read by Kassandra with AI. ':'Read from Kosmia’s own book of the cards. '}Tarot is a mirror for reflection, not a prediction.</p>`);
}
function ttView(){
 const T=ttX();if(!T)return ttHome();
 if(T.stage==='prep')return ttPrep(T);
 if(T.stage==='draw')return ttDrawView(T);
 return ttReadView(T);
}
{const vt=views.tarot;views.tarot=()=>{const t=tab();if(t==='spreads')return ttHome();if(t==='reading')return ttView();return vt()}}
document.addEventListener('input',e=>{if(e.target.id==='ttq'&&S.tt){S.tt.q=e.target.value;clearTimeout(ttSave.t);ttSave.t=setTimeout(save,500)}});
document.addEventListener('toggle',e=>{const d=e.target;if(d.classList&&d.classList.contains('tt-sp')&&d.open)V.ttSp=d.dataset.k},true);
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-tt]');if(!t)return;const a=t.dataset.tt,T=ttX();
 if(['daily','start','resume'].includes(a))V.ttFrom=V.sec==='tarot'&&tab()==='spreads';
 if(a==='daily'){const D=ttToday();if(D){if(D.res){S.tt=D;return go('tarot','reading')}return rdOpen('tarot:'+D.id)}ttStart('daily');return go('tarot','reading')}
 if(a==='start'){ttStart(t.dataset.k);return go('tarot','reading')}
 if(a==='resume')return go('tarot','reading');
 if(a==='spreads'){V.ttOpen=!V.ttOpen;return render()}
 if(!T)return;
 if(a==='ex'){T.q=t.dataset.v;T.open=false;ttSave();return render()}
 if(a==='openg'){T.open=!T.open;if(T.open)T.q='';ttSave();return render()}
 if(a==='focus'){T.focus=T.focus===t.dataset.v?'':t.dataset.v;ttSave();return render()}
 if(a==='todraw'){const q=$('#ttq');if(q&&!T.open)T.q=q.value.trim();T.stage='draw';ttSave();render();return window.scrollTo(0,0)}
 if(a==='shuffle'){if(T.drawn.length)return;T.deck=shuffle(DECK).map(c=>c.id);ttSave();toast('The deck is shuffled.');return render()}
 if(a==='pick'){ttDraw(+t.dataset.i);return render()}
 if(a==='auto'){const n=TT[T.kind].p.length;let i=0;while(T.drawn.length<n&&i<T.deck.length){if(!T.picks.includes(i))ttDraw(i);i++}return render()}
 if(a==='read')return ttRead();
 if(a==='keep'){ttKeep(T);return render()}
 if(a==='journal'){if(!T.key)ttKeep(T,true);return rdReflect(T.key)}
 if(a==='home'){S.tt=null;save();return V.ttFrom?goBack():go('tarot','spreads',{replace:true})}
});
// ---- Your Readings: one collection of every saved reading across the Oracle, with search, filters and favourites, and
// a detail page that shows each reading exactly as it was received, with its themes, the reflections written about it,
// related readings and what can be done next. The reader's own marks (favourite, name, note, reflections, kept out of
// patterns, last revisited) live in one record (bookmark 'rmeta') beside the readings, never inside them.
const RD_CATS=[['tarot','Tarot'],['dreams','Dreams'],['numbers','Sacred Numbers'],['sync','Synchronicities'],['patterns','Patterns'],['numerology','Numerology'],['connections','Connections'],['kassandra','Kassandra']];
const rdMeta=()=>{let b=S.bookmarks.find(x=>x.kind==='rmeta');if(!b){b={id:uuid(),kind:'rmeta',ref:'all',data:{},at:new Date().toISOString()};S.bookmarks.push(b)}return b};
const rdM=k=>rdMeta().data[k]||{};
function rdSet(k,patch){const b=rdMeta();b.data[k]=Object.assign({},b.data[k]||{},patch);save();C.saveBookmark&&C.saveBookmark(b).then(()=>{b.sy=true;save()},()=>{})}
// every reading, in one shape: its key, category, kind, title, date, a line, searchable words and themes
function rdAll(){
 const out=[],add=x=>{const m=rdM(x.k);out.push(Object.assign(x,{fav:!!m.fav,title:m.title||x.title,note:m.note||'',noPat:!!m.noPat,seen:m.seen||'',refl:(m.refl||[]).filter(id=>S.journal.some(j=>j.id===id))}))};
 ttSaved().forEach(d=>{const names=(d.cards||[]).map(c=>c.name);add({k:'tarot:'+d.id,cat:'tarot',kind:d.type==='daily'?'Daily card':d.type==='ask'?'Ask the Tarot':(d.cards||[]).length===3?'Three-card reading':(TT[d.type]||{n:'Tarot reading'}).n,title:(d.r||{}).title||'A Tarot Reading',day:d.day,at:d.at,line:names.join(' · '),words:[d.q,names.join(' '),(d.r||{}).message,(d.cards||[]).map(c=>{const x=ttCard(c.id);return c.rv?x.rev:x.up}).join(' ')].join(' '),d})});
 S.readings.forEach(r=>add({k:'old:'+r.id,cat:'tarot',kind:(SPREADS[r.spread]||{s:'Tarot reading'}).s,title:r.q||(SPREADS[r.spread]||{s:'A Tarot Reading'}).s,day:r.date,at:r.at||r.date,line:(r.cards||[]).map(c=>c.name).join(' · '),words:[r.q,r.note,(r.cards||[]).map(c=>c.name).join(' ')].join(' '),d:r}));
 dreams().forEach(d=>{const I=d.interp||{};add({k:'dream:'+d.id,cat:'dreams',kind:'Dream interpretation',title:I.title||'A Dream Not Yet Read',day:d.day,at:d.at,line:drKeys(d).slice(0,3).map(drName).join(' · '),words:[d.text,I.title,I.beneath||I.meaning,drKeys(d).map(drName).join(' '),(I.keywords||[]).join(' ')].join(' '),d})});
 S.bookmarks.filter(b=>b.kind==='sign').map(b=>b.data||{}).forEach(d=>{const r=d.r||{};
  if(d.type==='number')add({k:'sign:'+d.id,cat:'numbers',kind:'Sacred Numbers',title:`${d.number} · ${r.title||''}`,day:d.day,at:d.at,line:(d.themes||[]).map(x=>(ssTheme(x)||{name:x}).name).join(' · '),words:[d.number,d.context,r.title,r.symbolism,r.meaning,(d.themes||[]).join(' ')].join(' '),d});
  else if(d.type==='sync')add({k:'sign:'+d.id,cat:'sync',kind:'Synchronicity reading',title:r.title||'A Synchronicity',day:d.day,at:d.at,line:(d.themes||[]).map(x=>(ssTheme(x)||{name:x}).name).join(' · '),words:[d.text,r.title,r.symbolism,r.deeper,(d.themes||[]).join(' ')].join(' '),d});
  else if(d.type==='pattern')add({k:'sign:'+d.id,cat:'patterns',kind:'Recurring themes',title:d.title,day:d.day,at:d.at,line:d.line||'',words:[d.title,d.line,d.text].join(' '),d});
  else if(d.type==='numerology')add({k:'sign:'+d.id,cat:'numerology',kind:d.which==='lp'?'Life Path reading':'The Name Within',title:d.title,day:d.day,at:d.at,line:d.line||'',words:[d.title,d.line,d.text].join(' '),d})});
 cnReads().forEach(d=>add({k:'conn:'+d.id,cat:'connections',kind:CN_TYPES[d.type]+(d.rel?' · '+(CN_RELN[d.rel]||''):''),title:d.type==='zodiac'?(d.z||{}).title||'Zodiac Compatibility':d.type==='insight'?`${d.na} & ${d.nb}`:`The Two Skies of ${d.na} & ${d.nb}`,day:d.day,at:d.at,line:d.type==='zodiac'?`${sg(d.signs[0]).name} & ${sg(d.signs[1]).name}`:d.type==='insight'?`${sg(d.sa).name} & ${sg(d.sb).name}`:`${(d.syn||{aspects:[]}).aspects.length} meetings between their charts`,words:[d.na,d.nb,d.q,d.type==='zodiac'?d.signs.map(x=>sg(x).name).join(' '):'',JSON.stringify(d.r||d.z||{})].join(' '),d}));
 S.bookmarks.filter(b=>b.kind==='chat').forEach(b=>{const d=b.data||{},first=(d.msgs||[]).find(m=>m.role==='user');add({k:'chat:'+b.ref,cat:'kassandra',kind:'Conversation with Kassandra',title:first?clip(first.content,60):'A conversation',day:(b.at||'').slice(0,10)||dkey(),at:b.at,line:`${(d.msgs||[]).length} messages`,words:(d.msgs||[]).map(m=>m.content).join(' '),d})});
 out.forEach(x=>{x.themes=[...new Set([...ssFind(x.words+' '+x.title),...((x.d&&x.d.themes)||[])])].slice(0,4)});
 return out;
}
const RD_RANGES=[['all','All time'],['7','7 days'],['30','30 days'],['90','90 days']],RD_SORT=[['new','Newest first'],['old','Oldest first'],['seen','Recently revisited']];
const rdF=()=>V.rdf||(V.rdf={cat:'',q:'',fav:false,refl:false,range:'all',sort:'new'});
function rdFilter(){
 const F=rdF(),q=F.q.trim().toLowerCase(),from=F.range==='all'?'':dkey(new Date(Date.now()-(+F.range-1)*DAY));
 let l=rdAll().filter(x=>(!F.cat||x.cat===F.cat)&&(!F.fav||x.fav)&&(!F.refl||x.refl.length)&&(x.day||'')>=from);
 if(q)l=l.filter(x=>[x.title,x.kind,x.line,x.words,x.note,x.themes.map(t=>(ssTheme(t)||{name:t}).name).join(' '),ymdLong(x.day,{day:'numeric',month:'long',year:'numeric'})].join(' ').toLowerCase().includes(q));
 const key=x=>F.sort==='seen'?(x.seen||''):(x.at||x.day||'');
 return l.sort((a,b)=>F.sort==='old'?(key(a)>key(b)?1:-1):(key(b)>key(a)?1:-1));
}
function rdList(){
 const l=rdFilter(),F=rdF();
 if(!l.length)return `<p class="muted center rd-none">${rdAll().length?'No reading matches these filters.':'Your readings will gather here as you explore the Oracle: tarot, dreams, numbers, synchronicities, connections and more.'}</p>`;
 if(F.sort!=='new'&&F.sort!=='old')return l.map(rdRow).join('');
 const by={};l.forEach(x=>(by[(x.day||'').slice(0,7)]=by[(x.day||'').slice(0,7)]||[]).push(x));
 return Object.keys(by).sort(F.sort==='old'?undefined:(a,b)=>a<b?1:-1).map(m=>`<p class="dr-month">${ymdLong(m+'-01',{month:'long',year:'numeric'})} · ${by[m].length} reading${by[m].length>1?'s':''}</p>${by[m].map(rdRow).join('')}`).join('');
}
const rdRow=x=>`<div class="rd-row"><button class="dr-entry" data-rd="open" data-k="${esc(x.k)}"><span class="dr-d">${esc(x.kind)} · ${ymdLong(x.day,{day:'numeric',month:'long'})}</span><strong>${esc(x.title)}</strong>${x.line?`<span class="dr-s">${esc(x.line)}</span>`:''}${x.refl.length?`<span class="dr-f">${x.refl.length} reflection${x.refl.length>1?'s':''}</span>`:''}</button><button class="rd-fav" data-rd="fav" data-k="${esc(x.k)}" aria-pressed="${x.fav}" aria-label="${x.fav?'Remove from My Library':'Keep in My Library'}">${x.fav?'♥':'♡'}</button></div>`;
function rdView(){
 const all=rdAll(),F=rdF(),auto=S.settings.autosave!==false;
 return nightSub(`<div class="sub">${hdr('Your Readings',{sub:'Every insight is a thread in the story of your journey.'})}
 <div class="dr-stats"><div><b>${all.length}</b><span>Saved readings</span></div><div><b>${all.filter(x=>x.fav).length}</b><span>In My Library</span></div></div>
 <div class="field"><label for="rdq" class="sr-only">Search your readings</label><input type="search" id="rdq" placeholder="Search titles, cards, symbols, numbers, names…" value="${esc(F.q)}" autocomplete="off"></div>
 <div class="fchips ss-chips rd-cats"><button class="fchip" role="radio" aria-checked="${!F.cat}" data-rd="cat" data-v="">All Readings</button>${RD_CATS.filter(([k])=>all.some(x=>x.cat===k)||F.cat===k).map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${F.cat===k}" data-rd="cat" data-v="${k}">${l}</button>`).join('')}</div>
 <details class="cn-more rd-more"${F.fav||F.refl||F.range!=='all'||F.sort!=='new'?' open':''}><summary>Sort and filter</summary>
 <div class="fchips ss-chips"><button class="fchip" role="switch" aria-checked="${F.fav}" data-rd="tog" data-v="fav">♥ In My Library</button><button class="fchip" role="switch" aria-checked="${F.refl}" data-rd="tog" data-v="refl">With reflections</button></div>
 <div class="fchips ss-chips">${RD_RANGES.map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${F.range===k}" data-rd="range" data-v="${k}">${l}</button>`).join('')}</div>
 <div class="fchips ss-chips">${RD_SORT.map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${F.sort===k}" data-rd="sort" data-v="${k}">${l}</button>`).join('')}</div></details>
 <div class="dr-book rd-book" id="rdlist">${rdList()}</div>
 <label class="row cn-cb rd-auto"><input type="checkbox" class="cb" data-rd="auto" ${auto?'checked':''}> <span>Keep every completed reading here automatically</span></label></div>`,'dj ss rd');
}
// one reading, exactly as it was received, with the reader's own threads around it
function rdBody(x){
 const d=x.d;
 if(x.k.startsWith('tarot:'))return ttBody(d);
 if(x.k.startsWith('old:'))return `<div class="dr-hero"><h2>${esc(x.title)}</h2><p class="dr-kw">${esc(x.kind)}</p></div><div class="tt-cards">${(d.cards||[]).map(c=>`<figure class="tt-th${c.rev?' rev':''}">${pic('deck',c.id,'tt-img')}<figcaption><strong>${esc(c.name)}${c.rev?' <i>reversed</i>':''}</strong><span>${esc(c.pos||'')}</span></figcaption></figure>`).join('')}</div>${(d.cards||[]).map(c=>{const k=ttCard(c.id);return `${ssHead(c.name+(c.rev?' reversed':''))}<div class="dr-text"><p>${esc(c.rev?k.revm:k.upm)}</p></div>`}).join('')}${d.note?`${ssHead('Your note')}<div class="dr-text"><p>${esc(d.note)}</p></div>`:''}`;
 if(x.k.startsWith('dream:'))return d.interp?drReading(d,true).replace(/<div class="ss-acts">[\s\S]*?<\/div>\s*<p class="muted small center">/,'<p class="muted small center">'):`<div class="dr-hero"><h2>A Dream Not Yet Read</h2></div><div class="dr-text"><p class="pre">${esc(d.text||'')}</p></div><button class="btn" data-act="dreamopen" data-id="${esc(d.id)}">Explore this dream</button>`;
 if(x.k.startsWith('sign:')){const r=d.r||{};
  if(d.type==='number')return `<div class="ss-hero n"><div class="ss-num">${esc(d.number).split('').join(' ')}</div><h2>${esc(r.title||'')}</h2></div>${d.context?`<p class="cn-q">You noticed it when: ${esc(d.context)}</p>`:''}${cnSec('The Symbolism',r.symbolism)}${cnSec('What It May Mean for You',r.meaning)}${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(r.reflection||'')}”</p>`,'dr-q')}`;
  if(d.type==='sync')return `<div class="dr-hero"><h2>${esc(r.title||'')}</h2></div>${cnSec('The Moment',r.moment)}${cnSec('The Symbolism',r.symbolism)}${cnSec('A Deeper Meaning',r.deeper)}${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(r.reflection||'')}”</p>`,'dr-q')}${cnSec('A Gentle Action',r.action)}`;
  return `<div class="dr-hero"><h2>${esc(d.title)}</h2><p class="dr-kw">${esc(d.line||'')}</p></div>${(d.parts||[]).map(([t,v])=>cnSec(t,v)).join('')}${d.q?mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(d.q)}”</p>`,'dr-q'):''}`}
 if(x.k.startsWith('conn:')){if(d.type==='zodiac'){const z=d.z;return `<div class="dr-hero"><h2>${esc(sg(d.signs[0]).name)} &amp; ${esc(sg(d.signs[1]).name)}</h2><p class="dr-kw">${esc(z.title)}</p></div>${z.sections.map(([t,v])=>cnSec(t,v)).join('')}${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(z.reflect)}”</p>`,'dr-q')}`}
  if(d.type==='insight')return `<div class="dr-hero"><h2>${esc(d.na)} &amp; ${esc(d.nb)}</h2><p class="dr-kw">${esc(CN_RELN[d.rel]||'')}</p></div>${d.q?`<p class="cn-q">You asked: “${esc(d.q)}”</p>`:''}${CN_INS.map(([k,t])=>cnSec(t,d.r[k])).join('')}${mbox(`<h3>An Invitation to Reflect</h3><p class="quote center">“${esc(d.r.reflection||'')}”</p>`,'dr-q')}`;
  return cnChartReading(Object.assign({view:true},d))}
 if(x.k.startsWith('chat:'))return `<div class="rd-chat">${(d.msgs||[]).map(m=>`<p class="rd-m ${m.role}"><b>${m.role==='user'?'You':'Kassandra'}</b>${esc(m.content)}</p>`).join('')}</div>`;
 return '';
}
const rdQ=x=>{const d=x.d||{},r=d.r||d.res||{};return (x.k.startsWith('tarot:')?r.reflection:x.k.startsWith('dream:')?(d.interp||{}).reflection:x.k.startsWith('sign:')?(r.reflection||d.q):x.k.startsWith('conn:')?(d.type==='zodiac'?(d.z||{}).reflect:(d.r||{}).reflection):'')||'What does this reading mean to me now?'};
function rdDetail(){
 const x=rdAll().find(y=>y.k===V.rk);
 if(!x)return `<div class="sub">${hdr('Your Readings')}${empty('This reading is no longer here','It may have been removed on another device.',linkBtn('Your Readings','discover','readings','btn'))}</div>`;
 if(!V.rdSeen||V.rdSeen!==x.k){V.rdSeen=x.k;setTimeout(()=>rdSet(x.k,{seen:new Date().toISOString()}),0)}
 const R=(()=>{if(!x.themes.length)return [];return rdAll().filter(y=>y.k!==x.k&&y.themes.some(t=>x.themes.includes(t))).map(y=>({y,s:y.themes.filter(t=>x.themes.includes(t))})).sort((a,b)=>b.s.length-a.s.length).slice(0,3)})();
 const shared=[...new Set(R.flatMap(r=>r.s))].map(t=>(ssTheme(t)||{}).ph).filter(Boolean);
 const refl=[...x.refl.map(id=>S.journal.find(j=>j.id===id)).filter(Boolean),...(x.d&&x.d.note&&!x.k.startsWith('old:')?[{day:x.d.day,body:x.d.note,legacy:true}]:[])].sort((a,b)=>a.day>b.day?1:-1);
 const E=V.rdEdit===x.k,del=V.rdDel===x.k;
 return nightSub(`<div class="sub">${hdr(esc(x.title),{sub:`${esc(x.kind)} · ${ymdLong(x.day,{day:'numeric',month:'long',year:'numeric'})}`})}
 <div class="rd-top"><button class="rd-fav big" data-rd="fav" data-k="${esc(x.k)}" aria-pressed="${x.fav}">${x.fav?'♥ In My Library':'♡ Keep in My Library'}</button></div>
 ${rdBody(x)}
 ${x.themes.length?`${ssHead('Key Themes')}<div class="pills">${x.themes.map(t=>`<span class="pill">${esc((ssTheme(t)||{name:t}).name)}</span>`).join('')}</div>`:''}
 ${ssHead('Your Reflections')}${refl.length?`<div class="rd-refl">${refl.map(j=>`<button class="rd-r" ${j.legacy?'':`data-act="jopen" data-k="j:${esc(j.id)}"`}><span class="dr-d">${ymdLong(j.day,{day:'numeric',month:'long',year:'numeric'})}${j.day!==x.day?' · '+relLater(x.day,j.day):' · Original reflection'}</span><span>${esc(clip(j.body||j.title||'',160))||'<i>A page waiting for your words</i>'}</span></button>`).join('')}</div>`:'<p class="muted small">No reflections yet. You can return to this reading and write at any time.</p>'}
 <button class="btn ghost" data-rd="reflect" data-k="${esc(x.k)}">Add a reflection</button>
 ${x.note&&!E?`${ssHead('Your note')}<div class="dr-text"><p>${esc(x.note)}</p></div>`:''}
 ${R.length?`${ssHead('Threads Across Your Journey')}<div class="list">${R.map(({y})=>lrow('',esc(y.title),`${esc(RD_CATS.find(c=>c[0]===y.cat)[1])} · ${ymdLong(y.day,{day:'numeric',month:'long'})}`,`data-rd="open" data-k="${esc(y.k)}"`)).join('')}</div><p class="muted small">These readings share themes of ${esc(shared.join(', ').replace(/, ([^,]*)$/,' and $1'))}: a thematic connection in what you have kept, offered for reflection.</p><button class="dr-link" data-go="discover" data-t="patterns">Explore your Patterns ${IC.chev}</button>`:''}
 ${ssHead('Continue Exploring')}
 <div class="ss-acts">${x.k.startsWith('chat:')?'':`<button class="btn ghost" data-act="kasask" data-q="${esc(rdKas(x))}">Ask Kassandra</button>`}${x.cat==='tarot'?'<button class="btn ghost" data-tt="start" data-k="ask">A new tarot reading</button>':x.cat==='dreams'?'<button class="btn ghost" data-go="discover" data-t="dreams">Record a dream</button>':x.cat==='connections'?'<button class="btn ghost" data-go="discover" data-t="connections">Explore another connection</button>':x.cat==='numbers'||x.cat==='sync'?'<button class="btn ghost" data-go="discover" data-t="signs">Signs &amp; Synchronicities</button>':''}</div>
 ${E?`<div class="field"><label for="rd-title">Name</label><input type="text" id="rd-title" value="${esc(x.title)}"></div><div class="field"><label for="rd-note">A personal note</label><textarea id="rd-note" rows="3">${esc(x.note)}</textarea></div><div class="ss-acts"><button class="btn" data-rd="editsave" data-k="${esc(x.k)}">Save</button><button class="btn ghost" data-rd="editno">Cancel</button></div>`:''}
 <div class="dr-tools"><button class="dr-link" data-rd="edit" data-k="${esc(x.k)}">Rename or add a note</button><button class="dr-link" data-rd="share" data-k="${esc(x.k)}">Share</button><button class="dr-link" role="switch" aria-checked="${!x.noPat}" data-rd="pat" data-k="${esc(x.k)}">${x.noPat?'Kept out of patterns · include it':'Included in patterns · keep it out'}</button><button class="dr-link" data-rd="del" data-k="${esc(x.k)}">Delete</button></div>
 ${del?`<div class="dr-confirm"><p>Delete this reading? Your journal reflections stay in your Journal.</p><div class="ss-acts"><button class="btn ghost" data-rd="delno">Keep it</button><button class="btn" data-rd="delyes" data-k="${esc(x.k)}">Delete</button></div></div>`:''}</div>`,'dj ss rd');
}
const relLater=(a,b)=>{const d=Math.round((K.parseYmd(b)-K.parseYmd(a))/DAY);return d<1?'The same day':d<7?d+(d===1?' day':' days')+' later':d<30?Math.round(d/7)+(Math.round(d/7)===1?' week':' weeks')+' later':Math.round(d/30)+(Math.round(d/30)===1?' month':' months')+' later'};
const rdKas=x=>x.k.startsWith('tarot:')?ttKasQ(x.d):`About my saved reading “${x.title}” (${x.kind}, ${ymdLong(x.day,{day:'numeric',month:'long'})})${x.line?': '+x.line:''}. What else might it be inviting me to see?`;
// a reflection about a reading is a Journal page, linked to the reading
function rdReflect(k){
 const x=rdAll().find(y=>y.k===k);const q=x?rdQ(x):'What does this reading mean to me now?';
 const j={id:uuid(),day:dkey(),kind:'reflection',title:q,body:'',at:new Date().toISOString()};S.journal.push(j);save();
 rdSet(k,{refl:[...(rdM(k).refl||[]),j.id]});openEntry('j:'+j.id);
}
function rdOpen(k){V.rk=k;V.rdEdit=null;V.rdDel=null;go('discover','saved')}
// sharing leaves out what is personal: the question, names, the dream's words and notes
function rdShareText(x){const d=x.d||{},r=d.r||d.res||{};
 const main=x.k.startsWith('tarot:')?`${(d.cards||[]).map(c=>c.name).join(' · ')}\n\n${r.message||''}`:x.k.startsWith('dream:')?((d.interp||{}).beneath||(d.interp||{}).meaning||''):x.k.startsWith('sign:')?(r.symbolism||d.title||''):x.k.startsWith('conn:')&&d.type==='zodiac'?(d.z.sections[0]||['',''])[1]:'';
 return `${x.title}\n${main}`.trim()+'\n\nFrom Kosmia ✦'}
function rdDelete(x){
 const [kind,id]=[x.k.slice(0,x.k.indexOf(':')),x.k.slice(x.k.indexOf(':')+1)];
 const rmB=(bk,ref)=>{const b=S.bookmarks.find(y=>y.kind===bk&&y.ref===ref);if(b){S.bookmarks.splice(S.bookmarks.indexOf(b),1);C.deleteBookmark&&C.deleteBookmark(bk,ref)}};
 if(kind==='tarot'){rmB('tarot',id);if(S.tt&&S.tt.id===id)S.tt.key=''}
 else if(kind==='old'){const r=S.readings.find(y=>y.id===id);if(r){S.readings.splice(S.readings.indexOf(r),1);r.rid&&C.deleteReading&&C.deleteReading(r.rid)}}
 else if(kind==='chat')rmB('chat',id);else rmB(kind,id);
 const b=rdMeta();delete b.data[x.k];save();C.saveBookmark&&C.saveBookmark(b);
}
{const RDV={readings:rdView,saved:rdDetail};const vd=views.discover;views.discover=()=>RDV[tab()]?RDV[tab()]():vd()}
Object.assign(SSX,{rdOpen,noPat:k=>!!rdM(k).noPat});
document.addEventListener('input',e=>{if(e.target.id==='rdq'){rdF().q=e.target.value;const l=$('#rdlist');if(l)l.innerHTML=rdList()}});
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-rd]');if(!t)return;const a=t.dataset.rd,F=rdF();
 if(a==='open')return rdOpen(t.dataset.k);
 if(a==='fav'){heartSet(t.dataset.k,!rdM(t.dataset.k).fav);return render()}
 if(a==='cat'){F.cat=t.dataset.v;return render()}
 if(a==='tog'){F[t.dataset.v]=!F[t.dataset.v];return render()}
 if(a==='range'){F.range=t.dataset.v;return render()}
 if(a==='sort'){F.sort=t.dataset.v;return render()}
 if(a==='auto'){S.settings.autosave=t.checked;save();toast(t.checked?'Completed readings are kept here automatically':'Readings are kept only when you save them');return}
 if(a==='reflect')return rdReflect(t.dataset.k);
 if(a==='edit'){V.rdEdit=t.dataset.k;return render()}
 if(a==='editno'){V.rdEdit=null;return render()}
 if(a==='editsave'){const ti=$('#rd-title'),no=$('#rd-note');rdSet(t.dataset.k,{title:ti?ti.value.trim():'',note:no?no.value.trim():''});V.rdEdit=null;toast('Saved');return render()}
 if(a==='pat'){const k=t.dataset.k,v=!rdM(k).noPat;rdSet(k,{noPat:v});if(k.startsWith('dream:')){const d=dreams().find(y=>'dream:'+y.id===k);if(d){d.noPat=v;drUpdate(d)}}toast(v?'Kept out of your patterns':'Part of your patterns again');return render()}
 if(a==='share'){const x=rdAll().find(y=>y.k===t.dataset.k);if(!x)return;const text=rdShareText(x);
  if(navigator.share)navigator.share({title:x.title,text}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>toast('Copied, without your personal details'),()=>toast('Sharing is not available here'));return}
 if(a==='del'){V.rdDel=t.dataset.k;return render()}
 if(a==='delno'){V.rdDel=null;return render()}
 if(a==='delyes'){const x=rdAll().find(y=>y.k===t.dataset.k);if(x)rdDelete(x);V.rdDel=null;toast('The reading is deleted');return goBack()}
});

/* ===================== Cosmic Calendar and Journal =====================
   Calendar looks forward (what is coming and how to prepare); the Journal looks inward (what was lived and kept).
   The heart means "this resonates: keep it in My Library", one mark per item kept beside the item in the reading marks
   (bookmark 'rmeta'); Save keeps a thing in its own collection (Your Readings, Saved Events). One record each, shown
   wherever it belongs. */
const hearted=k=>!!rdM(k).fav;
function heartSet(k,on,snap){rdSet(k,Object.assign({fav:on,favAt:on?new Date().toISOString():''},snap?{snap}:{}));toast(on?'Kept in My Library':'Removed from My Library')}
const heartBtn=(k,cls='btn ghost')=>`<button class="${cls} cj-heart" data-heart="${esc(k)}" aria-pressed="${hearted(k)}" style="--fill:${hearted(k)?'currentColor':'none'}">${IC.heart} ${hearted(k)?'In My Library':'Keep in My Library'}</button>`;
const cjPage=(h,cls='')=>nightSub(`<div class="sub">${h}</div>`,'dj ss cj '+cls);
const FEATHER='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 3C12 4 7 9 5.5 16.5L4 21M20 3c.5 6-3.5 11-10 12.5M20 3l-9 9M8.5 13.5H14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------- the Calendar ---------- */
const CAL_F=[['','All'],['moons','Moons'],['eclipses','Eclipses'],['retro','Retrogrades'],['planets','Planets'],['seasons','Seasons']];
const calCat=e=>e.k==='new_moon'||e.k==='full_moon'?'moons':e.type==='moon'?'quarter':e.type==='eclipse'?'eclipses':e.type==='retrograde'?'retro':e.k==='equinox'||e.k==='solstice'?'seasons':'planets';
const calOk=e=>{const f=V.cal.f||'';return !f||calCat(e)===f};
const calFam=e=>e.k==='new_moon'?'new':e.k==='full_moon'?'full':e.type==='moon'?'quarter':e.type==='eclipse'?'eclipse':e.type==='retrograde'?(e.planet==='Mercury'?'mercury':'retro'):e.type==='season'&&e.k!=='ingress'?'season':e.k==='meteor'?'meteor':'theme';
const calName=e=>e.name+(e.sign!=null&&(e.type==='moon'||e.type==='eclipse')?` in ${sIdx(e.sign).name}`:'');
const calType=e=>({moon:'Lunar event',eclipse:'Eclipse',retrograde:'Retrograde station',meteor:'Astronomical event',planet:'Astronomical event',conjunction:'Planetary alignment'})[e.type]||(e.k==='ingress'?(e.planet==='Sun'?'Zodiac season':'Planetary ingress'):'Seasonal event');
function calTheme(e){
 const T={new_moon:'New beginnings and meaningful intentions.',full_moon:'Illumination, release and gratitude.',first_quarter:'Action, decision and momentum.',last_quarter:'Reflection, release and clearing space.',lunar_eclipse:'Endings, revelation and release.',solar_eclipse:'Fresh starts and new chapters.',station_retro:'Review, revision and reconnection.',station_direct:'Clarity, integration and moving forward.',equinox:'Balance and turning points.',solstice:'Rest, renewal and the turning of the light.',meteor:'Wonder, perspective and contemplation.',conjunction:'Two energies meet and begin a new cycle.',opposition:'A planet at its brightest, fully seen.',elongation:'A fine time for sky-watching.',perihelion:'Earth’s rhythm around the Sun.',aphelion:'Earth’s rhythm around the Sun.'};
 if(e.k==='ingress')return e.planet==='Sun'?`The season of ${sIdx(e.sign).name} begins: ${STYLE[sIdx(e.sign).id].split(',')[0]}.`:`${e.planet} brings ${PM[e.planet].split(' and ')[0]} into ${sIdx(e.sign).name}.`;
 return T[e.k]||evKeys(e);
}
const calTime=e=>e.dateOnly?'Best seen after midnight · date approximate':fmt({hour:'2-digit',minute:'2-digit'},e.date)+' your time';
function calCount(e){
 const d=Math.round((K.parseYmd(evDay(e))-K.parseYmd(dkey()))/DAY);
 if(d===0){if(e.dateOnly)return 'Today';const h=Math.round((e.date-Date.now())/36e5);return h>1?`In ${h} hours`:h>=0?'Within the hour':'Earlier today'}
 return d===1?'Tomorrow':d>1?`In ${d} days`:d===-1?'Yesterday':`${-d} days ago`;
}
// retrograde periods still running today: from the station retrograde to the station direct
function calOngoing(){
 const now=new Date(),l=K.events(new Date(+now-200*DAY),new Date(+now+200*DAY)).filter(e=>e.type==='retrograde'),out=[];
 [...new Set(l.map(e=>e.planet))].forEach(p=>{const pl=l.filter(e=>e.planet===p),last=pl.filter(e=>e.date<=now).pop();if(last&&last.k==='station_retro'){const end=pl.find(e=>e.date>now&&e.k==='station_direct');out.push({e:last,end})}});
 return out;
}
function calFind(ref){if(!ref)return null;const t=Date.parse(ref.slice(-13)+':00:00Z');return isNaN(t)?null:findEvent(ref,new Date(t).toISOString())}
// the event's own record: saved by choice, a reminder, a completed ritual; it stays while any of the three is there
const calBm=ref=>S.bookmarks.find(b=>b.kind==='event'&&b.ref===ref);
const calSaved=b=>!!b&&(b.data||{}).saved!==false;
function calBmSet(e,patch){
 const ref=evRef(e);let b=calBm(ref);
 if(!b){b={id:uuid(),kind:'event',ref,data:Object.assign(evData(e),{saved:false,k:e.k,sign:e.sign}),at:new Date().toISOString()};S.bookmarks.push(b)}
 b.data=Object.assign({saved:calSaved(b)},b.data,patch);
 if(!b.data.saved&&!b.data.rem&&!b.data.ritual){S.bookmarks=S.bookmarks.filter(x=>x!==b);C.deleteBookmark&&C.deleteBookmark('event',ref)}
 else C.saveBookmark&&C.saveBookmark(b).then(()=>{b.sy=true;save()},()=>{});
 save();
}
const remTxt=r=>{if(!r)return '';const w=[r.before&&'the day before',r.day&&'on the day'].filter(Boolean);return w.length?`Reminder ${w.join(' and ')} at ${r.time||'08:00'}`:''};
function calMarks(e){const b=calBm(evRef(e)),d=b?b.data:{};return [calSaved(b)?'✓ Saved':'',d.rem?'Reminder set':'',hearted('event:'+evRef(e))?'♥':'',d.ritual?'Ritual completed':''].filter(Boolean).map(x=>`<i>${x}</i>`).join('')}
const calRow=(e,extra='')=>`<button class="dr-entry cal-ev" data-cal="open" data-ref="${esc(evRef(e))}"><span class="cal-i">${evArt(e,true)}</span><span class="cal-t"><span class="dr-d">${calType(e)} · ${extra||calCount(e)}</span><strong>${esc(calName(e))}</strong><span class="dr-s">${ymdLong(evDay(e),{weekday:'short',day:'numeric',month:'long'})}${e.dateOnly?'':' · '+fmt({hour:'2-digit',minute:'2-digit'},e.date)}</span><span class="cal-th">${esc(calTheme(e))}</span><span class="cal-mk">${calMarks(e)}</span></span></button>`;
function calendarHome(){
 V.cal.f=V.cal.f||'';const month=V.cal.view==='month',nSaved=S.bookmarks.filter(b=>b.kind==='event').length;
 const head=`${hdr('Cosmic Calendar',{back:false,sub:'Discover the rhythms of the universe and prepare for what lies ahead.'})}
 <div class="fchips ss-chips cal-view">${[['list','Timeline'],['month','Month']].map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${(V.cal.view==='month'?'month':'list')===k}" data-cal="view" data-v="${k}">${l}</button>`).join('')}</div>
 <div class="fchips ss-chips rd-cats">${CAL_F.map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${(V.cal.f||'')===k}" data-cal="f" data-v="${k}">${l}</button>`).join('')}</div>`;
 const foot=`<button class="dr-link" data-go="discover" data-t="saved-events">Saved Events${nSaved?` · ${nSaved}`:''} ${IC.chev}</button>`;
 return cjPage(head+(month?calMonth():calTimeline())+foot,'cal');
}
function calTimeline(){
 const span=V.cal.span||30,start=new Date(dkey()+'T00:00:00'),now=new Date();
 const all=K.events(start,new Date(+start+span*DAY)).filter(e=>evDay(e)>=dkey()&&calOk(e));
 const fut=all.filter(e=>e.dateOnly?evDay(e)>=dkey():e.date>=now),hero=fut.find(e=>calCat(e)!=='quarter')||fut[0];
 const ong=(!V.cal.f||V.cal.f==='retro')?calOngoing():[];
 const rest=all.filter(e=>e!==hero),by={};rest.forEach(e=>{const m=evDay(e).slice(0,7);(by[m]=by[m]||[]).push(e)});
 return `${hero?`<section class="cal-hero">${ssHead('The Next Celestial Event')}<button class="cal-hb" data-cal="open" data-ref="${esc(evRef(hero))}"><span class="cal-hi">${evArt(hero,true)}</span><span class="cal-cd">${calCount(hero)}</span><strong>${esc(calName(hero))}</strong><span class="cal-hd">${ymdLong(evDay(hero),{weekday:'long',day:'numeric',month:'long'})}${hero.dateOnly?'':' · '+fmt({hour:'2-digit',minute:'2-digit'},hero.date)}</span><span class="cal-th">${esc(calTheme(hero))}</span><span class="cal-mk">${calMarks(hero)}</span><span class="dr-link">Explore the event and its ritual ${IC.chev}</span></button></section>`:`<p class="muted center">No ${V.cal.f?CAL_F.find(x=>x[0]===V.cal.f)[1].toLowerCase():'events'} in the next ${span} days.</p>`}
 ${ong.length?`${ssHead('Ongoing')}<div class="dr-book">${ong.map(o=>calRow(o.e,`Ongoing${o.end?' until '+ymdLong(evDay(o.end),{day:'numeric',month:'long'}):''}`)).join('')}</div>`:''}
 ${rest.length?`${ssHead('Coming Next')}<div class="dr-book">${Object.keys(by).sort().map(m=>`<p class="dr-month">${ymdLong(m+'-01',{month:'long',year:'numeric'})}</p>${by[m].map(e=>calRow(e)).join('')}`).join('')}</div>`:''}
 ${span<360?`<button class="btn ghost" data-cal="more">Explore the following month</button>`:''}`;
}
function calMonth(){
 const today=dkey(),cur=today.slice(0,7),mk=V.cal.month||cur,[y,mo]=mk.split('-').map(Number),first=Date.UTC(y,mo-1,1);
 const prev=new Date(Date.UTC(y,mo-2,1)).toISOString().slice(0,7),next=new Date(Date.UTC(y,mo,1)).toISOString().slice(0,7);
 const evs=K.events(new Date(first-14*36e5),new Date(Date.UTC(y,mo,1)+14*36e5)).filter(e=>evDay(e).slice(0,7)===mk&&calOk(e)),byDay={};
 evs.forEach(e=>(byDay[evDay(e)]=byDay[evDay(e)]||[]).push(e));
 const days=new Date(Date.UTC(y,mo,0)).getUTCDate(),lead=(new Date(first).getUTCDay()+6)%7;
 const sel=V.cal.day&&V.cal.day.slice(0,7)===mk?V.cal.day:mk===cur?today:'';
 return `<div class="mnav cal-mnav"><button class="ibtn" data-cal="month" data-v="${prev}" aria-label="Previous month">${IC.back}</button><h2>${ymdLong(mk+'-01',{month:'long',year:'numeric'})}</h2><button class="ibtn flip" data-cal="month" data-v="${next}" aria-label="Next month">${IC.back}</button></div>
 ${mk!==cur?`<button class="dr-link cal-today" data-cal="month" data-v="${cur}">Return to today</button>`:''}
 <div class="jcal cal-grid" role="grid">${['M','T','W','T','F','S','S'].map(d=>`<div class="jc-d" role="columnheader">${d}</div>`).join('')}${Array.from({length:lead},()=>'<div></div>').join('')}${Array.from({length:days},(_,i)=>{const k=`${mk}-${String(i+1).padStart(2,'0')}`,es=byDay[k]||[],ph=es.find(e=>e.type==='moon');return `<button class="jc-c${k===today?' today':''}${k===sel?' sel':''}${k<today?' past':''}" data-cal="day" data-v="${k}" aria-label="${ymdLong(k)}${es.length?', '+es.length+' event'+(es.length>1?'s':''):''}"><span>${i+1}</span>${ph?pic('moons',phaseSlug(ph.name),'jc-moon'):es.length?'<i class="jc-star">✦</i>':''}</button>`}).join('')}</div>
 ${sel?`${ssHead(ymdLong(sel,{weekday:'long',day:'numeric',month:'long'}))}<div class="dr-book">${(byDay[sel]||[]).map(e=>calRow(e)).join('')||'<p class="muted center small">A quiet sky that day. Nothing is asked of you.</p>'}</div>`:'<p class="muted center small">Choose a day to see its events.</p>'}`;
}
/* the personal part of an event: the house it falls in (only with a birth time and place), the natal planets it touches
   and a question; without the details, the sign's relation to the reader's Sun and an offer to complete the profile */
const CAL_HQ=['How would I like to show up in the world right now?','What do I truly value, and does my life reflect it?','What would I like to learn, say or understand?','What helps me feel at home within myself?','What brings me joy and lets me create?','Which daily habit would care for me best?','What do I bring to my closest relationships?','What am I ready to share, trust or let transform?','What larger meaning am I searching for?','What do I want to build in my work and public life?','Which friendships and hopes nourish me?','What needs rest, solitude or quiet healing?'];
const CAL_HV={new:'It invites a fresh intention in this part of your life.',full:'What has been growing here may come into fuller view.',eclipse:'This part of your life may be ready for an ending, or a new chapter.',mercury:'It may ask you to revisit and review matters here.',retro:'It may ask you to revisit and review matters here.',season:'A new season may begin to colour this part of your life.',quarter:'It may bring this part of your life into focus.',theme:'It may bring this part of your life into focus.'};
const calBody=e=>e.type==='moon'||e.k==='lunar_eclipse'?'Moon':e.k==='solar_eclipse'||e.type==='season'?'Sun':e.planet&&e.planet!=='Earth'?e.planet:null;
const CJ_ORD=n=>n+(n===1?'st':n===2?'nd':n===3?'rd':'th');
function calYou(e){
 const c=myChart(),f=calFam(e),b=calBody(e);
 if(!c)return `<p>${esc(calTheme(e))} Everyone feels it a little differently, depending on their birth chart.</p><p class="muted small">Add your birth details and Kosmia can show which area of your life this event touches and which of your planets it meets.</p><button class="btn ghost" data-go="settings" data-t="birth">Complete my birth profile</button>`;
 let lon=null;try{if(b)lon=(K.positions(e.date).find(p=>p.n===b)||{}).lon}catch(x){}
 const out=[],sign=lon!=null?Math.floor(((lon%360)+360)%360/30):e.sign;let q='';
 if(sign!=null&&c.known&&c.ang&&f!=='meteor'){const h=(sign-Math.floor(c.ang.asc/30)+12)%12+1;out.push(['House activated',`Your ${CJ_ORD(h)} house: ${HOUSE[h-1]}. ${CAL_HV[f]||''}`]);q=CAL_HQ[h-1]}
 if(lon!=null){const W={conjunction:'meets',sextile:'gently supports',square:'challenges',trine:'flows with',opposition:'faces'};
  const asp=c.pl.filter(p=>!(p.n==='Moon'&&!c.known)).map(p=>{const d=Math.abs(((lon-p.lon)%360+540)%360-180);for(const [n,a,o] of [['conjunction',0,6],['sextile',60,3],['square',90,5],['trine',120,5],['opposition',180,6]])if(Math.abs(d-a)<=o)return {p,n,orb:Math.abs(d-a)};return null}).filter(Boolean).sort((a,b2)=>a.orb-b2.orb).slice(0,3);
  if(asp.length)out.push(['Natal planets involved',asp.map(a=>`It ${W[a.n]} your natal ${a.p.n} (${a.n}, within ${a.orb.toFixed(1)}°), touching your ${PM[a.p.n]}.`).join(' ')]);
  else if(f!=='meteor')out.push(['Natal planets involved','It makes no close aspect to your natal planets, so it may be felt as a gentle background.'])}
 if(!c.known&&sign!=null){const me=SIGNS.findIndex(s=>s.id===S.sign),d=(sign-me+12)%12;
  out.push(['Your Sun sign',`${[`It falls in your own sign, so it may feel especially personal.`,'It falls in the sign beside yours, quietly, in the background.','It falls in a sign friendly to yours, which may open gentle opportunities.','It falls in a sign square to yours, which may bring a little useful friction.','It falls in a sign in harmony with yours, which may make it feel easy and supportive.','It falls in a sign with little in common with yours, so its themes may feel subtle.','It falls in the sign opposite yours, often a moment of balance between yourself and others.'][Math.min(d,12-d)]}`]);
  out.push(['Houses','Without your birth time and place, Kosmia cannot place this event in your houses, so none are shown.'])}
 q=q||evInfo(e).ref||'What does this moment ask of me?';
 return `${out.map(([h,t])=>`<p><b>${h}.</b> ${esc(t)}</p>`).join('')}<p class="quote">“${esc(q)}”</p>${!c.known?'<button class="btn ghost" data-go="settings" data-t="birth">Add my birth time and place</button>':''}`;
}
const CAL_TH={new:[['Beginnings','What would I like to begin, or begin again?'],['Intention','What do I want to nurture over the coming weeks?'],['Space','What could I clear to make room for something new?']],
 full:[['Clarity','What has become clearer to me recently?'],['Release','Which thoughts or expectations am I ready to let go of?'],['Gratitude','What has grown in my life that I am grateful for?']],
 quarter:[['Momentum','Where am I ready to commit a little more energy?'],['Adjustment','What would I like to adjust rather than abandon?'],['Rest','Where could I slow down?']],
 eclipse:[['Endings','What chapter of my life feels as if it is closing?'],['Beginnings','What fresh chapter do I want to write?'],['Revelation','What is coming into view that I had not noticed?']],
 mercury:[['Communication','What have I been meaning to express but have not found the words for?'],['Review','Which plan deserves a second look?'],['Reconnection','Who would I like to reconnect with?']],
 retro:[['Review','What deserves a second look before I move forward?'],['Patience','Where could I let things take their time?'],['Lessons','What have the past months taught me?']],
 season:[['Balance','Where in my life do I want more balance?'],['Change','What is changing in me with the season?'],['Welcome','What would I like to bring into the new season?']],
 meteor:[['Wonder','When did I last feel wonder?'],['Perspective','What worry feels smaller beneath the sky?'],['A Wish','If I made one wish tonight, what would it be?']],
 theme:[['The Theme','What does this moment invite me to notice?'],['My Life','Where does this theme already live in my life?'],['A Small Step','What is one small step I could take?']]};
const CAL_PREP={new:['Choose a quiet moment on the day, or the day after; the exact minute does not matter.','Clear one small space, a desk or a drawer, as a sign of making room.','Keep your intention short and in your own words.'],
 full:['Look up on the night if the sky is clear; the Moon looks full for a day or so either side.','Notice what has come to light over the last two weeks.','Let strong feelings settle before you act on them.'],
 quarter:['Look back at what you began at the New Moon.','Choose one thing to adjust or commit to.','Be kind to yourself if plans have shifted.'],
 eclipse:['Keep your plans light around the eclipse; there is no need for big decisions.','Notice what is ending without rushing to replace it.','Write down anything that feels significant.'],
 mercury:['Double-check messages, travel and arrangements.','Return to unfinished conversations rather than starting new ones.','Back up what matters and allow a little extra time.'],
 retro:['Revisit before you launch something new.','Allow delays without reading them as failure.','Note what keeps returning for your attention.'],
 season:['Spend a few minutes outside and notice the light.','Look back over the past three months.','Choose one thing to carry into the new season.'],
 meteor:['Find somewhere dark, away from city lights, after midnight.','Give your eyes twenty minutes to adjust; look up and wide, not at one spot.','Dress warmly and bring patience.'],
 theme:['Read the event’s meaning once, then let it rest.','Notice where its theme shows up in your days.','Write a line in your Journal if something stirs.']};
/* the rituals: each event offers its paths, each path three to five short steps, the last an intention */
const CAL_LP={love:['Love & Relationships','Connection, compassion, emotional awareness and meaningful bonds.','your relationships and the bonds that matter to you','Where would I like more warmth, honesty or closeness?','an old hurt, a resentment, or an expectation of how others should love you','one kind message, one honest conversation, or an evening given fully to someone you love','three people or moments of connection','I intend to love with more openness…'],
 abundance:['Abundance & Wealth','Resources, financial intentions, opportunities and appreciation.','your resources, your work and what you value','Where do I already have enough, and where would I like more?','a worry about money, a habit of scarcity, or the belief that rest must be earned','one practical step: a budget looked at kindly, an idea written down, an opportunity followed up','three things you already have','I intend to welcome…'],
 wisdom:['Wisdom & Clarity','Understanding, decisions, learning and personal direction.','the decisions, questions and learning in your life','What am I trying to understand right now?','a doubt, an old certainty, or the need to have every answer at once','one question to explore, one conversation to seek out, one decision to sit with','three things you have learned recently','I intend to see clearly…'],
 peace:['Peace & Healing','Rest, self-compassion, emotional reflection and inner balance.','your rest, your heart and your inner balance','Where in my life am I asking too much of myself?','tension, guilt, or a thought that keeps returning','one gentle act of care: an early night, a walk, a moment of quiet each day','three moments of calm','I intend to be gentle with myself…'],
 comm:['Communication','The way you speak, listen and write.','the way you speak, listen and write','Is there something I said, or left unsaid, that needs revisiting?','','one message to clarify or one conversation to return to','','I intend to speak and listen with care…'],
 plans:['Plans','Your plans, projects and arrangements.','your plans, projects and arrangements','Which plan deserves a second look before I move forward?','','one plan to review, one detail to check','','I intend to move forward with clarity…'],
 rel:['Relationships','People you have drifted from or misunderstood.','the people you have drifted from or misunderstood','Who would I like to reconnect with?','','one person to reach out to, with no pressure','','I intend to reconnect with…']};
function calPaths(e){
 const f=calFam(e);
 if(f==='new'||f==='full'||f==='eclipse')return ['love','abundance','wisdom','peace'];
 if(f==='mercury')return ['comm','plans','rel'];
 return [f==='retro'?'review':f==='season'?'season':f==='meteor'?'wonder':'theme'];
}
const calPathInfo=(e,p)=>CAL_LP[p]?CAL_LP[p].slice(0,2):p==='review'?[`${e.planet} Review`,`Revisit ${PM[e.planet]}, gently and without hurry.`]:p==='season'?['Seasonal Ritual','Honour the turning of the year and find your balance.']:p==='wonder'?['Contemplation Ritual','Wonder, perspective and a single wish.']:['A Ritual for This Moment',`Reflect on ${calTheme(e).replace(/\.$/,'').toLowerCase()}.`];
const calRitName=e=>({new:'The Ritual of Beginning',full:'The Ritual of Release',eclipse:'The Ritual of Thresholds',mercury:e.k==='station_direct'?'The Ritual of Moving Forward':'The Ritual of Review',retro:'The Ritual of Review',season:'The Ritual of the Turning Year',meteor:'The Ritual of Wonder'})[calFam(e)]||'The Ritual of Reflection';
const calRitWhy=e=>({new:'New beginnings and intentions.',full:'Release and gratitude.',eclipse:'Endings and beginnings.',mercury:'Review, repair and reconnect.',retro:`Reviewing ${PM[e.planet]||'what matters'}.`,season:'Seasonal transition and balance.',meteor:'Wonder and perspective.'})[calFam(e)]||'Reflection on a new theme.';
function calSteps(e,p){
 const f=calFam(e),P=CAL_LP[p]||[],i=evInfo(e),A=['Arrive','Take a moment to become present.','Find a comfortable position. Take three slow, natural breaths and allow yourself to settle.'];
 const I=f==='meteor'?['Your Wish','Make one wish.','Write your wish in your own words. You may keep it in your Journal, or simply hold it in mind.','My wish is…']:['Your Intention','What will you carry forward?','Write an intention in your own words. You may keep it in your Journal, or simply hold it in mind.',P[7]||'I intend to…'];
 if(f==='new')return [A,['Turn Inward',`Bring to mind ${P[2]}.`,`${P[3]} Let the answer come slowly; there is no wrong one.`],['Imagine','Picture this part of your life gently changed.','Imagine it a month from now, a little lighter and truer. What do you notice first? Let the picture stay simple and kind.'],['A First Step','Beginnings are small.',`Choose ${P[5]}. It does not need to be big: the New Moon favours small, sincere beginnings.`],I];
 if(f==='full')return [A,['Look Back','What has become clearer?',`Think back over the last two weeks and ${P[2]}. ${P[3]}`],['Release','Set something down.',`Name ${P[4]}. Breathe out slowly and imagine setting it down in the moonlight. You do not have to carry it tonight.`],['Gratitude','Notice what has grown.',`Name ${P[6]} you are grateful for, aloud or quietly to yourself.`],I];
 if(f==='eclipse')return [A,['What Is Ending','Honour what is closing.',`Think of ${P[2]}. Which chapter here feels as if it is closing, or has already closed?`],['What Is Beginning','Make room.',`What would you like to grow in the space it leaves? ${P[3]}`],['Trust','Let it unfold.','Eclipses are traditionally thresholds. There is nothing to force: simply notice, and trust your own timing.'],I];
 if(f==='mercury')return [A,['Review','Look back with curiosity.',`Look back at ${P[2]}. ${P[3]}`],['Repair','Mend gently.',`Choose ${P[5]}. Small repairs are enough.`],['Reconnect','Return with care.','Notice who or what you would like to return to with fresh understanding.'],I];
 if(f==='retro')return [A,['Review',`Revisit ${PM[e.planet]}.`,`Where in your life have ${PM[e.planet]} asked for attention lately? What deserves a second look?`],['Integrate','What have you learned?','Name one lesson from the past months that you would like to keep.'],I];
 if(f==='season')return [A,['Look Back','The season that is ending.','What did the last three months bring you? Name one thing you are glad of, and one thing you are ready to leave behind.'],['Balance','Find your centre.','The turning points of the year are traditionally moments of balance. Where would you like more balance between giving and resting?'],['Welcome','The season that begins.','What would you like to bring into the new season?'],I];
 if(f==='meteor')return [A,['Look Up','Wonder.','If you can, step outside or open a window. Look up for a few minutes and let your eyes adjust to the dark. Even without a shooting star, the sky is there.'],['Perspective','Feel the scale of things.',`The meteors are dust from ${e.parent||'a comet'}, burning high above you. What worry feels a little smaller beside the sky?`],I];
 return [A,['The Theme',esc(calName(e)),i.sym||calTheme(e)],['Your Life','A question to sit with.',i.ref||'What does this moment invite me to notice?'],I];
}
const calClose=e=>({new:'Your intention is planted. Let it grow in its own time.',full:'What you released can rest now. Carry your gratitude with you.',eclipse:'A threshold, crossed gently. Trust your own timing.',mercury:'Reviewed with care. Move forward at your own pace.',retro:'Reviewed with care. Move forward at your own pace.',season:'The year turns, and you with it.',meteor:'May your wish travel far.'})[calFam(e)]||'Thank you for this quiet moment.';
const calDur=e=>calSteps(e,calPaths(e)[0]).length>4?'About 8 minutes · 5 steps':'About 5 minutes · '+calSteps(e,calPaths(e)[0]).length+' steps';
// the New Moon intention set before a Full Moon, to revisit at the Full Moon
function calNewMoonIntent(e){
 if(calFam(e)!=='full')return null;const t=evDay(e),from=dkey(new Date(+e.date-32*DAY));
 return S.journal.filter(j=>j.kind==='intention'&&j.data&&j.data.ev&&j.data.ev.k==='new_moon'&&j.day<=t&&j.day>=from).sort((a,b)=>a.day<b.day?1:-1)[0]||null;
}
function calEventView(){
 const e=calFind(V.calRef);
 if(!e)return cjPage(`${hdr('Cosmic Event')}<p class="muted center">This event could not be found.</p><button class="btn" data-go="discover" data-t="calendar">Return to Calendar</button>`,'cal');
 const ref=evRef(e),b=calBm(ref),d=b?b.data:{},i=evInfo(e),now=new Date(),day=evDay(e),today=dkey(),on=calOngoing().find(o=>evRef(o.e)===ref);
 const st=on?['Ongoing',`Retrograde until ${on.end?ymdLong(evDay(on.end),{day:'numeric',month:'long'}):'later this year'}`,'Experience']:day===today?['Happening today',calCount(e),'Experience']:day>today?['Upcoming',calCount(e),'Prepare']:['Past event',ymdLong(day,{day:'numeric',month:'long',year:'numeric'}),'Reflect'];
 const prog=(S.evRit||{})[ref],paths=calPaths(e),pick=V.calPath&&paths.includes(V.calPath)?V.calPath:(prog&&prog.path)||paths[0],nmi=calNewMoonIntent(e),b2=calBody(e);
 const rem=d.rem||{},remOpen=V.calRem===ref;if(remOpen)setTimeout(calRemPreview);
 return cjPage(`${hdr(esc(calName(e)),{sub:`${st[0]} · ${st[1]}`})}
 <section class="cal-ov">${evArt(e,true)}<p class="cal-when">${ymdLong(day,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}<br>${calTime(e)}</p><p class="cal-mode">${st[0]} · ${st[1]}</p><p class="cal-th big">${esc(calTheme(e))}</p><p class="cal-mode">A time to ${st[2].toLowerCase()}</p></section>
 <div class="ss-acts cal-acts"><button class="btn${calSaved(b)?' ghost':''}" data-cal="save">${calSaved(b)?'✓ Saved':'Save'}</button><button class="btn ghost" data-cal="rem" aria-expanded="${remOpen}">${d.rem?'Reminder set':'Set a Reminder'}</button>${heartBtn('event:'+ref)}</div>
 ${remOpen?mbox(`<h3>Set a Reminder</h3><p class="muted small">${esc(calName(e))}</p><label class="row cn-cb"><input type="checkbox" class="cb" id="calrb" ${rem.before?'checked':''}> <span>The day before</span></label><label class="row cn-cb"><input type="checkbox" class="cb" id="calrd" ${rem.day||!d.rem?'checked':''}> <span>On the day</span></label><div class="field"><label for="calrt">Preferred time</label><input type="time" id="calrt" value="${esc(rem.time||S.notif.time||'08:00')}"></div><p class="muted small" id="calrp"></p><div class="ss-acts"><button class="btn" data-cal="remsave">Save Reminder</button>${d.rem?'<button class="btn ghost" data-cal="remoff">Remove Reminder</button>':''}</div><p class="muted small">Kosmia shows your reminder when you open it on the day. Notifications on your phone will follow once push delivery is switched on.</p>`,'cal-rem'):''}
 ${ssHead('What’s Happening in the Universe')}<div class="dr-text"><p>${i.fact||esc(calTheme(e))}</p><p class="muted small">${e.dateOnly?'Peak on '+ymdLong(day,{day:'numeric',month:'long'})+' (approximate).':'Exact time: '+evt(e.date)+', in your time zone.'}</p></div>
 ${ssHead('The Astrological Meaning')}<div class="dr-text"><p>${i.sym||''} ${e.sign!=null&&calFam(e)!=='meteor'?`In ${sIdx(e.sign).name}, its themes are coloured ${STYLE[sIdx(e.sign).id]}.`:''}</p><p class="cal-kw">${esc(evKeys(e))}</p></div>
 ${ssHead('What It Means for You')}<div class="dr-text cal-you">${calYou(e)}</div>
 ${ssHead('Themes to Reflect On')}<div class="dr-book cal-ths">${(CAL_TH[calFam(e)]||CAL_TH.theme).map(([t,q])=>`<button class="dr-entry" data-cal="theme" data-q="${esc(q)}"><span class="dr-d">${t}</span><strong>${esc(q)}</strong><span class="dr-s">Write in My Journal</span></button>`).join('')}</div>
 ${ssHead('How to Prepare')}<ul class="cal-prep">${(CAL_PREP[calFam(e)]||CAL_PREP.theme).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
 ${nmi?mbox(`<h3>Your New Moon Intention</h3><p class="quote center">“${esc(nmi.body)}”</p><p class="muted small center">Set on ${ymdLong(nmi.day,{day:'numeric',month:'long'})} · ${esc((nmi.data||{}).path||'')}</p><button class="btn ghost" data-jx="open" data-k="j:${esc(nmi.id)}">Revisit this intention</button>`,'dr-q'):''}
 ${ssHead('Your Event Ritual')}<div class="dr-text"><p><b>${calRitName(e)}.</b> ${calRitWhy(e)} A short, peaceful practice in a few steps, whenever it suits you.</p></div>
 ${d.ritual?`<p class="cal-done">Ritual completed on ${ymdLong(d.ritual.day,{day:'numeric',month:'long'})} · ${esc(d.ritual.label||'')}${d.ritual.jid&&S.journal.some(j=>j.id===d.ritual.jid)?` · <button class="link" data-jx="open" data-k="j:${esc(d.ritual.jid)}">View your intention</button>`:''}</p>`:''}
 ${prog?`<button class="btn" data-cal="ritgo">Continue Your Ritual · step ${prog.step+1} of ${calSteps(e,prog.path).length}</button>`:''}
 <div class="dr-book cal-paths" role="radiogroup" aria-label="Choose a ritual path">${paths.map(p=>{const [n,w]=calPathInfo(e,p);return `<button class="dr-entry cal-path" role="radio" aria-checked="${pick===p}" data-cal="path" data-v="${p}"><strong>${esc(n)}</strong><span class="dr-s">${esc(w)}</span><span class="dr-d">${calSteps(e,p).length>4?'About 8 minutes':'About 5 minutes'} · ${calSteps(e,p).length} steps</span></button>`}).join('')}</div>
 ${prog&&prog.path===pick?'':`<button class="btn${prog?' ghost':''}" data-cal="ritstart" data-v="${pick}">${prog?'Begin this path instead':'Begin the Ritual'}</button>`}
 ${ssHead('Continue Exploring')}<div class="ss-acts"><button class="btn ghost" data-cal="share">Share</button><button class="btn ghost" data-act="kasask" data-q="${esc(`Tell me about the ${calName(e)} on ${ymdLong(day,{day:'numeric',month:'long'})}. What does it invite me to reflect on, and how could I prepare for it?`)}">Ask Kassandra</button></div>
 <div class="ss-acts"><button class="btn ghost" data-cal="sky">${b2==='Moon'?'See the Moon in the Sky':b2?`See ${b2} in the Sky`:'See It in the Sky'}</button><button class="btn ghost" data-cal="theme" data-q="">Write in My Journal</button></div>
 ${b2?`<p class="muted small center">The Sky shows where ${b2==='Moon'?'the Moon is':b2+' is'} now${day>today?', not its future position':''}.</p>`:''}
 <div class="dr-tools"><button class="dr-link" data-go="discover" data-t="calendar">Return to Calendar</button></div>`,'cal');
}
function calRitualView(){
 const e=calFind(V.calRef);if(!e)return calEventView();
 const ref=evRef(e);S.evRit=S.evRit||{};
 if(V.calDone===ref){const d=(calBm(ref)||{data:{}}).data.ritual||{};
  return cjPage(`${hdr(calRitName(e),{sub:esc(calName(e))})}<section class="cal-fin">${ssGlyph('☾','big')}<h2>The ritual is complete.</h2><p class="quote center">${calClose(e)}</p><p class="muted small center">There is nothing to keep up and nothing to make up. Return whenever you like.</p></section>
  <div class="ss-acts">${d.jid?`<button class="btn" data-jx="open" data-k="j:${esc(d.jid)}">View My Intention</button>`:''}<button class="btn ghost" data-cal="openev">Return to the Event</button><button class="btn ghost" data-go="discover" data-t="calendar">Return to Calendar</button></div>`,'cal rit')}
 let pr=S.evRit[ref];if(!pr){pr=S.evRit[ref]={path:calPaths(e)[0],step:0,text:'',day:dkey()};save()}
 const st=calSteps(e,pr.path),i=Math.min(pr.step,st.length-1),s=st[i],last=i===st.length-1,[pn]=calPathInfo(e,pr.path);
 return cjPage(`${hdr(calRitName(e),{sub:`${esc(calName(e).replace(/ in .*/,''))} · ${esc(pn)}`})}
 <p class="tt-count" aria-live="polite">Step ${i+1} of ${st.length}</p><div class="cal-dots" aria-hidden="true">${st.map((_,n)=>`<i class="${n<=i?'on':''}"></i>`).join('')}</div>
 <section class="cal-step">${mbox(`<h2>${s[0]}</h2><p class="cal-st">${s[1]}</p><p>${s[2]}</p>${last?`<div class="field dr-parch"><label for="calin" class="sr-only">${s[0]}</label><textarea id="calin" rows="4" maxlength="400" placeholder="${esc(s[3])}">${esc(pr.text||'')}</textarea></div>`:''}`)}</section>
 ${last?`<div class="ss-acts"><button class="btn" data-cal="ritkeep">Add to Journal</button><button class="btn ghost" data-cal="ritpriv">Complete privately</button></div>`:`<button class="btn" data-cal="next">Continue</button>`}
 ${i?'<button class="dr-link" data-cal="prev">Previous step</button>':''}
 <p class="muted small center">Your place is kept if you leave; the event page will offer to continue.</p>`,'cal rit');
}
function savedEventsView(){
 const f=V.calSv||'up',today=dkey(),all=S.bookmarks.filter(b=>b.kind==='event').map(b=>({b,d:b.data||{},day:(b.data||{}).date?dkey(new Date(b.data.date)):''}));
 const F=[['up','Upcoming'],['rem','Reminders'],['past','Past Events'],['rit','Completed Rituals']];
 const l=all.filter(x=>f==='up'?x.day>=today:f==='rem'?!!x.d.rem:f==='past'?x.day<today:!!x.d.ritual).sort((a,b)=>f==='past'||f==='rit'?(a.day<b.day?1:-1):(a.day>b.day?1:-1));
 return cjPage(`${hdr('Saved Events',{sub:'The celestial moments you are watching for.'})}
 <div class="fchips ss-chips rd-cats">${F.map(([k,l2])=>`<button class="fchip" role="radio" aria-checked="${f===k}" data-cal="sv" data-v="${k}">${l2}</button>`).join('')}</div>
 <div class="dr-book">${l.map(x=>`<div class="cal-sv"><button class="dr-entry" data-cal="open" data-ref="${esc(x.b.ref)}"><span class="dr-d">${x.day?ymdLong(x.day,{weekday:'short',day:'numeric',month:'long',year:'numeric'}):''}</span><strong>${esc(x.d.name||'A celestial event')}${x.d.sign!=null&&/moon|eclipse/i.test(x.d.k||'')?' in '+sIdx(x.d.sign).name:''}</strong><span class="dr-s">${x.d.rem?esc(remTxt(x.d.rem)):'No reminder'}${x.d.ritual?' · Ritual completed, '+esc(x.d.ritual.label||''):''}</span></button>
 <div class="cal-svb"><button class="link" data-cal="openrem" data-ref="${esc(x.b.ref)}">${x.d.rem?'Change reminder':'Set a reminder'}</button>${x.d.ritual&&x.d.ritual.jid&&S.journal.some(j=>j.id===x.d.ritual.jid)?`<button class="link" data-jx="open" data-k="j:${esc(x.d.ritual.jid)}">Revisit intention</button>`:''}<button class="link" data-cal="unsave" data-ref="${esc(x.b.ref)}">Remove</button></div></div>`).join('')||`<p class="muted center">${f==='up'?'Save an event, or set a reminder, and it will wait for you here.':f==='rem'?'No reminders yet. Every event has Set a Reminder.':f==='past'?'Saved events that have passed will gather here.':'Events whose ritual you complete will gather here.'}</p>`}</div>
 <button class="dr-link" data-go="discover" data-t="calendar">Return to Calendar</button>`,'cal');
}
// reminders, shown when Kosmia is open on the day (or the day before): one per event and moment, never twice
function calRemCheck(){
 if(!K||!S.sign)return;S.remSeen=S.remSeen||{};const now=new Date(),today=dkey(),tom=dkey(new Date(+now+DAY)),hm=fmt({hour:'2-digit',minute:'2-digit',hourCycle:'h23'},now),due=[];
 S.bookmarks.filter(b=>b.kind==='event'&&(b.data||{}).rem).forEach(b=>{const r=b.data.rem,d=dkey(new Date(b.data.date));if(hm<(r.time||'08:00'))return;if(r.before&&d===tom)due.push([b.ref+':b',b.data.name,'before',b.ref]);if(r.day&&d===today)due.push([b.ref+':d',b.data.name,'day',b.ref])});
 const mn=S.notif.moons||(S.notif.ecl?S.notif.def||'day':'');if(mn&&hm>=(S.notif.time||'08:00'))K.lunarPhases(new Date(+now-DAY),new Date(+now+2*DAY)).concat(S.notif.ecl?K.events(new Date(+now-DAY),new Date(+now+2*DAY)).filter(e=>e.type==='eclipse'):[]).filter(e=>(S.notif.moons&&e.k==='new_moon'&&S.notif.nm!==false)||(S.notif.moons&&e.k==='full_moon'&&S.notif.fm!==false)||e.type==='eclipse').forEach(e=>{const ref=evRef(e),d=evDay(e),b=calBm(ref);if(b&&b.data.rem)return;if((mn==='before'||mn==='both')&&d===tom)due.push([ref+':b',e.name,'before',ref]);if((mn==='day'||mn==='both')&&d===today)due.push([ref+':d',e.name,'day',ref])});
 const x=due.find(d=>!S.remSeen[d[0]]);if(!x)return;S.remSeen[x[0]]=today;Object.keys(S.remSeen).forEach(k=>{if(S.remSeen[k]<dkey(new Date(+now-10*DAY)))delete S.remSeen[k]});save();
 const nm=x[1].replace(/ meteor shower peak/,' meteor shower');V.remRef=x[3];
 toast(x[2]==='before'?`Tomorrow brings the ${nm}. Discover its themes and take a moment to prepare.`:`The ${nm} is here. Your reflection and ritual are ready whenever you are.`,'calremgo','Open');
}
setTimeout(calRemCheck,2500);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(calRemCheck,800)});
function calRemPreview(){const p=$('#calrp');if(!p)return;const b=$('#calrb').checked,d=$('#calrd').checked,t=$('#calrt').value||'08:00',n=+b+ +d;p.textContent=n?`You would receive ${n===1?'one reminder':'two reminders'} at ${t} local time${n===1?(b?', the day before':', on the day'):', the day before and on the day'}.`:'Choose the day before, the day itself, or both.'}

/* ---------- the Journal ---------- */
const JX_SRC={free:'Free entry',evening:'Evening Ritual',morning:'Morning Ritual',calendar:'Calendar Ritual',oracle:'Oracle',sky:'Sky',kassandra:'Kassandra',horoscope:'Horoscope',event:'Calendar',signs:'Signs & Synchronicities',cosmos:'My Cosmos'};
const jxBucket=n=>/^New/.test(n||'')?'new':/^Full/.test(n||'')?'full':/Waxing|First/.test(n||'')?'waxing':'waning';
const JX_PH={new:'New Moon',waxing:'Waxing Moon',full:'Full Moon',waning:'Waning Moon'};
const jxPhaseAt=(day,at)=>{try{return K.moon(new Date(at&&at.length>10?at:day+'T21:00:00')).name}catch(e){return ''}};
const RD_CATL={tarot:'Tarot',dreams:'Dreams',numbers:'Sacred Numbers',sync:'Synchronicities',patterns:'Patterns',numerology:'Numerology',connections:'Connections',kassandra:'Kassandra'};
// every personal entry in one shape: written pages, Ritual intentions and evening words, and words written beside kept items
function jxAll(){
 const lk={},rd={};Object.entries(rdMeta().data||{}).forEach(([k,v])=>(v.refl||[]).forEach(id=>lk[id]=k));
 const needRd=Object.keys(lk).length?rdAll():[];needRd.forEach(x=>rd[x.k]=x);
 const out=[];
 S.journal.forEach(j=>{const d=j.data||{},cat=j.kind==='intention'?'intention':j.kind==='gratitude'||(j.kind==='reflection'&&j.title==='My Gratitude')?'gratitude':'reflection';
  let link=d.link||null,src=d.src||(j.kind==='synchronicity'?'signs':'free');
  if(!link&&lk[j.id]){const x=rd[lk[j.id]];link={k:'saved:'+lk[j.id],t:x?`${RD_CATL[x.cat]||'Oracle'} — ${x.title}`:'A saved reading'};src='oracle'}
  if(d.ev&&!link)link={k:'event:'+d.ev.ref,t:`${d.ev.name}${d.path?' — '+d.path:''}`};
  out.push({k:'j:'+j.id,cat,day:j.day,at:j.at||j.day,title:cat==='gratitude'&&j.title==='My Gratitude'?'':(j.title||''),body:j.body||'',src,link,phase:d.phase||jxPhaseAt(j.day,j.at),j,path:d.path||''})});
 Object.keys(S.notes||{}).forEach(day=>{const n=S.notes[day];if(!n)return;out.push({k:'fortune:'+day,cat:'reflection',day,at:day+'T21:00',title:'',body:n,src:'evening',link:{k:'fortune:'+day,t:'Daily Whisper — '+cardFor(day).title},phase:jxPhaseAt(day)})});
 Object.keys(S.carry||{}).forEach(day=>{const n=S.carry[day];if(!n)return;out.push({k:'carry:'+day,cat:'intention',day,at:day+'T08:00',title:'',body:n,src:'morning',link:null,phase:jxPhaseAt(day,day+'T08:00')})});
 journalItems().filter(p=>p.t!=='j'&&p.t!=='n'&&jNote(p)).forEach(p=>{const L={h:['horoscope','Horoscope'],e:['event','Calendar'],r:['oracle','Tarot'],c:['oracle','Connections'],d:['oracle','Dreams']}[p.t]||['free',''];
  out.push({k:jKey(p),cat:'reflection',day:p.day,at:p.at||p.day,title:'',body:jNote(p),src:L[0],link:{k:jKey(p),t:`${L[1]} — ${plain(jHeading(p))}`,item:true},phase:jxPhaseAt(p.day)})});
 return out.sort((a,b)=>String(b.at)>String(a.at)?1:-1);
}
const jxTitle=x=>x.title||clip((x.body||'').split('\n')[0],60)||'An untitled page';
const jxSrcL=x=>x.link&&x.src!=='free'?`From ${x.link.t}`:JX_SRC[x.src]||'Free entry';
const jxRow=x=>`<button class="dr-entry" data-jx="open" data-k="${esc(x.k)}"><span class="dr-d">${ymdLong(x.day,{day:'numeric',month:'long'})}${x.phase?' · '+JX_PH[jxBucket(x.phase)]:''}</span><strong>${esc(jxTitle(x))}</strong>${x.title&&x.body?`<span class="dr-x">${esc(clip(x.body,90))}</span>`:x.body.length>60?`<span class="dr-x">${esc(clip(x.body.slice(60),80))}</span>`:''}<span class="dr-f">${esc(jxSrcL(x))}</span></button>`;
const jxMonths=l=>{const by={};l.forEach(x=>{const m=(x.day||'').slice(0,7);(by[m]=by[m]||[]).push(x)});return Object.keys(by).sort((a,b)=>a<b?1:-1).map(m=>`<p class="dr-month">${ymdLong(m+'-01',{month:'long',year:'numeric'})}</p>${by[m].map(jxRow).join('')}`).join('')};
// My Library: everything given a heart, kept as it was
const JX_LC=[['horoscopes','Horoscopes'],['whispers','Whispers'],['tarot','Tarot'],['dreams','Dreams'],['signs','Signs & Synchronicities'],['connections','Connections'],['events','Cosmic Events'],['sky','Sky'],['kassandra','Kassandra']];
function jxLib(){
 const out=[];
 S.saved.forEach(x=>out.push({k:'whisper:'+x.date,cat:'whispers',title:cardFor(x.date).title,day:x.date,at:x.date,open:`data-act="jopen" data-k="fortune:${x.date}"`}));
 S.bookmarks.filter(b=>b.kind==='horoscope').forEach(b=>{const d=b.data||{};out.push({k:'bk:horoscope:'+b.ref,cat:'horoscopes',title:`${sg(d.sign).name} — ${cap(d.period||'daily')} Horoscope`,day:(b.at||'').slice(0,10)||dkey(),at:b.at,open:`data-act="jopen" data-k="bk:horoscope:${esc(b.ref)}"`})});
 const CM={tarot:'tarot',dreams:'dreams',numbers:'signs',sync:'signs',patterns:'signs',numerology:'signs',connections:'connections',kassandra:'kassandra'};
 rdAll().filter(x=>x.fav).forEach(x=>{const m=rdM(x.k);out.push({k:x.k,cat:CM[x.cat]||'tarot',title:x.title,day:(m.favAt||x.at||x.day||'').slice(0,10),at:m.favAt||x.at,open:`data-rd="open" data-k="${esc(x.k)}"`})});
 Object.entries(rdMeta().data||{}).filter(([k,v])=>v.fav&&v.snap&&/^(event|sky|place):/.test(k)).forEach(([k,v])=>out.push({k,cat:k.startsWith('event:')?'events':'sky',title:v.snap.title,day:(v.favAt||'').slice(0,10)||dkey(),at:v.favAt,open:k.startsWith('event:')?`data-cal="open" data-ref="${esc(k.slice(6))}"`:k.startsWith('place:')?`data-mc="pl" data-p="${esc(k.slice(6))}"`:`data-jx="open" data-k="${esc(k)}"`}));
 return out.sort((a,b)=>String(b.at)>String(a.at)?1:-1);
}
function jxUnheart(k){
 if(k.startsWith('whisper:')){const d=k.slice(8);S.saved=S.saved.filter(x=>x.date!==d);save();syncFortune(d);toast('Removed from My Library');return}
 if(k.startsWith('bk:horoscope:')){const r=k.slice(13);S.bookmarks=S.bookmarks.filter(b=>!(b.kind==='horoscope'&&b.ref===r));save();C.deleteBookmark&&C.deleteBookmark('horoscope',r);toast('Removed from My Library');return}
 heartSet(k,false);
}
// the months of the journey and what each holds
function jxMonth(m){
 const e=jxAll().filter(x=>x.day.slice(0,7)===m),lib=jxLib().filter(x=>(x.day||'').slice(0,7)===m);
 return {e,lib,r:e.filter(x=>x.cat==='reflection'),i:e.filter(x=>x.cat==='intention'),g:e.filter(x=>x.cat==='gratitude')};
}
function jxMilestones(){
 const all=jxAll().slice().reverse(),out=[],first=c=>all.find(x=>x.cat===c);
 const r=first('reflection'),i=first('intention'),g=first('gratitude');
 if(r)out.push([r.day,'The First Page','Your first reflection in the Journal.']);if(i)out.push([i.day,'A Seed of Intention','Your first intention.']);if(g)out.push([g.day,'A Grateful Heart','Your first moment of gratitude.']);
 const rit=S.bookmarks.filter(b=>b.kind==='event'&&(b.data||{}).ritual).map(b=>b.data.ritual.day).sort()[0];if(rit)out.push([rit,'Your First Ritual','Your first Calendar ritual.']);
 const st=all[0];if(st){const a=dkey(new Date(K.parseYmd(st.day)+30*DAY)),later=all.find(x=>x.day>=a);if(later)out.push([later.day,'A Month of Reflection','A month since your Journal journey began.']);
  const y=dkey(new Date(K.parseYmd(st.day)+365*DAY));if(y<=dkey())out.push([y,'A Year of Becoming','One year since your journey began.']);
  try{const nm=K.lunarPhases(new Date(K.parseYmd(st.day)-30*DAY),new Date()).filter(x=>x.k==='new_moon');for(let n=0;n<nm.length-1;n++){const a2=dkey(nm[n].date),b2=dkey(nm[n+1].date),w=all.filter(x=>x.cat==='reflection'&&x.day>=a2&&x.day<b2);if(new Set(w.map(x=>jxBucket(x.phase))).size===4){out.push([b2,'A Lunar Chapter','Reflections written across a whole cycle of the Moon.']);break}}}catch(x){}}
 return out.sort((a,b)=>a[0]<b[0]?-1:1);
}
function jxMonthLine(m,M){
 const ms=jxMilestones().filter(x=>x[0].slice(0,7)===m),allm=[...new Set(jxAll().map(x=>x.day.slice(0,7)))].sort();
 if(allm[0]===m)return 'The beginning of your journey.';
 if(ms.some(x=>x[1]==='A Lunar Chapter'))return 'Your first complete lunar cycle of reflection.';
 const sc=jxThemes(M.e).slice(0,2);if(sc.length===2&&sc[1][2]>1)return `A month of ${sc[0][0].toLowerCase()} and ${sc[1][0].toLowerCase()}.`;
 return M.e.length+M.lib.length>5?'A full chapter of your journey.':'A quiet chapter of your journey.';
}
const jxThemes=l=>THEMES.map(([lab,ic,re])=>[lab,ic,l.filter(x=>(x.title+' '+x.body).toLowerCase().match(re)).length]).filter(x=>x[2]).sort((a,b)=>b[2]-a[2]);
function jxHome(){
 const all=jxAll(),c=k=>all.filter(x=>x.cat===k).length,lib=jxLib(),nm=firstName();
 const months=[...new Set([...all.map(x=>x.day.slice(0,7)),...lib.map(x=>(x.day||'').slice(0,7))].filter(Boolean))].sort((a,b)=>a<b?1:-1);
 const draft=S.jdraft&&(S.jdraft.body||S.jdraft.title);
 return cjPage(`${hdr('Journal',{back:false,sub:'The story of your becoming, written in your own words.'})}
 <button class="jx-write" data-jx="write"><span class="jx-pen">${FEATHER}</span><span><strong>${draft?'Continue your page':'Write'}</strong><span>${draft?esc(clip(S.jdraft.body||S.jdraft.title,50)):nm?esc(nm)+', capture a thought, a feeling, a moment.':'Capture a thought, a feeling, a moment.'}</span></span></button>
 ${ssHead('Your Personal Collection')}<div class="list">
 ${ssDoor('✎','My Reflections',`Your thoughts, experiences and moments of understanding.${c('reflection')?` · ${c('reflection')}`:''}`,'data-go="tarot" data-t="reflections"')}
 ${ssDoor('✧','My Intentions',`The things you choose to nurture and carry forward.${c('intention')?` · ${c('intention')}`:''}`,'data-go="tarot" data-t="intentions"')}
 ${ssDoor('❀','My Gratitude',`The moments, people and experiences you appreciate.${c('gratitude')?` · ${c('gratitude')}`:''}`,'data-go="tarot" data-t="gratitude"')}
 ${ssDoor('♥','My Library',`The words and discoveries you have chosen to keep.${lib.length?` · ${lib.length}`:''}`,'data-go="tarot" data-t="library"')}</div>
 ${ssHead('Your Journey')}
 ${months.length?`<div class="dr-book">${months.slice(0,3).map(m=>{const M=jxMonth(m);return `<button class="dr-entry" data-jx="month" data-v="${m}"><span class="dr-d">${ymdLong(m+'-01',{month:'long',year:'numeric'})}</span><strong>${esc(jxMonthLine(m,M))}</strong><span class="dr-s">${M.r.length} reflection${M.r.length===1?'':'s'} · ${M.i.length} intention${M.i.length===1?'':'s'} · ${M.lib.length} saved item${M.lib.length===1?'':'s'}</span></button>`}).join('')}</div>
 ${months.length>3?`<div class="field"><label for="jxmsel">Another month</label><select id="jxmsel"><option value="">Choose a month…</option>${months.map(m=>`<option value="${m}">${ymdLong(m+'-01',{month:'long',year:'numeric'})}</option>`).join('')}</select></div>`:''}`
 :'<p class="muted center">Your journey begins with your first page. Whatever you write, intend or keep will gather here, month by month.</p>'}`,'jx');
}
const JXR_F=[['','All'],['evening','Evening Ritual'],['free','Free entries'],['oracle','Oracle'],['calendar','Calendar'],['event','Calendar'],['sky','Sky'],['horoscope','Horoscope'],['signs','Signs'],['kassandra','Kassandra']];
function jxReflections(){
 const F=V.jxR||(V.jxR={q:'',src:'',m:''}),all=jxAll().filter(x=>x.cat==='reflection'),q=F.q.trim().toLowerCase();
 const srcs=[...new Set(all.map(x=>x.src==='event'?'calendar':x.src))],months=[...new Set(all.map(x=>x.day.slice(0,7)))].sort((a,b)=>a<b?1:-1);
 const l=all.filter(x=>(!F.src||(x.src==='event'?'calendar':x.src)===F.src)&&(!F.m||x.day.slice(0,7)===F.m)&&(!q||[x.title,x.body,x.link&&x.link.t,ymdLong(x.day,{day:'numeric',month:'long',year:'numeric'})].join(' ').toLowerCase().includes(q)));
 return cjPage(`${hdr('My Reflections',{sub:'Your thoughts, experiences and moments of understanding.'})}
 <button class="jx-write sm" data-jx="write" data-c="reflection"><span class="jx-pen">${FEATHER}</span><span><strong>A new reflection</strong></span></button>
 <div class="field"><label for="jxq" class="sr-only">Search your reflections</label><input type="search" id="jxq" data-f="jxR" placeholder="Search your reflections…" value="${esc(F.q)}" autocomplete="off"></div>
 <div class="fchips ss-chips rd-cats"><button class="fchip" role="radio" aria-checked="${!F.src}" data-jx="fsrc" data-v="">All</button>${JXR_F.filter(([k])=>k&&k!=='event'&&srcs.includes(k)).map(([k,l2])=>`<button class="fchip" role="radio" aria-checked="${F.src===k}" data-jx="fsrc" data-v="${k}">${l2}</button>`).join('')}</div>
 ${months.length>1?`<div class="field"><label for="jxrm" class="sr-only">Month</label><select id="jxrm"><option value="">Every month</option>${months.map(m=>`<option value="${m}" ${F.m===m?'selected':''}>${ymdLong(m+'-01',{month:'long',year:'numeric'})}</option>`).join('')}</select></div>`:''}
 <div class="dr-book" id="jxlist">${l.length?jxMonths(l):`<p class="muted center">${all.length?'No reflection matches.':'Your reflections will gather here: evening words from the Ritual, pages from the feather pen, and thoughts about readings, events and the sky.'}</p>`}</div>`,'jx');
}
function jxIntentions(){
 const v=V.jxI||'current',all=jxAll().filter(x=>x.cat==='intention'),today=dkey();
 let nm='';try{const p=K.lunarPhases(new Date(Date.now()-31*DAY),new Date()).filter(x=>x.k==='new_moon').pop();nm=p?dkey(p.date):''}catch(e){}
 const tday=all.find(x=>x.day===today&&x.src==='morning')||all.find(x=>x.day===today),cyc=all.filter(x=>x!==tday&&nm&&x.day>=nm),past=all.filter(x=>x!==tday&&!cyc.includes(x));
 const card=x=>`<button class="dr-entry" data-jx="open" data-k="${esc(x.k)}"><span class="dr-d">${x.src==='calendar'&&x.link?esc(x.link.t.split(' — ')[0])+' Intention':x.src==='morning'?'Daily Intention':'Personal Intention'} · ${ymdLong(x.day,{day:'numeric',month:'long'})}</span><strong>${esc(x.body)}</strong><span class="dr-f">${x.src==='calendar'?esc((x.path?x.path+' · ':'')+'Calendar Ritual'):esc(JX_SRC[x.src]||'Free entry')}</span></button>`;
 let body;
 if(v==='current')body=`${ssHead('Today’s Intention')}${tday?`<div class="dr-book">${card(tday)}</div>`:`<p class="muted center small">No intention yet today. The Morning Ritual offers one, or write your own.</p><button class="btn ghost" data-go="home">Open the Morning Ritual</button>`}
  ${ssHead('This Lunar Cycle')}${cyc.length?`<div class="dr-book">${cyc.map(card).join('')}</div>`:`<p class="muted center small">${nm?`Since the New Moon on ${ymdLong(nm,{day:'numeric',month:'long'})}, no other intentions yet.`:'No other intentions this cycle yet.'}</p>`}`;
 else body=`<div class="dr-book">${(v==='past'?past:all).map(card).join('')||'<p class="muted center">Nothing here yet.</p>'}</div>`;
 return cjPage(`${hdr('My Intentions',{sub:'The things you choose to nurture and carry forward.'})}
 <div class="fchips ss-chips">${[['current','Current'],['past','Past'],['all','All']].map(([k,l2])=>`<button class="fchip" role="radio" aria-checked="${v===k}" data-jx="iv" data-v="${k}">${l2}</button>`).join('')}</div>
 ${body}${v==='current'?jxNextNm():''}<button class="jx-write sm" data-jx="write" data-c="intention"><span class="jx-pen">${FEATHER}</span><span><strong>A personal intention</strong></span></button>
 <p class="muted small center">Intentions are not tasks. Nothing here is overdue, scored or failed.</p>`,'jx');
}
function jxGratitude(){
 const all=jxAll().filter(x=>x.cat==='gratitude'),by={};all.forEach(x=>(by[x.day]=by[x.day]||[]).push(x));
 return cjPage(`${hdr('My Gratitude',{sub:'The moments, people and experiences you appreciate.'})}
 ${V.jxG?mbox(`<h3>Add Gratitude</h3><p class="muted small">One thing or several, one on each line. A single sentence is enough.</p><div class="field dr-parch"><label for="jxgt" class="sr-only">What are you grateful for?</label><textarea id="jxgt" rows="4" placeholder="Today I am grateful for…"></textarea></div><div class="ss-acts"><button class="btn" data-jx="gsave">Save for ${ymdLong(dkey(),{day:'numeric',month:'long'})}</button><button class="btn ghost" data-jx="gadd">Cancel</button></div>`):`<button class="btn" data-jx="gadd">Add Gratitude</button>`}
 <div class="dr-book jx-grat">${Object.keys(by).sort((a,b)=>a<b?1:-1).map(d=>`<p class="dr-month">${ymdLong(d,{day:'numeric',month:'long',year:'numeric'})}</p>${by[d].map(x=>V.jxGe===x.k?`<div class="jx-ge"><div class="field dr-parch"><textarea id="jxge" rows="2">${esc(x.body)}</textarea></div><div class="ss-acts"><button class="btn sm" data-jx="gupd" data-k="${esc(x.k)}">Save</button><button class="btn ghost sm" data-jx="gdel" data-k="${esc(x.k)}">Delete</button><button class="btn ghost sm" data-jx="gedit" data-k="">Cancel</button></div></div>`:`<button class="jx-g" data-jx="gedit" data-k="${esc(x.k)}" aria-label="Edit">${esc(x.body)}</button>`).join('')}`).join('')||'<p class="muted center">Your gratitude will gather here, from the Evening Ritual, the Calendar rituals and your own words.</p>'}</div>`,'jx');
}
function jxLibrary(){
 const F=V.jxL||(V.jxL={q:'',c:''}),all=jxLib(),q=F.q.trim().toLowerCase(),l=all.filter(x=>(!F.c||x.cat===F.c)&&(!q||(x.title+' '+(JX_LC.find(c=>c[0]===x.cat)||['',''])[1]).toLowerCase().includes(q)));
 return cjPage(`${hdr('My Library',{sub:'The things you chose to keep.'})}
 <div class="field"><label for="jxlq" class="sr-only">Search your library</label><input type="search" id="jxlq" data-f="jxL" placeholder="Search your library…" value="${esc(F.q)}" autocomplete="off"></div>
 <div class="fchips ss-chips rd-cats"><button class="fchip" role="radio" aria-checked="${!F.c}" data-jx="lc" data-v="">All</button>${JX_LC.filter(([k])=>all.some(x=>x.cat===k)||F.c===k).map(([k,l2])=>`<button class="fchip" role="radio" aria-checked="${F.c===k}" data-jx="lc" data-v="${k}">${l2}</button>`).join('')}</div>
 <div class="dr-book" id="jxlist">${l.map(x=>`<div class="rd-row"><button class="dr-entry" ${x.open}><span class="dr-d">${(JX_LC.find(c=>c[0]===x.cat)||['',''])[1]} · ${ymdLong(x.day,{day:'numeric',month:'long'})}</span><strong>${esc(x.title)}</strong></button><button class="rd-fav" data-jx="unheart" data-k="${esc(x.k)}" aria-label="Remove from My Library">♥</button></div>`).join('')||`<p class="muted center">${all.length?'Nothing matches.':'Whenever something resonates, give it a heart: a Whisper, a horoscope, a reading, an event or an insight from the Sky. It will be kept here, as it was.'}</p>`}</div>
 <p class="muted small center">Removing a heart takes an item out of My Library only; your readings stay in Your Readings.</p>`,'jx');
}
/* Write: one page for every kind of entry; dated and stamped with the Moon, its draft kept until it is saved */
function jxStart(o={}){
 const d=S.jdraft;
 if(!o.edit&&d&&(d.body||d.title)&&!o.force&&!o.link&&!o.prompt){if(o.cat&&!d.edit)d.cat=o.cat;return go('tarot','write')}
 S.jdraft=Object.assign({cat:o.cat||'reflection',title:'',body:'',link:null,prompt:'',src:'free'},o);save();go('tarot','write');
}
function jxWriteView(){
 const d=S.jdraft||(S.jdraft={cat:'reflection',title:'',body:'',link:null,prompt:'',src:'free'}),m=K.moon(new Date()),wc=(d.body.trim().match(/\S+/g)||[]).length;
 const where={reflection:'My Reflections',intention:'My Intentions',gratitude:'My Gratitude'}[d.cat];
 return cjPage(`${hdr(d.edit?'Edit Your Entry':'A Moment for Yourself',{sub:`${ymdLong(d.day||dkey(),{weekday:'long',day:'numeric',month:'long'})} · ${JX_PH[jxBucket(m.name)]}`})}
 ${d.fixed?'':`<div class="fchips ss-chips">${[['reflection','Reflection'],['intention','Intention'],['gratitude','Gratitude']].map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${d.cat===k}" data-jx="cat" data-v="${k}">${l}</button>`).join('')}</div>`}
 ${d.link?`<p class="jx-insp">Inspired by: <b>${esc(d.link.t)}</b> <button class="link" data-jx="unlink">Remove</button></p>`:''}
 ${d.prompt?`<p class="tt-lead">“${esc(d.prompt)}”</p>`:''}
 <div class="field dr-parch"><label for="jxt" class="sr-only">Title (optional)</label><input type="text" id="jxt" class="jx-title" maxlength="80" placeholder="A title, if you like" value="${esc(d.title)}"></div>
 <div class="field dr-parch"><label for="jxb" class="sr-only">Your entry</label><textarea id="jxb" rows="9" placeholder="${d.cat==='intention'?'I intend to…':d.cat==='gratitude'?'Today I am grateful for…':'Write freely. Nothing here is shared.'}">${esc(d.body)}</textarea></div>
 <p class="jx-wc"><span>Private entry</span><span id="jxwc">${wc} word${wc===1?'':'s'}</span></p>
 <button class="btn" data-jx="save">Save</button>
 <p class="muted small center">This entry will be kept in ${where}${d.edit?'':' and in this month of Your Journey'}.</p>
 ${!d.edit&&(d.body||d.title)?'<button class="dr-link" data-jx="discard">Discard this draft</button>':''}`,'jx write');
}
function jxSave(){
 const d=S.jdraft;if(!d)return;d.title=(($('#jxt')||{}).value||d.title||'').trim();d.body=(($('#jxb')||{}).value||d.body||'').trim();
 if(!d.body&&!d.title){toast('Write a few words first');return}
 let k=d.edit;
 if(d.edit&&d.edit.startsWith('carry:')){S.carry[d.edit.slice(6)]=d.body.slice(0,200)}
 else if(d.edit&&d.edit.startsWith('fortune:')){const day=d.edit.slice(8);S.notes[day]=d.body;syncFortune(day)}
 else if(d.edit&&d.edit.startsWith('j:')){const j=S.journal.find(x=>'j:'+x.id===d.edit);if(j){j.title=d.title;j.body=d.body;j.kind=d.cat;j.data=Object.assign({},j.data,{link:d.link||undefined});if(!d.link&&j.data)delete j.data.link;C.saveJournal&&C.saveJournal(j)}}
 else{const j={id:d.id||uuid(),day:dkey(),kind:d.cat,title:d.title,body:d.body,at:new Date().toISOString(),data:Object.assign({src:d.src||'free',phase:K.moon(new Date()).name},d.link?{link:d.link}:{},d.ev?{ev:d.ev,path:d.path}:{})};S.journal.push(j);C.saveJournal&&C.saveJournal(j);k='j:'+j.id}
 S.jdraft=null;save();toast({reflection:'Kept in My Reflections',intention:'Kept in My Intentions',gratitude:'Kept in My Gratitude'}[d.cat]||'Kept');
 V.jxk=k;go('tarot','page',{replace:true});
}
function jxEntryView(){
 const k=V.jxk||'';
 if(k.startsWith('sky:')){const m=rdM(k),s=m.snap;if(!s)return cjPage(`${hdr('My Library')}<p class="muted center">This insight is no longer kept.</p>`,'jx');
  return cjPage(`${hdr(esc(s.title),{sub:`Kept from the Sky · ${ymdLong(s.day||dkey(),{day:'numeric',month:'long',year:'numeric'})}`})}<p class="cal-when center">${esc(s.when||'')}</p>
  ${[['What Was Happening',s.fact],['What It Meant for You',s.you],['One Thing to Do',s.act]].filter(x=>x[1]).map(([h,t])=>`${ssHead(h)}<div class="dr-text"><p>${esc(t)}</p></div>`).join('')}${s.q?mbox(`<h3>A Question to Sit With</h3><p class="quote center">“${esc(s.q)}”</p>`,'dr-q'):''}
  <div class="ss-acts">${m.fav?`<button class="btn ghost" data-jx="unheart" data-k="${esc(k)}">♥ Remove from My Library</button>`:''}<button class="btn ghost" data-jx="write" data-link="${esc(k)}" data-t="${esc('Sky — '+s.title)}">Reflect in My Journal</button><button class="btn ghost" data-act="kasask" data-q="${esc(`Something from the sky I kept on ${ymdLong(s.day||dkey(),{day:'numeric',month:'long'})}: “${s.title}”. ${s.fact||''} What might it be inviting me to see?`)}">Ask Kassandra</button></div>`,'jx')}
 const x=jxAll().find(y=>y.k===k);
 if(!x)return cjPage(`${hdr('Journal Entry')}<p class="muted center">This page is no longer in your Journal.</p><button class="btn" data-go="tarot" data-t="journal">Return to Journal</button>`,'jx');
 const linked=jxAll().filter(y=>y.j&&y.j.data&&y.j.data.link&&y.j.data.link.k===k),area={reflection:'My Reflections',intention:'My Intentions',gratitude:'My Gratitude'}[x.cat];
 return cjPage(`${hdr(esc(x.title||{reflection:'Reflection',intention:'Intention',gratitude:'Gratitude'}[x.cat]),{sub:area})}
 <p class="jx-meta">${ymdLong(x.day,{day:'numeric',month:'long',year:'numeric'})}${x.phase?' · '+esc(x.phase):''}</p>
 <div class="dr-text jx-body"><p class="pre">${esc(x.body)}</p></div>
 ${x.link?`${ssHead('Inspired By')}<div class="dr-book"><button class="dr-entry" data-jx="golink" data-k="${esc(x.link.k)}"${x.link.k?'':' disabled'}><strong>${esc(x.link.t)}</strong><span class="dr-s">${esc(x.src==='calendar'?'Calendar · '+(x.path||'Ritual'):JX_SRC[x.src]||'')}</span></button></div>`:x.src!=='free'?`<p class="dr-f center">${esc(JX_SRC[x.src]||'')}</p>`:''}
 ${linked.length?`${ssHead('Linked Reflections')}<div class="dr-book">${linked.map(jxRow).join('')}</div>`:''}
 ${x.cat==='intention'?`<button class="btn ghost" data-jx="write" data-c="reflection" data-link="${esc(k)}" data-t="${esc('Intention — '+clip(x.body,50))}">Reflect on This Intention</button>`:''}
 <div class="ss-acts"><button class="btn ghost" data-jx="edit" data-k="${esc(k)}">Edit</button><button class="btn ghost" data-jx="del">Delete</button><button class="btn ghost" data-jx="kas">Talk about this — Kassandra</button></div>
 ${V.jxDel===k?mbox(`<p class="center">Delete this ${x.cat}? This cannot be undone.</p><div class="ss-acts"><button class="btn danger" data-jx="delyes" data-k="${esc(k)}">Delete</button><button class="btn ghost" data-jx="del">Keep it</button></div>`):''}
 ${V.jxKas===k?mbox(`<p class="center">Kassandra will read this entry so she can talk with you about it. Your Journal stays private otherwise; she never reads it on her own.</p><div class="ss-acts"><button class="btn" data-act="kasask" data-q="${esc(`I would like to talk about something I wrote in my Journal on ${ymdLong(x.day,{day:'numeric',month:'long'})}${x.title?` (“${x.title}”)`:''}: “${clip(x.body,1200)}” Help me explore it.`)}">Share it with Kassandra</button><button class="btn ghost" data-jx="kas">Not now</button></div>`):''}`,'jx');
}
function jxMonthView(){
 const m=V.jxm||dkey().slice(0,7),M=jxMonth(m),[y,mo]=m.split('-').map(Number),ms=jxMilestones().filter(x=>x[0].slice(0,7)===m);
 const written=M.e.filter(x=>x.body),ok=S.settings.jInsights===true,enough=written.length>=7;
 let moons='';try{moons=K.events(new Date(Date.UTC(y,mo-1,1)-DAY),new Date(Date.UTC(y,mo,1)+DAY)).filter(e=>(e.k==='new_moon'||e.k==='full_moon')&&evDay(e).slice(0,7)===m).map(e=>`<button class="fchip" ${calA(e)}>${esc(calName(e))} · ${shortDay(e)} ›</button>`).join('')}catch(e){}
 const rh={new:0,waxing:0,full:0,waning:0};written.forEach(x=>rh[jxBucket(x.phase)]++);const top=Object.entries(rh).sort((a,b)=>b[1]-a[1])[0];
 const th=jxThemes(written).slice(0,8),T=V.jxTheme&&th.find(t=>t[0]===V.jxTheme);
 const tl=[...M.e.map(x=>({day:x.day,at:x.at,h:jxRow(x)})),...M.lib.map(x=>({day:x.day,at:x.at||x.day,h:`<button class="dr-entry" ${x.open}><span class="dr-d">Kept · ${ymdLong(x.day,{day:'numeric',month:'long'})}</span><strong>${esc(x.title)}</strong><span class="dr-f">My Library · ${(JX_LC.find(c=>c[0]===x.cat)||['',''])[1]}</span></button>`})),...ms.map(x=>({day:x[0],at:x[0]+'T23',h:`<p class="jx-ms">✦ <b>${x[1]}</b> · ${x[2]}</p>`}))].sort((a,b)=>String(a.at)>String(b.at)?1:-1);
 return cjPage(`${hdr(ymdLong(m+'-01',{month:'long',year:'numeric'}),{sub:'A chapter of your journey'})}
 ${moons?`<div class="fchips ss-chips jx-moons">${moons}</div>`:''}
 <div class="dr-stats jx-stats"><div><b>${M.r.length}</b><span>Reflections</span></div><div><b>${M.i.length}</b><span>Intentions</span></div><div><b>${M.g.length}</b><span>Gratitude</span></div><div><b>${M.lib.length}</b><span>Saved items</span></div></div>
 ${ms.length?`${ssHead('Personal Milestones')}${ms.map(x=>mbox(`<h3>${x[1]}</h3><p class="center">${x[2]}</p><p class="muted small center">${ymdLong(x[0],{day:'numeric',month:'long'})}</p>`,'dr-q')).join('')}`:''}
 ${ssHead('Personal Insights')}${!ok?`<div class="dr-text"><p>Kosmia can notice the words, themes and lunar rhythms in what you write this month. It is worked out on this device from your own words, and only when you allow it.</p></div><button class="btn ghost" data-jx="insok">Show insights from my words</button>`
  :!enough?`<p class="muted center small">Insights appear once there are seven written entries in a month (${written.length} so far).</p>`
  :`<p class="jx-sub">Your Writing Rhythm</p><div class="jx-rh">${Object.entries(rh).map(([k,n])=>`<div><b>${n}</b><span>${JX_PH[k]}</span></div>`).join('')}</div>${top[1]?`<p class="center small">You wrote most often during the ${JX_PH[top[0]].replace(' Moon','').toLowerCase()} Moon this month.</p>`:''}
  ${th.length?`<p class="jx-sub">Themes in Your Words</p><div class="fchips ss-chips">${th.map(([l,,n])=>`<button class="fchip" role="switch" aria-checked="${V.jxTheme===l}" data-jx="theme" data-v="${esc(l)}">${esc(l)} · ${n}</button>`).join('')}</div>${T?`<p class="center small">You mentioned ${esc(T[0].toLowerCase())} in ${T[2]} ${T[2]===1?'entry':'entries'} this month.</p><div class="dr-book">${written.filter(x=>(x.title+' '+x.body).toLowerCase().match(THEMES.find(t=>t[0]===T[0])[2])).map(jxRow).join('')}</div>`:''}`:''}
  <p class="muted small center">Observations only, from your own words. The Moon does not cause how you feel. <button class="link" data-jx="insno">Turn insights off</button></p>`}
 ${M.i.length?`${ssHead('Your Intentions')}<div class="dr-book">${M.i.map(jxRow).join('')}</div>`:''}
 ${ssHead('Your Timeline')}<div class="dr-book">${tl.map(x=>x.h).join('')||'<p class="muted center">Nothing kept this month.</p>'}</div>`,'jx');
}

/* ---------- routes, actions and typing ---------- */
{const CJV={calendar:calendarHome,event:calEventView,'event-ritual':calRitualView,'saved-events':savedEventsView};const vd=views.discover;views.discover=()=>CJV[tab()]?CJV[tab()]():vd()}
{const JXV={journal:jxHome,reflections:jxReflections,intentions:jxIntentions,gratitude:jxGratitude,library:jxLibrary,write:jxWriteView,page:jxEntryView,month:jxMonthView};const vt=views.tarot;views.tarot=()=>JXV[tab()]?JXV[tab()]():vt()}
// a blank page begun from elsewhere (a reading, a connection, the sky) is written on Write; a written page opens to be read
{const oe=openEntry;openEntry=k=>{
 if(/^j:/.test(k)){const j=S.journal.find(x=>'j:'+x.id===k);
  if(j&&!j.body){S.journal=S.journal.filter(x=>x!==j);save();const lk=Object.entries(rdMeta().data||{}).find(([,v])=>(v.refl||[]).includes(j.id));let link=(j.data||{}).link||null;
   if(lk){const x=rdAll().find(y=>y.k===lk[0]);link={k:'saved:'+lk[0],t:x?`${RD_CATL[x.cat]||'Oracle'} — ${x.title}`:'A saved reading'}}
   return jxStart({id:j.id,cat:j.kind==='intention'?'intention':'reflection',title:'',prompt:j.title,link,src:(j.data||{}).src||(link?'oracle':'free'),force:true})}
  if(j){V.jxk=k;return go('tarot','page')}}
 return oe(k)}}
jNew=()=>jxStart({});
function jxGoLink(k){
 if(k.startsWith('saved:')){V.rk=k.slice(6);return go('discover','saved')}
 if(k.startsWith('event:')){V.calRef=k.slice(6);return go('discover','event')}
 if(k.startsWith('j:')){V.jxk=k;return go('tarot','page')}
 if(k.startsWith('sky:')){V.jxk=k;return go('tarot','page')}
 if(k.startsWith('place:')){V.mcP=k.slice(6);return go('you','placement')}
 return openEntry(k);
}
document.addEventListener('click',e=>{
 const h=e.target.closest('[data-heart]');
 if(h){const k=h.dataset.heart,on=!hearted(k);let snap=null;
  if(on&&k.startsWith('event:')){const ev=calFind(k.slice(6));if(ev)snap={title:calName(ev),date:ev.date.toISOString()}}
  if(on&&k.startsWith('place:'))snap={title:h.dataset.snapT||k.slice(6)};
  if(on&&k.startsWith('sky:')){const it=skyItems().find(i=>'sky:'+i.id+':'+dkey()===k);if(it)snap={title:plain(it.title),when:plain(it.when||''),fact:plain(it.fact||''),you:plain(it.you||''),act:plain(it.act||''),q:plain(it.q||''),day:dkey()}}
  heartSet(k,on,snap);return render()}
 const a0=e.target.closest('[data-act=calremgo]');if(a0&&V.remRef){V.calRef=V.remRef;$('#toast').hidden=true;return go('discover','event')}
 const c=e.target.closest('[data-cal]');
 if(c){const a=c.dataset.cal,v=c.dataset.v;
  if(a==='view'){V.cal.view=v;if(v==='month')V.cal.day='';render();return syncUrl()}
  if(a==='f'){V.cal.f=v;return render()}
  if(a==='more'){V.cal.span=(V.cal.span||30)+30;return render()}
  if(a==='month'){V.cal.month=v;V.cal.day='';render();return syncUrl()}
  if(a==='day'){V.cal.day=v;return render()}
  if(a==='open'){V.calRef=c.dataset.ref;V.calRem=null;V.calPath=null;return go('discover','event')}
  if(a==='openrem'){V.calRef=c.dataset.ref;V.calRem=c.dataset.ref;return go('discover','event')}
  if(a==='openev'){V.calDone=null;return goBack()}
  if(a==='sv'){V.calSv=v;return render()}
  if(a==='unsave'){const b=calBm(c.dataset.ref);if(b){S.bookmarks=S.bookmarks.filter(x=>x!==b);C.deleteBookmark&&C.deleteBookmark('event',b.ref);save();toast('Removed from Saved Events')}return render()}
  const ev=calFind(V.calRef);if(!ev)return;const ref=evRef(ev);
  if(a==='save'){const b=calBm(ref);calBmSet(ev,{saved:!calSaved(b)});toast(calSaved(calBm(ref))?'Saved to Saved Events':'Removed from Saved Events');return render()}
  if(a==='rem'){V.calRem=V.calRem===ref?null:ref;render();return calRemPreview()}
  if(a==='remsave'){const r={before:$('#calrb').checked,day:$('#calrd').checked,time:$('#calrt').value||'08:00'};if(!r.before&&!r.day){toast('Choose the day before, the day itself, or both');return}calBmSet(ev,{rem:r});V.calRem=null;toast('Reminder set · kept in Saved Events');return render()}
  if(a==='remoff'){calBmSet(ev,{rem:null});V.calRem=null;toast('Reminder removed');return render()}
  if(a==='theme'){return jxStart({cat:'reflection',prompt:c.dataset.q||evInfo(ev).ref,link:{k:'event:'+ref,t:calName(ev)},src:'event',force:true})}
  if(a==='path'){V.calPath=v;return render()}
  if(a==='ritstart'){S.evRit=S.evRit||{};S.evRit[ref]={path:v,step:0,text:'',day:dkey()};V.calDone=null;save();return go('discover','event-ritual')}
  if(a==='ritgo'){V.calDone=null;return go('discover','event-ritual')}
  if(a==='next'||a==='prev'){const p=S.evRit[ref];p.step=Math.max(0,p.step+(a==='next'?1:-1));save();render();return window.scrollTo(0,0)}
  if(a==='ritkeep'||a==='ritpriv'){const p=S.evRit[ref],txt=(($('#calin')||{}).value||'').trim(),[pn]=calPathInfo(ev,p.path);let jid='';
   if(a==='ritkeep'){if(!txt){toast('Write your intention, or complete privately');return $('#calin').focus()}
    const j={id:uuid(),day:dkey(),kind:'intention',title:`${calName(ev)} — ${pn}`,body:txt,at:new Date().toISOString(),data:{src:'calendar',path:pn,ritual:calRitName(ev),phase:K.moon(new Date()).name,ev:{ref,name:calName(ev),date:ev.date.toISOString(),k:ev.k}}};S.journal.push(j);C.saveJournal&&C.saveJournal(j);jid=j.id}
   calBmSet(ev,{ritual:{path:p.path,label:pn,day:dkey(),jid}});delete S.evRit[ref];V.calDone=ref;save();if(jid)toast('Your intention is kept in My Intentions');render();return window.scrollTo(0,0)}
  if(a==='share'){const txt=`${calName(ev)} · ${ymdLong(evDay(ev),{weekday:'long',day:'numeric',month:'long'})}. ${calTheme(ev)}`,url=location.origin+'/discover/event?e='+encodeURIComponent(ref);
   if(navigator.share)return navigator.share({title:calName(ev),text:txt,url}).catch(()=>{});
   return (navigator.clipboard?navigator.clipboard.writeText(txt+' '+url):Promise.reject()).then(()=>toast('Copied to share'),()=>toast('Sharing is not available here'))}
  if(a==='sky'){const b=calBody(ev);if(b==='Moon')return go('discover','moon');go('horoscope','overview');V.skp=b==='Sun'?'sun':b&&b!=='Earth'?'pl:'+b:null;V.skpIn=false;V.spo={};return render()}
  return}
 const j=e.target.closest('[data-jx]');
 if(j){const a=j.dataset.jx,v=j.dataset.v;
  if(a==='write'){const lk=j.dataset.link;return jxStart(lk?{cat:j.dataset.c||'reflection',link:{k:lk,t:j.dataset.t||''},src:lk.startsWith('sky:')?'sky':'free',force:true}:{cat:j.dataset.c})}
  if(a==='open'){V.jxk=j.dataset.k;if(!/^(j|carry|fortune|sky):/.test(V.jxk))return openEntry(V.jxk);return go('tarot','page')}
  if(a==='golink')return jxGoLink(j.dataset.k);
  if(a==='month'){V.jxm=v;V.jxTheme=null;return go('tarot','month')}
  if(a==='fsrc'){V.jxR.src=v;return render()}
  if(a==='iv'){V.jxI=v;return render()}
  if(a==='lc'){V.jxL.c=v;return render()}
  if(a==='unheart'){jxUnheart(j.dataset.k);return render()}
  if(a==='gadd'){V.jxG=!V.jxG;render();const t=$('#jxgt');if(t)t.focus();return}
  if(a==='gsave'){const l=(($('#jxgt')||{}).value||'').split('\n').map(x=>x.replace(/^[•\-\s]+/,'').trim()).filter(Boolean);if(!l.length){toast('Write one thing you are grateful for');return}
   l.forEach(t=>{const g={id:uuid(),day:dkey(),kind:'gratitude',title:'',body:t,at:new Date().toISOString(),data:{src:'free',phase:K.moon(new Date()).name}};S.journal.push(g);C.saveJournal&&C.saveJournal(g)});V.jxG=false;save();toast('Kept in My Gratitude');return render()}
  if(a==='gedit'){V.jxGe=j.dataset.k||null;return render()}
  if(a==='gupd'||a==='gdel'){const g=S.journal.find(x=>'j:'+x.id===j.dataset.k);if(g){if(a==='gdel'){S.journal=S.journal.filter(x=>x!==g);C.deleteJournal&&C.deleteJournal(g.id);toast('Removed')}else{g.body=(($('#jxge')||{}).value||'').trim()||g.body;C.saveJournal&&C.saveJournal(g)}}V.jxGe=null;save();return render()}
  if(a==='cat'){S.jdraft.cat=v;S.jdraft.title=($('#jxt')||{}).value||S.jdraft.title;S.jdraft.body=($('#jxb')||{}).value||S.jdraft.body;save();return render()}
  if(a==='unlink'){S.jdraft.link=null;save();return render()}
  if(a==='save')return jxSave();
  if(a==='discard'){S.jdraft=null;save();toast('Draft discarded');return goBack()}
  if(a==='edit'){const k=j.dataset.k,x=jxAll().find(y=>y.k===k);if(!x)return;if(x.link&&x.link.item)return oe2(k);
   S.jdraft={edit:k,cat:x.cat,title:x.title,body:x.body,link:x.j?((x.j.data||{}).link||null):null,day:x.day,fixed:!x.j,src:x.src};save();return go('tarot','write')}
  if(a==='del'){V.jxDel=V.jxDel?null:V.jxk;return render()}
  if(a==='delyes'){const k=j.dataset.k;
   if(k.startsWith('j:')){const id=k.slice(2);S.journal=S.journal.filter(x=>x.id!==id);C.deleteJournal&&C.deleteJournal(id)}
   else if(k.startsWith('carry:'))delete S.carry[k.slice(6)];
   else if(k.startsWith('fortune:')){const d=k.slice(8);S.notes[d]='';syncFortune(d)}
   else{const p=jFind(k);if(p)jSetNote(p,'')}
   V.jxDel=null;save();toast('Deleted');return goBack()}
  if(a==='kas'){V.jxKas=V.jxKas?null:V.jxk;return render()}
  if(a==='theme'){V.jxTheme=V.jxTheme===v?null:v;return render()}
  if(a==='insok'||a==='insno'){S.settings.jInsights=a==='insok';save();syncProfile();return render()}
 }
});
const oe2=k=>{V.jkey=k;V.jmenu=false;go('tarot','entry')};
document.addEventListener('input',e=>{
 const t=e.target;
 if(t.id==='jxt'||t.id==='jxb'){if(!S.jdraft)return;S.jdraft[t.id==='jxt'?'title':'body']=t.value;if(t.id==='jxb'){const n=(t.value.trim().match(/\S+/g)||[]).length,w=$('#jxwc');if(w)w.textContent=`${n} word${n===1?'':'s'}`}clearTimeout(jxSave.t);jxSave.t=setTimeout(save,600);return}
 if(t.id==='jxq'||t.id==='jxlq'){const F=t.id==='jxq'?V.jxR:V.jxL;F.q=t.value;const y=scrollY;render();refocus(t.id);window.scrollTo(0,y);return}
 if(t.id==='calin'){const ev=calFind(V.calRef),p=ev&&(S.evRit||{})[evRef(ev)];if(p){p.text=t.value;clearTimeout(calRemPreview.t);calRemPreview.t=setTimeout(save,600)}return}
});
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.id==='jxmsel'&&t.value){V.jxm=t.value;V.jxTheme=null;return go('tarot','month')}
 if(t.id==='jxrm'){V.jxR.m=t.value;return render()}
 if(t.id==='calrb'||t.id==='calrd'||t.id==='calrt')calRemPreview();
 if(t.id==='n_mn'){S.notif.moons=t.value;save();syncProfile();toast('Saved')}
});

/* ===================== My Cosmos =====================
   How the universe relates to the reader: the Three Lights, the chart and its placements, the Zodiac, a Cosmic Identity,
   personal transits, the people kept, and preferences. Opened from the medallion over any place, and closed back to the
   very spot the reader left (inner scrolls included). Everything is read from the one profile; nothing is asked twice. */
const mcPage=(h,cls='')=>nightSub(`<div class="sub">${h}</div>`,'dj ss cj mc '+cls);
const NP={Ascendant:'outward presence and the way you meet the world',Midheaven:'direction, vocation and public life'};
const pmOf=n=>PM[n]||NP[n]||n;
const PL_REP={Sun:'The Sun is traditionally associated with identity, vitality and conscious self-expression: the light you live by.',Moon:'The Moon is traditionally associated with emotional needs, instinct, memory and the things that make you feel safe.',Mercury:'Mercury is traditionally associated with thought, language, learning and the way you exchange ideas.',Venus:'Venus is traditionally associated with affection, beauty, personal values and the ways we experience pleasure and connection.',Mars:'Mars is traditionally associated with drive, courage, desire and the way you take action.',Jupiter:'Jupiter is traditionally associated with growth, generosity, faith and the search for meaning.',Saturn:'Saturn is traditionally associated with structure, responsibility, time and the lessons that build lasting strength.',Uranus:'Uranus is traditionally associated with change, originality and the wish to be free.',Neptune:'Neptune is traditionally associated with imagination, compassion, dreams and the longing for something greater.',Pluto:'Pluto is traditionally associated with depth, transformation and the power to begin again.'};
const PL_KW={Sun:'Identity',Moon:'Feeling',Mercury:'Thought',Venus:'Affection',Mars:'Drive',Jupiter:'Growth',Saturn:'Structure',Uranus:'Change',Neptune:'Imagination',Pluto:'Transformation'};
const PL_Q={Sun:'When do I feel most fully myself?',Moon:'What helps me feel safe and at home?',Mercury:'How do I most enjoy learning and expressing my thoughts?',Venus:'How do I express love when I feel completely free to be myself?',Mars:'What truly moves me to act?',Jupiter:'Where in my life am I ready to grow?',Saturn:'What am I patiently building that will last?',Uranus:'Where am I longing for more freedom?',Neptune:'What do I dream of when no one is watching?',Pluto:'What in me is ready to be renewed?'};
const SIGN_GROW={aries:'Learning patience, and listening before leaping.',taurus:'Letting change in, and loosening the grip on comfort.',gemini:'Staying with one thing long enough to let it deepen.',cancer:'Caring for yourself as tenderly as you care for others.',leo:'Shining without needing an audience to feel worthy.',virgo:'Being gentle with imperfection, your own above all.',libra:'Choosing for yourself, even when it may disappoint someone.',scorpio:'Trusting enough to let others see you.',sagittarius:'Following through, and finding wonder close to home.',capricorn:'Resting without guilt, and letting joy be part of the plan.',aquarius:'Letting feeling in alongside ideas.',pisces:'Holding gentle boundaries so your kindness has a home.'};
const SIGN_LIFE={aries:'starting projects with energy, speaking up first, needing movement and a challenge to rise to',taurus:'making a home comfortable, savouring good food and music, keeping promises and steady routines',gemini:'juggling conversations, books and plans, asking questions, staying in touch with many people',cancer:'remembering birthdays, cooking for others, keeping old photographs, needing a quiet nest to return to',leo:'bringing warmth to a room, creating, celebrating others, enjoying being seen for your efforts',virgo:'noticing details others miss, improving how things work, caring through practical help',libra:'smoothing tensions, making spaces beautiful, weighing choices carefully, enjoying company',scorpio:'reading between the lines, forming few but deep bonds, needing privacy and honesty',sagittarius:'travelling, learning, laughing, and needing space to explore ideas and places',capricorn:'planning ahead, taking responsibility, working steadily towards long goals',aquarius:'thinking differently, caring about causes and communities, needing room to be yourself',pisces:'daydreaming, sensing moods, creating, offering kindness and needing time alone to recharge'};
const EL_TXT={Fire:['Action and inspiration','enthusiasm, courage and spontaneity'],Earth:['Grounding and practicality','patience, steadiness and care for the real'],Air:['Thought and communication','curiosity, ideas and connection'],Water:['Emotion and intuition','sensitivity, empathy and depth']};
const HOUSE_T=['Self & Presence','Values & Self-Worth','Learning & Communication','Home & Roots','Creativity & Joy','Work & Wellbeing','Relationships & Commitment','Intimacy & Transformation','Meaning & Exploration','Vocation & Direction','Community & Aspirations','Rest & Inner Life'];
const TR_P={Pluto:'deep transformation, release and renewal',Neptune:'imagination, compassion and the softening of certainty',Uranus:'change, freedom and awakening',Saturn:'responsibility, maturity and lasting foundations',Jupiter:'growth, opportunity and widening horizons',Mars:'energy, courage and action',Venus:'affection, values and pleasure',Mercury:'thought, conversation and plans',Sun:'attention, vitality and visibility'};
const TR_INV={Pluto:'depth, honesty and renewal',Neptune:'imagination, compassion and gentle letting go',Uranus:'fresh air, freedom and experiment',Saturn:'patience, structure and honest commitment',Jupiter:'openness, generosity and room to grow',Mars:'energy, initiative and courage',Venus:'warmth, pleasure and appreciation',Mercury:'curiosity, conversation and planning',Sun:'attention, vitality and visibility'};
const TR_TH={Pluto:['Renewal','Release','Inner power'],Neptune:['Imagination','Compassion','Trust'],Uranus:['Freedom','Change','Originality'],Saturn:['Responsibility','Boundaries','Commitment'],Jupiter:['Growth','Learning','Generosity'],Mars:['Courage','Initiative','Energy'],Venus:['Affection','Values','Pleasure'],Mercury:['Conversation','Ideas','Plans'],Sun:['Vitality','Visibility','Purpose']};
const TIER={Pluto:'long',Neptune:'long',Uranus:'long',Saturn:'long',Jupiter:'medium',Mars:'medium',Venus:'short',Mercury:'short',Sun:'short'};
const ASP_PH={conjunction:'meeting',opposition:'opposite',square:'at a square to',trine:'in harmony with'};
const mcMonth=t=>ymdLong(dkey(new Date(t)),{month:'long',year:'numeric'});
const mcSign=(c,n)=>{const p=c.pl.find(q=>q.n===n);return p&&!(n==='Moon'&&c.moonRange)?sIdx(p.sign):null};
const mcAsc=c=>c&&c.ang&&!S.birth.unk&&S.birth.cert!=='unknown'?sIdx(Math.floor(c.ang.asc/30)):null;
const mcApprox=()=>S.birth.cert==='approx'?'<p class="muted small center">Your birth time is approximate, so the Rising sign and houses may differ slightly.</p>':'';
/* ---------- personal transits: house chapters (with a birth time and place) and aspects to natal planets, grouped so a
   transit that turns back and returns is one transit in phases ---------- */
let mcTr={k:'',v:null};
function mcTransits(){
 const c=myChart();if(!c||!K)return null;const key=dkey()+JSON.stringify(S.birth);if(mcTr.k===key)return mcTr.v;
 const now=Date.now(),from=now-730*DAY,to=now+548*DAY,step=3*DAY,sm=[];
 for(let t=from;t<=to;t+=step){const o={};K.positions(new Date(t)).forEach(p=>o[p.n]=p);sm.push([t,o])}
 const out=[],asc=c.known&&c.ang?Math.floor(c.ang.asc/30):null;
 if(asc!=null)Object.keys(TR_P).forEach(P=>{let seg=[];sm.forEach(([t,o],i)=>{const s=o[P].sign;if(!seg.length||seg[seg.length-1].s!==s)seg.push({s,a:t,b:t});else seg[seg.length-1].b=t});
  const by={};seg.forEach(g=>{const l=by[g.s]=by[g.s]||[];const last=l[l.length-1];if(last&&g.a-last.b<300*DAY)last.ph.push(g),last.b=g.b;else l.push({a:g.a,b:g.b,ph:[g]})});
  Object.entries(by).forEach(([s,l])=>l.forEach(x=>{const h=(+s-asc+12)%12+1;out.push({key:`h:${P}:${h}:${s}`,kind:'house',P,h,sign:+s,a:x.a,b:x.b,openA:x.a<=from,openB:x.b>=to-step,phases:x.ph.length,tier:TIER[P]})}))});
 const nat=c.pl.filter(p=>!(p.n==='Moon'&&!c.known)).map(p=>({n:p.n,lon:p.lon})).concat(c.known&&c.ang?[{n:'Ascendant',lon:c.ang.asc},{n:'Midheaven',lon:c.ang.mc}]:[]);
 ['Pluto','Neptune','Uranus','Saturn','Jupiter'].forEach(P=>{const orb=P==='Saturn'||P==='Jupiter'?2:1.5;
  nat.forEach(N=>[['conjunction',0],['opposition',180],['square',90],['trine',120]].forEach(([asp,ang])=>{
   if(asp==='trine'&&P!=='Jupiter'&&P!=='Saturn')return;if(!/^(Sun|Moon|Mercury|Venus|Mars|Ascendant|Midheaven)$/.test(N.n)&&!(asp==='conjunction'&&N.n===P))return;let run=null;const iv=[];
   sm.forEach(([t,o])=>{const d=Math.abs(((o[P].lon-N.lon)%360+540)%360-180),off=Math.abs(d-ang);if(off<=orb){if(!run)run={a:t,b:t,min:off,ex:t};run.b=t;if(off<run.min){run.min=off;run.ex=t}}else if(run){iv.push(run);run=null}});if(run)iv.push(run);
   const g=[];iv.forEach(x=>{const l=g[g.length-1];if(l&&x.a-l.b<270*DAY){l.b=x.b;l.ex.push(x.ex)}else g.push({a:x.a,b:x.b,ex:[x.ex]})});
   g.forEach(x=>{const ret=asp==='conjunction'&&N.n===P;out.push({key:`a:${P}:${asp}:${N.n}:${dkey(new Date(x.ex[0])).slice(0,7)}`,kind:'aspect',P,asp,N:N.n,a:x.a,b:x.b,ex:x.ex,openA:x.a<=from,openB:x.b>=to-step,tier:ret?'milestone':TIER[P],ret})})}))});
 const rank={milestone:0,long:1,medium:2,short:3};out.sort((a,b)=>rank[a.tier]-rank[b.tier]||a.a-b.a);
 mcTr={k:key,v:out};return out;
}
const mcTrTitle=x=>x.kind==='house'?`${x.P} through your ${CJ_ORD(x.h)} House`:x.ret?`Your ${x.P} Return`:`${x.P} ${ASP_PH[x.asp]} your ${x.N}`;
const mcTrSub=x=>x.kind==='house'?HOUSE_T[x.h-1]:x.ret?(x.P==='Saturn'?'Maturity & Foundations':'Growth & Renewal'):`${(TR_TH[x.P]||[])[0]} & ${PL_KW[x.N]||(x.N==='Ascendant'?'Presence':'Direction')}`;
const mcTrWhen=x=>{const now=Date.now();if(x.tier==='short'&&x.b>=now)return 'Short-term transit';if(x.a>now)return `Begins ${mcMonth(x.a)}`;if(x.b<now)return `${mcMonth(x.a)} – ${mcMonth(x.b)}`;return x.openB?`Active beyond ${mcMonth(x.b)}`:`Active until ${mcMonth(x.b)}`};
const mcTrLine=x=>x.kind==='house'?`Reflect on ${HOUSE[x.h-1]}, with ${TR_INV[x.P]}.`:x.ret?(x.P==='Saturn'?'A threshold of maturity: review what you have built and choose what to carry forward.':'A renewal of growth, learning and hope.'):`Your ${pmOf(x.N)} meets ${TR_P[x.P]}.`;
const mcTrRow=x=>`<button class="dr-entry mc-tr ${x.tier}" data-mc="tr" data-k="${esc(x.key)}"><span class="dr-d">${({milestone:'A milestone',long:'A long chapter',medium:'A medium cycle',short:'A short influence'})[x.tier]} · ${mcTrWhen(x)}</span><strong>${esc(mcTrTitle(x))}</strong><span class="dr-s">${esc(mcTrSub(x))}</span><span class="dr-x">${esc(mcTrLine(x))}</span></button>`;
function mcCycles(){
 const v=V.mcCv||'now',l=mcTransits(),c=myChart();
 if(!l)return mcPage(`${hdr('My Cosmic Cycles',{sub:'The celestial chapters unfolding in your life.'})}${mcNeed('Add your birth date to see how the moving planets meet your own chart.')}`);
 const now=Date.now(),act=l.filter(x=>x.a<=now&&x.b>=now),ah=l.filter(x=>x.a>now&&x.tier!=='short').sort((a,b)=>a.a-b.a),past=l.filter(x=>x.b<now&&x.tier!=='short').sort((a,b)=>b.b-a.b);
 const L=(v==='now'?act.filter(x=>x.tier!=='short'):v==='ahead'?ah.slice(0,12):past.slice(0,12)),sh=v==='now'?act.filter(x=>x.tier==='short'):[],span=[now,now+548*DAY],tl=[...act,...ah].filter(x=>x.tier!=='short').slice(0,7);
 const bar=x=>{const a=Math.max(x.a,span[0]),b=Math.min(x.b,span[1]),w=span[1]-span[0];return `<div class="mc-tl-r"><span>${esc(x.kind==='house'?`${x.P} · ${CJ_ORD(x.h)} house`:x.ret?`${x.P} return`:`${x.P} ${x.asp} ${x.N}`)}</span><i><b class="${x.tier}" style="left:${((a-span[0])/w*100).toFixed(1)}%;width:${Math.max(2,(b-a)/w*100).toFixed(1)}%"></b></i></div>`};
 return mcPage(`${hdr('My Cosmic Cycles',{sub:'The celestial chapters unfolding in your life.'})}
 <div class="fchips ss-chips mc-top">${[['now','Now'],['ahead','Ahead'],['past','Past']].map(([k,t])=>`<button class="fchip" role="radio" aria-checked="${v===k}" data-mc="cv" data-v="${k}">${t}</button>`).join('')}</div>
 ${c.known?'':`<p class="muted small center">Without your birth time and place, houses cannot be placed, so these cycles show only the planets meeting your natal planets. <button class="link" data-go="settings" data-t="birth">Add birth details</button></p>`}${mcApprox()}
 <div class="dr-book">${L.map(mcTrRow).join('')||`<p class="muted center">${v==='now'&&sh.length?'No long chapters are active right now.':v==='now'?'No major transits are active right now: a quiet sky for you.':v==='ahead'?'No major transits begin in the next eighteen months.':'No major transits in the last two years.'}</p>`}</div>
 ${sh.length?`${ssHead('Short-Term Influences')}<div class="dr-book">${sh.map(mcTrRow).join('')}</div>`:''}
 ${v!=='past'&&tl.length?`${ssHead('The Chapters Ahead')}<div class="mc-tl"><div class="mc-tl-h"><span>Today</span><span>${mcMonth(span[0]+274*DAY)}</span><span>${mcMonth(span[1])}</span></div>${tl.map(bar).join('')}</div><p class="muted small center">Longer chapters are drawn first. Several can overlap; each is a theme to reflect on, not an event that must happen.</p>`:''}
 ${flowRow([['Cosmic Calendar','data-go="discover" data-t="calendar"'],['Today’s Sky','data-nav="horoscope"']])}`,'cyc');
}
function mcTransitView(){
 const l=mcTransits()||[],x=l.find(y=>y.key===V.mcT);
 if(!x)return mcPage(`${hdr('Personal Transit')}<p class="muted center">This cycle is no longer in view.</p><button class="btn" data-go="you" data-t="cycles">My Cosmic Cycles</button>`);
 const area=x.kind==='house'?HOUSE[x.h-1]:'',d=t=>ymdLong(dkey(new Date(t)),{day:'numeric',month:'long',year:'numeric'});
 const happen=x.kind==='house'?`${x.P} is moving through the ${CJ_ORD(x.h)} house of your chart, in ${sIdx(x.sign).name}: the area traditionally associated with ${area}.`:x.ret?`${x.P} returns to the place it held when you were born, about every ${x.P==='Saturn'?'29':'12'} years.`:`Transiting ${x.P} is ${ASP_PH[x.asp]} your natal ${x.N}.`;
 const sym=x.kind==='house'?`In astrology, ${x.P} is associated with ${TR_P[x.P]}. Passing through this area, it invites reflection on ${HOUSE_T[x.h-1].toLowerCase().replace('&','and')}.`:x.ret?(x.P==='Saturn'?'Traditionally a threshold of maturity: a time to review the foundations of your life and choose what to carry into the next chapter.':'Traditionally a renewal of growth, learning and hope, as one twelve-year cycle closes and another begins.'):`This transit brings ${TR_P[x.P]} into contact with your ${pmOf(x.N)}. The two ${ASPT[x.asp]}.`;
 const you=x.kind==='house'?`You may wish to consider how ${area} could welcome ${TR_INV[x.P]}.`:`You may wish to reflect on how your ${pmOf(x.N)} could meet ${TR_INV[x.P]}.`;
 const q=x.kind==='house'?CAL_HQ[x.h-1]:x.ret&&x.P==='Saturn'?'Which commitments feel genuinely aligned with the person I am becoming?':PL_Q[x.N]||'What is this chapter inviting me to notice?';
 const evs=K?K.events(new Date(Math.max(x.a,Date.now()-30*DAY)),new Date(x.b+DAY)).filter(e=>e.planet===x.P&&(e.k==='ingress'||e.type==='retrograde')):[],rel=evs[0];
 const ex=(x.ex||[]).map(t=>d(t));
 return mcPage(`${hdr(esc(mcTrTitle(x)),{sub:esc(mcTrWhen(x))})}
 <section class="cal-ov">${ssGlyph(GLYPH_OF(x.P),'big')}<p class="cal-th big">${esc(mcTrSub(x))}</p><p class="cal-mode">${({milestone:'A milestone',long:'A long chapter',medium:'A medium cycle',short:'A short influence'})[x.tier]}</p></section>
 ${ssHead('What’s Happening')}<div class="dr-text"><p>${esc(happen)}</p></div>
 ${ssHead('What This Chapter Symbolises')}<div class="dr-text"><p>${esc(sym)}</p></div>
 ${ssHead('What It May Mean for You')}<div class="dr-text"><p>${esc(you)}</p></div>
 ${ssHead('Themes to Explore')}<div class="dr-text"><p>${esc([...(TR_TH[x.P]||[]),...(x.kind==='house'?HOUSE_T[x.h-1].split(' & '):[PL_KW[x.N]||'Presence'])].join(' · '))}</p></div>
 ${mbox(`<h3>A Question for Reflection</h3><p class="quote center">“${esc(q)}”</p>`,'dr-q')}
 ${ssHead('The Timeline')}<div class="dr-text"><p>${x.openA?'Began before '+d(x.a):'Begins '+d(x.a)}${ex.length?`<br>Exact ${ex.length>1?'in '+ex.length+' phases: '+ex.join(', '):'on '+ex[0]}`:''}${x.phases>1?`<br>It turns back and returns ${x.phases-1===1?'once':x.phases-1+' times'} with ${x.P}’s retrograde motion: phases of the same transit.`:''}<br>${x.openB?'Continues beyond '+d(x.b):'Ends around '+d(x.b)}</p></div>
 ${ssHead('Continue Exploring')}<div class="ss-acts">${rel?`<button class="btn ghost" data-cal="open" data-ref="${esc(evRef(rel))}">${esc(rel.name)}</button>`:''}<button class="btn ghost" data-mc="trwrite">Reflect in Journal</button><button class="btn ghost" data-act="kasask" data-q="${esc(`I am in a personal transit: ${mcTrTitle(x)} (${mcTrWhen(x)}). What might this chapter invite me to reflect on?`)}">Explore with Kassandra</button></div>
 <p class="muted small center">Transits describe symbolic themes, never events that must happen.</p>`);
}
const GLYPH_OF=n=>({Sun:'☉',Moon:'☽',Mercury:'☿',Venus:'♀',Mars:'♂',Jupiter:'♃',Saturn:'♄',Uranus:'♅',Neptune:'♆',Pluto:'♇',Ascendant:'AC',Midheaven:'MC'})[n]||'✦';
const mcNeed=t=>`${mbox(`<p class="center">${t}</p>`)}<button class="btn" data-go="settings" data-t="birth">Add birth details</button><p class="muted small center">Only what you know is needed. Kosmia shows what your details allow, and nothing is ever guessed.</p>`;
/* ---------- the Three Lights and the entrance ---------- */
function mcLights(){
 const c=myChart(),sun=c?mcSign(c,'Sun'):sg(S.sign),moon=c?mcSign(c,'Moon'):null,asc=mcAsc(c);
 return [['Sun','Your essence',sun,'sun'],['Moon','Your inner world',moon,c&&c.moonRange?'uncertain':'moon'],['Rising','Your outward presence',asc,'rising']];
}
function mcHome(){
 const nm=firstName()||S.name||'',L=mcLights(),miss=!hasBirthDate()||!mcAsc(myChart());
 return mcPage(`${hdr('My Cosmos',{back:false,sub:'Discover the universe within you.',right:'<button class="ibtn mc-x" data-mc="close" aria-label="Close My Cosmos">×</button>'})}
 ${nm?`<p class="mc-name">${esc(nm)}</p>`:''}
 ${ssHead('Your Cosmic Essence')}<div class="mc-three">${L.map(([n,l,s,k])=>`<button class="mc-l" data-mc="light" data-v="${n.toLowerCase()}"><span class="mc-g">${s?s.g:'?'}</span><strong>${s?s.name:k==='uncertain'?'Uncertain':'Unknown'}</strong><span>${n}</span><em>${l}</em></button>`).join('')}</div>
 ${miss?`<p class="muted small center">Add your birth ${hasBirthDate()?'time and birthplace':'date, time and birthplace'} to discover more of your celestial blueprint. <button class="link" data-go="settings" data-t="birth">Add birth details</button></p>`:''}
 <div class="list mc-doors">
 ${ssDoor('✶','My Birth Chart','The celestial map of the moment you were born.','data-go="you" data-t="chart"')}
 ${ssDoor('☉','My Zodiac','Discover your Sun, Moon and Rising signs.','data-go="you" data-t="zodiac"')}
 ${ssDoor('✧','My Cosmic Identity','Your nature, strengths and potential for growth.','data-go="you" data-t="identity"')}
 ${ssDoor('☾','My Cosmic Cycles','The celestial chapters unfolding in your life.','data-go="you" data-t="cycles"')}
 ${ssDoor('♡','My Relationships','Explore the connections between your universe and others.','data-go="you" data-t="people"')}
 ${ssDoor('⚙','My Preferences','Make Kosmia your own.','data-go="you" data-t="preferences"')}</div>`,'home');
}
/* ---------- My Birth Chart and Cosmic Placement ---------- */
function mcChart(){
 const c=myChart(),v=V.mcCh||'placements';
 if(!c)return mcPage(`${hdr('My Birth Chart',{sub:'The celestial map of the moment you were born.'})}${mcNeed('Add your birth date to draw your chart. A birth time and place add your Rising sign and houses.')}`);
 const b=S.birth,sel=c.pl.find(p=>p.n===V.chartSel),asc=c.known&&c.ang?Math.floor(c.ang.asc/30):null;
 let body;
 if(v==='houses')body=asc==null?'<p class="muted center">Houses need your birth time and birthplace.</p>':HOUSE.map((h,i)=>{const s=sIdx(asc+i),inn=c.pl.filter(p=>p.house===i+1).map(p=>p.n);return `<button class="dr-entry" data-mc="pl" data-p="house:${i+1}"><span class="dr-d">${CJ_ORD(i+1)} House · ${s.name}${inn.length?' · '+inn.join(', '):''}</span><strong>${HOUSE_T[i]}</strong><span class="dr-x">The area of ${h}.</span></button>`}).join('');
 else if(v==='aspects')body=c.asp.slice(0,18).map((a,i)=>`<button class="dr-entry" data-mc="pl" data-p="aspect:${i}"><span class="dr-d">${cap(a.n)} · orb ${a.orb.toFixed(1)}°</span><strong>${a.a.n} ${a.g} ${a.b.n}</strong><span class="dr-x">Your ${pmOf(a.a.n)} and ${pmOf(a.b.n)} ${ASPT[a.n]}.</span></button>`).join('')||'<p class="muted center">No major aspects within the orbs used.</p>';
 else body=c.pl.map(p=>{const un=p.n==='Moon'&&c.moonRange;return `<button class="dr-entry" data-mc="pl" data-p="planet:${p.n}"><span class="dr-d">${un?'Sign uncertain without a birth time':degTxt(p.lon)}${p.house?' · '+CJ_ORD(p.house)+' House':''}${p.retro?' · retrograde':''}</span><strong>${p.g} ${p.n} in ${un?'an uncertain sign':sIdx(p.sign).name}</strong><span class="dr-x">How you experience ${pmOf(p.n)}: ${un?'it depends on your birth time':STYLE[sIdx(p.sign).id]}.</span></button>`}).join('')+(asc!=null?`<button class="dr-entry" data-mc="pl" data-p="planet:Ascendant"><span class="dr-d">${degTxt(c.ang.asc)}</span><strong>AC ${sIdx(asc).name} Rising</strong><span class="dr-x">How you meet the world: ${STYLE[sIdx(asc).id]}.</span></button>`:'');
 return mcPage(`${hdr('My Birth Chart',{sub:'Your Celestial Blueprint'})}
 <p class="jx-meta">${ymdLong(b.date,{day:'numeric',month:'long',year:'numeric'})}${b.unk||!b.time?' · birth time unknown':' · '+esc(b.time)+(b.cert==='approx'?' (approximate)':'')}${b.place?' · '+esc(b.place):''}</p>${mcApprox()}
 <div class="wheel-wrap wheel-free mc-wheel">${chartWheel(c)}</div>
 ${sel?mbox(`<h3><span class="glyph">${sel.g}</span> ${sel.n} in ${sel.n==='Moon'&&c.moonRange?'an uncertain sign':sIdx(sel.sign).name}</h3>${sel.house?`<p class="center small">${CJ_ORD(sel.house)} House</p>`:''}<p class="center">${esc(cap(pmOf(sel.n)))}.</p><button class="btn ghost" data-mc="pl" data-p="planet:${sel.n}">Explore this placement</button>`):'<p class="muted center small">Select a planet to explore its placement.</p>'}
 <div class="fchips ss-chips">${[['placements','Placements'],['houses','Houses'],['aspects','Aspects']].map(([k,t])=>`<button class="fchip" role="radio" aria-checked="${v===k}" data-mc="ch" data-v="${k}">${t}</button>`).join('')}</div>
 <div class="dr-book">${body}</div>
 ${ssHead('Explore Further')}<div class="ss-acts"><button class="btn ghost" data-act="kasask" data-q="Explain my birth chart simply: my Sun, Moon and Rising, and the one aspect most worth understanding.">Ask Kassandra about my chart</button></div>
 <details class="how"><summary>How this is worked out</summary><p>Tropical zodiac, geocentric positions from the Astronomy Engine ephemeris, using your birth time in the historical local time of ${esc(b.tz||'your birthplace')}. Houses are whole-sign. Aspect orbs: 8° for conjunctions and oppositions, 6° for squares and trines, 4° for sextiles.</p></details>`,'chart');
}
function mcPlacementData(c,k){
 const [t,v]=k.split(':');
 if(t==='planet'){const p=v==='Ascendant'?(c.ang?{n:'Ascendant',g:'AC',sign:Math.floor(c.ang.asc/30),lon:c.ang.asc,house:1}:null):c.pl.find(q=>q.n===v);if(!p)return null;
  const s=sIdx(p.sign),un=p.n==='Moon'&&c.moonRange,isA=p.n==='Ascendant';
  return {g:p.g,title:isA?`${s.name} Rising`:`${p.n} in ${un?'an uncertain sign':s.name}`,kw:[isA?'Presence':PL_KW[p.n],...SIGN_KEYS[s.id].slice(0,2)].join(' · '),
   parts:[[isA?'What the Rising Sign Represents':`What ${p.n} Represents`,isA?'The Rising sign, or Ascendant, is the sign on the eastern horizon at your birth: traditionally your outward presence, first impressions and approach to new experiences.':PL_REP[p.n]],
    [isA?'Your Rising Sign':`${p.n} in Your Sign`,un?`The Moon moved from ${sIdx(c.moonRange[0]).name} to ${sIdx(c.moonRange[1]).name} on your birth day, so its sign depends on your birth time.`:`Within astrology, ${isA?s.name+' rising':p.n+' in '+s.name} is associated with ${SIGN_KEYS[s.id].join(', ').toLowerCase()}, expressed ${STYLE[s.id]}.`],
    [isA?'In Everyday Life':`${p.n} in Your House`,isA?`You may notice it in ${SIGN_LIFE[s.id]}.`:p.house?`In the ${CJ_ORD(p.house)} house, these themes may be explored through ${HOUSE[p.house-1]}.`:'Add your birth time and birthplace to see which area of life this placement colours.'],
    ['Your Strengths',un?'':`${SIGN_KEYS[s.id].join(', ')}, brought to ${pmOf(p.n)}.`],['Your Growth Opportunities',un?'':SIGN_GROW[s.id]],
    ['The Details',`${degTxt(p.lon)}${p.house?' · '+CJ_ORD(p.house)+' House':''}${p.retro?' · retrograde at your birth, traditionally turning its themes inward':''}`]],
   q:isA?'How do I want to be met by the world?':PL_Q[p.n],rel:c.asp.map((a,i)=>[a,i]).filter(([a])=>a.a.n===p.n||a.b.n===p.n).slice(0,4).map(([a,i])=>[`aspect:${i}`,`${a.a.n} ${a.n} ${a.b.n}`]).concat(p.house&&!isA?[[`house:${p.house}`,`Your ${CJ_ORD(p.house)} House`]]:[])}}
 if(t==='house'){const h=+v;if(!(c.known&&c.ang))return null;const s=sIdx(Math.floor(c.ang.asc/30)+h-1),inn=c.pl.filter(p=>p.house===h);
  return {g:String(h),title:`Your ${CJ_ORD(h)} House`,kw:HOUSE_T[h-1].replace('&','·'),parts:[['What This House Represents',`The ${CJ_ORD(h)} house is the area of life traditionally associated with ${HOUSE[h-1]}.`],['Its Sign',`${s.name} colours this area of your life ${STYLE[s.id]}.`],['Planets Here',inn.length?inn.map(p=>`${p.n}, bringing ${pmOf(p.n)}`).join('; ')+'.':'No planets were here at your birth. An empty house is not an empty area of life; its sign and ruler still speak for it.']],q:CAL_HQ[h-1],rel:inn.map(p=>[`planet:${p.n}`,`${p.n} in ${sIdx(p.sign).name}`])}}
 if(t==='aspect'){const a=c.asp[+v];if(!a)return null;
  return {g:a.g,title:`${a.a.n} ${a.n} ${a.b.n}`,kw:`${PL_KW[a.a.n]||a.a.n} · ${PL_KW[a.b.n]||a.b.n} · ${cap(a.n)}`,parts:[['What This Aspect Represents',`An aspect is an angle between two points of your chart. A ${a.n} ${({conjunction:'unites',sextile:'opens a gentle opportunity between',square:'creates a creative tension between',trine:'lets energy flow between',opposition:'holds in balance'})[a.n]||'links'} the two.`],['In Your Chart',`Your ${pmOf(a.a.n)} and your ${pmOf(a.b.n)} ${ASPT[a.n]}.`],['Your Strengths',({conjunction:'Focus and intensity: two parts of you working as one.',sextile:'Ease and opportunity when you reach for it.',square:'Drive and resilience born of friction.',trine:'Natural talent and flow.',opposition:'Perspective, and the ability to hold two truths.'})[a.n]],['Your Growth Opportunities',({conjunction:'Telling the two apart when one overwhelms the other.',sextile:'Acting on gifts that come easily.',square:'Turning tension into building rather than battle.',trine:'Not taking an easy gift for granted.',opposition:'Finding the middle way rather than swinging between extremes.'})[a.n]],['The Details',`Orb ${a.orb.toFixed(1)}°`]],q:`How do my ${pmOf(a.a.n).split(' and ')[0]} and my ${pmOf(a.b.n).split(' and ')[0]} work together?`,rel:[[`planet:${a.a.n}`,a.a.n],[`planet:${a.b.n}`,a.b.n]]}}
 return null;
}
function mcPlacement(){
 const c=myChart(),x=c&&mcPlacementData(c,V.mcP||'');
 if(!x)return mcPage(`${hdr('Cosmic Placement')}<p class="muted center">This placement needs more of your birth details.</p><button class="btn" data-go="settings" data-t="birth">Add birth details</button>`);
 const hk='place:'+V.mcP;
 return mcPage(`${hdr(esc(x.title),{sub:'Your natal placement'})}
 <section class="cal-ov">${ssGlyph(x.g,'big')}<p class="cal-th big">${esc(x.kw)}</p></section>
 ${x.parts.filter(p=>p[1]).map(([h,t])=>`${ssHead(h)}<div class="dr-text"><p>${esc(t)}</p></div>`).join('')}
 ${mbox(`<h3>A Question for You</h3><p class="quote center">“${esc(x.q)}”</p>`,'dr-q')}
 <div class="ss-acts"><button class="btn ghost cj-heart" data-heart="${esc(hk)}" data-snap-t="${esc(x.title)}" aria-pressed="${hearted(hk)}" style="--fill:${hearted(hk)?'currentColor':'none'}">${IC.heart} ${hearted(hk)?'In My Library':'Keep in My Library'}</button><button class="btn ghost" data-jx="write" data-link="${esc(hk)}" data-t="${esc('My Cosmos — '+x.title)}">Write a Reflection</button></div>
 <div class="ss-acts"><button class="btn ghost" data-act="kasask" data-q="${esc(`In my birth chart I have ${x.title}. Help me understand what it may say about me.`)}">Ask Kassandra</button></div>
 ${(()=>{const n=(V.mcP||'').split(':')[1],k=n==='Sun'?'sun':n==='Moon'?'moon':PLK[n]?'pl:'+n:'';return k?flowRow([[`Where ${n==='Sun'||n==='Moon'?'the '+n:n} is today`,`data-sky="${k}"`],['My Cosmic Cycles','data-go="you" data-t="cycles"']]):''})()}
 ${x.rel.length?`${ssHead('Related Placements')}<div class="dr-book">${x.rel.map(([k,t])=>`<button class="dr-entry" data-mc="pl" data-p="${esc(k)}"><strong>${esc(t)}</strong></button>`).join('')}</div>`:''}`,'place');
}
/* ---------- My Zodiac and My Cosmic Identity ---------- */
const MC_Z={sun:['Your Sun','The Essence of Who You Are','Identity, vitality, conscious desires and self-expression.','Your sense of self tends to shine'],moon:['Your Moon','The World Within You','Emotional needs, instinctive responses and inner security.','Your feelings tend to move'],rising:['Your Rising','The Way You Meet the World','Outward presence, first impressions and approach to new experiences.','You tend to meet the world']};
function mcZodiac(){
 const c=myChart(),L=mcLights(),open=V.mcZ||'';
 const sec=([n,,s,k])=>{const id=n.toLowerCase(),Z=MC_Z[id],on=open===id;
  return `<section class="mc-z${on?' open':''}"><button class="mc-zh" data-mc="z" data-v="${id}" aria-expanded="${on}"><span class="mc-g">${s?s.g:'?'}</span><span><span class="dr-d">${Z[0]}</span><strong>${Z[1]}</strong><span class="mc-zs">${s?s.name:k==='uncertain'?'Uncertain without a birth time':'Unknown without a birth time and place'}</span></span><span class="lr-c">${IC.chev}</span></button>
  ${on?(s?`<div class="mc-zb"><p class="dr-d">${s.name} · ${s.g} · ${s.el} · ${s.mod}</p><h4>What It Represents</h4><p>${Z[2]}</p><h4>How It May Express Itself</h4><p>${Z[3]} ${STYLE[s.id]}. ${id==='sun'?esc(SIGN_DESC[s.id]):''}</p><h4>Your Strengths</h4><p>${SIGN_KEYS[s.id].join(', ')}.</p><h4>Your Growth Opportunities</h4><p>${SIGN_GROW[s.id]}</p><h4>In Everyday Life</h4><p>You may notice it in ${SIGN_LIFE[s.id]}.</p></div>`
   :`<div class="mc-zb"><p>${k==='uncertain'?`The Moon changed sign on your birth day (from ${sIdx(c.moonRange[0]).name} to ${sIdx(c.moonRange[1]).name}), so your Moon sign depends on your birth time.`:'Your Rising sign depends on the exact time and place of your birth.'}</p><button class="btn ghost" data-go="settings" data-t="birth">Add birth details</button></div>`):''}</section>`};
 const [S1,M1,R1]=L.map(x=>x[2]);
 const tog=S1?`Your ${S1.name} Sun is associated with ${SIGN_KEYS[S1.id].slice(0,2).join(' and ').toLowerCase()}${M1?`, while your ${M1.name} Moon brings themes of ${SIGN_KEYS[M1.id].slice(0,2).join(' and ').toLowerCase()}`:''}.${R1?` Your ${R1.name} Rising introduces ${SIGN_KEYS[R1.id][0].toLowerCase()} in the way you meet the world.`:''} ${M1||R1?`Together, these placements invite reflection on the balance between ${[S1,M1,R1].filter(Boolean).map(s=>EL_TXT[s.el][0].split(' and ')[0].toLowerCase()).filter((v,i,a)=>a.indexOf(v)===i).join(', ').replace(/, ([^,]*)$/,' and $1')}.`:'Add your birth time and place to see your Three Lights together.'}`:'';
 return mcPage(`${hdr('My Zodiac',{sub:'Your Sun, Moon and Rising signs.'})}<div class="mc-zs-w">${L.map(sec).join('')}</div>
 ${ssHead('Your Three Lights Together')}<div class="dr-text"><p>${esc(tog)}</p></div>
 ${flowRow([['Today’s Horoscope','data-sky="sign"'],['My Birth Chart','data-go="you" data-t="chart"'],['My Relationships','data-go="you" data-t="people"']])}`,'zod');
}
function mcElements(c){
 const pts=c.pl.filter(p=>!(p.n==='Moon'&&c.moonRange)).map(p=>sIdx(p.sign).el).concat(c.known&&c.ang?[sIdx(Math.floor(c.ang.asc/30)).el]:[]),n=pts.length,cnt={Fire:0,Earth:0,Air:0,Water:0};pts.forEach(e=>cnt[e]++);
 return Object.entries(cnt).map(([e,v])=>[e,Math.round(v/n*100),v]).sort((a,b)=>b[1]-a[1]);
}
function mcIdentity(){
 const c=myChart();
 if(!c)return mcPage(`${hdr('My Cosmic Identity',{sub:'Your nature, strengths and potential for growth.'})}${mcNeed('Add your birth date to see your Cosmic Identity drawn from your own chart.')}`);
 const s=mcSign(c,'Sun'),m=mcSign(c,'Moon'),r=mcAsc(c),ve=mcSign(c,'Venus'),me=mcSign(c,'Mercury'),el=mcElements(c),nm=firstName(),lp=N.lifePath(S.birth.date).r.n,M=N.MEANING[lp]||N.MEANING[lp%9||9];
 const por=`${nm?esc(nm)+', y':'Y'}our ${s.name} Sun is associated with ${SIGN_KEYS[s.id].join(', ').toLowerCase()}${m?`, and your ${m.name} Moon with ${SIGN_KEYS[m.id].slice(0,2).join(' and ').toLowerCase()}`:''}${r?`; with ${r.name} rising, you may meet the world ${STYLE[r.id].split(',')[0]}`:''}. ${el[0][0]} is your strongest element, bringing ${EL_TXT[el[0][0]][1]}${el[3][2]===0?`, while ${el[3][0]} is absent from your chart, a quality you may find yourself drawn to in others`:''}. ${m&&m.el!==s.el?`Your Sun and Moon speak different elemental languages, ${s.el.toLowerCase()} and ${m.el.toLowerCase()}: part of you may seek ${EL_TXT[s.el][1].split(',')[0]}, while another needs ${EL_TXT[m.el][1].split(',')[0]}. Both belong to you.`:m?`Your Sun and Moon share the element of ${s.el.toLowerCase()}, so what you want and what you need often move together.`:''}`;
 return mcPage(`${hdr('My Cosmic Identity',{sub:'Your nature, strengths and potential for growth.'})}
 ${ssHead('Your Cosmic Portrait')}<div class="dr-text"><p>${por}</p></div>
 ${ssHead('Your Nature')}<div class="dr-text"><p>${esc(SIGN_BLURB[s.id])}</p></div>
 ${ssHead('Your Strengths')}<div class="dr-text"><p>${esc([...new Set([s,m,r].filter(Boolean).flatMap(x=>SIGN_KEYS[x.id]))].join(' · '))}</p></div>
 ${ssHead('Your Growth Opportunities')}<div class="dr-text"><p>${esc(SIGN_GROW[s.id])}${m&&m.id!==s.id?' '+esc(SIGN_GROW[m.id]):''}</p></div>
 ${ssHead('Your Emotional World')}<div class="dr-text"><p>${m?`With your Moon in ${m.name}, your feelings tend to move ${STYLE[m.id]}. You may feel most at peace when there is room for ${SIGN_KEYS[m.id][0].toLowerCase()}.`:`The Moon changed sign on your birth day, so your emotional world depends on your birth time. <button class="link" data-go="settings" data-t="birth">Add it</button>`}</p></div>
 ${ssHead('Your Way of Connecting')}<div class="dr-text"><p>With Venus in ${ve.name}, you tend to love ${STYLE[ve.id]}. With Mercury in ${me.name}, you tend to think and speak ${STYLE[me.id]}.</p></div>
 ${ssHead('Your Elemental Balance')}<div class="mc-el">${el.map(([e,pc])=>`<div><span><b>${e}</b> ${pc}%</span><i><b class="el-${e.toLowerCase()}" style="width:${pc}%"></b></i><em>${EL_TXT[e][0]}</em></div>`).join('')}</div>
 <details class="how"><summary>How this is worked out</summary><p>Each of the ten planets counts once${c.moonRange?' (the Moon is left out while its sign is uncertain)':''}${c.known?', and so does your Rising sign':''}, by the element of its sign. It is a symbolic distribution of your chart, not a measure of personality or emotional ability.</p></details>
 ${ssHead('Your Life Path')}${mbox(`<p class="dr-d center">Your Life Path Number</p><p class="mc-lp">${lp}</p><h3>${esc(M[0])}</h3><p class="center small">${esc(M[1].split(/,\s*/).map(cap).join(' · '))}</p><p class="center">${esc(M[2]||'')}</p><button class="btn ghost" data-go="discover" data-t="life-path">Explore Your Life Path</button>`,'dr-q')}`,'id');
}
/* ---------- My Relationships, a person, and adding or editing someone ---------- */
const MC_CAT=[['partner','Partner','romantic'],['interest','Romantic interest','romantic'],['friend','Friend','friendship'],['family','Family','family'],['colleague','Colleague','professional'],['other','Other','other']];
const mcCatL=p=>(MC_CAT.find(c=>c[0]===p.cat)||[])[1]||(p.rel?CN_RELN[p.rel]:'');
const mcSignOf=p=>p.sign||(p.date?sunSign(p.date):'');
const mcReady=p=>p.date&&p.time&&p.place?'Complete birth details':p.date&&(p.unk||!p.time)?'Birth time unknown':p.date?'Birth date available':mcSignOf(p)?'Zodiac sign only':'Name only';
function mcPeople(){
 const q=(V.mcPq||'').trim().toLowerCase(),all=cnPeople(),l=all.filter(p=>!q||[p.name,mcCatL(p),mcSignOf(p)&&sg(mcSignOf(p)).name].join(' ').toLowerCase().includes(q)),cmp=V.mcCmp||[];
 return mcPage(`${hdr('My Relationships',{sub:'Every connection brings another universe into yours.'})}
 <button class="jx-write mc-add" data-mc="add"><span class="jx-pen">+</span><span><strong>Add Someone</strong><span>Only a name or nickname is needed.</span></span></button>
 ${all.length>3?`<div class="field"><label for="mcpq" class="sr-only">Search your relationships</label><input type="search" id="mcpq" placeholder="Search your relationships…" value="${esc(V.mcPq||'')}" autocomplete="off"></div>`:''}
 <div class="dr-book">${l.map(p=>{const sgn=mcSignOf(p);return V.mcCmpOn?`<button class="dr-entry mc-p" role="checkbox" aria-checked="${cmp.includes(p.id)}" data-mc="cmp" data-id="${esc(p.id)}"><span class="mc-g sm">${sgn?sg(sgn).g:'✦'}</span><span><strong>${esc(p.name)}</strong><span class="dr-d">${[mcCatL(p),sgn&&sg(sgn).name].filter(Boolean).join(' · ')}</span></span></button>`:`<button class="dr-entry mc-p" data-mc="person" data-id="${esc(p.id)}"><span class="mc-g sm">${sgn?sg(sgn).g:'✦'}</span><span><strong>${esc(p.name)}</strong><span class="dr-d">${[mcCatL(p),sgn&&sg(sgn).name].filter(Boolean).join(' · ')}</span><span class="dr-s">${mcReady(p)}</span></span></button>`}).join('')||`<p class="muted center">${all.length?'No one matches.':'The people who matter to you can be kept here, so their details never need entering twice.'}</p>`}</div>
 ${all.length>1?(V.mcCmpOn?`<p class="muted small center">Choose two people (${cmp.length} of 2).</p><div class="ss-acts"><button class="btn" data-mc="cmpgo" ${cmp.length===2?'':'disabled'}>Explore Their Connection</button><button class="btn ghost" data-mc="cmpoff">Cancel</button></div>`:'<button class="btn ghost" data-mc="cmpon">Compare two people</button>'):''}
 <p class="muted small center">People you keep stay private to you. Their birth details are kept only when they are happy for you to keep them.</p>`,'people');
}
function mcPerson(){
 const p=cnPerson(V.cnPid);
 if(!p)return mcPage(`${hdr('My Relationships')}<p class="muted center">This person is no longer here.</p><button class="btn" data-go="you" data-t="people">My Relationships</button>`);
 const sgn=mcSignOf(p),reads=cnReads().filter(r=>(r.pids||[]).includes(p.id)),mine=myChart(),full=p.date&&!p.unk&&p.time&&p.place,meFull=mine&&mine.known;
 const del=V.cnDel===p.id?`<div class="dr-confirm"><p>Remove ${esc(p.name)} from My Relationships?${reads.length?` ${reads.length===1?'One saved reading includes':reads.length+' saved readings include'} them.`:''}</p><div class="ss-acts">${reads.length?`<button class="btn ghost" data-cn="delp" data-id="${esc(p.id)}" data-all="0">Remove, keep the readings</button><button class="btn" data-cn="delp" data-id="${esc(p.id)}" data-all="1">Remove them and the readings</button>`:`<button class="btn" data-cn="delp" data-id="${esc(p.id)}" data-all="0">Remove</button>`}<button class="btn ghost" data-cn="delno">Cancel</button></div></div>`:'';
 return mcPage(`${hdr(esc(p.name),{sub:[mcCatL(p),sgn&&sg(sgn).name].filter(Boolean).join(' · ')||'In My Relationships'})}
 <section class="cal-ov">${ssGlyph(sgn?sg(sgn).g:'✦','big')}<p class="cal-mode">${mcReady(p)}</p></section>
 ${ssHead('Your Connection')}<div class="list">
 ${sgn?ssDoor('☉','Zodiac Compatibility','Explore the connection between your signs.',`data-mc="pz" data-id="${esc(p.id)}"`):''}
 ${ssDoor('♡','Relationship Dynamics','Understand symbolic strengths and differences.',`data-cn="withp" data-t="insights" data-id="${esc(p.id)}"`)}
 ${p.date?ssDoor('✶','Birth Chart Comparison',full&&meFull?'Explore the relationship between your natal charts.':'A limited comparison: houses and Rising need both birth times and places.',`data-cn="withp" data-t="synastry" data-id="${esc(p.id)}"`):''}</div>
 ${!p.date?`<p class="muted small center">Add ${esc(p.name)}’s birth date, with their permission, for a birth chart comparison. <button class="link" data-mc="edit" data-id="${esc(p.id)}">Add details</button></p>`:''}
 ${ssHead('Previous Readings')}${reads.length?`<div class="dr-book">${reads.map(r=>`<button class="dr-entry" data-cn="openr" data-id="${esc(r.id)}"><span class="dr-d">${ymdLong(r.day,{day:'numeric',month:'long',year:'numeric'})}</span><strong>${CN_TYPES[r.type]}</strong></button>`).join('')}</div>`:'<p class="muted center small">Readings about this connection will gather here and in Your Readings.</p>'}
 <div class="ss-acts"><button class="btn ghost" data-mc="edit" data-id="${esc(p.id)}">Edit Details</button><button class="btn ghost" data-cn="del" data-id="${esc(p.id)}">Remove Person</button></div>${del}`,'person');
}
function mcPersonEdit(){
 const id=V.cnPid,isNew=id==='new'||!cnPerson(id),p=isNew?(V.cnDraft&&!V.cnDraft.id?V.cnDraft:(V.cnDraft={name:'',rel:'',cat:'',sign:'',date:'',time:'',unk:false,place:'',consent:false})):(V.cnDraft&&V.cnDraft.id===id?V.cnDraft:(V.cnDraft=Object.assign({},cnPerson(id)))),P=V.places.cnp||{};
 const sgn=p.sign||(p.date?sunSign(p.date):''),mine=myChart(),ex=[['Save relationship',!!(p.name||'').trim()],['Zodiac compatibility',!!sgn],['Relationship insights',!!(p.name||'').trim()],['Full birth chart comparison',!!(p.consent&&p.date&&!p.unk&&p.time&&p.place&&mine&&mine.known)]];
 return mcPage(`${hdr(isNew?'Add Someone to Your Cosmos':'Edit '+esc(p.name))}
 <div class="field mc-f1"><label for="cp-name">Name or nickname</label><input type="text" id="cp-name" data-cn="pf" data-k="name" value="${esc(p.name||'')}" autocomplete="off"></div>
 <div class="field"><label for="mc-cat">Your connection</label><select id="mc-cat"><option value="">Choose, if you like</option>${MC_CAT.map(([k,l])=>`<option value="${k}" ${p.cat===k?'selected':''}>${l}</option>`).join('')}</select></div>
 ${ssHead('Birth Details · Optional')}<label class="row cn-cb"><input type="checkbox" class="cb" data-cn="pf" data-k="consent" ${p.consent?'checked':''}> <span>They are happy for me to keep their birth details</span></label>
 <div class="field"><label for="cp-date">Date of birth</label><input type="date" id="cp-date" data-cn="pf" data-k="date" value="${esc(p.date||'')}"></div>
 <label class="row cn-cb"><input type="checkbox" class="cb" data-cn="pf" data-k="unk" ${p.unk?'checked':''}> <span>I don’t know their birth time</span></label>${p.unk?'':`<div class="field"><label for="cp-time">Time of birth</label><input type="time" id="cp-time" data-cn="pf" data-k="time" value="${esc(p.time||'')}"></div>`}
 <div class="field"><label for="cnp-q">Place of birth</label><div class="row nowrap"><input type="text" id="cnp-q" value="${esc(P.q!=null?P.q:p.place||'')}" placeholder="Town or city" autocomplete="off"><button class="btn ghost sm" data-cn="psearch" data-slot="p">Search</button></div>
 ${P.busy?'<p class="muted small">Searching…</p>':''}${P.results?(P.results.length?`<ul class="places">${P.results.map((r,i)=>`<li><button class="link" data-cn="ppick" data-slot="p" data-i="${i}">${esc([r.name,r.admin1,r.country].filter(Boolean).join(', '))}</button></li>`).join('')}</ul>`:'<p class="muted small">No places found.</p>'):''}${p.place&&!P.results?`<p class="muted small">${esc(p.place)}</p>`:''}</div>
 <div class="field"><label for="cp-sign">Zodiac sign, if known</label><select id="cp-sign" data-cn="pf" data-k="sign"><option value="">${p.date?sg(sunSign(p.date)).name+' (from the date)':'Not known'}</option>${SIGNS.map(x=>`<option value="${x.id}" ${p.sign===x.id?'selected':''}>${x.name}</option>`).join('')}</select></div>
 ${ssHead('Available Experiences')}<div class="mc-ex">${ex.map(([l,ok])=>`<p class="${ok?'on':''}">${ok?'✓':'○'} ${l}</p>`).join('')}</div>
 <p class="muted small">${ex[3][1]?'':'A full birth chart comparison needs their date, time and place of birth, and your own complete birth details. Everything else works with what you know.'}</p>
 <button class="btn" data-cn="savep">${isNew?'Save Relationship':'Save Changes'}</button>`,'pedit');
}
/* ---------- My Preferences and its pages ---------- */
function mcPrefs(){
 const row=(t,l,s)=>`<button class="dr-entry" data-go="settings" data-t="${t}"><strong>${l}</strong><span class="dr-x">${s}</span></button>`;
 return mcPage(`${hdr('My Preferences',{sub:'Make Kosmia your own.'})}
 <div class="dr-book mc-top">${row('birth','My Birth Details','Name, birth date, birth time and birthplace.')}${row('account','My Account','Email, sign-in and account security.')}${row('notifications','Notifications & Reminders','Celestial events, daily rituals and reminders.')}${row('ritual','My Ritual Times','Your morning and evening rhythm.')}${row('region','Language & Region','Language, time zone, clock and dates.')}${row('display','Display & Accessibility','Text size, contrast, motion and reading.')}${row('privacy','Privacy & My Data','Permissions, export and deletion.')}${row('subscription','My Membership','Your plan and what it includes.')}</div>
 <p class="muted small center">${!C.enabled?'Kept on this device':C.user?'Signed in · synced across your devices':'Not signed in · kept on this device'}</p>`,'prefs');
}
const ritTimes=()=>{const r=Object.assign({m:'07:00',e:'21:00',we:false,wm:'09:00',wee:'22:00'},S.settings.rit||{}),wd=new Date().getDay(),wk=r.we&&(wd===0||wd===6);return {m:wk?r.wm:r.m,e:wk?r.wee:r.e,r}};
const sw=(id,on,l,s)=>`<label class="row mc-sw"><input type="checkbox" class="cb" id="${id}" ${on?'checked':''}> <span><b>${l}</b>${s?`<em>${s}</em>`:''}</span></label>`;
function mcNotifPage(){
 const n=S.notif,d=n.moons||'';
 return `<div class="stack"><h1>Notifications &amp; Reminders</h1><p class="note">Kosmia keeps these choices now. Today, reminders appear when you open Kosmia; notifications on your phone will follow once push delivery is switched on, and your browser will ask first. Nothing is ever sent in a hurried or fearful tone.</p>
 ${panel(`${sw('n_mr',n.mr,'Morning Ritual','A gentle invitation to begin your day.')}${sw('n_er',n.er,'Evening Ritual','A moment to reflect before resting.')}${sw('n_nm',!!d&&n.nm!==false,'New Moon','Prepare for a new lunar cycle.')}${sw('n_fm',!!d&&n.fm!==false,'Full Moon','An invitation to reflect and release.')}${sw('n_ecl',n.ecl,'Eclipses','Upcoming solar and lunar eclipses.')}${sw('n_cyc',n.cyc,'Personal Cosmic Cycles','Significant changes in your personal transits.')}${sw('n_on',n.on,'Daily horoscope','')}${sw('n_wh',n.whisper,'Daily Whisper','')}`)}
 ${panel(`<h3>Default celestial event reminders</h3><div class="field"><label for="n_def">When</label><select id="n_def">${[['before','The day before'],['day','On the day'],['both','The day before and on the day']].map(([v,l])=>`<option value="${v}" ${(d||'day')===v?'selected':''}>${l}</option>`).join('')}</select></div><div class="field"><label for="n_time">Time</label><input type="time" id="n_time" value="${n.time}"></div><p class="muted small">A reminder set on a single event in the Calendar replaces this one for that event, so nothing arrives twice. <button class="link" data-go="discover" data-t="saved-events">Manage event reminders</button></p>`)}
 ${panel(`<label class="row"><input type="checkbox" id="n_q" ${n.quiet?'checked':''} class="cb"> Quiet hours</label><div class="row two"><div class="field"><label for="n_qf">From</label><input type="time" id="n_qf" value="${n.quietFrom}"></div><div class="field"><label for="n_qt">To</label><input type="time" id="n_qt" value="${n.quietTo}"></div></div>`)}</div>`;
}
function mcRitualPage(){
 const r=ritTimes().r;
 return `<div class="stack"><h1>My Ritual Times</h1><p class="note">Your rhythm sets when your rituals are offered and which one the Ritual screen brings forward. Both are always open to you: waking late never takes the morning away.</p>
 ${panel(`<h3>Your Daily Rhythm</h3><div class="field"><label for="r_m">Morning Ritual · begin your day with intention</label><input type="time" id="r_m" value="${r.m}"></div><div class="field"><label for="r_e">Evening Ritual · close your day with reflection</label><input type="time" id="r_e" value="${r.e}"></div>
 <label class="row"><input type="checkbox" id="r_we" class="cb" ${r.we?'checked':''}> Use a different schedule on weekends</label>${r.we?`<div class="row two"><div class="field"><label for="r_wm">Weekend morning</label><input type="time" id="r_wm" value="${r.wm}"></div><div class="field"><label for="r_wee">Weekend evening</label><input type="time" id="r_wee" value="${r.wee}"></div></div>`:''}`)}</div>`;
}
function mcRegionPage(){
 const st=S.settings;
 return `<div class="stack"><h1>Language &amp; Region</h1>${panel(`<div class="field"><label for="g_lang">Language</label><select id="g_lang"><option>English</option></select><p class="muted small">More languages will follow.</p></div>
 <div class="field"><label for="d_tz">Time zone</label><select id="d_tz"><option value="">Follow this device (${esc(DEVICE_TZ)}), adjusting when you travel</option>${(Intl.supportedValuesOf?Intl.supportedValuesOf('timeZone'):[]).map(z=>`<option ${st.tz===z?'selected':''}>${z}</option>`).join('')}</select></div>
 <div class="field"><label for="g_clock">Clock</label><select id="g_clock"><option value="24" ${st.clock!=='12'?'selected':''}>24-hour (21:00)</option><option value="12" ${st.clock==='12'?'selected':''}>12-hour (9:00 pm)</option></select></div>
 <div class="field"><label for="g_date">Dates</label><select id="g_date"><option value="dmy" ${st.datefmt!=='mdy'?'selected':''}>Day before month (9 December)</option><option value="mdy" ${st.datefmt==='mdy'?'selected':''}>Month before day (December 9)</option></select></div>`)}
 <p class="muted small">Your birth chart always uses the historical local time and place of your birth, whatever your current time zone.</p></div>`;
}
const mcDisplayExtra=()=>{const st=S.settings;return panel(`<h3>Comfort</h3>${sw('d_ct',st.contrast,'Enhanced contrast','Clearer text over the painted backgrounds.')}${sw('d_rd',st.readmode,'Reading mode','Long interpretations on a calm, plain page.')}<p class="muted small">Ambient soundscapes are not part of Kosmia yet.</p>`)};
const mcPrivacyExtra=()=>{const st=S.settings,others=cnPeople().filter(p=>p.date).length;return panel(`<h3>Permissions</h3>${sw('p_ji',st.jInsights===true,'Journal insights','Let the Journal notice recurring words, themes and lunar rhythms in your entries, on this device.')}${sw('p_pat',st.patterns!==false,'Oracle patterns','Let Patterns gather themes across dreams, readings, signs and reflections.')}<p class="muted small">Your Journal never reaches Kassandra or Oracle patterns on its own; an entry is shared with Kassandra only when you choose Talk about this.</p><p class="muted small">Journal protection with your device’s lock is not available in the web app yet.</p>`)+panel(`<h3>Other people’s details</h3><p class="muted small">You keep birth details for ${others} ${others===1?'person':'people'}, each only with their agreement. They stay private to your account.</p>${others?'<button class="btn ghost" data-mc="clearothers">Remove everyone’s birth details</button>':''}<h3>Delete personal content</h3><p class="muted small">Entries, readings and people can each be deleted where they live:</p><div class="ss-acts"><button class="btn ghost sm" data-go="tarot" data-t="journal">Journal</button><button class="btn ghost sm" data-go="discover" data-t="readings">Your Readings</button><button class="btn ghost sm" data-go="you" data-t="people">My Relationships</button></div>`)};
/* ---------- routes, actions, and returning to the exact place ---------- */
{const MCV={home:mcHome,chart:mcChart,placement:mcPlacement,zodiac:mcZodiac,identity:mcIdentity,cycles:mcCycles,transit:mcTransitView,people:mcPeople,person:mcPerson,'person-edit':mcPersonEdit,preferences:mcPrefs};const vy=views.you;views.you=()=>MCV[tab()]?MCV[tab()]():vy()}
{const vs=views.settings;views.settings=()=>{const t=tab();
 if(t==='notifications')return nightSub(subPage(mcNotifPage()),'st');
 if(t==='ritual')return nightSub(subPage(mcRitualPage()),'st');
 if(t==='region')return nightSub(subPage(mcRegionPage()),'st');
 if(t==='display')return nightSub(subPage(settingsPage('display').replace(/<\/div>$/,mcDisplayExtra()+'</div>')),'st');
 if(t==='privacy')return nightSub(subPage(settingsPage('privacy').replace(/<\/div>$/,mcPrivacyExtra()+'</div>')),'st');
 return vs()}}
{const vd=views.discover;views.discover=()=>{const t=tab();
 if(t==='events'||(t==='birth-chart'&&!V.ns.chart)){const s2=t==='events'?'discover':'you',t2=t==='events'?'calendar':'chart';V.sec=s2;V.tab[s2]=t2;history.replaceState(history.state,'',pathFor(s2,t2,{}));return views[s2]()}
 if(t==='moon'||t==='planets'){const h=vd();const fl=t==='moon'?(()=>{const n=nextLunar();return flowRow([n&&[`${esc(calName(n))} · ${shortDay(n)}`,calA(n)],['Write tonight',writeA('The Moon tonight','What am I feeling today that I have not yet said aloud?')],['Today’s Moon in the Sky','data-sky="moon"']])})()
   :`${ssHead('Each Planet Today')}<div class="fchips ss-chips">${Object.keys(PLK).map(P=>`<button class="fchip" data-sky="pl:${P}">${P}</button>`).join('')}</div>${flowRow([['How they touch you','data-go="you" data-t="cycles"'],['Cosmic Calendar','data-go="discover" data-t="calendar"']])}`;
  return h.replace(/(<\/div>)\s*$/,fl+'$1')}
 if(t==='people'||t==='person'){const t2=t==='person'&&V.cnPid&&V.cnPid!=='new'&&cnPerson(V.cnPid)?'person':'people';V.sec='you';V.tab.you=t2;history.replaceState(history.state,'',pathFor('you',t2,t2==='person'?{p:V.cnPid}:{}));return views.you()}
 if(t==='patterns'&&S.settings.patterns===false)return mcPage(`${hdr('Patterns')}${mbox('<p class="center">Oracle patterns are turned off, so Kosmia does not gather themes across your dreams, readings and reflections.</p>')}<button class="btn ghost" data-go="settings" data-t="privacy">Privacy & My Data</button>`);
 if(t==='profile'){const h=vd();return h.replace(/(<\/div>)\s*$/,`${mbox(`<h3>Birth time certainty</h3><div class="field"><label for="b_cert" class="sr-only">How certain is your birth time?</label><select id="b_cert"><option value="exact" ${(S.birth.cert||'exact')==='exact'?'selected':''}>Exact, from a record</option><option value="approx" ${S.birth.cert==='approx'?'selected':''}>Approximate</option><option value="unknown" ${S.birth.cert==='unknown'?'selected':''}>Unknown</option></select></div><p class="muted small">Changing your birth details recalculates your chart, Three Lights, Cosmic Identity, Cosmic Cycles and Life Path. Readings you have already saved keep the details they were made with.</p>`)}$1`)}
 return vd()}}
// the medallion opens My Cosmos over the place the reader was in; closing returns to that very scroll
{const g0=go;go=(sec,t,o)=>{try{const inn=[...document.querySelectorAll('.mn-scroll,.pg-scroll,#rth,.sk-body')].map(e=>e.scrollTop);if(inn.some(Boolean))history.replaceState(Object.assign({},history.state,{inner:inn}),'')}catch(e){}return g0(sec,t,o)}}
addEventListener('popstate',e=>{const inn=e.state&&e.state.inner;if(!inn)return;const put=()=>[...document.querySelectorAll('.mn-scroll,.pg-scroll,#rth,.sk-body')].forEach((el,i)=>{if(inn[i])el.scrollTop=inn[i]});requestAnimationFrame(()=>{put();setTimeout(put,120)})});
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-mc]');if(!t)return;const a=t.dataset.mc,v=t.dataset.v;
 if(a==='close'){if(((history.state&&history.state.d)||0)>0)return history.back();return go('home')}
 if(a==='light'){V.mcZ=v;return go('you','zodiac')}
 if(a==='z'){V.mcZ=V.mcZ===v?'':v;return render()}
 if(a==='ch'){V.mcCh=v;return render()}
 if(a==='pl'){V.mcP=t.dataset.p;if(/^planet:/.test(V.mcP))V.chartSel=V.mcP.slice(7);return go('you','placement')}
 if(a==='cv'){V.mcCv=v;return render()}
 if(a==='tr'){V.mcT=t.dataset.k;return go('you','transit')}
 if(a==='trwrite'){const x=(mcTransits()||[]).find(y=>y.key===V.mcT);if(x)jxStart({cat:'reflection',prompt:x.kind==='house'?CAL_HQ[x.h-1]:PL_Q[x.N]||'',link:{k:'',t:'My Cosmic Cycles — '+mcTrTitle(x)},src:'cosmos',force:true});return}
 if(a==='add'){V.cnPid='new';V.cnDraft=null;V.places.cnp={};return go('you','person-edit')}
 if(a==='edit'){V.cnPid=t.dataset.id;V.cnDraft=null;V.places.cnp={};return go('you','person-edit')}
 if(a==='person'){V.cnPid=t.dataset.id;V.cnDel=null;return go('you','person')}
 if(a==='pz'){const p=cnPerson(t.dataset.id);V.love={a:S.sign,b:mcSignOf(p),done:true};return go('discover','affinity')}
 if(a==='cmpon'||a==='cmpoff'){V.mcCmpOn=a==='cmpon';V.mcCmp=[];return render()}
 if(a==='cmp'){const id=t.dataset.id,l=V.mcCmp||[];V.mcCmp=l.includes(id)?l.filter(x=>x!==id):l.concat(id).slice(-2);return render()}
 if(a==='cmpgo'){const [x,y]=V.mcCmp||[];if(!y)return;const X=cnX();X.a={who:x};X.b={who:y};X.res=null;X.rel=(cnPerson(y)||{}).rel||'';V.mcCmpOn=false;return go('discover','insights')}
 if(a==='clearothers'){cnPeople().filter(p=>p.date).forEach(p=>{const k=Object.assign({},p);['date','time','unk','place','lat','lon','tz'].forEach(f=>delete k[f]);k.consent=false;cnSaveBm('person',k)});toast('Everyone’s birth details are removed; their names stay.');return render()}
});
document.addEventListener('input',e=>{const t=e.target;if(t.id==='mcpq'){V.mcPq=t.value;const y=scrollY;render();refocus('mcpq');window.scrollTo(0,y)}});
document.addEventListener('change',e=>{
 const t=e.target,id=t.id,n=S.notif,st=S.settings;
 if(id==='mc-cat'&&V.cnDraft){V.cnDraft.cat=t.value;const m=MC_CAT.find(c=>c[0]===t.value);V.cnDraft.rel=m?m[2]:'';return}
 const M={n_mr:()=>n.mr=t.checked,n_er:()=>n.er=t.checked,n_nm:()=>{n.nm=t.checked;if(t.checked&&!n.moons)n.moons=($('#n_def')||{}).value||'day';if(!t.checked&&n.fm===false)n.moons=''},n_fm:()=>{n.fm=t.checked;if(t.checked&&!n.moons)n.moons=($('#n_def')||{}).value||'day';if(!t.checked&&n.nm===false)n.moons=''},n_ecl:()=>n.ecl=t.checked,n_cyc:()=>n.cyc=t.checked,n_def:()=>{if(n.moons||n.ecl)n.moons=t.value;n.def=t.value},
  r_m:()=>(st.rit=Object.assign({},st.rit,{m:t.value})),r_e:()=>(st.rit=Object.assign({},st.rit,{e:t.value})),r_we:()=>(st.rit=Object.assign({},st.rit,{we:t.checked})),r_wm:()=>(st.rit=Object.assign({},st.rit,{wm:t.value})),r_wee:()=>(st.rit=Object.assign({},st.rit,{wee:t.value})),
  g_clock:()=>st.clock=t.value,g_date:()=>st.datefmt=t.value,d_ct:()=>st.contrast=t.checked,d_rd:()=>st.readmode=t.checked,p_ji:()=>st.jInsights=t.checked,p_pat:()=>st.patterns=t.checked,b_cert:()=>{S.birth.cert=t.value;chartCache.k='';mcTr.k=''}};
 if(!M[id])return;M[id]();save();syncProfile();toast('Saved');
 document.body.classList.toggle('contrast',!!st.contrast);document.body.classList.toggle('readmode',!!st.readmode);
 if(/^(r_we|g_|d_)/.test(id))render();
});
document.body.classList.toggle('contrast',!!S.settings.contrast);document.body.classList.toggle('readmode',!!S.settings.readmode);

/* ---------- the ways between places: every page offers where to go next ---------- */
// the next New or Full Moon (or one kind of event) from the Calendar's own list, so it opens its own Cosmic Event page
const nextLunar=(days=40)=>{try{const n=new Date(),lim=+n+days*DAY;return upcoming().find(e=>(e.k==='new_moon'||e.k==='full_moon')&&e.date>n&&+e.date<=lim)||null}catch(e){return null}};
const nextOf=(f,days=400)=>{try{const n=new Date(),lim=+n+days*DAY;return upcoming().find(e=>e.date>n&&+e.date<=lim&&f(e))||null}catch(e){return null}};
const calA=e=>`data-cal="open" data-ref="${esc(evRef(e))}"`;
const shortDay=e=>ymdLong(evDay(e),{day:'numeric',month:'short'});
const flowRow=(items,head='Continue Your Journey')=>{const l=items.filter(Boolean);return l.length?`${ssHead(head)}<div class="ss-acts flow">${l.map(([t,a])=>`<button class="btn ghost" ${a}>${t}</button>`).join('')}</div>`:''};
const writeA=(t,q,src='sky')=>`data-flow="write" data-t="${esc(t)}" data-q="${esc(q)}" data-src="${src}"`;
// a short line in the toast, with the way to where the thing was kept
function toastGo(t,label,to){toast(t,'flowgo',label);const b=$('#toast .toast-a');if(b)Object.keys(to).forEach(k=>{if(to[k]!=null)b.dataset[k]=to[k]})}
// the Sky's own pages (the Moon, the Sun, each planet, a sign) can be opened from anywhere
function skyOpen(p){V.skp=p;V.skpIn=false;V.spo={};V.spk=false;if(p!=='sign')V.exploreSign=null;go('horoscope','overview')}
document.addEventListener('click',e=>{
 const g=e.target.closest('[data-act=flowgo]');if(g){$('#toast').hidden=true;if(g.dataset.ref){V.calRef=g.dataset.ref;V.calRem=null;V.calPath=null;return go('discover','event')}return go(g.dataset.s,g.dataset.t)}
 const s=e.target.closest('[data-sky]');if(s){e.stopImmediatePropagation();e.preventDefault();return skyOpen(s.dataset.sky)}
 const f=e.target.closest('[data-flow]');if(f){const a=f.dataset.flow;
  if(a==='write')return jxStart({cat:'reflection',prompt:f.dataset.q||'',link:{k:'',t:f.dataset.t||''},src:f.dataset.src||'sky',force:true});
  if(a==='kaskeep'){const b=kasSaveNow();if(b)toastGo('Kept in Your Readings','Open it',{s:'discover',t:'readings'});return}
  if(a==='kaswrite'){const b=kasSaveNow();return jxStart({cat:'reflection',prompt:'What did this conversation help me see?',link:b?{k:'saved:chat:'+b.ref,t:'A conversation with Kassandra'}:null,src:'kassandra',force:true})}
 }
},true);
// a Sky page left for another place is there again on Back
{const g0=go;go=(sec,t,o)=>{try{if(V.sec==='horoscope'){const on=V.skp&&document.querySelector('#rov .rt');history.replaceState(Object.assign({},history.state,{skp:on?V.skp:null,xs:on?V.exploreSign||null:null,per:V.period||null}),'')}}catch(e){}return g0(sec,t,o)}}
addEventListener('popstate',e=>{const s=e.state;if(s&&s.skp&&V.sec==='horoscope'&&!V.skp){V.skp=s.skp;V.exploreSign=s.xs||null;if(s.per)V.period=s.per;V.skpIn=true;V.spo={};render()}});
// the Sky's pages: two ways onward at the foot of the Moon, the Sun and each planet, and on the horoscope's parchment
function skFlowItems(k){
 if(k==='moon'){const n=nextLunar();return [n&&[`${n.k==='new_moon'?'New Moon':'Full Moon'} · ${shortDay(n)}`,calA(n)],['Write tonight',writeA('The Moon tonight','What am I feeling today that I have not yet said aloud?')]]}
 if(k==='sun'){const n=nextOf(e=>e.type==='season');return [n&&[`${esc(calName(n))} · ${shortDay(n)}`,calA(n)],['My Zodiac','data-go="you" data-t="zodiac"']]}
 if(k.startsWith('pl:')){const P=k.slice(3),n=nextOf(e=>e.planet===P||e.planet2===P||new RegExp('\\b'+P+'\\b').test(e.name||''));return [n?[`${P}’s next event · ${shortDay(n)}`,calA(n)]:['Cosmic Calendar','data-go="discover" data-t="calendar"'],['How it touches you','data-go="you" data-t="cycles"']]}
 return [];
}
const SKF=124,SKFH=96;
const skFlow=k=>{const l=skFlowItems(k).filter(Boolean);return l.length?`<nav class="sk-fl" aria-label="Continue" style="left:56px;width:912px;height:${SKFH}px">${l.map(([t,a])=>`<button ${a}>${t}</button>`).join('')}</nav>`:''};
const sgFlow=()=>{const me=!V.exploreSign||V.exploreSign===S.sign;return `<div class="sg-fl">${me?'<button data-go="you" data-t="zodiac">My Zodiac</button>':''}<button ${writeA('My horoscope today','What in today’s reading speaks to me?','horoscope')}>Reflect on today</button><button data-go="discover" data-t="calendar">What’s coming</button></div>`};
// Kassandra: a conversation can be kept at any moment (and goes on being kept as it grows), or written about
function kasSaveNow(){
 if(!KS.msgs.length)return null;const first=KS.msgs.find(m=>m.role==='user'),now=new Date().toISOString();
 let b=S.kcurId&&S.bookmarks.find(x=>x.id===S.kcurId);
 if(!b){const id=uuid();b={id,kind:'chat',ref:id,data:{},at:now};S.bookmarks.push(b);S.kcurId=id}
 b.data={title:first?first.content.slice(0,60):'A conversation',msgs:KS.msgs.slice(-40)};
 C.saveBookmark&&C.saveBookmark(b).then(()=>{b.sy=true;save()},()=>{});save();return b;
}
// the Journal: the next New Moon for intentions
function jxNextNm(){const n=nextOf(e=>e.k==='new_moon',45);return n?`${ssHead('The Next New Moon')}<div class="dr-book"><button class="dr-entry cal-ev" ${calA(n)}><span class="dr-d">${calCount(n)} · ${ymdLong(evDay(n),{weekday:'short',day:'numeric',month:'long'})}</span><strong>${esc(calName(n))}</strong><span class="dr-f">A time to set intentions, with its own ritual</span></button></div>`:''}

{let drLast='';const DRV={dreams:drHome,'new-dream':drHome,dream:drOpen,'dream-journal':drArchive,'dream-patterns':drPatternsView};
 const vd=views.discover;views.discover=()=>{const t=tab(),k=V.sec+'/'+t;if(t==='dreams'&&drLast&&!/^(discover\/(dreams|dream|dream-patterns|dream-journal)|tarot\/entry)$/.test(drLast))V.drShow=null;drLast=k;return DRV[t]?DRV[t]():vd()};
 const vt=views.tarot;views.tarot=()=>{drLast='tarot/'+tab();return vt()}}
document.addEventListener('input',e=>{const t=e.target;if(t.id==='dt'&&V.sec==='discover'){drDraft().text=t.value;clearTimeout(drDraft.t);drDraft.t=setTimeout(save,600);if(t.rows<8&&t.scrollHeight>t.clientHeight)t.rows=Math.min(12,t.rows+2)}
 else if(t.id==='drq'){V.drQ=t.value;const l=$('#drlist');if(l)l.innerHTML=drArchiveList(t.value)}});
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-dr]');if(!t)return;const a=t.dataset.dr,keepText=()=>{const x=$('#dt');if(x){drDraft().text=x.value;save()}};
 if(a==='mood'){keepText();const D=drDraft();D.mood=D.mood===t.dataset.v?'':t.dataset.v;save();return render()}
 if(a==='mic'){if(!C.user)return toast('Sign in to speak your dream');keepText();V.dream.text=drDraft().text;return voiceRec('dream')}
 if(a==='go')return drExplore();
 if(a==='later'){keepText();const D=drDraft(),text=D.text.trim();if(text.length<3)return toast('Write a few words of your dream first.');
  const d={id:uuid(),day:dkey(),at:new Date().toISOString(),text,mood:D.mood,symbols:[],interp:null,note:''};drStore(d);S.dreamDraft={text:'',mood:''};save();toast('Saved in your Dream Archive, to explore later');return render()}
 if(a==='save'){drSavePending();return render()}
 if(a==='new'){if(drPending())drSavePending();V.drShow=null;render();window.scrollTo(0,0);const x=$('#dt');if(x)x.focus();return}
 if(a==='journal'){let d=drPending();if(d&&d.id===t.dataset.id)d=drSavePending();return openEntry('bk:dream:'+t.dataset.id)}
 if(a==='fam'){V.drOpenK=t.dataset.k;V.drRange='30';return go('discover','dream-patterns')}
 if(a==='range'){V.drRange=t.dataset.v;return render()}
 if(a==='edit'){V.drEdit=t.dataset.id;return render()}
 if(a==='keepedit'||a==='reread'){const d=dreams().find(x=>x.id===t.dataset.id);if(!d)return;const x=$('#dte');if(x&&x.value.trim())d.text=x.value.trim();V.drEdit=null;
  if(a==='keepedit'){drUpdate(d);toast('Your dream is updated');return render()}
  V.drBusy=true;render();drRead(d.text,d.mood).then(I=>{V.drBusy=false;d.interp=I;drUpdate(d);render();window.scrollTo(0,0)});return}
 if(a==='pat'){const d=dreams().find(x=>x.id===t.dataset.id);if(!d)return;d.noPat=!d.noPat;drUpdate(d);toast(d.noPat?'This dream is kept out of your patterns':'This dream is part of your patterns again');return render()}
 if(a==='del'){V.drDel=t.dataset.id;return render()}
 if(a==='delno'){V.drDel=null;return render()}
 if(a==='delyes'){const b=drBm(t.dataset.id);if(b){S.bookmarks.splice(S.bookmarks.indexOf(b),1);save();C.deleteBookmark&&C.deleteBookmark('dream',b.ref)}V.drDel=null;toast('The dream is deleted');return goBack()}
});
document.addEventListener('click',e=>{if(e.target.closest('[data-act=drask]')){$('#toast').hidden=true;go('discover','dreams')}});
document.addEventListener('toggle',e=>{const d=e.target;if(d.classList&&d.classList.contains('dr-pat'))V.drOpenK=d.open?d.dataset.k:(V.drOpenK===d.dataset.k?null:V.drOpenK)},true);

document.addEventListener('input',e=>{const t=e.target;if(t.id==='ssn'){const v=t.value.replace(/[^0-9:]/g,'');if(v!==t.value)t.value=v;ssN().num=v}else if(t.id==='ssc')ssN().ctx=t.value;else if(t.id==='sst')ssS().text=t.value});
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-ss]');if(!t)return;const a=t.dataset.ss;
 if(a==='num'){ssN().num=t.dataset.v;return render()}
 if(a==='numgo')return ssReadNumber();
 if(a==='feel'){const F=ssS();F.feel=F.feel===t.dataset.v?'':t.dataset.v;return render()}
 if(a==='syncgo')return ssReadSync();
 if(a==='mic'){if(!C.user)return toast('Sign in to describe it by voice');const x=$('#sst');if(x)ssS().text=x.value;return voiceRec('sync')}
 if(a==='open'){const d=ssGet(t.dataset.id);if(!d)return;V.sheet=null;V.ssId=d.id;return go('discover',d.type==='number'?'number':'sync-reading')}
 if(a==='keep'){const d=ssGet(t.dataset.id);if(d)ssToJournal(d);return}
 if(a==='refl'){const d=ssGet(t.dataset.id);if(d){if(!ssList().some(x=>x.id===d.id))ssKeep(d);rdReflect('sign:'+d.id)}return}
 if(a==='range'){V.ssRange=t.dataset.v;return render()}
 if(a==='pat'){V.ssPat=t.dataset.k;return go('discover','pattern')}
 if(a==='snap'){const R=ssRange(),p=(ssPatterns(R).list.find(x=>x.k===V.ssPat)||ssPatterns('all').list.find(x=>x.k===V.ssPat));if(!p)return;const th=p.t,nm=p.num?SS_NUM[N.reduce(p.name.split('').reduce((a,b)=>a+ +b,0)).n]:null;
  ssKeepSnap({type:'pattern',title:`The Thread of ${p.name}`,line:p.srcs.map(([k,n])=>`${SS_SRC[k]} ${n}`).join(' · '),text:p.it.map(e=>e.title).join(', '),themes:th?[th.id]:[],parts:[['Where It Appeared',`${p.name} appeared ${ssTimes(p.n)}${R==='all'?'':' in the last '+R+' days'}: `+p.it.map(e=>`${e.title} (${SS_SRC[e.src]}, ${ymdLong(e.day,{day:'numeric',month:'long'})})`).join('; ')+'.'],['What It May Mean',th?th.m:(nm?nm[1]:'')]],q:th?th.q:(nm?nm[3]:'')});return}
 if(a==='savelp'||a==='savenw'){if(a==='savelp'){if(!hasBirthDate())return;const L=N.lifePath(S.birth.date).r.n,M=N.MEANING[L],X=LPX[L]||LPX[L%9||9];ssKeepSnap({type:'numerology',which:'lp',title:`Your Life Path — ${L}`,line:M[1].split(/,\s*/).map(cap).join(' · '),text:M[0],parts:[['The Archetype',M[0]],['Essence',M[2]],['Natural Strengths',X[0]],['Challenges',X[1]],['Relationships',LPREL[L]||LPREL[L%9||9]],['Purpose & Growth',X[2]]],q:LPQ[L]||LPQ[L%9||9]})}
  else{const x=nameNums(S.fullName);if(!x)return;const m=k=>x[k]&&x[k].r.n?`${x[k].r.n} · ${N.MEANING[x[k].r.n][0]}: ${N.MEANING[x[k].r.n][1]}.`:'';ssKeepSnap({type:'numerology',which:'nw',title:`The Name Within — ${x.expression.r.n}`,line:[x.expression,x.soul,x.personality].map(y=>y&&y.r.n).filter(Boolean).join(' · '),text:S.fullName,parts:[['Expression Number',m('expression')],['Soul Urge Number',m('soul')],['Personality Number',m('personality')]],q:'Which quality in my name am I ready to live more fully?'})}return}
});
// ---- the Moon and the Sun, each a full-screen page painted from the user's pictures; the words are today's sky ----
// the hemisphere follows where the phone is: its time zone (set by the phone from its location) and the latitude the
// IANA time zone database gives that zone; every zone south of the equator is listed
const SOUTHZ=new Set('Africa/Addis_Ababa|Africa/Asmara|Africa/Asmera|Africa/Blantyre|Africa/Brazzaville|Africa/Bujumbura|Africa/Dar_es_Salaam|Africa/Djibouti|Africa/Gaborone|Africa/Harare|Africa/Johannesburg|Africa/Kampala|Africa/Kigali|Africa/Kinshasa|Africa/Luanda|Africa/Lubumbashi|Africa/Lusaka|Africa/Maputo|Africa/Maseru|Africa/Mbabane|Africa/Mogadishu|Africa/Nairobi|Africa/Windhoek|America/Araguaina|America/Argentina/Buenos_Aires|America/Argentina/Catamarca|America/Argentina/ComodRivadavia|America/Argentina/Cordoba|America/Argentina/Jujuy|America/Argentina/La_Rioja|America/Argentina/Mendoza|America/Argentina/Rio_Gallegos|America/Argentina/Salta|America/Argentina/San_Juan|America/Argentina/San_Luis|America/Argentina/Tucuman|America/Argentina/Ushuaia|America/Asuncion|America/Bahia|America/Belem|America/Buenos_Aires|America/Campo_Grande|America/Catamarca|America/Cordoba|America/Coyhaique|America/Cuiaba|America/Eirunepe|America/Fortaleza|America/Guayaquil|America/Jujuy|America/La_Paz|America/Lima|America/Maceio|America/Manaus|America/Mendoza|America/Montevideo|America/Noronha|America/Porto_Acre|America/Porto_Velho|America/Punta_Arenas|America/Recife|America/Rio_Branco|America/Rosario|America/Santarem|America/Santiago|America/Sao_Paulo|Antarctica/Casey|Antarctica/Davis|Antarctica/DumontDUrville|Antarctica/Macquarie|Antarctica/Mawson|Antarctica/McMurdo|Antarctica/Palmer|Antarctica/Rothera|Antarctica/South_Pole|Antarctica/Syowa|Antarctica/Troll|Antarctica/Vostok|Asia/Dili|Asia/Jakarta|Asia/Jayapura|Asia/Makassar|Asia/Pontianak|Asia/Ujung_Pandang|Atlantic/South_Georgia|Atlantic/St_Helena|Atlantic/Stanley|Australia/ACT|Australia/Adelaide|Australia/Brisbane|Australia/Broken_Hill|Australia/Canberra|Australia/Currie|Australia/Darwin|Australia/Eucla|Australia/Hobart|Australia/LHI|Australia/Lindeman|Australia/Lord_Howe|Australia/Melbourne|Australia/NSW|Australia/North|Australia/Perth|Australia/Queensland|Australia/South|Australia/Sydney|Australia/Tasmania|Australia/Victoria|Australia/West|Australia/Yancowinna|Brazil/Acre|Brazil/DeNoronha|Brazil/East|Brazil/West|Chile/Continental|Chile/EasterIsland|Indian/Antananarivo|Indian/Chagos|Indian/Christmas|Indian/Cocos|Indian/Comoro|Indian/Kerguelen|Indian/Mahe|Indian/Mauritius|Indian/Mayotte|Indian/Reunion|Pacific/Apia|Pacific/Auckland|Pacific/Bougainville|Pacific/Chatham|Pacific/Chuuk|Pacific/Easter|Pacific/Efate|Pacific/Enderbury|Pacific/Fakaofo|Pacific/Fiji|Pacific/Funafuti|Pacific/Galapagos|Pacific/Gambier|Pacific/Guadalcanal|Pacific/Kanton|Pacific/Marquesas|Pacific/Midway|Pacific/Nauru|Pacific/Niue|Pacific/Norfolk|Pacific/Noumea|Pacific/Pago_Pago|Pacific/Pitcairn|Pacific/Pohnpei|Pacific/Ponape|Pacific/Port_Moresby|Pacific/Rarotonga|Pacific/Samoa|Pacific/Tahiti|Pacific/Tongatapu|Pacific/Truk|Pacific/Wallis|Pacific/Yap|US/Samoa'.split('|'));
const SOUTH=()=>SOUTHZ.has(TZ()||'');
const MPH={'New Moon':['The Moon is new, dark and resting between cycles. The sky is quiet: the perfect soil for a fresh beginning and a wish whispered softly.',['Name one thing you want to begin.','Rest more than usual and listen inward.','Clear a small space, on your desk or in your day.'],'The Seed Intention','Write one wish on a slip of paper, fold it twice and keep it close. Read it again when the Moon is full.'],
 'Waxing Crescent':['A first thin light returns. The Moon is waxing, and what you planted begins to stir: small, fragile and full of promise.',['Take the smallest first step towards your wish.','Protect new ideas from too many opinions.','Notice one sign of progress, however small.'],'The First Light Ritual','Light a candle at dusk, say your intention aloud once, then name one small step you will take tomorrow.'],
 'First Quarter':['The Moon is half lit and growing. This is a point of decision: energy rises, and so do the first obstacles asking how much you want it.',['Make one decision you have been postponing.','Meet a challenge with patience, not force.','Adjust your plan rather than abandon it.'],'The Courage Ritual','Stand by a window, breathe slowly three times, and write the one choice that would move you forward today.'],
 'Waxing Gibbous':['The Moon is waxing, building towards fullness. Its light is growing, bringing momentum, clarity and a desire to complete what you’ve been working on.',['Finish or move forward with something important.','Refine the details before the Full Moon.','Support your wellbeing with nourishing, simple choices.'],'The Release & Refine Ritual','Write down what you’re ready to release (a habit, worry or pattern), then rewrite it as a positive intention, such as “I choose clarity and balance”.'],
 'Full Moon':['The Moon is full, its whole face lit by the Sun. Feelings run high and what was hidden comes to light: a moment of culmination and gratitude.',['Celebrate one thing that has grown.','Let strong feelings pass before you act on them.','Share your light: call someone you love.'],'The Moonlight Gratitude Ritual','Sit in the moonlight or by a window, write three things you are grateful for, and read them aloud softly.'],
 'Waning Gibbous':['The Moon has passed its fullness and begins to wane. Its light turns gentle, inviting you to share what you’ve learned and to give thanks.',['Share something you’ve learned with someone.','Thank someone who helped you.','Slow down and digest what this cycle brought.'],'The Sharing Ritual','Write a short note of thanks to someone, or to yourself, for what this cycle taught you, then keep it or send it.'],
 'Last Quarter':['The Moon is half lit and waning. It is a time of turning: releasing what no longer fits, and making room before the next beginning.',['Let go of one task, habit or worry.','Forgive a small mistake, yours or someone else’s.','Tidy one corner of your home or mind.'],'The Letting Go Ritual','Write what you are ready to release, tear the paper gently, and let it go with one long, slow breath.'],
 'Waning Crescent':['Only a thin light remains as the Moon wanes towards new. The cycle is closing: a time for rest, surrender and quiet dreaming.',['Rest without guilt.','Keep your plans light and gentle.','Notice your dreams and write one down.'],'The Rest Ritual','Before sleep, dim the lights, place a hand on your heart, and thank this cycle for everything it carried.']};
const MSG={aries:['A time for courage, action and fresh starts.','the Moon stirs courage and a wish to act on instinct'],taurus:['A time for comfort, calm and simple pleasures.','the Moon seeks steadiness, rest, beauty and security'],gemini:['A time for curiosity, words and connection.','the Moon quickens the mind, with a need to talk, learn and connect'],cancer:['A time for home, care and tenderness.','the Moon is at home, bringing sensitivity and a need for closeness'],leo:['A time for warmth, play and self-expression.','the Moon wants to shine, create and be appreciated'],virgo:['A time for clarity, order and self-care.','the Moon highlights organisation, wellbeing and the details of daily life'],libra:['A time for harmony, beauty and partnership.','the Moon seeks balance, beauty and gentle connection'],scorpio:['A time for depth, truth and transformation.','the Moon goes deep, asking for trust, honesty and real connection'],sagittarius:['A time for hope, freedom and adventure.','the Moon lifts the spirit, longing for space, meaning and something new'],capricorn:['A time for focus, structure and patience.','the Moon turns steady, with a need to plan and build what lasts'],aquarius:['A time for ideas, friendship and freedom.','the Moon looks ahead, seeking independence and like-minded friends'],pisces:['A time for dreams, intuition and compassion.','the Moon softens everything, and intuition and dreams grow strong']};
const SSG={aries:['A time to begin, act boldly and ignite new paths.','The Sun is in Aries, the first sign of the zodiac, bringing fresh fire, courage and the energy to start again.','this season favours bold beginnings, independence and acting on what excites you.',['Start the thing you keep postponing.','Move your body and spend your energy well.','Choose courage over perfection once today.']],
 taurus:['A time to slow down, savour and build steadily.','The Sun is in Taurus, grounding its light in the body and the senses. It brings patience, steadiness and a love of simple beauty.','this season favours patience, comfort, money matters and building something solid.',['Enjoy one simple pleasure slowly.','Tend your finances or a practical goal.','Spend time in nature or work with your hands.']],
 gemini:['A time to learn, connect and follow your curiosity.','The Sun is in Gemini, lighting the mind with curiosity and conversation. Ideas move quickly, and connections multiply.','this season favours learning, writing, short journeys and new conversations.',['Learn one new thing today.','Reach out to someone you haven’t spoken to in a while.','Write down an idea before it flies away.']],
 cancer:['A time to nurture home, family and the heart.','The Sun is in Cancer, turning its light towards home and the heart. It brings tenderness, memory and a wish to protect.','this season favours home, family, emotional care and gentle beginnings.',['Make your home feel a little softer.','Call someone who feels like family.','Care for yourself as you would a loved one.']],
 leo:['A time to shine, create and open the heart.','The Sun is in Leo, its own sign, shining warm and generous. It brings confidence, creativity and joy in being seen.','this season favours creativity, romance, play and expressing who you are.',['Create something just for joy.','Give a compliment generously.','Let yourself be seen in something you love.']],
 virgo:['A time to refine, organise and prepare for a new cycle.','The Sun is in Virgo, shining its light on clarity, practical action and meaningful progress. It brings a focused, grounded energy.','the Sun in Virgo supports practicality, healthier routines and turning good intentions into real results.',['Focus on what truly matters and simplify the rest.','Bring structure to a key area of your life (work, health, home or habits).','Take practical steps towards a goal you’ve been planning.']],
 libra:['A time to find balance, beauty and harmony.','The Sun is in Libra, seeking balance between self and others. It brings grace, fairness and a love of beauty.','this season favours partnership, diplomacy, art and restoring balance where life has tilted.',['Restore balance in one area of your life.','Make peace, or make amends, with someone.','Bring a little beauty into your space.']],
 scorpio:['A time to go deeper, release and transform.','The Sun is in Scorpio, drawing its light inward and down. It brings intensity, honesty and the courage to transform.','this season favours depth, truth, intimacy and letting go of what has run its course.',['Be honest about one thing you feel.','Let go of something that drains you.','Spend some time in quiet reflection.']],
 sagittarius:['A time to explore, believe and widen your horizons.','The Sun is in Sagittarius, lighting the road ahead with optimism. It brings adventure, faith and a hunger for meaning.','this season favours learning, travel, big-picture thinking and following what inspires you.',['Plan something to look forward to.','Read or learn something that widens your view.','Say yes to one small adventure.']],
 capricorn:['A time to plan, commit and build what lasts.','The Sun is in Capricorn, steady and determined. It brings structure, ambition and the patience to climb step by step.','this season favours goals, responsibility, career and laying strong foundations.',['Set one clear goal for the months ahead.','Finish a task you have been carrying.','Honour your limits as well as your ambitions.']],
 aquarius:['A time to dream ahead, connect and be yourself.','The Sun is in Aquarius, bright with ideas and new possibilities. It brings independence, friendship and vision.','this season favours friendship, community, original ideas and the freedom to be yourself.',['Try a new way of doing something familiar.','Connect with a friend or a group you love.','Write down one hope for the future.']],
 pisces:['A time to dream, soften and trust your intuition.','The Sun is in Pisces, the last sign of the zodiac, dissolving edges and softening the heart. It brings intuition and compassion.','this season favours rest, imagination, spirituality and closing a cycle gently.',['Make time for music, art or quiet.','Trust a gentle intuition today.','Rest before the next cycle begins.']]};
const SRIT={Fire:['The Flame Ritual','At sunrise or sunset, light a candle, name one thing you want to bring alive this season, and take one step towards it today.'],Earth:['The Clarity Ritual','In the sunlight (or by a window), set a clear intention for this season. Write it down, then note one practical step you can take today to begin.'],Air:['The Breath Ritual','Open a window, breathe slowly for a minute, and write down one idea you want to follow this season. Read it aloud once.'],Water:['The Water Ritual','Wash your hands slowly in warm water, name one feeling you want to honour this season, and let the rest flow away.']};
const SEAS=['Early Spring','Spring in Bloom','Late Spring into Summer','Early Summer','High Summer','Late Summer into Autumn','Early Autumn','Deep Autumn','Late Autumn into Winter','Early Winter','Deep Winter','Late Winter into Spring'];
const tx=(cls,x,y,w,h,html,f)=>`<div class="spx ${cls}" data-f="${f}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;font-size:${f}px">${html}</div>`;
const spBar=()=>`<button class="rit-hot" data-skx aria-label="Back to the Sky" style="left:44px;top:89px;width:72px;height:72px"></button><button class="rit-hot" data-go="you" aria-label="My Cosmos" style="left:907px;top:89px;width:72px;height:72px"></button>`;
const dots=a=>a.map(x=>`<div class="spb">${x}</div>`).join('');
// the cards, lifted from the painting: [left, top, width, height] in the painting, the slices that keep their rims and titles
// whole as they grow (top, right, bottom, left), where their words start, and their icons [x, y, w, h]
// ---- the Sky's pages (Moon, Sun, each planet): one frame, one header, one set of cards ----
// every page shares the Moon page's painted frame, arc and buttons; the title and subtitle are set the same on each, and
// the four cards are the Moon page's own: all one size, growing only when their words need more room
const SPH=[1744,1984,2240],SKT=[[49,924,70],[49,924,64],[49,924,66]],SKL=185,SKX=194,SKHB=180,SKRH=183;
// each page's icons for the cards [file prefix, [w,h] each], set in the middle of the card's round end
const SKI={moon:['moon',[[124,88],[98,100],[124,84]]],sun:['sun',[[124,65],[101,100],[124,77]]],pl:['pl',[[118,100],[101,100],[124,79]]]};
const skHead=(title,sub)=>`${tx('sk-t',182,138,660,98,title,82)}${tx('sk-k',112,252,800,34,sub,25)}`;
// the four cards: one size, tall enough for their words, round at both ends, spread evenly down the screen
const SKC=250;
function spCards(n,bodies,rit){
 const [f,ics]=SKI[n];
 return `${[0,1,2].map(k=>{const [iw,ih]=ics[k];
  return `<div class="spc" data-k="${k}" style="left:49px;top:0;width:924px;height:${SKC}px;background-image:url(${SKY}sp-c${k}.webp)">
   <img class="spi" src="${SKY}sp-${f}-i${k}.webp" alt="" style="left:${125-iw/2}px;top:${128-ih/2}px;width:${iw}px;height:${ih}px">
   ${tx('sp-b'+(k===2?' sp-l':''),SKX,74,672,SKC-74-30,bodies[k],k===2?35:36)}</div>`}).join('')}
  <div class="spc spr" data-k="3" style="left:49px;top:0;width:924px;height:${SKC}px;background-image:url(${SKY}sp-c3.webp)">
   <img class="spi" src="${SKY}sp-rit-bowl.webp" alt="" style="left:60px;top:10px;width:130px;height:156px">${rit}</div>`;
}
const skRit=(name,desc)=>`${tx('sp-rt',198,52,318,62,'Optional Ritual',44)}${tx('sp-rn',198,118,318,60,name,33)}${tx('sp-rd',566,26,300,SKC-52,desc,32)}`;
function skLay(t,n,sc,hr,H){
 const ch=SPH.reduce((a,b)=>Math.abs(Math.log(b/hr))<Math.abs(Math.log(a/hr))?b:a),sy=H/ch,k=sy/sc;
 t.style.setProperty('--img',`url(${SKY}${n==='pl'?'pl-bg':'sp-'+n}-${ch}.webp)`);
 const cards=[...t.querySelectorAll('.spc')],top0=n==='pl'?300*k:642*k,fl=t.querySelector('.sk-fl'),bottom=hr*(n==='pl'?.92:.965)-(fl?SKF:0),room=bottom-top0;if(fl)fl.style.top=(bottom+SKF-SKFH)+'px';
 let fs,gap,y;
 if(n==='pl'){fs=Math.min(1,(room-380)/(4*SKC+3*16));gap=16*fs;y=bottom-(4*SKC*fs+3*gap)}
 else{fs=Math.min(1,(room-5*12)/(4*SKC));gap=(room-4*SKC*fs)/5;y=top0+gap}
 cards.forEach(c=>{c.style.top=y+'px';c.style.transform=fs<1?`scale(${fs})`:'';y+=SKC*fs+gap});
 if(n==='pl'){const Z=bottom-(4*SKC*fs+3*gap)-14-top0,cy=top0+Z/2,ph=Math.min(Z*1.02,600),cf=Math.min(1,Z/300);
  const p=t.querySelector('.plp');if(p){const r=+p.dataset.r,h=r>1?Math.min(ph*.7,700/r):ph,w=h*r;p.style.cssText=`left:${512-w/2}px;top:${cy-h/2}px;width:${w}px;height:${h}px`}
  const g=t.querySelector('.plg');if(g){const s=Math.min(ph*.24,130);g.style.cssText=`left:${512-s/2}px;top:${cy-s/2}px;width:${s}px;height:${s}px`}
  t.querySelectorAll('.plx [data-cy]').forEach(e=>{e.style.top=(cy+ +e.dataset.cy*cf)+'px';e.style.transformOrigin='50% 0';e.style.transform=cf<1?`scale(${cf})`:''})}
 return {ch,th:ch,sy};
}
function moonPop(){
 const now=new Date(),m=K.moon(now),si=sIdx(m.sign),r=skyRel(m.sign),ph=MPH[m.name],[l1,l2]=m.name.split(' ');
 const nx=(K.lunarPhases(now,new Date(+now+40*DAY))||[]).find(e=>e.date>now&&!(m.name.startsWith(e.name.replace(' Moon','').split(' ')[0])&&m.name.includes(e.name.split(' ')[0])&&+e.date-now<4*DAY)),nn=nx?nx.name.replace(' Moon','').replace('New','New Moon').replace('Full','Full Moon'):'';
 const nd=nx?nx.date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:TZ()}):'';
 const k=m.ill,cx=510,cy=440,R=141,rx=Math.abs(1-2*k)*R,flip=(!m.waxing)!==SOUTH();
 const shade=k>.97?'':`<svg class="sp-ph" viewBox="0 0 1024 1000" style="left:0;top:0;width:1024px;height:1000px" aria-hidden="true"><defs><filter id="spb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter></defs><path filter="url(#spb)" transform="${flip?`translate(${2*cx} 0) scale(-1 1)`:''}" d="M${cx} ${cy-R}A${R} ${R} 0 0 0 ${cx} ${cy+R}A${rx} ${R} 0 0 ${k<.5?0:1} ${cx} ${cy-R}Z" fill="rgba(8,10,28,.85)"/></svg>`;
 const cards=`<div class="spw"><div class="spl">${spCards('moon',[ph[0],`In ${si.name}, ${MSG[si.id][1]}. For you it falls ${REL_IN[r.rel]}, so your feelings gather around ${areaShort(r.area)}.`,dots(ph[1])],skRit(ph[2],ph[3]))}${skFlow('moon')}</div></div>`;
 return pane('rmoon',`The Moon. ${m.name} in ${si.name}.`,'',`${shade}
  ${tx('sp-big',110,372,214,110,`${l1}<br>${l2||''}`,47)}${tx('sp-sm c',110,478,214,32,`${Math.round(k*100)}% Illuminated`,25)}
  <img class="sp-g" src="${SKY}sk-g-${si.id}.webp" alt="" style="left:741px;top:326px;width:48px;height:48px">
  ${tx('sp-h',818,318,150,40,`In ${si.name}`,33)}${tx('sp-sm',820,358,128,74,MSG[si.id][0],20)}
  ${tx('sp-h2',812,482,150,30,nn,27)}${tx('sp-sm',814,512,140,28,nd,21)}
  ${skHead('The Moon','EMOTIONS <i>•</i> NEEDS <i>•</i> RHYTHMS')}${spBar()}`,'',cards);
}
function sunPop(){
 const now=new Date(),si=sIdx(K.signIdx(K.positions(now)[0].lon)),r=skyRel(SIGNS.indexOf(si)),me=sg(S.sign),x=SSG[si.id],rt=SRIT[si.el];
 const seas=SEAS[(SIGNS.indexOf(si)+(SOUTH()?6:0))%12].replace(' into ','<br>into ');
 const cards=`<div class="spw"><div class="spl">${spCards('sun',[x[1],`For ${me.name}, the Sun is ${REL_IN[r.rel]}, lighting ${areaShort(r.area)}. For all signs, ${x[2]}`,dots(x[3])],skRit(rt[0],rt[1]))}${skFlow('sun')}</div></div>`;
 return pane('rsun',`The Sun in ${si.name}.`,'',`
  <img class="sp-g" src="${SKY}sk-g-${si.id}.webp" alt="" style="left:144px;top:362px;width:68px;height:68px">
  ${tx('sp-big',86,428,184,46,si.name,40)}${tx('sp-sm c',80,476,196,30,si.dates,22)}
  ${tx('sp-big s',774,362,192,72,seas,30)}${tx('sp-sm',826,452,152,104,x[0],20)}
  ${skHead('The Sun','IDENTITY <i>•</i> VITALITY <i>•</i> THE SEASON')}${spBar()}`,'',cards);
}
// ---- each planet: the same page (the user's Jupiter picture), only the planet, its symbol and its words changing ----
const PLK={Mercury:['COMMUNICATION','THINKING','LEARNING'],Venus:['LOVE','BEAUTY','VALUES'],Mars:['ENERGY','COURAGE','ACTION'],Jupiter:['GROWTH','OPPORTUNITY','EXPANSION'],Saturn:['DISCIPLINE','PATIENCE','LESSONS'],Uranus:['CHANGE','FREEDOM','AWAKENING'],Neptune:['DREAMS','INTUITION','SPIRIT'],Pluto:['TRANSFORMATION','DEPTH','REBIRTH']};
const PLV={Mercury:'turning your thoughts and words towards',Venus:'drawing love and pleasure towards',Mars:'firing your energy and courage towards',Jupiter:'expanding',Saturn:'asking for patience and commitment around',Uranus:'bringing change and fresh air to',Neptune:'softening and enchanting',Pluto:'slowly and deeply transforming'};
const SFL={aries:'courage, initiative and the drive to begin',taurus:'stability, comfort, values and what you build slowly',gemini:'curiosity, learning, conversation and connection',cancer:'home, family, feelings and the need to belong',leo:'creativity, joy, romance and self-expression',virgo:'health, routines, skill and useful service',libra:'relationships, harmony, beauty and fairness',scorpio:'depth, intimacy, trust and transformation',sagittarius:'travel, learning, faith and the search for meaning',capricorn:'ambition, structure, responsibility and lasting goals',aquarius:'friendship, community, ideas and freedom',pisces:'dreams, compassion, intuition and spirituality'};
const PLM={Mercury:'Conversations, plans and fresh ideas gather there: a good time to speak, write and learn.',Venus:'Affection, pleasure and harmony gather there: a time to enjoy, connect and soften.',Mars:'Your drive and desire gather there: a time to act boldly, with care for others.',Jupiter:'Doors open there through learning, generosity and saying yes to growth.',Saturn:'It asks for steady effort there: what you build patiently now will last.',Uranus:'Expect the unexpected there: freedom and new ways arrive, often suddenly.',Neptune:'Intuition and imagination grow there; keep your feet gently on the ground.',Pluto:'Something there is slowly being reborn: let go of what has run its course.'};
const PLD={Mercury:['Write down your ideas before they slip away.','Have the conversation you have been postponing.','Read, learn or listen to something new.'],
 Venus:['Spend time with someone who makes you feel at ease.','Bring a little beauty into your day.','Notice what you truly value, and honour it.'],
 Mars:['Move your body and spend your energy well.','Start one thing you have been hesitating over.','Pause before reacting when you feel heated.'],
 Jupiter:['Say yes to learning, courses or skills that excite you.','Expand your network and have meaningful conversations.','Stay curious and open to new opportunities, even unexpected ones.'],
 Saturn:['Choose one commitment and keep it faithfully.','Break a big goal into small, steady steps.','Rest as seriously as you work.'],
 Uranus:['Try a new way of doing something familiar.','Make room for a little freedom in your week.','Welcome a surprise instead of resisting it.'],
 Neptune:['Make time for music, art or quiet dreaming.','Write down your dreams and intuitions.','Keep healthy boundaries while you open your heart.'],
 Pluto:['Let go of one habit that no longer serves you.','Be honest with yourself about what you need.','Trust that endings make room for beginnings.']};
const PLR={Mercury:['The Clear Mind Ritual','Sit quietly with a notebook, write freely for five minutes, then circle the one idea that feels most alive.'],
 Venus:['The Self-Love Ritual','Light a candle, look kindly at yourself in a mirror, and name three things you love about who you are.'],
 Mars:['The Courage Ritual','Stand tall, breathe deeply three times, and name one brave action you will take today. Then take it.'],
 Jupiter:['The Expansion Ritual','Write down one area of your life you’d like to grow (e.g. career, travel, knowledge or abundance), then list 3 inspired actions to support it.'],
 Saturn:['The Foundation Ritual','Write one long-term goal, then the smallest step towards it you can take this week. Keep the paper where you will see it.'],
 Uranus:['The Awakening Ritual','Open a window, breathe in the fresh air, and write one way you would like to feel freer this month.'],
 Neptune:['The Dream Ritual','Before sleep, place a glass of water by your bed and ask a gentle question. In the morning, write what you remember.'],
 Pluto:['The Release Ritual','Write what you are ready to let go of, fold the paper away, and thank it for what it taught you.']};
const PRX={Mercury:'Re-read before you send, and revisit old plans.',Venus:'Revisit old loves and values with fresh eyes.',Mars:'Slow down, and let your energy rest before you act.',Jupiter:'Look back at how far you’ve grown before reaching further.',Saturn:'Review your commitments and keep only those that matter.',Uranus:'Let changes ripen inside before you act on them.',Neptune:'Clear away illusions gently, and trust what remains.',Pluto:'Look honestly at what still needs to be released.'};
const fdate=(d,yr)=>d.toLocaleDateString('en-GB',Object.assign({day:'numeric',month:'short',timeZone:TZ()},yr?{year:'numeric'}:{}));
// how long the planet stays in its sign this time: back to when it entered, forward to when it leaves
function plStay(P,now){
 const si=K.signIdx(K.lon(P,now)),st={Mercury:1,Venus:1,Mars:2,Jupiter:5,Saturn:10,Uranus:20,Neptune:30,Pluto:30}[P]*DAY,lim=40*365*DAY;
 const edge=dir=>{let t=+now,k=0;while(K.signIdx(K.lon(P,new Date(t+dir*st)))===si&&k<lim/st){t+=dir*st;k++}
  let a=t,b=t+dir*st;for(let i=0;i<30;i++){const m=(a+b)/2;if(K.signIdx(K.lon(P,new Date(m)))===si)a=m;else b=m}return new Date(a)};
 return [edge(-1),edge(1)];
}
// the planet pages fit the screen: the painting nearest its shape, the planet and the cards laid out in the room between
// the title and the Earth's horizon, the cards scaled down together only if a short screen needs it
const PLR_={saturn:2.08};
function planetPop(P){
 if(!PLK[P])P='Jupiter';
 const now=new Date(),k=P.toLowerCase(),sI=K.signIdx(K.lon(P,now)),si=sIdx(sI),r=skyRel(sI),me=sg(S.sign);
 const rx=(K.retrogrades(now,new Date(+now+400*DAY))||[]).find(w=>w.planet===P&&(!w.start||w.start<=now)&&(!w.end||w.end>=now));
 const [a,b]=plStay(P,now),sameY=a.getFullYear()===b.getFullYear();
 const dates=`${fdate(a,!sameY)} –<br>${fdate(b,true)}`;
 const happen=`${P} is in ${si.name}, ${PLV[P]} ${SFL[si.id]}.${rx?` It is retrograde now, turning inward: a time to review rather than push.`:''}`;
 const mean=`For ${me.name}, ${P} is ${REL_IN[r.rel]}, touching ${areaShort(r.area)}. ${PLM[P]}${RULER[S.sign]===P?` As your ruling planet, you feel it more than most.`:''}`;
 const todo=rx?[PRX[P],...PLD[P].slice(1)]:PLD[P];
 const cy=0,ry=y=>`data-cy="${y}"`,pc=(cls,x,y,w,h,html,f)=>tx(cls,x,0,w,h,html,f).replace('class="spx','data-cy="'+y+'" class="spx');
 const lay=`<div class="spw"><div class="spl plx">
  <img class="plp" src="${SKY}pl-p-${k}.webp" alt="" data-r="${PLR_[k]||1}">
  <img class="sp-g plg" src="${SKY}pl-g-${k}.webp" alt="">
  ${pc('sp-big pl-s',40,-132,188,40,'Current Sign',31)}
  <img class="sp-g" ${ry(-88)} src="${SKY}sk-g-${si.id}.webp" alt="" style="left:92px;width:84px;height:84px">
  ${pc('sp-big pl-n',40,-4,188,50,si.name,44)}${pc('sp-sm c pl-d',40,50,188,72,dates,27)}
  <img class="sp-g" ${ry(-120)} src="${SKY}pl-rx.webp" alt="" style="left:800px;width:190px;height:142px">
  ${pc('sp-sm c pl-r',796,24,186,40,rx?(rx.end?`Until ${fdate(rx.end,true)}`:'Retrograde now'):'Not Retrograde',27)}
  ${spCards('pl',[happen,mean,dots(todo)],skRit(PLR[P][0],PLR[P][1]))}${skFlow('pl:'+P)}
 </div></div>`;
 return pane('rpl',`${P} in ${si.name}.`,'',`
  ${skHead(P,PLK[P].join(' <i>•</i> '))}${spBar()}`,'',lay);
}
// ---- a sign's page (the user's Horoscope picture): its figure and constellation, Today, Weekly, Monthly or Annual, the
// reading and three areas of life on one parchment that grows with the words ----
const SGP=[['daily','Today','Today’s Horoscope'],['weekly','Weekly','This Week’s Horoscope'],['monthly','Monthly','This Month’s Horoscope'],['yearly','Annual','This Year’s Horoscope']];
const SGA=[['love','lily','Love &amp; Relationships'],['career','books','Career &amp; Purpose'],['health','stones','Wellbeing']];
const firstS=(t,n)=>{const m=String(t||'').replace(/\s+/g,' ').match(/[^.!?]+[.!?]+/g)||[String(t||'')];return m.slice(0,n).join(' ').trim()};
function signPop(){
 const id=V.exploreSign||S.sign,sn=sg(id),per=SGP.find(x=>x[0]===V.period)||SGP[0],pi=SGP.indexOf(per),cx=[170,402,634,866];
 const ov=horoscope(id,'overview',per[0]);
 const k5=x=>x.toLowerCase().replace(/[^a-z ]/g,'').split(' ').slice(0,5).join(' '),seen=new Set((String(ov.body||'').match(/[^.!?]+[.!?]+/g)||[]).map(x=>k5(x.trim())));
 const rows=SGA.map(([c,ic,l])=>{const all=(String(horoscope(id,c,per[0]).body||'').replace(/\s+/g,' ').match(/[^.!?]+[.!?]+/g)||[]).map(x=>x.trim());
  let pick=all.filter(x=>!seen.has(k5(x))).slice(0,2);if(!pick.length)pick=all.slice(0,2);pick.forEach(x=>seen.add(k5(x)));
  return `<div class="sg-row"><img src="${SKY}sg-ic-${ic}.webp" alt=""><i></i><div><div class="sg-l">${l}</div><div class="sg-x">${esc(pick.join(' '))}</div></div></div>`}).join('');
 return pane('rsg',`${sn.name}, ${per[2]}.`,'',`
  <img class="sg-t" src="${SKY}sg-top-${id}.webp" alt="">
  <div class="sg-m"></div><img class="sg-b" src="${SKY}sg-bot.webp" alt="">
  ${skHead('Horoscope','')}
  <img class="sp-g" src="${SKY}sk-g-${id}.webp" alt="" style="left:462px;top:296px;width:100px;height:100px">
  ${tx('sp-big sg-n',362,402,300,74,sn.name,66)}${tx('sp-sm c sg-d',372,480,280,46,sn.dates,34)}
  <button class="rit-hot" data-sga="pick" aria-label="Read another sign" style="left:676px;top:436px;width:296px;height:102px;border-radius:51px"></button>
  <img class="sg-pill" src="${SKY}sg-pill.webp" alt="" style="left:${cx[pi]-122}px">
  ${SGP.map(([k,l],i)=>`<button class="sg-tab${i===pi?' on':''}" data-sgp="${k}" aria-pressed="${i===pi}" style="left:${cx[i]-115}px">${l}</button>`).join('')}
  <div class="sg-pt">${per[2]}</div>
  <div class="sg-f"><div class="sg-body">${esc(ov.body)}</div>${rows}${sgFlow()}</div>
  ${spBar()}`,'');
}
function sgLay(t,hr){
 const f=t.querySelector('.sg-f'),h=f?f.scrollHeight:800,th=Math.max(2176,Math.ceil(hr),932+h+40+386);
 const m=t.querySelector('.sg-m');if(m){m.style.top='1246px';m.style.height=(th-870+60-1246)+'px';m.style.backgroundPosition=`0 60px`}
 const b=t.querySelector('.sg-b');if(b)b.style.top=(th-870)+'px';
 t.style.setProperty('--img','none');
 return {ch:th,th};
}
document.addEventListener('click',e=>{
 if(V.sec!=='horoscope'||V.skp!=='sign')return;
 const z=e.target.closest('.spk [data-act=tohoroscope]');if(z){e.stopImmediatePropagation();e.preventDefault();V.exploreSign=z.dataset.sign===S.sign?null:z.dataset.sign;V.spk=false;V.skpIn=true;return render()}
 const p=e.target.closest('[data-sgp]');if(p){e.stopImmediatePropagation();V.period=p.dataset.sgp;V.skpIn=true;const y=(document.querySelector('#rsg .rsc')||{}).scrollTop;render();const r=document.querySelector('#rsg .rsc');if(r&&y)r.scrollTop=y;return}
 if(e.target.closest('[data-sga=pick]')){e.stopImmediatePropagation();V.spk=true;return render()}
},true);
// each line of words is fitted to its place in the painting
function spFit(){document.querySelectorAll('.spx[data-f]').forEach(e=>{const d=e.style.display;e.style.display='block';let f=+e.dataset.f;e.style.fontSize=f+'px';while((e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1)&&f>11){f-=.5;e.style.fontSize=f+'px'}e.style.display=d})}
document.addEventListener('click',e=>{
 if(V.sec!=='horoscope')return;
 const o=e.target.closest('[data-skp]');if(o){V.skp=o.dataset.skp;V.skpIn=false;V.spo={};return render()}
 if(e.target.closest('[data-skx]')){V.exploreSign=null;const t=document.querySelector('#rov .rt');if(t)t.classList.remove('in');const ov=document.getElementById('rov');if(ov)ov.classList.remove('on');setTimeout(()=>{V.skp=null;render()},500)}
});
document.addEventListener('keydown',e=>{if(V.sec==='horoscope'&&V.skp&&e.key==='Escape'){V.skp=null;render()}});
{const vh=views.horoscope;views.horoscope=()=>(!A||!K||tab()==='sign')?vh():skyHome()}
{const vt=views.tarot;views.tarot=()=>tab()==='home'?oracleHome():vt()}
SECTIONS.home.label='Ritual';SECTIONS.home.tabs=[['today','Ritual']];
fit();
}
// With accounts enabled, only a saved session opens straight onto a page; everyone else starts at onboarding.
if(S.sign&&(!C.enabled||C.hasStoredSession())){applyLocation();if(!EMB&&V.sec!=='home'&&!onboarding()){V.sec='home';V.tab.home='today';history.replaceState(history.state,'','/')}}   // opening the app always lands on Todayelse V.sec='welcome';
render();
C.onError(()=>toast('Could not sync. Your changes are kept on this device.'));
C.onAuth(u=>{if(u)pullMerge();else render()});
C.init().then(u=>{
 if(u){if(C.recovering){V.sec='reset';render()}return pullMerge()}
 if(C.enabled&&!onboarding()){V.sec='welcome';render()}
}).catch(e=>console.error(e));
})();
