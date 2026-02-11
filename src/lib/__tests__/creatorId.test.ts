import { describe, it, expect, beforeEach } from 'vitest';
import { getCreatorId } from '../creatorId';

describe('getCreatorId', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns null during SSR (no window)', () => {
        const originalWindow = globalThis.window;
        // @ts-expect-error — simulate SSR
        delete globalThis.window;

        expect(getCreatorId()).toBeNull();

        // Restore
        globalThis.window = originalWindow;
    });

    it('generates and stores a new ID on first call', () => {
        const id = getCreatorId();

        expect(id).toBeTruthy();
        expect(typeof id).toBe('string');
        expect(id!.length).toBeGreaterThan(0);
        expect(localStorage.getItem('lab_creator_id')).toBe(id);
    });

    it('returns the same ID on subsequent calls', () => {
        const first = getCreatorId();
        const second = getCreatorId();

        expect(first).toBe(second);
    });

    it('returns an existing stored ID', () => {
        localStorage.setItem('lab_creator_id', 'existing-id-123');

        expect(getCreatorId()).toBe('existing-id-123');
    });

    it('generates a UUID-like format', () => {
        const id = getCreatorId();
        // Should be UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        expect(id).toMatch(/^[a-f0-9-]{36}$/);
    });
});
