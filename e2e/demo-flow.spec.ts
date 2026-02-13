import { test, expect } from '@playwright/test';

const TEST_DEMO_ID = 'e2e-test-1234-5678-9abc-def012345678';

test.describe('Create demo flow', () => {
    test('builder → success → magic link navigation', async ({ page }) => {
        await page.goto('/lab/new', { waitUntil: 'networkidle', timeout: 15000 });

        // Step 1: Mission Profile — select Database Reactivation
        await expect(page.getByRole('heading', { name: /Choose a mission profile/i })).toBeVisible({
            timeout: 15000,
        });
        await page.getByRole('button', { name: /Database Reactivation/i }).first().click();
        await page.getByRole('button', { name: 'Continue' }).click();

        // Step 2: Target Website — mock scrape API
        await page.route('**/api/scrape', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        companyName: 'E2E Test Corp',
                        industry: 'Technology',
                        products: ['Product A'],
                        offers: ['Free trial'],
                        logoUrl: null,
                        primaryColor: '#2563EB',
                        websiteUrl: 'https://example.com',
                        description: 'Test description',
                    },
                }),
            });
        });

        await page.getByPlaceholder(/enter website url|url/i).fill('https://example.com');
        await page.getByRole('button', { name: /Scrape/i }).click();
        await page.waitForSelector('text=E2E Test Corp', { timeout: 5000 }).catch(() => {});
        await page.getByRole('button', { name: 'Continue' }).click();

        // Step 3: Context — company name should be pre-filled
        await expect(page.getByRole('heading', { name: /Context/i })).toBeVisible({ timeout: 5000 });
        await page.getByRole('button', { name: 'Continue' }).click();

        // Step 4: Model selection
        await expect(page.getByRole('heading', { name: /Model/i })).toBeVisible({ timeout: 5000 });
        await page.getByRole('button', { name: 'Continue' }).click();

        // Step 5: Summary — mock demo creation (valid UUID)
        await page.route('**/api/demo', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        id: TEST_DEMO_ID,
                        status: 'draft',
                    }),
                });
            } else {
                await route.continue();
            }
        });

        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        await page.route('**/api/demo/*', async (route) => {
            if (route.request().method() === 'PATCH') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        id: TEST_DEMO_ID,
                        status: 'active',
                        expires_at: new Date(Date.now() + 86400000).toISOString(),
                        magic_link: `${baseUrl.replace(/\/$/, '')}/demo/${TEST_DEMO_ID}`,
                    }),
                });
            } else {
                await route.continue();
            }
        });

        await expect(page.getByRole('heading', { name: /Create|Summary/i })).toBeVisible({ timeout: 5000 });
        await page.getByRole('button', { name: /Create Demo|Activate/i }).click();

        // Should redirect to success page
        await expect(page).toHaveURL(/\/lab\/success\?id=/);
        await expect(page.getByText('Demo Ready!')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/magic link|Open Demo/i)).toBeVisible();

        // Magic link should point to demo
        const magicLink = page.locator(`a[href*="/demo/${TEST_DEMO_ID}"]`);
        await expect(magicLink).toBeVisible({ timeout: 5000 });
    });
});

test.describe('LAB Home', () => {
    test('navigates to new demo from home', async ({ page }) => {
        await page.goto('/lab', { waitUntil: 'networkidle', timeout: 15000 });

        await page.getByRole('link', { name: /Create|New demo|new/i }).first().click();
        await expect(page).toHaveURL(/\/lab\/new/, { timeout: 5000 });
    });
});
