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
// tables and columns added in the six-section release; until that migration runs they are simply skipped
const missing=e=>e&&(/^(42P01|42703|PGRST20[45])$/.test(e.code||'')||/does not exist|schema cache/i.test(e.message||''));
const soft=p=>p.then(check).catch(e=>{if(missing(e))return null;fail(e);return null});
const rows=async q=>{const {data,error}=await q;if(error){if(missing(error))return [];throw error}return data||[]};

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
 // sends the activation link again, for an account waiting on email confirmation
 async resend(email){check(await sb.auth.resend({type:'signup',email,options:{emailRedirectTo:location.origin+'/'}}))},
 async resetPassword(email){check(await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/'}))},
 async updatePassword(password){check(await sb.auth.updateUser({password}))},
 async signOut(){if(sb)await sb.auth.signOut();user=null},
 async pull(){
  const uid=user.id;
  const [p,f,m,r,j,c,b]=await Promise.all([
   sb.from('profiles').select('*').eq('id',uid).maybeSingle().then(check),
   rows(sb.from('fortunes').select('day,card_id,saved,note,updated_at').eq('user_id',uid)),
   rows(sb.from('matches').select('sign_a,sign_b').eq('user_id',uid).order('created_at')),
   rows(sb.from('tarot_readings').select('*').eq('user_id',uid).order('created_at')),
   rows(sb.from('journal').select('*').eq('user_id',uid).order('day',{ascending:false})),
   rows(sb.from('connections').select('*').eq('user_id',uid).order('created_at')),
   rows(sb.from('bookmarks').select('*').eq('user_id',uid).order('created_at'))
  ]);
  return {profile:p,fortunes:f,matches:m,readings:r,journal:j,connections:c,bookmarks:b};
 },
 // Birth details only leave the device when the reader has agreed to keep them in their account.
 saveProfile(p){
  if(!user)return Promise.resolve();
  const base={id:user.id,email:user.email,sign:p.sign||null,name:p.name||'',intro_seen:!!p.intro,notif:p.notif};
  const full=Object.assign({},base,{full_name:p.fullName||'',alt_name:p.altName||'',birth_consent:!!p.birthConsent,birth:p.birthConsent?p.birth:null,settings:p.settings||{}});
  return sb.from('profiles').upsert(full).then(check).catch(e=>{if(missing(e))return sb.from('profiles').upsert(base).then(check);throw e}).catch(fail);
 },
 saveFortune(day,cardId,saved,note){
  if(!user)return Promise.resolve();
  return bg(sb.from('fortunes').upsert({user_id:user.id,day,card_id:cardId,saved:!!saved,note:note||''}).then(check));
 },
 // Resolves to the stored row id (or null when not signed in / on failure).
 saveReading(r){
  if(!user)return Promise.resolve(null);
  const row={user_id:user.id,day:r.date,spread:r.spread,question:r.q||'',cards:r.cards};
  const ins=x=>sb.from('tarot_readings').insert(x).select('id').single().then(check);
  return ins(Object.assign({note:r.note||''},row)).catch(e=>{if(missing(e))return ins(row);throw e}).then(d=>d.id).catch(e=>{fail(e);return null});
 },
 updateReading(id,note){if(!user||!id)return Promise.resolve();return soft(sb.from('tarot_readings').update({note}).eq('id',id).eq('user_id',user.id))},
 deleteReading(id){if(!user||!id)return Promise.resolve();return bg(sb.from('tarot_readings').delete().eq('id',id).eq('user_id',user.id).then(check))},
 saveJournal(e){if(!user)return Promise.resolve();return soft(sb.from('journal').upsert({id:e.id,user_id:user.id,day:e.day,kind:e.kind,title:e.title||'',body:e.body||''}))},
 deleteJournal(id){if(!user)return Promise.resolve();return soft(sb.from('journal').delete().eq('id',id).eq('user_id',user.id))},
 saveConnection(c){if(!user)return Promise.resolve();return soft(sb.from('connections').upsert({id:c.id,user_id:user.id,name:c.name||'',kind:c.kind,data:c.data,note:c.note||''}))},
 deleteConnection(id){if(!user)return Promise.resolve();return soft(sb.from('connections').delete().eq('id',id).eq('user_id',user.id))},
 // the matches table predates connections; a pairing deleted from Connections is removed there too
 deleteMatch(a,b){if(!user)return Promise.resolve();return soft(sb.from('matches').delete().eq('user_id',user.id).eq('sign_a',a).eq('sign_b',b))},
 // dreams and kept conversations wait on this device until the database accepts their kinds (a check violation, 23514);
 // they are sent again on the next sync. The rejection is passed on so the item is not marked as synced.
 saveBookmark(b){if(!user)return Promise.resolve();const q=sb.from('bookmarks').upsert({id:b.id,user_id:user.id,kind:b.kind,ref:b.ref,data:b.data},{onConflict:'user_id,kind,ref'});
  return /^(dream|chat)$/.test(b.kind)?q.then(check):soft(q)},
 deleteBookmark(kind,ref){if(!user)return Promise.resolve();return soft(sb.from('bookmarks').delete().eq('user_id',user.id).eq('kind',kind).eq('ref',ref))},
 // Removes painted cards, then the account itself (every table cascades from it).
 async deleteAccount(){
  const {data}=await sb.storage.from('paintings').list(user.id,{limit:1000});
  if(data&&data.length)await sb.storage.from('paintings').remove(data.map(f=>user.id+'/'+f.name));
  check(await sb.rpc('delete_my_account'));
  await sb.auth.signOut();user=null;
 },
 // AI endpoints (Netlify functions). They hold the OpenAI / ElevenLabs keys and
 // accept the signed-in user's token; errors carry the server's message and status.
 async token(){const {data}=await sb.auth.getSession();const t=data.session&&data.session.access_token;if(!t)throw Object.assign(new Error('Sign in first'),{status:401});return t},
 async api(path,body,opts={}){
  const t=await Cloud.token();
  const r=await fetch(path,{method:opts.method||'POST',headers:Object.assign({authorization:'Bearer '+t},body instanceof Blob?{'content-type':body.type||'audio/webm'}:body?{'content-type':'application/json'}:{}),body:body instanceof Blob?body:body?JSON.stringify(body):undefined});
  if(!r.ok){let m='';try{m=(await r.json()).error}catch(e){}throw Object.assign(new Error(m||'Request failed ('+r.status+')'),{status:r.status})}
  return r;
 },
 paint(day,cardId,sign){return Cloud.api('/api/paint',{day,cardId,sign}).then(r=>r.json())},
 speak(text){return Cloud.api('/api/speak',{text}).then(r=>r.blob())},
 // personal interpretation of a finished tarot reading (cards are sent as ids and orientations only)
 interpret(spread,question,cards){return Cloud.api('/api/interpret',{spread,question,cards}).then(r=>r.json())},
 horoscope(sign,cat,period,key){return Cloud.api(`/api/horoscope?sign=${sign}&cat=${cat}&period=${period}&key=${encodeURIComponent(key)}`,null,{method:'GET'}).then(r=>r.json())},
 kassandra(messages,context){return Cloud.api('/api/kassandra',{messages,context}).then(r=>r.json())},
 // a dream read by Kassandra: its symbols, themes and a question to sit with
 dream(d){return Cloud.api('/api/dream',d).then(r=>r.json())},
 transcribe(blob){return Cloud.api('/api/transcribe',blob).then(r=>r.json())},
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
