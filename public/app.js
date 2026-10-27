(function(){
'use strict';
const A = window.Astronomy, K = window.KosmiaSky, N = window.KosmiaNumbers;
const C = window.KosmiaCloud||{enabled:false,user:null,onAuth(){},onError(){},init:async()=>null};
const $ = (s,r=document)=>r.querySelector(s);
const esc = s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* crafted art from scripts/craft-images.mjs; falls back to the SVG symbols when absent */
const ART=window.KOSMIA_ART||{};
const pic=(kind,id,cls='art')=>(ART[kind]||[]).includes(id)?`<img class="${cls}" src="/art/${kind}/${id}.webp" alt="" loading="lazy">`:'';
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
const ORACLE=(window.KOSMIA_WHISPERS||[]).map(a=>({id:a[0],title:a[1],sym:a[2],msg:a[3],ref:a[4]}));
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
const fresh=()=>({email:'',sign:'',name:'',fullName:'',altName:'',birth:{date:'',time:'',unk:false,place:'',lat:'',lon:'',tz:''},birthConsent:false,
 revealed:{},days:{},saved:[],notes:{},matches:[],conns:[],readings:[],journal:[],bookmarks:[],
 notif:{on:false,time:'08:00',monthly:true,annual:true,events:false,sign2:'',whisper:false,quiet:false,quietFrom:'22:00',quietTo:'07:00'},
 settings:{tz:'',reduce:false,large:false,kPersonal:false,voiceOut:false,yMode:'auto'},intro:false});
let S=fresh();
try{const r=localStorage.getItem(KEY);if(r){const o=JSON.parse(r);S=Object.assign(fresh(),o);['birth','notif','settings'].forEach(k=>S[k]=Object.assign(fresh()[k],o[k]||{}))}}catch(e){}
// saved sign pairings from before Connections become zodiac connections
if(S.matches.length&&!S.conns.some(c=>c.kind==='zodiac')){S.matches.forEach(m=>S.conns.push({id:uuid(),kind:'zodiac',name:'',data:{a:m[0],b:m[1]},note:''}));}
S.readings.forEach(r=>{if(!r.id)r.id=r.rid||uuid()});
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const TZ=()=>S.settings.tz||DEVICE_TZ;

/* ---------- cloud sync (Supabase) ---------- */
const syncProfile=()=>C.saveProfile&&C.saveProfile({sign:S.sign,name:S.name,intro:S.intro,notif:S.notif,fullName:S.fullName,altName:S.altName,birth:S.birth,birthConsent:S.birthConsent,settings:S.settings});
const syncFortune=k=>C.saveFortune&&C.saveFortune(k,cardFor(k).id,S.saved.some(x=>x.date===k),S.notes[k]||'');
// Items confirmed on the server carry sy:true. On the next pull, a confirmed item missing from the server was deleted
// on another device and is dropped here; an unconfirmed one is new on this device and is uploaded.
function mergeList(local,remote,toLocal,push){
 const ids=new Set(remote.map(r=>r.id)),out=remote.map(r=>Object.assign(toLocal(r),{sy:true}));
 local.forEach(l=>{if(ids.has(l.id))return;if(l.sy)return;out.push(l);push(l).then(()=>{l.sy=true;save()})});
 return out;
}
async function pullMerge(){
 const u=C.user;if(!u)return;
 let R;try{R=await C.pull()}catch(e){return toast('Could not load your synced data')}
 S.email=u.email||S.email;
 const p=R.profile;
 if(p&&p.sign){S.sign=p.sign;S.name=p.name||S.name;S.intro=S.intro||p.intro_seen;if(p.notif)S.notif=Object.assign(S.notif,p.notif);
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
 S.journal=mergeList(S.journal,R.journal,r=>({id:r.id,day:r.day,kind:r.kind,title:r.title,body:r.body,at:r.created_at}),l=>C.saveJournal(l));
 // until the connections table exists, the older matches table still supplies saved pairings
 const remoteConns=R.connections.length||!R.matches.length?R.connections:[];
 S.conns=mergeList(S.conns,remoteConns,r=>({id:r.id,kind:r.kind,name:r.name,data:r.data,note:r.note,at:r.created_at}),l=>C.saveConnection(l));
 if(!R.connections.length&&R.matches.length)R.matches.forEach(m=>{if(!S.conns.some(c=>c.kind==='zodiac'&&c.data.a===m.sign_a&&c.data.b===m.sign_b))S.conns.push({id:uuid(),kind:'zodiac',name:'',data:{a:m.sign_a,b:m.sign_b},note:''})});
 S.bookmarks=mergeList(S.bookmarks,R.bookmarks,r=>({id:r.id,kind:r.kind,ref:r.ref,data:r.data,at:r.created_at}),l=>C.saveBookmark(l));
 save();
 if(S.sign&&(V.sec==='welcome'||V.sec==='join')){applyLocation();if(['welcome','join','reset'].includes(V.sec))V.sec='home'}
 render();
}

/* ---------- time helpers (always in the reader's time zone) ---------- */
const dkey=(d=new Date())=>K.ymdIn(TZ(),d);
const fmt=(o,d)=>new Intl.DateTimeFormat('en-GB',Object.assign({timeZone:TZ()},o)).format(d);
const long=d=>fmt({weekday:'long',day:'numeric',month:'long',year:'numeric'},d);
const evt=d=>fmt({weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'},d);
const shortD=d=>fmt({day:'numeric',month:'short',year:'numeric'},d);
// a calendar date (YYYY-MM-DD) shown as itself, whatever the time zone
const ymdLong=(k,o={weekday:'long',day:'numeric',month:'long',year:'numeric'})=>new Intl.DateTimeFormat('en-GB',Object.assign({timeZone:'UTC'},o)).format(new Date(k+'T12:00:00Z'));
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
 const per=K.period(period,TZ());
 return Object.assign({id:`${period}/${per.key}/${signId}/${cat}`,per},KosmiaForecast.write(K,signId,cat,period,per,TZ()));
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
function shuffle(a){a=a.slice();const r=new Uint32Array(a.length);crypto.getRandomValues(r);for(let i=a.length-1;i>0;i--){const j=r[i]%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}

/* ---------- sections, routes and the contextual footers ---------- */
// [route slug, label, footer icon (art/cats)]
const SECTIONS={
 home:{label:'Home',icon:'home',tabs:[['today','Today','today'],['insights','My Insights','insights'],['saved','Saved','saved'],['journal','Journal','reflections']]},
 horoscopes:{label:'Horoscopes',icon:'horoscopes',tabs:[['overview','Overview','general'],['love','Love','love'],['family','Family','family'],['health','Health','health'],['career','Career','career'],['money','Money','finance']]},
 oracle:{label:'Oracle',icon:'tarot',tabs:[['whispers','Whispers','today'],['tarot','Tarot','deck']]},
 affinity:{label:'Affinity',icon:'love',tabs:[['zodiac-match','Zodiac Match','match'],['soul-resonance','Soul Resonance','resonance'],['synastry','Synastry','aspects'],['connections','Connections','connections']]},
 blueprint:{label:'Blueprint',icon:'chart',tabs:[['profile','My Profile','profile'],['birth-chart','Birth Chart','chart'],['life-path','Life Path','lifepath'],['the-name-within','The Name Within','namewithin'],['my-cycles','My Cycles','cycles']]},
 cosmos:{label:'Cosmos',icon:'universe',tabs:[['calendar','Calendar','calendar'],['moon','Moon','moon'],['planets','Planets','planets'],['celestial-events','Celestial Events','upcoming']]},
 settings:{label:'Settings',tabs:[['account','Account','settings'],['notifications','Notifications','notifications'],['privacy','Privacy','privacy'],['display','Display','prefs']]}
};
const MAIN=['home','horoscopes','oracle','affinity','blueprint','cosmos'];
// earlier addresses and names keep working
const ALIAS={fortune:'/oracle/whispers',whispers:'/oracle/whispers','daily-fortune':'/oracle/whispers',tarot:'/oracle/tarot',love:'/affinity/zodiac-match','love-match':'/affinity/zodiac-match','name-match':'/affinity/soul-resonance',chart:'/blueprint/birth-chart','birth-chart':'/blueprint/birth-chart','name-numerology':'/blueprint/the-name-within','birth-numerology':'/blueprint/life-path',calendar:'/cosmos/calendar',universe:'/settings/account'};
const TAB_ALIAS={horoscopes:{general:'overview',finance:'money'}};
const V={sec:'welcome',tab:{},period:'daily',exploreSign:null,q:{},love:{a:'',b:'',done:false},res:{a:'',b:'',done:false},syn:{name:'',date:'',time:'',unk:true,place:'',lat:'',lon:'',tz:'',done:false},
 tarot:{spread:'one',q:'',stage:'setup',picks:[],drawn:null,deck:null},chartSel:null,paint:{},painting:false,say:null,auth:'up',busy:false,
 places:{},filter:{},search:'',edit:null,cal:{view:'list',month:'',day:''},evOpen:null,birthDraft:null};
const tab=()=>{const s=SECTIONS[V.sec];return s?(V.tab[V.sec]||s.tabs[0][0]):''};
const tabLabel=(sec,t)=>{const x=(SECTIONS[sec]||{tabs:[]}).tabs.find(x=>x[0]===t);return x?x[1]:''};
function pathFor(sec,t,q={}){
 const p=sec==='home'&&(!t||t==='today')?'/':`/${sec}/${t||SECTIONS[sec].tabs[0][0]}`;
 const qs=Object.entries(q).filter(([,v])=>v).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');
 return p+(qs?'?'+qs:'');
}
function applyLocation(){
 let path=location.pathname.replace(/\/+$/,'')||'/';
 const first=path.split('/')[1]||'';
 if(ALIAS[first]&&!SECTIONS[first]){path=ALIAS[first];history.replaceState(history.state,'',path+location.search)}
 if(/^\/oracle\/(readings|journal)$/.test(path)){path=path.endsWith('journal')?'/home/journal':'/home/saved';history.replaceState(history.state,'',path+location.search)}
 const [,sec='home',t='']=path.split('/'),q=Object.fromEntries(new URLSearchParams(location.search));
 if(!SECTIONS[sec]){V.sec='home';V.tab.home='today';return}
 V.sec=sec;let tt=(TAB_ALIAS[sec]||{})[t]||t;
 V.tab[sec]=SECTIONS[sec].tabs.some(x=>x[0]===tt)?tt:SECTIONS[sec].tabs[0][0];
 V.q=q;
 if(sec==='horoscopes'){V.period=PERIODS.some(p=>p[0]===q.period)?q.period:'daily';V.exploreSign=SIGNS.some(s=>s.id===q.sign)?q.sign:null}
 if(sec==='cosmos'){if(q.view)V.cal.view=q.view;if(q.month)V.cal.month=q.month}
}
// the query string mirrors the view's own choices, so a forecast or a month can be shared and reopened
function viewQuery(){
 if(V.sec==='horoscopes')return {period:V.period!=='daily'?V.period:'',sign:V.exploreSign&&V.exploreSign!==S.sign?V.exploreSign:''};
 if(V.sec==='cosmos'&&tab()==='calendar')return {view:V.cal.view!=='list'?V.cal.view:'',month:V.cal.view==='month'?V.cal.month:''};
 return {};
}
const syncUrl=()=>{const u=pathFor(V.sec,tab(),viewQuery());if(u!==location.pathname+location.search)history.replaceState(history.state,'',u)};
history.scrollRestoration='manual';
function go(sec,t,opt={}){
 stopAudio();V.edit=null;V.tpop=null;V.spop=null;V.jpage=null;
 history.replaceState(Object.assign({},history.state,{scroll:scrollY}),'');
 V.sec=sec;if(t)V.tab[sec]=t;
 if(SECTIONS[sec])history[opt.replace?'replaceState':'pushState']({scroll:0},'',pathFor(sec,tab(),viewQuery()));
 render();window.scrollTo(0,0);
}
addEventListener('popstate',e=>{stopAudio();V.tpop=null;V.edit=null;if(!S.sign)return;applyLocation();render();const y=(e.state&&e.state.scroll)||0;requestAnimationFrame(()=>window.scrollTo(0,y))});

function toast(t){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2600)}
const panel=(h,cls='')=>`<section class="panel ${cls}"><div class="in">${h}</div></section>`;
// sign grid with the horoscope page's illustrated icons (art/icons) and names, no boxes; attr picks data-sign or data-sign2
const signGrid=(name,sel,attr='sign')=>`<div class="signs sign-grid" role="radiogroup" aria-label="${name}">${SIGNS.map(s=>`<button class="chip" role="radio" aria-checked="${sel===s.id}" data-${attr}="${s.id}">${pic('icons',s.id,'sign-ico')||`<span class="g glyph">${s.g}</span>`}<span class="sign-nm">${s.name}</span></button>`).join('')}</div>`;
// an engraved vignette (art/plates) that dissolves into its panel
const plate=(id,cls='')=>pic('plates',id,('plate '+cls).trim());
const needLib=()=>A&&K?'':panel('<h3>Astronomy library unavailable</h3><p>The ephemeris could not load, so astronomical data is not shown rather than guessed. Check your connection and reload.</p>');
const chips=(name,opts,sel,act)=>`<div class="fchips" role="radiogroup" aria-label="${name}">${opts.map(([k,l])=>`<button class="fchip" role="radio" aria-checked="${sel===k}" data-act="${act}" data-k="${k}">${l}</button>`).join('')}</div>`;
const seg=(opts,sel,attr)=>`<div class="seg" role="tablist">${opts.map(([k,l])=>`<button role="tab" aria-selected="${sel===k}" data-${attr}="${k}">${l}</button>`).join('')}</div>`;
const empty=(h,p,btn='')=>panel(`<h3>${h}</h3><p>${p}</p>${btn}`);
const linkBtn=(label,sec,t,cls='btn ghost')=>`<button class="${cls}" data-go="${sec}" data-t="${t||''}">${label}</button>`;
const isSaved=(kind,ref)=>S.bookmarks.some(b=>b.kind===kind&&b.ref===ref);

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
const nameNums=nm=>nm&&N.clean(nm)?N.name(nm,S.settings.yMode):null;

/* ---------- views ---------- */
const views={};
/* Onboarding poster. art/onboarding.webp is 1024x1536 with the wheel centred at (512,803), radii 488x520.
   It is shown in three slices: the title (rows 0-149), the blank band under it (rows 149-266, grown
   to hold the account form) and the wheel (rows 266-1536). The wheel's twelve panels pick the sign. */
const WHEEL={cx:512,cy:803,rx:488,ry:520,inner:.37};
function wedge(i){
 const {cx,cy,rx,ry,inner}=WHEEL,a0=(-105+30*i)*Math.PI/180,a1=a0+Math.PI/6;
 const p=(a,k)=>`${(cx+rx*k*Math.cos(a)).toFixed(1)} ${(cy+ry*k*Math.sin(a)).toFixed(1)}`;
 return `M${p(a0,1)}A${rx} ${ry} 0 0 1 ${p(a1,1)}L${p(a1,inner)}A${(rx*inner).toFixed(1)} ${(ry*inner).toFixed(1)} 0 0 0 ${p(a0,inner)}Z`;
}
const ART_SRC='/art/onboarding.webp';
views.join=()=>{
 const pick=V.joinSign||'',up=V.auth!=='in',acct=C.enabled&&!C.user;
 const form=C.user?`<p class="auth-alt">Signed in as ${esc(C.user.email||'')}. Choose your sign below.</p>`
  :`<input id="em" type="email" autocomplete="email" inputmode="email" placeholder="your@email.com" aria-label="Email address" value="${esc(S.email)}" required>
  ${acct?`<input id="pw" type="password" autocomplete="${up?'new-password':'current-password'}" placeholder="${up?'choose a password':'password'}" aria-label="Password" minlength="6" required>`:''}
  <p class="auth-err" id="authErr" role="alert"></p>
  ${acct?`<p class="auth-alt">${up?'Already have an account? <button type="button" class="link" data-act="authmode">Sign in</button>'
   :'New to Kosmia? <button type="button" class="link" data-act="authmode">Create an account</button> · <button type="button" class="link" data-act="forgot">Forgot password?</button>'}</p>`:''}`;
 return `<div class="stack"><div class="poster">
 <div class="ps ps-top"><img src="${ART_SRC}" alt="Kosmia"><p class="ps-sub">What If the Cosmos Is Listening?</p></div>
 <form class="ps ps-band" id="authForm" novalidate><div class="auth">${form}</div></form>
 <div class="ps ps-wheel"><img src="${ART_SRC}" alt="An engraved zodiac wheel with the sun at its centre and the twelve signs around it.">
 <svg class="wheel${pick?' has-pick':''}" viewBox="0 266 1024 1270" role="radiogroup" aria-label="Your zodiac sign">${SIGNS.map((x,i)=>`<path d="${wedge(i)}" data-sign="${x.id}" role="radio" tabindex="${(pick?pick===x.id:i===0)?0:-1}" aria-checked="${pick===x.id}" aria-label="${x.name}, ${x.dates}"><title>${x.name}</title></path>`).join('')}</svg>
 <button class="poster-btn" id="joinBtn" type="submit" form="authForm" disabled></button></div>
 </div></div>`;
};
views.reset=()=>`<div class="stack"><h1>Choose a new password</h1>${panel(`<div class="field"><label for="npw">New password</label><input id="npw" type="password" autocomplete="new-password" minlength="6"></div><button class="btn" data-act="setpw">Save password</button>`)}</div>`;
views.welcome=views.join;

/* ----- Home ----- */
// a small engraved moon showing the lit fraction (waxing lit on the right, as seen from the northern hemisphere)
// the painted phase (art/moons) for the Moon's current phase, falling back to the drawn disc
const moonPic=m=>pic('moons',m.name.toLowerCase().replace(/ /g,'-'),'moon-pic')||moonSvg(m);
function moonSvg(m,size=64){
 const r=28,k=Math.cos(m.ang*Math.PI/180),rx=Math.abs(k)*r,lit=m.waxing?1:0;
 const outer=`M50 ${50-r}A${r} ${r} 0 0 ${lit} 50 ${50+r}`,inner=`A${rx} ${r} 0 0 ${(k>0)===!lit?1:0} 50 ${50-r}`;
 return `<svg class="moon-svg" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="${r}" fill="#3A3026" opacity=".18" stroke="#8B6A3E" stroke-width="1"/><path d="${outer}${inner}Z" fill="#F3E6C8" stroke="#8B6A3E" stroke-width="1"/><circle cx="50" cy="50" r="${r}" fill="none" stroke="#8B6A3E" stroke-width="1.2"/></svg>`;
}
const nextEvent=now=>upcoming().find(e=>e.date>now);
views.home=()=>{
 const t=tab();
 if(t==='insights')return insights();
 if(t==='saved')return savedView();
 if(t==='journal')return journalView();
 if(!A||!K)return needLib();
 const sign=sg(S.sign),now=new Date(),c=todayCard(),rev=!!S.revealed[dkey()];
 const m=K.moon(now),h=horoscope(sign.id,'overview','daily'),ne=nextEvent(now);
 const pd=hasBirthDate()?(()=>{const [y,mo,d]=dkey().split('-').map(Number);return N.personalDay(S.birth.date,y,mo,d).r.n})():null;
 return `<div class="stack">
 <p class="quote thought">“${THOUGHTS[Number(dkey().replace(/-/g,''))%THOUGHTS.length]}”</p>
 <section class="today">${pic('scenes',sign.id,'today-art')}<div class="today-in"><div class="label">Your daily horoscope</div><h2>${long(now)}</h2>${h.focus?`<p class="h-focus">${esc(h.focus)}</p>`:''}<p>${esc(h.body)}</p><button class="btn" data-act="tohoroscope">Full forecast</button></div></section>
 <section class="whisper"><h2>A Whisper From the Cosmos</h2>${cardScene(c,rev,'homeCard')}${rev?`<div class="row whisper-acts"><button class="btn" data-go="oracle" data-t="whispers">Reflect on it</button></div>`:`<button class="btn" data-act="reveal">Reveal My Whisper</button>`}</section>
 <div class="cosmos">${panel(`<h2>Tonight’s Sky</h2>${plate('sky')}<div class="sky-row">${moonPic(m)}<div><p><strong>${m.name}</strong>, about ${Math.round(m.ill*100)}% lit, in ${sIdx(m.sign).name}.</p><p class="muted">The Sun is in ${sIdx(K.signIdx(K.lon('Sun',now))).name}.</p></div></div>${ne?`<div class="rule"></div><div class="label">Next in the sky</div><p><strong>${esc(ne.name)}</strong> · ${ne.dateOnly?shortD(ne.date)+' (approximate)':evt(ne.date)}</p>`:''}<button class="btn ghost" data-go="cosmos" data-t="calendar">Cosmic calendar</button>`,'glass')}</div>
 ${panel(pd?`<h2>Your Number Today</h2>${plate('numbers')}<div class="num-line"><span class="num">${pd}</span><p>A personal day of ${N.CYCLE[pd].replace(/^a year of /,'')}.</p></div>${linkBtn('My cycles','blueprint','my-cycles')}`:`<h2>Your Number Today</h2>${plate('numbers')}<p>Add your birth date to see your personal day number and Life Path.</p>${linkBtn('Add my birth date','blueprint','birth-chart')}`,'glass')}
 </div>`;
};
function insights(){
 const ch=myChart(),L=hasBirthDate()?N.lifePath(S.birth.date):null,nm=nameNums(S.fullName),yr=Number(dkey().slice(0,4));
 const last=S.readings.slice().sort((a,b)=>(b.at||b.date)>(a.at||a.date)?1:-1)[0],c=todayCard(),rev=!!S.revealed[dkey()];
 const row=(label,val,sec,t,missing)=>`<button class="ins" data-go="${sec}" data-t="${t}"><span class="label">${label}</span><span class="ins-v">${val||`<em class="muted">${missing}</em>`}</span></button>`;
 const moonV=ch?(ch.moonRange?`${sIdx(ch.moonRange[0]).name} or ${sIdx(ch.moonRange[1]).name}`:sIdx(ch.pl[1].sign).name):'';
 return `<div class="stack"><h1>My Insights</h1><p class="muted center">A summary of your readings. Each opens its full page.</p>
 ${panel(`<div class="label">Astrology</div>${plate('ins-astro')}${row('Chosen sign',sg(S.sign).name,'horoscopes','overview')}${row('Sun',ch?sIdx(ch.pl[0].sign).name:'','blueprint','birth-chart','Needs your birth date')}${row('Moon',moonV,'blueprint','birth-chart','Needs your birth date')}${row('Rising',ch&&ch.ang?sIdx(K.signIdx(ch.ang.asc)).name:'','blueprint','birth-chart',ch?'Needs birth time and place':'Needs birth date, time and place')}`)}
 ${panel(`<div class="label">Numerology</div>${plate('ins-numbers')}${row('Life Path',L?L.r.n+' · '+N.MEANING[L.r.n][0]:'','blueprint','life-path','Needs your birth date')}${row('Expression',nm?nm.expression.r.n+' · '+N.MEANING[nm.expression.r.n][0]:'','blueprint','the-name-within','Needs your full birth name')}${row('Soul Urge',nm&&nm.soul.r.n?nm.soul.r.n+' · '+N.MEANING[nm.soul.r.n][0]:'','blueprint','the-name-within','Needs your full birth name')}${row('Personal Year '+yr,hasBirthDate()?String(N.personalYear(S.birth.date,yr).r.n):'','blueprint','my-cycles','Needs your birth date')}`)}
 ${panel(`<div class="label">Oracle</div>${plate('ins-oracle')}${row('Today’s Whisper',rev?esc(c.title):'','oracle','whispers','Not revealed yet')}${row('Latest tarot reading',last?esc((SPREADS[last.spread]||{n:last.spread}).n)+' · '+ymdLong(last.date,{day:'numeric',month:'short'}):'','home','saved','No saved readings yet')}${row('Journal entries',String(S.journal.length+Object.values(S.notes).filter(Boolean).length),'home','journal')}`)}
 </div>`;
}
// Saved: every kept item as a card with its own artwork behind it as a watermark; Open shows it in full in a pop-up
const sunSign=date=>{try{return sIdx(K.chart({date,unk:true,tz:'UTC'}).pl[0].sign).id}catch(e){return ''}};
function connSigns(c){
 if(c.kind==='zodiac')return [c.data.a,c.data.b];
 if(c.kind==='synastry'&&K){const t=c.data.them||{},me=hasBirthDate()?sunSign(S.birth.date):S.sign,them=t.date?sunSign(t.date):'';return me&&them?[me,them]:[]}
 return [];
}
function findEvent(ref,iso){if(!K||!iso)return null;const d=new Date(iso);return K.events(new Date(+d-2*DAY),new Date(+d+2*DAY)).find(e=>evRef(e)===ref)||null}
// lunar events reuse the painted phases: "Full Moon", "First Quarter Moon", "Total Lunar Eclipse" (a full moon)
const phaseSlug=n=>/^New Moon/.test(n)?'new-moon':/^Full Moon|Lunar Eclipse/.test(n)?'full-moon':/^First Quarter/.test(n)?'first-quarter':/^Last Quarter/.test(n)?'last-quarter':'';
function savedItems(){
 const out=[];
 S.saved.forEach(x=>{const o=oc(x.id);if(o)out.push({kind:'whisper',date:x.date,title:o.title,sub:o.msg,ref:x.date,o})});
 S.readings.forEach(r=>out.push({kind:'tarot',date:r.date,title:(SPREADS[r.spread]||{n:r.spread}).n,sub:(r.q?'“'+r.q+'” · ':'')+r.cards.map(c=>c.name+(c.rev?' (reversed)':'')).join(', '),ref:r.id,r}));
 S.bookmarks.forEach(b=>{const d=b.data||{};if(b.kind==='horoscope')out.push({kind:'horoscope',date:d.start,title:`${sg(d.sign).name} · ${(HCATS.find(c=>c[0]===d.cat)||['',''])[1]} · ${cap(d.period||'')}`,sub:d.body,ref:b.ref,bk:b});else out.push({kind:'event',date:(d.date||'').slice(0,10),title:d.name,sub:d.when,ref:b.ref,bk:b})});
 S.conns.forEach(c=>out.push({kind:'connection',date:(c.at||'').slice(0,10),title:connTitle(c),sub:KIND_LABEL[c.kind],ref:c.id,c}));
 return out.sort((a,b)=>(b.date||'')>(a.date||'')?1:-1);
}
const wm=(imgs,cls='')=>(imgs=imgs.filter(Boolean)).length?`<div class="wm ${cls}" aria-hidden="true">${imgs.join('')}</div>`:'';
function savedArt(i){
 if(i.kind==='whisper')return wm([pic('whispers',i.o.id,'wm-i')]);
 if(i.kind==='tarot')return wm(i.r.cards.slice(0,3).map(c=>pic('deck',c.id,'wm-i card'+(c.rev?' rev':''))),'fan');
 if(i.kind==='horoscope')return wm([pic('scenes',(i.bk.data||{}).sign,'wm-i')]);
 if(i.kind==='event'){const p=phaseSlug(i.title);return wm([p?pic('moons',p,'wm-i round'):pic('plates','events','wm-i wide')])}
 const two=connSigns(i.c);
 if(two.length===2)return wm([pic('scenes',two[0],'wm-i'),pic('scenes',two[1],'wm-i flip')],'pair');
 return wm([pic('plates','locket','wm-i wide')]);
}
const signFig=id=>`<span class="pair-s">${pic('icons',id,'sign-ico')||`<span class="g glyph">${sg(id).g}</span>`}<span class="sign-nm">${sg(id).name}</span></span>`;
function savedHead(i){
 if(i.kind!=='connection')return `<h3>${esc(i.title)}</h3>${i.sub?`<p class="muted clamp">${esc(i.sub)}</p>`:''}`;
 const c=i.c,two=connSigns(c);
 if(two.length===2)return `${c.name?`<h3>${esc(c.name)}</h3>`:''}<div class="row pair sv-pair">${signFig(two[0])}<span class="amp" aria-hidden="true">+</span>${signFig(two[1])}</div><p class="muted center">${KIND_LABEL[c.kind]}</p>`;
 if(c.kind==='resonance'){const n=x=>{const r=N.clean(x)?N.name(x,S.settings.yMode).expression.r.n:0;return `<span class="pair-s"><span class="num">${r||'·'}</span><span class="sign-nm">${esc(String(x).split(' ')[0])}</span></span>`};
  return `<div class="row pair sv-pair">${n(c.data.a)}<span class="amp" aria-hidden="true">+</span>${n(c.data.b)}</div><p class="muted center">${KIND_LABEL[c.kind]}</p>`}
 return `<h3>${esc(i.title)}</h3><p class="muted">${KIND_LABEL[c.kind]}</p>`;
}
// Remove reuses each kind's own action, so the account copy is deleted too
const removeBtn=i=>{const [act,attr]=i.kind==='whisper'?['unsave',`data-k="${esc(i.ref)}"`]:i.kind==='tarot'?['delread',`data-id="${esc(i.ref)}"`]:i.kind==='connection'?['delconn',`data-id="${esc(i.ref)}"`]:['unbook',`data-kind="${i.bk.kind}" data-ref="${esc(i.bk.ref)}"`];
 return `<button class="btn ghost sm" data-act="${act}" ${attr}>Remove</button>`};
function savedView(){
 const f=V.filter.saved||'all',all=savedItems(),items=all.filter(i=>f==='all'||i.kind===f);
 const opts=[['all','All'],['whisper','Whispers'],['tarot','Tarot'],['horoscope','Horoscopes'],['event','Events'],['connection','Connections']];
 const pop=V.spop&&all.find(i=>i.kind===V.spop.kind&&i.ref===V.spop.ref);
 return `<div class="stack"><h1>Saved</h1>${chips('Show',opts,f,'fsaved')}${items.length?items.map(i=>`<article class="item sv">${savedArt(i)}<div class="sv-in"><div class="item-h"><span class="badge">${(opts.find(o=>o[0]===i.kind)||['',''])[1].replace(/s$/,'')}</span><span class="muted">${i.date?ymdLong(i.date,{day:'numeric',month:'short',year:'numeric'}):''}</span></div>${savedHead(i)}<div class="row"><button class="btn ghost sm" data-act="sopen" data-kind="${i.kind}" data-ref="${esc(i.ref)}">Open</button>${removeBtn(i)}</div></div></article>`).join(''):empty('Nothing saved here yet','Save a Whisper, a tarot reading, a forecast, a celestial event or a connection and it will gather here.')}${pop?savedPop(pop):''}</div>`;
}
// the pop-up for a saved item: the reading, card, forecast, event or comparison in full
function savedPop(i){
 const when=i.date?ymdLong(i.date,{day:'numeric',month:'long',year:'numeric'}):'';
 let h='';
 if(i.kind==='whisper'){const o=i.o,note=S.notes[i.date];
  h=`<div class="label center">Whisper · ${when}</div><h2 class="center">${esc(o.title)}</h2><div class="sv-card"><div class="scene flat"><div class="face front daily">${whisperFace(o)}</div></div></div>${o.ref?`<div class="label">Sit with it</div><p class="quote sm-q">${o.ref}</p>`:''}<div class="label">My reflection</div>${note?`<p class="pre">${esc(note)}</p>`:'<p class="muted">No reflection written.</p>'}`}
 else if(i.kind==='tarot'){const r=i.r;
  h=`<div class="label center">Tarot · ${when}</div><h2 class="center">${esc(i.title)}</h2>${r.q?`<p class="quote center sm-q">“${esc(r.q)}”</p>`:''}${r.cards.map(c=>{const d=DECK.find(x=>x.id===c.id)||{};return `<div class="sv-tc">${pic('deck',c.id,'sv-tarot'+(c.rev?' rev':''))}<div><div class="label">${esc(c.pos||'')}</div><h3>${esc(c.name)}${c.rev?' <em class="muted">reversed</em>':''}</h3><p class="small">${esc((c.rev?d.revm:d.upm)||'')}</p></div></div>`}).join('')}<div class="rule"></div><div class="label">My note</div>${r.note?`<p class="pre">${esc(r.note)}</p>`:'<p class="muted">No note kept with this reading.</p>'}`}
 else if(i.kind==='horoscope'){const d=i.bk.data||{};
  h=`<div class="label center">${(HCATS.find(c=>c[0]===d.cat)||['',''])[1]} · ${cap(d.period||'')}</div><h2 class="center">${sg(d.sign).name}</h2>${pic('icons',d.sign,'sign-ico center-ico')}${d.start?`<p class="muted center">${ymdLong(d.start,{day:'numeric',month:'long'})}${d.end&&d.end!==d.start?' – '+ymdLong(d.end,{day:'numeric',month:'long',year:'numeric'}):''}</p>`:''}${d.focus?`<p class="h-focus">${esc(d.focus)}</p>`:''}<p>${esc(d.body||'')}</p>`}
 else if(i.kind==='event'){const d=i.bk.data||{},e=findEvent(i.ref,d.date),x=e?evInfo(e):null,p=phaseSlug(i.title);
  h=`<div class="label center">Celestial event</div><h2 class="center">${esc(d.name||'')}</h2>${p?pic('moons',p,'moon-pic big'):''}<p class="muted center">${esc(d.when||'')}</p>${x?`<div class="label">Astronomy</div><p>${x.fact}</p><div class="label">Astrological symbolism</div><p>${x.sym}</p><div class="label">Reflection</div><p class="quote sm-q">${x.ref}</p>`:''}`}
 else{const c=i.c,sec=x=>`<section class="pop-sec">${x}</section>`;
  h=`<div class="label center">${KIND_LABEL[c.kind]}</div><h2 class="center">${esc(connTitle(c))}</h2>`+(c.kind==='zodiac'?matchBody(c.data.a,c.data.b)
   :c.kind==='resonance'?resonanceRows(c.data.a,c.data.b,sec)+resMethod()
   :!A||!K||!hasBirthDate()?'<p class="muted">Add your birth details in Blueprint to see this comparison.</p>':synBody(Object.assign({},c.data.them)))+(c.note?`<div class="rule"></div><div class="label">My note</div><p class="pre">${esc(c.note)}</p>`:'')}
 return `<div class="pop" role="dialog" aria-modal="true" aria-label="${esc(i.title)}" data-act="spopclose"><div class="pop-box sv-pop">${savedArt(i).replace('class="wm','class="wm pop-wm')}<button class="pop-x" data-act="spopclose" aria-label="Close">×</button><div class="sv-in">${h}</div></div></div>`;
}
// a tarot card's face: its painted artwork (art/deck) and the numeral and title set by the app
const tarotFace=c=>`${pic('deck',c.id,'tarot-art')}<div class="tf-num">${c.arcana==='major'?c.num:''}</div><div class="tf-plate"><span>${c.name}</span></div>`;
function cardScene(c,flipped,id){
 const sp=Array.from({length:10},(_,i)=>`<i class="spark" style="left:${10+i*8}%;top:${30+(i%4)*14}%;--dx:${(i%2?1:-1)*(10+i*4)}px;--dy:${-30-i*6}px"></i>`).join('');
 return `<div class="scene ${flipped?'flipped':''}" id="${id}" role="button" tabindex="0" aria-label="${flipped?esc(c.title+'. '+c.msg):'Today’s whisper, face down. Press to reveal.'}" data-act="reveal"><div class="card3d"><div class="face back"></div><div class="face front daily">${whisperFace(c)}</div></div>${sp}</div>`;
}
// a whisper's face: its artwork (art/whispers) and the engraved plaque with title and message
const whisperFace=c=>`${pic('whispers',c.id,'day-art')||`<div class="ph">${symbol(c.sym)}</div>`}<div class="card-banner"><div class="cb-in"><div class="cb-title">${c.title}</div><p>${c.msg}</p></div></div>`;

/* ---------- AI read-aloud (ElevenLabs), signed-in only ---------- */
const AUDIO=new Map();let player=null;
function stopAudio(){if(player){player.pause();player=null}V.say=null}
function playText(txt){
 stopAudio();V.say=txt;
 return (AUDIO.has(txt)?Promise.resolve(AUDIO.get(txt)):C.speak(txt).then(b=>{const u=URL.createObjectURL(b);AUDIO.set(txt,u);return u}))
  .then(u=>{if(V.say!==txt)return;player=new Audio(u);player.onended=()=>{player=null;V.say=null;render()};return player.play()})
  .catch(e=>{if(V.say===txt){V.say=null;render()}toast(e.message||'Could not play the reading')});
}

/* ----- Horoscopes ----- */
views.horoscopes=()=>{
 const cat=tab(),ex=V.exploreSign||S.sign,s=sg(ex),h=horoscope(ex,cat,V.period);
 const ref=`${ex}/${cat}/${V.period}/${h.per.key}`,saved=isSaved('horoscope',ref);
 return `<div class="stack"><h1>Horoscopes</h1>
 <div class="row sign-row" role="radiogroup" aria-label="Choose a sign">${SIGNS.map(x=>`<button class="chip" style="flex:0 0 auto" role="radio" aria-checked="${x.id===ex}" data-sign="${x.id}" aria-label="${x.name}">${pic('icons',x.id,'sign-ico')||`<span class="glyph">${x.g}</span>`}<span class="sign-nm">${x.name}</span></button>`).join('')}</div>
 <div role="group" aria-label="Time period">${seg(PERIODS,V.period,'period')}</div>
 <section class="today side">${pic('scenes',s.id,'today-art')}<div class="today-in"><h2 class="h-range">${periodHead(V.period,h.per)}</h2>${V.period==='monthly'||V.period==='yearly'?`<p class="muted">${rangeTxt(h.per)}</p>`:''}<p class="h-sign"><strong>${s.name}</strong> · ${s.el} · ${s.mod} · ruled by ${s.ruler}</p><p class="muted h-trait">You meet the world ${STYLE[s.id]}.</p><div class="label">Focus</div><p class="h-focus">${esc(h.focus)}</p></div></section>
 <div class="h-body">${esc(h.body).split(/\n+/).map(p=>`<p>${p}</p>`).join('')}${h.reflection?`<p class="quote h-ref">${esc(h.reflection)}</p>`:''}
 ${cat==='money'?'<p class="muted">For reflection only. This is not financial advice.</p>':''}${cat==='health'?'<p class="muted">For reflection only. This is not medical advice.</p>':''}
 <div class="row h-acts"><button class="btn ghost sm" data-act="bookhoro" data-ref="${ref}">${saved?'Saved':'Save'}</button>${ex!==S.sign?`<button class="btn ghost sm" data-act="setsign" data-sign="${ex}">Set as my sign</button>`:''}</div></div></div>`;
};

/* ----- Oracle ----- */
views.oracle=()=>{
 const t=tab();
 if(t==='tarot')return tarotView();
 const k=dkey(),c=todayCard(),rev=!!S.revealed[k],sv=S.saved.some(x=>x.date===k);
 return `<div class="stack" style="align-items:stretch"><h1>Whispers</h1><p class="quote center">A whisper from the cosmos</p>${cardScene(c,rev,'fortuneCard')}
 ${rev?`<div class="row whisper-acts"><button class="btn" data-act="savecard" aria-pressed="${sv}">${sv?'♥ Saved':'♡ Save Whisper'}</button></div>
 <div class="reflect"><div class="label">Sit with it</div><p class="reflect-q">${c.ref}</p><div class="field"><label class="label" for="note">My reflection</label><textarea id="note" placeholder="Take your time. Write whatever rises.">${esc(S.notes[k]||'')}</textarea></div><div class="note-acts"><button class="btn" data-act="savenote">Save reflection</button></div><p class="muted small center note-priv">Private to you${C.user?' and kept in your account':' and stored in this browser'}.<br>Your reflections also appear in Journal.</p></div>`
 :`<button class="btn" data-act="reveal" style="align-self:center">Reveal My Whisper</button><p class="muted center small">One card a day, drawn from ${ORACLE.length}. You will not see the same card again until you have met them all.</p>`}</div>`;
};
function tarotView(){
 const T=V.tarot,sp=SPREADS[T.spread];
 // 1. the question and the reading type, chosen like a sign; Shuffle draws a fresh deck
 if(T.stage==='setup')return `<div class="stack"><h1>What Is Yet to Be Revealed?</h1><p class="quote center">A question, a choice, a turn of a card. What might you discover?</p><div class="label">Choose your reading</div><div class="row sign-row spread-row" role="radiogroup" aria-label="Reading type">${Object.entries(SPREADS).map(([k,x])=>`<button class="chip" role="radio" aria-checked="${T.spread===k}" data-act="tspread" data-k="${k}">${pic('spreads',k,'sign-ico')||'<span class="glyph">✦</span>'}<span class="sign-nm">${x.s}</span><span class="spread-n">${x.p.length} card${x.p.length>1?'s':''}</span></button>`).join('')}</div><div class="field"><label for="q">Your question (optional)</label><input type="text" id="q" value="${esc(T.q)}" placeholder="Ask about anything, or a topic: love, work, a choice…"></div><button class="btn" data-act="shuffle">Shuffle the cards</button></div>`;
 // 2. pick face-down cards; the reveal opens by itself once enough are chosen
 if(T.stage==='pick')return `<div class="stack"><h1>Choose ${sp.p.length} card${sp.p.length>1?'s':''}</h1><p class="muted center">${sp.n} · ${T.picks.length} of ${sp.p.length} chosen</p><div class="grid5">${T.deck.slice(0,20).map((c,i)=>`<button class="mini" aria-label="Card ${i+1}" aria-pressed="${T.picks.includes(i)}" data-pick="${i}"></button>`).join('')}</div></div>`;
 // 3. the drawn cards, each flipped by a tap; a revealed card opens its full details
 const cards=T.drawn,done=cards.every(c=>c.shown);
 return `<div class="stack"><h1>${sp.n}</h1>${T.q?`<p class="quote center">“${esc(T.q)}”</p>`:''}<p class="muted center">${done?'Tap a card to read it in full.':'Tap each card to reveal it.'}</p><div class="rd-grid${cards.length===1?' solo':''}">${cards.map((c,i)=>`<div class="rd-cell"><div class="label">${c.pos}</div><div class="scene ${c.shown?'flipped':''} ${c.rv?'rev':''}" role="button" tabindex="0" data-act="tflip" data-k="${i}" aria-label="${c.shown?esc(c.name)+(c.rv?', reversed':'')+'. Open details':esc(c.pos)+', face down. Reveal'}"><div class="card3d"><div class="face back"></div><div class="face front tarot-face bare">${pic('deck',c.id,'tarot-art')}</div></div></div></div>`).join('')}</div>
 ${done?panel(`<h3>Interpretation</h3>${T.ai?`<div class="ai-read">${(T.ai.cards||[]).map((x,i)=>cards[i]?`<div class="label">${cards[i].pos} · ${cards[i].name}${cards[i].rv?' · reversed':''}</div><p>${esc(x)}</p>`:'').join('')}${T.ai.whole?`<div class="rule"></div><div class="label">The reading as a whole</div>${T.ai.whole.split(/\n+/).map(x=>`<p>${esc(x)}</p>`).join('')}`:''}<p class="muted small">Written with AI for this spread and question.</p></div>`:T.aiState==='loading'?'<p class="muted">The cards are speaking…</p>':`${cards.map(c=>{const k=SPREAD_CTX[T.spread]||'growth';return `<p><strong>${c.pos}.</strong> ${c.name}${c.rv?' reversed':''}: ${c.rv?c.revm:c.upm} <em>${c[k]}</em></p>`}).join('')}<p class="quote" style="font-size:1.1rem">${T.q?'Held against your question, notice which of these themes you already recognise in your own life, and which you resist.':'Notice which of these themes you already recognise in your own life, and which you resist.'}</p>${C.enabled&&!C.user?'<p class="muted">Sign in for a personal AI interpretation.</p>':''}`}<p class="muted">Symbols for reflection, not predictions.</p>
 ${T.savedId?`<p class="center"><strong>Saved to Readings.</strong></p>`:`<div class="field"><label for="tnote">A note to keep with this reading (optional)</label><textarea id="tnote" placeholder="What stood out to you?">${esc(T.note||'')}</textarea></div><button class="btn" data-act="saveread">Save reading</button>`}<button class="btn ghost" data-act="newread">New reading</button>`,'glass'):''}
 ${V.tpop!=null?tarotPop(cards[V.tpop]):''}</div>`;
}
// pop-up with a drawn card's full details: card, number, keywords, meanings and readings by context
function tarotPop(c){const k=V.tctx||'love';
 return `<div class="pop" role="dialog" aria-modal="true" aria-label="${esc(c.name)}" data-act="tpopclose"><div class="pop-box"><button class="pop-x" data-act="tpopclose" aria-label="Close">×</button>
 <div class="label center">${c.arcana==='major'?'Major Arcana · '+c.num:'Minor Arcana · '+c.suit}${c.rv?' · reversed':''}</div><h2 class="center">${c.name}</h2>
 <div class="scene flat ${c.rv?'rev':''}" role="img" aria-label="${esc(c.name)}"><div class="face front tarot-face">${tarotFace(c)}</div></div>
 <div class="label">Upright · ${c.up}</div><p>${c.upm}</p><div class="label">Reversed · ${c.rev}</div><p>${c.revm}</p><div class="rule"></div>
 <div class="seg" role="tablist">${Object.entries(CTX).map(([x,l])=>`<button role="tab" aria-selected="${k===x}" data-act="tctx" data-k="${x}">${l}</button>`).join('')}</div><p class="quote">${c[k]}</p>
 <button class="btn ghost sm" data-act="kasask" data-q="What does ${esc(c.name)}${c.rv?' reversed':''} suggest in the ${esc(c.pos)} position of my reading?">Ask Kassandra about this card</button></div></div>`}
// once every card is face up, ask the server for a personal interpretation (signed-in only)
function interpret(){const T=V.tarot;if(!C.user||T.aiState)return;T.aiState='loading';
 C.interpret(T.spread,T.q,T.drawn.map(c=>({id:c.id,reversed:c.rv}))).then(r=>{if(V.tarot===T&&(r.cards||r.whole)){T.ai=r}},e=>toast(e.message||'Could not interpret the reading')).then(()=>{T.aiState='done';render()})}
function noteBlock(kind,id,note){
 const open=V.edit===kind+':'+id;
 if(open)return `<div class="field"><label for="ed">Note</label><textarea id="ed">${esc(note||'')}</textarea></div><div class="row"><button class="btn sm" data-act="savenoteed" data-kind="${kind}" data-id="${esc(id)}">Save note</button><button class="btn ghost sm" data-act="canceledit">Cancel</button></div>`;
 return `${note?`<p class="item-note">“${esc(note)}”</p>`:''}<button class="link" data-act="editnote" data-kind="${kind}" data-id="${esc(id)}">${note?'Edit note':'Add a note'}</button>`;
}
/* ----- Journal: a leather-bound notebook. The cover comes first, then every entry as a page (journal pages, Whisper
   reflections and tarot notes), oldest first, ending on a blank page for a new entry. Pages turn by hand or by button. ----- */
const JPAPER=['sleeping-moon','sun-face','pressed-roses','compass-rose','night-sky','moon-phases'];
// the journal's owner: a name given in the journal itself, or else the name from Birth Chart
const journalName=()=>((S.settings||{}).jname||S.fullName||S.name||'').trim();
const lastReading=()=>S.readings.slice().sort((a,b)=>(b.at||b.date)>(a.at||a.date)?1:-1)[0];
function journalPages(){
 const e=[...S.journal.map(j=>({t:'j',day:j.day,at:j.at,j})),
  ...Object.entries(S.notes).filter(([,n])=>n).map(([d,n])=>({t:'n',day:d,n,o:cardFor(d)})),
  ...S.readings.filter(r=>r.note).map(r=>({t:'r',day:r.date,at:r.at,r}))]
  .sort((a,b)=>a.day>b.day?1:a.day<b.day?-1:((a.at||'')>(b.at||'')?1:-1));
 return [{t:'cover'},...e,{t:'new'}];
}
const jIdx=pages=>V.jpage==null?0:Math.max(0,Math.min(pages.length-1,V.jpage));
const jDate=d=>`<p class="jp-date">${ymdLong(d,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>`;
const jEdit=(act,kind,id,label='Edit')=>`<button class="link" data-act="${act}" ${kind?`data-kind="${kind}" `:''}data-id="${esc(id)}">${label}</button>`;
// the card a reflection was written about, pasted onto the page beside the words
const jWhisperArt=o=>{const p=pic('whispers',o.id,'jp-card');return p?`<div class="jp-cards one">${p}</div>`:''};
const jTarotArt=r=>{const c=r.cards.slice(0,5).map(x=>pic('deck',x.id,'jp-card'+(x.rev?' rev':''))).filter(Boolean);return c.length?`<div class="jp-cards${c.length<2?' one':c.length>2?' many':''}">${c.join('')}</div>`:''};
const jCardsLine=r=>`${r.q?'“'+esc(r.q)+'” · ':''}${r.cards.map(x=>esc(x.name)+(x.rev?' (reversed)':'')).join(', ')}`;
// the writing form: a title line and ruled paper; Whisper and tarot reflections are kept with the reading itself
function jForm(d,edit){
 const k=d.kind,today=dkey(),c=todayCard(),r=lastReading();
 const kinds=[['reflection','A reflection'],['synchronicity','A synchronicity']];
 if(!edit){if(S.revealed[today])kinds.push(['whisper','Today’s Whisper']);if(r)kinds.push(['tarot','My last reading'])}
 const tabs=edit?'':`<div class="jp-kinds" role="radiogroup" aria-label="What are you writing?">${kinds.map(([v,l])=>`<button class="jp-kind" role="radio" aria-checked="${k===v}" data-act="jkind" data-k="${v}">${l}</button>`).join('')}</div>`;
 if(k==='whisper'&&S.revealed[today])return `${tabs}${jWhisperArt(c)}<p class="jp-title">${esc(c.title)}</p><p class="jp-prompt">${c.ref}</p><label class="sr-only" for="ed">My reflection</label><textarea id="ed" class="jp-lines" placeholder="Take your time. Write whatever rises.">${esc(S.notes[today]||'')}</textarea><div class="jp-acts"><button class="btn sm" data-act="savenoteed" data-kind="fortune" data-id="${today}">Write it in</button></div>`;
 if(k==='tarot'&&r)return `${tabs}${jTarotArt(r)}<p class="jp-title">${esc((SPREADS[r.spread]||{n:r.spread}).n)}</p><p class="jp-prompt">${jCardsLine(r)}</p><label class="sr-only" for="ed">My note on this reading</label><textarea id="ed" class="jp-lines" placeholder="What did the cards bring up for you?">${esc(r.note||'')}</textarea><div class="jp-acts"><button class="btn sm" data-act="savenoteed" data-kind="reading" data-id="${r.id}">Write it in</button></div>`;
 return `${tabs}${k==='synchronicity'?'<p class="jp-prompt">A meaningful coincidence: a repeated number, a song at the right moment, a chance meeting.</p>':''}<label class="sr-only" for="jt">Title</label><input type="text" id="jt" class="jp-tline" value="${esc(d.title)}" placeholder="A title, if you like"><label class="sr-only" for="jb">Entry</label><textarea id="jb" class="jp-lines" placeholder="What happened, and what did it stir in you?">${esc(d.body)}</textarea><div class="jp-acts"><button class="btn sm" data-act="savejournal">${edit?'Save changes':'Write it in'}</button>${edit?'<button class="link" data-act="canceljournal">Cancel</button>':''}</div>`;
}
// the leather front cover: "This journal belongs to", then the owner's name, or a place to write it
function jCover(){
 const nm=journalName(),ask=!nm||V.jnameEdit;
 return `<div class="jp-front jp-leather"><div class="jc-in"><p class="jc-l">This journal<br><span>belongs to</span></p>
 ${ask?`<label class="sr-only" for="jn">Your name for this journal</label><input type="text" id="jn" class="jc-name-in" value="${esc(nm)}" placeholder="Write your name" autocomplete="nickname" maxlength="40"><div class="jc-acts"><button class="jc-btn" data-act="jname">${nm?'Keep this name':'Open my journal'}</button>${V.jnameEdit?'<button class="jc-link" data-act="jnamecancel">Cancel</button>':''}</div>`
  :`<p class="jc-name">${esc(nm)}</p><div class="jc-acts"><button class="jc-btn" data-act="jflip" data-to="last">Open my journal</button><button class="jc-link" data-act="jnameedit">Change name</button></div>`}
 </div></div>`;
}
function jPage(p,i,n){
 if(p.t==='cover')return `<div class="jpage is-cover">${jCover()}</div>`;
 const art=JPAPER[(i-1)%JPAPER.length];let h;
 if(p.t==='new')h=`${jDate(dkey())}${jForm(V.jdraft||{kind:'reflection',title:'',body:''})}`;
 else if(p.t==='j'){const j=p.j;
  h=V.jedit===j.id?`${jDate(j.day)}${jForm(V.jdraft||j,true)}`
   :`${jDate(j.day)}<p class="jp-kind-l">${j.kind==='synchronicity'?'Synchronicity':'Reflection'}</p>${j.title?`<p class="jp-title">${esc(j.title)}</p>`:''}<p class="jp-lines jp-text">${esc(j.body)}</p><div class="jp-acts">${jEdit('editjournal','',j.id)}${jEdit('deljournal','',j.id,'Remove')}</div>`}
 else{const w=p.t==='n',key=w?'fortune:'+p.day:'reading:'+p.r.id,note=w?p.n:p.r.note;
  const head=w?`<p class="jp-kind-l">Whisper</p>${jWhisperArt(p.o)}<p class="jp-title">${esc(p.o.title)}</p><p class="jp-prompt">${p.o.ref}</p>`
   :`<p class="jp-kind-l">Tarot</p>${jTarotArt(p.r)}<p class="jp-title">${esc((SPREADS[p.r.spread]||{n:p.r.spread}).n)}</p><p class="jp-prompt">${jCardsLine(p.r)}</p>`;
  h=V.edit===key?`${jDate(p.day)}${head}<label class="sr-only" for="ed">Note</label><textarea id="ed" class="jp-lines">${esc(note||'')}</textarea><div class="jp-acts"><button class="btn sm" data-act="savenoteed" data-kind="${w?'fortune':'reading'}" data-id="${esc(w?p.day:p.r.id)}">Save</button><button class="link" data-act="canceledit">Cancel</button></div>`
   :`${jDate(p.day)}${head}<p class="jp-lines jp-text">${esc(note)}</p><div class="jp-acts">${jEdit('editnote',w?'fortune':'reading',w?p.day:p.r.id)}</div>`}
 return `<div class="jpage"><div class="jp-front p-${art}${art==='night-sky'?' dark':''}" style="--paper:url(/art/pages/${art}.webp)"><div class="jp-in">${h}</div><span class="jp-num">${i}</span></div></div>`;
}
// a page's textarea grows by whole lines, so the page scrolls (not the box) and the words keep to the page's rules
function jfit(el){el.style.height='auto';const lh=parseFloat(getComputedStyle(el).lineHeight)||28;el.style.height=Math.max(4,Math.ceil((el.scrollHeight-1)/lh))*lh+'px'}
document.addEventListener('input',e=>{if(e.target.matches&&e.target.matches('.jpage textarea'))jfit(e.target)});
// how thick the block of pages still to come looks beneath the open one
const jDepth=left=>Math.round(Math.max(12,Math.min(26,11+left*1.8)));
let jPre=false;
function journalView(){
 const pages=journalPages(),i=jIdx(pages),n=pages.length;
 if(!jPre){jPre=true;['cover','edge-h','edge-v',...JPAPER].forEach(a=>{const im=new Image();im.src=`/art/pages/${a}.webp`;im.decode&&im.decode().catch(()=>{})})}
 return `<div class="stack"><h1>Journal</h1><div class="jbook${i?' open':' closed'}" style="--T:${jDepth(n-1-i)}px" aria-label="${i?`Journal, page ${i} of ${n-1}`:'Journal cover'}"><div class="jboard" aria-hidden="true"></div><div class="jblock" aria-hidden="true"></div>${jPage(pages[i],i,n)}</div>
 <nav class="jnav" aria-label="Turn the pages"><button class="btn sm" data-act="jflip" data-d="-1" aria-label="Previous page"${i?'':' disabled'}>‹</button><span class="jnav-n">${!i?'The cover':i===n-1?'A new page':`Page ${i} of ${n-2}`}</span><button class="btn sm" data-act="jflip" data-d="1" aria-label="Next page"${i<n-1?'':' disabled'}>›</button></nav>
 ${i&&i<n-1?'<div class="h-acts row"><button class="btn ghost sm" data-act="jflip" data-to="last">Write a new page</button></div>':''}<p class="muted small center">Drag a page’s edge, or use the arrows, to turn the pages.</p></div>`;
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
 const pages=journalPages(),from=jIdx(pages),book=$('.jbook');to=Math.max(0,Math.min(pages.length-1,to));
 if(JT||to===from||!book)return null;
 // an unfinished new page is kept; an edit in progress is let go
 if(V.jedit){V.jedit=null;V.jdraft=null}else if($('#jb'))V.jdraft=readJournalDraft();
 V.edit=null;V.jnameEdit=false;
 const fwd=to>from,cur=book.querySelector('.jpage'),tmp=document.createElement('div');
 tmp.innerHTML=jPage(pages[to],to,pages.length);const np=tmp.firstElementChild,leaf=fwd?cur:np,under=fwd?np:cur;
 np.classList.add('jp-abs');if(fwd)cur.before(np);else book.appendChild(np);
 np.querySelectorAll('textarea').forEach(jfit);
 leaf.classList.add('leaf');under.classList.add('under');book.classList.add('turning');
 const r=cur.getBoundingClientRect(),W=r.width,H=r.height;
 if(Math.min(from,to)===0){
  leaf.insertAdjacentHTML('beforeend','<div class="jp-back endpaper" aria-hidden="true"></div>');leaf.classList.add('hard');
  JT={hard:true,to,fwd,leaf,under,p:0};jhard(JT,0);return JT;
 }
 // the leaf's paper, seen from behind: its own painting showing faintly through, under the ruled lines
 const fr=leaf.querySelector('.jp-front');
 book.insertAdjacentHTML('beforeend','<div class="jturn" aria-hidden="true"><div class="jt-cast"><i class="jt-castg"></i></div><div class="jt-strips"></div></div>');
 const wrap=book.querySelector('.jturn'),q=s=>wrap.querySelector(s);
 const cy=grab&&grab.y<H/2?0:H,rnd=Math.random;
 JT={soft:true,to,fwd,leaf,under,W,H,cy,p:0,pool:[],rip:[5.5+rnd()*1.5,rnd()*6,2.2+rnd(),rnd()*6],
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
function jland(land){const t=JT;JT=null;if(t&&land)V.jpage=t.to;render()}
function jflip(to){if(jstart(to))jrun(true)}
// turning by hand: drag across the page (not while writing in it) and the corner follows; let go past a third to turn it
let JD=null;
document.addEventListener('pointerdown',e=>{
 const book=e.target.closest&&e.target.closest('.jbook');
 if(!book||JT||e.button>0||e.target.closest('input,textarea,select,button,a,label'))return;
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

/* ----- Affinity ----- */
const KIND_LABEL={zodiac:'Zodiac Match',resonance:'Soul Resonance',synastry:'Synastry'};
const connTitle=c=>c.name||(c.kind==='zodiac'?`${sg(c.data.a).name} + ${sg(c.data.b).name}`:c.kind==='resonance'?`${c.data.a} + ${c.data.b}`:`You + ${(c.data.them||{}).name||'them'}`);
// the zodiac match reading for two signs (Zodiac Match page and the saved connection pop-up)
function matchBody(a,b){const r=zodiacMatch(a,b);
 return `<div class="row pair"><span class="pair-s">${pic('icons',a,'sign-ico')}<span class="sign-nm">${sg(a).name}</span></span><svg width="70" height="30" viewBox="0 0 80 30" aria-hidden="true"><path d="M2 15C20 2 30 28 40 15S62 2 78 15" fill="none" stroke="#8B6A3E" stroke-width="1.2"/><circle cx="40" cy="15" r="3" fill="#8B6A3E"/></svg><span class="pair-s">${pic('icons',b,'sign-ico')}<span class="sign-nm">${sg(b).name}</span></span></div><div class="center"><div class="label">${r.angle[0]}</div></div>${r.themes.map(([k,v])=>`<div class="label">${k}</div><p>${v}</p>`).join('')}<div class="rule"></div><p class="muted small">Method: traditional astrology compares the angle between two signs around the zodiac, their elements (${sg(a).el} and ${sg(b).el}) and their modalities (${sg(a).mod} and ${sg(b).mod}). These are symbolic themes for conversation, not a measured score. For a fuller picture, compare birth charts in Synastry.</p>`;
}
views.affinity=()=>{
 const t=tab();
 if(t==='soul-resonance')return resonanceView();
 if(t==='synastry')return synastryView();
 if(t==='connections')return connectionsView();
 const a=V.love.a||S.sign,b=V.love.b;let res='';
 if(V.love.done&&a&&b){const saved=S.conns.some(c=>c.kind==='zodiac'&&c.data.a===a&&c.data.b===b);
  res=panel(`${plate('sunmoon')}${matchBody(a,b)}<div class="row"><button class="btn ghost sm" data-act="saveconn" data-kind="zodiac">${saved?'Saved':'Save connection'}</button><button class="btn ghost sm" data-act="kasask" data-q="What do ${sg(a).name} and ${sg(b).name} traditionally bring out in each other?">Ask Kassandra</button></div>`);}
 return `<div class="stack"><h1>Zodiac Match</h1><div class="label">Your sign</div>${signGrid('Your sign',a)}<div class="label">Their sign</div>${signGrid('Their sign',b,'sign2')}<button class="btn" data-act="domatch" ${b?'':'disabled'}>Discover Our Cosmic Connection</button>${res}</div>`;
};
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
function resonanceView(){
 const R=V.res,a=R.a||S.fullName||S.name,b=R.b;
 let out='';
 if(R.done&&N.clean(a)&&N.clean(b)){const saved=S.conns.some(c=>c.kind==='resonance'&&c.data.a===a&&c.data.b===b);
  out=resonanceRows(a,b,panel)+panel(resMethod()+`<div class="row"><button class="btn ghost sm" data-act="saveconn" data-kind="resonance">${saved?'Saved':'Save connection'}</button></div>`);}
 return `<div class="stack"><h1>Soul Resonance</h1><p class="muted center">Compare two names through numerology, using full birth names where you know them.</p>${panel(`${plate('locket')}<div class="field"><label for="ra">Your name</label><input type="text" id="ra" value="${esc(a)}" autocomplete="name"></div><div class="field"><label for="rb">Their name</label><input type="text" id="rb" value="${esc(b)}"></div><button class="btn" data-act="doresonance">Compare our names</button><p class="muted small">Names stay private to you.</p>`)}${out}</div>`;
}
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
 if(!mine)return `<div class="stack"><h1>Synastry</h1>${empty('Your birth details first','Synastry compares two birth charts, so it needs your date of birth (and, for the most detail, your time and place).',linkBtn('Add my birth details','blueprint','birth-chart','btn'))}</div>`;
 let out='';
 if(Y.done&&Y.date){
  const saved=S.conns.some(c=>c.kind==='synastry'&&(c.data.them||{}).date===Y.date&&(c.data.them||{}).name===Y.name);
  out=panel(synBody(Y)+`<div class="row"><button class="btn ghost sm" data-act="saveconn" data-kind="synastry">${saved?'Saved':'Save connection'}</button></div>`);
 }
 return `<div class="stack"><h1>Synastry</h1><p class="muted center">How two birth charts speak to each other.</p>${form}${out}</div>`;
}
function connectionsView(){
 return `<div class="stack"><h1>Connections</h1><p class="muted center">Your saved comparisons. They are private: only you can see them.</p>${plate('connections')}${S.conns.length?S.conns.map(c=>{const open=V.edit==='conn:'+c.id;
  return `<article class="item"><div class="item-h"><span class="badge">${KIND_LABEL[c.kind]}</span>${c.at?`<span class="muted">${shortD(new Date(c.at))}</span>`:''}</div>${open?`<div class="field"><label for="cn">Name</label><input type="text" id="cn" value="${esc(c.name)}" placeholder="${esc(connTitle(Object.assign({},c,{name:''})))}"></div><div class="field"><label for="cnote">Note</label><textarea id="cnote">${esc(c.note||'')}</textarea></div><div class="row"><button class="btn sm" data-act="saveconnedit" data-id="${c.id}">Save</button><button class="btn ghost sm" data-act="canceledit">Cancel</button></div>`
   :`<h3>${esc(connTitle(c))}</h3>${c.name&&c.kind==='zodiac'?`<p class="muted">${sg(c.data.a).name} + ${sg(c.data.b).name}</p>`:''}${c.note?`<p class="item-note">“${esc(c.note)}”</p>`:''}<div class="row"><button class="btn ghost sm" data-act="openconn" data-id="${c.id}">Open</button><button class="btn ghost sm" data-act="editconn" data-id="${c.id}">Edit</button><button class="btn ghost sm" data-act="delconn" data-id="${c.id}">Delete</button></div>`}</article>`}).join('')
  :empty('No connections yet','Compare two signs, two names or two charts, then save it to keep it here.')}</div>`;
}

/* ----- Blueprint ----- */
views.blueprint=()=>{
 const t=tab();
 if(t==='birth-chart')return chartView();
 if(t==='life-path')return lifePathView();
 if(t==='the-name-within')return nameView();
 if(t==='my-cycles')return cyclesView();
 const ch=myChart(),L=hasBirthDate()?N.lifePath(S.birth.date):null,nm=nameNums(S.fullName),b=S.birth,yr=Number(dkey().slice(0,4));
 const val=(v,miss,sec,tt)=>v?`<span>${v}</span>`:`<button class="link" data-go="${sec}" data-t="${tt}">${miss}</button>`;
 const sun=ch?sIdx(ch.pl[0].sign):null;
 return `<div class="stack"><h1>My Profile</h1>
 ${panel(`<div class="prof-h">${pic('icons',S.sign,'sign-ico')}<div><h2>${esc(S.name||S.fullName||'Traveller')}</h2><p class="muted">${sg(S.sign).name} · ${sg(S.sign).el} · ruled by ${sg(S.sign).ruler}</p></div></div>
  <dl class="dl"><dt>Birth date</dt><dd>${val(hasBirthDate()?ymdLong(b.date):'', 'Add','blueprint','birth-chart')}</dd><dt>Birth time</dt><dd>${val(b.unk?'Unknown':b.time,'Add','blueprint','birth-chart')}</dd><dt>Birth place</dt><dd>${val(b.place,'Add','blueprint','birth-chart')}</dd><dt>Full birth name</dt><dd>${val(esc(S.fullName),'Add','blueprint','the-name-within')}</dd></dl>
  <p class="muted small">${S.birthConsent?'Birth details are kept privately in your account.':'Birth details stay on this device unless you choose to keep them in your account (in Birth Chart).'}</p>`)}
 ${panel(`<div class="label">The big three</div>${plate('astro')}<dl class="dl"><dt>Sun</dt><dd>${ch?sun.name+` <span class="muted small">calculated</span>`:`<span class="muted">Needs birth date</span>`}</dd><dt>Moon</dt><dd>${ch?(ch.moonRange?`${sIdx(ch.moonRange[0]).name} or ${sIdx(ch.moonRange[1]).name} <span class="muted small">needs birth time</span>`:sIdx(ch.pl[1].sign).name+' <span class="muted small">calculated</span>'):'<span class="muted">Needs birth date</span>'}</dd><dt>Rising</dt><dd>${ch&&ch.ang?sIdx(K.signIdx(ch.ang.asc)).name+' <span class="muted small">calculated</span>':`<span class="muted">Needs birth time and place</span>`}</dd></dl>${ch&&sun.id!==S.sign?`<p class="note">Your calculated Sun sign is ${sun.name}, but your chosen sign is ${sg(S.sign).name}. Births near the edge of a sign can fall either side; you can change your chosen sign in Settings.</p>`:''}`)}
 ${panel(`<div class="label">Numerology</div><dl class="dl"><dt>Life Path</dt><dd>${L?L.r.n+' · '+N.MEANING[L.r.n][0]:'<span class="muted">Needs birth date</span>'}</dd><dt>Expression</dt><dd>${nm?nm.expression.r.n+' · '+N.MEANING[nm.expression.r.n][0]:'<span class="muted">Needs full birth name</span>'}</dd><dt>Soul Urge</dt><dd>${nm&&nm.soul.r.n?nm.soul.r.n+' · '+N.MEANING[nm.soul.r.n][0]:'<span class="muted">Needs full birth name</span>'}</dd><dt>Personality</dt><dd>${nm&&nm.personality.r.n?nm.personality.r.n+' · '+N.MEANING[nm.personality.r.n][0]:'<span class="muted">Needs full birth name</span>'}</dd><dt>Personal Year ${yr}</dt><dd>${hasBirthDate()?N.personalYear(S.birth.date,yr).r.n:'<span class="muted">Needs birth date</span>'}</dd></dl>`)}
 </div>`;
};
function birthForm(){
 const b=V.birthDraft||(V.birthDraft=Object.assign({},S.birth));
 return panel(`${plate('natal')}<h3>Your birth details</h3><div class="field"><label for="bn">Your name</label><input type="text" id="bn" value="${esc(b.name!=null?b.name:S.fullName)}" autocomplete="name" placeholder="Your full name"></div><div class="field"><label for="bd">Date of birth</label><input type="date" id="bd" value="${esc(b.date)}"></div><label class="row"><input type="checkbox" id="bu" ${b.unk?'checked':''} class="cb"> I don’t know my birth time</label>${b.unk?'':`<div class="field"><label for="bt">Time of birth (local time)</label><input type="time" id="bt" value="${esc(b.time)}"></div>`}${placeField('birth',b)}
 <label class="row consent"><input type="checkbox" id="bcons" ${S.birthConsent?'checked':''} class="cb"> <span>Keep my birth details in my Kosmia account so they sync across my devices. They are private to me and I can delete them in Settings.</span></label>
 <button class="btn" data-act="savebirth">Save and calculate</button><p class="muted small">Birth details are only needed for your chart, Life Path and cycles. Without a time and place, the Ascendant and houses are not calculated.</p>`);
}
function chartView(){
 if(!A)return needLib();
 const c=myChart(),form=birthForm();
 if(!c)return `<div class="stack"><h1>Birth Chart</h1>${form}</div>`;
 const asc=c.ang?c.ang.asc:0,R=130,CX=150,pt=(lon,r)=>{const ph=(180+lon-asc)*Math.PI/180;return [CX+r*Math.cos(ph),CX-r*Math.sin(ph)]};
 const wheel=`<svg viewBox="0 0 300 300" width="100%" role="img" aria-label="Natal chart wheel"><circle cx="${CX}" cy="${CX}" r="${R}" fill="#F7EEDD" stroke="#8B6A3E" stroke-width="1.2"/><circle cx="${CX}" cy="${CX}" r="${R-26}" fill="none" stroke="#8B6A3E" stroke-width=".7"/><circle cx="${CX}" cy="${CX}" r="${R-72}" fill="none" stroke="#8B6A3E" stroke-width=".5"/>${SIGNS.map((s,i)=>{const [x1,y1]=pt(i*30,R),[x2,y2]=pt(i*30,R-26),[gx,gy]=pt(i*30+15,R-13);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8B6A3E" stroke-width=".7"/><text x="${gx}" y="${gy}" text-anchor="middle" dominant-baseline="central" font-size="13" fill="#3A3026" font-family="Noto Sans Symbols,Segoe UI Symbol,serif">${s.g}</text>`}).join('')}${c.ang?(()=>{const [a1,b1]=pt(c.ang.asc,R-26),[a2,b2]=pt(c.ang.asc+180,R-26),[m1,n1]=pt(c.ang.mc,R-26),[m2,n2]=pt(c.ang.mc+180,R-26);return `<line x1="${a1}" y1="${b1}" x2="${a2}" y2="${b2}" stroke="#4A3B2A" stroke-width="1"/><line x1="${m1}" y1="${n1}" x2="${m2}" y2="${n2}" stroke="#4A3B2A" stroke-width=".8" stroke-dasharray="3 3"/>`})():''}${c.asp.filter(a=>a.n!=='conjunction'&&a.a.g&&a.b.g&&a.a.n!=='Ascendant'&&a.b.n!=='Ascendant'&&a.a.n!=='Midheaven'&&a.b.n!=='Midheaven').map(a=>{const [x1,y1]=pt(a.a.lon,R-72),[x2,y2]=pt(a.b.lon,R-72);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8B6A3E" stroke-width=".6" opacity=".7"/>`}).join('')}${c.pl.map(p=>{const [x,y]=pt(p.lon,R-48);const sel=V.chartSel===p.n;return `<g data-planet="${p.n}" tabindex="0" role="button" aria-label="${p.n} in ${sIdx(p.sign).name}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="11" fill="${sel?'#D8C29A':'#E7D6B6'}" stroke="#8B6A3E"/><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="13" fill="#3A3026" font-family="Noto Sans Symbols,Segoe UI Symbol,serif">${p.g}</text></g>`}).join('')}</svg>`;
 const sel=c.pl.find(p=>p.n===V.chartSel);
 const b=S.birth;
 const note=!c.known?`<p class="note">${b.unk||!b.time||!b.tz?'Without a birth time and place, planets are taken at noon on your birth date. ':''}${!hasPlace(b)?'Add your birth place to calculate the Ascendant, Midheaven and houses. ':''}${c.moonRange?`The Moon moves from ${sIdx(c.moonRange[0]).name} to ${sIdx(c.moonRange[1]).name} during your birth day, so its sign depends on your birth time.`:''}</p>`:'';
 return `<div class="stack"><h1>Birth Chart</h1>
 <p class="muted center">${ymdLong(b.date)}${b.unk||!b.time?'':' · '+esc(b.time)}${b.place?' · '+esc(b.place):''}</p>${note}
 ${panel(wheel+(sel?`<h3><span class="glyph">${sel.g}</span> ${sel.n} in ${sIdx(sel.sign).name}</h3><p>${placement(sel)}</p>`:'<p class="muted center">Tap a planet to read it.</p>'))}
 ${panel(`<h3>Placements</h3><div class="tbl"><table><tr><th></th><th>Planet</th><th>Position</th>${c.known?'<th>House</th>':''}</tr>${c.pl.map(p=>`<tr data-planet="${p.n}" tabindex="0"><td class="glyph">${p.g}</td><td>${p.n}${p.retro?' <span class="muted">℞</span>':''}</td><td>${p.n==='Moon'&&c.moonRange?'<span class="muted">uncertain</span>':degTxt(p.lon)}</td>${c.known?`<td>${p.house}</td>`:''}</tr>`).join('')}${c.ang?`<tr><td>AC</td><td>Ascendant</td><td>${degTxt(c.ang.asc)}</td><td>1</td></tr><tr><td>MC</td><td>Midheaven</td><td>${degTxt(c.ang.mc)}</td><td></td></tr>`:''}</table></div>`)}
 ${panel(`<h3>Interpretations</h3>${c.pl.filter(p=>!(p.n==='Moon'&&c.moonRange)).map(p=>`<p><strong>${p.n} in ${sIdx(p.sign).name}.</strong> ${placement(p)}</p>`).join('')}${c.ang?`<p><strong>${sIdx(K.signIdx(c.ang.asc)).name} rising.</strong> You tend to meet the world ${STYLE[sIdx(K.signIdx(c.ang.asc)).id]}.</p>`:''}`)}
 ${c.known?panel(`<h3>Houses</h3><p class="muted small">Whole-sign houses: each sign is one house, starting from the rising sign.</p><div class="tbl"><table>${HOUSE.map((h,i)=>`<tr><td>${i+1}</td><td>${sIdx(K.signIdx(c.ang.asc)+i).name}</td><td class="wrap">${h}</td></tr>`).join('')}</table></div>`):''}
 ${panel(`<h3>Aspects</h3>${c.asp.slice(0,16).map(a=>`<div class="asp"><div><strong>${a.a.n}</strong> <span class="glyph">${a.g}</span> <strong>${a.b.n}</strong> <span class="muted small">${a.n}, orb ${a.orb.toFixed(1)}°</span></div><p class="small">Your ${PM[a.a.n]} and ${PM[a.b.n]} ${ASPT[a.n]}.</p></div>`).join('')||'<p class="muted">No major aspects within the orbs used.</p>'}`)}
 <p class="muted small">Method: tropical zodiac, geocentric positions on the true ecliptic of date from the Astronomy Engine ephemeris. Your local birth time is converted to UTC with the historical rules for ${esc(b.tz||TZ())}. Houses are whole-sign; aspect orbs are 8° for conjunctions and oppositions, 6° for squares and trines, 4° for sextiles.</p>
 <button class="btn ghost" data-act="kasask" data-q="Explain my rising sign and what my chart’s big three suggest.">Ask Kassandra about my chart</button>
 <details class="edit-birth"><summary>Edit birth details</summary>${form}</details></div>`;
}
function lifePathView(){
 if(!hasBirthDate())return `<div class="stack"><h1>Life Path</h1>${empty('Your birth date','Your Life Path number comes from your date of birth.',linkBtn('Add my birth date','blueprint','birth-chart','btn'))}</div>`;
 const L=N.lifePath(S.birth.date),bd=N.birthday(S.birth.date),M=N.MEANING[L.r.n],ch=x=>x.chain.length>1?x.chain.join(' → '):String(x.n);
 return `<div class="stack"><h1>Life Path</h1>
 ${panel(`${plate('lifepath')}<div class="center"><span class="num big">${L.r.n}</span><h2>${M[0]}</h2><p class="muted">${M[1]}</p></div><p>${M[2]}</p>`)}
 ${panel(`<h3>The calculation</h3><p class="calc">Birth date ${ymdLong(S.birth.date)}<br>Month ${L.m}: ${ch(L.parts.month)}<br>Day ${L.d}: ${ch(L.parts.day)}<br>Year ${L.y}: ${String(L.y).split('').join(' + ')} = ${L.parts.year.chain.slice(1).join(' → ')}<br>Together: ${L.parts.month.n} + ${L.parts.day.n} + ${L.parts.year.n} = ${L.total}${L.r.chain.length>1?' → '+L.r.chain.slice(1).join(' → '):''}</p><p class="muted small">Method: month, day and year are each reduced to a single digit or a master number (11, 22, 33), then added and reduced again.</p>`)}
 ${panel(`<h3>Birthday number · ${bd.n}</h3><p><strong>${N.MEANING[bd.n][0]}.</strong> The day you were born adds a gift to your path: ${N.MEANING[bd.n][1]}.</p>`)}
 </div>`;
}
function nameView(){
 const nm=nameNums(S.fullName),alt=nameNums(S.altName);
 const tbl=`<table class="ltable"><tr>${N.TABLE.map(([v])=>`<th>${v}</th>`).join('')}</tr>${[0,1,2].map(r=>`<tr>${N.TABLE.map(([,ls])=>`<td>${ls[r]||''}</td>`).join('')}</tr>`).join('')}</table>`;
 const letters=x=>`<div class="letters">${x.letters.map(l=>`<span class="lt${l.vowel?' v':''}"><b>${l.c}</b><i>${l.v}</i></span>`).join('')}</div>`;
 const block=(label,x)=>panel(`<h3>${label}</h3>${letters(x)}<p class="muted small">Vowels are highlighted.</p>${numBlock('Expression (Destiny): who you are becoming',x.expression,true)}<p>${N.MEANING[x.expression.r.n]?N.MEANING[x.expression.r.n][2]:''}</p>${numBlock('Soul Urge: what your heart longs for',x.soul,true)}${numBlock('Personality: how others first meet you',x.personality,true)}`);
 return `<div class="stack"><h1>The Name Within</h1>
 ${panel(`${plate('name')}<div class="field"><label for="fn">Full name at birth</label><input type="text" id="fn" value="${esc(S.fullName)}" autocomplete="name" placeholder="As on your birth certificate"></div><div class="field"><label for="an">Name you use now (optional)</label><input type="text" id="an" value="${esc(S.altName)}" placeholder="A married name, a chosen name, a nickname"></div><div class="field"><label for="ym">The letter Y counts as</label><select id="ym"><option value="auto" ${S.settings.yMode==='auto'?'selected':''}>Vowel when no other vowel is beside it</option><option value="vowel" ${S.settings.yMode==='vowel'?'selected':''}>Always a vowel</option><option value="consonant" ${S.settings.yMode==='consonant'?'selected':''}>Always a consonant</option></select></div><button class="btn" data-act="savenames">Calculate</button>`)}
 ${nm?block('Your birth name',nm):empty('Your full birth name','Traditional numerology reads the name you were given at birth. A current name can be compared alongside it.')}
 ${alt?block('The name you use now',alt)+panel(`<p class="muted small">Your birth name is read as the blueprint you arrived with; the name you use now as the way you have chosen to express it.</p>`):''}
 ${panel(`<h3>The Pythagorean letter table</h3>${tbl}<p class="muted small">Accents are ignored (É counts as E), as are hyphens, apostrophes and spaces. Each word of a name is reduced on its own, then the words are added and reduced again, keeping master numbers 11, 22 and 33.</p>`)}
 </div>`;
}
function cyclesView(){
 if(!hasBirthDate())return `<div class="stack"><h1>My Cycles</h1>${empty('Your birth date','Personal cycles are counted from your birth day and month.',linkBtn('Add my birth date','blueprint','birth-chart','btn'))}</div>`;
 const [y,mo,d]=dkey().split('-').map(Number),b=S.birth.date,py=N.personalYear(b,y),pyn=N.personalYear(b,y+1),pm=N.personalMonth(b,y,mo),pdd=N.personalDay(b,y,mo,d),uy=N.universalYear(y),by=Number(b.slice(0,4));
 const mname=ymdLong(dkey(),{month:'long',year:'numeric'});
 return `<div class="stack"><h1>My Cycles</h1>
 ${panel(`${plate('cycles')}<div class="label">Personal Year · ${y}</div><div class="num-line"><span class="num">${py.r.n}</span><p>${cap(N.CYCLE[py.r.n])}.</p></div><p class="calc">Birth month ${Number(b.slice(5,7))} + birth day ${Number(b.slice(8,10))} + year ${y}, each reduced: total ${py.total} → ${py.r.n}</p><p class="muted small">Your Personal Year runs with the calendar year, 1 January to 31 December ${y}.</p>`)}
 ${panel(`<div class="label">Personal Month · ${mname}</div><div class="num-line"><span class="num">${pm.r.n}</span><p>${cap(N.CYCLE[pm.r.n].replace('a year','a month'))}.</p></div><div class="rule"></div><div class="label">Personal Day · ${ymdLong(dkey(),{weekday:'long',day:'numeric',month:'long'})}</div><div class="num-line"><span class="num">${pdd.r.n}</span><p>${cap(N.CYCLE[pdd.r.n].replace('a year','a day'))}.</p></div>`)}
 ${panel(`<div class="label">Next year · ${y+1}</div><p>Personal Year <strong>${pyn.r.n}</strong>: ${N.CYCLE[pyn.r.n]}.</p><div class="label">Universal Year · ${y}</div><p>${uy.n}: the shared backdrop for everyone, ${N.CYCLE[uy.n]}.</p>`)}
 ${panel(`<h3>Pinnacles and challenges</h3><p class="muted small">Four long chapters of life, counted from your birth date.</p><div class="tbl"><table><tr><th>Ages</th><th>Years</th><th>Pinnacle</th><th>Challenge</th></tr>${N.pinnacles(b).map(p=>`<tr><td>${p.from}${p.to!=null?'–'+p.to:'+'}</td><td>${by+p.from}${p.to!=null?'–'+(by+p.to):' onward'}</td><td>${p.p} · ${N.MEANING[p.p][0]}</td><td>${p.c}</td></tr>`).join('')}</table></div><p class="muted small">The first pinnacle ends at age 36 minus your Life Path number; the next two last nine years each; the fourth runs for the rest of life.</p>`)}
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
function upcoming(){const k=dkey();if(EVC.k!==k){const now=new Date();EVC={k,list:K.events(now,new Date(+now+366*DAY))}}return EVC.list}
views.cosmos=()=>{
 if(!A||!K)return needLib();
 const t=tab(),now=new Date();
 if(t==='moon')return moonView(now);
 if(t==='planets')return planetsView(now);
 if(t==='celestial-events')return eventsView();
 const ev=upcoming(),m=K.moon(now),pos=K.positions(now),rx=pos.filter(p=>p.retro);
 const todays=ev.filter(e=>dkey(e.date)===dkey(now));
 const weather=panel(`<h3>Today’s cosmic weather</h3>${plate('starmap')}<p>The Moon is ${m.name==='Full Moon'?'full':m.name==='New Moon'?'new':'a '+m.name.toLowerCase()} in ${sIdx(m.sign).name}; the Sun is in ${sIdx(pos[0].sign).name}.${rx.length?` ${rx.map(p=>p.n).join(', ')} ${rx.length>1?'are':'is'} retrograde.`:' No planets are retrograde.'}</p>${todays.length?`<p>Today: ${todays.map(e=>`<button class="link" data-act="evtoggle" data-ref="${evRef(e)}">${esc(e.name)}</button>`).join(', ')}.</p>`:''}<p class="muted small">Calculated from an ephemeris for ${esc(TZ())}.</p>`,'glass');
 const view=V.cal.view;
 let body='';
 if(view==='month'){
  const mk=V.cal.month||dkey().slice(0,7),[y,mo]=mk.split('-').map(Number),first=Date.UTC(y,mo-1,1),days=new Date(Date.UTC(y,mo,0)).getUTCDate(),lead=(new Date(first).getUTCDay()+6)%7;
  const byDay={};K.events(new Date(first-14*36e5),new Date(Date.UTC(y,mo,1)+14*36e5)).forEach(e=>{const k=e.dateOnly?e.date.toISOString().slice(0,10):dkey(e.date);if(k.slice(0,7)===mk)(byDay[k]=byDay[k]||[]).push(e)});
  const prev=new Date(Date.UTC(y,mo-2,1)).toISOString().slice(0,7),next=new Date(Date.UTC(y,mo,1)).toISOString().slice(0,7),minK=dkey().slice(0,7);
  const sel=V.cal.day&&V.cal.day.slice(0,7)===mk?V.cal.day:'';
  body=`<div class="cal-h"><button class="btn ghost sm" data-act="calmonth" data-k="${prev}" ${mk<=minK?'disabled':''} aria-label="Previous month">‹</button><h3>${ymdLong(mk+'-01',{month:'long',year:'numeric'})}</h3><button class="btn ghost sm" data-act="calmonth" data-k="${next}" aria-label="Next month">›</button></div>
  <div class="cal" role="grid">${['M','T','W','T','F','S','S'].map(d=>`<div class="cal-d" role="columnheader">${d}</div>`).join('')}${Array.from({length:lead},()=>'<div></div>').join('')}${Array.from({length:days},(_,i)=>{const k=`${mk}-${String(i+1).padStart(2,'0')}`,es=byDay[k]||[];return `<button class="cal-c${k===dkey()?' today':''}${k===sel?' sel':''}${es.length?' has':''}" data-act="calday" data-k="${k}" aria-label="${ymdLong(k)}${es.length?', '+es.length+' event'+(es.length>1?'s':''):''}"><span>${i+1}</span>${es.length?`<i>${es.slice(0,3).map(()=>'•').join('')}</i>`:''}</button>`}).join('')}</div>
  ${sel?`<h3 class="center">${ymdLong(sel)}</h3>${(byDay[sel]||[]).map(e=>evCard(e,true)).join('')||'<p class="muted center">Nothing notable in the sky this day.</p>'}`:'<p class="muted center small">Tap a day to see its events.</p>'}`;
 }else{
  let lastM='';
  body=ev.slice(0,80).map(e=>{const mk=(e.dateOnly?e.date.toISOString().slice(0,10):dkey(e.date)).slice(0,7),h=mk!==lastM?`<h3 class="month-h">${ymdLong(mk+'-01',{month:'long',year:'numeric'})}</h3>`:'';lastM=mk;return h+evCard(e,V.evOpen===evRef(e))}).join('');
 }
 return `<div class="stack"><h1>Cosmic Calendar</h1>${weather}${seg([['list','List'],['month','Month']],view,'calview')}${body}</div>`;
};
function moonView(now){
 const m=K.moon(now),ing=K.moonIngress(now),ph=K.lunarPhases(now,new Date(+now+120*DAY)),nn=ph.find(e=>e.k==='new_moon'),nf=ph.find(e=>e.k==='full_moon');
 return `<div class="stack"><h1>The Moon</h1>${panel(`${plate('moon')}<div class="center">${moonSvg(m,120)}<h2>${m.name}</h2><p>About ${Math.round(m.ill*100)}% lit · ${m.waxing?'waxing':'waning'} · in ${sIdx(m.sign).name}</p><p class="muted small">Enters ${sIdx(ing.sign).name} ${evt(ing.date)}</p></div><div class="rule"></div><div class="label">Traditional reading</div><p>${m.name==='New Moon'?'A moment associated with beginnings. Consider what you would like to plant.':m.name==='Full Moon'?'A moment associated with fullness and gratitude. Notice what has grown.':m.waxing?'A waxing Moon is associated with growth and intention: what would you like to nurture?':'A waning Moon is associated with release: what are you ready to let go of?'} With the Moon in ${sIdx(m.sign).name}, feelings tend to move ${STYLE[sIdx(m.sign).id]}.</p><div class="label">An optional ritual</div><p>${RITUAL[m.name]}</p>`,'glass')}
 ${panel(`<div class="row two"><div><div class="label">Next New Moon</div><p>${nn?evt(nn.date)+'<br><span class="muted">in '+sIdx(nn.sign).name+'</span>':''}</p></div><div><div class="label">Next Full Moon</div><p>${nf?evt(nf.date)+'<br><span class="muted">in '+sIdx(nf.sign).name+'</span>':''}</p></div></div>`)}
 <h3 class="center">Lunar phases ahead</h3>${ph.slice(0,10).map(e=>evCard(e,V.evOpen===evRef(e))).join('')}
 <p class="muted small center">Times are for ${esc(TZ())}. The Moon’s sign is its geocentric position on the tropical zodiac.</p></div>`;
}
function planetsView(now){
 const pos=K.positions(now),rx=K.retrogrades(now,new Date(+now+366*DAY)),ing=upcoming().filter(e=>e.k==='ingress').slice(0,14);
 const d=x=>x?shortD(x):'';
 return `<div class="stack"><h1>Planets</h1>${panel(`<h3>Where the planets are now</h3>${plate('orrery')}<div class="tbl"><table><tr><th></th><th>Planet</th><th>Position</th><th></th></tr>${pos.map(p=>`<tr><td class="glyph">${p.g}</td><td>${p.n}</td><td>${degTxt(p.lon)}</td><td>${p.retro?'℞ retrograde':''}</td></tr>`).join('')}</table></div><p class="muted small">Geocentric, tropical zodiac, ${evt(now)}.</p>`)}
 ${panel(`<h3>Retrograde windows</h3>${rx.length?rx.map(w=>`<div class="asp"><strong>${w.planet}</strong> ${w.start&&w.start<=now&&(!w.end||w.end>=now)?'<span class="badge">now</span>':''}<p class="small">${w.start?d(w.start)+(w.sign!=null?' in '+sIdx(w.sign).name:''):'Before the search window'} → ${w.end?d(w.end)+(w.endSign!=null?' in '+sIdx(w.endSign).name:''):'beyond the next year'}</p><p class="muted small">Traditionally a time to review ${PM[w.planet]}.</p></div>`).join(''):'<p>No retrograde periods in the next year.</p>'}`)}
 <h3 class="center">Coming sign changes</h3>${ing.map(e=>evCard(e,V.evOpen===evRef(e))).join('')}</div>`;
}
function eventsView(){
 const f=V.filter.events||'all',ev=upcoming().filter(e=>['eclipse','season','meteor','conjunction','planet'].includes(e.type)&&e.k!=='ingress'&&(f==='all'||e.type===f));
 return `<div class="stack"><h1>Celestial Events</h1><p class="muted center">Eclipses, solstices, equinoxes, meteor showers and meetings of planets over the next year. Each separates the astronomy from its traditional symbolism.</p>${plate('events')}${chips('Show',[['all','All'],['eclipse','Eclipses'],['season','Seasons'],['meteor','Meteors'],['conjunction','Conjunctions'],['planet','Planets']],f,'fevents')}
 ${ev.length?ev.map(e=>evCard(e,V.evOpen===evRef(e))).join(''):empty('Nothing of this kind in the next year','Try another filter.')}</div>`;
}

/* ----- Settings (outside the six sections) ----- */
views.settings=()=>{
 const t=tab(),n=S.notif,st=S.settings;
 if(t==='notifications')return `<div class="stack"><h1>Notifications</h1><p class="note">Kosmia saves these choices now. Delivery is not switched on yet: it needs push messaging, which is coming in a later release. Nothing will be sent until then, and your browser will ask permission first.</p>${panel(`${[['n_on','Daily horoscope',n.on],['n_wh','Daily Whisper',n.whisper],['n_ev','Important celestial events',n.events],['n_mo','Monthly forecast reminder',n.monthly],['n_an','Yearly forecast reminder',n.annual]].map(([id,l,v])=>`<label class="row"><input type="checkbox" id="${id}" ${v?'checked':''} class="cb"> ${l}</label>`).join('')}<div class="field"><label for="n_time">Delivery time</label><input type="time" id="n_time" value="${n.time}"></div><label class="row"><input type="checkbox" id="n_q" ${n.quiet?'checked':''} class="cb"> Quiet hours</label><div class="row two"><div class="field"><label for="n_qf">From</label><input type="time" id="n_qf" value="${n.quietFrom}"></div><div class="field"><label for="n_qt">Until</label><input type="time" id="n_qt" value="${n.quietTo}"></div></div><p class="muted small">Times are in your time zone (${esc(TZ())}).</p>`)}</div>`;
 if(t==='privacy')return `<div class="stack"><h1>Privacy</h1>
  ${panel(`<h3>What Kosmia keeps</h3><p>Your email, chosen sign and name; your Whispers, reflections, journal, readings, bookmarks and connections; and, only if you agree, your birth details. Everything is private to your account and protected so that only you can read it.</p><p class="muted small">AI features send only what they need: the tarot cards drawn, a forecast’s sign and period, or what you type to Kassandra.</p>`)}
  ${panel(`<h3>Consent</h3><label class="row consent"><input type="checkbox" id="p_birth" ${S.birthConsent?'checked':''} class="cb"> <span>Keep my birth details in my account</span></label><label class="row consent"><input type="checkbox" id="p_kas" ${st.kPersonal?'checked':''} class="cb"> <span>Let Kassandra see my sign, chart placements and numbers when I talk with her</span></label>`)}
  ${panel(`<h3>Your data</h3><button class="btn ghost" data-act="export">Download my data</button><button class="btn ghost" data-act="delbirth">Delete my birth details</button><div class="rule"></div><h3>Delete account</h3><p class="muted small">This permanently removes your account and everything in it. It cannot be undone.</p>${V.confirmDel?`<div class="field"><label for="delc">Type DELETE to confirm</label><input type="text" id="delc" autocomplete="off"></div><div class="row"><button class="btn danger" data-act="delacct">Delete my account</button><button class="btn ghost" data-act="canceldel">Cancel</button></div>`:`<button class="btn ghost danger-t" data-act="askdel" ${C.user?'':'disabled'}>Delete my account</button>${C.user?'':'<p class="muted small">Sign in to manage an account.</p>'}`}`)}</div>`;
 if(t==='display')return `<div class="stack"><h1>Display</h1>${panel(`<label class="row"><input type="checkbox" id="d_rm" ${st.reduce?'checked':''} class="cb"> Reduce motion (no card flips or sparkles)</label><label class="row"><input type="checkbox" id="d_lg" ${st.large?'checked':''} class="cb"> Larger text</label><p class="muted small">Kosmia also follows your device’s reduced-motion setting.</p>`)}${panel(`<h3>Time zone</h3><div class="field"><label for="d_tz">Days, weeks and events use</label><select id="d_tz"><option value="">This device (${esc(DEVICE_TZ)})</option>${(Intl.supportedValuesOf?Intl.supportedValuesOf('timeZone'):[]).map(z=>`<option ${st.tz===z?'selected':''}>${z}</option>`).join('')}</select></div>`)}${panel(`<h3>Kassandra</h3><label class="row"><input type="checkbox" id="d_vo" ${st.voiceOut?'checked':''} class="cb"> Read Kassandra’s replies aloud</label>`)}</div>`;
 const acct=!C.enabled?'<h3>Local mode</h3><p class="muted">Accounts and sync are not configured for this build, so everything stays in this browser.</p>'
  :C.user?`<h3>Signed in</h3><p class="muted">${esc(C.user.email||'')} · synced across your devices.</p>`
  :`<h3>Not signed in</h3><p class="muted">Create an account or sign in to keep your universe in sync across devices.</p><button class="btn" data-act="toauth">Sign in or create an account</button>`;
 return `<div class="stack"><h1>Account</h1>${panel(acct)}${panel(`<h3>My sign</h3>${signGrid('My sign',S.sign)}<div class="field"><label for="nm">Display name</label><input type="text" id="nm" value="${esc(S.name)}"></div><button class="btn" data-act="savename">Save</button>`)}${C.user?panel(`<h3>Password</h3><div class="field"><label for="npw">New password</label><input id="npw" type="password" autocomplete="new-password" minlength="6"></div><button class="btn ghost" data-act="setpw">Change password</button>`):''}${panel(`<button class="btn ghost" data-act="signout">Sign out${C.user?'':' and clear this device'}</button>`)}</div>`;
};

/* ---------- Kassandra: the floating fortune teller ---------- */
const KS={open:false,msgs:[],busy:false,rec:null,state:'idle',chunks:[]};
function kasPrompts(){
 const t=tab(),T=V.tarot;
 if(V.sec==='oracle'&&t==='tarot'&&T.drawn&&T.stage==='read')return ['What does this card suggest?','How do these cards speak to each other?','What question should I sit with?'];
 if(V.sec==='oracle')return ['What does today’s Whisper suggest?','How can I reflect on it today?','What is a synchronicity?'];
 if(V.sec==='blueprint')return ['Explain my rising sign','What does my Life Path mean?','What is a Personal Year?'];
 if(V.sec==='cosmos')return ['What is happening in the sky this week?','What does a retrograde really mean?','When is the next full moon?'];
 if(V.sec==='affinity')return ['What makes signs compatible?','What is synastry?','How does Soul Resonance work?'];
 if(V.sec==='horoscopes')return ['What does this forecast mean for me?','What is happening in the sky this week?','How should I use a horoscope?'];
 return ['What does this card suggest?','Explain my rising sign','What is happening in the sky this week?'];
}
// what is on screen, in a sentence or two, so Kassandra can answer about it
function kasContext(){
 const t=tab(),ctx={section:(SECTIONS[V.sec]||{label:V.sec}).label,view:tabLabel(V.sec,t)},T=V.tarot,k=dkey();
 if(V.sec==='oracle'&&t==='tarot'&&T.stage==='read'&&T.drawn)ctx.reading=`Tarot spread ${SPREADS[T.spread].n}${T.q?', question “'+T.q+'”':''}. Cards: `+T.drawn.map(c=>`${c.pos}: ${c.shown?c.name+(c.rv?' (reversed)':''):'face down'}`).join('; ');
 else if(S.revealed[k]&&(V.sec==='oracle'||V.sec==='home')){const c=todayCard();ctx.reading=`Today’s Whisper card: “${c.title}”: ${c.msg} Reflection question: ${c.ref}`}
 else if(V.sec==='horoscopes'){const ex=V.exploreSign||S.sign,h=horoscope(ex,t,V.period);ctx.reading=`${sg(ex).name} ${tabLabel('horoscopes',t)} horoscope, ${V.period}: ${h.body}`}
 else if(V.sec==='affinity'&&V.love.done&&V.love.b)ctx.reading=`Comparing ${sg(V.love.a||S.sign).name} with ${sg(V.love.b).name}.`;
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
function renderKas(){
 const btn=$('#kas-btn'),box=$('#kas'),on=!!S.sign&&!['welcome','join','reset'].includes(V.sec);
 btn.hidden=!on||KS.open;box.hidden=!on||!KS.open;
 if(!on||!KS.open)return;
 const signed=!!C.user,rec=KS.state;
 $('#kas-body').innerHTML=`${KS.msgs.length?'':`<p class="kas-hello">Good ${new Date().getHours()<12?'morning':new Date().getHours()<18?'afternoon':'evening'}. I am Kassandra. Ask me about your cards, your chart, your numbers or the sky. I speak in symbols, not certainties.</p>`}${KS.msgs.map(m=>`<div class="kas-m ${m.role}">${esc(m.content).replace(/\n+/g,'<br>')}</div>`).join('')}${KS.busy?'<div class="kas-m assistant muted">Kassandra is gazing into the crystal…</div>':''}`;
 $('#kas-chips').innerHTML=signed?kasPrompts().map(p=>`<button class="fchip" data-act="kasask" data-q="${esc(p)}">${esc(p)}</button>`).join(''):'';
 $('#kas-foot').innerHTML=signed?`<label class="kas-share"><input type="checkbox" id="kas-p" ${S.settings.kPersonal?'checked':''} class="cb"> Share my sign, chart and numbers</label><form id="kas-f" class="kas-f"><input type="text" id="kas-in" placeholder="${rec==='listening'?'Listening… tap ■ to finish':rec==='processing'?'Hearing your question…':'Ask Kassandra…'}" aria-label="Your question for Kassandra" ${rec!=='idle'?'disabled':''} maxlength="600"><button type="button" class="kas-mic${rec==='listening'?' on':''}" data-act="kasmic" aria-label="${rec==='listening'?'Stop recording':'Ask with your voice'}" ${rec==='processing'||KS.busy?'disabled':''}>${rec==='listening'?'■':'🎙︎'}</button><button type="submit" class="kas-send" aria-label="Send" ${KS.busy||rec!=='idle'?'disabled':''}>➤</button></form>`
  :`<p class="muted small">Sign in to talk with Kassandra.</p><button class="btn sm" data-act="toauth">Sign in</button>`;
 const b=$('#kas-body');b.scrollTop=b.scrollHeight;
}
function kasOpen(q){KS.open=true;renderKas();const i=$('#kas-in');if(q)kasSend(q);else if(i)i.focus()}
function kasClose(){KS.open=false;kasStopRec(true);renderKas();$('#kas-btn').focus()}
function kasSend(q){
 q=String(q||'').trim();if(!q||KS.busy)return;if(!C.user){renderKas();return}
 KS.msgs.push({role:'user',content:q});KS.busy=true;renderKas();
 C.kassandra(KS.msgs.slice(-12),kasContext()).then(r=>{KS.msgs.push({role:'assistant',content:r.reply||'…'});if(S.settings.voiceOut&&r.reply)playText(r.reply.slice(0,1400))},e=>{KS.msgs.push({role:'assistant',content:e.message||'The crystal is clouded. Try again in a moment.'})}).then(()=>{KS.busy=false;renderKas();const i=$('#kas-in');if(i)i.focus()});
}
// voice: record only while the reader holds the conversation open and has pressed the microphone
async function kasMic(){
 if(KS.state==='listening')return kasStopRec(false);
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder)return toast('Voice questions are not supported in this browser. You can type instead.');
 let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){return toast('Microphone permission was not given. You can type your question instead.')}
 const type=['audio/webm','audio/mp4','audio/ogg'].find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||'';
 const rec=new MediaRecorder(stream,type?{mimeType:type}:undefined);KS.chunks=[];KS.rec=rec;KS.state='listening';
 rec.ondataavailable=e=>{if(e.data.size)KS.chunks.push(e.data)};
 rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());if(KS.cancel){KS.cancel=false;KS.state='idle';renderKas();return}
  const blob=new Blob(KS.chunks,{type:(rec.mimeType||type||'audio/webm').split(';')[0]});KS.state='processing';renderKas();
  C.transcribe(blob).then(r=>{KS.state='idle';if(r.text)kasSend(r.text);else{toast('Kassandra did not catch that. Try again or type.');renderKas()}},e=>{KS.state='idle';toast(e.message||'Could not hear that. Try typing.');renderKas()})};
 rec.start();renderKas();
 clearTimeout(KS.timer);KS.timer=setTimeout(()=>kasStopRec(false),45000);
}
function kasStopRec(cancel){if(KS.rec&&KS.rec.state!=='inactive'){KS.cancel=!!cancel;KS.rec.stop()}KS.rec=null;clearTimeout(KS.timer)}

/* ---------- render + events ---------- */
const onboarding=()=>['welcome','join','reset'].includes(V.sec);
function render(){
 const app=$('#app'),sec=V.sec,authed=!!S.sign&&!onboarding();
 const html=(views[sec]||views.home)();
 app.innerHTML=sec==='welcome'||sec==='join'?html:framed(sec,html);
 document.querySelectorAll('.jpage textarea').forEach(jfit);
 $('#nav').hidden=!authed;document.body.classList.toggle('has-nav',authed);
 const f=authed&&SECTIONS[sec]?SECTIONS[sec].tabs:null,foot=$('#foot');
 foot.hidden=!f;document.body.classList.toggle('has-footer',!!f);app.classList.toggle('has-footer',!!f);app.classList.toggle('foot-icons',!!f);
 app.classList.toggle('onboard',sec==='welcome'||sec==='join');document.body.classList.toggle('onboarding',sec==='welcome'||sec==='join');
 document.body.classList.toggle('reduce',!!S.settings.reduce);document.body.classList.toggle('large',!!S.settings.large);
 if(f){$('#footin').innerHTML=f.map(([k,l,ic])=>`<button role="tab" aria-selected="${tab()===k}" data-tab="${k}">${pic('cats',ic,'foot-ico')}<span>${l}</span></button>`).join('');$('#footin').setAttribute('aria-label',SECTIONS[sec].label+' sections');foot.classList.toggle('many',f.length>4)}
 $('#navin').innerHTML=MAIN.map(k=>`<button data-nav="${k}" ${sec===k?'aria-current="page"':''}>${pic('nav',SECTIONS[k].icon,'nav-ico')}<span>${SECTIONS[k].label}</span></button>`).join('')+`<button class="nav-set" data-nav="settings" aria-label="Settings" ${sec==='settings'?'aria-current="page"':''}>${pic('cats','settings','nav-ico')}</button>`;
 navH();
 document.title=authed&&SECTIONS[sec]?`${tabLabel(sec,tab())} · ${SECTIONS[sec].label} · Kosmia`:'Kosmia';
 // keep the chosen sign (and the active footer item) in view
 document.querySelectorAll('.sign-row [aria-checked=true]').forEach(pk=>{const row=pk.parentElement,rb=row.getBoundingClientRect(),cb=pk.getBoundingClientRect();row.scrollLeft+=cb.left+cb.width/2-(rb.left+rb.width/2)});
 const fa=$('#footin [aria-selected=true]');if(fa){const r=$('#footin'),rb=r.getBoundingClientRect(),cb=fa.getBoundingClientRect();if(cb.left<rb.left||cb.right>rb.right)r.scrollLeft+=cb.left+cb.width/2-(rb.left+rb.width/2)}
 if(sec==='join'||sec==='welcome')bindJoin();
 if(authed&&SECTIONS[sec])syncUrl();
 renderKas();
}
/* Page frame (art/frame.webp, 1024x1536): the view's first <h1> moves onto the banner. Home shows the user's sign with its
   element and ruler; Horoscopes shows the sign being read and its dates. */
function framed(sec,html){
 const m=/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html);let kick=(SECTIONS[sec]||{}).label||'',title=m?m[1]:'Kosmia',sub='';
 if(sec==='home'&&tab()==='today'){const s=sg(S.sign);kick='';title=s.name;sub=`${s.el} · ruled by ${s.ruler}`;if(m)html=html.replace(m[0],'')}
 else{
  if(m)html=html.replace(m[0],'');
  if(sec==='horoscopes'){const s=sg(V.exploreSign||S.sign);kick='Horoscope';title=s.name;sub=s.dates}
  if(plain(title).includes(kick))kick='';
 }
 const n=Math.max(plain(title).length,1),wrap=n>16,fs=wrap?Math.max(44,Math.min(58,Math.round(1560/n))):Math.min(64,Math.round(720/n));
 if(wrap)kick='';
 return `<div class="page"><header class="banner">${kick?`<span class="b-kick">${kick}</span>`:''}<h1 class="b-title${wrap?' b-wrap':''}" style="--fs:${fs}">${title}</h1>${sub?`<span class="b-sub">${sub}</span>`:''}</header><div class="frame"><div class="frame-in">${html}</div></div></div>`;
}
// the page reserves exactly the menu bar's height (it grows when labels wrap), and Kassandra sits just above the footer
const navH=()=>{const n=$('#nav'),f=$('#foot'),r=document.documentElement.style;if(!n.hidden)r.setProperty('--navh',n.offsetHeight+'px');r.setProperty('--footh',(f.hidden?0:f.offsetHeight)+'px')};
addEventListener('resize',navH);
/* Onboarding: create an account (email, password, sign), sign in, or, in local mode, just enter. */
function joinState(){
 const up=V.auth!=='in',acct=C.enabled&&!C.user,s=V.joinSign&&sg(V.joinSign),em=$('#em'),pw=$('#pw');
 const ok=(!em||/^\S+@\S+\.\S+$/.test(em.value.trim()))&&(!pw||pw.value.length>=6)&&((acct&&!up)||!!s);
 const label=acct&&!up?'Sign in':s?`${acct?'Begin':'Enter'} as <span class="glyph">${s.g}</span> ${s.name}`:'Choose your sign';
 return {ok,label};
}
function syncJoin(){const b=$('#joinBtn');if(!b)return;const j=joinState();b.innerHTML=V.busy?'One moment…':j.label;b.disabled=!j.ok||V.busy}
function pickSign(id){
 V.joinSign=id;$('.wheel').classList.add('has-pick');
 document.querySelectorAll('.wheel [data-sign]').forEach(p=>{const on=p.dataset.sign===id;p.setAttribute('aria-checked',on);p.tabIndex=on?0:-1;if(on)p.focus({preventScroll:true})});
 syncJoin();
}
const authMsg=x=>{const m=(x&&x.message)||'';
 if(/invalid login/i.test(m))return 'That email and password don’t match.';
 if(/already (registered|exists)/i.test(m))return 'An account already exists for this email. Sign in instead.';
 if(/rate limit|too many/i.test(m))return 'Too many attempts. Please wait a minute and try again.';
 return m||'Something went wrong. Please try again.'};
async function submitJoin(e){
 e.preventDefault();if($('#joinBtn').disabled)return;
 const em=$('#em'),pw=$('#pw'),email=em?em.value.trim():S.email,err=$('#authErr');
 if(!C.enabled||C.user){S.email=email;if(V.joinSign)S.sign=V.joinSign;save();if(C.user)syncProfile();return go('home','today',{replace:true})}
 V.busy=true;syncJoin();if(err)err.textContent='';
 try{
  if(V.auth!=='in'){
   const r=await C.signUp(email,pw.value,V.joinSign);
   if(!r.session)throw new Error('Could not create your account. Please try again.');
   S.sign=V.joinSign;
  }else await C.signIn(email,pw.value);
  S.email=email;save();V.busy=false;
  // the auth listener now runs pullMerge, which opens the page once the profile has a sign
 }catch(x){V.busy=false;syncJoin();if(err)err.textContent=authMsg(x)}
}
function bindJoin(){const f=$('#authForm');f.addEventListener('input',syncJoin);f.addEventListener('submit',submitJoin);syncJoin()}
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
 if(i>=0){S.bookmarks.splice(i,1);C.deleteBookmark&&C.deleteBookmark(kind,ref);toast('Removed from Saved')}
 else{const b={id:uuid(),kind,ref,data,at:new Date().toISOString()};S.bookmarks.push(b);C.saveBookmark&&C.saveBookmark(b).then(()=>{b.sy=true;save()});toast('Saved')}
 save();render();
}
async function placeSearch(id){
 const inp=$('#'+id+'-q'),q=inp?inp.value.trim():'';const P=V.places[id]={q};
 if(q.length<2){P.err='Type at least two letters of the place.';return render()}
 P.busy=true;render();
 try{const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=${encodeURIComponent(q)}`);const j=await r.json();P.results=(j.results||[]).filter(x=>x.timezone)}
 catch(e){P.err='The place search is unavailable right now. Check your connection and try again.'}
 P.busy=false;render();
}
function connOpen(c){
 if(c.kind==='zodiac'){V.love={a:c.data.a,b:c.data.b,done:true};return go('affinity','zodiac-match')}
 if(c.kind==='resonance'){V.res={a:c.data.a,b:c.data.b,done:true};return go('affinity','soul-resonance')}
 V.syn=Object.assign({},c.data.them,{done:true});go('affinity','synastry');
}
function saveConn(kind){
 let data,dupe;
 if(kind==='zodiac'){const a=V.love.a||S.sign,b=V.love.b;data={a,b};dupe=S.conns.find(c=>c.kind==='zodiac'&&c.data.a===a&&c.data.b===b)}
 else if(kind==='resonance'){data={a:V.res.a||S.fullName||S.name,b:V.res.b};dupe=S.conns.find(c=>c.kind==='resonance'&&c.data.a===data.a&&c.data.b===data.b)}
 else{const Y=V.syn;data={them:{name:Y.name,date:Y.date,time:Y.unk?'':Y.time,unk:!!Y.unk||!Y.time,place:Y.place,lat:Y.lat,lon:Y.lon,tz:Y.tz}};dupe=S.conns.find(c=>c.kind==='synastry'&&(c.data.them||{}).date===Y.date&&(c.data.them||{}).name===Y.name)}
 if(dupe)return toast('Already in Connections');
 const c={id:uuid(),kind,name:kind==='synastry'?(V.syn.name||''):'',data,note:'',at:new Date().toISOString()};
 S.conns.push(c);save();C.saveConnection&&C.saveConnection(c).then(()=>{c.sy=true;save()});
 if(kind==='zodiac'&&C.saveMatch)C.saveMatch(data.a,data.b);
 toast('Saved to Connections');render();
}
function exportData(){
 const blob=new Blob([JSON.stringify({exported:new Date().toISOString(),account:S.email,profile:{sign:S.sign,name:S.name,fullName:S.fullName,altName:S.altName,birth:S.birth,birthConsent:S.birthConsent,settings:S.settings,notifications:S.notif},whispers:Object.keys(S.revealed).sort().map(d=>({day:d,card:cardFor(d).title,saved:S.saved.some(x=>x.date===d),note:S.notes[d]||''})),journal:S.journal,tarotReadings:S.readings,connections:S.conns,bookmarks:S.bookmarks},null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`kosmia-data-${dkey()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
function signOutLocal(){try{localStorage.removeItem(KEY);localStorage.removeItem('kosmia.h')}catch(x){}S=fresh();V.joinSign='';V.paint={};V.auth='in';KS.msgs=[];KS.open=false;V.sec='welcome';history.replaceState(null,'','/');render();window.scrollTo(0,0)}

document.addEventListener('submit',e=>{if(e.target.id==='kas-f'){e.preventDefault();const i=$('#kas-in');const v=i.value;i.value='';kasSend(v)}});
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-go],[data-nav],[data-tab],[data-act],[data-sign],[data-sign2],[data-period],[data-pick],[data-planet],[data-calview]');
 if(!t)return;
 if(t.dataset.go)return go(t.dataset.go,t.dataset.t||null);
 if(t.dataset.nav)return go(t.dataset.nav);
 if(t.dataset.tab){V.edit=null;history.replaceState(Object.assign({},history.state,{scroll:scrollY}),'');V.tab[V.sec]=t.dataset.tab;history.pushState({scroll:0},'',pathFor(V.sec,t.dataset.tab,viewQuery()));render();return window.scrollTo(0,0)}
 if(t.dataset.period){V.period=t.dataset.period;return render()}
 if(t.dataset.calview){V.cal.view=t.dataset.calview;if(!V.cal.month)V.cal.month=dkey().slice(0,7);return render()}
 if(t.dataset.planet){V.chartSel=t.dataset.planet;return render()}
 if(t.dataset.pick!==undefined){const T=V.tarot,i=Number(t.dataset.pick),n=SPREADS[T.spread].p.length,x=T.picks.indexOf(i);if(x>=0)T.picks.splice(x,1);else if(T.picks.length<n)T.picks.push(i);render();if(T.picks.length===n)setTimeout(drawCards,450);return}
 if(t.dataset.sign2){V.love.b=t.dataset.sign2;V.love.done=false;return render()}
 if(t.dataset.sign&&!t.dataset.act){
  const id=t.dataset.sign;
  if(V.sec==='join'||V.sec==='welcome')return pickSign(id);
  if(V.sec==='horoscopes'){V.exploreSign=id;return render()}
  if(V.sec==='affinity'){V.love.a=id;V.love.done=false;return render()}
  if(V.sec==='settings'){S.sign=id;save();syncProfile();toast('Your sign is now '+sg(id).name);return render()}
 }
 const a=t.dataset.act;if(!a)return;
 if(a==='reveal')return reveal();
 if(a==='kasopen')return kasOpen();
 if(a==='kasclose')return kasClose();
 if(a==='kasask'){V.tpop=null;if(!KS.open)render();return kasOpen(t.dataset.q)}
 if(a==='kasmic')return kasMic();
 if(a==='setsign'){S.sign=t.dataset.sign;V.exploreSign=null;save();syncProfile();toast('Your sign is now '+sg(S.sign).name);return render()}
 if(a==='domatch'){V.love.done=true;return render()}
 if(a==='saveconn')return saveConn(t.dataset.kind);
 if(a==='doresonance'){V.res={a:$('#ra').value.trim(),b:$('#rb').value.trim(),done:true};if(!N.clean(V.res.a)||!N.clean(V.res.b)){V.res.done=false;toast('Enter both names')}return render()}
 if(a==='dosyn'){readSyn();if(!V.syn.date)return toast('Add their date of birth');V.syn.done=true;return render()}
 if(a==='openconn'){const c=S.conns.find(x=>x.id===t.dataset.id);return c&&connOpen(c)}
 if(a==='editconn'){V.edit='conn:'+t.dataset.id;return render()}
 if(a==='saveconnedit'){const c=S.conns.find(x=>x.id===t.dataset.id);if(c){c.name=$('#cn').value.trim();c.note=$('#cnote').value.trim();save();C.saveConnection&&C.saveConnection(c)}V.edit=null;toast('Saved');return render()}
 if(a==='delconn'){const c=S.conns.find(x=>x.id===t.dataset.id);if(c&&confirm('Delete this connection?')){S.conns=S.conns.filter(x=>x!==c);save();C.deleteConnection&&C.deleteConnection(c.id);if(c.kind==='zodiac'&&C.deleteMatch)C.deleteMatch(c.data.a,c.data.b);toast('Deleted')}return render()}
 if(a==='savecard'){const k=dkey(),c=todayCard(),i=S.saved.findIndex(x=>x.date===k);if(i>=0){S.saved.splice(i,1);toast('Removed from saved')}else{S.saved.push({id:c.id,date:k});toast('Saved to Readings')}save();syncFortune(k);return render()}
 if(a==='unsave'){const k=t.dataset.k;S.saved=S.saved.filter(x=>x.date!==k);save();syncFortune(k);return render()}
 if(a==='savenote'){const k=dkey();S.notes[k]=$('#note').value;save();syncFortune(k);return toast('Reflection saved')}
 if(a==='editnote'){V.edit=t.dataset.kind+':'+t.dataset.id;render();const x=$('#ed');if(x)x.focus();return}
 if(a==='canceledit'){V.edit=null;return render()}
 if(a==='savenoteed'){const v=$('#ed').value.trim(),id=t.dataset.id;
  if(t.dataset.kind==='fortune'){S.notes[id]=v;syncFortune(id)}
  else{const r=S.readings.find(x=>x.id===id);if(r){r.note=v;if(r.rid)C.updateReading&&C.updateReading(r.rid,v)}}
  save();V.edit=null;if(V.sec==='home'&&tab()==='journal'){V.jdraft=null;const k=t.dataset.kind==='fortune';V.jpage=journalPages().findIndex(p=>k?p.t==='n'&&p.day===id:p.t==='r'&&p.r.id===id);if(V.jpage<0)V.jpage=null}toast(t.dataset.kind==='fortune'?'Reflection saved':'Note saved');return render()}
 if(a==='delread'){const r=S.readings.find(x=>x.id===t.dataset.id);if(r&&confirm('Delete this reading?')){S.readings=S.readings.filter(x=>x!==r);save();if(r.rid)C.deleteReading&&C.deleteReading(r.rid);toast('Reading deleted')}return render()}
 if(a==='fsaved'){V.filter.saved=t.dataset.k;return render()}
 if(a==='fevents'){V.filter.events=t.dataset.k;return render()}
 if(a==='jkind'){V.jdraft=Object.assign($('#jb')?readJournalDraft():(V.jdraft||{title:'',body:''}),{kind:t.dataset.k});return render()}
 if(a==='jname'){const v=$('#jn').value.trim();if(!v)return toast('Write your name first');const opening=!V.jnameEdit;S.settings.jname=v;if(!S.fullName)S.fullName=v;V.jnameEdit=false;save();syncProfile();render();if(opening)jflip(journalPages().length-1);return}
 if(a==='jnameedit'){V.jnameEdit=true;render();const x=$('#jn');if(x){x.focus();x.select()}return}
 if(a==='jnamecancel'){V.jnameEdit=false;return render()}
 if(a==='jflip'){const n=journalPages().length;return jflip(t.dataset.to==='last'?n-1:jIdx(journalPages())+(+t.dataset.d))}
 if(a==='savejournal'){const d=readJournalDraft();if(!d.body.trim())return toast('Write something first');
  if(V.jedit){const j=S.journal.find(x=>x.id===V.jedit);if(j){Object.assign(j,{kind:d.kind,title:d.title.trim(),body:d.body.trim()});C.saveJournal&&C.saveJournal(j)}}
  else{const j={id:uuid(),day:dkey(),kind:d.kind,title:d.title.trim(),body:d.body.trim(),at:new Date().toISOString()};S.journal.push(j);C.saveJournal&&C.saveJournal(j).then(()=>{j.sy=true;save()})}
  const jid=V.jedit;V.jdraft=null;V.jedit=null;save();if(!jid)V.jpage=journalPages().findIndex(p=>p.t==='j'&&p.j===S.journal[S.journal.length-1]);toast('Saved to your journal');return render()}
 if(a==='editjournal'){const j=S.journal.find(x=>x.id===t.dataset.id);if(j){V.jedit=j.id;V.jdraft={kind:j.kind,title:j.title,body:j.body};render();window.scrollTo(0,0)}return}
 if(a==='canceljournal'){V.jedit=null;V.jdraft=null;return render()}
 if(a==='deljournal'){const j=S.journal.find(x=>x.id===t.dataset.id);if(j&&confirm('Delete this journal entry?')){S.journal=S.journal.filter(x=>x!==j);save();C.deleteJournal&&C.deleteJournal(j.id);toast('Entry deleted')}if(V.jpage!=null)V.jpage=Math.max(1,V.jpage-1);return render()}
 if(a==='bookhoro'){const [sign,cat,period,key]=t.dataset.ref.split('/'),h=horoscope(sign,cat,period);return bookmark('horoscope',t.dataset.ref,{sign,cat,period,key,start:h.per.start,end:h.per.end,body:h.body,focus:h.focus})}
 if(a==='bookev'){const e=upcoming().find(x=>evRef(x)===t.dataset.ref);if(e)bookmark('event',t.dataset.ref,{name:e.name,date:e.date.toISOString(),when:evWhen(e)});return}
 if(a==='unbook'){const i=S.bookmarks.findIndex(b=>b.kind===t.dataset.kind&&b.ref===t.dataset.ref);if(i>=0)bookmark(t.dataset.kind,t.dataset.ref);return}
 if(a==='evtoggle'){V.evOpen=V.evOpen===t.dataset.ref?null:t.dataset.ref;if(V.sec==='cosmos'&&tab()==='calendar'&&V.cal.view==='month'&&V.evOpen){const e=upcoming().find(x=>evRef(x)===V.evOpen);if(e)V.cal.day=e.dateOnly?e.date.toISOString().slice(0,10):dkey(e.date)}return render()}
 if(a==='calmonth'){V.cal.month=t.dataset.k;V.cal.day='';return render()}
 if(a==='calday'){V.cal.day=t.dataset.k;return render()}
 if(a==='placesearch')return placeSearch(t.dataset.id);
 if(a==='placepick'){const P=V.places[t.dataset.id],r=P.results[+t.dataset.i],obj=t.dataset.id==='syn'?V.syn:V.birthDraft;
  if(t.dataset.id==='syn')readSyn();else readBirth();
  Object.assign(obj,{place:[r.name,r.admin1,r.country].filter(Boolean).join(', '),lat:r.latitude,lon:r.longitude,tz:r.timezone});V.places[t.dataset.id]={};return render()}
 if(a==='savebirth'){readBirth();const b=V.birthDraft;if(!b.date)return toast('Add your date of birth');
  if(b.name!=null)S.fullName=b.name.trim();S.birth=Object.assign({},b,{time:b.unk?'':b.time});delete S.birth.name;S.birthConsent=$('#bcons').checked;V.birthDraft=null;save();syncProfile();toast(S.birthConsent?'Saved to your account':'Saved on this device');return render()}
 if(a==='savenames'){S.fullName=$('#fn').value.trim();S.altName=$('#an').value.trim();S.settings.yMode=$('#ym').value;save();syncProfile();return render()}
 if(a==='tohoroscope'){V.exploreSign=null;V.period='daily';return go('horoscopes','overview')}
 if(a==='savename'){S.name=$('#nm').value.trim();save();syncProfile();return toast('Saved')}
 if(a==='signout'){Promise.resolve(C.user&&C.signOut()).catch(()=>{});return signOutLocal()}
 if(a==='export')return exportData();
 if(a==='delbirth'){if(!confirm('Delete your birth details from this device and your account?'))return;S.birth=fresh().birth;S.birthConsent=false;V.birthDraft=null;save();syncProfile();toast('Birth details deleted');return render()}
 if(a==='askdel'){V.confirmDel=true;return render()}
 if(a==='canceldel'){V.confirmDel=false;return render()}
 if(a==='delacct'){if(($('#delc').value||'').trim()!=='DELETE')return toast('Type DELETE to confirm');t.disabled=true;
  C.deleteAccount().then(()=>{V.confirmDel=false;signOutLocal();toast('Your account has been deleted')},x=>{t.disabled=false;toast(/function|does not exist|schema/i.test(x.message||'')?'Account deletion is not available yet. Please try again later.':(x.message||'Could not delete the account'))});return}
 if(a==='toauth'){KS.open=false;V.auth=S.email?'in':'up';V.sec='welcome';return render()}
 if(a==='authmode'){const em=$('#em');if(em)S.email=em.value.trim();V.auth=V.auth==='in'?'up':'in';render();const f=$(S.email?'#pw':'#em');if(f)f.focus();return}
 if(a==='forgot'){const em=$('#em'),email=em?em.value.trim():'';
  if(!/^\S+@\S+\.\S+$/.test(email)){toast('Enter your email first');if(em)em.focus();return}
  C.resetPassword(email).then(()=>toast('If an account exists for that email, a reset link is on its way.'),x=>toast(authMsg(x)));return}
 if(a==='setpw'){const v=$('#npw').value;if(v.length<6)return toast('Use at least 6 characters');
  t.disabled=true;C.updatePassword(v).then(()=>{toast('Password updated');if(V.sec==='reset')go('home','today',{replace:true});else{t.disabled=false;$('#npw').value=''}},x=>{t.disabled=false;toast(authMsg(x))});return}
 const T=V.tarot;
 if(a==='tspread'){T.q=($('#q')||{value:T.q}).value;T.spread=t.dataset.k;return render()}
 if(a==='shuffle'){T.q=($('#q')||{value:T.q}).value.trim();T.deck=shuffle(DECK);T.picks=[];T.stage='pick';T.ai='';T.aiState='';render();return window.scrollTo(0,0)}
 if(a==='tflip'){const c=T.drawn[+t.dataset.k];if(!c.shown){c.shown=true;render();if(T.drawn.every(x=>x.shown))setTimeout(interpret,1200);return}V.tpop=+t.dataset.k;V.tctx=SPREAD_CTX[T.spread]||'love';return render()}
 if(a==='sopen'){V.spop={kind:t.dataset.kind,ref:t.dataset.ref};return render()}
 if(a==='spopclose'){if(e.target.closest('.pop-box')&&!e.target.closest('.pop-x'))return;V.spop=null;return render()}
 if(a==='tpopclose'){if(e.target.closest('.pop-box')&&!e.target.closest('.pop-x'))return;V.tpop=null;return render()}
 if(a==='saveread'){const note=($('#tnote')||{value:''}).value.trim(),r={id:uuid(),spread:T.spread,q:T.q,date:dkey(),at:new Date().toISOString(),note,cards:T.drawn.map(c=>({id:c.id,pos:c.pos,name:c.name,rev:c.rv}))};
  S.readings.push(r);T.savedId=r.id;save();C.saveReading&&C.saveReading(r).then(id=>{if(id){r.rid=id;r.id=id;r.sy=true;T.savedId=id;save()}});toast('Saved to Readings');return render()}
 if(a==='tctx'){V.tctx=t.dataset.k;return render()}
 if(a==='newread'){T.stage='setup';T.q='';T.ai='';T.aiState='';T.savedId=null;V.tpop=null;render();return window.scrollTo(0,0)}
});
function readJournalDraft(){const k=(V.jdraft||{}).kind;return {kind:k==='synchronicity'?k:'reflection',title:($('#jt')||{value:''}).value,body:($('#jb')||{value:''}).value}}
function readSyn(){const Y=V.syn,g=id=>$('#'+id);if(g('sn'))Y.name=g('sn').value.trim();if(g('sd'))Y.date=g('sd').value;if(g('su'))Y.unk=g('su').checked;if(g('st'))Y.time=g('st').value}
function readBirth(){const b=V.birthDraft||(V.birthDraft=Object.assign({},S.birth)),g=id=>$('#'+id);if(g('bn'))b.name=g('bn').value;if(g('bd'))b.date=g('bd').value;if(g('bu'))b.unk=g('bu').checked;if(g('bt'))b.time=g('bt').value}
const tap=el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true}));
document.addEventListener('keydown',e=>{
 if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&$('.jbook')&&!e.target.closest('input,textarea,select,.wheel')){e.preventDefault();return jflip(jIdx(journalPages())+(e.key==='ArrowRight'?1:-1))}
 if(e.key==='Enter'&&e.target.id==='jn'){e.preventDefault();return tap($('[data-act=jname]'))}
 if(e.key==='Escape'&&KS.open)return kasClose();
 if(e.key==='Escape'&&V.tpop!=null){V.tpop=null;return render()}
 if(e.key==='Escape'&&V.spop){V.spop=null;return render()}
 const w=e.target.closest&&e.target.closest('.wheel [data-sign]');
 if(w&&/^Arrow/.test(e.key)){e.preventDefault();const i=SIGNS.findIndex(s=>s.id===w.dataset.sign),d=e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1;return tap($(`.wheel [data-sign="${SIGNS[(i+d+12)%12].id}"]`))}
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('.scene[data-act],[data-planet],.wheel [data-sign]')){e.preventDefault();tap(e.target)}
 if(e.key==='Enter'&&e.target.matches('input[id$="-q"]')){e.preventDefault();placeSearch(e.target.id.slice(0,-2))}
});
document.addEventListener('change',e=>{
 const i=e.target,id=i.id;
 if(id==='bu'){readBirth();render()}
 if(id==='su'){readSyn();render()}
 if(id==='kas-p'){S.settings.kPersonal=i.checked;save();syncProfile()}
 if(V.sec!=='settings')return;
 const n=S.notif,st=S.settings;
 const map={n_on:()=>n.on=i.checked,n_wh:()=>n.whisper=i.checked,n_ev:()=>n.events=i.checked,n_mo:()=>n.monthly=i.checked,n_an:()=>n.annual=i.checked,n_time:()=>n.time=i.value,n_q:()=>n.quiet=i.checked,n_qf:()=>n.quietFrom=i.value,n_qt:()=>n.quietTo=i.value,
  p_kas:()=>st.kPersonal=i.checked,d_rm:()=>st.reduce=i.checked,d_lg:()=>st.large=i.checked,d_vo:()=>st.voiceOut=i.checked,d_tz:()=>{st.tz=i.value;EVC.k='';chartCache.k=''},
  p_birth:()=>{S.birthConsent=i.checked}};
 if(map[id]){map[id]();save();syncProfile();toast('Saved');if(/^d_/.test(id))render()}
});
// With accounts enabled, only a saved session opens straight onto a page; everyone else starts at onboarding.
document.body.insertAdjacentHTML('beforeend',`<button id="kas-btn" class="kas-btn" data-act="kasopen" aria-label="Talk with Kassandra, the fortune teller" hidden>${pic('cards','kassandra-float','kas-float')||pic('cards','kassandra','kas-face')}</button>
<section id="kas" class="kas" role="dialog" aria-modal="false" aria-labelledby="kas-title" hidden><header class="kas-h">${pic('cards','kassandra','kas-face')}<div><h2 id="kas-title">Kassandra</h2><p class="muted small">Kosmia’s fortune teller · symbols, not certainties</p></div><button class="pop-x" data-act="kasclose" aria-label="Close Kassandra">×</button></header><div id="kas-body" class="kas-body" aria-live="polite"></div><div id="kas-chips" class="kas-chips"></div><div id="kas-foot" class="kas-foot"></div></section>`);
if(S.sign&&(!C.enabled||C.hasStoredSession())){applyLocation()}else V.sec='welcome';
render();
C.onError(()=>toast('Could not sync. Your changes are kept on this device.'));
C.onAuth(u=>{if(u)pullMerge();else render()});
C.init().then(u=>{
 if(u){if(C.recovering){V.sec='reset';render()}return pullMerge()}
 if(C.enabled&&!onboarding()){V.sec='welcome';render()}
}).catch(e=>console.error(e));
})();
