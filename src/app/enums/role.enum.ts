import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum Role {
  AlertListRead = 'ALERT_LIST_READ',
  AuthSessionsRead = 'AUTH_SESSIONS_READ',
  AuthSessionsWrite = 'AUTH_SESSIONS_WRITE',
  DatasetDelete = 'DATASET_DELETE',
  DatasetRead = 'DATASET_READ',
  DatasetWrite = 'DATASET_WRITE',
  FilesystemAttrsRead = 'FILESYSTEM_ATTRS_READ',
  FilesystemAttrsWrite = 'FILESYSTEM_ATTRS_WRITE',
  FilesystemDataRead = 'FILESYSTEM_DATA_READ',
  FilesystemDataWrite = 'FILESYSTEM_DATA_WRITE',
  FilesystemFullControl = 'FILESYSTEM_FULL_CONTROL',
  FullAdmin = 'FULL_ADMIN',
  HasAllowList = 'HAS_ALLOW_LIST',
  KeychainCredentialRead = 'KEYCHAIN_CREDENTIAL_READ',
  KeychainCredentialWrite = 'KEYCHAIN_CREDENTIAL_WRITE',
  NetworkGeneralRead = 'NETWORK_GENERAL_READ',
  NetworkInterfaceRead = 'NETWORK_INTERFACE_READ',
  NetworkInterfaceWrite = 'NETWORK_INTERFACE_WRITE',
  Readonly = 'READONLY',
  ReplicationManager = 'REPLICATION_MANAGER',
  ReplicationTaskConfigRead = 'REPLICATION_TASK_CONFIG_READ',
  ReplicationTaskConfigWrite = 'REPLICATION_TASK_CONFIG_WRITE',
  ReplicationTaskRead = 'REPLICATION_TASK_READ',
  ReplicationTaskWrite = 'REPLICATION_TASK_WRITE',
  ReplicationTaskWritePull = 'REPLICATION_TASK_WRITE_PULL',
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
  SharingManager = 'SHARING_MANAGER',
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
}

export const roleNames = new Map<Role, string>([
  [Role.AlertListRead, T('Alert List Read')],
  [Role.AuthSessionsRead, T('Auth Sessions Read')],
  [Role.AuthSessionsWrite, T('Alert Sessions Write')],
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
  [Role.KeychainCredentialRead, T('Keychain Credential Read')],
  [Role.KeychainCredentialWrite, T('Keychain Credential Write')],
  [Role.NetworkGeneralRead, T('Network General Read')],
  [Role.NetworkInterfaceRead, T('Network Interface Read')],
  [Role.NetworkInterfaceWrite, T('Network Interface Write')],
  [Role.Readonly, T('Readonly')],
  [Role.ReplicationManager, T('Replication Manager')],
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
  [Role.SharingManager, T('Sharing Manager')],
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
]);
