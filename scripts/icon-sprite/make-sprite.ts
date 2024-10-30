import crypto from 'crypto';
import fs from 'fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolve } from 'path';
import { addCustomIcons } from './lib/add-custom-icons';
import { buildSprite } from './lib/build-sprite';
import { findIconsInTemplates } from './lib/find-icons-in-templates';
import { findIconsWithMarker } from './lib/find-icons-with-marker';
import { getIconPaths } from './lib/get-icon-paths';
import { warnAboutDuplicates } from './lib/warn-about-duplicates';

async function makeSprite(): Promise<void> {
  try {
    // TODO: Can be simplified in node 20.11+
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    const srcDir = resolve(__dirname, '../../src');
    const targetPath = resolve(__dirname, '../../src/assets/icons/sprite.svg');
    const configPath = resolve(__dirname, '../../src/assets/icons/sprite-config.json');

    const templateIcons = findIconsInTemplates(srcDir);
    const markerIcons = findIconsWithMarker(srcDir);
    const usedIcons = new Set([...templateIcons, ...markerIcons]);

    const allIcons = addCustomIcons(usedIcons);

    warnAboutDuplicates(allIcons);

    if (!allIcons.size) {
      throw new Error('No icons found in the project.');
    }

    const icons = getIconPaths(allIcons);

    const result = await buildSprite(icons);
    const file = Object.values(result)[0].sprite;

    const buffer = file.contents as Buffer;
    const size = buffer.length / 1024;

    fs.writeFileSync(targetPath, buffer);

    // eslint-disable-next-line sonarjs/hashing
    const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 10);
    const versionedUrl = `assets/icons/sprite.svg?v=${hash}`;

    fs.writeFileSync(configPath, JSON.stringify({ iconUrl: versionedUrl }, null, 2));

    console.info(`Generated icon sprite with ${allIcons.size} icons (${size.toFixed(2)} KiB).`);
    console.info(`Versioned sprite URL: ${versionedUrl}`);
  } catch (error) {
    console.error('Error when building the icon sprite:', error);
    throw error;
  }
}

makeSprite();
