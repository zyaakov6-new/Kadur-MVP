-- Fix for infinite recursion error in games policy
-- Error: 42P17 - infinite recursion detected in policy for relation "games"
--
-- Run this script in your Supabase SQL Editor

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- STEP 1: Create tables if they don't exist
-- ============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
    phone text UNIQUE,
    full_name text,
    avatar_url text,
    city text,
    favorite_position text,
    position text,
    bio text,
    stats jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organizer_id uuid REFERENCES public.profiles(id) NOT NULL,
    title text NOT NULL,
    description text,
    location geography(Point),
    address text,
    start_time timestamptz NOT NULL,
    format text NOT NULL,
    max_players int NOT NULL,
    current_players int DEFAULT 0,
    status text DEFAULT 'open' CHECK (status IN ('open', 'full', 'cancelled', 'finished')),
    image_url text,
    created_at timestamptz DEFAULT now()
);

-- Create game_participants table (the app uses this name)
CREATE TABLE IF NOT EXISTS public.game_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id uuid REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status text DEFAULT 'joined' CHECK (status IN ('joined', 'left', 'waitlist')),
    team text,
    lineup_position_id text,
    joined_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    UNIQUE(game_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id uuid REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- STEP 2: Enable RLS on all tables
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Drop existing policies (if any)
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Games policies
DROP POLICY IF EXISTS "Games are viewable by everyone." ON games;
DROP POLICY IF EXISTS "Authenticated users can create games." ON games;
DROP POLICY IF EXISTS "Organizer can update their games." ON games;
DROP POLICY IF EXISTS "games_select_all" ON games;
DROP POLICY IF EXISTS "games_insert_authenticated" ON games;
DROP POLICY IF EXISTS "games_update_organizer" ON games;
DROP POLICY IF EXISTS "games_delete_organizer" ON games;

-- Game participants policies
DROP POLICY IF EXISTS "game_participants_select_all" ON game_participants;
DROP POLICY IF EXISTS "game_participants_insert_own" ON game_participants;
DROP POLICY IF EXISTS "game_participants_update_own" ON game_participants;
DROP POLICY IF EXISTS "game_participants_delete_own" ON game_participants;

-- Messages policies
DROP POLICY IF EXISTS "Participants can view messages for their game." ON messages;
DROP POLICY IF EXISTS "Participants can insert messages." ON messages;
DROP POLICY IF EXISTS "messages_select_all" ON messages;
DROP POLICY IF EXISTS "messages_insert_authenticated" ON messages;

-- ============================================
-- STEP 4: Create simple, non-recursive policies
-- ============================================

-- Profiles: Everyone can view, users manage their own
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Games: Everyone can view, authenticated can create, organizer can update/delete
CREATE POLICY "games_select_all" ON games FOR SELECT USING (true);
CREATE POLICY "games_insert_authenticated" ON games FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "games_update_organizer" ON games FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "games_delete_organizer" ON games FOR DELETE USING (auth.uid() = organizer_id);

-- Game participants: Everyone can view, users manage their own participation
CREATE POLICY "game_participants_select_all" ON game_participants FOR SELECT USING (true);
CREATE POLICY "game_participants_insert_own" ON game_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "game_participants_update_own" ON game_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "game_participants_delete_own" ON game_participants FOR DELETE USING (auth.uid() = user_id);

-- Messages: Everyone can view, authenticated can insert
CREATE POLICY "messages_select_all" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert_authenticated" ON messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- STEP 5: Create function to update player count
-- ============================================

CREATE OR REPLACE FUNCTION update_game_player_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE games
        SET current_players = (
            SELECT COUNT(*) FROM game_participants
            WHERE game_id = NEW.game_id AND status = 'joined'
        )
        WHERE id = NEW.game_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE games
        SET current_players = (
            SELECT COUNT(*) FROM game_participants
            WHERE game_id = OLD.game_id AND status = 'joined'
        )
        WHERE id = OLD.game_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS update_player_count_trigger ON game_participants;
CREATE TRIGGER update_player_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON game_participants
FOR EACH ROW
EXECUTE FUNCTION update_game_player_count();

-- ============================================
-- STEP 6: Update current count for existing games
-- ============================================

UPDATE games g
SET current_players = COALESCE((
    SELECT COUNT(*) FROM game_participants gp
    WHERE gp.game_id = g.id AND gp.status = 'joined'
), 0);

-- ============================================
-- Done! The app should now work without errors.
-- ============================================
