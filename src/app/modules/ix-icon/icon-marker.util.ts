import { Brand } from 'utility-types';

export type MarkedIcon = Brand<string, 'MarkedIcon'>;

/**
 * This marker tells our scripts to include an icon manually to the svg sprite.
 */
export function iconMarker(name: string): MarkedIcon {
  return name as MarkedIcon;
}
