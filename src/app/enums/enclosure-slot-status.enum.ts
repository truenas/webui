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

export type EnclosureSlotTopologyStatus = TopologyItemStatus | EnclosureSlotDiskStatus;
