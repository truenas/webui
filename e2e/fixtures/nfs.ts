/**
 * NFS share preconditions and cleanup, over the API.
 *
 * The counterpart of `fixtures/smb.ts`, with one difference that runs through
 * everything here: an NFS share has no name. Its path is its identity — to the
 * form, to the card, and to these helpers — so a spec that needs two shares
 * needs two paths.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { ensureServiceStopped } from './services';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** Middleware's name for the NFS service, which for once is also the UI's. */
export const nfsServiceName = 'nfs';

/** A share as middleware reports it, with its id narrowed — see `SmbShareRecord`. */
type NfsShareEntry = Extract<CallResponse<E2eApiDirectory, 'sharing.nfs.query'>, unknown[]>[number];

export type NfsShareRecord = NfsShareEntry & { id: number };

/**
 * The appliance's own record of the share on a path, or undefined.
 *
 * What a form test asserts against: the card showing a row says the screen
 * believed the save, this says the appliance did it — and carries back what the
 * card never displays, like the networks and hosts an export is restricted to.
 */
export async function findNfsShare(client: E2eApiClient, path: string): Promise<NfsShareRecord | undefined> {
  // `query`, not `queryOne` — absence is an ordinary answer here.
  const [share] = await firstValueFrom(
    client.api.query('sharing.nfs.query', [['path', '=', path]]).pipe(timeout(readTimeoutMs)),
  );

  return share as NfsShareRecord | undefined;
}

/**
 * Removes every share on a path, if any.
 *
 * Every, because middleware allows several exports of one path as long as their
 * hosts and networks do not overlap. The data stays: deleting a share stops
 * exporting a path and never touches what is on it.
 */
export async function ensureNfsShareAbsent(client: E2eApiClient, path: string): Promise<void> {
  const shares = await firstValueFrom(
    client.api.query('sharing.nfs.query', [['path', '=', path]]).pipe(timeout(readTimeoutMs)),
  );

  for (const share of shares) {
    await firstValueFrom(
      client.api.call('sharing.nfs.delete', [share.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Exports an existing path, if it is not exported already.
 *
 * For the bystander in a deletion test and anything else that needs a share to
 * merely exist. Never for the share under test — that one goes through the form.
 */
export async function ensureNfsSharePresent(
  client: E2eApiClient,
  { path, comment = '' }: { path: string; comment?: string },
): Promise<void> {
  if (await findNfsShare(client, path)) {
    return;
  }

  await firstValueFrom(
    client.api.call('sharing.nfs.create', [{ path, comment }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Returns the NFS service to stopped and not-auto-starting.
 *
 * Same reason as SMB's: the form's post-save prompt is raised only while the
 * service is stopped, so a service left running makes the next run exercise a
 * different path while still reporting green.
 */
export async function ensureNfsServiceStopped(client: E2eApiClient): Promise<void> {
  await ensureServiceStopped(
    client,
    nfsServiceName,
    'NFS service did not stop; the next run will not be offered the start prompt its saves expect.',
  );
}
