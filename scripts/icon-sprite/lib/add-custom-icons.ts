import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolve } from 'path';

export function addCustomIcons(usedIcons: Set<string>): Set<string> {
  // TODO: Can be simplified in node 20.11+
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const customIconsPath = resolve(__dirname, '../../../src/assets/icons/custom');

  const customIcons = new Set<string>();

  fs.readdirSync(customIconsPath).forEach((filename) => {
    const icon = `ix-${filename.replace('.svg', '')}`;
    if (!usedIcons.has(icon)) {
      console.warn(`Custom icon "${icon}" does not appear to be used in the application.`);
    }

    customIcons.add(icon);
  });

  return new Set([...customIcons, ...usedIcons]);
}
