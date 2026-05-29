
-- 1. Profiles: restrict SELECT
DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;

CREATE POLICY "profiles readable to self, teammates, admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE (tm.lead_id = auth.uid() AND tm.member_id = profiles.user_id)
       OR (tm.member_id = auth.uid() AND tm.lead_id = profiles.user_id)
  )
);

-- 2. user_roles: admin-only INSERT/UPDATE/DELETE
CREATE POLICY "admins insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. vouch_responses: only updatable while parent vote is pending
DROP POLICY IF EXISTS "voucher updates own response" ON public.vouch_responses;

CREATE POLICY "voucher updates own response while pending"
ON public.vouch_responses
FOR UPDATE
TO authenticated
USING (
  auth.uid() = voucher_id
  AND EXISTS (
    SELECT 1 FROM public.vouch_votes v
    WHERE v.id = vouch_responses.vote_id AND v.status = 'pending'
  )
)
WITH CHECK (
  auth.uid() = voucher_id
  AND EXISTS (
    SELECT 1 FROM public.vouch_votes v
    WHERE v.id = vouch_responses.vote_id AND v.status = 'pending'
  )
);
