/**
 * Create a super_admin user in Supabase.
 * Usage: npx tsx scripts/create-super-user.ts <email> <password>
 * Or: EMAIL=x@x.com PASSWORD=xxx npx tsx scripts/create-super-user.ts
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const email = process.env.EMAIL || process.argv[2];
const password = process.env.PASSWORD || process.argv[3];

if (!email || !password) {
  console.error('Usage: npx tsx scripts/create-super-user.ts <email> <password>');
  console.error('   Or: EMAIL=you@example.com PASSWORD=yourpassword npx tsx scripts/create-super-user.ts');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message?.includes('already been registered')) {
      console.log('User already exists. Updating profile to super_admin...');
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users?.find((u) => u.email === email);
      if (!found) {
        console.error('Could not find existing user.');
        process.exit(1);
      }
      await setSuperAdmin(found.id);
      console.log(`Profile updated: ${email} is now super_admin.`);
      return;
    }
    console.error('Create user error:', createError.message);
    process.exit(1);
  }

  if (!user?.user?.id) {
    console.error('No user returned.');
    process.exit(1);
  }

  await setSuperAdmin(user.user.id);
  console.log(`Super user created: ${email} (${user.user.id})`);
}

async function setSuperAdmin(userId: string) {
  const { error } = await supabase.from('profiles').upsert(
    { id: userId, role: 'super_admin', updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  );
  if (error) {
    console.error('Profile upsert error:', error.message);
    process.exit(1);
  }
}

main();
