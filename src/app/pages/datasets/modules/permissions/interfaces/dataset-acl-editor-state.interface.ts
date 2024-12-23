import { Acl } from 'app/interfaces/acl.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';

export interface DatasetAclEditorState {
  isLoading: boolean;
  isSaving: boolean;
  mountpoint: string | null;
  acl: Acl | null;
  stat: FileSystemStat | null;
  selectedAceIndex: number;
  acesWithError: number[]; // Indices
}

export interface AclSaveFormParams {
  recursive: boolean;
  traverse: boolean;
  validateEffectiveAcl: boolean;
  owner: string;
  applyOwner: boolean;
  ownerGroup: string;
  applyGroup: boolean;
}
