/**
 * User scoping: prefers auth user ID when logged in; falls back to localStorage.
 * When AUTH_DISABLED, auth is bypassed and only localStorage is used.
 */

const STORAGE_KEY = 'lab_creator_id';

function generateId(): string {
    // Use crypto.randomUUID if available, otherwise fallback
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Get or create a persistent creator_id from localStorage.
 * Returns null during SSR.
 */
export function getCreatorId(): string | null {
    if (typeof window === 'undefined') return null;

    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
        id = generateId();
        localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
}
