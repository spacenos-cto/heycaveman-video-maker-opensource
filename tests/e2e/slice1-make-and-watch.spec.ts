import { expect, test } from '@playwright/test';

// Slice 1: type a lesson, press Make, and watch the same caveman act it out (prd.md > The Core Journey).
test('the example lesson becomes an acted caveman video in the player', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('cartoon');
  const make = page.getByRole('button', { name: 'Make my video' });
  await expect(make).toBeDisabled(); // empty box: "Write at least one sentence"

  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByTestId('counter')).toContainText('words');
  await make.click();

  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  const thumbs = page.getByTestId('thumbnails').locator('li');
  expect(await thumbs.count()).toBeGreaterThanOrEqual(3);
  // The same caveman in every scene: one rig per thumbnail, all drawn from the same design.
  const count = await thumbs.count();
  for (let i = 0; i < count; i++) await expect(thumbs.nth(i).getByTestId('caveman')).toHaveCount(1);
  // His acting changes with the words.
  const motions = await thumbs.locator('[data-testid=caveman]').evaluateAll((els) => els.map((e) => e.getAttribute('data-motion')));
  expect(new Set(motions).size).toBeGreaterThan(2);
  // At least one scene has a matching drawing.
  expect(await thumbs.locator('[data-testid=prop]').count()).toBeGreaterThan(0);

  // Play it, then jump scenes with the keyboard.
  await page.getByRole('button', { name: 'Play' }).click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByTestId('time')).not.toContainText('0:00 /');
  await page.keyboard.press('ArrowRight');
  await expect(thumbs.nth(1).locator('button')).toHaveAttribute('aria-current', 'true');

  expect(errors).toEqual([]);
});

test('a lone topic asks for sentences instead of making an empty video', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your lesson').fill('volcanoes');
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByRole('status')).toContainText('That looks like a topic');
  await expect(page.getByTestId('player')).toHaveCount(0);
});
