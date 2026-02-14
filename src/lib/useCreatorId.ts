'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCreatorId } from './creatorId';

/**
 * Returns the creator ID for the current user.
 * When authenticated (Supabase session), returns the user ID.
 * When not authenticated (e.g. AUTH_DISABLED), returns the localStorage creator ID.
 * Returns null while loading.
 */
export function useCreatorId(): string | null {
    const [creatorId, setCreatorId] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();

        const updateId = () => {
            supabase.auth.getUser().then(({ data: { user } }) => {
                setCreatorId(user?.id ?? getCreatorId());
            });
        };

        updateId();
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => updateId());

        return () => subscription.unsubscribe();
    }, []);

    return creatorId;
}
