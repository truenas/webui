import { Permissions } from './permissions';
import { AclFlags } from './acl-flags';
  
interface NFS41Flags {
  autoinherit: boolean;
  protected: boolean;
}

interface Acl {
  perms: Permissions;
  flags: AclFlags;
  tag: string;
  type: string;
  id: number;
  default: boolean;
}

interface AclOptions {
  stripacl: boolean;
  recursive: boolean;
  traverse: boolean;
  canonicalize: boolean;
}

export interface AccessControlList {
  uid: number;
  gid: number;
  acltype: string;
  acl: Acl[];
  path: string;
  dacl: Acl[];
  nfs41_flags: NFS41Flags;
  options: AclOptions;
}