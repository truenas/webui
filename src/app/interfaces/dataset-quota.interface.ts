import { DatasetQuotaType } from 'app/enums/dataset.enum';

export interface DatasetQuota {
  id: number;
  /** `null` when the user or group no longer exists. */
  name: string | null;
  obj_quota: number;
  obj_used: number;
  quota: number;
  quota_type: DatasetQuotaType;
  used_bytes: number;
  used_percent: number;
}

/** One user or group limit to set, as `pool.dataset.set_quota` took it. `id` is a uid/gid or a name. */
export interface SetDatasetQuota {
  id: string;
  quota_type: DatasetQuotaType;
  quota_value: number;
}
