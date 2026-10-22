import { expect, test } from '@playwright/test';

// Slice 3: works offline and remembers your work (prd.md > F1, F14, J2). Runs against the built app.
test.use({ baseURL: 'http://localhost:4175' });

test('after "Works offline", the app makes, exports and keeps videos with the network off', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByTestId('offline-dot')).toBeVisible({ timeout: 60_000 });

  await page.getByRole('button', { name: 'Try an example' }).click();
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Videos are saved in this browser only')).toBeVisible();
  await page.waitForTimeout(800); // auto-save settles

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('offline-pill')).toBeVisible();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 }); // #project=… reopens it

  // Make a brand-new video offline and export it offline.
  await page.getByRole('button', { name: 'Back to my lesson' }).click();
  await page.getByLabel('Your lesson').fill('Leaves catch the bright sunlight every day.\n\nRemember: plants need water to grow tall.');
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Download video' }).click();
  const download = page.waitForEvent('download', { timeout: 110_000 });
  await page.getByRole('button', { name: 'Start' }).click();
  expect((await download).suggestedFilename()).toMatch(/\.mp4$/);
  await page.keyboard.press('Escape');

  // Both videos survive a reload, still offline.
  await page.waitForTimeout(800);
  await page.goto('/');
  await page.getByRole('button', { name: 'My videos' }).click();
  await expect(page.getByTestId('video-card')).toHaveCount(2);
  await expect(page.getByTestId('continue-chip')).toHaveCount(0); // chip lives on Start
  await page.getByRole('button', { name: 'HeyCaveman Stone Age — home' }).click();
  await expect(page.getByTestId('continue-chip')).toBeVisible();
  await context.setOffline(false);
});

test('My videos: rename, duplicate, delete to Recently deleted, restore, and project files round-trip', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your lesson').fill('Rocks are made of minerals that form over a very long time.');
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });

  const save = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save project file' }).click();
  const file = await save;
  expect(file.suggestedFilename()).toMatch(/\.caveman$/);
  const path = test.info().outputPath(file.suggestedFilename());
  await file.saveAs(path);

  await page.getByRole('button', { name: 'My videos' }).click();
  const cards = page.getByTestId('video-card');
  await expect(cards).toHaveCount(1);
  const more = () => cards.first().getByRole('button', { name: /^Options for / });
  await more().click();
  await cards.first().getByRole('menuitem', { name: 'Rename' }).click();
  await page.getByLabel('New title').fill('Rocks and minerals');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(cards.first()).toContainText('Rocks and minerals');
  await more().click();
  await cards.first().getByRole('menuitem', { name: 'Duplicate' }).click();
  await expect(cards).toHaveCount(2);

  // Delete needs no confirm box: it can be undone from the toast, or restored later.
  await more().click();
  await cards.first().getByRole('menuitem', { name: 'Delete' }).click();
  await expect(cards).toHaveCount(1);
  await page.getByTestId('deleted-toast').getByRole('button', { name: 'Undo' }).click();
  await expect(cards).toHaveCount(2);
  await more().click();
  await cards.first().getByRole('menuitem', { name: 'Delete' }).click();
  await expect(cards).toHaveCount(1);
  await expect(page.getByTestId('deleted-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect(cards).toHaveCount(2);

  await page.getByTestId('open-file').setInputFiles(path);
  await expect(page.getByTestId('player')).toBeVisible();
  await page.getByRole('button', { name: 'My videos' }).click();
  await expect(cards).toHaveCount(3); // an opened copy never overwrites the original
});

test('a browser that blocks storage still makes videos and says how to keep them', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { value: { open: () => { throw new Error('blocked'); } } });
  });
  await page.goto('/');
  await page.getByLabel('Your lesson').fill('Rocks are made of minerals that form over a very long time.');
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('storage-blocked')).toContainText("won't let HeyCaveman save");
});

test('the same video open in a second tab is read-only there', async ({ page, context }) => {
  await page.goto('/');
  await page.getByLabel('Your lesson').fill('Rocks are made of minerals that form over a very long time.');
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(600);
  const second = await context.newPage();
  await second.goto(page.url());
  await expect(second.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  await expect(second.getByTestId('other-tab')).toBeVisible();
  await expect(page.getByTestId('other-tab')).toHaveCount(0);
});
