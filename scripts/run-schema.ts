// Script to run schema.sql against Supabase
// Run with: npx tsx scripts/run-schema.ts

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSchema() {
    console.log('Reading schema.sql...');
    const sql = readFileSync('supabase/schema.sql', 'utf-8');

    console.log('Executing schema against Supabase...');

    // Split into individual statements and execute
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
        console.log(`\nExecuting: ${statement.substring(0, 60)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
            // Try direct query for DDL statements
            const { error: queryError } = await supabase.from('_').select().limit(0);
            console.log('Note: DDL statements may need to be run in SQL Editor');
        }
    }

    // Verify tables exist by querying them
    console.log('\n\nVerifying tables...');

    const { data: demos, error: demosError } = await supabase
        .from('demos')
        .select('*')
        .limit(1);

    if (demosError) {
        console.error('demos table error:', demosError.message);
    } else {
        console.log('✓ demos table exists');
    }

    const { data: rateLimits, error: rateLimitsError } = await supabase
        .from('rate_limits')
        .select('*');

    if (rateLimitsError) {
        console.error('rate_limits table error:', rateLimitsError.message);
    } else {
        console.log('✓ rate_limits table exists');
        console.log('  Rate limits:', rateLimits);
    }
}

runSchema().catch(console.error);
