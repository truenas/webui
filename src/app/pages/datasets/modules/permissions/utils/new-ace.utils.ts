import {
  NfsAclTag, NfsAclType, NfsBasicFlag, NfsBasicPermission,
} from 'app/enums/nfs-acl.enum';
import { PosixAclTag, PosixPermission } from 'app/enums/posix-acl.enum';

export const newNfsAce = {
  tag: NfsAclTag.User,
  type: NfsAclType.Allow,
  perms: {
    BASIC: NfsBasicPermission.Modify,
  },
  flags: {
    BASIC: NfsBasicFlag.Inherit,
  },
};

export const newPosixAce = {
  tag: PosixAclTag.Mask,
  default: false,
  perms: {
    [PosixPermission.Read]: false,
    [PosixPermission.Write]: false,
    [PosixPermission.Execute]: false,
  },
};
