import { FormControl, FormGroup } from '@angular/forms';
import {
  AllowedImageOs,
  ContainerDeviceType,
  ContainerNetworkType,
  ContainerNicDeviceType,
  ContainerRemote,
  ContainerStatus,
  ContainerType,
} from 'app/enums/container.enum';

export type ContainerMetrics = Record<string, ContainerStats>;

export interface ContainerStats {
  cpu: {
    cpu_user_percentage: number;
  };
  mem_usage: {
    mem_usage_ram_mib: number;
  };
  io_full_pressure: {
    io_full_pressure_full_60_percentage: number;
  };
}

export interface Container {
  id: number;
  uuid: string;
  name: string;
  description: string;
  cpuset: string | null;
  autostart: boolean;
  time: string;
  shutdown_timeout: number;
  dataset: string;
  init: string;
  initdir: string | null;
  initenv: Record<string, unknown>;
  inituser: string | null;
  initgroup: string | null;
  idmap: {
    type: string;
  };
  capabilities_policy: string;
  capabilities_state: Record<string, unknown>;
  status: {
    state: ContainerStatus;
    pid: number | null;
    domain_state: string | null;
  };
}

export type CreateContainer = Partial<Omit<Container, 'id' | 'dataset' | 'status' | 'idmap'>> & {
  uuid: string;
  name: string;
  autostart: boolean;
  pool: string;
  image: {
    name: string;
    version: string;
  };
};

export type UpdateContainer = Partial<Pick<Container,
  | 'uuid'
  | 'name'
  | 'description'
  | 'cpuset'
  | 'autostart'
  | 'time'
  | 'shutdown_timeout'
  | 'init'
  | 'initdir'
  | 'initenv'
  | 'inituser'
  | 'initgroup'
  | 'capabilities_policy'
  | 'capabilities_state'
>>;

export interface ContainerFilesystemDevice {
  id?: number;
  dtype: ContainerDeviceType.Filesystem;
  target: string;
  source: string;
}

export interface ContainerNicDevice {
  id?: number;
  dtype: ContainerDeviceType.Nic;
  trust_guest_rx_filters?: boolean; // Only applicable for VIRTIO NICs
  type: ContainerNicDeviceType;
  nic_attach: string | null;
  mac: string | null;
}

export interface ContainerUsbDevice {
  id?: number;
  dtype: ContainerDeviceType.Usb;
  usb: {
    vendor_id: string;
    product_id: string;
  } | null;
  device: string | null;
}

export type ContainerDevice =
  | ContainerFilesystemDevice
  | ContainerUsbDevice
  | ContainerNicDevice;

export interface ContainerImage {
  archs: string[];
  description: string;
  label: string;
  os: AllowedImageOs;
  release: string;
  variant: string;
  instance_types: ContainerType[];
  secureboot: boolean | null;
}

export interface ContainerStopParams {
  force?: boolean;
  force_after_timeout?: boolean;
}

export interface ContainerGlobalConfig {
  bridge: string | null;
  v4_network: string | null;
  v6_network: string | null;
  preferred_pool: string | null;
}

export interface ContainerNetwork {
  type: ContainerNetworkType;
  managed: boolean;
  ipv4_address: string;
  ipv4_nat: boolean;
  ipv6_address: string;
  ipv6_nat: boolean;
}

export interface ContainerImageParams {
  remote: ContainerRemote;
}

export interface ContainerImageRegistryResponse {
  name: string;
  versions: string[];
}

export interface UsbCapability {
  product: string;
  product_id: string;
  vendor: string;
  vendor_id: string;
  bus: string;
  device: string;
}

export interface AvailableUsb {
  capability: UsbCapability;
  available: boolean;
  error: string | null;
  description: string;
}

export type ContainerEnvVariablesFormGroup = FormGroup<{
  name: FormControl<string>;
  value: FormControl<string>;
}>;

export interface ContainerDevicePayload {
  container?: number;
  attributes?: ContainerDevice;
}

export interface ContainerDeviceDelete {
  force?: boolean;
  raw_file?: boolean;
  zvol?: boolean;
}

export interface ContainerDeviceEntry {
  id: number;
  attributes: ContainerDevice;
  container: number;
}
