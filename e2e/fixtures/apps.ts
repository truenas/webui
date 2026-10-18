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
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

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

/**
 * The catalog train holding the apps a spec installs. Discover lists only the trains in
 * `catalog.config`'s `preferred_trains`, and an appliance may not prefer this one.
 */
export const communityTrain = 'community';

export async function readPreferredTrains(client: E2eApiClient): Promise<string[]> {
  const config = await firstValueFrom(client.api.call('catalog.config').pipe(timeout(readTimeoutMs)));
  return config.preferred_trains;
}

/**
 * Writes `preferred_trains`. Setup and teardown only. An Enterprise-licensed appliance refuses a
 * list without `enterprise`, so callers add to what they read rather than writing a fresh list.
 */
export async function setPreferredTrains(client: E2eApiClient, trains: string[]): Promise<void> {
  await firstValueFrom(
    client.api.call('catalog.update', [{ preferred_trains: trains }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Pulls the catalog from github.com/truenas/apps. A ceiling, not a wait: the CI appliance has
 * outbound access and a sync with nothing new is done in seconds.
 */
export const catalogSyncTimeoutMs = 5 * 60_000;

/** Syncs the catalog, so an app the spec seeds over the API is in it. */
export async function syncCatalog(client: E2eApiClient): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('catalog.sync'),
    {
      timeoutMs: catalogSyncTimeoutMs,
      whatItCosts: 'The apps catalog was not synced, so there is no catalog app to install.',
    },
  );
}

/**
 * The per-user attribute the UI sets once its third-party apps warning has been agreed to. While it
 * is unset, the first Install raises that warning in front of the install wizard.
 */
export const appsAgreementAttribute = 'appsAgreement';

/** Whether the signed-in user has agreed to the third-party apps warning. */
export async function readAppsAgreement(client: E2eApiClient): Promise<boolean> {
  const me = await firstValueFrom(client.api.call('auth.me').pipe(timeout(readTimeoutMs)));
  const attributes = me.attributes as Record<string, unknown>;
  return attributes[appsAgreementAttribute] === true;
}

/**
 * Sets the user's agreement to the third-party apps warning. Setup and teardown only.
 *
 * The UI reads it when a page signs in, so it has to be written before the test's sign-in.
 */
export async function setAppsAgreement(client: E2eApiClient, agreed: boolean): Promise<void> {
  await firstValueFrom(
    client.api.call('auth.set_attribute', [appsAgreementAttribute, agreed]).pipe(timeout(readTimeoutMs)),
  );
}

/**
 * Installing an app pulls its images first. A ceiling, not a wait: a cached image deploys in
 * seconds.
 */
export const appInstallTimeoutMs = 10 * 60_000;

/** An installed app by its name, or undefined when absent. */
export async function findApp(
  client: E2eApiClient,
  name: string,
): Promise<{ name: string; state: string } | undefined> {
  const [app] = await firstValueFrom(
    client.api.query('app.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );
  return app ? { name: app.name, state: app.state } : undefined;
}

/** The app's state as middleware reports it, or `ABSENT` when there is no such app. */
export async function readAppState(client: E2eApiClient, name: string): Promise<string> {
  return (await findApp(client, name))?.state ?? 'ABSENT';
}

/**
 * Installs `catalogApp` from `train` as `name` with the catalog's defaults, for a test that is not
 * about installing one. The job finishes once the app is deployed.
 */
export async function seedCatalogApp(
  client: E2eApiClient,
  { name, catalogApp, train }: { name: string; catalogApp: string; train: string },
): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('app.create', [{
      app_name: name,
      catalog_app: catalogApp,
      train,
      values: {},
    }]),
    {
      timeoutMs: appInstallTimeoutMs,
      whatItCosts: `app ${name} was not installed, so there is nothing to stop, start or delete`,
      confirm: async () => (await findApp(client, name)) !== undefined,
    },
  );
}

/**
 * Deletes an app by name if present, with its images and ix-volumes.
 *
 * Has to run before the Apps pool is unset: the app's datasets are under `<pool>/ix-apps`.
 */
export async function ensureAppAbsent(client: E2eApiClient, name: string): Promise<void> {
  if (!(await findApp(client, name))) {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('app.delete', [name, { remove_images: true, remove_ix_volumes: true }]),
    {
      timeoutMs: appInstallTimeoutMs,
      whatItCosts: `app ${name} is still installed, so the next run's install is refused`,
      confirm: async () => (await findApp(client, name)) === undefined,
    },
  );
}
