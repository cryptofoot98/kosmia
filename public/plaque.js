/* Writing fields and action buttons shaped like an antique label: a peak at the top and bottom centre, notched corners and rounded sides, drawn as a recess pressed into the page (no outline). Each field gets an SVG sized to it
   exactly, so the corners never stretch; it is set as --plaque and used as the field's background in styles.css. */
(function(){
'use strict';
const FIELDS='input[type=text],input[type=email],input[type=password],input[type=date],input[type=time],input[type=number],input[type=search],textarea,select,.btn';
const cache=new Map();
const f=n=>Math.round(n*10)/10;
function path(w,h){
 // d: depth of the centre peak, q: corner notch radius, b: how far each side bulges out, c: half-width of the peak's shoulders
 const big=h>72,d=big?9:7,q=big?11:8,b=big?16:12,c=Math.min(big?44:34,w*.11);
 const m=w/2,T=d,Bt=h-d,X1=b,X2=w-b,k=b*4/3;
 return [`M${f(m)} 0`,
  `Q${f(m+c*.3)} ${T} ${f(m+c)} ${T}`,`H${f(X2-q)}`,                          // right shoulder of the top peak
  `A${q} ${q} 0 0 0 ${f(X2)} ${f(T+q)}`,                                        // concave notch
  `C${f(X2+k)} ${f(T+q)} ${f(X2+k)} ${f(Bt-q)} ${f(X2)} ${f(Bt-q)}`,             // rounded side bulge
  `A${q} ${q} 0 0 0 ${f(X2-q)} ${f(Bt)}`,`H${f(m+c)}`,`Q${f(m+c*.3)} ${f(Bt)} ${f(m)} ${h}`,
  `Q${f(m-c*.3)} ${f(Bt)} ${f(m-c)} ${f(Bt)}`,`H${f(X1+q)}`,
  `A${q} ${q} 0 0 0 ${f(X1)} ${f(Bt-q)}`,
  `C${f(X1-k)} ${f(Bt-q)} ${f(X1-k)} ${f(T+q)} ${f(X1)} ${f(T+q)}`,
  `A${q} ${q} 0 0 0 ${f(X1+q)} ${T}`,`H${f(m-c)}`,`Q${f(m-c*.3)} ${T} ${f(m)} 0Z`].join('');
}
// deep: primary buttons sit a little lower and darker than fields and secondary buttons
function svg(w,h,deep){
 const k=w+'x'+h+(deep?'d':'');
 if(!cache.has(k)){
  const p=path(w,h);
  cache.set(k,`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">${deep?'<stop offset="0" stop-color="#C4AC80"/><stop offset=".45" stop-color="#D3BF98"/><stop offset="1" stop-color="#DECDAB"/>':'<stop offset="0" stop-color="#D6C29C"/><stop offset=".4" stop-color="#E6D7B8"/><stop offset="1" stop-color="#EEE3CB"/>'}</linearGradient><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feFlood flood-color="#3E2C1A" flood-opacity=".62"/><feComposite in2="SourceAlpha" operator="out"/><feGaussianBlur stdDeviation="3.4"/><feOffset dy="2.6"/><feComposite in2="SourceAlpha" operator="in" result="sh"/><feFlood flood-color="#FFF9EC" flood-opacity=".85"/><feComposite in2="SourceAlpha" operator="out"/><feGaussianBlur stdDeviation="1.1"/><feOffset dy="-1.5"/><feComposite in2="SourceAlpha" operator="in" result="hi"/><feMerge><feMergeNode in="hi"/><feMergeNode in="sh"/></feMerge></filter></defs><path d="${p}" fill="url(#g)"/><path d="${p}" filter="url(#s)"/></svg>`)}")`);
 }
 return cache.get(k);
}
function shape(el){
 const w=el.offsetWidth,h=el.offsetHeight,deep=el.classList.contains('btn')&&!el.classList.contains('ghost'),k=w+'x'+h+deep;
 if(!w||!h||el._pq===k)return;
 el._pq=k;el.style.setProperty('--plaque',svg(w,h,deep));
}
const ro=new ResizeObserver(es=>es.forEach(e=>shape(e.target)));
const scan=()=>document.querySelectorAll(FIELDS).forEach(el=>{if(!el._pqo){el._pqo=1;ro.observe(el)}shape(el)});
new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',scan);
})();
