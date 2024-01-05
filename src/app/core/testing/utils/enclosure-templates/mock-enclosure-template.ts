import { UUID } from 'angular2-uuid';
import {
  EnclosureUi,
  EnclosureUiSlot,
} from 'app/interfaces/enclosure.interface';

export class MockEnclosure {
  readonly enclosureId = UUID.UUID();
  data: EnclosureUi = {
    name: 'iX 4024Sp e001',
    model: 'M60',
    controller: true,
    dmi: 'TRUENAS-M60-HA',
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
    rackmount: true,
    top_loaded: false,
    front_slots: 24,
    rear_slots: 4,
    internal_slots: 0,
    elements: {
      'Array Device Slot': {
        1: {
          descriptor: 'slot00',
          status: 'OK',
          dev: 'sdadl',
          pool_info: null,
        },
        2: {
          descriptor: 'slot01',
          status: 'OK',
          dev: 'sdadn',
          pool_info: null,
        },
        3: {
          descriptor: 'slot02',
          status: 'OK',
          dev: 'sdado',
          pool_info: null,
        },
        4: {
          descriptor: 'slot03',
          status: 'OK',
          dev: 'sdadq',
          pool_info: null,
        },
        5: {
          descriptor: 'slot04',
          status: 'OK',
          dev: 'sdads',
          pool_info: null,
        },
        6: {
          descriptor: 'slot05',
          status: 'OK',
          dev: 'sdadw',
          pool_info: null,
        },
        7: {
          descriptor: 'slot06',
          status: 'OK',
          dev: 'sdadx',
          pool_info: null,
        },
        8: {
          descriptor: 'slot07',
          status: 'OK',
          dev: 'sdady',
          pool_info: null,
        },
        9: {
          descriptor: 'slot08',
          status: 'OK',
          dev: 'sdadz',
          pool_info: null,
        },
        10: {
          descriptor: 'slot09',
          status: 'OK',
          dev: 'sdaec',
          pool_info: null,
        },
        11: {
          descriptor: 'slot10',
          status: 'OK',
          dev: 'sdaed',
          pool_info: null,
        },
        12: {
          descriptor: 'slot11',
          status: 'OK',
          dev: 'sdaee',
          pool_info: null,
        },
        13: {
          descriptor: 'slot12',
          status: 'OK',
          dev: 'sdaem',
          pool_info: null,
        },
        14: {
          descriptor: 'slot13',
          status: 'OK',
          dev: 'sdaen',
          pool_info: null,
        },
        15: {
          descriptor: 'slot14',
          status: 'OK',
          dev: 'sdaeo',
          pool_info: null,
        },
        16: {
          descriptor: 'slot15',
          status: 'OK',
          dev: 'sdaep',
          pool_info: null,
        },
        17: {
          descriptor: 'slot16',
          status: 'OK',
          dev: 'sdaeu',
          pool_info: null,
        },
        18: {
          descriptor: 'slot17',
          status: 'OK',
          dev: 'sdaev',
          pool_info: null,
        },
        19: {
          descriptor: 'slot18',
          status: 'OK',
          dev: 'sdaew',
          pool_info: null,
        },
        20: {
          descriptor: 'slot19',
          status: 'Not installed',
          dev: null,
          pool_info: null,
        },
        21: {
          descriptor: 'slot20',
          status: 'Not installed',
          dev: null,
          pool_info: null,
        },
        22: {
          descriptor: 'slot21',
          status: 'Not installed',
          dev: null,
          pool_info: null,
        },
        23: {
          descriptor: 'slot22',
          status: 'Not installed',
          dev: null,
          pool_info: null,
        },
        24: {
          descriptor: 'slot23',
          status: 'Not installed',
          dev: null,
          pool_info: null,
        },
        25: {
          descriptor: 'Disk #1',
          status: 'Not installed',
          dev: null,
          pool_info: null,
        },
        26: {
          descriptor: 'Disk #2',
          status: 'OK',
          dev: 'nvme1n1',
          pool_info: null,
        },
        27: {
          descriptor: 'Disk #3',
          status: 'OK',
          dev: 'nvme2n1',
          pool_info: null,
        },
        28: {
          descriptor: 'Disk #4',
          status: 'OK',
          dev: 'nvme3n1',
          pool_info: null,
        },
      },
      'SAS Expander': {
        26: {
          descriptor: 'SAS3 Expander',
          status: 'OK',
          value: null,
          value_raw: 16777216,
        },
      },
      Enclosure: {
        28: {
          descriptor: 'Encl-BpP',
          status: 'OK, Swapped',
          value: null,
          value_raw: 285212672,
        },
        29: {
          descriptor: 'Encl-PeerS',
          status: 'OK',
          value: null,
          value_raw: 16777216,
        },
      },
      'Temperature Sensors': {
        31: {
          descriptor: 'ExpP-Die',
          status: 'OK',
          value: '37C',
          value_raw: 16791808,
        },
        32: {
          descriptor: 'ExpS-Die',
          status: 'OK',
          value: '37C',
          value_raw: 16791808,
        },
        33: {
          descriptor: 'Sense BP1',
          status: 'OK',
          value: '21C',
          value_raw: 16787712,
        },
        34: {
          descriptor: 'Sense BP2',
          status: 'OK',
          value: '22C',
          value_raw: 16787968,
        },
      },
      'Voltage Sensor': {
        36: {
          descriptor: '5V Sensor',
          status: 'OK',
          value: '5.12V',
          value_raw: 16777728,
        },
        37: {
          descriptor: '12V Sensor',
          status: 'OK',
          value: '12.45V',
          value_raw: 16778461,
        },
      },
    },
    label: 'iX 4024Sp e001',
  } as EnclosureUi;

  readonly slotTemplate: EnclosureUiSlot = {
    descriptor: 'SLOT 000,3FHY4B1T',
    status: 'OK',
    dev: 'sda',
    pool_info: null,
  };

   readonly emptySlotTemplate: EnclosureUiSlot = {
     descriptor: 'SLOT 000,3FHY4B1T',
     status: 'OK',
     dev: 'sda',
     pool_info: null,
   };

  enclosureNumber = 0;
  readonly totalSlotsFront: number = this.data.front_slots;
  readonly totalSlotsRear: number = this.data.rear_slots;
  readonly totalSlotsInternal: number = this.data.internal_slots;
  get totalSlots(): number {
    return this.totalSlotsFront + this.totalSlotsRear + this.totalSlotsInternal;
  }
  constructor(number: number) {
    this.enclosureNumber = number;
    this.enclosureInit();
  }

  addDiskToSlot(diskName: string, slotNumber: number): this {
    if (!this.data) return this;

    /* const element: EnclosureElement = { ...this.slotTemplate };
    const elementData: EnclosureElementData = { ...this.slotTemplate.data };
    elementData.Device = diskName;
    element.slot = slotNumber;
    element.data = elementData;

    this.addSlotToData(element); */

    // NEW
    // const slotKey: string = slotNumber.toString();
    const slotValue: EnclosureUiSlot = {
      descriptor: 'SLOT 000,3FHY4B1T',
      status: 'OK',
      dev: diskName,
      pool_info: null,
    };

    this.data.elements['Array Device Slot'][slotNumber] = slotValue;

    return this;
  }

  addDiskToNextEmptySlot(/* diskName: string */): this {
    /* const emptySlots = this.getEmptySlots().map((element: EnclosureElement) => element.slot);
    if (emptySlots.length === 0) {
      console.warn('No open slots available in enclosure');
    } else {
      this.addDiskToSlot(diskName, emptySlots[0]);
    } */
    return this;
  }

  removeDiskFromSlot(diskName: string, slotNumber: number): this {
    const element: EnclosureUiSlot = { ...this.emptySlotTemplate };
    /*
    element.slot = slotNumber;
    const elementData: EnclosureElementData = { ...this.emptySlotTemplate.data };
    element.data = elementData;
    */
    this.addSlotToData(slotNumber, element);
    return this;
  }

  protected addSlotToData(slotIndex: number, slot: EnclosureUiSlot): void {
    this.data.elements['Array Device Slot'][slotIndex] = slot;
  }

  enclosureInit(): void {
    this.data.number = this.enclosureNumber;
    this.resetSlotsToEmpty();
  }

  resetSlotsToEmpty(): void {
    const emptySlots = this.generateEmptySlots();
    emptySlots.forEach((keyValue: [string, EnclosureUiSlot]) => {
      this.data.elements['Array Device Slot'][parseInt(keyValue[0])] = keyValue[1];
    });
  }

  generateEmptySlots(totalSlots: number = this.totalSlotsFront): [string, EnclosureUiSlot][] {
    const emptySlots: [string, EnclosureUiSlot][] = [];
    for (let slotNumber = 1; slotNumber <= totalSlots; slotNumber++) {
      const slotValue: EnclosureUiSlot = { ...this.emptySlotTemplate };
      const slotKey = slotNumber.toString();
      emptySlots.push(this.processSlotTemplate([slotKey, slotValue]));
    }

    return emptySlots;
  }

  protected processSlotTemplate(element: [string, EnclosureUiSlot]): [string, EnclosureUiSlot] {
    // Subclasses can override this method to deal with whatever unique values
    // particular models may require. eg. minis have the original property
    return element;
  }

  protected getSlots(): [string, EnclosureUiSlot][] {
    // return (this.data.elements[0] as EnclosureElementsGroup).elements;
    return this.asSlotsArray(this.data.elements['Array Device Slot']);
  }

  getSlotByDiskName(diskName: string): number | null {
    const slot: [string, EnclosureUiSlot] = this.getSlots()
      .find((keyValue: [string, EnclosureUiSlot]) => keyValue[1].dev === diskName);
    return parseInt(slot[0]);
  }

  getPopulatedSlots(): [string, EnclosureUiSlot][] {
    return this.getSlots().filter((keyValue: [string, EnclosureUiSlot]) => keyValue[1].status.includes('OK'));
  }

  getEmptySlots(): [string, EnclosureUiSlot][] {
    return this.getSlots().filter((keyValue: [string, EnclosureUiSlot]) => keyValue[1].status === 'Not installed');
  }

  protected asSlotsArray(obj: object): [string, EnclosureUiSlot][] {
    return Object.entries(obj) as [string, EnclosureUiSlot][];
  }
}
