/**
 * S3 preconditions and cleanup, over the API.
 *
 * Buckets and access keys are created through the UI — that is what the S3
 * journeys test. Everything they merely depend on comes from here: a pool to
 * put the bucket's dataset under, the dataset itself, the account that owns
 * things, and a stopped S3 service so the post-save "Start S3 Service" prompt
 * is deterministic.
 *
 * The S3 methods arrived in `@truenas/api-client` 5.0 and their current fields
 * in 6.0; the entry shapes below are named off the directory the same way
 * `fixtures/storage.ts` names its ACL entry, so they follow the generated
 * types rather than restating them.
 */
import type { CallResponse, QueryEntity } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { ensureServiceRunning, ensureServiceStopped, queryService, type ServiceState } from './services';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

export type S3BucketEntry = QueryEntity<E2eApiDirectory['call'], 'sharing.s3.query'>;
export type S3AccessKeyEntry = QueryEntity<E2eApiDirectory['call'], 's3.accesskey.query'>;
export type S3ConfigEntry = CallResponse<E2eApiDirectory, 's3.config'>;

/**
 * Middleware's name for the service; the UI calls it "S3". Renamed from
 * `truenas_s3` in middleware #19674 (2026-09-10), so an appliance older than
 * that has no `s3` row and the journeys cannot run against it.
 */
export const s3ServiceName = 's3';

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
 * Creates an access key over the API, for journeys that start from one.
 *
 * Always creates, never adopts: the entry `create` returns is the only one
 * that carries the secret, and a test comparing secrets after a rotation needs
 * it. A key of that name still present means the caller's cleanup did not
 * run, which is worth failing on rather than papering over.
 */
export async function provisionS3AccessKey(
  client: E2eApiClient,
  key: S3AccessKeySpec,
): Promise<S3AccessKeyEntry> {
  const [existing] = await firstValueFrom(
    client.api
      .query('s3.accesskey.query', [['name', '=', key.name], ['username', '=', key.username]])
      .pipe(timeout(readTimeoutMs)),
  );
  if (existing) {
    throw new Error(
      `Access key "${key.name}" for ${key.username} already exists; the spec's cleanup should have removed it.`,
    );
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
 * Brings the S3 service to running, for the journeys about that state: the
 * card's header toggle, and a bucket saved without the start prompt.
 *
 * Only ever called with a bucket already present: the service serves buckets
 * and is not started by the fixtures on an appliance that has none.
 */
export async function ensureS3ServiceRunning(client: E2eApiClient): Promise<void> {
  await ensureServiceRunning(
    client,
    s3ServiceName,
    'S3 service did not start; the journey cannot begin from a running service.',
  );
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

/**
 * Puts the parts of the service configuration a journey leaves alone into a
 * known state: no listeners, and the UI certificate.
 *
 * The service form loads what is stored and saves it back, so anything the
 * journey does not touch is ambient state — a leftover listener from an
 * interrupted run, or a certificate a developer configured — and an assertion
 * about the saved configuration would be about the appliance rather than the
 * journey. `s3.update` replaces the listener list outright, but the form
 * appends rows to the stored ones, so "exactly one listener" only means
 * something from none.
 */
export async function resetS3ListenersAndCertificate(client: E2eApiClient): Promise<void> {
  await firstValueFrom(
    client.api.call('s3.update', [{ listeners: [], certificate: null }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** The service configuration as middleware holds it. */
export async function readS3Config(client: E2eApiClient): Promise<S3ConfigEntry> {
  return firstValueFrom(client.api.call('s3.config').pipe(timeout(readTimeoutMs)));
}

/**
 * Sets the service's managed root dataset over the API, or clears it with an
 * empty string.
 */
export async function setS3ManagedRootDataset(client: E2eApiClient, dataset: string): Promise<void> {
  await firstValueFrom(
    client.api.call('s3.update', [{ managed_root_dataset: dataset }]).pipe(timeout(slowCallTimeoutMs)),
  );
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
