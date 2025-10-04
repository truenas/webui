import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum ImageOs {
  Linux = 'Linux',
  FreeBsd = 'FreeBSD',
  Windows = 'Windows',
}

export type AllowedImageOs = ImageOs | string | null;

export const imageOsLabels = new Map<ImageOs, string>([
  [ImageOs.Linux, 'Linux'],
  [ImageOs.FreeBsd, 'FreeBSD'],
  [ImageOs.Windows, 'Windows'],
]);

export enum VirtualizationType {
  Container = 'CONTAINER',
  Vm = 'VM',
}

export const virtualizationTypeLabels = new Map<VirtualizationType, string>([
  [VirtualizationType.Container, T('Container')],
  [VirtualizationType.Vm, T('VM')],
]);

export enum DiskIoBus {
  Nvme = 'NVME',
  VirtioBlk = 'VIRTIO-BLK',
  VirtioScsi = 'VIRTIO-SCSI',
}

export const diskIoBusLabels = new Map<DiskIoBus, string>([
  [DiskIoBus.Nvme, 'NVMe'],
  [DiskIoBus.VirtioBlk, 'Virtio-BLK'],
  [DiskIoBus.VirtioScsi, 'Virtio-SCSI'],
]);

export enum VirtualizationStatus {
  Running = 'RUNNING',
  Stopped = 'STOPPED',
  Unknown = 'UNKNOWN',
}

export const virtualizationStatusLabels = new Map<VirtualizationStatus, string>([
  [VirtualizationStatus.Running, T('Running')],
  [VirtualizationStatus.Stopped, T('Stopped')],
  [VirtualizationStatus.Unknown, T('Unknown')],
]);

export enum VirtualizationRemote {
  LinuxContainers = 'LINUX_CONTAINERS',
}

export enum VirtualizationDeviceType {
  Usb = 'USB',
  Tpm = 'TPM',
  Disk = 'DISK',
  Pci = 'PCI',
  Gpu = 'GPU',
  Nic = 'NIC',
  Proxy = 'PROXY',
}

export const virtualizationDeviceTypeLabels = new Map<VirtualizationDeviceType, string>([
  [VirtualizationDeviceType.Usb, 'USB'],
  [VirtualizationDeviceType.Tpm, 'TPM'],
  [VirtualizationDeviceType.Pci, 'PCI'],
  [VirtualizationDeviceType.Disk, T('Disk')],
  [VirtualizationDeviceType.Gpu, T('GPU')],
  [VirtualizationDeviceType.Nic, T('NIC')],
  [VirtualizationDeviceType.Proxy, T('Proxy')],
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

export const virtualizationProxyProtocolLabels = new Map<VirtualizationProxyProtocol, string>([
  [VirtualizationProxyProtocol.Udp, 'UDP'],
  [VirtualizationProxyProtocol.Tcp, 'TCP'],
]);

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

export enum VirtualizationNicType {
  Bridged = 'BRIDGED',
  Macvlan = 'MACVLAN',
}

export const virtualizationNicTypeLabels = new Map<VirtualizationNicType, string>([
  [VirtualizationNicType.Bridged, T('Bridged Adaptors')],
  [VirtualizationNicType.Macvlan, T('Macvlan')],
]);

export enum VirtualizationSource {
  Image = 'IMAGE',
  Zvol = 'ZVOL',
  Iso = 'ISO',
  Volume = 'VOLUME',
}

export enum VolumeContentType {
  Block = 'BLOCK',
  Iso = 'ISO',
}

export enum ContainerTime {
  Local = 'LOCAL',
  Utc = 'UTC',
}

export const containerTimeLabels = new Map<ContainerTime, string>([
  [ContainerTime.Local, T('Local')],
  [ContainerTime.Utc, T('UTC')],
]);

export enum ContainerCapabilitiesPolicy {
  Default = 'DEFAULT',
  Allow = 'ALLOW',
  Deny = 'DENY',
}

export const containerCapabilitiesPolicyLabels = new Map<ContainerCapabilitiesPolicy, string>([
  [ContainerCapabilitiesPolicy.Default, T('Default (keep default behavior)')],
  [ContainerCapabilitiesPolicy.Allow, T('Allow (drop all capabilities)')],
  [ContainerCapabilitiesPolicy.Deny, T('Deny (keep all capabilities)')],
]);
