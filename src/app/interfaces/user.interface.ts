import { Preferences } from './preferences.interface';
import { Group } from './group.interface';

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
  smb: boolean;
  password_disabled: boolean;
  locked: boolean;
  sudo: boolean;
  sudo_nopasswd: boolean;
  sudo_commands: { [property: string]: any }[];
  microsoft_account: boolean;
  attributes: { preferences: Preferences };
  email: string;
  group: Group;
  groups: { [property: string]: any }[];
  sshpubkey: string;
  local: boolean;
  id_type_both: boolean;
}
