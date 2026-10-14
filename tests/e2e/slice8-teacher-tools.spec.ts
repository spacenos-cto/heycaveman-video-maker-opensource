import { expect, test } from '@playwright/test';

// Slice 8: Lesson Builder, templates, title/quiz/recap scenes, pause points and Shuffle (prd.md > F3, F12).
test('a template filled with a topic and two points, plus a multiple-choice quiz, becomes a lesson video', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: /Use a template/ }).click();
  await page.getByTestId('templates').getByRole('button', { name: /Explain a concept/ }).click();
  const builder = page.getByTestId('lesson-builder');
  await expect(builder.getByRole('button', { name: 'Make my video' })).toBeDisabled();
  await builder.getByLabel('Topic', { exact: true }).fill('The water cycle');
  await expect(builder.getByText('Add at least one key point.')).toBeVisible();
  await builder.getByLabel('Key points 1').fill('The sun warms water in the sea.');
  await builder.getByLabel('Key points 2').fill('Water vapour rises and makes clouds.');
  await builder.getByLabel(/^Question/).fill('What makes the water warm?');
  await builder.getByLabel('Multiple choice (2–4 answers)').check();
  await builder.getByLabel('Answer A', { exact: true }).fill('The moon');
  await builder.getByLabel('Answer B', { exact: true }).fill('The sun');
  await expect(builder.getByText('Pick which answer is right.')).toBeVisible();
  await builder.getByLabel('B is the right answer').check();
  await builder.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });

  const thumbs = page.getByTestId('thumbnails').locator('li');
  // title, hook, 2 points, quiz, outro, end card
  await expect(thumbs).toHaveCount(7);
  await expect(thumbs.first().getByTestId('title-card')).toContainText('The water cycle');
  await expect(thumbs.nth(4).getByTestId('quiz-card')).toContainText('What makes the water warm?');

  // Jump to the end of the quiz: the right answer lights up.
  await thumbs.nth(5).getByRole('button').click();
  await page.keyboard.press('Escape');
  const slider = page.getByLabel('Position in the video');
  const v = Number(await slider.inputValue());
  await slider.fill(String(v - 24 - 20)); // 20 frames before the outro: the quiz's reveal
  await expect(page.getByTestId('player').locator('[data-testid=quiz-option][data-correct=true]')).toContainText('The sun');
});

test('pause points stop the player for discussion; Shuffle keeps the words; Turn into text fills the box', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your lesson').fill('Leaves catch the bright sunlight every day.\n\nRoots drink water from the soil below.\n\nRemember: plants make their own food!');
  await page.getByRole('button', { name: 'Make my video' }).click();
  await expect(page.getByTestId('player')).toBeVisible({ timeout: 15_000 });

  await page.getByTestId('thumbnails').getByRole('button', { name: 'Scene 1' }).click();
  await page.getByTestId('scene-panel').getByLabel(/Pause here for discussion/).check();
  await page.getByRole('button', { name: 'Close scene panel' }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByTestId('paused-for-talk')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('thumbnails').getByRole('button', { name: 'Scene 1' })).toHaveAttribute('aria-current', 'true');

  const words = await page.getByTestId('thumbnails').locator('[data-testid=scene-svg]').evaluateAll((s) => s.map((x) => x.getAttribute('aria-label')));
  await page.getByRole('button', { name: 'Shuffle' }).click();
  expect(await page.getByTestId('thumbnails').locator('[data-testid=scene-svg]').evaluateAll((s) => s.map((x) => x.getAttribute('aria-label')))).toEqual(words);

  // A lone topic opens the Lesson Builder with the topic filled in; Turn into text writes the script.
  await page.getByRole('button', { name: 'Back to my lesson' }).click();
  await page.getByLabel('Your lesson').fill('volcanoes');
  await page.getByRole('button', { name: 'Make my video' }).click();
  const builder = page.getByTestId('lesson-builder');
  await expect(builder.getByLabel('Topic', { exact: true })).toHaveValue('volcanoes');
  await builder.getByLabel('Key points 1').fill('Lava is melted rock from deep inside the earth.');
  await builder.getByRole('button', { name: 'Turn into text' }).click();
  await expect(page.getByLabel('Your lesson')).toHaveValue(/Ever wondered about volcanoes\?\n\nLava is melted rock/);
});
