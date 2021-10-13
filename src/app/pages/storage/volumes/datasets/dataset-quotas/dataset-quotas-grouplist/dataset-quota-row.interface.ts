import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';

export type DatasetQuotaRow = {
  quota: string;
  used_percent: string;
  obj_used_percent: string;
} & Omit<DatasetQuota, 'quota' | 'used_percent' | 'obj_used_percent'>;
