/* Writing fields drawn as the title banner: a white ribbon with rolled ends, the crest above and the ornament below.
   art/field/ holds the banner cut into a 5 x 3 grid (l, m, c, n, r columns; t, m, b rows). Only the plain runs between
   the ornaments stretch, so the crest, the curls and the rolls keep their proportions at any field size. */
(function(){
'use strict';
const FIELDS='input[type=text],input[type=email],input[type=password],input[type=date],input[type=time],input[type=number],input[type=search],textarea,select';
// piece sizes in the artwork (240 px tall), drawn at S so a single-line field is 84 px tall
const P={L:61,C:216,T:92,B:74},S=84/240;
const CHEVRON=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 9'%3E%3Cpath d='M1 1.5l6 6 6-6' fill='none' stroke='%238B6A3E' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E")`;
function layers(w,h,select){
 const L=Math.round(P.L*S),C=Math.round(P.C*S),T=Math.round(P.T*S),B=Math.round(P.B*S);
 const M=Math.max(0,(w-2*L-C)/2),mid=Math.max(0,h-T-B);
 const cols=[['l',0,L],['m',L,M],['c',L+M,C],['n',L+M+C,M],['r',w-L,L]];
 const rows=[['t',0,T],['m',T,mid],['b',h-B,B]];
 const img=[],pos=[],size=[];
 if(select){img.push(CHEVRON);pos.push(`${w-L-10}px 50%`);size.push('12px 8px')}
 // each piece overlaps its neighbour by a pixel so no seam shows between them
 for(const [c,x,cw] of cols)for(const [r,y,rh] of rows){
  if(!cw||!rh)continue;
  img.push(`url(/art/field/${c}${r}.webp)`);pos.push(`${Math.floor(x)}px ${Math.floor(y)}px`);size.push(`${Math.ceil(cw)+1}px ${Math.ceil(rh)+1}px`);
 }
 return {img:img.join(','),pos:pos.join(','),size:size.join(',')};
}
function shape(el){
 const w=el.offsetWidth,h=el.offsetHeight;
 if(!w||!h||el._pq===w+'x'+h)return;
 el._pq=w+'x'+h;
 const l=layers(w,h,el.tagName==='SELECT');
 el.style.backgroundImage=l.img;el.style.backgroundPosition=l.pos;el.style.backgroundSize=l.size;el.style.backgroundRepeat='no-repeat';
}
const ro=new ResizeObserver(es=>es.forEach(e=>shape(e.target)));
const scan=()=>document.querySelectorAll(FIELDS).forEach(el=>{if(!el._pqo){el._pqo=1;ro.observe(el)}shape(el)});
new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',scan);
})();
