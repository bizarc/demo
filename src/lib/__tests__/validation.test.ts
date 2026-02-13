import { describe, it, expect } from 'vitest';
import {
    isValidUuid,
    validateUrl,
    isValidHexColor,
    isValidLeadIdentifier,
    sanitizeString,
    sanitizeStringArray,
    LIMITS,
} from '../validation';

describe('validation', () => {
    describe('isValidUuid', () => {
        it('accepts valid UUIDs', () => {
            expect(isValidUuid('a24a6ea4-ce75-4665-a070-57453082c256')).toBe(true);
            expect(isValidUuid('00000000-0000-0000-0000-000000000001')).toBe(true);
        });
        it('rejects invalid formats', () => {
            expect(isValidUuid('')).toBe(false);
            expect(isValidUuid('demo-1')).toBe(false);
            expect(isValidUuid('not-a-uuid')).toBe(false);
        });
    });

    describe('validateUrl', () => {
        it('accepts valid public URLs', () => {
            const r = validateUrl('https://example.com');
            expect(r.valid).toBe(true);
            if (r.valid) expect(r.url).toBe('https://example.com');
        });
        it('rejects localhost (SSRF)', () => {
            const r = validateUrl('http://localhost/admin');
            expect(r.valid).toBe(false);
            if (!r.valid) expect(r.error).toMatch(/private|localhost|not allowed/i);
        });
        it('rejects 127.0.0.1', () => {
            const r = validateUrl('http://127.0.0.1/');
            expect(r.valid).toBe(false);
        });
        it('rejects invalid format', () => {
            const r = validateUrl('https://[invalid');
            expect(r.valid).toBe(false);
        });
    });

    describe('isValidHexColor', () => {
        it('accepts valid hex colors', () => {
            expect(isValidHexColor('#2563EB')).toBe(true);
            expect(isValidHexColor('#fff')).toBe(true);
        });
        it('rejects invalid', () => {
            expect(isValidHexColor('red')).toBe(false);
            expect(isValidHexColor('#gg')).toBe(false);
        });
    });

    describe('isValidLeadIdentifier', () => {
        it('accepts nanoid-style strings', () => {
            expect(isValidLeadIdentifier('V1StGXR8_Z5jdHJ8k2')).toBe(true);
        });
        it('rejects too short', () => {
            expect(isValidLeadIdentifier('abc')).toBe(false);
        });
    });

    describe('sanitizeString', () => {
        it('trims and truncates', () => {
            expect(sanitizeString('  hello  ', 10)).toBe('hello');
            expect(sanitizeString('x'.repeat(100), 10)).toHaveLength(10);
        });
    });

    describe('sanitizeStringArray', () => {
        it('limits items and length', () => {
            const result = sanitizeStringArray(['a', 'b', 'c', 'd', 'e', 'f'], 3, LIMITS.itemLength);
            expect(result).toHaveLength(3);
            expect(result).toEqual(['a', 'b', 'c']);
        });
    });
});
