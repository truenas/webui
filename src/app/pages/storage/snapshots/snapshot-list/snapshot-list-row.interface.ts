import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

export type SnapshotListRow = {
  id: string;
  used: string;
  created: string;
  referenced: string;
  snapshot: string;
} & Pick<ZfsSnapshot, 'dataset' | 'name' | 'properties'>;
