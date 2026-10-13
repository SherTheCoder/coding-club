begin;
create table public.club_members (
  name text primary key,
  email text unique check (email = lower(email)),
  user_id uuid unique references auth.users(id) on delete set null,
  joined_at timestamptz
);
insert into public.club_members(name) values ('Himanish'),('Akashdeep'),('Ishan'),('Sarthak'),('Siddharth'),('Jatin'),('Sher Amir');
create table public.club_claims (
  id uuid primary key default gen_random_uuid(), session_date date not null, slot integer not null check(slot between 1 and 3),
  user_id uuid not null references auth.users(id), name text not null references public.club_members(name),
  title text not null check(length(title) between 2 and 120), url text not null,
  practice text not null default '', prep text not null default '' check(length(prep)<=2000),
  topic text not null check(topic in ('Graphs','Trees','Dynamic programming','Arrays','Strings')),
  difficulty text not null check(difficulty in ('Easy','Medium','Hard')),
  revision integer not null default 1, updated_at timestamptz not null default now(),
  unique(session_date,slot),unique(session_date,user_id),unique(session_date,url)
);
create table public.club_notices (
  id uuid primary key default gen_random_uuid(),recipient text not null references public.club_members(name),
  title text not null,body text not null,session_date date not null,claim_id uuid,
  created_at timestamptz not null default now(),read boolean not null default false,dedupe text unique
);
create index club_notices_recipient on public.club_notices(recipient,created_at desc);
create table public.club_practice (
  user_id uuid not null references auth.users(id) on delete cascade,url text not null,title text not null,
  topic text not null,difficulty text not null,prep text not null default '',completed_at timestamptz not null default now(),
  primary key(user_id,url)
);
alter table public.club_members enable row level security;
alter table public.club_claims enable row level security;
alter table public.club_notices enable row level security;
alter table public.club_practice enable row level security;
revoke all on public.club_members,public.club_claims,public.club_notices,public.club_practice from anon,authenticated;

create function public.club_join() returns text language plpgsql security definer set search_path='' as $$
declare member_name text;
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  select name into member_name from public.club_members where user_id=auth.uid();
  if member_name is not null then return member_name; end if;
  update public.club_members set user_id=auth.uid(),joined_at=now()
    where email=lower(auth.jwt()->>'email') and user_id is null returning name into member_name;
  if member_name is null then raise exception 'This email is not on the club roster. Ask Sher Amir to add it.'; end if;
  return member_name;
end $$;

create function public.club_url(value text,optional boolean default false) returns text language plpgsql immutable set search_path='' as $$
declare parts text[];
begin
  if optional and coalesce(trim(value),'')='' then return ''; end if;
  parts:=regexp_match(trim(value),'^https://(?:www\.)?leetcode\.com/problems/([a-z0-9-]+)(?:/[^[:space:]]*|[?#][^[:space:]]*)?$');
  if parts is null then raise exception 'Use an HTTPS LeetCode problem link.'; end if;
  return 'https://leetcode.com/problems/'||parts[1]||'/';
end $$;

create function public.club_mutate(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor text:=public.club_join(); action text:=p->>'action'; day date; current_claim public.club_claims%rowtype;
  item public.club_claims%rowtype; problem_url text; problem_title text; problem_topic text; problem_difficulty text;
  problem_prep text; related text; n integer; expected integer; notice_title text; notice_body text;
begin
  if action='join' then return jsonb_build_object('ok',true); end if;
  if action='read' then
    update public.club_notices set read=true where recipient=actor and (p->>'id' is null or id=(p->>'id')::uuid);
    return jsonb_build_object('ok',true);
  end if;
  if action='practice' then
    problem_url:=public.club_url(p->>'url');
    if coalesce((p->>'completed')::boolean,false) then
      select title,topic,difficulty,prep into problem_title,problem_topic,problem_difficulty,problem_prep
      from public.club_claims where url=problem_url order by updated_at desc limit 1;
      if problem_title is null then
        select title,topic,difficulty,prep into problem_title,problem_topic,problem_difficulty,problem_prep
        from public.club_practice where user_id=auth.uid() and url=problem_url;
      end if;
      if problem_title is null then
        select x.title,'Graphs','Medium',x.prep into problem_title,problem_topic,problem_difficulty,problem_prep from (values
          ('https://leetcode.com/problems/number-of-islands/','Number of Islands','Visited sets and grid traversal.'),
          ('https://leetcode.com/problems/clone-graph/','Clone Graph','Adjacency lists and deep copies.'),
          ('https://leetcode.com/problems/rotting-oranges/','Rotting Oranges','Queues and breadth-first search.'),
          ('https://leetcode.com/problems/course-schedule/','Course Schedule','Directed graphs and indegrees.')
        ) as x(url,title,prep) where x.url=problem_url;
      end if;
      if problem_title is null then raise exception 'Choose a question from the library.'; end if;
      insert into public.club_practice(user_id,url,title,topic,difficulty,prep)
      values(auth.uid(),problem_url,problem_title,problem_topic,problem_difficulty,problem_prep) on conflict do nothing;
    else delete from public.club_practice where user_id=auth.uid() and url=problem_url;
    end if;
    return jsonb_build_object('ok',true);
  end if;
  if action not in ('claim','edit','release') or action is null then raise exception 'Unknown action.'; end if;
  day:=(p->>'date')::date;
  if day is null or day not in (
    select d::date from generate_series((now() at time zone 'Asia/Kolkata')::date::timestamp,
      (now() at time zone 'Asia/Kolkata')::date::timestamp+interval '31 days',interval '1 day') d
    where extract(isodow from d) in (2,4) and d+interval '20 hours'>now() at time zone 'Asia/Kolkata'
    order by d limit 8
  ) then raise exception 'Choose an upcoming Tuesday or Thursday.'; end if;
  if action<>'claim' then
    select * into current_claim from public.club_claims where id=(p->>'id')::uuid and user_id=auth.uid() and session_date=day for update;
    if current_claim.id is null then raise exception 'Only the presenter can change this spot.'; end if;
    expected:=(p->>'revision')::integer;
    if expected is distinct from current_claim.revision then raise exception 'This spot changed. Refresh and try again.'; end if;
  end if;
  if action='release' then
    item:=current_claim;
    delete from public.club_claims where id=item.id;
    notice_title:=actor||' released spot '||item.slot;
  else
    problem_url:=public.club_url(p->>'url');related:=public.club_url(p->>'practice',true);
    problem_title:=trim(p->>'title');problem_prep:=coalesce(trim(p->>'prep'),'');
    problem_topic:=p->>'topic';problem_difficulty:=p->>'difficulty';
    if length(problem_title) not between 2 and 120 or problem_title is null then raise exception 'Title must be 2–120 characters.'; end if;
    if length(problem_prep)>2000 then raise exception 'Preparation notes must be under 2,000 characters.'; end if;
    if action='claim' then
      insert into public.club_claims(session_date,slot,user_id,name,title,url,practice,prep,topic,difficulty)
      values(day,(p->>'slot')::integer,auth.uid(),actor,problem_title,problem_url,related,problem_prep,problem_topic,problem_difficulty) returning * into item;
      notice_title:=actor||' added '||item.title;
    else
      update public.club_claims set title=problem_title,url=problem_url,practice=related,prep=problem_prep,topic=problem_topic,
      difficulty=problem_difficulty,revision=revision+1,updated_at=now() where id=current_claim.id returning * into item;
      notice_title:=actor||' updated '||item.title;
    end if;
  end if;
  notice_body:=to_char(day,'Dy DD Mon')||' · 6–8 PM IST'||case when action<>'release' and item.prep<>'' then E'\nPrep: '||item.prep else '' end;
  insert into public.club_notices(recipient,title,body,session_date,claim_id)
  select name,notice_title,notice_body,day,case when action='release' then null else item.id end from public.club_members;
  return jsonb_build_object('ok',true,'id',item.id);
exception when unique_violation then raise exception 'That spot, presenter, or problem is already taken.';
end $$;

create function public.club_state() returns jsonb language plpgsql security definer set search_path='' as $$
declare actor text:=public.club_join(); session_day date; local_now timestamp:=now() at time zone 'Asia/Kolkata';
begin
  session_day:=local_now::date;
  if extract(isodow from session_day) in (2,4) and local_now::time>='16:00' and local_now::time<'18:00' then
    insert into public.club_notices(recipient,title,body,session_date,dedupe)
    select name,'Session at 6 PM','Review the questions and prep notes.',session_day,'reminder-'||session_day||'-'||name
    from public.club_members on conflict(dedupe) do nothing;
  end if;
  return jsonb_build_object('signedIn',true,'profile',actor,
    'roster',(select coalesce(jsonb_agg(jsonb_build_object('name',name)),'[]') from public.club_members where user_id is not null),
    'claims',(select coalesce(jsonb_agg(to_jsonb(c)-'user_id'),'[]') from (select * from public.club_claims order by session_date desc,slot limit 300)c),
    'inbox',(select coalesce(jsonb_agg(to_jsonb(n)),'[]') from (select * from public.club_notices where recipient=actor order by created_at desc limit 100)n),
    'practiced',(select coalesce(jsonb_agg(to_jsonb(p)-'user_id'),'[]') from public.club_practice p where user_id=auth.uid()),
    'solved',(select coalesce(jsonb_agg(url),'[]') from public.club_practice where user_id=auth.uid()));
end $$;
revoke all on function public.club_join(), public.club_url(text,boolean), public.club_mutate(jsonb), public.club_state() from public,anon,authenticated;
grant execute on function public.club_mutate(jsonb),public.club_state() to authenticated;
commit;
