-- Update AI Chat Sessions for multi-session support
-- 1. Remove the restrictive unique constraint
ALTER TABLE public.ai_chat_sessions DROP CONSTRAINT IF EXISTS ai_chat_sessions_user_id_module_key;

-- 2. Add the title column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_attribute 
                   WHERE  attrelid = 'public.ai_chat_sessions'::regclass 
                   AND    attname = 'title' 
                   AND    NOT attisdropped) THEN
        ALTER TABLE public.ai_chat_sessions ADD COLUMN title text;
    END IF;
END $$;

-- 3. Ensure the module column is present and flexible
-- (Already exists from previous migration, but ensuring no regression)
