export interface RetryOptions {
    maxRetries?: number;
    retryDelay?: number;
    retryOn?: (response: Response) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    retryDelay: 1000,
    retryOn: (res) => res.status >= 500 || res.status === 429,
};

export async function fetchWithRetry(
    input: RequestInfo | URL,
    init?: RequestInit,
    options: RetryOptions = {}
): Promise<Response> {
    const { maxRetries, retryDelay, retryOn } = { ...DEFAULT_OPTIONS, ...options };

    let lastError: Error | null = null;
    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(input, init);
            lastResponse = response;

            if (attempt < maxRetries && retryOn(response)) {
                await new Promise((r) => setTimeout(r, retryDelay * Math.pow(2, attempt)));
                continue;
            }

            return response;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt < maxRetries) {
                await new Promise((r) => setTimeout(r, retryDelay * Math.pow(2, attempt)));
            }
        }
    }

    if (lastResponse) return lastResponse;
    throw lastError ?? new Error('Fetch failed');
}
