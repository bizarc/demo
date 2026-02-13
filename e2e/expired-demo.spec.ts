import { test, expect } from '@playwright/test';

test.describe('Expired demo handling', () => {
    test('shows error when demo does not exist', async ({ page }) => {
        await page.goto('/demo/non-existent-uuid-12345');

        await expect(page.getByText(/Unable to load demo|Demo not found|expired/i)).toBeVisible({
            timeout: 10000,
        });
    });

    test('shows error for invalid UUID format', async ({ page }) => {
        await page.goto('/demo/not-a-uuid');

        await expect(page.getByText(/Unable to load demo|Demo not found|expired|error/i)).toBeVisible({
            timeout: 10000,
        });
    });
});
