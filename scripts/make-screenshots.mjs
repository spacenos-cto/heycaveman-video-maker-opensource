#!/usr/bin/env node
// Takes the README screenshots from the running production build.
// Run: npm run build && npx vite preview --port 4173   (then, in another terminal)  node scripts/make-screenshots.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });
const LESSON = 'Leaves catch the bright sunlight.\n\nRoots drink water from the soil.\n\nThe leaves breathe in carbon dioxide from the air.\n\nRemember: plants make their own food!';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const shot = async (name, el) => {
  await page.waitForTimeout(900);
  await (el ?? page).screenshot({ path: `${OUT}/${name}.png` });
  console.log(`${OUT}/${name}.png`);
};

await page.goto(BASE);
await page.waitForTimeout(2500);
await shot('01-start');

await page.getByLabel('Your lesson').fill(LESSON);
await page.getByRole('button', { name: 'Make my video' }).click();
const sheet = page.getByTestId('caveman-sheet');
await sheet.getByRole('button', { name: 'Teacher' }).click();
await sheet.getByRole('button', { name: 'Customise' }).click();
await shot('02-meet-your-caveman');
await sheet.getByRole('button', { name: 'Use this caveman' }).click();

await page.getByTestId('player').waitFor();
await page.getByRole('button', { name: 'Dismiss' }).click();
await page.getByTestId('thumbnails').getByRole('button', { name: 'Scene 2' }).click();
await shot('03-player-and-scene-panel');

await page.getByRole('button', { name: 'Edit' }).click();
await page.locator('[data-testid=stage-prop]').first().click();
await shot('04-editor');

await page.goto(BASE);
await page.getByRole('tab', { name: /Use a template/ }).click();
await page.getByTestId('templates').getByRole('button', { name: /Word of the day/ }).click();
await page.getByRole('button', { name: 'Fill in the grey example' }).click();
await page.getByTestId('lesson-builder').scrollIntoViewIfNeeded();
await shot('05-lesson-builder');
await page.getByTestId('lesson-builder').getByRole('button', { name: 'Make my video' }).click();
await page.getByTestId('player').waitFor();
const thumbs = page.getByTestId('thumbnails').locator('li');
const n = await thumbs.count();
await thumbs.nth(n - 2).getByRole('button').click();
await page.keyboard.press('Escape');
const slider = page.getByLabel('Position in the video');
await slider.fill(String(Number(await slider.inputValue()) - 44));
await shot('06-quiz-scene', page.getByTestId('player'));

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE);
await page.waitForTimeout(2000);
await shot('07-phone');

await browser.close();
