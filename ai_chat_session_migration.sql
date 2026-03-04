-- Migration: AI Chat Sessions
-- Description: Adds a table to store per-user, per-module AI chat history.

CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    module text NOT NULL, -- e.g., 'main' or 'support'
    messages jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, module)
);

-- Enable RLS
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to fully manage their own chat sessions
CREATE POLICY "Users can manage their own chat sessions"
ON public.ai_chat_sessions
FOR ALL
USING (auth.uid() = user_id);
