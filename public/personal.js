/* Kosmia's personal voice. Everything the reader has written (journal pages, Whisper reflections, the questions they
   asked the cards, their dreams, what they said to Kassandra) is read on the device, the last month weighted towards the
   most recent days, and gathered into a portrait: the themes on their mind, the questions they are carrying, how they
   seem to feel. From it, and from today's real sky measured against their own birth chart, the day's personal message,
   the Whisper's note and Kassandra's sense of them are written. Always warm and constructive: a worry is met with
   reassurance and one small step, never with a warning. The same reader on the same day always reads the same words. */
(function(G){
'use strict';
const DAY=864e5;
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
const pick=(a,seed)=>a[hash(seed)%a.length];
const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ELEMENT=i=>['fire','earth','air','water'][i%4];

// the themes a life is made of: the words that point to each, how Kosmia names it to the reader, the gift hidden in it,
// one small constructive step, and a question to carry
const THEMES={
 work:{title:'The Work You Love',re:/\b(job|work|career|boss|office|colleague|promotion|interview|project|studio|business|client|deadline|quit|resign|hired|salary)\w*/gi,
  name:'your work and the direction it is taking',short:'your path at work',
  gift:'a wish to build something that truly feels like yours',
  step:['write down the one next step that would make the path feel real, however small','give the most meaningful task of the day your freshest hour','tell one person you trust about the idea you are holding'],
  q:'What would the work you love ask of you this week?'},
 create:{title:'Room to Create',re:/\b(creat|arts?\b|artist|paint|draw|writing (?:a|my) (?:book|novel|story|song)|music|song|design|craft|idea|imagin|inspir)\w*/gi,
  name:'your creativity',short:'what you long to create',
  gift:'an imagination asking for room',
  step:['make something small with your hands today, with no aim but to enjoy it','keep a page open for every idea that visits you today','give your creative idea twenty unhurried minutes'],
  q:'What wants to be made through you?'},
 money:{title:'Steady Ground',re:/\b(money|bill|debt|rent|pay|paid|afford|savings?|spend|budget|financ|income|cost)\w*/gi,
  name:'money and the security you want to build',short:'your sense of security',
  gift:'a growing wish for steadiness and self-reliance',
  step:['look gently at one number you have been avoiding, then let it go for the day','name three things you already have that make you feel safe','set one small, kind intention for how you spend this week'],
  q:'What does feeling secure truly mean to you?'},
 love:{title:'Matters of the Heart',re:/\b(love|partner|boyfriend|girlfriend|husband|wife|date|dating|crush|relationship|romance|heart|kiss|ex\b|marri|together|single)\w*/gi,
  name:'love and the bonds close to your heart',short:'your heart',
  gift:'a heart that knows how to open',
  step:['say one honest, tender thing to someone who matters','notice where love already shows up for you today','offer yourself the kindness you so easily offer others'],
  q:'Where is love quietly asking to be let in?'},
 family:{title:'Roots and Home',re:/\b(mum|mom|mother|dad|father|parent|sister|brother|famil|son|daughter|child|kids?|grandm|grandp|home|aunt|uncle|cousin)\w*/gi,
  name:'your family and your roots',short:'the people you come from',
  gift:'deep roots that still nourish you',
  step:['send a few warm words to someone at home','spend a moment with a memory that makes you smile','make the place you live a little softer tonight'],
  q:'What did your roots give you that you carry with pride?'},
 friends:{title:'Kindred Spirits',re:/\b(friend|mates?|social|party|lonel|alone|people|community|group)\w*/gi,
  name:'friendship and belonging',short:'the people around you',
  gift:'a longing for real connection',
  step:['reach out first to a friend you miss','say yes to one small invitation','be the warm presence you hope to find'],
  q:'Who makes you feel most like yourself?'},
 health:{title:'Tending Your Energy',re:/\b(tired|exhaust|sleep|rest|ill\b|illness|sick|health|body|energy|burn\w*out|headache|pain(?:s|ful)?\b|exercise|gym|walk|eat(?:ing)?\b|diet|stress)\w*/gi,
  name:'your energy and how you care for yourself',short:'your wellbeing',
  gift:'a body asking to be listened to',
  step:['give yourself an early, gentle evening','take a slow walk without your phone','drink water, breathe deeply, and count it as progress'],
  q:'What would it look like to treat your energy as precious?'},
 change:{title:'A New Chapter',re:/\b(change|new|start|begin|move|moving|leav|decid|decision|choice|chapter|transition|fresh|next step|uncertain|should i)\w*/gi,
  name:'a new chapter that is calling you',short:'the change ahead of you',
  gift:'the courage that every new chapter begins with',
  step:['picture the version of you a year from now, and ask what they would choose','write down what you would do if you knew it would work out','take the smallest step toward the change, just to feel its weight'],
  q:'What is the new chapter already asking of you?'},
 calm:{title:'Gentle Strength',re:/\b(anxi|worr|scared|afraid|fear|nervous|overwhelm|panic|stuck|lost|confus|doubt|sad|cry|hurt|angry|frustrat)\w*/gi,
  name:'the feelings you have been carrying',short:'what you have been feeling',
  gift:'a sensitivity that is also your wisdom',
  step:['place a hand on your heart and take three slow breaths before you decide anything','write the worry down, then write one thing that is going right','be as patient with yourself as you would be with a friend'],
  q:'What would bring you a little more peace today?'},
 worth:{title:'Your Own Worth',re:/\b(confiden|worth|enough|proud|believe in|insecur|compar|deserv|value myself|imposter|self-?(?:worth|esteem|doubt|love|belief))\w*/gi,
  name:'how you see your own worth',short:'your belief in yourself',
  gift:'a quiet strength you are only beginning to claim',
  step:['write down one thing you did well this week, and let yourself mean it','speak to yourself today as you would to someone you admire','accept the next compliment without explaining it away'],
  q:'What would you attempt if you trusted yourself fully?'},
 grief:{title:'What Remains',re:/\b(miss(?:ing|ed|es)?\b|loss|lost|griev|died|death|passed away|goodbye|ending|memor|remember)\w*/gi,
  name:'something you are missing or letting go of',short:'what you are letting go of',
  gift:'a love that remains, even as things change',
  step:['honour the memory with one small ritual: a candle, a song, a word','let yourself feel without hurrying the feeling along','write a few lines to what you are missing'],
  q:'What remains with you, even now?'},
 spirit:{title:'The Inner Compass',re:/\b(spirit|soul|purpose|meaning|intuition|signs?\b|universe|meditat|pray|dream|manifest|energy|moon|stars?)\w*/gi,
  name:'your search for meaning',short:'your inner compass',
  gift:'an intuition growing louder',
  step:['sit in silence for five minutes and notice the first thought that arrives','follow one hunch today without asking it to explain itself','look at the sky tonight and set one intention'],
  q:'What is your intuition trying to tell you?'},
 travel:{title:'Far Horizons',re:/\b(travel|trip|journey|abroad|holiday|vacation|flight|visit|explore|adventure)\w*/gi,
  name:'a journey you are dreaming of',short:'your wish to wander',
  gift:'a restless, curious spirit',
  step:['plan one small adventure close to home','learn one new thing about the place you dream of','take a different road home today'],
  q:'What are you hoping to find out there?'}
};
const WORRY=/\b(anxi|worr|scared|afraid|fear|nervous|overwhelm|panic|stuck|lost|confus|doubt|sad|tired|hurt|lonel|exhaust)\w*/gi;
// words that ask for real care rather than a reading: the message then gently points to people who can help
const CARE=/\b(suicid\w*|kill (?:my|him|her)self|self[- ]?harm\w*|end (?:it all|my life)|want to die|hurt myself)\b/i;
const JOY=/\b(happy|grateful|gratitude|excit|joy|love[ds]?|proud|hope|calm|peace|bless|thank|wonderful|beautiful|free)\w*/gi;

/* ---------- the portrait: what the reader has written, read and weighed ---------- */
// items: [{day:'YYYY-MM-DD', text, kind:'journal'|'reflection'|'question'|'dream'|'kassandra'}]
function portrait(items,today){
 const t0=Date.parse(today+'T12:00:00Z'),score={},seen={},ev={};let worry=0,joy=0,n=0,care=false;
 const recent=items.filter(x=>x&&x.text&&x.day&&t0-Date.parse(x.day+'T12:00:00Z')<=30*DAY).sort((a,b)=>a.day<b.day?1:-1);
 for(const x of recent){
  const age=Math.max(0,(t0-Date.parse(x.day+'T12:00:00Z'))/DAY),w=Math.exp(-age/9)*(x.kind==='question'?1.6:x.kind==='journal'||x.kind==='reflection'?1.3:1);
  const txt=String(x.text);n++;
  for(const [k,T] of Object.entries(THEMES)){const m=txt.match(T.re);if(m){score[k]=(score[k]||0)+w*Math.min(3,m.length);seen[k]=seen[k]||x.day;if(!ev[k])ev[k]=x}}
  worry+=w*((txt.match(WORRY)||[]).length);if(age<=7&&CARE.test(txt))care=true;joy+=w*((txt.match(JOY)||[]).length);
 }
 // the feelings themselves are a theme only when nothing more concrete stands out
 const themes=Object.entries(score).sort((a,b)=>b[1]-a[1]).map(([k,s])=>({k,s,since:seen[k],from:ev[k]}));
 const concrete=themes.filter(x=>x.k!=='calm'&&x.k!=='spirit');
 const top=(concrete.length&&(!themes.length||concrete[0].s>=themes[0].s*.6)?concrete:themes).slice(0,3);
 const qs=recent.filter(x=>x.kind==='question').slice(0,3).map(x=>x.text);
 const mood=worry>joy*1.3&&worry>.6?'tender':joy>worry*1.3&&joy>.6?'bright':'steady';
 return {themes:top,all:themes,questions:qs,mood:care?'tender':mood,care,count:n,lastDay:recent[0]&&recent[0].day,today};
}

// how long ago a day was, in words
function when(day,today){const d=Math.round((Date.parse(today)-Date.parse(day))/DAY);return d<=0?'today':d===1?'yesterday':d<7?'a few days ago':d<14?'last week':'recently'}
// how the reader wrote about it: the source, said warmly
const VIA={journal:'you wrote about',reflection:'you reflected on',question:'you asked the cards about',dream:'you dreamt of',kassandra:'you spoke to Kassandra about'};

/* ---------- today's sky, met with the reader's own chart ---------- */
// the area of life the Moon lights today: counted from the reader's rising sign when the birth time is known, otherwise
// from their Sun sign (solar houses)
const HOUSE_AREA=['your sense of self and how you show up','your resources, your values and what you are worth','your words, your ideas and the people nearby','your home, your family and your inner world','joy, creativity, romance and play','your daily rhythm, your work and your wellbeing','your closest one-to-one bonds','intimacy, trust and deep change','learning, travel and your beliefs','your calling and your place in the world','friendship, community and your hopes','rest, dreams and your private, inner life'];
const ASPECT_WORD={conjunction:'meets',trine:'flows in harmony with',sextile:'opens a door with',square:'challenges, and so strengthens,',opposition:'mirrors'};
const ASPECT_GIFT={conjunction:'a fresh beginning in',trine:'ease and grace around',sextile:'a small opportunity in',square:'growth through',opposition:'balance in'};
const NATAL_ROLE={Sun:'your Sun, the heart of who you are',Moon:'your Moon, your emotional nature',Mercury:'your Mercury, your voice and mind',Venus:'your Venus, how you love',Mars:'your Mars, your courage and drive',Jupiter:'your Jupiter, your faith and luck',Saturn:'your Saturn, your patience and resolve'};
function skyForYou(K,now,sunSign,chart,exact){
 const pos=K.positions(now),moon=pos.find(p=>p.n==='Moon'),m=K.moon(now);
 const base=chart&&chart.ang&&exact?K.signIdx(chart.ang.asc):(chart?chart.pl[0].sign:sunSign);
 const house=(moon.sign-base+12)%12+1;
 let touch=null;
 if(chart){
  // the closest meeting today between a moving planet and the reader's own planets, the Moon's preferred
  const natal=chart.pl.filter(p=>NATAL_ROLE[p.n]);
  for(const tp of pos.filter(p=>['Moon','Sun','Venus','Mars','Mercury','Jupiter'].includes(p.n))){
   for(const np of natal){const a=K.aspectBetween(tp.lon,np.lon,{conjunction:5,sextile:3,square:4,trine:4,opposition:5});
    if(a&&(!touch||a.orb+(tp.n==='Moon'?0:1.5)<touch.orb)){touch={t:tp.n,n:np.n,a:a.n,orb:a.orb+(tp.n==='Moon'?0:1.5)}}}
  }
 }
 return {moonSign:moon.sign,phase:m.name,house,area:HOUSE_AREA[house-1],touch,solar:!(chart&&chart.ang&&exact)};
}

/* ---------- the day's personal message ---------- */
const OPEN={tender:['Be gentle with yourself today','Today asks for softness, not speed','There is more strength in you than you feel right now','Your soul is doing quiet, important work','Even on a tender day, you are growing','You are allowed to move slowly and still move forward','The part of you that feels everything is also the part that heals'],
 bright:['Something in you is opening','You are carrying a lovely light at the moment','Your spirit is lifting, and it shows','There is a brightness in you that others can feel','You are stepping into more of yourself','Your soul is wide awake today','Life is meeting you halfway'],
 steady:['Today is quietly on your side','The sky holds something meaningful for you today','A calm, clear current runs through your day','Your soul knows the way, even when the mind wonders','Today is a fresh page, and the pen is in your hand','Something good is gathering around you','You are exactly where your growth can begin']};
// the better self: one line each day on who the reader is becoming
const GROW=['Every day you are allowed to become a little more of who you are meant to be.','The best version of you is not far away; it is built from small, faithful choices like the ones in front of you today.','Growth rarely announces itself, but it is happening in you now.','You do not have to become someone else, only more fully yourself.','Each kind choice you make for yourself today is a promise kept to the person you are becoming.','What you practise today, you become: let it be patience, courage and care.','Your soul is not asking you to be perfect, only to keep unfolding.','You have already come through every hard day so far; today you get to grow through this one.','Let today be one honest step closer to the life that feels like yours.','The light you are looking for is already practising in you.'];
const GROWQ=['What would your best self do with this day?','Which small habit would the future you thank you for?','Where can you choose growth over comfort today?','What are you ready to outgrow?','What would it look like to be proud of yourself tonight?','Which part of you is asking to be trusted?'];
const HONOUR=['Beneath it lies {g}, and that deserves to be honoured.','Beneath it lies {g}: treat it as a compass, not a burden.','Within it is {g}, and it is leading you somewhere good.','Look closely and you will find {g} at its heart.'];
const ELEMENT_TONE={fire:'lends you warmth and courage',earth:'steadies you and rewards patience',air:'brings clarity and a lighter step',water:'deepens your intuition and softens your heart'};
function message(o){
 // o: {K, now, today, name, sign (index), chart, portrait, uid}
 const P=o.portrait,seed=(o.uid||'')+o.today,sky=skyForYou(o.K,o.now,o.sign,o.chart,o.exact),nm=o.name?o.name+', ':'';
 // a different one of the reader's themes leads each day, so the message is never yesterday's again
 const dn=Math.floor(Date.parse(o.today+'T12:00:00Z')/DAY),lead=P.themes.length?dn%P.themes.length:0;
 const th=P.themes[lead],T=th&&THEMES[th.k],o2=P.themes.find((x,i)=>i!==lead),T2=o2&&THEMES[o2.k];
 const lines=[];let mine='';
 const op=pick(OPEN[P.mood],seed+'o');lines.push(nm?`${nm}${op[0].toLowerCase()+op.slice(1)}.`:op+'.');
 lines.push(`The Moon moves through ${SIGN_NAMES[sky.moonSign]}, lighting ${sky.area}, and ${ELEMENT_TONE[ELEMENT(sky.moonSign)]}.`);
 if(sky.touch)lines.push(`${sky.touch.t==='Moon'?'Its path':sky.touch.t==='Sun'?'The Sun':sky.touch.t} ${ASPECT_WORD[sky.touch.a]} ${NATAL_ROLE[sky.touch.n]}, bringing ${ASPECT_GIFT[sky.touch.a]} ${th?T.short:'what matters most to you'}.`);
 if(T){
  mine=`${cap(when(th.since,o.today))} ${VIA[th.from.kind]||'you wrote about'} ${T.name}.`;
  lines.push(`${cap(when(th.since,o.today))} ${VIA[th.from.kind]||'you wrote about'} ${T.name}${T2?`, and about ${T2.short}`:''}. ${pick(HONOUR,seed+'h').replace('{g}',T.gift)}`);
  lines.push(P.care?'Most of all, please reach out today to someone you trust, or to a local support line: you do not have to carry this alone, and you deserve to be held.':`One kind step for today: ${pick(T.step,seed+'s')}.`);
 }else lines.push('Your story with Kosmia is only beginning. As you write and reflect, these words will grow more and more your own.');
 if(!P.care)lines.push(pick(GROW,seed+'g'));
 const question=T&&hash(seed+'qq')%2?T.q:pick(GROWQ.concat(['What would make today feel meaningful?','What are you ready to welcome in?','Where can you be a little braver today?']),seed+'q');
 const focus=T?T.title:'A Fresh Page';
 return {body:lines.join(' '),short:mine?lines[0]+' '+mine:'',question,focus,sky,theme:th&&th.k};
}
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;

/* ---------- the Whisper, spoken to this reader ---------- */
function whisper(card,words,o){
 const P=o.portrait,th=P.themes[0],T=th&&THEMES[th.k],seed=(o.uid||'')+o.today+'w',w=(words||[]).map(x=>x.toLowerCase()),nm=o.name?o.name+', ':'';
 if(!T)return pick([
  `${nm}${card.title} did not find you by chance. Carry it unspoken through the day and watch where ${w[0]||'its light'} appears: that is the door.`,
  `${nm}the veil is thin today. ${card.title} has crossed it for you alone; listen for ${w[0]||'its voice'} in the quiet moments.`,
  `${nm}some cards are drawn, others are sent. ${card.title} was sent, and ${w[0]||'its gift'} is already on its way to you.`
 ],seed);
 return pick([
  `${nm}${card.title} rose from the deck as you turn towards ${T.short}. It carries ${w[0]||'its gift'} and ${w[1]||'grace'}: what you seek is already moving towards you.`,
  `The cards remember what you carry. With ${T.short} on your mind, ${card.title} comes as a key, and ${w[0]||'its message'} is the lock it was made for.`,
  `${nm}${card.title} speaks in an old tongue about ${T.name}. Its ${w[1]||'wisdom'} has been sleeping in you; today it wakes.`,
  `Something unseen is turning in your favour. ${card.title} is its sign: where ${T.short} is concerned, trust ${w[0]||'the quiet knowing'} over every doubt.`
 ],seed);
}

/* ---------- what Kassandra knows of the reader (only what they wrote; never a diagnosis) ---------- */
function forKassandra(P){
 if(!P.count)return '';
 const ts=P.themes.map(x=>THEMES[x.k].name).join('; ');
 const ex=P.themes.map(x=>x.from).filter(Boolean).slice(0,3).map(x=>`(${x.kind}, ${x.day}) “${String(x.text).replace(/\s+/g,' ').slice(0,220)}”`).join('\n');
 return [`On their mind lately: ${ts||'nothing in particular'}. Their mood in what they write: ${P.mood}.`,
  P.care?'Some of what they wrote suggests they may be in real distress: be especially tender, and gently encourage them to reach out to someone they trust or a local support line.':'',
  P.questions.length?`Questions they have asked the cards: ${P.questions.map(q=>'“'+q.slice(0,140)+'”').join('; ')}.`:'',
  ex?`In their own words:\n${ex}`:''].filter(Boolean).join('\n');
}
// a line Kassandra can greet them with, when nothing else is fresh
function greeting(P){
 const th=P.themes[0];if(!th)return '';
 return pick([`I sense ${THEMES[th.k].short} has been on your mind.`,`You have been carrying ${THEMES[th.k].short} close lately.`],P.today+th.k);
}

G.KosmiaPersonal={THEMES,portrait,message,whisper,forKassandra,greeting,skyForYou};
})(window);
