import { test, expect } from '@playwright/test';

test('app loads and redirects to auth when unauthenticated', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByText('CoffeePeek')).toBeVisible();
});


