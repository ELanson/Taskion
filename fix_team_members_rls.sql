-- Quick fix for Team Members RLS so assigning doesn't hide teams
DROP POLICY IF EXISTS "Team Members are viewable by all authenticated users" ON public.team_members;

CREATE POLICY "Team Members are viewable by all authenticated users" 
ON public.team_members FOR SELECT USING (true);
