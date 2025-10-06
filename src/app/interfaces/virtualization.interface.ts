import { FormControl, FormGroup } from '@angular/forms';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import {
  DiskIoBus,
  ImageOs,
  VirtualizationDeviceType,
  VirtualizationGpuType,
  VirtualizationNetworkType,
  VirtualizationNicType,
  VirtualizationProxyProtocol,
  VirtualizationRemote,
  VirtualizationStatus,
  VirtualizationType, VolumeContentType,
} from 'app/enums/virtualization.enum';

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
    state: VirtualizationStatus;
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

export type VirtualizationDevice =
  | VirtualizationDisk
  | VirtualizationGpu
  | VirtualizationProxy
  | VirtualizationTpm
  | VirtualizationUsb
  | VirtualizationNic
  | VirtualizationPciDevice;

export interface VirtualizationDisk {
  name: string;
  description: string;
  dev_type: VirtualizationDeviceType.Disk;
  readonly: boolean;
  source: string | null;
  destination: string | null;
  product_id: string;
  io_bus: DiskIoBus;
  boot_priority?: number;
}

export interface VirtualizationPciDevice {
  name: string;
  description: string;
  dev_type: VirtualizationDeviceType.Pci;
  readonly: boolean;
  address: string;
}

export interface VirtualizationGpu {
  name: string;
  description: string;
  readonly: boolean;
  dev_type: VirtualizationDeviceType.Gpu;
  gpu_type: VirtualizationGpuType;
  id: string;
  gid: number;
  uid: number;
  mode: string;
  mdev: string;
  mig_uuid: string;
  pci: string;
  product_id: string;
}

export interface VirtualizationProxy {
  name: string;
  description: string;
  dev_type: VirtualizationDeviceType.Proxy;
  readonly: boolean;
  source_proto: VirtualizationProxyProtocol;
  source_port: number;
  dest_proto: VirtualizationProxyProtocol;
  dest_port: number;
  product_id: string;
}

export interface VirtualizationNic {
  name: string;
  description: string;
  dev_type: VirtualizationDeviceType.Nic;
  nic_type: VirtualizationNicType;
  parent: string;
  readonly: boolean;
  network: string;
  product_id: string;
  mac?: string;
}

export interface VirtualizationTpm {
  name: string;
  description: string;
  dev_type: VirtualizationDeviceType.Tpm;
  readonly: boolean;
  path: string;
  pathrm: string;
  product_id: string;
}

export interface VirtualizationUsb {
  name: string;
  description: string;
  dev_type: VirtualizationDeviceType.Usb;
  readonly: boolean;
  bus: number;
  dev: number;
  product_id: string;
  vendor_id: string;
}

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
  instance_types: VirtualizationType[];
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
}

export interface VirtualizationNetwork {
  type: VirtualizationNetworkType;
  managed: boolean;
  ipv4_address: string;
  ipv4_nat: boolean;
  ipv6_address: string;
  ipv6_nat: boolean;
}

export interface VirtualizationImageParams {
  remote: VirtualizationRemote;
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
