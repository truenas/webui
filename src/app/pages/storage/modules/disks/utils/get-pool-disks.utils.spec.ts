import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Pool, PoolTopology } from 'app/interfaces/pool.interface';
import { getPoolDisks } from 'app/pages/storage/modules/disks/utils/get-pool-disks.utils';

const mockPool = {
  topology: {
    data: [{
      disk: 'sda1',
      type: TopologyItemType.Disk,
    }],
    cache: [{
      children: [{
        disk: 'sdb1',
        type: TopologyItemType.Disk,
      }, {
        disk: 'sdb2',
        type: TopologyItemType.Disk,
      }],
    }],
  } as PoolTopology,
} as Pool;

describe('GetPoolDisks', () => {
  it('returns list of disks from given pool', () => {
    const disks = getPoolDisks(mockPool);
    expect(disks).toStrictEqual(['sda1', 'sdb1', 'sdb2']);
  });
});
