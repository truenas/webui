import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum VmTime {
  Local = 'LOCAL',
  Utc = 'UTC',
}

export const vmTimeNames = new Map<VmTime, string>([
  [VmTime.Local, T('Local')],
  [VmTime.Utc, T('UTC')],
]);

export enum VmBootloader {
  Uefi = 'UEFI',
  UefiCsm = 'UEFI_CSM',

  /**
   * @deprecated
   */
  Grub = 'GRUB',
}

export enum VmDeviceType {
  Nic = 'NIC',
  Disk = 'DISK',
  Cdrom = 'CDROM',
  Pci = 'PCI',
  Display = 'DISPLAY',
  Raw = 'RAW',
  Usb = 'USB',
}

export const vmDeviceTypeLabels = new Map<VmDeviceType, string>([
  [VmDeviceType.Nic, T('NIC')],
  [VmDeviceType.Disk, T('Disk')],
  [VmDeviceType.Cdrom, T('CD-ROM')],
  [VmDeviceType.Pci, T('PCI Passthrough Device')],
  [VmDeviceType.Display, T('Display')],
  [VmDeviceType.Raw, T('Raw File')],
  [VmDeviceType.Usb, T('USB Passthrough Device')],
]);

export enum VmCpuMode {
  Custom = 'CUSTOM',
  HostModel = 'HOST-MODEL',
  HostPassthrough = 'HOST-PASSTHROUGH',
}

export const vmCpuModeLabels = new Map<VmCpuMode, string>([
  [VmCpuMode.Custom, T('Custom')],
  [VmCpuMode.HostModel, T('Host Model')],
  [VmCpuMode.HostPassthrough, T('Host Passthrough')],
]);

export enum VmDiskMode {
  Ahci = 'AHCI',
  Virtio = 'VIRTIO',
}

export const vmDiskModeLabels = new Map<VmDiskMode, string>([
  [VmDiskMode.Ahci, 'AHCI'],
  [VmDiskMode.Virtio, 'VirtIO'],
]);

export enum VmDisplayType {
  Spice = 'SPICE',
}

export enum VmNicType {
  E1000 = 'E1000',
  Virtio = 'VIRTIO',
}

export const vmNicTypeLabels = new Map<VmNicType, string>([
  [VmNicType.E1000, 'Intel e82585 (e1000)'],
  [VmNicType.Virtio, 'VirtIO'],
]);

export enum VmOs {
  Windows = 'Windows',
  Linux = 'Linux',
  FreeBsd = 'FreeBSD',
}

export const vmOsLabels = new Map<VmOs, string>([
  [VmOs.Windows, T('Windows')],
  [VmOs.Linux, T('Linux')],
  [VmOs.FreeBsd, T('FreeBSD')],
]);

export enum VmState {
  Running = 'RUNNING',
  Stopped = 'STOPPED',
  // Below statuses been seen in ApiEvent<VirtualMachine>. Perhaps we could handle them.
  Shutoff = 'SHUTOFF',
  UpdatingConfiguration = 'UPDATING CONFIGURATION',
}
