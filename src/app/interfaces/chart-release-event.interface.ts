import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface ChartReleaseEvent {
  action: string;
  api_version: unknown;
  count: number;
  event_time: ApiTimestamp;
  first_timestamp: ApiTimestamp;
  involved_object: ChartReleaseEventObject;
  kind: unknown;
  last_timestamp: ApiTimestamp;
  message: string;
  metadata: ChartEventMetadata;
  reason: string;
  related: unknown;
  reporting_component: string;
  reporting_instance: string;
  series: unknown;
  source: {
    component: string;
    host: string;
  };
  type: string;
}

export interface ChartReleaseEventObject {
  api_version: string;
  field_path: string;
  kind: string;
  name: string;
  namespace: string;
  resource_version: string;
  uid: string;
}

export type ChartScaleQueryParams = [
  name: string,
  params?: {
    replica_count: number;
  },
];

export interface ChartScaleResult {
  before_scale: number;
  after_scale: number;
}

export interface ChartRollbackParams {
  force_rollback?: boolean;
  recreate_resources?: boolean;
  rollback_snapshot?: boolean;
  item_version: string;
}

export interface ChartEventMetadata {
  creation_timestamp?: {
    $date?: number;
  };
  namespace: string;
  name: string;
  uid: string;
}
