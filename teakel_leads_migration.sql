-- Teakel Leads Table Migration
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS teakel_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    role TEXT,
    website TEXT,
    address TEXT,
    source TEXT DEFAULT 'manual' CHECK (source IN ('scraping', 'vision', 'manual', 'search')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE teakel_leads ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own leads
CREATE POLICY "Users can view their own leads"
    ON teakel_leads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
    ON teakel_leads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
    ON teakel_leads FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
    ON teakel_leads FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS teakel_leads_user_id_idx ON teakel_leads(user_id);
CREATE INDEX IF NOT EXISTS teakel_leads_email_idx ON teakel_leads(email);
CREATE INDEX IF NOT EXISTS teakel_leads_created_at_idx ON teakel_leads(created_at DESC);

-- Auto-update updated_at on record change
CREATE OR REPLACE FUNCTION update_teakel_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teakel_leads_updated_at
    BEFORE UPDATE ON teakel_leads
    FOR EACH ROW EXECUTE FUNCTION update_teakel_leads_updated_at();
