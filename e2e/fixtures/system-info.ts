/**
 * What the appliance says about itself, over the API.
 *
 * Read-only: the Dashboard specs check the System Information and CPU Model widgets against this,
 * and nothing here changes the appliance.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

/** The part of `system.info` the System Information widget shows. */
export type SystemIdentity = Pick<CallResponse<E2eApiDirectory, 'system.info'>, 'hostname' | 'version'>;

export async function readSystemIdentity(client: E2eApiClient): Promise<SystemIdentity> {
  const info = await firstValueFrom(client.api.call('system.info').pipe(timeout(readTimeoutMs)));

  return { hostname: info.hostname, version: info.version };
}

/** The CPU model, which the Dashboard's CPU Model widget shows as its value. */
export async function readCpuModel(client: E2eApiClient): Promise<string> {
  const info = await firstValueFrom(client.api.call('system.info').pipe(timeout(readTimeoutMs)));
  if (!info.model) {
    throw new Error('system.info reports no CPU model for the CPU Model widget to show.');
  }

  return info.model;
}
