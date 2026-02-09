// Quick verification that Supabase tables exist
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
    console.log('Verifying Supabase tables...\n');

    // Check demos table
    const { data: demos, error: demosError } = await supabase
        .from('demos')
        .select('*')
        .limit(1);

    if (demosError) {
        console.error('❌ demos table:', demosError.message);
    } else {
        console.log('✅ demos table exists');
    }

    // Check rate_limits table
    const { data: rateLimits, error: rateLimitsError } = await supabase
        .from('rate_limits')
        .select('*');

    if (rateLimitsError) {
        console.error('❌ rate_limits table:', rateLimitsError.message);
    } else {
        console.log('✅ rate_limits table exists');
        console.log('   Defaults:', rateLimits?.map(r => `${r.key}=${r.value}`).join(', '));
    }
}

verify().catch(console.error);
