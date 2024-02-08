import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum Role {
  AccountRead = 'ACCOUNT_READ',
  AccountWrite = 'ACCOUNT_WRITE',
  AlertListRead = 'ALERT_LIST_READ',
  AlertListWrite = 'ALERT_LIST_WRITE',
  AuthSessionsRead = 'AUTH_SESSIONS_READ',
  AuthSessionsWrite = 'AUTH_SESSIONS_WRITE',
  CloudSyncRead = 'CLOUD_SYNC_READ',
  CloudSyncWrite = 'CLOUD_SYNC_WRITE',
  DatasetDelete = 'DATASET_DELETE',
  DatasetRead = 'DATASET_READ',
  DatasetWrite = 'DATASET_WRITE',
  EnclosureRead = 'ENCLOSURE_READ',
  EnclosureWrite = 'ENCLOSURE_WRITE',
  FilesystemAttrsRead = 'FILESYSTEM_ATTRS_READ',
  FilesystemAttrsWrite = 'FILESYSTEM_ATTRS_WRITE',
  FilesystemDataRead = 'FILESYSTEM_DATA_READ',
  FilesystemDataWrite = 'FILESYSTEM_DATA_WRITE',
  FilesystemFullControl = 'FILESYSTEM_FULL_CONTROL',
  FullAdmin = 'FULL_ADMIN',
  HasAllowList = 'HAS_ALLOW_LIST',
  KeychainCredentialRead = 'KEYCHAIN_CREDENTIAL_READ',
  KeychainCredentialWrite = 'KEYCHAIN_CREDENTIAL_WRITE',
  KmipRead = 'KMIP_READ',
  KmipWrite = 'KMIP_WRITE',
  LocalAdministrator = 'LOCAL_ADMINISTRATOR',
  NetworkGeneralRead = 'NETWORK_GENERAL_READ',
  NetworkInterfaceRead = 'NETWORK_INTERFACE_READ',
  NetworkInterfaceWrite = 'NETWORK_INTERFACE_WRITE',
  ReadonlyAdmin = 'READONLY_ADMIN',
  ReplicationAdmin = 'REPLICATION_ADMIN',
  ReplicationTaskConfigRead = 'REPLICATION_TASK_CONFIG_READ',
  ReplicationTaskConfigWrite = 'REPLICATION_TASK_CONFIG_WRITE',
  ReplicationTaskRead = 'REPLICATION_TASK_READ',
  ReplicationTaskWrite = 'REPLICATION_TASK_WRITE',
  ReplicationTaskWritePull = 'REPLICATION_TASK_WRITE_PULL',
  ReportingRead = 'REPORTING_READ',
  ReportingWrite = 'REPORTING_WRITE',
  ServiceRead = 'SERVICE_READ',
  ServiceWrite = 'SERVICE_WRITE',
  SharingIscsiAuthRead = 'SHARING_ISCSI_AUTH_READ',
  SharingIscsiAuthWrite = 'SHARING_ISCSI_AUTH_WRITE',
  SharingIscsiExtentRead = 'SHARING_ISCSI_EXTENT_READ',
  SharingIscsiExtentWrite = 'SHARING_ISCSI_EXTENT_WRITE',
  SharingIscsiGlobalRead = 'SHARING_ISCSI_GLOBAL_READ',
  SharingIscsiGlobalWrite = 'SHARING_ISCSI_GLOBAL_WRITE',
  SharingIscsiHostRead = 'SHARING_ISCSI_HOST_READ',
  SharingIscsiHostWrite = 'SHARING_ISCSI_HOST_WRITE',
  SharingIscsiInitiatorRead = 'SHARING_ISCSI_INITIATOR_READ',
  SharingIscsiInitiatorWrite = 'SHARING_ISCSI_INITIATOR_WRITE',
  SharingIscsiPortalRead = 'SHARING_ISCSI_PORTAL_READ',
  SharingIscsiPortalWrite = 'SHARING_ISCSI_PORTAL_WRITE',
  SharingIscsiRead = 'SHARING_ISCSI_READ',
  SharingIscsiTargetExtentRead = 'SHARING_ISCSI_TARGETEXTENT_READ',
  SharingIscsiTargetExtentWrite = 'SHARING_ISCSI_TARGETEXTENT_WRITE',
  SharingIscsiTargetRead = 'SHARING_ISCSI_TARGET_READ',
  SharingIscsiTargetWrite = 'SHARING_ISCSI_TARGET_WRITE',
  SharingIscsiWrite = 'SHARING_ISCSI_WRITE',
  SharingAdmin = 'SHARING_ADMIN',
  SharingNfsRead = 'SHARING_NFS_READ',
  SharingNfsWrite = 'SHARING_NFS_WRITE',
  SharingRead = 'SHARING_READ',
  SharingSmbRead = 'SHARING_SMB_READ',
  SharingSmbWrite = 'SHARING_SMB_WRITE',
  SharingWrite = 'SHARING_WRITE',
  SnapshotDelete = 'SNAPSHOT_DELETE',
  SnapshotRead = 'SNAPSHOT_READ',
  SnapshotTaskRead = 'SNAPSHOT_TASK_READ',
  SnapshotTaskWrite = 'SNAPSHOT_TASK_WRITE',
  SnapshotWrite = 'SNAPSHOT_WRITE',
  SupportRead = 'SUPPORT_READ',
  SupportWrite = 'SUPPORT_WRITE',
  SystemAuditRead = 'SYSTEM_AUDIT_READ',
  SystemAuditWrite = 'SYSTEM_AUDIT_WRITE',
  AppsRead = 'APPS_READ',
  AppsWrite = 'APPS_WRITE',
  CatalogRead = 'CATALOG_READ',
  CatalogWrite = 'CATALOG_WRITE',
  CertificateAuthorityRead = 'CERTIFICATE_AUTHORITY_READ',
  CertificateAuthorityWrite = 'CERTIFICATE_AUTHORITY_WRITE',
  CertificateRead = 'CERTIFICATE_READ',
  CertificateWrite = 'CERTIFICATE_WRITE',
  ContainerRead = 'CONTAINER_READ',
  ContainerWrite = 'CONTAINER_WRITE',
  FailoverRead = 'FAILOVER_READ',
  FailoverWrite = 'FAILOVER_WRITE',
  IpmiRead = 'IPMI_READ',
  IpmiWrite = 'IPMI_WRITE',
  JbofRead = 'JBOF_READ',
  JbofWrite = 'JBOF_WRITE',
  KubernetesRead = 'KUBERNETES_READ',
  KubernetesWrite = 'KUBERNETES_WRITE',
  PoolScrubRead = 'POOL_SCRUB_READ',
  PoolScrubWrite = 'POOL_SCRUB_WRITE',
  VmDeviceRead = 'VM_DEVICE_READ',
  VmDeviceWrite = 'VM_DEVICE_WRITE',
  VmRead = 'VM_READ',
  VmWrite = 'VM_WRITE',
  DirectoryServiceRead = 'DIRECTORY_SERVICE_READ',
  DirectoryServiceWrite = 'DIRECTORY_SERVICE_WRITE',
}

export const roleNames = new Map<Role, string>([
  [Role.AlertListRead, T('Alert List Read')],
  [Role.AlertListWrite, T('Alert List Write')],
  [Role.AuthSessionsRead, T('Auth Sessions Read')],
  [Role.AuthSessionsWrite, T('Auth Sessions Write')],
  [Role.DatasetDelete, T('Dataset Delete')],
  [Role.DatasetRead, T('Dataset Read')],
  [Role.DatasetWrite, T('Dataset Write')],
  [Role.FilesystemAttrsRead, T('Filesystem Attrs Read')],
  [Role.FilesystemAttrsWrite, T('Filesystem Attrs Write')],
  [Role.FilesystemDataRead, T('Filesystem Data Read')],
  [Role.FilesystemDataWrite, T('Filesystem Data Write')],
  [Role.FilesystemFullControl, T('Filesystem Full Control')],
  [Role.FullAdmin, T('Full Admin')],
  [Role.HasAllowList, T('Has Allow List')],
  [Role.LocalAdministrator, T('Local Administrator')],
  [Role.KeychainCredentialRead, T('Keychain Credential Read')],
  [Role.KeychainCredentialWrite, T('Keychain Credential Write')],
  [Role.NetworkGeneralRead, T('Network General Read')],
  [Role.NetworkInterfaceRead, T('Network Interface Read')],
  [Role.NetworkInterfaceWrite, T('Network Interface Write')],
  [Role.ReadonlyAdmin, T('Readonly Admin')],
  [Role.ReplicationAdmin, T('Replication Admin')],
  [Role.ReplicationTaskConfigRead, T('Replication Task Config Read')],
  [Role.ReplicationTaskConfigWrite, T('Replication Task Config Write')],
  [Role.ReplicationTaskRead, T('Replication Task Read')],
  [Role.ReplicationTaskWrite, T('Replication Task Write')],
  [Role.ReplicationTaskWritePull, T('Replication Task Write Pull')],
  [Role.SharingIscsiAuthRead, T('Sharing iSCSI Auth Read')],
  [Role.SharingIscsiAuthWrite, T('Sharing iSCSI Auth Write')],
  [Role.SharingIscsiExtentRead, T('Sharing iSCSI Extent Read')],
  [Role.SharingIscsiExtentWrite, T('Sharing iSCSI Extent Write')],
  [Role.SharingIscsiGlobalRead, T('Sharing iSCSI Global Read')],
  [Role.SharingIscsiGlobalWrite, T('Sharing iSCSI Global Write')],
  [Role.SharingIscsiHostRead, T('Sharing iSCSI Host Read')],
  [Role.SharingIscsiHostWrite, T('Sharing iSCSI Host Write')],
  [Role.SharingIscsiInitiatorRead, T('Sharing iSCSI Initiator Read')],
  [Role.SharingIscsiInitiatorWrite, T('Sharing iSCSI Initiator Write')],
  [Role.SharingIscsiPortalRead, T('Sharing iSCSI Portal Read')],
  [Role.SharingIscsiPortalWrite, T('Sharing iSCSI Portal Write')],
  [Role.SharingIscsiRead, T('Sharing iSCSI Read')],
  [Role.SharingIscsiTargetExtentRead, T('Sharing iSCSI Target Extent Read')],
  [Role.SharingIscsiTargetExtentWrite, T('Sharing iSCSI Target Extent Write')],
  [Role.SharingIscsiTargetRead, T('Sharing iSCSI Target Read')],
  [Role.SharingIscsiTargetWrite, T('Sharing iSCSI Target Write')],
  [Role.SharingIscsiWrite, T('Sharing iSCSI Write')],
  [Role.SharingAdmin, T('Sharing Admin')],
  [Role.SharingNfsRead, T('Sharing NFS Read')],
  [Role.SharingNfsWrite, T('Sharing NFS Write')],
  [Role.SharingRead, T('Sharing Read')],
  [Role.SharingSmbRead, T('Sharing SMB Read')],
  [Role.SharingSmbWrite, T('Sharing SMB Write')],
  [Role.SharingWrite, T('Sharing Write')],
  [Role.SnapshotDelete, T('Snapshot Delete')],
  [Role.SnapshotRead, T('Snapshot Read')],
  [Role.SnapshotTaskRead, T('Snapshot Task Read')],
  [Role.SnapshotTaskWrite, T('Snapshot Task Write')],
  [Role.SnapshotWrite, T('Snapshot Write')],
  [Role.AuthSessionsRead, T('Auth Sessions Read')],
  [Role.AuthSessionsWrite, T('Auth Sessions Write')],
  [Role.ReportingRead, T('Reporting Read')],
  [Role.AccountRead, T('Account Read')],
  [Role.AccountWrite, T('Account Write')],
  [Role.CloudSyncRead, T('Cloud Sync Read')],
  [Role.CloudSyncWrite, T('Cloud Sync Write')],
  [Role.EnclosureRead, T('Enclosure Read')],
  [Role.EnclosureWrite, T('Enclosure Write')],
  [Role.KmipRead, T('KMIP Read')],
  [Role.KmipWrite, T('KMIP Write')],
  [Role.ReportingRead, T('Reporting Read')],
  [Role.ReportingWrite, T('Reporting Write')],
  [Role.ServiceRead, T('Service Read')],
  [Role.ServiceWrite, T('Service Write')],
  [Role.SupportRead, T('Support Read')],
  [Role.SupportWrite, T('Support Write')],
  [Role.SystemAuditRead, T('System Audit Read')],
  [Role.SystemAuditWrite, T('System Audit Write')],
  [Role.AppsRead, T('Apps Read')],
  [Role.AppsWrite, T('Apps Write')],
  [Role.CatalogRead, T('Catalog Read')],
  [Role.CatalogWrite, T('Catalog Write')],
  [Role.CertificateAuthorityRead, T('Certificate Authority Read')],
  [Role.CertificateAuthorityWrite, T('Certificate Authority Write')],
  [Role.CertificateRead, T('Certificate Read')],
  [Role.CertificateWrite, T('Certificate Write')],
  [Role.ContainerRead, T('Container Read')],
  [Role.ContainerWrite, T('Container Write')],
  [Role.FailoverRead, T('Failover Read')],
  [Role.FailoverWrite, T('Failover Write')],
  [Role.IpmiRead, T('IPMI Read')],
  [Role.IpmiWrite, T('IPMI Write')],
  [Role.JbofRead, T('JBOF Read')],
  [Role.JbofWrite, T('JBOF Write')],
  [Role.KubernetesRead, T('Kubernetes Read')],
  [Role.KubernetesWrite, T('Kubernetes Write')],
  [Role.PoolScrubRead, T('Pool Scrub Read')],
  [Role.PoolScrubWrite, T('Pool Scrub Write')],
  [Role.VmDeviceRead, T('VM Device Read')],
  [Role.VmDeviceWrite, T('VM Device Write')],
  [Role.VmRead, T('VM Read')],
  [Role.VmWrite, T('VM Write')],
  [Role.DirectoryServiceRead, T('Directory Service Read')],
  [Role.DirectoryServiceWrite, T('Directory Service Write')],
]);
