-- Run this SQL in your Supabase project's SQL Editor to set up the database for Phase 2.

-- 1. Create the rooms table
CREATE TABLE public.rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  host_id text NOT NULL,
  guest_id text,
  current_fragment text DEFAULT '',
  player_turn text, -- 'host' or 'guest'
  host_penalty integer DEFAULT 0,
  guest_penalty integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Turn on Realtime for the rooms table
-- This allows our React Native app to listen to updates in the table instantly.
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- 3. Set up Row Level Security (RLS) policies
-- For this prototype, we will enable RLS but allow anonymous open access to insert and update rooms.
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous select on rooms"
  ON public.rooms
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous insert on rooms"
  ON public.rooms
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on rooms"
  ON public.rooms
  FOR UPDATE
  USING (true);

-- ==========================================
-- PHASE 2.0: Social Identity Foundation
-- ==========================================

-- 1. Create the Profiles table (Linked to auth.users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  username text UNIQUE NOT NULL,
  avatar_url text,
  total_wins integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Realtime for profiles
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Profiles RLS (Public read, Authenticated user updates their own profile)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 1b. Create a trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Create Friends Table (Many-to-Many relationship)
CREATE TABLE public.friends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_1 uuid REFERENCES public.profiles(id) NOT NULL,
  user_id_2 uuid REFERENCES public.profiles(id) NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id_1, user_id_2)
);

ALTER PUBLICATION supabase_realtime ADD TABLE friends;

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own friendships." ON public.friends FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
CREATE POLICY "Users can create friendships involving themselves." ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
CREATE POLICY "Users can update their own friendships." ON public.friends FOR UPDATE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- 3. Create Messages Table (Lobby Chat)
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES public.profiles(id) NOT NULL,
  room_code text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view messages for their room." ON public.messages FOR SELECT USING (true); -- Simplified MVP logic
CREATE POLICY "Authenticated users can post messages." ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
