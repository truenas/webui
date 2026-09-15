import { Role } from 'app/enums/role.enum';
import { FormPreset } from 'app/interfaces/form-preset.interface';

export const directIdMapping = 'DIRECT' as const;

export type UsernsIdmap = number | null | typeof directIdMapping;

export interface User {
  id: number;
  uid: number;
  username: string;
  unixhash: string;
  smbhash: string;
  home: string;
  shell: string;
  full_name: string;
  builtin: boolean;
  immutable: boolean;
  smb: boolean;
  webshare: boolean;
  ssh_password_enabled: boolean;
  password_disabled: boolean;
  locked: boolean;
  sudo_commands_nopasswd: string[];
  sudo_commands: string[];
  email: string | null;
  group: UserGroup;
  groups: number[];
  sshpubkey: string | null;
  twofactor_auth_configured: boolean;
  local: boolean;
  id_type_both: boolean;
  roles: Role[];
  api_keys: number[];
  userns_idmap: UsernsIdmap;
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

export type DeleteUserParams = [
  id: number,
  params: { delete_group: boolean },
];

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

export interface SetPasswordParams {
  username: string;
  old_password: string;
  new_password: string;
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
