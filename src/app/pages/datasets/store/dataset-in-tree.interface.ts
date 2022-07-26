import { DatasetDetails } from 'app/interfaces/dataset.interface';

/**
 * Not all properties are loaded for datasets shown in the tree.
 */
export type DatasetInTree = Pick<DatasetDetails,
| 'id'
| 'available'
| 'children'
| 'encrypted'
| 'encryption_algorithm'
| 'encryption_root'
| 'key_format'
| 'key_loaded'
| 'locked'
| 'mountpoint'
| 'name'
| 'pool'
| 'type'
| 'used'
| 'quota'
| 'snapshot_count'
| 'replication_tasks_count'
| 'snapshot_tasks_count'
| 'cloudsync_tasks_count'
| 'rsync_tasks_count'
| 'smb_shares'
| 'nfs_shares'
| 'iscsi_shares'
| 'vms'
| 'apps'
>;
