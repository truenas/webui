import { CallResponse, v28_0_0 } from '@truenas/api-client';
import { UpdateCode } from 'app/enums/system-update.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export type UpdateProfileChoice = v28_0_0.UpdateProfileChoice;

export type UpdateProfileChoices = Record<string, UpdateProfileChoice>;

export type UpdateConfig = v28_0_0.UpdateEntry;

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

export type UpdateStatusCurrentVersion = v28_0_0.UpdateStatusCurrentVersion;

export interface UpdateStatusDetails {
  current_version: UpdateStatusCurrentVersion;
  new_version: NewVersion | null;
}

export type UpdateDownloadProgress = v28_0_0.UpdateDownloadProgress;

export type UpdateStatusError = v28_0_0.UpdateStatusError;

export interface UpdateStatus {
  code: UpdateCode;
  status: UpdateStatusDetails | null;
  error: UpdateStatusError | null;
  update_download_progress: UpdateDownloadProgress | null;
}

/**
 * Reads `update.status`. Middleware spells `code` as a literal, declares the new version's `manifest` as a loose
 * record, and types `release_notes` as nullable.
 */
export function toUpdateStatus(status: CallResponse<WebUiApiDirectory, 'update.status'>): UpdateStatus {
  return status as unknown as UpdateStatus;
}
