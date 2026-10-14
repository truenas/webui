import { CallResponse } from '@truenas/api-client';
import { UpdateCode } from 'app/enums/system-update.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

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

export interface UpdateStatusError {
  errname: string;
  reason: string;
}

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
