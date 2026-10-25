/* Kosmia cloud sync: Supabase auth (email + password) and per-user storage.
   When config.js has no Supabase keys the app runs local-only and every call here is a no-op. */
(function(){
'use strict';
const cfg=window.KOSMIA_CONFIG||{}, lib=window.supabase;
// Read before the client consumes the URL: a password-reset link lands with type=recovery in the hash.
const recovering=/type=recovery/.test(location.hash);
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
 recovering,
 get user(){return user},
 // True when a saved session is in this browser, so the app can open on home instead of onboarding.
 hasStoredSession(){try{return !!sb&&Object.keys(localStorage).some(k=>/^sb-.+-auth-token$/.test(k))}catch(e){return false}},
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
 // Email confirmation is off for this project (supabase/config.toml), so sign-up signs the user in.
 async signUp(email,password,sign){
  return check(await sb.auth.signUp({email,password,options:{data:{sign}}}));
 },
 async signIn(email,password){return check(await sb.auth.signInWithPassword({email,password}))},
 async resetPassword(email){check(await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/'}))},
 async updatePassword(password){check(await sb.auth.updateUser({password}))},
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
 },
 // AI endpoints (Netlify functions). They hold the OpenAI / ElevenLabs keys and
 // accept the signed-in user's token; errors carry the server's message and status.
 async api(path,body){
  const {data}=await sb.auth.getSession(),t=data.session&&data.session.access_token;
  if(!t)throw Object.assign(new Error('Sign in first'),{status:401});
  const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+t},body:JSON.stringify(body)});
  if(!r.ok){let m='';try{m=(await r.json()).error}catch(e){}throw Object.assign(new Error(m||'Request failed ('+r.status+')'),{status:r.status})}
  return r;
 },
 paint(day,cardId,sign){return Cloud.api('/api/paint',{day,cardId,sign}).then(r=>r.json())},
 speak(text){return Cloud.api('/api/speak',{text}).then(r=>r.blob())},
 // Asks the server to paint today's card artwork; resolves {ready} or {pending} (someone else is painting it).
 cardArt(day,card){return Cloud.api('/api/card-art',{day,card}).then(r=>r.json())},
 // Signed URL for a painting made earlier, or null when there is none.
 async paintingUrl(day){
  if(!user)return null;
  const {data}=await sb.storage.from('paintings').list(user.id,{search:day+'.webp',limit:1});
  if(!data||!data.length)return null;
  const s=await sb.storage.from('paintings').createSignedUrl(user.id+'/'+day+'.webp',3600);
  return s.error?null:s.data.signedUrl;
 }
};
window.KosmiaCloud=Cloud;
})();
