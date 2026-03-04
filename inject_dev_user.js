import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY // service role needed ideally
);

async function inject() {
    console.log("Injecting dev user into auth.users...");
    // Try to create the user directly via Admin API if we have the service role key
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: 'dev@local.test',
        password: 'password123',
        email_confirm: true,
        user_metadata: { full_name: 'Dev User' }
    });

    if (authError) {
        console.log("Could not auto-create in auth schema:", authError.message);
        // It might already exist
    } else {
        console.log("Created in auth schema:", authData.user.id);
    }

    // Also manually force the profile directly
    const { data: profileData, error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authData?.user?.id || '00000000-0000-0000-0000-000000000000',
        full_name: 'Development User',
        is_admin: true,
        global_role: 'Global Admin'
    });

    if (profileError) {
        console.log("Error upserting profile:", profileError);
    } else {
        console.log("Profile Upserted.");
    }
}

inject();
