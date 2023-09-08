import { LinkState } from 'app/enums/network-interface.enum';
import { ReportingQueryUnit } from 'app/enums/reporting.enum';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';

export interface ReportingRealtimeUpdate {
  cpu: AllCpusUpdate;
  disks: DisksUpdate;
  interfaces: AllNetworkInterfacesUpdate;
  memory: MemoryUpdate;
  virtual_memory: VirtualMemoryUpdate;
  zfs: ZfsUpdate;
}

export interface AllCpusUpdate {
  [cpuNumber: number]: CpuUpdate;
  average: CpuUpdate;
  temperature: number[];
  temperature_celsius: number[];
}

export interface CpuUpdate {
  guest: number;
  guest_nice: number;
  idle: number;
  iowait: number;
  irq: number;
  nice: number;
  softirq: number;
  steal: number;
  system: number;
  usage: number;
  user: number;
}

export interface DisksUpdate {
  busy: number;
  read_bytes: number;
  read_ops: number;
  write_bytes: number;
  write_ops: number;
}

export interface AllNetworkInterfacesUpdate {
  [interfaceName: string]: NetworkInterfaceUpdate;
}

export interface NetworkInterfaceUpdate {
  link_state: LinkState;
  received_bytes: number;
  received_bytes_rate: number;
  sent_bytes: number;
  sent_bytes_rate: number;
  speed: number;
}

export interface MemoryUpdate {
  classes: {
    apps: number;
    arc: number;
    buffers: number;
    cache: number;
    page_tables: number;
    slab_cache: number;
    swap_cache: number;
    unused: number;
  };
  extra: {
    active: number;
    committed: number;
    inactive: number;
    mapped: number;
    vmalloc_used: number;
  };
  swap: {
    total: number;
    used: number;
  };
}

export interface VirtualMemoryUpdate {
  active: number;
  available: number;
  buffers: number;
  cached: number;
  free: number;
  inactive: number;
  percent: number;
  shared: number;
  slab: number;
  total: number;
  used: number;
}

export interface ZfsUpdate {
  arc_max_size: number;
  arc_size: number;
  cache_hit_ratio: number;
}

export interface ReportingConfig {
  confirm_rrd_destroy?: boolean;
  graph_age: number;
  graph_points: number;
  id: number;
}

export interface ReportingQueryOptions {
  unit?: ReportingQueryUnit;
  start?: number;
  end?: number;
}

export type ReportingConfigUpdate = Omit<ReportingConfig, 'id'>;

export type ReportingQueryParams = [
  [ReportingNameAndId],
  ReportingQueryOptions,
];

export interface ReportingNameAndId {
  name: string;
  identifier?: string;
}

export type ReportingAggregationKeys = 'min' | 'mean' | 'max';

export type ReportingAggregationValue = (string | number)[];

export interface ReportingAggregations {
  min: ReportingAggregationValue;
  mean: ReportingAggregationValue;
  max: ReportingAggregationValue;
}

export interface ReportingData {
  end: number;
  identifier: string;
  legend: string[];
  name: string;
  start: number;
  data: number[][] | WebsocketError;
  aggregations: ReportingAggregations;
}

export enum ReportingDatabaseError {
  FailedExport = 22,
  InvalidTimestamp = 206,
}
