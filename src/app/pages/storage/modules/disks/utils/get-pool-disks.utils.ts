import { Pool } from 'app/interfaces/pool.interface';
import { isTopologyDisk, TopologyDisk } from 'app/interfaces/storage.interface';

export function getPoolDisks(pool: Pool): string[] {
  if (!pool?.topology) {
    return [];
  }

  const disks: string[] = [];
  Array.from(Object.values(pool.topology))
    .filter((devices) => devices.length)
    .forEach((devices) => {
      devices.forEach((device: TopologyDisk) => {
        if (device?.disk && isTopologyDisk(device)) {
          disks.push(device.disk);
        } else {
          device?.children
            .filter((child) => child.disk)
            .forEach((child) => {
              disks.push(child.disk);
            });
        }
      });
    });

  return disks;
}
