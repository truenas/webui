import { Acl } from 'app/interfaces/acl.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';

export interface DatasetAclEditorState {
  isLoading: boolean;
  isSaving: boolean;
  mountpoint: string;
  acl: Acl;
  stat: FileSystemStat;
  selectedAceIndex: number;
  acesWithError: number[]; // Indices
}

export interface AclSaveFormParams {
  recursive: boolean;
  traverse: boolean;
  owner: string;
  applyOwner: boolean;
  ownerGroup: string;
  applyGroup: boolean;
}
