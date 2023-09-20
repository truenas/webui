import { Enclosure } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

export class MockE24 extends MockEnclosure {
  readonly totalSlotsFront: number = 24;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;

  data = {
    'id': '5b0bd6d1a307dfbf',
    'name': 'iX 4024Js e001',
    'model': 'E24',
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
              'Value': '4230 RPM',
            },
            'name': 'Cooling',
            'descriptor': '',
            'status': 'OK',
            'value': '4230 RPM',
            'value_raw': '0x101a703',
          },
          {
            'slot': 2,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '4260 RPM',
            },
            'name': 'Cooling',
            'descriptor': '',
            'status': 'OK',
            'value': '4260 RPM',
            'value_raw': '0x101aa03',
          },
          {
            'slot': 3,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '4770 RPM',
            },
            'name': 'Cooling',
            'descriptor': '',
            'status': 'OK',
            'value': '4770 RPM',
            'value_raw': '0x101dd03',
          },
          {
            'slot': 4,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '4680 RPM',
            },
            'name': 'Cooling',
            'descriptor': '',
            'status': 'OK',
            'value': '4680 RPM',
            'value_raw': '0x101d402',
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
          {
            'slot': 2,
            'data': {
              'Descriptor': '',
              'Status': 'Not installed',
              'Value': 'None',
            },
            'name': 'Enclosure',
            'descriptor': '',
            'status': 'Not installed',
            'value': 'None',
            'value_raw': '0x5000000',
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
            'value_raw': '0x1400080',
          },
          {
            'slot': 2,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': 'None',
            },
            'name': 'Power Supply',
            'descriptor': '',
            'status': 'OK',
            'value': 'None',
            'value_raw': '0x11400080',
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
              'Status': 'Unsupported',
              'Value': null,
            },
            'name': 'Temperature Sensor',
            'descriptor': '',
            'status': 'Unsupported',
            'value': null,
            'value_raw': '0x0',
          },
          {
            'slot': 2,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '34C',
            },
            'name': 'Temperature Sensor',
            'descriptor': '',
            'status': 'OK',
            'value': '34C',
            'value_raw': '0x1003600',
          },
          {
            'slot': 3,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '17C',
            },
            'name': 'Temperature Sensor',
            'descriptor': '',
            'status': 'OK',
            'value': '17C',
            'value_raw': '0x1002500',
          },
          {
            'slot': 4,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '18C',
            },
            'name': 'Temperature Sensor',
            'descriptor': '',
            'status': 'OK',
            'value': '18C',
            'value_raw': '0x1002600',
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
              'Value': '5.13V',
            },
            'name': 'Voltage Sensor',
            'descriptor': '',
            'status': 'OK',
            'value': '5.13V',
            'value_raw': '0x1000201',
          },
          {
            'slot': 2,
            'data': {
              'Descriptor': '',
              'Status': 'OK',
              'Value': '12.21V',
            },
            'name': 'Voltage Sensor',
            'descriptor': '',
            'status': 'OK',
            'value': '12.21V',
            'value_raw': '0x10004c5',
          },
        ],
        'has_slot_status': false,
      },
    ],
    'number': 1,
    'label': 'iX 4024Js e001',
  } as Enclosure;

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.enclosureInit();
  }
}
