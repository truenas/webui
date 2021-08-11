export interface ResilverTime {
  $date: number;
}

export interface ResilverScan {
  bytes_issued: number;
  bytes_processed: number;
  bytes_to_process: number;
  end_time: ResilverTime;
  errors: number;
  function: string;
  pause: number | null;
  percentage: number;
  start_time: ResilverTime;
  state: string;
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
