import { Role } from 'app/enums/role.enum';
import { UsernsIdmap } from 'app/interfaces/user.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface Group {
  builtin: boolean;
  gid: number;
  group: string;
  name: string;
  id: number;
  userns_idmap?: UsernsIdmap;
  local: boolean;
  smb?: boolean;
  sudo_commands_nopasswd?: string[];
  sudo_commands?: string[];
  roles: Role[];
  immutable: boolean;
  /**
   * List of user ids.
   */
  users?: number[];
}

/**
 * Reads a `group.query` row into the UI's `Group`. Middleware types `roles` as plain strings where the UI
 * reads its `Role` enum; it describes the same object.
 */
export function toGroup(entry: WebUiQueryEntity<'group.query'>): Group {
  return entry as Group;
}
