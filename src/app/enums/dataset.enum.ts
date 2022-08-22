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
  Inherit = 'INHERIT',
}

export enum DatasetSnapdir {
  Visible = 'VISIBLE',
  Hidden = 'HIDDEN',
  Inherit = 'INHERIT',
}

export enum DatasetSnapdev {
  Visible = 'VISIBLE',
  Hidden = 'HIDDEN',
  Inherit = 'INHERIT',
}

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
  Inherit = 'INHERIT',
  Sensitive = 'SENSITIVE',
  Insensitive = 'INSENSITIVE',
  Mixed = 'MIXED',
}

export enum DatasetShareType {
  Generic = 'GENERIC',
  Smb = 'SMB',
}

export enum DatasetXattr {
  Inherit = 'INHERIT',
  On = 'ON',
  Sa = 'SA',
}
