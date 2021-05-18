export interface Group {
  builtin: boolean;
  gid: number;
  group: string;
  id: number;
  id_type_both: boolean;
  local: boolean;
  smb: boolean;
  sudo: boolean;
  /**
   * List of user ids.
   */
  users: number[];
}
