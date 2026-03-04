-- Create the workspace_settings table
CREATE TABLE IF NOT EXISTS public.workspace_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- General Settings
    name TEXT NOT NULL DEFAULT 'Rickel Industries',
    description TEXT,
    industry TEXT,
    timezone TEXT DEFAULT 'UTC',
    working_hours_start TIME DEFAULT '09:00:00',
    working_hours_end TIME DEFAULT '17:00:00',
    currency TEXT DEFAULT 'USD',
    
    -- Defaults
    default_task_status TEXT DEFAULT 'todo',
    default_task_priority TEXT DEFAULT 'medium',
    default_due_date_offset_days INTEGER DEFAULT 3,
    tasks_visible_to TEXT DEFAULT 'team',
    
    -- AI
    ai_access TEXT DEFAULT 'all',
    ai_data_scope TEXT DEFAULT 'user',
    ai_auto_execute BOOLEAN DEFAULT false,
    ai_auto_create_subtasks BOOLEAN DEFAULT true,
    ai_usage_daily_cap INTEGER DEFAULT 50,
    ai_system_prompt TEXT,
    
    -- Notifications
    notify_overdue_days INTEGER DEFAULT 1,
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '18:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    weekend_notifications BOOLEAN DEFAULT false,
    
    -- Security
    require_2fa BOOLEAN DEFAULT false,
    enforce_sso BOOLEAN DEFAULT false,
    session_timeout_minutes INTEGER DEFAULT 120,
    allow_external_collaborators BOOLEAN DEFAULT false,
    allow_public_links BOOLEAN DEFAULT false,
    
    -- Analytics
    default_report_period TEXT DEFAULT 'week',
    auto_weekly_summary BOOLEAN DEFAULT true,
    data_retention_days INTEGER DEFAULT 365,
    
    -- Integrations
    slack_connected BOOLEAN DEFAULT false,
    google_calendar_connected BOOLEAN DEFAULT false,
    custom_webhook_url TEXT,
    
    -- Billing
    plan_tier TEXT DEFAULT 'free',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure only one row exists (Singleton Pattern)
-- Create a unique index on a constant value to prevent multiple rows
CREATE UNIQUE INDEX IF NOT EXISTS workspace_settings_single_row_idx ON public.workspace_settings ((true));

-- Enable RLS
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

-- Base Policy: Everyone authenticated can view the settings
CREATE POLICY "Everyone can view workspace settings"
    ON public.workspace_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin Policy: Only global admins can update the settings
-- Assumes role checks exist in the app, or we check auth.users / profiles
CREATE POLICY "Only admins can update workspace settings"
    ON public.workspace_settings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Insert the default row if it doesn't exist
INSERT INTO public.workspace_settings (name, plan_tier) 
VALUES ('Rickel Industries', 'pro')
ON CONFLICT DO NOTHING;
