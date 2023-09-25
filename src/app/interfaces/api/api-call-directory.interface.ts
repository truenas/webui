import { DefaultAclType } from 'app/enums/acl-type.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { DatasetRecordSize, DatasetType } from 'app/enums/dataset.enum';
import { DeviceType } from 'app/enums/device-type.enum';
import { EnclosureSlotStatus } from 'app/enums/enclosure-slot-status.enum';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import {
  Acl,
  AclQueryParams,
  AclTemplateByPath,
  AclTemplateByPathParams,
  AclTemplateCreateParams,
  AclTemplateCreateResponse,
  NfsAclItem,
  PosixAclItem,
} from 'app/interfaces/acl.interface';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { ActiveDirectoryUpdate } from 'app/interfaces/active-directory.interface';
import { AdvancedConfig, AdvancedConfigUpdate } from 'app/interfaces/advanced-config.interface';
import { AlertService, AlertServiceEdit } from 'app/interfaces/alert-service.interface';
import {
  Alert, AlertCategory, AlertClasses, AlertClassesUpdate,
} from 'app/interfaces/alert.interface';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { ApiKey, CreateApiKeyRequest, UpdateApiKeyRequest } from 'app/interfaces/api-key.interface';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { AuthSession } from 'app/interfaces/auth-session.interface';
import { CheckUserQuery } from 'app/interfaces/auth.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import {
  Bootenv,
  CreateBootenvParams,
  SetBootenvAttributeParams,
  UpdateBootenvParams,
} from 'app/interfaces/bootenv.interface';
import {
  Catalog, CatalogApp,
  CatalogItems,
  CatalogItemsQueryParams,
  CatalogQueryParams,
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
import {
  ChartReleaseEvent,
} from 'app/interfaces/chart-release-event.interface';
import {
  ChartRelease,
  ChartReleaseQueryParams,
  ChartReleaseUpgradeParams,
} from 'app/interfaces/chart-release.interface';
import { Choices } from 'app/interfaces/choices.interface';
import {
  CloudSyncDirectoryListing,
  CloudSyncListDirectoryParams,
  CloudSyncTask,
  CloudSyncTaskUpdate,
} from 'app/interfaces/cloud-sync-task.interface';
import {
  CloudsyncBucket,
  CloudsyncCredential,
  CloudsyncCredentialUpdate,
  CloudsyncCredentialVerify, CloudsyncCredentialVerifyResult, CloudsyncOneDriveDrive, CloudsyncOneDriveParams,
} from 'app/interfaces/cloudsync-credential.interface';
import { CloudsyncProvider, CloudsyncRestoreParams } from 'app/interfaces/cloudsync-provider.interface';
import { ContainerConfig, ContainerConfigUpdate } from 'app/interfaces/container-config.interface';
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
import {
  DatasetEncryptedRootKeys,
} from 'app/interfaces/dataset-encryption-summary.interface';
import { DatasetHasVmsQueryParams } from 'app/interfaces/dataset-has-vms-query-params.interface';
import { DatasetQuota, DatasetQuotaQueryParams, SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import {
  Dataset, DatasetCreate, DatasetDetails, DatasetUpdate, ExtraDatasetQueryOptions,
} from 'app/interfaces/dataset.interface';
import { Device } from 'app/interfaces/device.interface';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import {
  AuthenticatorSchema,
  CreateDnsAuthenticator,
  DnsAuthenticator, UpdateDnsAuthenticator,
} from 'app/interfaces/dns-authenticator.interface';
import { DsUncachedGroup, DsUncachedUser } from 'app/interfaces/ds-cache.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import {
  FailoverConfig,
  FailoverRemoteCall,
  FailoverUpdate,
} from 'app/interfaces/failover.interface';
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
  Ipmi, IpmiChassis, IpmiUpdate,
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
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { KubernetesStatusData } from 'app/interfaces/kubernetes-status-data.interface';
import { LdapConfig, LdapConfigUpdate, LdapConfigUpdateResult } from 'app/interfaces/ldap-config.interface';
import { LldpConfig, LldpConfigUpdate } from 'app/interfaces/lldp-config.interface';
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
import { NfsShare, NfsShareUpdate } from 'app/interfaces/nfs-share.interface';
import { CreateNtpServer, NtpServer } from 'app/interfaces/ntp-server.interface';
import { MapOption } from 'app/interfaces/option.interface';
import {
  PeriodicSnapshotTask,
  PeriodicSnapshotTaskCreate,
  PeriodicSnapshotTaskUpdate,
} from 'app/interfaces/periodic-snapshot-task.interface';
import { DatasetAttachment, PoolAttachment } from 'app/interfaces/pool-attachment.interface';
import { CreatePoolScrubTask, PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
import { PoolUnlockQuery, PoolUnlockResult } from 'app/interfaces/pool-unlock-query.interface';
import {
  Pool, PoolInstance, PoolInstanceParams,
} from 'app/interfaces/pool.interface';
import { Process } from 'app/interfaces/process.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { ReplicationConfigUpdate } from 'app/interfaces/replication-config-update.interface';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import {
  ReplicationCreate,
  ReplicationTask,
} from 'app/interfaces/replication-task.interface';
import { ReportingGraph } from 'app/interfaces/reporting-graph.interface';
import {
  ReportingConfig,
  ReportingConfigUpdate,
  ReportingData,
  ReportingQueryParams,
} from 'app/interfaces/reporting.interface';
import { ResilverConfig, ResilverConfigUpdate } from 'app/interfaces/resilver-config.interface';
import { RsyncConfig, RsyncConfigUpdate } from 'app/interfaces/rsync-config.interface';
import { RsyncModule, RsyncModuleCreate } from 'app/interfaces/rsync-module.interface';
import { RsyncTask, RsyncTaskUpdate } from 'app/interfaces/rsync-task.interface';
import { Sensor } from 'app/interfaces/sensor.interface';
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
import { SnmpConfig, SnmpConfigUpdate } from 'app/interfaces/snmp-config.interface';
import { SshConfig, SshConfigUpdate } from 'app/interfaces/ssh-config.interface';
import {
  RemoteSshScanParams,
  SshConnectionSetup,
  SshSemiAutomaticSetup,
} from 'app/interfaces/ssh-connection-setup.interface';
import { StaticRoute, UpdateStaticRoute } from 'app/interfaces/static-route.interface';
import {
  Disk, ExtraDiskQueryOptions, DiskTemperatures, DiskTemperatureAgg, DiskUpdate, UnusedDisk,
} from 'app/interfaces/storage.interface';
import {
  FetchSupportParams,
  SupportConfig, SupportConfigUpdate,
} from 'app/interfaces/support.interface';
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
  TrueCommandConfig,
  TrueCommandConnectionState, TrueCommandUpdateResponse,
  UpdateTrueCommand,
} from 'app/interfaces/true-command-config.interface';
import { Tunable } from 'app/interfaces/tunable.interface';
import { TwoFactorConfig, TwoFactorConfigUpdate } from 'app/interfaces/two-factor-config.interface';
import { UpsConfig, UpsConfigUpdate } from 'app/interfaces/ups-config.interface';
import { DeleteUserParams, User, UserUpdate } from 'app/interfaces/user.interface';
import {
  VirtualizationDetails,
  VirtualMachine, VirtualMachineUpdate, VmCloneParams, VmDeleteParams, VmDisplayWebUri,
  VmDisplayWebUriParams, VmPortWizardResult,
} from 'app/interfaces/virtual-machine.interface';
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

/**
 * API definitions for `call` methods.
 * For jobs see ApiJobDirectory.
 * For events from `subscribed` see ApiEventDirectory.
 */
export interface ApiCallDirectory {
  // Active Directory
  'activedirectory.config': { params: void; response: ActiveDirectoryConfig };
  'activedirectory.update': { params: [ActiveDirectoryUpdate]; response: ActiveDirectoryConfig };
  'activedirectory.nss_info_choices': { params: void; response: string[] };

  // Acme
  'acme.dns.authenticator.query': { params: void; response: DnsAuthenticator[] };
  'acme.dns.authenticator.create': { params: [CreateDnsAuthenticator]; response: DnsAuthenticator };
  'acme.dns.authenticator.update': { params: [number, UpdateDnsAuthenticator]; response: DnsAuthenticator };
  'acme.dns.authenticator.delete': { params: [id: number]; response: boolean };
  'acme.dns.authenticator.authenticator_schemas': { params: void; response: AuthenticatorSchema[] };

  // Alert
  'alert.list': { params: void; response: Alert[] };
  'alert.dismiss': { params: string[]; response: void };
  'alert.restore': { params: string[]; response: void };
  'alert.list_policies': { params: void; response: AlertPolicy[] };
  'alert.list_categories': { params: void; response: AlertCategory[] };

  // Alert Classes
  'alertclasses.config': { params: void; response: AlertClasses };
  'alertclasses.update': { params: [AlertClassesUpdate]; response: AlertClasses };

  // Alert Service
  'alertservice.update': { params: [id: number, update: AlertServiceEdit]; response: AlertService };
  'alertservice.create': { params: [AlertServiceEdit]; response: AlertService };
  'alertservice.query': { params: QueryParams<AlertService>; response: AlertService[] };
  'alertservice.test': { params: [AlertServiceEdit]; response: boolean };
  'alertservice.delete': { params: number; response: boolean };

  // Api Key
  'api_key.create': { params: [CreateApiKeyRequest]; response: ApiKey };
  'api_key.update': { params: UpdateApiKeyRequest; response: ApiKey };
  'api_key.delete': { params: [id: string]; response: boolean };
  'api_key.query': { params: QueryParams<ApiKey>; response: ApiKey[] };

  // Auth
  'auth.check_user': { params: CheckUserQuery; response: boolean };
  'auth.me': { params: void; response: DsUncachedUser };
  'auth.set_attribute': { params: [key: string, value: unknown]; response: void };

  'auth.twofactor.update': { params: [TwoFactorConfigUpdate]; response: TwoFactorConfig };
  'auth.twofactor.provisioning_uri': { params: void; response: string };
  'auth.two_factor_auth': { params: [string, string]; response: boolean };
  'auth.twofactor.renew_secret': { params: void; response: boolean };
  'auth.twofactor.config': { params: void; response: TwoFactorConfig };
  'auth.sessions': { params: QueryParams<AuthSession>; response: AuthSession[] };
  'auth.terminate_session': { params: [id: string]; response: void };
  'auth.terminate_other_sessions': { params: void; response: void };

  // Boot
  'boot.set_scrub_interval': { params: [number]; response: number };
  'boot.get_state': { params: void; response: PoolInstance };
  'boot.detach': { params: [disk: string]; response: void };

  // Bootenv
  'bootenv.create': { params: CreateBootenvParams; response: string };
  'bootenv.update': { params: UpdateBootenvParams; response: string };
  'bootenv.set_attribute': { params: SetBootenvAttributeParams; response: boolean };
  'bootenv.activate': { params: [string]; response: boolean };
  'bootenv.query': { params: QueryParams<Bootenv>; response: Bootenv[] };

  // App
  'app.categories': { params: void; response: string[] };
  'app.available': { params: QueryParams<AvailableApp>; response: AvailableApp[] };
  'app.similar': { params: [app_name: string, catalog: string, train: string]; response: AvailableApp[] };
  'app.latest': { params: QueryParams<AvailableApp>; response: AvailableApp[] };

  // Catalog
  'catalog.query': { params: CatalogQueryParams; response: Catalog[] };
  'catalog.update': { params: [id: string, update: CatalogUpdate]; response: Catalog };
  'catalog.delete': { params: [name: string]; response: boolean };
  'catalog.items': { params: [label: string, params?: CatalogItemsQueryParams]; response: CatalogItems };
  'catalog.get_item_details': { params: [name: string, params: GetItemDetailsParams]; response: CatalogApp };

  // Certificate
  'certificate.query': { params: QueryParams<Certificate>; response: Certificate[] };
  'certificate.ec_curve_choices': { params: void; response: Choices };
  'certificate.country_choices': { params: void; response: Choices };
  'certificate.extended_key_usage_choices': { params: void; response: ExtendedKeyUsageChoices };
  'certificate.profiles': { params: void; response: CertificateProfiles };
  'certificate.acme_server_choices': { params: void; response: Choices };
  'certificate.get_domain_names': { params: [number]; response: string[] };

  // Certificate Authority
  'certificateauthority.create': { params: [CertificateAuthorityUpdate]; response: CertificateAuthority };
  'certificateauthority.query': { params: QueryParams<CertificateAuthority>; response: CertificateAuthority[] };
  'certificateauthority.update': { params: [number, Partial<CertificateAuthorityUpdate>]; response: CertificateAuthority };
  'certificateauthority.delete': { params: [id: number]; response: boolean };
  'certificateauthority.profiles': { params: void; response: CertificateProfiles };
  'certificateauthority.ca_sign_csr': { params: [CertificateAuthoritySignRequest]; response: CertificateAuthority };

  // Chart
  'chart.release.pod_logs_choices': { params: [string]; response: Record<string, string[]> };
  'chart.release.query': { params: ChartReleaseQueryParams; response: ChartRelease[] };
  'chart.release.get_chart_releases_using_chart_release_images': { params: [name: string]; response: Choices };
  'chart.release.pod_console_choices': { params: [string]; response: Record<string, string[]> };
  'chart.release.nic_choices': { params: void; response: Choices };
  'chart.release.events': { params: [name: string]; response: ChartReleaseEvent[] };
  'chart.release.upgrade_summary': { params: ChartReleaseUpgradeParams; response: UpgradeSummary };

  // CRON
  'cronjob.run': { params: [id: number]; response: void };
  'cronjob.query': { params: QueryParams<Cronjob>; response: Cronjob[] };
  'cronjob.delete': { params: [id: number]; response: boolean };
  'cronjob.create': { params: [CronjobUpdate]; response: Cronjob };
  'cronjob.update': { params: [id: number, update: CronjobUpdate]; response: Cronjob };

  // Core
  'core.download': { params: CoreDownloadQuery; response: CoreDownloadResponse };
  'core.get_jobs': { params: QueryParams<Job>; response: Job[] };
  'core.job_abort': { params: [jobId: number]; response: void };
  'core.resize_shell': { params: ResizeShellRequest; response: void };

  // Cloudsync
  'cloudsync.providers': { params: void; response: CloudsyncProvider[] };
  'cloudsync.credentials.query': { params: QueryParams<CloudsyncCredential>; response: CloudsyncCredential[] };
  'cloudsync.credentials.create': { params: [CloudsyncCredentialUpdate]; response: CloudsyncCredential };
  'cloudsync.credentials.update': {
    params: [id: number, update: CloudsyncCredentialUpdate];
    response: CloudsyncCredential;
  };
  'cloudsync.create_bucket': { params: [number, string]; response: void };
  'cloudsync.credentials.delete': { params: [id: number]; response: boolean };
  'cloudsync.credentials.verify': { params: [CloudsyncCredentialVerify]; response: CloudsyncCredentialVerifyResult };
  'cloudsync.onedrive_list_drives': { params: [CloudsyncOneDriveParams]; response: CloudsyncOneDriveDrive[] };
  'cloudsync.list_buckets': { params: [id: number]; response: CloudsyncBucket[] };
  'cloudsync.list_directory': { params: [CloudSyncListDirectoryParams]; response: CloudSyncDirectoryListing[] };
  'cloudsync.update': { params: [id: number, task: CloudSyncTaskUpdate]; response: CloudSyncTask };
  'cloudsync.create': { params: [CloudSyncTaskUpdate]; response: CloudSyncTask };
  'cloudsync.abort': { params: [id: number]; response: boolean };
  'cloudsync.restore': { params: CloudsyncRestoreParams; response: void };
  'cloudsync.query': { params: QueryParams<CloudSyncTask>; response: CloudSyncTask[] };
  'cloudsync.delete': { params: [id: number]; response: boolean };

  // Container
  'container.config': { params: void; response: ContainerConfig };
  'container.update': { params: [ContainerConfigUpdate]; response: ContainerConfig };
  'container.image.query': { params: QueryParams<ContainerImage>; response: ContainerImage[] };
  'container.image.delete': { params: DeleteContainerImageParams; response: void };

  // Cluster
  'cluster.utils.is_clustered': { params: void; response: boolean };

  // Device
  'device.get_info': { params: [DeviceType]; response: Device[] };

  // Disk
  'disk.query': { params: QueryParams<Disk, ExtraDiskQueryOptions>; response: Disk[] };
  'disk.update': { params: [id: string, update: DiskUpdate]; response: Disk };
  'disk.get_unused': { params: [joinPartitions?: boolean]; response: UnusedDisk[] };
  'disk.temperatures': { params: [disks: string[]]; response: DiskTemperatures };
  'disk.temperature_agg': { params: [disks: string[], days: number]; response: DiskTemperatureAgg };
  'disk.temperature_alerts': { params: [disks: string[]]; response: Alert[] };

  // Directory Services
  'directoryservices.get_state': { params: void; response: DirectoryServicesState };

  // Enclosure
  'enclosure.query': { params: void; response: Enclosure[] };
  'enclosure.update': { params: [enclosureId: string, update: { label: string }]; response: Enclosure };
  'enclosure.set_slot_status': { params: [id: string, slot: number, status: EnclosureSlotStatus ]; response: void };

  // Filesystem
  'filesystem.acl_is_trivial': {
    params: [string];
    /**
     * Returns True if the ACL can be fully expressed as a file mode without losing any access rules,
     * or if the path does not support NFSv4 ACLs (for example a path on a tmpfs filesystem).
     */
    response: boolean;
  };
  'filesystem.listdir': { params: ListdirQueryParams; response: FileRecord[] };
  'filesystem.stat': { params: [path: string]; response: FileSystemStat };
  'filesystem.default_acl_choices': { params: [path: string]; response: DefaultAclType[] };
  'filesystem.get_default_acl': { params: [DefaultAclType]; response: NfsAclItem[] | PosixAclItem[] };
  'filesystem.statfs': { params: [path: string]; response: Statfs };
  'filesystem.getacl': { params: AclQueryParams; response: Acl };
  'filesystem.acltemplate.by_path': { params: [AclTemplateByPathParams]; response: AclTemplateByPath[] };
  'filesystem.acltemplate.create': { params: [AclTemplateCreateParams]; response: AclTemplateCreateResponse };
  'filesystem.acltemplate.delete': { params: [id: number]; response: boolean };

  // Failover
  'failover.become_passive': { params: void; response: void };
  'failover.licensed': { params: void; response: boolean };
  'failover.upgrade_pending': { params: void; response: boolean };
  'failover.sync_from_peer': { params: void; response: void };
  'failover.status': { params: void; response: FailoverStatus };
  'failover.update': { params: [FailoverUpdate]; response: FailoverConfig };
  'failover.force_master': { params: void; response: boolean };
  'failover.call_remote': { params: FailoverRemoteCall; response: unknown };
  'failover.get_ips': { params: void; response: string[] };
  'failover.node': { params: void; response: string };
  'failover.disabled.reasons': { params: void; response: FailoverDisabledReason[] };
  'failover.config': { params: void; response: FailoverConfig };
  'failover.sync_to_peer': { params: [{ reboot?: boolean }]; response: void };

  // Keychain Credential
  'keychaincredential.create': { params: [KeychainCredentialCreate]; response: KeychainCredential };
  'keychaincredential.query': { params: QueryParams<KeychainCredential>; response: KeychainCredential[] };
  'keychaincredential.update': {
    params: [id: number, credential: KeychainCredentialUpdate];
    response: KeychainCredential;
  };
  'keychaincredential.generate_ssh_key_pair': { params: void; response: SshKeyPair };
  'keychaincredential.remote_ssh_host_key_scan': { params: [RemoteSshScanParams]; response: string };
  'keychaincredential.delete': { params: [id: number]; response: void };
  'keychaincredential.remote_ssh_semiautomatic_setup': {
    params: [SshSemiAutomaticSetup];
    response: KeychainSshCredentials;
  };
  'keychaincredential.setup_ssh_connection': { params: [SshConnectionSetup]; response: KeychainSshCredentials };

  // Kubernetes
  'kubernetes.config': { params: void; response: KubernetesConfig };
  'kubernetes.bindip_choices': { params: void; response: Choices };
  'kubernetes.status': { params: void; response: KubernetesStatusData };

  // Mail
  'mail.config': { params: void; response: MailConfig };
  'mail.update': { params: [MailConfigUpdate]; response: MailConfig };
  'mail.local_administrator_email': { params: void; response: string | null };

  // idmap
  'idmap.backend_options': { params: void; response: IdmapBackendOptions };
  'idmap.query': { params: QueryParams<Idmap>; response: Idmap[] };
  'idmap.create': { params: [IdmapUpdate]; response: Idmap };
  'idmap.update': { params: [id: number, update: IdmapUpdate]; response: Idmap };
  'idmap.delete': { params: [id: number]; response: boolean };

  // Interface
  'interface.websocket_local_ip': { params: void; response: string };
  'interface.commit': { params: [{ checkin_timeout: number }]; response: void };
  'interface.services_restarted_on_sync': { params: void; response: ServiceRestartedOnNetworkSync[] };
  'interface.rollback': { params: void; response: void };
  'interface.bridge_members_choices': { params: [id: string]; response: Choices };
  'interface.lag_supported_protocols': { params: void; response: string[] };
  'interface.lag_ports_choices': { params: [id: string]; response: Choices };
  'interface.vlan_parent_interface_choices': { params: void; response: Choices };
  'interface.query': { params: QueryParams<NetworkInterface>; response: NetworkInterface[] };
  'interface.create': { params: [NetworkInterfaceCreate]; response: NetworkInterface };
  'interface.update': { params: [id: string, update: NetworkInterfaceUpdate]; response: NetworkInterface };
  'interface.delete': { params: [id: string]; response: string };
  'interface.has_pending_changes': { params: void; response: boolean };
  'interface.checkin_waiting': { params: void; response: number | null };
  'interface.checkin': { params: void; response: void };
  'interface.xmit_hash_policy_choices': { params: void; response: Choices };
  'interface.lacpdu_rate_choices': { params: void; response: Choices };
  'interface.default_route_will_be_removed': { params: void; response: boolean };
  'interface.save_default_route': { params: string[]; response: void };
  'interface.cancel_rollback': { params: void; response: void };

  // iSCSI
  'iscsi.initiator.query': { params: QueryParams<IscsiInitiatorGroup>; response: IscsiInitiatorGroup[] };
  'iscsi.initiator.delete': { params: [id: number]; response: boolean };
  'iscsi.target.query': { params: QueryParams<IscsiTarget>; response: IscsiTarget[] };
  'iscsi.extent.disk_choices': { params: void; response: Choices };
  'iscsi.extent.query': { params: QueryParams<IscsiExtent>; response: IscsiExtent[] };
  'iscsi.extent.create': { params: [IscsiExtentUpdate]; response: IscsiExtent };
  'iscsi.extent.update': { params: [id: number, update: IscsiExtentUpdate]; response: IscsiExtentUpdate };
  'iscsi.extent.delete': { params: [id: number, remove: boolean, force: boolean]; response: boolean };
  'iscsi.auth.query': { params: QueryParams<IscsiAuthAccess>; response: IscsiAuthAccess[] };
  'iscsi.auth.delete': { params: [id: number]; response: boolean };
  'iscsi.global.sessions': { params: QueryParams<IscsiGlobalSession>; response: IscsiGlobalSession[] };
  'iscsi.global.config': { params: void; response: IscsiGlobalConfig };
  'iscsi.global.update': { params: [IscsiGlobalConfigUpdate]; response: IscsiGlobalConfig };
  'iscsi.targetextent.create': { params: [IscsiTargetExtentUpdate]; response: IscsiTargetExtent };
  'iscsi.target.validate_name': { params: [string]; response: string };
  'iscsi.targetextent.query': { params: QueryParams<IscsiTargetExtent>; response: IscsiTargetExtent[] };
  'iscsi.targetextent.update': { params: [id: number, extent: IscsiTargetExtentUpdate]; response: IscsiTargetExtent };
  'iscsi.targetextent.delete': { params: [id: number, force?: boolean]; response: boolean };
  'iscsi.auth.update': { params: [id: number, auth: IscsiAuthAccessUpdate]; response: IscsiAuthAccess };
  'iscsi.auth.create': { params: [IscsiAuthAccessUpdate]; response: IscsiAuthAccess };
  'iscsi.initiator.create': { params: [IscsiInitiatorGroupUpdate]; response: IscsiInitiatorGroup };
  'iscsi.initiator.update': {
    params: [id: number, initiator: IscsiInitiatorGroupUpdate];
    response: IscsiInitiatorGroup;
  };
  'iscsi.portal.create': { params: [IscsiPortalUpdate]; response: IscsiPortal };
  'iscsi.portal.update': { params: [id: number, target: IscsiPortalUpdate]; response: IscsiPortal };
  'iscsi.portal.listen_ip_choices': { params: void; response: Choices };
  'iscsi.portal.query': { params: QueryParams<IscsiPortal>; response: IscsiPortal[] };
  'iscsi.portal.delete': { params: [number]; response: boolean };
  'iscsi.target.update': { params: [id: number, target: IscsiTargetUpdate]; response: IscsiTarget };
  'iscsi.target.create': { params: [IscsiTargetUpdate]; response: IscsiTarget };
  'iscsi.target.delete': { params: [id: number, force?: boolean]; response: boolean };

  // IPMI
  'ipmi.is_loaded': { params: void; response: boolean };
  'ipmi.lan.update': { params: [id: number, update: IpmiUpdate]; response: Ipmi };
  'ipmi.lan.query': { params: QueryParams<Ipmi>; response: Ipmi[] };

  // IPMI Chassis
  'ipmi.chassis.identify': { params: [OnOff]; response: void };
  'ipmi.chassis.info': { params: void; response: IpmiChassis };

  // Group
  'group.query': { params: QueryParams<Group>; response: Group[] };
  'group.create': { params: [CreateGroup]; response: number };
  'group.update': { params: [number, UpdateGroup]; response: void };
  'group.delete': { params: DeleteGroupParams; response: number };
  'group.get_group_obj': { params: [{ groupname?: string; gid?: number }]; response: DsUncachedGroup };
  'group.get_next_gid': { params: void; response: number };

  // Network
  'network.general.summary': { params: void; response: NetworkSummary };
  'network.configuration.activity_choices': { params: void; response: MapOption[] };
  'network.configuration.update': { params: [NetworkConfigurationUpdate]; response: NetworkConfiguration };
  'network.configuration.config': { params: void; response: NetworkConfiguration };

  // Kerberos
  'kerberos.realm.query': { params: QueryParams<KerberosRealm>; response: KerberosRealm[] };
  'kerberos.realm.create': { params: [KerberosRealmUpdate]; response: KerberosRealm };
  'kerberos.realm.update': { params: [id: number, update: KerberosRealmUpdate]; response: KerberosRealm };
  'kerberos.realm.delete': { params: [id: number]; response: boolean };
  'kerberos.keytab.has_nfs_principal': { params: void; response: boolean };
  'kerberos.config': { params: void; response: KerberosConfig };
  'kerberos.update': { params: [KerberosConfigUpdate]; response: KerberosConfig };
  'kerberos.keytab.kerberos_principal_choices': { params: void; response: string[] };
  'kerberos.keytab.create': { params: [KerberosKeytabUpdate]; response: KerberosKeytab };
  'kerberos.keytab.update': { params: [id: number, update: KerberosKeytabUpdate]; response: KerberosKeytab };
  'kerberos.keytab.query': { params: QueryParams<KerberosKeytab>; response: KerberosKeytab[] };
  'kerberos.keytab.delete': { params: [id: number]; response: boolean };

  // KMIP
  'kmip.config': { params: void; response: KmipConfig };
  'kmip.kmip_sync_pending': { params: void; response: boolean };
  'kmip.sync_keys': { params: void; response: void };
  'kmip.clear_sync_pending_keys': { params: void; response: void };

  // Ldap
  'ldap.ssl_choices': { params: void; response: string[] };
  'ldap.update': { params: [LdapConfigUpdate]; response: LdapConfigUpdateResult };
  'ldap.schema_choices': { params: void; response: string[] };
  'ldap.config': { params: void; response: LdapConfig };

  // LLDP
  'lldp.country_choices': { params: void; response: Choices };
  'lldp.update': { params: [LldpConfigUpdate]; response: LldpConfig };
  'lldp.config': { params: void; response: LldpConfig };

  // NFS
  'nfs.bindip_choices': { params: void; response: Choices };
  'nfs.add_principal': { params: [AddNfsPrincipal]; response: boolean };
  'nfs.config': { params: void; response: NfsConfig };
  'nfs.update': { params: [NfsConfigUpdate]; response: NfsConfig };

  // Pool
  'pool.attachments': { params: [id: number]; response: PoolAttachment[] };
  'pool.dataset.attachments': { params: [datasetId: string]; response: DatasetAttachment[] };
  'pool.dataset.compression_choices': { params: void; response: Choices };
  'pool.dataset.checksum_choices': { params: void; response: Choices };
  'pool.dataset.create': { params: [DatasetCreate]; response: Dataset };
  'pool.dataset.delete': { params: [path: string, params: { recursive: boolean; force?: boolean }]; response: boolean };
  'pool.dataset.encryption_algorithm_choices': { params: void; response: Choices };
  'pool.dataset.get_instance': { params: [path: string]; response: DatasetDetails };
  'pool.dataset.get_quota': { params: DatasetQuotaQueryParams; response: DatasetQuota[] };
  'pool.dataset.inherit_parent_encryption_properties': { params: [id: string]; response: void };
  'pool.dataset.path_in_locked_datasets': { params: [path: string]; response: boolean };
  'pool.dataset.processes': { params: [datasetId: string]; response: Process[] };
  'pool.dataset.promote': { params: [id: string]; response: void };
  'pool.dataset.query': { params: QueryParams<Dataset, ExtraDatasetQueryOptions>; response: Dataset[] };
  'pool.dataset.details': { params: void; response: DatasetDetails[] };
  'pool.dataset.query_encrypted_roots_keys': { params: void; response: DatasetEncryptedRootKeys };
  'pool.dataset.recommended_zvol_blocksize': { params: [name: string]; response: DatasetRecordSize };
  'pool.dataset.set_quota': { params: [dataset: string, quotas: SetDatasetQuota[]]; response: void };
  'pool.dataset.unlock_services_restart_choices': { params: [id: string]; response: Choices };
  'pool.dataset.update': { params: [id: string, update: DatasetUpdate]; response: Dataset };
  'pool.dataset.recordsize_choices': { params: void; response: string[] };
  'pool.detach': { params: [id: number, params: { label: string }]; response: boolean };
  'pool.download_encryption_key': { params: [volumeId: number, fileName?: string]; response: string };
  'pool.filesystem_choices': { params: [DatasetType[]?]; response: string[] };
  'pool.get_disks': { params: [ids: string[]]; response: string[] };
  'pool.is_upgraded': { params: [poolId: number]; response: boolean };
  'pool.offline': { params: [id: number, params: { label: string }]; response: boolean };
  'pool.online': { params: [id: number, params: { label: string }]; response: boolean };
  'pool.passphrase': { params: [number, { passphrase: string; admin_password: string }]; response: void };
  'pool.processes': { params: [id: number]; response: Process[] };
  'pool.query': { params: QueryParams<Pool>; response: Pool[] };
  'pool.recoverykey_rm': { params: [number, { admin_password: string }]; response: void };
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
  'pool.unlock': { params: PoolUnlockQuery; response: PoolUnlockResult };
  'pool.unlock_services_restart_choices': { params: [id: number]; response: Choices };
  'pool.upgrade': { params: [id: number]; response: boolean };
  'pool.get_instance_by_name': { params: PoolInstanceParams; response: PoolInstance };
  'pool.validate_name': { params: string[]; response: boolean | { error: boolean } };

  // Replication
  'replication.list_datasets': { params: [transport: TransportMode, credentials?: number]; response: string[] };
  'replication.create': { params: [ReplicationCreate]; response: ReplicationTask };
  'replication.query': { params: QueryParams<ReplicationTask>; response: ReplicationTask[] };
  'pool.dataset.export_keys_for_replication': { params: [id: number]; response: unknown };
  'replication.restore': { params: [id: number, params: { name: string; target_dataset: string }]; response: void };
  'replication.delete': { params: [id: number]; response: boolean };
  'replication.count_eligible_manual_snapshots': { params: [CountManualSnapshotsParams]; response: EligibleManualSnapshotsCount };
  'replication.list_naming_schemas': { params: void; response: string[] };
  'replication.target_unmatched_snapshots': {
    params: TargetUnmatchedSnapshotsParams;
    response: { [dataset: string]: string[] };
  };
  'replication.update': { params: [id: number, update: Partial<ReplicationCreate>]; response: ReplicationTask };

  // Rsync
  'rsynctask.query': { params: QueryParams<RsyncTask>; response: RsyncTask[] };
  'rsynctask.create': { params: [RsyncTaskUpdate]; response: RsyncTask };
  'rsynctask.update': { params: [id: number, params: RsyncTaskUpdate]; response: RsyncTask };
  'rsynctask.delete': { params: [id: number]; response: boolean };

  // Rsyncd
  'rsyncd.update': { params: [RsyncConfigUpdate]; response: RsyncConfig };
  'rsyncd.config': { params: void; response: RsyncConfig };

  // Rsyncmod
  'rsyncmod.query': { params: QueryParams<RsyncModule>; response: RsyncModule[] };
  'rsyncmod.update': { params: [id: number, params: RsyncModuleCreate]; response: RsyncModule };
  'rsyncmod.create': { params: [RsyncModuleCreate]; response: RsyncModule };
  'rsyncmod.delete': { params: [id: number]; response: boolean };

  // Reporting
  'reporting.update': { params: [ReportingConfigUpdate]; response: ReportingConfig };
  'reporting.config': { params: void; response: ReportingConfig };
  'reporting.clear': { params: void; response: void };
  'reporting.netdata_get_data': { params: ReportingQueryParams; response: ReportingData[] };
  'reporting.netdata_graphs': { params: QueryParams<ReportingGraph>; response: ReportingGraph[] };

  // SMB
  'smb.bindip_choices': { params: void; response: Choices };
  'smb.unixcharset_choices': { params: void; response: Choices };
  'smb.get_smb_ha_mode': { params: void; response: string };
  'smb.update': { params: [SmbConfigUpdate]; response: SmbConfig };
  'smb.config': { params: void; response: SmbConfig };

  // SSH
  'ssh.update': { params: [SshConfigUpdate]; response: SshConfig };
  'ssh.config': { params: void; response: SshConfig };
  'ssh.bindiface_choices': { params: void; response: Choices };

  // System
  'system.feature_enabled': { params: [feature: string]; response: boolean };
  'system.advanced.update': { params: [Partial<AdvancedConfigUpdate>]; response: AdvancedConfig };
  'system.advanced.update_gpu_pci_ids': { params: [isolated_gpu_pci_ids: string[]]; response: void };
  'system.advanced.serial_port_choices': { params: void; response: Choices };
  'system.info': { params: void; response: SystemInfo };
  'system.host_id': { params: void; response: string };
  'system.is_ha_capable': { params: void; response: boolean };
  'system.is_ix_hardware': { params: void; response: boolean };
  'system.advanced.config': { params: void; response: AdvancedConfig };
  'system.general.update': { params: [SystemGeneralConfigUpdate]; response: SystemGeneralConfig };
  'system.ntpserver.delete': { params: [id: number]; response: boolean };
  'system.ntpserver.query': { params: QueryParams<NtpServer>; response: NtpServer[] };
  'system.ntpserver.create': { params: [CreateNtpServer]; response: NtpServer };
  'system.ntpserver.update': { params: [id: number, params: CreateNtpServer]; response: NtpServer };
  'system.general.config': { params: void; response: SystemGeneralConfig };
  'system.general.kbdmap_choices': { params: void; response: Choices };
  'system.general.language_choices': { params: void; response: Choices };
  'system.general.timezone_choices': { params: void; response: Choices };
  'system.general.ui_address_choices': { params: void; response: Choices };
  'system.license_update': { params: [license: string]; response: void };
  'system.general.ui_v6address_choices': { params: void; response: Choices };
  'system.general.ui_certificate_choices': { params: void; response: Record<number, string> };
  'system.general.ui_httpsprotocols_choices': { params: void; response: Choices };
  'system.general.ui_restart': { params: void; response: void };
  'system.build_time': { params: void; response: ApiTimestamp };
  'system.product_type': { params: void; response: ProductType };
  'system.advanced.syslog_certificate_choices': { params: void; response: Choices };
  'system.advanced.syslog_certificate_authority_choices': { params: void; response: Choices };
  'system.advanced.sed_global_password': { params: void; response: string };
  'system.is_stable': { params: void; response: boolean };
  'system.environment': { params: void; response: string };
  'system.set_time': { params: [number]; response: void };
  'system.security.config': { params: void; response: SystemSecurityConfig };
  'system.security.update': { params: [SystemSecurityConfig]; response: void };
  'system.license': { params: void; response: null | object };

  // Replication
  'replication.config.config': { params: void; response: ReplicationConfig };
  'replication.config.update': { params: [ReplicationConfigUpdate]; response: ReplicationConfig };

  // Support
  'support.is_available': { params: void; response: boolean };
  'support.is_available_and_enabled': { params: void; response: boolean };
  'support.config': { params: void; response: SupportConfig };
  'support.update': { params: [SupportConfigUpdate]; response: SupportConfig };
  'support.fetch_categories': { params: FetchSupportParams; response: Choices };
  'support.attach_ticket_max_size': { params: void; response: number };

  // SMART
  'smart.test.disk_choices': { params: void; response: Choices };
  'smart.update': { params: [SmartConfigUpdate]; response: SmartConfig };
  'smart.config': { params: void; response: SmartConfig };
  'smart.test.manual_test': { params: [SmartManualTestParams[]]; response: ManualSmartTest[] };
  'smart.test.query': { params: QueryParams<SmartTestTask>; response: SmartTestTask[] };
  'smart.test.query_for_disk': { params: [disk: string]; response: SmartTestTask[] };
  'smart.test.create': { params: [SmartTestTaskUpdate]; response: SmartTestTask };
  'smart.test.results': { params: QueryParams<SmartTestResults>; response: SmartTestResults[] };
  'smart.test.update': { params: [id: number, update: SmartTestTaskUpdate]; response: SmartTestTask };
  'smart.test.delete': { params: [id: number]; response: boolean };

  // SystemDataset
  'systemdataset.pool_choices': { params: void; response: Choices };
  'systemdataset.config': { params: void; response: SystemDatasetConfig };

  // Service
  'service.started': { params: [ServiceName]; response: boolean };
  'service.query': { params: QueryParams<Service>; response: Service[] };
  'service.update': { params: [number | ServiceName, Partial<Service>]; response: number };
  'service.start': { params: [ServiceName, { silent: boolean }]; response: boolean };
  'service.stop': {
    params: [ServiceName, { silent: boolean }];
    response: boolean; // False indicates that service has been stopped.
  };
  'service.restart': { params: [ServiceName]; response: void };

  // Sensor
  'sensor.query': { params: void; response: Sensor[] };

  // Sharing
  'sharing.smb.query': { params: QueryParams<SmbShare>; response: SmbShare[] };
  'sharing.smb.create': { params: [SmbShareUpdate]; response: SmbShare };
  'sharing.smb.update': { params: [id: number, update: SmbShareUpdate]; response: SmbShare };
  'sharing.smb.delete': { params: [id: number]; response: boolean };
  'sharing.smb.presets': { params: void; response: SmbPresets };
  'sharing.smb.getacl': { params: [{ share_name: string }]; response: SmbSharesec };
  'sharing.smb.setacl': { params: [{ share_name: string; share_acl: SmbSharesecAce[] }]; response: SmbSharesec };

  'sharing.nfs.query': { params: QueryParams<NfsShare>; response: NfsShare[] };
  'sharing.nfs.update': { params: [id: number, update: NfsShareUpdate]; response: NfsShare };
  'sharing.nfs.create': { params: [NfsShareUpdate]; response: NfsShare };
  'sharing.nfs.delete': { params: [id: number]; response: boolean };

  // Tunable
  'tunable.tunable_type_choices': { params: void; response: Choices };
  'tunable.query': { params: QueryParams<Tunable>; response: Tunable[] };

  // FTP
  'ftp.update': { params: [FtpConfigUpdate]; response: FtpConfig };
  'ftp.config': { params: void; response: FtpConfig };

  // Truecommand
  'truecommand.config': { params: void; response: TrueCommandConfig };
  'truecommand.update': { params: [UpdateTrueCommand]; response: TrueCommandUpdateResponse };
  'truecommand.connected': { params: void; response: TrueCommandConnectionState };

  // TrueNAS
  'truenas.is_eula_accepted': { params: void; response: boolean };
  'truenas.get_eula': { params: void; response: string };
  'truenas.accept_eula': { params: void; response: void };
  'truenas.is_production': { params: void; response: boolean };

  // Vm
  'vm.query': { params: QueryParams<VirtualMachine>; response: VirtualMachine[] };
  'vm.cpu_model_choices': { params: void; response: Choices };
  'vm.bootloader_options': { params: void; response: Choices };
  'vm.device.nic_attach_choices': { params: void; response: Choices };
  'vm.device.bind_choices': { params: void; response: Choices };
  'vm.create': { params: [VirtualMachineUpdate]; response: VirtualMachine };
  'vm.delete': { params: VmDeleteParams; response: boolean };
  'vm.resolution_choices': { params: void; response: Choices };
  'vm.get_display_web_uri': { params: VmDisplayWebUriParams; response: VmDisplayWebUri };
  'vm.device.passthrough_device_choices': { params: void; response: { [id: string]: VmPassthroughDeviceChoice } };
  'vm.device.usb_passthrough_choices': { params: void; response: { [id: string]: VmUsbPassthroughDeviceChoice } };
  'vm.device.usb_controller_choices': { params: void; response: Choices };
  'vm.device.create': { params: [VmDeviceUpdate]; response: VmDevice };
  'vm.device.delete': { params: [number, VmDeviceDelete?]; response: boolean };
  'vm.device.disk_choices': { params: void; response: Choices };
  'vm.random_mac': { params: void; response: string };
  'vm.device.query': { params: QueryParams<VmDevice>; response: VmDevice[] };
  'vm.maximum_supported_vcpus': { params: void; response: number };
  'vm.device.update': { params: [id: number, update: VmDeviceUpdate]; response: VmDevice };
  'vm.port_wizard': { params: void; response: VmPortWizardResult };
  'vm.get_available_memory': { params: void; response: number };
  'vm.clone': { params: VmCloneParams; response: boolean };
  'vm.update': { params: [id: number, update: VirtualMachineUpdate]; response: VirtualMachine };
  'vm.poweroff': { params: [id: number]; response: void };
  'vm.get_display_devices': { params: [id: number]; response: VmDisplayDevice[] };
  'vm.start': { params: [id: number, params?: { overcommit?: boolean }]; response: void };
  'vm.virtualization_details': { params: void; response: VirtualizationDetails };

  // Vmware
  'vmware.dataset_has_vms': { params: DatasetHasVmsQueryParams; response: boolean };
  'vmware.query': { params: QueryParams<VmwareSnapshot>; response: VmwareSnapshot[] };
  'vmware.create': { params: [VmwareSnapshotUpdate]; response: VmwareSnapshot };
  'vmware.update': { params: [id: number, update: VmwareSnapshotUpdate]; response: VmwareSnapshot };
  'vmware.delete': { params: [id: number]; response: boolean };
  'vmware.match_datastores_with_datasets': {
    params: [MatchDatastoresWithDatasetsParams];
    response: MatchDatastoresWithDatasets;
  };

  // User
  'user.update': { params: [id: number, update: UserUpdate]; response: number };
  'user.create': { params: [UserUpdate]; response: number };
  'user.query': { params: QueryParams<User>; response: User[] };
  'user.setup_local_administrator': { params: [userName: string, password: string, ec2?: { instance_id: string }]; response: void };
  'user.delete': { params: DeleteUserParams; response: number };
  'user.get_user_obj': { params: [{ username?: string; uid?: number }]; response: DsUncachedUser };
  'user.shell_choices': { params: [ids: number[]]; response: Choices };
  'user.get_next_uid': { params: void; response: number };
  'user.has_local_administrator_set_up': { params: void; response: boolean };
  'user.provisioning_uri': { params: [username: string]; response: string };
  'user.renew_2fa_secret': { params: [username: string]; response: User };

  // UPS
  'ups.update': { params: [UpsConfigUpdate]; response: UpsConfig };
  'ups.config': { params: void; response: UpsConfig };
  'ups.driver_choices': { params: void; response: Choices };
  'ups.port_choices': { params: void; response: string[] };

  // Update
  'update.get_auto_download': { params: void; response: boolean };
  'update.get_trains': { params: void; response: SystemUpdateTrains };
  'update.set_auto_download': { params: [boolean]; response: void };
  'update.get_pending': { params: void; response: SystemUpdateChange[] };
  'update.check_available': { params: void; response: SystemUpdate };
  'update.set_train': { params: [train: string]; response: void };

  // ZFS
  'zfs.snapshot.create': { params: [CreateZfsSnapshot]; response: ZfsSnapshot };
  'zfs.snapshot.query': { params: QueryParams<ZfsSnapshot>; response: ZfsSnapshot[] };
  'zfs.snapshot.delete': { params: [id: string, params?: { defer?: boolean; recursive?: boolean }]; response: boolean };
  'zfs.snapshot.clone': { params: [CloneZfsSnapshot]; response: boolean };
  'zfs.snapshot.rollback': { params: ZfsRollbackParams; response: void };
  'zfs.snapshot.hold': { params: [string]; response: void };
  'zfs.snapshot.release': { params: [string]; response: void };

  // staticroute
  'staticroute.query': { params: QueryParams<StaticRoute>; response: StaticRoute[] };
  'staticroute.create': { params: [UpdateStaticRoute]; response: StaticRoute };
  'staticroute.update': { params: [id: number, update: UpdateStaticRoute]; response: StaticRoute };
  'staticroute.delete': { params: [id: number]; response: boolean };

  // SNMP
  'snmp.config': { params: void; response: SnmpConfig };
  'snmp.update': { params: [SnmpConfigUpdate]; response: SnmpConfig };

  // InitShutdownScript
  'initshutdownscript.query': { params: QueryParams<InitShutdownScript>; response: InitShutdownScript[] };
  'initshutdownscript.create': { params: [CreateInitShutdownScript]; response: InitShutdownScript };
  'initshutdownscript.update': { params: UpdateInitShutdownScriptParams; response: InitShutdownScript };
  'initshutdownscript.delete': { params: [id: number]; response: boolean };
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
