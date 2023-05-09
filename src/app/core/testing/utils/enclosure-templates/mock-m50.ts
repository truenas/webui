import { Enclosure } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockM50 extends MockEnclosure {
  readonly totalSlotsFront: number = 24;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;

  data = {
    id: '5b0bd6d1a309b73f',
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
            value_raw: '0x11000000',
          },
          {
            slot: 2,
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
              Status: 'OK',
              Value: '40C',
            },
            name: 'Temperature Sensor',
            descriptor: '',
            status: 'OK',
            value: '40C',
            value_raw: '0x1003c00',
          },
          {
            slot: 2,
            data: {
              Descriptor: '',
              Status: 'OK',
              Value: '35C',
            },
            name: 'Temperature Sensor',
            descriptor: '',
            status: 'OK',
            value: '35C',
            value_raw: '0x1003700',
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
              Value: '22C',
            },
            name: 'Temperature Sensor',
            descriptor: '',
            status: 'OK',
            value: '22C',
            value_raw: '0x1002a00',
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
              Value: '12.25V',
            },
            name: 'Voltage Sensor',
            descriptor: '',
            status: 'OK',
            value: '12.25V',
            value_raw: '0x10004c9',
          },
        ],
        has_slot_status: false,
      },
    ],
    number: 0,
    label: 'iX 4024Ss e001',
  } as Enclosure;

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.enclosureInit();
  }
}
