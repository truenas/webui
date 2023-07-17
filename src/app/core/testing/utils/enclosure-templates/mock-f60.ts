import { Enclosure, EnclosureElement } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockF60 extends MockEnclosure {
  readonly totalSlotsFront: number = 24;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;

  readonly slotTemplate: EnclosureElement = {
    slot: 1,
    data: {
      Descriptor: 'Disk #1',
      Status: 'OK',
      Value: 'None',
      Device: 'nvme12n1',
    },
    name: 'Array Device Slot',
    descriptor: 'Disk #1',
    status: 'OK',
    value: 'None',
    value_raw: '0x1000000',
  };

  readonly emptySlotTemplate: EnclosureElement = {
    slot: 1,
    data: {
      Descriptor: 'Disk #1',
      Status: 'Not installed',
      Value: 'None',
      Device: null,
    },
    name: 'Array Device Slot',
    descriptor: 'Disk #1',
    status: 'Not installed',
    value: 'None',
    value_raw: '0x05000000',
  };

  data = {
    id: 'f60_nvme_enclosure',
    name: 'F60 NVMe Enclosure',
    model: 'F60',
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
    label: 'F60 NVMe Enclosure',
  } as Enclosure;

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.enclosureInit();
  }
}
