#!/usr/bin/env node
// Pre-renders the inflatable blue ribbon (devpost/prd.md > Look and Feel v4) to one WebP image, so the
// landing page shows a picture instead of running an SVG grain filter in the browser on every frame.
// Run: node scripts/make-ribbon.mjs   (re-run only if the ribbon's shape or colours change)
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const D = 'M-160 760 C 80 420, 300 120, 560 240 S 760 820, 1040 700 S 1300 80, 1620 260';
const W = 210;
// The tube runs past the 1440×900 frame, so render a wider box around it.
const VIEW = { x: -300, y: -20, w: 2040, h: 1000 };
const SCALE = 1.25;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${VIEW.w * SCALE}" height="${VIEW.h * SCALE}" viewBox="${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}">
  <defs>
    <filter id="grain" filterUnits="userSpaceOnUse" x="${VIEW.x}" y="${VIEW.y}" width="${VIEW.w}" height="${VIEW.h}">
      <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="2" seed="7" result="noise" />
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 -0.1" result="specks" />
      <feComposite in="specks" in2="SourceGraphic" operator="in" result="grain" />
      <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="grain" /></feMerge>
    </filter>
    <filter id="soft" filterUnits="userSpaceOnUse" x="${VIEW.x}" y="${VIEW.y}" width="${VIEW.w}" height="${VIEW.h}"><feGaussianBlur stdDeviation="10" /></filter>
  </defs>
  <g filter="url(#grain)">
    <path d="${D}" fill="none" stroke="#1d6fd6" stroke-width="${W}" stroke-linecap="round" transform="translate(0 14)" />
    <path d="${D}" fill="none" stroke="#4da2ff" stroke-width="${W * 0.9}" stroke-linecap="round" />
    <path d="${D}" fill="none" stroke="#a9d3ff" stroke-width="${W * 0.32}" stroke-linecap="round" transform="translate(-6 -26)" filter="url(#soft)" opacity="0.9" />
    <path d="${D}" fill="none" stroke="#ffffff" stroke-width="${W * 0.07}" stroke-linecap="round" transform="translate(-10 -34)" opacity="0.75" />
  </g>
</svg>`;

const browser = await chromium.launch();
const page = await browser.newPage();
const dataUrl = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext('2d').drawImage(img, 0, 0);
  return c.toDataURL('image/webp', 0.8);
}, svg);
await browser.close();
const bytes = Buffer.from(dataUrl.split(',')[1], 'base64');
writeFileSync('public/ribbon-hero.webp', bytes);
console.log(`public/ribbon-hero.webp ${(bytes.length / 1024).toFixed(0)} KB (${VIEW.w * SCALE}×${VIEW.h * SCALE}); frame box in image: x ${(-VIEW.x / VIEW.w * 100).toFixed(2)}%, y ${(-VIEW.y / VIEW.h * 100).toFixed(2)}%, w ${(1440 / VIEW.w * 100).toFixed(2)}%, h ${(900 / VIEW.h * 100).toFixed(2)}%`);
