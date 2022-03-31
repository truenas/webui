export interface DatasetQuota {
  id: number;
  name: string;
  obj_quota: number;
  obj_used: number;
  obj_used_percent: number;
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

export enum DatasetQuotaType {
  Dataset = 'DATASET',
  User = 'USER',
  Group = 'GROUP',
  UserObj = 'USEROBJ',
  GroupObj = 'GROUPOBJ',
}
