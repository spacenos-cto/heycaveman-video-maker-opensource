import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Slice 9: accessibility, Classroom mode, the premium bridge's limits, settings/help/about, no outside requests.
const LESSON = 'Leaves catch the bright sunlight.\n\nRoots drink water from the soil.\n\nRemember: plants make their own food!';

async function serious(page: Page, where: string) {
  const { violations } = await new AxeBuilder({ page }).disableRules(['region']).analyze();
  const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${where}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(' ')}`);
  return bad;
}

const premiumVisible = (page: Page) => page.locator('[data-premium]:visible').count();

test('no serious accessibility problems on Start, Player, My videos, Settings, Help and About', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500); // let the intro animations settle
  const found: string[] = [...(await serious(page, 'start'))];
  await page.getByLabel('Your lesson').fill(LESSON);
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(800);
  found.push(...(await serious(page, 'player')));
  await page.getByRole('button', { name: 'My videos' }).click();
  await page.waitForTimeout(800);
  found.push(...(await serious(page, 'videos')));
  for (const k of ['Settings', 'Help', 'About']) {
    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: k }).click();
    await page.waitForTimeout(800);
    found.push(...(await serious(page, k)));
  }
  expect(found).toEqual([]);
});

test('Classroom mode (?classroom) shows zero HeyCaveman mentions; normally at most 2 show at once', async ({ page }) => {
  const outside: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (!['localhost', '127.0.0.1'].includes(u.hostname) && !/^(data|blob):/.test(r.url())) outside.push(r.url());
  });

  // Normal: a full make, edit and export run.
  await page.goto('/');
  let most = await premiumVisible(page);
  await page.getByLabel('Your lesson').fill(LESSON);
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  most = Math.max(most, await premiumVisible(page));
  await page.getByRole('button', { name: 'Edit' }).click();
  most = Math.max(most, await premiumVisible(page));
  await page.getByRole('button', { name: 'Watch the video' }).click();
  await page.getByRole('button', { name: 'Download video' }).click();
  const dl = page.waitForEvent('download', { timeout: 120_000 });
  await page.getByRole('button', { name: 'Start' }).click();
  await dl;
  most = Math.max(most, await premiumVisible(page));
  expect(most).toBeGreaterThan(0);
  expect(most).toBeLessThanOrEqual(2);
  // Dismissed stays dismissed.
  await page.getByRole('button', { name: 'Back to my video' }).click();
  await page.locator('[data-premium=moreLooks]').getByRole('button', { name: 'Hide this HeyCaveman note' }).click();
  await page.reload();
  await expect(page.getByTestId('player')).toBeVisible();
  await expect(page.locator('[data-premium=moreLooks]')).toHaveCount(0);
  expect(outside, 'no requests to other sites during make, edit and export').toEqual([]);

  // Classroom: nothing anywhere.
  await page.goto('/?classroom');
  await expect(page.getByTestId('hero')).toBeVisible();
  expect(await premiumVisible(page)).toBe(0);
  await page.getByRole('tab', { name: /Start from a topic/ }).click();
  expect(await premiumVisible(page)).toBe(0);
  await page.getByRole('tab', { name: /Write it/ }).click();
  await page.getByLabel('Your lesson').fill(LESSON);
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  expect(await premiumVisible(page)).toBe(0);
  await page.getByRole('button', { name: 'Edit' }).click();
  expect(await premiumVisible(page)).toBe(0);
  await page.getByRole('button', { name: 'Character' }).click();
  await page.getByRole('button', { name: 'Customise' }).click();
  expect(await premiumVisible(page)).toBe(0);
  await expect(page.locator('[data-premium=style]')).toHaveCount(0);
});

test('Night theme, help and Report a problem (preview first, nothing sent)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: 'Settings' }).click();
  await page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Night' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: 'About' }).click();
  await expect(page.getByText('No account. No tracking. Your lessons never leave your device.')).toBeVisible();
  await page.getByRole('button', { name: 'Report a problem' }).click();
  await expect(page.getByTestId('report-preview')).toContainText('HeyCaveman Stone Age');
});
