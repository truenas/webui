import { Acl } from 'app/interfaces/acl.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';

export interface PermissionsCardState {
  isLoading: boolean;
  stat: FileSystemStat | null;
  acl: Acl | null;
}
