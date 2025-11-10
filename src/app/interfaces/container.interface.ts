import { FormControl, FormGroup } from '@angular/forms';
import {
  AllowedImageOs,
  ContainerDeviceType,
  ContainerNetworkType,
  ContainerRemote,
  ContainerStatus,
  ContainerType,
} from 'app/enums/container.enum';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';

export type ContainerMetrics = Record<string, ContainerInstanceMetrics>;

export interface ContainerInstanceMetrics {
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

export interface ContainerInstance {
  id: number;
  uuid: string;
  name: string;
  description: string;
  vcpus: number | null;
  cores: number | null;
  threads: number | null;
  cpuset: string | null;
  memory: number | null;
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

export interface VirtualizationAlias {
  type: NetworkInterfaceAliasType;
  address: string;
  netmask: string;
}

export type CreateContainerInstance = Partial<Omit<ContainerInstance, 'id' | 'dataset' | 'status' | 'idmap'>> & {
  uuid: string;
  name: string;
  autostart: boolean;
  pool: string;
  image: {
    name: string;
    version: string;
  };
  usb_devices?: string[];
};

export type UpdateContainerInstance = Partial<Pick<ContainerInstance,
  | 'uuid'
  | 'name'
  | 'description'
  | 'vcpus'
  | 'cores'
  | 'threads'
  | 'cpuset'
  | 'memory'
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
  dtype: ContainerDeviceType.Filesystem;
  target: string;
  source: string;
}

export interface ContainerNicDevice {
  dtype: ContainerDeviceType.Nic;
  trust_guest_rx_filters: boolean;
  type: 'E1000' | 'VIRTIO';
  nic_attach: string | null;
  mac: string | null;
}

export interface ContainerUsbDevice {
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

export interface VirtualizationImage {
  archs: string[];
  description: string;
  label: string;
  os: AllowedImageOs;
  release: string;
  variant: string;
  instance_types: ContainerType[];
  secureboot: boolean | null;
}

export interface VirtualizationStopParams {
  force?: boolean;
  force_after_timeout?: boolean;
}

export interface ContainerGlobalConfig {
  bridge: string | null;
  v4_network: string | null;
  v6_network: string | null;
  preferred_pool: string | null;
}

export interface VirtualizationNetwork {
  type: ContainerNetworkType;
  managed: boolean;
  ipv4_address: string;
  ipv4_nat: boolean;
  ipv6_address: string;
  ipv6_nat: boolean;
}

export interface VirtualizationImageParams {
  remote: ContainerRemote;
}

export interface ContainerImageRegistryResponse {
  name: string;
  versions: string[];
}

export interface AvailableGpu {
  bus: number;
  slot: number;
  description: string;
  vendor: string | null;
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface AvailableGpus {
  [pci: string]: AvailableGpu;
}

export interface AvailableUsb {
  vendor_id: string;
  product_id: string;
  bus: number;
  dev: number;
  product: string;
  manufacturer: string;
}

export type InstanceEnvVariablesFormGroup = FormGroup<{
  name: FormControl<string>;
  value: FormControl<string>;
}>;

export interface VirtualizationImportIsoParams {
  name: string;
  iso_location?: string | null;
  upload_iso?: boolean;
  storage_pool: string | null;
}

export type VirtualizationPciChoices = Record<string, VirtualizationPciDeviceOption>;

export interface VirtualizationPciDeviceOption {
  capability: VirtualizationPciDeviceCapability;
  controller_type: string | null;
  critical: boolean;
  iommu_group: unknown;
  drivers: string[];
  error: string;
  device_path: string;
  reset_mechanism_defined: boolean;
  description: string;
}

export interface VirtualizationPciDeviceCapability {
  class: string;
  domain: string;
  bus: string;
  slot: string;
  function: string;
  product: string;
  vendor: string;
}

export interface ContainerDeviceCreate {
  container: number;
  attributes: ContainerDevice;
  order?: number;
}

export interface ContainerDeviceUpdate {
  attributes?: ContainerDevice;
  container?: string;
  order?: number;
}

export interface ContainerDeviceDelete {
  force?: boolean;
  raw_file?: boolean;
  zvol?: boolean;
}

export interface ContainerDeviceEntry {
  id: number;
  attributes: ContainerDevice;
  container: string;
  order: number;
}

export type ContainerDeviceWithId = ContainerDevice & { id: number };
