/**
 * A dataset's own quotas, reservations and quota alert threshold, over the API.
 *
 * Provisioning only, plus the read a test asserts against. Setting and removing them is what
 * `tests/dataset-capacity-settings.e2e.ts` drives through the UI, so nothing here may stand in for
 * it. There is no teardown of its own: they live on the dataset, and the spec deletes it.
 */
import { firstValueFrom, timeout } from 'rxjs';
import { findDataset } from './storage';
import type { E2eApiClient } from '../support/api/client';
import { slowCallTimeoutMs } from '../support/timeouts';

/** What the capacity settings form edits, as plain values. */
export interface DatasetCapacity {
  /** Bytes. `0` when unset. */
  refquota: number;
  /** Bytes. `0` when unset. */
  quota: number;
  /** Bytes. `0` when unset. */
  refreservation: number;
  /** Bytes. `0` when unset. */
  reservation: number;
  /**
   * `user_properties.refquota_warning.value`, a percentage as a string, or undefined when
   * middleware lists none. Middleware reports every user property it lists as `LOCAL`, so the
   * source cannot tell a value set here from one inherited.
   */
  refquotaWarning: string | undefined;
}

/** The fields of a `pool.dataset.query` row that {@link readCapacity} reads. */
interface RawCapacity {
  refquota: { parsed: number | null };
  quota: { parsed: number | null };
  refreservation: { parsed: number | null };
  reservation: { parsed: number | null };
  user_properties?: Record<string, { value: string } | undefined>;
}

/** Throws when the dataset is absent, which no caller expects. */
export async function readCapacity(client: E2eApiClient, name: string): Promise<DatasetCapacity> {
  const dataset = await findDataset(client, name);
  if (!dataset) {
    throw new Error(`Cannot read the quotas of "${name}": there is no such dataset.`);
  }

  // Narrowed to the fields read here, as `findPoolScan` does with a pool's scan.
  const raw = dataset as unknown as RawCapacity;
  return {
    refquota: raw.refquota.parsed ?? 0,
    quota: raw.quota.parsed ?? 0,
    refreservation: raw.refreservation.parsed ?? 0,
    reservation: raw.reservation.parsed ?? 0,
    refquotaWarning: raw.user_properties?.refquota_warning?.value,
  };
}

/** Sets all four sizes and the quota warning threshold on `name`, as a precondition. */
export async function setCapacity(
  client: E2eApiClient,
  name: string,
  capacity: {
    refquota: number;
    quota: number;
    refreservation: number;
    reservation: number;
    refquotaWarning: number;
  },
): Promise<void> {
  await firstValueFrom(
    client.api.call('pool.dataset.update', [name, {
      refquota: capacity.refquota,
      quota: capacity.quota,
      refreservation: capacity.refreservation,
      reservation: capacity.reservation,
      refquota_warning: capacity.refquotaWarning,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
