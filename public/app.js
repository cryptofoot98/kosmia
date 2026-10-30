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
 settings:{tz:'',reduce:false,large:false,kPersonal:false,voiceOut:false,yMode:'auto'},intro:false,kcur:[],intent:{}});
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
 local.forEach(l=>{if(ids.has(l.id))return;if(l.sy)return;out.push(l);push(l).then(()=>{l.sy=true;save()},()=>{})});
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
 // a returning reader goes straight in; one who signed in without a sign yet chooses it first
 if(S.sign&&onboarding()&&!V.obHold&&V.sec!=='reset'){applyLocation();if(onboarding())V.sec='home'}else if(!S.sign&&onboarding())V.ob='sign';
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
/* ---------- sections and routes: five destinations in the bottom bar, each with its own pages; the profile opens from the avatar ---------- */
// [page slug, title]; the first page of each section is its landing
const SECTIONS={
 home:{label:'Home',tabs:[['today','Home']]},
 horoscope:{label:'Horoscope',tabs:[['overview','Horoscope'],['sign','Horoscope']]},
 tarot:{label:'Tarot',tabs:[['home','Tarot'],['whisper','Daily Whisper'],['reading','Card Reading'],['history','Reading History'],['journal','Journal'],['entry','Journal Entry'],['calendar','Journal Calendar'],['insights','Your Journal'],['notebook','Notebook']]},
 discover:{label:'Discover',tabs:[['home','Discover'],['dreams','Dream Interpretation'],['new-dream','New Dream'],['dream','Your Dream Meaning'],['dream-journal','Dream Journal'],['birth-chart','Birth Chart'],['profile','Cosmic Profile'],['affinity','Zodiac Affinity'],['resonance','Soul Resonance'],['synastry','Synastry'],['life-path','Life Path'],['name-within','The Name Within'],['cycles','My Cycles'],['calendar','Cosmic Calendar'],['moon','The Moon'],['planets','Planets'],['events','Celestial Events'],['library','Astrology Library']]},
 kassandra:{label:'Kassandra',tabs:[['chat','Kassandra'],['history','Past Conversations']]},
 settings:{label:'Profile',tabs:[['account','Your Profile'],['birth','Birth Details'],['notifications','Notifications'],['privacy','Privacy & Data'],['display','Display'],['subscription','Subscription']]}
};
const MAIN=['home','horoscope','tarot','discover','kassandra'];
// where a page's back arrow leads, when it is not the section's landing
const PARENT={'tarot/entry':'tarot/journal','tarot/calendar':'tarot/journal','tarot/insights':'tarot/journal','tarot/notebook':'tarot/journal',
 'discover/new-dream':'discover/dreams','discover/dream':'discover/dream-journal','discover/dream-journal':'discover/dreams','discover/synastry':'discover/affinity',
 'discover/moon':'discover/calendar','discover/planets':'discover/calendar','discover/events':'discover/calendar','discover/cycles':'discover/life-path','kassandra/history':'kassandra/chat'};
function parentOf(sec,t){
 const p=PARENT[sec+'/'+t];if(p)return p.split('/');
 if(sec==='settings')return t==='account'?['home','today']:['settings','account'];
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
 dream:{text:'',mood:'',symbols:[],busy:false},dreamId:'',lib:{tab:'guides',q:''},insTab:'insights'};
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
 V.sec=sec;V.tab[sec]=SECTIONS[sec].tabs.some(x=>x[0]===t)?t:landing(sec);V.q=q;
 if(sec==='horoscope'){V.period=PERIODS.some(p=>p[0]===q.period)?q.period:'daily';V.exploreSign=SIGNS.some(s=>s.id===q.sign)?q.sign:null;V.hcat=HCATS.some(c=>c[0]===q.cat)?q.cat:'overview'}
 if(sec==='tarot'&&q.k)V.jkey=q.k;
 if(sec==='discover'){if(q.id)V.dreamId=q.id;if(q.month)V.cal.month=q.month;if(q.view)V.cal.view=q.view;if(q.lib)V.lib.tab=q.lib}
}
// the query string mirrors the page's own choices, so a forecast, an entry or a month can be shared and reopened
function viewQuery(){
 const t=tab();
 if(V.sec==='horoscope')return t==='sign'?{sign:V.exploreSign||S.sign,period:V.period!=='daily'?V.period:'',cat:V.hcat!=='overview'?V.hcat:''}:{period:V.period!=='daily'?V.period:''};
 if(V.sec==='tarot'&&t==='entry')return {k:V.jkey};
 if(V.sec==='discover'&&t==='dream')return {id:V.dreamId};
 if(V.sec==='discover'&&t==='calendar')return {view:V.cal.view!=='list'?V.cal.view:'',month:V.cal.month&&V.cal.month!==dkey().slice(0,7)?V.cal.month:''};
 if(V.sec==='discover'&&t==='library')return {lib:V.lib.tab!=='guides'?V.lib.tab:''};
 return {};
}
const syncUrl=()=>{const u=pathFor(V.sec,tab(),viewQuery());if(u!==location.pathname+location.search)history.replaceState(history.state,'',u)};
history.scrollRestoration='manual';
function go(sec,t,opt={}){
 stopAudio();V.edit=null;V.tpop=null;V.spop=null;V.sheet=null;jLeave();jeLeave();
 history.replaceState(Object.assign({},history.state,{scroll:scrollY}),'');
 V.sec=sec;V.tab[sec]=t||landing(sec);
 if(SECTIONS[sec])history[opt.replace?'replaceState':'pushState']({scroll:0},'',pathFor(sec,tab(),viewQuery()));
 render();window.scrollTo(0,0);
}
const goBack=()=>{if(V.sec==='discover'&&tab()==='birth-chart'&&V.chartOpen){V.chartOpen=false;V.chartInterp=false;return render()}const [s,t]=parentOf(V.sec,tab());go(s,t)};
addEventListener('popstate',e=>{stopAudio();jLeave();jeLeave();V.tpop=null;V.edit=null;V.sheet=null;if(!S.sign)return;applyLocation();render();const y=(e.state&&e.state.scroll)||0;requestAnimationFrame(()=>window.scrollTo(0,y))});

// a passing message, with an action (Undo) when there is one
function toast(t,act){const e=$('#toast');e.innerHTML=esc(t)+(act?` <button class="toast-a" data-act="${act}">Undo</button>`:'');e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,act?6500:2600)}
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
function hdr(title,o={}){
 return `<header class="phd"><div class="ph-l">${o.back===false?'':iconBtn('back','data-act="back"','Back')}</div><div class="ph-t"><h1>${title}</h1>${o.sub?`<p class="ph-sub">${o.sub}</p>`:''}</div><div class="ph-r">${o.right||''}</div></header>`;
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
const nameNums=nm=>nm&&N.clean(nm)?N.name(nm,S.settings.yMode):null;

/* ---------- views ---------- */
const views={};
/* Onboarding: four pages of one illustrated book (docs/mockups/ob2-*). Welcome; Ancient Wisdom, the woman before the
   moon and what Kosmia holds; the sign, chosen with one tap on its medallion; the account. Without accounts (local mode),
   or when already signed in, the tap on the sign opens Kosmia. Signing in has its own page, Welcome Back. Birth details
   and notifications wait in the profile. */
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
const OB_FEATS=[['obm-sun','Personalised horoscopes','Daily, weekly, monthly and beyond'],['obm-tarot','Tarot and daily Whispers','Guidance for your journey'],['obm-moon','Astrology and numerology','Discover your unique blueprint'],['obm-star','Cosmic calendar','Follow the energy of the universe'],['obm-dream','Dream interpretation','Decode the messages within'],['kassandra','Kassandra, your AI oracle','Always here for your questions']];
views.welcome=()=>{
 const st=V.ob,s=V.joinSign?sg(V.joinSign):null;
 if(st==='intro')return `<div class="ob ob-paper ob-intro">${obBg(['aw-foot','aw-f',false])}${iconBtn('back','data-act="obstep" data-to="welcome"','Back')}
  <div class="aw-top"><div class="aw-art" aria-hidden="true">${ui('aw-top','aw-sc','',true)}${ui('aw-top','aw-cl','',true)}${ui('aw-clouds','aw-clouds')}</div><div class="aw-head"><h1 class="cz">Ancient Wisdom<br>for Modern Life</h1><p class="ob-lead">Explore the cosmos and discover a deeper understanding of yourself.</p></div></div>
  <ul class="obi-list">${OB_FEATS.map(([i,t,d])=>`<li><span class="obi-med">${ui(i,'obi-k')}</span><span><strong>${t}</strong><span>${d}</span></span></li>`).join('')}</ul>
  <div class="aw-go"><button class="btn" data-act="obnext" data-to="sign">Let’s Begin →</button></div></div>`;
 if(st==='sign')return `<div class="ob ob-dark ob-sign">${obBg(['zs-bg','zs-b',false],['zs-bg','zs-t'])}${STARS}${iconBtn('back','data-act="obstep" data-to="intro"','Back')}
  <div class="zs-head"><h1>What’s your<br>zodiac sign?</h1><p class="ob-lead">Choose your sun sign to personalise your cosmic experience.</p></div>
  <div class="zgrid${s?' has':''}" role="radiogroup" aria-label="Your zodiac sign">${SIGNS.map(x=>`<button class="zg-s" role="radio" aria-checked="${V.joinSign===x.id}" data-sign="${x.id}" aria-label="${x.name}, ${x.dates}">${ui('zm-'+x.id,'zg-m')}<span>${x.name}</span></button>`).join('')}</div>
  <details class="ob-bday"${V.bdayOpen?' open':''}><summary>Not sure of your sign?</summary><div class="field"><label for="obd">Your birthday</label><input type="date" id="obd"></div>${s&&V.bdayOpen?`<p class="ob-hint" role="status">That makes you ${s.name}. Tap ${s.name} to continue.</p>`:''}</details></div>`;
 if(st==='account')return `<div class="ob ob-dark ob-acct">${obBg(['ob-woman','obl-top'],['home-vines','obl-mid',false],SUNSET)}${STARS}${iconBtn('back','data-act="obstep" data-to="sign"','Back')}
  <div class="oba-head"><h1>Create Your<br>Account</h1>${obRule()}<p class="ob-lead">Join Kosmia and start your journey of self-discovery.</p></div>
  <form id="authForm" class="ob-fields ob-panel" novalidate><div class="field"><label for="em">Email address</label><div class="inp">${IC.mail}<input id="em" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" value="${esc(S.email)}" required></div></div>
  ${pwField('pw','Create a password','At least 8 characters','new-password')}${pwField('pw2','Confirm password','Type it again','new-password')}
  <ul class="pw-rules" id="pwRules" aria-live="polite">${pwRules('').map(([ok,t])=>`<li class="${ok?'ok':''}">${t}</li>`).join('')}</ul>
  <p class="auth-err" id="authErr" role="alert"></p><button class="btn" id="joinBtn" type="submit">Continue →</button>
  ${obRule()}<p class="auth-alt">Already have an account? <button type="button" class="link" data-act="obstep" data-to="signin">Sign in</button></p></form><div class="oba-blooms" aria-hidden="true">${ui('ob-sunset-blooms','obl obl-foot')}</div></div>`;
 if(st==='signin')return `<div class="ob ob-paper ob-form ob-signin ob-wb">${obBg(['wb-top','wb-t'],['wb-sun','wb-s',false])}${iconBtn('back','data-act="obstep" data-to="welcome"','Back')}
  <h1>Welcome Back</h1><p class="ob-lead">Sign in to return to your cosmic journey.</p>
  <form id="authForm" class="ob-fields" novalidate><div class="field"><label for="em">Email address</label><div class="inp">${IC.mail}<input id="em" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" value="${esc(S.email)}" required></div></div>
  ${pwField('pw','Password','Your password','current-password')}<p class="auth-err" id="authErr" role="alert"></p><button class="btn" id="joinBtn" type="submit">Sign in →</button>
  <p class="auth-alt"><button type="button" class="link" data-act="forgot">Forgot password?</button></p>${obRule()}<p class="auth-alt">New to Kosmia? <button type="button" class="link" data-act="obstep" data-to="sign">Begin your journey</button></p></form></div>`;
 if(st==='verify')return `<div class="ob ob-paper ob-form ob-signin">${obBg(CROWN,SUNSET)}<div class="ob-mail">${IC.mail}</div><h1>Check Your Inbox</h1><p class="ob-lead">We’ve sent a link to <strong>${esc(S.email)}</strong>. Open it to activate your account, then sign in here.</p>
  <div class="ob-fields"><button class="btn" data-act="obstep" data-to="signin">I’ve verified, sign in →</button><button class="btn ghost" data-act="resend">Send the link again</button></div></div>`;
 return `<div class="ob ob-welcome">${ui('ob-welcome','ob-bg','',true)}${STARS}<div class="ob-w-top"><h1 class="cz ob-logo">Kosmia</h1><p class="ob-tags">Your cosmic guide<br>for a more aligned you</p></div><div class="ob-w-in"><p class="ob-tags">Astrology <i>•</i> Tarot <i>•</i> Guidance<br>Self discovery <i>•</i> Cosmic connection</p>
  <button class="btn gold" data-act="obnext" data-to="intro">Begin Your Journey →</button>${C.enabled&&!C.user?'<p class="auth-alt light">Already have an account? <button class="link" data-act="obstep" data-to="signin">Sign in</button></p>':''}</div></div>`;
};
views.join=views.welcome;
views.reset=()=>`<div class="ob ob-paper ob-form ob-signin">${obBg(CROWN,SUNSET)}${obRule('lone')}<h1>Choose a New Password</h1><div class="ob-fields">${pwField('npw','New password','At least 8 characters','new-password')}<button class="btn" data-act="setpw">Save password</button></div></div>`;
// a sign's framed plate, its glyph set in a medallion at the foot of the arch
// a wide cartouche (Cancer, Capricorn) takes a medallion painted to its own outline; the others the round one
const signArt=id=>`<span class="sp-plate g-${id}">${ui('plate-'+id,'sign-plate',sg(id).name)}${Kit.size('atlas/sgmw-'+id)?ui('sgmw-'+id,'sp-gmw'):glyphMed(id,'sp-gm')}</span>`;
function obValid(){
 const em=$('#em'),pw=$('#pw'),pw2=$('#pw2'),up=V.ob==='account';
 const okEm=!!em&&/^\S+@\S+\.\S+$/.test(em.value.trim()),p=pw?pw.value:'';
 if(!up)return {ok:okEm&&p.length>=6};
 const rules=pwRules(p),n=rules.filter(r=>r[0]).length;
 return {ok:okEm&&n===3&&pw2&&pw2.value===p,rules,n,mismatch:pw2&&pw2.value&&pw2.value!==p};
}
function syncJoin(){
 const b=$('#joinBtn');if(!b)return;const v=obValid();
 if(v.rules){$('#pwRules').innerHTML=v.rules.map(([ok,t])=>`<li class="${ok?'ok':''}">${t}</li>`).join('');
  const err=$('#authErr');if(err&&!V.busy)err.textContent=v.mismatch?'The passwords don’t match yet.':''}
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
// one tap on a medallion chooses the sign: it lights for a moment, then the account (or, without one to make, Kosmia)
let pickT=0;
function pickSign(id){
 V.joinSign=id;render();clearTimeout(pickT);
 pickT=setTimeout(()=>{if(!onboarding()||V.ob!=='sign')return;
  if(needAcct()){V.ob='account';V.bdayOpen=false;render();return window.scrollTo(0,0)}
  S.sign=id;save();if(C.user)syncProfile();enterApp()},matchMedia('(prefers-reduced-motion: reduce)').matches?60:320)}
async function submitJoin(e){
 e.preventDefault();if($('#joinBtn').disabled)return;
 const email=$('#em').value.trim(),pw=$('#pw').value,err=$('#authErr');
 V.busy=true;syncJoin();if(err)err.textContent='';
 try{
  if(V.ob==='account'){
   S.email=email;S.sign=V.joinSign;save();
   const r=await C.signUp(email,pw,V.joinSign);
   // with email confirmation on, the account waits for its link; otherwise the reader is signed in and Kosmia opens
   V.busy=false;if(r.session)return enterApp();V.obHold=true;V.ob='verify';render();
  }else{await C.signIn(email,pw);S.email=email;save();V.busy=false}
  // signing in: the auth listener runs pullMerge, which opens Kosmia once the profile has a sign
 }catch(x){V.busy=false;syncJoin();if(err)err.textContent=authMsg(x)}
}
function bindJoin(){const f=$('#authForm');if(!f)return;f.addEventListener('input',syncJoin);f.addEventListener('submit',submitJoin);syncJoin()}
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
const avatar=()=>`<button class="avatar" data-go="settings" data-t="account" aria-label="Your profile and settings">${med(S.sign||'aries','av-i')}</button>`;
// a whisper's number in the deck of 100, as the numeral on its card
const ROMAN=n=>[[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']].reduce((s,[v,r])=>{while(n>=v){s+=r;n-=v}return s},'');
const wNum=c=>{const i=(globalThis.KOSMIA_WHISPERS||[]).findIndex(w=>w[0]===c.id);return i<0?'':ROMAN(i+1)};
// the forecast on Home's card: whole sentences, as many as fit the card (about 150 letters), always at least one
const hShort=t=>(t.match(/[^.!?]+[.!?]+/g)||[t]).reduce((o,x)=>!o||(o+x).trim().length<=150?(o+x):o,'').trim();
/* Home, after docs/mockups/home-top and home-bottom: the header scene (sky, halo, the sign's figure overlapping the
   forecast card, the five insights at its foot), the night band with the Daily Whisper and the Cosmic Energy landscape,
   then the parchment sheet */
views.home=()=>{
 if(!A||!K)return needLib();
 const sign=sg(S.sign),now=new Date(),c=todayCard(),k=dkey(),rev=!!S.revealed[k],m=K.moon(now),h=horoscope(sign.id,'overview','daily');
 const nm=firstName(),short=hShort(h.body),fig='atlas/fg-'+sign.id;
 const quick=['love','health','career','money','family'].map(cat=>{const x=horoscope(sign.id,cat,'daily');return `<button class="qt" data-act="tohoroscope" data-cat="${cat}">${catIco(cat,'qt-i')}<strong>${CAT_INFO[cat][0]}</strong><span>${TILE[cat][x.rel]||''}</span></button>`}).join('');
 const note=S.notes[k],wbtn=!rev?`<button class="btn" data-act="reveal">Reveal Today’s Message</button>`:`<button class="btn" data-act="jopen" data-k="fortune:${k}">${note?'Continue Your Reflection':'Reflect in Your Journal'} →</button>`;
 return `<div class="home"><div class="hbar">${ui('home-bar','hb-art')}<span class="hb-logo"><span class="hb-word">Kosmia</span>${Kit.icon('star',{cls:'hb-star'})}</span>${avatar()}</div>
 ${Kit.scene({cls:'hhero',bg:'atlas/home-sky',ratio:'auto',bgPos:'50% 0',priority:true,stars:true,bare:true,content:`
  <div class="hh-top"><div class="brand"><span class="hh-word">Kosmia</span><small>The universe speaks. <span>Are you listening?</span></small></div>
   <div class="hh-acts"><button class="ibtn" data-go="settings" data-t="notifications" aria-label="Notifications">${IC.bell}</button>${avatar()}</div></div>
  <h1 class="hh-greet">${greet()}${nm?', '+esc(nm):''}</h1><p class="hh-sub">Here’s your cosmic overview for today.</p>
  <div class="hh-stage s-${sign.id}">
   <span class="hh-figbox" aria-hidden="true"><span class="hh-halo">${Kit.img('atlas/home-halo',{priority:true})}</span>${Kit.size(fig)?Kit.img(fig,{cls:'hh-fig',priority:true}):''}</span>
   <article class="hh-card" aria-label="Today’s horoscope for ${sign.name}"><div class="hh-name"><span class="glyph" aria-hidden="true">${sign.g}</span><div><h2${sign.name.length>7?' class="long"':''}>${sign.name}</h2><p>${SHORT_DATES(sign)}</p></div></div><p class="keys">${keys(SIGN_KEYS[sign.id])}</p><p class="hh-text">${esc(short)}</p><button class="btn" data-act="tohoroscope">Read Full Horoscope →</button></article>
  </div>
  <div class="qrow">${quick}</div>`})}
 ${scenic(`
  ${panel(`${orn('Your Daily Whisper')}<div class="dw"><div class="scene mini-w ${rev?'flipped':''}" data-act="${rev?'jopen':'reveal'}" data-k="fortune:${k}" role="button" tabindex="0" aria-label="${rev?esc(c.title):'Today’s whisper, face down. Press to reveal.'}"><div class="card3d"><div class="face back"></div><div class="face front">${Kit.tarot({art:'whispers/'+c.id,num:wNum(c),name:c.title})}</div></div></div>
   <div class="dw-r">${rev?`<p class="dw-q">${Kit.icon('star')}${esc(c.msg)}${Kit.icon('star',{cls:'s2'})}</p>`:`<p class="dw-q">${Kit.icon('star')}A card, a message, a moment for you. Turn it over when you are ready.</p>`}${wbtn}</div></div>`,'gilt hwhisper')}
  <button class="energy" data-go="discover" data-t="moon"><span class="en-in"><span class="orn-s">${Kit.icon('star')} Today’s Cosmic Energy ${Kit.icon('star')}</span><span class="en-row">${moonPic(m,'en-moon')}<span><strong>${m.name}<br>in ${sIdx(m.sign).name}</strong><span>${MOON_LINE[m.name]||''}</span></span><span class="en-go">${IC.chev}</span></span></span></button>

 ${panel(`${orn('Explore Kosmia',seeAll('discover','home'))}
 <div class="explore">${[['ex-chart','Birth Chart','birth-chart'],['ex-compat','Compatibility','affinity'],['ex-resonance','Soul Resonance','resonance'],['ex-lifepath','Life Path','life-path'],['ex-name','Name Numerology','name-within']].map(([i,l,t])=>`<button data-go="discover" data-t="${t}">${ui(i,'ex-i')}<span>${l}</span></button>`).join('')}</div>`,'home-p')}
 `,'hsheet',ui('home-night','ksc-n'))}</div>`;
};
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
 return `<div class="scene ${flipped?'flipped':''}" id="${id}" role="button" tabindex="0" aria-label="${flipped?esc(c.title+'. '+c.msg):'Today’s whisper, face down. Press to reveal.'}" data-act="reveal"><div class="card3d"><div class="face back"></div><div class="face front daily kt">${whisperFace(c)}</div></div>${sp}</div>`;
}
// a whisper's face: its artwork (art/whispers) and the engraved plaque with title and message
const whisperFace=c=>(ART.whispers||[]).includes(c.id)?Kit.tarot({art:'whispers/'+c.id,num:wNum(c),name:c.title}):`<div class="ph">${symbol(c.sym)}</div><div class="card-banner"><div class="cb-in"><div class="cb-title">${c.title}</div><p>${c.msg}</p></div></div>`;

/* ---------- AI read-aloud (ElevenLabs), signed-in only ---------- */
const AUDIO=new Map();let player=null;
function stopAudio(){if(player){player.pause();player=null}V.say=null}
function playText(txt){
 stopAudio();V.say=txt;
 return (AUDIO.has(txt)?Promise.resolve(AUDIO.get(txt)):C.speak(txt).then(b=>{const u=URL.createObjectURL(b);AUDIO.set(txt,u);return u}))
  .then(u=>{if(V.say!==txt)return;player=new Audio(u);player.onended=()=>{player=null;V.say=null;render()};return player.play()})
  .catch(e=>{if(V.say===txt){V.say=null;render()}toast(e.message||'Could not play the reading')});
}
/* ----- Horoscope: the landing (the period, the day's cosmic energy, the six areas of life and the signs), then a sign's own
   page: its illustration, its words, the reading for the chosen period and area, and the other areas as expandable readings ----- */
const PLABEL={daily:['Today','Today’s'],weekly:['This Week','This Week’s'],monthly:['This Month','This Month’s'],yearly:['This Year','This Year’s']};
const periodSeg=()=>`<div role="group" aria-label="Time period">${seg(PERIODS.map(([k])=>[k,PLABEL[k][0]]),V.period,'period')}</div>`;
views.horoscope=()=>{
 if(!A||!K)return needLib();
 if(tab()==='sign')return horoSign();
 const sign=sg(S.sign),h=horoscope(sign.id,'overview',V.period),m=K.moon(new Date()),open=(h.body.match(/[^.!?]+[.!?]+/)||[h.body])[0];
 return `<div class="land">${hero('hero-horoscope','','tall','Horoscope','Guidance for every path you walk')}<div class="sheet">
 ${periodSeg()}
 ${panel(`<div class="ce"><span class="ce-art">${ui('ce-vignette','ce-vig')}${V.period==='daily'?moonPic(m,'ce-moon'):ui('ex-chart','ce-moon')}</span><div><p class="kick">${PLABEL[V.period][1]} cosmic energy</p><p class="ce-date">${periodHead(V.period,h.per)}</p><p>${esc(open)}${V.period==='daily'?' '+(MOON_LINE[m.name]||''):''}</p><button class="btn sm" data-act="tohoroscope" data-period="${V.period}">Read Full Forecast →</button></div></div>`,'ornate')}
 <div class="tiles6">${HCATS.map(([k])=>`<button class="tile" data-act="tohoroscope" data-cat="${k}">${catIco(k,'tile-i')}<strong>${CAT_INFO[k][0]}</strong><span>${CAT_INFO[k][1]}</span></button>`).join('')}</div>
 ${Kit.divider('Your Zodiac Sign')}
 <div class="list hsign">${lrow(glyphMed(sign.id),`<span class="big">${sign.name}</span>`,sign.dates,'data-act="tohoroscope"',`<span class="lr-m">${keys(SIGN_KEYS[sign.id])}</span>`)}</div>
 ${Kit.divider('Explore Every Sign')}
 <div class="hscroll signs-row">${SIGNS.map(s=>`<button class="sgn" data-act="tohoroscope" data-sign="${s.id}">${med(s.id,'sgn-i')}<span>${s.name}</span></button>`).join('')}</div>
 </div></div>`;
};
function horoSign(){
 const ex=V.exploreSign||S.sign,s=sg(ex),cat=V.hcat,h=horoscope(ex,cat,V.period);
 const ref=`${ex}/${cat}/${V.period}/${h.per.key}`,saved=isSaved('horoscope',ref),pl=PLABEL[V.period];
 const others=HCATS.map(c=>c[0]).filter(k=>k!==cat).map(k=>{const x=horoscope(ex,k,V.period);
  return `<details class="acc theme t-${k}"><summary><span class="lr-i">${catIco(k,'acc-i')}</span><strong class="th-l">${CAT_INFO[k][0]}</strong><span class="th-p">${THEME[k][x.rel]||''}</span><span class="lr-c">${IC.chev}</span></summary><div class="acc-b"><div class="read">${paras(x.body)}</div>${x.focus?`<p class="h-focus">${esc(x.focus)}</p>`:''}<button class="link" data-act="hcat" data-k="${k}">Make this the main reading</button></div></details>`}).join('');
 const playing=V.say===h.body,heart=`<button class="ibtn${saved?' on':''}" data-act="bookhoro" data-ref="${ref}" aria-pressed="${saved}" aria-label="${saved?'Saved to your journal':'Save to your journal'}">${IC.heart}</button>`;
 // the sign's painting across the head of the page, its name, dates and words in the open sky at its left; then the
 // reading and the key themes on two parchment panels over the night edged with lilies and roses
 return `<div class="hsp s-${s.id}"><div class="hsp-hero">${Kit.size('atlas/hsh-'+s.id)?ui('hsh-'+s.id,'hsp-img','',true):''}${ui('hsp-vine','hsp-vine','',true)}
  ${constellation(s.id)}<span class="glyph hsp-g" aria-hidden="true">${s.g}</span><div class="hsp-bar">${iconBtn('back','data-act="back"','Back')}${heart}</div>
  <div class="hsp-t"><h1 style="--nl:${s.name.length}">${s.name}</h1><p class="hsp-d">${s.dates}</p><p class="hsp-desc">${SIGN_DESC[s.id]} This is your horoscope, written for the energy of ${V.period==='daily'?'today’s':'this '+PWORD[V.period]+'’s'} skies.</p></div></div>
 <div class="hsp-body">${periodSeg()}
 ${panel(`<div class="hd"><div><h2>${cat==='overview'?pl[1]+' Horoscope':`${CAT_INFO[cat][0]} · ${pl[0]}`}</h2><p class="muted">${periodHead(V.period,h.per)}</p></div><button class="ibtn round${playing?' on':''}" data-act="hspeak" aria-label="${playing?'Stop reading aloud':'Read aloud'}">${playing?IC.stop:IC.speak}</button></div>
  <div class="read">${paras(h.body)}</div>${h.focus||h.reflection?'<div class="rule" aria-hidden="true"></div>':''}${h.focus?`<p class="h-focus">${esc(h.focus)}</p>`:''}${h.reflection?`<p class="quote h-ref">${esc(h.reflection)}</p>`:''}
  ${cat==='money'?'<p class="muted small">For reflection only. This is not financial advice.</p>':''}${cat==='health'?'<p class="muted small">For reflection only. This is not medical advice.</p>':''}`,'ornate hread')}
 ${panel(`<h3 class="th-h">Key Themes ${pl[0]}</h3><div class="list themes">${others}</div>
  <div class="acts"><button class="btn" data-act="hreflect" data-ref="${ref}">${IC.quill}Write a Reflection</button>${ex!==S.sign?`<button class="btn ghost" data-act="setsign" data-sign="${ex}">Set as my sign</button>`:''}<button class="btn ghost" data-act="kasask" data-q="What does this ${pl[0].toLowerCase()} forecast mean for me as a ${s.name}?">${IC.chat}Ask Kassandra</button></div>`,'ornate hthemes')}
 </div></div>`;
}
// reading a page aloud: Kassandra's own voice when signed in, otherwise the device's
function speakText(txt){
 if(V.say===txt){stopAudio();if(window.speechSynthesis)speechSynthesis.cancel();return render()}
 if(C.user){playText(txt);return render()}
 if(!window.speechSynthesis)return toast('Reading aloud is not supported in this browser.');
 speechSynthesis.cancel();V.say=txt;const u=new SpeechSynthesisUtterance(txt);u.lang='en-GB';u.rate=.95;u.onend=u.onerror=()=>{if(V.say===txt){V.say=null;render()}};speechSynthesis.speak(u);render();
}
/* ----- Tarot: the daily ritual (Whispers, with its reflection) and the intentional readings (spreads) share the tab,
   with the Journal and the history of readings beside them ----- */
views.tarot=()=>{
 const t=tab();
 if(t==='whisper')return whisperView();
 if(t==='reading')return tarotView();
 if(t==='history')return historyView();
 if(t==='journal')return journalLib();
 if(t==='entry')return entryView();
 if(t==='calendar')return journalCal();
 if(t==='insights')return journalInsights();
 if(t==='notebook')return `<div class="sub">${hdr('Notebook',{sub:'Your journal as a book'})}${journalView()}</div>`;
 return `<div class="land tland">${hero('hero-tarot','','tall','Tarot','Insights for a more aligned you')}<div class="tpanel card gilt"><div class="list big">
 ${lrow(ui('t-whisper','th oval'),'Daily Whisper','A card, a message, a moment for you, and a space to reflect.','data-go="tarot" data-t="whisper"')}
 ${lrow(ui('t-reading','th oval'),'Card Reading','Single card, three cards, love, career and the Celtic Cross.','data-go="tarot" data-t="reading"')}
 ${lrow(ui('t-journal','th oval'),'Your Journal','Reflections, insights and personal growth.','data-go="tarot" data-t="journal"')}
 ${lrow(ui('t-history','th oval'),'Reading History','Your past readings and notes.','data-go="tarot" data-t="history"')}
 </div></div></div>`;
};
function whisperView(){
 const k=dkey(),c=todayCard(),rev=!!S.revealed[k],sv=S.saved.some(x=>x.date===k);
 return `<div class="sub">${hdr('Daily Whisper',{right:iconBtn('help','data-act="whelp"','About the Daily Whisper')})}
 ${V.whelp?panel(`<p>One card a day, drawn from ${ORACLE.length} Whispers. You will not see the same card again until you have met them all. Read it, sit with it, and write what it stirs in you: every reflection is kept in your Journal.</p>`,'note-card'):''}
 ${cardScene(c,rev,'fortuneCard')}
 ${rev?`<p class="kpills">${keys(wKeys(c))}</p><p class="w-msg">${esc(c.msg)}</p><p class="w-ref">${esc(c.ref)}</p>
  <div class="acts row-acts"><button class="btn" data-act="jopen" data-k="fortune:${k}">${S.notes[k]?'Continue Your Reflection':'Write Your Reflection'}</button><button class="ibtn sq" data-act="share" aria-label="Share this Whisper">${IC.share}</button><button class="ibtn sq${sv?' on':''}" data-act="savecard" aria-pressed="${sv}" aria-label="${sv?'Saved to your journal':'Save to your journal'}">${IC.heart}</button></div>`
 :`<button class="btn" data-act="reveal">Reveal My Whisper</button><p class="muted center small">One card a day, drawn from ${ORACLE.length}. Tap the card or the button to turn it over.</p>`}</div>`;
}
function tarotView(){
 const T=V.tarot,sp=SPREADS[T.spread];
 // 1. the reading type and the question; Shuffle draws a fresh deck
 if(T.stage==='setup')return `<div class="sub">${hdr('Card Reading',{sub:'What is yet to be revealed?'})}
  <div class="list spreads" role="radiogroup" aria-label="Reading type">${Object.entries(SPREADS).map(([k,x])=>`<button class="lrow${T.spread===k?' on':''}" role="radio" aria-checked="${T.spread===k}" data-act="tspread" data-k="${k}"><span class="lr-i">${pic('spreads',k,'th')}</span><span class="lr-t"><strong>${x.s}</strong><span>${x.p.length} card${x.p.length>1?'s':''} · ${x.p.slice(0,3).join(', ')}${x.p.length>3?'…':''}</span></span><span class="lr-c tick" aria-hidden="true"></span></button>`).join('')}</div>
  <div class="field"><label for="q">Your question (optional)</label><input type="text" id="q" value="${esc(T.q)}" placeholder="Ask about anything: love, work, a choice…"></div><button class="btn" data-act="shuffle">Shuffle the Cards</button></div>`;
 // 2. pick face-down cards; the reveal opens by itself once enough are chosen
 if(T.stage==='pick')return `<div class="sub">${hdr(`Choose ${sp.p.length} card${sp.p.length>1?'s':''}`,{sub:`${sp.n} · ${T.picks.length} of ${sp.p.length} chosen`})}<div class="grid5">${T.deck.slice(0,20).map((c,i)=>`<button class="mini" aria-label="Card ${i+1}" aria-pressed="${T.picks.includes(i)}" data-pick="${i}"></button>`).join('')}</div></div>`;
 // 3. the drawn cards, each flipped by a tap; a revealed card opens its full details
 const cards=T.drawn,done=cards.every(c=>c.shown);
 return `<div class="sub">${hdr(sp.s,{sub:sp.n})}${T.q?`<p class="quote center">“${esc(T.q)}”</p>`:''}<p class="muted center">${done?'Tap a card to read it in full.':'Tap each card to reveal it.'}</p><div class="rd-grid${cards.length===1?' solo':''}">${cards.map((c,i)=>`<div class="rd-cell"><div class="label">${c.pos}</div><div class="scene ${c.shown?'flipped':''} ${c.rv?'rev':''}" role="button" tabindex="0" data-act="tflip" data-k="${i}" aria-label="${c.shown?esc(c.name)+(c.rv?', reversed':'')+'. Open details':esc(c.pos)+', face down. Reveal'}"><div class="card3d"><div class="face back"></div><div class="face front tarot-face bare">${pic('deck',c.id,'tarot-art')}</div></div></div></div>`).join('')}</div>
 ${done?panel(`<h2>Interpretation</h2>${T.ai?`<div class="ai-read read">${(T.ai.cards||[]).map((x,i)=>cards[i]?`<p class="kick">${cards[i].pos} · ${cards[i].name}${cards[i].rv?' · reversed':''}</p><p>${esc(x)}</p>`:'').join('')}${T.ai.whole?`<div class="rule"></div><p class="kick">The reading as a whole</p>${paras(T.ai.whole)}`:''}<p class="muted small">Written with AI for this spread and question.</p></div>`:T.aiState==='loading'?'<p class="muted">The cards are speaking…</p>':`<div class="read">${cards.map(c=>{const k=SPREAD_CTX[T.spread]||'growth';return `<p><strong>${c.pos}.</strong> ${c.name}${c.rv?' reversed':''}: ${c.rv?c.revm:c.upm} <em>${c[k]}</em></p>`}).join('')}</div><p class="quote">${T.q?'Held against your question, notice which of these themes you already recognise in your own life, and which you resist.':'Notice which of these themes you already recognise in your own life, and which you resist.'}</p>${C.enabled&&!C.user?'<p class="muted">Sign in for a personal AI interpretation.</p>':''}`}<p class="muted small">Symbols for reflection, not predictions.</p>
 ${T.savedId?`<p class="center"><strong>Saved to your journal.</strong></p><button class="btn" data-act="jopen" data-k="reading:${esc(T.savedId)}">Write Your Reflection</button>`:`<button class="btn" data-act="saveread">Save to My Journal</button>`}<button class="btn ghost" data-act="newread">New Reading</button>`,'ornate'):''}
 ${V.tpop!=null?tarotPop(cards[V.tpop]):''}</div>`;
}
function historyView(){
 const rs=S.readings.slice().sort((a,b)=>(b.at||b.date)>(a.at||a.date)?1:-1);
 const ws=Object.keys(S.revealed).filter(d=>S.revealed[d]).sort().reverse().slice(0,30);
 return `<div class="sub">${hdr('Reading History',{sub:'Your past readings and notes'})}
 <h3 class="sec-h">Tarot readings</h3><div class="list">${rs.length?rs.map(r=>lrow(`<span class="fan">${r.cards.slice(0,3).map(x=>pic('deck',x.id,'fan-c'+(x.rev?' rev':''))).join('')}</span>`,esc((SPREADS[r.spread]||{s:r.spread}).s),r.cards.map(x=>esc(x.name)).join(', '),`data-act="jopen" data-k="reading:${esc(r.id)}"`,`<span class="lr-m">${relDay(r.date)}${r.note?' • Reflection added':''}</span>`)).join('')
  :`<p class="muted center">No saved readings yet.</p>`}</div><button class="btn" data-go="tarot" data-t="reading">New Reading</button>
 <h3 class="sec-h">Daily Whispers</h3><div class="list">${ws.length?ws.map(d=>{const c=cardFor(d);return lrow(pic('whispers',c.id,'th'),esc(c.title),keys(wKeys(c)),`data-act="jopen" data-k="fortune:${d}"`,`<span class="lr-m">${relDay(d)}${S.notes[d]?' • Reflection added':''}</span>`)}).join(''):'<p class="muted center">Your first Whisper is waiting.</p>'}</div></div>`;
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
  ...S.bookmarks.filter(b=>b.kind!=='chat').map(b=>b.kind==='dream'?{t:'d',day:(b.data||{}).day||kept(b),at:b.at,b,d:b.data||{}}:{t:b.kind==='horoscope'?'h':'e',day:kept(b),at:b.at,b}),
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
 return `<div class="row pair"><span class="pair-s">${pic('icons',a,'sign-ico')}<span class="sign-nm">${sg(a).name}</span></span><svg width="70" height="30" viewBox="0 0 80 30" aria-hidden="true"><path d="M2 15C20 2 30 28 40 15S62 2 78 15" fill="none" stroke="#8B6A3E" stroke-width="1.2"/><circle cx="40" cy="15" r="3" fill="#8B6A3E"/></svg><span class="pair-s">${pic('icons',b,'sign-ico')}<span class="sign-nm">${sg(b).name}</span></span></div><div class="center"><div class="label">${r.angle[0]}</div></div>${r.themes.map(([k,v])=>`<div class="label">${k}</div><p>${v}</p>`).join('')}<div class="rule"></div><p class="muted small">Method: traditional astrology compares the angle between two signs around the zodiac, their elements (${sg(a).el} and ${sg(b).el}) and their modalities (${sg(a).mod} and ${sg(b).mod}). These are symbolic themes for conversation, not a measured score. For a fuller picture, compare birth charts in Synastry.</p>`;
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
 if(!mine)return `<div class="stack"><h1>Synastry</h1>${empty('Your birth details first','Synastry compares two birth charts, so it needs your date of birth (and, for the most detail, your time and place).',linkBtn('Add my birth details','discover','birth-chart','btn'))}</div>`;
 let out='';
 if(Y.done&&Y.date){
  const saved=S.conns.some(c=>c.kind==='synastry'&&(c.data.them||{}).date===Y.date&&(c.data.them||{}).name===Y.name);
  out=panel(synBody(Y)+`<div class="row"><button class="btn ghost sm" data-act="saveconn" data-kind="synastry">${saved?'Saved':'Save connection'}</button></div>`);
 }
 return `<div class="stack"><h1>Synastry</h1><p class="muted center">How two birth charts speak to each other.</p>${form}${out}</div>`;
}
// the Personal Cosmic Profile: birth details, the big three and the numbers, each linking to its page
function profileView(){
 const ch=myChart(),L=hasBirthDate()?N.lifePath(S.birth.date):null,nm=nameNums(S.fullName),b=S.birth,yr=Number(dkey().slice(0,4));
 const val=(v,miss,sec,tt)=>v?`<span>${v}</span>`:`<button class="link" data-go="${sec}" data-t="${tt}">${miss}</button>`;
 const sun=ch?sIdx(ch.pl[0].sign):null;
 return `<div class="stack"><h1>Cosmic Profile</h1>
 ${panel(`<div class="prof-h">${pic('icons',S.sign,'sign-ico')}<div><h2>${esc(S.name||S.fullName||'Traveller')}</h2><p class="muted">${sg(S.sign).name} · ${sg(S.sign).el} · ruled by ${sg(S.sign).ruler}</p></div></div>
  <dl class="dl"><dt>Birth date</dt><dd>${val(hasBirthDate()?ymdLong(b.date):'', 'Add','discover','birth-chart')}</dd><dt>Birth time</dt><dd>${val(b.unk?'Unknown':b.time,'Add','discover','birth-chart')}</dd><dt>Birth place</dt><dd>${val(b.place,'Add','discover','birth-chart')}</dd><dt>Full birth name</dt><dd>${val(esc(S.fullName),'Add','discover','name-within')}</dd></dl>
  <p class="muted small">${S.birthConsent?'Birth details are kept privately in your account.':'Birth details stay on this device unless you choose to keep them in your account (in Birth Chart).'}</p>`)}
 ${panel(`<div class="label">The big three</div>${plate('astro')}<dl class="dl"><dt>Sun</dt><dd>${ch?sun.name+` <span class="muted small">calculated</span>`:`<span class="muted">Needs birth date</span>`}</dd><dt>Moon</dt><dd>${ch?(ch.moonRange?`${sIdx(ch.moonRange[0]).name} or ${sIdx(ch.moonRange[1]).name} <span class="muted small">needs birth time</span>`:sIdx(ch.pl[1].sign).name+' <span class="muted small">calculated</span>'):'<span class="muted">Needs birth date</span>'}</dd><dt>Rising</dt><dd>${ch&&ch.ang?sIdx(K.signIdx(ch.ang.asc)).name+' <span class="muted small">calculated</span>':`<span class="muted">Needs birth time and place</span>`}</dd></dl>${ch&&sun.id!==S.sign?`<p class="note">Your calculated Sun sign is ${sun.name}, but your chosen sign is ${sg(S.sign).name}. Births near the edge of a sign can fall either side; you can change your chosen sign in Settings.</p>`:''}`)}
 ${panel(`<div class="label">Numerology</div><dl class="dl"><dt>Life Path</dt><dd>${L?L.r.n+' · '+N.MEANING[L.r.n][0]:'<span class="muted">Needs birth date</span>'}</dd><dt>Expression</dt><dd>${nm?nm.expression.r.n+' · '+N.MEANING[nm.expression.r.n][0]:'<span class="muted">Needs full birth name</span>'}</dd><dt>Soul Urge</dt><dd>${nm&&nm.soul.r.n?nm.soul.r.n+' · '+N.MEANING[nm.soul.r.n][0]:'<span class="muted">Needs full birth name</span>'}</dd><dt>Personality</dt><dd>${nm&&nm.personality.r.n?nm.personality.r.n+' · '+N.MEANING[nm.personality.r.n][0]:'<span class="muted">Needs full birth name</span>'}</dd><dt>Personal Year ${yr}</dt><dd>${hasBirthDate()?N.personalYear(S.birth.date,yr).r.n:'<span class="muted">Needs birth date</span>'}</dd></dl>`)}
 </div>`;
}
function birthForm(){
 const b=V.birthDraft||(V.birthDraft=Object.assign({},S.birth));
 return panel(`${plate('natal')}<h3>Your birth details</h3><div class="field"><label for="bn">Your name</label><input type="text" id="bn" value="${esc(b.name!=null?b.name:S.fullName)}" autocomplete="name" placeholder="Your full name"></div><div class="field"><label for="bd">Date of birth</label><input type="date" id="bd" value="${esc(b.date)}"></div><label class="row"><input type="checkbox" id="bu" ${b.unk?'checked':''} class="cb"> I don’t know my birth time</label>${b.unk?'':`<div class="field"><label for="bt">Time of birth (local time)</label><input type="time" id="bt" value="${esc(b.time)}"></div>`}${placeField('birth',b)}
 <label class="row consent"><input type="checkbox" id="bcons" ${S.birthConsent?'checked':''} class="cb"> <span>Keep my birth details in my Kosmia account so they sync across my devices. They are private to me and I can delete them in Settings.</span></label>
 <button class="btn" data-act="savebirth">Save and calculate</button><p class="muted small">Birth details are only needed for your chart, Life Path and cycles. Without a time and place, the Ascendant and houses are not calculated.</p>`);
}
function cyclesView(){
 if(!hasBirthDate())return `<div class="stack"><h1>My Cycles</h1>${empty('Your birth date','Personal cycles are counted from your birth day and month.',linkBtn('Add my birth date','discover','birth-chart','btn'))}</div>`;
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
function moonView(now){
 const m=K.moon(now),ing=K.moonIngress(now),ph=K.lunarPhases(now,new Date(+now+120*DAY)),nn=ph.find(e=>e.k==='new_moon'),nf=ph.find(e=>e.k==='full_moon');
 return `<div class="stack"><h1>The Moon</h1>${panel(`${plate('moon')}<div class="center">${moonSvg(m,120)}<h2>${m.name}</h2><p>About ${Math.round(m.ill*100)}% lit · ${m.waxing?'waxing':'waning'} · in ${sIdx(m.sign).name}</p><p class="muted small">Enters ${sIdx(ing.sign).name} ${evt(ing.date)}</p></div><div class="rule"></div><div class="label">Traditional reading</div><p>${m.name==='New Moon'?'A moment associated with beginnings. Consider what you would like to plant.':m.name==='Full Moon'?'A moment associated with fullness and gratitude. Notice what has grown.':m.waxing?'A waxing Moon is associated with growth and intention: what would you like to nurture?':'A waning Moon is associated with release: what are you ready to let go of?'} With the Moon in ${sIdx(m.sign).name}, feelings tend to move ${STYLE[sIdx(m.sign).id]}.</p><div class="label">An optional ritual</div><p>${RITUAL[m.name]}</p>`,'glass')}
 ${panel(`<div class="row two"><div><div class="label">Next New Moon</div><p>${nn?evt(nn.date)+'<br><span class="muted">in '+sIdx(nn.sign).name+'</span>':''}</p></div><div><div class="label">Next Full Moon</div><p>${nf?evt(nf.date)+'<br><span class="muted">in '+sIdx(nf.sign).name+'</span>':''}</p></div></div>`)}
 <h3 class="center">Lunar phases ahead</h3>${ph.slice(0,10).map(e=>evRow(e)).join('')}
 <p class="muted small center">Times are for ${esc(TZ())}. The Moon’s sign is its geocentric position on the tropical zodiac.</p></div>`;
}
function planetsView(now){
 const pos=K.positions(now),rx=K.retrogrades(now,new Date(+now+366*DAY)),ing=upcoming().filter(e=>e.k==='ingress').slice(0,14);
 const d=x=>x?shortD(x):'';
 return `<div class="stack"><h1>Planets</h1>${panel(`<h3>Where the planets are now</h3>${plate('orrery')}<div class="tbl"><table><tr><th></th><th>Planet</th><th>Position</th><th></th></tr>${pos.map(p=>`<tr><td class="glyph">${p.g}</td><td>${p.n}</td><td>${degTxt(p.lon)}</td><td>${p.retro?'℞ retrograde':''}</td></tr>`).join('')}</table></div><p class="muted small">Geocentric, tropical zodiac, ${evt(now)}.</p>`)}
 ${panel(`<h3>Retrograde windows</h3>${rx.length?rx.map(w=>`<div class="asp"><strong>${w.planet}</strong> ${w.start&&w.start<=now&&(!w.end||w.end>=now)?'<span class="badge">now</span>':''}<p class="small">${w.start?d(w.start)+(w.sign!=null?' in '+sIdx(w.sign).name:''):'Before the search window'} → ${w.end?d(w.end)+(w.endSign!=null?' in '+sIdx(w.endSign).name:''):'beyond the next year'}</p><p class="muted small">Traditionally a time to review ${PM[w.planet]}.</p></div>`).join(''):'<p>No retrograde periods in the next year.</p>'}`)}
 <h3 class="center">Coming sign changes</h3>${ing.map(e=>evRow(e)).join('')}</div>`;
}
function eventsView(){
 const f=V.filter.events||'all',ev=upcoming().filter(e=>['eclipse','season','meteor','conjunction','planet'].includes(e.type)&&e.k!=='ingress'&&(f==='all'||e.type===f));
 return `<div class="stack"><h1>Celestial Events</h1><p class="muted center">Eclipses, solstices, equinoxes, meteor showers and meetings of planets over the next year. Each separates the astronomy from its traditional symbolism.</p>${plate('events')}${chips('Show',[['all','All'],['eclipse','Eclipses'],['season','Seasons'],['meteor','Meteors'],['conjunction','Conjunctions'],['planet','Planets']],f,'fevents')}
 ${ev.length?ev.map(e=>evRow(e)).join(''):empty('Nothing of this kind in the next year','Try another filter.')}</div>`;
}
/* ----- Discover: a mystical library of self-discovery, in six categories: Dream Interpretation, Your Cosmic Blueprint,
   Cosmic Connections, The Language of Numbers, the Celestial Calendar and the Mystical Library ----- */
// the pages kept from the six-section release open under their own header
const subPage=h=>h.replace(/^<div class="stack"><h1>([\s\S]*?)<\/h1>/,(_,t)=>`<div class="sub">${hdr(t)}`);
views.discover=()=>{
 const t=tab();
 const map={'birth-chart':chartView,profile:()=>subPage(profileView()),affinity:affinityView,resonance:resonanceView,synastry:()=>subPage(synastryView()),'life-path':lifePathView,'name-within':nameView,cycles:()=>subPage(cyclesView()),
  calendar:calendarView,moon:()=>subPage(moonView(new Date())),planets:()=>subPage(planetsView(new Date())),events:()=>subPage(eventsView()),dreams:dreamsView,'new-dream':newDreamView,dream:dreamView,'dream-journal':dreamJournalView,library:libraryView};
 if(map[t]){if(!A&&['birth-chart','synastry','calendar','moon','planets','events'].includes(t))return `<div class="sub">${hdr(tabLabel('discover',t))}${needLib()}</div>`;return map[t]()}
 V.chartOpen=false;
 // each feature in its own shape of picture, as the mockup draws them: medallions, arches, and two night banners
 const ft=(img,title,sub,t,shape)=>`<button class="dft ${shape}" data-go="discover" data-t="${t}"><span class="dft-art">${ui(img,'dft-i')}</span><span class="dft-t"><strong>${title}</strong><span>${sub}</span></span></button>`;
 return `<div class="land dland">${hero('hero-discover','<p class="dl-intro">Deepen your connection<br>with the cosmos and yourself.</p>','tall','Discover','Explore • Learn • Align')}
 ${scenic(`<div class="dlib">
  ${ft('ex-chart','Birth Chart','Your cosmic blueprint','birth-chart','round')}${ft('ex-compat','Zodiac Affinity','Compatibility','affinity','round')}
  ${ft('ex-resonance','Soul Resonance','Name match','resonance','round')}${ft('ex-name','The Name Within','Name numerology','name-within','round')}
  ${ft('hero-lifepath','Life Path','Your soul’s journey','life-path','arch')}${ft('hero-dream','Dream Interpretation','Decode your dreams','dreams','arch')}
  ${ft('banner-calendar','Cosmic Calendar','Celestial events','calendar','night')}${ft('banner-library','Astrology Library','Learn & explore','library','night')}
 </div>
 <div class="sheet dmore">${Kit.divider('More of the sky')}
 <div class="list">${lrow(ui('m-'+S.sign,'th round'),'Cosmic Profile','Your signs and numbers','data-go="discover" data-t="profile"')}${lrow(ui('ex-lifepath','th round'),'My Cycles','Your personal year','data-go="discover" data-t="cycles"')}${lrow(ui('ex-compat','th round'),'Synastry','Compare two birth charts','data-go="discover" data-t="synastry"')}
 ${lrow(pic('moons','full-moon','th round'),'The Moon','Phases, signs and rituals','data-go="discover" data-t="moon"')}${lrow(ui('ev-planet','th round'),'Planets','Positions and retrogrades','data-go="discover" data-t="planets"')}${lrow(ui('ev-eclipse','th round'),'Celestial Events','Eclipses, seasons and meteor showers','data-go="discover" data-t="events"')}</div>
 </div>`,'dscenic')}</div>`;
};
/* Birth Chart: the wheel in navy and gold with the reader's planets, then the planets, aspects and houses as their own tabs */
function chartWheel(c){
 const asc=c.ang?c.ang.asc:0,CX=150,R=146,R2=116,R3=66,pt=(lon,r)=>{const ph=(180+lon-asc)*Math.PI/180;return [CX+r*Math.cos(ph),CX-r*Math.sin(ph)]};
 const ring=SIGNS.map((s,i)=>{const [x1,y1]=pt(i*30,R),[x2,y2]=pt(i*30,R2),[gx,gy]=pt(i*30+15,(R+R2)/2);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#C9A45C" stroke-width=".8"/><text x="${gx}" y="${gy}" class="zg">${s.g}</text>`}).join('');
 const ticks=Array.from({length:72},(_,i)=>{const [x1,y1]=pt(i*5,R2),[x2,y2]=pt(i*5,R2-(i%6?4:7));return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8C6A35" stroke-width=".6"/>`}).join('');
 const axes=c.ang?[[c.ang.asc,'AC'],[c.ang.mc,'MC']].map(([l,n])=>{const [a1,b1]=pt(l,R2),[a2,b2]=pt(l+180,R2);return `<line x1="${a1}" y1="${b1}" x2="${a2}" y2="${b2}" stroke="#6E2230" stroke-width="${n==='AC'?1.1:.8}" ${n==='MC'?'stroke-dasharray="3 3"':''}/>`}).join(''):'';
 const asp=c.asp.filter(a=>a.n!=='conjunction'&&a.a.g&&a.b.g&&!/Ascendant|Midheaven/.test(a.a.n+a.b.n)).map(a=>{const [x1,y1]=pt(a.a.lon,R3),[x2,y2]=pt(a.b.lon,R3);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${/square|opposition/.test(a.n)?'#8E2C3A':'#2E5378'}" stroke-width=".7" opacity=".75"/>`}).join('');
 const pls=c.pl.map(p=>{const [x,y]=pt(p.lon,(R2+R3)/2+(p.n==='Moon'?-6:0)),sel=V.chartSel===p.n;return `<g data-planet="${p.n}" tabindex="0" role="button" aria-label="${p.n} in ${sIdx(p.sign).name}"><circle cx="${x}" cy="${y}" r="11" class="pl${sel?' sel':''}"/><text x="${x}" y="${y}" class="pg">${p.g}</text></g>`}).join('');
 return `<svg class="wheel-c" viewBox="0 0 300 300" role="img" aria-label="Your natal chart wheel"><defs><clipPath id="sunc"><circle cx="${CX}" cy="${CX}" r="${R3-20}"/></clipPath></defs>
 <g class="zring"><circle cx="${CX}" cy="${CX}" r="${R}" fill="#18213B" stroke="#C9A45C" stroke-width="1.6"/><circle cx="${CX}" cy="${CX}" r="${R2}" fill="#F4E8CF" stroke="#C9A45C" stroke-width="1.2"/>${ring}</g>${ticks}
 <circle cx="${CX}" cy="${CX}" r="${R3}" fill="#EFE0C0" stroke="#B8924F" stroke-width=".8"/>${asp}<image href="/art/atlas/ex-chart.webp" x="${CX-R3+20}" y="${CX-R3+20}" width="${2*(R3-20)}" height="${2*(R3-20)}" clip-path="url(#sunc)" opacity=".9"/>${axes}${pls}</svg>`;
}
const CHART_ROWS=[['planets',()=>pic('cats','planets','acc-i'),'Planetary Positions','Where the planets were at your birth'],['houses',()=>ui('ico-family','acc-i'),'Houses','The 12 areas of your life'],['aspects',()=>pic('cats','aspects','acc-i'),'Aspects','The connections between planets'],['interp',()=>pic('cats','insights','acc-i'),'Full Interpretation','A complete analysis of your chart']];
function chartView(){
 const c=myChart(),form=birthForm(),H=hdr(c&&V.chartOpen?'Your Birth Chart':'Birth Chart',{sub:'Your cosmic blueprint'});
 const intro=`${ui('hero-chart','plate-img')}<p class="lead">A personalised map of the sky at the moment you were born. Discover your planetary placements, aspects and what they reveal about your unique path.</p>`;
 if(!c)return `<div class="sub">${H}${intro}${form}<div class="list dim">${CHART_ROWS.map(([,i,a,b])=>lrow(i(),a,b,'disabled')).join('')}</div></div>`;
 if(!V.chartOpen)return `<div class="sub dfeat">${H}${intro}<button class="btn" data-act="chartopen" data-k="chart">View My Birth Chart →</button>
 <div class="list">${CHART_ROWS.map(([k,i,a,b])=>lrow(i(),a,b,`data-act="chartopen" data-k="${k}"`)).join('')}</div></div>`;
 const b=S.birth,sel=c.pl.find(p=>p.n===V.chartSel),ct=V.chartTab;
 const note=b.unk||!b.time?`<p class="note">Without a birth time, planets are taken at noon on your birth date. ${!hasPlace(b)?'Add your birth place to calculate the Ascendant, Midheaven and houses. ':''}${c.moonRange?`The Moon moves from ${sIdx(c.moonRange[0]).name} to ${sIdx(c.moonRange[1]).name} during your birth day, so its sign depends on your birth time.`:''}</p>`:!hasPlace(b)?'<p class="note">Add your birth place so your birth time can be used for the Ascendant, Midheaven and houses.</p>':'';
 const big=[['Sun',c.pl[0]],['Moon',c.pl[1]]].map(([n,p])=>`<div class="b3"><span class="glyph">${p.g}</span><span>${n}</span><span class="b3-s"><span class="glyph">${sIdx(p.sign).g}</span> ${n==='Moon'&&c.moonRange?'Uncertain':sIdx(p.sign).name}</span><span class="b3-d">${n==='Moon'&&c.moonRange?'':degTxt(p.lon).replace(/ \S+ /,'° ').replace('°°','°')}</span></div>`).join('')
  +`<div class="b3"><span class="glyph">↑</span><span>Rising</span><span class="b3-s">${c.ang?`<span class="glyph">${sIdx(K.signIdx(c.ang.asc)).g}</span> ${sIdx(K.signIdx(c.ang.asc)).name}`:'Needs time and place'}</span><span class="b3-d">${c.ang?degTxt(c.ang.asc).replace(/ \S+ /,'° ').replace('°°','°'):''}</span></div>`;
 let body;
 if(ct==='planets')body=`<div class="list">${c.pl.map(p=>acc(`<span class="glyph pgl">${p.g}</span>`,`${p.n} in ${p.n==='Moon'&&c.moonRange?'an uncertain sign':sIdx(p.sign).name}`,`${p.n==='Moon'&&c.moonRange?'Needs birth time':degTxt(p.lon)}${p.house?' · House '+p.house:''}${p.retro?' · retrograde':''}`,`<p>${placement(p)}</p>`)).join('')}</div>`;
 else if(ct==='aspects')body=`<div class="list">${c.asp.slice(0,18).map(a=>acc(`<span class="glyph pgl">${a.g}</span>`,`${a.a.n} ${a.n} ${a.b.n}`,`orb ${a.orb.toFixed(1)}°`,`<p>Your ${PM[a.a.n]} and ${PM[a.b.n]} ${ASPT[a.n]}.</p>`)).join('')||'<p class="muted center">No major aspects within the orbs used.</p>'}</div>`;
 else if(ct==='houses')body=c.known?`<p class="muted small center">Whole-sign houses: each sign is one house, starting from the rising sign.</p><div class="list">${HOUSE.map((h,i)=>{const s=sIdx(K.signIdx(c.ang.asc)+i),inn=c.pl.filter(p=>p.house===i+1).map(p=>p.n);return acc(`<span class="hn">${i+1}</span>`,`${ORD(i+1)} house · ${s.name}`,h,`<p>The ${ORD(i+1)} house is the life area of ${h}. In your chart it falls in ${s.name}, so you tend to meet it ${STYLE[s.id]}.${inn.length?` ${inn.join(', ')} ${inn.length>1?'are':'is'} placed here, bringing ${inn.map(n=>PM[n]).join('; ')} into this area.`:''}</p>`)}).join('')}</div>`:empty('Houses need your birth time and place','Add them below to see the twelve houses of your chart.');
 else body=`<div class="wheel-wrap">${chartWheel(c)}</div>${sel?panel(`<h3><span class="glyph">${sel.g}</span> ${sel.n} in ${sIdx(sel.sign).name}</h3><p>${placement(sel)}</p>`):'<p class="muted center small">Tap a planet to read it.</p>'}<div class="big3">${big}</div>
  ${acc('','Full Interpretation','A complete analysis of your chart',`<div class="read">${c.pl.filter(p=>!(p.n==='Moon'&&c.moonRange)).map(p=>`<p><strong>${p.n} in ${sIdx(p.sign).name}.</strong> ${placement(p)}</p>`).join('')}${c.ang?`<p><strong>${sIdx(K.signIdx(c.ang.asc)).name} rising.</strong> You tend to meet the world ${STYLE[sIdx(K.signIdx(c.ang.asc)).id]}.</p>`:''}</div>`,!!V.chartInterp)}`;
 return `<div class="sub">${H}<p class="muted center">${ymdLong(b.date)}${b.unk||!b.time?'':' · '+esc(b.time)}${b.place?' · '+esc(b.place):''}</p>
 <div role="group" aria-label="Chart views">${seg([['chart','Chart'],['planets','Planets'],['aspects','Aspects'],['houses','Houses']],ct,'ctab')}</div>${note}${body}
 <p class="muted small">Method: tropical zodiac, geocentric positions on the true ecliptic of date from the Astronomy Engine ephemeris. Your local birth time is converted to UTC with the historical rules for ${esc(b.tz||TZ())}. Houses are whole-sign; aspect orbs are 8° for conjunctions and oppositions, 6° for squares and trines, 4° for sextiles.</p>
 <button class="btn ghost" data-act="kasask" data-q="Explain my rising sign and what my chart’s big three suggest.">Ask Kassandra about my chart</button>
 <details class="acc"${V.birthDraft?' open':''}><summary><span class="lr-t"><strong>Edit birth details</strong></span><span class="lr-c">${IC.chev}</span></summary><div class="acc-b">${form}</div></details></div>`;
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
const signSelect=(id,label,v)=>`<div class="field"><label for="${id}">${label}</label><div class="inp sel"><span class="glyph">${v?sg(v).g:'✦'}</span><select id="${id}">${v?'':'<option value="">Choose a sign</option>'}${SIGNS.map(s=>`<option value="${s.id}" ${v===s.id?'selected':''}>${s.name}</option>`).join('')}</select></div></div>`;
function affinityView(){
 const a=V.love.a||S.sign,b=V.love.b;let res='';
 if(V.love.done&&a&&b){const r=zodiacMatch(a,b),sc=affScore(a,b),A1=sg(a),B1=sg(b),saved=S.conns.some(c=>c.kind==='zodiac'&&c.data.a===a&&c.data.b===b);
  const el=r.themes;
  res=`<div class="result" id="affres"><div class="pairm">${med(a,'pm')}<span class="pm-h">${IC.heart}</span>${med(b,'pm')}</div><div class="pair-n"><span>${A1.name}</span><span>${B1.name}</span></div>
  <h2 class="center">${sc.title}</h2><p class="center lead">${el[1][1]} ${r.angle[1]}</p>
  <div class="score"><span class="sc-h">${IC.heart}</span><strong>${sc.overall}%</strong><span>Overall compatibility</span></div>
  <div class="pills4"><span class="p-love">Love <b>${sc.love}%</b></span><span class="p-friend">Friendship <b>${sc.friend}%</b></span><span class="p-comm">Communication <b>${sc.comm}%</b></span><span class="p-val">Values <b>${sc.values}%</b></span></div>
  <p class="muted small center">A symbolic score from the angle between your signs (${r.angle[0].toLowerCase()}), their elements and their modalities: a starting point for conversation, not a verdict.</p>
  <div class="list">${acc(pic('cats','love','acc-i'),'Love Compatibility','Romance and emotional connection',`<p>${el[1][1]}</p><p>${r.angle[1]}</p>`)}${acc(pic('cats','connections','acc-i'),'Friendship Compatibility','Shared values and support',`<p>${el[0][1]}</p><p>${el[4][1]}</p>`)}${acc(pic('cats','career','acc-i'),'Work Compatibility','How you collaborate',`<p>${el[3][1]}</p>`)}${acc(pic('cats','moon','acc-i'),'Detailed Analysis','Strengths, challenges and advice',matchBody(a,b))}</div>
  <div class="acts"><button class="btn" data-act="saveconn" data-kind="zodiac">${saved?'Saved to your journal':'Save connection'}</button><button class="btn ghost" data-act="kasask" data-q="What do ${A1.name} and ${B1.name} traditionally bring out in each other?">Ask Kassandra</button><button class="btn ghost" data-go="discover" data-t="synastry">Compare birth charts</button></div></div>`}
 return `<div class="sub">${hdr('Zodiac Affinity',{sub:'Love • Friendship • Connection'})}${ui('hero-affinity','plate-img')}<p class="lead">Explore the natural flow between two signs and discover your strengths, challenges and unique connection.</p>
 <div class="two">${signSelect('za','Your sign',a)}${signSelect('zb','Their sign',b)}</div><button class="btn" data-act="domatch" ${b?'':'disabled'}>See Compatibility →</button>${res||`<div class="list dim">${[['love','love','Love Compatibility','Romance and emotional connection'],['connections','friend','Friendship Compatibility','Shared values and support'],['career','work','Work Compatibility','How you collaborate'],['moon','more','Detailed Analysis','Strengths, challenges and advice']].map(([i,,a2,b2])=>lrow(pic('cats',i,'acc-i'),a2,b2,'disabled')).join('')}</div><p class="muted small center">Choose their sign to see your compatibility.</p>`}${res?ui('cal-scene','foot-scene'):''}</div>`;
}
// the three numerology comparisons for two names, each an expandable reading
function resonanceView(){
 const R=V.res,a=R.a||S.fullName||S.name,b=R.b;
 let out='';
 if(R.done&&N.clean(a)&&N.clean(b)){const saved=S.conns.some(c=>c.kind==='resonance'&&c.data.a===a&&c.data.b===b);
  out=`<div class="list">${resonanceRows(a,b,h=>{const m=/^<h3>(.*?)<\/h3>([\s\S]*)$/.exec(h);return m?acc('',m[1],'',m[2],true):h})}</div>`+panel(resMethod())+`<div class="acts"><button class="btn" data-act="saveconn" data-kind="resonance">${saved?'Saved to your journal':'Save connection'}</button></div>`}
 return `<div class="sub">${hdr('Soul Resonance',{sub:'Name match'})}${ui('d-resonance','plate-img sm')}<p class="lead">Compare two names through numerology, using full birth names where you know them.</p>
 <div class="field"><label for="ra">Your name</label><div class="inp">${IC.star}<input type="text" id="ra" value="${esc(a)}" autocomplete="name" placeholder="Your full name"></div></div><div class="field"><label for="rb">Their name</label><div class="inp">${IC.heart}<input type="text" id="rb" value="${esc(b)}" placeholder="Their full name"></div></div><button class="btn" data-act="doresonance">Compare Our Names →</button><p class="muted small center">Names stay private to you.</p>${out}</div>`;
}
/* Life Path: the number, then its strengths, challenges and guidance as expandable readings */
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
function lifePathView(){
 const d=V.lpDate||S.birth.date,H=hdr('Life Path',{sub:'Your soul’s journey'});
 const form=`${ui('hero-lifepath','plate-img')}<p class="lead">Discover the meaning behind your numbers and the path you are here to walk. Your Life Path reveals your gifts, lessons and the opportunities that shape your journey.</p>
 <div class="field"><label for="lpd">Your date of birth</label><div class="inp">${IC.cal}<input type="date" id="lpd" value="${esc(d||'')}"></div></div><button class="btn" data-act="lpgo">Discover My Life Path →</button>`;
 if(!/^\d{4}-\d\d-\d\d$/.test(d||''))return `<div class="sub">${H}${form}<div class="list dim">${[['ex-lifepath','Your Life Path Number','Your core purpose'],['t-whisper','Key Strengths','Your natural gifts'],['ds-flying','Challenges','Lessons to grow from'],['t-journal','Guidance','How to align with your path']].map(([i,a2,b2])=>lrow(ui(i,'acc-i round'),a2,b2,'disabled')).join('')}</div></div>`;
 const L=N.lifePath(d),bd=N.birthday(d),M=N.MEANING[L.r.n],X=LPX[L.r.n]||LPX[L.r.n%9||9],ch=x=>x.chain.length>1?x.chain.join(' → '):String(x.n);
 return `<div class="sub">${H}${form}
 ${panel(`<div class="lp"><span class="num big">${L.r.n}</span><div><p class="kick">Your Life Path Number</p><h2>${M[0]}</h2><p class="muted">${M[1]}</p></div></div><p>${M[2]}</p>`,'ornate')}
 <div class="list">${acc(ui('t-whisper','acc-i round'),'Key Strengths','Your natural gifts',`<p>${X[0]}</p>`,true)}${acc(ui('ds-flying','acc-i round'),'Challenges','Lessons to grow from',`<p>${X[1]}</p>`)}${acc(ui('t-journal','acc-i round'),'Guidance','How to align with your path',`<p>${X[2]}</p>`)}
 ${acc(ui('ex-name','acc-i round'),'The Calculation','How your number was found',`<p class="calc">Birth date ${ymdLong(d)}<br>Month ${L.m}: ${ch(L.parts.month)}<br>Day ${L.d}: ${ch(L.parts.day)}<br>Year ${L.y}: ${String(L.y).split('').join(' + ')} = ${L.parts.year.chain.slice(1).join(' → ')}<br>Together: ${L.parts.month.n} + ${L.parts.day.n} + ${L.parts.year.n} = ${L.total}${L.r.chain.length>1?' → '+L.r.chain.slice(1).join(' → '):''}</p><p class="muted small">Method: month, day and year are each reduced to a single digit or a master number (11, 22, 33), then added and reduced again.</p>`)}
 ${acc(ui('ex-lifepath','acc-i round'),`Birthday Number · ${bd.n}`,N.MEANING[bd.n][0],`<p>The day you were born adds a gift to your path: ${N.MEANING[bd.n][1]}.</p>`)}</div>
 <button class="btn ghost" data-go="discover" data-t="cycles">My Personal Cycles</button></div>`;
}
/* The Name Within: the numbers in a full birth name, each an expandable reading with its working */
function nameView(){
 const nm=nameNums(S.fullName),alt=nameNums(S.altName),L=hasBirthDate()?N.lifePath(S.birth.date):null;
 const tbl=`<table class="ltable"><tr>${N.TABLE.map(([v])=>`<th>${v}</th>`).join('')}</tr>${[0,1,2].map(r=>`<tr>${N.TABLE.map(([,ls])=>`<td>${ls[r]||''}</td>`).join('')}</tr>`).join('')}</table>`;
 const letters=x=>`<div class="letters">${x.letters.map(l=>`<span class="lt${l.vowel?' v':''}"><b>${l.c}</b><i>${l.v}</i></span>`).join('')}</div>`;
 const one=(x,k)=>x[k]&&x[k].r.n?`<span class="num">${x[k].r.n}</span> <strong>${N.MEANING[x[k].r.n][0]}</strong>`:'';
 const rows=x=>acc(pic('cats','general','acc-i'),'Expression Number',`Your natural abilities and purpose ${one(x,'expression')}`,`${numBlock('Expression (Destiny): who you are becoming',x.expression,true)}<p>${N.MEANING[x.expression.r.n]?N.MEANING[x.expression.r.n][2]:''}</p>`,true)
  +acc(pic('cats','love','acc-i'),'Soul Urge Number',`Your inner desires ${one(x,'soul')}`,numBlock('Soul Urge: what your heart longs for',x.soul,true))
  +acc(pic('cats','insights','acc-i'),'Personality Number',`How you show up to the world ${one(x,'personality')}`,numBlock('Personality: how others first meet you',x.personality,true))
  +(L&&x.expression.r.n?(()=>{const m=N.reduce(L.r.n+x.expression.r.n);return acc(pic('cats','lifepath','acc-i'),'Maturity Number',`Who you grow into · <span class="num">${m.n}</span>`,`<p>Your Life Path (${L.r.n}) and Expression (${x.expression.r.n}) together: ${L.r.n} + ${x.expression.r.n} = ${L.r.n+x.expression.r.n}${m.chain.length>1?' → '+m.chain.slice(1).join(' → '):''}. <strong>${N.MEANING[m.n][0]}</strong>: ${N.MEANING[m.n][1]}, the qualities that tend to ripen in the second half of life.</p>`)})():'')
  +acc('','Your letters','Vowels are highlighted',letters(x));
 return `<div class="sub">${hdr('The Name Within',{sub:'Name numerology'})}${ui('hero-name','plate-img')}<p class="lead">Your name carries a vibration and a story. Discover what your name reveals about your personality, purpose and life path.</p>
 <div class="field"><label for="fn">Your full name at birth</label><div class="inp">${IC.star}<input type="text" id="fn" value="${esc(S.fullName)}" autocomplete="name" placeholder="Enter your full name"></div></div>
 <details class="more"><summary>More options</summary><div class="field"><label for="an">Name you use now (optional)</label><input type="text" id="an" value="${esc(S.altName)}" placeholder="A married name, a chosen name, a nickname"></div><div class="field"><label for="ym">The letter Y counts as</label><select id="ym"><option value="auto" ${S.settings.yMode==='auto'?'selected':''}>Vowel when no other vowel is beside it</option><option value="vowel" ${S.settings.yMode==='vowel'?'selected':''}>Always a vowel</option><option value="consonant" ${S.settings.yMode==='consonant'?'selected':''}>Always a consonant</option></select></div></details>
 <button class="btn" data-act="savenames">Reveal My Numbers →</button>
 ${nm?`<div class="list">${rows(nm)}</div>`:`<div class="list dim">${[['general','Expression Number','Your natural abilities'],['love','Soul Urge Number','Your inner desires'],['insights','Personality Number','How you show up to the world'],['lifepath','Destiny Number','Your life purpose']].map(([i,a2,b2])=>lrow(pic('cats',i,'acc-i'),a2,b2,'disabled')).join('')}</div>`}
 ${alt?`<h3 class="sec-h">The name you use now</h3><div class="list">${rows(alt)}</div><p class="muted small">Your birth name is read as the blueprint you arrived with; the name you use now as the way you have chosen to express it.</p>`:''}
 ${acc('','The Pythagorean letter table','How each letter is counted',`${tbl}<p class="muted small">Accents are ignored (É counts as E), as are hyphens, apostrophes and spaces. Each word of a name is reduced on its own, then the words are added and reduced again, keeping master numbers 11, 22 and 33.</p>`)}</div>`;
}
/* Cosmic Calendar: a month of the sky, each event with its picture, its words and, when opened, its astronomy and meaning */
function calendarView(){
 const now=new Date(),m=K.moon(now),pos=K.positions(now),rx=pos.filter(p=>p.retro),mk=V.cal.month||dkey().slice(0,7),[y,mo]=mk.split('-').map(Number);
 const prev=new Date(Date.UTC(y,mo-2,1)).toISOString().slice(0,7),next=new Date(Date.UTC(y,mo,1)).toISOString().slice(0,7);
 const first=Date.UTC(y,mo-1,1),evs=K.events(new Date(first-14*36e5),new Date(Date.UTC(y,mo,1)+14*36e5)).filter(e=>(e.dateOnly?e.date.toISOString().slice(0,10):dkey(e.date)).slice(0,7)===mk);
 const weather=panel(`<p class="kick">Today’s cosmic weather</p><div class="ce"><span class="ce-art">${moonPic(m,'ce-moon')}</span><p>The Moon is ${m.name==='Full Moon'?'full':m.name==='New Moon'?'new':'a '+m.name.toLowerCase()} in ${sIdx(m.sign).name}; the Sun is in ${sIdx(pos[0].sign).name}.${rx.length?` ${rx.map(p=>p.n).join(', ')} ${rx.length>1?'are':'is'} retrograde.`:' No planets are retrograde.'}</p></div>`,'ornate');
 let body;
 if(V.cal.view==='month'){
  const days=new Date(Date.UTC(y,mo,0)).getUTCDate(),lead=(new Date(first).getUTCDay()+6)%7,byDay={};
  evs.forEach(e=>{const k=e.dateOnly?e.date.toISOString().slice(0,10):dkey(e.date);(byDay[k]=byDay[k]||[]).push(e)});
  const sel=V.cal.day&&V.cal.day.slice(0,7)===mk?V.cal.day:'';
  body=`<div class="jcal" role="grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="jc-d" role="columnheader">${d}</div>`).join('')}${Array.from({length:lead},()=>'<div></div>').join('')}${Array.from({length:days},(_,i)=>{const k=`${mk}-${String(i+1).padStart(2,'0')}`,es=byDay[k]||[],ph=es.find(e=>e.type==='moon');return `<button class="jc-c${k===dkey()?' today':''}${k===sel?' sel':''}" data-act="calday" data-k="${k}" aria-label="${ymdLong(k)}${es.length?', '+es.length+' event'+(es.length>1?'s':''):''}"><span>${i+1}</span>${ph?pic('moons',phaseSlug(ph.name),'jc-moon'):es.length?'<i class="jc-star">✦</i>':''}</button>`}).join('')}</div>
  ${sel?`<h3 class="sec-h">${ymdLong(sel)}</h3><div class="list">${(byDay[sel]||[]).map(e=>evRow(e)).join('')||'<p class="muted center">Nothing notable in the sky this day.</p>'}</div>`:'<p class="muted center small">Tap a day to see its events.</p>'}`;
 }else body=`<div class="list">${evs.map(e=>evRow(e)).join('')||'<p class="muted center">A quiet month in the sky.</p>'}</div>`;
 return `<div class="sub">${hdr('Cosmic Calendar',{right:iconBtn('refresh','data-act="calmonth" data-k=""','Back to this month')})}
 <div class="mnav"><button class="ibtn" data-act="calmonth" data-k="${prev}" aria-label="Previous month">${IC.back}</button><h2>${ymdLong(mk+'-01',{month:'long',year:'numeric'})}</h2><button class="ibtn flip" data-act="calmonth" data-k="${next}" aria-label="Next month">${IC.back}</button></div>
 ${seg([['list','List'],['month','Month']],V.cal.view,'calview')}${body}${weather}
 <div class="list">${lrow(pic('moons','full-moon','th round'),'The Moon','Phases, signs and rituals','data-go="discover" data-t="moon"')}${lrow(ui('ev-planet','th round'),'Planets','Positions and retrogrades','data-go="discover" data-t="planets"')}${lrow(ui('ev-eclipse','th round'),'Celestial Events','Eclipses, seasons and meteors','data-go="discover" data-t="events"')}</div>${ui('cal-scene','foot-scene')}</div>`;
}
// one event in a list: its picture, date, name and words; opened, the astronomy, the symbolism and a question
function evRow(e){
 const ref=evRef(e),open=V.evOpen===ref,i=evInfo(e),sv=isSaved('event',ref),d=e.dateOnly?e.date.toISOString().slice(0,10):dkey(e.date);
 return `<div class="evr${open?' open':''}" id="ev-${esc(ref).replace(/[^\w-]/g,'')}"><button class="lrow" data-act="evtoggle" data-ref="${ref}" aria-expanded="${open}"><span class="lr-i">${evArt(e,true)}</span><span class="lr-t"><span class="evr-d">${ymdLong(d,{day:'numeric',month:'short'})}</span><strong>${esc(e.name)}${e.sign!=null&&e.k!=='ingress'?` in ${sIdx(e.sign).name}`:''}</strong><span>${esc(evKeys(e))}</span></span><span class="lr-c">${IC.chev}</span></button>
 ${open?`<div class="acc-b"><p class="muted small">${evWhen(e)}</p><p class="kick">Astronomy</p><p>${i.fact}</p><p class="kick">Astrological symbolism</p><p>${i.sym}</p><p class="quote">“${i.ref}”</p><div class="acts"><button class="btn sm" data-act="bookev" data-ref="${ref}">${sv?'Saved to your journal':'Save to my journal'}</button>${sv?`<button class="btn ghost sm" data-act="jopen" data-k="bk:event:${esc(ref)}">Write a reflection</button>`:''}</div></div>`:''}</div>`;
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
const JFILT=[['all','All'],['tarot','Tarot'],['horoscope','Horoscope'],['dreams','Dreams'],['connections','Connections'],['free','Free Write']];
function journalLib(){
 const f=V.jfilter,q=(V.jsearch||'').trim().toLowerCase();
 const items=journalItems().filter(p=>(f==='all'||JKIND[p.t][2]===f)&&(!q||plain(jHeading(p)+' '+jSub(p)+' '+jText(p)).toLowerCase().includes(q))).sort((a,b)=>(b.day+(b.at||''))>(a.day+(a.at||''))?1:-1);
 return `<div class="land jlib">${hero('hero-journal',`<div class="hero-acts">${iconBtn('search','data-act="jsearch"','Search your journal')}<button class="fab" data-act="sheet" data-k="new" aria-label="New entry">${IC.plus}</button></div>`,'mid','Journal','Your space to reflect, integrate and grow')}
 <div class="sheet">${V.jsearch!=null?`<div class="field"><label class="sr-only" for="jq">Search</label><div class="inp">${IC.search}<input type="search" id="jq" value="${esc(V.jsearch)}" placeholder="Search titles and reflections"></div></div>`:''}
 <div class="fscroll">${chips('Show',JFILT,f,'jfilter')}</div>
 <div class="tools">${[['cal','Calendar','calendar'],['chart','Insights','insights'],['book','Notebook','notebook']].map(([i,l,t])=>`<button data-go="tarot" data-t="${t}">${IC[i]}<span>${l}</span></button>`).join('')}</div>
 <div class="list jlist">${items.length?items.map(jrow).join(''):`<p class="muted center">${q||f!=='all'?'Nothing here yet.':'Your journal is waiting for its first page.'}</p>`}</div>
 <div class="jend">${ui('journal-end','je-i')}<p class="je-t">Every thought you write<br>is a star you place<br>in your own sky.</p><button class="btn gold" data-act="sheet" data-k="new">New Entry</button></div>
 </div></div>${sheetView()}`;
}
// the sheet that starts a new entry, from any of the things a reflection can belong to
function sheetView(){
 if(!V.sheet)return '';
 let body='',title='New Entry';
 if(V.sheet==='new')body=[['ne-card','Today’s Card','Reflect on your Daily Whisper','card'],['ne-tarot','Tarot Reading','Write about a recent reading','reading'],['ne-horoscope','Horoscope','Journal your astrological insights','horoscope'],['ne-event','Cosmic Event','Reflect on a moon, eclipse or transit','event'],['d-dream','Dream','Record a dream and its meaning','dream'],['ne-free','Free Write','A space for anything on your mind','free']]
  .map(([i,t,s,k])=>lrow(ui(i,'th'),t,s,`data-act="ne" data-k="${k}"`)).join('');
 if(V.sheet==='event'){title='Cosmic Event';const now=new Date(),m=K.moon(now);
  body=lrow(moonPic(m,'th round'),`${m.name} in ${sIdx(m.sign).name}`,'The Moon tonight','data-act="ne" data-k="moon"')+upcoming().slice(0,8).map(e=>lrow(evArt(e,true),esc(e.name),evWhen(e),`data-act="ne" data-k="ev" data-ref="${evRef(e)}"`)).join('')}
 if(V.sheet==='reading'){title='Tarot Reading';
  body=S.readings.slice().reverse().slice(0,10).map(r=>lrow(`<span class="fan">${r.cards.slice(0,3).map(x=>pic('deck',x.id,'fan-c'+(x.rev?' rev':''))).join('')}</span>`,esc((SPREADS[r.spread]||{s:r.spread}).s),relDay(r.date),`data-act="jopen" data-k="reading:${esc(r.id)}"`)).join('')+lrow(ui('t-reading','th oval'),'Draw a new reading','Shuffle the deck and choose your cards','data-go="tarot" data-t="reading"')}
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
 if(p.t==='n')return `<div class="et"><div class="et-art">${Kit.tarot({art:'whispers/'+p.o.id,num:wNum(p.o),name:p.o.title})}</div><div>${date}<h2>${esc(p.o.title)}</h2><p class="et-keys">${keys(wKeys(p.o))}</p><p class="et-q">“${esc(p.o.msg)}”</p></div></div>`;
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
function entryView(){
 const p=jFind(V.jkey);
 if(!p)return `<div class="sub">${hdr('Journal Entry')}${empty('This page is no longer in your journal','It may have been torn out on another device.',linkBtn('Back to the journal','tarot','journal','btn'))}</div>`;
 if(!JE||jKey(JE)!==jKey(p)){jeLeave();JE=p}
 const key=jKey(p),pr=PROMPTS[p.t]||PROMPTS.j,on=(S.intent||{})[key]||[],txt=jText(p);
 return `<div class="sub entry">${hdr('Journal Entry',{right:`<button class="hsave" data-act="jsavenow">Save</button>${p.t==='n'&&!S.saved.some(x=>x.date===p.day)&&!S.notes[p.day]?'':iconBtn('more','data-act="jmenu"','Entry options')}`})}
 ${V.jmenu?`<div class="menu-pop"><button data-act="jdelentry">${IC.trash} Tear out this page</button><button data-act="jnotebook">${IC.book} Open in the notebook</button></div>`:''}
 ${entryTop(p)}<div class="divider" aria-hidden="true">${IC.star}</div>
 <h2 class="sec-h">My Reflection <span id="jsaved" class="saved">${txt?'Saved':''}</span></h2>
 <div class="je-box"><div class="je-tools" role="toolbar" aria-label="Writing tools">${JTOOLS.map(([k,l,g])=>`<button type="button" data-act="jfmt" data-k="${k}" aria-label="${l}" title="${l}">${g}</button>`).join('')}</div>
 <label class="sr-only" for="je">My reflection</label><textarea id="je" class="je" placeholder="${esc(pr[0])}">${esc(txt)}</textarea></div>
 <div class="prompts"><p class="kick">Guiding prompts <span class="muted">(optional)</span></p>${pr.map((q,i)=>`<button class="pr" data-act="jprompt" data-i="${i}">${ui(['t-whisper','t-reading','t-journal'][i],'pr-i')}<span>${esc(q)}</span>${IC.chev}</button>`).join('')}</div>
 ${p.t!=='j'?`<div class="intent"><h3>Today I’m taking with me…</h3>${intents(key).map((x,i)=>`<label class="ck"><input type="checkbox" class="cb" data-act="jint" data-i="${i}" ${on[i]?'checked':''}><span>${esc(x)}</span></label>`).join('')}</div>`:''}
 <p class="muted small center">Private to you${C.user?' and kept in your account':' and kept in this browser'}. Everything is saved as you write.</p></div>`;
}
// a small engraved Moon for a calendar day: the lit part drawn from how much of the Moon is lit that night
const phaseGlyph=d=>{const m=K.moon(d),o=((m.waxing?-1:1)*m.ill*2).toFixed(2),id='pg'+d.getTime();
 return `<svg class="jc-ph" viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"><defs><clipPath id="${id}"><circle r="1"/></clipPath></defs><g clip-path="url(#${id})"><circle r="1" fill="#EADCBC"/><circle cx="${o}" r="1" fill="#1E2740"/></g><circle r="1" fill="none" stroke="#8A6430" stroke-width=".12"/></svg>`};
/* the calendar: each month with its Moon's phases, the days that hold entries, and those entries beneath */
function journalCal(){
 const mk=V.jcal.month||dkey().slice(0,7),[y,mo]=mk.split('-').map(Number),first=Date.UTC(y,mo-1,1),days=new Date(Date.UTC(y,mo,0)).getUTCDate(),lead=(new Date(first).getUTCDay()+6)%7;
 const prev=new Date(Date.UTC(y,mo-2,1)).toISOString().slice(0,7),next=new Date(Date.UTC(y,mo,1)).toISOString().slice(0,7);
 const byDay={};journalItems().forEach(p=>{if(p.day.slice(0,7)===mk)(byDay[p.day]=byDay[p.day]||[]).push(p)});
 const ph={};if(K)K.lunarPhases(new Date(first-DAY),new Date(Date.UTC(y,mo,1)+DAY)).forEach(e=>{const k=dkey(e.date);if(k.slice(0,7)===mk)ph[k]=e.k.replace('_','-')});
 const sel=V.jcal.day&&V.jcal.day.slice(0,7)===mk?V.jcal.day:mk===dkey().slice(0,7)?dkey():'';
 return `<div class="sub">${hdr('Journal Calendar',{sub:'Find past entries by date'})}
 <div class="mnav"><button class="ibtn" data-act="jcalm" data-k="${prev}" aria-label="Previous month">${IC.back}</button><h2>${ymdLong(mk+'-01',{month:'long',year:'numeric'})}</h2><button class="ibtn flip" data-act="jcalm" data-k="${next}" aria-label="Next month">${IC.back}</button></div>
 <div class="jcal" role="grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="jc-d" role="columnheader">${d}</div>`).join('')}${Array.from({length:lead},()=>'<div></div>').join('')}
 ${Array.from({length:days},(_,i)=>{const k=`${mk}-${String(i+1).padStart(2,'0')}`,n=(byDay[k]||[]).length;return `<button class="jc-c${k===dkey()?' today':''}${k===sel?' sel':''}" data-act="jcald" data-k="${k}" aria-label="${ymdLong(k)}${n?', '+n+' entr'+(n>1?'ies':'y'):''}${ph[k]?', '+ph[k].replace('-',' '):''}"><span>${i+1}</span>${ph[k]?pic('moons',ph[k],'jc-moon'):K?phaseGlyph(new Date(Date.UTC(y,mo-1,i+1,20))):'<i class="jc-sp"></i>'}${n?`<i class="jc-dot">${'•'.repeat(Math.min(3,n))}</i>`:''}</button>`}).join('')}</div>
 ${sel?`<h3 class="sec-h">Entries on ${ymdLong(sel,{day:'numeric',month:'long'})}</h3><div class="list">${(byDay[sel]||[]).map(p=>lrow(jThumb(p),jHeading(p),`${JKIND[p.t][0]}${p.at?' • '+fmt({hour:'2-digit',minute:'2-digit'},new Date(p.at)):''}`,`data-act="jopen" data-k="${esc(jKey(p))}"`)).join('')||'<p class="muted center">Nothing written on this day.</p>'}</div>`:''}</div>`;
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
 return `<div class="land">${hero('hero-insights',iconBtn('back','data-act="back"','Back'),'short','Your Journal','A journey of discovery')}<div class="sheet">${seg([['insights','Insights'],['themes','Themes']],V.insTab,'ins')}${body}</div></div>`;
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
 const list=dreams();
 return `<div class="land">${hero('hero-dream',iconBtn('back','data-act="back"','Back'),'mid','Dream Interpretation','Unlock the messages within')}<div class="sheet">
 <p class="lead center">Your dreams are a bridge between your conscious and subconscious mind. Discover their meaning, explore symbols and uncover the guidance your dreams are offering you.</p>
 <div class="two"><button class="btn" data-go="discover" data-t="new-dream">Interpret a Dream</button><button class="btn ghost" data-go="discover" data-t="dream-journal">Dream Journal</button></div>
 ${orn('Common Symbols')}<div class="symrow">${['water','flying','snake','house','death'].map(id=>{const s=dsym(id);return `<button data-act="libgo" data-tab="dreams" data-q="${esc(s.name.replace(/^(The|A|An) /,''))}">${artOf(s.art,'sym-i')}<strong>${s.name.replace(/^The /,'')}</strong><span>${s.keys[0]}</span></button>`}).join('')}</div>
 ${dreamPatterns(list)}
 ${list.length?`${orn('Recent Dreams',seeAll('discover','dream-journal'))}<div class="list">${list.slice(0,3).map(dreamRow).join('')}</div>`:''}
 <p class="muted small center">Dream meanings are symbolic and personal. They are offered for reflection, not as scientifically established predictions.</p></div></div>`;
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
 <button class="btn" data-act="dgo">Interpret My Dream →</button>
 <p class="muted small center">${C.user?'Kassandra reads your dream with AI; only what you write here is sent.':'Without signing in, your dream is read with Kosmia’s dream dictionary. Sign in for Kassandra’s personal reading.'} Your dream is kept privately in your Dream Journal.</p></div>`;
}
function dreamView(){
 const d=dreams().find(x=>x.id===V.dreamId);
 if(!d)return `<div class="sub">${hdr('Your Dream Meaning')}${empty('This dream is no longer in your journal','It may have been removed on another device.',linkBtn('Dream Journal','discover','dream-journal','btn'))}</div>`;
 const I=d.interp||{};
 return `<div class="sub">${hdr('Your Dream Meaning',{sub:ymdLong(d.day,{day:'numeric',month:'long',year:'numeric'})})}
 <div class="dm-art">${dreamArt(d,'dm-img')}</div><h2 class="center dm-t">${esc(I.title||'Your Dream')}</h2><p class="keys">${keys((I.keywords||[]).slice(0,3))}</p>
 <div class="read">${paras(I.meaning)}</div>
 ${(I.symbols||[]).length?`${orn('Other Symbols in Your Dream')}<div class="symrow">${I.symbols.map(s=>{const x=dsym(s.id);return `<button data-act="libgo" data-tab="dreams" data-q="${esc(s.name)}">${x?artOf(x.art,'sym-i sq'):ui('d-dream','sym-i sq')}<strong>${esc(s.name)}</strong><span>${esc(s.meaning||'')}</span></button>`}).join('')}</div>`:''}
 ${panel(`<p class="kick">A question to sit with</p><p class="quote">“${esc(I.reflection||PROMPTS.d[2])}”</p><button class="btn" data-act="jopen" data-k="bk:dream:${esc(d.id)}">${d.note?'Continue Your Reflection':'Write a Reflection'}</button>`,'ornate')}
 <details class="acc plain"><summary><span class="lr-t"><strong>Your dream, as you wrote it</strong></span><span class="lr-c">${IC.chev}</span></summary><div class="acc-b"><p class="pre">${esc(d.text)}</p></div></details>
 <p class="muted small center">${I.ai?'Read by Kassandra with AI. ':'Read with Kosmia’s dream dictionary. '}Dream meanings are symbolic and subjective, offered for reflection rather than as scientifically established predictions.</p>
 <div class="acts"><button class="btn ghost" data-act="kasask" data-q="I dreamt: ${esc((d.text||'').slice(0,300))} What might it mean?">Ask Kassandra about it</button><button class="btn ghost" data-go="discover" data-t="new-dream">Interpret Another Dream</button></div></div>`;
}
function dreamJournalView(){
 const list=dreams();
 return `<div class="sub">${hdr('Dream Journal',{sub:'Your dreams and what they revealed'})}${dreamPatterns(list)}<div class="list">${list.map(dreamRow).join('')||'<p class="muted center">No dreams recorded yet.</p>'}</div><button class="btn" data-go="discover" data-t="new-dream">Record a Dream</button></div>`;
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
 else if(S.revealed[k]){const c=todayCard();ctx.reading=`Today’s Whisper card: “${c.title}”: ${c.msg} Reflection question: ${c.ref}`}
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
 return `<div class="sub kas-page${has?' has':''}">${hdr('Kassandra',{sub:'Your AI Fortune Teller',back:false,right:iconBtn('history','data-go="kassandra" data-t="history"','Past conversations')})}
 <div class="kp-frame"><svg class="kp-ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="98" fill="none" stroke="#B98A4E" stroke-width=".8"/><circle cx="100" cy="100" r="93" fill="none" stroke="#B98A4E" stroke-width=".5" stroke-dasharray="1 2.5"/>${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,x=(100+Math.cos(a)*95.5).toFixed(1),y=(100+Math.sin(a)*95.5).toFixed(1);return `<path d="M${x} ${(+y-3).toFixed(1)}l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#B98A4E"/>`}).join('')}</svg><div class="kp-por">${STARS}${ui('kassandra','kp-img','Kassandra, the fortune teller',true)}</div></div>
 <div class="kp-bub">${signed?(has?'Ask me anything else, or tap the mic to speak with me.':'Hello, I’m Kassandra.<br>Ask me anything or tap the mic to speak with me.'):'Hello, I’m Kassandra.<br>Sign in and I will read the cards, the stars and your numbers with you.'}</div>
 ${signed?`<button class="kp-mic${on&&rec==='listening'?' on':''}" data-act="kasmic" aria-label="${on&&rec==='listening'?'Stop recording':'Ask with your voice'}" ${rec==='processing'||KS.busy?'disabled':''}>${on&&rec==='listening'?IC.stop:IC.mic}</button>${on&&rec!=='idle'?`<p class="muted center small">${rec==='listening'?'Listening… tap again when you have finished.':'Hearing your question…'}</p>`:''}
 <div class="kp-pr">${kasPrompts().map(p=>`<button class="pill-b" data-act="kasask" data-q="${esc(p)}">${esc(p)}</button>`).join('')}</div>
 ${has||KS.busy?`<div class="thread" id="kthread" aria-live="polite">${KS.msgs.map(m=>`<div class="kas-m ${m.role}">${esc(m.content).replace(/\n+/g,'<br>')}</div>`).join('')}${KS.busy?'<div class="kas-m assistant muted">Kassandra is gazing into the crystal…</div>':''}</div>`:''}
 <form id="kas-f" class="kas-f"><label class="sr-only" for="kas-in">Your question for Kassandra</label><input type="text" id="kas-in" placeholder="Ask Kassandra…" maxlength="600" ${rec!=='idle'?'disabled':''}><button type="submit" class="kas-send" aria-label="Send" ${KS.busy||rec!=='idle'?'disabled':''}>${IC.send}</button></form>
 <label class="ck small"><input type="checkbox" id="kas-p" class="cb" ${S.settings.kPersonal?'checked':''}><span>Share my sign, chart and numbers with Kassandra</span></label>
 ${has?'<button class="btn ghost sm" data-act="kasnew">Start a New Conversation</button>':''}`
 :`<button class="kp-mic" data-act="toauth" aria-label="Sign in to speak with Kassandra">${IC.mic}</button>
 <div class="kp-pr">${kasPrompts().map(p=>`<button class="pill-b" data-act="toauth">${esc(p)}</button>`).join('')}</div>
 <button class="btn" data-act="toauth">Sign in to talk with Kassandra</button><p class="muted small center">Kassandra’s readings are written by AI, so she listens once you are signed in.</p>`}
 <p class="muted small center">Kassandra speaks in symbols, not certainties. She cannot give medical, legal or financial advice.</p></div>`;
};
function kasKeep(){S.kcur=KS.msgs.slice(-40);save()}
function kasSend(q){
 q=String(q||'').trim();if(!q||KS.busy)return;if(!C.user)return render();
 KS.msgs.push({role:'user',content:q});KS.busy=true;kasKeep();render();kasScroll();
 C.kassandra(KS.msgs.slice(-12),kasContext()).then(r=>{KS.msgs.push({role:'assistant',content:r.reply||'…'});if(S.settings.voiceOut&&r.reply)playText(r.reply.slice(0,1400))},e=>{KS.msgs.push({role:'assistant',content:e.message||'The crystal is clouded. Try again in a moment.'})})
  .then(()=>{KS.busy=false;kasKeep();if(V.sec==='kassandra'){render();kasScroll()}});
}
const kasScroll=()=>requestAnimationFrame(()=>{const t=$('#kthread');if(t)t.lastElementChild&&t.lastElementChild.scrollIntoView({block:'nearest',behavior:'smooth'})});
// a conversation set aside is kept among the past ones (and in the account), and a fresh one begins
function kasNew(){
 if(!KS.msgs.length)return;const id=uuid(),first=KS.msgs.find(m=>m.role==='user'),now=new Date().toISOString();
 const b={id,kind:'chat',ref:id,data:{title:first?first.content.slice(0,60):'A conversation',msgs:KS.msgs.slice(-40)},at:now};
 S.bookmarks.push(b);C.saveBookmark&&C.saveBookmark(b).then(()=>{b.sy=true;save()},()=>{});KS.msgs=[];kasKeep();render();toast('Kept in your past conversations');
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
   if(target==='dream'){const t=$('#dt');V.dream.text=((t?t.value:V.dream.text)+' '+r.text).trim().slice(0,1000);render()}else kasSend(r.text)},e=>{KS.state='idle';toast(e.message||'Could not hear that. Try typing.');render()})};
 rec.start();render();
 clearTimeout(KS.timer);KS.timer=setTimeout(()=>kasStopRec(false),target==='dream'?90000:45000);
}
function kasStopRec(cancel){if(KS.rec&&KS.rec.state!=='inactive'){KS.cancel=!!cancel;KS.rec.stop()}KS.rec=null;clearTimeout(KS.timer)}

/* ---------- Your Profile (from the avatar on Home): the account, sign, birth details, notifications, display, privacy and plan ---------- */
views.settings=()=>{
 const t=tab();
 if(t==='birth')return `<div class="sub">${hdr('Birth Details',{sub:'For your chart, Life Path and cycles'})}${birthForm()}</div>`;
 if(t==='subscription')return `<div class="sub">${hdr('Subscription')}${panel(`<p class="kick">Your plan</p><h2>Kosmia · Early Access</h2><p>Every part of Kosmia is open to you while it is in early access: horoscopes, Whispers and tarot, your Journal, Dream Interpretation, Discover and Kassandra.</p><p class="muted">No subscription is needed and nothing is charged. If that ever changes, you will be told well in advance and nothing will be charged without your clear agreement.</p>`,'ornate')}</div>`;
 if(t!=='account')return subPage(settingsPage(t));
 const s=sg(S.sign),acct=!C.enabled?'<p class="muted">Accounts are not configured for this build, so everything stays in this browser.</p>'
  :C.user?`<p class="muted">Signed in as ${esc(C.user.email||'')} · synced across your devices.</p>`:`<p class="muted">Not signed in. Create an account or sign in to keep your universe in sync across devices.</p><button class="btn" data-act="toauth">Sign in or create an account</button>`;
 return `<div class="sub">${hdr('Your Profile')}
 ${Kit.scene({cls:'pf-scene',bg:'atlas/home-sky',ratio:'auto',bgPos:'50% 8%',stars:true,bare:true,label:'Your cosmic identity',content:`
 <span class="pf-fig" aria-hidden="true"><span class="hh-halo">${Kit.img('atlas/home-halo')}</span>${Kit.size('atlas/fg-'+s.id)?Kit.img('atlas/fg-'+s.id,{cls:'hh-fig'}):''}</span>
 <div class="pf-card"><p class="kick">Your cosmic identity</p><h2>${esc(S.name||S.fullName||'Traveller')}</h2><p class="pf-sign"><span class="glyph" aria-hidden="true">${s.g}</span> ${s.name} <span class="muted">${SHORT_DATES(s)}</span></p><p class="keys">${keys(SIGN_KEYS[s.id])}</p><p class="pf-meta">${s.el} · ${s.mod||''}${s.mod?' · ':''}ruled by ${s.ruler}</p>${hasBirthDate()?`<p class="pf-meta">Born ${ymdLong(S.birth.date,{day:'numeric',month:'long',year:'numeric'})}${S.birth.place?' · '+esc(S.birth.place.split(',')[0]):''}</p>`:''}</div>`})}${acct}
 <div class="list">
 ${acc(glyphMed(s.id),'Your sign',s.name,`${signGrid('My sign',S.sign)}`)}
 ${acc(ui('ne-free','th'),'Display name',esc(S.name||'Not set'),`<div class="field"><label for="nm">Display name</label><input type="text" id="nm" value="${esc(S.name)}"></div><button class="btn sm" data-act="savename">Save</button>`)}
 ${lrow(ui('ex-chart','th round'),'Birth information',hasBirthDate()?ymdLong(S.birth.date,{day:'numeric',month:'long',year:'numeric'})+(S.birth.place?' · '+esc(S.birth.place):''):'Add your birth date, time and place','data-go="settings" data-t="birth"')}
 ${lrow(pic('cats','notifications','th'),'Notifications','Daily horoscope, Whispers and celestial events','data-go="settings" data-t="notifications"')}
 ${lrow(pic('cats','prefs','th'),'Display','Text size, motion, time zone and voice','data-go="settings" data-t="display"')}
 ${lrow(pic('cats','privacy','th'),'Privacy & Data','Consent, download and deletion','data-go="settings" data-t="privacy"')}
 ${lrow(pic('cats','collection','th'),'Subscription','Kosmia · Early Access','data-go="settings" data-t="subscription"')}
 ${C.user?acc(ui('t-history','th'),'Password','Change your password',`<div class="field"><label for="npw">New password</label><input id="npw" type="password" autocomplete="new-password" minlength="8"></div><button class="btn sm" data-act="setpw">Change password</button>`):''}
 </div><button class="btn ghost" data-act="signout">Sign out${C.user?'':' and clear this device'}</button></div>`;
};
/* ----- the profile's own pages: notifications, privacy and display ----- */
function settingsPage(t){
 const n=S.notif,st=S.settings;
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
}
/* ---------- render + events ---------- */
const onboarding=()=>['welcome','join','reset'].includes(V.sec);
function render(){
 const app=$('#app'),sec=V.sec,authed=!!S.sign&&!onboarding();
 const html=(views[sec]||views.home)();
 // the notebook stays where it was on the screen while its pages turn (swapping the page in would scroll to the top)
 const keep=sec==='tarot'&&tab()==='notebook'?scrollY:null;
 app.innerHTML=html;
 jxRender();document.querySelectorAll('.jpage .jp-front').forEach(jlay);if(keep!=null&&scrollY!==keep)window.scrollTo(0,keep);
 if(V.jfresh){V.jfresh=false;requestAnimationFrame(()=>{const b=$('#app .jbook');if(b)window.scrollTo(0,Math.max(0,b.getBoundingClientRect().top+scrollY-8))})}
 document.querySelectorAll('textarea.je').forEach(grow);
 $('#nav').hidden=!authed;document.body.classList.toggle('has-nav',authed);
 if(authed)$('#navin').innerHTML=Kit.nav(MAIN.map(k=>({key:k,label:SECTIONS[k].label})),sec);
 document.body.classList.toggle('onboarding',!authed);
 document.body.dataset.sec=sec;
 document.body.classList.toggle('reduce',!!S.settings.reduce);document.body.classList.toggle('large',!!S.settings.large);
 navH();
 document.title=authed&&SECTIONS[sec]?(sec==='home'?'Kosmia':`${tabLabel(sec,tab())} · Kosmia`):'Kosmia';
 if(onboarding())bindJoin();
 if(authed&&SECTIONS[sec])syncUrl();
 drift();
}
// the page keeps room for the bottom bar, whatever its height on this phone
const navH=()=>{const n=$('#nav');document.documentElement.style.setProperty('--navh',(n.hidden?0:n.offsetHeight)+'px')};
addEventListener('resize',navH);
// living details: a hero's picture drifts more slowly than the page (parallax), and Home's header folds into a slim bar
let driftF=0;
function drift(){
 const y=scrollY;document.body.classList.toggle('scrolled',y>120);
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
 if(i>=0){S.bookmarks.splice(i,1);C.deleteBookmark&&C.deleteBookmark(kind,ref);toast('Removed from your journal')}
 else{const b={id:uuid(),kind,ref,data,at:new Date().toISOString()};S.bookmarks.push(b);C.saveBookmark&&C.saveBookmark(b).then(()=>{b.sy=true;save()});toast('Saved to your journal')}
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
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-go],[data-nav],[data-act],[data-sign],[data-sign2],[data-period],[data-pick],[data-planet],[data-calview],[data-ctab],[data-ins]');
 if(!t)return;
 if(t.dataset.go)return go(t.dataset.go,t.dataset.t||null);
 if(t.dataset.nav)return go(t.dataset.nav);
 if(t.dataset.period&&!t.dataset.act){V.period=t.dataset.period;return render()}
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
 if(a==='back')return goBack();
 if(a==='chartopen'){V.chartOpen=true;V.chartInterp=t.dataset.k==='interp';V.chartTab=V.chartInterp?'chart':t.dataset.k;render();return window.scrollTo(0,0)}
 if(a==='reveal')return reveal();
 // onboarding
 if(a==='obnext'||a==='obstep'){const to=t.dataset.to;
  if(to==='account'||to==='signin'){const em=$('#em');if(em)S.email=em.value.trim()}
  V.ob=to;render();return window.scrollTo(0,0)}
 if(a==='enter')return enterApp();
 if(a==='pweye'){const i=$('#'+t.dataset.for);if(i){i.type=i.type==='password'?'text':'password';t.setAttribute('aria-label',i.type==='password'?'Show password':'Hide password')}return}
 if(a==='resend'){if(C.resend)C.resend(S.email).then(()=>toast('A new link is on its way.'),x=>toast(authMsg(x)));return}
 // Kassandra
 if(a==='kasmic')return voiceRec('kas');
 if(a==='kasask'){V.tpop=null;V.kasFrom={sec:V.sec,t:tab()};if(V.sec!=='kassandra')go('kassandra','chat');return kasSend(t.dataset.q)}
 if(a==='kasnew')return kasNew();
 if(a==='kasdel'){const i=S.bookmarks.findIndex(b=>b.id===t.dataset.id);if(i>=0){const b=S.bookmarks[i];S.bookmarks.splice(i,1);save();C.deleteBookmark&&C.deleteBookmark('chat',b.ref)}return render()}
 // horoscope
 if(a==='tohoroscope'){V.exploreSign=t.dataset.sign&&t.dataset.sign!==S.sign?t.dataset.sign:null;V.hcat=t.dataset.cat||'overview';if(t.dataset.period)V.period=t.dataset.period;else if(V.sec!=='horoscope')V.period='daily';return go('horoscope','sign')}
 if(a==='hcat'){V.hcat=t.dataset.k;render();return window.scrollTo(0,0)}
 if(a==='hspeak'){const ex=V.exploreSign||S.sign;return speakText(horoscope(ex,V.hcat,V.period).body)}
 if(a==='hreflect'){const [sign,cat,period,key]=t.dataset.ref.split('/');return openEntry(ensureBook('horoscope',t.dataset.ref,horoData(sign,cat,period,key)))}
 if(a==='bookhoro'){const [sign,cat,period,key]=t.dataset.ref.split('/');return bookmark('horoscope',t.dataset.ref,horoData(sign,cat,period,key))}
 if(a==='setsign'){S.sign=t.dataset.sign;V.exploreSign=null;save();syncProfile();toast('Your sign is now '+sg(S.sign).name);return render()}
 // whispers and tarot
 if(a==='whelp'){V.whelp=!V.whelp;return render()}
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
 if(a==='ne'){const k=t.dataset.k,today=dkey();V.sheet=null;
  if(k==='card'){if(!S.revealed[today]){toast('Reveal today’s Whisper first');return go('tarot','whisper')}return openEntry('fortune:'+today)}
  if(k==='reading'){if(!S.readings.length)return go('tarot','reading');V.sheet='reading';return render()}
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
 if(a==='jcalm'){V.jcal={month:t.dataset.k,day:''};return render()}
 if(a==='jcald'){V.jcal.day=t.dataset.k;return render()}
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
 if(a==='lpgo'){const d=($('#lpd')||{}).value;if(!/^\d{4}-\d\d-\d\d$/.test(d||''))return toast('Add your date of birth');V.lpDate=d;if(!hasBirthDate()){S.birth.date=d;save();syncProfile()}return render()}
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
 if(a==='placepick'){const P=V.places[t.dataset.id],r=P.results[+t.dataset.i],obj=t.dataset.id==='syn'?V.syn:V.birthDraft;
  if(t.dataset.id==='syn')readSyn();else readBirth();
  Object.assign(obj,{place:[r.name,r.admin1,r.country].filter(Boolean).join(', '),lat:r.latitude,lon:r.longitude,tz:r.timezone});V.places[t.dataset.id]={};return render()}
 if(a==='savebirth'){readBirth();const b=V.birthDraft;if(!b.date)return toast('Add your date of birth');
  if(b.name!=null)S.fullName=b.name.trim();S.birth=Object.assign({},b,{time:b.unk?'':b.time});delete S.birth.name;S.birthConsent=$('#bcons').checked;V.birthDraft=null;save();syncProfile();toast(S.birthConsent?'Saved to your account':'Saved on this device');return render()}
 if(a==='savenames'){S.fullName=$('#fn').value.trim();const an=$('#an'),ym=$('#ym');if(an)S.altName=an.value.trim();if(ym)S.settings.yMode=ym.value;save();syncProfile();if(!N.clean(S.fullName))toast('Enter your full name');return render()}
 // profile and account
 if(a==='savename'){S.name=$('#nm').value.trim();save();syncProfile();toast('Saved');return render()}
 if(a==='signout'){Promise.resolve(C.user&&C.signOut()).catch(()=>{});return signOutLocal()}
 if(a==='export')return exportData();
 if(a==='delbirth'){if(!confirm('Delete your birth details from this device and your account?'))return;S.birth=fresh().birth;S.birthConsent=false;V.birthDraft=null;save();syncProfile();toast('Birth details deleted');return render()}
 if(a==='askdel'){V.confirmDel=true;return render()}
 if(a==='canceldel'){V.confirmDel=false;return render()}
 if(a==='delacct'){if(($('#delc').value||'').trim()!=='DELETE')return toast('Type DELETE to confirm');t.disabled=true;
  C.deleteAccount().then(()=>{V.confirmDel=false;signOutLocal();toast('Your account has been deleted')},x=>{t.disabled=false;toast(/function|does not exist|schema/i.test(x.message||'')?'Account deletion is not available yet. Please try again later.':(x.message||'Could not delete the account'))});return}
 if(a==='toauth'){V.joinSign=S.sign;V.ob=S.email?'signin':'account';V.sec='welcome';render();return window.scrollTo(0,0)}
 if(a==='forgot'){const em=$('#em'),email=em?em.value.trim():'';
  if(!/^\S+@\S+\.\S+$/.test(email)){toast('Enter your email first');if(em)em.focus();return}
  C.resetPassword(email).then(()=>toast('If an account exists for that email, a reset link is on its way.'),x=>toast(authMsg(x)));return}
 if(a==='setpw'){const v=$('#npw').value;if(v.length<8)return toast('Use at least 8 characters');
  t.disabled=true;C.updatePassword(v).then(()=>{toast('Password updated');if(V.sec==='reset')go('home','today',{replace:true});else{t.disabled=false;$('#npw').value=''}},x=>{t.disabled=false;toast(authMsg(x))});return}
 const T=V.tarot;
 if(a==='tspread'){T.q=($('#q')||{value:T.q}).value;T.spread=t.dataset.k;return render()}
 if(a==='shuffle'){T.q=($('#q')||{value:T.q}).value.trim();T.deck=shuffle(DECK);T.picks=[];T.stage='pick';T.ai='';T.aiState='';render();return window.scrollTo(0,0)}
 if(a==='tflip'){const c=T.drawn[+t.dataset.k];if(!c.shown){c.shown=true;render();if(T.drawn.every(x=>x.shown))setTimeout(interpret,1200);return}V.tpop=+t.dataset.k;V.tctx=SPREAD_CTX[T.spread]||'love';return render()}
 if(a==='tpopclose'){if(e.target.closest('.pop-box')&&!e.target.closest('.pop-x'))return;V.tpop=null;return render()}
 if(a==='saveread'){const r={id:uuid(),spread:T.spread,q:T.q,date:dkey(),at:new Date().toISOString(),note:'',cards:T.drawn.map(c=>({id:c.id,pos:c.pos,name:c.name,rev:c.rv}))};
  S.readings.push(r);T.savedId=r.id;save();C.saveReading&&C.saveReading(r).then(id=>{if(id){r.rid=id;r.id=id;r.sy=true;T.savedId=id;save()}});toast('Saved to your journal');return render()}
 if(a==='tctx'){V.tctx=t.dataset.k;return render()}
 if(a==='newread'){T.stage='setup';T.q='';T.ai='';T.aiState='';T.savedId=null;V.tpop=null;render();return window.scrollTo(0,0)}
});
function readSyn(){const Y=V.syn,g=id=>$('#'+id);if(g('sn'))Y.name=g('sn').value.trim();if(g('sd'))Y.date=g('sd').value;if(g('su'))Y.unk=g('su').checked;if(g('st'))Y.time=g('st').value}
function readBirth(){const b=V.birthDraft||(V.birthDraft=Object.assign({},S.birth)),g=id=>$('#'+id);if(g('bn'))b.name=g('bn').value;if(g('bd'))b.date=g('bd').value;if(g('bu'))b.unk=g('bu').checked;if(g('bt'))b.time=g('bt').value}
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
 if(e.key==='Escape'&&V.jx){V.jx=false;return render()}
 if(e.key==='Escape'&&V.sheet){V.sheet=null;return render()}
 if(e.key==='Escape'&&V.tpop!=null){V.tpop=null;return render()}
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('.scene[data-act],[data-planet]')){e.preventDefault();tap(e.target)}
 if(e.key==='Enter'&&e.target.matches('input[id$="-q"]')){e.preventDefault();placeSearch(e.target.id.slice(0,-2))}
});
document.addEventListener('change',e=>{
 const i=e.target,id=i.id;
 if(i.dataset.act==='jint'){S.intent=S.intent||{};const a=S.intent[V.jkey]||[];a[+i.dataset.i]=i.checked;S.intent[V.jkey]=a;save();return}
 if(id==='obd'){const s=signFromDate(i.value);if(s){V.joinSign=s;V.bdayOpen=true;render()}return}
 if(id==='za'||id==='zb'){V.love[id==='za'?'a':'b']=i.value;V.love.done=false;return render()}
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
if(S.sign&&(!C.enabled||C.hasStoredSession())){applyLocation()}else V.sec='welcome';
render();
C.onError(()=>toast('Could not sync. Your changes are kept on this device.'));
C.onAuth(u=>{if(u)pullMerge();else render()});
C.init().then(u=>{
 if(u){if(C.recovering){V.sec='reset';render()}return pullMerge()}
 if(C.enabled&&!onboarding()){V.sec='welcome';render()}
}).catch(e=>console.error(e));
})();
