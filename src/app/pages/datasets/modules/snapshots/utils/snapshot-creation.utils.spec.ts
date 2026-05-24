import { ZfsProperty } from 'app/interfaces/zfs-property.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { getSnapshotCreationMs } from 'app/pages/datasets/modules/snapshots/utils/snapshot-creation.utils';

function snapshotWithCreationParsed(parsed: unknown): ZfsSnapshot {
  return {
    properties: {
      creation: { parsed } as unknown as ZfsProperty<string, number>,
    },
  } as ZfsSnapshot;
}

describe('getSnapshotCreationMs', () => {
  it('converts unix-seconds to milliseconds', () => {
    expect(getSnapshotCreationMs(snapshotWithCreationParsed(1634575914))).toBe(1634575914000);
  });

  it('returns undefined when snapshot is missing', () => {
    expect(getSnapshotCreationMs(undefined)).toBeUndefined();
    expect(getSnapshotCreationMs(null)).toBeUndefined();
  });

  it('returns undefined when parsed is missing', () => {
    expect(getSnapshotCreationMs(snapshotWithCreationParsed(undefined))).toBeUndefined();
    expect(getSnapshotCreationMs(snapshotWithCreationParsed(null))).toBeUndefined();
  });

  it('returns undefined for the legacy { $date } object shape so we never render NaN', () => {
    expect(getSnapshotCreationMs(snapshotWithCreationParsed({ $date: 1634575914000 }))).toBeUndefined();
  });

  it('returns undefined for non-finite numbers', () => {
    expect(getSnapshotCreationMs(snapshotWithCreationParsed(Number.NaN))).toBeUndefined();
    expect(getSnapshotCreationMs(snapshotWithCreationParsed(Number.POSITIVE_INFINITY))).toBeUndefined();
  });
});
