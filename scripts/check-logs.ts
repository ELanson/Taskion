import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentLogs() {
    console.log("Checking recent AI action logs...");
    const { data, error } = await supabase
        .from('ai_action_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching logs:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No logs found in ai_action_logs.");
        return;
    }

    data.forEach(log => {
        console.log(`[${log.timestamp}] Action: ${log.action_type}`);
        console.log(`Details: ${JSON.stringify(log.details)}`);
        console.log(`Outcome: ${JSON.stringify(log.outcome)}`);
        console.log('---');
    });
}

checkRecentLogs();
