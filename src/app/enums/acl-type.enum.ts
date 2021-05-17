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
