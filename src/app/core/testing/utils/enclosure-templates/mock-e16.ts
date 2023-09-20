import { Enclosure } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockE16 extends MockEnclosure {
  readonly totalSlotsFront: number = 24;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;

  data = {
    'id': '5b0bd6d0a101f47f',
    'name': 'ECStream 3U16+4R-4X6G.3P d10c',
    'model': 'E16',
    'controller': false,
    'elements': [
      {
        'name': 'Array Device Slot',
        'descriptor': '',
        'header': [
          'Descriptor',
          'Status',
          'Value',
          'Device',
        ],
        'elements': [],
        'has_slot_status': true,
      },
      {
        'name': 'Cooling',
        'descriptor': '',
        'header': [
          'Descriptor',
          'Status',
          'Value',
        ],
        'elements': [
          {
            'slot': 1,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '5510 RPM',
            },
            'name': 'Cooling',
            'descriptor': '',
            'status': 'OK',
            'value': '5510 RPM',
            'value_raw': '0x1022787',
          },
          {
            'slot': 2,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '5000 RPM',
            },
            'name': 'Cooling',
            'descriptor': '',
            'status': 'OK',
            'value': '5000 RPM',
            'value_raw': '0x101f486',
          },
          {
            'slot': 3,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '5610 RPM',
            },
            'name': 'Cooling',
            'descriptor': '',
            'status': 'OK',
            'value': '5610 RPM',
            'value_raw': '0x1023187',
          },
          {
            'slot': 4,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '4950 RPM',
            },
            'name': 'Cooling',
            'descriptor': '',
            'status': 'OK',
            'value': '4950 RPM',
            'value_raw': '0x101ef85',
          },
        ],
        'has_slot_status': false,
      },
      {
        'name': 'Enclosure',
        'descriptor': '',
        'header': [
          'Descriptor',
          'Status',
          'Value',
        ],
        'elements': [
          {
            'slot': 1,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': 'None',
            },
            'name': 'Enclosure',
            'descriptor': '',
            'status': 'OK',
            'value': 'None',
            'value_raw': '0x1000000',
          },
        ],
        'has_slot_status': false,
      },
      {
        'name': 'Power Supply',
        'descriptor': '',
        'header': [
          'Descriptor',
          'Status',
          'Value',
        ],
        'elements': [
          {
            'slot': 1,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': 'None',
            },
            'name': 'Power Supply',
            'descriptor': '',
            'status': 'OK',
            'value': 'None',
            'value_raw': '0x10000a0',
          },
        ],
        'has_slot_status': false,
      },
      {
        'name': 'SAS Expander',
        'descriptor': '',
        'header': [
          'Descriptor',
          'Status',
          'Value',
        ],
        'elements': [
          {
            'slot': 1,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': 'None',
            },
            'name': 'SAS Expander',
            'descriptor': '',
            'status': 'OK',
            'value': 'None',
            'value_raw': '0x1000000',
          },
        ],
        'has_slot_status': false,
      },
      {
        'name': 'Temperature Sensor',
        'descriptor': '',
        'header': [
          'Descriptor',
          'Status',
          'Value',
        ],
        'elements': [
          {
            'slot': 1,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '31C',
            },
            'name': 'Temperature Sensor',
            'descriptor': '',
            'status': 'OK',
            'value': '31C',
            'value_raw': '0x1003300',
          },
          {
            'slot': 2,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '16C',
            },
            'name': 'Temperature Sensor',
            'descriptor': '',
            'status': 'OK',
            'value': '16C',
            'value_raw': '0x1002400',
          },
          {
            'slot': 3,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '39C',
            },
            'name': 'Temperature Sensor',
            'descriptor': '',
            'status': 'OK',
            'value': '39C',
            'value_raw': '0x1003b00',
          },
        ],
        'has_slot_status': false,
      },
      {
        'name': 'Voltage Sensor',
        'descriptor': '',
        'header': [
          'Descriptor',
          'Status',
          'Value',
        ],
        'elements': [
          {
            'slot': 1,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '1.77V',
            },
            'name': 'Voltage Sensor',
            'descriptor': '',
            'status': 'OK',
            'value': '1.77V',
            'value_raw': '0x10000b1',
          },
          {
            'slot': 2,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '0.98V',
            },
            'name': 'Voltage Sensor',
            'descriptor': '',
            'status': 'OK',
            'value': '0.98V',
            'value_raw': '0x1000062',
          },
          {
            'slot': 3,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '3.27V',
            },
            'name': 'Voltage Sensor',
            'descriptor': '',
            'status': 'OK',
            'value': '3.27V',
            'value_raw': '0x1000147',
          },
          {
            'slot': 4,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '3.35V',
            },
            'name': 'Voltage Sensor',
            'descriptor': '',
            'status': 'OK',
            'value': '3.35V',
            'value_raw': '0x100014f',
          },
          {
            'slot': 5,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '12.04V',
            },
            'name': 'Voltage Sensor',
            'descriptor': '',
            'status': 'OK',
            'value': '12.04V',
            'value_raw': '0x10004b4',
          },
        ],
        'has_slot_status': false,
      },
    ],
    'number': 1,
    'label': 'ECStream 3U16+4R-4X6G.3P d10c',
  } as Enclosure;

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.enclosureInit();
  }
}
