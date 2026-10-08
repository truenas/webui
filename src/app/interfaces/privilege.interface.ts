import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface Privilege {
  id: number;
  name: string;
  /** Null for custom (non-builtin) privileges; a role name for builtin ones. */
  builtin_name: Role | null;
  local_groups: Group[];
  ds_groups: Group[];
  web_shell: boolean;
  roles: Role[];
}

export interface PrivilegeUpdate {
  name: string;
  local_groups: number[];
  ds_groups: number[];
  web_shell: boolean;
  roles: Role[];
}

export interface PrivilegeRole {
  name: Role;
  title: string;
  includes: Role[];
  builtin: boolean;
}

/**
 * Reads a `privilege.query` row, or the privilege `privilege.create` / `privilege.update` return, into the UI's
 * `Privilege`. Middleware types `builtin_name` and `roles` as plain strings where the UI reads its `Role` enum,
 * and lets a directory group that no longer resolves come back unmapped (`group: null`); the pages read `gid`
 * and `group` alone, which both kinds carry.
 */
export function toPrivilege(
  entry: WebUiQueryEntity<'privilege.query'>,
): Privilege {
  return entry as unknown as Privilege;
}

/** Reads a `privilege.roles` row into the UI's `PrivilegeRole`, with the role names as the `Role` enum. */
export function toPrivilegeRole(entry: WebUiQueryEntity<'privilege.roles'>): PrivilegeRole {
  return entry as PrivilegeRole;
}
