#!/usr/bin/env node
/**
 * i18n guard.
 *
 * The three locale files (uz/ru/en) have to stay in lockstep, and every key a
 * component asks for has to exist — a typo used to render the raw key name in
 * the UI, which is exactly the kind of thing that makes a page look fake.
 *
 * It checks three things:
 *   1. all three locales have exactly the same key set (and nothing unused
 *      that nobody references any more),
 *   2. every `t(language, "…")` literal in src/ resolves to a real key,
 *   3. every `Loc` triple in src/lib/content.ts has uz + ru + en.
 *
 * Run it from CI or before a commit: `npm run check-i18n`.
 */

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const LOCALES = join(SRC, "i18n", "locales");
const LANGS = ["uz", "ru", "en"];

const problems = [];
const warnings = [];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/* --------------------------------- locales -------------------------------- */

const dictionaries = {};
for (const lang of LANGS) {
  dictionaries[lang] = JSON.parse(await readFile(join(LOCALES, `${lang}.json`), "utf8"));
}

const reference = Object.keys(dictionaries.uz);
const referenceSet = new Set(reference);
for (const lang of LANGS) {
  const keys = Object.keys(dictionaries[lang]);
  if (keys.length !== reference.length) {
    problems.push(`${lang}.json has ${keys.length} keys, uz.json has ${reference.length}`);
  }
  for (const key of keys) if (!referenceSet.has(key)) problems.push(`${lang}.json has a key uz.json lacks: ${key}`);
  for (const key of reference) if (!(key in dictionaries[lang])) problems.push(`${lang}.json is missing: ${key}`);
  for (const [key, value] of Object.entries(dictionaries[lang])) {
    if (typeof value !== "string" || !value.trim()) problems.push(`${lang}.json → ${key} is empty`);
    if (value && value.trim().startsWith("§")) problems.push(`${lang}.json → ${key} looks untranslated`);
  }
}

/* ------------------------------- references ------------------------------- */

const files = (await walk(SRC)).filter((f) => !f.includes(`${LOCALES}/`));
const callRe = /\bt\(\s*[A-Za-z_.]+\s*,\s*["']([a-zA-Z0-9]+)["']\s*\)/g;
const sources = new Map();

for (const file of files) {
  const text = await readFile(file, "utf8");
  sources.set(file, text);
  for (const match of text.matchAll(callRe)) {
    if (!referenceSet.has(match[1])) {
      problems.push(`${relative(ROOT, file)} asks for "${match[1]}" which no locale defines`);
    }
  }
}

// A key counts as used if its name appears anywhere in src/ — most sections
// build their labels from arrays of keys (`{ q: "faq1Q", a: "faq1A" }`), so a
// `t(...)`-only scan reports plenty of false positives.
const allSource = [...sources.values()].join("\n");
const used = new Set();
for (const key of reference) {
  if (allSource.includes(`"${key}"`) || allSource.includes(`'${key}'`)) used.add(key);
  else warnings.push(`"${key}" is defined in all locales but never referenced`);
}

/* ---------------------------------- Loc ---------------------------------- */

const contentFile = join(SRC, "lib", "content.ts");
try {
  const content = await readFile(contentFile, "utf8");
  const count = (re) => (content.match(re) ?? []).length;
  const uzCount = count(/\buz:/g);
  const ruCount = count(/\bru:/g);
  const enCount = count(/\ben:/g);
  if (!(uzCount === ruCount && ruCount === enCount)) {
    problems.push(
      `content.ts: Loc triples must have all three languages — found ${uzCount} uz, ${ruCount} ru, ${enCount} en fields`,
    );
  }
  for (const [re, label] of [
    [/uz:\s*["'`]\s*["'`]/g, "empty uz"],
    [/ru:\s*["'`]\s*["'`]/g, "empty ru"],
    [/en:\s*["'`]\s*["'`]/g, "empty en"],
  ]) {
    if (count(re)) problems.push(`content.ts: ${label} string(s)`);
  }
} catch {
  /* content.ts is optional */
}

/* ---------------------------------- done ---------------------------------- */

if (warnings.length) {
  console.log(`\n${warnings.length} unused key(s) (ok if they are referenced dynamically):`);
  for (const w of warnings) console.log(`  · ${w}`);
}

if (problems.length) {
  console.error(`\n✗ i18n check failed (${problems.length} problem(s)):`);
  for (const p of problems) console.error(`  · ${p}`);
  process.exit(1);
}

console.log(
  `\n✓ ${reference.length} keys in ${LANGS.join("/")} · ${used.size} directly referenced · content.ts triples complete`,
);
