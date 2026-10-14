// Your own pictures (devpost/prd.md > F9.6): resized on this device to at most 1920 px, kept as blobs
// in IndexedDB and inside .caveman files. Never uploaded anywhere.
import { create } from 'zustand';
import { storage } from '../storage/db';
import { UPLOAD_PREFIX, type Project } from '../types';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_SIDE = 1920;
const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export class PictureError extends Error {
  constructor(public kind: 'type' | 'tooLarge') {
    super(kind);
  }
}

/** Object URLs for the pictures of the open project, so the SVG can show them. */
export const useUploads = create<{ urls: Record<string, string> }>(() => ({ urls: {} }));

export const isUpload = (ref: string) => ref.startsWith(UPLOAD_PREFIX);
export const uploadRef = (blobId: string) => `${UPLOAD_PREFIX}${blobId}`;
export const blobIdOf = (ref: string) => ref.slice(UPLOAD_PREFIX.length);

/** href for an uploaded picture on screen ('' until it has loaded). */
export const uploadHref = (ref: string) => useUploads.getState().urls[blobIdOf(ref)] ?? '';

/** Every picture blob a project uses (props and backgrounds). */
export function uploadIds(project: Project): string[] {
  const ids = new Set<string>();
  for (const s of project.scenes) {
    for (const p of s.props) if (isUpload(p.assetId)) ids.add(blobIdOf(p.assetId));
    if (s.background.type === 'upload') ids.add(s.background.blobId);
  }
  return [...ids];
}

function remember(id: string, blob: Blob) {
  if (useUploads.getState().urls[id]) return;
  useUploads.setState((s) => ({ urls: { ...s.urls, [id]: URL.createObjectURL(blob) } }));
}

export async function loadUploads(project: Project): Promise<void> {
  const db = await storage();
  for (const id of uploadIds(project)) {
    const blob = await db.getBlob(id);
    if (blob) remember(id, blob);
  }
}

function decode(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new PictureError('type'));
    img.src = url;
  });
}

/** Shrink to ≤ 1920 px and re-encode as WebP (keeps transparency). */
export async function preparePicture(file: File): Promise<Blob> {
  if (!TYPES.includes(file.type)) throw new PictureError('type');
  const img = await decode(file);
  const w = img.naturalWidth || 800;
  const h = img.naturalHeight || 800;
  const k = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * k));
  canvas.height = Math.max(1, Math.round(h * k));
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(img.src);
  for (const quality of [0.9, 0.75, 0.6]) {
    const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', quality));
    if (out && out.size <= MAX_UPLOAD_BYTES) return out;
  }
  throw new PictureError('tooLarge');
}

/** Keep a prepared picture on this device; returns the reference used in scenes. */
export async function keepPicture(projectId: string, blob: Blob): Promise<string> {
  const id = `img:${projectId}:${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
  await (await storage()).putBlob(id, blob);
  remember(id, blob);
  return uploadRef(id);
}

/** For export: uploaded pictures as data URIs. */
export async function uploadDataUri(ref: string): Promise<string> {
  const blob = await (await storage()).getBlob(blobIdOf(ref));
  if (!blob) return '';
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => resolve('');
    r.readAsDataURL(blob);
  });
}
