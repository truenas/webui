import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { translationDir } from 'app/constants/languages.constant';
import { getLanguageFiles } from './language/get-language-files';

type Translations = Record<string, string>;

function parseJsonSafe(input: string): Translations {
  try {
    const obj = JSON.parse(input);
    if (obj && typeof obj === 'object') return obj as Translations;
    return {};
  } catch {
    return {};
  }
}

function readJsonFromFs(filePath: string): Translations {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  return parseJsonSafe(content);
}

function readJsonFromGit(ref: string, filePath: string): Translations | null {
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    const content = execFileSync('git', ['show', `${ref}:${filePath}`], {
      stdio: ['ignore', 'pipe', 'ignore'],
      env: getSafeEnv(),
    }).toString('utf8');
    return parseJsonSafe(content);
  } catch {
    return null;
  }
}

function sortObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
    sorted[key] = obj[key];
  }
  return sorted as T;
}

function replaceEmptiesWithKeys(obj: Translations): Translations {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      obj[key] = key;
    }
  }
  return obj;
}

function applyLinkHandling(value: string): string {
  let replaced = value;
  const replacements: { re: RegExp; to: string }[] = [
    { re: /https?:\/\/(www\.)?truenas\.com\/docs/gi, to: 'https://harboros.ai/docs' },
    { re: /https?:\/\/(www\.)?truenas\.com(?!\/docs)/gi, to: 'https://harboros.ai' },
    { re: /https?:\/\/www\.ixsystems\.com/gi, to: 'https://harboros.ai' },
    { re: /https?:\/\/portal\.truenas\.com\/portal\/login/gi, to: 'https://portal.harboros.ai/portal/login' },
    { re: /https?:\/\/forums\.truenas\.com\b/gi, to: 'https://github.com/HarborNAS/community/discussions' },
    { re: /https:\/\/discord.gg\/Q3St5fPETd\b/gi, to: 'https://github.com/HarborNAS/community/discussions' },
    { re: /https?:\/\/github\.com\/truenas\b/gi, to: 'https://github.com/HarborNAS' },
    { re: /https?:\/\/github\.com\/ixsystems\b/gi, to: 'https://github.com/HarborNAS' },
    { re: /https?:\/\/docs\.truenas\.com\b/gi, to: 'https://harboros.ai/docs' },
  ];
  for (const { re, to } of replacements) replaced = replaced.replace(re, to);
  return replaced;
}

function brandReplace(value: string): string {
  return value.replace(/TrueNAS/g, 'HarborOS').replace(/truenas/g, 'harboros');
}

function getSafeEnv(): NodeJS.ProcessEnv {
  const safePath = '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin';
  return { ...process.env, PATH: safePath };
}

function detectSourceRef(cliRef?: string): string {
  if (cliRef) return cliRef;

  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    const parents = execFileSync('git', ['show', '-s', '--format=%P', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'], env: getSafeEnv() })
      .toString('utf8')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parents.length === 2) {
      const [parentOne, parentTwo] = parents;
      const enTranslationsOne = readJsonFromGit(parentOne, path.join(translationDir, 'en.json')) || {};
      const enTranslationsTwo = readJsonFromGit(parentTwo, path.join(translationDir, 'en.json')) || {};
      const score = (obj: Translations): number => {
        const text = Object.values(obj).join('\n');
        let scoreValue = 0;
        if (text.includes('HarborOS')) scoreValue += 3;
        if (text.includes('HarborNAS')) scoreValue += 2;
        if (text.includes('harboros.ai')) scoreValue += 1;
        return scoreValue;
      };
      const scoreOne = score(enTranslationsOne);
      const scoreTwo = score(enTranslationsTwo);
      return scoreOne >= scoreTwo ? parentOne : parentTwo;
    }
  } catch {
    // ignore
  }

  return 'HEAD';
}

function collectHarborKeysFromSource(): string[] {
  const harborKeys = [
    'Submit a Bug Report',
    'Submit Feedback',
    'About HarborOS',
  ];
  return harborKeys;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const refArgIdx = args.findIndex((a) => a === '--source-ref' || a === '--ref');
  const cliRef = refArgIdx >= 0 ? args[refArgIdx + 1] : process.env.I18N_MERGE_SOURCE_REF;
  const sourceRef = detectSourceRef(cliRef);

  const languages = await getLanguageFiles(translationDir);
  const harborKeys = collectHarborKeysFromSource();

  for (const lang of languages) {
    const filePath = path.join(translationDir, `${lang}.json`);
    const target = readJsonFromFs(filePath);
    const source = readJsonFromGit(sourceRef, filePath) || {};

    for (const key of harborKeys) {
      if (target[key] === undefined) {
        const val = source[key];
        target[key] = typeof val === 'string' ? val : '';
      }
    }

    replaceEmptiesWithKeys(target);

    for (const key of Object.keys(target)) {
      const value = target[key];
      if (typeof value === 'string' && value) {
        let newValue = applyLinkHandling(value);
        newValue = brandReplace(newValue);
        target[key] = newValue;
      }
    }

    const output = sortObjectKeys(target);
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2) + '\n', 'utf8');
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
