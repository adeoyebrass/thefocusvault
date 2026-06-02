-- Stop normal signed-in users from writing role rows directly.
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

DROP POLICY IF EXISTS "admins delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "users see own roles" ON public.user_roles;
CREATE POLICY "users see own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Keep the helper available only to trusted backend/service contexts.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- Remove user-facing RLS dependencies on has_role; admin reads happen through trusted server functions.
DROP POLICY IF EXISTS "users see own sessions" ON public.focus_sessions;
CREATE POLICY "users see own sessions"
ON public.focus_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles readable to self, teammates, admin" ON public.profiles;
CREATE POLICY "profiles readable to self and teammates"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE (tm.lead_id = auth.uid() AND tm.member_id = profiles.user_id)
       OR (tm.member_id = auth.uid() AND tm.lead_id = profiles.user_id)
  )
);

DROP POLICY IF EXISTS "lead manages own roster (select)" ON public.team_members;
CREATE POLICY "lead and member see roster"
ON public.team_members
FOR SELECT
TO authenticated
USING (auth.uid() = lead_id OR auth.uid() = member_id);

DROP POLICY IF EXISTS "users + their lead see lock events" ON public.lock_events;
CREATE POLICY "users and their lead see lock events"
ON public.lock_events
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.member_id = lock_events.user_id AND tm.lead_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "owner sees own votes" ON public.vouch_votes;
CREATE POLICY "vote stakeholders see votes"
ON public.vouch_votes
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.lead_id = vouch_votes.owner_id AND tm.member_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "responses visible to vote stakeholders" ON public.vouch_responses;
CREATE POLICY "responses visible to vote stakeholders"
ON public.vouch_responses
FOR SELECT
TO authenticated
USING (
  auth.uid() = voucher_id
  OR EXISTS (
    SELECT 1
    FROM public.vouch_votes v
    WHERE v.id = vouch_responses.vote_id AND v.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.vouch_votes v
    JOIN public.team_members tm ON tm.lead_id = v.owner_id
    WHERE v.id = vouch_responses.vote_id AND tm.member_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "admins read waitlist" ON public.waitlist;

-- Database-level guard for the break-glass vote business rule.
CREATE OR REPLACE FUNCTION public.prevent_direct_vouch_vote_resolution()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user = 'authenticated'
     AND (
       NEW.owner_id IS DISTINCT FROM OLD.owner_id
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.required_yes IS DISTINCT FROM OLD.required_yes
       OR NEW.resolved_at IS DISTINCT FROM OLD.resolved_at
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
     ) THEN
    RAISE EXCEPTION 'Only the vote reason can be edited directly.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_vouch_vote_resolution ON public.vouch_votes;
CREATE TRIGGER protect_vouch_vote_resolution
BEFORE UPDATE ON public.vouch_votes
FOR EACH ROW
EXECUTE FUNCTION public.prevent_direct_vouch_vote_resolution();