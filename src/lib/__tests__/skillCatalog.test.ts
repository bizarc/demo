import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isExecutionModeAllowed } from '../skillCatalog';
import type { SkillCatalogEntry } from '@/lib/database.types';

const baseSkill: SkillCatalogEntry = {
    id: 'skill-1',
    skill_key: 'research.company.profile.v1',
    skill_family: 'research',
    name: 'Company Intelligence',
    description: null,
    domain_tags: [],
    execution_modes: ['assist', 'hitl'],
    input_schema: {},
    output_schema: {},
    quality_gates: [],
    approval_requirements: {},
    config_defaults: {},
    version: 1,
    status: 'active',
    created_by: null,
    created_at: '',
    updated_at: '',
};

describe('isExecutionModeAllowed', () => {
    it('allows assist when skill supports it', () => {
        const result = isExecutionModeAllowed(baseSkill, 'assist', 'operator');
        expect(result.allowed).toBe(true);
    });

    it('allows hitl when skill supports it', () => {
        const result = isExecutionModeAllowed(baseSkill, 'hitl', 'operator');
        expect(result.allowed).toBe(true);
    });

    it('denies autonomous for operator when skill supports autonomous', () => {
        const skillWithAutonomous: SkillCatalogEntry = {
            ...baseSkill,
            execution_modes: ['assist', 'hitl', 'autonomous'],
        };
        const result = isExecutionModeAllowed(skillWithAutonomous, 'autonomous', 'operator');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('super_admin');
    });

    it('allows autonomous for super_admin when skill supports it', () => {
        const skillWithAutonomous: SkillCatalogEntry = {
            ...baseSkill,
            execution_modes: ['assist', 'hitl', 'autonomous'],
        };
        const result = isExecutionModeAllowed(skillWithAutonomous, 'autonomous', 'super_admin');
        expect(result.allowed).toBe(true);
    });

    it('denies execution mode not in skill', () => {
        const result = isExecutionModeAllowed(baseSkill, 'autonomous', 'super_admin');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('does not support');
    });
});
