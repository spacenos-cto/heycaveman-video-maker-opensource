import { expect, test, type Page } from '@playwright/test';
import { resolve } from 'node:path';

// Slice 4: Record my voice (prd.md > F10) with Chromium's fake microphone. No model download needed.
async function openRecorder(page: Page) {
  await page.goto('/');
  await page.getByLabel('Your lesson').fill('Leaves catch the bright sunlight every day.\n\nRoots drink water from the soil below.');
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Voice', exact: true }).click();
  await page.getByLabel(/Record my voice/).check();
  await page.getByRole('dialog').getByRole('button', { name: 'Record' }).first().click();
  await expect(page.getByTestId('teleprompter')).toContainText('Leaves catch');
}

test.use({ launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] } });


test('records a scene, plays it back and keeps it; the scene shows a recorded-voice icon', async ({ page }) => {
  await openRecorder(page);
  const recorder = page.getByRole('dialog', { name: /Record my voice/ });
  await recorder.getByRole('button', { name: 'Record' }).click();
  await expect(recorder.getByText('Recording')).toBeVisible({ timeout: 5000 });
  await expect(recorder.getByRole('meter')).toBeVisible();
  await page.waitForTimeout(1500);
  await recorder.getByRole('button', { name: 'Stop' }).click();
  await expect(recorder.getByRole('button', { name: 'Keep' })).toBeVisible();
  await recorder.getByRole('button', { name: 'Play back' }).click();
  await recorder.getByRole('button', { name: 'Keep' }).click();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByTestId('thumbnails').getByLabel('Recorded')).toHaveCount(1);
});
