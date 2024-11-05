import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import {
  VirtualizationDeviceType,
  VirtualizationGlobalState,
  VirtualizationGpuType,
  VirtualizationNetworkType,
  VirtualizationProxyProtocol,
  VirtualizationRemote,
  VirtualizationStatus,
  VirtualizationType,
} from 'app/enums/virtualization.enum';

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
  environment?: Record<string, string>;
  autostart?: boolean;
  cpu: string;
  memory: number;
  devices: VirtualizationDevice[];
}

export interface UpdateVirtualizationInstance {
  environment?: Record<string, string>;
  autostart?: boolean;
  cpu?: string;
  memory?: number;
}

export type VirtualizationDevice =
  | VirtualizationDisk
  | VirtualizationGpu
  | VirtualizationProxy
  | VirtualizationTpm
  | VirtualizationUsb
  | VirtualizationNic;

export interface VirtualizationDisk {
  name: string;
  dev_type: VirtualizationDeviceType.Disk;
  readonly: boolean;
  source: string | null;
  destination: string | null;
}

export interface VirtualizationGpu {
  name: string;
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
  productid: string;
  vendorid: string;
}

export interface VirtualizationProxy {
  name: string;
  dev_type: VirtualizationDeviceType.Proxy;
  readonly: boolean;
  source_proto: VirtualizationProxyProtocol;
  source_port: number;
  dest_proto: VirtualizationProxyProtocol;
  dest_port: number;
}

export interface VirtualizationNic {
  name: string;
  dev_type: VirtualizationDeviceType.Nic;
  readonly: boolean;
  network: string;
}

export interface VirtualizationTpm {
  name: string;
  dev_type: VirtualizationDeviceType.Tpm;
  readonly: boolean;
  path: string;
  pathrm: string;
}

export interface VirtualizationUsb {
  name: string;
  dev_type: VirtualizationDeviceType.Usb;
  readonly: boolean;
  bus: number;
  dev: number;
  product_id: string;
  vendor_id: string;
}

export interface VirtualizationImage {
  architecture: string;
  description: string;
  label: string;
  os: string;
  release: string;
  serial: string;
  type: string;
  variant: string;
}

export type VirtualizationStopParams = [
  instanceId: string,
  {
    timeout?: number;
    force?: boolean;
  },
];

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

export interface AvailableUsb {
  vendor_id: string;
  product_id: string;
  bus: number;
  dev: number;
  product: string;
  manufacturer: string;
}
