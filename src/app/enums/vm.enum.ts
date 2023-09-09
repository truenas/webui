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

export enum VmDiskMode {
  Ahci = 'AHCI',
  Virtio = 'VIRTIO',
}

export enum VmDisplayType {
  Spice = 'SPICE',
}

export enum VmNicType {
  E1000 = 'E1000',
  Virtio = 'VIRTIO',
}
