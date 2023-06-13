import { UnusedDisk } from 'app/interfaces/storage.interface';

export function hasNonUniqueSerial(disk: UnusedDisk): boolean {
  return Boolean(disk.duplicate_serial?.length);
}

export function hasExportedPool(disk: UnusedDisk): boolean {
  return Boolean(disk.exported_zpool);
}

export function filterAllowedDisks(allDisks: UnusedDisk[], options: {
  allowNonUniqueSerialDisks: boolean;
  allowExportedPools: string[];
  limitToSingleEnclosure: number | null;
}): UnusedDisk[] {
  return allDisks.filter((disk) => {
    if (hasNonUniqueSerial(disk) && !options.allowNonUniqueSerialDisks) {
      return false;
    }

    if (hasExportedPool(disk) && !options.allowExportedPools.includes(disk.exported_zpool)) {
      return false;
    }

    if (options.limitToSingleEnclosure !== null && disk.enclosure?.number !== options.limitToSingleEnclosure) {
      return false;
    }

    return true;
  });
}
