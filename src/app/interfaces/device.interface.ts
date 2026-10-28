import { v28_0_0 } from '@truenas/api-client';

export type DeviceAddress = v28_0_0.GPUInfoAddr;

export type PciDevice = v28_0_0.GPUInfoDevice;

export interface Device {
  addr: DeviceAddress;
  available_to_host: boolean;
  description: string;
  devices: PciDevice[];
  vendor: string;
}
