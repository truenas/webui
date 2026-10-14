/**
 * Alerts, read over the API.
 *
 * Nothing here raises an alert directly: middleware offers no public call that
 * does. A spec that needs one makes something fail that reports itself as an
 * alert — see `startRsyncTaskRun` in `fixtures/rsync-tasks.ts` — and finds the
 * alert it raised with these helpers.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

/** An alert as middleware reports it, dismissed or not. */
export type AlertRecord = CallResponse<E2eApiDirectory, 'alert.list'>[number];

/**
 * Every `RsyncFailed` alert middleware holds, dismissed or not.
 *
 * Middleware keys the class by the task's id and carries it in `args.id`, and
 * creating or deleting a task's alert is middleware's own business: a run clears
 * the task's old one before it starts, and `rsynctask.delete` removes it.
 */
export async function findRsyncFailedAlerts(client: E2eApiClient): Promise<AlertRecord[]> {
  const alerts = await firstValueFrom(client.api.call('alert.list').pipe(timeout(readTimeoutMs)));

  return alerts.filter((alert) => alert.klass === 'RsyncFailed');
}

/** The `RsyncFailed` alert one task's last run raised, or undefined. */
export async function findRsyncFailedAlert(client: E2eApiClient, taskId: number): Promise<AlertRecord | undefined> {
  const alerts = await findRsyncFailedAlerts(client);

  return alerts.find((alert) => {
    const args: unknown = alert.args;
    return typeof args === 'object' && args !== null && 'id' in args && args.id === taskId;
  });
}
