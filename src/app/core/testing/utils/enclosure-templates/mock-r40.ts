import { Enclosure, EnclosureElement } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockR40 extends MockEnclosure {
  readonly totalSlotsFront: number = 48;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;

  data = {
    id: 'mapped_enclosure_0',
    name: 'Drive Bays',
    model: 'R40',
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
      Device: 'sde',
    },
    name: 'Array Device Slot',
    descriptor: 'Disk #1',
    status: 'OK',
    value: 'None',
    value_raw: '0x11000000',
    original: {
      enclosure_id: '5b0bd6d1a3083c3f',
      slot: 1,
    },
  };

  readonly emptySlotTemplate: EnclosureElement = {
    slot: 1,
    data: {
      Descriptor: 'Disk #1',
      Status: 'Not installed',
      Value: 'None',
      Device: '',
    },
    name: 'Array Device Slot',
    descriptor: 'Disk #1',
    status: 'Not installed',
    value: 'None',
    value_raw: '0x11000000',
    original: {
      enclosure_id: '5b0bd6d1a3083c3f',
      slot: 1,
    },
  };

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
    if (template.slot > 24) {
      original.slot = template.slot - 24;
      original.enclosure_id = '5b0bd6d1a3083d3f';
    } else {
      original.slot = template.slot;
      original.enclosure_id = '5b0bd6d1a3083c3f';
    }

    const element: EnclosureElement = { ...template };
    element.original = original;
    return element;
  }
}
