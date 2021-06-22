export interface UnixFilePermissions {
  owner: UnixPermissions;
  group: UnixPermissions;
  other: UnixPermissions;
}

export interface UnixPermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
}
