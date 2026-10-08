import { CallParams, CallResponse } from '@truenas/api-client';
import { Role } from 'app/enums/role.enum';
import { FormPreset } from 'app/interfaces/form-preset.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

type D = WebUiApiDirectory;

export const directIdMapping = 'DIRECT' as const;

export type UsernsIdmap = number | null | typeof directIdMapping;

export interface User {
  id: number;
  uid: number;
  username: string;
  unixhash: string;
  smbhash: string;
  home?: string;
  shell?: string;
  full_name: string;
  builtin: boolean;
  immutable: boolean;
  smb?: boolean;
  webshare?: boolean;
  ssh_password_enabled?: boolean;
  password_disabled?: boolean;
  locked?: boolean;
  sudo_commands_nopasswd?: string[];
  sudo_commands?: string[];
  email?: string | null;
  group: UserGroup;
  groups?: number[];
  sshpubkey?: string | null;
  twofactor_auth_configured: boolean;
  local: boolean;
  roles: Role[];
  api_keys: number[];
  userns_idmap?: UsernsIdmap;
  password_history: unknown[] | null;
  password_change_required: boolean;
  password_age: number | null;
  last_password_change: { $date: number } | null;
}

export interface UserGroup {
  id: number;
  bsdgrp_gid: number;
  bsdgrp_group: string;
  bsdgrp_builtin: boolean;
  bsdgrp_sudo: boolean;
  bsdgrp_sudo_nopasswd: boolean;
  bsdgrp_sudo_commands: Record<string, unknown>[];
  bsdgrp_smb: boolean;
}

export interface UserUpdate {
  uid?: number;
  username?: string;
  group?: number;
  home?: string;
  home_mode?: string;
  shell?: string;
  full_name?: string;
  email?: string;
  password?: string;
  random_password?: boolean | null;
  password_disabled?: boolean;
  locked?: boolean;
  smb?: boolean;
  webshare?: boolean;
  ssh_password_enabled?: boolean;
  sudo_commands_nopasswd?: string[];
  sudo_commands?: string[];
  sshpubkey?: string;
  groups?: number[];
  group_create?: boolean;
  home_create?: boolean;
  userns_idmap?: UsernsIdmap;
}

/**
 * What a create-user flow opens the user form with — see {@link FormPreset}.
 *
 * Narrowed to the two keys the form honours, and to the one it can lock.
 * `smb` is load-bearing for the other: the form keeps "Disable Password" off
 * and untouchable while SMB access is on, because SMB authenticates with a
 * password. So a preset that sets `password_disabled` without also turning
 * `smb` off gets the first silently reverted; the form applies them in that
 * order for exactly that reason.
 *
 * `password_disabled` is presettable but not lockable: the section's own
 * watchers enable and disable that control as SMB and SSH access change, so a
 * lock here would be undone by the next thing the user touched. A starting
 * point is what it can honestly offer.
 */
export type UserFormPreset = FormPreset<Pick<UserUpdate, 'smb' | 'password_disabled'>, 'smb'>;

/**
 * Reads a `user.query` row, or the user `user.create` / `user.update` return, into the UI's `User`. Middleware
 * types `roles` as plain strings, `group` as a loose record and `last_password_change` as a string, where the
 * wire carries the `{ $date }` envelope (gap 15); it describes the same object.
 */
export function toUser(entry: WebUiQueryEntity<'user.query'> | CallResponse<D, 'user.update'>): User {
  return entry as unknown as User;
}

/** What `user.create` takes, as middleware declares it. */
export type UserCreateArgs = CallParams<D, 'user.create'>[0];

/**
 * Hands the user form's payload to `user.create` unchanged. Middleware requires `username` and `full_name`,
 * which the form always fills; `UserUpdate` leaves them optional because the same shape serves an edit.
 */
export function toUserCreateArgs(payload: UserUpdate): UserCreateArgs {
  return payload as UserCreateArgs;
}
