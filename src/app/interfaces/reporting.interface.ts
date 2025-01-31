import { LinkState } from 'app/enums/network-interface.enum';
import { ReportingQueryUnit } from 'app/enums/reporting.enum';
import { ApiError } from 'app/interfaces/api-error.interface';

export interface ReportingRealtimeUpdate {
  cpu: AllCpusUpdate;
  disks: DisksUpdate;
  interfaces: AllNetworkInterfacesUpdate;
  memory: MemoryUpdate;
}

export interface AllCpusUpdate {
  user: number;
  nice: number;
  system: number;
  idle: number;
  iowait: number;
  irq: number;
  softirq: number;
  steal: number;
  guest: number;
  guest_nice: number;
  cpu: CpuUsageUpdate;
  [key: `cpu${number}`]: CpuUsageUpdate;
}

export interface CpuUsageUpdate {
  usage: number;
  temp: number;
}

export interface DisksUpdate {
  busy: number;
  read_bytes: number;
  read_ops: number;
  write_bytes: number;
  write_ops: number;
}

export type AllNetworkInterfacesUpdate = Record<string, NetworkInterfaceUpdate>;

export interface NetworkInterfaceUpdate {
  link_state: LinkState;
  received_bytes_rate: number;
  sent_bytes_rate: number;
  speed: number;
}

export interface MemoryUpdate {
  arc_size: number;
  arc_free_memory: number;
  arc_available_memory: number;
  physical_memory_total: number;
  physical_memory_available: number;
}

export interface ReportingQueryOptions {
  unit?: ReportingQueryUnit;
  start?: number;
  end?: number;
}

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
  data: number[][] | ApiError;
  aggregations: ReportingAggregations;
}

export enum ReportingDatabaseError {
  FailedExport = 22,
}
