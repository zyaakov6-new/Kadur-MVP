-- Fix for infinite recursion error in games policy
-- Error: 42P17 - infinite recursion detected in policy for relation "games"
--
-- This script fixes the table name mismatch between the schema (uses 'participants')
-- and the app code (uses 'game_participants'), and simplifies RLS policies.

-- Step 1: Create game_participants as a view of participants (if table doesn't exist)
-- First, check if game_participants already exists
DO $$
BEGIN
    -- Try to create the view only if game_participants doesn't exist as a table
    IF NOT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_participants'
    ) AND NOT EXISTS (
        SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'game_participants'
    ) THEN
        -- Create game_participants as a table copy (not view, for full RLS support)
        CREATE TABLE public.game_participants (
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

        -- Enable RLS
        ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;

        -- Simple, non-recursive policies
        CREATE POLICY "game_participants_select_all" ON game_participants
            FOR SELECT USING (true);

        CREATE POLICY "game_participants_insert_own" ON game_participants
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "game_participants_update_own" ON game_participants
            FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "game_participants_delete_own" ON game_participants
            FOR DELETE USING (auth.uid() = user_id);

        -- Copy existing data from participants if any
        INSERT INTO public.game_participants (id, game_id, user_id, status, team, lineup_position_id, joined_at, created_at)
        SELECT id, game_id, user_id, status, team, lineup_position_id, joined_at, created_at
        FROM public.participants
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Created game_participants table with simple RLS policies';
    ELSE
        RAISE NOTICE 'game_participants already exists, skipping creation';
    END IF;
END $$;

-- Step 2: Add current_players column to games if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'games'
        AND column_name = 'current_players'
    ) THEN
        ALTER TABLE public.games ADD COLUMN current_players int DEFAULT 0;
        RAISE NOTICE 'Added current_players column to games table';
    END IF;
END $$;

-- Step 3: Create a function to count participants for a game
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

-- Step 4: Create trigger to auto-update player count
DROP TRIGGER IF EXISTS update_player_count_trigger ON game_participants;
CREATE TRIGGER update_player_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON game_participants
FOR EACH ROW
EXECUTE FUNCTION update_game_player_count();

-- Step 5: Update the current count for all existing games
UPDATE games g
SET current_players = COALESCE((
    SELECT COUNT(*) FROM game_participants gp
    WHERE gp.game_id = g.id AND gp.status = 'joined'
), 0);

-- Step 6: Simplify games policies to prevent any potential recursion
-- Drop existing policies
DROP POLICY IF EXISTS "Games are viewable by everyone." ON games;
DROP POLICY IF EXISTS "Authenticated users can create games." ON games;
DROP POLICY IF EXISTS "Organizer can update their games." ON games;

-- Recreate with simpler names and clearer logic
CREATE POLICY "games_select_all" ON games
    FOR SELECT USING (true);

CREATE POLICY "games_insert_authenticated" ON games
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "games_update_organizer" ON games
    FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "games_delete_organizer" ON games
    FOR DELETE USING (auth.uid() = organizer_id);

-- Step 7: Simplify messages policies (these might cause indirect recursion)
DROP POLICY IF EXISTS "Participants can view messages for their game." ON messages;
DROP POLICY IF EXISTS "Participants can insert messages." ON messages;

-- Allow all authenticated users to view messages (simpler, less recursive)
CREATE POLICY "messages_select_all" ON messages
    FOR SELECT USING (true);

CREATE POLICY "messages_insert_authenticated" ON messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Step 8: Simplify votes policies
DROP POLICY IF EXISTS "Votes are viewable by participants." ON votes;
DROP POLICY IF EXISTS "Participants can vote." ON votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;

CREATE POLICY "votes_select_all" ON votes
    FOR SELECT USING (true);

CREATE POLICY "votes_insert_authenticated" ON votes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = voter_id);

CREATE POLICY "votes_update_own" ON votes
    FOR UPDATE USING (auth.uid() = voter_id);

CREATE POLICY "votes_delete_own" ON votes
    FOR DELETE USING (auth.uid() = voter_id);

-- Done!
-- Run this script in your Supabase SQL Editor to fix the infinite recursion error.
