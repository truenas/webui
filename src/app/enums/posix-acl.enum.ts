export enum PosixAclTag {
  UserObject = 'USER_OBJ',
  GroupObject = 'GROUP_OBJ',
  User = 'USER',
  Group = 'GROUP',
  Other = 'OTHER',
  Mask = 'MASK',
}

export enum PosixPermission {
  Read = 'READ',
  Write = 'WRITE',
  Execute = 'EXECUTE',
}
