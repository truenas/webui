export enum VmTime {
  Local = 'LOCAL',
  Utc = 'UTC',
}

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
}

export enum VmCpuMode {
  Custom = 'CUSTOM',
  HostModel = 'HOST-MODEL',
  HostPassthrough = 'HOST-PASSTHROUGH',
}
