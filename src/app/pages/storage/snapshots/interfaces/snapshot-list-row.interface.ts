import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

export type SnapshotListRow = {
  id: string;
  used: number;
  created: number;
  referenced: number;
  snapshot: string;
} & Pick<ZfsSnapshot, 'dataset' | 'name' | 'properties'>;
