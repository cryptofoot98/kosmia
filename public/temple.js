/* The Temple of Kosmia: the one shell every place sits in. A painted scene for the place (a head, a plain calm middle that
   gives way on a short phone, and a foot), a fine gold frame drawn once, and the five moons of Today's header. The scene
   is held still behind the page; its foot is laid over the page's end so what scrolls under it disappears into the art. */
window.Temple=(()=>{
 const A='/art/temple/';
 // t: where the head's art ends, f: where the foot's art begins (as shares of the painting's height); tone: the colour of the words
 const SC={dawn:{t:.20,f:.70,c:'221,163,93',tone:'ink'},lake:{t:.20,f:.62,c:'18,26,44'},candle:{t:.14,f:.58,c:'20,24,36'},sky:{t:.22,f:.68,c:'16,24,42'},oracle:{t:.26,f:.60,c:'23,28,44'},journal:{t:.24,f:.57,c:'30,32,40'},you:{t:.24,f:.60,c:'20,32,50'},letter:{t:.22,f:.76,c:'220,166,85',tone:'ink'}};
 let back,front,cur='';
 const $=(t,c)=>{const e=document.createElement(t);e.className=c;return e};
 function build(){
  if(back)return;
  back=$('div','');back.id='t-back';back.setAttribute('aria-hidden','true');back.append($('i','tb-head'),$('i','tb-mid'),$('i','tb-foot'),$('i','tb-veil'));
  front=$('div','');front.id='t-front';front.setAttribute('aria-hidden','true');front.append($('i','tf-veil'),$('i','tf-frt'),$('i','tf-frb'));
  document.body.prepend(back,front);
  addEventListener('resize',()=>{layout();fit()},{passive:true});addEventListener('scroll',fit,{passive:true});
 }
 function layout(){
  const s=SC[cur];if(!s||!back)return;
  const W=back.clientWidth||390,H=innerHeight,IH0=W*1968/912,k=Math.min(1,Math.max(0,(H-IH0*.83)/(IH0*.17)));
  const v=.85+.15*k,e=.96+.04*k,IH=IH0*v,head=s.t*IH,foot=(e-s.f)*IH,mid=Math.max(0,H-head-foot),ms=mid/(s.f-s.t),img=`url(${A}${cur}.webp)`;
  const set=(el,o)=>Object.assign(el.style,o);
  const [bh,bm,ff,bv]=back.children,[fv,ft,fb]=front.children;
  set(bh,{height:head+1+'px',backgroundImage:img,backgroundSize:`${W}px ${IH}px`,backgroundPosition:'0 0'});
  set(bm,{top:head+'px',height:mid+2+'px',backgroundImage:img,backgroundSize:`${W}px ${ms}px`,backgroundPosition:`0 ${-s.t*ms}px`});
  set(ff,{height:foot+'px',backgroundImage:img,backgroundSize:`${W}px ${IH}px`,backgroundPosition:`0 ${-s.f*IH}px`});
  back.style.backgroundColor=`rgb(${s.c})`;
  set(bv,{height:foot+'px',background:`linear-gradient(rgba(${s.c},0),rgba(${s.c},.9) ${Math.min(120,foot*.5)}px)`});
  set(fv,{height:'138px',backgroundImage:img,backgroundSize:`${W}px ${IH}px`,backgroundPosition:`0 ${-(s.f*IH+foot-138)}px`});
  const fs=W/390,fi=`url(${A}frame.webp)`,FW=W,FH=1968*W/912;
  set(ft,{height:H-128*fs+'px',backgroundImage:fi,backgroundSize:`${FW}px ${FH}px`,backgroundPosition:'0 0'});
  set(fb,{height:130*fs+'px',backgroundImage:fi,backgroundSize:`${FW}px ${FH}px`,backgroundPosition:'0 100%'});
  document.documentElement.style.setProperty('--t-foot',foot+'px');
 }
 // where the page's words end against the foot of the painting: while they run over it, the art stands back so they read
 function fit(){
  if(!back||!cur)return;const pg=document.getElementById('app')?.firstElementChild;if(!pg)return;
  const foot=parseFloat(document.documentElement.style.getPropertyValue('--t-foot'))||0;
  back.classList.toggle('dim',pg.getBoundingClientRect().bottom>innerHeight-foot+6);
  back.classList.toggle('scrolled',scrollY>140);
 }
 // the scene behind the page; tone is the colour of the words over it
 function set(name){
  if(!SC[name])return;build();
  document.body.classList.add('tp');document.body.dataset.tone=SC[name].tone||'gld';document.body.dataset.scene=name;
  if(cur!==name){cur=name;layout()}else if(!back.children[0].style.backgroundImage)layout();
  requestAnimationFrame(fit);setTimeout(fit,500);
 }
 function off(){document.body.classList.remove('tp');delete document.body.dataset.tone;delete document.body.dataset.scene}
 // the five moons of Today's header on their rounded arc, with the fine arcs beneath: the four steps in order and the day's
 // full moon in the middle, lit when the day is whole. steps: [{k, label, on, cur}], whole: bool
 const CX=195,CY=172,RR=120,SL=[[-54,30,'crescent',0],[-28,38,'quarter',0],[0,52,'full',0],[28,38,'quarter',1],[54,30,'crescent',1]];
 const pt=(r,t)=>{const a=t*Math.PI/180;return [CX+r*Math.sin(a),CY-r*Math.cos(a)]};
 const arcP=(r,t)=>{const a=t*Math.PI/180;return `M${CX-r*Math.sin(a)} ${CY-r*Math.cos(a)}A${r} ${r} 0 0 1 ${CX+r*Math.sin(a)} ${CY-r*Math.cos(a)}`};
 const spark=(x,y,r)=>`<path d="M${x} ${y-r}L${x+r*.28} ${y-r*.28}L${x+r} ${y}L${x+r*.28} ${y+r*.28}L${x} ${y+r}L${x-r*.28} ${y+r*.28}L${x-r} ${y}L${x-r*.28} ${y-r*.28}Z" fill="#F0D79B"/>`;
 function orn(){
  const ticks=Array.from({length:23},(_,i)=>{const t=(i-11)*6,a=t*Math.PI/180,L=i%5===1?7:3.5,r0=150;return `<path d="M${CX+r0*Math.sin(a)} ${CY-r0*Math.cos(a)}L${CX+(r0+L)*Math.sin(a)} ${CY-(r0+L)*Math.cos(a)}"/>`}).join('');
  const [lx,ly]=pt(150,-66),[rx,ry]=pt(150,66);
  return `<svg class="tm-orn" viewBox="0 0 390 190" fill="none" stroke="#E6C887" stroke-linecap="round" aria-hidden="true"><g opacity=".55"><path d="${arcP(150,66)}" stroke-width=".7"/><g stroke-width=".7" opacity=".8">${ticks}</g><path d="${arcP(88,50)}" stroke-width="1" stroke-dasharray=".1 5"/><path d="${arcP(74,42)}" stroke-width=".6" opacity=".8"/></g><g opacity=".9">${spark(lx,ly,4.5)}${spark(rx,ry,4.5)}${spark(CX,CY-150,3.6)}${spark(CX,CY-74,3)}</g></svg>`;
 }
 function arc(steps,whole){
  const items=SL.map(([a,d,p,f],i)=>{
   const [x,y]=pt(RR,a),slot=i===2?null:steps[i<2?i:i-1],on=i===2?whole:slot.on,c=slot&&slot.cur;
   const st=`left:${((x-d/2)/3.9).toFixed(3)}cqw;top:${((y-d/2)/3.9).toFixed(3)}cqw;width:${(d/3.9).toFixed(3)}cqw;height:${(d/3.9).toFixed(3)}cqw`;
   const im=`<img src="${A}moon-base.webp" alt=""><img class="lit" src="${A}moon-${p}.webp" alt="">`,cl=`tm-mo${on?' on':''}${c?' cur':''}${f?' flip':''}`;
   return slot?`<button class="${cl}" style="${st}" data-act="hgo" data-k="${slot.k}" aria-label="${slot.label}${on?', done':''}"${c?' aria-current="step"':''}>${im}</button>`
    :`<span class="${cl}" style="${st}" role="img" aria-label="The day${on?', whole':''}">${im}</span>`}).join('');
  return `<div class="tm-arc">${orn()}${items}</div>`;
 }
 return {set,off,layout,fit,arc,SC};
})();
