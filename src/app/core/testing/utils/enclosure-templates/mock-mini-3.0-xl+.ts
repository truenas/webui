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

export class MockMini30Xl extends MockEnclosure {
  readonly totalSlotsFront: number = 9;
  readonly totalSlotsRear: number = 0;
  readonly totalSlotsInternal: number = 0;
  readonly model: string = 'TRUENAS-MINI-3.0-XL+';

  // TODO: Replace with actual output from a real machine
  data: EnclosureUi = {
    name: 'iX 4024Sp e001',
    model: this.model,
    controller: true,
    dmi: 'TRUENAS-MINI-3.0-XL+',
    status: [
      'OK',
    ],
    id: '5b0bd6d1a309b57f',
    vendor: 'iX',
    product: '4024Sp',
    revision: 'e001',
    bsg: '/dev/bsg/17:0:19:0',
    sg: '/dev/sg433',
    pci: '17:0:19:0',
    rackmount: false,
    top_loaded: false,
    front_slots: 9,
    rear_slots: 0,
    internal_slots: 0,
    elements: {
      'Array Device Slot': {
        1: {
          ...mockDiskDetail,
          descriptor: 'slot00',
          status: 'OK',
          dev: 'sda',
          pool_info: null,
          name: 'sda',
        },
        2: {
          ...mockDiskDetail,
          descriptor: 'slot01',
          status: 'OK',
          dev: 'sdb',
          pool_info: null,
          name: 'sdb',
        },
        3: {
          ...mockDiskDetail,
          descriptor: 'slot02',
          status: 'OK',
          dev: 'sdc',
          pool_info: null,
          name: 'sdc',
        },
        4: {
          ...mockDiskDetail,
          descriptor: 'slot03',
          status: 'OK',
          dev: 'sdd',
          pool_info: null,
          name: 'sdd',
        },
        5: {
          ...mockDiskDetail,
          descriptor: 'slot04',
          status: 'OK',
          dev: 'sde',
          pool_info: null,
          name: 'sde',
        },
        6: {
          ...mockDiskDetail,
          descriptor: 'slot05',
          status: 'OK',
          dev: 'sdf',
          pool_info: null,
          name: 'sdf',
        },
        7: {
          ...mockDiskDetail,
          descriptor: 'slot06',
          status: 'OK',
          dev: 'sdg',
          pool_info: null,
          name: 'sdg',
        },
        8: {
          ...mockDiskDetail,
          descriptor: 'slot07',
          status: 'OK',
          dev: 'sdh',
          pool_info: null,
          name: 'sdh',
        },
        9: {
          ...mockDiskDetail,
          descriptor: 'slot08',
          status: 'OK',
          dev: 'sdi',
          pool_info: null,
          name: 'sdi',
        },
      },
    },
    label: 'MINI-XL+',
  } as EnclosureUi;

  constructor(number: number) {
    super(number);
    this.enclosureNumber = number;
    this.enclosureInit();
  }
}
