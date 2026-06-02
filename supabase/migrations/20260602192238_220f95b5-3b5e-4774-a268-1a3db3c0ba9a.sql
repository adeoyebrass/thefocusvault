-- Harden role checks so signed-in users do not execute a SECURITY DEFINER function directly.
DROP POLICY IF EXISTS "admins delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "users see own roles" ON public.user_roles;

CREATE POLICY "users see own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
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
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Prevent a lead from adding themselves as a voucher through direct API access.
ALTER TABLE public.team_members
ADD CONSTRAINT team_members_no_self_membership CHECK (lead_id <> member_id) NOT VALID;

DROP POLICY IF EXISTS "lead manages own roster (insert)" ON public.team_members;
CREATE POLICY "lead manages own roster (insert)"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = lead_id AND lead_id <> member_id);

-- Ensure break-glass vote owners cannot approve themselves, even if they try direct API calls.
REVOKE UPDATE ON public.vouch_votes FROM authenticated;
GRANT UPDATE (reason) ON public.vouch_votes TO authenticated;
GRANT ALL ON public.vouch_votes TO service_role;

DROP POLICY IF EXISTS "owner updates own vote" ON public.vouch_votes;
DROP POLICY IF EXISTS "owner updates own vote reason" ON public.vouch_votes;
CREATE POLICY "owner updates own vote reason"
ON public.vouch_votes
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id AND status = 'pending')
WITH CHECK (auth.uid() = owner_id AND status = 'pending');

DROP POLICY IF EXISTS "voucher inserts own response" ON public.vouch_responses;
CREATE POLICY "voucher inserts own response"
ON public.vouch_responses
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = voucher_id
  AND EXISTS (
    SELECT 1
    FROM public.vouch_votes v
    JOIN public.team_members tm ON tm.lead_id = v.owner_id
    WHERE v.id = vouch_responses.vote_id
      AND v.status = 'pending'
      AND tm.member_id = auth.uid()
      AND v.owner_id <> auth.uid()
  )
);

DROP POLICY IF EXISTS "voucher updates own response while pending" ON public.vouch_responses;
CREATE POLICY "voucher updates own response while pending"
ON public.vouch_responses
FOR UPDATE
TO authenticated
USING (
  auth.uid() = voucher_id
  AND EXISTS (
    SELECT 1
    FROM public.vouch_votes v
    WHERE v.id = vouch_responses.vote_id
      AND v.status = 'pending'
      AND v.owner_id <> auth.uid()
  )
)
WITH CHECK (
  auth.uid() = voucher_id
  AND EXISTS (
    SELECT 1
    FROM public.vouch_votes v
    WHERE v.id = vouch_responses.vote_id
      AND v.status = 'pending'
      AND v.owner_id <> auth.uid()
  )
);