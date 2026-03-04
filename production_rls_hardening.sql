-- Production Security Hardening: Enable RLS on Organizational Tables
-- This script secures the 'Unrestricted' tables identified in the security audit.

-- 1. Enable RLS on all organizational tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 2. Define SELECT Policies (Allow authenticated users to view organization structure)
DROP POLICY IF EXISTS "Departments are viewable by authenticated users" ON public.departments;
CREATE POLICY "Departments are viewable by authenticated users" 
ON public.departments FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Teams are viewable by authenticated users" ON public.teams;
CREATE POLICY "Teams are viewable by authenticated users" 
ON public.teams FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Team members are viewable by authenticated users" ON public.team_members;
CREATE POLICY "Team members are viewable by authenticated users" 
ON public.team_members FOR SELECT 
TO authenticated 
USING (true);

-- 3. Define Write Policies (Restrict to Service Role/Admins only)
-- Since the frontend does not directly INSERT/UPDATE/DELETE on these via the Anon client,
-- and the API uses the Service Role (which bypasses RLS), we don't need to add 
-- any write policies for regular users. This effectively makes them read-only for the frontend.
