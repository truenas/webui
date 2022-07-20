import { VDev } from 'app/interfaces/storage.interface';

export interface VDevGroup {
  disk: string;
  guid: string;
  children: VDev[];
}

export type DeviceNestedDataNode = VDev | VDevGroup;

export function isVDev(obj: DeviceNestedDataNode): obj is VDev {
  return 'stats' in obj;
}
