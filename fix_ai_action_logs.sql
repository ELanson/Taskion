-- TICKEL Schema & RLS Unified Fix
-- Run this in your Supabase SQL Editor to resolve "column user_id does not exist" errors.

-- 1. Ensure user_id column exists on all critical tables
DO $$ 
BEGIN 
  -- Projects
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='user_id') THEN
    ALTER TABLE IF EXISTS projects ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;
  
  -- Tasks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='user_id') THEN
    ALTER TABLE IF EXISTS tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;
  
  -- Time Logs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='time_logs' AND column_name='user_id') THEN
    ALTER TABLE IF EXISTS time_logs ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;

  -- AI Action Logs (Create table if missing, then ensure column)
  CREATE TABLE IF NOT EXISTS ai_action_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT now(),
    action_type TEXT NOT NULL,
    details JSONB,
    outcome JSONB
  );
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_action_logs' AND column_name='user_id') THEN
    ALTER TABLE ai_action_logs ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;
END $$;

-- 2. Enable RLS on all tables
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_action_logs ENABLE ROW LEVEL SECURITY;

-- 3. Standardize Policies
-- Projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- AI Action Logs
DROP POLICY IF EXISTS "Users can view own logs" ON ai_action_logs;
CREATE POLICY "Users can view own logs" ON ai_action_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own logs" ON ai_action_logs;
CREATE POLICY "Users can insert own logs" ON ai_action_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Final check for orphan data
-- UPDATE projects SET user_id = auth.uid() WHERE user_id IS NULL;
-- UPDATE tasks SET user_id = auth.uid() WHERE user_id IS NULL;
-- UPDATE ai_action_logs SET user_id = auth.uid() WHERE user_id IS NULL;
