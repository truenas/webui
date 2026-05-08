import fs from 'node:fs/promises';
import path from 'node:path';

const sourceRoot = path.join('src', 'app', 'pages', 'harbor-assistant');
const enPath = path.join('src', 'assets', 'i18n', 'en.json');
const zhHansPath = path.join('src', 'assets', 'i18n', 'zh-hans.json');
const hanPattern = /\p{Script=Han}/u;

const sourceFiles = await listSourceFiles(sourceRoot);
const en = JSON.parse(await fs.readFile(enPath, 'utf8'));
const zhHans = JSON.parse(await fs.readFile(zhHansPath, 'utf8'));
const keys = new Set();
const errors = [];

for (const file of sourceFiles) {
  const source = await fs.readFile(file, 'utf8');
  const hanLine = findHanLine(source);
  if (hanLine) {
    errors.push(`${file}:${hanLine.line}: Chinese text must live in zh-hans.json, not Harbor Assistant source.`);
  }

  for (const key of extractTranslationKeys(source)) {
    keys.add(key);
  }
}

for (const key of [...keys].sort()) {
  if (!(key in en)) {
    errors.push(`${enPath}: missing Harbor Assistant key "${key}"`);
  } else if (hanPattern.test(String(en[key]))) {
    errors.push(`${enPath}: English translation for "${key}" contains Chinese text.`);
  }

  if (!(key in zhHans)) {
    errors.push(`${zhHansPath}: missing Harbor Assistant key "${key}"`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Harbor Assistant i18n check passed: ${keys.size} keys across ${sourceFiles.length} source files.`);

async function listSourceFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listSourceFiles(fullPath));
      continue;
    }

    if (/\.(ts|html)$/.test(entry.name) && !entry.name.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function findHanLine(source) {
  const lines = source.split(/\r?\n/);
  const index = lines.findIndex((line) => hanPattern.test(line));

  if (index === -1) {
    return null;
  }

  return {
    line: index + 1,
    text: lines[index],
  };
}

function extractTranslationKeys(source) {
  const keys = [];
  const patterns = [
    /T\(\s*'((?:\\'|[^'])+)'\s*\)/g,
    /T\(\s*"((?:\\"|[^"])+)"\s*\)/g,
    /translate\.instant\(\s*'((?:\\'|[^'])+)'/g,
    /translate\.instant\(\s*"((?:\\"|[^"])+)"/g,
    /'((?:\\'|[^'])+)'\s*\|\s*translate/g,
    /"((?:\\"|[^"])+)"\s*\|\s*translate/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      keys.push(unescapeLiteral(match[1]));
    }
  }

  return keys;
}

function unescapeLiteral(value) {
  return value
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n');
}
