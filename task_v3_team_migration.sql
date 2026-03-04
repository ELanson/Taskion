-- TICKEL Phase 3: Team Structure & Organizational Intelligence Schema

-- 1. Extend Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS global_role text DEFAULT 'User' CHECK (global_role IN ('Global Admin', 'Department Admin', 'Manager', 'User'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS productivity_score numeric DEFAULT 0;

-- 2. Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Teams
CREATE TABLE IF NOT EXISTS public.teams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL DEFAULT 'Contributor' CHECK (role IN ('Manager', 'Contributor', 'Viewer')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(team_id, user_id)
);

-- 5. User Skills
CREATE TABLE IF NOT EXISTS public.user_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    skill_name text NOT NULL,
    proficiency integer DEFAULT 1 CHECK (proficiency >= 1 AND proficiency <= 5),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, skill_name)
);

-- 6. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if a user is a Global Admin
CREATE OR REPLACE FUNCTION public.is_global_admin(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  is_admin_var boolean;
BEGIN
  SELECT (global_role = 'Global Admin' OR is_admin = true) INTO is_admin_var FROM public.profiles WHERE id = user_uuid;
  RETURN COALESCE(is_admin_var, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Departments Policies
CREATE POLICY "Departments are viewable by all authenticated users" 
ON public.departments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Departments can be managed by Global Admins" 
ON public.departments FOR ALL USING (public.is_global_admin(auth.uid()));

-- Teams Policies
CREATE POLICY "Teams are viewable by all authenticated users" 
ON public.teams FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teams can be managed by Global Admins" 
ON public.teams FOR ALL USING (public.is_global_admin(auth.uid()));

-- Team Members Policies
CREATE POLICY "Team Members are viewable by all authenticated users" 
ON public.team_members FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Team Members can be managed by Global Admins" 
ON public.team_members FOR ALL USING (public.is_global_admin(auth.uid()));

-- User Skills Policies
CREATE POLICY "User Skills are viewable by all authenticated users" 
ON public.user_skills FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own skills" 
ON public.user_skills FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user skills" 
ON public.user_skills FOR ALL USING (public.is_global_admin(auth.uid()));

-- Audit Logs Policies
CREATE POLICY "Audit Logs viewable by Global Admins" 
ON public.audit_logs FOR SELECT USING (public.is_global_admin(auth.uid()));

CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- Optional: Add team_id to tasks to link tasks directly to teams (if needed, otherwise we link tasks to projects)
-- ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;
