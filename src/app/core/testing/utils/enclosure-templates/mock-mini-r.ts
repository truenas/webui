import { Enclosure, EnclosureElement } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockMiniR extends MockEnclosure {
  readonly totalSlotsFront: number = 12;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;

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
    value_raw: '0x1000000',
    original: {
      enclosure_id: '3000000000000001',
      slot: 1,
    },
  };

  readonly emptySlotTemplate: EnclosureElement = {
    slot: 1,
    data: {
      Descriptor: '',
      Status: 'Not installed',
      Value: 'None',
      Device: '',
    },
    name: 'Array Device Slot',
    descriptor: '',
    status: 'Not installed',
    value: 'None',
    value_raw: '0x1000000',
    original: {
      enclosure_id: '3000000000000001',
      slot: 1,
    },
  };

  data = {
    id: 'mapped_enclosure_0',
    name: 'Drive Bays',
    model: 'TRUENAS-MINI-R',
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

  processSlotTemplate(template: EnclosureElement): EnclosureElement {
    const original = {
      enclosure_id: '0',
      slot: 0,
    };
    if (template.slot > 8) {
      original.slot = template.slot - 5;
      original.enclosure_id = '3000000000000002';
    } else {
      original.slot = template.slot;
      original.enclosure_id = '3000000000000001';
    }

    const element: EnclosureElement = { ...template };
    element.original = original;
    return element;
  }
}
