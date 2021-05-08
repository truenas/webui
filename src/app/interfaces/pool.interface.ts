import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';

export interface Pool {
  autotrim: {
    value: any; // 'on'
    rawvalue: any;
    parsed: any;
    source: any;
  };

  /**
   * @deprecated
   */
  encrypt: number;

  /**
   * @deprecated
   */
  encryptkey: string;

  /**
   * @deprecated
   */
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
  topology: any;
}

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
