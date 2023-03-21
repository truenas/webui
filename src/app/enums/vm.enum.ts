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
  [VmDiskMode.Virtio, 'VIRTIO'],
]);

export enum VmDisplayType {
  Vnc = 'VNC',
  Spice = 'SPICE',
}

export const vmDisplayTypeLabels = new Map<VmDisplayType, string>([
  [VmDisplayType.Vnc, 'VNC'],
  [VmDisplayType.Spice, 'SPICE'],
]);

export enum VmNicType {
  E1000 = 'E1000',
  Virtio = 'VIRTIO',
}

export const vmNicTypeLabels = new Map<VmNicType, string>([
  [VmNicType.E1000, 'Intel e82585 (e1000)'],
  [VmNicType.Virtio, 'VirtIO'],
]);

// eslint-disable-next-line @shopify/typescript/prefer-singular-enums
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
