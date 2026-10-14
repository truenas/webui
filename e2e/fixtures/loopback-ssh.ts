/**
 * Letting the appliance sign in to itself as root over SSH, for any spec whose
 * "remote" is the appliance's own loopback.
 *
 * Signing in as root with a key is what `sshd_config` allows without touching
 * password settings: middleware writes `PermitRootLogin without-password` unless
 * root has password login enabled. So {@link ensureLoopbackRootKeyPresent}
 * generates a keypair, appends its public key to root's `sshpubkey` with a marker
 * comment, and makes sure SSH is running. {@link ensureLoopbackRootKeyAbsent}
 * undoes each part. Root's other keys are left as they were: only lines carrying
 * the caller's marker are removed, so two specs with different markers never
 * take out each other's key.
 */
import { firstValueFrom, timeout } from 'rxjs';
import { ensureServiceRunning, ensureServiceStopped, queryService } from './services';
import {
  ensureSshKeypairAbsent, ensureSshKeypairPresent, findSshKeypair, keypairKeys, type SshKeypairRecord,
} from './ssh-keypairs';
import { findUser } from './users';
import type { E2eApiClient } from '../support/api/client';
import { slowCallTimeoutMs } from '../support/timeouts';

/** The keypair a spec signs in with, and the comment its public key carries in root's `sshpubkey`. */
export interface LoopbackRootKey {
  keypairName: string;
  marker: string;
}

/**
 * Whether this module started SSH, and so owes stopping it. Module state rather
 * than a return value because the start and the stop happen in different hooks.
 */
let startedSsh = false;

/** Root's authorized keys with every line carrying `marker` taken out. */
function withoutMarkedKeys(sshpubkey: string | null | undefined, marker: string): string {
  return (sshpubkey ?? '')
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.trim().endsWith(` ${marker}`))
    .join('\n');
}

async function setRootAuthorizedKeys(client: E2eApiClient, sshpubkey: string): Promise<void> {
  const root = await findUser(client, 'root');
  if (!root) {
    throw new Error('user.query returned no root row, so the loopback key cannot be authorized.');
  }

  await firstValueFrom(
    client.api.call('user.update', [root.id, { sshpubkey }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Makes the keypair present, authorizes it for root, and starts SSH if it was
 * stopped. Returns the keypair, whose id is what a credential signs in with.
 *
 * Safe to call against an appliance an interrupted run left half set up: a
 * stale marked key is replaced rather than duplicated.
 */
export async function ensureLoopbackRootKeyPresent(
  client: E2eApiClient,
  { keypairName, marker }: LoopbackRootKey,
): Promise<SshKeypairRecord> {
  await ensureSshKeypairPresent(client, keypairName);
  const keypair = await findSshKeypair(client, keypairName);
  const { publicKey } = keypairKeys(keypair);
  if (!keypair || !publicKey) {
    throw new Error(`keypair "${keypairName}" was not created with a public key.`);
  }

  const root = await findUser(client, 'root');
  const kept = withoutMarkedKeys(root?.sshpubkey, marker);
  const marked = `${publicKey.trim()} ${marker}`;
  await setRootAuthorizedKeys(client, kept ? `${kept}\n${marked}` : marked);

  if ((await queryService(client, 'ssh'))?.state !== 'RUNNING') {
    await ensureServiceRunning(client, 'ssh', `the appliance cannot reach itself over SSH as "${keypairName}"`);
    startedSsh = true;
  }

  return keypair;
}

/**
 * Removes root's marked key and the keypair, and stops SSH if
 * {@link ensureLoopbackRootKeyPresent} was what started it.
 *
 * Whatever signs in with the keypair must already be gone: middleware refuses
 * to delete a keypair a credential still uses.
 */
export async function ensureLoopbackRootKeyAbsent(
  client: E2eApiClient,
  { keypairName, marker }: LoopbackRootKey,
): Promise<void> {
  const root = await findUser(client, 'root');
  const kept = withoutMarkedKeys(root?.sshpubkey, marker);
  if (kept !== (root?.sshpubkey ?? '')) {
    await setRootAuthorizedKeys(client, kept);
  }

  await ensureSshKeypairAbsent(client, keypairName);

  if (startedSsh) {
    await ensureServiceStopped(client, 'ssh', `SSH stays running after "${keypairName}" is removed`);
    startedSsh = false;
  }
}
