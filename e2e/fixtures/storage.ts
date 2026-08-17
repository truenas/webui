/**
 * Storage preconditions and cleanup, over the API.
 *
 * Teardown matters more here than anywhere else in the suite: a pool holds its
 * member disks until it is exported, so a leaked pool starves every later run
 * of the inventory it needs (R2.2, R3.2). That is the failure R3.2 exists to
 * prevent, and storage is where it actually bites.
 */
import { TrueNasEndpoint, type TrueNasApiClient } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { callUntyped } from '../support/api/untyped';
import { waitUntil } from '../support/wait';

const queryTimeoutMs = 30_000;
const poolGoneTimeoutMs = 3 * 60_000;
const serviceStopTimeoutMs = 60_000;

interface NamedPool {
  id: number;
  name: string;
}

/** Disks not currently claimed by a pool, i.e. usable for a new one. */
export async function getUnusedDiskCount(client: TrueNasApiClient): Promise<number> {
  const disks = await callUntyped<unknown[]>(client, 'disk.get_unused', []);
  return disks.length;
}

/**
 * Fails fast when the appliance cannot support the test, naming the shortfall.
 *
 * Without this, too few disks surfaces as the width control silently not
 * offering the value the test picks — a confusing mid-wizard failure rather
 * than a clear precondition error (R2.2).
 */
export async function requireUnusedDisks(client: TrueNasApiClient, needed: number): Promise<void> {
  const available = await getUnusedDiskCount(client);
  if (available < needed) {
    throw new Error(
      `This test needs ${needed} unused disks, but the appliance has ${available}. `
      + 'Either a previous run leaked a pool, or the VM was provisioned with too few disks.',
    );
  }
}

async function findPool(client: TrueNasApiClient, name: string): Promise<NamedPool | undefined> {
  // `pool.query` is typed as taking no params in the curated directory, so the
  // filter is applied here rather than server-side.
  const pools = await firstValueFrom(
    client.api.call(TrueNasEndpoint.PoolQuery).pipe(timeout(queryTimeoutMs)),
  );
  return (pools as unknown as NamedPool[]).find((pool) => pool.name === name);
}

/**
 * Removes an SMB share by name, if present.
 *
 * Done before the pool is exported so the share is not left pointing at a path
 * that no longer exists.
 */
export async function ensureSmbShareAbsent(client: TrueNasApiClient, name: string): Promise<void> {
  const shares = await callUntyped<{ id: number; name: string }[]>(
    client,
    'sharing.smb.query',
    [[['name', '=', name]]],
  );

  for (const share of shares) {
    await callUntyped(client, 'sharing.smb.delete', [share.id]);
  }
}

/**
 * NFSv4 basic permission sets that allow more than reading.
 *
 * A share whose users can only read is a different product from one they can
 * write to, and the distinction is invisible in the share list.
 */
const writeCapablePerms = new Set(['FULL_CONTROL', 'MODIFY', 'READ_WRITE']);

interface AclEntry {
  tag: string;
  type: string;
  id: number;
  who?: string;
  perms?: { BASIC?: string };
}

/**
 * ACL entries that grant `username` write access to `path` by group membership.
 *
 * Answers the question a share is actually for: can this person use it? Creating
 * a share proves only that it exists — filesystem access is decided separately,
 * by the dataset ACL and the user's groups, and nothing in the UI shows whether
 * the two line up.
 *
 * Middleware has `filesystem.can_access_as_user`, which would answer this
 * outright, but it is `@private` and so not reachable over JSON-RPC. This
 * inspects group-derived grants instead, which is what the SMB preset relies
 * on: creating a user with TrueNAS and SMB access places them in
 * `builtin_administrators` and `builtin_users`, and the preset's ACL grants
 * those groups FULL_CONTROL and MODIFY respectively.
 *
 * Deliberately narrow. It does not evaluate `owner@`/`everyone@`, inheritance,
 * or DENY entries, so it is evidence of access rather than a permission engine —
 * reimplementing that logic here is how a test becomes confidently wrong. It
 * also does not prove SMB itself serves the share; that needs a real client.
 *
 * One more exclusion worth naming: `user.groups` is the *auxiliary* list, and
 * `user.group` holds the primary group separately. A grant to the primary group
 * alone would therefore look like no grant at all. That is fine while the SMB
 * preset works through `builtin_administrators` and `builtin_users`, which are
 * auxiliary — but if that ever changes, this reports a share as unusable when it
 * is not.
 */
export async function findGroupAclGrants(
  client: TrueNasApiClient,
  username: string,
  path: string,
): Promise<AclEntry[]> {
  const [user] = await callUntyped<{ groups: number[] }[]>(
    client,
    'user.query',
    [[['username', '=', username]]],
  );

  if (!user) {
    throw new Error(`Cannot check filesystem access: user "${username}" does not exist.`);
  }

  // `user.groups` holds group *ids*; ACL entries carry *gids*. Different keys.
  const groups = await callUntyped<{ gid: number; group: string }[]>(
    client,
    'group.query',
    [[['id', 'in', user.groups]]],
  );
  const gids = new Set(groups.map((group) => group.gid));

  const acl = await callUntyped<{ acl: AclEntry[] }>(
    client,
    'filesystem.getacl',
    [path, true, true],
  );

  return acl.acl.filter((entry) => (
    entry.tag === 'GROUP'
    && entry.type === 'ALLOW'
    && gids.has(entry.id)
    && writeCapablePerms.has(entry.perms?.BASIC ?? '')
  ));
}

/**
 * Returns the SMB service to stopped and not-auto-starting.
 *
 * Load-bearing for the fresh-install story, not mere tidiness. The app's
 * post-save dialogs branch on service state: stopped raises "Start SMB
 * Service", running raises "Restart SMB Service" instead. Leaving the service
 * running means the next run silently exercises a different path — and the
 * story's whole premise is a *fresh* instance, which a running, auto-starting
 * SMB service is not.
 *
 * The auto-start flag matters too: the start dialog's toggle defaults to on, so
 * a run that starts the service also enables it at boot.
 */
export async function ensureSmbServiceStopped(client: TrueNasApiClient): Promise<void> {
  const [cifs] = await callUntyped<{ id: number; state: string; enable: boolean }[]>(
    client,
    'service.query',
    [[['service', '=', 'cifs']]],
  );

  if (!cifs) {
    return;
  }

  if (cifs.enable) {
    await callUntyped(client, 'service.update', [cifs.id, { enable: false }]);
  }

  if (cifs.state !== 'RUNNING') {
    return;
  }

  await callUntyped(client, 'service.control', ['STOP', 'cifs', { silent: false }]);

  // `service.control` is a job, so the call returns before the service is down.
  await waitUntil(
    async () => {
      const [current] = await callUntyped<{ state: string }[]>(
        client,
        'service.query',
        [[['service', '=', 'cifs']]],
      );
      return current?.state !== 'RUNNING';
    },
    {
      timeoutMs: serviceStopTimeoutMs,
      message: 'SMB service did not stop; the next run will not start from a fresh state.',
    },
  );
}

/**
 * Exports and destroys a pool by name, if present. Succeeds when absent.
 *
 * `destroy: true` wipes the member disks so they return to the unused
 * inventory; `cascade` removes attachments (shares, tasks) that would otherwise
 * block the export.
 */
export async function ensurePoolAbsent(client: TrueNasApiClient, name: string): Promise<void> {
  const pool = await findPool(client, name);
  if (!pool) {
    return;
  }

  await callUntyped(client, 'pool.export', [
    pool.id,
    { cascade: true, restart_services: true, destroy: true },
  ]);

  // `pool.export` is a job, so the call returns before the work is done. Poll
  // the observable outcome rather than sleeping a guessed interval (R8.3).
  await waitUntil(
    async () => !(await findPool(client, name)),
    {
      timeoutMs: poolGoneTimeoutMs,
      message:
        `Pool "${name}" still present ${poolGoneTimeoutMs / 1000}s after export was requested. `
        + 'Its disks remain claimed and later runs will be short of inventory.',
    },
  );
}
