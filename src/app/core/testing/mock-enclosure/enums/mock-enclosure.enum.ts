export enum MockEnclosureScenario {
  AllSlotsEmpty = 'empty',
  /**
   * Some slots are empty, some slots are part of the pool.
   */
  FillSomeSlots = 'fill-some',
  FillAllSlots = 'all-slots',
  DiskStatuses = 'disk-statuses',
}

export const mockEnclosureScenarioLabels = new Map<MockEnclosureScenario, string>([
  [MockEnclosureScenario.AllSlotsEmpty, 'All slots empty'],
  [MockEnclosureScenario.FillSomeSlots, 'Add disks to some slots and add pools to some disks.'],
  [MockEnclosureScenario.FillAllSlots, 'Add disks to all slots and add pools to all disks'],
  [MockEnclosureScenario.DiskStatuses, 'Fill some slots and use all disk statuses'],
]);
