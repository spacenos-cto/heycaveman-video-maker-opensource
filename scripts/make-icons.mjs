#!/usr/bin/env node
// Renders the app icons (PNG, needed for "Install app") from the logo using Playwright's Chromium.
// Run: node scripts/make-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const logo = readFileSync('public/icons/logo.svg', 'utf8').replace('<svg ', '<svg width="100%" height="100%" ');
const browser = await chromium.launch();
for (const [size, file, pad] of [
  [192, 'public/icons/icon-192.png', 0.1],
  [512, 'public/icons/icon-512.png', 0.1],
  [512, 'public/icons/icon-maskable-512.png', 0.2],
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<html><body style="margin:0;background:#dceeff;display:grid;place-items:center;width:${size}px;height:${size}px">` +
      `<div style="width:${size * (1 - pad * 2)}px;height:${size * (1 - pad * 2)}px">${logo}</div></body></html>`,
  );
  await page.screenshot({ path: file });
  await page.close();
  console.log(file);
}
await browser.close();
