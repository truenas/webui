import { Disk, StorageDashboardDisk } from 'app/interfaces/storage.interface';

export function diskToDashboardDisk(disk: Disk): StorageDashboardDisk {
  return {
    ...disk,
    alerts: [],
    smartTestsRunning: 0,
    smartTestsFailed: 0,
    tempAggregates: { min: 25, max: 25, avg: 25 },
  };
}
