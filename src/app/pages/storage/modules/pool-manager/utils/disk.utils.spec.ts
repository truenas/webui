import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import {
  filterAllowedDisks,
  hasActiveSedSecurity,
  hasExportedPool,
  hasNonUniqueSerial,
  isSedCapable,
  suitsEncryptionType,
} from 'app/pages/storage/modules/pool-manager/utils/disk.utils';

describe('hasNonUniqueSerial', () => {
  it('return true if disk has duplicate serial', () => {
    expect(hasNonUniqueSerial({ duplicate_serial: ['duplicate'] } as DetailsDisk)).toBe(true);
  });

  it('return false if disk does not have a duplicate serial', () => {
    expect(hasNonUniqueSerial({ duplicate_serial: [] as string[] } as DetailsDisk)).toBe(false);
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

describe('isSedCapable', () => {
  it('returns true when disk has UNINITIALIZED sed_status', () => {
    expect(isSedCapable({ sed_status: SedStatus.Uninitialized } as DetailsDisk)).toBe(true);
  });

  it('returns true when disk has UNLOCKED sed_status', () => {
    expect(isSedCapable({ sed_status: SedStatus.Unlocked } as DetailsDisk)).toBe(true);
  });

  it('returns false when disk has LOCKED sed_status', () => {
    expect(isSedCapable({ sed_status: SedStatus.Locked } as DetailsDisk)).toBe(false);
  });

  it('returns false when disk has no sed_status', () => {
    expect(isSedCapable({} as DetailsDisk)).toBe(false);
  });
});

describe('hasActiveSedSecurity', () => {
  it('returns true for a locked or an initialized (unlocked) SED', () => {
    expect(hasActiveSedSecurity({ sed_status: SedStatus.Locked } as DetailsDisk)).toBe(true);
    expect(hasActiveSedSecurity({ sed_status: SedStatus.Unlocked } as DetailsDisk)).toBe(true);
  });

  it('returns false for an uninitialized SED and for a disk with no SED status', () => {
    expect(hasActiveSedSecurity({ sed_status: SedStatus.Uninitialized } as DetailsDisk)).toBe(false);
    expect(hasActiveSedSecurity({} as DetailsDisk)).toBe(false);
  });
});

describe('suitsEncryptionType', () => {
  const plainDisk = {} as DetailsDisk;
  const uninitializedSed = { sed_status: SedStatus.Uninitialized } as DetailsDisk;
  const unlockedSed = { sed_status: SedStatus.Unlocked } as DetailsDisk;
  const lockedSed = { sed_status: SedStatus.Locked } as DetailsDisk;

  it('takes only SED-capable disks for an SED pool', () => {
    expect(suitsEncryptionType(uninitializedSed, EncryptionType.Sed)).toBe(true);
    expect(suitsEncryptionType(unlockedSed, EncryptionType.Sed)).toBe(true);
    expect(suitsEncryptionType(lockedSed, EncryptionType.Sed)).toBe(false);
    expect(suitsEncryptionType(plainDisk, EncryptionType.Sed)).toBe(false);
  });

  it.each([EncryptionType.None, EncryptionType.Software])(
    'refuses disks with active SED security for a %s pool',
    (encryptionType) => {
      expect(suitsEncryptionType(plainDisk, encryptionType)).toBe(true);
      expect(suitsEncryptionType(uninitializedSed, encryptionType)).toBe(true);
      expect(suitsEncryptionType(unlockedSed, encryptionType)).toBe(false);
      expect(suitsEncryptionType(lockedSed, encryptionType)).toBe(false);
    },
  );
});

describe('filterAllowedDisks', () => {
  const normalDisk = { duplicate_serial: [] as string[] } as DetailsDisk;
  const nonUniqueSerialDisk = { duplicate_serial: ['duplicate'] } as DetailsDisk;
  const exportedPoolDisk = { duplicate_serial: [] as string[], exported_zpool: 'exported' } as DetailsDisk;
  const anotherExportedPoolDisk = { duplicate_serial: [] as string[], exported_zpool: 'another' } as DetailsDisk;
  const enclosureDisk = { duplicate_serial: [] as string[], enclosure: { id: 'id1' } } as DetailsDisk;

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

  it('filters out non-SED capable disks for an SED pool', () => {
    const sedDisk1 = { duplicate_serial: [] as string[], sed_status: SedStatus.Uninitialized } as DetailsDisk;
    const sedDisk2 = { duplicate_serial: [] as string[], sed_status: SedStatus.Unlocked } as DetailsDisk;
    const nonSedDisk1 = { duplicate_serial: [] as string[], sed_status: SedStatus.Locked } as DetailsDisk;
    const nonSedDisk2 = { duplicate_serial: [] as string[] } as DetailsDisk;
    const nonSedDisk3 = { duplicate_serial: [] as string[] } as DetailsDisk;

    const mixedDisks = [sedDisk1, nonSedDisk1, sedDisk2, nonSedDisk2, nonSedDisk3];

    const filteredDisks = filterAllowedDisks(mixedDisks, {
      allowNonUniqueSerialDisks: true,
      allowExportedPools: [],
      limitToSingleEnclosure: null,
      encryptionType: EncryptionType.Sed,
    });

    expect(filteredDisks).toEqual([sedDisk1, sedDisk2]);
  });

  it('filters out locked and initialized SEDs for a pool without SED encryption', () => {
    const uninitializedSed = { duplicate_serial: [] as string[], sed_status: SedStatus.Uninitialized } as DetailsDisk;
    const unlockedSed = { duplicate_serial: [] as string[], sed_status: SedStatus.Unlocked } as DetailsDisk;
    const lockedSed = { duplicate_serial: [] as string[], sed_status: SedStatus.Locked } as DetailsDisk;
    const nonSedDisk = { duplicate_serial: [] as string[] } as DetailsDisk;

    const filteredDisks = filterAllowedDisks([uninitializedSed, unlockedSed, lockedSed, nonSedDisk], {
      allowNonUniqueSerialDisks: true,
      allowExportedPools: [],
      limitToSingleEnclosure: null,
      encryptionType: EncryptionType.None,
    });

    expect(filteredDisks).toEqual([uninitializedSed, nonSedDisk]);
  });

  it('skips the encryption check when no encryption type is given', () => {
    const sedDisk = { duplicate_serial: [] as string[], sed_status: SedStatus.Locked } as DetailsDisk;
    const nonSedDisk = { duplicate_serial: [] as string[] } as DetailsDisk;

    const mixedDisks = [sedDisk, nonSedDisk];

    const filteredDisks = filterAllowedDisks(mixedDisks, {
      allowNonUniqueSerialDisks: true,
      allowExportedPools: [],
      limitToSingleEnclosure: null,
    });

    expect(filteredDisks).toEqual([sedDisk, nonSedDisk]);
  });
});
