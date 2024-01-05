import { TopologyItemStatus } from './vdev-status.enum';

export enum EnclosureSlotStatus {
  Clear = 'CLEAR',
  Fault = 'FAULT',
  Identify = 'IDENTIFY',
}

export enum EnclosureSlotDiskStatus {
  Available = 'AVAILABLE',
  Fault = 'FAULT',
}

// TODO: Find out what all element name possibilities are to complete the enum
export enum EnclosureElementName {
  ArrayDeviceSlot = 'Array Device Slot',
  Expander = 'SAS Expander',
}

export type EnclosureSlotTopologyStatus = TopologyItemStatus | EnclosureSlotDiskStatus;
