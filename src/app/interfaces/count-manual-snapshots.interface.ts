import { CallParams, CallResponse } from '@truenas/api-client';
import { Direction } from 'app/enums/direction.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface CountManualSnapshotsParams {
  datasets: string[];
  naming_schema?: string[];
  name_regex?: string;
  transport: TransportMode;
  ssh_credentials: number;
}

export type EligibleManualSnapshotsCount = CallResponse<WebUiApiDirectory, 'replication.count_eligible_manual_snapshots'>;

export type TargetUnmatchedSnapshotsParams = [
  direction: Direction,
  source_datasets: string[],
  target_dataset: string,
  transport: TransportMode,
  ssh_credentials: number,
];

/**
 * Hands a count request to `replication.count_eligible_manual_snapshots` unchanged. Middleware
 * declares `datasets` as a non-empty list, which `string[]` cannot express; every caller checks
 * that a dataset is selected before it counts.
 */
export function toCountManualSnapshotsArgs(
  params: CountManualSnapshotsParams,
): CallParams<WebUiApiDirectory, 'replication.count_eligible_manual_snapshots'>[0] {
  return params as CallParams<WebUiApiDirectory, 'replication.count_eligible_manual_snapshots'>[0];
}
