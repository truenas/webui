import { Acl } from 'app/interfaces/acl.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';

export interface PermissionsSidebarState {
  isLoading: boolean;
  stat: FileSystemStat;
  acl: Acl;
}
