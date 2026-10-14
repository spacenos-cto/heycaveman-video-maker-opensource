// An SVG painted onto a canvas can't load outside files, so for export every drawing and the caption
// font are turned into data URIs once, from this app's own bundled files (nothing leaves the device).
import { isUpload, uploadDataUri } from '../editor/uploads';
import captionFontUrl from '@fontsource/baloo-2/files/baloo-2-latin-800-normal.woff2?url';

const cache = new Map<string, Promise<string>>();

function toBase64(bytes: ArrayBuffer): string {
  const u8 = new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
}

function dataUri(url: string, mime: string): Promise<string> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`could not load ${url}`);
        return r.arrayBuffer();
      })
      .then((b) => `data:${mime};base64,${toBase64(b)}`);
    cache.set(url, p);
  }
  return p;
}

/** href resolver for SceneSvg during export: every file the video uses, as a data URI. */
export async function embeddedHrefs(files: string[]): Promise<(file: string) => string> {
  const unique = [...new Set(files)];
  const uris = await Promise.all(unique.map((f) => (isUpload(f) ? uploadDataUri(f) : dataUri(`/${f}`, 'image/svg+xml'))));
  const map = new Map(unique.map((f, i) => [f, uris[i]]));
  return (file) => map.get(file) ?? '';
}

/** @font-face for the caption font, embedded so exported captions match the player exactly. */
export async function embeddedFontCss(): Promise<string> {
  const uri = await dataUri(captionFontUrl, 'font/woff2');
  return `@font-face{font-family:'Baloo 2';font-weight:800;font-style:normal;src:url(${uri}) format('woff2');}`;
}
