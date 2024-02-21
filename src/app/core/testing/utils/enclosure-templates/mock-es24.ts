import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { EnclosureUi, EnclosureUiSlot } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

const mockDiskDetail: EnclosureUiSlot = {
  descriptor: 'slot00',
  status: 'OK',
  dev: 'sda',
  pool_info: null,
  name: '',
  size: 1024,
  model: 'model',
  serial: 'serial',
  advpowermgmt: DiskPowerLevel.Disabled,
  togglesmart: false,
  smartoptions: '',
  transfermode: '',
  hddstandby: DiskStandby.Minutes10,
  description: 'description',
  rotationrate: 10,
};

export class MockEs24 extends MockEnclosure {
  readonly totalSlotsFront: number = 24;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;

  // Taken from an M60
  data: EnclosureUi = {
    name: 'iX 4024Sp e001',
    model: 'ES24',
    controller: true,
    dmi: 'TRUENAS-M50-HA',
    status: [
      'OK',
    ],
    id: this.enclosureId,
    vendor: 'iX',
    product: '4024Sp',
    revision: 'e001',
    bsg: '/dev/bsg/17:0:19:0',
    sg: '/dev/sg433',
    pci: '17:0:19:0',
    rackmount: true,
    top_loaded: false,
    front_slots: 24,
    rear_slots: 4,
    internal_slots: 0,
    elements: {
      'Array Device Slot': {
        1: {
          ...mockDiskDetail,
          descriptor: 'slot00',
          status: 'OK',
          dev: 'sdadl',
          pool_info: null,
        },
        2: {
          ...mockDiskDetail,
          descriptor: 'slot01',
          status: 'OK',
          dev: 'sdadn',
          pool_info: null,
        },
        3: {
          ...mockDiskDetail,
          descriptor: 'slot02',
          status: 'OK',
          dev: 'sdado',
          pool_info: null,
        },
        4: {
          ...mockDiskDetail,
          descriptor: 'slot03',
          status: 'OK',
          dev: 'sdadq',
          pool_info: null,
        },
        5: {
          ...mockDiskDetail,
          descriptor: 'slot04',
          status: 'OK',
          dev: 'sdads',
          pool_info: null,
        },
        6: {
          ...mockDiskDetail,
          descriptor: 'slot05',
          status: 'OK',
          dev: 'sdadw',
          pool_info: null,
        },
        7: {
          ...mockDiskDetail,
          descriptor: 'slot06',
          status: 'OK',
          dev: 'sdadx',
          pool_info: null,
        },
        8: {
          ...mockDiskDetail,
          descriptor: 'slot07',
          status: 'OK',
          dev: 'sdady',
          pool_info: null,
        },
        9: {
          ...mockDiskDetail,
          descriptor: 'slot08',
          status: 'OK',
          dev: 'sdadz',
          pool_info: null,
        },
        10: {
          ...mockDiskDetail,
          descriptor: 'slot09',
          status: 'OK',
          dev: 'sdaec',
          pool_info: null,
        },
        11: {
          ...mockDiskDetail,
          descriptor: 'slot10',
          status: 'OK',
          dev: 'sdaed',
          pool_info: null,
        },
        12: {
          ...mockDiskDetail,
          descriptor: 'slot11',
          status: 'OK',
          dev: 'sdaee',
          pool_info: null,
        },
        13: {
          ...mockDiskDetail,
          descriptor: 'slot12',
          status: 'OK',
          dev: 'sdaem',
          pool_info: null,
        },
        14: {
          ...mockDiskDetail,
          descriptor: 'slot13',
          status: 'OK',
          dev: 'sdaen',
          pool_info: null,
        },
        15: {
          ...mockDiskDetail,
          descriptor: 'slot14',
          status: 'OK',
          dev: 'sdaeo',
          pool_info: null,
        },
        16: {
          ...mockDiskDetail,
          descriptor: 'slot15',
          status: 'OK',
          dev: 'sdaep',
          pool_info: null,
        },
        17: {
          ...mockDiskDetail,
          descriptor: 'slot16',
          status: 'OK',
          dev: 'sdaeu',
          pool_info: null,
        },
        18: {
          ...mockDiskDetail,
          descriptor: 'slot17',
          status: 'OK',
          dev: 'sdaev',
          pool_info: null,
        },
        19: {
          ...mockDiskDetail,
          descriptor: 'slot18',
          status: 'OK',
          dev: 'sdaew',
          pool_info: null,
        },
        20: {
          ...mockDiskDetail,
          descriptor: 'slot19',
          status: 'Not installed',
          dev: null,
          pool_info: null,
        },
        21: {
          ...mockDiskDetail,
          descriptor: 'slot20',
          status: 'Not installed',
          dev: null,
          pool_info: null,
        },
        22: {
          ...mockDiskDetail,
          descriptor: 'slot21',
          status: 'Not installed',
          dev: null,
          pool_info: null,
        },
        23: {
          ...mockDiskDetail,
          descriptor: 'slot22',
          status: 'Not installed',
          dev: null,
          pool_info: null,
        },
        24: {
          ...mockDiskDetail,
          descriptor: 'slot23',
          status: 'Not installed',
          dev: null,
          pool_info: null,
        },
      },
      'SAS Expander': {
        26: {
          ...mockDiskDetail,
          descriptor: 'SAS3 Expander',
          status: 'OK',
          value: null,
          value_raw: 16777216,
        },
      },
      Enclosure: {
        28: {
          ...mockDiskDetail,
          descriptor: 'Encl-BpP',
          status: 'OK, Swapped',
          value: null,
          value_raw: 285212672,
        },
        29: {
          ...mockDiskDetail,
          descriptor: 'Encl-PeerS',
          status: 'OK',
          value: null,
          value_raw: 16777216,
        },
      },
      'Temperature Sensors': {
        31: {
          ...mockDiskDetail,
          descriptor: 'ExpP-Die',
          status: 'OK',
          value: '37C',
          value_raw: 16791808,
        },
        32: {
          ...mockDiskDetail,
          descriptor: 'ExpS-Die',
          status: 'OK',
          value: '37C',
          value_raw: 16791808,
        },
        33: {
          ...mockDiskDetail,
          descriptor: 'Sense BP1',
          status: 'OK',
          value: '21C',
          value_raw: 16787712,
        },
        34: {
          ...mockDiskDetail,
          descriptor: 'Sense BP2',
          status: 'OK',
          value: '22C',
          value_raw: 16787968,
        },
      },
      'Voltage Sensor': {
        36: {
          ...mockDiskDetail,
          descriptor: '5V Sensor',
          status: 'OK',
          value: '5.12V',
          value_raw: 16777728,
        },
        37: {
          ...mockDiskDetail,
          descriptor: '12V Sensor',
          status: 'OK',
          value: '12.45V',
          value_raw: 16778461,
        },
      },
    },
    label: 'iX 4024Sp e001',
  } as EnclosureUi;

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.enclosureInit();
  }
}
