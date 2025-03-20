import { VdevType } from 'app/enums/v-dev-type.enum';

export function isTopologyLimitedToOneLayout(type: VdevType): boolean {
  return type === VdevType.Spare || type === VdevType.Cache;
}

export const zvolPath = '/dev/zvol';
