import { test, expect } from '@playwright/test';

const MOCK_DEMO_ID = 'chat-e2e-demo-456';

test.describe('Chat experience', () => {
    test.beforeEach(async ({ page }) => {
        // Mock demo config via Supabase (we intercept the page's fetch to demo API or use a fixture)
        // The demo page fetches from Supabase directly - we need to either:
        // 1. Use a real demo ID (requires Supabase)
        // 2. Intercept Supabase requests (complex)
        // Instead, we test the chat UI when we have a valid config by mocking the page's data
        // For a simpler test: create a demo via API first, then navigate
        // Supabase PostgREST returns arrays; .single() expects 1 row
        const demoRow = [
            {
                id: MOCK_DEMO_ID,
                company_name: 'Chat Test Corp',
                logo_url: null,
                primary_color: '#2563EB',
                secondary_color: '#FFFFFF',
                mission_profile: 'reactivation',
                system_prompt: 'You are a helpful assistant.',
                offers: ['20% off'],
            },
        ];
        await page.route('**/rest/v1/demos**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(demoRow),
            });
        });
    });

    test('chat page shows error for invalid demo ID', async ({ page }) => {
        // Override: Supabase returns empty for non-existent demo
        await page.route('**/rest/v1/demos**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
        });

        await page.goto('/demo/00000000-0000-0000-0000-000000000000');

        await expect(page.getByText(/Unable to load demo|Demo not found|expired/i)).toBeVisible({
            timeout: 10000,
        });
    });

    test('chat page loads and shows input when config exists', async ({ page }) => {
        await page.goto(`/demo/${MOCK_DEMO_ID}`);

        await expect(page.getByText('Chat Test Corp')).toBeVisible({ timeout: 10000 });
        await expect(page.getByPlaceholder(/Type a message/i)).toBeVisible();
    });

    test('streaming response updates chat', async ({ page }) => {
        await page.goto(`/demo/${MOCK_DEMO_ID}`);

        await expect(page.getByPlaceholder(/Type a message/i)).toBeVisible({ timeout: 10000 });

        // Mock chat API to simulate streaming (SSE as string)
        await page.route('**/api/chat', async (route) => {
            const body = await route.request().postDataJSON();
            if (route.request().method() === 'POST' && body?.message) {
                const sseBody = 'data: {"token":"Hello"}\n\ndata: {"token":" there"}\n\ndata: [DONE]\n\n';
                await route.fulfill({
                    status: 200,
                    headers: { 'Content-Type': 'text/event-stream' },
                    body: sseBody,
                });
            } else {
                await route.continue();
            }
        });

        const input = page.getByPlaceholder(/Type a message/i);
        await input.fill('Hello');
        await input.press('Enter');

        await expect(page.getByText(/Hello there/)).toBeVisible({ timeout: 5000 });
    });
});
