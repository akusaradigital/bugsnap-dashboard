import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toContainText('BugSnap');
});

test('custom 404 page renders', async ({ page }) => {
  const response = await page.goto('/route-does-not-exist-404');
  expect(response?.status()).toBe(404);
  await expect(page.locator('text=Page not found')).toBeVisible();
});

test('health endpoint is healthy', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(['healthy', 'degraded']).toContain(body.status);
});
