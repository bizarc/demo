import { NextRequest } from 'next/server';

/**
 * Create a NextRequest for API route testing.
 */
export function createMockRequest(
    url: string,
    options: {
        method?: string;
        body?: Record<string, unknown>;
        headers?: Record<string, string>;
    } = {}
): NextRequest {
    const { method = 'GET', body, headers = {} } = options;

    return new NextRequest(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
}

/**
 * Create request with params for dynamic routes (Next.js 15).
 */
export function createMockRequestWithParams(
    url: string,
    params: Record<string, string>,
    options: { method?: string; body?: Record<string, unknown> } = {}
): NextRequest {
    return createMockRequest(url, options);
}
