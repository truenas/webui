import { VDevType } from 'app/enums/v-dev-type.enum';

export function isTopologyLimitedToOneLayout(type: VDevType): boolean {
  return type === VDevType.Spare || type === VDevType.Cache;
}

export const zvolPath = '/dev/zvol';
