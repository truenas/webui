import { FormControl, FormGroup } from '@angular/forms';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import {
  DiskIoBus,
  VirtualizationDeviceType,
  VirtualizationGlobalState,
  VirtualizationGpuType,
  VirtualizationNetworkType,
  VirtualizationNicType,
  VirtualizationProxyProtocol,
  VirtualizationRemote,
  VirtualizationSource,
  VirtualizationStatus,
  VirtualizationType, VolumeContentType,
} from 'app/enums/virtualization.enum';

export interface VirtualizationInstanceMetrics {
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

export interface VirtualizationInstance {
  id: string;
  name: string;
  type: VirtualizationType;
  status: VirtualizationStatus;
  cpu: string;
  memory: number;
  autostart: boolean;
  environment: Record<string, string>;
  aliases: VirtualizationAlias;
  raw: unknown;
  image: VirtualizationImage;
  vnc_enabled: boolean;
  vnc_port: number | null;
  vnc_password: string | null;
  secure_boot: boolean;
  root_disk_io_bus: DiskIoBus;
  root_disk_size: number | null;
  userns_idmap?: UserNsIdmap;
}

export interface VirtualizationAlias {
  type: NetworkInterfaceAliasType;
  address: string;
  netmask: string;
}

export interface CreateVirtualizationInstance {
  name: string;
  image: string;
  remote: VirtualizationRemote;
  instance_type: VirtualizationType;

  /**
   * Value in GBs.
   */
  root_disk_size?: number;
  root_disk_io_bus?: DiskIoBus;
  source_type?: VirtualizationSource;
  environment?: Record<string, string>;
  autostart?: boolean;
  cpu: string;
  iso_volume?: string;
  /**
   * Value must be greater or equal to 33554432
   */
  memory: number;
  devices: VirtualizationDevice[];
  enable_vnc?: boolean;
  /**
   * Value must be greater or equal to 5900 and lesser or equal to 65535
   */
  vnc_port?: number | null;
  vnc_password?: string | null;
  zvol_path?: string | null;
  secure_boot: boolean;
  volume?: string | null;
}

export interface UpdateVirtualizationInstance {
  environment?: Record<string, string>;
  autostart?: boolean;
  cpu?: string;
  memory?: number;
  enable_vnc?: boolean;
  vnc_port?: number | null;
  secure_boot?: boolean;
  root_disk_io_bus?: DiskIoBus;
  vnc_password?: string | null;
  root_disk_size?: number;
}

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
  os: string;
  release: string;
  variant: string;
  instance_types: VirtualizationType[];
  secureboot: boolean | null;
}

export interface VirtualizationStopParams {
  timeout?: number;
  force?: boolean;
}

export interface VirtualizationGlobalConfigUpdate {
  pool: string;
  bridge?: string | null;
  v4_network?: string | null;
  v6_network?: string | null;
}

export interface VirtualizationGlobalConfig {
  id: number;
  pool: string | null;
  bridge: string | null;
  v4_network: string | null;
  v6_network: string | null;
  dataset: string | null;
  state: VirtualizationGlobalState;
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
  storage_pool: string;
  created_at: string;
  type: string;
  config: {
    size: number;
  };
  used_by: string[];
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
