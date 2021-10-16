import { Overwrite } from 'utility-types';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';

export type DatasetQuotaRow = Overwrite<DatasetQuota, {
  quota: string;
  used_percent: string;
  obj_used_percent: string;
}>;
