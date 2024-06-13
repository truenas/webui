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
  FillAllSlots = 'all-slots',
}

export const mockStorageScenarioLabels = new Map<MockStorageScenario, string>([
  [MockStorageScenario.AllSlotsEmpty, 'All slots empty'],
  [MockStorageScenario.FillSomeSlots, 'Add disks to some slots and add a pool to some disks'],
  [MockStorageScenario.FillAllSlots, 'Add disks to all slots and add a pool to all disks'],
]);

export enum MockDiskType {
  'Hdd' = 'Hdd',
  'Nvme' = 'Nvme',
  'Ssd' = 'Ssd',
}
