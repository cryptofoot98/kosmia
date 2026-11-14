/* Kosmia's horoscopes, written in the app from the real sky of each period (KosmiaSky) rather than by AI.
   Each reading reads one calendar fact for the period (the Moon today; this week's lunar phase or sign change; this
   month's New and Full Moon; this year's Jupiter and Saturn) and one planet for the area of life (Venus for love, Mars
   for health…), then speaks to the reader's sign according to how that planet's sign sits with theirs. The same sign,
   area and period always give the same reading, and a new day, week, month or year gives a new one. */
(function(G){
'use strict';
const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const EL=i=>['Fire','Earth','Air','Water'][i%4];
const DAY=864e5;
const hash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
const pick=(a,seed)=>a[hash(seed)%a.length];

// how a sign sits with the reader's: their own, an easy angle, a tense one, their opposite, or an awkward one
function relation(me,other){
 const d=Math.min((other-me+12)%12,(me-other+12)%12);
 if(d===0)return 'same';if(d===6)return 'mirror';if(d===3)return 'friction';
 if(d===4||d===2)return 'ease';return 'quiet';
}
const REL_CLAUSE={same:'your own sign',ease:'a sign that gets on well with yours',friction:'a sign that rubs against yours a little',mirror:'your opposite sign',quiet:'a sign that sits at an awkward angle to yours'};

// the planet each area of life is read from, by period
const PLANET={
 overview:{daily:'Moon',weekly:'Moon',monthly:'Sun',yearly:'Jupiter'},
 love:{daily:'Venus',weekly:'Venus',monthly:'Venus',yearly:'Venus'},
 family:{daily:'Moon',weekly:'Moon',monthly:'Moon',yearly:'Saturn'},
 health:{daily:'Mars',weekly:'Mars',monthly:'Mars',yearly:'Mars'},
 career:{daily:'Mars',weekly:'Mercury',monthly:'Sun',yearly:'Saturn'},
 money:{daily:'Venus',weekly:'Venus',monthly:'Venus',yearly:'Jupiter'}
};
const PLANET_ROLE={Moon:'the Moon, which colours your moods',Sun:'the Sun',Venus:'Venus, the planet of love and of what you value',Mars:'Mars, which governs your energy and drive',Mercury:'Mercury, which rules how you think and talk',Jupiter:'Jupiter, the planet of growth and luck',Saturn:'Saturn, the planet of effort and responsibility'};

// what each sign does well, and the habit that trips it up (both read naturally after "you" / "if you start")
const VOICE={
 aries:['you move first while everyone else is still thinking','rushing the part that needs a second look'],
 taurus:['you stay steady when everything around you wobbles','digging in just because changing your mind feels like losing'],
 gemini:['you can talk your way into any room','spreading yourself across too many conversations'],
 cancer:['you know what people need before they say it','carrying everyone else’s moods home with you'],
 leo:['you light up whoever is in front of you','waiting for applause before you trust your own work'],
 virgo:['you notice the detail everyone else walked past','fixing other people’s problems before your own'],
 libra:['you can find the fair middle of almost anything','agreeing just to keep the peace'],
 scorpio:['you see straight through to what is really going on','keeping score in silence'],
 sagittarius:['you find the bigger picture when other people are stuck','leaving before the conversation gets difficult'],
 capricorn:['you keep going long after other people have stopped','treating rest as something you have to earn'],
 aquarius:['you think a step ahead of the room','explaining your feelings instead of letting yourself have them'],
 pisces:['you feel what is going on under the surface','losing yourself in someone else’s version of events']
};
const TRAIT=[
 (s,w,p)=>`${s.replace(/^you/,'You')}, and that is exactly what ${p==='day'?'today':'this '+p} needs from you. The one thing to watch is ${w}.`,
 (s,w,p)=>`Lean on the fact that ${s}. Where it trips you up is ${w}, so keep half an eye on that ${p==='day'?'today':'this '+p}.`,
 (s,w,p)=>`Trust that ${s}. Just notice if you start ${w}.`
];

const LINES={
 overview:{
  same:['With the focus on your own sign, people notice you more than usual, so say what you actually think.','This is a very you stretch of time. You will feel more like yourself, and the people around you will feel it too.'],
  ease:['Things you have been pushing at start to give a little. Use that, and don’t wait for perfect conditions.','There is less friction around you than there has been. It’s a good moment to ask for the thing you keep putting off asking for.'],
  friction:['You might feel slightly out of step with people. That doesn’t mean you’re wrong, only that it’s worth slowing down before you react.','Expect a little resistance, mostly in small, irritating ways. Pick one thing to push on and let the rest go.'],
  mirror:['Other people will show you something about yourself, sometimes in ways you won’t love. Listen anyway.','Pay attention to who you clash with and who you’re drawn to. Both are telling you something.'],
  quiet:['Signals are a bit mixed, so don’t make big calls on a first impression.','It’s an in-between kind of time, better for tidying up loose ends than starting from scratch.']},
 love:{
  same:['You’re easier to read right now, and that works in your favour. If there is something you want someone to know, they are more likely to hear it.','There is a quiet pull to you at the moment, mostly because you’re not trying so hard.'],
  ease:['Conversations with someone you care about flow better than usual. Bring up the thing you would normally save for later.','Warmth comes back easily. A small, thoughtful gesture will mean more than a grand one.'],
  friction:['Little misunderstandings are likely, so check what they meant before you decide how you feel about it.','You may want closeness and space at the same time. Say which one you need out loud, rather than hoping they’ll guess.'],
  mirror:['Whoever you’re closest to is holding up a mirror. What annoys you in them might be worth a second look in you.','Relationships take centre stage. Meet halfway, and notice who actually meets you there.'],
  quiet:['Love is low-key rather than dramatic, and that’s fine. Notice the people who keep turning up for you.','If you’re single, keep it light and curious. If you’re not, an ordinary evening together counts for more than you think.']},
 family:{
  same:['People at home lean on you a little more than usual. Help, but don’t take over.','You set the tone at home. If you stay calm, everyone else tends to follow.'],
  ease:['It’s an easy time to clear the air with a relative. Keep it short, kind and specific.','Home feels like a softer place to land. Make time for the person you’ve been meaning to call.'],
  friction:['Old family habits may press your buttons. You don’t have to win the argument to be right about what you need.','Expect a bit of noise at home. Give yourself ten minutes before you answer anything sharp.'],
  mirror:['Someone in the family may say out loud what you’ve been thinking. Hear them out before you defend yourself.','You may catch your parents in yourself, for better and for worse. Keep the parts you love.'],
  quiet:['Nothing dramatic at home, just ordinary moments that add up. Eat together if you can.','It’s a good time for small repairs: the thank-you you never sent, the visit you keep postponing.']},
 health:{
  same:['Your body is quick to tell you what it wants. This time, actually listen.','Your energy is yours to spend. Spend it on things that leave you better, not just busier.'],
  ease:['Good habits stick more easily now. Pick one and keep it simple.','You bounce back faster than usual, which is a reason to rest properly, not to push harder.'],
  friction:['Stress may show up in your shoulders, your sleep or your appetite before your head admits it. Take that seriously.','You’ll be tempted to run on willpower. Water, food and sleep come first; everything else can wait its turn.'],
  mirror:['Other people’s stress can rub off on you. Notice whose mood you’re carrying around.','Balance matters more than effort. Too much of anything, even good things, will tip you over.'],
  quiet:['Gentle and regular beats intense and occasional. A walk counts.','Watch for the small signs of tiredness before they turn into big ones.']},
 career:{
  same:['You’re more visible at work than usual. Put your name to the thing you’re proud of.','Your instincts at work are good right now. Back yourself in the meeting, not afterwards.'],
  ease:['Work moves with less friction. It’s a good moment to pitch, apply or ask.','People are more open to your ideas. Lead with the one you’ve properly thought through.'],
  friction:['Expect some pushback or a slow reply. Keep a record, keep your tone level, and try not to take it personally.','A colleague or a process may get in your way. Solve the problem in front of you, not the whole system.'],
  mirror:['Working with others matters more than working alone. Find out what the other person actually needs from you.','Someone’s feedback may sting. Take the useful part and leave the rest.'],
  quiet:['Steady work pays off more than big moves. Finish something you started.','Use the quieter pace to clear the admin you’ve been avoiding. You’ll thank yourself later.']},
 money:{
  same:['You know what you value, so let that decide what you spend on, not someone else’s idea of what you should want.','Trust your instinct about money, but sleep on anything big.'],
  ease:['It’s a sensible time to look over your spending or start a small saving habit. Easy wins add up.','Money matters feel more manageable. Open the letter you’ve been avoiding.'],
  friction:['Impulse spending is the trap. Wait a day before buying anything you didn’t plan for.','An unexpected cost might turn up. Don’t panic; adjust and carry on.'],
  mirror:['Shared money, joint plans or a loan to someone may need a straight conversation.','Look at how other people handle money, and decide what you want to copy and what you don’t.']
  ,quiet:['Nothing flashy here. The small, boring choices are the ones that build security.','Check your subscriptions and regular payments. There’s usually one you forgot about.']}
};
const DO={
 daily:{overview:'Before tonight, do one thing you’ll be glad to look back on.',love:'Send the message today rather than writing it in your head.',family:'Ring or text one person at home, even briefly.',health:'Get outside in daylight at some point today, even for ten minutes.',career:'Pick the one task that matters most and do it first.',money:'Don’t spend anything today you’d have to explain to yourself tomorrow.'},
 weekly:{overview:'Give the middle of the week to whatever matters most, and keep some of the weekend genuinely free.',love:'Plan one proper evening this week, with the phones away.',family:'Find one moment this week to sit down together without an agenda.',health:'Choose two nights this week to go to bed early, and actually do it.',career:'Write down on Monday what a good week would look like, and check it on Friday.',money:'Keep track of what you spend this week, just to see. No judgement.'},
 monthly:{overview:'At the end of the month, write yourself a few lines about what changed.',love:'Over the month, notice when you feel most yourself with someone. That’s your answer.',family:'This month, fix one small thing at home that has been bothering everyone.',health:'Build one habit this month, and keep it boring and repeatable.',career:'Set one goal for the month that you could explain in a single sentence.',money:'Put aside a small, fixed amount this month, and leave it alone.'},
 yearly:{overview:'Take the year in seasons rather than one long push: some months to build, some to rest.',love:'Over the year, choose the people who leave you calmer, not just excited.',family:'This year, put the visit in the diary instead of waiting for the right time.',health:'Picture how you want to feel a year from now, and work back from there.',career:'Decide what you want to be known for by December, and say no to what pulls you away from it.',money:'Make one decision this year that you’ll be glad of in five years’ time.'}
};
const FOCUS={
 overview:{daily:['One clear choice','Saying what you mean','Small, good decisions'],weekly:['Pacing yourself','Finishing what you started','Room to breathe'],monthly:['A fresh start','Letting go of the old','Building momentum'],yearly:['The long game','Who you are becoming','Seasons of effort and rest']},
 love:{daily:['An honest word','A small kindness','Being seen'],weekly:['Quality time','Meeting halfway','Saying what you need'],monthly:['Deeper trust','Room to grow together','Opening up'],yearly:['Choosing well','Love that lasts','Knowing your worth']},
 family:{daily:['A quick call home','Keeping the peace','Gentle patience'],weekly:['Time together','Clearing the air','Sharing a meal'],monthly:['Old patterns','Repairs at home','Roots and belonging'],yearly:['Family ties','New traditions','Where home is']},
 health:{daily:['Rest and water','Fresh air','Listening to your body'],weekly:['Sleep first','A steady rhythm','Gentle movement'],monthly:['One good habit','Recovery','Energy you can keep'],yearly:['Long-term wellbeing','Strength and balance','A kinder routine']},
 career:{daily:['Your first good hour','Speaking up','One finished task'],weekly:['Clear priorities','Asking for help','Visible progress'],monthly:['A goal you can name','New openings','Working relationships'],yearly:['Your reputation','A change of direction','Building skills']},
 money:{daily:['No impulse buys','A quick check-in','Spending with purpose'],weekly:['Watching the spending','A small saving','Plans worth paying for'],monthly:['Something set aside','Cutting a cost','Talking money through'],yearly:['Security','One wise decision','Your relationship with money']}
};
const REFLECT={
 overview:['What would make this {p} feel like a good one, honestly?','Where are you waiting for permission you don’t need?','What are you ready to stop carrying?'],
 love:['What do you wish someone knew about you right now?','Who makes it easy to be yourself?','What does being looked after actually look like for you?'],
 family:['Who at home deserves a thank-you from you?','Which family habit do you want to keep, and which would you let go?','What would make home feel lighter {P}?'],
 health:['What is your body asking for that you keep postponing?','When did you last feel properly rested?','What small thing always makes you feel better?'],
 career:['What part of your work would you do even if nobody noticed?','What are you avoiding at work, and why?','What would real progress look like by the end of {P}?'],
 money:['What do you spend on that genuinely makes your life better?','What would feeling secure actually take?','Which money worry could you settle with one phone call?']
};
const PHASE_WORDS={'New Moon':'new','Waxing Crescent':'a thin crescent, growing','First Quarter':'half lit and growing','Waxing Gibbous':'almost full','Full Moon':'full','Waning Gibbous':'just past full','Last Quarter':'half lit and fading','Waning Crescent':'a thin crescent, fading'};
const PWORD={daily:'day',weekly:'week',monthly:'month',yearly:'year'};
const WEEKDAY=d=>d.toLocaleDateString('en-GB',{weekday:'long',timeZone:'UTC'});
const ORD=n=>n+(['th','st','nd','rd'][(n%100>10&&n%100<14)?0:n%10]||'th');
const QNAME={new_moon:'the New Moon',first_quarter:'the first quarter Moon',full_moon:'the Full Moon',last_quarter:'the last quarter Moon'};

// the calendar fact the reading opens with
function opening(K,period,from,to,tz){
 const mid=new Date((+from+ +to)/2);
 if(period==='daily'){const m=K.moon(new Date(+from+12*36e5));return {text:`Today the Moon is in ${NAMES[m.sign]} and ${PHASE_WORDS[m.name]||m.name.toLowerCase()}.`,sign:m.sign}}
 if(period==='weekly'){
  const ph=K.lunarPhases(from,to)[0];
  if(ph)return {text:`This week, ${QNAME[ph.k]} arrives on ${WEEKDAY(new Date(K.ymdIn(tz,ph.date)+'T12:00:00Z'))}, in ${NAMES[ph.sign]}.`,sign:ph.sign};
  const ing=K.events(from,to).find(e=>e.k==='ingress');
  if(ing)return {text:`This week, ${ing.planet} moves into ${NAMES[ing.sign]} on ${WEEKDAY(new Date(K.ymdIn(tz,ing.date)+'T12:00:00Z'))}.`,sign:ing.sign};
  const m=K.moon(from);return {text:`The week opens with the Moon in ${NAMES[m.sign]}.`,sign:m.sign};
 }
 if(period==='monthly'){
  const ph=K.lunarPhases(from,to),nm=ph.find(e=>e.k==='new_moon'),fm=ph.find(e=>e.k==='full_moon'),day=e=>ORD(Number(K.ymdIn(tz,e.date).slice(8,10)));
  const bits=[nm&&`the New Moon falls on the ${day(nm)} in ${NAMES[nm.sign]}`,fm&&`the Full Moon on the ${day(fm)} in ${NAMES[fm.sign]}`].filter(Boolean);
  return {text:bits.length?`This month ${bits.join(' and ')}.`:`This month the Sun moves through ${NAMES[K.signIdx(K.lon('Sun',mid))]}.`,sign:(fm||nm||{sign:K.signIdx(K.lon('Sun',mid))}).sign};
 }
 const j0=K.signIdx(K.lon('Jupiter',from)),j1=K.signIdx(K.lon('Jupiter',to)),s0=K.signIdx(K.lon('Saturn',from)),s1=K.signIdx(K.lon('Saturn',to));
 const ecl=K.events(from,to).filter(e=>e.type==='eclipse').length,yr=K.ymdIn(tz,mid).slice(0,4);
 return {text:`In ${yr}, Jupiter ${j0===j1?`stays in ${NAMES[j0]}`:`moves from ${NAMES[j0]} into ${NAMES[j1]}`} and Saturn ${s0===s1?`holds steady in ${NAMES[s0]}`:`moves from ${NAMES[s0]} into ${NAMES[s1]}`}${ecl?`, with ${['','one eclipse','two eclipses','three eclipses','four eclipses','five eclipses','six eclipses'][ecl]||ecl+' eclipses'} along the way`:''}.`,sign:j1};
}

function write(K,signId,cat,period,per,tz){
 const me=SIGNS.indexOf(signId),p=PWORD[period],seed=`${signId}|${cat}|${period}|${per.key}`;
 const from=new Date(per.start+'T00:00:00Z'),to=new Date(per.end+'T23:59:59Z'),mid=new Date((+from+ +to)/2);
 const open=opening(K,period,from,to,tz);
 // the Moon changes sign every two or three days, so it is read from the period's own lunar moment; a year's
 // planets are read where they end the year, since the opening already says where they start
 const planet=PLANET[cat][period],when=period==='yearly'?to:mid;
 const pSign=planet==='Moon'?open.sign:K.signIdx(K.lon(planet,when));
 const rel=relation(me,pSign),retro=period!=='yearly'&&planet!=='Sun'&&planet!=='Moon'&&K.motion(planet,mid)<0;
 const body=[];
 // the opening fact, then the area's planet and how its sign sits with the reader's
 if(planet==='Moon')body.push(open.text.replace(/\.$/,`, ${REL_CLAUSE[rel]}.`));
 else if(period==='yearly'&&/Jupiter|Saturn/.test(planet))body.push(open.text,`${planet} ends the year in ${NAMES[pSign]}, ${REL_CLAUSE[rel]}.`);
 else{const role=PLANET_ROLE[planet];body.push(open.text,`${role.replace(/^./,c=>c.toUpperCase())}${role.includes(',')?',':''} ${period==='yearly'?'ends the year':'is'} in ${NAMES[pSign]}${retro?' and moving backwards for now':''}, ${REL_CLAUSE[rel]}.`)}
 const lines=LINES[cat][rel],first=hash(seed)%lines.length;
 body.push(lines[first]);
 if(period==='monthly'||period==='yearly')body.push(lines[(first+1)%lines.length]);
 const [s,w]=VOICE[signId]||VOICE.aries;
 body.push(pick(TRAIT,seed+'t')(s,w,p));
 body.push(DO[period][cat]);
 const rels=['same','ease','friction','mirror','quiet'];
 const f=FOCUS[cat][period];
 return {
  body:body.join(' '),
  focus:f[(rels.indexOf(rel)+hash(seed+'f'))%f.length],
  reflection:pick(REFLECT[cat],seed+'r').replace('this {p}',p==='day'?'today':'this '+p).replace('{p}',p).replace('{P}',p==='day'?'today':'this '+p),
  rel,planet,element:EL(me)
 };
}
G.KosmiaForecast={write};
})(typeof globalThis!=='undefined'?globalThis:window);
