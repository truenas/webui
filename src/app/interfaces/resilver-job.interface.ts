import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface ResilverScan {
  bytes_issued: number;
  bytes_processed: number;
  bytes_to_process: number;
  end_time: ApiTimestamp;
  errors: number;
  function: string;
  pause: number | null;
  percentage: number;
  start_time: ApiTimestamp;
  state: PoolScanState;
}

export interface ResilverData {
  name: string;
  scan: ResilverScan;
}

export interface ResilverJob {
  collection: string;
  fields: ResilverData;
  msg: string;
}
