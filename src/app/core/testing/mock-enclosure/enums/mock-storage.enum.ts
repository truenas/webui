/**
 * @deprecated
 */
export enum MockStorageScenarioOld {
  Default = 'default',
  Uniform = 'uniform',
  Multi = 'multi', // Multiple problems
  MixedVdevLayout = 'mixedVdevLayout',
  MixedVdevCapacity = 'mixedVdevCapacity',
  MixedDiskCapacity = 'mixedDiskCapacity',
  MixedVdevWidth = 'mixedVdevWidth',
  NoRedundancy = 'noRedundancy',
}

export enum MockStorageScenario {
  AllSlotsEmpty = 'empty',
  /**
   * Some slots are empty, some slots are part of the pool.
   */
  FillSomeSlots = 'fill-some',
}

export const mockStorageScenarioLabels = new Map<MockStorageScenario, string>([
  [MockStorageScenario.AllSlotsEmpty, 'All slots empty'],
  [MockStorageScenario.FillSomeSlots, 'Add disks to some slots and add pool to some disks'],
]);

export enum MockDiskType {
  'Hdd' = 'Hdd',
  'Nvme' = 'Nvme',
  'Ssd' = 'Ssd',
}

export enum EnclosureDispersalStrategy {
  Min = 'min',
  Max = 'max',
  Default = 'default',
  Existing = 'existing',
}
