import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';
import { parseCsvBuffer } from '@/lib/radarCsv';

/** POST /api/radar/prospects/import — Multipart CSV upload */
export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
            return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const { rows, errors } = parseCsvBuffer(Buffer.from(buffer));

        if (rows.length === 0) {
            return NextResponse.json({ error: 'No valid rows found in CSV', errors }, { status: 400 });
        }

        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Bulk upsert — on email conflict, update other fields
        const inserts = rows.map((row) => ({
            ...row,
            email: row.email?.toLowerCase() || undefined,
            imported_by: user?.id,
        }));

        const { data, error } = await supabase
            .from('prospects')
            .upsert(inserts, {
                onConflict: 'email',
                ignoreDuplicates: false,
            })
            .select('id');

        if (error) {
            console.error('Prospect import error:', error);
            return NextResponse.json({ error: 'Import failed', detail: error.message }, { status: 500 });
        }

        return NextResponse.json({
            imported: data?.length || 0,
            total_rows: rows.length,
            errors,
        });
    } catch (err) {
        console.error('RADAR import error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
