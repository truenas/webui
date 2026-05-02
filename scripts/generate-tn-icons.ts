import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcApp = path.join(root, 'src', 'app');
const customIconDir = path.join(root, 'src', 'assets', 'icons', 'custom');
const outputDir = path.join(root, 'src', 'assets', 'tn-icons');
const spritePath = path.join(outputDir, 'sprite.svg');
const configPath = path.join(outputDir, 'sprite-config.json');

const { buildSprite } = await import('../node_modules/@truenas/ui-components/scripts/icon-sprite/lib/build-sprite.ts');
const { getIconPaths } = await import('../node_modules/@truenas/ui-components/scripts/icon-sprite/lib/get-icon-paths.ts');

function walkFiles(dir: string, extensions: Set<string>): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, extensions));
    } else if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function iconNameForLibrary(iconName: string, library?: string): string {
  if (library === 'mdi' && !iconName.startsWith('mdi-')) {
    return `mdi-${iconName}`;
  }
  if (library === 'material' && !iconName.startsWith('mat-')) {
    return `mat-${iconName}`;
  }
  if (library === 'custom' && !iconName.startsWith('app-') && !iconName.startsWith('tn-')) {
    return `app-${iconName}`;
  }
  return iconName;
}

function addMarkerIcons(icons: Set<string>): void {
  const markerPattern = /\b(tn|lib)IconMarker\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*['"`]([^'"`]+)['"`])?\s*\)/g;

  for (const file of walkFiles(srcApp, new Set(['.ts', '.html']))) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(markerPattern)) {
      const [, markerKind, name, library] = match;
      if (!name) {
        continue;
      }

      icons.add(markerKind === 'lib' ? name : iconNameForLibrary(name, library));
    }
  }
}

function parseAttributes(tag: string): Map<string, string> {
  const attrs = new Map<string, string>();
  const attrPattern = /(\[?[\w-]+\]?)(?:\s*=\s*"([^"]*)")?/g;

  for (const match of tag.matchAll(attrPattern)) {
    const [, key, value = ''] = match;
    attrs.set(key, value);
  }

  return attrs;
}

function addTemplateIcons(icons: Set<string>): void {
  const tagPattern = /<tn-icon(?:-button)?\b[^>]*>/g;
  const quotedIconPattern = /[?:]\s*['"]([a-z0-9_-]+)['"]/gi;

  for (const file of walkFiles(srcApp, new Set(['.html']))) {
    const content = fs.readFileSync(file, 'utf8');
    for (const tagMatch of content.matchAll(tagPattern)) {
      const attrs = parseAttributes(tagMatch[0]);
      const library = attrs.get('library');
      const staticName = attrs.get('name');
      const boundName = attrs.get('[name]');

      if (staticName) {
        icons.add(iconNameForLibrary(staticName, library));
      }

      if (!boundName || boundName.includes('tnIconMarker')) {
        continue;
      }

      const simpleString = boundName.match(/^['"]([^'"]+)['"]$/);
      if (simpleString?.[1]) {
        icons.add(iconNameForLibrary(simpleString[1], library));
      }

      for (const match of boundName.matchAll(quotedIconPattern)) {
        icons.add(iconNameForLibrary(match[1], library));
      }
    }
  }
}

function addCustomIconFiles(icons: Set<string>): void {
  if (!fs.existsSync(customIconDir)) {
    return;
  }

  for (const file of fs.readdirSync(customIconDir)) {
    if (file.endsWith('.svg')) {
      icons.add(`app-${file.replace(/\.svg$/, '')}`);
    }
  }
}

function addLibraryIcons(icons: Set<string>): void {
  const libraryConfigPath = path.join(
    root,
    'node_modules',
    '@truenas',
    'ui-components',
    'assets',
    'tn-icons',
    'sprite-config.json',
  );

  const libraryConfig = JSON.parse(fs.readFileSync(libraryConfigPath, 'utf8')) as { icons?: string[] };
  for (const icon of libraryConfig.icons ?? []) {
    icons.add(icon);
  }
}

const icons = new Set<string>();
addLibraryIcons(icons);
addCustomIconFiles(icons);
addTemplateIcons(icons);
addMarkerIcons(icons);

const iconPaths = getIconPaths(icons, root) as Map<string, string>;
const missingIcons = Array.from(iconPaths)
  .filter(([, iconPath]) => !fs.existsSync(iconPath))
  .map(([name, iconPath]) => `${name} (${iconPath})`);

if (missingIcons.length) {
  console.error('Missing icon source file(s):');
  for (const icon of missingIcons) {
    console.error(`- ${icon}`);
  }
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

const result = await buildSprite(iconPaths);
const file = Object.values(result)[0].sprite;
const buffer = file.contents as Buffer;
fs.writeFileSync(spritePath, buffer);

// eslint-disable-next-line sonarjs/hashing
const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 10);
const sortedIcons = Array.from(icons).sort();
fs.writeFileSync(configPath, `${JSON.stringify({
  iconUrl: `assets/tn-icons/sprite.svg?v=${hash}`,
  icons: sortedIcons,
}, null, 2)}\n`);

console.info(`Generated icon sprite with ${sortedIcons.length} icons (${(buffer.length / 1024).toFixed(2)} KiB).`);
console.info(`Versioned sprite URL: assets/tn-icons/sprite.svg?v=${hash}`);
