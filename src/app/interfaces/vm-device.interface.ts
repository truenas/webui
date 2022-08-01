import { Overwrite } from 'utility-types';
import {
  VmDeviceType, VmDiskMode, VmDisplayType, VmNicType,
} from 'app/enums/vm.enum';

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
  type: VmDisplayType;
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
  type: VmDiskMode;
}

export interface VmNicAttributes {
  mac: string;
  nic_attach: string;
  type: VmNicType;
  trust_guest_rx_filters: boolean;
}

export interface VmDiskAttributes {
  logical_sectorsize: number;
  path: string;
  physical_sectorsize: number;
  type: VmDiskMode;
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

export type VmDeviceUpdate = Overwrite<Partial<Omit<VmDevice, 'id'>>, {
  attributes?: Partial<VmDevice['attributes']>;
}>;

export interface VmDeviceDelete {
  zvol: boolean;
  raw_file: boolean;
  force: boolean;
}

export interface VmPassthroughDeviceChoice {
  capability: {
    class: string;
    domain: string;
    bus: string;
    slot: string;
    function: string;
    product: string;
    vendor: string;
  };
  iommu_group: {
    number: number;
    addresses: {
      domain: string;
      bus: string;
      slot: string;
      function: string;
    }[];
  };
  device_path: string;
  drivers: string[];
  available: boolean;
  error: unknown;
  reset_mechanism_defined: boolean;
}
