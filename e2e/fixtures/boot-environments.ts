/**
 * Boot environment preconditions, cleanup and readback, over the API.
 *
 * A boot environment is identified by its name, which is its id. The ones the
 * specs make are clones of the running one: a clone is a ZFS clone on the boot
 * pool, so it is cheap, and it is never the running boot environment nor the one
 * set to boot next — which are the two the list refuses to delete.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A boot environment as middleware reports it, with its id narrowed — see `GroupRecord`. */
type BootEnvironmentEntry = Extract<CallResponse<E2eApiDirectory, 'boot.environment.query'>, unknown[]>[number];

export type BootEnvironmentRecord = BootEnvironmentEntry & { id: string };

/**
 * The appliance's own record of a boot environment, or undefined.
 *
 * `query`, not `queryOne` — absence is an ordinary answer here.
 */
export async function findBootEnvironment(
  client: E2eApiClient,
  name: string,
): Promise<BootEnvironmentRecord | undefined> {
  const [bootEnvironment] = await firstValueFrom(
    client.api.query('boot.environment.query', [['id', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return bootEnvironment as BootEnvironmentRecord | undefined;
}

/** The boot environment the appliance is running from. There is always exactly one. */
export async function findRunningBootEnvironment(client: E2eApiClient): Promise<BootEnvironmentRecord> {
  const [running] = await firstValueFrom(
    client.api.query('boot.environment.query', [['active', '=', true]]).pipe(timeout(readTimeoutMs)),
  );
  if (!running) {
    throw new Error('boot.environment.query reports no active boot environment');
  }

  return running as BootEnvironmentRecord;
}

/** Every boot environment's name, sorted, for a before-and-after comparison. */
export async function listBootEnvironmentNames(client: E2eApiClient): Promise<string[]> {
  const bootEnvironments = await firstValueFrom(
    client.api.query('boot.environment.query', []).pipe(timeout(readTimeoutMs)),
  );

  return (bootEnvironments as BootEnvironmentRecord[])
    .map((bootEnvironment) => bootEnvironment.id)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * One entry of the boot pool's topology: a partition such as `sda3`, or a vdev
 * such as `mirror-0` with the partitions under it as `children`. `disk` names the
 * whole disk a partition is on, and is null on a vdev.
 */
export interface BootPoolDevice {
  name: string;
  type: string;
  disk: string | null;
  children: BootPoolDevice[];
}

/** The boot pool's last or current scan, as `boot.get_state` reports it. */
export interface BootPoolScan {
  function: string | null;
  state: string | null;
  errors: number | null;
  start_time: { $date: number } | null;
}

/** What `boot.get_state` holds that a spec reads. The API client types topology entries only as `unknown`. */
interface BootPoolState {
  topology: { data: BootPoolDevice[] } | null;
  scan: BootPoolScan | null;
}

async function readBootPoolState(client: E2eApiClient): Promise<BootPoolState> {
  return await firstValueFrom(
    client.api.call('boot.get_state').pipe(timeout(readTimeoutMs)),
  ) as unknown as BootPoolState;
}

/** The boot pool's data vdevs: one partition on a single-disk boot pool, one `MIRROR` on a mirrored one. */
export async function findBootPoolTopology(client: E2eApiClient): Promise<BootPoolDevice[]> {
  return (await readBootPoolState(client)).topology?.data ?? [];
}

/** The boot pool's last or current scan, or null when it has none. */
export async function findBootPoolScan(client: E2eApiClient): Promise<BootPoolScan | null> {
  return (await readBootPoolState(client)).scan;
}

/** The whole disks the boot pool is on, sorted, e.g. `['sda']`. */
export async function listBootDisks(client: E2eApiClient): Promise<string[]> {
  const disks = await firstValueFrom(client.api.call('boot.get_disks').pipe(timeout(readTimeoutMs)));

  return [...disks].sort((a, b) => a.localeCompare(b));
}

/** The boot pool's scrub interval in days, `boot_scrub` in `system.advanced.config`. */
export async function readBootScrubInterval(client: E2eApiClient): Promise<number> {
  const config = await firstValueFrom(client.api.call('system.advanced.config').pipe(timeout(readTimeoutMs)));

  return config.boot_scrub;
}

export async function setBootScrubInterval(client: E2eApiClient, days: number): Promise<void> {
  await firstValueFrom(client.api.call('boot.set_scrub_interval', [days]).pipe(timeout(slowCallTimeoutMs)));
}

/** The id of the newest `boot.scrub` job middleware remembers, or 0 when there is none. */
export async function findLatestBootScrubJobId(client: E2eApiClient): Promise<number> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'boot.scrub']]).pipe(timeout(readTimeoutMs)),
  );

  // `?? 0`: the generated query entity declares `id` optional, as `UserRecord` explains.
  return Math.max(0, ...jobs.map((job) => job.id ?? 0));
}

/** The state of the oldest `boot.scrub` job newer than `afterId`, or undefined when there is none yet. */
export async function findBootScrubJobStateAfter(client: E2eApiClient, afterId: number): Promise<string | undefined> {
  const jobs = await firstValueFrom(
    client.api
      .query('core.get_jobs', [['method', '=', 'boot.scrub'], ['id', '>', afterId]])
      .pipe(timeout(readTimeoutMs)),
  );
  const [first] = [...jobs].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  return first?.state;
}

/**
 * Makes the running boot environment the one set to boot next, if another one is.
 *
 * Runs before {@link ensureBootEnvironmentAbsent} on a clone a test activated: a
 * boot environment set to boot next cannot be destroyed, and leaving one set
 * changes what the appliance boots into on its next restart.
 */
export async function ensureRunningBootEnvironmentActivated(client: E2eApiClient): Promise<void> {
  const bootEnvironments = await firstValueFrom(
    client.api.query('boot.environment.query', []).pipe(timeout(readTimeoutMs)),
  ) as BootEnvironmentRecord[];

  if (!bootEnvironments.some((bootEnvironment) => bootEnvironment.activated && !bootEnvironment.active)) {
    return;
  }

  const running = await findRunningBootEnvironment(client);
  await firstValueFrom(
    client.api.call('boot.environment.activate', [{ id: running.id }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** Attaching installs a boot loader on the new disk as well as resilvering it. */
const bootDiskJobTimeoutMs = 5 * 60_000;

/**
 * Takes every disk off the boot pool that was not on it at the start, and wipes it.
 *
 * `originalDisks` is what {@link listBootDisks} said before the test touched
 * anything. Only a disk outside that list is ever detached or wiped, so the disk
 * the appliance boots from cannot be either.
 *
 * Detached by the partition's name in the topology, which is what
 * `zfs.pool.detach` matches on. Wiped afterwards because the detach leaves the
 * boot partitions on the disk.
 */
export async function ensureBootPoolDisksOnly(client: E2eApiClient, originalDisks: string[]): Promise<void> {
  const extras = (await listBootDisks(client)).filter((disk) => !originalDisks.includes(disk));
  if (!extras.length) {
    return;
  }

  const partitions = (await findBootPoolTopology(client)).flatMap((device) => [device, ...device.children]);

  for (const disk of extras) {
    // By `disk` where middleware reports it, else by the partition name starting with the disk's.
    const partition = partitions.find((device) => device.disk === disk)
      ?? partitions.find((device) => device.type === 'DISK' && device.name.startsWith(disk));
    if (!partition) {
      throw new Error(
        `boot.get_disks lists "${disk}", but no device in boot.get_state is on it, so it cannot be detached.`,
      );
    }

    await firstValueFrom(client.api.call('boot.detach', [partition.name]).pipe(timeout(slowCallTimeoutMs)));
    await runJob(
      client,
      () => client.api.callAndGetJobId('disk.wipe', [disk, 'QUICK']),
      {
        timeoutMs: bootDiskJobTimeoutMs,
        whatItCosts: `Disk "${disk}" still carries boot partitions, so later runs may not offer it as unused.`,
      },
    );
  }
}

/**
 * The boot pool's first data device, by the name Boot Pool Status shows for it:
 * a partition such as `sda3`, or a vdev such as `mirror-0` on a mirrored boot pool.
 */
export async function findBootDevice(client: E2eApiClient): Promise<string> {
  const [device] = await findBootPoolTopology(client);
  if (!device) {
    throw new Error('boot.get_state reports no device in the boot pool');
  }

  return device.name;
}

/**
 * Removes a boot environment, if there is one by that name.
 *
 * Clears its keep flag first, so a run that died after setting it does not leave
 * a boot environment middleware may refuse to destroy.
 */
export async function ensureBootEnvironmentAbsent(client: E2eApiClient, name: string): Promise<void> {
  const bootEnvironment = await findBootEnvironment(client, name);
  if (!bootEnvironment) {
    return;
  }

  if (bootEnvironment.keep) {
    await firstValueFrom(
      client.api.call('boot.environment.keep', [{ id: name, value: false }]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
  await firstValueFrom(
    client.api.call('boot.environment.destroy', [{ id: name }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Clones the running boot environment under a name, if there is none by it already.
 *
 * For the boot environment a keep or a delete acts on, and for a bystander. Never
 * for the one under test in a clone — that one goes through the form.
 */
export async function ensureBootEnvironmentPresent(client: E2eApiClient, name: string): Promise<void> {
  if (await findBootEnvironment(client, name)) {
    return;
  }

  const running = await findRunningBootEnvironment(client);
  await firstValueFrom(
    client.api.call('boot.environment.clone', [{ id: running.id, target: name }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
