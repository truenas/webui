import {
  Enclosure,
  EnclosureElement,
} from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockMini30Eplus extends MockEnclosure {
  readonly totalSlotsFront: number = 6;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;

  readonly emptySlotTemplate: EnclosureElement = {
    slot: 2,
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
    value_raw: '0x5000000',
    original: {
      enclosure_id: '3000000000000001',
      slot: 1,
    },
  };

  readonly slotTemplate: EnclosureElement = {
    slot: 1,
    data: {
      Descriptor: 'Disk #1',
      Status: 'OK',
      Value: 'None',
      Device: 'sdg',
    },
    name: 'Array Device Slot',
    descriptor: 'Disk #1',
    status: 'OK',
    value: 'None',
    value_raw: '0x1000000',
    original: {
      enclosure_id: '3000000000000001',
      slot: 6,
    },
  };

  data = {
    'id': 'mapped_enclosure_0',
    'name': 'Drive Bays',
    'model': 'FREENAS-MINI-3.0-E+',
    'controller': true,
    'elements': [
      {
        'name': 'Array Device Slot',
        'descriptor': 'Drive Slots',
        'header': [
          'Descriptor',
          'Status',
          'Value',
          'Device',
        ],
        'elements': [],
        'has_slot_status': false,
      },
    ],
    'number': 0,
    'label': 'Drive Bays',
  } as Enclosure;

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.enclosureInit();
  }

  processSlotTemplate(template: EnclosureElement): EnclosureElement {
    const updatedTemplate = { ...template };
    const original = { ...template.original };
    if (template.slot > 4) {
      original.slot = template.slot - 4;
    } else {
      original.slot = template.slot;
    }
    updatedTemplate.original = original;
    return updatedTemplate;
  }
}
