import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';

export enum VirtualizationType {
  Container = 'CONTAINER',
  Vm = 'VM',
}

export const virtualizationTypeLabels = new Map<VirtualizationType, string>([
  [VirtualizationType.Container, T('Container')],
  [VirtualizationType.Vm, T('VM')],
]);

export const virtualizationTypeIcons = [
  {
    value: VirtualizationType.Container,
    icon: iconMarker('mdi-linux'),
    label: T('Container'),
    description: T('Linux Only'),
  },
  {
    value: VirtualizationType.Vm,
    icon: iconMarker('mdi-laptop'),
    label: T('VM'),
    description: T('Any OS'),
  },
];

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
  Vm = 'VM',
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
  [VirtualizationNicType.Macvlan, T('MAC VLAN')],
]);

export enum VirtualizationSource {
  Image = 'IMAGE',
}
