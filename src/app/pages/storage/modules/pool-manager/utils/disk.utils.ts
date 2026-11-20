import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';

export function hasNonUniqueSerial(disk: DetailsDisk): boolean {
  return Boolean(disk.duplicate_serial?.length);
}

export function hasExportedPool(disk: DetailsDisk): disk is DetailsDisk & { exported_zpool: string } {
  return Boolean(disk.exported_zpool);
}

export function isSedCapable(disk: DetailsDisk): boolean {
  return disk.sed_status === SedStatus.Uninitialized || disk.sed_status === SedStatus.Unlocked;
}

/**
 * The disk's SED security is turned on: it is locked, or it has been initialized with a password and is
 * unlocked. Such a disk depends on an SED credential, so it only belongs in a pool with SED encryption.
 */
export function hasActiveSedSecurity(disk: DetailsDisk): boolean {
  return disk.sed_status === SedStatus.Locked || disk.sed_status === SedStatus.Unlocked;
}

/**
 * Whether the disk can go into a pool with the given encryption. An SED pool takes only SED-capable disks;
 * any other pool refuses disks with active SED security, which would otherwise make the pool depend on an
 * SED credential (or fail at creation, when the disk cannot be unlocked).
 */
export function suitsEncryptionType(disk: DetailsDisk, encryptionType: EncryptionType): boolean {
  return encryptionType === EncryptionType.Sed ? isSedCapable(disk) : !hasActiveSedSecurity(disk);
}

export function filterAllowedDisks(allDisks: DetailsDisk[], options: {
  allowNonUniqueSerialDisks: boolean;
  allowExportedPools: string[];
  limitToSingleEnclosure: string | null;
  /** Leave out to skip the encryption check. */
  encryptionType?: EncryptionType;
}): DetailsDisk[] {
  return allDisks.filter((disk) => {
    if (hasNonUniqueSerial(disk) && !options.allowNonUniqueSerialDisks) {
      return false;
    }

    if (hasExportedPool(disk) && !options.allowExportedPools.includes(disk.exported_zpool)) {
      return false;
    }

    if (options.limitToSingleEnclosure !== null && disk.enclosure?.id !== options.limitToSingleEnclosure) {
      return false;
    }

    if (options.encryptionType !== undefined && !suitsEncryptionType(disk, options.encryptionType)) {
      return false;
    }

    return true;
  });
}
