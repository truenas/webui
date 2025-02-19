import { Disk, StorageDashboardDisk } from 'app/interfaces/disk.interface';

export function diskToDashboardDisk(disk: Disk): StorageDashboardDisk {
  return {
    ...disk,
    alerts: [],
    tempAggregates: { min: 25, max: 25, avg: 25 },
  };
}
