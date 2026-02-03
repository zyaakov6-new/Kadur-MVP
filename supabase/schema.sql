-- Enable PostGIS for location features
create extension if not exists postgis;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  phone text unique,
  full_name text,
  avatar_url text,
  city text,
  favorite_position text,
  position text,
  bio text,
  stats jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create games table
create table public.games (
  id uuid default gen_random_uuid() primary key,
  organizer_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  location geography(Point) not null,
  address text,
  start_time timestamptz not null,
  format text not null, -- '5v5', '7v7', '11v11', 'custom'
  max_players int not null,
  status text default 'open' check (status in ('open', 'full', 'cancelled', 'finished')),
  image_url text,
  created_at timestamptz default now()
);

-- Enable RLS for games
alter table public.games enable row level security;

create policy "Games are viewable by everyone."
  on games for select
  using ( true );

create policy "Authenticated users can create games."
  on games for insert
  with check ( auth.role() = 'authenticated' );

create policy "Organizer can update their games."
  on games for update
  using ( auth.uid() = organizer_id );

-- Create participants table
create table public.participants (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) not null,
  user_id uuid references public.profiles(id) not null,
  status text default 'joined' check (status in ('joined', 'left', 'waitlist')),
  team text, -- 'A', 'B' or null
  lineup_position_id text,
  joined_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(game_id, user_id)
);

-- Enable RLS for participants
alter table public.participants enable row level security;

create policy "Participants are viewable by everyone."
  on participants for select
  using ( true );

create policy "Users can join games."
  on participants for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own participation."
  on participants for update
  using ( auth.uid() = user_id );

-- Create messages table (Chat)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS for messages
alter table public.messages enable row level security;

create policy "Participants can view messages for their game."
  on messages for select
  using ( exists (
    select 1 from participants
    where participants.game_id = messages.game_id
    and participants.user_id = auth.uid()
    and participants.status = 'joined'
  ) );

create policy "Participants can insert messages."
  on messages for insert
  with check ( exists (
    select 1 from participants
    where participants.game_id = messages.game_id
    and participants.user_id = auth.uid()
    and participants.status = 'joined'
  ) );

-- Create votes table (MVP, Rain)
create table public.votes (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) not null,
  voter_id uuid references public.profiles(id) not null,
  target_id uuid references public.profiles(id), -- Null for rain vote
  vote_type text not null check (vote_type in ('mvp', 'rain')),
  created_at timestamptz default now(),
  unique(game_id, voter_id, vote_type)
);

-- Enable RLS for votes
alter table public.votes enable row level security;

create policy "Votes are viewable by participants."
  on votes for select
  using ( exists (
    select 1 from participants
    where participants.game_id = votes.game_id
    and participants.user_id = auth.uid()
  ) );

create policy "Participants can vote."
  on votes for insert
  with check ( exists (
    select 1 from participants
    where participants.game_id = votes.game_id
    and participants.user_id = auth.uid()
    and participants.status = 'joined'
  ) );

create policy "Users can delete their own votes"
  on votes for delete
  using ( auth.uid() = voter_id );

create policy "Users can update their own votes"
  on votes for update
  using ( auth.uid() = voter_id );

-- Functions
-- Function to search games within radius
create or replace function get_games_nearby(
  lat float,
  long float,
  radius_meters float
)
returns setof games
language sql
as $$
  select * from games
  where st_dwithin(
    location,
    st_point(long, lat)::geography,
    radius_meters
  )
  and status = 'open'
  order by start_time asc;
$$;

-- Create achievements table
create table public.achievements (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  title text not null,
  description text not null,
  icon text not null, -- Ionicons name
  xp int not null,
  created_at timestamptz default now()
);

-- Enable RLS for achievements
alter table public.achievements enable row level security;

create policy "Achievements are viewable by everyone."
  on achievements for select
  using ( true );

-- Create user_achievements table
create table public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  achievement_id uuid references public.achievements(id) not null,
  earned_at timestamptz default now(),
  unique(user_id, achievement_id)
);

-- Enable RLS for user_achievements
alter table public.user_achievements enable row level security;

create policy "User achievements are viewable by everyone."
  on user_achievements for select
  using ( true );

-- Seed initial achievements
insert into public.achievements (code, title, description, icon, xp) values
  ('first_game', 'Rookie Debut', 'Play your first game', 'football', 100),
  ('organizer', 'The Boss', 'Create your first game', 'briefcase', 200),
  ('mvp', 'MVP', 'Win an MVP vote', 'trophy', 500),
  ('rain_check', 'Weatherman', 'Vote on a rain cancellation', 'rainy', 50),
  ('reliable', 'Reliable', 'Play 5 games without missing', 'shield-checkmark', 300)
on conflict (code) do nothing;
