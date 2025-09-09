export enum UpdateCode {
  Normal = 'NORMAL',
  Error = 'ERROR',
  RebootRequired = 'REBOOT_REQUIRED',
  HaUnavailable = 'HA_UNAVAILABLE',
  NetworkActivityDisabled = 'NETWORK_ACTIVITY_DISABLED',
}

export enum SystemUpdateOperationType {
  Upgrade = 'upgrade',
  Install = 'install',
  Delete = 'delete',
}
