export enum GlobalSearchVisibleToken {
  Failover = 'FAILOVER',
  Enclosure = 'ENCLOSURE',
  Vms = 'VMS',
  Apps = 'APPS',
  FibreChannel = 'FIBRECHANNEL',
  Dedup = 'DEDUP',
  Kmip = 'KMIP',
  // Sed visibility: gated on the `SED` entitlement.
  Sed = 'SED',
  // SystemSecurity visibility: gated by `LicenseService.hasSystemSecurity$`,
  // which reflects the backend-reported FIPS-hardware capability — the same
  // condition under which the System Security card (FIPS / STIG / password
  // policy) is rendered.
  SystemSecurity = 'SYSTEM_SECURITY',
}
