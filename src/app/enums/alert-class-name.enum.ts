/**
 * For updates to this see `alert.list_categories`.
 */
export enum AlertClassName {
  // Applications
  FailuresInAppMigration = 'FailuresInAppMigration',
  AppUpdate = 'AppUpdate',
  CatalogNotHealthy = 'CatalogNotHealthy',
  ApplicationsConfigurationFailed = 'ApplicationsConfigurationFailed',
  ApplicationsStartFailed = 'ApplicationsStartFailed',
  CatalogSyncFailed = 'CatalogSyncFailed',

  // Audit
  AuditBackendSetup = 'AuditBackendSetup',
  AuditServiceHealth = 'AuditServiceHealth',
  AuditSetup = 'AuditSetup',

  // Certificates
  CertificateExpired = 'CertificateExpired',
  CertificateIsExpiring = 'CertificateIsExpiring',
  CertificateIsExpiringSoon = 'CertificateIsExpiringSoon',
  CertificateParsingFailed = 'CertificateParsingFailed',
  CertificateRevoked = 'CertificateRevoked',
  WebUiCertificateSetupFailed = 'WebUiCertificateSetupFailed',

  // Directory Service
  ActiveDirectoryDomainBind = 'ActiveDirectoryDomainBind',
  ActiveDirectoryDomainHealth = 'ActiveDirectoryDomainHealth',
  IpaDomainBind = 'IPADomainBind',
  IpaLegacyConfiguration = 'IPALegacyConfiguration',
  LdapBind = 'LDAPBind',

  // HA
  NoCriticalFailoverInterfaceFound = 'NoCriticalFailoverInterfaceFound',
  FailoverSyncFailed = 'FailoverSyncFailed',
  VrrpStatesDoNotAgree = 'VRRPStatesDoNotAgree',
  DisksAreNotPresentOnActiveNode = 'DisksAreNotPresentOnActiveNode',
  DisksAreNotPresentOnStandbyNode = 'DisksAreNotPresentOnStandbyNode',
  FailoverStatusCheckFailed = 'FailoverStatusCheckFailed',
  FailoverFailed = 'FailoverFailed',
  FailoverInterfaceNotFound = 'FailoverInterfaceNotFound',
  NetworkCardsMismatchOnActiveNode = 'NetworkCardsMismatchOnActiveNode',
  NetworkCardsMismatchOnStandbyNode = 'NetworkCardsMismatchOnStandbyNode',
  FailoverRemoteSystemInaccessible = 'FailoverRemoteSystemInaccessible',
  FailoverKeysSyncFailed = 'FailoverKeysSyncFailed',
  FailoverKmipKeysSyncFailed = 'FailoverKMIPKeysSyncFailed',
  TrueNasVersionsMismatch = 'TrueNASVersionsMismatch',

  // Hardware
  UsbStorage = 'USBStorage',
  DifFormatted = 'DifFormatted',
  EnclosureHealthy = 'EnclosureHealthy',
  EnclosureUnhealthy = 'EnclosureUnhealthy',
  JbofRedfishComm = 'JBOFRedfishComm',
  IpmiSel = 'IPMISEL',
  IpmiSelSpaceLeft = 'IPMISELSpaceLeft',
  NvdimmInvalidFirmwareVersion = 'NVDIMMInvalidFirmwareVersion',
  JbofElementCritical = 'JBOFElementCritical',
  JbofElementWarning = 'JBOFElementWarning',
  JbofInvalidData = 'JBOFInvalidData',
  JbofTearDownFailure = 'JBOFTearDownFailure',
  MemorySizeMismatch = 'MemorySizeMismatch',
  NvdimmEsLifetimeCritical = 'NVDIMMESLifetimeCritical',
  NvdimmEsLifetimeWarning = 'NVDIMMESLifetimeWarning',
  NvdimmRecommendedFirmwareVersion = 'NVDIMMRecommendedFirmwareVersion',
  NvdimmMemoryModLifetimeCritical = 'NVDIMMMemoryModLifetimeCritical',
  NvdimmMemoryModLifetimeWarning = 'NVDIMMMemoryModLifetimeWarning',
  OldBiosVersion = 'OldBiosVersion',
  PowerSupply = 'PowerSupply',
  Smart = 'SMART',
  SataDomWearCritical = 'SATADOMWearCritical',
  SataDomWearWarning = 'SATADOMWearWarning',
  Sensor = 'Sensor',
  Nvdimm = 'NVDIMM',
  MemoryErrors = 'MemoryErrors',
  Smartd = 'Smartd',

  // KMIP
  KmipConnectionFailed = 'KMIPConnectionFailed',
  KmipSedGlobalPasswordSyncFailure = 'KMIPSEDGlobalPasswordSyncFailure',
  KmipSedDisksSyncFailure = 'KMIPSEDDisksSyncFailure',
  KmipZfsDatasetsSyncFailure = 'KMIPZFSDatasetsSyncFailure',

  // Network
  BondMissingPorts = 'BONDMissingPorts',
  BondInactivePorts = 'BONDInactivePorts',
  BondNoActivePorts = 'BONDNoActivePorts',

  // Reporting
  SyslogNg = 'SyslogNg',

  // Sharing
  DeprecatedServiceConfiguration = 'DeprecatedServiceConfiguration',
  DeprecatedService = 'DeprecatedService',
  IscsiPortalIp = 'ISCSIPortalIP',
  NfsBindAddress = 'NFSBindAddress',
  NfsExportMappingInvalidNames = 'NFSexportMappingInvalidNames',
  NfsHostnameLookupFail = 'NFSHostnameLookupFail',
  NfsBlockedByExportsDir = 'NFSblockedByExportsDir',
  Ntlmv1Authentication = 'NTLMv1Authentication',
  SmbPath = 'SMBPath',
  SmbLegacyProtocol = 'SMBLegacyProtocol',
  ShareLocked = 'ShareLocked',
  IscsiDiscoveryAuthMixed = 'ISCSIDiscoveryAuthMixed',
  IscsiDiscoveryAuthMultipleMutualChap = 'ISCSIDiscoveryAuthMultipleMutualCHAP',
  IscsiDiscoveryAuthMultipleChap = 'ISCSIDiscoveryAuthMultipleCHAP',

  // Storage
  QuotaCritical = 'QuotaCritical',
  PoolUpgraded = 'PoolUpgraded',
  ZpoolCapacityNotice = 'ZpoolCapacityNotice',
  ZpoolCapacityWarning = 'ZpoolCapacityWarning',
  ZpoolCapacityCritical = 'ZpoolCapacityCritical',
  VolumeStatus = 'VolumeStatus',
  PoolUsbDisks = 'PoolUSBDisks',
  QuotaWarning = 'QuotaWarning',
  ScrubPaused = 'ScrubPaused',
  SnapshotTotalCount = 'SnapshotTotalCount',
  SnapshotCount = 'SnapshotCount',

  // System
  ApiKeyRevoked = 'ApiKeyRevoked',
  ApiFailedLogin = 'APIFailedLogin',
  AdminUserIsOverridden = 'AdminUserIsOverridden',
  AdminSession = 'AdminSession',
  BootPoolStatus = 'BootPoolStatus',
  FailoverReboot = 'FailoverReboot',
  FencedReboot = 'FencedReboot',
  NtpHealthCheck = 'NTPHealthCheck',
  TruecommandConnectionPending = 'TruecommandConnectionPending',
  ProactiveSupport = 'ProactiveSupport',
  SshLoginFailures = 'SSHLoginFailures',
  KdumpNotReady = 'KdumpNotReady',
  SystemTesting = 'SystemTesting',
  WebUiBindAddressV2 = 'WebUiBindAddressV2',
  TruecommandConnectionDisabled = 'TruecommandConnectionDisabled',
  TruecommandContainerHealth = 'TruecommandContainerHealth',
  TruecommandConnectionHealth = 'TruecommandConnectionHealth',
  LicenseHasExpired = 'LicenseHasExpired',
  LicenseIsExpiring = 'LicenseIsExpiring',
  License = 'License',
  EncryptedDataset = 'EncryptedDataset',
  HasUpdate = 'HasUpdate',

  // Tasks
  CloudBackupTaskFailed = 'CloudBackupTaskFailed',
  CloudSyncTaskFailed = 'CloudSyncTaskFailed',
  VmwareSnapshotTaskFailed = 'VMWareSnapshotCreateFailed',
  ReplicationFailed = 'ReplicationFailed',
  ReplicationSuccess = 'ReplicationSuccess',
  RsyncFailed = 'RsyncFailed',
  RsyncSuccess = 'RsyncSuccess',
  ScrubNotStarted = 'ScrubNotStarted',
  ScrubFinished = 'ScrubFinished',
  ScrubStarted = 'ScrubStarted',
  SnapshotFailed = 'SnapshotFailed',
  TaskLocked = 'TaskLocked',
  VmwareLoginFailed = 'VMWareLoginFailed',
  VmwareSnapshotDeleteFailed = 'VMWareSnapshotDeleteFailed',

  // UPS
  UpsBatteryLow = 'UPSBatteryLow',
  UpsReplaceBattery = 'UPSReplbatt',
  UpsCommunicationOk = 'UPSCommok',
  UpsCommunicationBad = 'UPSCommbad',
  UpsOnBattery = 'UPSOnBattery',
  UpsOnline = 'UPSOnline',
}
