import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Testing insert into ai_action_logs...");
    const { data, error } = await supabase.from('ai_action_logs').insert([
        { action_type: 'test_insert', details: { foo: 'bar' }, outcome: { success: true }, user_id: '6fad946b-9a69-4531-811a-91de41431102' }
    ]);
    if (error) console.error("Error:", error.message);
    else console.log("Success:", data);
}

testInsert();
