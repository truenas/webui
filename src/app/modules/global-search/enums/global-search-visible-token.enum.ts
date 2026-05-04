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
  // SystemSecurity visibility: gated by `LicenseService.hasSystemSecurity$`,
  // which reflects the backend-reported FIPS-hardware capability — the same
  // condition under which the System Security card (FIPS / STIG / password
  // policy) is rendered.
  SystemSecurity = 'SYSTEM_SECURITY',
}
