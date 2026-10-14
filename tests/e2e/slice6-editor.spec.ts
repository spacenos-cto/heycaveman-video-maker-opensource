import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

// Slice 6: the Editor (prd.md > F9). Acceptance: build a 3-scene video from scratch, then play it.
test('build a 3-scene video from scratch: backgrounds, drawings, captions, a picture; drag, then play', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Or start with a blank video' }).click();
  const editor = page.getByTestId('editor');
  await expect(editor).toBeVisible();
  const stage = page.getByTestId('stage');
  const library = page.getByTestId('library');
  const captions = page.getByTestId('captions');

  const scenes = [
    { place: 'Use classroom background', prop: 'plant', caption: 'Plants need light' },
    { place: 'Use kitchen background', prop: 'apple', caption: 'Food gives energy' },
    { place: 'Use park background', prop: 'star', caption: 'Great job!' },
  ];
  for (const [i, s] of scenes.entries()) {
    if (i > 0) await editor.getByRole('button', { name: 'Add scene' }).click();
    await expect(page.getByTestId('scene-list').getByRole('button', { name: `Scene ${i + 1}` })).toHaveAttribute('aria-current', 'true');
    await library.getByRole('button', { name: s.place }).click();
    await library.getByPlaceholder(/Try "plant"/).fill(s.prop);
    await library.getByRole('button', { name: `Add ${s.prop}`, exact: true }).click();
    await expect(stage.locator(`[data-testid=prop][data-asset=${s.prop}]`)).toHaveCount(1);
    await captions.getByRole('button', { name: 'Add caption' }).click();
    await captions.getByLabel('Caption 1', { exact: true }).fill(s.caption);
    await expect(stage.getByTestId('caption')).toContainText(s.caption);
    await library.getByPlaceholder(/Try "plant"/).fill('');
  }
  await expect(page.getByTestId('scene-list').locator('li')).toHaveCount(3);

  // Drag the star to the middle: it snaps to the centre line.
  const box = (await stage.locator('[data-testid=stage-prop][data-asset=star]').boundingBox())!;
  const frame = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(frame.x + frame.width / 2 + 3, frame.y + frame.height / 2 + 3, { steps: 8 });
  await page.mouse.up();
  const moved = (await stage.locator('[data-testid=stage-prop][data-asset=star]').boundingBox())!;
  expect(Math.abs(moved.x + moved.width / 2 - (frame.x + frame.width / 2))).toBeLessThan(4);

  // Resize with the corner handle.
  const before = moved.width;
  const handle = (await stage.getByTestId('resize-handle').boundingBox())!;
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + 60, handle.y + 60, { steps: 6 });
  await page.mouse.up();
  expect((await stage.locator('[data-testid=stage-prop][data-asset=star]').boundingBox())!.width).toBeGreaterThan(before + 20);

  // Your own picture, kept in the project.
  await page.locator('#picture-upload').setInputFiles(resolve('public/icons/icon-192.png'));
  await expect(stage.locator('[data-testid=prop][data-asset^="upload:"]')).toHaveCount(1);
  await expect(stage.locator('[data-testid=prop][data-asset^="upload:"] image')).toHaveAttribute('href', /^blob:/);
  // A wrong file type is explained.
  await page.locator('#picture-upload').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') });
  await expect(library.getByRole('alert')).toHaveText('Use PNG, JPG, WebP or SVG.');

  // Play it.
  await editor.getByRole('button', { name: 'Watch the video' }).click();
  await expect(page.getByTestId('thumbnails').locator('li')).toHaveCount(4); // 3 scenes + end card
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByTestId('time')).not.toHaveText(/^0:00 \//, { timeout: 5000 });

  // It all survives a reload, picture included.
  await page.reload();
  await expect(page.getByTestId('thumbnails').locator('li')).toHaveCount(4);
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByTestId('scene-list').getByRole('button', { name: 'Scene 3' }).click();
  await expect(stage.locator('[data-testid=prop][data-asset^="upload:"] image')).toHaveAttribute('href', /^blob:/);
});
