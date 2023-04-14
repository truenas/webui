export enum MockStorageScenario {
  Default = 'default',
  Uniform = 'uniform',
  Multi = 'multi', // Multiple problems
  MixedVdevLayout = 'mixedVdevLayout',
  MixedVdevCapacity = 'mixedVdevCapacity',
  MixedDiskCapacity = 'mixedDiskCapacity',
  MixedVdevWidth = 'mixedVdevWidth',
  NoRedundancy = 'noRedundancy',
}

export enum EnclosureDispersalStrategy {
  Min = 'min',
  Max = 'max',
  Default = 'default',
  Existing = 'existing',
}
