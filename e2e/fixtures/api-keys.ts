/**
 * API key preconditions and cleanup, over the API.
 *
 * Keyed on the key's name, which is what the list builds every id on a row
 * from — and which the add form holds unique, so a name names one key.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A key as middleware reports it, with its id narrowed — see `GroupRecord`. */
type ApiKeyEntry = Extract<CallResponse<E2eApiDirectory, 'api_key.query'>, unknown[]>[number];

export type ApiKeyRecord = ApiKeyEntry & { id: number };

/**
 * The appliance's own record of the key with this name, or undefined.
 *
 * `query`, not `queryOne` — absence is an ordinary answer here.
 */
export async function findApiKey(client: E2eApiClient, name: string): Promise<ApiKeyRecord | undefined> {
  const [key] = await firstValueFrom(
    client.api.query('api_key.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return key as ApiKeyRecord | undefined;
}

/**
 * Removes every key with this name, if any.
 *
 * Every, rather than the first: the form refuses a name in use, but middleware
 * is what this cleans up after, and a key it holds twice must not leave one
 * behind for the next run's form to refuse.
 */
export async function ensureApiKeyAbsent(client: E2eApiClient, name: string): Promise<void> {
  const keys = await firstValueFrom(
    client.api.query('api_key.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  for (const key of keys) {
    await firstValueFrom(
      client.api.call('api_key.delete', [key.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates a non-expiring key for a user, if no key has that name already.
 *
 * For the key a delete acts on, and for a bystander. Never for the key under
 * test in a create — that one goes through the form.
 */
export async function ensureApiKeyPresent(
  client: E2eApiClient,
  { name, username }: { name: string; username: string },
): Promise<void> {
  if (await findApiKey(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('api_key.create', [{ name, username }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Creates a non-expiring key for a user and returns the key itself, which
 * middleware hands out on create and never again.
 *
 * For a test that has to sign in with the key afterwards. The caller removes
 * any key of that name first; this does not, so a leftover makes middleware
 * refuse the create rather than hand back a key for the wrong record.
 * Never log what it returns.
 */
export async function createApiKeyWithSecret(
  client: E2eApiClient,
  { name, username }: { name: string; username: string },
): Promise<string> {
  const created = await firstValueFrom(
    client.api.call('api_key.create', [{ name, username }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return created.key;
}

/**
 * A key's expiry as milliseconds, or null for a key that never expires or is
 * not there.
 *
 * The generated client types `expires_at` as a string; the wire shape is
 * `{ $date: <ms> }`, which is what the UI reads. Both are accepted, as in
 * `s3-access-key-options.e2e.ts`.
 */
export function apiKeyExpiryMs(key: ApiKeyRecord | undefined): number | null {
  const value: unknown = key?.expires_at;
  if (typeof value === 'string') {
    return Date.parse(value);
  }
  if (value && typeof value === 'object' && '$date' in value && typeof value.$date === 'number') {
    return value.$date;
  }
  return null;
}
