const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
});

test('loads the luxury journey without overflow or browser errors', async ({ page }) => {
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

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Luxury care');
  await expect(page.getByRole('heading', { name: /Choose your clean/i })).toBeVisible();

  const images = page.locator('img');
  expect(await images.count()).toBeGreaterThanOrEqual(8);
  await images.evaluateAll(async (items) => {
    for (const image of items) {
      image.scrollIntoView({ block: 'center' });
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await image.decode().catch(() => {});
    }
    window.scrollTo(0, 0);
  });
  await expect.poll(() => images.evaluateAll((items) => items.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);

  const heroImage = page.locator('.hero-media picture img');
  await expect(heroImage).toHaveCSS('object-fit', 'cover');

  const pageWidth = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(pageWidth.scrollWidth).toBeLessThanOrEqual(pageWidth.clientWidth + 1);
  expect(errors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedLocalResources).toEqual([]);
});

test('mobile and tablet menu opens, navigates and closes', async ({ page }) => {
  test.skip(page.viewportSize()?.width > 900, 'Compact navigation only');
  const toggle = page.locator('[data-menu-toggle]');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Services' })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Services' }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#services')).toBeInViewport();

  const targetPosition = await page.locator('#services').evaluate((target) => {
    const header = document.querySelector('.site-header');
    return {
      targetTop: target.getBoundingClientRect().top,
      headerHeight: header.getBoundingClientRect().height
    };
  });
  expect(targetPosition.targetTop).toBeGreaterThanOrEqual(targetPosition.headerHeight - 2);
});

test('keeps the audited typography readable', async ({ page }) => {
  const typography = await page.evaluate(() => {
    const fontSize = (selector) => {
      const element = [...document.querySelectorAll(selector)].find((item) => {
        const style = getComputedStyle(item);
        return style.display !== 'none' && item.getBoundingClientRect().width > 0;
      });
      return element ? parseFloat(getComputedStyle(element).fontSize) : 0;
    };

    return {
      headingFamily: getComputedStyle(document.querySelector('h1')).fontFamily,
      bodyFamily: getComputedStyle(document.body).fontFamily,
      interfaceSizes: [
        '.announcement',
        '.kicker',
        '.section-label',
        '.button',
        '.hero-assurances',
        '.service-tabs small',
        '.field label',
        '.footer-links a'
      ].map(fontSize),
      readingSizes: [
        '.hero-intro',
        '.service-panel:not([hidden]) > p',
        '.included-list li',
        '.process-list p',
        '.field input',
        '.faq-list details p'
      ].map(fontSize)
    };
  });

  expect(typography.headingFamily).toContain('DM Serif Display');
  expect(typography.bodyFamily).toContain('DM Sans');
  expect(Math.min(...typography.interfaceSizes)).toBeGreaterThanOrEqual(12);
  expect(Math.min(...typography.readingSizes)).toBeGreaterThanOrEqual(13);
});

test('service selector changes content and prepares the quote', async ({ page }) => {
  const deepTab = page.locator('[data-service-tab="deep"]');
  await deepTab.click();
  await expect(deepTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#service-deep')).toBeVisible();
  await expect(page.locator('#service-deep')).toContainText('£30');

  await page.locator('#service-deep [data-select-service]').click();
  await expect(page.locator('#service')).toHaveValue('Deep cleaning');

  await page.locator('.form-submit').click();
  await expect(page.locator('#postcode')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-form-status]')).toContainText('Please complete');
});

test('FAQ disclosure works', async ({ page }) => {
  const item = page.locator('details').filter({ hasText: 'How much does cleaning cost?' });
  await expect(item).not.toHaveAttribute('open', '');
  await item.locator('summary').click();
  await expect(item).toHaveAttribute('open', '');
  await expect(item).toContainText('£22 per hour');
});
