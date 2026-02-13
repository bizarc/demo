import { test, expect } from '@playwright/test';

test.describe('Home / Landing page', () => {
    test('loads and shows platform entry points', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle', timeout: 15000 });

        await expect(page.getByRole('heading', { name: /Funnel Finished/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Welcome to the Command Deck/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Internal ops/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Client Portal/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Your demos/i })).toBeVisible();

        // LAB card should be active and link to /lab
        const labLink = page.getByRole('link', { name: /THE LAB/i }).first();
        await expect(labLink).toBeVisible();
        await expect(labLink).toHaveAttribute('href', '/lab');

        // Open THE LAB button
        await expect(page.getByRole('link', { name: /Open THE LAB/i })).toBeVisible();
    });

    test('navigates to LAB from home', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle', timeout: 15000 });

        await page.getByRole('link', { name: /THE LAB/i }).first().click();
        await expect(page).toHaveURL(/\/lab/, { timeout: 5000 });
    });
});
