/**
 * S3 preconditions and cleanup, over the API.
 *
 * Buckets and access keys are created through the UI — that is what the S3
 * journeys test. Everything they merely depend on comes from here: a pool to
 * put the bucket's dataset under, the dataset itself, the account that owns
 * things, and a stopped S3 service so the post-save "Start S3 Service" prompt
 * is deterministic.
 *
 * The S3 methods arrived in `@truenas/api-client` 5.0; the entry shapes below
 * are named off the directory the same way `fixtures/storage.ts` names its ACL
 * entry, so they follow the generated types rather than restating them.
 */
import type { QueryEntity } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { getSelectableDisks } from './storage';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

export type S3BucketEntry = QueryEntity<E2eApiDirectory['call'], 'sharing.s3.query'>;
export type S3AccessKeyEntry = QueryEntity<E2eApiDirectory['call'], 's3.accesskey.query'>;

/** Middleware's name for the service; the UI calls it "S3". */
export const s3ServiceName = 'truenas_s3';

/**
 * The pool the suite builds when the appliance has none. One disk, striped:
 * the bucket's dataset only has to exist, and a fresh CI appliance has no pool
 * at all. Never touched when a pool already exists — see `providePool`.
 */
export const s3OwnedPoolName = 'e2e_s3_tank';

const poolCreateTimeoutMs = 3 * 60_000;
const serviceControlTimeoutMs = 60_000;

/**
 * The name of an online pool, or undefined when the appliance has none.
 *
 * A read only — the question cleanup asks, since a dataset can only be left
 * behind under a pool that exists. `providePool` is the one that builds.
 */
export async function findOnlinePool(client: E2eApiClient): Promise<string | undefined> {
  const pools = await firstValueFrom(
    client.api.query('pool.query', [['status', '=', 'ONLINE']]).pipe(timeout(readTimeoutMs)),
  );

  // Prefer somebody else's pool over the suite's own, so a leaked `e2e_s3_tank`
  // does not shadow the pool a developer meant the tests to use.
  return (pools.find((pool) => pool.name !== s3OwnedPoolName) ?? pools[0])?.name;
}

export interface ProvidedPool {
  name: string;
  /**
   * True when this call built the pool. The caller that exports in teardown
   * checks this rather than the name: an `e2e_s3_tank` that was already there
   * when the run started is not the suite's to destroy.
   */
  built: boolean;
}

/**
 * A pool for the bucket's dataset to live under.
 *
 * Prefers one that already exists: a developer's appliance has pools and often
 * no spare disk, and exporting somebody's pool is not a precondition. Only on
 * an appliance with none — the CI case — does this build `e2e_s3_tank` from one
 * unused disk. That pool is exported once, in `afterAll`, rather than around
 * every test: a build-and-destroy per test is minutes of wall clock for
 * nothing.
 */
export async function providePool(client: E2eApiClient): Promise<ProvidedPool> {
  const existing = await findOnlinePool(client);
  if (existing) {
    return { name: existing, built: false };
  }

  // The wizard's own view of the inventory, so the disk chosen here is one the
  // UI would have offered too — see `getSelectableDisks` for what it excludes.
  const [disk] = await getSelectableDisks(client);

  if (!disk) {
    throw new Error(
      'The S3 journeys need a pool, and this appliance has neither an online pool nor an unused '
      + 'disk to build one from.',
    );
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.create', [{
      name: s3OwnedPoolName,
      topology: { data: [{ type: 'STRIPE', disks: [disk.name] }] },
    }]),
    {
      timeoutMs: poolCreateTimeoutMs,
      whatItCosts: `Pool "${s3OwnedPoolName}" was not created, so there is nowhere to put the bucket.`,
    },
  );

  return { name: s3OwnedPoolName, built: true };
}

/** Creates a plain filesystem dataset by full name (`pool/name`) if absent. */
export async function ensureDatasetPresent(client: E2eApiClient, name: string): Promise<void> {
  const [existing] = await firstValueFrom(
    client.api.query('pool.dataset.query', [['id', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  if (existing) {
    return;
  }

  await firstValueFrom(
    client.api.call('pool.dataset.create', [{ name, type: 'FILESYSTEM' }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Deletes a dataset and everything under it, if present.
 *
 * Recursive because the bucket's own dataset is created under the parent the
 * test provides, and removing the bucket does not remove it — the share
 * deletion leaves data in place by design.
 */
export async function ensureDatasetAbsent(client: E2eApiClient, name: string): Promise<void> {
  const [existing] = await firstValueFrom(
    client.api.query('pool.dataset.query', [['id', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  if (!existing) {
    return;
  }

  await firstValueFrom(
    client.api
      .call('pool.dataset.delete', [name, { recursive: true, force: true }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}

export async function findS3Bucket(client: E2eApiClient, name: string): Promise<S3BucketEntry | undefined> {
  // `query`, not `queryOne` — absence is an ordinary answer here.
  const [bucket] = await firstValueFrom(
    client.api.query('sharing.s3.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return bucket;
}

/** Removes a bucket by name, if present. Its dataset stays; see `ensureDatasetAbsent`. */
export async function ensureS3BucketAbsent(client: E2eApiClient, name: string): Promise<void> {
  const bucket = await findS3Bucket(client, name);
  if (!bucket) {
    return;
  }

  await firstValueFrom(
    client.api.call('sharing.s3.delete', [bucket.id]).pipe(timeout(slowCallTimeoutMs)),
  );
}

export async function findS3AccessKeys(client: E2eApiClient, username: string): Promise<S3AccessKeyEntry[]> {
  return firstValueFrom(
    client.api.query('s3.accesskey.query', [['username', '=', username]]).pipe(timeout(readTimeoutMs)),
  );
}

/**
 * Removes every access key belonging to a user.
 *
 * Runs before the user is deleted: a key outlives its account (middleware nulls
 * `username` instead), which would leave an orphan behind and a "no longer
 * exists" row in the list for the next run to trip over.
 */
export async function ensureS3AccessKeysAbsent(client: E2eApiClient, username: string): Promise<void> {
  const keys = await findS3AccessKeys(client, username);

  for (const key of keys) {
    await firstValueFrom(
      client.api.call('s3.accesskey.delete', [key.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

interface ServiceState {
  id: number;
  state: string;
  enable: boolean;
}

/** The S3 service row, or undefined when the query returns nothing. */
export async function queryS3Service(client: E2eApiClient): Promise<ServiceState | undefined> {
  const [service] = await firstValueFrom(
    client.api
      .query('service.query', [['service', '=', s3ServiceName]])
      .pipe(timeout(readTimeoutMs)),
  );

  return service;
}

/**
 * Returns the S3 service to stopped and not-auto-starting.
 *
 * Load-bearing, as for SMB: saving the first bucket raises "Start S3 Service"
 * only while the service is stopped, and the dialog's auto-start toggle
 * defaults to on. Left running, the next run silently exercises a different
 * path — no prompt at all — while still reporting green.
 *
 * An empty query is an error rather than "nothing to stop": every appliance
 * with the S3 service has the row, so no row means the query did not answer.
 */
export async function ensureS3ServiceStopped(client: E2eApiClient): Promise<void> {
  const service = await queryS3Service(client);

  if (!service) {
    throw new Error(
      `service.query returned no \`${s3ServiceName}\` row. This is a failed query rather than an `
      + 'absent service — or an appliance without S3, which these journeys cannot run against.',
    );
  }

  if (service.enable) {
    await firstValueFrom(
      client.api
        .call('service.update', [service.id, { enable: false }])
        .pipe(timeout(slowCallTimeoutMs)),
    );
  }

  if (service.state !== 'RUNNING') {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('service.control', ['STOP', s3ServiceName, { silent: false }]),
    {
      timeoutMs: serviceControlTimeoutMs,
      whatItCosts: 'S3 service did not stop; the next run will not see the start-service prompt.',
      confirm: async () => {
        const current = await queryS3Service(client);
        return current !== undefined && current.state !== 'RUNNING';
      },
    },
  );
}
