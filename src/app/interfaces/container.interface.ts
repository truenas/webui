import { FormControl, FormGroup } from '@angular/forms';
import {
  ContainerDeviceType,
  ContainerGpuType,
  ContainerNetworkType,
  ContainerNicType,
  ContainerProxyProtocol,
  ContainerRemote,
  ContainerStatus,
  ContainerType,
  ImageOs,
  VolumeContentType,
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
  gpu_devices?: string[];
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

export interface ContainerDiskDevice {
  id?: number;
  name: string;
  description: string;
  dev_type: ContainerDeviceType.Disk;
  readonly: boolean;
  source: string | null;
  destination: string | null;
  product_id: string;
}

export interface ContainerGpuDevice {
  id?: number;
  name: string;
  description: string;
  readonly: boolean;
  dev_type: ContainerDeviceType.Gpu;
  gpu_type: ContainerGpuType;
  gid: number;
  uid: number;
  mode: string;
  mdev: string;
  mig_uuid: string;
  pci: string;
  product_id: string;
}

export interface ContainerProxyDevice {
  id?: number;
  name: string;
  description: string;
  dev_type: ContainerDeviceType.Proxy;
  readonly: boolean;
  source_proto: ContainerProxyProtocol;
  source_port: number;
  dest_proto: ContainerProxyProtocol;
  dest_port: number;
  product_id: string;
}

export interface ContainerNicDevice {
  id?: number;
  name: string;
  description: string;
  dev_type: ContainerDeviceType.Nic;
  nic_type: ContainerNicType;
  parent: string;
  readonly: boolean;
  network: string;
  product_id: string;
  mac?: string;
}

export interface ContainerUsbDevice {
  id?: number;
  name: string;
  description: string;
  dev_type: ContainerDeviceType.Usb;
  readonly: boolean;
  bus: number;
  dev: number;
  product_id: string;
  vendor_id: string;
}

export type ContainerDevice =
  | ContainerDiskDevice
  | ContainerGpuDevice
  | ContainerProxyDevice
  | ContainerUsbDevice
  | ContainerNicDevice;

export interface UserNsIdmap {
  uid: IdmapUserNsEntry;
  gid: IdmapUserNsEntry;
}

export interface IdmapUserNsEntry {
  hostid: number;
  maprange: number;
  nsid: number;
}

export interface VirtualizationImage {
  archs: string[];
  description: string;
  label: string;
  os: ImageOs | null | string;
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

export interface VirtualizationVolume {
  id: string;
  name: string;
  content_type: VolumeContentType;
  created_at: string;
  type: string;
  config: {
    size?: number;
  };
  used_by: string[];
  storage_pool: string;
}

export interface VirtualizationImportIsoParams {
  name: string;
  iso_location?: string | null;
  upload_iso?: boolean;
  storage_pool: string | null;
}

export interface CreateVirtualizationVolume {
  name: string;
  content_type?: VolumeContentType;
  size?: number;
}

export type VirtualizationVolumeUpdate = [
  id: string,
  update: {
    size: number;
  },
];

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

export interface ImportZvolParams {
  to_import: ZvolToImport[];
  clone: boolean;
}

export interface ZvolToImport {
  virt_volume_name: string;
  zvol_path: string;
}

export interface ContainerDeviceCreate {
  container: string;
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
