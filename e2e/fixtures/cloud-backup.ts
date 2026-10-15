/**
 * TrueCloud Backup tasks, read over the API.
 *
 * Nothing here makes one. `cloud_backup.create` initializes the task's restic
 * repository on Storj before it stores anything, so a task cannot exist without a
 * real Storj account — which is why the spec covers what an appliance with none
 * shows, and stops short of saving the form.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

/** How many TrueCloud Backup tasks the appliance holds, whoever made them. */
export async function countCloudBackupTasks(client: E2eApiClient): Promise<number> {
  const tasks = await firstValueFrom(
    client.api.query('cloud_backup.query', []).pipe(timeout(readTimeoutMs)),
  );

  return tasks.length;
}
