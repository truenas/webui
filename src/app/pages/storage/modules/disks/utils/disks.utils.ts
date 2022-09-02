import { PoolTopologyCategory } from 'app/enums/pool-topology-category.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { isTopologyDisk } from 'app/interfaces/storage.interface';

export function getAllDiskNames(pool: Pool): string[] {
  if (!pool || !pool.topology) {
    return [];
  }

  const allDiskNames: string[] = [];

  (['cache', 'data', 'dedup', 'log', 'spare', 'special'] as PoolTopologyCategory[]).forEach((categoryName) => {
    const category = pool.topology[categoryName];

    if (!category || !category.length) {
      return;
    }

    category.forEach((item) => {
      if (isTopologyDisk(item) && item.disk) {
        allDiskNames.push(item.disk);
      } else {
        item.children.forEach((device) => {
          if (!device.disk) {
            return;
          }

          allDiskNames.push(device.disk);
        });
      }
    });
  });

  return allDiskNames;
}
