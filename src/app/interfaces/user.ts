interface Attributes {
  preferences: object;
}
export interface User {
  uid: number;
  username: string;
  group: object;
  group_create: boolean;
  home: string;
  home_mode: string;
  shell: string;
  email: string;
  password: string;
  password_disabled: boolean;
  locked: boolean;
  microsoft_account: boolean;
  smb: boolean;
  sudo: boolean;
  sudo_nopasswd: boolean;
  sudo_commands: string[];
  sshpubkey: string;
  groups: number[];
  attributes: Attributes;
  builtin: boolean;
  full_name: string;
  id: number;
  id_type_both: boolean;
  local: boolean;
  smbhash: string;
  unixhash: string;
}
