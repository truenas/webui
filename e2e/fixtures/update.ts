/**
 * What middleware says about updates, over the API, and the update profile a test checks against.
 *
 * Nothing here changes the train or anything installed. The profile is global, so a spec that
 * writes it writes back the one it read.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** `update.status` asks the update server, which answers more slowly than a local read. */
const updateStatusTimeoutMs = 60_000;

export type UpdateProfile = CallResponse<E2eApiDirectory, 'update.config'>['profile'];

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

/** The update profile the appliance holds. */
export async function readUpdateProfile(client: E2eApiClient): Promise<UpdateProfile> {
  const config = await firstValueFrom(client.api.call('update.config').pipe(timeout(readTimeoutMs)));
  return config.profile;
}

/** Whether `update.update` would accept this profile. Middleware refuses one that is not available. */
export async function isUpdateProfileAvailable(client: E2eApiClient, profile: string): Promise<boolean> {
  const choices = await firstValueFrom(client.api.call('update.profile_choices').pipe(timeout(readTimeoutMs)));
  return Object.entries(choices).some(([id, choice]) => id === profile && choice.available);
}

/** Writes the update profile. Used for the state a test starts from and for teardown. */
export async function setUpdateProfile(client: E2eApiClient, profile: UpdateProfile): Promise<void> {
  await firstValueFrom(client.api.call('update.update', [{ profile }]).pipe(timeout(slowCallTimeoutMs)));
}
