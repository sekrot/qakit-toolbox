#!/usr/bin/env node
/**
 * Verifies that every locale under src/i18n/locales/<lang>/ has the same
 * key tree as the English source. Exits with code 1 on any mismatch.
 *
 * Run: `node scripts/check-i18n.mjs` (wired into npm scripts as `i18n:check`).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n', 'locales');
const SOURCE = 'en';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function flatten(obj, prefix = '') {
  const out = new Set();
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const nested of flatten(value, full)) out.add(nested);
    } else {
      out.add(full);
    }
  }
  return out;
}

const locales = readdirSync(ROOT).filter((d) => statSync(join(ROOT, d)).isDirectory());
const files = readdirSync(join(ROOT, SOURCE)).filter((f) => f.endsWith('.json'));

let problems = 0;

for (const file of files) {
  const sourceKeys = flatten(readJson(join(ROOT, SOURCE, file)));
  for (const lang of locales) {
    if (lang === SOURCE) continue;
    const path = join(ROOT, lang, file);
    let langKeys;
    try {
      langKeys = flatten(readJson(path));
    } catch (e) {
      console.error(`[${lang}/${file}] ${e.message}`);
      problems++;
      continue;
    }
    const missing = [...sourceKeys].filter((k) => !langKeys.has(k));
    const extra = [...langKeys].filter((k) => !sourceKeys.has(k));
    if (missing.length) {
      console.error(`[${lang}/${file}] missing keys: ${missing.join(', ')}`);
      problems++;
    }
    if (extra.length) {
      console.error(`[${lang}/${file}] extra keys: ${extra.join(', ')}`);
      problems++;
    }
  }
}

if (problems === 0) {
  console.log(`OK — ${files.length} files × ${locales.length} locales consistent`);
} else {
  console.error(`\n${problems} problem(s) detected`);
  process.exit(1);
}
