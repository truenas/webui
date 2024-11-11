import {
  AclType,

} from 'app/enums/acl-type.enum';
import {
  NfsAclTag,
  NfsAclType,
  NfsAdvancedFlag,
  NfsAdvancedPermission,
  NfsBasicFlag,
  NfsBasicPermission,
} from 'app/enums/nfs-acl.enum';
import { PosixAclTag, PosixPermission } from 'app/enums/posix-acl.enum';
import { QueryFilter, QueryOptions } from 'app/interfaces/query-api.interface';

export type Acl = NfsAcl | PosixAcl;

export interface BaseAcl {
  acltype: AclType;
  gid: number;
  trivial: boolean;
  uid: number;
}

export interface NfsAcl extends BaseAcl {
  acl: NfsAclItem[];
  acltype: AclType.Nfs4;
  nfs41_flags: Nfs41Flags;
}

export interface PosixAcl extends BaseAcl {
  acl: PosixAclItem[];
  acltype: AclType.Posix1e;
  flags: AclFlags;
}

export type AclQueryParams = [
  path: string,
  simplified?: boolean,
  resolveIds?: boolean,
];

export interface PosixAclItem {
  default: boolean;
  id: number;
  perms: PosixPermissions;
  tag: PosixAclTag;

  /**
   * Present when queried with resolve_ids.
   */
  who?: string;
}

export interface NfsAclItem {
  tag: NfsAclTag;
  id: number;
  type: NfsAclType;
  perms: BasicNfsPermissions | AdvancedNfsPermissions;
  flags: BasicNfsFlags | AdvancedNfsFlags;

  /**
   * Present when queried with resolve_ids.
   */
  who?: string;
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

export function areNfsPermissionsBasic(
  permissions: BasicNfsPermissions | AdvancedNfsPermissions,
): permissions is BasicNfsPermissions {
  return 'BASIC' in permissions;
}

export type AdvancedNfsFlags = {
  [key in NfsAdvancedFlag]: boolean;
};

export interface BasicNfsFlags {
  BASIC: NfsBasicFlag;
}

export function areNfsFlagsBasic(flags: BasicNfsFlags | AdvancedNfsFlags): flags is BasicNfsFlags {
  return 'BASIC' in flags;
}

export interface PosixPermissions {
  [PosixPermission.Read]: boolean;
  [PosixPermission.Write]: boolean;
  [PosixPermission.Execute]: boolean;
}

export interface Nfs41Flags {
  autoinherit: boolean;
  protected: boolean;
}

export interface SetAclOptions {
  stripacl?: boolean;
  recursive?: boolean;
  traverse?: boolean;
  canonicalize?: boolean;
  validate_effective_acl?: boolean;
}

export interface SetAcl {
  path: string;
  uid?: number;
  user?: string;
  gid?: number;
  group?: string;
  dacl: NfsAclItem[] | PosixAclItem[];
  nfs41_flags?: Nfs41Flags;
  acltype?: AclType;
  options: SetAclOptions;
}

export interface AclTemplateByPathParams {
  path?: string;
  'query-filters'?: QueryFilter<unknown>[];
  'query-options'?: QueryOptions<unknown>;
  'format-options'?: {
    canonicalize?: boolean;
    ensure_builtins?: boolean;
    resolve_names?: boolean;
  };
}

export type AclTemplateByPath = NfsAclTemplateByPath | PosixAclTemplateByPath;

export interface BaseAclTemplateByPath {
  id: number;
  name: string;
  builtin: boolean;
  comment: string;
}

export interface NfsAclTemplateByPath extends BaseAclTemplateByPath {
  acltype: AclType.Nfs4;
  acl: NfsAclItem[];
}

export interface PosixAclTemplateByPath extends BaseAclTemplateByPath {
  acltype: AclType.Posix1e;
  acl: PosixAclItem[];
}

export interface AclTemplateCreateParams {
  name: string;
  acltype: AclType.Nfs4 | AclType.Posix1e;
  acl: NfsAclItem[] | PosixAclItem[];
  comment?: string;
}

export interface AclTemplateCreateResponse {
  name: string;
  acltype: AclType.Nfs4 | AclType.Posix1e;
  acl: NfsAclItem[] | PosixAclItem[];
  comment: string;
  id: number;
  builtin: boolean;
}
