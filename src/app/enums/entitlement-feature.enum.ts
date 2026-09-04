/**
 * Policy keys the middleware entitlement engine can decide, mirroring `POLICY` in
 * `middlewared/utils/entitlements/policy.py`.
 *
 * Not interchangeable with `LicenseFeature`. Entitlement also depends on hardware class,
 * and the matrix is not monotonic in the licence — an unlicensed system can be entitled to
 * a feature that a licensed system without that key is denied. Never infer one from the other.
 */
export enum EntitlementFeature {
  Apps = 'APPS',
  CatalogEnterpriseTrain = 'CATALOG_ENTERPRISE_TRAIN',
  Containers = 'CONTAINERS',
  Dedup = 'DEDUP',
  DirectoryServices = 'DIRECTORY_SERVICES',
  FibreChannel = 'FIBRECHANNEL',
  Kmip = 'KMIP',
  MissionCritical = 'MISSION_CRITICAL',
  NetworkFec = 'NETWORK_FEC',
  NfsSnapshot = 'NFS_SNAPSHOT',
  NvmeOfSpdk = 'NVMEOF_SPDK',
  Rdma = 'RDMA',
  Sed = 'SED',
  SmbFastpath = 'SMB_FASTPATH',
  SmbVeeam = 'SMB_VEEAM',
  Stig = 'STIG',
  Support = 'SUPPORT',
  TrueSearch = 'TRUESEARCH',
  Vms = 'VMS',
  Webshare = 'WEBSHARE',
  ZfsTier = 'ZFSTIER',
  Ha = 'HA',
  ProactiveSupport = 'PROACTIVE_SUPPORT',
}
