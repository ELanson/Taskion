-- TEAM COLLABORATION MIGRATION

-- 1. Add last_active_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();

-- 2. Create pokes table
CREATE TABLE IF NOT EXISTS public.pokes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    to_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.pokes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for pokes
-- Users can see pokes sent to them or sent by them
CREATE POLICY "Users can view their own pokes" ON public.pokes
    FOR SELECT USING (auth.uid() = from_id OR auth.uid() = to_id);

-- Users can send pokes
CREATE POLICY "Users can send pokes" ON public.pokes
    FOR INSERT WITH CHECK (auth.uid() = from_id);

-- 5. Enable Realtime for pokes
ALTER PUBLICATION supabase_realtime ADD TABLE public.pokes;
