/* Kosmia sky: ephemeris calculations shared by the app (browser) and the Netlify functions (node). Built on
   astronomy-engine (globalThis.Astronomy); every longitude is geocentric, on the true ecliptic of date. Only facts live
   here; the app adds the astrological interpretations. Dates are JS Dates (UTC instants) unless a name says "ymd". */
(function(G){
'use strict';
const A=()=>G.Astronomy;
const DAY=864e5;
const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const PLANETS=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const GLYPH={Sun:'☉︎',Moon:'☽︎',Mercury:'☿︎',Venus:'♀︎',Mars:'♂︎',Jupiter:'♃︎',Saturn:'♄︎',Uranus:'♅︎',Neptune:'♆︎',Pluto:'♇︎',Ascendant:'AC',Midheaven:'MC'};
const norm=x=>((x%360)+360)%360;
const wrap=x=>{x=norm(x);return x>180?x-360:x};
const signIdx=l=>Math.floor(norm(l)/30);

function lon(name,d){
 const a=A();
 if(name==='Sun')return a.SunPosition(d).elon;
 if(name==='Moon')return a.EclipticGeoMoon(d).lon;
 return a.Ecliptic(a.GeoVector(a.Body[name],d,true)).elon;
}
// apparent daily motion in degrees (negative = retrograde)
const motion=(name,d)=>wrap(lon(name,new Date(+d+DAY/4))-lon(name,new Date(+d-DAY/4)))*2;
function positions(d){
 return PLANETS.map(n=>{const l=lon(n,d);return {n,g:GLYPH[n],lon:l,sign:signIdx(l),deg:norm(l)%30,retro:n!=='Sun'&&n!=='Moon'&&motion(n,d)<0}});
}
// first instant in (t0,t1] where test() becomes true, to within a minute
function bisect(test,t0,t1){for(let i=0;i<40&&t1-t0>6e4;i++){const m=(t0+t1)/2;if(test(m))t1=m;else t0=m}return new Date(t1)}

/* ---------- the Moon ---------- */
const PHASES=[[22.5,'New Moon'],[67.5,'Waxing Crescent'],[112.5,'First Quarter'],[157.5,'Waxing Gibbous'],[202.5,'Full Moon'],[247.5,'Waning Gibbous'],[292.5,'Last Quarter'],[337.5,'Waning Crescent'],[360.1,'New Moon']];
function moon(d){
 const a=A(),ang=a.MoonPhase(d),l=lon('Moon',d);
 return {name:PHASES.find(x=>ang<x[0])[1],ill:a.Illumination(a.Body.Moon,d).phase_fraction,ang,waxing:ang<180,lon:l,sign:signIdx(l)};
}
// the Moon's next change of sign after d
function moonIngress(d){
 const s=signIdx(lon('Moon',d));let t=+d;
 while(signIdx(lon('Moon',new Date(t+2*3600e3)))===s)t+=2*3600e3;
 const at=bisect(m=>signIdx(lon('Moon',new Date(m)))!==s,t,t+2*3600e3);
 return {date:at,sign:signIdx(lon('Moon',new Date(+at+6e4)))};
}
const QUARTERS=[['new_moon','New Moon'],['first_quarter','First Quarter Moon'],['full_moon','Full Moon'],['last_quarter','Last Quarter Moon']];
function lunarPhases(from,to){
 const a=A(),out=[];let q=a.SearchMoonQuarter(from);
 while(q.time.date<=to){const d=q.time.date;out.push({k:QUARTERS[q.quarter][0],type:'moon',name:QUARTERS[q.quarter][1],date:d,sign:signIdx(lon('Moon',d))});q=a.NextMoonQuarter(q)}
 return out;
}

/* ---------- planets over time: sign ingresses, retrograde stations, conjunctions ---------- */
const MOVERS=['Sun','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const CONJ=['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'];
const sampleCache=new Map();
// daily longitudes at 00:00 UTC from `from` (inclusive) for `days` days, cached by day
function samples(name,from,days){
 const t0=Math.floor(+from/DAY)*DAY,key=name+t0+':'+days;
 if(sampleCache.size>400)sampleCache.clear();
 if(!sampleCache.has(key)){const a=[];for(let i=0;i<=days;i++)a.push(lon(name,new Date(t0+i*DAY)));sampleCache.set(key,{t0,a})}
 return sampleCache.get(key);
}
function planetEvents(from,to){
 const days=Math.ceil((to-from)/DAY)+1,out=[];
 for(const n of MOVERS){
  const {t0,a}=samples(n,from,days);
  for(let i=0;i<days;i++){
   const s0=signIdx(a[i]),s1=signIdx(a[i+1]);
   if(s0!==s1){const d=bisect(m=>signIdx(lon(n,new Date(m)))!==s0,t0+i*DAY,t0+(i+1)*DAY);
    out.push({k:'ingress',type:n==='Sun'?'season':'ingress',planet:n,name:`${n} enters ${SIGN_NAMES[s1]}`,date:d,sign:s1,from:s0,retro:wrap(a[i+1]-a[i])<0})}
   if(n!=='Sun'&&i>0){
    const m0=wrap(a[i]-a[i-1]),m1=wrap(a[i+1]-a[i]);
    if((m0<0)!==(m1<0)){const goingRetro=m1<0,d=bisect(m=>goingRetro?motion(n,new Date(m))<0:motion(n,new Date(m))>=0,t0+(i-1)*DAY,t0+(i+1)*DAY);
     out.push({k:goingRetro?'station_retro':'station_direct',type:'retrograde',planet:n,name:`${n} stations ${goingRetro?'retrograde':'direct'}`,date:d,sign:signIdx(lon(n,d))})}
   }
  }
 }
 for(let x=0;x<CONJ.length;x++)for(let y=x+1;y<CONJ.length;y++){
  const P=CONJ[x],Q=CONJ[y],sp=samples(P,from,days),sq=samples(Q,from,days);
  for(let i=0;i<days;i++){
   const d0=wrap(sp.a[i]-sq.a[i]),d1=wrap(sp.a[i+1]-sq.a[i+1]);
   if((d0<0)!==(d1<0)&&Math.abs(d0)<20&&Math.abs(d1)<20){
    const d=bisect(m=>(wrap(lon(P,new Date(m))-lon(Q,new Date(m)))<0)!==(d0<0),sp.t0+i*DAY,sp.t0+(i+1)*DAY);
    const a=A(),sep=a.AngleBetween(a.GeoVector(a.Body[P],d,true),a.GeoVector(a.Body[Q],d,true));
    out.push({k:'conjunction',type:'conjunction',planet:P,planet2:Q,name:`${P}–${Q} conjunction`,date:d,sign:signIdx(lon(P,d)),sep});
   }
  }
 }
 return out.filter(e=>e.date>=from&&e.date<=to);
}
// retrograde windows overlapping [from,to]: each {planet,start,end} (start or end may be null when outside the search)
function retrogrades(from,to){
 const back=new Date(+from-200*DAY),ev=planetEvents(back,to).filter(e=>e.type==='retrograde').sort((a,b)=>a.date-b.date),out=[];
 for(const n of MOVERS.slice(1)){
  const st=ev.filter(e=>e.planet===n);let open=motion(n,back)<0?{planet:n,start:null}:null;
  for(const e of st){
   if(e.k==='station_retro')open={planet:n,start:e.date,sign:e.sign};
   else if(open){open.end=e.date;open.endSign=e.sign;out.push(open);open=null}
  }
  if(open){open.end=null;out.push(open)}
 }
 return out.filter(w=>(!w.end||w.end>=from)&&(!w.start||w.start<=to)).sort((a,b)=>(a.start||back)-(b.start||back));
}

/* ---------- other astronomical events ---------- */
// major annual meteor showers, approximate peak nights from the International Meteor Organization calendar
const SHOWERS=[['Quadrantids',0,3,110,'asteroid 2003 EH1'],['Lyrids',3,22,18,'Comet Thatcher'],['Eta Aquariids',4,6,50,'Comet Halley'],['Southern Delta Aquariids',6,30,25,'Comet 96P/Machholz'],['Perseids',7,12,100,'Comet Swift–Tuttle'],['Orionids',9,21,20,'Comet Halley'],['Leonids',10,17,15,'Comet Tempel–Tuttle'],['Geminids',11,14,150,'asteroid 3200 Phaethon'],['Ursids',11,22,10,'Comet 8P/Tuttle']];
function skyEvents(from,to){
 const a=A(),out=[];
 for(let y=from.getUTCFullYear();y<=to.getUTCFullYear();y++){
  const s=a.Seasons(y);
  [[s.mar_equinox,'equinox','March Equinox'],[s.jun_solstice,'solstice','June Solstice'],[s.sep_equinox,'equinox','September Equinox'],[s.dec_solstice,'solstice','December Solstice']]
   .forEach(([t,k,name])=>out.push({k,type:'season',name,date:t.date}));
  SHOWERS.forEach(([name,mo,dd,zhr,parent])=>out.push({k:'meteor',type:'meteor',name:name+' meteor shower peak',date:new Date(Date.UTC(y,mo,dd,12)),dateOnly:true,approx:true,zhr,parent}));
 }
 try{let e=a.SearchLunarEclipse(from);while(e.peak.date<=to){out.push({k:'lunar_eclipse',type:'eclipse',name:cap(e.kind)+' Lunar Eclipse',kind:e.kind,date:e.peak.date,sign:signIdx(lon('Moon',e.peak.date))});e=a.NextLunarEclipse(e.peak)}}catch(x){}
 try{let e=a.SearchGlobalSolarEclipse(from);while(e.peak.date<=to){out.push({k:'solar_eclipse',type:'eclipse',name:cap(e.kind)+' Solar Eclipse',kind:e.kind,date:e.peak.date,sign:signIdx(lon('Sun',e.peak.date))});e=a.NextGlobalSolarEclipse(e.peak)}}catch(x){}
 for(const n of ['Mars','Jupiter','Saturn','Uranus','Neptune']){
  try{let t=a.SearchRelativeLongitude(a.Body[n],0,from);while(t.date<=to){out.push({k:'opposition',type:'planet',planet:n,name:`${n} at opposition`,date:t.date,sign:signIdx(lon(n,t.date))});t=a.SearchRelativeLongitude(a.Body[n],0,new Date(+t.date+30*DAY))}}catch(x){}
 }
 for(const n of ['Mercury','Venus']){
  try{let t=new Date(from);for(let i=0;i<8;i++){const e=a.SearchMaxElongation(a.Body[n],t);if(e.time.date>to)break;out.push({k:'elongation',type:'planet',planet:n,name:`${n} at greatest ${e.visibility} elongation`,date:e.time.date,elong:e.elongation,visibility:e.visibility});t=new Date(+e.time.date+10*DAY)}}catch(x){}
 }
 try{let p=a.SearchPlanetApsis(a.Body.Earth,from);while(p.time.date<=to){out.push({k:p.kind===0?'perihelion':'aphelion',type:'planet',name:p.kind===0?'Earth at perihelion':'Earth at aphelion',date:p.time.date,au:p.dist_au});p=a.NextPlanetApsis(a.Body.Earth,p)}}catch(x){}
 return out.filter(e=>e.date>=from&&e.date<=to);
}
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
// everything between two instants, in time order (Moon sign changes excluded: they happen every two to three days)
const evCache=new Map();
function events(from,to){
 const key=Math.floor(+from/36e5)+':'+Math.floor(+to/36e5);
 if(evCache.size>60)evCache.clear();
 if(!evCache.has(key))evCache.set(key,[...lunarPhases(from,to),...planetEvents(from,to),...skyEvents(from,to)].sort((a,b)=>a.date-b.date));
 return evCache.get(key);
}

/* ---------- natal charts ---------- */
const ASPECTS=[['conjunction',0,'☌'],['sextile',60,'⚹'],['square',90,'□'],['trine',120,'△'],['opposition',180,'☍']];
const ORB={natal:{conjunction:8,sextile:4,square:6,trine:6,opposition:8},synastry:{conjunction:6,sextile:3,square:5,trine:5,opposition:6}};
function aspectBetween(l1,l2,orbs){
 const d=Math.abs(wrap(l1-l2));
 for(const [n,ang,g] of ASPECTS){const o=Math.abs(d-ang);if(o<=orbs[n])return {n,g,orb:o}}
 return null;
}
function aspects(listA,listB,mode='natal'){
 const same=!listB,B=listB||listA,out=[];
 listA.forEach((p,i)=>B.forEach((q,j)=>{if(same&&j<=i)return;const a=aspectBetween(p.lon,q.lon,ORB[mode]);if(a)out.push(Object.assign({a:p,b:q},a))}));
 return out.sort((x,y)=>x.orb-y.orb);
}
const obliquity=d=>23.439291-0.0130042*((+d/DAY+2440587.5-2451545)/36525);
// Ascendant and Midheaven from local sidereal time and latitude
function angles(d,lat,lonE){
 const e=obliquity(d)*Math.PI/180,ramc=norm(A().SiderealTime(d)*15+lonE)*Math.PI/180,phi=lat*Math.PI/180;
 const asc=norm(Math.atan2(Math.cos(ramc),-(Math.sin(ramc)*Math.cos(e)+Math.tan(phi)*Math.sin(e)))*180/Math.PI);
 const mc=norm(Math.atan2(Math.sin(ramc),Math.cos(ramc)*Math.cos(e))*180/Math.PI);
 return {asc,mc};
}
/* b = {date:'YYYY-MM-DD', time:'HH:MM'|'', unk:boolean, lat, lon, tz}. With no birth time the planets are taken at local
   noon and the Ascendant, Midheaven and houses are left out; the Moon is flagged when it changes sign during that day. */
function chart(b){
 const known=!b.unk&&!!b.time&&b.lat!==''&&b.lat!=null&&b.lon!==''&&b.lon!=null;
 const utc=localToUtc(b.date,b.unk||!b.time?'12:00':b.time,b.tz||'UTC');
 const pl=positions(utc);let ang=null,moonRange=null;
 if(known){ang=angles(utc,Number(b.lat),Number(b.lon));pl.forEach(p=>p.house=(signIdx(p.lon)-signIdx(ang.asc)+12)%12+1)}
 if(b.unk||!b.time){const m0=signIdx(lon('Moon',localToUtc(b.date,'00:00',b.tz||'UTC'))),m1=signIdx(lon('Moon',localToUtc(b.date,'23:59',b.tz||'UTC')));if(m0!==m1)moonRange=[m0,m1]}
 const pts=ang?pl.concat([{n:'Ascendant',g:'AC',lon:ang.asc,sign:signIdx(ang.asc),deg:ang.asc%30},{n:'Midheaven',g:'MC',lon:ang.mc,sign:signIdx(ang.mc),deg:ang.mc%30}]):pl;
 return {utc,known,pl,ang,moonRange,asp:aspects(pts,null,'natal').filter(a=>!(a.a.n==='Ascendant'&&a.b.n==='Midheaven'))};
}

/* ---------- time zones and calendar periods ---------- */
// minutes east of UTC for an IANA zone at an instant (historical rules come from the runtime's tz database)
function tzOffset(tz,d){
 const p={};new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(d).forEach(x=>p[x.type]=x.value);
 return Math.round((Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute,+p.second)-Math.floor(+d/1000)*1000)/6e4);
}
function localToUtc(ymd,hm,tz){
 const [y,mo,d]=ymd.split('-').map(Number),[h,mi]=hm.split(':').map(Number),guess=Date.UTC(y,mo-1,d,h,mi);
 let t=guess-tzOffset(tz,new Date(guess))*6e4;t=guess-tzOffset(tz,new Date(t))*6e4;
 return new Date(t);
}
const ymdIn=(tz,d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const ymdUTC=t=>new Date(t).toISOString().slice(0,10);
const parseYmd=s=>{const [y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d)};
function isoWeek(ymd){const t=parseYmd(ymd),wd=(new Date(t).getUTCDay()+6)%7,thu=t+(3-wd)*DAY,y=new Date(thu).getUTCFullYear(),w=1+Math.floor((thu-Date.UTC(y,0,1))/DAY/7);return {y,w,mon:ymdUTC(t-wd*DAY)}}
/* Rollover rules, all in the reader's own time zone: a day runs midnight to midnight, a week Monday to Sunday (ISO weeks),
   a month and a year by the calendar. Returns the period's key and its first and last dates. */
function period(p,tz,now=new Date()){
 const ymd=ymdIn(tz,now);
 if(p==='daily')return {key:ymd,start:ymd,end:ymd};
 if(p==='weekly'){const w=isoWeek(ymd);return {key:`${w.y}-W${String(w.w).padStart(2,'0')}`,start:w.mon,end:ymdUTC(parseYmd(w.mon)+6*DAY)}}
 if(p==='monthly'){const [y,m]=ymd.split('-').map(Number);return {key:ymd.slice(0,7),start:ymd.slice(0,7)+'-01',end:ymdUTC(Date.UTC(y,m,0))}}
 return {key:ymd.slice(0,4),start:ymd.slice(0,4)+'-01-01',end:ymd.slice(0,4)+'-12-31'};
}
function periodFromKey(p,key){
 if(p==='daily'&&/^\d{4}-\d\d-\d\d$/.test(key))return {key,start:key,end:key};
 if(p==='weekly'&&/^\d{4}-W\d\d$/.test(key)){const [y,w]=key.split('-W').map(Number),jan4=Date.UTC(y,0,4),mon=jan4-((new Date(jan4).getUTCDay()+6)%7)*DAY+(w-1)*7*DAY;return {key,start:ymdUTC(mon),end:ymdUTC(mon+6*DAY)}}
 if(p==='monthly'&&/^\d{4}-\d\d$/.test(key)){const [y,m]=key.split('-').map(Number);return {key,start:key+'-01',end:ymdUTC(Date.UTC(y,m,0))}}
 if(p==='yearly'&&/^\d{4}$/.test(key))return {key,start:key+'-01-01',end:key+'-12-31'};
 return null;
}
// keys that are "current" somewhere on Earth right now (UTC-12 to UTC+14), for validating requests on the server
function liveKeys(p,now=new Date()){const s=new Set();for(let h=-12;h<=14;h++)s.add(period(p,'UTC',new Date(+now+h*36e5)).key);return s}

/* ---------- a factual summary of the sky over a period (used to ground AI writing) ---------- */
function summary(startYmd,endYmd){
 const from=new Date(parseYmd(startYmd)),to=new Date(parseYmd(endYmd)+DAY-1),mid=new Date((+from+ +to)/2);
 const pos=positions(new Date(+from+DAY/2)),m=moon(new Date(+from+DAY/2));
 const lines=[`Positions at the start: ${pos.map(p=>`${p.n} ${Math.floor(p.deg)}° ${SIGN_NAMES[p.sign]}${p.retro?' (retrograde)':''}`).join(', ')}.`,`Moon phase at the start: ${m.name}, ${Math.round(m.ill*100)}% lit.`];
 const ev=events(from,to).filter(e=>e.type!=='meteor'||to-from<40*DAY);
 const pick=ev.filter(e=>['moon','eclipse','retrograde','ingress','season','conjunction'].includes(e.type)).slice(0,to-from>200*DAY?30:14);
 if(pick.length)lines.push('Events in the period: '+pick.map(e=>`${e.name}${e.sign!=null&&e.type!=='ingress'&&e.type!=='season'?' in '+SIGN_NAMES[e.sign]:''} (${ymdUTC(+e.date)})`).join('; ')+'.');
 const rx=retrogrades(from,to);if(rx.length)lines.push('Retrograde during the period: '+rx.map(w=>`${w.planet}${w.start?' from '+ymdUTC(+w.start):''}${w.end?' to '+ymdUTC(+w.end):''}`).join('; ')+'.');
 return lines.join('\n');
}

G.KosmiaSky={SIGN_NAMES,PLANETS,GLYPH,norm,wrap,signIdx,lon,motion,positions,moon,moonIngress,lunarPhases,planetEvents,retrogrades,skyEvents,events,SHOWERS,ASPECTS,aspects,aspectBetween,angles,chart,tzOffset,localToUtc,ymdIn,isoWeek,period,periodFromKey,liveKeys,summary,parseYmd,ymdUTC};
})(globalThis);
