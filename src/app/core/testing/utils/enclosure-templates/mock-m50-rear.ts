import { Enclosure, EnclosureElement, EnclosureElementsGroup } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockM50Rear extends MockEnclosure {
  readonly totalSlotsFront: number = 0;
  readonly totalSlotsRear: number = 4;
  readonly totalSlotsInternal: number = 0;

  data = {
    id: 'm50_plx_enclosure',
    name: 'Rear NVME U.2 Hotswap Bays',
    model: 'M50 Series',
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
    number: 2,
    label: 'Rear NVME U.2 Hotswap Bays',
  } as Enclosure;

  readonly emptySlotTemplate: EnclosureElement = {
    slot: 0,
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

  readonly slotTemplate: EnclosureElement = {
    slot: 0,
    data: {
      Descriptor: '',
      Status: 'OK',
      Value: 'None',
      Device: 'device name goes here...',
    },
    name: 'Array Device Slot',
    descriptor: '',
    status: 'OK',
    value: 'None',
    value_raw: '0x1000000',
  };

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.data.number = number;
    this.enclosureInit();
  }

  enclosureInit(): void {
    const emptySlots = this.generateEmptySlots(this.totalSlotsRear);
    (this.data.elements[0] as EnclosureElementsGroup).elements = emptySlots;
  }
}
