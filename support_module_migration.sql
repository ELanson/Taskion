-- ============================================================
-- Support Module: Persistent Tables + RLS
-- Run this in your Supabase SQL editor
-- ============================================================

-- ─── SUPPORT TICKETS ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    category    TEXT NOT NULL DEFAULT 'other'
                CHECK (category IN ('bug','feature','access','performance','other')),
    priority    TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low','medium','high','critical')),
    status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','in_progress','resolved','closed')),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name   TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx  ON public.support_tickets(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_support_ticket_timestamp();

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Policies:
--   • Any authenticated user can create a ticket
--   • Users can see their own tickets
--   • Admins (is_admin=true in profiles) can see all tickets

DROP POLICY IF EXISTS "Users can insert own tickets"  ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets"    ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets"   ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.support_tickets;

CREATE POLICY "Users can insert own tickets"
    ON public.support_tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tickets"
    ON public.support_tickets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
    ON public.support_tickets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can update all tickets"
    ON public.support_tickets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Users can update own tickets"
    ON public.support_tickets FOR UPDATE
    USING (auth.uid() = user_id);

-- ─── FEEDBACK ITEMS ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feedback_items (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    category    TEXT DEFAULT 'Productivity',
    status      TEXT NOT NULL DEFAULT 'considering'
                CHECK (status IN ('planned','in-review','shipped','considering')),
    votes       INT DEFAULT 1,
    created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Votes junction table (prevents double-voting)
CREATE TABLE IF NOT EXISTS public.feedback_votes (
    feedback_id UUID NOT NULL REFERENCES public.feedback_items(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    PRIMARY KEY (feedback_id, user_id)
);

-- Enable RLS
ALTER TABLE public.feedback_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_votes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read feedback
DROP POLICY IF EXISTS "Anyone can view feedback"   ON public.feedback_items;
DROP POLICY IF EXISTS "Users can create feedback"  ON public.feedback_items;
DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback_items;

CREATE POLICY "Anyone can view feedback"
    ON public.feedback_items FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create feedback"
    ON public.feedback_items FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update feedback"
    ON public.feedback_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Votes policies
DROP POLICY IF EXISTS "Users can view own votes"   ON public.feedback_votes;
DROP POLICY IF EXISTS "Users can manage own votes" ON public.feedback_votes;

CREATE POLICY "Users can view votes"
    ON public.feedback_votes FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own votes"
    ON public.feedback_votes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ─── SEED DEFAULT FEEDBACK ITEMS ─────────────────────────────
-- (Only inserts if table is empty)

INSERT INTO public.feedback_items (title, description, category, status, votes) 
SELECT * FROM (VALUES
    ('Dark mode for mobile app',         'Would love dark mode on the mobile version.',                    'UI/UX',         'planned',      24),
    ('Slack integration for task notifications', 'Get notified in Slack when tasks are assigned to me.',  'Integration',   'in-review',    18),
    ('Recurring tasks',                  'Allow tasks to repeat daily, weekly, or monthly automatically.','Productivity',  'planned',      41),
    ('Time tracking export to payroll',  'Export time logs directly to payroll systems.',                 'Finance',       'considering',  12),
    ('Kanban board view',                'Drag-and-drop kanban for task management.',                     'Productivity',  'shipped',      55)
) AS v(title, description, category, status, votes)
WHERE NOT EXISTS (SELECT 1 FROM public.feedback_items LIMIT 1);
