import { SystemUpdateOperationType, UpdateCode } from 'app/enums/system-update.enum';

export interface SystemUpdate {
  changelog: string;
  changes: SystemUpdateChange[];
  checksum: string;
  filename: string;
  notice: string;
  release_notes_url: string;
  status: UpdateCode;
  version: string;
}

export interface SystemUpdateChange {
  operation: SystemUpdateOperationType;
  new: {
    name: string;
    version: string;
  };
  old: {
    name: string;
    version: string;
  };
}

export interface SystemUpdateTrains {
  current: string;
  selected: string;
  trains: Record<string, SystemUpdateTrain>;
}

export interface SystemUpdateTrain {
  description: string;
  sequence: string;
}

export interface UpdateParams {
  reboot: boolean;
  resume?: boolean;
}

export interface UpdateProfileChoice {
  name: string;
  footnote: string;
  description: string;
  available: boolean;
}

export type UpdateProfileChoices = Record<string, UpdateProfileChoice>;

export interface UpdateConfig {
  id: number;
  autocheck: boolean;
  profile: string;
}

export interface UpdateManifest {
  filename: string;
  version: string;
  date: string;
  changelog: string;
  checksum: string;
  filesize: number;
  profile: string;
  train: string;
}

export interface NewVersion {
  version: string;
  manifest: UpdateManifest;
  release_notes_url?: string;
  release_notes?: string;
}

export interface UpdateStatusCurrentVersion {
  train: string;
  profile: string;
  matches_profile: boolean;
}

export interface UpdateStatusDetails {
  current_version: UpdateStatusCurrentVersion;
  new_version: NewVersion | null;
}

export interface UpdateDownloadProgress {
  percent: number;
  description: string;
  version: string;
}

export interface UpdateStatus {
  code: UpdateCode;
  status: UpdateStatusDetails | null;
  error: string | null;
  update_download_progress: UpdateDownloadProgress | null;
}
