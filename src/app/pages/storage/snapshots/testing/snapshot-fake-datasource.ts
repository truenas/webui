import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { SnapshotListRow } from 'app/pages/storage/snapshots/interfaces/snapshot-list-row.interface';

export const fakeZfsSnapshot: ZfsSnapshot = {
  name: 'test-dataset@first-snapshot',
  properties: {
    creation: {
      parsed: {
        $date: 1634575914000,
      },
    },
    used: {
      parsed: 1634575914000,
    },
    referenced: {
      parsed: 1634575914000,
    },
  },
} as unknown as ZfsSnapshot;

export const fakeZfsSnapshotDataSource: ZfsSnapshot[] = [
  fakeZfsSnapshot,
  {
    name: 'test-dataset@second-snapshot',
    properties: {
      creation: {
        parsed: {
          $date: 1634575903000,
        },
      },
      used: {
        parsed: 1634575903000,
      },
      referenced: {
        parsed: 1634575903000,
      },
    },
  }] as unknown as ZfsSnapshot[];

export const fakeSnapshotListRow = {
  id: 'snapshot-1',
  name: 'first-snapshot',
  dataset: 'my-dataset',
  snapshot_name: 'first-snapshot',
  properties: {
    creation: {
      parsed: {
        $date: 1634575914000,
      },
    },
  },
} as unknown as SnapshotListRow;
