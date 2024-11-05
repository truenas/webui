import { Role } from 'app/enums/role.enum';

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
  ssh_password_enabled: boolean;
  password_disabled: boolean;
  locked: boolean;
  sudo_commands_nopasswd: string[];
  sudo_commands: string[];
  email: string;
  group: UserGroup;
  groups: number[];
  sshpubkey: string;
  twofactor_auth_configured: boolean;
  local: boolean;
  id_type_both: boolean;
  roles: Role[];
  api_keys: number[];
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
  password_disabled?: boolean;
  locked?: boolean;
  smb?: boolean;
  ssh_password_enabled?: boolean;
  sudo_commands_nopasswd?: string[];
  sudo_commands?: string[];
  sshpubkey?: string;
  groups?: number[];
  group_create?: boolean;
  home_create?: boolean;
}

export interface SetPasswordParams {
  username: string;
  old_password: string;
  new_password: string;
}
