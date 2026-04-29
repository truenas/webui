export enum LicenseFeature {
  // The middleware truenas.license.info endpoint normalizes legacy `JAILS` → `APPS`
  // before returning, so the UI only ever sees `APPS`.
  Apps = 'APPS',
  Containers = 'CONTAINERS',
  Dedup = 'DEDUP',
  FibreChannel = 'FIBRECHANNEL',
  Lts = 'LTS',
  Sed = 'SED',
  Support = 'SUPPORT',
  Vms = 'VMS',
  ZfsTier = 'ZFSTIER',
}

export function getLabelForLicenseFeature(feature: LicenseFeature | string): string {
  const labels: Record<LicenseFeature, string> = {
    [LicenseFeature.Apps]: 'Apps',
    [LicenseFeature.Containers]: 'Containers',
    [LicenseFeature.Dedup]: 'Deduplication',
    [LicenseFeature.FibreChannel]: 'Fibre Channel',
    [LicenseFeature.Lts]: 'LTS',
    [LicenseFeature.Sed]: 'Self-Encrypting Drives',
    [LicenseFeature.Support]: 'Support',
    [LicenseFeature.Vms]: 'VMs',
    [LicenseFeature.ZfsTier]: 'ZFS Tiering',
  };
  return labels[feature as LicenseFeature] ?? feature;
}
