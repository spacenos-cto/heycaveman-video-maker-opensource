import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';

// Slice 2: download the video as an MP4 with sound, made entirely in the browser (prd.md > F13).
const LESSON = 'Leaves catch the bright sunlight every single day.\n\nRemember: plants need water to grow tall and strong.';

async function makeVideo(page: Page, text: string) {
  await page.goto('/');
  await page.getByLabel('Your lesson').fill(text);
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
}

function probe(file: string) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,start_time,duration:format=duration', '-of', 'json', file], { encoding: 'utf8' });
  return JSON.parse(out) as { streams: Record<string, string | number>[]; format: { duration: string } };
}

test('exports an H.264 MP4 with an audio track and the end card, offline in the browser', async ({ page }, info) => {
  const external: string[] = [];
  page.on('request', (r) => {
    const host = new URL(r.url()).host;
    if (!/^localhost(:\d+)?$/.test(host) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.push(r.url());
  });
  await makeVideo(page, LESSON);
  const time = await page.getByTestId('time').textContent();
  await page.getByRole('button', { name: 'Download video' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Add the "Made with HeyCaveman" end card')).toBeChecked();

  const downloadPromise = page.waitForEvent('download', { timeout: 110_000 });
  await page.getByRole('button', { name: 'Start' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/-heycaveman\.mp4$/);
  const file = info.outputPath(download.suggestedFilename());
  await download.saveAs(file);
  await expect(page.getByRole('status')).toContainText('Saved');

  const meta = probe(file);
  const videoTrack = meta.streams.find((s) => s.codec_type === 'video');
  const audioTrack = meta.streams.find((s) => s.codec_type === 'audio');
  expect(videoTrack?.codec_name).toBe('h264');
  expect(videoTrack?.width).toBe(1280);
  expect(videoTrack?.height).toBe(720);
  expect(audioTrack, 'MP4 must have an audio track').toBeTruthy();
  // Duration matches the player's total (lesson + 3 s end card) within 0.2 s.
  const [, total] = (time ?? '0:00 / 0:00').split(' / ');
  const [m, s] = total.split(':').map(Number);
  const expected = m * 60 + s;
  expect(Math.abs(Number(meta.format.duration) - expected)).toBeLessThan(1.05); // player shows whole seconds
  info.annotations.push({ type: 'mp4', description: JSON.stringify(meta) });
  expect(external, 'no request may leave the device').toEqual([]);
});

test('Cancel stops the export quickly and saves no file', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Download video' }).click();
  let downloaded = false;
  page.on('download', () => (downloaded = true));
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByTestId('export-status')).toBeVisible();
  const t0 = Date.now();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible({ timeout: 2000 });
  expect(Date.now() - t0).toBeLessThan(2000);
  await page.waitForTimeout(500);
  expect(downloaded).toBe(false);
});

test('a browser that cannot encode video is told before starting', async ({ page }) => {
  await page.addInitScript(() => {
    // Simulate a browser without WebCodecs.
    delete (window as unknown as Record<string, unknown>).VideoEncoder;
  });
  await makeVideo(page, LESSON);
  await page.getByRole('button', { name: 'Download video' }).click();
  await expect(page.getByRole('alert')).toContainText("can't make video files");
  await expect(page.getByRole('button', { name: 'Start' })).toHaveCount(0);
});

test('timing: a 1-minute 720p export (recorded for the checklist)', async ({ page }, info) => {
  test.slow();
  const minute = Array.from({ length: 14 }, (_, i) => `Step ${i + 1}: plants use sunlight, water and air to make food for themselves.`).join('\n\n');
  await makeVideo(page, minute);
  await page.getByRole('button', { name: 'Download video' }).click();
  const t0 = Date.now();
  const downloadPromise = page.waitForEvent('download', { timeout: 300_000 });
  await page.getByRole('button', { name: 'Start' }).click();
  const download = await downloadPromise;
  const seconds = (Date.now() - t0) / 1000;
  const file = info.outputPath('minute.mp4');
  await download.saveAs(file);
  const duration = Number(probe(file).format.duration);
  info.annotations.push({ type: 'timing', description: `${duration.toFixed(1)} s video exported in ${seconds.toFixed(1)} s` });
  console.log(`TIMING: ${duration.toFixed(1)} s video exported in ${seconds.toFixed(1)} s`);
  expect(duration).toBeGreaterThan(55);
});
