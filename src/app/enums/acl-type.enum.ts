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
  Inherit = 'INHERIT',
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

export enum DAclNfs4Tag {
  Owner = 'owner@',
  Group = 'group@',
  Everyone = 'everyone@',
  User = 'USER',
  UserGroup = 'GROUP',
}

export enum DAclType {
  Allow = 'ALLOW',
  Deny = 'DENY',
}

export enum DAclPermissionsBasic {
  FullControl = 'FULL_CONTROL',
  Modify = 'MODIFY',
  Read = 'READ',
  Traverse = 'TRAVERSE',
}

export enum DAclFlagsBasic {
  Inherit = 'INHERIT',
  NoInherit = 'NOINHERIT',
}
