import { MockEnclosure } from './mock-enclosure-template';

export class MockR20 extends MockEnclosure {
  override readonly totalSlotsFront: number = 12;
  override readonly totalSlotsRear: number = 2;
  override readonly totalSlotsInternal: number = 0;

  // data = {
  //   id: 'mapped_enclosure_0',
  //   name: 'Drive Bays',
  //   model: 'R20',
  //   controller: true,
  //   elements: [
  //     {
  //       name: 'Array Device Slot',
  //       descriptor: 'Drive Slots',
  //       header: [
  //         'Descriptor',
  //         'Status',
  //         'Value',
  //         'Device',
  //       ],
  //       elements: [],
  //       has_slot_status: false,
  //     },
  //   ],
  //   number: 0,
  //   label: 'Drive Bays',
  // } as EnclosureUi;

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.enclosureInit();
  }

  // resetSlotsToEmpty(): void {
  //   const emptySlots = this.generateEmptySlots(this.totalSlotsFront + this.totalSlotsRear);
  //   (this.data.elements[0] as EnclosureElementsGroup).elements = emptySlots;
  // }
}
