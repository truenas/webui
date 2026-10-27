import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { ApiEventMethod } from 'app/interfaces/api-message.interface';
import { AuditEntry, AuditQueryParams } from 'app/interfaces/audit/audit.interface';
import {
  AuthTokenParams, LoginExOtpTokenQuery, LoginExQuery, LoginExResponse,
} from 'app/interfaces/auth.interface';
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
import { Disk, ExtraDiskQueryOptions } from 'app/interfaces/disk.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import {
  FailoverConfig,
} from 'app/interfaces/failover.interface';
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
import {
  NetworkInterface,
} from 'app/interfaces/network-interface.interface';
import { AddNfsPrincipal } from 'app/interfaces/nfs-config.interface';
import {
  Pool,
} from 'app/interfaces/pool.interface';
import { Privilege } from 'app/interfaces/privilege.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import {
  ReplicationTask,
} from 'app/interfaces/replication-task.interface';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import {
  RemoteSshScanParams,
  SshConnectionSetup,
} from 'app/interfaces/ssh-connection-setup.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import {
  UpdateStatus,
} from 'app/interfaces/system-update.interface';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { User } from 'app/interfaces/user.interface';
import { ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';

/**
 * API definitions for `call` methods.
 * For jobs see ApiJobDirectory.
 * For events from `subscribed` see ApiEventDirectory.
 */
export interface ApiCallDirectory {
  // Alert

  // API Key
  'api_key.query': { params: QueryParams<ApiKey>; response: ApiKey[] };

  // Audit
  'audit.query': { params: [AuditQueryParams]; response: AuditEntry[] };
  'audit.download_report': { params: [{ report_name?: string }]; response: string[] };

  // Auth
  'auth.generate_token': { params: AuthTokenParams; response: string };
  'auth.login_ex': { params: [LoginExQuery]; response: LoginExResponse };
  'auth.login_ex_continue': { params: [LoginExOtpTokenQuery]; response: LoginExResponse };
  'auth.logout': { params: void; response: void };
  'auth.me': { params: void; response: LoggedInUser };
  'auth.twofactor.config': { params: void; response: GlobalTwoFactorConfig };

  // Boot Environment

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
  'core.subscribe': { params: [name: ApiEventMethod]; response: void };
  'core.unsubscribe': { params: [id: string]; response: void };
  'core.set_options': { params: CoreOptions; response: CoreOptions };

  // LDAP
  'ldap.config': { params: void; response: LdapConfig };
  'ldap.ssl_choices': { params: void; response: string[] };
  'ldap.schema_choices': { params: void; response: string[] };

  // Disk
  'disk.query': { params: QueryParams<Disk, ExtraDiskQueryOptions>; response: Disk[] };

  // Enclosure
  'webui.enclosure.dashboard': { params: void; response: DashboardEnclosure[] };

  // Failover
  'failover.config': { params: void; response: FailoverConfig };
  'failover.get_ips': { params: void; response: string[] };
  'failover.licensed': { params: void; response: boolean };

  // Interface
  'interface.bridge_members_choices': { params: [id?: string]; response: Choices };
  'interface.default_route_will_be_removed': { params: void; response: boolean };
  'interface.lag_ports_choices': { params: [id?: string]; response: Choices };
  'interface.lag_supported_protocols': { params: void; response: string[] };
  'interface.query': { params: QueryParams<NetworkInterface>; response: NetworkInterface[] };
  'interface.vlan_parent_interface_choices': { params: void; response: Choices };

  // IPMI

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

  // Mail

  // NFS
  'nfs.add_principal': { params: [AddNfsPrincipal]; response: boolean };

  // Pool
  'pool.dataset.export_keys_for_replication': { params: [id: number]; response: unknown };
  'pool.query': { params: QueryParams<Pool>; response: Pool[] };
  'pool.scrub.delete': { params: [id: number]; response: boolean };

  // Privilege
  'privilege.query': { params: QueryParams<Privilege>; response: Privilege[] };

  // Replication
  'replication.query': { params: QueryParams<ReplicationTask>; response: ReplicationTask[] };
  'replication.restore': { params: [id: number, params: { name: string; target_dataset: string }]; response: void };

  // Rsynctask
  'rsynctask.query': { params: QueryParams<RsyncTask>; response: RsyncTask[] };

  // Support

  // System
  'system.advanced.config': { params: void; response: AdvancedConfig };
  'system.advanced.nvidia_present': { params: void; response: boolean };
  'system.boot_id': { params: void; response: string };

  // Truenas Connect

  // TrueNAS
  'truenas.get_eula': { params: void; response: string };

  // Update
  'update.status': { params: void; response: UpdateStatus };

  // User
  'user.query': { params: QueryParams<User>; response: User[] };


  // TODO: Incorrect response definition here or for system.info.
  'webui.main.dashboard.sys_info': { params: void; response: SystemInfo };

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
