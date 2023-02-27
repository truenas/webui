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
  password_disabled: boolean;
  locked: boolean;
  sudo_commands_nopasswd: string[];
  sudo_commands: string[];
  email: string;
  group: UserGroup;
  groups: number[];
  sshpubkey: string;
  local: boolean;
  id_type_both: boolean;
}

export interface UserGroup {
  id: number;
  bsdgrp_gid: number;
  bsdgrp_group: string;
  bsdgrp_builtin: boolean;
  bsdgrp_sudo: boolean;
  bsdgrp_sudo_nopasswd: boolean;
  bsdgrp_sudo_commands: { [property: string]: unknown }[];
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
  sudo_commands_nopasswd?: string[];
  sudo_commands?: string[];
  sshpubkey?: string;
  groups?: number[];
  group_create?: boolean;
}
