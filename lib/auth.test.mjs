import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClubClient,signOutThisDevice} from './auth.mjs';

const project='https://club-test.supabase.co';
const storageKey='sb-club-test-auth-token';
const user={id:'56b9b1af-43b9-4004-b7ca-9363b91d2164',aud:'authenticated',role:'authenticated',email:'member@example.com'};
const token=expires=>`${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,exp:expires,role:'authenticated'})).toString('base64url')}.test-signature`;
const session=(expires,refresh='refresh-initial')=>({access_token:token(expires),refresh_token:refresh,expires_at:expires,expires_in:3600,token_type:'bearer',user});
function storage(initial){const items=new Map(initial?[[storageKey,JSON.stringify(initial)]]:[]);return {getItem:key=>items.get(key)||null,setItem:(key,value)=>items.set(key,value),removeItem:key=>items.delete(key)};}
const response=data=>new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});

 test('restores a saved sign-in after the browser client is recreated',async()=>{
  const saved=storage();let signIns=0;
  const fetch=async request=>{assert.match(String(request),/\/verify$/);signIns++;return response(session(Math.floor(Date.now()/1000)+3600));};
  const first=createClubClient(project,'test-publishable-key',{storage:saved,fetch});
  try{
    const {error}=await first.auth.verifyOtp({email:user.email,token:'123456',type:'email'});
    assert.equal(error,null);
  }finally{await first.auth.stopAutoRefresh();}
  const reopened=createClubClient(project,'test-publishable-key',{storage:saved,fetch});
  try{
    const {data,error}=await reopened.auth.getSession();
    assert.equal(error,null);assert.equal(data.session.user.id,user.id);assert.equal(signIns,1);
  }finally{await reopened.auth.stopAutoRefresh();}
});

test('silently renews an expired access token when the member returns',async()=>{
  const saved=storage(session(Math.floor(Date.now()/1000)-300));let renewals=0;
  const fetch=async(request,init)=>{assert.match(String(request),/token\?grant_type=refresh_token$/);assert.equal(JSON.parse(init.body).refresh_token,'refresh-initial');renewals++;return response(session(Math.floor(Date.now()/1000)+3600,'refresh-renewed'));};
  const client=createClubClient(project,'test-publishable-key',{storage:saved,fetch});
  try{
    const {data,error}=await client.auth.getSession();
    assert.equal(error,null);assert.equal(data.session.user.id,user.id);assert.equal(renewals,1);assert.equal(JSON.parse(saved.getItem(storageKey)).refresh_token,'refresh-renewed');
  }finally{await client.auth.stopAutoRefresh();}
});

test('sign-out removes only this device session',async()=>{
  const initial=session(Math.floor(Date.now()/1000)+3600);const current=storage(initial);const other=storage(initial);let requestScope;
  const fetch=async request=>{requestScope=new URL(String(request)).searchParams.get('scope');return new Response(null,{status:204});};
  const client=createClubClient(project,'test-publishable-key',{storage:current,fetch});
  try{
    await signOutThisDevice(client);
    assert.equal(requestScope,'local');assert.equal(current.getItem(storageKey),null);assert.ok(other.getItem(storageKey));
  }finally{await client.auth.stopAutoRefresh();}
});
