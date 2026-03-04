/**
 * RECON Skill Catalog — load and query skill definitions; enforce execution mode policy.
 */

import { createServerClient } from '@/lib/supabase';
import type { SkillCatalogEntry, SkillRun, SkillRunInsert, SkillRunUpdate } from '@/lib/database.types';
import type { ProfileRole } from '@/lib/auth';

export type ExecutionMode = 'assist' | 'hitl' | 'autonomous';
export type SkillFamily = 'research' | 'knowledge_base' | 'outreach';

/** List all active skills, optionally by family */
export async function listSkills(family?: SkillFamily): Promise<SkillCatalogEntry[]> {
    const supabase = createServerClient();
    let query = supabase
        .from('skill_catalog')
        .select('*')
        .eq('status', 'active')
        .order('skill_family')
        .order('skill_key');
    if (family) {
        query = query.eq('skill_family', family);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as SkillCatalogEntry[];
}

/** Get a single skill by skill_key */
export async function getSkillByKey(skillKey: string): Promise<SkillCatalogEntry | null> {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('skill_catalog')
        .select('*')
        .eq('skill_key', skillKey)
        .eq('status', 'active')
        .single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data as SkillCatalogEntry;
}

/** Get a single skill by id */
export async function getSkillById(id: string): Promise<SkillCatalogEntry | null> {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('skill_catalog')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data as SkillCatalogEntry;
}

/**
 * Check whether the requested execution mode is allowed for this skill and role.
 * Policy: autonomous only for super_admin until quality thresholds are met; assist/hitl for operator+.
 */
export function isExecutionModeAllowed(
    skill: SkillCatalogEntry,
    requestedMode: ExecutionMode,
    role: ProfileRole
): { allowed: boolean; reason?: string } {
    const modes = (skill.execution_modes ?? []) as string[];
    if (!modes.includes(requestedMode)) {
        return { allowed: false, reason: `Skill ${skill.skill_key} does not support execution mode "${requestedMode}". Allowed: ${modes.join(', ')}` };
    }
    if (requestedMode === 'autonomous') {
        if (role !== 'super_admin') {
            return { allowed: false, reason: 'Autonomous mode is restricted to super_admin until quality gates are passed.' };
        }
    }
    return { allowed: true };
}

/** Create a skill run record (pending → caller completes execution and updates) */
export async function createSkillRun(
    skillId: string,
    skillKey: string,
    executionMode: ExecutionMode,
    inputPayload: Record<string, unknown>,
    createdBy: string | null
): Promise<{ id: string }> {
    const supabase = createServerClient();
    const insert: SkillRunInsert = {
        skill_id: skillId,
        skill_key: skillKey,
        execution_mode: executionMode,
        input_payload: inputPayload as SkillRunInsert['input_payload'],
        status: 'running',
        lifecycle_state: 'draft',
        created_by: createdBy ?? undefined,
    };
    const { data, error } = await supabase.from('skill_runs').insert(insert as never).select('id').single();
    if (error) throw error;
    return { id: (data as { id: string })!.id };
}

/** Update skill run on completion or failure */
export async function completeSkillRun(
    runId: string,
    updates: {
        status: 'completed' | 'failed';
        output_payload?: Record<string, unknown>;
        output_asset_id?: string;
        output_asset_type?: SkillRunInsert['output_asset_type'];
        lifecycle_state?: 'draft' | 'reviewed' | 'approved' | 'archived';
        error_message?: string;
    }
): Promise<void> {
    const supabase = createServerClient();
    const row: SkillRunUpdate = {
        status: updates.status,
        completed_at: new Date().toISOString(),
    };
    if (updates.output_payload !== undefined) row.output_payload = updates.output_payload as SkillRunUpdate['output_payload'];
    if (updates.output_asset_id !== undefined) row.output_asset_id = updates.output_asset_id;
    if (updates.output_asset_type !== undefined) row.output_asset_type = updates.output_asset_type;
    if (updates.lifecycle_state !== undefined) row.lifecycle_state = updates.lifecycle_state;
    if (updates.error_message !== undefined) row.error_message = updates.error_message;
    const { error } = await supabase.from('skill_runs').update(row as never).eq('id', runId);
    if (error) throw error;
}

/** List skill runs with optional filters */
export async function listSkillRuns(filters: {
    status?: string;
    lifecycle_state?: string;
    skill_key?: string;
    limit?: number;
    offset?: number;
}): Promise<{ runs: SkillRun[]; total: number }> {
    const supabase = createServerClient();
    const limit = Math.min(filters.limit ?? 50, 100);
    const offset = filters.offset ?? 0;
    let query = supabase
        .from('skill_runs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.lifecycle_state) query = query.eq('lifecycle_state', filters.lifecycle_state);
    if (filters.skill_key) query = query.eq('skill_key', filters.skill_key);
    const { data, error, count } = await query;
    if (error) throw error;
    return { runs: (data ?? []) as SkillRun[], total: count ?? (data?.length ?? 0) };
}

/** Update skill run lifecycle (approval gate): set lifecycle_state, approved_by, approved_at or rejection_reason */
export async function updateSkillRunLifecycle(
    runId: string,
    updates: {
        lifecycle_state: 'reviewed' | 'approved' | 'archived';
        approved_by: string | null;
        rejection_reason?: string | null;
    }
): Promise<void> {
    const supabase = createServerClient();
    const row: SkillRunUpdate = {
        lifecycle_state: updates.lifecycle_state,
        approved_by: updates.approved_by ?? undefined,
        approved_at: updates.lifecycle_state !== 'archived' && updates.approved_by ? new Date().toISOString() : undefined,
        rejection_reason: updates.rejection_reason ?? undefined,
    };
    const { error } = await supabase.from('skill_runs').update(row as never).eq('id', runId);
    if (error) throw error;
}
