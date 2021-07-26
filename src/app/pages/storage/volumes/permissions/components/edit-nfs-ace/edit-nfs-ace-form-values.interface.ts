import {
  NfsAclTag, NfsAclType,
  NfsAdvancedFlag,
  NfsAdvancedPermission,
  NfsBasicFlag,
  NfsBasicPermission,
} from 'app/enums/nfs-acl.enum';

export interface EditNfsAceFormValues {
  tag: NfsAclTag;
  user?: string;
  group?: string;
  type: NfsAclType;
  permissionType: NfsFormPermsType;
  basicPermission: NfsBasicPermission;
  advancedPermissions?: NfsAdvancedPermission[];
  flagsType: NfsFormFlagsType;
  basicFlag: NfsBasicFlag;
  advancedFlags?: NfsAdvancedFlag[];
}

export enum NfsFormPermsType {
  Basic = 'BASIC',
  Advanced = 'ADVANCED',
}

export enum NfsFormFlagsType {
  Basic = 'BASIC',
  Advanced = 'ADVANCED',
}
