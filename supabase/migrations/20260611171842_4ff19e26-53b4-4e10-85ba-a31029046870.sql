-- 1) friend_pings: restrict UPDATE to only the read_at column going NULL -> non-NULL
DROP POLICY IF EXISTS "recipient marks read" ON public.friend_pings;

CREATE OR REPLACE FUNCTION public.friend_pings_restrict_recipient_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
       OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
       OR NEW.kind IS DISTINCT FROM OLD.kind
       OR NEW.message IS DISTINCT FROM OLD.message
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Recipients may only update read_at on a ping.';
    END IF;
    IF OLD.read_at IS NOT NULL AND NEW.read_at IS DISTINCT FROM OLD.read_at THEN
      RAISE EXCEPTION 'read_at cannot be modified once set.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_friend_pings_restrict_recipient_update ON public.friend_pings;
CREATE TRIGGER trg_friend_pings_restrict_recipient_update
BEFORE UPDATE ON public.friend_pings
FOR EACH ROW EXECUTE FUNCTION public.friend_pings_restrict_recipient_update();

CREATE POLICY "recipient marks read"
ON public.friend_pings
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- 2) Focus Rooms (Family Extra Hours)
DO $$ BEGIN
  CREATE TYPE public.room_type AS ENUM ('extension', 'ephemeral');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.focus_rooms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  type        public.room_type NOT NULL,
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.focus_rooms TO authenticated;
GRANT ALL ON public.focus_rooms TO service_role;
ALTER TABLE public.focus_rooms ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_focus_rooms_owner ON public.focus_rooms(owner_id, is_active);

CREATE TABLE public.focus_room_participants (
  room_id    uuid NOT NULL REFERENCES public.focus_rooms(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.focus_room_participants TO authenticated;
GRANT ALL ON public.focus_room_participants TO service_role;
ALTER TABLE public.focus_room_participants ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_focus_room_participants_user ON public.focus_room_participants(user_id);

-- Helper: am I the room owner?
CREATE OR REPLACE FUNCTION public.is_room_owner(_room uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.focus_rooms WHERE id = _room AND owner_id = _user);
$$;

-- focus_rooms policies
CREATE POLICY "owner manages rooms" ON public.focus_rooms
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "participants read their rooms" ON public.focus_rooms
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.focus_room_participants p
    WHERE p.room_id = focus_rooms.id AND p.user_id = auth.uid()
  ));

-- focus_room_participants policies
CREATE POLICY "owner manages participants" ON public.focus_room_participants
  FOR ALL TO authenticated
  USING (public.is_room_owner(room_id, auth.uid()))
  WITH CHECK (public.is_room_owner(room_id, auth.uid()));

CREATE POLICY "participants see own membership" ON public.focus_room_participants
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_focus_rooms_updated_at
BEFORE UPDATE ON public.focus_rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Penalty Records (universal $20 break-glass log)
CREATE TABLE public.penalty_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents    integer NOT NULL DEFAULT 2000,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','held_for_approval')),
  justification   text,
  stripe_charge_id text UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.penalty_records TO authenticated;
GRANT ALL ON public.penalty_records TO service_role;
ALTER TABLE public.penalty_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own penalties" ON public.penalty_records
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own penalties" ON public.penalty_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins see all penalties" ON public.penalty_records
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.lock_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_room_participants;