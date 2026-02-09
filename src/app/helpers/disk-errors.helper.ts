import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { VDevItem } from 'app/interfaces/storage.interface';

type CountableDisks = PoolTopology | VDevItem[];

/**
 * helper function to flatten a disk topology recursively.
 * @param topo the `PoolTopology` or `VDevItem[]` to flatten.
 * @returns a `VDevItem[]` with all children of all items concatenated.
 */
export function flattenDiskTopology(topo: CountableDisks): VDevItem[] {
  const allDisks: VDevItem[] = Object.values(topo).flat();

  /**
   * helper function that can be recursively called on a `VDevItem`'s children
   */
  const helper = (items: VDevItem[]): VDevItem[] => {
    return items.reduce((allItems: VDevItem[], item: VDevItem) => {
      const children = (item.type !== TopologyItemType.Disk && item?.children)
        ? helper(item.children)
        : [];

      // accumulate all discovered disks so far
      return [...allItems, item, ...children];
    }, []);
  };

  return helper(allDisks);
}

/**
 * helper function which returns all disks - including child disks -
 * with errors in a pool topology.
 * @param topo pool topology to get disks from
 * @returns a list of `VDevItem` that have nonzero read, write, or checksum errors.
 */
export function getDisksWithErrors(topo: CountableDisks): VDevItem[] {
  const flattened = flattenDiskTopology(topo);
  return flattened.filter((item: VDevItem) => {
    const stats = item?.stats;
    return (stats?.read_errors ?? 0) > 0
      || (stats?.write_errors ?? 0) > 0
      || (stats?.checksum_errors ?? 0) > 0;
  });
}

/**
 * helper function to count errors in a disk topology.
 * @param pred predicate that determines whether not a particular topology item should have
 *        its errors counted.
 * @param items (flattened) topology to count errors within.
 * @returns the sum of read, write, and checksum errors in all devices satisfying `pred`.
 */
export function countTopologyErrors(pred: (arg0: VDevItem) => boolean, items: CountableDisks): number {
  const flattened = flattenDiskTopology(items);
  return flattened.reduce((count: number, item: VDevItem): number => {
    const stats = item?.stats;
    if (pred(item) && stats) {
      return count + stats.read_errors + stats.write_errors + stats.checksum_errors;
    }

    return count;
  }, 0);
}
