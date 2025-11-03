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

export enum ContainerType {
  Container = 'CONTAINER',
}

export const containerTypeLabels = new Map<ContainerType, string>([
  [ContainerType.Container, T('Container')],
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

export enum ContainerStatus {
  Running = 'RUNNING',
  Stopped = 'STOPPED',
  Unknown = 'UNKNOWN',
}

export const containerStatusLabels = new Map<ContainerStatus, string>([
  [ContainerStatus.Running, T('Running')],
  [ContainerStatus.Stopped, T('Stopped')],
  [ContainerStatus.Unknown, T('Unknown')],
]);

export enum ContainerRemote {
  LinuxContainers = 'LINUX_CONTAINERS',
}

export enum ContainerDeviceType {
  Usb = 'USB',
  Tpm = 'TPM',
  Disk = 'DISK',
  Pci = 'PCI',
  Gpu = 'GPU',
  Nic = 'NIC',
  Proxy = 'PROXY',
}

export const containerDeviceTypeLabels = new Map<ContainerDeviceType, string>([
  [ContainerDeviceType.Usb, 'USB'],
  [ContainerDeviceType.Tpm, 'TPM'],
  [ContainerDeviceType.Pci, 'PCI'],
  [ContainerDeviceType.Disk, T('Disk')],
  [ContainerDeviceType.Gpu, T('GPU')],
  [ContainerDeviceType.Nic, T('NIC')],
  [ContainerDeviceType.Proxy, T('Proxy')],
]);

export enum ContainerGpuType {
  Physical = 'PHYSICAL',
  Mdev = 'MDEV',
  Mig = 'MIG',
  Sriov = 'SRIOV',
}

export enum ContainerProxyProtocol {
  Udp = 'UDP',
  Tcp = 'TCP',
}

export const containerProxyProtocolLabels = new Map<ContainerProxyProtocol, string>([
  [ContainerProxyProtocol.Udp, 'UDP'],
  [ContainerProxyProtocol.Tcp, 'TCP'],
]);

export enum ContainerNetworkType {
  Bridge = 'BRIDGE',
}

export enum ContainerGlobalState {
  NoPool = 'NO_POOL',
  Initializing = 'INITIALIZING',
  Locked = 'LOCKED',
  Error = 'ERROR',
  Initialized = 'INITIALIZED',
}

export enum ContainerNicType {
  Bridged = 'BRIDGED',
  Macvlan = 'MACVLAN',
}

export const containerNicTypeLabels = new Map<ContainerNicType, string>([
  [ContainerNicType.Bridged, T('Bridged Adaptors')],
  [ContainerNicType.Macvlan, T('Macvlan')],
]);

export enum ContainerSource {
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
  [ContainerCapabilitiesPolicy.Allow, T('Allow (keep all capabilities)')],
  [ContainerCapabilitiesPolicy.Deny, T('Deny (drop all capabilities)')],
]);
