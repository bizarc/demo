import { test, expect } from '@playwright/test';

// Valid UUID for mock demo (demo page fetches from Supabase)
const MOCK_DEMO_ID = 'a24a6ea4-ce75-4665-a070-57453082c256';

// Supabase PostgREST path - demo page fetches directly from Supabase
const SUPABASE_DEMOS_ROUTE = '**/rest/v1/demos*';

test.describe('Chat experience', () => {
    test.beforeEach(async ({ page }) => {
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
                expires_at: new Date(Date.now() + 86400000).toISOString(),
            },
        ];
        await page.route(SUPABASE_DEMOS_ROUTE, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(demoRow),
            });
        });
    });

    test('chat page shows error for invalid demo ID', async ({ page }) => {
        await page.route(SUPABASE_DEMOS_ROUTE, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
        });

        await page.goto('/demo/00000000-0000-0000-0000-000000000000', {
            waitUntil: 'networkidle',
            timeout: 15000,
        });

        await expect(
            page.getByText(/Unable to load demo|Demo not found|expired|This demo link has expired/i)
        ).toBeVisible({ timeout: 15000 });
    });

    test('chat page loads and shows input when config exists', async ({ page }) => {
        await page.goto(`/demo/${MOCK_DEMO_ID}`, {
            waitUntil: 'networkidle',
            timeout: 15000,
        });

        await expect(page.getByText('Chat Test Corp')).toBeVisible({ timeout: 15000 });
        await expect(page.getByPlaceholder(/Type a message/i)).toBeVisible({ timeout: 5000 });
    });

    test('streaming response updates chat', async ({ page }) => {
        await page.goto(`/demo/${MOCK_DEMO_ID}`, {
            waitUntil: 'networkidle',
            timeout: 15000,
        });

        await expect(page.getByPlaceholder(/Type a message/i)).toBeVisible({ timeout: 15000 });

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

        await expect(page.getByText(/Hello there/)).toBeVisible({ timeout: 10000 });
    });
});
