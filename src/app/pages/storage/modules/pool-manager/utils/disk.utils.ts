import { DetailsDisk } from 'app/interfaces/disk.interface';

export function hasNonUniqueSerial(disk: DetailsDisk): boolean {
  return Boolean(disk.duplicate_serial?.length);
}

export function hasExportedPool(disk: DetailsDisk): boolean {
  return Boolean(disk.exported_zpool);
}

export function filterAllowedDisks(allDisks: DetailsDisk[], options: {
  allowNonUniqueSerialDisks: boolean;
  allowExportedPools: string[];
  limitToSingleEnclosure: string | null;
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

    return true;
  });
}
