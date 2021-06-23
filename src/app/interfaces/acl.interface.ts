import {
  AclItemTag,
  AclPermission,
  AclType,
  NfsBasicFlag,
  NfsAclTag,
  NfsBasicPermission,
  NfsAclType,
  NfsAdvancedPermission,
  NfsAdvancedFlag,
} from 'app/enums/acl-type.enum';

export interface Acl {
  acl: PosixAclItem[] | NfsAclItem[];
  acltype: AclType;
  flags: AclFlags;
  nfs41_flags?: Nfs41Flags;
  gid: number;
  uid: number;
}

export interface PosixAclItem {
  default: boolean;
  id: number;
  perms: {
    [AclPermission.Read]: boolean;
    [AclPermission.Write]: boolean;
    [AclPermission.Execute]: boolean;
  };
  tag: AclItemTag;
}

export interface NfsAclItem {
  tag: NfsAclTag;
  id: number;
  type: NfsAclType;
  perms: BasicNfsPermissions | AdvancedNfsPermissions;
  flags: BasicNfsFlags | AdvancedNfsFlags;
}

export interface AclFlags {
  setuid: boolean;
  setgid: boolean;
  sticky: boolean;
}

export type AdvancedNfsPermissions = {
  [key in NfsAdvancedPermission]: boolean;
};

export interface BasicNfsPermissions {
  BASIC: NfsBasicPermission;
}

export type AdvancedNfsFlags = {
  [key in NfsAdvancedFlag]: boolean;
};

export interface BasicNfsFlags {
  BASIC: NfsBasicFlag;
}

export interface DAclPosix1ePermissions {
  [AclPermission.Read]: boolean;
  [AclPermission.Write]: boolean;
  [AclPermission.Execute]: boolean;
}

export interface Nfs41Flags {
  autoinherit: boolean;
  protected: boolean;
}

export interface SetAclOptions {
  stripacl: boolean;
  recursive: boolean;
  traverse: boolean;
  canonicalize: boolean;
}

export interface SetAcl {
  path: string;
  uid: number;
  gid: number;
  dacl: NfsAclItem[] | PosixAclItem[];
  nfs41_flags: Nfs41Flags;
  acltype: AclType;
  options: SetAclOptions;
}
