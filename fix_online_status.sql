-- FIX FOR "ALWAYS ONLINE" ISSUE

-- 1. Remove the default 'now()' from the column so new users are not 'Online' until they actually log in.
ALTER TABLE public.profiles ALTER COLUMN last_active_at DROP DEFAULT;

-- 2. Reset existing users to NULL (Offline) so the heartbeat can accurately reflect current activity.
UPDATE public.profiles SET last_active_at = NULL;
