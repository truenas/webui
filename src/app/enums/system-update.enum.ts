export enum SystemUpdateStatus {
  Available = 'AVAILABLE',
  Unavailable = 'UNAVAILABLE',
  RebootRequired = 'REBOOT_REQUIRED',
}

export enum SystemUpdateOperationType {
  Upgrade = 'upgrade',
  Install = 'install',
  Delete = 'delete',
}
