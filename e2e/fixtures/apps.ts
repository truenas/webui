/**
 * The Apps service's pool, over the API: `docker.config` and `docker.status` to read it,
 * `docker.update` to set or clear it.
 *
 * Choosing a pool creates `<pool>/ix-apps` and starts Docker on it, and Docker then holds that
 * dataset, so a pool carrying Apps cannot be exported. Every spec that sets one has to unset it
 * before its pool goes.
 */
import { expect } from '@playwright/test';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs } from '../support/timeouts';

/**
 * `docker.update` creates the `ix-apps` datasets and starts Docker before it finishes, and on a pool
 * change it also starts a catalog sync, which fails in the background on an appliance with no
 * internet. A ceiling, not a wait.
 */
export const dockerUpdateTimeoutMs = 4 * 60_000;

/** What the Apps page reports on: the pool Apps uses and the state of the service. */
export interface DockerState {
  /** Null while Apps has no pool. */
  pool: string | null;
  /** `<pool>/ix-apps` while Apps has a pool. */
  dataset: string | null;
  /** `docker.status.status`: `UNCONFIGURED`, `RUNNING`, `INITIALIZING`, … */
  status: string;
}

export async function readDocker(client: E2eApiClient): Promise<DockerState> {
  const [config, status] = await Promise.all([
    firstValueFrom(client.api.call('docker.config').pipe(timeout(readTimeoutMs))),
    firstValueFrom(client.api.call('docker.status').pipe(timeout(readTimeoutMs))),
  ]);

  return {
    pool: config.pool ?? null,
    dataset: config.dataset ?? null,
    status: status.status,
  };
}

/**
 * The id of `<pool>/ix-apps` if the dataset exists, otherwise undefined.
 *
 * `pool.dataset.query` leaves internal datasets, `ix-apps` among them, out of its answer unless
 * `exclude_internal_datasets` is off, so a plain lookup by id (`findDataset`) never finds it.
 */
export async function findAppsDataset(client: E2eApiClient, pool: string): Promise<string | undefined> {
  const [dataset] = await firstValueFrom(
    client.api.query(
      'pool.dataset.query',
      [['id', '=', `${pool}/ix-apps`]],
      { extra: { exclude_internal_datasets: false } },
    ).pipe(timeout(readTimeoutMs)),
  );

  return dataset?.id;
}

/** Points Apps at `pool` and returns once Docker runs there. The seed for a journey that unsets it. */
export async function setAppsPool(client: E2eApiClient, pool: string): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('docker.update', [{ pool }]),
    {
      timeoutMs: dockerUpdateTimeoutMs,
      whatItCosts: `Apps were not moved to pool "${pool}", so there is no pool for the journey to unset.`,
      confirm: async () => {
        const docker = await readDocker(client);
        return docker.pool === pool && docker.status === 'RUNNING';
      },
    },
  );
}

/**
 * Takes Apps off whatever pool it is on and returns once the service reports `UNCONFIGURED`.
 *
 * Nothing to do when Apps has no pool. When it has one, this is what lets that pool be exported:
 * Docker holds `<pool>/ix-apps` for as long as it runs there.
 */
export async function ensureAppsPoolUnset(client: E2eApiClient): Promise<void> {
  const whatItCosts = 'Apps were not taken off their pool, so Docker still holds the pool\'s ix-apps dataset '
    + 'and the pool cannot be exported.';

  if ((await readDocker(client)).pool !== null) {
    // Middleware takes `pool: null` to unset the pool. The generated input declares `pool?: string`,
    // which leaves null out, as `setDockerPool` in `src/app/pages/apps/store/docker.store.ts` notes.
    const unset = { pool: null } as unknown as { pool: string };

    await runJob(
      client,
      () => client.api.callAndGetJobId('docker.update', [unset]),
      {
        timeoutMs: dockerUpdateTimeoutMs,
        whatItCosts,
        confirm: async () => (await readDocker(client)).pool === null,
      },
    );
  }

  // `docker.update` can finish before the service has stopped, and the status is what the Apps page
  // and the next journey start from.
  await expect.poll(
    async () => (await readDocker(client)).status,
    {
      message: `docker.status should read UNCONFIGURED with no Apps pool. ${whatItCosts}`,
      timeout: dockerUpdateTimeoutMs,
    },
  ).toBe('UNCONFIGURED');
}
