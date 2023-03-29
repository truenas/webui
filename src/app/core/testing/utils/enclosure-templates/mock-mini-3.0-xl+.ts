import {
  Enclosure,
  EnclosureElement,
} from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockMini30Xl extends MockEnclosure {
  readonly totalSlotsFront: number = 9;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;

  readonly emptySlotTemplate: EnclosureElement = {
    slot: 2,
    data: {
      Descriptor: 'Disk #2',
      Status: 'Not installed',
      Value: 'None',
      Device: '',
    },
    name: 'Array Device Slot',
    descriptor: 'Disk #2',
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
      enclosure_id: '3000000000000002',
      slot: 6,
    },
  };

  data = {
    id: 'mapped_enclosure_0',
    name: 'Drive Bays',
    model: 'FREENAS-MINI-3.0-XL+',
    controller: true,
    elements: [],
    number: this.enclosureNumber,
    label: 'Drive Bays',
  } as Enclosure;

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.resetSlotsToEmpty();
  }

  resetSlotsToEmpty(): void {
    const emptySlots = this.generateEmptySlots();
    (this.data.elements as EnclosureElement[]) = emptySlots;
  }

  protected addSlotToData(slot: EnclosureElement): void {
    const slotElements: EnclosureElement[] = this.data.elements as EnclosureElement[];
    const slotIndex = slotElements.findIndex((element: EnclosureElement) => element.slot === slot.slot);
    slotElements.splice(slotIndex, 1, this.processSlotTemplate(slot));
  }

  processSlotTemplate(template: EnclosureElement): EnclosureElement {
    const original = {
      enclosure_id: '0',
      slot: 0,
    };
    if (template.slot === 1) {
      original.slot = 6;
      original.enclosure_id = '3000000000000002';
    } else if (template.slot === 10) {
      original.slot = 5;
      original.enclosure_id = '3000000000000002';
    } else {
      original.slot = template.slot - 1;
      original.enclosure_id = '3000000000000001';
    }

    template.original = original;
    return template;
  }
}
