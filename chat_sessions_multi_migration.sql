-- Migration: Allow Multiple AI Chat Sessions per User
-- Description: Drops the unique constraint that restricts users to one chat session per module, and adds a title column for history tracking.

-- 1. Drop the unique constraint (user_id, module)
ALTER TABLE public.ai_chat_sessions DROP CONSTRAINT IF EXISTS ai_chat_sessions_user_id_module_key;

-- 2. Add title column for auto-generated chat names
ALTER TABLE public.ai_chat_sessions ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'New Chat';
