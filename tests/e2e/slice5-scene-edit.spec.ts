import { expect, test } from '@playwright/test';

// Slice 5: tap a scene to change it, with undo (prd.md > F8).
const LESSON = 'Leaves catch the bright sunlight.\n\nRoots drink water from the soil.\n\nRemember: plants make their own food!';

test('change one scene\'s drawing, caption and action; the player updates, undo works, and it survives a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your lesson').fill(LESSON);
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });

  const t0 = Date.now();
  await page.getByTestId('thumbnails').getByRole('button', { name: 'Scene 2' }).click();
  const panel = page.getByTestId('scene-panel');
  await expect(panel.getByRole('heading', { name: 'Scene 2' })).toBeVisible();
  const player = page.getByTestId('player');

  // Action
  await panel.getByRole('button', { name: 'Celebrate' }).click();
  await expect(player.getByTestId('caveman')).toHaveAttribute('data-motion', 'celebrate');

  // Drawing: swap what's there for a star
  const removes = panel.getByRole('button', { name: /^Remove / });
  while ((await removes.count()) > 0) await removes.first().click();
  await expect(player.getByTestId('prop')).toHaveCount(0);
  await panel.getByRole('button', { name: 'Add a drawing' }).click();
  await panel.getByPlaceholder(/Try "plant"/).fill('star');
  await panel.getByRole('button', { name: /^Add star/ }).first().click();
  await expect(player.getByTestId('prop')).toHaveCount(1);

  // Caption
  await panel.getByLabel('Caption', { exact: true }).fill('Thirsty roots');
  await expect(player.getByTestId('caption')).toContainText('Thirsty roots');
  const seconds = (Date.now() - t0) / 1000;
  test.info().annotations.push({ type: 'three edits took (automated)', description: `${seconds.toFixed(1)} s` });

  // Undo the caption (typing counts as one step), then redo it.
  await page.getByRole('heading', { name: 'Scene 2' }).click();
  await panel.getByRole('button', { name: 'Undo' }).click();
  await expect(player.getByTestId('caption')).not.toContainText('Thirsty roots');
  await page.keyboard.press('Control+y');
  await expect(player.getByTestId('caption')).toContainText('Thirsty roots');

  // Deleting down to one scene is blocked.
  await panel.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByTestId('thumbnails').locator('li')).toHaveCount(3); // 2 scenes + end card
  await page.getByTestId('thumbnails').getByRole('button', { name: 'Scene 1' }).click();
  await panel.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByTestId('thumbnails').locator('li')).toHaveCount(2);
  await panel.getByRole('button', { name: 'Delete' }).click();
  await expect(panel.getByRole('alert')).toHaveText('A video needs at least one scene.');
  await panel.getByRole('button', { name: 'Undo' }).click(); // bring the deleted scenes back
  await panel.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByTestId('thumbnails').locator('li')).toHaveCount(4);

  // Survives a reload.
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByTestId('player')).toBeVisible();
  await page.getByTestId('thumbnails').getByRole('button', { name: 'Scene 2' }).click();
  await expect(player.getByTestId('caveman')).toHaveAttribute('data-motion', 'celebrate');
  await expect(player.getByTestId('caption')).toContainText('Thirsty roots');
  await expect(player.locator('[data-testid=prop][data-asset=star]')).toHaveCount(1);
});

test('Re-make asks before replacing scene edits', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your lesson').fill(LESSON);
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('thumbnails').getByRole('button', { name: 'Scene 1' }).click();
  await page.getByTestId('scene-panel').getByRole('button', { name: 'Think' }).click();
  await page.getByRole('button', { name: 'Back to my lesson' }).click();
  await page.getByRole('button', { name: 'Make my video' }).click();
  const ask = page.getByRole('alertdialog', { name: 'Re-make the whole video?' });
  await expect(ask).toContainText('Your scene edits will be replaced.');
  await ask.getByRole('button', { name: 'Keep my edits' }).click();
  await page.getByTestId('thumbnails').getByRole('button', { name: 'Scene 1' }).click();
  await expect(page.getByTestId('player').getByTestId('caveman')).toHaveAttribute('data-motion', 'think');
  await page.getByRole('button', { name: 'Back to my lesson' }).click();
  await page.getByRole('button', { name: 'Make my video' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Re-make' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('thumbnails').getByRole('button', { name: 'Scene 1' }).click();
  await expect(page.getByTestId('player').getByTestId('caveman')).not.toHaveAttribute('data-motion', 'think');
});
