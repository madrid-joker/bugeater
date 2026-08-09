import { expect, test } from '@playwright/test';

/**
 * Temporary plumbing check: proves config, baseURL, aliases and the browser
 * all work together. Replaced by real specs in a later layer.
 */
test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/BugEater/);
});
