import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {upcomingSessions} from '../lib/club.mjs';

test('Supabase permissions and session workflow',async t=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',current_setting('request.jwt.claim.email',true)) $$;`);
  await db.exec(readFileSync(new URL('./setup.sql',import.meta.url),'utf8'));
  const users=['Sher Amir','Himanish','Ishan','Jatin'].map((name,i)=>({name,id:crypto.randomUUID(),email:'member'+i+'@example.test'}));
  for(const u of users){await db.query('insert into auth.users(id) values($1)',[u.id]);await db.query('update public.club_members set email=$1 where name=$2',[u.email,u.name]);}
  async function login(u){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.email',$2,false)",[u.id,u.email]);await db.exec('set role authenticated');}
  async function mutate(p){return (await db.query('select public.club_mutate($1::jsonb) as result',[JSON.stringify(p)])).rows[0].result;}
  async function state(){return (await db.query('select public.club_state() as result')).rows[0].result;}
  const date=upcomingSessions()[0];
  const base={action:'claim',date,slot:1,title:'Clone Graph',url:'https://leetcode.com/problems/clone-graph/',practice:'',prep:'Review BFS',topic:'Graphs',difficulty:'Medium'};
  await t.test('unlisted email cannot join or read data',async()=>{await login({id:crypto.randomUUID(),email:'outsider@example.test'});await assert.rejects(state,/not on the club roster/);});
  await login(users[0]);
  await t.test('email allowlist resolves member identity',async()=>{assert.equal((await state()).profile,'Sher Amir');});
  await t.test('direct table access is denied',async()=>{await assert.rejects(db.query('select * from public.club_members'),/permission denied/);});
  await t.test('unsafe URLs and old dates are rejected',async()=>{await assert.rejects(mutate({...base,url:'https://leetcode.com.evil.test/problems/a/'}),/HTTPS LeetCode/);await assert.rejects(mutate({...base,date:'2026-01-01'}),/upcoming/);});
  let id;
  await t.test('claim and notification commit together',async()=>{id=(await mutate(base)).id;const s=await state();assert.equal(s.claims.length,1);assert.equal(s.inbox.length,1);assert.equal(s.inbox[0].recipient,'Sher Amir');});
  await t.test('one presenter cannot take two slots',async()=>{await assert.rejects(mutate({...base,slot:2,url:'https://leetcode.com/problems/number-of-islands/'}),/already taken/);});
  await t.test('stale edit emits no notifications',async()=>{await assert.rejects(mutate({...base,action:'edit',id,revision:0}),/spot changed/);assert.equal((await state()).inbox.length,1);});
  await t.test('edit updates revision and all seven inboxes',async()=>{await mutate({...base,action:'edit',id,revision:1,prep:'Updated prep'});const s=await state();assert.equal(s.claims[0].revision,2);assert.equal(s.inbox.length,2);await db.exec('reset role');const n=await db.query('select recipient,count(*)::int as n from public.club_notices group by recipient');assert.equal(n.rows.length,7);assert.ok(n.rows.every(r=>r.n===2));await login(users[0]);});
  await login(users[1]);
  await t.test('other members only see their own inbox and cannot edit another presenter',async()=>{const s=await state();assert.equal(s.inbox.length,2);assert.ok(s.inbox.every(n=>n.recipient==='Himanish'));await assert.rejects(mutate({...base,action:'edit',id,revision:2}),/Only the presenter/);});
  await t.test('duplicate question is rejected',async()=>{await assert.rejects(mutate({...base,slot:2}),/already taken/);});
  await mutate({...base,slot:2,title:'Number of Islands',url:'https://leetcode.com/problems/number-of-islands/'});
  await login(users[2]);await state();await mutate({...base,slot:3,title:'Course Schedule',url:'https://leetcode.com/problems/course-schedule/'});
  await login(users[3]);await state();
  await t.test('fourth slot and occupied slots are rejected',async()=>{await assert.rejects(mutate({...base,slot:4,url:'https://leetcode.com/problems/rotting-oranges/'}),/check constraint/);await assert.rejects(mutate({...base,slot:3,url:'https://leetcode.com/problems/rotting-oranges/'}),/already taken/);assert.equal((await state()).claims.length,3);});
  await login(users[0]);
  await t.test('practice survives release and remains personal',async()=>{await mutate({action:'practice',url:base.url,completed:true});await mutate({action:'release',id,date,revision:2});const s=await state();assert.equal(s.claims.some(c=>c.id===id),false);assert.equal(s.practiced[0].title,'Clone Graph');await login(users[1]);assert.deepEqual((await state()).solved,[]);await login(users[0]);});
  await t.test('mark-read updates current member only',async()=>{await mutate({action:'read'});assert.ok((await state()).inbox.every(n=>n.read));await login(users[1]);assert.ok((await state()).inbox.some(n=>!n.read));});
 }finally{await db.close();}
});
