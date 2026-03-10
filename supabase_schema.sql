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
