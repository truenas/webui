import { Enclosure, EnclosureElement, EnclosureElementsGroup } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockR50 extends MockEnclosure {
  readonly totalSlotsFront: number = 48;
  readonly totalSlotsRear: number = 4;
  readonly totalSlotsInternal: number = 0;

  data = {
    id: 'mapped_enclosure_0',
    name: 'Drive Bays',
    model: 'R50BM',
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

  readonly slotTemplate: EnclosureElement = {
    slot: 1,
    data: {
      Descriptor: 'Disk #1',
      Status: 'OK',
      Value: 'None',
      Device: 'sda',
    },
    name: 'Array Device Slot',
    descriptor: 'Disk #1',
    status: 'OK',
    value: 'None',
    value_raw: '0x05000000',
    original: {
      enclosure_id: '5b0bd6d1a30b677f',
      slot: 1,
    },
  };

  readonly emptySlotTemplate: EnclosureElement = {
    slot: 1,
    data: {
      Descriptor: 'Disk #1',
      Status: 'Not Installed',
      Value: 'None',
      Device: '',
    },
    name: 'Array Device Slot',
    descriptor: 'Disk #1',
    status: 'Not Installed',
    value: 'None',
    value_raw: '0x05000000',
    original: {
      enclosure_id: '5b0bd6d1a30b677f',
      slot: 1,
    },
  };

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.enclosureInit();
  }

  resetSlotsToEmpty(): void {
    const emptySlots = this.generateEmptySlots(this.totalSlotsFront + this.totalSlotsRear);
    (this.data.elements[0] as EnclosureElementsGroup).elements = emptySlots;
  }

  processSlotTemplate(template: EnclosureElement): EnclosureElement {
    const original = {
      enclosure_id: '0',
      slot: 0,
    };

    if (template.slot > 24 && template.slot < 49) {
      original.slot = template.slot - 24;
      original.enclosure_id = '5b0bd6d1a30b677f';
    } else if (template.slot < 24) {
      original.slot = template.slot;
      original.enclosure_id = '5b0bd6d1a30b677f';
    } else if (template.slot > 48) {
      original.slot = template.slot;
      original.enclosure_id = 'r50bm_plx_enclosure';
    }

    const element: EnclosureElement = { ...template };
    element.original = original;
    return element;
  }
}
