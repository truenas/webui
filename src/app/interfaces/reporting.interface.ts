import { v28_0_0 } from '@truenas/api-client';
import { LinkState } from 'app/enums/network-interface.enum';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';

export interface ReportingRealtimeUpdate {
  cpu: AllCpusUpdate;
  pools: Record<string, {
    available: number;
    used: number;
    total: number;
  }>;
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

export type DisksUpdate = v28_0_0.ReportingRealtimeEventSourceEventDisks;

export type AllNetworkInterfacesUpdate = Record<string, NetworkInterfaceReport>;

export interface NetworkInterfaceReport {
  link_state: LinkState;
  received_bytes_rate: number;
  sent_bytes_rate: number;
  speed: number;
}

export type MemoryUpdate = v28_0_0.ReportingRealtimeEventSourceEventMemory;

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
  data: number[][] | ApiErrorDetails;
  aggregations: ReportingAggregations;
}

export enum ReportingDatabaseError {
  FailedExport = 22,
}
