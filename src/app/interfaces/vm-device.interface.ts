import { VmDeviceType } from 'app/enums/vm.enum';

interface VmPciPassthroughAttributes {
  pptdev: string;
  type: string;
}

export interface VmDisplayAttributes {
  bind: string;
  password: string;
  password_configured?: false;
  port: number;
  resolution: string;
  type: string;
  wait: boolean;
  web: boolean;
}

export interface VmCdRomAttributes {
  path: string;
}

export interface VmRawFileAttributes {
  boot: boolean;
  logical_sectorsize: number;
  path: string;
  physical_sectorsize: number;
  size: number;
  type: string;
}

export interface VmNicAttributes {
  mac: string;
  nic_attach: string;
  type: string;
}

export interface VmDiskAttributes {
  logical_sectorsize: number;
  path: string;
  physical_sectorsize: number;
  type: string;
}

export interface BaseVmDevice {
  id: number;
  dtype: VmDeviceType;
  attributes: unknown;
  order: number;
  vm: number;
}

export interface VmPciPassthroughDevice extends BaseVmDevice {
  dtype: VmDeviceType.Pci;
  attributes: VmPciPassthroughAttributes;
}

export interface VmRawFileDevice extends BaseVmDevice {
  dtype: VmDeviceType.Raw;
  attributes: VmRawFileAttributes;
}

export interface VmNicDevice extends BaseVmDevice {
  dtype: VmDeviceType.Nic;
  attributes: VmNicAttributes;
}

export interface VmDisplayDevice extends BaseVmDevice {
  dtype: VmDeviceType.Display;
  attributes: VmDisplayAttributes;
}

export interface VmCdRomDevice extends BaseVmDevice {
  dtype: VmDeviceType.Cdrom;
  attributes: VmCdRomAttributes;
}

export interface VmDiskDevice extends BaseVmDevice {
  dtype: VmDeviceType.Disk;
  attributes: VmDiskAttributes;
}

export type VmDevice =
  | VmPciPassthroughDevice
  | VmRawFileDevice
  | VmNicDevice
  | VmDisplayDevice
  | VmDiskDevice
  | VmCdRomDevice;
