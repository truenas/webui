import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  filterAllowedDisks,
  hasExportedPool,
  hasNonUniqueSerial,
} from 'app/pages/storage/modules/pool-manager/utils/disk.utils';

describe('hasNonUniqueSerial', () => {
  it('return true if disk has duplicate serial', () => {
    expect(hasNonUniqueSerial({ duplicate_serial: ['duplicate'] } as DetailsDisk)).toBe(true);
  });

  it('return false if disk does not have a duplicate serial', () => {
    expect(hasNonUniqueSerial({ duplicate_serial: [] } as DetailsDisk)).toBe(false);
  });
});

describe('hasExportedPool', () => {
  it('returns true if disk has exported pool', () => {
    expect(hasExportedPool({ exported_zpool: 'exported' } as DetailsDisk)).toBe(true);
  });

  it('returns false if disk has no exported pool', () => {
    expect(hasExportedPool({ exported_zpool: null } as DetailsDisk)).toBe(false);
  });
});

describe('filterAllowedDisks', () => {
  const normalDisk = { duplicate_serial: [] } as DetailsDisk;
  const nonUniqueSerialDisk = { duplicate_serial: ['duplicate'] } as DetailsDisk;
  const exportedPoolDisk = { duplicate_serial: [], exported_zpool: 'exported' } as DetailsDisk;
  const anotherExportedPoolDisk = { duplicate_serial: [], exported_zpool: 'another' } as DetailsDisk;
  const enclosureDisk = { duplicate_serial: [], enclosure: { id: 'id1' } } as DetailsDisk;

  const disks = [
    normalDisk,
    nonUniqueSerialDisk,
    exportedPoolDisk,
    anotherExportedPoolDisk,
    enclosureDisk,
  ] as DetailsDisk[];

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
      limitToSingleEnclosure: 'id1',
    });

    expect(filteredDisks).toEqual([enclosureDisk]);
  });
});
