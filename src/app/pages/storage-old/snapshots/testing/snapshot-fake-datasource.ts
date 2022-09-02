import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

export const fakeZfsSnapshot: ZfsSnapshot = {
  name: 'test-dataset@first-snapshot',
  dataset: 'test-dataset',
  snapshot_name: 'first-snapshot',
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
    dataset: 'test-dataset',
    snapshot_name: 'second-snapshot',
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
  },
] as unknown as ZfsSnapshot[];
