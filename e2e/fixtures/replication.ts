/**
 * Replication settings: preconditions, cleanup and readback, over the API.
 *
 * The one setting is `replication.config`, a single config record, so — as in
 * `fixtures/audit.ts` — there is nothing to create or delete. Each test writes
 * the limit it starts from.
 *
 * Unlike the other Advanced Settings fixtures, teardown does not write a fixed
 * baseline back. Middleware's schema declares no default for the limit, so what
 * a fresh appliance holds is not knowable from here, and writing a guess would
 * change it for whatever runs next. The spec reads the limit once before its
 * first test and writes that back instead. Every test still starts from a state
 * it chose, so nothing depends on what was read.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

/** The limit on replication tasks run at once. `null` is no limit, which the card shows as `–`. */
export type ReplicationTasksLimit = number | null;

/** The limit as the appliance holds it. */
export async function readReplicationTasksLimit(client: E2eApiClient): Promise<ReplicationTasksLimit> {
  const config = await firstValueFrom(client.api.call('replication.config.config').pipe(timeout(readTimeoutMs)));
  return config.max_parallel_replication_tasks;
}

/**
 * Writes the limit. Used for the state a test starts from and for teardown.
 * Never for the change under test, which goes through the form.
 *
 * Middleware refuses anything below 1. Use `null` for no limit.
 */
export async function setReplicationTasksLimit(client: E2eApiClient, limit: ReplicationTasksLimit): Promise<void> {
  await firstValueFrom(
    client.api.call('replication.config.update', [{ max_parallel_replication_tasks: limit }])
      .pipe(timeout(readTimeoutMs)),
  );
}
