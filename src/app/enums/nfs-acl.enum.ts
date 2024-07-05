import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum NfsAclTag {
  Owner = 'owner@',
  Group = 'group@',
  Everyone = 'everyone@',
  User = 'USER',
  UserGroup = 'GROUP',
  Both = 'BOTH', // middleware returns `ID_TYPE_BOTH` when it is not possible to determine whether an AD entity is a user or a group
}

export const nfsAclTagLabels = new Map<NfsAclTag, string>([
  [NfsAclTag.User, T('User')],
  [NfsAclTag.UserGroup, T('Group')],
  [NfsAclTag.Owner, T('owner@')],
  [NfsAclTag.Group, T('group@')],
  [NfsAclTag.Everyone, T('everyone@')],
]);

export const smbAclTagLabels = new Map<NfsAclTag, string>([
  [NfsAclTag.User, T('User')],
  [NfsAclTag.UserGroup, T('Group')],
  [NfsAclTag.Both, T('Unknown')],
  [NfsAclTag.Everyone, T('everyone@')],
]);

export enum NfsAclType {
  Allow = 'ALLOW',
  Deny = 'DENY',
}

export const nfsAclTypeLabels = new Map<NfsAclType, string>([
  [NfsAclType.Allow, T('Allow')],
  [NfsAclType.Deny, T('Deny')],
]);

export enum NfsBasicPermission {
  FullControl = 'FULL_CONTROL',
  Modify = 'MODIFY',
  Read = 'READ',
  Traverse = 'TRAVERSE',
}

export const nfsBasicPermissionLabels = new Map<NfsBasicPermission, string>([
  [NfsBasicPermission.Read, T('Read')],
  [NfsBasicPermission.Modify, T('Modify')],
  [NfsBasicPermission.Traverse, T('Traverse')],
  [NfsBasicPermission.FullControl, T('Full Control')],
]);

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

export const nfsAdvancedPermissionLabels = new Map<NfsAdvancedPermission, string>([
  [NfsAdvancedPermission.ReadData, T('Read Data')],
  [NfsAdvancedPermission.WriteData, T('Write Data')],
  [NfsAdvancedPermission.AppendData, T('Append Data')],
  [NfsAdvancedPermission.ReadNamedAttrs, T('Read Named Attributes')],
  [NfsAdvancedPermission.WriteNamedAttrs, T('Write Named Attributes')],
  [NfsAdvancedPermission.Execute, T('Execute')],
  [NfsAdvancedPermission.DeleteChild, T('Delete Children')],
  [NfsAdvancedPermission.ReadAttributes, T('Read Attributes')],
  [NfsAdvancedPermission.WriteAttributes, T('Write Attributes')],
  [NfsAdvancedPermission.Delete, T('Delete')],
  [NfsAdvancedPermission.ReadAcl, T('Read ACL')],
  [NfsAdvancedPermission.WriteAcl, T('Write ACL')],
  [NfsAdvancedPermission.WriteOwner, T('Write Owner')],
  [NfsAdvancedPermission.Synchronize, T('Synchronize')],
]);

export enum NfsBasicFlag {
  Inherit = 'INHERIT',
  NoInherit = 'NOINHERIT',
}

export const nfsBasicFlagLabels = new Map<NfsBasicFlag, string>([
  [NfsBasicFlag.Inherit, T('Inherit')],
  [NfsBasicFlag.NoInherit, T('No Inherit')],
]);

export enum NfsAdvancedFlag {
  FileInherit = 'FILE_INHERIT',
  DirectoryInherit = 'DIRECTORY_INHERIT',
  NoPropagateInherit = 'NO_PROPAGATE_INHERIT',
  InheritOnly = 'INHERIT_ONLY',
  Inherited = 'INHERITED',
}

export const nfsAdvancedFlagLabels = new Map<NfsAdvancedFlag, string>([
  [NfsAdvancedFlag.FileInherit, T('File Inherit')],
  [NfsAdvancedFlag.DirectoryInherit, T('Directory Inherit')],
  [NfsAdvancedFlag.NoPropagateInherit, T('No Propagate Inherit')],
  [NfsAdvancedFlag.InheritOnly, T('Inherit Only')],
  [NfsAdvancedFlag.Inherited, T('Inherited')],
]);
