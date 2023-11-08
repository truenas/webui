import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum Role {
  FullAdmin = 'FULL_ADMIN',
  HasAllowList = 'HAS_ALLOW_LIST',
  Readonly = 'READONLY',
  SharingManager = 'SHARING_MANAGER',
}

export const roleNames = new Map<Role, string>([
  [Role.FullAdmin, T('Full Admin')],
  [Role.HasAllowList, T('Has Allow List')],
  [Role.Readonly, T('Readonly')],
  [Role.SharingManager, T('Sharing Manager')],
]);

export function rolesListToString(roles: Role[]): string {
  return roles.map((role) => roleNames.get(role)).join(', ') || T('N/A');
}
