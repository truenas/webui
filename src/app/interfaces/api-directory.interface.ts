import { DefaultAclType } from 'app/enums/acl-type.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import {
  Acl, AclQueryParams, NfsAclItem, SetAcl,
} from 'app/interfaces/acl.interface';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { ActiveDirectoryUpdate } from 'app/interfaces/active-directory.interface';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { AlertService, AlertServiceCreate } from 'app/interfaces/alert-service.interface';
import { Alert, AlertCategory } from 'app/interfaces/alert.interface';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { ApiKey, CreateApiKeyRequest, UpdateApiKeyRequest } from 'app/interfaces/api-key.interface';
import { LoginParams } from 'app/interfaces/auth.interface';
import { BootPoolState } from 'app/interfaces/boot-pool-state.interface';
import { Bootenv, SetBootenvAttributeParams } from 'app/interfaces/bootenv.interface';
import { Catalog } from 'app/interfaces/catalog.interface';
import {
  CertificateAuthority,
  CertificateAuthorityCreate,
  CertificateAuthorityUpdate,
} from 'app/interfaces/certificate-authority.interface';
import {
  Certificate,
  CertificateProfiles,
  ExtendedKeyUsageChoices,
} from 'app/interfaces/certificate.interface';
import {
  ChartRelease,
  ChartReleaseCreate,
  ChartReleaseCreateResponse,
  ChartReleaseQueryParams,
} from 'app/interfaces/chart-release.interface';
import { Choices } from 'app/interfaces/choices.interface';
import { CloudSyncTask } from 'app/interfaces/cloud-sync-task.interface';
import { CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { ContainerConfig, ContainerConfigUpdate } from 'app/interfaces/container-config.interface';
import { ContainerImage, PullContainerImageParams } from 'app/interfaces/container-image.interface';
import { CoreDownloadQuery, CoreDownloadResponse } from 'app/interfaces/core-download.interface';
import { Cronjob } from 'app/interfaces/cronjob.interface';
import { DatasetPermissionsUpdate } from 'app/interfaces/dataset-permissions.interface';
import { Dataset, ExtraDatasetQueryOptions } from 'app/interfaces/dataset.interface';
import {
  AuthenticatorSchema,
  CreateDnsAuthenticator,
  DnsAuthenticator, UpdateDnsAuthenticator,
} from 'app/interfaces/dns-authenticator.interface';
import { DynamicDnsConfig, DynamicDnsUpdate } from 'app/interfaces/dynamic-dns.interface';
import { FailoverUpdate } from 'app/interfaces/failover.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { FtpConfig } from 'app/interfaces/ftp-config.interface';
import { Group } from 'app/interfaces/group.interface';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import {
  IscsiAuthAccess, IscsiExtent,
  IscsiInitiatorGroup,
  IscsiPortal,
  IscsiTarget, IscsiTargetExtent,
} from 'app/interfaces/iscsi.interface';
import { Job } from 'app/interfaces/job.interface';
import { KerberosConfig } from 'app/interfaces/kerberos-config.interface';
import { KerberosRealm } from 'app/interfaces/kerberos-realm.interface';
import { KeychainCredential, SshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { KubernetesConfig, KubernetesConfigUpdate } from 'app/interfaces/kubernetes-config.interface';
import { LdapConfig } from 'app/interfaces/ldap-config.interface';
import { LldpConfig, LldpConfigUpdate } from 'app/interfaces/lldp-config.interface';
import { NetworkActivityChoice, NetworkConfiguration } from 'app/interfaces/network-configuration.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { NfsConfig } from 'app/interfaces/nfs-config.interface';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { OpenvpnClientConfig } from 'app/interfaces/openvpn-client-config.interface';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { PoolScrub } from 'app/interfaces/pool-scrub.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { ReportingConfig } from 'app/interfaces/reporting.interface';
import { RsyncConfig, RsyncConfigUpdate } from 'app/interfaces/rsync-config.interface';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { S3Config, S3ConfigUpdate } from 'app/interfaces/s3-config.interface';
import { Service } from 'app/interfaces/service.interface';
import { ResizeShellRequest } from 'app/interfaces/shell.interface';
import {
  SmartManualTestParams, SmartConfig, SmartConfigUpdate, SmartTest,
} from 'app/interfaces/smart-test.interface';
import { SmbShare } from 'app/interfaces/smb-share.interface';
import { SnmpConfig, SnmpConfigUpdate } from 'app/interfaces/snmp-config.interface';
import { SshConfig, SshConfigUpdate } from 'app/interfaces/ssh-config.interface';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { Disk, DiskQueryOptions, DiskUpdate } from 'app/interfaces/storage.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { SystemUpdate, SystemUpdateChange, SystemUpdateTrains } from 'app/interfaces/system-update.interface';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { TwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { UpsConfig } from 'app/interfaces/ups-config.interface';
import { User } from 'app/interfaces/user.interface';
import { VirtualMachine, VmStopParams } from 'app/interfaces/virtual-machine.interface';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { WebDavShare } from 'app/interfaces/web-dav-share.interface';
import { WebdavConfig, WebdavConfigUpdate } from 'app/interfaces/webdav-config.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

/**
 * API definitions for `call` and `job` methods.
 * For events from `subscribed` see ApiEventDirectory.
 */
export type ApiDirectory = {
  // Active Directory
  'activedirectory.config': { params: void; response: ActiveDirectoryConfig };
  'activedirectory.update': { params: [ActiveDirectoryUpdate]; response: ActiveDirectoryConfig };
  'activedirectory.nss_info_choices': { params: void; response: string[] };
  'activedirectory.leave': { params: any; response: any };

  // Acme
  'acme.dns.authenticator.query': { params: void; response: DnsAuthenticator[] };
  'acme.dns.authenticator.create': { params: CreateDnsAuthenticator; response: DnsAuthenticator };
  'acme.dns.authenticator.update': { params: [number, UpdateDnsAuthenticator]; response: DnsAuthenticator };
  'acme.dns.authenticator.authenticator_schemas': { params: void; response: AuthenticatorSchema[] };

  // Alert
  'alert.list': { params: void; response: Alert[] };
  'alert.dismiss': { params: string[]; response: void };
  'alert.restore': { params: string[]; response: void };
  'alert.list_policies': { params: void; response: AlertPolicy[] };
  'alert.list_categories': { params: void; response: AlertCategory[] };

  // Alert Classes
  'alertclasses.config': { params: any; response: any };
  'alertclasses.update': { params: any; response: any };

  // Alert Service
  'alertservice.update': { params: any; response: any };
  'alertservice.create': { params: [AlertServiceCreate]; response: any };
  'alertservice.query': { params: QueryParams<AlertService>; response: AlertService[] };
  'alertservice.test': { params: any; response: boolean };
  'alertservice.delete': { params: any; response: any };

  // Api Key
  'api_key.create': { params: [CreateApiKeyRequest]; response: ApiKey };
  'api_key.update': { params: UpdateApiKeyRequest; response: ApiKey };
  'api_key.delete': { params: [/* id */ string]; response: boolean };
  'api_key.query': { params: QueryParams<ApiKey>; response: ApiKey[] };

  // Auth
  'auth.generate_token': { params: [number]; response: string };
  'auth.check_user': { params: any; response: any };
  'auth.login': {
    params: LoginParams;
    response: boolean;
  };
  'auth.token': { params: any; response: any };
  'auth.logout': { params: void; response: void };
  'auth.twofactor.update': { params: any; response: any };
  'auth.twofactor.provisioning_uri': { params: void; response: string };
  'auth.two_factor_auth': { params: any; response: any };
  'auth.twofactor.renew_secret': { params: any; response: any };
  'auth.twofactor.config': { params: void; response: TwoFactorConfig };

  // Boot
  'boot.set_scrub_interval': { params: any; response: any };
  'boot.replace': { params: any; response: any };
  'boot.get_state': { params: void; response: BootPoolState };
  'boot.detach': { params: any; response: any };
  'boot.attach': { params: any; response: any };
  'boot.scrub': { params: any; response: any };

  // Bootenv
  'bootenv.create': { params: any; response: any };
  'bootenv.update': { params: any; response: any };
  'bootenv.set_attribute': { params: SetBootenvAttributeParams; response: boolean };
  'bootenv.activate': { params: any; response: any };
  'bootenv.delete': { params: any; response: any };
  'bootenv.query': { params: QueryParams<Bootenv>; response: Bootenv[] };

  // Catalog
  'catalog.query': { params: QueryParams<any, { extra: { item_details: boolean; cache: boolean; retrieve_versions: boolean } }>; response: Catalog[] };
  'catalog.update': { params: any; response: any };
  'catalog.create': { params: any; response: any };
  'catalog.delete': { params: [/* name */ string]; response: boolean };
  'catalog.items': { params: any; response: any };
  'catalog.sync': { params: any; response: any };
  'catalog.sync_all': { params: void; response: any };
  'catalog.get_item_details': { params: any; response: any };

  // Certificate
  'certificate.create': { params: any; response: any };
  'certificate.query': { params: QueryParams<Certificate>; response: Certificate[] };
  'certificate.update': { params: any; response: any };
  'certificate.ec_curve_choices': { params: any; response: any };
  'certificate.country_choices': { params: any; response: any };
  'certificate.extended_key_usage_choices': { params: void; response: ExtendedKeyUsageChoices };
  'certificate.profiles': { params: void; response: CertificateProfiles };
  'certificate.acme_server_choices': { params: any; response: any };
  'certificate.get_domain_names': { params: any; response: any };

  // Certificate Authority
  'certificateauthority.create': { params: [CertificateAuthorityCreate]; response: any };
  'certificateauthority.query': { params: QueryParams<CertificateAuthority>; response: CertificateAuthority[] };
  'certificateauthority.update': { params: [number, CertificateAuthorityUpdate]; response: any };
  'certificateauthority.profiles': { params: any; response: any };
  'certificateauthority.ca_sign_csr': { params: any; response: any };

  // Chart
  'chart.release.pod_logs_choices': { params: any; response: any };
  'chart.release.query': { params: ChartReleaseQueryParams; response: ChartRelease[] };
  'chart.release.create': { params: ChartReleaseCreate; response: ChartReleaseCreateResponse };
  'chart.release.update': { params: any; response: any };
  'chart.release.upgrade': { params: any; response: any };
  'chart.release.delete': { params: any; response: any };
  'chart.release.scale': { params: any; response: any };
  'chart.release.pod_console_choices': { params: any; response: any };
  'chart.release.nic_choices': { params: void; response: Choices };
  'chart.release.events': { params: any; response: any };
  'chart.release.rollback': { params: any; response: any };
  'chart.release.upgrade_summary': { params: any; response: any };

  // CRON
  'cronjob.run': { params: any; response: any };
  'cronjob.query': { params: QueryParams<Cronjob>; response: Cronjob[] };
  'cronjob.delete': { params: any; response: any };

  // Core
  'core.download': { params: CoreDownloadQuery; response: CoreDownloadResponse };
  'core.get_jobs': { params: QueryParams<Job>; response: Job[] };
  'core.job_abort': { params: any; response: any };
  'core.bulk': { params: any; response: any };
  'core.resize_shell': { params: ResizeShellRequest; response: void };

  // Config
  'config.upload': { params: any; response: any };
  'config.reset': { params: any; response: any };

  // Cloudsync
  'cloudsync.providers': { params: void; response: CloudsyncProvider[] };
  'cloudsync.credentials.query': { params: QueryParams<CloudsyncCredential>; response: CloudsyncCredential[] };
  'cloudsync.credentials.create': { params: any; response: any };
  'cloudsync.credentials.update': { params: any; response: any };
  'cloudsync.credentials.verify': { params: any; response: any };
  'cloudsync.onedrive_list_drives': { params: any; response: any };
  'cloudsync.list_buckets': { params: any; response: any };
  'cloudsync.list_directory': { params: any; response: any };
  'cloudsync.update': { params: any; response: any };
  'cloudsync.create': { params: any; response: any };
  'cloudsync.sync': { params: any; response: any };
  'cloudsync.abort': { params: any; response: any };
  'cloudsync.restore': { params: any; response: any };
  'cloudsync.query': { params: QueryParams<CloudSyncTask>; response: CloudSyncTask[] };
  'cloudsync.delete': { params: any; response: any };
  'cloudsync.sync_onetime': { params: any; response: any };

  // Container
  'container.config': { params: void; response: ContainerConfig };
  'container.update': { params: [ContainerConfigUpdate]; response: ContainerConfig };
  'container.image.query': { params: void; response: ContainerImage[] };
  'container.image.pull': { params: [PullContainerImageParams]; response: any };
  'container.image.delete': { params: any; response: any };

  // DynDNS
  'dyndns.provider_choices': { params: void; response: Choices };
  'dyndns.update': { params: [DynamicDnsUpdate]; response: any };
  'dyndns.config': { params: void; response: DynamicDnsConfig };

  // Datastore
  'datastore.delete': { params: any; response: any };

  // Device
  'device.gpu_pci_ids_choices': { params: any; response: any };
  'device.get_info': { params: any; response: any };

  // Disk
  'disk.query': { params: QueryParams<Disk, DiskQueryOptions>; response: Disk[] };
  'disk.update': { params: [string, DiskUpdate]; response: Disk }; // TODO: Response is a job
  'disk.get_unused': { params: any; response: any };
  'disk.get_encrypted': { params: any; response: any };
  'disk.temperatures': { params: any; response: any };
  'disk.wipe': { params: any; response: any };

  // Directory Services
  'directoryservices.cache_refresh': { params: void; response: any };
  'directoryservices.get_state': { params: any; response: any };

  // Enclosure
  'enclosure.query': { params: any; response: any };
  'enclosure.update': { params: any; response: any };
  'enclosure.set_slot_status': { params: any; response: any };

  // Filesystem
  'filesystem.acl_is_trivial': {
    params: [string];
    /**
     * Returns True if the ACL can be fully expressed as a file mode without losing any access rules,
     * or if the path does not support NFSv4 ACLs (for example a path on a tmpfs filesystem).
     */
    response: boolean;
  };
  'filesystem.listdir': { params: any; response: any };
  'filesystem.stat': { params: [/* path */ string]; response: FileSystemStat };
  'filesystem.default_acl_choices': { params: void; response: string[] };
  'filesystem.get_default_acl': { params: [DefaultAclType]; response: NfsAclItem[] };
  'filesystem.statfs': { params: any; response: any };
  'filesystem.getacl': { params: AclQueryParams; response: Acl };
  'filesystem.setacl': { params: [SetAcl]; response: any };

  // Failover
  'failover.licensed': { params: void; response: boolean };
  'failover.upgrade_pending': { params: any; response: any };
  'failover.sync_from_peer': { params: any; response: any };
  'failover.status': { params: any; response: any };
  'failover.update': { params: [FailoverUpdate]; response: any };
  'failover.force_master': { params: any; response: any };
  'failover.call_remote': { params: any; response: any };
  'failover.get_ips': { params: any; response: string[] };
  'failover.node': { params: any; response: any };
  'failover.disabled_reasons': { params: void; response: FailoverDisabledReason[] };
  'failover.config': { params: any; response: any };
  'failover.sync_to_peer': { params: any; response: any };
  'failover.upgrade_finish': { params: any; response: any };
  'failover.upgrade': { params: any; response: any };

  // FCPort
  'fcport.query': { params: any; response: any };
  'fcport.update': { params: any; response: any };

  // DS Cache
  'dscache.get_uncached_group': { params: any; response: any };
  'dscache.get_uncached_user': { params: any; response: any };

  // Keychain Credential
  'keychaincredential.create': { params: any; response: any };
  'keychaincredential.query': { params: QueryParams<KeychainCredential>; response: KeychainCredential[] };
  'keychaincredential.update': { params: any; response: any };
  'keychaincredential.generate_ssh_key_pair': { params: void; response: SshKeyPair };
  'keychaincredential.remote_ssh_host_key_scan': { params: any; response: any };
  'keychaincredential.delete': { params: any; response: any };
  'keychaincredential.remote_ssh_semiautomatic_setup': { params: any; response: any };

  // Kubernetes
  'kubernetes.config': { params: void; response: KubernetesConfig };
  'kubernetes.update': { params: [KubernetesConfigUpdate]; response: any };
  'kubernetes.bindip_choices': { params: void; response: Choices };

  // Multipath
  'multipath.query': { params: any; response: any };

  // Mail
  'mail.config': { params: any; response: any };
  'mail.update': { params: any; response: any };
  'mail.send': { params: any; response: any };

  // idmap
  'idmap.backend_options': { params: any; response: any };
  'idmap.query': { params: any; response: any };
  'idmap.create': { params: any; response: any };
  'idmap.update': { params: any; response: any };
  'idmap.delete': { params: any; response: any };
  'idmap.clear_idmap_cache': { params: any; response: any };

  // Interface
  'interface.websocket_local_ip': { params: any; response: any };
  'interface.commit': { params: any; response: any };
  'interface.services_restarted_on_sync': { params: any; response: any };
  'interface.rollback': { params: any; response: any };
  'interface.bridge_members_choices': { params: any; response: Choices };
  'interface.lag_supported_protocols': { params: void; response: string[] };
  'interface.lag_ports_choices': { params: any; response: Choices };
  'interface.vlan_parent_interface_choices': { params: void; response: Choices };
  'interface.query': { params: QueryParams<NetworkInterface>; response: NetworkInterface[] };
  'interface.create': { params: any; response: any };
  'interface.update': { params: any; response: any };
  'interface.has_pending_changes': { params: void; response: boolean };
  'interface.checkin_waiting': { params: void; response: any };
  'interface.checkin': { params: any; response: any };
  'interface.websocket_interface': { params: any; response: any };

  // iSCSI
  'iscsi.initiator.query': { params: any; response: IscsiInitiatorGroup[] };
  'iscsi.initiator.delete': { params: any; response: any };
  'iscsi.target.query': { params: any; response: IscsiTarget[] };
  'iscsi.extent.disk_choices': { params: void; response: Choices };
  'iscsi.extent.query': { params: any; response: IscsiExtent[] };
  'iscsi.extent.create': { params: any; response: any };
  'iscsi.extent.update': { params: any; response: any };
  'iscsi.extent.delete': { params: any; response: any };
  'iscsi.auth.query': { params: any; response: IscsiAuthAccess[] };
  'iscsi.auth.delete': { params: any; response: any };
  'iscsi.global.sessions': { params: any; response: any };
  'iscsi.global.config': { params: any; response: any };
  'iscsi.global.update': { params: any; response: any };
  'iscsi.targetextent.create': { params: any; response: any };
  'iscsi.targetextent.query': { params: any; response: IscsiTargetExtent[] };
  'iscsi.targetextent.update': { params: any; response: any };
  'iscsi.targetextent.delete': { params: any; response: any };
  'iscsi.auth.update': { params: any; response: any };
  'iscsi.auth.create': { params: any; response: any };
  'iscsi.initiator.create': { params: any; response: any };
  'iscsi.initiator.update': { params: any; response: any };
  'iscsi.portal.create': { params: any; response: any };
  'iscsi.portal.update': { params: any; response: any };
  'iscsi.portal.listen_ip_choices': { params: void; response: Choices };
  'iscsi.portal.query': { params: any; response: IscsiPortal[] };
  'iscsi.portal.delete': { params: any; response: any };
  'iscsi.target.update': { params: any; response: any };
  'iscsi.target.create': { params: any; response: any };
  'iscsi.target.delete': { params: any; response: any };

  // IPMI
  'ipmi.is_loaded': { params: void; response: boolean };
  'ipmi.identify': { params: any; response: any };
  'ipmi.update': { params: any; response: any };
  'ipmi.query': { params: any; response: any };

  // Group
  'group.query': { params: QueryParams<Group>; response: Group[] };
  'group.create': { params: any; response: any };
  'group.update': { params: [string, Partial<Group>]; response: void };
  'group.delete': { params: any; response: any };
  'group.get_group_obj': { params: any; response: any };
  'group.get_next_gid': { params: any; response: any };

  // Notifier
  'notifier.choices': { params: any; response: any };

  // Network
  'network.general.summary': { params: void; response: NetworkSummary };
  'network.configuration.activity_choices': { params: void; response: NetworkActivityChoice[] };
  'network.configuration.update': { params: any; response: any };
  'network.configuration.config': { params: void; response: NetworkConfiguration };

  // Kerberos
  'kerberos.realm.query': { params: QueryParams<KerberosRealm>; response: KerberosRealm[] };
  'kerberos.realm.create': { params: any; response: any };
  'kerberos.realm.update': { params: any; response: any };
  'kerberos.realm.delete': { params: any; response: any };
  'kerberos.keytab.has_nfs_principal': { params: any; response: any };
  'kerberos.config': { params: void; response: KerberosConfig };
  'kerberos.update': { params: any; response: any };
  'kerberos.keytab.kerberos_principal_choices': { params: void; response: string[] };
  'kerberos.keytab.create': { params: any; response: any };
  'kerberos.keytab.update': { params: any; response: any };
  'kerberos.keytab.query': { params: any; response: any };
  'kerberos.keytab.delete': { params: any; response: any };

  'kmip.update': { params: any; response: any };
  'kmip.config': { params: any; response: any };
  'kmip.kmip_sync_pending': { params: any; response: any };
  'kmip.sync_keys': { params: any; response: any };
  'kmip.clear_sync_pending_keys': { params: any; response: any };

  // Ldap
  'ldap.ssl_choices': { params: void; response: string[] };
  'ldap.update': { params: any; response: any };
  'ldap.schema_choices': { params: void; response: string[] };
  'ldap.config': { params: void; response: LdapConfig };

  // LLDP
  'lldp.country_choices': { params: void; response: Choices };
  'lldp.update': { params: [LldpConfigUpdate]; response: LldpConfig };
  'lldp.config': { params: void; response: LldpConfig };

  // NIS
  'nis.update': { params: any; response: any };
  'nis.config': { params: any; response: any };

  // NFS
  'nfs.bindip_choices': { params: void; response: Choices };
  'nfs.add_principal': { params: any; response: any };
  'nfs.config': { params: void; response: NfsConfig };
  'nfs.update': { params: any; response: any };

  // OpenVPN
  'openvpn.client.update': { params: any; response: any };
  'openvpn.client.authentication_algorithm_choices': { params: void; response: Choices };
  'openvpn.client.cipher_choices': { params: void; response: Choices };
  'openvpn.server.renew_static_key': { params: any; response: any };
  'openvpn.client.config': { params: void; response: OpenvpnClientConfig };
  'openvpn.server.cipher_choices': { params: any; response: any };
  'openvpn.server.authentication_algorithm_choices': { params: any; response: any };
  'openvpn.server.client_configuration_generation': { params: any; response: any };
  'openvpn.server.update': { params: any; response: any };
  'openvpn.server.config': { params: any; response: any };

  // Pool
  'pool.query': { params: QueryParams<Pool>; response: Pool[] };
  'pool.update': { params: any; response: any };
  'pool.create': { params: any; response: any };
  'pool.dataset.path_in_locked_datasets': { params: any; response: any };
  'pool.filesystem_choices': { params: any; response: any };
  'pool.dataset.set_quota': { params: any; response: any };
  'pool.dataset.recommended_zvol_blocksize': { params: any; response: any };
  'pool.dataset.inherit_parent_encryption_properties': { params: any; response: any };
  'pool.unlock_services_restart_choices': { params: any; response: any };
  'pool.dataset.get_quota': { params: any; response: any };
  'pool.dataset.change_key': { params: any; response: any };
  'pool.snapshottask.query': { params: QueryParams<PeriodicSnapshotTask>; response: PeriodicSnapshotTask[] };
  'pool.import_disk_autodetect_fs_type': { params: any; response: any };
  'pool.download_encryption_key': { params: any; response: any };
  'pool.snapshottask.create': { params: any; response: any };
  'pool.snapshottask.update': { params: any; response: any };
  'pool.import_disk_msdosfs_locales': { params: any; response: any };
  'pool.import_disk': { params: any; response: any };
  'pool.import_find': { params: any; response: any };
  'pool.import_pool': { params: any; response: any };
  'pool.expand': { params: any; response: any };
  'pool.snapshottask.delete': { params: any; response: any };
  'pool.dataset.query': {
    params: QueryParams<Dataset, ExtraDatasetQueryOptions>;
    response: Dataset[];
  };
  'pool.get_disks': { params: any; response: any };
  'pool.scrub.delete': { params: any; response: any };
  'pool.scrub.query': { params: QueryParams<PoolScrub>; response: PoolScrub[] };
  'pool.scrub.update': { params: any; response: any };
  'pool.scrub.create': { params: any; response: any };
  'pool.dataset.compression_choices': { params: void; response: Choices };
  'pool.dataset.encryption_algorithm_choices': { params: void; response: Choices };
  'pool.dataset.permission': { params: DatasetPermissionsUpdate; response: number };
  'pool.dataset.export_key': { params: any; response: any };
  'pool.offline': { params: any; response: any };
  'pool.online': { params: any; response: any };
  'pool.remove': { params: any; response: any };
  'pool.detach': { params: any; response: any };
  'pool.export': { params: any; response: any };
  'pool.passphrase': { params: any; response: any };
  'pool.rekey': { params: any; response: any };
  'pool.attachments': { params: any; response: any };
  'pool.recoverykey_rm': { params: any; response: any };
  'pool.processes': { params: any; response: any };
  'pool.scrub': { params: any; response: any };
  'pool.dataset.query_encrypted_roots_keys': { params: any; response: any };
  'pool.upgrade': { params: any; response: any };
  'pool.dataset.delete': { params: any; response: any };
  'pool.dataset.promote': { params: any; response: any };
  'pool.dataset.update': { params: any; response: any };
  'pool.dataset.create': { params: any; response: any };
  'pool.is_upgraded': { params: [/* pool id */ number]; response: boolean };
  'pool.dataset.encryption_summary': { params: any; response: any };
  'pool.dataset.unlock_services_restart_choices': { params: [/* id */ string]; response: Choices };
  'pool.dataset.lock': { params: any; response: any };
  'pool.dataset.unlock': { params: any; response: any };
  'pool.resilver.config': { params: any; response: any };
  'pool.resilver.update': { params: any; response: any };
  'pool.lock': { params: any; response: any };
  'pool.unlock': { params: any; response: any };

  // Replication
  'replication.list_datasets': { params: any; response: any };
  'replication.create': { params: any; response: any };
  'replication.query': { params: QueryParams<ReplicationTask>; response: ReplicationTask[] };
  'replication.restore': { params: any; response: any };
  'replication.run': { params: any; response: any };
  'replication.delete': { params: any; response: any };
  'replication.count_eligible_manual_snapshots': { params: any; response: any };
  'replication.list_naming_schemas': { params: any; response: any };
  'replication.target_unmatched_snapshots': { params: any; response: any };
  'replication.update': { params: any; response: any };

  // Rsync
  'rsynctask.run': { params: any; response: any };
  'rsynctask.query': { params: QueryParams<RsyncTask>; response: RsyncTask[] };
  'rsynctask.create': { params: any; response: any };
  'rsynctask.update': { params: any; response: any };
  'rsynctask.delete': { params: any; response: any };

  // Rsyncd
  'rsyncd.update': { params: [RsyncConfigUpdate]; response: RsyncConfig };
  'rsyncd.config': { params: void; response: RsyncConfig };

  // Rsyncmod
  'rsyncmod.query': { params: any; response: any };
  'rsyncmod.update': { params: any; response: any };
  'rsyncmod.create': { params: any; response: any };
  'rsyncmod.delete': { params: any; response: any };

  // Reporting
  'reporting.get_data': { params: any; response: any };
  'reporting.update': { params: any; response: any };
  'reporting.config': { params: void; response: ReportingConfig };
  'reporting.graphs': { params: any; response: any };

  // S3
  's3.bindip_choices': { params: void; response: Choices };
  's3.config': { params: void; response: S3Config };
  's3.update': { params: [S3ConfigUpdate]; response: S3Config };

  // SMB
  'smb.bindip_choices': { params: void; response: Choices };
  'smb.unixcharset_choices': { params: void; response: Choices };
  'smb.get_smb_ha_mode': { params: any; response: any };
  'smb.update': { params: any; response: any };
  'smb.config': { params: any; response: any };
  'smb.sharesec.query': { params: any; response: any };
  'smb.sharesec.update': { params: any; response: any };

  // SSH
  'ssh.update': { params: [SshConfigUpdate]; response: SshConfig };
  'ssh.config': { params: void; response: SshConfig };
  'ssh.bindiface_choices': { params: void; response: Choices };

  // System
  'system.feature_enabled': { params: any; response: any };
  'system.advanced.update': { params: any; response: any };
  'system.reboot': { params: any; response: any };
  'system.shutdown': { params: any; response: any };
  'system.advanced.serial_port_choices': { params: void; response: Choices };
  'system.info': { params: void; response: SystemInfo };
  'system.advanced.config': { params: void; response: AdvancedConfig };
  'system.general.update': { params: any; response: any };
  'system.ntpserver.delete': { params: any; response: any };
  'system.ntpserver.query': { params: any; response: any };
  'system.ntpserver.create': { params: any; response: any };
  'system.ntpserver.update': { params: any; response: any };
  'system.general.config': { params: void; response: SystemGeneralConfig };
  'system.general.kbdmap_choices': { params: void; response: Choices };
  'system.general.language_choices': { params: void; response: Choices };
  'system.general.timezone_choices': { params: void; response: Choices };
  'system.general.ui_address_choices': { params: void; response: Choices };
  'system.license_update': { params: any; response: any };
  'system.general.ui_v6address_choices': { params: void; response: Choices };
  'system.general.ui_certificate_choices': { params: any; response: any };
  'system.general.ui_httpsprotocols_choices': { params: void; response: Choices };
  'system.build_time': { params: void; response: ApiTimestamp };
  'system.product_type': { params: void; response: ProductType };

  // Support
  'support.is_available': { params: any; response: any };
  'support.is_available_and_enabled': { params: any; response: any };
  'support.config': { params: any; response: any };
  'support.update': { params: any; response: any };
  'support.new_ticket': { params: any; response: any };

  // SMART
  'smart.test.disk_choices': { params: void; response: Choices };
  'smart.update': { params: [SmartConfigUpdate]; response: SmartConfig };
  'smart.config': { params: void; response: SmartConfig };
  'smart.test.manual_test': { params: [SmartManualTestParams[]]; response: any };
  'smart.test.query': { params: QueryParams<SmartTest>; response: SmartTest[] };
  'smart.test.create': { params: any; response: any };
  'smart.test.results': { params: any; response: any };
  'smart.test.update': { params: any; response: any };
  'smart.test.delete': { params: any; response: any };

  // SystemDataset
  'systemdataset.pool_choices': { params: void; response: Choices };
  'systemdataset.config': { params: void; response: SystemDatasetConfig };
  'systemdataset.update': { params: [{ [poolName: string]: string }]; response: any };

  // Service
  'service.started': { params: any; response: any };
  'service.query': { params: QueryParams<Service>; response: Service[] };
  'service.update': { params: [number, Partial<Service>]; response: number };
  'service.start': { params: [ServiceName]; response: boolean };
  'service.stop': {
    params: [ServiceName];
    response: boolean; // False indicates that service has been stopped.
  };
  'service.restart': { params: any; response: any };

  // Sensor
  'sensor.query': { params: any; response: any };

  // Sharing
  'sharing.smb.query': { params: QueryParams<SmbShare>; response: SmbShare[] };
  'sharing.smb.create': { params: any; response: any };
  'sharing.smb.update': { params: any; response: any };
  'sharing.smb.delete': { params: any; response: any };
  'sharing.smb.presets': { params: any; response: any };
  'sharing.nfs.query': { params: any; response: NfsShare[] };
  'sharing.nfs.update': { params: any; response: any };
  'sharing.nfs.create': { params: any; response: any };
  'sharing.nfs.delete': { params: any; response: any };
  'sharing.webdav.query': { params: any; response: WebDavShare[] };
  'sharing.webdav.update': { params: any; response: any };
  'sharing.webdav.create': { params: any; response: any };
  'sharing.webdav.delete': { params: any; response: any };

  // Stats
  'stats.get_data': { params: any; response: any };
  'stats.get_sources': { params: any; response: any };

  // Tunable
  'tunable.tunable_type_choices': { params: void; response: Choices };
  'tunable.query': { params: any; response: any };
  'tunable.update': { params: any; response: any };
  'tunable.create': { params: any; response: any };
  'tunable.delete': { params: any; response: any };

  // TFTP
  'tftp.update': { params: any; response: any };
  'tftp.config': { params: any; response: any };

  // FTP
  'ftp.update': { params: any; response: any };
  'ftp.config': { params: void; response: FtpConfig };

  // Truecommand
  'truecommand.config': { params: void; response: TrueCommandConfig };
  'truecommand.update': { params: any; response: any };
  'truecommand.connected': { params: any; response: any };

  // TrueNAS
  'truenas.is_eula_accepted': { params: void; response: boolean };
  'truenas.get_eula': { params: void; response: string };
  'truenas.accept_eula': { params: void; response: void };
  'truenas.is_production': { params: void; response: boolean };
  'truenas.set_production': { params: any; response: any };

  // Vm
  'vm.query': { params: QueryParams<VirtualMachine, { get: boolean }>; response: VirtualMachine[] };
  'vm.cpu_model_choices': { params: void; response: Choices };
  'vm.bootloader_options': { params: any; response: any };
  'vm.device.nic_attach_choices': { params: void; response: Choices };
  'vm.device.bind_choices': { params: void; response: Choices };
  'vm.create': { params: any; response: any };
  'vm.delete': { params: any; response: any };
  'vm.resolution_choices': { params: void; response: Choices };
  'vm.get_display_web_uri': { params: any; response: any };
  'vm.device.passthrough_device_choices': { params: void; response: Choices };
  'vm.device.create': { params: any; response: any };
  'vm.random_mac': { params: void; response: string };
  'vm.device.query': { params: QueryParams<VmDevice>; response: VmDevice[] };
  'vm.stop': { params: VmStopParams; response: any };
  'vm.maximum_supported_vcpus': { params: void; response: number };
  'vm.device.update': { params: any; response: any };
  'vm.port_wizard': { params: any; response: any };
  'vm.get_available_memory': { params: void; response: number };
  'vm.clone': { params: any; response: any };
  'vm.update': { params: any; response: any };
  'vm.poweroff': { params: any; response: any };
  'vm.restart': { params: [/* id */ number]; response: any };
  'vm.get_display_devices': { params: any; response: any };
  'vm.start': { params: any; response: any };
  'vm.get_vmemory_in_use': { params: any; response: any };

  // Vmware
  'vmware.dataset_has_vms': { params: any; response: any };
  'vmware.query': { params: any; response: any };
  'vmware.create': { params: any; response: any };
  'vmware.update': { params: any; response: any };
  'vmware.delete': { params: any; response: any };
  'vmware.match_datastores_with_datasets': { params: any; response: any };

  // User
  'user.update': { params: any; response: any };
  'user.create': { params: any; response: any };
  'user.query': { params: QueryParams<User>; response: User[] };
  'user.set_root_password': { params: any; response: any };
  'user.delete': { params: any; response: any };
  'user.get_user_obj': { params: any; response: any };
  'user.shell_choices': { params: [/* userId */ number?]; response: Choices };
  'user.set_attribute': { params: any; response: any };
  'user.get_next_uid': { params: any; response: any };
  'user.has_root_password': { params: void; response: boolean };

  // UPS
  'ups.update': { params: any; response: any };
  'ups.config': { params: void; response: UpsConfig };
  'ups.driver_choices': { params: void; response: Choices };
  'ups.port_choices': { params: void; response: string[] };

  // Update
  'update.get_auto_download': { params: void; response: boolean };
  'update.get_trains': { params: void; response: SystemUpdateTrains };
  'update.set_auto_download': { params: [boolean]; response: void };
  'update.get_pending': { params: void; response: SystemUpdateChange[] };
  'update.check_available': { params: void; response: SystemUpdate };
  'update.set_train': { params: any; response: any };
  'update.download': { params: any; response: any };
  'update.update': { params: any; response: any };

  // ZFS
  'zfs.snapshot.create': { params: any; response: any };
  'zfs.snapshot.query': { params: QueryParams<ZfsSnapshot>; response: ZfsSnapshot[] };
  'zfs.snapshot.delete': { params: any; response: any };
  'zfs.snapshot.clone': { params: any; response: any };
  'zfs.snapshot.rollback': { params: any; response: any };
  'zfs.pool.scan': { params: any; response: any };

  // staticroute
  'staticroute.query': { params: QueryParams<StaticRoute>; response: StaticRoute[] };
  'staticroute.create': { params: any; response: any };
  'staticroute.update': { params: any; response: any };
  'staticroute.delete': { params: [/* id */ number]; response: boolean };

  // SNMP
  'snmp.config': { params: void; response: SnmpConfig };
  'snmp.update': { params: [SnmpConfigUpdate]; response: SnmpConfig };

  // WEBDAV
  'webdav.config': { params: void; response: WebdavConfig };
  'webdav.update': { params: [WebdavConfigUpdate]; response: WebdavConfig };

  // InitShutdownScript
  'initshutdownscript.query': { params: QueryParams<InitShutdownScript>; response: InitShutdownScript[] };
  'initshutdownscript.create': { params: any; response: any };
  'initshutdownscript.update': { params: any; response: any };
  'initshutdownscript.delete': { params: [/* id */ number]; response: boolean };
};

/**
 * Prefer typing like this:
 * ```
 * queryCall: 'user.query' = 'user.query'
 * ```
 * instead of using ApiMethod.
 */
export type ApiMethod = keyof ApiDirectory;
