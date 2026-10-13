/**
 * SSH keypair preconditions, cleanup and readback, over the API.
 *
 * A keypair is a keychain credential of type `SSH_KEY_PAIR`, keyed here on its
 * name, which is what the card builds every id on a row from. Creating and
 * deleting one are plain calls, not jobs.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A keychain credential as middleware reports it, with its id narrowed — see `GroupRecord`. */
type KeychainCredentialEntry = Extract<CallResponse<E2eApiDirectory, 'keychaincredential.query'>, unknown[]>[number];

export type SshKeypairRecord = KeychainCredentialEntry & { id: number };

/**
 * The appliance's own record of the keypair with this name, or undefined.
 *
 * Filtered on the type as well, so an SSH connection that happened to share the
 * name is never mistaken for it. `query`, not `queryOne` — absence is an
 * ordinary answer here.
 */
export async function findSshKeypair(client: E2eApiClient, name: string): Promise<SshKeypairRecord | undefined> {
  const [keypair] = await firstValueFrom(
    client.api.query('keychaincredential.query', [['name', '=', name], ['type', '=', 'SSH_KEY_PAIR']])
      .pipe(timeout(readTimeoutMs)),
  );

  return keypair as SshKeypairRecord | undefined;
}

/**
 * The keys a keypair holds, as middleware stores them; neither, for no keypair.
 *
 * The cast is because `attributes` is typed across every credential type, and
 * an SSH connection's are a different shape — its `private_key` is a keypair's id.
 */
export function keypairKeys(
  keypair: SshKeypairRecord | undefined,
): { privateKey?: string | null; publicKey?: string | null } {
  const attributes = keypair?.attributes as { private_key?: string | null; public_key?: string | null } | undefined;
  return { privateKey: attributes?.private_key, publicKey: attributes?.public_key };
}

/** Removes the keypair with this name, if there is one. */
export async function ensureSshKeypairAbsent(client: E2eApiClient, name: string): Promise<void> {
  const keypair = await findSshKeypair(client, name);
  if (!keypair) {
    return;
  }

  await firstValueFrom(
    client.api.call('keychaincredential.delete', [keypair.id]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Creates a keypair from a freshly generated pair, if none has this name already.
 *
 * For the keypair a delete acts on, and for a bystander. Never for the keypair
 * under test in a generate — that one goes through the form.
 */
export async function ensureSshKeypairPresent(client: E2eApiClient, name: string): Promise<void> {
  if (await findSshKeypair(client, name)) {
    return;
  }

  const generated = await firstValueFrom(
    client.api.call('keychaincredential.generate_ssh_key_pair').pipe(timeout(slowCallTimeoutMs)),
  );

  await firstValueFrom(
    client.api.call('keychaincredential.create', [{
      name,
      type: 'SSH_KEY_PAIR',
      attributes: { private_key: generated.private_key, public_key: generated.public_key },
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
