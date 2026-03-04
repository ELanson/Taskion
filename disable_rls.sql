-- Disables Strict RLS for organizational tables to allow smooth local development
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
