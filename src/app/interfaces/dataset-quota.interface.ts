import { CallParams, CallResponse } from '@truenas/api-client';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { TypedQueryFilter, WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface DatasetQuota {
  id: number;
  name: string;
  obj_quota: number;
  obj_used: number;
  quota: number;
  quota_type: DatasetQuotaType;
  used_bytes: number;
  used_percent: number;
}

/** One entry of `pool.dataset.set_quota`, as middleware declares it. */
export type SetDatasetQuota = NonNullable<CallParams<WebUiApiDirectory, 'pool.dataset.set_quota'>[1]>[number];

/** A filter for `pool.dataset.get_quota`, which takes filters but is not a `.query` method. */
export type DatasetQuotaFilter = TypedQueryFilter<DatasetQuota>;

/**
 * Hands user or group quota filters to `pool.dataset.get_quota`. Middleware types its filters over all four kinds of
 * quota at once, so only a field every kind has (`id`, `quota`) can be named there; `name` belongs to the user and
 * group rows the UI filters.
 */
export function toDatasetQuotaFilters(
  filters: DatasetQuotaFilter[],
): CallParams<WebUiApiDirectory, 'pool.dataset.get_quota'>[2] {
  return filters as CallParams<WebUiApiDirectory, 'pool.dataset.get_quota'>[2];
}

/**
 * Reads `pool.dataset.get_quota` into the user and group quota rows the quota pages list. Middleware declares
 * the response as every shape a query can take (a list, one entry, a count) across the user, group, dataset and
 * project quotas; the UI only ever asks for the list of user or group quotas, and leaves out the options that
 * would return anything else.
 *
 * The generated user/group entry also leaves out `used_percent`, which middleware sends.
 */
export function toDatasetQuotas(response: CallResponse<WebUiApiDirectory, 'pool.dataset.get_quota'>): DatasetQuota[] {
  return response as DatasetQuota[];
}
