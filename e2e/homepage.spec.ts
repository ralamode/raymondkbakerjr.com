import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * The homepage's accessibility and layout claims, as assertions.
 *
 * This site advertises accessibility and performance expertise, so a violation here is a
 * credibility failure rather than a cosmetic bug. These checks were run by hand while the page
 * was built; this is what makes them survive the next change.
 *
 * Deliberately narrow. AGENTS.md asks for a handful of critical checks rather than a broad suite,
 * and what matters on a page with three elements is that it is reachable, legible and does not
 * overflow, not that every pixel is pinned.
 */

const SCHEMES = ['light', 'dark'] as const;

for (const colorScheme of SCHEMES) {
  test.describe(`${colorScheme} scheme`, () => {
    test.use({ colorScheme });

    test('has no WCAG 2.1 AA violations', async ({ page }) => {
      await page.goto('/');
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Name the rule and the element, so a failure is actionable without opening a trace.
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    });
  });
}

test('exposes the structure a screen reader needs', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ray Baker');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Profiles' })).toHaveCount(1);

  // Real anchors with real destinations, and not forced into a new tab.
  await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/ralamode',
  );
  await expect(page.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/raymondbaker',
  );
  await expect(page.locator('a[target]')).toHaveCount(0);

  // The page says only what it is meant to say. Guards against copy creeping back in.
  //
  // `innerText`, not `textContent`: Astro's compressHTML strips the whitespace between elements,
  // so textContent is the run-together "Ray BakerGitHubLinkedIn". innerText is what a reader
  // actually perceives, and normalising it keeps the assertion about content rather than markup.
  const visible = (await page.locator('main').innerText()).replace(/\s+/g, ' ').trim();
  expect(visible).toBe('Ray Baker GitHub LinkedIn');
});

test('is operable by keyboard, with a visible focus indicator', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'GitHub' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'LinkedIn' })).toBeFocused();

  // `:focus-visible` must actually draw something. An outline removed without a replacement is
  // the most common way a keyboard user gets stranded.
  const outline = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement as Element);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
  });
  expect(outline.style).not.toBe('none');
  expect(outline.width).toBeGreaterThanOrEqual(2);
});

test('gives each link a 44px touch target', async ({ page }) => {
  await page.goto('/');
  for (const name of ['GitHub', 'LinkedIn']) {
    const box = await page.getByRole('link', { name }).boundingBox();
    expect(box, `${name} should be laid out`).not.toBeNull();
    expect(box!.height, `${name} touch target`).toBeGreaterThanOrEqual(44);
  }
});

// 320px is where layouts break. 640px is the CSS viewport a 1280px window gives at 200% browser
// zoom, which is a WCAG requirement and not merely a narrow phone.
for (const width of [320, 375, 640, 768, 1024, 1440]) {
  test(`does not overflow horizontally at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
}

test('respects a reader who has raised their default font size', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');

  const size = () =>
    page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('h1')!).fontSize));
  const before = await size();

  // The browser's default-font-size setting, which `px` type silently ignores. Page zoom is a
  // separate control; this is the one the rem type scale exists for.
  await page.addStyleTag({ content: 'html { font-size: 32px }' });
  expect(await size()).toBeGreaterThan(before);

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});
