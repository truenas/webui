/**
 * SSH connections, over the API — specifically one that points back at the
 * appliance itself, for specs that need a "remote" system without an outside one.
 *
 * An SSH connection is a keychain credential of type `SSH_CREDENTIALS`, keyed
 * here on its name, which is what the wizard's select lists it as. It signs in
 * as root with a keypair `fixtures/loopback-ssh.ts` authorizes, and trusts the
 * host key `keychaincredential.remote_ssh_host_key_scan` reads off `127.0.0.1`.
 * Middleware runs the remote side's commands on the appliance, so the loopback
 * address needs nothing forwarded to the runner.
 */
import { firstValueFrom, timeout } from 'rxjs';
import { ensureLoopbackRootKeyAbsent, ensureLoopbackRootKeyPresent, type LoopbackRootKey } from './loopback-ssh';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

const loopbackHost = '127.0.0.1';

/** Which keypair a connection signs in with, and the marker on root's copy of it. */
function rootKeyFor(name: string): LoopbackRootKey {
  return { keypairName: `${name}-key`, marker: name };
}

/**
 * The appliance's own record of the SSH connection with this name, or undefined.
 *
 * Filtered on the type as well, so a keypair that happened to share the name is
 * never mistaken for it.
 */
export async function findSshConnection(client: E2eApiClient, name: string): Promise<{ id: number } | undefined> {
  const [connection] = await firstValueFrom(
    client.api.query('keychaincredential.query', [['name', '=', name], ['type', '=', 'SSH_CREDENTIALS']])
      .pipe(timeout(readTimeoutMs)),
  );

  return connection as { id: number } | undefined;
}

/**
 * Makes an SSH connection named `name` to this appliance's loopback present, as
 * root, with everything it needs. Returns its id.
 *
 * Safe to call against an appliance an interrupted run left half set up.
 */
export async function ensureLoopbackSshConnectionPresent(client: E2eApiClient, name: string): Promise<number> {
  const keypair = await ensureLoopbackRootKeyPresent(client, rootKeyFor(name));

  const existing = await findSshConnection(client, name);
  if (existing) {
    return existing.id;
  }

  const remoteHostKey = await firstValueFrom(
    client.api.call('keychaincredential.remote_ssh_host_key_scan', [{ host: loopbackHost }])
      .pipe(timeout(slowCallTimeoutMs)),
  );

  const created = await firstValueFrom(
    client.api.call('keychaincredential.create', [{
      name,
      type: 'SSH_CREDENTIALS',
      attributes: {
        host: loopbackHost,
        username: 'root',
        private_key: keypair.id,
        remote_host_key: remoteHostKey,
      },
    }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return (created as { id: number }).id;
}

/**
 * Removes the SSH connection with this name, if there is one.
 *
 * Whatever uses it must already be gone: middleware refuses to delete a
 * connection a replication task still uses.
 */
export async function ensureSshConnectionAbsent(client: E2eApiClient, name: string): Promise<void> {
  const connection = await findSshConnection(client, name);
  if (!connection) {
    return;
  }

  await firstValueFrom(
    client.api.call('keychaincredential.delete', [connection.id]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Undoes what {@link ensureLoopbackSshConnectionPresent} set up besides the
 * connection itself: root's key, the keypair and, if it was started for this,
 * SSH. Separate from {@link ensureSshConnectionAbsent} so a teardown can run it
 * as its own step, and a connection that will not delete does not leave root's
 * key behind.
 */
export async function ensureLoopbackSshAccessAbsent(client: E2eApiClient, name: string): Promise<void> {
  await ensureLoopbackRootKeyAbsent(client, rootKeyFor(name));
}
