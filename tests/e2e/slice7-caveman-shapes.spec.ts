import { expect, test, type Page } from '@playwright/test';

// Slice 7: Meet your caveman (prd.md > F4), video shapes (F5) and colour moods.
test.use({ storageState: { cookies: [], origins: [] } }); // a brand-new device

const LESSON = 'Photosynthesis happens inside chloroplasts everywhere.\n\nRemember: plants make their own food from sunlight!\n\nCarbon dioxide plus water becomes glucose.';

async function make(page: Page) {
  await page.getByLabel('Your lesson').fill(LESSON);
  await page.getByRole('button', { name: 'Make my video' }).click();
}

test('the first Make shows Meet your caveman once; the chosen caveman stars in the video', async ({ page }) => {
  await page.goto('/');
  await make(page);
  const sheet = page.getByTestId('caveman-sheet');
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText("Meet your caveman — they'll star in all your videos.");
  await sheet.getByRole('button', { name: 'Teacher' }).click();
  await sheet.getByRole('button', { name: 'Customise' }).click();
  await sheet.getByLabel('Name (optional)').fill('Mr. Rao');
  await sheet.getByRole('button', { name: 'Use this caveman' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  // The end card thanks him by name.
  await expect(page.getByTestId('thumbnails').locator('li').last()).toContainText('Explained by Mr. Rao');

  // Second Make on this device: no sheet.
  await page.getByRole('button', { name: 'Back to my lesson' }).click();
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  await expect(sheet).toHaveCount(0);
  // My caveman is kept for new videos (survives a reload).
  await page.reload();
  await page.getByTestId('my-caveman').click();
  await expect(page.getByTestId('caveman-sheet').getByRole('button', { name: 'Teacher' })).toHaveAttribute('aria-pressed', 'true');
});

test('Skip still makes a video with Cavey', async ({ page }) => {
  await page.goto('/');
  await make(page);
  await page.getByTestId('caveman-sheet').getByRole('button', { name: 'Skip — use Cavey' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('thumbnails').locator('li').last()).toContainText('Free · open source');
});

test('in all 3 shapes and moods, no caption, drawing or caveman leaves the frame', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('stoneage.metCaveman', '1'));
  await page.reload();
  await make(page);
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });
  for (const [shape, mood] of [['Tall', 'Earthy'], ['Square', 'Soft'], ['Wide', 'Bright']]) {
    await page.getByTestId('look').getByRole('button', { name: shape }).click();
    await page.getByTestId('look').getByRole('button', { name: mood }).click();
    await expect(page.getByTestId('look').getByRole('button', { name: shape })).toHaveAttribute('aria-pressed', 'true');
    // Every scene thumbnail is the real renderer a moment into the scene.
    const outside = await page.getByTestId('thumbnails').locator('[data-testid=scene-svg]').evaluateAll((svgs) =>
      svgs.flatMap((svg, i) => {
        const frame = svg.getBoundingClientRect();
        return [...svg.querySelectorAll('[data-testid=caption] text, [data-testid=prop], [data-testid=caveman]')]
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && (r.left < frame.left - 1 || r.right > frame.right + 1 || r.top < frame.top - 1 || r.bottom > frame.bottom + 1))
          .map(({ el }) => `scene ${i + 1}: ${el.getAttribute('data-testid') ?? el.textContent}`);
      }),
    );
    expect(outside, `${shape}/${mood}`).toEqual([]);
  }
});
