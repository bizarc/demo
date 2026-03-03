/**
 * RADAR CSV parser for prospect import.
 * No external dependencies — manual parsing for basic CSVs.
 */

export interface ProspectRow {
    email?: string;
    phone?: string;
    linkedin_url?: string;
    instagram_handle?: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    title?: string;
    industry?: string;
    company_size?: string;
    website_url?: string;
    location?: string;
    tags?: string[];
}

export interface ParseCsvResult {
    rows: ProspectRow[];
    errors: { row: number; message: string }[];
}

const MAX_ROWS = 5000;

/** Normalize column header to a known field name */
function normalizeHeader(h: string): string {
    return h.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
}

/** Parse a CSV buffer into prospect rows, returning rows and per-row errors */
export function parseCsvBuffer(buffer: Buffer | string): ParseCsvResult {
    const text = typeof buffer === 'string' ? buffer : buffer.toString('utf-8');
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
        return { rows: [], errors: [{ row: 0, message: 'CSV has no data rows' }] };
    }

    const headers = parseRow(lines[0]).map(normalizeHeader);
    const rows: ProspectRow[] = [];
    const errors: { row: number; message: string }[] = [];

    const dataLines = lines.slice(1, MAX_ROWS + 1);
    if (lines.length - 1 > MAX_ROWS) {
        errors.push({ row: 0, message: `CSV exceeds ${MAX_ROWS} rows — only first ${MAX_ROWS} imported` });
    }

    for (let i = 0; i < dataLines.length; i++) {
        const rowNum = i + 2; // 1-indexed, accounting for header
        const values = parseRow(dataLines[i]);

        const raw: Record<string, string> = {};
        headers.forEach((h, idx) => {
            raw[h] = (values[idx] || '').trim();
        });

        // Normalize email
        const email = raw.email ? raw.email.toLowerCase() : undefined;

        // Validate at least one contact identifier
        if (!email && !raw.phone && !raw.linkedin_url && !raw.instagram_handle) {
            errors.push({ row: rowNum, message: 'Row has no email, phone, LinkedIn URL, or Instagram handle — skipped' });
            continue;
        }

        // Validate email format if provided
        if (email && !isValidEmail(email)) {
            errors.push({ row: rowNum, message: `Invalid email format: ${email}` });
            continue;
        }

        const tags = raw.tags
            ? raw.tags.split(/[|;,]/).map((t) => t.trim()).filter(Boolean)
            : [];

        rows.push({
            email: email || undefined,
            phone: raw.phone || undefined,
            linkedin_url: raw.linkedin_url || undefined,
            instagram_handle: raw.instagram_handle || raw.instagram || undefined,
            first_name: raw.first_name || raw.firstname || undefined,
            last_name: raw.last_name || raw.lastname || undefined,
            company_name: raw.company_name || raw.company || undefined,
            title: raw.title || raw.job_title || undefined,
            industry: raw.industry || undefined,
            company_size: raw.company_size || undefined,
            website_url: raw.website_url || raw.website || undefined,
            location: raw.location || raw.city || undefined,
            tags: tags.length > 0 ? tags : undefined,
        });
    }

    return { rows, errors };
}

/** Parse a single CSV row, handling quoted fields */
function parseRow(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                fields.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
    }
    fields.push(current);
    return fields;
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
