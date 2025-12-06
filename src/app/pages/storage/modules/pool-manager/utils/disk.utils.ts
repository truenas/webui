import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';

export function hasNonUniqueSerial(disk: DetailsDisk): boolean {
  return Boolean(disk.duplicate_serial?.length);
}

export function hasExportedPool(disk: DetailsDisk): disk is DetailsDisk & { exported_zpool: string } {
  return Boolean(disk.exported_zpool);
}

export function isSedCapable(disk: DetailsDisk): boolean {
  return disk.sed_status === SedStatus.Uninitialized || disk.sed_status === SedStatus.Unlocked;
}

export function filterAllowedDisks(allDisks: DetailsDisk[], options: {
  allowNonUniqueSerialDisks: boolean;
  allowExportedPools: string[];
  limitToSingleEnclosure: string | null;
  requireSedCapable?: boolean;
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

    if (options.requireSedCapable && !isSedCapable(disk)) {
      return false;
    }

    return true;
  });
}
