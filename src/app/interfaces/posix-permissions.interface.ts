import { PosixPermissions } from 'app/interfaces/acl.interface';

export interface UnixFilePermissions {
  owner: PosixPermissions;
  group: PosixPermissions;
  other: PosixPermissions;
}
