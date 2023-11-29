import { SystemUpdateOperationType, SystemUpdateStatus } from 'app/enums/system-update.enum';

export interface SystemUpdate {
  changelog: string;
  changes: SystemUpdateChange[];
  checksum: string;
  filename: string;
  notice: string;
  release_notes_url: string;
  status: SystemUpdateStatus;
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
