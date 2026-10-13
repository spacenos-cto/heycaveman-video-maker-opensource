import { beforeEach, describe, expect, it } from 'vitest';
import { newProject } from '../../src/director';
import { CAVEY } from '../../src/caveman/presets';
import { purgeOldDeleted, resetStorageForTests, storage, storageBlocked } from '../../src/storage/db';
import { fromFileJson, packProject, ProjectFileError, toFileJson, unpackProject } from '../../src/storage/projectFile';

const base = { shape: 'wide' as const, mood: 'bright' as const, caveman: CAVEY, readingSpeed: 'normal' as const };
const make = () => newProject('Leaves catch the bright sunlight every day.\n\nRemember: plants need water.', base);

describe('.caveman project file (prd.md > F14)', () => {
  it('round-trips a project exactly', () => {
    const p = make();
    const { project } = unpackProject(packProject(p));
    expect(project).toEqual({ ...p, extra: undefined });
  });

  it('keeps fields it does not know (premium / newer versions) untouched', () => {
    const p = make();
    const premium = { ...toFileJson(p), premiumLook: { id: 'storybook', palette: [1, 2, 3] }, aiScript: 'kept' };
    const { project } = fromFileJson(premium);
    expect(project.extra).toEqual({ premiumLook: { id: 'storybook', palette: [1, 2, 3] }, aiScript: 'kept' });
    const again = toFileJson(project);
    expect(again.premiumLook).toEqual(premium.premiumLook);
    expect(again.aiScript).toBe('kept');
  });

  it('notices files from a newer version', () => {
    const { newer } = fromFileJson({ ...toFileJson(make()), formatVersion: 2 });
    expect(newer).toBe(true);
  });

  it('rejects files that are not projects', () => {
    expect(() => unpackProject(new TextEncoder().encode('hello'))).toThrow(ProjectFileError);
    expect(() => fromFileJson({ hello: 'world' })).toThrow(ProjectFileError);
  });
});

describe('storage when the browser blocks it (prd.md > F1)', () => {
  beforeEach(() => resetStorageForTests());

  it('falls back to memory for this session and says so', async () => {
    const db = await storage(); // Node has no IndexedDB, like a blocked browser
    expect(storageBlocked).toBe(true);
    const p = make();
    await db.putProject(p);
    expect((await db.getProject(p.id))?.title).toBe(p.title);
  });

  it('purges projects deleted more than 30 days ago, keeps recent ones', async () => {
    const db = await storage();
    const now = Date.now();
    const old = { ...make(), id: 'old', deletedAt: now - 31 * 86_400_000 };
    const recent = { ...make(), id: 'recent', deletedAt: now - 2 * 86_400_000 };
    const live = { ...make(), id: 'live' };
    for (const p of [old, recent, live]) await db.putProject(p);
    expect(await purgeOldDeleted(now)).toBe(1);
    expect((await db.allProjects()).map((p) => p.id).sort()).toEqual(['live', 'recent']);
  });
});

describe('voice clips travel inside project files (prd.md > F14 rule 2)', () => {
  it('packs and unpacks audio clips with the project', () => {
    const p = make();
    const clip = new Uint8Array([82, 73, 70, 70, 1, 2, 3]);
    const { audio } = unpackProject(packProject(p, { 'p1:s1:builtin:x': clip }));
    expect([...audio['p1:s1:builtin:x']]).toEqual([...clip]);
  });
});
