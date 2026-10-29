import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = mkdtempSync(join(tmpdir(), 'portfolio-links-'));
const checker = fileURLToPath(new URL('./check-links.mjs', import.meta.url));
const run = () => spawnSync(process.execPath, [checker, root, '--internal-only'], { encoding: 'utf8' });
try {
  mkdirSync(join(root, 'a'));
  mkdirSync(join(root, 'b'));
  writeFileSync(join(root, 'index.html'), '<a href="/a/#present">valid</a>');
  writeFileSync(join(root, 'a', 'index.html'), '<p id="present">A</p><a href="shared.html">shared</a>');
  writeFileSync(join(root, 'a', 'shared.html'), '<p>Shared A</p>');
  writeFileSync(join(root, 'b', 'index.html'), '<a href="shared.html">missing relative link</a><a href="/a/#missing">missing fragment</a>');
  const broken = run();
  assert.equal(broken.status, 1);
  assert.match(broken.stdout, /BROKEN internal .*\/b\/shared\.html/);
  assert.match(broken.stdout, /BROKEN fragment .*\/a\/#missing/);

  writeFileSync(join(root, 'b', 'shared.html'), '<p>Shared B</p>');
  writeFileSync(join(root, 'b', 'index.html'), '<a href="shared.html">valid relative link</a><a href="/a/#present">valid fragment</a>');
  const valid = run();
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
  assert.match(valid.stdout, /0 broken/);
  console.log('Link checker detects missing per-page relative paths and HTML fragments.');
} finally {
  const tempRoot = resolve(tmpdir());
  const target = resolve(root);
  if (!target.startsWith(`${tempRoot}${sep}`)) throw new Error('Unexpected temporary directory');
  rmSync(target, { recursive: true, force: true });
}
