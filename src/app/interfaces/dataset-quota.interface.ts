import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { QueryParams } from 'app/interfaces/query-api.interface';

export interface DatasetQuota {
  id: number;
  name: string;
  obj_quota: number;
  obj_used: number;
  quota: number;
  quota_type: DatasetQuotaType;
  used_bytes: number;
  used_percent: number;
}

export interface SetDatasetQuota {
  quota_type: DatasetQuotaType;
  id: string;
  quota_value: number;
}

export type DatasetQuotaQueryParams = [
  mountpoint: string,
  quotaType: DatasetQuotaType,
  params: QueryParams<DatasetQuota>,
];
