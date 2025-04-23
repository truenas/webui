import { VDevType } from 'app/enums/v-dev-type.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';

export function isTopologyLimitedToOneLayout(type: VDevType): boolean {
  return type === VDevType.Spare || type === VDevType.Cache;
}

export const zvolPath = '/dev/zvol';

export function isQuotaSet(quota: DatasetQuota): boolean {
  return quota.quota > 0 || quota.obj_quota > 0;
}
