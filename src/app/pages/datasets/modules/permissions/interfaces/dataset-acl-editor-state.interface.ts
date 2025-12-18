import { Acl } from 'app/interfaces/acl.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';

export interface DatasetAclEditorState {
  isLoading: boolean;
  isSaving: boolean;
  mountpoint: string | null;
  acl: Acl | null;
  stat: FileSystemStat | null;
  selectedAceIndex: number | null;
  acesWithError: number[]; // Indices
  returnUrl: string[] | null;
}

export interface AclSaveFormParams {
  recursive: boolean;
  traverse: boolean;
  owner: string;
  applyOwner: boolean;
  ownerGroup: string;
  applyGroup: boolean;
}
