import { VdevType } from 'app/enums/v-dev-type.enum';

export function isTopologyLimitedToOneLayout(type: string): boolean {
  return type === VdevType.Spare || type === VdevType.Cache;
}
