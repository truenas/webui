export enum LicenseFeature {
  // The middleware truenas.license.info endpoint normalizes legacy `JAILS` → `APPS`
  // before returning, so the UI only ever sees `APPS`.
  Apps = 'APPS',
  FibreChannel = 'FIBRECHANNEL',
  Dedup = 'DEDUP',
  Vm = 'VM',
  Sed = 'SED',
  Support = 'SUPPORT',
}
