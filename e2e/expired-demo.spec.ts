import { test, expect } from '@playwright/test';

// Mock Supabase to return empty (demo not found) so tests work without real DB
const SUPABASE_DEMOS_ROUTE = '**/rest/v1/demos*';

test.describe('Expired demo handling', () => {
    test('shows error when demo does not exist', async ({ page }) => {
        await page.route(SUPABASE_DEMOS_ROUTE, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
        });

        await page.goto('/demo/00000000-0000-0000-0000-000000000001', {
            waitUntil: 'networkidle',
            timeout: 15000,
        });

        await expect(
            page.getByText(/Unable to load demo|Demo not found|expired|This demo link has expired/i)
        ).toBeVisible({ timeout: 15000 });
    });

    test('shows error for invalid UUID format', async ({ page }) => {
        await page.route(SUPABASE_DEMOS_ROUTE, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
        });

        await page.goto('/demo/not-a-uuid', {
            waitUntil: 'networkidle',
            timeout: 15000,
        });

        await expect(
            page.getByText(/Unable to load demo|Demo not found|expired|This demo link has expired|error/i)
        ).toBeVisible({ timeout: 15000 });
    });
});
