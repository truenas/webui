import { VdevType } from 'app/enums/v-dev-type.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';

export function isTopologyLimitedToOneLayout(type: VdevType): boolean {
  return type === VdevType.Spare || type === VdevType.Cache;
}

export const zvolPath = '/dev/zvol';

export function isQuotaSet(quota: DatasetQuota): boolean {
  return quota.quota > 0 || quota.obj_quota > 0;
}
