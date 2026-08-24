create table if not exists profiles (
  id uuid primary key,
  full_name text not null,
  email text not null unique,
  avatar_url text default '',
  learning_goal text default '',
  created_at timestamptz not null default now(),
  xp integer not null default 0,
  streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  selected_continents text[] not null default '{}',
  notif_weekly_reminder boolean not null default true,
  onboarded boolean not null default false,
  activity jsonb not null default '{}'::jsonb
);

create table if not exists countries (
  id text primary key,
  name text not null,
  capital text not null,
  code text not null,
  continent text not null,
  region text not null
);

create table if not exists user_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  country_id text not null references countries(id) on delete cascade,
  correct integer not null default 0,
  wrong integer not null default 0,
  last_answered timestamptz,
  next_review timestamptz,
  primary key (user_id, country_id)
);

create table if not exists quiz_attempts (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  continent text not null,
  score integer not null,
  total integer not null,
  percentage integer not null,
  completed_at timestamptz not null default now()
);

create table if not exists quiz_answers (
  id bigserial primary key,
  quiz_attempt_id bigint not null references quiz_attempts(id) on delete cascade,
  country_id text not null references countries(id) on delete cascade,
  selected_country_id text,
  correct boolean not null
);

create table if not exists achievements (
  id text primary key,
  icon text not null,
  name text not null,
  description text not null
);

create table if not exists user_achievements (
  user_id uuid not null references profiles(id) on delete cascade,
  achievement_id text not null references achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table profiles enable row level security;
alter table countries enable row level security;
alter table user_progress enable row level security;
alter table quiz_attempts enable row level security;
alter table quiz_answers enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;

create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "update own profile" on profiles for update using (auth.uid() = id);
create policy "read countries" on countries for select using (true);
create policy "manage own progress" on user_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manage own quiz attempts" on quiz_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manage own quiz answers" on quiz_answers for all using (exists(select 1 from quiz_attempts qa where qa.id = quiz_answers.quiz_attempt_id and qa.user_id = auth.uid()));
create policy "read achievements" on achievements for select using (true);
create policy "manage own unlocked achievements" on user_achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
