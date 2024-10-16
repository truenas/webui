import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Brand } from 'utility-types';

export enum DatasetAclType {
  Inherit = 'INHERIT',
  Off = 'OFF',
  NoAcl = 'NOACL',
  Nfsv4 = 'NFSV4',
  Nfs4Acl = 'NFS4ACL',
  Posix = 'POSIX',
  PosixAcl = 'POSIXACL',
}

export enum DatasetEncryptionType {
  Default = 'DEFAULT', // Key
  Passphrase = 'PASSPHRASE',
}

export enum DatasetQuotaType {
  Dataset = 'DATASET',
  Project = 'PROJECT',
  User = 'USER',
  Group = 'GROUP',
  UserObj = 'USEROBJ',
  GroupObj = 'GROUPOBJ',
}

export enum DatasetSource {
  Local = 'local',
  Remote = 'remote',
}

export enum DatasetType {
  Filesystem = 'FILESYSTEM',
  Volume = 'VOLUME',
}

export type DatasetVolumeBlockSize = Brand<string, 'DatasetVolumeBlockSize'>;
export type DatasetRecordSize = Brand<string, 'DatasetRecordSize'>;

export enum DatasetSync {
  Standard = 'STANDARD',
  Always = 'ALWAYS',
  Disabled = 'DISABLED',
}

export const datasetSyncLabels = new Map<DatasetSync, string>([
  [DatasetSync.Standard, T('Standard')],
  [DatasetSync.Always, T('Always')],
  [DatasetSync.Disabled, T('Disabled')],
]);

export enum DatasetSnapdir {
  Visible = 'VISIBLE',
  Hidden = 'HIDDEN',
  Disabled = 'DISABLED',
}

export const datasetSnapdirLabels = new Map<DatasetSnapdir, string>([
  [DatasetSnapdir.Visible, T('Visible')],
  [DatasetSnapdir.Hidden, T('Invisible')],
  [DatasetSnapdir.Disabled, T('Disabled')],
]);

export enum DatasetSnapdev {
  Visible = 'VISIBLE',
  Hidden = 'HIDDEN',
}

export const datasetSnapdevLabels = new Map<DatasetSnapdev, string>([
  [DatasetSnapdev.Visible, T('Visible')],
  [DatasetSnapdev.Hidden, T('Hidden')],
]);

export enum DatasetChecksum {
  On = 'ON',
  Off = 'OFF',
  Fletcher2 = 'FLETCHER2',
  Fletcher4 = 'FLETCHER4',
  Sha256 = 'SHA256',
  Sha512 = 'SHA512',
  Skein = 'SKEIN',
  Edonr = 'EDONR',
}

export enum DatasetCaseSensitivity {
  Sensitive = 'SENSITIVE',
  Insensitive = 'INSENSITIVE',
}

export const datasetCaseSensitivityLabels = new Map<DatasetCaseSensitivity, string>([
  [DatasetCaseSensitivity.Sensitive, T('Sensitive')],
  [DatasetCaseSensitivity.Insensitive, T('Insensitive')],
]);

export enum DatasetPreset {
  Generic = 'GENERIC',
  Smb = 'SMB',
  Apps = 'APPS',
  Multiprotocol = 'MULTIPROTOCOL',
}

export const datasetPresetLabels = new Map<DatasetPreset, string>([
  [DatasetPreset.Generic, T('Generic')],
  [DatasetPreset.Smb, T('SMB')],
  [DatasetPreset.Apps, T('Apps')],
  [DatasetPreset.Multiprotocol, T('Multiprotocol')],
]);
