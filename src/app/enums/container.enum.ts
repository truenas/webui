import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export type AllowedImageOs = string | null;

export enum ContainerType {
  Container = 'CONTAINER',
}

export enum ContainerStatus {
  Running = 'RUNNING',
  Stopped = 'STOPPED',
  Suspended = 'SUSPENDED',
  Unknown = 'UNKNOWN',
}

export const containerStatusLabels = new Map<ContainerStatus, string>([
  [ContainerStatus.Running, T('Running')],
  [ContainerStatus.Stopped, T('Stopped')],
  [ContainerStatus.Suspended, T('Suspended')],
  [ContainerStatus.Unknown, T('Unknown')],
]);

export enum ContainerRemote {
  LinuxContainers = 'LINUX_CONTAINERS',
}

export enum ContainerDeviceType {
  Usb = 'USB',
  Nic = 'NIC',
  Filesystem = 'FILESYSTEM',
  Gpu = 'GPU',
}

export const containerGpuType = {
  Amd: 'AMD',
  Intel: 'INTEL',
  Nvidia: 'NVIDIA',
} as const;

export enum ContainerNicDeviceType {
  E1000 = 'E1000',
  Virtio = 'VIRTIO',
}

export const containerNicDeviceTypeLabels = new Map<ContainerNicDeviceType, string>([
  [ContainerNicDeviceType.E1000, 'Intel e82585 (e1000)'],
  [ContainerNicDeviceType.Virtio, 'VirtIO'],
]);

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
}

export const containerCapabilitiesPolicyLabels = new Map<ContainerCapabilitiesPolicy, string>([
  [ContainerCapabilitiesPolicy.Default, T('Default')],
  [ContainerCapabilitiesPolicy.Allow, T('Allow All')],
]);

export enum ContainerIdmapType {
  Default = 'DEFAULT',
  Isolated = 'ISOLATED',
  Privileged = 'PRIVILEGED',
}

export const containerIdmapTypeLabels = new Map<ContainerIdmapType, string>([
  [ContainerIdmapType.Default, T('Default')],
  [ContainerIdmapType.Isolated, T('Isolated')],
  [ContainerIdmapType.Privileged, T('Privileged')],
]);
