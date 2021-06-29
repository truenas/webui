import { TranslateService } from '@ngx-translate/core';

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

export function getNfsAclTypeLabels(translate: TranslateService): Map<NfsAclType, string> {
  return new Map<NfsAclType, string>([
    [NfsAclType.Allow, translate.instant('Allow')],
    [NfsAclType.Deny, translate.instant('Deny')],
  ]);
}

export enum NfsBasicPermission {
  FullControl = 'FULL_CONTROL',
  Modify = 'MODIFY',
  Read = 'READ',
  Traverse = 'TRAVERSE',
}

export function getNfsBasicPermissionLabels(translate: TranslateService): Map<NfsBasicPermission, string> {
  return new Map<NfsBasicPermission, string>([
    [NfsBasicPermission.Read, translate.instant('Read')],
    [NfsBasicPermission.Modify, translate.instant('Modify')],
    [NfsBasicPermission.Traverse, translate.instant('Traverse')],
    [NfsBasicPermission.FullControl, translate.instant('Full Control')],
  ]);
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

export function getNfsAdvancedPermissionLabels(translate: TranslateService): Map<NfsAdvancedPermission, string> {
  return new Map<NfsAdvancedPermission, string>([
    [NfsAdvancedPermission.ReadData, translate.instant('Read Data')],
    [NfsAdvancedPermission.WriteData, translate.instant('Write Data')],
    [NfsAdvancedPermission.AppendData, translate.instant('Append Data')],
    [NfsAdvancedPermission.ReadNamedAttrs, translate.instant('Read Named Attributes')],
    [NfsAdvancedPermission.WriteNamedAttrs, translate.instant('Write Named Attributes')],
    [NfsAdvancedPermission.Execute, translate.instant('Execute')],
    [NfsAdvancedPermission.DeleteChild, translate.instant('Delete Children')],
    [NfsAdvancedPermission.ReadAttributes, translate.instant('Read Attributes')],
    [NfsAdvancedPermission.WriteAttributes, translate.instant('Write Attributes')],
    [NfsAdvancedPermission.Delete, translate.instant('Delete')],
    [NfsAdvancedPermission.ReadAcl, translate.instant('Read ACL')],
    [NfsAdvancedPermission.WriteAcl, translate.instant('Write ACL')],
    [NfsAdvancedPermission.WriteOwner, translate.instant('Write Owner')],
    [NfsAdvancedPermission.Synchronize, translate.instant('Synchronize')],
  ]);
}

export enum NfsBasicFlag {
  Inherit = 'INHERIT',
  NoInherit = 'NOINHERIT',
}

export function getNfsBasicFlagLabels(translate: TranslateService): Map<NfsBasicFlag, string> {
  return new Map<NfsBasicFlag, string>([
    [NfsBasicFlag.Inherit, translate.instant('Inherit')],
    [NfsBasicFlag.NoInherit, translate.instant('No Inherit')],
  ]);
}

export enum NfsAdvancedFlag {
  FileInherit = 'FILE_INHERIT',
  DirectoryInherit = 'DIRECTORY_INHERIT',
  NoPropagateInherit = 'NO_PROPAGATE_INHERIT',
  InheritOnly = 'INHERIT_ONLY',
  Inherited = 'INHERITED',
}

export function getNfsAdvancedFlagLabels(translate: TranslateService): Map<NfsAdvancedFlag, string> {
  return new Map<NfsAdvancedFlag, string>([
    [NfsAdvancedFlag.FileInherit, translate.instant('File Inherit')],
    [NfsAdvancedFlag.DirectoryInherit, translate.instant('Directory Inherit')],
    [NfsAdvancedFlag.NoPropagateInherit, translate.instant('No Propagate Inherit')],
    [NfsAdvancedFlag.InheritOnly, translate.instant('Inherit Only')],
    [NfsAdvancedFlag.Inherited, translate.instant('Inherited')],
  ]);
}
