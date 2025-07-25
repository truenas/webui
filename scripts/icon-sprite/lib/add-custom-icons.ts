import fs from 'fs';
import { resolve } from 'path';

export function addCustomIcons(usedIcons: Set<string>): Set<string> {
  const customIconsPath = resolve(import.meta.dirname, '../../../src/assets/icons/custom');

  const customIcons = new Set<string>();
  const unusedCustomIcons = new Set<string>();

  fs.readdirSync(customIconsPath).forEach((filename) => {
    const icon = `ix-${filename.replace('.svg', '')}`;
    if (!usedIcons.has(icon)) {
      unusedCustomIcons.add(icon);
    }

    customIcons.add(icon);
  });

  if (unusedCustomIcons.size > 0) {
    console.error(
      `The following custom icons are not used in the application: ${Array.from(unusedCustomIcons).join(', ')}\n`
      + 'Wrap them with iconMarker or remove them from `icons/custom`.',
    );

    process.exit(1);
  }

  return new Set([...customIcons, ...usedIcons]);
}
