export enum AclType {
  Nfs4 = 'NFS4',
  Posix1e = 'POSIX1E',
  Rich = 'RICH',
}

export enum AclItemTag {
  UserObject = 'USER_OBJ',
  GroupObject = 'GROUP_OBJ',
  User = 'USER',
  Group = 'GROUP',
  Other = 'OTHER',
  Mask = 'MASK',
}

export enum AclPermission {
  Read = 'READ',
  Write = 'WRITE',
  Execute = 'EXECUTE',
}

export enum AclMode {
  Restricted = 'RESTRICTED',
  Passthrough = 'PASSTHROUGH',
  Discard = 'DISCARD',
}

export enum DefaultAclType {
  Nfs4Open = 'NFS4_OPEN',
  Nfs4Restricted = 'NFS4_RESTRICTED',
  Nfs4Home = 'NFS4_HOME',
  Nfs4DomainHome = 'NFS4_DOMAIN_HOME',
  PosixOpen = 'POSIX_OPEN',
  PosixRestricted = 'POSIX_RESTRICTED',
  Open = 'OPEN',
  Restricted = 'RESTRICTED',
  Home = 'HOME',
}

export enum NfsAclTag {
  Owner = 'owner@',
  Group = 'group@',
  Everyone = 'everyone@',
  User = 'USER',
  UserGroup = 'GROUP',
}

export enum NfsAclType {
  Allow = 'ALLOW',
  Deny = 'DENY',
}

export enum NfsBasicPermission {
  FullControl = 'FULL_CONTROL',
  Modify = 'MODIFY',
  Read = 'READ',
  Traverse = 'TRAVERSE',
}

export enum NfsAdvancedPermission {
  ReadData = 'READ_DATA',
  WriteData = 'WRITE_DATA',
  AppendData = 'APPEND_DATA',
  ReadNamedAttrs = 'READ_NAMED_ATTRS',
  WriteNamedAttrs = 'WRITE_NAMED_ATTRS',
  Execute = 'EXECUTE',
  DeleteChild = 'DELETE_CHILD',
  ReadAttributes = 'READ_ATTRIBUTES',
  WriteAttributes = 'WRITE_ATTRIBUTES',
  Delete = 'DELETE',
  ReadAcl = 'READ_ACL',
  WriteAcl = 'WRITE_ACL',
  WriteOwner = 'WRITE_OWNER',
  Synchronize = 'SYNCHRONIZE',
}

export enum NfsBasicFlag {
  Inherit = 'INHERIT',
  NoInherit = 'NOINHERIT',
}

export enum NfsAdvancedFlag {
  FileInherit = 'FILE_INHERIT',
  DirectoryInherit = 'DIRECTORY_INHERIT',
  NoPropagateInherit = 'NO_PROPAGATE_INHERIT',
  InheritOnly = 'INHERIT_ONLY',
  Inherited = 'INHERITED',
}
