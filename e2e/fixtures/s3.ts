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
import type { CallResponse, QueryEntity } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { ensureServiceStopped, queryService, type ServiceState } from './services';
import { ensurePoolAbsent, getSelectableDisks } from './storage';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

export type S3BucketEntry = QueryEntity<E2eApiDirectory['call'], 'sharing.s3.query'>;
export type S3AccessKeyEntry = QueryEntity<E2eApiDirectory['call'], 's3.accesskey.query'>;
export type S3ConfigEntry = CallResponse<E2eApiDirectory, 's3.config'>;

/** Middleware's name for the service; the UI calls it "S3". */
export const s3ServiceName = 'truenas_s3';

/**
 * The pool the suite builds when the appliance has none. One disk, striped:
 * the bucket's dataset only has to exist, and a fresh CI appliance has no pool
 * at all. Never touched when a pool already exists — see `providePool`.
 */
export const s3OwnedPoolName = 'e2e_s3_tank';

const poolCreateTimeoutMs = 3 * 60_000;

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
  // does not shadow the pool a developer meant the tests to use. When it is the
  // only pool, it is used — and, being the suite's by name, exported afterwards.
  return (pools.find((pool) => pool.name !== s3OwnedPoolName) ?? pools[0])?.name;
}

/**
 * A pool for the bucket's dataset to live under, by name.
 *
 * Prefers one that already exists: a developer's appliance has pools and often
 * no spare disk, and exporting somebody's pool is not a precondition. Only on
 * an appliance with none — the CI case — does this build `e2e_s3_tank` from one
 * unused disk. That pool is exported once, in `afterAll`, rather than around
 * every test: a build-and-destroy per test is minutes of wall clock for
 * nothing.
 *
 * `onBuild` fires *before* `pool.create` is started, not after it is confirmed.
 * The caller uses it to record that this run is responsible for `e2e_s3_tank`,
 * and it has to be told before the job because the job can land and still
 * throw here — a timeout, a socket dropped while middleware restarts, a run
 * interrupted between the two. A pool recorded only on confirmation would be
 * skipped by teardown in exactly those cases, and a leaked pool holds its
 * disks and starves every later run.
 */
export async function providePool(client: E2eApiClient, onBuild: () => void): Promise<string> {
  const existing = await findOnlinePool(client);
  if (existing) {
    return existing;
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

  onBuild();
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

  return s3OwnedPoolName;
}

/**
 * Whether a pool is the suite's to export: the fixed name is reserved for it.
 *
 * By name rather than by memory of having built it, so a pool left behind by
 * an interrupted run — created, never exported — is reclaimed by the next run
 * instead of being adopted as somebody else's and leaked for good. Every other
 * pool is left alone, however the suite came to use it.
 */
export function isSuiteOwnedPool(name: string): boolean {
  return name === s3OwnedPoolName;
}

/**
 * The pool bookkeeping a spec needs, in one place: which pool the journeys got,
 * and whether this run has to export it afterwards.
 *
 * Responsibility is recorded the moment a build is decided on (before the job,
 * so an interrupted build is still exported) or when the suite's own pool is
 * adopted from a previous run. Wire `release` to `test.afterAll`.
 */
export function s3PoolLifecycle(): {
  provide: (client: E2eApiClient) => Promise<string>;
  release: (client: E2eApiClient, keepTestData: boolean) => Promise<void>;
} {
  let owned = false;

  return {
    provide: async (client) => {
      const name = await providePool(client, () => {
        owned = true;
      });
      owned ||= isSuiteOwnedPool(name);
      return name;
    },
    release: async (client, keepTestData) => {
      if (!owned) {
        return;
      }
      if (keepTestData) {
        console.warn(`TN_KEEP_TEST_DATA=1 — leaving pool "${s3OwnedPoolName}".`);
        return;
      }
      await ensurePoolAbsent(client, s3OwnedPoolName);
    },
  };
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

export interface S3BucketSpec {
  name: string;
  /** Dataset the bucket's own dataset is created under. */
  parentDataset: string;
  owner: string;
}

/**
 * Creates a bucket over the API if absent, for journeys that start from one —
 * editing, toggling, deleting. Middleware creates `<parent>/<name>` with it.
 */
export async function ensureS3BucketPresent(client: E2eApiClient, bucket: S3BucketSpec): Promise<void> {
  if (await findS3Bucket(client, bucket.name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('sharing.s3.create', [{
      name: bucket.name,
      dataset: `${bucket.parentDataset}/${bucket.name}`,
      owner: bucket.owner,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
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

export interface S3AccessKeySpec {
  name: string;
  username: string;
}

/**
 * Creates an access key over the API if absent, for journeys that start from
 * one. The returned entry carries the secret only when this call created it —
 * middleware never shows a secret twice.
 */
export async function ensureS3AccessKeyPresent(
  client: E2eApiClient,
  key: S3AccessKeySpec,
): Promise<S3AccessKeyEntry> {
  const [existing] = await firstValueFrom(
    client.api.query('s3.accesskey.query', [['name', '=', key.name]]).pipe(timeout(readTimeoutMs)),
  );
  if (existing) {
    return existing;
  }

  return firstValueFrom(
    client.api.call('s3.accesskey.create', [{ name: key.name, username: key.username }])
      .pipe(timeout(slowCallTimeoutMs)),
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

/** The S3 service row, or undefined when the query returns nothing. */
export async function queryS3Service(client: E2eApiClient): Promise<ServiceState | undefined> {
  return queryService(client, s3ServiceName);
}

/**
 * Returns the S3 service to stopped and not-auto-starting.
 *
 * Load-bearing, as for SMB: saving the first bucket raises "Start S3 Service"
 * only while the service is stopped, and the dialog's auto-start toggle
 * defaults to on. Left running, the next run silently exercises a different
 * path — no prompt at all — while still reporting green. The protocol itself
 * lives in `fixtures/services.ts`.
 */
export async function ensureS3ServiceStopped(client: E2eApiClient): Promise<void> {
  await ensureServiceStopped(
    client,
    s3ServiceName,
    'S3 service did not stop; the next run will not see the start-service prompt.',
  );
}

/** The service configuration as middleware holds it. */
export async function readS3Config(client: E2eApiClient): Promise<S3ConfigEntry> {
  return firstValueFrom(client.api.call('s3.config').pipe(timeout(readTimeoutMs)));
}

/**
 * Puts the service configuration back the way `readS3Config` found it.
 *
 * Only the settings the service form edits. `global_grants` is an entry shape
 * on the way out (with a resolved `name`) and a plain grant on the way in, so
 * it is trimmed; audit settings are licence-gated and left alone.
 */
export async function restoreS3Config(client: E2eApiClient, config: S3ConfigEntry): Promise<void> {
  await firstValueFrom(
    client.api.call('s3.update', [{
      listeners: config.listeners ?? [],
      servers: config.servers,
      certificate: config.certificate ?? null,
      region: config.region,
      log_level: config.log_level,
      global_grants: (config.global_grants ?? []).map((grant) => ({
        principal_type: grant.principal_type,
        xid: grant.xid,
        access: grant.access,
      })),
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
