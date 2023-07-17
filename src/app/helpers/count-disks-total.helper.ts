import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { PoolTopology } from 'app/interfaces/pool.interface';

export const countDisksTotal = (topology: PoolTopology): string => {
  let total = 0;
  Object.keys(topology).forEach((key: keyof PoolTopology) => {
    topology[key].forEach((item) => {
      if (item.type === TopologyItemType.Disk) {
        total++;
      } else {
        total += item.children.filter((child) => child.type === TopologyItemType.Disk).length;
      }
    });
  });
  return total.toString();
};
