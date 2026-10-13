#!/usr/bin/env node
// Copies the speech engine's WebAssembly files from the installed package into public/ort/, so the
// voice engine loads from this app instead of a CDN (devpost/prd.md principle: nothing leaves the device
// except the one-time voice model download). Runs before dev and build.
import { copyFileSync, mkdirSync } from 'node:fs';

const from = 'node_modules/@huggingface/transformers/dist';
mkdirSync('public/ort', { recursive: true });
for (const f of ['ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm']) copyFileSync(`${from}/${f}`, `public/ort/${f}`);
console.log('copied speech engine to public/ort/');
