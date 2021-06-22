export interface PermissionItem {
  name: string;
  type: PermissionsItemType;
  permissions: string;
}

export enum PermissionsItemType {
  User = 'user',
  Group = 'group',
  Other = 'other',
}
