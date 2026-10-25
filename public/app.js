(function(){
'use strict';
const A = window.Astronomy;
const C = window.KosmiaCloud||{enabled:false,user:null,onAuth(){},onError(){},init:async()=>null,saveProfile(){},saveFortune(){},saveMatch(){},saveReading:async()=>null,paint:async()=>{throw new Error('offline')},speak:async()=>{throw new Error('offline')},paintingUrl:async()=>null,hasStoredSession:()=>false,recovering:false};
const $ = (s,r=document)=>r.querySelector(s);
const esc = s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* crafted art from scripts/craft-images.mjs; falls back to the SVG symbols when absent */
const ART=window.KOSMIA_ART||{};
const pic=(kind,id,cls='art')=>(ART[kind]||[]).includes(id)?`<img class="${cls}" src="/art/${kind}/${id}.webp" alt="" loading="lazy">`:'';
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

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

/* the 55 whispers (daily cards) live in whispers.js, shared with the server */
const ORACLE=(window.KOSMIA_WHISPERS||[]).map(a=>({id:a[0],title:a[1],sym:a[2],msg:a[3],ref:a[4]}));
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
let S={email:'',sign:'',name:'',revealed:{},saved:[],notes:{},matches:[],readings:[],notif:{on:false,time:'08:00',monthly:true,annual:true,events:false,sign2:''},intro:false};
try{const r=localStorage.getItem(KEY);if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const fresh=()=>({email:'',sign:'',name:'',revealed:{},saved:[],notes:{},matches:[],readings:[],notif:{on:false,time:'08:00',monthly:true,annual:true,events:false,sign2:''},intro:false});

/* ---------- cloud sync (Supabase) ---------- */
const syncProfile=()=>C.saveProfile({sign:S.sign,name:S.name,intro:S.intro,notif:S.notif});
const syncFortune=k=>C.saveFortune(k,cardFor(k).id,S.saved.some(x=>x.date===k),S.notes[k]||'');
async function pullMerge(){
 const u=C.user;if(!u)return;
 let R;try{R=await C.pull()}catch(e){return toast('Could not load your synced data')}
 S.email=u.email||S.email;
 const p=R.profile;
 if(p&&p.sign){S.sign=p.sign;S.name=p.name||S.name;S.intro=S.intro||p.intro_seen;if(p.notif)S.notif=Object.assign(S.notif,p.notif)}
 else if(S.sign)syncProfile();
 const remoteDays=new Set();
 R.fortunes.forEach(f=>{remoteDays.add(f.day);S.revealed[f.day]=true;
  if(f.saved&&!S.saved.some(x=>x.date===f.day))S.saved.push({id:f.card_id,date:f.day});
  if(f.note&&!S.notes[f.day])S.notes[f.day]=f.note});
 S.saved.sort((a,b)=>a.date<b.date?-1:1);
 new Set([...Object.keys(S.revealed),...S.saved.map(x=>x.date),...Object.keys(S.notes)]).forEach(k=>{if(!remoteDays.has(k))syncFortune(k)});
 R.matches.forEach(m=>{if(!S.matches.some(x=>x[0]===m.sign_a&&x[1]===m.sign_b))S.matches.push([m.sign_a,m.sign_b])});
 S.matches.forEach(m=>{if(!R.matches.some(x=>x.sign_a===m[0]&&x.sign_b===m[1]))C.saveMatch(m[0],m[1])});
 const ids=new Set(R.readings.map(r=>r.id));
 const local=S.readings.filter(r=>!r.rid||!ids.has(r.rid));
 S.readings=R.readings.map(r=>({rid:r.id,spread:r.spread,q:r.question,date:r.day,cards:r.cards})).concat(local);
 local.forEach(r=>{if(!r.rid)C.saveReading(r).then(id=>{if(id){r.rid=id;save()}})});
 save();
 if(S.sign&&(V.sec==='welcome'||V.sec==='join'))V.sec='home';
 render();
}

/* ---------- time helpers ---------- */
const dkey=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const long=d=>new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d);
const evt=d=>new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d);
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
const cardFor=k=>{const s=S.saved.find(x=>x.date===k),o=s&&ORACLE.find(c=>c.id===s.id);return o||ORACLE[hash((S.email||'guest').toLowerCase()+':'+k)%ORACLE.length]};
const todayCard=()=>cardFor(dkey());

/* ---------- astronomy ---------- */
const SYM_PLANETS=[['Sun','☉︎'],['Moon','☽︎'],['Mercury','☿︎'],['Venus','♀︎'],['Mars','♂︎'],['Jupiter','♃︎'],['Saturn','♄︎'],['Uranus','♅︎'],['Neptune','♆︎'],['Pluto','♇︎']];
function moonInfo(d){
 const ang=A.MoonPhase(d), ill=A.Illumination(A.Body.Moon,d).phase_fraction;
 const n=[[22.5,'New Moon'],[67.5,'Waxing Crescent'],[112.5,'First Quarter'],[157.5,'Waxing Gibbous'],[202.5,'Full Moon'],[247.5,'Waning Gibbous'],[292.5,'Last Quarter'],[337.5,'Waning Crescent'],[360.1,'New Moon']];
 return {name:n.find(x=>ang<x[0])[1],ill,waxing:ang<180,ang};
}
const signAt=l=>SIGNS[Math.floor(((l%360)+360)%360/30)];
const sunSign=d=>signAt(A.SunPosition(d).elon);
function lonOf(name,d){
 if(name==='Sun')return A.SunPosition(d).elon;
 const T=(d.getUTCFullYear()+ (d.getUTCMonth()+0.5)/12 -2000)/100, prec=1.3969713*T; /* J2000 -> ecliptic of date */
 if(name==='Moon')return (A.EclipticGeoMoon(d).lon+prec+360)%360;
 return (A.Ecliptic(A.GeoVector(A.Body[name],d,true)).elon+prec+360)%360;
}
const MT={
 new_moon:['The Moon sits between Earth and the Sun, so its lit side faces away from us.','Traditionally a time for beginnings and quiet intention-setting.','What would I like to begin, or begin again?'],
 first_quarter:['The Moon is a quarter of the way around its orbit, with half its face lit.','Traditionally linked with action, decision and momentum.','Where am I ready to commit a little more energy?'],
 full_moon:['Earth lies between the Sun and Moon, so the Moon’s face is fully lit.','Traditionally a time of culmination, clarity and gratitude.','What has grown in my life that I am grateful for?'],
 last_quarter:['The Moon is three-quarters through its orbit, with the opposite half lit.','Traditionally a time for release, forgiveness and clearing space.','What am I ready to put down?'],
 equinox:['The Sun crosses the celestial equator, giving near-equal day and night.','Traditionally a moment of balance and turning points.','Where in my life do I want more balance?'],
 solstice:['The Sun reaches its greatest angle from the celestial equator.','Traditionally a threshold of light and rest, depending on the season.','What does this turning of the year ask of me?'],
 lunar_eclipse:['Earth’s shadow falls across the Moon.','Traditionally seen as a moment of endings and revelation.','What is coming into view that I had not noticed?'],
 solar_eclipse:['The Moon passes in front of the Sun, shadowing part of Earth.','Traditionally seen as a powerful new-beginning moment.','What fresh chapter do I want to write?']
};
const QN=['new_moon','first_quarter','full_moon','last_quarter'], QL=['New Moon','First Quarter Moon','Full Moon','Last Quarter Moon'];
function events(from,days){
 const end=from.getTime()+days*864e5, out=[];
 const add=(k,name,date)=>out.push({k,name,date,a:MT[k][0],s:MT[k][1],r:MT[k][2]});
 let q=A.SearchMoonQuarter(from);
 while(q.time.date.getTime()<=end){add(QN[q.quarter],QL[q.quarter],q.time.date);q=A.NextMoonQuarter(q)}
 [from.getUTCFullYear(),from.getUTCFullYear()+1].forEach(y=>{const s=A.Seasons(y);
  [[s.mar_equinox,'equinox','March Equinox'],[s.jun_solstice,'solstice','June Solstice'],[s.sep_equinox,'equinox','September Equinox'],[s.dec_solstice,'solstice','December Solstice']]
  .forEach(([t,k,n])=>{const d=t.date;if(d>=from&&d.getTime()<=end)add(k,n,d)})});
 try{let le=A.SearchLunarEclipse(from);while(le.peak.date.getTime()<=end){if(le.kind!=='penumbral')add('lunar_eclipse',cap(le.kind)+' Lunar Eclipse',le.peak.date);le=A.NextLunarEclipse(le.peak)}}catch(e){}
 try{let se=A.SearchGlobalSolarEclipse(from);while(se.peak.date.getTime()<=end){add('solar_eclipse',cap(se.kind)+' Solar Eclipse',se.peak.date);se=A.NextGlobalSolarEclipse(se.peak)}}catch(e){}
 return out.sort((a,b)=>a.date-b.date);
}
const cap=s=>s[0].toUpperCase()+s.slice(1);
const moonRef=m=>m.name==='New Moon'?'A moment traditionally associated with beginnings. Consider what you would like to plant.':m.name==='Full Moon'?'A moment traditionally associated with fullness and gratitude. Notice what has grown.':m.waxing?'A moment traditionally associated with growth and intention. Consider what you would like to nurture in your life.':'A moment traditionally associated with release. Consider what you are ready to let go of.';

/* ---------- sample horoscope text (clearly labelled) ---------- */
const THEME={Fire:['momentum','courage','a spark worth following'],Earth:['steadiness','patience','what you are quietly building'],Air:['conversation','perspective','the ideas you keep circling'],Water:['feeling','intuition','what your heart keeps returning to']};
const CATS={general:'Overview',career:'Career',finance:'Finance',love:'Love',health:'Health'};
const STEM={
 general:['The day leans toward {t1}. Notice {t3} and give it a little room.','A gentle pull toward {t2} runs through today. Small choices carry more weight than they seem to.','Today favours reflection on {t3}. You do not have to resolve it, only look at it honestly.'],
 career:['At work, {t1} is your quiet advantage. Say one clear thing you have been holding back.','Progress comes through {t2}. Pick the task that matters and give it your first good hour.','Colleagues may respond well to your {t1}. Ask a question before offering an answer.'],
 finance:['A calm look at your habits serves you better than a bold move. Review one recurring cost with {t2}.','Money questions benefit from {t1} today. Write down what you value before you decide what to spend.','This is reflection, not financial advice: consider where {t3} meets your budget.'],
 love:['In close relationships, {t1} opens doors. Listen for what is underneath the words.','Be honest about what you need, with {t2} rather than urgency.','Self-love starts small today: give {t3} the same kindness you would offer a friend.'],
 health:['Rest and rhythm matter more than effort. Let {t1} guide when you slow down.','Notice how your body responds to stress, and meet it with {t2}. This is not medical advice.','A short walk, water and an earlier night support {t3}.']
};
function horoscope(signId,period,cat){
 const s=sg(signId), th=THEME[s.el], key=period==='daily'?dkey():period==='monthly'?dkey().slice(0,7):dkey().slice(0,4);
 const pick=a=>a[hash(signId+cat+period+key)%a.length];
 const fill=t=>t.replace('{t1}',th[0]).replace('{t2}',th[1]).replace('{t3}',th[2]);
 let body=fill(pick(STEM[cat]));
 if(period==='monthly')body+=' Across the month, expect '+th[0]+' to return in different forms. Keep one practice that steadies you, and close the month with a short note to yourself.';
 if(period==='annual')body+=' Over the year, the larger arc is about '+th[1]+'. Expect seasons of effort and seasons of rest, and treat both as part of the same story.';
 return {body,theme:cap(th[0]),key,ref:'What would '+th[1]+' look like in practice today?'};
}

/* ---------- love match ---------- */
const REL={'Fire-Fire':82,'Earth-Earth':80,'Air-Air':78,'Water-Water':84,'Fire-Air':88,'Earth-Water':86,'Fire-Earth':62,'Air-Water':60,'Fire-Water':50,'Air-Earth':52};
function match(a,b){
 const A1=sg(a),B1=sg(b),k=[A1.el,B1.el].sort().join('-'),k2=REL[k]||REL[B1.el+'-'+A1.el]||60;
 const base=(REL[A1.el+'-'+B1.el]||REL[B1.el+'-'+A1.el]||k2)+(A1.mod===B1.mod?-3:2);
 const off=(c)=>((hash(a+'>'+b+c)%11)-5);
 const clamp=n=>Math.max(35,Math.min(97,n));
 const sc={Overall:clamp(base+off('o')),Emotional:clamp(base+off('e')),Communication:clamp(base+off('c')),Romance:clamp(base+off('r')),Trust:clamp(base+off('t')),'Long-term':clamp(base+off('l'))};
 const rel=(A1.el===B1.el)?'share the same element':(base>=75?'have complementary elements':base>=58?'meet across different elements':'meet across contrasting elements');
 return {sc,text:{
  strengths:`${A1.name} and ${B1.name} ${rel}, which traditionally gives you a shared vocabulary for ${THEME[A1.el][0]} and ${THEME[B1.el][0]}.`,
  challenges:A1.mod===B1.mod?`Two ${A1.mod.toLowerCase()} signs can mirror each other’s habits. Notice where you both dig in or both drift.`:`Different rhythms (${A1.mod.toLowerCase()} and ${B1.mod.toLowerCase()}) can feel like mismatched timing. Name the pace you each need.`,
  guidance:`Treat this as a conversation starter, not a verdict. Ask each other what ${THEME[B1.el][2]} means to you both.`}};
}

/* ---------- tarot ---------- */
const MAJ=[['The Fool','new beginnings, trust, a leap of faith','hesitation, recklessness'],['The Magician','skill, focus, resourcefulness','scattered effort, self-doubt'],['The High Priestess','intuition, inner knowing','ignored intuition, secrets'],['The Empress','nurture, abundance, creativity','creative block, neglected self-care'],['The Emperor','structure, stability, authority','rigidity, control'],['The Hierophant','tradition, learning, guidance','questioning convention'],['The Lovers','union, choices aligned with values','disharmony, misaligned choices'],['The Chariot','determination, direction','lack of direction, forcing things'],['Strength','courage, gentle resilience','self-doubt, depleted energy'],['The Hermit','solitude, inner guidance','isolation, withdrawal'],['Wheel of Fortune','cycles, change, turning points','resisting change, setbacks'],['Justice','fairness, truth, accountability','imbalance, avoiding responsibility'],['The Hanged Man','pause, a new perspective','stalling, resistance'],['Death','endings, transformation','clinging to the past'],['Temperance','balance, patience, moderation','excess, imbalance'],['The Devil','attachment, shadow, habit','release, reclaiming power'],['The Tower','sudden change, revelation','avoiding upheaval, fear of change'],['The Star','hope, renewal, calm','discouragement, lost faith'],['The Moon','dreams, uncertainty, intuition','clarity emerging, confusion lifting'],['The Sun','joy, vitality, openness','dimmed enthusiasm'],['Judgement','reflection, awakening, a calling','self-doubt, avoiding the call'],['The World','completion, wholeness','unfinished business, loose ends']];
const SUITS=[['Wands','passion, ambition and creative drive'],['Cups','emotion, relationships and intuition'],['Swords','thought, communication and truth'],['Pentacles','work, money and the body']];
const RANKS=[['Ace','a seed of new possibility'],['Two','choice and balance'],['Three','growth and collaboration'],['Four','stability and pause'],['Five','conflict and challenge'],['Six','harmony and movement'],['Seven','assessment and perseverance'],['Eight','focus and momentum'],['Nine','near-fulfilment'],['Ten','culmination and weight'],['Page','curiosity and messages'],['Knight','pursuit and momentum'],['Queen','mature nurturing'],['King','mastery and leadership']];
const SYMS=['star','sun','moon','flower','key','eye','wheel','lily','crystal','tree','path','ship'];
const DECK=[...MAJ.map((m,i)=>({id:'m'+i,name:m[0],up:m[1],rev:m[2],sym:SYMS[i%12]})),
 ...SUITS.flatMap((s,si)=>RANKS.map((r,ri)=>({id:'s'+si+'-'+ri,name:r[0]+' of '+s[0],up:r[1]+' in the realm of '+s[1],rev:r[1]+' blocked, delayed or turned inward ('+s[0].toLowerCase()+')',sym:SYMS[(si*3+ri)%12]})))];
const SPREADS={
 one:{n:'One Card — Cosmic Guidance',p:['Guidance']},
 ppf:{n:'Three Cards — Past, Present, Future',p:['Past','Present','Future']},
 scg:{n:'Three Cards — Situation, Challenge, Guidance',p:['Situation','Challenge','Guidance']},
 love:{n:'Love Reading',p:['You','Them','The connection','The challenge','The direction']},
 career:{n:'Career Reading',p:['Where you are','Your strengths','The obstacle','Action to take','Where it tends']},
 celtic:{n:'Celtic Cross',p:['The present','The challenge','The foundation','The past','The crown','The near future','Yourself','Your surroundings','Hopes and fears','The outcome']}
};
function shuffle(a){a=a.slice();const r=new Uint32Array(a.length);crypto.getRandomValues(r);for(let i=a.length-1;i>0;i--){const j=r[i]%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}

/* ---------- ui state ---------- */
const NAV=[['home','Home','☉︎'],['horoscopes','Horoscopes','♎︎'],['love','Love Match','♡'],['fortune','Whispers','✦'],['tarot','Tarot','☽︎'],['chart','Birth Chart','⊕'],['calendar','Cosmic Calendar','☾'],['universe','My Universe','✧']];
const FOOT={
 horoscopes:[['general','Overview'],['career','Career'],['finance','Finance'],['love','Love'],['health','Health']],
 love:[['match','Compatibility'],['saved','Saved Matches']],
 fortune:[['today','Today’s Whisper'],['collection','My Collection'],['reflections','Reflections']],
 tarot:[['new','New Reading'],['spreads','Spreads'],['history','History']],
 chart:[['chart','Chart'],['planets','Planets'],['aspects','Aspects']],
 calendar:[['upcoming','Upcoming'],['moon','Moon'],['planetary','Planetary']],
 universe:[['profile','Profile'],['prefs','Preferences'],['notifications','Notifications'],['settings','Settings']]
};
const V={sec:'welcome',tab:{},period:'daily',exploreSign:null,love:{a:'',b:'',done:false},tarot:{spread:'one',q:'',stage:'setup',picks:[],drawn:null,deck:null,flipped:0},chartSel:null,paint:{},painting:false,say:null,auth:'up',busy:false,birth:{date:'1990-06-15',time:'12:00',unk:false,off:0,lat:'',lon:''}};
const tab=()=>V.tab[V.sec]||(FOOT[V.sec]?FOOT[V.sec][0][0]:'');
function toast(t){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2400)}
const panel=(h,cls='')=>`<section class="panel ${cls}"><div class="in">${h}</div></section>`;
const signGrid=(name,sel)=>`<div class="signs" role="radiogroup" aria-label="${name}">${SIGNS.map(s=>`<button class="chip" role="radio" aria-checked="${sel===s.id}" data-sign="${s.id}"><span class="g glyph">${s.g}</span><span style="font-size:.78rem">${s.name}</span></button>`).join('')}</div>`;
const needLib=()=>A?'':panel('<h3>Astronomy library unavailable</h3><p>The ephemeris could not load, so astronomical data is not shown rather than guessed. Check your connection and reload.</p>');

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
views.home=()=>{
 const sign=sg(S.sign),now=new Date(),c=todayCard(),rev=!!S.revealed[dkey()];
 if(!A)return needLib();
 const m=moonInfo(now),ss=sunSign(now),h=horoscope(sign.id,'daily','general');
 return `<div class="stack">
 <p class="quote thought">“${THOUGHTS[Number(dkey().replace(/-/g,''))%THOUGHTS.length]}”</p>
 <section class="today">${pic('scenes',sign.id,'today-art')}<div class="today-in"><h2>${long(now)}</h2><p>${h.body}</p><button class="btn" data-act="tohoroscope">More</button></div></section>
 <section class="whisper"><h2>A Whisper From the Cosmos</h2>${cardScene(c,rev,'homeCard')}${rev?`<div class="row whisper-acts"><button class="btn ghost" data-act="savecard" ${S.saved.some(x=>x.date===dkey())?'disabled':''}>${S.saved.some(x=>x.date===dkey())?'Saved':'Save Whisper'}</button><button class="btn" data-act="toreflect">Your Reflection</button></div>`:`<button class="btn" data-act="reveal">Reveal My Whisper</button>`}</section>
 <div class="cosmos">${panel(`<h2>Cosmic Energy Today</h2><div class="label">Astronomy</div><p>The Moon is ${m.name.toLowerCase()}, about ${Math.round(m.ill*100)}% illuminated. The Sun is in ${ss.name}.</p><div class="rule"></div><div class="label">Astrological interpretation</div><p>${moonRef(m)}</p>`)}</div>
 </div>`;
};
function cardScene(c,flipped,id){
 const sp=Array.from({length:10},(_,i)=>`<i class="spark" style="left:${10+i*8}%;top:${30+(i%4)*14}%;--dx:${(i%2?1:-1)*(10+i*4)}px;--dy:${-30-i*6}px"></i>`).join('');
 return `<div class="scene ${flipped?'flipped':''}" id="${id}" role="button" tabindex="0" aria-label="${flipped?esc(c.title+'. '+c.msg):'Today’s whisper, face down. Press to reveal.'}" data-act="reveal"><div class="card3d"><div class="face back"></div><div class="face front daily">${whisperFace(c)}</div></div>${sp}</div>`;
}
// a whisper's face: its artwork (art/whispers) and the engraved plaque with title and message
const whisperFace=c=>`${pic('whispers',c.id,'day-art')||`<div class="ph">${symbol(c.sym)}</div>`}<div class="card-banner"><div class="cb-in"><div class="cb-title">${c.title}</div><p>${c.msg}</p></div></div>`;
/* ---------- AI: painted cards (OpenAI) and read-aloud (ElevenLabs), signed-in only ---------- */
const AUDIO=new Map();let player=null;
const plain=s=>String(s).replace(/<[^>]*>/g,'');
const listenBtn=text=>{if(!C.user)return '';const p=plain(text);return `<button class="btn ghost" data-act="listen" data-say="${esc(p)}" style="align-self:flex-start">${V.say===p?'■ Stop':'▶ Listen'}</button>`};
function stopAudio(){if(player){player.pause();player=null}V.say=null}
function paintPanel(c){
 const head='<div class="label">Your painted card</div>';
 if(!C.user)return C.enabled?panel(head+'<p class="muted">Sign in from Settings to have today’s card painted just for you.</p>'):'';
 const k=dkey(),p=V.paint[k];
 if(p===undefined){V.paint[k]='';C.paintingUrl(k).then(u=>{if(u){V.paint[k]=u;render()}}).catch(()=>{})}
 if(p)return panel(`${head}<img class="painting" src="${esc(p)}" alt="${esc(c.title)}, painted for ${sg(S.sign).name}">`);
 return panel(`${head}<p>Have today’s card painted just for you, in the spirit of ${sg(S.sign).name}.</p><button class="btn ghost" data-act="paint" ${V.painting?'disabled':''}>${V.painting?'Painting… this can take up to a minute':'Paint My Card'}</button>`);
}
views.horoscopes=()=>{
 const cat=tab(),ex=V.exploreSign||S.sign,s=sg(ex),h=horoscope(ex,V.period,cat);
 const head=V.period==='daily'?long(new Date()):V.period==='monthly'?new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric'}).format(new Date()):'The year '+new Date().getFullYear();
 return `<div class="stack"><h1>Horoscopes</h1>
 <div class="row sign-row" role="radiogroup" aria-label="Explore a sign">${SIGNS.map(x=>`<button class="chip" style="flex:0 0 auto" role="radio" aria-checked="${x.id===ex}" data-sign="${x.id}" aria-label="${x.name}">${pic('icons',x.id,'sign-ico')||`<span class="glyph">${x.g}</span>`}</button>`).join('')}</div>
 <div class="seg" role="tablist">${['daily','monthly','annual'].map(p=>`<button role="tab" aria-selected="${V.period===p}" data-period="${p}">${cap(p)}</button>`).join('')}</div>
 <section class="today${cat==='general'?'':' plain'}">${cat==='general'?pic('scenes',s.id,'today-art'):''}<div class="today-in"><div class="label">${CATS[cat]} · ${head}</div><p class="muted">${s.el} · ${s.mod} · ruled by ${s.ruler}</p><p>${h.body}</p><div class="label">Theme</div><p>${h.theme}</p>${cat==='finance'?'<p class="muted">Reflection only. This is not financial advice.</p>':''}${cat==='health'?'<p class="muted">Reflection only. This is not medical advice.</p>':''}${ex!==S.sign?`<button class="btn ghost" data-act="setsign" data-sign="${ex}">Set as My Sign</button>`:''}</div></section></div>`;
};
views.love=()=>{
 const a=V.love.a||S.sign,b=V.love.b;
 if(tab()==='saved')return `<div class="stack"><h1>Saved Matches</h1>${S.matches.length?S.matches.map(m=>{const r=match(m[0],m[1]);return panel(`<h3><span class="glyph">${sg(m[0]).g}</span> ${sg(m[0]).name} + ${sg(m[1]).name} <span class="glyph">${sg(m[1]).g}</span></h3><p class="muted">Symbolic score ${r.sc.Overall}%</p><button class="btn ghost" data-act="openmatch" data-a="${m[0]}" data-b="${m[1]}">View</button>`)}).join(''):panel('<h3>No matches saved yet</h3><p>Compare two signs, then save the pairing to find it here.</p>')}</div>`;
 let res='';
 if(V.love.done&&a&&b){const r=match(a,b),saved=S.matches.some(m=>m[0]===a&&m[1]===b);
  res=panel(`<div class="row" style="justify-content:center;gap:14px"><span class="glyph" style="font-size:2.2rem">${sg(a).g}</span><svg width="80" height="30" viewBox="0 0 80 30" aria-hidden="true"><path d="M2 15C20 2 30 28 40 15S62 2 78 15" fill="none" stroke="#D8B98A" stroke-width="1.2"/><circle cx="40" cy="15" r="3" fill="#D8B98A"/></svg><span class="glyph" style="font-size:2.2rem">${sg(b).g}</span></div><div style="text-align:center"><div class="score">${r.sc.Overall}%</div><p class="muted">Symbolic score, for entertainment. Not a measured probability.</p></div>${Object.entries(r.sc).filter(x=>x[0]!=='Overall').map(([k,v])=>`<div><div class="row" style="justify-content:space-between"><span>${k}</span><span class="muted">${v}%</span></div><div class="bar"><i style="width:${v}%"></i></div></div>`).join('')}<div class="label">Strengths</div><p>${r.text.strengths}</p><div class="label">Potential challenges</div><p>${r.text.challenges}</p><div class="label">Guidance</div><p>${r.text.guidance}</p><button class="btn ghost" data-act="savematch">${saved?'Saved':'Save this match'}</button>`);}
 return `<div class="stack"><h1>Love Match</h1><div class="label">Your sign</div>${signGrid('Your sign',a)}<div class="label">Their sign</div><div class="signs" role="radiogroup" aria-label="Their sign">${SIGNS.map(s=>`<button class="chip" role="radio" aria-checked="${b===s.id}" data-sign2="${s.id}"><span class="g glyph">${s.g}</span><span style="font-size:.78rem">${s.name}</span></button>`).join('')}</div><button class="btn" data-act="domatch" ${b?'':'disabled'}>Discover Our Cosmic Connection</button>${res}</div>`;
};
views.fortune=()=>{
 const c=todayCard(),rev=!!S.revealed[dkey()],t=tab();
 if(t==='collection')return `<div class="stack"><h1>My Collection</h1>${S.saved.length?S.saved.slice().reverse().map(x=>{const o=ORACLE.find(c=>c.id===x.id);if(!o)return '';const n=S.notes[x.date];
  return `<article class="kept"><div class="label">${long(new Date(x.date+'T12:00:00'))}</div><div class="scene flat" role="img" aria-label="${esc(o.title+'. '+o.msg)}"><div class="face front daily">${whisperFace(o)}</div></div>${n?`<div class="kept-note"><p class="muted">${o.ref}</p><div class="label">Your reflection</div><p class="quote">“${esc(n)}”</p></div>`:''}</article>`}).join(''):panel('<h3>No cards saved yet</h3><p>Your cosmic collection begins with today’s whisper.</p>')}</div>`;
 if(t==='reflections')return `<div class="stack"><h1>Reflections</h1>${rev?panel(`<div class="label">Today’s whisper · ${c.title}</div><p class="quote reflect-msg">“${c.msg}”</p><div class="rule"></div><div class="label">Sit with it</div><p class="reflect-q">${c.ref}</p><label class="label" for="note">Your reflection</label><textarea id="note" placeholder="Take your time. Write whatever rises.">${esc(S.notes[dkey()]||'')}</textarea><button class="btn" data-act="savenote">Save reflection</button><p class="muted">${C.user?'Synced to your account and private to you.':'Stored in this browser. Sign in from Settings to keep it private in your account.'}</p>`):panel('<h3>Reveal today’s card first</h3><p>Your reflection space opens once you have received today’s message.</p>')}</div>`;
 const sv=S.saved.some(x=>x.date===dkey());
 return `<div class="stack" style="align-items:stretch"><h1 style="text-align:center">Whispers</h1><p class="quote" style="text-align:center">The universe has a message waiting for you.</p>${cardScene(c,rev,'fortuneCard')}${rev?panel(`${listenBtn(c.title+'. '+c.msg)}<button class="btn" data-act="toreflect">Your Reflection</button><button class="btn ghost" data-act="savecard" ${sv?'disabled':''}>${sv?'Saved to My Collection':'Save Whisper'}</button>`)+paintPanel(c):`<button class="btn" data-act="reveal" style="align-self:center">Reveal My Card</button>`}<p class="muted" style="text-align:center">One card per day. It stays the same until your local date changes.</p></div>`;
};
views.tarot=()=>{
 const t=tab(),T=V.tarot;
 if(t==='spreads')return `<div class="stack"><h1>Spreads</h1>${Object.entries(SPREADS).map(([k,s])=>panel(`<h3>${s.n}</h3><p class="muted">${s.p.join(' · ')}</p><button class="btn ghost" data-act="usespread" data-k="${k}">Use this spread</button>`)).join('')}</div>`;
 if(t==='history')return `<div class="stack"><h1>Reading History</h1>${S.readings.length?S.readings.map(r=>panel(`<h3>${esc(SPREADS[r.spread].n)}</h3><p class="muted">${r.date}${r.q?' · “'+esc(r.q)+'”':''}</p>${r.cards.map(c=>`<p>${esc(c.pos)}: ${esc(c.name)}${c.rev?' (reversed)':''}</p>`).join('')}`)).join(''):panel('<h3>Your reading history is waiting for its first story</h3><p>Complete a reading and save it to find it here.</p>')}</div>`;
 const sp=SPREADS[T.spread];
 if(T.stage==='setup')return `<div class="stack"><h1>Ask the Universe</h1><p class="quote">Hold your question in your mind. Let the cards guide your reflection.</p><div class="field"><label for="q">Your question (optional)</label><input type="text" id="q" value="${esc(T.q)}" placeholder="What should I focus on?"></div><div class="field"><label for="sp">Reading type</label><select id="sp">${Object.entries(SPREADS).map(([k,s])=>`<option value="${k}" ${k===T.spread?'selected':''}>${s.n}</option>`).join('')}</select></div><button class="btn" data-act="shuffle">Shuffle the cards</button></div>`;
 if(T.stage==='pick')return `<div class="stack"><h1>Choose ${sp.p.length} card${sp.p.length>1?'s':''}</h1><p class="muted">${T.picks.length} of ${sp.p.length} chosen</p><div class="grid5">${T.deck.slice(0,20).map((c,i)=>`<button class="mini" aria-label="Card ${i+1}" aria-pressed="${T.picks.includes(i)}" data-pick="${i}"></button>`).join('')}</div><button class="btn" data-act="reveal-reading" ${T.picks.length===sp.p.length?'':'disabled'}>Turn the cards</button></div>`;
 const cards=T.drawn,flipped=T.flipped;
 return `<div class="stack"><h1>${sp.n}</h1>${T.q?`<p class="quote">“${esc(T.q)}”</p>`:''}${cards.map((c,i)=>`<div class="rd"><div class="scene ${i<flipped?'flipped':''} ${c.rev?'rev':''}"><div class="card3d"><div class="face back"></div><div class="face front"><div class="ct">${c.name.split(' of ')[0]}</div>${pic('tarot',c.id)||symbol(c.sym)}</div></div></div><div><div class="label">${c.pos}</div><h3>${c.name}${c.rev?' · reversed':''}</h3>${i<flipped?`<p class="muted">${c.rev?c.revm:c.upm}</p>`:''}</div></div>`).join('')}
 ${flipped<cards.length?`<button class="btn" data-act="flipnext">Turn next card</button>`:panel(`<h3>Interpretation</h3>${cards.map(c=>`<p><strong>${c.pos}.</strong> ${c.name}${c.rev?' reversed':''} points to ${c.rev?c.revm:c.upm}.</p>`).join('')}<p class="quote" style="font-size:1.1rem">${T.q?'Held against your question, notice which of these themes you already recognise in your own life, and which you resist.':'Notice which of these themes you already recognise in your own life, and which you resist.'} These are symbols for reflection, not predictions.</p><p class="note">Preview interpretation, assembled from traditional meanings. The app sends your question and cards to an AI service for a personal reading.</p><div class="row"><button class="btn" data-act="saveread">Save reading</button><button class="btn ghost" data-act="newread">New reading</button></div>`)}</div>`;
};
function birthCalc(){
 const b=V.birth,[y,mo,d]=b.date.split('-').map(Number),[h,mi]=(b.unk?'12:00':b.time).split(':').map(Number);
 const date=new Date(Date.UTC(y,mo-1,d,h-Number(b.off||0),mi));
 const pl=SYM_PLANETS.map(([n,g])=>({n,g,lon:lonOf(n,date)}));
 let asc=null;
 if(!b.unk&&b.lat!==''&&b.lon!==''){
  const lat=Number(b.lat)*Math.PI/180,eps=23.4393*Math.PI/180,ramc=((A.SiderealTime(date)*15+Number(b.lon))%360)*Math.PI/180;
  asc=((Math.atan2(Math.cos(ramc),-(Math.sin(ramc)*Math.cos(eps)+Math.tan(lat)*Math.sin(eps)))*180/Math.PI)+360)%360;
 }
 const AS=[[0,'conjunction',8],[60,'sextile',4],[90,'square',6],[120,'trine',6],[180,'opposition',8]],asp=[];
 for(let i=0;i<pl.length;i++)for(let j=i+1;j<pl.length;j++){let df=Math.abs(pl[i].lon-pl[j].lon);if(df>180)df=360-df;for(const [a,n,o] of AS)if(Math.abs(df-a)<=o){asp.push({a:pl[i],b:pl[j],n,orb:Math.abs(df-a)});break}}
 return {pl,asc,asp};
}
const deg=l=>{const s=signAt(l),d=l%30;return `${Math.floor(d)}° ${s.name} ${Math.round((d%1)*60)}′`};
const PM={Sun:'identity and vitality',Moon:'emotional needs and habits',Mercury:'thinking and communication',Venus:'love, values and pleasure',Mars:'drive and assertion',Jupiter:'growth and meaning',Saturn:'structure and responsibility',Uranus:'change and individuality',Neptune:'imagination and ideals',Pluto:'transformation and depth'};
views.chart=()=>{
 if(!A)return needLib();
 const t=tab(),b=V.birth;
 const form=panel(`<h3>My Cosmic Blueprint</h3><div class="field"><label for="bd">Date of birth</label><input type="date" id="bd" value="${b.date}"></div><div class="row"><div class="field" style="flex:1"><label for="bt">Time of birth</label><input type="time" id="bt" value="${b.time}" ${b.unk?'disabled':''}></div><div class="field" style="flex:1"><label for="bo">UTC offset (hours)</label><input type="number" id="bo" step="0.5" value="${b.off}"></div></div><label class="row"><input type="checkbox" id="bu" ${b.unk?'checked':''} style="width:20px;height:20px"> I don’t know my birth time</label><div class="row"><div class="field" style="flex:1"><label for="bla">Birth latitude</label><input type="number" id="bla" step="0.01" placeholder="53.19" value="${b.lat}"></div><div class="field" style="flex:1"><label for="blo">Birth longitude</label><input type="number" id="blo" step="0.01" placeholder="-2.89" value="${b.lon}"></div></div><p class="muted">The app finds coordinates and the historical timezone from a place search. This prototype takes them directly. Sample date shown, replace with yours.</p>`);
 let c;try{c=birthCalc()}catch(e){return `<div class="stack"><h1>Birth Chart</h1>${form}${panel('<h3>Could not calculate</h3><p>Check the date and time and try again.</p>')}</div>`}
 const note=b.unk?'<p class="note">Without a birth time the Moon sign can be uncertain, and the Ascendant and houses cannot be calculated reliably, so they are not shown.</p>':(c.asc===null?'<p class="note">Add latitude and longitude to calculate the Ascendant and whole-sign houses.</p>':'');
 if(t==='planets')return `<div class="stack"><h1>Planets</h1>${form}${note}${panel(`<div class="tbl"><table><tr><th></th><th>Planet</th><th>Position</th></tr>${c.pl.map(p=>`<tr><td class="glyph">${p.g}</td><td>${p.n}</td><td>${deg(p.lon)}</td></tr>`).join('')}${c.asc!==null?`<tr><td>AC</td><td>Ascendant</td><td>${deg(c.asc)}</td></tr>`:''}</table></div>`)}</div>`;
 if(t==='aspects')return `<div class="stack"><h1>Aspects</h1>${form}${panel(`<div class="tbl"><table><tr><th>Pair</th><th>Aspect</th><th>Orb</th></tr>${c.asp.map(a=>`<tr><td><span class="glyph">${a.a.g}</span> ${a.a.n} · <span class="glyph">${a.b.g}</span> ${a.b.n}</td><td>${a.n}</td><td>${a.orb.toFixed(1)}°</td></tr>`).join('')}</table></div>`)}<p class="muted">Positions are geocentric and computed from an ephemeris. Aspect orbs are conventional and chosen for this prototype.</p></div>`;
 const R=130,C=150,pt=(lon,r)=>{const ph=(180+lon-(c.asc!==null?c.asc:0))*Math.PI/180;return [C+r*Math.cos(ph),C-r*Math.sin(ph)]};
 const wheel=`<svg viewBox="0 0 300 300" width="100%" role="img" aria-label="Natal chart wheel"><circle cx="${C}" cy="${C}" r="${R}" fill="#F7EEDD" stroke="#D8B98A" stroke-width="1.4"/><circle cx="${C}" cy="${C}" r="${R-26}" fill="none" stroke="#D8B98A" stroke-width=".8"/><circle cx="${C}" cy="${C}" r="${R-72}" fill="none" stroke="#D8B98A" stroke-width=".5"/>${SIGNS.map((s,i)=>{const [x1,y1]=pt(i*30,R),[x2,y2]=pt(i*30,R-26),[gx,gy]=pt(i*30+15,R-13);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#D8B98A" stroke-width=".8"/><text x="${gx}" y="${gy}" text-anchor="middle" dominant-baseline="central" font-size="13" fill="#3A3026" font-family="Noto Sans Symbols,Segoe UI Symbol,serif">${s.g}</text>`}).join('')}${c.asp.filter(a=>a.n!=='conjunction').map(a=>{const [x1,y1]=pt(a.a.lon,R-72),[x2,y2]=pt(a.b.lon,R-72);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#D8B98A" stroke-width=".7" opacity=".8"/>`}).join('')}${c.pl.map(p=>{const [x,y]=pt(p.lon,R-48);const sel=V.chartSel===p.n;return `<g data-planet="${p.n}" tabindex="0" role="button" aria-label="${p.n} in ${signAt(p.lon).name}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="11" fill="${sel?'#D8C29A':'#E7D6B6'}" stroke="#D8B98A"/><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="13" fill="#3A3026" font-family="Noto Sans Symbols,Segoe UI Symbol,serif">${p.g}</text></g>`}).join('')}</svg>`;
 const sel=c.pl.find(p=>p.n===V.chartSel);
 return `<div class="stack"><h1>Birth Chart</h1>${form}${note}${panel(wheel+(sel?`<h3><span class="glyph">${sel.g}</span> ${sel.n} in ${signAt(sel.lon).name}</h3><p>${sel.n} traditionally describes ${PM[sel.n]}. In ${signAt(sel.lon).name} (${signAt(sel.lon).el.toLowerCase()}, ${signAt(sel.lon).mod.toLowerCase()}), that tends to show up through ${THEME[signAt(sel.lon).el][0]}.</p>`:'<p class="muted" style="text-align:center">Tap a planet to explore it.</p>')+(c.asc!==null?`<p class="muted">Ascendant ${deg(c.asc)}. The wheel is drawn with the Ascendant at the left.</p>`:'<p class="muted">Without an Ascendant the wheel starts from 0° Aries.</p>'))}<p class="muted">Sun ${signAt(c.pl[0].lon).name} · Moon ${signAt(c.pl[1].lon).name}${c.asc!==null?' · Rising '+signAt(c.asc).name:''}</p></div>`;
};
views.calendar=()=>{
 if(!A)return needLib();
 const t=tab(),now=new Date(),ev=events(now,365),m=moonInfo(now);
 const card=e=>panel(`<h3>${e.name}</h3><p class="muted">${evt(e.date)} · ${tz}</p><div class="label">Astronomy</div><p>${e.a}</p><div class="label">Traditional astrology</div><p>${e.s}</p><div class="label">Reflection</div><p>“${e.r}”</p>`);
 if(t==='moon')return `<div class="stack"><h1>Moon</h1>${panel(`<h3>Tonight</h3><p>${m.name} · about ${Math.round(m.ill*100)}% illuminated.</p><p class="muted">${moonRef(m)}</p>`)}${ev.filter(e=>QN.includes(e.k)).slice(0,12).map(e=>panel(`<h3>${e.name}</h3><p class="muted">${evt(e.date)}</p>`)).join('')}</div>`;
 if(t==='planetary')return `<div class="stack"><h1>Planetary Events</h1>${panel('<h3>Not calculated yet</h3><p>Conjunctions and retrograde periods need a dedicated pass over the ephemeris. None are listed here rather than guessing dates.</p>')}</div>`;
 return `<div class="stack"><h1>Cosmic Calendar</h1><p class="muted">Computed from an astronomical ephemeris and shown in your timezone (${tz}).</p>${ev.map(card).join('')}</div>`;
};
views.universe=()=>{
 const t=tab(),n=S.notif;
 if(t==='prefs')return `<div class="stack"><h1>Preferences</h1>${panel(`<h3>My sign</h3>${signGrid('My sign',S.sign)}<div class="field"><label for="nm">Name or nickname</label><input type="text" id="nm" value="${esc(S.name)}"></div><button class="btn" data-act="savename">Save</button>`)}</div>`;
 if(t==='notifications')return `<div class="stack"><h1>Notifications</h1><p class="note">Preview of the settings. Real delivery needs the native app, a physical device and your permission, which is requested only when you turn this on.</p>${panel(`<label class="row"><input type="checkbox" id="n_on" ${n.on?'checked':''} style="width:20px;height:20px"> Daily horoscope</label><div class="field"><label for="n_time">Delivery time</label><input type="time" id="n_time" value="${n.time}"></div><div class="field"><label for="n_s2">Second sign (optional)</label><select id="n_s2"><option value="">None</option>${SIGNS.filter(s=>s.id!==S.sign).map(s=>`<option value="${s.id}" ${n.sign2===s.id?'selected':''}>${s.name}</option>`).join('')}</select></div><label class="row"><input type="checkbox" id="n_mo" ${n.monthly?'checked':''} style="width:20px;height:20px"> Monthly horoscope</label><label class="row"><input type="checkbox" id="n_an" ${n.annual?'checked':''} style="width:20px;height:20px"> Annual horoscope</label><label class="row"><input type="checkbox" id="n_ev" ${n.events?'checked':''} style="width:20px;height:20px"> Cosmic event reminders</label>`)}</div>`;
 if(t==='settings'){
  const acct=!C.enabled?'<h3>Local mode</h3><p class="muted">Accounts and sync are not configured for this build, so everything stays in this browser.</p>'
   :C.user?`<h3>Signed in</h3><p class="muted">${esc(C.user.email||'')} · your universe is synced.</p>`
   :`<h3>Not signed in</h3><p class="muted">Create an account or sign in to keep your universe in sync across devices.</p><button class="btn" data-act="toauth">Sign in or create an account</button>`;
  return `<div class="stack"><h1>Settings</h1>${panel(acct)}${panel(`<p class="muted">Timezone: ${tz}</p><button class="btn ghost" data-act="signout">Sign out${C.user?'':' and clear this device'}</button><p class="muted">Data export and account deletion are on the way.</p>`)}</div>`;
 }
 return `<div class="stack"><h1>My Universe</h1>${panel(`<h2>${esc(S.name||'Traveller')}</h2><p>${esc(S.email)}</p><p class="muted"><span class="glyph">${sg(S.sign).g}</span> ${sg(S.sign).name} · ${tz}</p>`)}${panel(`<div class="row" style="justify-content:space-around;text-align:center"><div><div class="score" style="font-size:2rem">${S.saved.length}</div><div class="muted">cards saved</div></div><div><div class="score" style="font-size:2rem">${S.readings.length}</div><div class="muted">readings</div></div><div><div class="score" style="font-size:2rem">${S.matches.length}</div><div class="muted">matches</div></div></div>`)}</div>`;
};

/* ---------- render + events ---------- */
function render(){
 const app=$('#app'),sec=V.sec,authed=!!S.sign&&sec!=='welcome'&&sec!=='join';
 const html=(views[sec]||views.home)();
 app.innerHTML=sec==='welcome'||sec==='join'?html:framed(sec,html);
 $('#fab').hidden=!authed;
 const f=FOOT[sec],foot=$('#foot');
 foot.hidden=!(authed&&f);app.classList.toggle('has-footer',!!(authed&&f));document.body.classList.toggle('has-footer',!!(authed&&f));app.classList.toggle('onboard',sec==='welcome'||sec==='join');document.body.classList.toggle('onboarding',sec==='welcome'||sec==='join');
 if(authed&&f)$('#footin').innerHTML=f.map(([k,l])=>`<button role="tab" aria-selected="${tab()===k}" data-tab="${k}">${l}</button>`).join('');
 $('#tiles').innerHTML=NAV.map(([k,l,g])=>`<button class="tile" data-nav="${k}" ${sec===k?'aria-current="page"':''}><span class="g glyph">${g}</span>${l}</button>`).join('');
 if(sec==='join'||sec==='welcome')bindJoin();
}
/* Page frame (art/frame.webp, 1024x1536): the view's first <h1> moves onto the banner. Home shows the user's sign with its
   element and ruler; Horoscopes shows the sign being read and its dates. */
const KICK=Object.fromEntries(NAV.map(([k,l])=>[k,l]));
function framed(sec,html){
 const m=/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html);let kick=KICK[sec]||'',title=m?m[1]:'Kosmia',sub='';
 if(sec==='home'){const s=sg(S.sign);kick='';title=s.name;sub=`${s.el} · ruled by ${s.ruler}`}
 else{
  if(m)html=html.replace(m[0],'');
  if(sec==='horoscopes'){const s=sg(V.exploreSign||S.sign);kick='Horoscope';title=s.name;sub=s.dates}
  if(plain(title).includes(kick))kick='';
 }
 const fs=Math.min(64,Math.round(720/Math.max(plain(title).length,1)));
 return `<div class="page"><header class="banner">${kick?`<span class="b-kick">${kick}</span>`:''}<h1 class="b-title" style="--fs:${fs}">${title}</h1>${sub?`<span class="b-sub">${sub}</span>`:''}</header><div class="frame"><div class="frame-in">${html}</div></div></div>`;
}
function go(sec,t){stopAudio();V.sec=sec;if(t)V.tab[sec]=t;$('#sheet').hidden=true;render();window.scrollTo(0,0)}
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
 if(!C.enabled||C.user){S.email=email;if(V.joinSign)S.sign=V.joinSign;save();if(C.user)syncProfile();return go('home')}
 V.busy=true;syncJoin();if(err)err.textContent='';
 try{
  if(V.auth!=='in'){
   const r=await C.signUp(email,pw.value,V.joinSign);
   if(!r.session)throw new Error('Could not create your account. Please try again.');
   S.sign=V.joinSign;
  }else await C.signIn(email,pw.value);
  S.email=email;save();V.busy=false;
  // the auth listener now runs pullMerge, which opens home once the profile has a sign
 }catch(x){V.busy=false;syncJoin();if(err)err.textContent=authMsg(x)}
}
function bindJoin(){const f=$('#authForm');f.addEventListener('input',syncJoin);f.addEventListener('submit',submitJoin);syncJoin()}
function reveal(){
 const k=dkey();if(S.revealed[k])return;
 const sc=$('.scene');if(sc)sc.classList.add('rise');
 S.revealed[k]=true;save();syncFortune(k);
 setTimeout(()=>{sc&&sc.classList.add('flipped');setTimeout(render,1500)},450);
}
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-go],[data-nav],[data-tab],[data-act],[data-sign],[data-sign2],[data-period],[data-pick],[data-planet]');
 if(!t){if(e.target.id==='sheet')$('#sheet').hidden=true;return}
 if(t.dataset.go)return go(t.dataset.go);
 if(t.dataset.nav)return go(t.dataset.nav);
 if(t.dataset.tab){V.tab[V.sec]=t.dataset.tab;return render()}
 if(t.dataset.period){V.period=t.dataset.period;return render()}
 if(t.dataset.planet){V.chartSel=t.dataset.planet;return render()}
 if(t.dataset.pick!==undefined){const T=V.tarot,i=Number(t.dataset.pick),n=SPREADS[T.spread].p.length,x=T.picks.indexOf(i);if(x>=0)T.picks.splice(x,1);else if(T.picks.length<n)T.picks.push(i);return render()}
 if(t.dataset.sign2){V.love.b=t.dataset.sign2;V.love.done=false;return render()}
 if(t.dataset.sign){
  const id=t.dataset.sign;
  if(V.sec==='join'||V.sec==='welcome')return pickSign(id);
  if(V.sec==='horoscopes'&&!t.dataset.act){V.exploreSign=id;return render()}
  if(V.sec==='love'){V.love.a=id;V.love.done=false;return render()}
  if(V.sec==='universe'&&!t.dataset.act){S.sign=id;save();syncProfile();toast('Your sign is now '+sg(id).name);return render()}
 }
 const a=t.dataset.act;if(!a)return;
 if(a==='reveal')return reveal();
 if(a==='intro'){S.intro=true;save();syncProfile();return render()}
 if(a==='setsign'){S.sign=t.dataset.sign;V.exploreSign=null;save();syncProfile();toast('Your sign is now '+sg(S.sign).name);return render()}
 if(a==='domatch'){V.love.done=true;return render()}
 if(a==='openmatch'){V.love.a=t.dataset.a;V.love.b=t.dataset.b;V.love.done=true;V.tab.love='match';return render()}
 if(a==='savematch'){const a1=V.love.a||S.sign,b1=V.love.b;if(!S.matches.some(m=>m[0]===a1&&m[1]===b1)){S.matches.push([a1,b1]);save();C.saveMatch(a1,b1);toast('Match saved')}return render()}
 if(a==='savecard'){const k=dkey(),c=todayCard();if(!S.saved.some(x=>x.date===k)){S.saved.push({id:c.id,date:k});save();syncFortune(k);toast('Saved to My Collection')}return render()}
 if(a==='savenote'){const k=dkey();S.notes[k]=$('#note').value;if(!S.saved.some(x=>x.date===k))S.saved.push({id:todayCard().id,date:k});save();syncFortune(k);return toast('Reflection saved')}
 if(a==='savename'){S.name=$('#nm').value.trim();save();syncProfile();return toast('Saved')}
 if(a==='signout'){Promise.resolve(C.user&&C.signOut()).catch(()=>{});try{localStorage.removeItem(KEY)}catch(x){}S=fresh();V.joinSign='';V.paint={};V.auth='in';return go('welcome')}
 if(a==='paint'){const k=dkey(),c=todayCard();V.painting=true;render();
  C.paint(k,c.id,S.sign).then(d=>{V.paint[k]=d.image},e=>toast(e.message||'Could not paint your card')).then(()=>{V.painting=false;render()});return}
 if(a==='listen'){const txt=t.dataset.say;
  if(V.say===txt){stopAudio();return render()}
  stopAudio();V.say=txt;render();
  (AUDIO.has(txt)?Promise.resolve(AUDIO.get(txt)):C.speak(txt).then(b=>{const u=URL.createObjectURL(b);AUDIO.set(txt,u);return u}))
   .then(u=>{if(V.say!==txt)return;player=new Audio(u);player.onended=()=>{player=null;V.say=null;render()};return player.play()})
   .catch(e=>{if(V.say===txt){V.say=null;render()}toast(e.message||'Could not play the reading')});
  return}
 if(a==='tohoroscope'){V.exploreSign=null;V.period='daily';return go('horoscopes','general')}
 if(a==='toreflect')return go('fortune','reflections');
 if(a==='toauth'){V.auth=S.email?'in':'up';return go('welcome')}
 if(a==='authmode'){const em=$('#em');if(em)S.email=em.value.trim();V.auth=V.auth==='in'?'up':'in';render();const f=$(S.email?'#pw':'#em');if(f)f.focus();return}
 if(a==='forgot'){const em=$('#em'),email=em?em.value.trim():'';
  if(!/^\S+@\S+\.\S+$/.test(email)){toast('Enter your email first');if(em)em.focus();return}
  C.resetPassword(email).then(()=>toast('If an account exists for that email, a reset link is on its way.'),x=>toast(authMsg(x)));return}
 if(a==='setpw'){const v=$('#npw').value;if(v.length<6)return toast('Use at least 6 characters');
  t.disabled=true;C.updatePassword(v).then(()=>{toast('Password updated');go(S.sign?'home':'welcome')},x=>{t.disabled=false;toast(authMsg(x))});return}
 const T=V.tarot;
 if(a==='usespread'){T.spread=t.dataset.k;T.stage='setup';V.tab.tarot='new';return render()}
 if(a==='shuffle'){T.q=($('#q')||{value:T.q}).value;T.spread=($('#sp')||{value:T.spread}).value;T.deck=shuffle(DECK);T.picks=[];T.stage='pick';return render()}
 if(a==='reveal-reading'){const sp=SPREADS[T.spread];T.drawn=T.picks.map((i,x)=>{const c=T.deck[i];const r=new Uint8Array(1);crypto.getRandomValues(r);return {id:c.id,name:c.name,sym:c.sym,pos:sp.p[x],rev:r[0]<64,upm:c.up,revm:c.rev}});T.flipped=0;T.stage='read';return render()}
 if(a==='flipnext'){T.flipped++;return render()}
 if(a==='saveread'){const r={spread:T.spread,q:T.q,date:dkey(),cards:T.drawn.map(c=>({pos:c.pos,name:c.name,rev:c.rev}))};S.readings.push(r);save();C.saveReading(r).then(id=>{if(id){r.rid=id;save()}});toast('Reading saved');return}
 if(a==='newread'){T.stage='setup';T.q='';return render()}
});
const tap=el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true}));
document.addEventListener('keydown',e=>{
 const w=e.target.closest&&e.target.closest('.wheel [data-sign]');
 if(w&&/^Arrow/.test(e.key)){e.preventDefault();const i=SIGNS.findIndex(s=>s.id===w.dataset.sign),d=e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1;return tap($(`.wheel [data-sign="${SIGNS[(i+d+12)%12].id}"]`))}
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('.scene[data-act],[data-planet],.wheel [data-sign]')){e.preventDefault();tap(e.target)}
});
document.addEventListener('change',e=>{
 const i=e.target,id=i.id,b=V.birth;
 if(V.sec==='chart'){if(id==='bd')b.date=i.value;if(id==='bt')b.time=i.value;if(id==='bo')b.off=i.value;if(id==='bu')b.unk=i.checked;if(id==='bla')b.lat=i.value;if(id==='blo')b.lon=i.value;if(id&&id[0]==='b')render()}
 if(V.sec==='universe'&&id&&id.startsWith('n_')){const n=S.notif;if(id==='n_on')n.on=i.checked;if(id==='n_time')n.time=i.value;if(id==='n_s2')n.sign2=i.value;if(id==='n_mo')n.monthly=i.checked;if(id==='n_an')n.annual=i.checked;if(id==='n_ev')n.events=i.checked;save();syncProfile();toast('Preference saved')}
});
$('#fab').addEventListener('click',()=>{$('#sheet').hidden=false});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#sheet').hidden=true});
// With accounts enabled, only a saved session opens straight onto home; everyone else starts at onboarding.
V.sec=S.sign&&(!C.enabled||C.hasStoredSession())?'home':'welcome';
render();
C.onError(()=>toast('Could not sync. Your changes are kept on this device.'));
C.onAuth(u=>{if(u)pullMerge();else render()});
C.init().then(u=>{
 if(u){if(C.recovering)go('reset');return pullMerge()}
 if(C.enabled&&V.sec!=='welcome')go('welcome');
}).catch(e=>console.error(e));
})();
