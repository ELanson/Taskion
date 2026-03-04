import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking ai_action_logs schema...");
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'ai_action_logs' });
    // If rpc doesn't exist, we'll try a simple select
    if (error) {
        console.log("RPC failed, trying sample select...");
        const { data: sample, error: err2 } = await supabase.from('ai_action_logs').select('*').limit(1);
        if (err2) console.error("Error:", err2.message);
        else console.log("Sample log:", sample);
    } else {
        console.log("Columns:", data);
    }
}

checkSchema();
