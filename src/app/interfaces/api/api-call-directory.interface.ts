import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { CloudsyncTransferSetting } from 'app/enums/cloudsync-transfer-setting.enum';
import { DatasetRecordSize, DatasetType } from 'app/enums/dataset.enum';
import { DeviceType } from 'app/enums/device-type.enum';
import { DockerConfig, DockerStatusData } from 'app/enums/docker-config.interface';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { RdmaProtocolName, ServiceName } from 'app/enums/service-name.enum';
import { SmbInfoLevel } from 'app/enums/smb-info-level.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { VirtualizationGpuType, VirtualizationNicType, VirtualizationType } from 'app/enums/virtualization.enum';
import {
  Acl,
  AclQueryParams,
  AclTemplateByPath,
  AclTemplateByPathParams,
  AclTemplateCreateParams,
  AclTemplateCreateResponse,
} from 'app/interfaces/acl.interface';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { AdvancedConfig, AdvancedConfigUpdate } from 'app/interfaces/advanced-config.interface';
import { AlertService, AlertServiceEdit } from 'app/interfaces/alert-service.interface';
import {
  Alert, AlertCategory, AlertClasses, AlertClassesUpdate,
} from 'app/interfaces/alert.interface';
import { ApiKey, CreateApiKeyRequest, UpdateApiKeyRequest } from 'app/interfaces/api-key.interface';
import { ApiEventMethod } from 'app/interfaces/api-message.interface';
import {
  App,
  AppQueryParams,
  AppUpgradeParams,
} from 'app/interfaces/app.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { AuditConfig, AuditEntry, AuditQueryParams } from 'app/interfaces/audit/audit.interface';
import { AuthSession } from 'app/interfaces/auth-session.interface';
import { LoginExOtpTokenQuery, LoginExQuery, LoginExResponse } from 'app/interfaces/auth.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { BootenvCloneParams, BootEnvironment, BootenvKeepParams } from 'app/interfaces/boot-environment.interface';
import {
  CatalogConfig, CatalogApp,
  CatalogUpdate, GetItemDetailsParams,
} from 'app/interfaces/catalog.interface';
import {
  CertificateAuthority, CertificateAuthoritySignRequest,
  CertificateAuthorityUpdate,
} from 'app/interfaces/certificate-authority.interface';
import {
  Certificate,
  CertificateProfiles,
  ExtendedKeyUsageChoices,
} from 'app/interfaces/certificate.interface';
import { Choices } from 'app/interfaces/choices.interface';
import {
  CloudBackup,
  CloudBackupSnapshot,
  CloudBackupSnapshotDirectoryListing,
  CloudBackupSnapshotDirectoryParams,
  CloudBackupUpdate,
} from 'app/interfaces/cloud-backup.interface';
import {
  CloudSyncDirectoryListing,
  CloudSyncListDirectoryParams,
  CloudSyncTask,
  CloudSyncTaskUpdate,
} from 'app/interfaces/cloud-sync-task.interface';
import {
  CloudSyncBucket,
  CloudSyncCredential,
  CloudSyncCredentialUpdate,
  CloudSyncCredentialVerify, CloudSyncCredentialVerifyResult,
} from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider, CloudSyncRestoreParams } from 'app/interfaces/cloudsync-provider.interface';
import {
  ContainerImage, DeleteContainerImageParams,
} from 'app/interfaces/container-image.interface';
import { CoreDownloadQuery, CoreDownloadResponse } from 'app/interfaces/core-download.interface';
import {
  CountManualSnapshotsParams,
  EligibleManualSnapshotsCount,
  TargetUnmatchedSnapshotsParams,
} from 'app/interfaces/count-manual-snapshots.interface';
import { Cronjob, CronjobUpdate } from 'app/interfaces/cronjob.interface';
import { DatasetHasVmsQueryParams } from 'app/interfaces/dataset-has-vms-query-params.interface';
import { DatasetQuota, DatasetQuotaQueryParams, SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import {
  Dataset, DatasetCreate, DatasetDetails, DatasetUpdate, ExtraDatasetQueryOptions,
} from 'app/interfaces/dataset.interface';
import { Device } from 'app/interfaces/device.interface';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import {
  Disk, DiskDetailsResponse,
  DiskTemperatureAgg,
  DiskTemperatures,
  DiskUpdate,
  ExtraDiskQueryOptions, DiskDetailsParams,
} from 'app/interfaces/disk.interface';
import {
  AuthenticatorSchema,
  CreateDnsAuthenticator,
  DnsAuthenticator, UpdateDnsAuthenticator,
} from 'app/interfaces/dns-authenticator.interface';
import { DockerHubRateLimit } from 'app/interfaces/dockerhub-rate-limit.interface';
import {
  DsUncachedGroup, DsUncachedUser, LoggedInUser,
} from 'app/interfaces/ds-cache.interface';
import { DashboardEnclosure, Enclosure, SetDriveBayLightStatus } from 'app/interfaces/enclosure.interface';
import {
  FailoverConfig,
  FailoverUpdate,
} from 'app/interfaces/failover.interface';
import {
  FibreChannelHost,
  FibreChannelPort,
  FibreChannelPortChoices,
  FibreChannelPortUpdate,
  FibreChannelStatus,
} from 'app/interfaces/fibre-channel.interface';
import { FileRecord, ListdirQueryParams } from 'app/interfaces/file-record.interface';
import { FileSystemStat, Statfs } from 'app/interfaces/filesystem-stat.interface';
import { FtpConfig, FtpConfigUpdate } from 'app/interfaces/ftp-config.interface';
import {
  CreateGroup, DeleteGroupParams, Group, UpdateGroup,
} from 'app/interfaces/group.interface';
import { IdmapBackendOptions } from 'app/interfaces/idmap-backend-options.interface';
import { Idmap, IdmapUpdate } from 'app/interfaces/idmap.interface';
import {
  CreateInitShutdownScript,
  InitShutdownScript,
  UpdateInitShutdownScriptParams,
} from 'app/interfaces/init-shutdown-script.interface';
import {
  Ipmi, IpmiChassis, IpmiQueryParams, IpmiUpdate,
} from 'app/interfaces/ipmi.interface';
import {
  IscsiGlobalConfig,
  IscsiGlobalConfigUpdate,
  IscsiGlobalSession,
} from 'app/interfaces/iscsi-global-config.interface';
import {
  IscsiAuthAccess, IscsiAuthAccessUpdate, IscsiExtent, IscsiExtentUpdate,
  IscsiInitiatorGroup, IscsiInitiatorGroupUpdate,
  IscsiPortal, IscsiPortalUpdate,
  IscsiTarget, IscsiTargetExtent, IscsiTargetExtentUpdate, IscsiTargetUpdate,
} from 'app/interfaces/iscsi.interface';
import { Jbof, JbofUpdate } from 'app/interfaces/jbof.interface';
import { Job } from 'app/interfaces/job.interface';
import {
  KerberosConfig,
  KerberosConfigUpdate,
  KerberosKeytab,
  KerberosKeytabUpdate,
} from 'app/interfaces/kerberos-config.interface';
import { KerberosRealm, KerberosRealmUpdate } from 'app/interfaces/kerberos-realm.interface';
import {
  KeychainCredential,
  KeychainCredentialCreate, KeychainCredentialUpdate,
  KeychainSshCredentials,
  SshKeyPair,
} from 'app/interfaces/keychain-credential.interface';
import { KmipConfig } from 'app/interfaces/kmip-config.interface';
import { LdapConfig } from 'app/interfaces/ldap-config.interface';
import { MailConfig, MailConfigUpdate } from 'app/interfaces/mail-config.interface';
import {
  NetworkConfiguration,
  NetworkConfigurationUpdate,
} from 'app/interfaces/network-configuration.interface';
import {
  NetworkInterface,
  NetworkInterfaceCreate, NetworkInterfaceUpdate,
  ServiceRestartedOnNetworkSync,
} from 'app/interfaces/network-interface.interface';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { AddNfsPrincipal, NfsConfig, NfsConfigUpdate } from 'app/interfaces/nfs-config.interface';
import {
  Nfs3Session, Nfs4Session, NfsShare, NfsShareUpdate,
} from 'app/interfaces/nfs-share.interface';
import { CreateNtpServer, NtpServer } from 'app/interfaces/ntp-server.interface';
import { MapOption } from 'app/interfaces/option.interface';
import {
  PeriodicSnapshotTask,
  PeriodicSnapshotTaskCreate,
  PeriodicSnapshotTaskUpdate,
} from 'app/interfaces/periodic-snapshot-task.interface';
import { DatasetAttachment, PoolAttachment } from 'app/interfaces/pool-attachment.interface';
import { CreatePoolScrubTask, PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
import {
  Pool, PoolInstance,
} from 'app/interfaces/pool.interface';
import { Privilege, PrivilegeRole, PrivilegeUpdate } from 'app/interfaces/privilege.interface';
import { Process } from 'app/interfaces/process.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { FailoverRebootInfo, SystemRebootInfo } from 'app/interfaces/reboot-info.interface';
import { ReplicationConfigUpdate } from 'app/interfaces/replication-config-update.interface';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import {
  ReplicationCreate,
  ReplicationTask,
} from 'app/interfaces/replication-task.interface';
import {
  CreateReportingExporter, ReportingExporter, ReportingExporterSchema, UpdateReportingExporter,
} from 'app/interfaces/reporting-exporters.interface';
import { ReportingGraph } from 'app/interfaces/reporting-graph.interface';
import {
  ReportingData,
  ReportingQueryParams,
} from 'app/interfaces/reporting.interface';
import { ResilverConfig, ResilverConfigUpdate } from 'app/interfaces/resilver-config.interface';
import { RsyncTask, RsyncTaskUpdate } from 'app/interfaces/rsync-task.interface';
import { Service } from 'app/interfaces/service.interface';
import { ResizeShellRequest } from 'app/interfaces/shell.interface';
import {
  SmartManualTestParams, SmartConfig, SmartConfigUpdate, SmartTestTask, SmartTestResults, ManualSmartTest,
  SmartTestTaskUpdate,
} from 'app/interfaces/smart-test.interface';
import { SmbConfig, SmbConfigUpdate } from 'app/interfaces/smb-config.interface';
import {
  SmbPresets, SmbShare, SmbSharesec, SmbSharesecAce, SmbShareUpdate,
} from 'app/interfaces/smb-share.interface';
import { SmbStatus } from 'app/interfaces/smb-status.interface';
import { SnmpConfig, SnmpConfigUpdate } from 'app/interfaces/snmp-config.interface';
import { SshConfig, SshConfigUpdate } from 'app/interfaces/ssh-config.interface';
import {
  RemoteSshScanParams,
  SshConnectionSetup,
} from 'app/interfaces/ssh-connection-setup.interface';
import { StaticRoute, UpdateStaticRoute } from 'app/interfaces/static-route.interface';
import { SystemGeneralConfig, SystemGeneralConfigUpdate } from 'app/interfaces/system-config.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import {
  SystemUpdate,
  SystemUpdateChange,
  SystemUpdateTrains,
} from 'app/interfaces/system-update.interface';
import {
  TrueCommandConfig, TrueCommandUpdateResponse,
  UpdateTrueCommand,
} from 'app/interfaces/true-command-config.interface';
import { Tunable } from 'app/interfaces/tunable.interface';
import { GlobalTwoFactorConfig, GlobalTwoFactorConfigUpdate } from 'app/interfaces/two-factor-config.interface';
import { UpsConfig, UpsConfigUpdate } from 'app/interfaces/ups-config.interface';
import {
  DeleteUserParams, SetPasswordParams, User, UserUpdate,
} from 'app/interfaces/user.interface';
import {
  VirtualizationDetails,
  VirtualMachine, VirtualMachineUpdate, VmCloneParams, VmDeleteParams, VmDisplayWebUri,
  VmDisplayWebUriParams, VmPortWizardResult,
} from 'app/interfaces/virtual-machine.interface';
import {
  VirtualizationDevice, VirtualizationGlobalConfig,
  VirtualizationImage, VirtualizationImageParams,
  VirtualizationInstance, VirtualizationNetwork, AvailableUsb, AvailableGpus,
} from 'app/interfaces/virtualization.interface';
import {
  VmDevice, VmDeviceDelete, VmDeviceUpdate, VmDisplayDevice, VmPassthroughDeviceChoice, VmUsbPassthroughDeviceChoice,
} from 'app/interfaces/vm-device.interface';
import {
  MatchDatastoresWithDatasets,
  MatchDatastoresWithDatasetsParams,
  VmwareSnapshot, VmwareSnapshotUpdate,
} from 'app/interfaces/vmware.interface';
import {
  CloneZfsSnapshot,
  CreateZfsSnapshot,
  ZfsRollbackParams,
  ZfsSnapshot,
} from 'app/interfaces/zfs-snapshot.interface';
import {
  SimilarIssue,
  SimilarIssuesParams,
  SupportConfig, SupportConfigUpdate,
} from 'app/modules/feedback/interfaces/file-ticket.interface';

/**
 * API definitions for `call` methods.
 * For jobs see ApiJobDirectory.
 * For events from `subscribed` see ApiEventDirectory.
 */
export interface ApiCallDirectory {
  // Acme DNS
  'acme.dns.authenticator.authenticator_schemas': { params: void; response: AuthenticatorSchema[] };
  'acme.dns.authenticator.create': { params: [CreateDnsAuthenticator]; response: DnsAuthenticator };
  'acme.dns.authenticator.delete': { params: [id: number]; response: boolean };
  'acme.dns.authenticator.query': { params: void; response: DnsAuthenticator[] };
  'acme.dns.authenticator.update': { params: [number, UpdateDnsAuthenticator]; response: DnsAuthenticator };

  // Active Directory
  'activedirectory.config': { params: void; response: ActiveDirectoryConfig };
  'activedirectory.nss_info_choices': { params: void; response: string[] };

  // Alert
  'alert.dismiss': { params: string[]; response: void };
  'alert.list': { params: void; response: Alert[] };
  'alert.list_categories': { params: void; response: AlertCategory[] };
  'alert.list_policies': { params: void; response: AlertPolicy[] };
  'alert.restore': { params: string[]; response: void };

  // Alert Classes
  'alertclasses.config': { params: void; response: AlertClasses };
  'alertclasses.update': { params: [AlertClassesUpdate]; response: AlertClasses };
  'alertservice.create': { params: [AlertServiceEdit]; response: AlertService };
  'alertservice.delete': { params: [number]; response: boolean };
  'alertservice.query': { params: QueryParams<AlertService>; response: AlertService[] };
  'alertservice.test': { params: [AlertServiceEdit]; response: boolean };
  'alertservice.update': { params: [id: number, update: AlertServiceEdit]; response: AlertService };

  // API Key
  'api_key.create': { params: [CreateApiKeyRequest]; response: ApiKey };
  'api_key.delete': { params: [id: number]; response: boolean };
  'api_key.query': { params: QueryParams<ApiKey>; response: ApiKey[] };
  'api_key.update': { params: UpdateApiKeyRequest; response: ApiKey };

  // App
  'app.query': { params: AppQueryParams; response: App[] };
  'app.upgrade_summary': { params: AppUpgradeParams; response: AppUpgradeSummary };
  'app.available': { params: QueryParams<AvailableApp>; response: AvailableApp[] };
  'app.available_space': { params: void; response: number };
  'app.categories': { params: void; response: string[] };
  'app.latest': { params: QueryParams<AvailableApp>; response: AvailableApp[] };
  'app.similar': { params: [app_name: string, train: string]; response: AvailableApp[] };
  'app.rollback_versions': { params: [app_name: string]; response: string[] };
  'app.ix_volume.exists': { params: [string]; response: boolean };

  // App Image
  'app.image.delete': { params: DeleteContainerImageParams; response: boolean };
  'app.image.dockerhub_rate_limit': { params: void; response: DockerHubRateLimit };
  'app.image.query': { params: QueryParams<ContainerImage>; response: ContainerImage[] };

  // Audit
  'audit.config': { params: void; response: AuditConfig };
  'audit.query': { params: [AuditQueryParams]; response: AuditEntry[] };
  'audit.update': { params: [AuditConfig]; response: AuditEntry[] };
  'audit.download_report': { params: [{ report_name?: string }]; response: string[] };

  // Auth
  'auth.generate_token': { params: void; response: string };
  'auth.login_ex': { params: [LoginExQuery]; response: LoginExResponse };
  'auth.login_ex_continue': { params: [LoginExOtpTokenQuery]; response: LoginExResponse };
  'auth.logout': { params: void; response: void };
  'auth.me': { params: void; response: LoggedInUser };
  'auth.sessions': { params: QueryParams<AuthSession>; response: AuthSession[] };
  'auth.set_attribute': { params: [key: string, value: unknown]; response: void };
  'auth.terminate_other_sessions': { params: void; response: void };
  'auth.terminate_session': { params: [id: string]; response: void };
  'auth.twofactor.config': { params: void; response: GlobalTwoFactorConfig };
  'auth.twofactor.update': { params: [GlobalTwoFactorConfigUpdate]; response: GlobalTwoFactorConfig };

  // Boot
  'boot.detach': { params: [disk: string]; response: void };
  'boot.get_state': { params: void; response: PoolInstance };
  'boot.set_scrub_interval': { params: [number]; response: number };

  // Boot Environment
  'boot.environment.query': { params: QueryParams<BootEnvironment>; response: BootEnvironment[] };
  'boot.environment.activate': { params: [{ id: string }]; response: unknown };
  'boot.environment.destroy': { params: [{ id: string }]; response: unknown };
  'boot.environment.clone': { params: BootenvCloneParams; response: unknown };
  'boot.environment.keep': { params: BootenvKeepParams; response: unknown };

  // Catalog
  'catalog.get_app_details': { params: [name: string, params: GetItemDetailsParams]; response: CatalogApp };
  'catalog.trains': { params: void; response: string[] };
  'catalog.update': { params: [CatalogUpdate]; response: CatalogConfig };
  'catalog.config': { params: void; response: CatalogConfig };

  // Certificate
  'certificate.acme_server_choices': { params: void; response: Choices };
  'certificate.country_choices': { params: void; response: Choices };
  'certificate.ec_curve_choices': { params: void; response: Choices };
  'certificate.extended_key_usage_choices': { params: void; response: ExtendedKeyUsageChoices };
  'certificate.query': { params: QueryParams<Certificate>; response: Certificate[] };

  // Certificate Authority
  'certificateauthority.ca_sign_csr': { params: [CertificateAuthoritySignRequest]; response: CertificateAuthority };
  'certificateauthority.create': { params: [CertificateAuthorityUpdate]; response: CertificateAuthority };
  'certificateauthority.delete': { params: [id: number]; response: boolean };
  'certificateauthority.query': { params: QueryParams<CertificateAuthority>; response: CertificateAuthority[] };
  'certificateauthority.update': {
    params: [number, Partial<CertificateAuthorityUpdate>];
    response: CertificateAuthority;
  };

  // CloudBackup
  'cloud_backup.create': { params: [CloudBackupUpdate]; response: CloudBackup };
  'cloud_backup.delete': { params: [id: number]; response: boolean };
  'cloud_backup.list_snapshots': { params: [id: number]; response: CloudBackupSnapshot[] };
  'cloud_backup.list_snapshot_directory': { params: CloudBackupSnapshotDirectoryParams; response: CloudBackupSnapshotDirectoryListing[] };
  'cloud_backup.transfer_setting_choices': { params: void; response: CloudsyncTransferSetting[] };
  'cloud_backup.query': { params: [id?: QueryParams<CloudBackup>]; response: CloudBackup[] };
  'cloud_backup.update': { params: [id: number, update: CloudBackupUpdate]; response: CloudBackup };

  // CloudSync
  'cloudsync.abort': { params: [id: number]; response: boolean };
  'cloudsync.create': { params: [CloudSyncTaskUpdate]; response: CloudSyncTask };
  'cloudsync.create_bucket': { params: [number, string]; response: void };
  'cloudsync.credentials.create': { params: [CloudSyncCredentialUpdate]; response: CloudSyncCredential };
  'cloudsync.credentials.delete': { params: [id: number]; response: boolean };
  'cloudsync.credentials.query': { params: QueryParams<CloudSyncCredential>; response: CloudSyncCredential[] };
  'cloudsync.credentials.update': { params: [id: number, update: CloudSyncCredentialUpdate]; response: CloudSyncCredential };
  'cloudsync.credentials.verify': { params: [CloudSyncCredentialVerify]; response: CloudSyncCredentialVerifyResult };
  'cloudsync.delete': { params: [id: number]; response: boolean };
  'cloudsync.list_buckets': { params: [id: number]; response: CloudSyncBucket[] };
  'cloudsync.list_directory': { params: [CloudSyncListDirectoryParams]; response: CloudSyncDirectoryListing[] };
  'cloudsync.providers': { params: void; response: CloudSyncProvider[] };
  'cloudsync.query': { params: QueryParams<CloudSyncTask>; response: CloudSyncTask[] };
  'cloudsync.restore': { params: CloudSyncRestoreParams; response: void };
  'cloudsync.update': { params: [id: number, task: CloudSyncTaskUpdate]; response: CloudSyncTask };

  // Core
  'core.ping': { params: void; response: 'pong' };
  'core.download': { params: CoreDownloadQuery; response: CoreDownloadResponse };
  'core.get_jobs': { params: QueryParams<Job>; response: Job[] };
  'core.job_abort': { params: [jobId: number]; response: void };
  'core.job_download_logs': { params: [ id: number, filename: string ]; response: string };
  'core.resize_shell': { params: ResizeShellRequest; response: void };
  'core.subscribe': { params: [name: ApiEventMethod]; response: void };
  'core.unsubscribe': { params: [id: string]; response: void };

  // Cronjob
  'cronjob.create': { params: [CronjobUpdate]; response: Cronjob };
  'cronjob.delete': { params: [id: number]; response: boolean };
  'cronjob.query': { params: QueryParams<Cronjob>; response: Cronjob[] };
  'cronjob.run': { params: [id: number]; response: void };
  'cronjob.update': { params: [id: number, update: CronjobUpdate]; response: Cronjob };

  // Device
  'device.get_info': { params: [{ type: DeviceType }]; response: Device[] };

  // Directory Services
  'directoryservices.get_state': { params: void; response: DirectoryServicesState };

  // Disk
  'disk.details': { params: [params: DiskDetailsParams]; response: DiskDetailsResponse };
  'disk.query': { params: QueryParams<Disk, ExtraDiskQueryOptions>; response: Disk[] };
  'disk.temperature_agg': { params: [disks: string[], days: number]; response: DiskTemperatureAgg };
  'disk.temperature_alerts': { params: [disks: string[]]; response: Alert[] };
  'disk.temperatures': { params: [disks: string[]]; response: DiskTemperatures };
  'disk.update': { params: [id: string, update: DiskUpdate]; response: Disk };

  // Enclosure
  'enclosure2.query': { params: void; response: Enclosure[] };
  'webui.enclosure.dashboard': { params: void; response: DashboardEnclosure[] };
  'enclosure.update': { params: [enclosureId: string, update: { label: string }]; response: Enclosure };
  'enclosure2.set_slot_status': { params: [SetDriveBayLightStatus]; response: void };

  // Failover
  'failover.become_passive': { params: void; response: void };
  'failover.config': { params: void; response: FailoverConfig };
  'failover.disabled.reasons': { params: void; response: FailoverDisabledReason[] };
  'failover.get_ips': { params: void; response: string[] };
  'failover.licensed': { params: void; response: boolean };
  'failover.node': { params: void; response: string };
  'failover.reboot.info': { params: void; response: FailoverRebootInfo };
  'failover.status': { params: void; response: FailoverStatus };
  'failover.sync_from_peer': { params: void; response: void };
  'failover.sync_to_peer': { params: [{ reboot?: boolean }]; response: void };
  'failover.update': { params: [FailoverUpdate]; response: FailoverConfig };

  // Fibre Channel
  'fc.capable': { params: []; response: boolean };

  // Fibre Channel Host
  'fc.fc_host.query': { params: []; response: FibreChannelHost[] };
  'fc.fc_host.update': { params: [id: number, changes: Partial<FibreChannelHost>]; response: void };

  // Fibre Channel Port
  'fcport.create': { params: [FibreChannelPortUpdate]; response: FibreChannelPort };
  'fcport.update': { params: [id: number, update: FibreChannelPortUpdate]; response: FibreChannelPort };
  'fcport.delete': { params: [id: number]; response: true };
  'fcport.port_choices': { params: [include_used?: boolean]; response: FibreChannelPortChoices };
  'fcport.query': { params: QueryParams<FibreChannelPort>; response: FibreChannelPort[] };
  'fcport.status': { params: []; response: FibreChannelStatus[] };

  // Filesystem
  'filesystem.acltemplate.by_path': { params: [AclTemplateByPathParams]; response: AclTemplateByPath[] };
  'filesystem.acltemplate.create': { params: [AclTemplateCreateParams]; response: AclTemplateCreateResponse };
  'filesystem.acltemplate.delete': { params: [id: number]; response: boolean };
  'filesystem.getacl': { params: AclQueryParams; response: Acl };
  'filesystem.listdir': { params: ListdirQueryParams; response: FileRecord[] };
  'filesystem.stat': { params: [path: string]; response: FileSystemStat };
  'filesystem.statfs': { params: [path: string]; response: Statfs };

  // FTP
  'ftp.config': { params: void; response: FtpConfig };
  'ftp.update': { params: [FtpConfigUpdate]; response: FtpConfig };

  // Group
  'group.create': { params: [CreateGroup]; response: number };
  'group.delete': { params: DeleteGroupParams; response: number };
  'group.get_group_obj': { params: [{ groupname?: string; gid?: number }]; response: DsUncachedGroup };
  'group.get_next_gid': { params: void; response: number };
  'group.query': { params: QueryParams<Group>; response: Group[] };
  'group.update': { params: [number, UpdateGroup]; response: number };

  // Idmap
  'idmap.backend_options': { params: void; response: IdmapBackendOptions };
  'idmap.create': { params: [IdmapUpdate]; response: Idmap };
  'idmap.delete': { params: [id: number]; response: boolean };
  'idmap.query': { params: QueryParams<Idmap>; response: Idmap[] };
  'idmap.update': { params: [id: number, update: IdmapUpdate]; response: Idmap };

  // Initshutdownscript
  'initshutdownscript.create': { params: [CreateInitShutdownScript]; response: InitShutdownScript };
  'initshutdownscript.delete': { params: [id: number]; response: boolean };
  'initshutdownscript.query': { params: QueryParams<InitShutdownScript>; response: InitShutdownScript[] };
  'initshutdownscript.update': { params: UpdateInitShutdownScriptParams; response: InitShutdownScript };

  // Interface
  'interface.bridge_members_choices': { params: [id: string]; response: Choices };
  'interface.cancel_rollback': { params: void; response: void };
  'interface.checkin': { params: void; response: void };
  'interface.checkin_waiting': { params: void; response: number | null };
  'interface.commit': { params: [{ checkin_timeout: number }]; response: void };
  'interface.create': { params: [NetworkInterfaceCreate]; response: NetworkInterface };
  'interface.default_route_will_be_removed': { params: void; response: boolean };
  'interface.delete': { params: [id: string]; response: string };
  'interface.has_pending_changes': { params: void; response: boolean };
  'interface.lacpdu_rate_choices': { params: void; response: Choices };
  'interface.lag_ports_choices': { params: [id: string]; response: Choices };
  'interface.lag_supported_protocols': { params: void; response: string[] };
  'interface.query': { params: QueryParams<NetworkInterface>; response: NetworkInterface[] };
  'interface.rollback': { params: void; response: void };
  'interface.save_default_route': { params: string[]; response: void };
  'interface.services_restarted_on_sync': { params: void; response: ServiceRestartedOnNetworkSync[] };
  'interface.update': { params: [id: string, update: NetworkInterfaceUpdate]; response: NetworkInterface };
  'interface.vlan_parent_interface_choices': { params: void; response: Choices };
  'interface.xmit_hash_policy_choices': { params: void; response: Choices };

  // IPMI
  'ipmi.chassis.identify': { params: [OnOff]; response: void };
  'ipmi.chassis.info': { params: void; response: IpmiChassis };
  'ipmi.is_loaded': { params: void; response: boolean };
  'ipmi.lan.query': { params: IpmiQueryParams; response: Ipmi[] };
  'ipmi.lan.update': { params: [id: number, update: IpmiUpdate]; response: Ipmi };

  // iSCSI
  'iscsi.auth.create': { params: [IscsiAuthAccessUpdate]; response: IscsiAuthAccess };
  'iscsi.auth.delete': { params: [id: number]; response: boolean };
  'iscsi.auth.query': { params: QueryParams<IscsiAuthAccess>; response: IscsiAuthAccess[] };
  'iscsi.auth.update': { params: [id: number, auth: IscsiAuthAccessUpdate]; response: IscsiAuthAccess };
  'iscsi.extent.create': { params: [IscsiExtentUpdate]; response: IscsiExtent };
  'iscsi.extent.delete': { params: [id: number, remove: boolean, force: boolean]; response: boolean };
  'iscsi.extent.disk_choices': { params: void; response: Choices };
  'iscsi.extent.query': { params: QueryParams<IscsiExtent>; response: IscsiExtent[] };
  'iscsi.extent.update': { params: [id: number, update: IscsiExtentUpdate]; response: IscsiExtentUpdate };
  'iscsi.global.config': { params: void; response: IscsiGlobalConfig };
  'iscsi.global.sessions': { params: QueryParams<IscsiGlobalSession>; response: IscsiGlobalSession[] };
  'iscsi.global.update': { params: [IscsiGlobalConfigUpdate]; response: IscsiGlobalConfig };
  'iscsi.initiator.create': { params: [IscsiInitiatorGroupUpdate]; response: IscsiInitiatorGroup };
  'iscsi.initiator.delete': { params: [id: number]; response: boolean };
  'iscsi.initiator.query': { params: QueryParams<IscsiInitiatorGroup>; response: IscsiInitiatorGroup[] };
  'iscsi.initiator.update': { params: [id: number, initiator: IscsiInitiatorGroupUpdate]; response: IscsiInitiatorGroup };
  'iscsi.portal.create': { params: [IscsiPortalUpdate]; response: IscsiPortal };
  'iscsi.portal.delete': { params: [number]; response: boolean };
  'iscsi.portal.listen_ip_choices': { params: void; response: Choices };
  'iscsi.portal.query': { params: QueryParams<IscsiPortal>; response: IscsiPortal[] };
  'iscsi.portal.update': { params: [id: number, target: IscsiPortalUpdate]; response: IscsiPortal };
  'iscsi.target.create': { params: [IscsiTargetUpdate]; response: IscsiTarget };
  'iscsi.target.delete': { params: [id: number, force?: boolean]; response: boolean };
  'iscsi.target.query': { params: QueryParams<IscsiTarget>; response: IscsiTarget[] };
  'iscsi.target.update': { params: [id: number, target: IscsiTargetUpdate]; response: IscsiTarget };
  'iscsi.targetextent.create': { params: [IscsiTargetExtentUpdate]; response: IscsiTargetExtent };
  'iscsi.targetextent.delete': { params: [id: number, force?: boolean]; response: boolean };
  'iscsi.targetextent.query': { params: QueryParams<IscsiTargetExtent>; response: IscsiTargetExtent[] };
  'iscsi.targetextent.update': { params: [id: number, extent: IscsiTargetExtentUpdate]; response: IscsiTargetExtent };
  'iscsi.target.validate_name': { params: string[]; response: null | string };

  // Jbof
  'jbof.licensed': { params: void; response: number };
  'jbof.query': { params: [QueryParams<Jbof>]; response: Jbof[] };
  'jbof.create': { params: [JbofUpdate]; response: Jbof };
  'jbof.update': { params: [id: number, update: JbofUpdate]; response: Jbof };
  'jbof.delete': { params: [id: number, force?: boolean]; response: boolean };

  // Kerberos
  'kerberos.config': { params: void; response: KerberosConfig };
  'kerberos.keytab.create': { params: [KerberosKeytabUpdate]; response: KerberosKeytab };
  'kerberos.keytab.delete': { params: [id: number]; response: boolean };
  'kerberos.keytab.kerberos_principal_choices': { params: void; response: string[] };
  'kerberos.keytab.query': { params: QueryParams<KerberosKeytab>; response: KerberosKeytab[] };
  'kerberos.keytab.update': { params: [id: number, update: KerberosKeytabUpdate]; response: KerberosKeytab };
  'kerberos.realm.create': { params: [KerberosRealmUpdate]; response: KerberosRealm };
  'kerberos.realm.delete': { params: [id: number]; response: boolean };
  'kerberos.realm.query': { params: QueryParams<KerberosRealm>; response: KerberosRealm[] };
  'kerberos.realm.update': { params: [id: number, update: KerberosRealmUpdate]; response: KerberosRealm };
  'kerberos.update': { params: [KerberosConfigUpdate]; response: KerberosConfig };

  // Keychain credential
  'keychaincredential.create': { params: [KeychainCredentialCreate]; response: KeychainCredential };
  'keychaincredential.delete': { params: [id: number]; response: void };
  'keychaincredential.generate_ssh_key_pair': { params: void; response: SshKeyPair };
  'keychaincredential.query': { params: QueryParams<KeychainCredential>; response: KeychainCredential[] };
  'keychaincredential.remote_ssh_host_key_scan': { params: [RemoteSshScanParams]; response: string };
  'keychaincredential.setup_ssh_connection': { params: [SshConnectionSetup]; response: KeychainSshCredentials };
  'keychaincredential.update': { params: [id: number, credential: KeychainCredentialUpdate]; response: KeychainCredential };

  // KMIP
  'kmip.clear_sync_pending_keys': { params: void; response: void };
  'kmip.config': { params: void; response: KmipConfig };
  'kmip.kmip_sync_pending': { params: void; response: boolean };
  'kmip.sync_keys': { params: void; response: void };

  // Docker
  'docker.config': { params: void; response: DockerConfig };
  'docker.status': { params: void; response: DockerStatusData };
  'docker.nvidia_present': { params: void; response: boolean };

  // LDAP
  'ldap.config': { params: void; response: LdapConfig };
  'ldap.schema_choices': { params: void; response: string[] };
  'ldap.ssl_choices': { params: void; response: string[] };

  // Mail
  'mail.config': { params: void; response: MailConfig };
  'mail.local_administrator_email': { params: void; response: string | null };
  'mail.update': { params: [MailConfigUpdate]; response: MailConfig };

  // Network configuration
  'network.configuration.activity_choices': { params: void; response: MapOption[] };
  'network.configuration.config': { params: void; response: NetworkConfiguration };
  'network.configuration.update': { params: [NetworkConfigurationUpdate]; response: NetworkConfiguration };
  'network.general.summary': { params: void; response: NetworkSummary };

  // NFS
  'nfs.add_principal': { params: [AddNfsPrincipal]; response: boolean };
  'nfs.bindip_choices': { params: void; response: Choices };
  'nfs.config': { params: void; response: NfsConfig };
  'nfs.get_nfs3_clients': { params: [params?: QueryParams<Nfs3Session>]; response: Nfs3Session[] };
  'nfs.get_nfs4_clients': { params: [params?: QueryParams<Nfs4Session>]; response: Nfs4Session[] };
  'nfs.update': { params: [NfsConfigUpdate]; response: NfsConfig };

  // Pool
  'pool.attachments': { params: [id: number]; response: PoolAttachment[] };
  'pool.dataset.attachments': { params: [datasetId: string]; response: DatasetAttachment[] };
  'pool.dataset.checksum_choices': { params: void; response: Choices };
  'pool.dataset.compression_choices': { params: void; response: Choices };
  'pool.dataset.create': { params: [DatasetCreate]; response: Dataset };
  'pool.dataset.delete': { params: [path: string, params: { recursive: boolean; force?: boolean }]; response: boolean };
  'pool.dataset.details': { params: void; response: DatasetDetails[] };
  'pool.dataset.encryption_algorithm_choices': { params: void; response: Choices };
  'pool.dataset.export_keys_for_replication': { params: [id: number]; response: unknown };
  'pool.dataset.get_quota': { params: DatasetQuotaQueryParams; response: DatasetQuota[] };
  'pool.dataset.inherit_parent_encryption_properties': { params: [id: string]; response: void };
  'pool.dataset.processes': { params: [datasetId: string]; response: Process[] };
  'pool.dataset.promote': { params: [id: string]; response: void };
  'pool.dataset.query': { params: QueryParams<Dataset, ExtraDatasetQueryOptions>; response: Dataset[] };
  'pool.dataset.recommended_zvol_blocksize': { params: [name: string]; response: DatasetRecordSize };
  'pool.dataset.recordsize_choices': { params: void; response: string[] };
  'pool.dataset.set_quota': { params: [dataset: string, quotas: SetDatasetQuota[]]; response: void };
  'pool.dataset.update': { params: [id: string, update: DatasetUpdate]; response: Dataset };
  'pool.detach': { params: [id: number, params: { label: string }]; response: boolean };
  'pool.filesystem_choices': { params: [DatasetType[]?]; response: string[] };
  'pool.offline': { params: [id: number, params: { label: string }]; response: boolean };
  'pool.online': { params: [id: number, params: { label: string }]; response: boolean };
  'pool.processes': { params: [id: number]; response: Process[] };
  'pool.query': { params: QueryParams<Pool>; response: Pool[] };
  'pool.resilver.config': { params: void; response: ResilverConfig };
  'pool.resilver.update': { params: [ResilverConfigUpdate]; response: ResilverConfig };
  'pool.scrub.create': { params: [CreatePoolScrubTask]; response: PoolScrubTask };
  'pool.scrub.delete': { params: [id: number]; response: boolean };
  'pool.scrub.query': { params: QueryParams<PoolScrubTask>; response: PoolScrubTask[] };
  'pool.scrub.update': { params: [id: number, params: CreatePoolScrubTask]; response: PoolScrubTask };
  'pool.snapshottask.create': { params: [PeriodicSnapshotTaskCreate]; response: PeriodicSnapshotTask };
  'pool.snapshottask.delete': { params: [id: number]; response: boolean };
  'pool.snapshottask.query': { params: QueryParams<PeriodicSnapshotTask>; response: PeriodicSnapshotTask[] };
  'pool.snapshottask.update': { params: [id: number, update: PeriodicSnapshotTaskUpdate]; response: PeriodicSnapshotTask };
  'pool.upgrade': { params: [id: number]; response: boolean };
  'pool.validate_name': { params: string[]; response: boolean | { error: boolean } };

  // Privilege
  'privilege.create': { params: [PrivilegeUpdate]; response: Privilege };
  'privilege.delete': { params: [id: number]; response: boolean };
  'privilege.query': { params: QueryParams<Privilege>; response: Privilege[] };
  'privilege.roles': { params: QueryParams<PrivilegeRole>; response: PrivilegeRole[] };
  'privilege.update': { params: [id: number, update: PrivilegeUpdate]; response: Privilege };

  // RDMA
  'rdma.capable_protocols': { params: []; response: RdmaProtocolName[] };

  // Replication
  'replication.config.config': { params: void; response: ReplicationConfig };
  'replication.config.update': { params: [ReplicationConfigUpdate]; response: ReplicationConfig };
  'replication.count_eligible_manual_snapshots': { params: [CountManualSnapshotsParams]; response: EligibleManualSnapshotsCount };
  'replication.create': { params: [ReplicationCreate]; response: ReplicationTask };
  'replication.delete': { params: [id: number]; response: boolean };
  'replication.list_datasets': { params: [transport: TransportMode, credentials?: number]; response: string[] };
  'replication.list_naming_schemas': { params: void; response: string[] };
  'replication.query': { params: QueryParams<ReplicationTask>; response: ReplicationTask[] };
  'replication.restore': { params: [id: number, params: { name: string; target_dataset: string }]; response: void };
  'replication.target_unmatched_snapshots': { params: TargetUnmatchedSnapshotsParams; response: Record<string, string[]> };
  'replication.update': { params: [id: number, update: Partial<ReplicationCreate>]; response: ReplicationTask };

  // Reporting
  'reporting.exporters.create': { params: [CreateReportingExporter]; response: ReportingExporter };
  'reporting.exporters.delete': { params: [id: number]; response: boolean };
  'reporting.exporters.exporter_schemas': { params: void; response: ReportingExporterSchema[] };
  'reporting.exporters.query': { params: QueryParams<ReportingExporter>; response: ReportingExporter[] };
  'reporting.exporters.update': { params: [number, UpdateReportingExporter]; response: ReportingExporter };
  'reporting.netdata_get_data': { params: ReportingQueryParams; response: ReportingData[] };
  'reporting.netdata_graphs': { params: QueryParams<ReportingGraph>; response: ReportingGraph[] };

  // Rsynctask
  'rsynctask.create': { params: [RsyncTaskUpdate]; response: RsyncTask };
  'rsynctask.delete': { params: [id: number]; response: boolean };
  'rsynctask.query': { params: QueryParams<RsyncTask>; response: RsyncTask[] };
  'rsynctask.update': { params: [id: number, params: RsyncTaskUpdate]; response: RsyncTask };

  // Service
  'service.query': { params: QueryParams<Service>; response: Service[] };
  'service.restart': { params: [ServiceName]; response: boolean };
  'service.start': { params: [ServiceName, { silent: boolean }]; response: boolean };
  'service.stop': {
    params: [ServiceName, { silent: boolean }];
    response: boolean; // False indicates that service has been stopped.
  };
  'service.update': { params: [number | ServiceName, Partial<Service>]; response: number };

  // Sharing
  'sharing.nfs.create': { params: [NfsShareUpdate]; response: NfsShare };
  'sharing.nfs.delete': { params: [id: number]; response: boolean };
  'sharing.nfs.query': { params: QueryParams<NfsShare>; response: NfsShare[] };
  'sharing.nfs.update': { params: [id: number, update: NfsShareUpdate]; response: NfsShare };
  'sharing.smb.create': { params: [SmbShareUpdate]; response: SmbShare };
  'sharing.smb.delete': { params: [id: number]; response: boolean };
  'sharing.smb.getacl': { params: [{ share_name: string }]; response: SmbSharesec };
  'sharing.smb.presets': { params: void; response: SmbPresets };
  'sharing.smb.query': { params: QueryParams<SmbShare>; response: SmbShare[] };
  'sharing.smb.setacl': { params: [{ share_name: string; share_acl: SmbSharesecAce[] }]; response: SmbSharesec };
  'sharing.smb.share_precheck': { params: [{ name: string }]; response: null | { reason: string } };
  'sharing.smb.update': { params: [id: number, update: SmbShareUpdate]; response: SmbShare };

  // SMART
  'smart.config': { params: void; response: SmartConfig };
  'smart.test.create': { params: [SmartTestTaskUpdate]; response: SmartTestTask };
  'smart.test.delete': { params: [id: number]; response: boolean };
  'smart.test.disk_choices': { params: void; response: Choices };
  'smart.test.manual_test': { params: [SmartManualTestParams[]]; response: ManualSmartTest[] };
  'smart.test.query': { params: QueryParams<SmartTestTask>; response: SmartTestTask[] };
  'smart.test.query_for_disk': { params: [disk: string]; response: SmartTestTask[] };
  'smart.test.results': { params: QueryParams<SmartTestResults>; response: SmartTestResults[] };
  'smart.test.update': { params: [id: number, update: SmartTestTaskUpdate]; response: SmartTestTask };
  'smart.update': { params: [SmartConfigUpdate]; response: SmartConfig };

  // SMB
  'smb.bindip_choices': { params: void; response: Choices };
  'smb.config': { params: void; response: SmbConfig };
  'smb.status': { params: [level: SmbInfoLevel, params?: QueryParams<SmbStatus>]; response: SmbStatus[] };
  'smb.unixcharset_choices': { params: void; response: Choices };
  'smb.update': { params: [SmbConfigUpdate]; response: SmbConfig };

  // SNMP
  'snmp.config': { params: void; response: SnmpConfig };
  'snmp.update': { params: [SnmpConfigUpdate]; response: SnmpConfig };

  // SSH
  'ssh.bindiface_choices': { params: void; response: Choices };
  'ssh.config': { params: void; response: SshConfig };
  'ssh.update': { params: [SshConfigUpdate]; response: SshConfig };

  // Static route
  'staticroute.create': { params: [UpdateStaticRoute]; response: StaticRoute };
  'staticroute.delete': { params: [id: number]; response: boolean };
  'staticroute.query': { params: QueryParams<StaticRoute>; response: StaticRoute[] };
  'staticroute.update': { params: [id: number, update: UpdateStaticRoute]; response: StaticRoute };

  // Support
  'support.config': { params: void; response: SupportConfig };
  'support.is_available': { params: void; response: boolean };
  'support.is_available_and_enabled': { params: void; response: boolean };
  'support.update': { params: [SupportConfigUpdate]; response: SupportConfig };
  'support.similar_issues': { params: SimilarIssuesParams; response: SimilarIssue[] };
  'support.attach_ticket_max_size': { params: void; response: number };

  // System
  'system.advanced.config': { params: void; response: AdvancedConfig };
  'system.advanced.sed_global_password': { params: void; response: string };
  'system.advanced.sed_global_password_is_set': { params: void; response: boolean };
  'system.advanced.serial_port_choices': { params: void; response: Choices };
  'system.advanced.syslog_certificate_authority_choices': { params: void; response: Choices };
  'system.advanced.syslog_certificate_choices': { params: void; response: Choices };
  'system.advanced.update': { params: [Partial<AdvancedConfigUpdate>]; response: AdvancedConfig };
  'system.advanced.update_gpu_pci_ids': { params: [isolated_gpu_pci_ids: string[]]; response: void };
  'system.advanced.login_banner': { params: void; response: string };
  'system.boot_id': { params: void; response: string };
  'system.general.config': { params: void; response: SystemGeneralConfig };
  'system.general.kbdmap_choices': { params: void; response: Choices };
  'system.general.language_choices': { params: void; response: Choices };
  'system.general.timezone_choices': { params: void; response: Choices };
  'system.general.ui_address_choices': { params: void; response: Choices };
  'system.general.ui_certificate_choices': { params: void; response: Record<number, string> };
  'system.general.ui_httpsprotocols_choices': { params: void; response: Choices };
  'system.general.ui_restart': { params: void; response: void };
  'system.general.ui_v6address_choices': { params: void; response: Choices };
  'system.general.update': { params: [SystemGeneralConfigUpdate]; response: SystemGeneralConfig };
  'system.host_id': { params: void; response: string };
  'system.info': { params: void; response: SystemInfo };
  'system.license_update': { params: [license: string]; response: void };
  'system.ntpserver.create': { params: [CreateNtpServer]; response: NtpServer };
  'system.ntpserver.delete': { params: [id: number]; response: boolean };
  'system.ntpserver.query': { params: QueryParams<NtpServer>; response: NtpServer[] };
  'system.ntpserver.update': { params: [id: number, params: CreateNtpServer]; response: NtpServer };
  'system.product_type': { params: void; response: ProductType };
  'system.security.config': { params: void; response: SystemSecurityConfig };
  'system.security.info.fips_available': { params: void; response: boolean };
  'system.reboot.info': { params: void; response: SystemRebootInfo };

  // Systemdataset
  'systemdataset.config': { params: void; response: SystemDatasetConfig };
  'systemdataset.pool_choices': { params: void; response: Choices };

  // Truecommand
  'truecommand.config': { params: void; response: TrueCommandConfig };
  'truecommand.update': { params: [UpdateTrueCommand]; response: TrueCommandUpdateResponse };

  // TrueNAS
  'truenas.accept_eula': { params: void; response: void };
  'truenas.get_eula': { params: void; response: string };
  'truenas.is_eula_accepted': { params: void; response: boolean };
  'truenas.is_production': { params: void; response: boolean };
  'truenas.is_ix_hardware': { params: void; response: boolean };
  'truenas.managed_by_truecommand': { params: void; response: boolean };

  // Tunable
  'tunable.query': { params: QueryParams<Tunable>; response: Tunable[] };

  // Update
  'update.check_available': { params: void; response: SystemUpdate };
  'update.get_auto_download': { params: void; response: boolean };
  'update.get_pending': { params: void; response: SystemUpdateChange[] };
  'update.get_trains': { params: void; response: SystemUpdateTrains };
  'update.set_auto_download': { params: [boolean]; response: void };
  'update.set_train': { params: [train: string]; response: void };

  // UPS
  'ups.config': { params: void; response: UpsConfig };
  'ups.driver_choices': { params: void; response: Choices };
  'ups.port_choices': { params: void; response: string[] };
  'ups.update': { params: [UpsConfigUpdate]; response: UpsConfig };

  // User
  'user.create': { params: [UserUpdate]; response: number };
  'user.delete': { params: DeleteUserParams; response: number };
  'user.get_next_uid': { params: void; response: number };
  'user.get_user_obj': { params: [{ username?: string; uid?: number }]; response: DsUncachedUser };
  'user.has_local_administrator_set_up': { params: void; response: boolean };
  'user.query': { params: QueryParams<User>; response: User[] };
  'user.renew_2fa_secret': { params: [string, { interval: number; otp_digits: number }]; response: User };
  'user.set_password': { params: [SetPasswordParams]; response: void };
  'user.setup_local_administrator': { params: [userName: string, password: string, ec2?: { instance_id: string }]; response: void };
  'user.shell_choices': { params: [ids: number[]]; response: Choices };
  'user.update': { params: [id: number, update: UserUpdate]; response: number };

  // Virt
  'virt.instance.query': { params: QueryParams<VirtualizationInstance>; response: VirtualizationInstance[] };
  'virt.instance.device_add': { params: [instanceId: string, device: VirtualizationDevice]; response: true };
  'virt.instance.device_update': { params: [instanceId: string, device: VirtualizationDevice]; response: true };
  'virt.instance.device_delete': { params: [instanceId: string, name: string]; response: true };
  'virt.instance.device_list': { params: [instanceId: string]; response: VirtualizationDevice[] };
  'virt.instance.image_choices': { params: [VirtualizationImageParams]; response: Record<string, VirtualizationImage> };

  'virt.device.disk_choices': { params: []; response: Choices };
  'virt.device.gpu_choices': {
    params: [instanceType: VirtualizationType, gpuType: VirtualizationGpuType];
    response: AvailableGpus;
  };
  'virt.device.usb_choices': { params: []; response: Record<string, AvailableUsb> };
  'virt.device.nic_choices': { params: [nicType: VirtualizationNicType]; response: Record<string, string> };

  'virt.global.bridge_choices': { params: []; response: Choices };
  'virt.global.config': { params: []; response: VirtualizationGlobalConfig };
  'virt.global.get_network': { params: [name: string]; response: VirtualizationNetwork };
  'virt.global.pool_choices': { params: []; response: Choices };

  // VM
  'vm.bootloader_options': { params: void; response: Choices };
  'vm.clone': { params: VmCloneParams; response: boolean };
  'vm.cpu_model_choices': { params: void; response: Choices };
  'vm.create': { params: [VirtualMachineUpdate]; response: VirtualMachine };
  'vm.delete': { params: VmDeleteParams; response: boolean };
  'vm.device.bind_choices': { params: void; response: Choices };
  'vm.device.create': { params: [VmDeviceUpdate]; response: VmDevice };
  'vm.device.delete': { params: [number, VmDeviceDelete?]; response: boolean };
  'vm.device.disk_choices': { params: void; response: Choices };
  'system.advanced.get_gpu_pci_choices': { params: void; response: Choices };
  'vm.device.nic_attach_choices': { params: void; response: Choices };
  'vm.device.passthrough_device_choices': { params: void; response: Record<string, VmPassthroughDeviceChoice> };
  'vm.device.query': { params: QueryParams<VmDevice>; response: VmDevice[] };
  'vm.device.update': { params: [id: number, update: VmDeviceUpdate]; response: VmDevice };
  'vm.device.usb_controller_choices': { params: void; response: Choices };
  'vm.device.usb_passthrough_choices': { params: void; response: Record<string, VmUsbPassthroughDeviceChoice> };
  'vm.get_available_memory': { params: void; response: number };
  'vm.get_display_devices': { params: [id: number]; response: VmDisplayDevice[] };
  'vm.get_display_web_uri': { params: VmDisplayWebUriParams; response: VmDisplayWebUri };
  'vm.maximum_supported_vcpus': { params: void; response: number };
  'vm.port_wizard': { params: void; response: VmPortWizardResult };
  'vm.poweroff': { params: [id: number]; response: void };
  'vm.query': { params: QueryParams<VirtualMachine>; response: VirtualMachine[] };
  'vm.random_mac': { params: void; response: string };
  'vm.resolution_choices': { params: void; response: Choices };
  'vm.start': { params: [id: number, params?: { overcommit?: boolean }]; response: void };
  'vm.update': { params: [id: number, update: VirtualMachineUpdate]; response: VirtualMachine };
  'vm.virtualization_details': { params: void; response: VirtualizationDetails };

  // Vmware
  'vmware.create': { params: [VmwareSnapshotUpdate]; response: VmwareSnapshot };
  'vmware.dataset_has_vms': { params: DatasetHasVmsQueryParams; response: boolean };
  'vmware.delete': { params: [id: number]; response: boolean };
  'vmware.match_datastores_with_datasets': { params: [MatchDatastoresWithDatasetsParams]; response: MatchDatastoresWithDatasets };
  'vmware.query': { params: QueryParams<VmwareSnapshot>; response: VmwareSnapshot[] };
  'vmware.update': { params: [id: number, update: VmwareSnapshotUpdate]; response: VmwareSnapshot };

  // WebUI main
  // TODO: Incorrect response definition here or for system.info.
  'webui.main.dashboard.sys_info': { params: void; response: SystemInfo };

  // WebUI Crypto
  'webui.crypto.certificate_profiles': { params: void; response: CertificateProfiles };
  'webui.crypto.csr_profiles': { params: void; response: CertificateProfiles };
  'webui.crypto.get_certificate_domain_names': { params: [number]; response: string[] };
  'webui.crypto.certificateauthority_profiles': { params: void; response: CertificateProfiles };

  // ZFS
  'zfs.snapshot.clone': { params: [CloneZfsSnapshot]; response: boolean };
  'zfs.snapshot.create': { params: [CreateZfsSnapshot]; response: ZfsSnapshot };
  'zfs.snapshot.delete': { params: [id: string, params?: { defer?: boolean; recursive?: boolean }]; response: boolean };
  'zfs.snapshot.hold': { params: [string]; response: void };
  'zfs.snapshot.query': { params: QueryParams<ZfsSnapshot>; response: ZfsSnapshot[] };
  'zfs.snapshot.release': { params: [string]; response: void };
  'zfs.snapshot.rollback': { params: ZfsRollbackParams; response: void };
}

/**
 * Prefer typing like this:
 * ```
 * queryCall: 'user.query' as const
 * ```
 * instead of using ApiMethod.
 */
export type ApiCallMethod = keyof ApiCallDirectory;

export type ApiCallParams<T extends ApiCallMethod> = ApiCallDirectory[T]['params'];
export type ApiCallResponse<T extends ApiCallMethod> = ApiCallDirectory[T]['response'];
export type ApiCallResponseType<T extends ApiCallMethod> = ApiCallDirectory[T]['response'] extends (infer U)[] ? U : never;

export type QueryMethods = { [T in ApiCallMethod]: T extends `${string}.query` ? T : never }[ApiCallMethod];
