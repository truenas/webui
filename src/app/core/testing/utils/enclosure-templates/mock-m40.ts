import { Enclosure } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockM40 extends MockEnclosure {
  readonly totalSlotsFront: number = 24;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;

  data = {
    id: '5b0bd6d1a308097f',
    name: 'iX 4024Ss e001',
    model: 'M Series',
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
        has_slot_status: true,
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
    label: 'iX 4024Ss e001',
  } as Enclosure;

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.enclosureInit();
  }
}
