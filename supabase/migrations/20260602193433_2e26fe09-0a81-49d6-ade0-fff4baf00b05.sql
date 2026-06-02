DROP POLICY IF EXISTS "no direct vote updates" ON public.vouch_votes;
CREATE POLICY "no direct vote updates"
ON public.vouch_votes
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "no direct reminder updates" ON public.team_reminders;
CREATE POLICY "no direct reminder updates"
ON public.team_reminders
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "waitlist entries are private" ON public.waitlist;
CREATE POLICY "waitlist entries are private"
ON public.waitlist
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (false);