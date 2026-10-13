import {createClubClient,signOutThisDevice} from './auth.mjs';
import {MEMBERS,SUGGESTIONS,upcomingSessions,validateQuestion,isOpenSession,problemLink} from './club.mjs';
import {emptyClubData} from './client-state.mjs';
import type {ClubData,Claim,Notice,Problem} from '../app/types';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const connected=Boolean(url&&key);
const supabase=connected?createClubClient(url,key):null;
const STORE='coding-club-preview-v2';
const ACTOR='coding-club-preview-member';
type LocalState={claims:Claim[];inbox:Notice[];roster:{name:string}[];practice:Record<string,Problem[]>};
function readLocal():LocalState{try{const raw=localStorage.getItem(STORE);if(raw)return JSON.parse(raw);}catch{}return {claims:[],inbox:[],roster:[],practice:{}};}
function saveLocal(state:LocalState){localStorage.setItem(STORE,JSON.stringify(state));}
export async function loadClub():Promise<ClubData>{
  if(supabase){
    const {data:{session},error}=await supabase.auth.getSession();if(error)throw error;
    if(!session)return emptyClubData(upcomingSessions());
    const {data,error:stateError}=await supabase.rpc('club_state');
    if(stateError)throw new Error(stateError.message);
    return {...data,dates:upcomingSessions()};
  }
  const state=readLocal();const profile=localStorage.getItem(ACTOR);const practiced=profile?state.practice[profile]||[]:[];
  return {signedIn:true,profile,claims:state.claims,roster:state.roster,inbox:state.inbox.filter(n=>n.recipient===profile).sort((a,b)=>b.created_at.localeCompare(a.created_at)),solved:practiced.map(p=>p.url),practiced,dates:upcomingSessions()};
}
export async function sendSignIn(email:string){if(!supabase)return;const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:new URL('.',window.location.href).href,shouldCreateUser:true}});if(error)throw error;}
export async function signOut(){if(supabase){await signOutThisDevice(supabase);}else localStorage.removeItem(ACTOR);}
export function onIdentityChange(callback:()=>void){if(supabase){const {data}=supabase.auth.onAuthStateChange(()=>setTimeout(callback,0));return()=>data.subscription.unsubscribe();}window.addEventListener('storage',callback);return()=>window.removeEventListener('storage',callback);}
export async function saveChange(payload:any):Promise<{ok:boolean;id?:string}>{
  if(['claim','edit'].includes(payload.action))payload={...payload,...validateQuestion(payload)};
  if(supabase){const {data,error}=await supabase.rpc('club_mutate',{p:payload});if(error)throw new Error(error.message);return data;}
  const state=readLocal();const actor=localStorage.getItem(ACTOR);const now=new Date().toISOString();
  if(payload.action==='join'){
    if(!MEMBERS.includes(payload.name))throw new Error('Choose a member.');
    localStorage.setItem(ACTOR,payload.name);if(!state.roster.some(p=>p.name===payload.name))state.roster.push({name:payload.name});saveLocal(state);return {ok:true};
  }
  if(!actor)throw new Error('Choose your profile.');
  if(payload.action==='read'){state.inbox=state.inbox.map(n=>n.recipient===actor&&(!payload.id||n.id===payload.id)?{...n,read:1}:n);saveLocal(state);return {ok:true};}
  if(payload.action==='practice'){
    const url=problemLink(payload.url);const list=state.practice[actor]||[];
    if(payload.completed){const p=state.claims.find(p=>p.url===url)||SUGGESTIONS.find(p=>p.url===url)||list.find(p=>p.url===url);if(!p)throw new Error('Choose a problem in the library.');if(!list.some(p=>p.url===url))list.push(p);state.practice[actor]=list;}
    else state.practice[actor]=list.filter(p=>p.url!==url);saveLocal(state);return {ok:true};
  }
  if(!isOpenSession(payload.date))throw new Error('Choose an upcoming session.');
  const existing=state.claims.find(c=>c.id===payload.id);
  if(payload.action!=='claim'&&(!existing||existing.name!==actor))throw new Error('Only the presenter can change this spot.');
  if(existing&&existing.revision!==payload.revision)throw new Error('This spot changed. Refresh and try again.');
  let item:Claim;let title:string;
  if(payload.action==='release'){item=existing!;state.claims=state.claims.filter(c=>c.id!==item.id);title=actor+' released spot '+item.slot;}
  else{
    const question=validateQuestion(payload);const slot=existing?.slot||payload.slot;
    if(![1,2,3].includes(slot))throw new Error('Choose one of the three spots.');
    if(state.claims.some(c=>c.session_date===payload.date&&c.id!==existing?.id&&(c.slot===slot||c.name===actor||c.url===question.url)))throw new Error('That spot, presenter, or question is already taken.');
    item={...question,id:existing?.id||crypto.randomUUID(),name:actor,session_date:payload.date,slot,revision:(existing?.revision||0)+1,updated_at:now};
    state.claims=[...state.claims.filter(c=>c.id!==item.id),item];title=actor+(existing?' updated ':' added ')+item.title;
  }
  for(const recipient of MEMBERS)state.inbox.push({id:crypto.randomUUID(),recipient,title,body:payload.date+' · 6–8 PM IST'+(payload.action!=='release'&&item.prep?'\nPrep: '+item.prep:''),session_date:payload.date,claim_id:payload.action==='release'?null:item.id,created_at:now,read:0});
  saveLocal(state);return {ok:true,id:item.id};
}
