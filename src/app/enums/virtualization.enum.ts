import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum VirtualizationType {
  Container = 'CONTAINER',
  Vm = 'VM',
}

export const virtualizationTypeMap = new Map<VirtualizationType, string>([
  [VirtualizationType.Container, T('Container')],
  [VirtualizationType.Vm, T('VM')],
]);

export enum VirtualizationStatus {
  Running = 'RUNNING',
  Stopped = 'STOPPED',
}

export const virtualizationStatusMap = new Map<VirtualizationStatus, string>([
  [VirtualizationStatus.Running, T('Running')],
  [VirtualizationStatus.Stopped, T('Stopped')],
]);

export enum VirtualizationRemote {
  LinuxContainers = 'LINUX_CONTAINERS',
}

export enum VirtualizationDeviceType {
  Usb = 'USB',
  Tpm = 'TPM',
  Disk = 'DISK',
  Gpu = 'GPU',
  Nic = 'NIC',
  Proxy = 'PROXY',
}

export const virtualizationDeviceTypeLabels = new Map<VirtualizationDeviceType, string>([
  [VirtualizationDeviceType.Usb, 'USB'],
  [VirtualizationDeviceType.Tpm, 'TPM'],
  [VirtualizationDeviceType.Disk, T('Disk')],
  [VirtualizationDeviceType.Disk, T('GPU')],
  [VirtualizationDeviceType.Disk, T('NIC')],
  [VirtualizationDeviceType.Disk, T('Proxy')],
]);

export enum VirtualizationGpuType {
  Physical = 'PHYSICAL',
  Mdev = 'MDEV',
  Mig = 'MIG',
  Sriov = 'SRIOV',
}

export enum VirtualizationProxyProtocol {
  Udp = 'UDP',
  Tcp = 'TCP',
}

export enum VirtualizationNetworkType {
  Bridge = 'BRIDGE',
}

export enum VirtualizationGlobalState {
  NoPool = 'NO_POOL',
  Initializing = 'INITIALIZING',
  Locked = 'LOCKED',
  Error = 'ERROR',
  Initialized = 'INITIALIZED',
}
