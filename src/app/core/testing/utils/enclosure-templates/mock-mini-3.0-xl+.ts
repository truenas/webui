import { EnclosureUi } from 'app/interfaces/enclosure.interface';
import { MockEnclosure } from './mock-enclosure-template';

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
          descriptor: 'slot00',
          status: 'OK',
          dev: 'sda',
          pool_info: null,
        },
        2: {
          descriptor: 'slot01',
          status: 'OK',
          dev: 'sdb',
          pool_info: null,
        },
        3: {
          descriptor: 'slot02',
          status: 'OK',
          dev: 'sdc',
          pool_info: null,
        },
        4: {
          descriptor: 'slot03',
          status: 'OK',
          dev: 'sdd',
          pool_info: null,
        },
        5: {
          descriptor: 'slot04',
          status: 'OK',
          dev: 'sde',
          pool_info: null,
        },
        6: {
          descriptor: 'slot05',
          status: 'OK',
          dev: 'sdf',
          pool_info: null,
        },
        7: {
          descriptor: 'slot06',
          status: 'OK',
          dev: 'sdg',
          pool_info: null,
        },
        8: {
          descriptor: 'slot07',
          status: 'OK',
          dev: 'sdh',
          pool_info: null,
        },
        9: {
          descriptor: 'slot08',
          status: 'OK',
          dev: 'sdi',
          pool_info: null,
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
