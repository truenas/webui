import { toLegacyHolds, ZfsResourceSnapshot, zfsResourceToSnapshot } from 'app/interfaces/zfs-snapshot.interface';

describe('zfsResourceToSnapshot', () => {
  it('reads a snapshot row into the legacy shape', () => {
    expect(zfsResourceToSnapshot({
      name: 'dozer/data@auto-1',
      pool: 'dozer',
      dataset: 'dozer/data',
      snapshot_name: 'auto-1',
      createtxg: 5,
      guid: 1,
      holds: ['truenas'],
      properties: {
        creation: { raw: '1795519511', value: 1795519511, source: { type: 'NONE', value: null } },
        used: { raw: '1024', value: 1024, source: null },
      },
      user_properties: null,
    } as ZfsResourceSnapshot)).toEqual({
      id: 'dozer/data@auto-1',
      name: 'dozer/data@auto-1',
      pool: 'dozer',
      dataset: 'dozer/data',
      snapshot_name: 'auto-1',
      type: 'SNAPSHOT',
      properties: {
        creation: {
          parsed: 1795519511, rawvalue: '1795519511', value: '1795519511', source: 'NONE',
        },
        used: {
          parsed: 1024, rawvalue: '1024', value: '1024', source: 'NONE',
        },
      },
      holds: { truenas: 1 },
    });
  });

  it('leaves out properties and holds that were not requested', () => {
    const snapshot = zfsResourceToSnapshot({
      name: 'dozer@a', pool: 'dozer', dataset: 'dozer', snapshot_name: 'a', holds: null, properties: null,
    } as ZfsResourceSnapshot);

    expect(snapshot).not.toHaveProperty('properties');
    expect(snapshot).not.toHaveProperty('holds');
  });
});

describe('toLegacyHolds', () => {
  it('reports only the truenas hold', () => {
    expect(toLegacyHolds(['truenas', 'other'])).toEqual({ truenas: 1 });
    expect(toLegacyHolds(['other'])).toEqual({});
    expect(toLegacyHolds([])).toEqual({});
    expect(toLegacyHolds(null)).toEqual({});
  });
});
