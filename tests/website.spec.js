const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
});

test('loads the core journey without overflow or browser errors', async ({ page }) => {
  const errors = [];
  const consoleErrors = [];
  const failedLocalResources = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).hostname === '127.0.0.1') failedLocalResources.push(request.url());
  });

  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  await expect(page.getByRole('heading', { level: 1 })).toContainText('A clean home');
  await expect(page.getByRole('heading', { name: /Whatever your home/i })).toBeVisible();
  await expect(page.locator('img')).toHaveCount(2);
  expect(await page.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);

  const pageWidth = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(pageWidth.scrollWidth).toBeLessThanOrEqual(pageWidth.clientWidth + 1);
  expect(errors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedLocalResources).toEqual([]);
});

test('mobile menu opens, navigates and closes', async ({ page, isMobile }) => {
  test.skip(!isMobile && page.viewportSize()?.width > 780, 'Mobile interaction only');
  const toggle = page.locator('[data-menu-toggle]');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Services' })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Services' }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#services')).toBeInViewport();
});

test('service shortcut preselects the quote and validation is accessible', async ({ page }) => {
  await page.locator('[data-service-link="Deep cleaning"]').click();
  await expect(page.locator('#service')).toHaveValue('Deep cleaning');

  await page.locator('.form-submit').click();
  await expect(page.locator('#postcode')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-form-status]')).toContainText('Please complete');
});

test('FAQ disclosure works', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Can I get a quote before booking?' });
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#faq-2')).toBeVisible();
});
