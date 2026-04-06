-- ============================================================
-- Kadur MVP – Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name        TEXT        NOT NULL DEFAULT '',
  email       TEXT        NOT NULL DEFAULT '',
  city        TEXT,
  position    TEXT        NOT NULL DEFAULT 'MID',
  avatar_url  TEXT,
  stats       JSONB       NOT NULL DEFAULT '{"goals":0,"assists":0,"games_played":0,"mvp_count":0,"xp":0,"level":1}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Games ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.games (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT        NOT NULL,
  description     TEXT,
  format          TEXT        NOT NULL CHECK (format IN ('5v5','7v7','11v11')),
  status          TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','full','cancelled','finished')),
  location_name   TEXT        NOT NULL,
  location_lat    FLOAT       NOT NULL DEFAULT 32.08,
  location_lng    FLOAT       NOT NULL DEFAULT 34.78,
  city            TEXT        NOT NULL DEFAULT 'Tel Aviv',
  scheduled_at    TIMESTAMPTZ NOT NULL,
  max_players     INT         NOT NULL,
  current_players INT         NOT NULL DEFAULT 0,
  creator_id      UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Participants ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.participants (
  id        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id   UUID        REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  user_id   UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  team      TEXT        CHECK (team IN ('A','B')),
  status    TEXT        NOT NULL DEFAULT 'confirmed',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, user_id)
);

-- ── Messages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id         UUID        REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  sender_id       UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_name     TEXT        NOT NULL,
  sender_initials TEXT,
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages     ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone authenticated can read; only owner can write
CREATE POLICY "profiles_read"   ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Games: anyone can read; only creator can update
CREATE POLICY "games_read"   ON public.games FOR SELECT TO authenticated USING (true);
CREATE POLICY "games_insert" ON public.games FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "games_update" ON public.games FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

-- Participants: anyone can read; own rows only for write
CREATE POLICY "participants_read"   ON public.participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "participants_insert" ON public.participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "participants_delete" ON public.participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Messages: anyone in game can read; own rows only for insert
CREATE POLICY "messages_read"   ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- ── Triggers ─────────────────────────────────────────────────

-- 1. Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, city, position)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'city',
    COALESCE(NEW.raw_user_meta_data->>'position', 'MID')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Keep current_players count in sync with participants table
CREATE OR REPLACE FUNCTION public.sync_player_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.games
    SET
      current_players = current_players + 1,
      status = CASE
        WHEN current_players + 1 >= max_players THEN 'full'
        ELSE 'open'
      END
    WHERE id = NEW.game_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.games
    SET
      current_players = GREATEST(0, current_players - 1),
      status = 'open'
    WHERE id = OLD.game_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS participants_count ON public.participants;
CREATE TRIGGER participants_count
  AFTER INSERT OR DELETE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.sync_player_count();

-- ── Enable Realtime for messages ─────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
