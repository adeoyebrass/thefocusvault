
-- Role enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles readable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Timestamp helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Team members (lead's roster)
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lead_id, member_id)
);
GRANT SELECT, INSERT, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead manages own roster (select)" ON public.team_members
  FOR SELECT TO authenticated USING (auth.uid() = lead_id OR auth.uid() = member_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "lead manages own roster (insert)" ON public.team_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = lead_id);
CREATE POLICY "lead manages own roster (delete)" ON public.team_members
  FOR DELETE TO authenticated USING (auth.uid() = lead_id);

-- Vouch votes
CREATE TABLE public.vouch_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | denied
  required_yes INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.vouch_votes TO authenticated;
GRANT ALL ON public.vouch_votes TO service_role;
ALTER TABLE public.vouch_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner sees own votes" ON public.vouch_votes
  FOR SELECT TO authenticated USING (
    auth.uid() = owner_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.lead_id = vouch_votes.owner_id AND tm.member_id = auth.uid())
  );
CREATE POLICY "owner creates own vote" ON public.vouch_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner updates own vote" ON public.vouch_votes
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

-- Vouch responses
CREATE TABLE public.vouch_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES public.vouch_votes(id) ON DELETE CASCADE,
  voucher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('yes','no')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vote_id, voucher_id)
);
GRANT SELECT, INSERT, UPDATE ON public.vouch_responses TO authenticated;
GRANT ALL ON public.vouch_responses TO service_role;
ALTER TABLE public.vouch_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "responses visible to vote stakeholders" ON public.vouch_responses
  FOR SELECT TO authenticated USING (
    auth.uid() = voucher_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.vouch_votes v WHERE v.id = vouch_responses.vote_id AND v.owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vouch_votes v
      JOIN public.team_members tm ON tm.lead_id = v.owner_id
      WHERE v.id = vouch_responses.vote_id AND tm.member_id = auth.uid()
    )
  );
CREATE POLICY "voucher inserts own response" ON public.vouch_responses
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = voucher_id
    AND EXISTS (
      SELECT 1 FROM public.vouch_votes v
      JOIN public.team_members tm ON tm.lead_id = v.owner_id
      WHERE v.id = vouch_responses.vote_id AND tm.member_id = auth.uid()
    )
  );
CREATE POLICY "voucher updates own response" ON public.vouch_responses
  FOR UPDATE TO authenticated USING (auth.uid() = voucher_id);

-- Focus sessions (analytics)
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  minutes INT
);
GRANT SELECT, INSERT, UPDATE ON public.focus_sessions TO authenticated;
GRANT ALL ON public.focus_sessions TO service_role;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own sessions" ON public.focus_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users insert own sessions" ON public.focus_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own sessions" ON public.focus_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
