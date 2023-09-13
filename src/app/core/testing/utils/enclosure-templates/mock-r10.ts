import { Enclosure, EnclosureElementsGroup } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockR10 extends MockEnclosure {
  readonly totalSlotsFront: number = 16;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;

  data = {
    id: 'mapped_enclosure_0',
    bsg: 'bsg/0:0:15:0',
    name: 'Drive Bays',
    model: 'R10',
    controller: true,
    elements: [
      {
        name: 'Array Device Slot',
        descriptor: 'Drive Slots',
        header: [
          'Descriptor',
          'Status',
          'Value',
          'Device',
        ],
        elements: [],
        has_slot_status: false,
      },
    ],
    number: 0,
    label: 'Drive Bays',
  } as Enclosure;

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.enclosureInit();
  }

  resetSlotsToEmpty(): void {
    const emptySlots = this.generateEmptySlots(this.totalSlotsFront + this.totalSlotsRear);
    (this.data.elements[0] as EnclosureElementsGroup).elements = emptySlots;
  }
}
