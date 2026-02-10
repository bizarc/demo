'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getCreatorId } from './creatorId';

interface AutosaveFormData {
    missionProfile: string | null;
    websiteUrl: string;
    companyName: string;
    industry: string;
    productsServices: string;
    offers: string;
    qualificationCriteria: string;
    logoUrl: string;
    primaryColor: string;
    model: string;
}

interface UseAutosaveOptions {
    /** Initial draft ID if resuming an existing draft */
    initialDraftId?: string | null;
    /** Debounce delay in ms (default 1000) */
    debounceMs?: number;
}

interface UseAutosaveReturn {
    draftId: string | null;
    saving: boolean;
    lastSavedAt: string | null;
    error: string | null;
    /** Call to create the initial draft (after step 1 completion) */
    createDraft: (formData: AutosaveFormData, currentStep: string) => Promise<string | null>;
    /** Call on step change for immediate save */
    saveNow: (formData: AutosaveFormData, currentStep: string) => Promise<void>;
    /** Call on form field change for debounced save */
    saveDraft: (formData: AutosaveFormData, currentStep: string) => void;
    /** Activate the draft (transition to active) */
    activate: (formData: AutosaveFormData) => Promise<{ id: string; magic_link: string; expires_at: string } | null>;
}

/**
 * Builds the API payload from form data.
 */
function buildPayload(formData: AutosaveFormData, currentStep: string) {
    return {
        mission_profile: formData.missionProfile || undefined,
        company_name: formData.companyName || undefined,
        industry: formData.industry || undefined,
        website_url: formData.websiteUrl || undefined,
        products_services: formData.productsServices || undefined,
        offers: formData.offers || undefined,
        qualification_criteria: formData.qualificationCriteria || undefined,
        logo_url: formData.logoUrl || undefined,
        primary_color: formData.primaryColor || undefined,
        openrouter_model: formData.model || undefined,
        current_step: currentStep,
    };
}

export function useAutosave(options: UseAutosaveOptions = {}): UseAutosaveReturn {
    const { initialDraftId = null, debounceMs = 1000 } = options;

    const [draftId, setDraftId] = useState<string | null>(initialDraftId);
    const [saving, setSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Keep draftId in a ref so async callbacks always see latest value
    const draftIdRef = useRef(draftId);
    useEffect(() => {
        draftIdRef.current = draftId;
    }, [draftId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    /**
     * Create a new draft (called after step 1 completion).
     */
    const createDraft = useCallback(async (
        formData: AutosaveFormData,
        currentStep: string
    ): Promise<string | null> => {
        // Don't create if we already have a draft
        if (draftIdRef.current) return draftIdRef.current;

        setSaving(true);
        setError(null);

        try {
            const creatorId = getCreatorId();
            const payload = {
                ...buildPayload(formData, currentStep),
                status: 'draft',
                created_by: creatorId,
            };

            const res = await fetch('/api/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create draft');

            setDraftId(data.id);
            setLastSavedAt(new Date().toISOString());
            return data.id;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to create draft';
            setError(msg);
            console.warn('Autosave draft creation failed:', msg);
            return null;
        } finally {
            setSaving(false);
        }
    }, []);

    /**
     * Immediately save the current form data to the draft.
     */
    const saveNow = useCallback(async (
        formData: AutosaveFormData,
        currentStep: string
    ): Promise<void> => {
        const id = draftIdRef.current;
        if (!id) return;

        // Cancel any pending debounced save
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }

        // Cancel any in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setSaving(true);
        setError(null);

        try {
            const payload = buildPayload(formData, currentStep);
            const res = await fetch(`/api/demo/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            if (controller.signal.aborted) return;

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save draft');

            setLastSavedAt(data.updated_at || new Date().toISOString());
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            const msg = err instanceof Error ? err.message : 'Failed to save draft';
            setError(msg);
            console.warn('Autosave failed:', msg);
        } finally {
            setSaving(false);
            abortControllerRef.current = null;
        }
    }, []);

    /**
     * Debounced save: schedules a save after the debounce delay.
     */
    const saveDraft = useCallback((
        formData: AutosaveFormData,
        currentStep: string
    ) => {
        if (!draftIdRef.current) return;

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            debounceRef.current = null;
            saveNow(formData, currentStep);
        }, debounceMs);
    }, [debounceMs, saveNow]);

    /**
     * Activate the draft: transition status to 'active'.
     */
    const activate = useCallback(async (
        formData: AutosaveFormData
    ): Promise<{ id: string; magic_link: string; expires_at: string } | null> => {
        const id = draftIdRef.current;
        if (!id) return null;

        setSaving(true);
        setError(null);

        try {
            const payload = {
                ...buildPayload(formData, 'summary'),
                status: 'active',
            };

            const res = await fetch(`/api/demo/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to activate demo');

            return {
                id: data.id,
                magic_link: data.magic_link,
                expires_at: data.expires_at,
            };
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to activate demo';
            setError(msg);
            return null;
        } finally {
            setSaving(false);
        }
    }, []);

    return {
        draftId,
        saving,
        lastSavedAt,
        error,
        createDraft,
        saveNow,
        saveDraft,
        activate,
    };
}
