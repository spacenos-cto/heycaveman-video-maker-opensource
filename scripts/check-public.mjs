#!/usr/bin/env node
// Scans files before they become public: staged files by default, `--all` for every tracked file,
// `--history` for every blob ever committed. Fails (exit 1) on key/token patterns, private-key
// headers, absolute local paths, email addresses, and keywords from the gitignored
// `.check-public.local` (one per line), so the private list itself is never published.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const mode = process.argv.includes('--history') ? 'history' : process.argv.includes('--all') ? 'all' : 'staged';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

const SKIP = /(^|\/)(node_modules|dist|dev-dist)\/|\.(png|jpe?g|webp|gif|ico|woff2?|ttf|otf|wav|mp3|ogg|mp4|webm|onnx|zip|caveman)$/i;
const RULES = [
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['token or API key', /\b(glpat-[\w-]{10,}|ghp_[\w]{20,}|github_pat_[\w]{20,}|sk-(ant-)?[\w-]{20,}|AKIA[0-9A-Z]{16}|AIza[\w-]{30,}|xox[abp]-[\w-]{10,})/],
  // Any Windows drive-letter path, with either slash style, or a Git-Bash style drive path.
  ['absolute local path', /\b[A-Za-z]:[\\/][\w .-]+[\\/]|(^|[\s"'`(])\/[a-z]\/[A-Z][\w .-]*\//],
  ['email address', /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/],
];
// Emails that are fine to publish (package metadata, licence boilerplate, commit trailers).
const EMAIL_OK = /noreply@|@users\.noreply\.github\.com|licensing@fsf\.org|@example\.(com|org)|\bgnu\.org\b/i;

const keywords = existsSync('.check-public.local')
  ? readFileSync('.check-public.local', 'utf8').split(/\r?\n/).map((l) => l.trim().toLowerCase()).filter((l) => l && !l.startsWith('#'))
  : [];

function sources() {
  if (mode === 'staged') {
    return git('diff', '--cached', '--name-only', '--diff-filter=ACMR').split('\n').filter(Boolean)
      .map((path) => ({ path, read: () => git('show', `:${path}`) }));
  }
  if (mode === 'all') {
    return git('ls-files').split('\n').filter(Boolean).map((path) => ({ path, read: () => readFileSync(path, 'utf8') }));
  }
  const seen = new Set();
  return git('rev-list', '--objects', '--all').split('\n').filter(Boolean).flatMap((line) => {
    const [sha, path] = line.split(' ');
    if (!path || seen.has(sha)) return [];
    seen.add(sha);
    return [{ path: `${path} @${sha.slice(0, 8)}`, read: () => git('cat-file', '-p', sha) }];
  });
}

const problems = [];
for (const { path, read } of sources()) {
  if (SKIP.test(path) || path.startsWith('.check-public.local')) continue;
  let text;
  try { text = read(); } catch { continue; }
  text.split(/\r?\n/).forEach((line, i) => {
    for (const [name, re] of RULES) {
      const m = line.match(re);
      if (m && !(name === 'email address' && EMAIL_OK.test(m[0]))) problems.push(`${path}:${i + 1}  ${name}: ${m[0]}`);
    }
    const low = line.toLowerCase();
    for (const k of keywords) if (low.includes(k)) problems.push(`${path}:${i + 1}  private keyword: "${k}"`);
  });
}

if (problems.length) {
  console.error(`check:public found ${problems.length} problem(s) (${mode}):\n` + problems.slice(0, 200).join('\n'));
  process.exit(1);
}
console.log(`check:public OK (${mode}${keywords.length ? `, ${keywords.length} private keywords` : ', no private keyword list found'})`);
