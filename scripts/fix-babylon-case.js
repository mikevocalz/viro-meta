#!/usr/bin/env node
// Babylon Native's vendored jsruntimehost-src ships CamelCased Include/ Source/
// dirs but its CMakeLists.txt files reference them as lowercase. Builds fine
// on case-insensitive filesystems (macOS, Windows) and breaks on Linux. We
// add lowercase symlinks alongside each CamelCased dir so both casings work.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(
  __dirname,
  '..',
  'node_modules',
  '@babylonjs',
  'react-native',
  'shared',
  'BabylonNative',
  'deps',
  'jsruntimehost-src',
);

if (!fs.existsSync(ROOT)) {
  process.exit(0);
}

let linked = 0;
for (const entry of walk(ROOT)) {
  const base = path.basename(entry);
  if (base !== 'Include' && base !== 'Source') continue;
  const lower = path.join(path.dirname(entry), base.toLowerCase());
  if (fs.existsSync(lower)) continue;
  try {
    fs.symlinkSync(base, lower, 'dir');
    linked += 1;
  } catch (err) {
    console.warn(`[fix-babylon-case] could not link ${lower}:`, err.message);
  }
}
console.log(`[fix-babylon-case] linked ${linked} dirs in ${path.relative(process.cwd(), ROOT)}`);

function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    yield full;
    yield* walk(full);
  }
}
