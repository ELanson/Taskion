-- Dev Bypass User Injection
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, role, is_super_admin)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'dev@local.test',
    '{"full_name": "Dev User"}',
    now(),
    now(),
    'authenticated',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, avatar_url, is_admin, global_role)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Development User',
    null,
    true,
    'Global Admin'
) ON CONFLICT (id) DO UPDATE SET is_admin = true, global_role = 'Global Admin';
