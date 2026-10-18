/**
 * Containers: the global settings and the containers themselves —
 * preconditions, cleanup and readback, over the API.
 *
 * The settings are one config record, `lxc.config`. A spec writes the settings
 * each test starts from, and teardown writes back what the appliance held
 * before the spec's first test.
 *
 * Setting a preferred pool creates nothing on it until a container is created
 * there, so it does not pin the pool. The spec clears it anyway before the
 * worker's pool is exported.
 */
import type { CallParams, CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type LxcConfig = CallResponse<E2eApiDirectory, 'lxc.config'>;
type LxcUpdate = NonNullable<CallParams<E2eApiDirectory, 'lxc.update'>[0]>;
type ContainerEntry = Extract<CallResponse<E2eApiDirectory, 'container.query'>, unknown[]>[number];
type ContainerRecord = ContainerEntry & { id: number };

/** Everything the Global Configuration form shows and saves. */
export type ContainerSettings = Pick<LxcConfig, 'preferred_pool' | 'bridge' | 'v4_network' | 'v6_network'>;

/**
 * Middleware's defaults for the auto-managed bridge (`DEFAULT_V4_NETWORK` and
 * `DEFAULT_V6_NETWORK` in `plugins/container/lxc_config.py`), with no preferred
 * pool. `bridge: null` is the automatic bridge.
 */
export const containerSettingsBaseline: ContainerSettings = {
  preferred_pool: null,
  bridge: null,
  v4_network: '172.200.0.0/24',
  v6_network: 'fd42:4c58:43ae::/64',
};

export async function readContainerConfig(client: E2eApiClient): Promise<ContainerSettings> {
  const config = await firstValueFrom(client.api.call('lxc.config').pipe(timeout(readTimeoutMs)));
  return {
    preferred_pool: config.preferred_pool,
    bridge: config.bridge,
    v4_network: config.v4_network,
    v6_network: config.v6_network,
  };
}

/**
 * Writes the settings. Used for the state a test starts from and for teardown.
 * Never for the change under test, which goes through the form.
 */
export async function setContainerConfig(client: E2eApiClient, settings: ContainerSettings): Promise<void> {
  // A `null` network is how the form clears one too; the generated `lxc.update`
  // input types both networks as optional strings without it.
  await firstValueFrom(
    client.api.call('lxc.update', [settings as LxcUpdate]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** How many containers the appliance has, so a test that opens the create form can show it made none. */
export async function countContainers(client: E2eApiClient): Promise<number> {
  const containers = await firstValueFrom(client.api.query('container.query', []).pipe(timeout(readTimeoutMs)));
  return containers.length;
}

/**
 * How long creating a container may take. `container.create` downloads and
 * unpacks the image's rootfs from `images.sys.truenas.net` the first time an
 * image is used on a pool, and clones a snapshot of it after that. A ceiling,
 * not a wait: a cached image is done in seconds.
 */
export const containerCreateTimeoutMs = 10 * 60_000;

/** A container by name, or undefined when absent. */
export async function findContainer(client: E2eApiClient, name: string): Promise<ContainerRecord | undefined> {
  const [container] = await firstValueFrom(
    client.api.query('container.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );
  return container as ContainerRecord | undefined;
}

/**
 * An image to create a container from: the first registry product whose name
 * contains `os`, at its NEWEST build.
 *
 * Not its first. `container.image.query_registry` lists versions in the order of
 * the registry index, which is oldest first, and the rootfs is downloaded from
 * images.linuxcontainers.org, which keeps only a few daily builds and deletes the
 * oldest. The index lags behind those deletions, so its first version is the one
 * whose download 404s next — on 2026-10-18 it was, failing every containers test.
 * Versions are `YYYYMMDD_HH:MM`, so the string order is the date order.
 *
 * Reading the registry reaches `images.sys.truenas.net`, hence the slow budget.
 */
export async function firstRegistryImage(
  client: E2eApiClient,
  os: string,
): Promise<{ name: string; version: string }> {
  const images = await firstValueFrom(
    client.api.call('container.image.query_registry').pipe(timeout(slowCallTimeoutMs)),
  );
  const image = images.find((candidate) => candidate.name.toLowerCase().includes(os.toLowerCase()));
  const newestFirst = [...(image?.versions ?? [])].sort((a, b) => b.version.localeCompare(a.version));
  const version = newestFirst[0]?.version;
  if (!image || !version) {
    throw new Error(`The image registry lists no ${os} image, so there is nothing to create a container from`);
  }
  return { name: image.name, version };
}

/**
 * Creates a stopped container on `pool`, for a test that is not about creating
 * one. Autostart is off, so nothing starts it. `initenv` is its environment
 * variables, none when left out.
 */
export async function seedContainer(
  client: E2eApiClient,
  {
    name,
    pool,
    image,
    initenv,
  }: {
    name: string;
    pool: string;
    image: { name: string; version: string };
    initenv?: Record<string, string>;
  },
): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('container.create', [{
      name,
      pool,
      image,
      autostart: false,
      ...(initenv ? { initenv } : {}),
    }]),
    {
      timeoutMs: containerCreateTimeoutMs,
      whatItCosts: `container ${name} was not created, so there is nothing to delete`,
      confirm: async () => (await findContainer(client, name)) !== undefined,
    },
  );
}

/**
 * Starts a stopped container, for a test about what is done to a running one.
 *
 * A plain call, as the list's own Start makes it. The caller polls
 * {@link findContainer} for `RUNNING` rather than trusting the answer.
 */
export async function startContainer(client: E2eApiClient, id: number): Promise<void> {
  await firstValueFrom(client.api.call('container.start', [id]).pipe(timeout(slowCallTimeoutMs)));
}

/**
 * Deletes a container by name if present, stopping it first (`force`).
 *
 * Its dataset is a clone of the image's snapshot, so this has to run before
 * anything removes the image.
 */
export async function ensureContainerAbsent(client: E2eApiClient, name: string): Promise<void> {
  const container = await findContainer(client, name);
  if (!container) {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('container.delete', [container.id, { force: true }]),
    {
      timeoutMs: slowCallTimeoutMs,
      whatItCosts: `container ${name} is still on the appliance, so the next run's create is refused`,
      confirm: async () => (await findContainer(client, name)) === undefined,
    },
  );
}

/** A container's FILESYSTEM device: a host path bind-mounted at a path inside the container. */
export interface FilesystemDevice {
  id: number;
  source: string;
  target: string;
}

/**
 * The fields of a `container.device.query` row read here. `attributes` is a union
 * over every device type, and only a FILESYSTEM one has a source and a target.
 */
interface ContainerDeviceRow {
  id: number;
  attributes: { dtype: string; source?: string; target?: string };
}

function toFilesystemDevice(row: ContainerDeviceRow): FilesystemDevice {
  return { id: row.id, source: row.attributes.source ?? '', target: row.attributes.target ?? '' };
}

/** The FILESYSTEM devices of a container, as middleware holds them. */
export async function findFilesystemDevices(
  client: E2eApiClient,
  containerId: number,
): Promise<FilesystemDevice[]> {
  const rows = await firstValueFrom(
    client.api.query('container.device.query', [['container', '=', containerId]]).pipe(timeout(readTimeoutMs)),
  ) as unknown as ContainerDeviceRow[];
  return rows.filter((row) => row.attributes.dtype === 'FILESYSTEM').map(toFilesystemDevice);
}

/**
 * Mounts `source` at `target` in a stopped container, for a test that is not
 * about adding one. Middleware refuses device changes on a running container.
 */
export async function seedFilesystemDevice(
  client: E2eApiClient,
  containerId: number,
  { source, target }: { source: string; target: string },
): Promise<FilesystemDevice> {
  const created = await firstValueFrom(
    client.api.call('container.device.create', [{
      container: containerId,
      attributes: { dtype: 'FILESYSTEM', source, target },
    }]).pipe(timeout(slowCallTimeoutMs)),
  ) as unknown as ContainerDeviceRow;
  return toFilesystemDevice(created);
}

/**
 * Where middleware keeps a pool's containers and the images they are cloned
 * from (`CONTAINER_DS_NAME` in `plugins/container/utils.py`). It is created by
 * the first container on the pool and outlives every container.
 */
export function containersDataset(pool: string): string {
  return `${pool}/.truenas_containers`;
}
