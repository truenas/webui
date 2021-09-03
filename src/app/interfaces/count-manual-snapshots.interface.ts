import { TransportMode } from 'app/enums/transport-mode.enum';

export interface CountManualSnapshotsParams {
  datasets: string[];
  naming_schema?: string[];
  name_regex?: string;
  transport: TransportMode;
  ssh_credentials: number;
}

export interface EligibleManualSnapshotsCount {
  total: number;
  eligible: number;
}
