import { PosixAclTag, PosixPermission } from 'app/enums/posix-acl.enum';

export interface EditPosixAceFormValues {
  tag: PosixAclTag;
  user?: string;
  group?: string;
  permissions: PosixPermission[];
  default: boolean;
}
