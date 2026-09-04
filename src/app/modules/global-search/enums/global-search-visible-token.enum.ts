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
}
