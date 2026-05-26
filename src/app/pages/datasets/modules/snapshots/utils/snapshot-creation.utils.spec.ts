import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import {
  getSnapshotCreationMs,
  resetSnapshotCreationWarnings,
} from 'app/pages/datasets/modules/snapshots/utils/snapshot-creation.utils';

function snapshotWithCreationParsed(parsed: unknown, id?: string): ZfsSnapshot {
  return {
    id,
    properties: {
      creation: { parsed: parsed as number },
    },
  } as ZfsSnapshot;
}

describe('getSnapshotCreationMs', () => {
  // Dedupe state is module-level; clear it so warn-once tests don't suppress
  // each other when ids happen to collide across cases.
  beforeEach(() => resetSnapshotCreationWarnings());

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
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(
        getSnapshotCreationMs(snapshotWithCreationParsed({ $date: 1634575914000 }, 'legacy-shape-1')),
      ).toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('version mismatch'),
        { $date: 1634575914000 },
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('warns at most once per snapshot id so a stale middleware does not spam the console', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const legacy = { $date: 1634575914000 };
      getSnapshotCreationMs(snapshotWithCreationParsed(legacy, 'legacy-shape-spam'));
      getSnapshotCreationMs(snapshotWithCreationParsed(legacy, 'legacy-shape-spam'));
      getSnapshotCreationMs(snapshotWithCreationParsed(legacy, 'legacy-shape-spam'));
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  it('returns undefined for non-finite numbers', () => {
    expect(getSnapshotCreationMs(snapshotWithCreationParsed(Number.NaN))).toBeUndefined();
    expect(getSnapshotCreationMs(snapshotWithCreationParsed(Number.POSITIVE_INFINITY))).toBeUndefined();
  });
});
