export enum UpdateCode {
  Normal = 'NORMAL',
  Error = 'ERROR',
  RebootRequired = 'REBOOT_REQUIRED',
  HaUnavailable = 'HA_UNAVAILABLE',
}

export enum SystemUpdateOperationType {
  Upgrade = 'upgrade',
  Install = 'install',
  Delete = 'delete',
}
