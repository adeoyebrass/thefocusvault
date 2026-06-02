-- Use the request role, not the database owner, when blocking direct vote resolution edits.
CREATE OR REPLACE FUNCTION public.prevent_direct_vouch_vote_resolution()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated'
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

DROP POLICY IF EXISTS "no direct role inserts" ON public.user_roles;
DROP POLICY IF EXISTS "no direct role updates" ON public.user_roles;
DROP POLICY IF EXISTS "no direct role deletes" ON public.user_roles;

CREATE POLICY "no direct role inserts"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "no direct role updates"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "no direct role deletes"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);