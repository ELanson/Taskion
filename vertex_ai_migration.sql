-- Vertex AI Gemini Integration Migration
-- Adds cloud intelligence settings to the Workspace Governance model

ALTER TABLE workspace_settings
ADD COLUMN IF NOT EXISTS cloud_ai_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cloud_ai_model TEXT DEFAULT 'gemini-1.5-pro';

-- Update existing record with defaults
UPDATE workspace_settings 
SET cloud_ai_enabled = false, 
    cloud_ai_model = 'gemini-1.5-pro'
WHERE cloud_ai_enabled IS NULL;

COMMENT ON COLUMN workspace_settings.cloud_ai_enabled IS 'Toggle for using Google Cloud Vertex AI (Gemini) for advanced reasoning.';
COMMENT ON COLUMN workspace_settings.cloud_ai_model IS 'The specific Gemini model to use when Cloud AI is enabled (e.g., gemini-1.5-pro, gemini-1.5-flash).';
