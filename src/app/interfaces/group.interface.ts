import { Role } from 'app/enums/role.enum';

export interface Group {
  builtin: boolean;
  gid: number;
  group: string;
  name: string;
  id: number;
  id_type_both: boolean;
  local: boolean;
  smb: boolean;
  sudo_commands_nopasswd?: string[];
  sudo_commands?: string[];
  roles: Role[];
  /**
   * List of user ids.
   */
  users: number[];
}

export type DeleteGroupParams = [
  id: number,
  params: { delete_users: boolean },
];

export interface CreateGroup {
  gid: number;
  name: string;
  smb: boolean;
  sudo_commands_nopasswd?: string[];
  sudo_commands?: string[];
}

export interface UpdateGroup {
  name?: string;
  smb?: boolean;
  sudo_commands_nopasswd?: string[];
  sudo_commands?: string[];
  users?: number[];
}
