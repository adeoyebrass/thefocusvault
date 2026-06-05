
-- enums
DO $$ BEGIN
  CREATE TYPE public.friendship_status AS ENUM ('pending','accepted','declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.friend_ping_kind AS ENUM ('lock','break_request');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- profiles additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS face_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS face_image_path text;

-- friendships
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.friendship_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (requester_id <> recipient_id),
  UNIQUE (requester_id, recipient_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own friendships" ON public.friendships FOR SELECT TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "create own request" ON public.friendships FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "recipient responds" ON public.friendships FOR UPDATE TO authenticated
USING (auth.uid() = recipient_id OR auth.uid() = requester_id)
WITH CHECK (auth.uid() = recipient_id OR auth.uid() = requester_id);

CREATE POLICY "either removes" ON public.friendships FOR DELETE TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE TRIGGER friendships_updated_at BEFORE UPDATE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- are_friends helper
CREATE OR REPLACE FUNCTION public.are_friends(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
      AND ((requester_id = _a AND recipient_id = _b) OR (requester_id = _b AND recipient_id = _a))
  )
$$;

-- friend_pings
CREATE TABLE IF NOT EXISTS public.friend_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.friend_ping_kind NOT NULL,
  message text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friend_pings TO authenticated;
GRANT ALL ON public.friend_pings TO service_role;
ALTER TABLE public.friend_pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own pings" ON public.friend_pings FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "send ping to friend" ON public.friend_pings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id AND public.are_friends(auth.uid(), recipient_id));

CREATE POLICY "recipient marks read" ON public.friend_pings FOR UPDATE TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);
