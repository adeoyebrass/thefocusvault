-- No direct user updates to break-glass vote rows. Status and resolution are server-controlled.
REVOKE UPDATE ON public.vouch_votes FROM authenticated;
GRANT ALL ON public.vouch_votes TO service_role;
DROP POLICY IF EXISTS "owner updates own vote" ON public.vouch_votes;
DROP POLICY IF EXISTS "owner updates own vote reason" ON public.vouch_votes;

-- No direct user updates to reminders; trusted server logic can handle read states later if needed.
REVOKE UPDATE ON public.team_reminders FROM authenticated;
GRANT ALL ON public.team_reminders TO service_role;
DROP POLICY IF EXISTS "member marks own reminder read" ON public.team_reminders;