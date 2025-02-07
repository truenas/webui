export enum Codename {
  ElectricEel = 'ElectricEel',
  Dragonfish = 'Dragonfish',
  Fangtooth = 'Fangtooth',
}

export const versionToCodeNames = new Map<string, Codename>([
  ['24.04', Codename.Dragonfish],
  ['24.10', Codename.ElectricEel],
  ['25.04', Codename.Fangtooth],
]);
