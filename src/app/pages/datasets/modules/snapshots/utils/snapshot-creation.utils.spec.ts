import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import {
  getFiniteNumber,
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
      // Assert on the structured warning payload only; the wording of the
      // message is documentation and prone to drift.
      expect(warn).toHaveBeenCalledWith(expect.any(String), { $date: 1634575914000 });
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

  it('returns undefined and warns when parsed is a string (stale middleware sending unparsed seconds)', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(getSnapshotCreationMs(snapshotWithCreationParsed('1634575914', 'string-shape'))).toBeUndefined();
      expect(warn).toHaveBeenCalledWith(expect.any(String), '1634575914');
    } finally {
      warn.mockRestore();
    }
  });

  it('returns undefined and warns for non-finite numbers', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(getSnapshotCreationMs(snapshotWithCreationParsed(Number.NaN, 'nan-shape'))).toBeUndefined();
      expect(getSnapshotCreationMs(snapshotWithCreationParsed(Number.POSITIVE_INFINITY, 'inf-shape'))).toBeUndefined();
      expect(warn).toHaveBeenCalledTimes(2);
    } finally {
      warn.mockRestore();
    }
  });

  it('returns undefined for parsed=0 and parsed<0 so a non-positive value never renders as 1970-or-earlier', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(getSnapshotCreationMs(snapshotWithCreationParsed(0, 'zero-shape'))).toBeUndefined();
      expect(getSnapshotCreationMs(snapshotWithCreationParsed(-1, 'negative-shape'))).toBeUndefined();
      expect(warn).toHaveBeenCalledTimes(2);
    } finally {
      warn.mockRestore();
    }
  });
});

describe('getFiniteNumber', () => {
  it('returns finite numbers unchanged', () => {
    expect(getFiniteNumber(0)).toBe(0);
    expect(getFiniteNumber(-1)).toBe(-1);
    expect(getFiniteNumber(1.5e12)).toBe(1.5e12);
  });

  it('returns undefined for non-finite or non-number values', () => {
    expect(getFiniteNumber(Number.NaN)).toBeUndefined();
    expect(getFiniteNumber(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(getFiniteNumber('123')).toBeUndefined();
    expect(getFiniteNumber(null)).toBeUndefined();
    expect(getFiniteNumber(undefined)).toBeUndefined();
  });
});
