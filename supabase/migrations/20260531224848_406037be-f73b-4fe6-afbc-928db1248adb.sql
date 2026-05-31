
-- 1. SECURITY: vouch_votes — owner can only edit reason; status managed by server (service role).
REVOKE UPDATE ON public.vouch_votes FROM authenticated;
GRANT UPDATE (reason) ON public.vouch_votes TO authenticated;

DROP POLICY IF EXISTS "owner updates own vote" ON public.vouch_votes;
CREATE POLICY "owner updates own vote reason"
ON public.vouch_votes
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id AND status = 'pending')
WITH CHECK (auth.uid() = owner_id AND status = 'pending');

-- 2. SECURITY: lock down SECURITY DEFINER functions from anon.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- 3. lock_events — telemetry of when a vault user locks/unlocks.
CREATE TABLE public.lock_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('locked','unlocked')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_lock_events_user ON public.lock_events(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.lock_events TO authenticated;
GRANT ALL ON public.lock_events TO service_role;

ALTER TABLE public.lock_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own lock events"
ON public.lock_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users + their lead see lock events"
ON public.lock_events FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.member_id = lock_events.user_id AND tm.lead_id = auth.uid()
  )
);

-- 4. team_reminders — lead → member nudges.
CREATE TABLE public.team_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  member_id UUID NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_reminders_member ON public.team_reminders(member_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.team_reminders TO authenticated;
GRANT ALL ON public.team_reminders TO service_role;

ALTER TABLE public.team_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead creates reminders for own roster"
ON public.team_reminders FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = lead_id
  AND EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.lead_id = auth.uid() AND tm.member_id = team_reminders.member_id
  )
);

CREATE POLICY "lead or member sees reminder"
ON public.team_reminders FOR SELECT TO authenticated
USING (auth.uid() = lead_id OR auth.uid() = member_id);

CREATE POLICY "member marks own reminder read"
ON public.team_reminders FOR UPDATE TO authenticated
USING (auth.uid() = member_id)
WITH CHECK (auth.uid() = member_id);

-- 5. waitlist — public sign-up for non-customers.
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_waitlist_email ON public.waitlist(lower(email));

GRANT INSERT ON public.waitlist TO anon, authenticated;
GRANT SELECT, DELETE ON public.waitlist TO service_role;
GRANT ALL ON public.waitlist TO service_role;

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can join waitlist"
ON public.waitlist FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(email) BETWEEN 3 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(location) BETWEEN 2 AND 200
);

CREATE POLICY "admins read waitlist"
ON public.waitlist FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
