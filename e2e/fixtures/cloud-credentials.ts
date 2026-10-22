/**
 * Cloud credential preconditions, cleanup and readback, over the API.
 *
 * A credential is keyed here on its name, which middleware holds unique and the
 * card builds every id on a row from. Creating, updating and deleting one are
 * plain calls, and none of them reaches the remote: only `verify` does, which is
 * the form's Verify Credential button and never called from here.
 *
 * Every credential these helpers make points back at the appliance, so no
 * outside service is involved: SFTP to `127.0.0.1` as root, signing in with a
 * keypair the spec authorized through `fixtures/loopback-ssh.ts`, or S3 to the
 * appliance's own S3 service.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A cloud credential as middleware reports it, with its id narrowed — see `GroupRecord`. */
type CloudCredentialEntry = Extract<CallResponse<E2eApiDirectory, 'cloudsync.credentials.query'>, unknown[]>[number];

export type CloudCredentialRecord = CloudCredentialEntry & { id: number };

/**
 * The SFTP fields of a credential's provider, as middleware stores them.
 *
 * The cast is because `provider` is typed across every provider, and each one's
 * attributes are a different shape.
 */
export interface SftpProviderFields {
  type?: string;
  host?: string;
  user?: string;
  private_key?: number | null;
}

/**
 * The S3 fields of a credential's provider, as middleware stores them. Cast for the same reason
 * as {@link SftpProviderFields}.
 */
export interface S3ProviderFields {
  type?: string;
  access_key_id?: string;
  endpoint?: string;
}

/**
 * One bucket as `cloudsync.list_buckets` lists it — rclone's `lsjson` fields, which the form's
 * options are built from.
 */
export interface CloudBucket {
  Name: string;
  Path: string;
  Enabled: boolean;
}

/**
 * The appliance's own record of the credential with this name, or undefined.
 * `query`, not `queryOne` — absence is an ordinary answer here.
 */
export async function findCloudCredential(
  client: E2eApiClient,
  name: string,
): Promise<CloudCredentialRecord | undefined> {
  const [credential] = await firstValueFrom(
    client.api.query('cloudsync.credentials.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return credential as CloudCredentialRecord | undefined;
}

/** The credential with this id, or undefined — for following one across a rename. */
export async function findCloudCredentialById(
  client: E2eApiClient,
  id: number,
): Promise<CloudCredentialRecord | undefined> {
  const [credential] = await firstValueFrom(
    client.api.query('cloudsync.credentials.query', [['id', '=', id]]).pipe(timeout(readTimeoutMs)),
  );

  return credential as CloudCredentialRecord | undefined;
}

/** A credential's provider fields, read as SFTP; empty for no credential. */
export function sftpFields(credential: CloudCredentialRecord | undefined): SftpProviderFields {
  return (credential?.provider ?? {}) as unknown as SftpProviderFields;
}

/** A credential's provider fields, read as S3; empty for no credential. */
export function s3Fields(credential: CloudCredentialRecord | undefined): S3ProviderFields {
  return (credential?.provider ?? {}) as unknown as S3ProviderFields;
}

/** How many cloud credentials the appliance holds, whoever made them. */
export async function countCloudCredentials(client: E2eApiClient): Promise<number> {
  const credentials = await firstValueFrom(
    client.api.query('cloudsync.credentials.query', []).pipe(timeout(readTimeoutMs)),
  );

  return credentials.length;
}

/**
 * Removes the credential with this name, if there is one.
 *
 * Middleware refuses while a cloud sync or backup task uses it; nothing in the
 * spec that calls this makes one.
 */
export async function ensureCloudCredentialAbsent(client: E2eApiClient, name: string): Promise<void> {
  const credential = await findCloudCredential(client, name);
  if (!credential) {
    return;
  }

  await firstValueFrom(
    client.api.call('cloudsync.credentials.delete', [credential.id]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Creates an SFTP credential to `127.0.0.1` as root on this keypair, if none has
 * this name already.
 *
 * For the credential an edit or a delete acts on, and for a bystander. Never for
 * the credential under test in an add — that one goes through the form.
 */
export async function ensureLoopbackCloudCredentialPresent(
  client: E2eApiClient,
  name: string,
  keypairId: number,
): Promise<void> {
  if (await findCloudCredential(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('cloudsync.credentials.create', [{
      name,
      provider: {
        type: 'SFTP',
        // No `port`: middleware defaults it to 22, and the generated type for that field accepts no number.
        host: '127.0.0.1',
        user: 'root',
        private_key: keypairId,
      },
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Creates an S3 credential with these keys and endpoint, if none has this name already, and
 * returns its id.
 *
 * For a task that syncs to a bucket, when the credential is not what is under test. Never for the
 * credential under test in an add — that one goes through the form.
 */
export async function ensureS3CloudCredentialPresent(
  client: E2eApiClient,
  {
    name,
    accessKeyId,
    secretAccessKey,
    endpoint,
  }: {
    name: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint: string;
  },
): Promise<number> {
  const existing = await findCloudCredential(client, name);
  if (existing) {
    return existing.id;
  }

  const created = await firstValueFrom(
    client.api.call('cloudsync.credentials.create', [{
      name,
      provider: {
        type: 'S3',
        access_key_id: accessKeyId,
        secret_access_key: secretAccessKey,
        endpoint,
      },
    }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return (created as { id: number }).id;
}

/**
 * The buckets a credential reaches, as the task form's Bucket select is filled from them.
 *
 * Middleware declares the rows as free-form dicts, hence the cast.
 */
export async function listCloudCredentialBuckets(client: E2eApiClient, credentialId: number): Promise<CloudBucket[]> {
  const buckets = await firstValueFrom(
    client.api.call('cloudsync.list_buckets', [credentialId]).pipe(timeout(slowCallTimeoutMs)),
  );

  return buckets as unknown as CloudBucket[];
}
