import { AclItemTag, AclPermission, AclType } from 'app/enums/acl-type.enum';

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
