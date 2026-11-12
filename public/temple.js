/* The Temple of Kosmia: the one shell every place sits in. A painted scene for the place (a head, a plain calm middle that
   gives way on a short phone, and a foot), a fine gold frame drawn once, and the five moons of Today's header. The scene
   is held still behind the page; its foot is laid over the page's end so what scrolls under it disappears into the art. */
window.Temple=(()=>{
 const A='/art/temple/';
 // t: where the head's art ends, f: where the foot's art begins (as shares of the painting's height); tone: the colour of the words
 const SC={dawn:{t:.20,f:.70,c:'221,163,93',tone:'ink'},lake:{t:.20,f:.62,c:'18,26,44'},candle:{t:.14,f:.58,c:'20,24,36'},sky:{t:.22,f:.68,c:'16,24,42'},oracle:{t:.26,f:.60,c:'23,28,44'},journal:{t:.24,f:.57,c:'30,32,40'},you:{t:.24,f:.60,c:'20,32,50'},letter:{t:.22,f:.76,c:'220,166,85',tone:'ink'}};
 let back,front,cur='',arcEl,arcHtml='';
 const $=(t,c)=>{const e=document.createElement(t);e.className=c;return e};
 function build(){
  if(back)return;
  back=$('div','');back.id='t-back';back.setAttribute('aria-hidden','true');back.append($('i','tb-head'),$('i','tb-mid'),$('i','tb-mid2'),$('i','tb-foot'),$('i','tb-veil'));arcEl=$('div','');arcEl.id='t-arc';arcEl.setAttribute('aria-hidden','true');back.append(arcEl);
  front=$('div','');front.id='t-front';front.setAttribute('aria-hidden','true');front.append($('i','tf-veil'),$('i','tf-frt'),$('i','tf-frb'));
  document.body.prepend(back,front);
  addEventListener('resize',()=>{layout();fit()},{passive:true});addEventListener('scroll',fit,{passive:true});
 }
 function layout(){
  const s=SC[cur];if(!s||!back)return;
  const W=back.clientWidth||390,H=innerHeight,IH=W*1968/912,k=Math.min(1,Math.max(0,(H-IH*.83)/(IH*.17)));
  // the painting is never squeezed or stretched: its head and foot keep their own proportions; the plain calm between them
  // is cropped from its middle on a short screen, and only widened (it is plain) on a tall one
  const e=.96+.04*k,head=s.t*IH,foot=(e-s.f)*IH,mid=Math.max(0,H-head-foot),nat=(s.f-s.t)*IH,img=`url(${A}${cur}.webp)`;
  const set=(el,o)=>Object.assign(el.style,o);
  const [bh,bm,bm2,ff,bv]=back.children,[fv,ft,fb]=front.children;
  set(bh,{height:head+1+'px',backgroundImage:img,backgroundSize:`${W}px ${IH}px`,backgroundPosition:'0 0'});
  if(mid<=nat){const h1=Math.ceil(mid/2),h2=mid-h1;
   set(bm,{top:head+'px',height:h1+110+'px',backgroundImage:img,backgroundSize:`${W}px ${IH}px`,backgroundPosition:`0 ${-s.t*IH}px`});
   set(bm2,{top:head+h1+'px',height:h2+2+'px',display:'block',webkitMaskImage:'linear-gradient(transparent,#000 100px)',maskImage:'linear-gradient(transparent,#000 100px)',backgroundImage:img,backgroundSize:`${W}px ${IH}px`,backgroundPosition:`0 ${-(s.f*IH-h2)}px`})}
  else{const ms=mid/(s.f-s.t);bm.style.maskImage=bm.style.webkitMaskImage='none';
   set(bm,{top:head+'px',height:mid+2+'px',backgroundImage:img,backgroundSize:`${W}px ${ms}px`,backgroundPosition:`0 ${-s.t*ms}px`});bm2.style.display='none'}
  set(ff,{height:foot+'px',backgroundImage:img,backgroundSize:`${W}px ${IH}px`,backgroundPosition:`0 ${-s.f*IH}px`});
  back.style.backgroundColor=`rgb(${s.c})`;
  set(bv,{height:foot+'px',background:`linear-gradient(rgba(${s.c},0),rgba(${s.c},.9) ${Math.min(120,foot*.5)}px)`});
  set(fv,{height:'138px',backgroundImage:img,backgroundSize:`${W}px ${IH}px`,backgroundPosition:`0 ${-(s.f*IH+foot-138)}px`});
  const fs=W/390,fi=`url(${A}frame.webp)`,FW=W,FH=1968*W/912;
  // the frame drawn a little larger than the screen, so its gold line runs closer to the edges and leaves the page more room
  const z=1.035,ox=-(z-1)/2*FW,oy=10*fs;
  set(ft,{height:H-128*fs+'px',backgroundImage:fi,backgroundSize:`${FW*z}px ${FH*z}px`,backgroundPosition:`${ox}px ${-oy}px`});
  set(fb,{height:130*fs+'px',backgroundImage:fi,backgroundSize:`${FW*z}px ${FH*z}px`,backgroundPosition:`${ox}px calc(100% + ${oy}px)`});
  document.documentElement.style.setProperty('--t-foot',foot+'px');
 }
 // where the page's words end against the foot of the painting: while they run over it, the art stands back so they read
 // Today's page is never scrolled: if its words are more than the room between the head and the menu, they are set a little smaller
 function fitStage(){
  const h=document.querySelector('#app .home.hpath .hhero')||document.querySelector('#app .skyp .sk-body');if(!h)return;
  const kids=h.classList.contains('hhero')?[h.querySelector('.hp-stage')]:[...h.children];if(!kids[0])return;
  kids.forEach(k=>k.style.zoom='');let z=1;while(h.scrollHeight>h.clientHeight+1&&z>.8){z-=.03;kids.forEach(k=>k.style.zoom=z.toFixed(2))}
 }
 function fit(){fitStage();
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
  arcEl.innerHTML=document.querySelector('#app .home.hpath')?arcHtml:'';
 }
 function off(){if(arcEl)arcEl.innerHTML='';document.body.classList.remove('tp');delete document.body.dataset.tone;delete document.body.dataset.scene}
 // Today's header, held still behind the page: one great moon on a rounded arc of fine gold, with its ornaments. The moon
 // fills with light as the day's four steps are done and is whole when the day is. (The steps themselves are the dots.)
 const CX=195,CY=172,MY=102,MD=90,SY=27;
 const pt=(r,t,cy=CY)=>{const a=t*Math.PI/180;return [CX+r*Math.sin(a),cy-r*Math.cos(a)]};
 const arcP=(r,t,cy=CY,dn=0)=>{const a=t*Math.PI/180,x0=CX-r*Math.sin(a),x1=CX+r*Math.sin(a),y=dn?cy+r*Math.cos(a):cy-r*Math.cos(a);return `M${x0.toFixed(1)} ${y.toFixed(1)}A${r} ${r} 0 0 ${dn?0:1} ${x1.toFixed(1)} ${y.toFixed(1)}`};
 const spark=(x,y,r)=>`<path d="M${x} ${y-r}L${x+r*.2} ${y-r*.2}L${x+r} ${y}L${x+r*.2} ${y+r*.2}L${x} ${y+r}L${x-r*.2} ${y+r*.2}L${x-r} ${y}L${x-r*.2} ${y-r*.2}Z" fill="#F4DDA2" stroke="none"/>`;
 const dot=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#F0D79B" stroke="none"/>`;
 // a great compass star: long rays at the four quarters, shorter between, hairlines beyond
 const star=(x,y,R)=>{const ray=(deg,L,w)=>{const a=deg*Math.PI/180,c=Math.cos(a),n=Math.sin(a),px=c*w,py=n*w;return `M${(x+n*L).toFixed(1)} ${(y-c*L).toFixed(1)}L${(x+px).toFixed(1)} ${(y+py).toFixed(1)}L${(x-px).toFixed(1)} ${(y-py).toFixed(1)}Z`};
  const long=[0,90,180,270].map(d=>ray(d,R,R*.075)).join(''),mid=[45,135,225,315].map(d=>ray(d,R*.66,R*.06)).join(''),fine=[22.5,67.5,112.5,157.5,202.5,247.5,292.5,337.5].map(d=>ray(d,R*.42,R*.035)).join('');
  return `<g fill="#F4DDA2" stroke="none"><path d="${long}${mid}${fine}"/></g><circle cx="${x}" cy="${y}" r="${R*.09}" fill="#FFF3CF" stroke="none"/>`};
 function orn(){
  const ticks=Array.from({length:21},(_,i)=>{const t=(i-10)*6.4,a=t*Math.PI/180,L=i%5===0?6:3,r0=150;return `<path d="M${CX+r0*Math.sin(a)} ${CY-r0*Math.cos(a)}L${CX+(r0+L)*Math.sin(a)} ${CY-(r0+L)*Math.cos(a)}"/>`}).join('');
  const dots=Array.from({length:17},(_,i)=>{const [x,y]=pt(140,(i-8)*7.6);return dot(x,y,.8)}).join('');
  const sp=[[-62,150,5],[62,150,5],[-74,126,3],[74,126,3]].map(([t,r,z])=>{const [x,y]=pt(r,t);return spark(x,y,z)}).join('');
  const sm=[[-40,112],[40,112],[-52,98],[52,98]].map(([t,r])=>{const [x,y]=pt(r,t);return dot(x,y,1.3)}).join('');
  return `<svg class="tm-orn" viewBox="0 0 390 190" fill="none" stroke="#E6C887" stroke-linecap="round" aria-hidden="true"><g opacity=".75"><path d="${arcP(150,68)}" stroke-width=".9"/><path d="${arcP(132,62)}" stroke-width=".6"/><path d="${arcP(158,58)}" stroke-width=".5" opacity=".7"/><path d="${arcP(122,56)}" stroke-width="1" stroke-dasharray=".1 4.5"/><g stroke-width=".7" opacity=".8">${ticks}</g><path d="${arcP(58,60,MY,1)}" stroke-width=".9"/><path d="${arcP(65,52,MY,1)}" stroke-width="1" stroke-dasharray=".1 4"/></g>${star(CX,SY,24)}<g opacity=".95">${sp}${sm}${dots}${spark(CX,MY+62,3)}</g></svg>`;
 }
 // the moon as it waxes with the day: new, crescent, half, gibbous, full as the four steps are done (lit on the right)
 function arc(steps,whole){
  const n=whole?4:steps.filter(x=>x.on).length,u=v=>(v/3.9).toFixed(3)+'cqw';
  const st=`left:${u(CX-MD/2)};top:${u(MY-MD/2)};width:${u(MD)};height:${u(MD)}`;
  const rx=[0,.56,0,.56][n%4]*48,sw=n===3?1:0,lit=n>=4?'<circle cx="50" cy="50" r="49" fill="#fff"/>':n?`<path d="M50 2A48 48 0 0 1 50 98A${rx} 48 0 0 ${sw} 50 2Z" fill="#fff"/>`:'';
  arcHtml=`<div class="tm-arc">${orn()}<span class="tm-mo${n>=4?' on':''}" style="${st}" role="img" aria-label="The day's moon, ${n} of 4 steps lit"><svg viewBox="0 0 100 100"><defs><filter id="tmb" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.1"/></filter><mask id="tmm"><g filter="url(#tmb)">${lit}</g></mask></defs><image href="${A}moon-base.webp" width="100" height="100"/><image href="${A}moon-full.webp" width="100" height="100" mask="url(#tmm)" class="lit"/></svg></span></div>`;
  return '';
 }
 return {set,off,layout,fit,arc,SC};
})();
