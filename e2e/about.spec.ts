import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * /about carries prose and a heading hierarchy the homepage does not, so it gets its own checks
 * rather than riding on the homepage's. Heading order and reading measure are the two things a
 * text page can get wrong that a three-element page cannot.
 */

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} scheme`, () => {
    test.use({ colorScheme });

    test('has no WCAG 2.1 AA violations', async ({ page }) => {
      await page.goto('/about');
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    });
  });
}

test('has one h1 and no skipped heading levels', async ({ page }) => {
  await page.goto('/about');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

  // A jump from h1 straight to h3 is invisible on screen and disorienting in a screen reader's
  // heading list, which is the main way people navigate a text page.
  const levels = await page
    .locator('h1, h2, h3, h4, h5, h6')
    .evaluateAll((nodes) => nodes.map((n) => Number(n.tagName[1])));
  expect(levels[0]).toBe(1);
  for (let i = 1; i < levels.length; i++) {
    expect(
      levels[i] - levels[i - 1],
      `heading ${i} jumps from h${levels[i - 1]}`,
    ).toBeLessThanOrEqual(1);
  }
});

test('links home and keeps external destinations intact', async ({ page }) => {
  await page.goto('/about');

  await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  await expect(page.getByRole('link', { name: 'on GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/ralamode/mat-plan',
  );
  await expect(page.locator('a[target]')).toHaveCount(0);

  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ray Baker');
});

test('keeps a space before an inline link', async ({ page }) => {
  await page.goto('/about');

  // Astro's compressHTML strips the whitespace around a newline, so prose that wraps immediately
  // before an inline <a> renders as "The code ison GitHub". It is invisible in the source, which
  // is why it gets its own assertion rather than a careful eye.
  await expect(page.locator('main')).toContainText('The code is on GitHub');
});

test('publishes no contact details', async ({ page }) => {
  await page.goto('/about');
  const text = await page.locator('body').innerText();

  // docs/content-policy.md. The backstop in audit-dist covers the built file; this covers what a
  // reader actually sees, including anything injected by a future component.
  expect(text).not.toMatch(/\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/);
  expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
});

test('keeps a readable measure and does not overflow', async ({ page }) => {
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about');

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, `overflow at ${width}px`).toBeLessThanOrEqual(clientWidth);

    // Prose wider than roughly 85 characters is hard to track line to line. Measured from the
    // column width against the rendered font size rather than guessed from the CSS.
    const chars = await page.evaluate(() => {
      const p = document.querySelector('main p')!;
      const fontSize = parseFloat(getComputedStyle(p).fontSize);
      // ~0.5em average advance width for this stack at normal weight.
      return p.getBoundingClientRect().width / (fontSize * 0.5);
    });
    expect(chars, `measure at ${width}px`).toBeLessThanOrEqual(85);
  }
});
