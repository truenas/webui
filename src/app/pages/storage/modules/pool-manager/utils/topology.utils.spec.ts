import { GiB } from 'app/constants/bytes.constant';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  PoolManagerTopology,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  categoryCapacity,
  topologyCategoryToDisks,
  topologyToDisks,
} from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

describe('topologyCategoryToDisks', () => {
  it('converts topology category to an array of disks', () => {
    const disk1 = {} as UnusedDisk;
    const disk2 = {} as UnusedDisk;
    const disk3 = {} as UnusedDisk;

    const category = {
      vdevs: [
        [disk1, disk2],
        [disk3],
      ],
    } as PoolManagerTopologyCategory;

    expect(topologyCategoryToDisks(category)).toEqual([disk1, disk2, disk3]);
  });
});

describe('topologyToDisks', () => {
  it('converts topology to an array of disks', () => {
    const disk1 = {} as UnusedDisk;
    const disk2 = {} as UnusedDisk;
    const disk3 = {} as UnusedDisk;
    const disk4 = {} as UnusedDisk;
    const disk5 = {} as UnusedDisk;

    const topology = {
      [VdevType.Data]: {
        vdevs: [
          [disk1, disk2],
          [disk3],
        ],
      },
      [VdevType.Log]: {
        vdevs: [
          [disk4],
          [disk5],
        ],
      },
    } as PoolManagerTopology;

    expect(topologyToDisks(topology)).toEqual([disk1, disk2, disk3, disk4, disk5]);
  });
});

describe('categoryCapacity', () => {
  it('returns the sum of all disks in a category', () => {
    const category = {
      vdevs: [
        [{ size: GiB }, { size: 2 * GiB }],
        [{ size: 3 * GiB }],
      ],
    } as PoolManagerTopologyCategory;

    expect(categoryCapacity(category)).toEqual(6 * GiB);
  });
});
