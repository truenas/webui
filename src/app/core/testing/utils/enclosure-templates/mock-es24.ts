import { Enclosure } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockEs24 extends MockEnclosure {
  readonly totalSlotsFront: number = 24;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;

  data = {
    id: '5b0bd6d1a307dfbf',
    name: 'iX 4024Js e001',
    model: 'ES24',
    controller: false,
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
        has_slot_status: true,
      },
      {
        name: 'Cooling',
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
              Value: '4560 RPM',
            },
            name: 'Cooling',
            descriptor: '',
            status: 'OK',
            value: '4560 RPM',
            value_raw: '0x101c804',
          },
          {
            slot: 2,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: '4590 RPM',
            },
            name: 'Cooling',
            descriptor: '',
            status: 'OK',
            value: '4590 RPM',
            value_raw: '0x101cb04',
          },
          {
            slot: 3,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: '5130 RPM',
            },
            name: 'Cooling',
            descriptor: '',
            status: 'OK',
            value: '5130 RPM',
            value_raw: '0x1020104',
          },
          {
            slot: 4,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: '5010 RPM',
            },
            name: 'Cooling',
            descriptor: '',
            status: 'OK',
            value: '5010 RPM',
            value_raw: '0x101f503',
          },
        ],
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
        name: 'Power Supply',
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
            name: 'Power Supply',
            descriptor: '',
            status: 'OK',
            value: 'None',
            value_raw: '0x1400080',
          },
          {
            slot: 2,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: 'None',
            },
            name: 'Power Supply',
            descriptor: '',
            status: 'OK',
            value: 'None',
            value_raw: '0x11400080',
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
              Value: '39C',
            },
            name: 'Temperature Sensor',
            descriptor: '',
            status: 'OK',
            value: '39C',
            value_raw: '0x1003b00',
          },
          {
            slot: 3,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: '22C',
            },
            name: 'Temperature Sensor',
            descriptor: '',
            status: 'OK',
            value: '22C',
            value_raw: '0x1002a00',
          },
          {
            slot: 4,
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
              Value: '5.06V',
            },
            name: 'Voltage Sensor',
            descriptor: '',
            status: 'OK',
            value: '5.06V',
            value_raw: '0x10001fa',
          },
          {
            slot: 2,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: '12.16V',
            },
            name: 'Voltage Sensor',
            descriptor: '',
            status: 'OK',
            value: '12.16V',
            value_raw: '0x10004c0',
          },
        ],
        has_slot_status: false,
      },
    ],
    number: 0,
    label: 'iX 4024Js e001',
  } as Enclosure;

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.enclosureInit();
  }
}
