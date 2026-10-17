/**
 * SMB share preconditions and cleanup, over the API.
 *
 * Shares, and the two things about the service that are SMB's own: its name and
 * its Apple-extensions flag. Starting and stopping is `fixtures/services.ts`,
 * and the split matters more here than elsewhere: SMB service state is global,
 * so a test that starts it changes which dialog every later test is shown —
 * `CLAUDE.md` names that as the failure mode a passing suite hides.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { ensureServiceRunning, ensureServiceStopped } from './services';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** Middleware's name for the SMB service. The UI calls it "SMB"; `service.query` calls it this. */
export const smbServiceName = 'cifs';

/**
 * A share as middleware reports it, with its id narrowed.
 *
 * Same narrowing as `GroupRecord` and `UserRecord`, for the same reason: the
 * generated query result declares `id` optional, and a record that came back
 * from a query certainly has one.
 */
type SmbShareEntry = Extract<CallResponse<E2eApiDirectory, 'sharing.smb.query'>, unknown[]>[number];

export type SmbShareRecord = SmbShareEntry & { id: number };

/**
 * The appliance's own record of a share, or undefined.
 *
 * What a form test asserts against: the list showing a row says the screen
 * believed the save, this says the appliance did it — and carries back the
 * things the form never displays, like the `purpose` it resolved and the
 * `options` block it derived from the preset.
 */
export async function findSmbShare(client: E2eApiClient, name: string): Promise<SmbShareRecord | undefined> {
  // `query`, not `queryOne` — absence is an ordinary answer here.
  const [share] = await firstValueFrom(
    client.api.query('sharing.smb.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return share as SmbShareRecord | undefined;
}

/**
 * Removes a share by name, if present.
 *
 * The data stays. Deleting a share unshares a path; it never touches what is on
 * it, so a test that made a dataset has to remove that separately.
 */
export async function ensureSmbShareAbsent(client: E2eApiClient, name: string): Promise<void> {
  const shares = await firstValueFrom(
    client.api.query('sharing.smb.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  for (const share of shares) {
    await firstValueFrom(
      client.api.call('sharing.smb.delete', [share.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates a plain share on an existing path, if absent.
 *
 * For the bystander in a deletion test and anything else that needs a share to
 * merely exist. Never for the share under test — that one goes through the form.
 * The description is left empty unless given.
 */
export async function ensureSmbSharePresent(
  client: E2eApiClient,
  { name, path, comment = '' }: { name: string; path: string; comment?: string },
): Promise<void> {
  if (await findSmbShare(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('sharing.smb.create', [{ name, path, comment }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** One entry of a share's ACL, as `sharing.smb.getacl` reports it. */
export type SmbShareAce = NonNullable<CallResponse<E2eApiDirectory, 'sharing.smb.getacl'>['share_acl']>[number];

/** The SID middleware gives `everyone@` in a share ACL. */
export const everyoneSid = 'S-1-1-0';

/**
 * A share's ACL, in the order middleware stores it.
 *
 * The order matters to a test: the Share ACL form lists the entries in this
 * order, so it is how a spec finds which row of the form holds an entry.
 */
export async function readSmbShareAcl(client: E2eApiClient, shareName: string): Promise<SmbShareAce[]> {
  const shareAcl = await firstValueFrom(
    client.api.call('sharing.smb.getacl', [{ share_name: shareName }]).pipe(timeout(readTimeoutMs)),
  );

  return shareAcl.share_acl ?? [];
}

/**
 * Replaces a share's ACL with `everyone@` and one user, each FULL and ALLOWED.
 *
 * A precondition for removing an entry through the form. `everyone@` stays as
 * the entry that must survive the removal.
 */
export async function setSmbShareAclWithUser(client: E2eApiClient, shareName: string, uid: number): Promise<void> {
  await firstValueFrom(
    client.api.call('sharing.smb.setacl', [{
      share_name: shareName,
      share_acl: [
        { ae_who_sid: everyoneSid, ae_perm: 'FULL', ae_type: 'ALLOWED' },
        { ae_who_id: { id_type: 'USER', id: uid }, ae_perm: 'FULL', ae_type: 'ALLOWED' },
      ],
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Returns the SMB service to stopped and not-auto-starting.
 *
 * Load-bearing for the fresh-install story, not mere tidiness. The app's
 * post-save dialogs branch on service state: stopped raises "Start SMB
 * Service", running raises "Restart SMB Service" instead. Leaving the service
 * running means the next run silently exercises a different path — and the
 * story's whole premise is a *fresh* instance, which a running, auto-starting
 * SMB service is not. The protocol itself lives in `fixtures/services.ts`.
 */
export async function ensureSmbServiceStopped(client: E2eApiClient): Promise<void> {
  await ensureServiceStopped(
    client,
    smbServiceName,
    'SMB service did not stop; the next run will not start from a fresh state.',
  );
}

/**
 * Whether the SMB service advertises Apple SMB2/3 protocol extensions.
 *
 * Service-wide, not per-share, and the share form depends on it: a Time Machine
 * or Final Cut Pro share cannot be saved while it is off — `extraDisabled`
 * keeps Save down and the form offers to turn it on inline.
 */
export async function readSmbAppleExtensions(client: E2eApiClient): Promise<boolean> {
  const config = await firstValueFrom(client.api.call('smb.config').pipe(timeout(readTimeoutMs)));

  return config.aapl_extensions;
}

/**
 * Sets that flag back to a known value.
 *
 * For teardown. Driving the form's "Enable Now" writes service configuration
 * that outlives the share it was enabled for, so a spec that touches it owes
 * the next one the value it found.
 */
export async function setSmbAppleExtensions(client: E2eApiClient, enabled: boolean): Promise<void> {
  await firstValueFrom(
    client.api.call('smb.update', [{ aapl_extensions: enabled }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Starts the SMB service, for a journey that needs it running.
 *
 * The status page reads `smb.status`, which reports on the running server.
 * Whoever calls this owes {@link ensureSmbServiceStopped} in teardown.
 */
export async function ensureSmbServiceRunning(client: E2eApiClient): Promise<void> {
  await ensureServiceRunning(
    client,
    smbServiceName,
    'SMB service did not start, so the status page has no server to report on.',
  );
}
