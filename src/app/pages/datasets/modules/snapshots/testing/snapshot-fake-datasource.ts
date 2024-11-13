import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

export const fakeZfsSnapshot: ZfsSnapshot = {
  id: '1',
  name: 'test-dataset@first-snapshot',
  dataset: 'test-dataset',
  snapshot_name: 'first-snapshot',
  properties: {
    creation: {
      parsed: {
        $date: 1634575914000,
      },
    } as ZfsProperty<string, ApiTimestamp>,
    used: {
      parsed: 1634575914000,
    } as ZfsProperty<number>,
    referenced: {
      parsed: 1634575914000,
    } as ZfsProperty<number>,
  } as ZfsSnapshot['properties'],
  retention: {
    datetime: { $date: 1654575914000 },
    source: 'periodic_snapshot_task',
    periodic_snapshot_task_id: 1,
  },
  holds: {
    truenas: 1,
  },
} as ZfsSnapshot;

export const fakeZfsSnapshotDataSource: ZfsSnapshot[] = [
  fakeZfsSnapshot,
  {
    id: 2,
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
] as ZfsSnapshot[];
