import { Enclosure, EnclosureElement, EnclosureElementsGroup } from 'app/interfaces/enclosure.interface';

export class MockEnclosure {
  enclosureNumber = 0;
  readonly totalSlotsFront: number = 16;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;
  get totalSlots(): number {
    return this.totalSlotsFront + this.totalSlotsRear + this.totalSlotsInternal;
  }

  data: Enclosure = {
    id: 'abcdefgh12345678',
    name: 'iX 1176Ss e007',
    model: 'Mock',
    controller: true,
    elements: [
      {
        name: 'Array Device Slot',
        descriptor: '',
        header: [
          'Descriptor',
          'Status',
          'Value',
          'Device',
        ],
        elements: [],
        has_slot_status: false,
      },
      {
        name: 'Enclosure',
        descriptor: '',
        header: [
          'Descriptor',
          'Status',
          'Value',
        ],
        elements: [
          {
            slot: 1,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: 'None',
            },
            name: 'Enclosure',
            descriptor: '',
            status: 'OK',
            value: 'None',
            value_raw: '0x1000000',
          },
          {
            slot: 2,
            data: {
              Descriptor: '',
              Status: 'Not installed',
              Value: 'None',
            },
            name: 'Enclosure',
            descriptor: '',
            status: 'Not installed',
            value: 'None',
            value_raw: '0x5000000',
          },
        ],
        has_slot_status: false,
      },
      {
        name: 'SAS Expander',
        descriptor: '',
        header: [
          'Descriptor',
          'Status',
          'Value',
        ],
        elements: [
          {
            slot: 1,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: 'None',
            },
            name: 'SAS Expander',
            descriptor: '',
            status: 'OK',
            value: 'None',
            value_raw: '0x1000000',
          },
        ],
        has_slot_status: false,
      },
      {
        name: 'Temperature Sensor',
        descriptor: '',
        header: [
          'Descriptor',
          'Status',
          'Value',
        ],
        elements: [
          {
            slot: 1,
            data: {
              Descriptor: '',
              Status: 'Unsupported',
              Value: null,
            },
            name: 'Temperature Sensor',
            descriptor: '',
            status: 'Unsupported',
            value: null,
            value_raw: '0x0',
          },
          {
            slot: 2,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: '34C',
            },
            name: 'Temperature Sensor',
            descriptor: '',
            status: 'OK',
            value: '34C',
            value_raw: '0x1003600',
          },
          {
            slot: 3,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: '23C',
            },
            name: 'Temperature Sensor',
            descriptor: '',
            status: 'OK',
            value: '23C',
            value_raw: '0x1002b00',
          },
          {
            slot: 4,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: '25C',
            },
            name: 'Temperature Sensor',
            descriptor: '',
            status: 'OK',
            value: '25C',
            value_raw: '0x1002d00',
          },
        ],
        has_slot_status: false,
      },
      {
        name: 'Voltage Sensor',
        descriptor: '',
        header: [
          'Descriptor',
          'Status',
          'Value',
        ],
        elements: [
          {
            slot: 1,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: '5.04V',
            },
            name: 'Voltage Sensor',
            descriptor: '',
            status: 'OK',
            value: '5.04V',
            value_raw: '0x10001f8',
          },
          {
            slot: 2,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: '12.12V',
            },
            name: 'Voltage Sensor',
            descriptor: '',
            status: 'OK',
            value: '12.12V',
            value_raw: '0x10004bc',
          },
        ],
        has_slot_status: false,
      },
    ],
    number: this.enclosureNumber,
    label: 'iX 1176Ss e007',
  } as Enclosure;

  readonly emptySlotTemplate: EnclosureElement = {
    slot: 0,
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
    fault: false,
    identify: false,
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
    fault: false,
    identify: false,
  };

  constructor(number: number) {
    this.enclosureNumber = number;
    this.resetSlotsToEmpty();
  }

  addDiskToSlot(diskName: string, slotNumber: number): MockEnclosure {
    if (!this.data) return this;

    const slot: EnclosureElement = { ...this.slotTemplate };
    slot.slot = slotNumber;
    slot.data.Device = diskName;
    this.addSlotToData(slot);
    return this;
  }

  protected addSlotToData(slot: EnclosureElement): void {
    const slotElementsGroup: EnclosureElementsGroup = this.data.elements[0] as EnclosureElementsGroup;
    const slotIndex = slotElementsGroup.elements.findIndex((element: EnclosureElement) => element.slot === slot.slot);
    slotElementsGroup.elements.splice(slotIndex, 1, this.processSlotTemplate(slot));
  }

  resetSlotsToEmpty(): void {
    const emptySlots = this.generateEmptySlots();
    (this.data.elements[0] as EnclosureElementsGroup).elements = emptySlots;
  }

  generateEmptySlots(totalSlots: number = this.totalSlotsFront): EnclosureElement[] {
    const emptySlots: EnclosureElement[] = [];
    for (let slotNumber = 1; slotNumber <= totalSlots; slotNumber++) {
      const slot = { ...this.emptySlotTemplate };
      slot.slot = slotNumber;
      emptySlots.push(this.processSlotTemplate(slot));
    }

    return emptySlots;
  }

  protected processSlotTemplate(element: EnclosureElement): EnclosureElement {
    // Subclasses can override this method to deal with whatever unique values
    // particular models may require. eg. minis have the original property
    return element;
  }
}
