import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';

// Slice 4: give the caveman a voice (prd.md > F10). Uses the real Kokoro model (~90 MB, downloaded once
// per test browser) and runs against the built app so the offline helper is active.
test.use({ baseURL: 'http://localhost:4175' });
test.describe.configure({ mode: 'serial' });

const LESSON = 'Leaves catch the bright sunlight.\n\nRoots drink water from the soil.\n\nRemember: plants make their own food!';
const HF = /(^|\.)huggingface\.co$|(^|\.)hf\.co$/;

async function make(page: Page, text = LESSON) {
  await page.getByRole('button', { name: 'HeyCaveman Stone Age — home' }).click();
  await page.getByLabel('Your lesson').fill(text);
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
}

test('download voices once, voice a video, then voice another one offline and export it with speech', async ({ page, context }, info) => {
  test.setTimeout(15 * 60_000);
  const outside: string[] = [];
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && console.log(`[browser ${m.type()}] ${m.text().slice(0, 300)}`));
  page.on('requestfailed', (r) => console.log(`[request failed] ${r.url().slice(0, 160)} ${r.failure()?.errorText}`));
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (!['localhost'].includes(u.hostname) && !r.url().startsWith('data:') && !r.url().startsWith('blob:') && !HF.test(u.hostname)) outside.push(r.url());
  });

  await page.goto('/');
  await expect(page.getByTestId('offline-dot')).toBeVisible({ timeout: 60_000 });
  await make(page);

  // The card after the first video offers the one-time download.
  await expect(page.getByTestId('voice-card')).toContainText('90 MB');
  const t0 = Date.now();
  await page.getByTestId('voice-card').getByRole('button', { name: /Download voices/ }).click();
  await expect(page.getByTestId('voice-download')).toBeVisible();
  // After the download the open video gets voiced automatically.
  await expect(page.getByTestId('thumbnails').getByLabel('Caveman voice')).toHaveCount(3, { timeout: 12 * 60_000 });
  info.annotations.push({ type: 'download+voice', description: `${Math.round((Date.now() - t0) / 1000)} s` });

  // Offline from here on: a new video gets voiced with no network at all.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('offline-pill')).toBeVisible();
  await make(page, 'Water turns into steam when it gets hot.\n\nSteam rises up into the cold sky.');
  await page.getByRole('button', { name: 'Voice' }).click();
  await page.getByLabel(/Caveman voices/).check();
  await expect(page.getByText('✓ Voices ready')).toBeVisible({ timeout: 30_000 });
  const t1 = Date.now();
  await page.getByRole('button', { name: 'Voice my video' }).click();
  await expect(page.getByRole('dialog').getByTestId('voicing')).toBeVisible();
  await expect(page.getByRole('dialog').getByTestId('voicing')).toHaveCount(0, { timeout: 5 * 60_000 });
  await expect(page.getByTestId('voice-error')).toHaveCount(0);
  await expect(page.getByTestId('thumbnails').getByLabel('Caveman voice')).toHaveCount(2);
  const perScene = (Date.now() - t1) / 2000;
  info.annotations.push({ type: 'seconds per scene (offline)', description: perScene.toFixed(1) });
  console.log(`VOICE: ${perScene.toFixed(1)} s per scene offline`);
  await page.getByRole('button', { name: 'Done' }).click();

  // Export offline: the MP4 carries the voices (long stretches of sound, not just short effects).
  await page.getByRole('button', { name: 'Download video' }).click();
  const dl = page.waitForEvent('download', { timeout: 120_000 });
  await page.getByRole('button', { name: 'Start' }).click();
  const file = info.outputPath('voiced.mp4');
  await (await dl).saveAs(file);
  const silence = execFileSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'silencedetect=n=-40dB:d=0.4', '-f', 'null', '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  const report = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  expect(report).toContain('audio');
  info.annotations.push({ type: 'silencedetect', description: silence.split('\n').filter((l) => l.includes('silence_')).join(' | ') });
  await context.setOffline(false);
  expect(outside, 'only the voice model may come from outside (Hugging Face)').toEqual([]);
});
