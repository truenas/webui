/**
 * What middleware says about updates, over the API.
 *
 * Read-only: nothing here changes the train, the profile or anything installed.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';

/** `update.status` asks the update server, which answers more slowly than a local read. */
const updateStatusTimeoutMs = 60_000;

/** The part of `update.status` the System Information card and the Update page show. */
export interface UpdateState {
  /** `NORMAL` when the check reached the update server and got an answer. */
  code: string;
  /** The version offered, or `undefined` when the appliance is current. */
  newVersion: string | undefined;
  /** Why the check failed, when it did. */
  error: string | undefined;
}

export async function readUpdateState(client: E2eApiClient): Promise<UpdateState> {
  const status = await firstValueFrom(client.api.call('update.status').pipe(timeout(updateStatusTimeoutMs)));

  return {
    code: String(status.code),
    newVersion: status.status?.new_version?.version ?? undefined,
    error: status.error?.reason ?? undefined,
  };
}
