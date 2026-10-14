/**
 * Alerts, read over the API.
 *
 * Nothing here raises an alert directly: middleware offers no public call that
 * does. A spec that needs one makes something happen that reports itself as an
 * alert — see `nfsNetworkListAlertThreshold` below — and finds the alert it
 * raised with these helpers.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

/** An alert as middleware reports it, dismissed or not. */
export type AlertRecord = CallResponse<E2eApiDirectory, 'alert.list'>[number];

/**
 * How many networks an NFS share may list before saving it raises
 * `NFSNetworkListExcessive`: middleware's `NFS_NETWORKS_WARNING_THRESHOLD`.
 *
 * That class is the one to dismiss and reopen. It is a one-shot alert that
 * middleware deletes automatically, so `alert.dismiss` marks it dismissed and
 * `alert.restore` brings it back. A one-shot class that is *not* deleted
 * automatically, such as `RsyncFailed`, is removed outright by `alert.dismiss`
 * and there is nothing left to reopen.
 */
export const nfsNetworkListAlertThreshold = 100;

/** Every alert middleware holds, dismissed or not. */
export async function listAlerts(client: E2eApiClient): Promise<AlertRecord[]> {
  return firstValueFrom(client.api.call('alert.list').pipe(timeout(readTimeoutMs)));
}

/**
 * The `NFSNetworkListExcessive` alert raised for the share on one path, or undefined.
 *
 * Middleware carries the path in `args.sharePath`. It raises the alert while it
 * validates a share's create or update and removes it when the share is deleted.
 * The class has no key of its own, so saving *any* NFS share with a short
 * network list clears every alert of the class, not just that share's.
 */
export async function findNfsNetworkListAlert(
  client: E2eApiClient,
  sharePath: string,
): Promise<AlertRecord | undefined> {
  const alerts = await listAlerts(client);

  return alerts.find((alert) => {
    const args: unknown = alert.args;
    return alert.klass === 'NFSNetworkListExcessive'
      && typeof args === 'object' && args !== null && 'sharePath' in args && args.sharePath === sharePath;
  });
}
