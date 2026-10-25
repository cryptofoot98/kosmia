/* Kosmia cloud sync: Supabase auth (email magic link) and per-user storage.
   When config.js has no Supabase keys the app runs local-only and every call here is a no-op. */
(function(){
'use strict';
const cfg=window.KOSMIA_CONFIG||{}, lib=window.supabase;
const sb=(cfg.supabaseUrl&&cfg.supabaseAnonKey&&lib&&lib.createClient)
 ?lib.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})
 :null;
let user=null;
const listeners=[], errListeners=[];
const fail=e=>{console.error('[kosmia cloud]',e);errListeners.forEach(f=>f(e))};
const check=({data,error})=>{if(error)throw error;return data};
const bg=p=>p.catch(fail);

const Cloud={
 enabled:!!sb,
 get user(){return user},
 onAuth(fn){listeners.push(fn)},
 onError(fn){errListeners.push(fn)},
 async init(){
  if(!sb)return null;
  const {data}=await sb.auth.getSession();
  user=data.session?data.session.user:null;
  sb.auth.onAuthStateChange((ev,session)=>{
   const prev=user&&user.id;user=session?session.user:null;
   if((user&&user.id)!==prev)setTimeout(()=>listeners.forEach(f=>f(user)),0);
  });
  return user;
 },
 async sendLink(email,sign){
  if(!sb)return;
  check(await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+'/',data:{sign}}}));
 },
 async signOut(){if(sb)await sb.auth.signOut();user=null},
 async pull(){
  const uid=user.id;
  const [p,f,m,r]=await Promise.all([
   sb.from('profiles').select('*').eq('id',uid).maybeSingle(),
   sb.from('fortunes').select('day,card_id,saved,note').eq('user_id',uid),
   sb.from('matches').select('sign_a,sign_b').eq('user_id',uid).order('created_at'),
   sb.from('tarot_readings').select('id,day,spread,question,cards').eq('user_id',uid).order('created_at')
  ]);
  return {profile:check(p),fortunes:check(f),matches:check(m),readings:check(r)};
 },
 saveProfile(p){
  if(!user)return Promise.resolve();
  return bg(sb.from('profiles').upsert({id:user.id,email:user.email,sign:p.sign||null,name:p.name||'',intro_seen:!!p.intro,notif:p.notif}).then(check));
 },
 saveFortune(day,cardId,saved,note){
  if(!user)return Promise.resolve();
  return bg(sb.from('fortunes').upsert({user_id:user.id,day,card_id:cardId,saved:!!saved,note:note||''}).then(check));
 },
 saveMatch(a,b){
  if(!user)return Promise.resolve();
  return bg(sb.from('matches').upsert({user_id:user.id,sign_a:a,sign_b:b},{onConflict:'user_id,sign_a,sign_b',ignoreDuplicates:true}).then(check));
 },
 // Resolves to the stored row id (or null when not signed in / on failure).
 saveReading(r){
  if(!user)return Promise.resolve(null);
  return sb.from('tarot_readings').insert({user_id:user.id,day:r.date,spread:r.spread,question:r.q||'',cards:r.cards}).select('id').single()
   .then(check).then(d=>d.id).catch(e=>{fail(e);return null});
 }
};
window.KosmiaCloud=Cloud;
})();
