import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { VDev, VDevStats } from 'app/interfaces/storage.interface';

export interface Pool {
  autotrim: {
    // TODO: Confirm types
    value: any; // 'on', 'off'
    rawvalue: any; // 'on', 'off'
    parsed: any; // 'on', 'off',
    source: any; // 'DEFAULT';
  };
  encrypt: number;
  encryptkey: string;
  encryptkey_path: string;
  guid: string;
  healthy: boolean;
  id: number;
  is_decrypted: boolean;
  name: string;
  path: string;
  scan: PoolScan;
  status: PoolStatus;
  status_detail: any;
  topology: PoolTopology;
}

export interface PoolTopology {
  cache: VDev[];
  data: VDev[];
  dedup: VDev[];
  log: VDev[];
  spare: VDev[];
  special: VDev[];
}

export type PoolTopologyCategory = keyof PoolTopology;

export interface PoolScan {
  bytes_issued: number;
  bytes_processed: number;
  bytes_to_process: number;
  end_time: { $date: number };
  errors: number;
  function: 'SCRUB'; // TODO: Unknown what other values are
  pause: any;
  percentage: number;
  start_time: { $date: number };
  state: PoolScanState;
  total_secs_left: number;
}
