import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  filterAllowedDisks,
  hasExportedPool,
  hasNonUniqueSerial,
} from 'app/pages/storage/modules/pool-manager/utils/disk.utils';

describe('hasNonUniqueSerial', () => {
  it('return true if disk has duplicate serial', () => {
    expect(hasNonUniqueSerial({ duplicate_serial: ['duplicate'] } as UnusedDisk)).toBe(true);
  });

  it('return false if disk does not have a duplicate serial', () => {
    expect(hasNonUniqueSerial({ duplicate_serial: [] } as UnusedDisk)).toBe(false);
  });
});

describe('hasExportedPool', () => {
  it('returns true if disk has exported pool', () => {
    expect(hasExportedPool({ exported_zpool: 'exported' } as UnusedDisk)).toBe(true);
  });

  it('returns false if disk has no exported pool', () => {
    expect(hasExportedPool({ exported_zpool: null } as UnusedDisk)).toBe(false);
  });
});

describe('filterAllowedDisks', () => {
  const normalDisk = { duplicate_serial: [] } as UnusedDisk;
  const nonUniqueSerialDisk = { duplicate_serial: ['duplicate'] } as UnusedDisk;
  const exportedPoolDisk = { duplicate_serial: [], exported_zpool: 'exported' } as UnusedDisk;
  const anotherExportedPoolDisk = { duplicate_serial: [], exported_zpool: 'another' } as UnusedDisk;
  const enclosureDisk = { duplicate_serial: [], enclosure: { number: 1 } } as UnusedDisk;

  const disks = [
    normalDisk,
    nonUniqueSerialDisk,
    exportedPoolDisk,
    anotherExportedPoolDisk,
    enclosureDisk,
  ] as UnusedDisk[];

  it('filters disks with non-unique serials when allowNonUniqueSerialDisks is false', () => {
    const filteredDisks = filterAllowedDisks(disks, {
      allowNonUniqueSerialDisks: false,
      allowExportedPools: ['exported', 'another'],
      limitToSingleEnclosure: null,
    });

    expect(filteredDisks).toEqual([
      normalDisk,
      exportedPoolDisk,
      anotherExportedPoolDisk,
      enclosureDisk,
    ]);
  });

  it('filters disks with non-matching exported pools when they are not specified', () => {
    const filteredDisks = filterAllowedDisks(disks, {
      allowNonUniqueSerialDisks: true,
      allowExportedPools: ['exported'],
      limitToSingleEnclosure: null,
    });

    expect(filteredDisks).toEqual([
      normalDisk,
      nonUniqueSerialDisk,
      exportedPoolDisk,
      enclosureDisk,
    ]);
  });

  it('filters disks matching specific enclosure when limitToSingleEnclosure is specified', () => {
    const filteredDisks = filterAllowedDisks(disks, {
      allowNonUniqueSerialDisks: true,
      allowExportedPools: ['exported', 'another'],
      limitToSingleEnclosure: 1,
    });

    expect(filteredDisks).toEqual([enclosureDisk]);
  });
});
