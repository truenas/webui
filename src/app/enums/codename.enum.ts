export enum Codename {
  ElectricEel = 'ElectricEel',
  Dragonfish = 'Dragonfish',
  Fangtooth = 'Fangtooth',
  Goldeye = 'Goldeye',
}

export const versionToCodeNames = new Map<string, Codename>([
  ['24.04', Codename.Dragonfish],
  ['24.10', Codename.ElectricEel],
  ['25.04', Codename.Fangtooth],
  ['25.10', Codename.Goldeye],
]);
