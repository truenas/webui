import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum Codename {
  ElectricEel = 'ElectricEel',
  Dragonfish = 'DragonFish',
}

export const codenameLabels = new Map<Codename, string>([
  [Codename.ElectricEel, T('Electric Eel')],
  [Codename.Dragonfish, T('DragonFish')],
]);
