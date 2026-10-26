/* Writing fields shaped like an antique label plaque: rounded corner lobes, pointed side tabs and a soft cusp at the
   top and bottom centre, drawn as a recess pressed into the page (no outline). Each field gets an SVG sized to it
   exactly, so the corners never stretch; it is set as --plaque and used as the field's background in styles.css. */
(function(){
'use strict';
const FIELDS='input[type=text],input[type=email],input[type=password],input[type=date],input[type=time],input[type=number],input[type=search],textarea,select';
const cache=new Map();
const f=n=>Math.round(n*10)/10;
function path(w,h){
 const big=h>72,r=big?17:Math.min(13,h*.24),n=big?10:8,c=Math.min(big?54:42,w*.13),d=big?8:6,s=big?4:2.5;
 const m=w/2,L=n,R=w-n;
 return [`M${f(m)} ${d}`,
  `C${f(m+c*.18)} ${f(d*.15)} ${f(m+c*.55)} 0 ${f(m+c)} 0`,`H${f(R-r)}`,`A${r} ${r} 0 0 1 ${f(R)} ${f(r)}`,          // top edge, top-right lobe
  `Q${f(R)} ${f(r+n)} ${w} ${f(r+n)}`,`Q${f(w-s)} ${f(h/2)} ${w} ${f(h-r-n)}`,            // side tab, gently hollow side
  `Q${f(R)} ${f(h-r-n)} ${f(R)} ${f(h-r)}`,`A${r} ${r} 0 0 1 ${f(R-r)} ${h}`,             // bottom-right lobe
  `H${f(m+c)}`,`C${f(m+c*.55)} ${h} ${f(m+c*.18)} ${f(h-d*.15)} ${f(m)} ${f(h-d)}`,`C${f(m-c*.18)} ${f(h-d*.15)} ${f(m-c*.55)} ${h} ${f(m-c)} ${h}`, // bottom cusp
  `H${f(L+r)}`,`A${r} ${r} 0 0 1 ${f(L)} ${f(h-r)}`,`Q${f(L)} ${f(h-r-n)} 0 ${f(h-r-n)}`,
  `Q${s} ${f(h/2)} 0 ${f(r+n)}`,`Q${f(L)} ${f(r+n)} ${f(L)} ${f(r)}`,`A${r} ${r} 0 0 1 ${f(L+r)} 0`,
  `H${f(m-c)}`,`C${f(m-c*.55)} 0 ${f(m-c*.18)} ${f(d*.15)} ${f(m)} ${d}Z`].join('');
}
function svg(w,h){
 const k=w+'x'+h;
 if(!cache.has(k)){
  const p=path(w,h);
  cache.set(k,`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D6C29C"/><stop offset=".4" stop-color="#E6D7B8"/><stop offset="1" stop-color="#EEE3CB"/></linearGradient><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feFlood flood-color="#3E2C1A" flood-opacity=".62"/><feComposite in2="SourceAlpha" operator="out"/><feGaussianBlur stdDeviation="3.4"/><feOffset dy="2.6"/><feComposite in2="SourceAlpha" operator="in" result="sh"/><feFlood flood-color="#FFF9EC" flood-opacity=".85"/><feComposite in2="SourceAlpha" operator="out"/><feGaussianBlur stdDeviation="1.1"/><feOffset dy="-1.5"/><feComposite in2="SourceAlpha" operator="in" result="hi"/><feMerge><feMergeNode in="hi"/><feMergeNode in="sh"/></feMerge></filter></defs><path d="${p}" fill="url(#g)"/><path d="${p}" filter="url(#s)"/></svg>`)}")`);
 }
 return cache.get(k);
}
function shape(el){
 const w=el.offsetWidth,h=el.offsetHeight;
 if(!w||!h||el._pq===w+'x'+h)return;
 el._pq=w+'x'+h;el.style.setProperty('--plaque',svg(w,h));
}
const ro=new ResizeObserver(es=>es.forEach(e=>shape(e.target)));
const scan=()=>document.querySelectorAll(FIELDS).forEach(el=>{if(!el._pqo){el._pqo=1;ro.observe(el)}shape(el)});
new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',scan);
})();
