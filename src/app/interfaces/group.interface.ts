import { Role } from 'app/enums/role.enum';
import { directIdMapping } from 'app/interfaces/user.interface';

export interface Group {
  builtin: boolean;
  gid: number;
  group: string;
  name: string;
  id: number;
  userns_idmap: number | null | typeof directIdMapping;
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
  userns_idmap?: number | null | typeof directIdMapping;
}
