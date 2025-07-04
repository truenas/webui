export enum SystemUpdateStatus {
  Available = 'AVAILABLE',
  Normal = 'NORMAL',
  Unavailable = 'UNAVAILABLE',
  RebootRequired = 'REBOOT_REQUIRED',
}

export enum SystemUpdateOperationType {
  Upgrade = 'upgrade',
  Install = 'install',
  Delete = 'delete',
}
