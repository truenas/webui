import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { Dataset } from 'app/interfaces/dataset.interface';

export interface DatasetDetails extends Dataset {
  snapshot_count: number;
  replication_tasks_count: number;
  snapshot_tasks_count: number;
  cloudsync_tasks_count: number;
  rsync_tasks_count: number;
  locked: boolean;
  smb_shares: DatasetDetailsSmbShares[];
  nfs_shares: DatasetDetailsNfsShares[];
  iscsi_shares: DatasetDetailsIscsiShares[];
  vms: DatasetDetailsVms[];
  apps: DatasetDetailsApps[];
  thick_provisioned: boolean;
}

export interface DatasetDetailsSmbShares {
  enabled: boolean;
  path: string;
  share_name: string;
}

export interface DatasetDetailsNfsShares {
  enabled: boolean;
  path: string;
}

export interface DatasetDetailsIscsiShares {
  enabled: boolean;
  type: IscsiExtentType;
  path: string;
}

export interface DatasetDetailsVms {
  name: string;
  path: string;
}

export interface DatasetDetailsApps {
  name: string;
  path: string;
}
