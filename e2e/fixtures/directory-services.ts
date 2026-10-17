/**
 * Directory Services' own state, read and reset over the API.
 *
 * The CI appliance has no domain controller, LDAP or IPA server to join, so
 * every journey here stops short of saving a configuration. "Not configured" is
 * the baseline each spec starts from and leaves behind, and
 * {@link ensureDirectoryServicesCleared} is how a run that saved something gets
 * back to it — the same call the form's own Clear Config makes.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type DirectoryServicesConfig = CallResponse<E2eApiDirectory, 'directoryservices.config'>;
type DirectoryServicesStatus = CallResponse<E2eApiDirectory, 'directoryservices.status'>;

/** What the page and the form are built from: the stored configuration and the live status. */
export interface DirectoryServicesState {
  config: DirectoryServicesConfig;
  status: DirectoryServicesStatus;
}

/** `directoryservices.config` and `directoryservices.status`, read together. */
export async function readDirectoryServices(client: E2eApiClient): Promise<DirectoryServicesState> {
  const [config, status] = await Promise.all([
    firstValueFrom(client.api.call('directoryservices.config').pipe(timeout(readTimeoutMs))),
    firstValueFrom(client.api.call('directoryservices.status').pipe(timeout(readTimeoutMs))),
  ]);

  return { config, status };
}

/**
 * Puts the appliance back to "not configured", if a run left a service type
 * behind. A no-op on the baseline, so it is safe in `beforeEach` as well.
 */
export async function ensureDirectoryServicesCleared(client: E2eApiClient): Promise<void> {
  const { config } = await readDirectoryServices(client);
  if (config.service_type === null) {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('directoryservices.update', [{ enable: false, service_type: null }]),
    {
      timeoutMs: slowCallTimeoutMs,
      whatItCosts: `directory services are still configured as ${config.service_type}, `
        + 'so the next run does not start from a new configuration',
    },
  );
}
