import { normalizeTestIdParts, normalizeTestIdString } from 'app/modules/test-id/normalize-test-id.utils';

describe('normalizeTestIdString', () => {
  it('kebab-cases an already-joined id', () => {
    expect(normalizeTestIdString('nfs-share-mnt-pool-data')).toBe('nfs-share-mnt-pool-data');
  });

  // This is the behaviour `[ixTest]` has always had, and the reason tn-* `testId`
  // values are pre-normalized with this helper rather than left to the library.
  it('splits letter to digit boundaries the way lodash does', () => {
    expect(normalizeTestIdString('nfs-share-mnt-pool1-data')).toBe('nfs-share-mnt-pool-1-data');
  });

  it('stringifies numbers', () => {
    expect(normalizeTestIdString(42)).toBe('42');
  });
});

describe('normalizeTestIdParts', () => {
  it('kebab-cases a single segment', () => {
    expect(normalizeTestIdParts('Reset Settings')).toEqual(['reset-settings']);
  });

  it('kebab-cases every segment of an array separately', () => {
    expect(normalizeTestIdParts(['Lag Ports', 'Some Option'])).toEqual(['lag-ports', 'some-option']);
  });

  it('splits letter to digit boundaries in every segment', () => {
    expect(normalizeTestIdParts(['lag_ports', 'eth0'])).toEqual(['lag-ports', 'eth-0']);
  });

  it('stringifies numbers', () => {
    expect(normalizeTestIdParts(1)).toEqual(['1']);
  });

  it('drops empty, null and undefined segments', () => {
    expect(normalizeTestIdParts(['device', null, undefined, '', 'add'])).toEqual(['device', 'add']);
  });

  // A numeric 0 carries a value — a control at index 0 of a FormArray, say — so it must
  // survive, or two siblings would resolve to the same id. `[ixTest]`'s own falsy filter
  // does drop it, but that quirk lives in TestDirective, not here.
  it('keeps a numeric 0 segment', () => {
    expect(normalizeTestIdParts(['port', 0, 'edit'])).toEqual(['port', '0', 'edit']);
  });

  it('returns an empty array when there is nothing to normalize', () => {
    expect(normalizeTestIdParts(undefined)).toEqual([]);
  });
});
