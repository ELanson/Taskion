-- Sets the Global Admin role for Whimsical Creator
UPDATE public.profiles
SET global_role = 'Global Admin',
    is_admin = true
WHERE full_name ILIKE '%whimsical%';
