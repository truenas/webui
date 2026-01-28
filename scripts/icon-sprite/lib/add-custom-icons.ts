import fs from 'fs';
import { resolve } from 'path';

export function addCustomIcons(usedIcons: Set<string>): Set<string> {
  const customIconsPath = resolve(import.meta.dirname, '../../../src/assets/icons/custom');

  const customIcons = new Set<string>();

  fs.readdirSync(customIconsPath).forEach((filename) => {
    const icon = `ix-${filename.replace('.svg', '')}`;
    customIcons.add(icon);
  });

  // Temporarily disabled during icon migration - custom icons will use both ix- and tn- prefixes
  // Custom icon validation check removed temporarily
  // TODO: Re-enable validation after migration is complete

  return new Set([...customIcons, ...usedIcons]);
}
