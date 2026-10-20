/**
 * User and group quotas on a dataset, over the API.
 *
 * Provisioning only, plus the read a test asserts against. Setting, changing and removing a quota
 * is what `tests/dataset-quotas.e2e.ts` drives through the UI, so nothing here may stand in for it.
 * There is no teardown of its own: a quota lives on its dataset, and the spec deletes the dataset.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** Which quota page, and which principal it is set for. */
export type QuotaKind = 'user' | 'group';

/** `DatasetQuotaType` for the data quota and the object quota of each kind. */
const quotaTypes = {
  user: { data: 'USER', objects: 'USEROBJ' },
  group: { data: 'GROUP', objects: 'GROUPOBJ' },
} as const;

/**
 * One row of `pool.dataset.get_quota` for users or groups.
 *
 * Declared here because the client types the response as every shape the call can take, across
 * the user, group, dataset and project quotas. The webui narrows it the same way
 * (`toDatasetQuotas` in `dataset-quota.interface.ts`).
 */
export interface QuotaEntry {
  /** The uid or gid. */
  id: number;
  /** The user or group name. `null` when the id no longer maps to one, as for a deleted user. */
  name: string | null;
  /** Bytes. `0` when unset. */
  quota: number;
  /** `0` when unset. */
  obj_quota: number;
}

/**
 * Every entry middleware lists for `kind` on `dataset`: each principal with a quota, and each one
 * that owns something there with none.
 */
export async function listQuotas(client: E2eApiClient, dataset: string, kind: QuotaKind): Promise<QuotaEntry[]> {
  return await firstValueFrom(
    client.api.call('pool.dataset.get_quota', [dataset, quotaTypes[kind].data, []]).pipe(timeout(readTimeoutMs)),
  ) as unknown as QuotaEntry[];
}

/**
 * The quota set for `name` on `dataset`, or undefined when middleware lists none.
 *
 * Read in full and filtered here. `get_quota` filters only on fields every kind of quota has,
 * and `name` is not one of them.
 */
export async function findQuota(
  client: E2eApiClient,
  dataset: string,
  kind: QuotaKind,
  name: string,
): Promise<QuotaEntry | undefined> {
  const quotas = await listQuotas(client, dataset, kind);
  return quotas.find((quota) => quota.name === name);
}

/** The quota set for the uid or gid `id` on `dataset`, for an id that may no longer map to a name. */
export async function findQuotaById(
  client: E2eApiClient,
  dataset: string,
  kind: QuotaKind,
  id: number,
): Promise<QuotaEntry | undefined> {
  const quotas = await listQuotas(client, dataset, kind);
  return quotas.find((quota) => quota.id === id);
}

/** Sets both quotas for `name` on `dataset`, as a precondition. `name` may be a name or an id. */
export async function setQuota(
  client: E2eApiClient,
  dataset: string,
  kind: QuotaKind,
  name: string,
  quota: { bytes: number; objects: number },
): Promise<void> {
  await firstValueFrom(
    client.api.call('pool.dataset.set_quota', [dataset, [
      { quota_type: quotaTypes[kind].data, id: name, quota_value: quota.bytes },
      { quota_type: quotaTypes[kind].objects, id: name, quota_value: quota.objects },
    ]]).pipe(timeout(slowCallTimeoutMs)),
  );
}
