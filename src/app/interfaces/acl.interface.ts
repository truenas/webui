import {
  AclItemTag, AclPermission, AclType, DAclFlagsBasic, DAclNfs4Tag, DAclPermissionsBasic, DAclPosix1eTag, DAclType,
} from 'app/enums/acl-type.enum';

export interface Acl {
  acl: PosixAclItem[]; // TODO: There may be a different interface for NFS ACL
  acltype: AclType;
  flags: AclFlags;
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

export interface AclFlags {
  setuid: boolean;
  setgid: boolean;
  sticky: boolean;
}

export interface DAclPermissions {
  READ_DATA: boolean;
  WRITE_DATA: boolean;
  APPEND_DATA: boolean;
  READ_NAMED_ATTRS: boolean;
  WRITE_NAMED_ATTRS: boolean;
  EXECUTE: boolean;
  DELETE_CHILD: boolean;
  READ_ATTRIBUTES: boolean;
  WRITE_ATTRIBUTES: boolean;
  DELETE: boolean;
  READ_ACL: boolean;
  WRITE_ACL: boolean;
  WRITE_OWNER: boolean;
  SYNCHRONIZE: boolean;
  BASIC: DAclPermissionsBasic;
}

export interface DAclFlags {
  FILE_INHERIT: boolean;
  DIRECTORY_INHERIT: boolean;
  NO_PROPAGATE_INHERIT: boolean;
  INHERIT_ONLY: boolean;
  INHERITED: boolean;
  BASIC: DAclFlagsBasic;
}

export interface DAclNfs4 {
  tag: DAclNfs4Tag;
  id: number;
  type: DAclType;
  perms: DAclPermissions;
  flags: DAclFlags;
}

export interface DAclPosix1ePermissions {
  READ: boolean;
  WRITE: boolean;
  EXECUTE: boolean;
}

export interface DAclPosix1e {
  default: boolean;
  tag: DAclPosix1eTag;
  id: number;
  perms: DAclPosix1ePermissions;
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
  dacl: DAclNfs4[] | DAclPosix1e[];
  nfs41_flags: Nfs41Flags;
  acltype: AclType;
  options: SetAclOptions;
}
