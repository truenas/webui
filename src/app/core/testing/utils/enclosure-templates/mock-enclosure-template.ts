import { UUID } from 'angular2-uuid';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import {
  EnclosureUi,
  EnclosureUiSlot,
} from 'app/interfaces/enclosure.interface';

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

export class MockEnclosure {
  readonly enclosureId = UUID.UUID();
  data: EnclosureUi = {
    name: 'iX 4024Sp e001',
    model: 'BASE-CLASS',
    controller: true,
    dmi: 'TRUENAS-Z20-HA',
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
      'Array Device Slot': {},
      'SAS Expander': {
        26: {
          descriptor: 'SAS3 Expander',
          status: 'OK',
          value: null as unknown as string,
          value_raw: 16777216,
        },
      },
      Enclosure: {
        28: {
          descriptor: 'Encl-BpP',
          status: 'OK, Swapped',
          value: null as unknown as string,
          value_raw: 285212672,
        },
        29: {
          descriptor: 'Encl-PeerS',
          status: 'OK',
          value: null as unknown as string,
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
    ...mockDiskDetail,
    descriptor: 'SLOT 000,3FHY4B1T',
    status: 'OK',
    dev: 'sda',
    pool_info: null,
    name: 'sda',
  };

   readonly emptySlotTemplate: EnclosureUiSlot = {
     ...mockDiskDetail,
     descriptor: 'SLOT 000,3FHY4B1T',
     status: 'OK',
     dev: 'sda',
     pool_info: null,
     name: 'sda',
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
      ...mockDiskDetail,
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
    const slot: [string, EnclosureUiSlot] | undefined = this.getSlots()
      .find((keyValue: [string, EnclosureUiSlot]) => keyValue[1].dev === diskName);
    return slot ? parseInt(slot[0]) : null;
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
