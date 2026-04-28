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

export function getLabelForLicenseFeature(feature: LicenseFeature | string): string {
  const labels: Record<LicenseFeature, string> = {
    [LicenseFeature.Apps]: 'Apps',
    [LicenseFeature.FibreChannel]: 'Fibre Channel',
    [LicenseFeature.Dedup]: 'Deduplication',
    [LicenseFeature.Vm]: 'Virtualization',
    [LicenseFeature.Sed]: 'Self-Encrypting Drives',
    [LicenseFeature.Support]: 'Support',
  };
  return labels[feature as LicenseFeature] ?? feature;
}
