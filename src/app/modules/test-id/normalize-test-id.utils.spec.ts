import { normalizeTestId, normalizeTestIdSegment } from 'app/modules/test-id/normalize-test-id.utils';

describe('normalizeTestIdSegment', () => {
  it('kebab-cases an already-joined id', () => {
    expect(normalizeTestIdSegment('nfs-share-mnt-pool-data')).toBe('nfs-share-mnt-pool-data');
  });

  // This is the behaviour `[ixTest]` has always had, and the reason tn-* `testId`
  // values are pre-normalized with this helper rather than left to the library.
  it('splits letter to digit boundaries the way lodash does', () => {
    expect(normalizeTestIdSegment('nfs-share-mnt-pool1-data')).toBe('nfs-share-mnt-pool-1-data');
  });

  it('stringifies numbers', () => {
    expect(normalizeTestIdSegment(42)).toBe('42');
  });
});

describe('normalizeTestId', () => {
  it('kebab-cases a single segment', () => {
    expect(normalizeTestId('Reset Settings')).toEqual(['reset-settings']);
  });

  it('kebab-cases every segment of an array separately', () => {
    expect(normalizeTestId(['Lag Ports', 'Some Option'])).toEqual(['lag-ports', 'some-option']);
  });

  it('splits letter to digit boundaries in every segment', () => {
    expect(normalizeTestId(['lag_ports', 'eth0'])).toEqual(['lag-ports', 'eth-0']);
  });

  it('stringifies numbers', () => {
    expect(normalizeTestId(1)).toEqual(['1']);
  });

  it('drops empty, null and undefined segments', () => {
    expect(normalizeTestId(['device', null, undefined, '', 'add'])).toEqual(['device', 'add']);
  });

  it('returns an empty array when there is nothing to normalize', () => {
    expect(normalizeTestId(undefined)).toEqual([]);
  });
});
