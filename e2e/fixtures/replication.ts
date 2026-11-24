/**
 * Replication settings (`replication.config`, one config record): preconditions, cleanup and readback.
 *
 * Each test writes the limit it starts from. Unlike other Advanced Settings fixtures, teardown does not write a
 * fixed baseline: the schema declares no default, so a guess could change it for whatever runs next. The spec
 * reads the limit before its first test and writes that back; no test depends on what was read.
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
