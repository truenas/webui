import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';

export interface Privilege {
  id: number;
  name: string;
  builtin_name: string;
  local_groups: Group[];
  ds_groups: Group[];
  web_shell: boolean;
  roles: Role[];
  allowlist: {
    method: string;
    resource: string;
  }[];
}

export interface PrivilegeUpdate {
  name: string;
  local_groups: number[];
  ds_groups: number[];
  web_shell: boolean;
  roles: Role[];
}
