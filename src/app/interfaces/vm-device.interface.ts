import { Overwrite } from 'utility-types';
import {
  VmDeviceType, VmDiskMode, VmDisplayType, VmNicType,
} from 'app/enums/vm.enum';

export interface BaseVmDevice {
  id: number;
  dtype: VmDeviceType;
  attributes: unknown;
  order: number;
  vm: number;
}

export interface VmPciPassthroughDevice extends BaseVmDevice {
  attributes: VmPciPassthroughAttributes;
}

export interface VmUsbPassthroughDevice extends BaseVmDevice {
  attributes: VmUsbPassthroughAttributes;
}

export interface VmDisplayDevice extends BaseVmDevice {
  attributes: VmDisplayAttributes;
}

export interface VmCdRomDevice extends BaseVmDevice {
  attributes: VmCdRomAttributes;
}

export interface VmRawFileDevice extends BaseVmDevice {
  attributes: VmRawFileAttributes;
}

export interface VmNicDevice extends BaseVmDevice {
  attributes: VmNicAttributes;
}

export interface VmDiskDevice extends BaseVmDevice {
  attributes: VmDiskAttributes;
}

export type VmDevice =
  | VmPciPassthroughDevice
  | VmUsbPassthroughDevice
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
  controller_type?: string;
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
  description: string;
}

export interface VmUsbPassthroughDeviceChoice {
  capability: {
    product: string;
    vendor: string;
    product_id: string;
    vendor_id: string;
    bus: string;
    device: string;
  };
  available: boolean;
  error: unknown;
}

interface VmDisplayAttributes {
  bind: string;
  password: string;
  password_configured?: boolean;
  port: number;
  resolution: string;
  type: VmDisplayType;
  wait: boolean;
  web: boolean;
  dtype: VmDeviceType.Display;
}

interface VmCdRomAttributes {
  path: string;
  dtype: VmDeviceType.Cdrom;
}

interface VmRawFileAttributes {
  boot: boolean;
  logical_sectorsize: number;
  path: string;
  physical_sectorsize: number;
  size: number;
  type: VmDiskMode;
  dtype: VmDeviceType.Raw;
}

interface VmNicAttributes {
  mac: string;
  nic_attach: string;
  type: VmNicType;
  trust_guest_rx_filters: boolean;
  dtype: VmDeviceType.Nic;
}

interface VmDiskAttributes {
  logical_sectorsize: number;
  path: string;
  physical_sectorsize: number;
  type: VmDiskMode;
  dtype: VmDeviceType.Disk;

  create_zvol?: boolean;
  zvol_name?: string;
  zvol_volsize?: number;
}

interface VmPciPassthroughAttributes {
  pptdev: string;
  type: string;
  dtype: VmDeviceType.Pci;
}

interface VmUsbPassthroughAttributes {
  controller_type: string;
  device: string | null;
  usb?: {
    product_id?: string;
    vendor_id?: string;
  };
  dtype: VmDeviceType.Usb;
}
