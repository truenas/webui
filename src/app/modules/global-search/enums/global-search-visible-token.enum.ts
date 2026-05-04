export enum GlobalSearchVisibleToken {
  Failover = 'FAILOVER',
  Enclosure = 'ENCLOSURE',
  Vms = 'VMS',
  Apps = 'APPS',
  FibreChannel = 'FIBRECHANNEL',
  Dedup = 'DEDUP',
  Kmip = 'KMIP',
  // Sed visibility: gated by `LicenseService.hasSedFeature$` — i.e. the system
  // is Enterprise OR a global SED password is already set.
  Sed = 'SED',
  // SystemSecurity visibility: gated by `LicenseService.hasFipsHardware$`,
  // which reflects the backend-reported FIPS-hardware capability. The token
  // name describes the *card* it controls (FIPS / STIG / password policy);
  // FIPS-hardware support is the underlying gate, not a license feature.
  SystemSecurity = 'SYSTEM_SECURITY',
}
