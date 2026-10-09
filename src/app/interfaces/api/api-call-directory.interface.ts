import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { AdvancedConfig, AdvancedConfigUpdate } from 'app/interfaces/advanced-config.interface';
import { AlertService, AlertServiceEdit } from 'app/interfaces/alert-service.interface';
import { AlertCategory, AlertClasses, AlertClassesUpdate } from 'app/interfaces/alert.interface';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { ApiEventMethod } from 'app/interfaces/api-message.interface';
import { AuditConfig, AuditEntry, AuditQueryParams } from 'app/interfaces/audit/audit.interface';
import { AuthSession } from 'app/interfaces/auth-session.interface';
import {
  AuthTokenParams, LoginExOtpTokenQuery, LoginExQuery, LoginExResponse,
} from 'app/interfaces/auth.interface';
import { BootenvCloneParams, BootEnvironment, BootenvKeepParams } from 'app/interfaces/boot-environment.interface';
import { Choices } from 'app/interfaces/choices.interface';
import {
  CloudBackup,
} from 'app/interfaces/cloud-backup.interface';
import {
  CloudSyncTask,
} from 'app/interfaces/cloud-sync-task.interface';
import {
  CloudSyncBucket,
  CloudSyncCredential,
  CloudSyncCredentialUpdate,
  CloudSyncCredentialVerify, CloudSyncCredentialVerifyResult, CloudSyncOneDriveDrive, CloudSyncOneDriveParams,
} from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { CoreDownloadQuery, CoreDownloadResponse } from 'app/interfaces/core-download.interface';
import { CoreOptions } from 'app/interfaces/core-options.interface';
import { Cronjob, CronjobUpdate } from 'app/interfaces/cronjob.interface';
import { Disk, DiskDetailsResponse, ExtraDiskQueryOptions, DiskDetailsParams } from 'app/interfaces/disk.interface';
import { DockerStatusData } from 'app/interfaces/docker-config.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { DashboardEnclosure, Enclosure, SetDriveBayLightStatus } from 'app/interfaces/enclosure.interface';
import {
  FailoverConfig,
  FailoverUpdate,
} from 'app/interfaces/failover.interface';
import { GpuPciChoices } from 'app/interfaces/gpu-pci-choice.interface';
import {
  CreateInitShutdownScript,
  InitShutdownScript,
  UpdateInitShutdownScriptParams,
} from 'app/interfaces/init-shutdown-script.interface';
import {
  Ipmi, IpmiChassis, IpmiChassisIdentifyParams, IpmiChassisInfoParams, IpmiEvent, IpmiQueryParams, IpmiUpdate,
} from 'app/interfaces/ipmi.interface';
import { Jbof, JbofUpdate } from 'app/interfaces/jbof.interface';
import { Job } from 'app/interfaces/job.interface';
import {
  KeychainCredential,
  KeychainCredentialCreate,
  KeychainCredentialDeleteOptions,
  KeychainCredentialUpdate,
  KeychainCredentialUsedBy,
  KeychainSshCredentials,
  SshKeyPair,
} from 'app/interfaces/keychain-credential.interface';
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
import { AddNfsPrincipal } from 'app/interfaces/nfs-config.interface';
import { CreateNtpServer, NtpServer } from 'app/interfaces/ntp-server.interface';
import { MapOption } from 'app/interfaces/option.interface';
import {
  Pool, PoolInstance,
} from 'app/interfaces/pool.interface';
import { Privilege } from 'app/interfaces/privilege.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { ReplicationConfigUpdate } from 'app/interfaces/replication-config-update.interface';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import {
  ReplicationTask,
} from 'app/interfaces/replication-task.interface';
import { ResilverConfig, ResilverConfigUpdate } from 'app/interfaces/resilver-config.interface';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { ResizeShellRequest } from 'app/interfaces/shell.interface';
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
  UpdateConfig,
  UpdateProfileChoices,
  UpdateStatus,
} from 'app/interfaces/system-update.interface';
import { TruenasConnectConfig, TruenasConnectUpdate } from 'app/interfaces/truenas-connect-config.interface';
import { Tunable } from 'app/interfaces/tunable.interface';
import { GlobalTwoFactorConfig, GlobalTwoFactorConfigUpdate } from 'app/interfaces/two-factor-config.interface';
import { User } from 'app/interfaces/user.interface';
import { ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
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

  // Alert
  'alert.list_categories': { params: void; response: AlertCategory[] };
  'alert.list_policies': { params: void; response: AlertPolicy[] };

  // Alert Classes
  'alertclasses.config': { params: void; response: AlertClasses };
  'alertclasses.update': { params: [Partial<AlertClassesUpdate>]; response: AlertClasses };
  'alertservice.create': { params: [AlertServiceEdit]; response: AlertService };
  'alertservice.delete': { params: [number]; response: boolean };
  'alertservice.query': { params: QueryParams<AlertService>; response: AlertService[] };
  'alertservice.test': { params: [AlertServiceEdit]; response: boolean };
  'alertservice.update': { params: [id: number, update: AlertServiceEdit]; response: AlertService };

  // API Key
  'api_key.query': { params: QueryParams<ApiKey>; response: ApiKey[] };

  // Audit
  'audit.config': { params: void; response: AuditConfig };
  'audit.query': { params: [AuditQueryParams]; response: AuditEntry[] };
  'audit.update': { params: [Partial<AuditConfig>]; response: AuditEntry[] };
  'audit.download_report': { params: [{ report_name?: string }]; response: string[] };

  // Auth
  'auth.generate_token': { params: AuthTokenParams; response: string };
  'auth.login_ex': { params: [LoginExQuery]; response: LoginExResponse };
  'auth.login_ex_continue': { params: [LoginExOtpTokenQuery]; response: LoginExResponse };
  'auth.logout': { params: void; response: void };
  'auth.me': { params: void; response: LoggedInUser };
  'auth.sessions': { params: QueryParams<AuthSession>; response: AuthSession[] };
  'auth.set_attribute': { params: [key: string, value: unknown]; response: void };
  'auth.terminate_other_sessions': { params: void; response: void };
  'auth.terminate_session': { params: [id: string]; response: void };
  'auth.twofactor.config': { params: void; response: GlobalTwoFactorConfig };
  'auth.twofactor.update': { params: [Partial<GlobalTwoFactorConfigUpdate>]; response: GlobalTwoFactorConfig };

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

  // Certificate

  // CloudBackup
  'cloud_backup.query': { params: [id?: QueryParams<CloudBackup>]; response: CloudBackup[] };

  // CloudSync
  'cloudsync.credentials.create': { params: [CloudSyncCredentialUpdate]; response: CloudSyncCredential };
  'cloudsync.credentials.delete': { params: [id: number]; response: boolean };
  'cloudsync.credentials.query': { params: QueryParams<CloudSyncCredential>; response: CloudSyncCredential[] };
  'cloudsync.credentials.update': { params: [id: number, update: CloudSyncCredentialUpdate]; response: CloudSyncCredential };
  'cloudsync.credentials.verify': { params: [CloudSyncCredentialVerify]; response: CloudSyncCredentialVerifyResult };
  'cloudsync.list_buckets': { params: [id: number]; response: CloudSyncBucket[] };
  'cloudsync.onedrive_list_drives': { params: [CloudSyncOneDriveParams]; response: CloudSyncOneDriveDrive[] };
  'cloudsync.providers': { params: void; response: CloudSyncProvider[] };
  'cloudsync.query': { params: QueryParams<CloudSyncTask>; response: CloudSyncTask[] };

  // Core
  'core.ping': { params: void; response: 'pong' };
  'core.download': { params: CoreDownloadQuery; response: CoreDownloadResponse };
  'core.get_jobs': { params: QueryParams<Job>; response: Job[] };
  'core.job_abort': { params: [jobId: number]; response: void };
  'core.resize_shell': { params: ResizeShellRequest; response: void };
  'core.subscribe': { params: [name: ApiEventMethod]; response: void };
  'core.unsubscribe': { params: [id: string]; response: void };
  'core.set_options': { params: CoreOptions; response: CoreOptions };

  // Cronjob
  'cronjob.create': { params: [CronjobUpdate]; response: Cronjob };
  'cronjob.delete': { params: [id: number]; response: boolean };
  'cronjob.query': { params: QueryParams<Cronjob>; response: Cronjob[] };
  'cronjob.run': { params: [id: number]; response: void };
  'cronjob.update': { params: [id: number, update: Partial<CronjobUpdate>]; response: Cronjob };

  // Directory Services

  // LDAP
  'ldap.config': { params: void; response: LdapConfig };
  'ldap.ssl_choices': { params: void; response: string[] };
  'ldap.schema_choices': { params: void; response: string[] };

  // Disk
  'disk.details': { params: [params: DiskDetailsParams]; response: DiskDetailsResponse };
  'disk.query': { params: QueryParams<Disk, ExtraDiskQueryOptions>; response: Disk[] };

  // Enclosure
  'webui.enclosure.dashboard': { params: void; response: DashboardEnclosure[] };
  'enclosure.label.set': { params: [enclosureId: string, label: string]; response: Enclosure };
  'enclosure2.set_slot_status': { params: [SetDriveBayLightStatus]; response: void };

  // Failover
  'failover.config': { params: void; response: FailoverConfig };
  'failover.get_ips': { params: void; response: string[] };
  'failover.licensed': { params: void; response: boolean };
  'failover.node': { params: void; response: string };
  'failover.sync_from_peer': { params: void; response: void };
  'failover.sync_to_peer': { params: [{ reboot?: boolean }]; response: void };
  'failover.update': { params: [Partial<FailoverUpdate>]; response: FailoverConfig };

  // Fibre Channel Host

  // Fibre Channel Port

  // Filesystem

  // Group

  // Initshutdownscript
  'initshutdownscript.create': { params: [CreateInitShutdownScript]; response: InitShutdownScript };
  'initshutdownscript.delete': { params: [id: number]; response: boolean };
  'initshutdownscript.query': { params: QueryParams<InitShutdownScript>; response: InitShutdownScript[] };
  'initshutdownscript.update': { params: UpdateInitShutdownScriptParams; response: InitShutdownScript };

  // Interface
  'interface.available_fec_modes': { params: [id: string]; response: string[] };
  'interface.bridge_members_choices': { params: [id?: string]; response: Choices };
  'interface.cancel_rollback': { params: void; response: void };
  'interface.checkin': { params: void; response: void };
  'interface.checkin_waiting': { params: void; response: number | null };
  'interface.commit': { params: [{ checkin_timeout: number }]; response: void };
  'interface.create': { params: [NetworkInterfaceCreate]; response: NetworkInterface };
  'interface.default_route_will_be_removed': { params: void; response: boolean };
  'interface.network_config_to_be_removed': { params: void; response: { ipv4gateway?: string; nameserver1?: string; nameserver2?: string; nameserver3?: string } };
  'interface.delete': { params: [id: string]; response: string };
  'interface.has_pending_changes': { params: void; response: boolean };
  'interface.lacpdu_rate_choices': { params: void; response: Choices };
  'interface.lag_ports_choices': { params: [id?: string]; response: Choices };
  'interface.lag_supported_protocols': { params: void; response: string[] };
  'interface.query': { params: QueryParams<NetworkInterface>; response: NetworkInterface[] };
  'interface.rollback': { params: void; response: void };
  'interface.save_default_route': { params: string[]; response: void };
  'interface.save_network_config': { params: [{ ipv4gateway: string; nameserver1?: string; nameserver2?: string; nameserver3?: string }]; response: void };
  'interface.services_restarted_on_sync': { params: void; response: ServiceRestartedOnNetworkSync[] };
  'interface.update': { params: [id: string, update: Partial<NetworkInterfaceUpdate>]; response: NetworkInterface };
  'interface.vlan_parent_interface_choices': { params: void; response: Choices };
  'interface.xmit_hash_policy_choices': { params: void; response: Choices };

  // IPMI
  'ipmi.chassis.identify': { params: [IpmiChassisIdentifyParams]; response: void };
  'ipmi.chassis.info': { params: [IpmiChassisInfoParams?]; response: IpmiChassis };
  'ipmi.is_loaded': { params: void; response: boolean };
  'ipmi.lan.query': { params: IpmiQueryParams; response: Ipmi[] };
  'ipmi.sel.elist': { params: void; response: IpmiEvent[] };
  'ipmi.lan.update': { params: [id: number, update: IpmiUpdate]; response: Ipmi };

  // iSCSI

  // Jbof
  'jbof.licensed': { params: void; response: number };
  'jbof.query': { params: [QueryParams<Jbof>]; response: Jbof[] };
  'jbof.create': { params: [JbofUpdate]; response: Jbof };
  'jbof.update': { params: [id: number, update: Partial<JbofUpdate>]; response: Jbof };
  'jbof.delete': { params: [id: number, force?: boolean]; response: boolean };

  // Kerberos
  'kerberos.keytab.kerberos_principal_choices': { params: void; response: string[] };

  // Keychain credential
  'keychaincredential.create': { params: [KeychainCredentialCreate]; response: KeychainCredential };
  'keychaincredential.delete': { params: [id: number, options?: KeychainCredentialDeleteOptions]; response: void };
  'keychaincredential.generate_ssh_key_pair': { params: void; response: SshKeyPair };
  'keychaincredential.query': { params: QueryParams<KeychainCredential>; response: KeychainCredential[] };
  'keychaincredential.remote_ssh_host_key_scan': { params: [RemoteSshScanParams]; response: string };
  'keychaincredential.setup_ssh_connection': { params: [SshConnectionSetup]; response: KeychainSshCredentials };
  'keychaincredential.update': { params: [id: number, credential: Partial<KeychainCredentialUpdate>]; response: KeychainCredential };
  'keychaincredential.used_by': { params: [id: number]; response: KeychainCredentialUsedBy[] };

  // KMIP

  // Docker
  'docker.status': { params: void; response: DockerStatusData };

  // Mail
  'mail.config': { params: void; response: MailConfig };
  'mail.local_administrator_email': { params: void; response: string | null };
  'mail.update': { params: [Partial<MailConfigUpdate>]; response: MailConfig };

  // Network configuration
  'network.configuration.activity_choices': { params: void; response: MapOption[] };
  'network.configuration.config': { params: void; response: NetworkConfiguration };
  'network.configuration.update': { params: [Partial<NetworkConfigurationUpdate>]; response: NetworkConfiguration };
  'network.general.summary': { params: void; response: NetworkSummary };

  // NFS
  'nfs.add_principal': { params: [AddNfsPrincipal]; response: boolean };

  // NVMe-oF


  // Pool
  'pool.dataset.export_keys_for_replication': { params: [id: number]; response: unknown };
  'pool.query': { params: QueryParams<Pool>; response: Pool[] };
  'pool.resilver.config': { params: void; response: ResilverConfig };
  'pool.resilver.update': { params: [Partial<ResilverConfigUpdate>]; response: ResilverConfig };
  'pool.scrub.delete': { params: [id: number]; response: boolean };

  // Privilege
  'privilege.query': { params: QueryParams<Privilege>; response: Privilege[] };

  // RDMA

  // Replication
  'replication.config.config': { params: void; response: ReplicationConfig };
  'replication.config.update': { params: [Partial<ReplicationConfigUpdate>]; response: ReplicationConfig };
  'replication.query': { params: QueryParams<ReplicationTask>; response: ReplicationTask[] };
  'replication.restore': { params: [id: number, params: { name: string; target_dataset: string }]; response: void };

  // Rsynctask
  'rsynctask.query': { params: QueryParams<RsyncTask>; response: RsyncTask[] };

  // S3

  // Sharing

  // SMB

  // Static route
  'staticroute.create': { params: [UpdateStaticRoute]; response: StaticRoute };
  'staticroute.delete': { params: [id: number]; response: boolean };
  'staticroute.query': { params: QueryParams<StaticRoute>; response: StaticRoute[] };
  'staticroute.update': { params: [id: number, update: Partial<UpdateStaticRoute>]; response: StaticRoute };

  // Support
  'support.config': { params: void; response: SupportConfig };
  'support.is_available': { params: void; response: boolean };
  'support.is_available_and_enabled': { params: void; response: boolean };
  'support.update': { params: [Partial<SupportConfigUpdate>]; response: SupportConfig };
  'support.similar_issues': { params: SimilarIssuesParams; response: SimilarIssue[] };
  'support.attach_ticket_max_size': { params: void; response: number };

  // System
  'system.advanced.config': { params: void; response: AdvancedConfig };
  'system.advanced.nvidia_present': { params: void; response: boolean };
  'system.advanced.sed_global_password': { params: void; response: string };
  'system.advanced.serial_port_choices': { params: void; response: Choices };
  'system.advanced.syslog_certificate_authority_choices': { params: void; response: Choices };
  'system.advanced.syslog_certificate_choices': { params: void; response: Choices };
  'system.advanced.update': { params: [Partial<AdvancedConfigUpdate>]; response: AdvancedConfig };
  'system.advanced.update_gpu_pci_ids': { params: [isolated_gpu_pci_ids: string[]]; response: void };
  'system.boot_id': { params: void; response: string };
  'system.general.config': { params: void; response: SystemGeneralConfig };
  'system.general.ui_restart': { params: void; response: void };
  'system.general.update': { params: [Partial<SystemGeneralConfigUpdate>]; response: SystemGeneralConfig };
  'system.host_id': { params: void; response: string };
  'system.info': { params: void; response: SystemInfo };
  'system.ntpserver.create': { params: [CreateNtpServer]; response: NtpServer };
  'system.ntpserver.delete': { params: [id: number]; response: boolean };
  'system.ntpserver.query': { params: QueryParams<NtpServer>; response: NtpServer[] };
  'system.ntpserver.update': { params: [id: number, params: Partial<CreateNtpServer>]; response: NtpServer };
  'system.security.config': { params: void; response: SystemSecurityConfig };

  // Systemdataset
  'systemdataset.config': { params: void; response: SystemDatasetConfig };
  'systemdataset.pool_choices': { params: void; response: Choices };

  // Truenas Connect
  'tn_connect.config': { params: void; response: TruenasConnectConfig };
  'tn_connect.update': { params: [Partial<TruenasConnectUpdate>]; response: TruenasConnectConfig };
  'tn_connect.generate_claim_token': { params: void; response: string };
  'tn_connect.get_registration_uri': { params: void; response: string };

  // TrueNAS
  'truenas.get_eula': { params: void; response: string };
  'truenas.is_production': { params: void; response: boolean };
  'truenas.license.fingerprint': { params: void; response: string };
  'truenas.license.upload': {
    params: [license: string, options?: { ha_propagate?: boolean }];
    response: void;
  };

  // Tunable
  'tunable.query': { params: QueryParams<Tunable>; response: Tunable[] };
  'tunable.tunable_type_choices': { params: void; response: Choices };

  // Update
  'update.status': { params: void; response: UpdateStatus };
  'update.profile_choices': { params: void; response: UpdateProfileChoices };
  'update.config': { params: void; response: UpdateConfig };
  'update.update': { params: [Partial<UpdateConfig>]; response: UpdateConfig };

  // User
  'user.query': { params: QueryParams<User>; response: User[] };
  'user.renew_2fa_secret': { params: [string, { interval: number; otp_digits: number }]; response: User };
  'user.unset_2fa_secret': { params: [string]; response: User };

  'system.advanced.get_gpu_pci_choices': { params: void; response: GpuPciChoices };

  // Vmware

  // WebUI main
  // TODO: Incorrect response definition here or for system.info.
  'webui.main.dashboard.sys_info': { params: void; response: SystemInfo };

  // WebUI Crypto

  // ZFS

  // ZPool

  // ZFS Tier
  'zfs.tier.rewrite_job_status': { params: [{ tier_job_id: string }]; response: ZfsTierRewriteJobEntry };
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
