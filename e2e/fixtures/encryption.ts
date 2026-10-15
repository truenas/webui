/**
 * Encrypted datasets, over the API.
 *
 * Provisioning only. Creating, locking and unlocking a dataset are what
 * `tests/datasets-encryption.e2e.ts` drives through the UI, so these stand in for them only where a
 * test is about a different step. Removal is `ensureDatasetAbsent` in `fixtures/storage.ts`, which
 * deletes a locked dataset as readily as an unlocked one.
 */
import { firstValueFrom, timeout } from 'rxjs';
import { findDataset } from './storage';
import type { E2eApiClient } from '../support/api/client';
import { runJob } from '../support/jobs';
import { slowCallTimeoutMs } from '../support/timeouts';

/**
 * Creates `name` as its own encryption root, with a passphrase, if absent.
 *
 * A passphrase rather than a generated key, because the card disables Lock without one.
 * `inherit_encryption: false` is what makes it a root of its own even under an encrypted parent.
 */
export async function ensureEncryptedDatasetPresent(
  client: E2eApiClient,
  name: string,
  passphrase: string,
): Promise<void> {
  if (await findDataset(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api
      .call('pool.dataset.create', [{
        name,
        type: 'FILESYSTEM',
        encryption: true,
        inherit_encryption: false,
        encryption_options: { passphrase },
      }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Creates `name` as its own encryption root, with a hex key the test chooses, if absent.
 *
 * A key rather than a passphrase, because middleware stores a key and never a passphrase, and only
 * a stored key can be exported — a replication task's Download keys is shown for a key alone.
 * The caller names the key so it can recognise it in what the UI hands back.
 */
export async function ensureKeyEncryptedDatasetPresent(
  client: E2eApiClient,
  name: string,
  key: string,
): Promise<void> {
  if (await findDataset(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api
      .call('pool.dataset.create', [{
        name,
        type: 'FILESYSTEM',
        encryption: true,
        inherit_encryption: false,
        encryption_options: { generate_key: false, key },
      }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Locks an encrypted dataset, as a precondition for unlocking it.
 *
 * `force_umount` because nothing should be holding it, and a precondition that fails over a
 * stray handle would fail the test for a reason it is not about.
 */
export async function lockDataset(client: E2eApiClient, name: string): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.dataset.lock', [name, { force_umount: true }]),
    {
      timeoutMs: slowCallTimeoutMs,
      whatItCosts: `${name} is not locked, so there is nothing for the test to unlock`,
      confirm: async () => (await findDataset(client, name))?.locked === true,
    },
  );
}
