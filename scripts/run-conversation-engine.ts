// Script to run the conversation engine migration
// Run with: npx tsx scripts/run-conversation-engine.ts

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    // Verify tables after manual SQL execution
    console.log('Verifying conversation engine tables...\n');

    for (const table of ['leads', 'sessions', 'messages']) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (error) {
            console.log(`✗ ${table} — ${error.message}`);
            console.log(`  → Run the migration SQL in Supabase SQL Editor`);
        } else {
            console.log(`✓ ${table} exists`);
        }
    }
}

run().catch(console.error);
