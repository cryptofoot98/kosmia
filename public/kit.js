/* Kosmia's visual kit: the pieces every screen is composed from, as small functions that return HTML. The look lives in
   styles.css (design tokens at the top, the kit's rules at the foot); the screens in app.js compose these, and bespoke
   compositions stay free to use plain markup beside them. A gallery of every piece is at /kit.html.

   Scene system (CelestialScene): three layers in one stacking context
     background   a painted scene, cropped to cover, optionally veiled for legibility, optionally drifting (parallax)
     content      real, interactive HTML on parchment
     foreground   transparent illustrations placed from an anchor; they overlap the content and never take a tap */
window.Kit=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const SIZES=window.KOSMIA_SIZES||{};
 const size=path=>SIZES[path]||null;

 // a painting from /art: its width and height are written in, so its space is held before it arrives (no layout shift);
 // the first painting a screen shows is fetched at once (priority), the rest when they near the screen. Without alt
 // text an image is decorative and screen readers pass over it.
 function img(path,o={}){
  const z=size(path),a=[`src="/art/${path}.webp"`];
  if(o.cls)a.unshift(`class="${o.cls}"`);
  if(z)a.push(`width="${z[0]}" height="${z[1]}"`);
  a.push(`alt="${esc(o.alt||'')}"`);
  a.push(o.priority?'loading="eager" fetchpriority="high"':'loading="lazy" decoding="async"');
  return `<img ${a.join(' ')}>`;
 }
 const ratio=path=>{const z=size(path);return z?`${z[0]}/${z[1]}`:''};

 // ForegroundIllustration: a transparent painting placed in a scene. Anchor it with any of left/right/top/bottom (CSS
 // lengths, usually percentages of the scene) and size it with w (a share of the scene's width). layer "under" sits
 // between the background and the content; the default sits over the content.
 function fg(path,o={}){
  const v=[['--w',o.w],['--l',o.left],['--r',o.right],['--t',o.top],['--b',o.bottom]].filter(x=>x[1]!=null).map(([k,x])=>`${k}:${x}`).join(';');
  return `<span class="ks-fg${o.layer==='under'?' under':''}${o.cls?' '+o.cls:''}" style="${v}" ${o.alt?'':'aria-hidden="true"'}>${img(path,{alt:o.alt})}</span>`;
 }

 const STARS=`<i class="stars s1" aria-hidden="true"></i><i class="stars s2" aria-hidden="true"></i>`;
 /* CelestialScene.
    bg        a painting path ('atlas/hero-libra'); bgPos its focal point ('50% 0'); bgCls extra classes for the layer
    ratio     the scene's shape ('3/4'); by default the background's own, so nothing jumps while it loads
    veil      true for the standard top shade, or any CSS background (a gradient) for a bespoke one
    parallax  the background drifts more slowly than the page; stars adds the twinkling sky
    priority  fetch the background at once (the first thing on a screen)
    fg        foreground paintings: [{path, w, left, right, top, bottom, layer, alt}]
    content   the interactive HTML; bare puts it in the scene as is (for layouts that place their own children)
    pinned    the background stays put while the content scrolls over it */
 function scene(o={}){
  const r=o.ratio||(o.bg&&!o.pinned?ratio(o.bg):''),flow=o.bg&&!r&&!o.pinned;
  const veil=o.veil?`<i class="ks-veil"${typeof o.veil==='string'?` style="--veil:${esc(o.veil)}"`:''}></i>`:'';
  const bg=o.bg?`<div class="ks-bg${flow?' flow':''}${o.bgCls?' '+o.bgCls:''}"${o.bgPos?` style="--bg-pos:${o.bgPos}"`:''}>${img(o.bg,{cls:[o.imgCls,o.parallax?'parallax':''].filter(Boolean).join(' '),alt:o.bgAlt,priority:o.priority})}${veil}</div>`:'';
  const fgs=(o.fg||[]).map(f=>fg(f.path,f));
  const under=fgs.filter((_,i)=>o.fg[i].layer==='under').join(''),over=fgs.filter((_,i)=>o.fg[i].layer!=='under').join('');
  const body=o.bare?(o.content||''):`<div class="ks-content">${o.content||''}</div>`;
  const tag=o.tag||'section',cls=['kscene',o.cls,r?'ratio':'',o.pinned?'pinned':''].filter(Boolean).join(' ');
  const label=o.label?` aria-label="${esc(o.label)}"`:'';
  return `<${tag} class="${cls}"${r?` style="--ratio:${r}"`:''}${label}${o.attrs?' '+o.attrs:''}>${bg}${o.stars?STARS:''}${under}${body}${over}</${tag}>`;
 }

 // ParchmentPanel: frame "" (a plain gold-ruled panel), "ornate" (flourishes at two corners) or "gilt" (inner rule and
 // flourishes at all four)
 const panel=(html,o={})=>`<${o.tag||'section'} class="${['card',o.frame,o.cls].filter(Boolean).join(' ')}"${o.label?` aria-label="${esc(o.label)}"`:''}>${html}</${o.tag||'section'}>`;

 // OrnamentalFrame around artwork: shape "rect", "arch" or "circle"; corners adds gold flourishes outside it
 const frame=(inner,o={})=>`<span class="${['k-frame',o.shape&&o.shape!=='rect'?o.shape:'',o.corners?'corners':'',o.cls].filter(Boolean).join(' ')}"><span class="kf-in">${inner}</span></span>`;

 // engraved icons: fine gold-and-ink linework drawn as SVG, coloured by the text colour
 const P={
 // the engraved sun: sixteen rays, long and short in turn, around a face
 sun:(()=>{let r='';for(let i=0;i<16;i++){const a=i*Math.PI/8,l=i%2?7.6:10.4,f=(v,k)=>(12+Math.cos(a)*v).toFixed(2)+' '+(12+Math.sin(a)*v).toFixed(2);r+=`M${f(5.4)}L${f(l)}`}
  return `<circle cx="12" cy="12" r="4.4" fill="currentColor" fill-opacity=".14"/><path d="${r}" stroke-width="1.1"/><path d="M10.3 11.3h.01M13.7 11.3h.01" stroke-width="1.3"/><path d="M10.7 13.6q1.3.8 2.6 0M12 11.4v1.2" stroke-width=".7"/>`})(),
  moon:'<path d="M15.6 3.2a8.8 8.8 0 1 0 5.2 15.1A7.2 7.2 0 0 1 15.6 3.2z"/><path d="M13.4 5.6a7 7 0 0 0 1.6 12" stroke-width=".6"/>',
  tarot:'<rect x="5.5" y="2.8" width="13" height="18.4" rx="1.6"/><rect x="7.6" y="4.9" width="8.8" height="14.2" rx=".7" stroke-width=".7"/><path d="M12 8.2l.9 2.9 2.9.9-2.9.9-.9 2.9-.9-2.9-2.9-.9 2.9-.9z" stroke-width=".9"/>',
  compass:'<path d="M12 1.6l1.3 8 3.9-2.9-2.8 3.9 8 1.4-8 1.3 2.8 3.9-3.9-2.8-1.3 8-1.4-8-3.9 2.8 2.9-3.9-8-1.3 8-1.4-2.9-3.9 3.9 2.9z" fill="currentColor" fill-opacity=".14"/><circle cx="12" cy="12" r="1.3"/>',
  kassandra:'<circle cx="12" cy="12" r="9.2"/><path d="M12 2.8a9.2 9.2 0 0 1 0 18.4 3.6 9.2 0 0 1 0-18.4z" fill="currentColor" stroke="none"/><path d="M7.6 6.8l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5z" fill="currentColor" stroke="none"/><path d="M5.6 13.6q1.6 1.4 3.4.4" stroke-width=".8"/>',
  star:'<path d="M12 3l1.4 7.6L21 12l-7.6 1.4L12 21l-1.4-7.6L3 12l7.6-1.4z" fill="currentColor" stroke="none"/>',
  arrow:'<path d="M4 12h15M14 7l5 5-5 5"/>',
 };
 const icon=(name,o={})=>`<svg class="k-ico${o.cls?' '+o.cls:''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"${o.label?` role="img" aria-label="${esc(o.label)}"`:' aria-hidden="true"'}>${P[name]||P.star}</svg>`;

 // CelestialDivider: fine gold rules with a star, and an optional label between them
 const divider=(label='')=>`<div class="k-div" role="separator">${label?`<span>${esc(label)}</span>`:icon('star')}</div>`;

 // IllustratedSectionHeader: an engraved star, the title in spaced capitals, and an optional "See all" at the right
 const heading=(title,more='')=>`<div class="orn"><h2>${icon('star')}<span>${title}</span></h2>${more}</div>`;

 // AntiquePillButton: variant "" (dark leather), "ghost", "gold" or "light"; size "sm"; arrow adds the trailing arrow
 const pill=(label,o={})=>`<button class="${['btn',o.variant,o.size,o.cls].filter(Boolean).join(' ')}"${o.attrs?' '+o.attrs:''}>${label}${o.arrow?icon('arrow',{cls:'k-arr'}):''}</button>`;

 // TarotCardDisplay: a painting in a gilt card frame, its numeral above and its name on a plate below (live text)
 const tarot=(o={})=>`<span class="k-tarot${o.cls?' '+o.cls:''}"${o.w?` style="--w:${o.w}"`:''}${o.alt?` role="img" aria-label="${esc(o.alt)}"`:''}><span class="kt-art">${o.art?img(o.art):''}</span>${o.num?`<span class="kt-num">${esc(o.num)}</span>`:''}${o.name?`<span class="kt-name">${esc(o.name)}</span>`:''}</span>`;

 // CosmicEventCard: the event's painting, its name, date and a few words, as one button
 const event=(o={})=>`<button class="evc"${o.attrs?' '+o.attrs:''}>${o.art||''}<strong>${o.title}</strong><span class="evc-d">${o.date||''}</span>${o.note?`<span class="evc-k">${esc(o.note)}</span>`:''}</button>`;

 // IllustratedFeatureCard: a painting above, the name and a line below; dark for the night-sky tiles; ar the art's shape
 const feature=(o={})=>`<button class="k-feat${o.dark?' dark':''}${o.cls?' '+o.cls:''}"${o.attrs?' '+o.attrs:''}><span class="kft-art"${o.ar?` style="--ar:${o.ar}"`:''}>${o.art?img(o.art):''}</span><strong>${o.title}</strong>${o.sub?`<span>${o.sub}</span>`:''}</button>`;

 // KosmiaBottomNavigation: the five destinations with their engraved icons; the current one is marked for assistive tech
 const NAVI={home:'sun',horoscope:'moon',tarot:'tarot',discover:'compass',kassandra:'kassandra'};
 const nav=(items,current)=>items.map(it=>`<button data-nav="${it.key}"${it.key===current?' aria-current="page"':''}>${icon(NAVI[it.key]||'star',{cls:'nav-ico'})}<span>${esc(it.label)}</span></button>`).join('');

 // KosmiaPage: a landing (a scene with a parchment sheet risen over it) or a plain page with its own header
 const page=(o={})=>o.scene?`<div class="land${o.cls?' '+o.cls:''}">${o.scene}<div class="sheet">${o.body||''}</div></div>`:`<div class="sub${o.cls?' '+o.cls:''}">${o.header||''}${o.body||''}</div>`;

 return {esc,img,size,ratio,fg,scene,panel,frame,icon,divider,heading,pill,tarot,event,feature,nav,page,STARS};
})();
