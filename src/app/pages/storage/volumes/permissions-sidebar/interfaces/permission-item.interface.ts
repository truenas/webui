export interface PermissionItem {
  name: string;
  type: PermissionsItemType;
  description: string;
}

export enum PermissionsItemType {
  User = 'user',
  Group = 'group',
  Other = 'other',
}
