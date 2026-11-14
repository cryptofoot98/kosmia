/* Kosmia numerology: Pythagorean method, shown step by step so every number can be checked by hand.
   Reduction keeps the master numbers 11, 22 and 33 unless a step says otherwise. */
(function(G){
'use strict';
const MASTER=[11,22,33];
const digits=n=>String(n).split('').map(Number);
const sum=a=>a.reduce((x,y)=>x+y,0);
// reduce to one digit, keeping master numbers; returns the number and the chain of sums, e.g. [29, 11]
function reduce(n,keep=true){const chain=[n];while(n>9&&!(keep&&MASTER.includes(n))){n=sum(digits(n));chain.push(n)}return {n,chain}}
// Pythagorean letter values: A J S = 1, B K T = 2 … I R = 9
const VALUE={};'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c,i)=>VALUE[c]=i%9+1);
const TABLE=[1,2,3,4,5,6,7,8,9].map(v=>[v,Object.keys(VALUE).filter(c=>VALUE[c]===v)]);
// letters only, accents folded (É -> E), so hyphens, apostrophes and spaces are ignored
const clean=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/ß/g,'SS').replace(/[^A-Z ]/g,' ').replace(/\s+/g,' ').trim();
const VOWELS='AEIOU';
/* Y is a vowel when it carries a word's vowel sound, read here as: no other vowel sits beside it (Lynn, Yvette, Mary)
   or it ends the word after a consonant. Pass yMode 'vowel' or 'consonant' to fix it either way. */
function isVowel(word,i,yMode){
 const c=word[i];if(VOWELS.includes(c))return true;if(c!=='Y')return false;
 if(yMode==='vowel')return true;if(yMode==='consonant')return false;
 const prev=word[i-1],next=word[i+1],v=x=>x&&VOWELS.includes(x);
 if(v(prev)||v(next))return false;
 return true;
}
function letters(name,yMode='auto'){
 const out=[];clean(name).split(' ').filter(Boolean).forEach((w,wi)=>w.split('').forEach((c,i)=>out.push({c,v:VALUE[c],vowel:isVowel(w,i,yMode),word:w,wi})));
 return out;
}
// each word reduced on its own, then the words added and reduced (the usual method, which lets master numbers appear)
function byWords(ls,filter){
 const parts=groupWords(ls).map(w=>{const vals=w.filter(filter).map(l=>l.v);return {word:w.map(l=>l.c).join(''),vals,total:sum(vals),r:reduce(sum(vals))}}).filter(p=>p.vals.length);
 const total=sum(parts.map(p=>p.r.n));
 return {parts,total,r:reduce(total)};
}
const groupWords=ls=>{const g=[];ls.forEach(l=>(g[l.wi]=g[l.wi]||[]).push(l));return g.filter(Boolean)};
function name(nm,yMode){
 const ls=letters(nm,yMode);
 return {letters:ls,expression:byWords(ls,()=>true),soul:byWords(ls,l=>l.vowel),personality:byWords(ls,l=>!l.vowel)};
}
// Life Path: month, day and year each reduced, then added and reduced
function lifePath(ymd){
 const [y,m,d]=ymd.split('-').map(Number);
 const R={month:reduce(m),day:reduce(d),year:reduce(sum(digits(y)))};R.year.from=y;R.year.chain.unshift(y);
 const total=R.month.n+R.day.n+R.year.n;
 return {y,m,d,parts:R,total,r:reduce(total)};
}
const birthday=ymd=>reduce(Number(ymd.slice(8,10)));
// Personal Year = birth month + birth day + the calendar year; Personal Month adds the month, Personal Day the day
function personalYear(ymd,year){const [,m,d]=ymd.split('-').map(Number);const t=reduce(m,false).n+reduce(d,false).n+reduce(sum(digits(year)),false).n;return {year,total:t,r:reduce(t,false)}}
function personalMonth(ymd,year,month){const py=personalYear(ymd,year).r.n,t=py+reduce(month,false).n;return {py,month,total:t,r:reduce(t,false)}}
function personalDay(ymd,year,month,day){const pm=personalMonth(ymd,year,month).r.n,t=pm+reduce(day,false).n;return {pm,day,total:t,r:reduce(t,false)}}
const universalYear=year=>reduce(sum(digits(year)),false);
/* Pinnacles and Challenges: four life periods. The first ends at age 36 minus the Life Path (reduced to one digit),
   the next two last nine years each, the fourth runs for the rest of life. */
function pinnacles(ymd){
 const L=lifePath(ymd),m=reduce(L.m,false).n,d=reduce(L.d,false).n,y=reduce(sum(digits(L.y)),false).n,lp=reduce(L.r.n,false).n;
 const P=[reduce(m+d),reduce(d+y),null,reduce(m+y)];P[2]=reduce(P[0].n+P[1].n);
 const C=[Math.abs(m-d),Math.abs(d-y)];C.push(Math.abs(C[0]-C[1]));C.push(Math.abs(m-y));
 const end1=36-lp;
 return [0,1,2,3].map(i=>({p:P[i].n,c:C[i],from:i===0?0:end1+1+(i-1)*9,to:i===3?null:end1+i*9}));
}

const MEANING={
 1:['The Initiator','independence, beginnings, will','A one asks you to stand on your own feet and begin. Its gift is courage and originality; its lesson is that leading does not require going it alone.'],
 2:['The Diplomat','partnership, sensitivity, patience','A two listens. It works through cooperation, timing and tact, and notices what others miss. Its lesson is to keep a voice of its own inside the harmony it creates.'],
 3:['The Storyteller','expression, joy, creativity','A three wants to make and to share: words, colour, laughter. Its gift is lightness that lifts others; its lesson is focus, so the spark becomes a lasting flame.'],
 4:['The Builder','structure, steadiness, work','A four lays foundations. It values order, effort and reliability, and gets things done. Its lesson is to let the walls it builds keep shelter in, not life out.'],
 5:['The Traveller','freedom, change, curiosity','A five learns by moving: places, ideas, experiences. Its gift is adaptability; its lesson is that freedom is fullest when it is chosen, not merely escaped into.'],
 6:['The Guardian','care, home, responsibility','A six tends. It is drawn to family, beauty and service, and makes others feel held. Its lesson is that caring for yourself is part of caring well for others.'],
 7:['The Seeker','reflection, wisdom, solitude','A seven asks why. It needs quiet, study and inner life to feel whole. Its gift is depth and discernment; its lesson is trust, letting others in.'],
 8:['The Steward','ambition, power, abundance','An eight works with the material world: resources, authority, results. Its gift is capability; its lesson is to measure success by what it serves as well as what it gains.'],
 9:['The Humanitarian','compassion, completion, vision','A nine sees the whole. It gives generously and carries a wide, forgiving view of people. Its lesson is endings: knowing when something is complete, and letting it go.'],
 11:['The Illuminator','intuition, inspiration, sensitivity','Eleven is a master number: a two with its sensitivity turned up. It brings intuition and the capacity to inspire, along with nervous intensity. Its lesson is grounding the vision.'],
 22:['The Master Builder','vision made real, large-scale purpose','Twenty-two is a master number: a four with a horizon. It can turn great ideas into lasting structures. Its lesson is patience with the scale of its own ambition.'],
 33:['The Master Teacher','compassionate service, healing, devotion','Thirty-three is a master number: a six that gives on a wide scale. It is drawn to uplift and to teach through example. Its lesson is not to lose itself in giving.']
};
// themes for Personal Years, Months and Days (one to nine)
const CYCLE={
 1:'a year of beginnings: plant seeds, start fresh, take the first step',2:'a year of patience and partnership: let things grow, cooperate, listen',3:'a year of expression: create, connect, enjoy, speak up',
 4:'a year of foundations: work steadily, organise, build what lasts',5:'a year of change: travel, experiment, loosen what is too tight',6:'a year of home and care: family, responsibility, love, beauty',
 7:'a year of reflection: study, rest, look inward, trust your own counsel',8:'a year of harvest and effort: ambition, money matters, recognition',9:'a year of completion: finish, forgive, clear space for what comes next'
};
// the traditional number families: 1-5-7, 2-4-8 and 3-6-9 are said to understand one another most easily
const FAMILY=[[1,5,7],[2,4,8],[3,6,9]];
const root=n=>reduce(n,false).n;
function resonance(a,b){
 const x=root(a),y=root(b);
 if(a===b)return {kind:'same',text:'You share this number, so you meet the world in much the same way. Familiar ground, and the same blind spots.'};
 if(FAMILY.some(f=>f.includes(x)&&f.includes(y)))return {kind:'family',text:'Your numbers belong to the same traditional family, so this tends to feel natural: similar needs, different accents.'};
 if(Math.abs(x-y)===1||Math.abs(x-y)===8)return {kind:'neighbour',text:'Neighbouring numbers: close enough to understand each other, different enough to bring something new.'};
 return {kind:'contrast',text:'Contrasting numbers: you approach this part of life differently, which can feel like friction or like completion, depending on how curious you both are.'};
}
G.KosmiaNumbers={reduce,VALUE,TABLE,clean,letters,name,lifePath,birthday,personalYear,personalMonth,personalDay,universalYear,pinnacles,MEANING,CYCLE,FAMILY,resonance,root};
})(globalThis);
