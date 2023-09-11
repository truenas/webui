import { Enclosure, EnclosureElementsGroup } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockR30 extends MockEnclosure {
  /*
  * While 4 of the 16 slots are internal, they are not reported as a separate enclosure element.
  * For this reason we count all slots towards the "front"
  * */
  readonly totalSlotsFront: number = 16;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;

  data = {
    id: 'r30_nvme_enclosure',
    name: 'R30 NVMe Enclosure',
    model: 'R30',
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
    label: 'R30 NVMe Enclosure',
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
