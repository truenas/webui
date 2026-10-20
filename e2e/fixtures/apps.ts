/**
 * The Apps service's pool, over the API: `docker.config` and `docker.status` to read it,
 * `docker.update` to set or clear it.
 *
 * Choosing a pool creates `<pool>/ix-apps` and starts Docker on it, and Docker then holds that
 * dataset, so a pool carrying Apps cannot be exported. Every spec that sets one has to unset it
 * before its pool goes.
 */
import { expect } from '@playwright/test';
import { JobState, isJobFinished, type QueryEntity } from '@truenas/api-client';
import { firstValueFrom, of, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/**
 * `docker.update` creates the `ix-apps` datasets and starts Docker before it finishes, and on a pool
 * change it also starts a catalog sync in the background, which it does not wait for. A ceiling,
 * not a wait.
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

/** The part of `docker.config` the Apps Settings form edits. */
export interface DockerSettings {
  address_pools: { base: string; size: number }[];
  registry_mirrors: { url: string; insecure: boolean }[];
  enable_image_updates: boolean;
}

/** Two address pools and no mirrors: a known baseline every settings test starts from. */
export const defaultDockerSettings: DockerSettings = {
  address_pools: [
    { base: '172.16.0.0/12', size: 24 },
    { base: 'fdd0::/48', size: 64 },
  ],
  registry_mirrors: [],
  enable_image_updates: true,
};

export async function readDockerSettings(client: E2eApiClient): Promise<DockerSettings> {
  const config = await firstValueFrom(client.api.call('docker.config').pipe(timeout(readTimeoutMs)));

  return {
    address_pools: config.address_pools.map(({ base, size }) => ({ base, size })),
    registry_mirrors: config.registry_mirrors.map(({ url, insecure }) => ({ url, insecure })),
    enable_image_updates: config.enable_image_updates,
  };
}

/**
 * Writes the address pools, mirrors and image update checks with `docker.update`.
 *
 * With no Apps pool this only writes the datastore. With one, a change to the pools or mirrors
 * restarts Docker and redeploys every app, so the settings spec runs only while Apps has no pool.
 */
export async function setDockerSettings(client: E2eApiClient, settings: DockerSettings): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('docker.update', [settings]),
    {
      timeoutMs: dockerUpdateTimeoutMs,
      whatItCosts: 'The Apps settings were not written, so the next run starts from whatever this one left.',
    },
  );
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
 * The trains the Preferred Trains field offers. Middleware answers from the cache a catalog sync
 * fills and never reads the catalog itself, so this is empty until a sync has filled it.
 */
export async function readCatalogTrains(client: E2eApiClient): Promise<string[]> {
  return firstValueFrom(client.api.call('catalog.trains').pipe(timeout(readTimeoutMs)));
}

/** The train an Enterprise-entitled appliance must keep preferred. */
export const enterpriseTrain = 'enterprise';

/**
 * Whether `catalog.update` refuses a list without `enterprise`. Middleware decides that from this
 * one entitlement, not from the license type, so it is read the same way.
 */
export async function readEnterpriseTrainRequired(client: E2eApiClient): Promise<boolean> {
  const entry = await firstValueFrom(
    client.api.call('truenas.entitlements.check', ['CATALOG_ENTERPRISE_TRAIN']).pipe(timeout(readTimeoutMs)),
  );
  return entry.entitled;
}

/**
 * Pulls the catalog from github.com/truenas/apps. A ceiling, not a wait: the CI appliance has
 * outbound access and a sync with nothing new is done in seconds.
 */
export const catalogSyncTimeoutMs = 5 * 60_000;

/**
 * The id of a `catalog.sync` job that has not finished, or undefined when none is in flight.
 *
 * `catalog.sync` holds one lock and queues nothing behind it (`lock_queue_size=0`), so a call made
 * while a sync runs gets no job of its own: middleware refuses it or hands back the job already
 * queued, and either way no `ADDED` event arrives for `callAndGetJobId` to take an id from. A pool
 * change starts exactly such a sync in the background.
 */
async function findCatalogSyncInFlight(client: E2eApiClient): Promise<number | undefined> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'catalog.sync']]).pipe(timeout(readTimeoutMs)),
  );

  return jobs.find((job) => !isJobFinished({ state: job.state as JobState }))?.id;
}

/**
 * Syncs the catalog, so an app the spec seeds over the API is in it. A sync already in flight is
 * waited for rather than started again, since a second one cannot start while it runs.
 */
export async function syncCatalog(client: E2eApiClient): Promise<void> {
  const inFlight = await findCatalogSyncInFlight(client);

  await runJob(
    client,
    () => (inFlight === undefined ? client.api.callAndGetJobId('catalog.sync') : of(inFlight)),
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
  return (me as { attributes?: Record<string, unknown> }).attributes?.[appsAgreementAttribute] === true;
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
 * Installs `catalogApp` from `train` as `name`, for a test that is not about installing one. Without
 * `version` it installs the catalog's latest revision, and without `values` the catalog's defaults.
 * The job finishes once the app is deployed.
 */
export async function seedCatalogApp(
  client: E2eApiClient,
  {
    name,
    catalogApp,
    train,
    version,
    values = {},
  }: {
    name: string;
    catalogApp: string;
    train: string;
    version?: string;
    values?: Record<string, unknown>;
  },
): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('app.create', [{
      app_name: name,
      catalog_app: catalogApp,
      train,
      values,
      ...(version === undefined ? {} : { version }),
    }]),
    {
      timeoutMs: appInstallTimeoutMs,
      whatItCosts: `app ${name} was not installed, so the test has no installed app to act on`,
      confirm: async () => (await findApp(client, name)) !== undefined,
    },
  );
}

/** One row of `app.query`, typed from the client's own directory. */
type AppEntry = QueryEntity<E2eApiDirectory['call'], 'app.query'>;

/**
 * The id of the container running `service` in the app, from `active_workloads.container_details`,
 * or undefined while the app or that container is absent. The Workloads card's links carry it.
 */
export async function findContainerId(
  client: E2eApiClient,
  name: string,
  service: string,
): Promise<string | undefined> {
  const [app] = await firstValueFrom(
    client.api.query('app.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );
  return app?.active_workloads.container_details.find((container) => container.service_name === service)?.id;
}

/** Which catalog revision an app runs, and what the catalog offers it. */
export interface AppVersions {
  /** The installed catalog revision, e.g. `1.0.5`. The Application Info card shows it as Revision. */
  version: AppEntry['version'];
  /** The catalog's newest revision of the app. */
  latestVersion: AppEntry['latest_version'];
  /** What enables Update on the card and fills the Updates column. */
  upgradeAvailable: AppEntry['upgrade_available'];
}

/** The app's revisions as middleware reports them, or undefined when there is no such app. */
export async function readAppVersions(client: E2eApiClient, name: string): Promise<AppVersions | undefined> {
  const [app] = await firstValueFrom(
    client.api.query('app.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );
  if (!app) {
    return undefined;
  }

  return {
    version: app.version,
    latestVersion: app.latest_version,
    upgradeAvailable: app.upgrade_available,
  };
}

/** The revisions `app.rollback` can take the app back to, newest first. Empty when there are none. */
export async function readRollbackVersions(client: E2eApiClient, name: string): Promise<string[]> {
  return firstValueFrom(
    client.api.call('app.rollback_versions', [name]).pipe(timeout(readTimeoutMs)),
  );
}

/**
 * Upgrades an installed app to the catalog's latest revision, for a test that is not about
 * upgrading. Middleware pulls the new images first, so this shares the install's ceiling.
 */
export async function seedAppUpgrade(client: E2eApiClient, name: string): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('app.upgrade', [name, { app_version: 'latest' }]),
    {
      timeoutMs: appInstallTimeoutMs,
      whatItCosts: `app ${name} was not upgraded, so there is no earlier revision to roll back to`,
      confirm: async () => (await readAppVersions(client, name))?.upgradeAvailable === false,
    },
  );
}

/**
 * Deletes an app by name if present, with its ix-volumes, and with its images unless `keepImages`.
 * Keeping them spares the next install a pull, for a spec that installs the same app again and
 * deletes the images itself at the end.
 *
 * Has to run before the Apps pool is unset: the app's datasets are under `<pool>/ix-apps`.
 */
export async function ensureAppAbsent(
  client: E2eApiClient,
  name: string,
  { keepImages = false }: { keepImages?: boolean } = {},
): Promise<void> {
  if (!(await findApp(client, name))) {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('app.delete', [name, { remove_images: !keepImages, remove_ix_volumes: true }]),
    {
      timeoutMs: appInstallTimeoutMs,
      whatItCosts: `app ${name} is still installed, so the next run's install is refused`,
      confirm: async () => (await findApp(client, name)) === undefined,
    },
  );
}

/**
 * Installs a custom app from a compose file, as Install via YAML does, for a test that is not about
 * installing one. The job finishes once the app is deployed.
 */
export async function seedCustomApp(client: E2eApiClient, name: string, compose: string): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('app.create', [{
      app_name: name,
      custom_app: true,
      custom_compose_config_string: compose,
    }]),
    {
      timeoutMs: appInstallTimeoutMs,
      whatItCosts: `custom app ${name} was not installed, so there is nothing to edit or delete`,
      confirm: async () => (await findApp(client, name)) !== undefined,
    },
  );
}

/** Whether middleware records the app as a custom one, or undefined when there is no such app. */
export async function readIsCustomApp(client: E2eApiClient, name: string): Promise<boolean | undefined> {
  const [app] = await firstValueFrom(
    client.api.query('app.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );
  return app?.custom_app;
}

/**
 * The part of a catalog app's saved values the readers below read. The app's own section, which
 * holds `additional_envs`, is named after the app (`it_tools`), so it is looked up by name.
 */
interface AppValues {
  TZ?: string;
  network?: { web_port?: { port_number?: number } };
  [section: string]: unknown;
}

/**
 * A catalog app's saved values: what its install form holds, not the compose file rendered from
 * them. Undefined when there is no such app. `app.query` returns the values only when asked for them.
 */
async function readAppValues(client: E2eApiClient, name: string): Promise<AppValues | undefined> {
  const apps = await firstValueFrom(
    client.api.query(
      'app.query',
      [['name', '=', name]],
      { extra: { retrieve_config: true } },
    ).pipe(timeout(readTimeoutMs)),
  ) as unknown as { config?: AppValues }[];

  return apps[0]?.config;
}

/**
 * The WebUI port a catalog app's values hold, `network.web_port.port_number`, or undefined when the
 * app or the value is absent.
 */
export async function readAppPortNumber(client: E2eApiClient, name: string): Promise<number | undefined> {
  return (await readAppValues(client, name))?.network?.web_port?.port_number;
}

/** The timezone a catalog app's values hold, `TZ`, or undefined when the app or the value is absent. */
export async function readAppTimezone(client: E2eApiClient, name: string): Promise<string | undefined> {
  return (await readAppValues(client, name))?.TZ;
}

/**
 * A catalog app's Additional Environment Variables, `<section>.additional_envs` in its values, as a
 * map. Empty when the app or the list is absent. For a custom app, read its compose file with
 * `readServiceEnvironment` instead.
 */
export async function readAppAdditionalEnvs(
  client: E2eApiClient,
  name: string,
  section: string,
): Promise<Record<string, string>> {
  const values = await readAppValues(client, name);
  const appSection = values?.[section] as { additional_envs?: { name: string; value: string }[] } | undefined;

  return Object.fromEntries((appSection?.additional_envs ?? []).map((env) => [env.name, env.value]));
}

/** The part of a compose file `readServiceEnvironment` reads. */
interface ComposeConfig {
  services?: Record<string, { environment?: string[] | Record<string, unknown> }>;
}

/**
 * One service's environment in a custom app's compose config, as `app.config` returns it. Compose
 * takes either a map or a list of `KEY=value`, so both are read into a map. For a catalog app,
 * `app.config` returns the saved values instead, which have no `services`: use `readAppAdditionalEnvs`.
 */
export async function readServiceEnvironment(
  client: E2eApiClient,
  name: string,
  service: string,
): Promise<Record<string, string>> {
  const config = await firstValueFrom(
    client.api.call('app.config', [name]).pipe(timeout(readTimeoutMs)),
  ) as unknown as ComposeConfig;
  const environment = config.services?.[service]?.environment ?? {};

  const entries: [string, string][] = Array.isArray(environment)
    ? environment.map((entry) => {
        const separator = entry.indexOf('=');
        return separator === -1 ? [entry, ''] : [entry.slice(0, separator), entry.slice(separator + 1)];
      })
    : Object.entries(environment).map(([key, value]) => [key, String(value)]);

  return Object.fromEntries(entries);
}
