import fs from 'fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolve } from 'path';
import { buildSprite } from './lib/build-sprite';
import { findUsedIconNames } from './lib/find-used-icon-names';
import { getIconPaths } from './lib/get-icon-paths';

async function makeSprite(): Promise<void> {
  try {
    // TODO: Can be simplified in node 20.11+
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    const srcDir = resolve(__dirname, '../../src');
    const targetPath = resolve(__dirname, '../../src/assets/icons/sprite.svg');
    const iconNames = findUsedIconNames(srcDir);

    if (!iconNames.size) {
      throw new Error('No icons found in the project.');
    }

    const icons = getIconPaths(iconNames);

    const result = await buildSprite(icons);
    const file = Object.values(result)[0].sprite;

    const buffer = file.contents as Buffer;
    const size = buffer.length / 1024;

    fs.writeFileSync(targetPath, buffer);

    console.info(`Generated icon sprite with ${iconNames.size} icons (${size.toFixed(2)} KiB).`);
  } catch (error: unknown) {
    console.error('Error when building the icon sprite:');
    throw error;
  }
}

makeSprite();
