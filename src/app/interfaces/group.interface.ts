export interface Group {
  builtin: boolean;
  gid: number;
  group: string;
  id: number;
  id_type_both: boolean;
  local: boolean;
  smb: boolean;
  sudo_commands_nopasswd?: string[];
  sudo_commands?: string[];
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
  allow_duplicate_gid: boolean;
  gid: number;
  name: string;
  smb: boolean;
  sudo_commands_nopasswd?: string[];
  sudo_commands?: string[];
}

export interface UpdateGroup {
  allow_duplicate_gid?: boolean;
  name?: string;
  smb?: boolean;
  sudo_commands_nopasswd?: string[];
  sudo_commands?: string[];
  users?: number[];
}
