import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type DemosRow = Database['public']['Tables']['demos']['Row'];

export type DemoWithKb = DemosRow & { knowledge_base_id: string | null };

/**
 * Fetch a demo by id and attach knowledge_base_id from demo_knowledge_bases (first linked KB).
 * Use this wherever a demo is needed with its linked knowledge base for RAG or display.
 */
export async function getDemoWithKb(
    supabase: SupabaseClient<Database>,
    demoId: string
): Promise<DemoWithKb | null> {
    const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('*')
        .eq('id', demoId)
        .is('deleted_at', null)
        .single();

    if (demoError || !demo) return null;

    const { data: links } = await supabase
        .from('demo_knowledge_bases')
        .select('kb_id')
        .eq('demo_id', demoId)
        .limit(1);

    const kbId = links?.[0]?.kb_id ?? null;
    return { ...demo, knowledge_base_id: kbId } as DemoWithKb;
}
