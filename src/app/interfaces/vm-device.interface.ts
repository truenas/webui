import { CallParams } from '@truenas/api-client';
import {
  VmDeviceType, VmDiskMode, VmDisplayType, VmNicType,
} from 'app/enums/vm.enum';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

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

export type VmDevice
  = | VmPciPassthroughDevice
    | VmUsbPassthroughDevice
    | VmRawFileDevice
    | VmNicDevice
    | VmDisplayDevice
    | VmDiskDevice
    | VmCdRomDevice;

/** What the device forms send, to `vm.device.create` and `vm.device.update` alike. */
export type VmDeviceUpdate = CallParams<WebUiApiDirectory, 'vm.device.create'>[0];

/**
 * Reads a `vm.device.query` row into the UI's device union. The generated entry spells each
 * attribute's `dtype` and mode as the wire literal where the device pages switch on the UI's
 * enums; it describes the same object.
 */
export function toVmDevice(device: WebUiQueryEntity<'vm.device.query'>): VmDevice {
  return device as VmDevice;
}

export interface VmDeviceDelete {
  zvol: boolean;
  raw_file: boolean;
  force: boolean;
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
  web_port: number | null;
  dtype: VmDeviceType.Display;
}

interface VmCdRomAttributes {
  path: string;
  dtype: VmDeviceType.Cdrom;
}

interface VmRawFileAttributes {
  boot: boolean;
  exists?: boolean;
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

export interface VmDiskAttributes {
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
