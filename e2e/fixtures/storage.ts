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

interface UnusedDisk {
  /** `DiskType` — `HDD` or `SSD`. */
  type: string;
  /** Bytes. */
  size: number;
  /** Non-empty when another disk reports the same serial. */
  duplicate_serial?: string[];
  /** Set when the disk still carries an exported pool. */
  exported_zpool?: string;
}

interface DiskDetails {
  unused: UnusedDisk[];
}

/**
 * Unused disks grouped the way the pool wizard groups them: by type and size.
 *
 * The grouping is not incidental. `getDiskTypeSizeMap` buckets the inventory by
 * `(type, size)`, the wizard's disk-size select offers one option per bucket, and
 * the width select's range is generated from the *selected* bucket's disk count
 * (`normal-selection.component.ts` reads `selectedDisks.length`). So the question
 * a precondition has to ask is not "are there N unused disks" but "are there N
 * unused disks that are alike".
 */
interface DiskBucket {
  type: string;
  size: number;
  count: number;
}

/**
 * The disks the pool wizard will actually offer.
 *
 * Not `disk.get_unused`, which is the obvious endpoint and the wrong one. The
 * wizard loads `disk.details` (`disk.store.ts`) and then runs the inventory
 * through `filterAllowedDisks`, which with the store's defaults —
 * `allowNonUniqueSerialDisks: false`, `allowExportedPools: []` — discards two
 * kinds of disk that `disk.get_unused` still reports:
 *
 * - anything with a non-empty `duplicate_serial`, which virtual disks acquire
 *   easily since hypervisors are happy to hand out blank or repeated serials;
 * - anything still carrying an `exported_zpool`.
 *
 * Counting the raw endpoint therefore let this precondition pass while the
 * wizard's own inventory was smaller, or empty — the width option would not
 * render and the run would die on the 20 second action timeout this function
 * exists to pre-empt. Third time the same lesson on this one helper: assert
 * against the source the UI reads, not the one that sounds equivalent.
 */
async function getSelectableDisks(client: TrueNasApiClient): Promise<UnusedDisk[]> {
  const details = await callUntyped<DiskDetails>(client, 'disk.details', []);

  return (details.unused ?? []).filter((disk) => (
    !disk.duplicate_serial?.length && !disk.exported_zpool
  ));
}

async function getUnusedDiskBuckets(client: TrueNasApiClient): Promise<DiskBucket[]> {
  const disks = await getSelectableDisks(client);

  const byKey = new Map<string, DiskBucket>();
  for (const disk of disks) {
    const key = `${disk.type} ${disk.size}`;
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.count += 1;
    } else {
      byKey.set(key, { type: disk.type, size: disk.size, count: 1 });
    }
  }

  // Ordered exactly as the select orders its options: `[...hddOptions,
  // ...ssdOptions]` then a stable sort on size ascending. The tie-break is not
  // cosmetic — with an HDD and an SSD bucket of the same size, the app offers
  // the HDD first, so that is the bucket the flow lands on and the one whose
  // count decides whether the run can work.
  return [...byKey.values()].sort((a, b) => (
    a.size - b.size || typeOrder(a.type) - typeOrder(b.type)
  ));
}

/** HDD options are built before SSD options, and the size sort is stable. */
function typeOrder(type: string): number {
  return type === 'HDD' ? 0 : 1;
}

/**
 * Fails fast when the appliance cannot support the test, naming the shortfall.
 *
 * Without this, too few disks surfaces as the width control silently not
 * offering the value the test picks — a confusing mid-wizard failure rather
 * than a clear precondition error (R2.2).
 *
 * Checks **the smallest type-and-size bucket**, which is a stronger condition
 * than it first looks and is the one that actually matches the flow. Two facts
 * combine:
 *
 * - the wizard generates the width options from the *selected* bucket alone
 *   (`normal-selection.component.ts` reads `selectedDisks.length`), so the
 *   inventory total is the wrong question; and
 * - `disk-size-selects.component.ts` sorts the options
 *   `(a, b) => a.value.size - b.value.size`, so the first option is the
 *   *smallest* size — and `createRaidz2Pool` takes the first.
 *
 * Checking the largest bucket, as an earlier revision did, therefore passes on
 * inventory the flow cannot use: 5x2TB + 9x4TB satisfies "9 alike", the wizard
 * offers 2TB first, the width select tops out at 5, `option-width-data-9` never
 * renders, and the run dies on a 20 second action timeout inside the wizard —
 * exactly the failure this function exists to replace with a sentence.
 *
 * The cost is a false negative on mixed inventory where a *larger* bucket would
 * have done. That is worth taking: it fails in a second with the breakdown
 * printed, the appliances this suite targets are provisioned with identical
 * virtual disks anyway, and the alternative is teaching the flow to pick a
 * bucket by reconstructing `buildNormalizedFileSize`'s label formatting — a
 * second normalizer to keep in step with the app, which is the trap
 * `locators/test-id.ts` already documents.
 */
export async function requireUnusedDisks(client: TrueNasApiClient, needed: number): Promise<void> {
  const buckets = await getUnusedDiskBuckets(client);

  // The first bucket is the one the select offers first, and therefore the one
  // `createRaidz2Pool` selects.
  const [selected] = buckets;
  if (selected && selected.count >= needed) {
    return;
  }

  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const breakdown = buckets.length
    ? buckets.map((bucket) => `${bucket.count} x ${bucket.type} ${bucket.size}`).join(', ')
    : 'none';

  throw new Error(
    `This test needs ${needed} unused disks of one type and size. The pool wizard offers the `
    + `smallest size first and this flow takes it, and that set has ${selected?.count ?? 0} `
    + `(${total} unused in total: ${breakdown}). A larger set elsewhere in the list does not `
    + 'help — the width options come from the selected size alone. Either a previous run leaked '
    + 'a pool, or the VM was provisioned with disks that are not all alike.',
  );
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
 *
 * These are the whole of `NfsBasicPermission` that imply write: the enum is
 * `FULL_CONTROL | MODIFY | READ | TRAVERSE`. An earlier revision also listed
 * `READ_WRITE`, which is POSIX vocabulary and could never match anything.
 */
const writeCapablePerms = new Set(['FULL_CONTROL', 'MODIFY']);

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
  const cifs = await querySmbService(client);

  // Not `return` on empty. That is the inference the polling guard below exists
  // to reject, and it is no safer here: TrueNAS always has a `cifs` row, so an
  // empty result means the query did not answer properly, not that there is no
  // service to stop. Returning quietly would skip the teardown that keeps the
  // next run honest — and the whole point of this fixture is that a leftover
  // running service makes the following run exercise a different dialog while
  // still reporting green.
  if (!cifs) {
    throw new Error(
      'service.query returned no `cifs` row. Every TrueNAS appliance has one, so this is a '
      + 'failed query rather than an absent service — treating it as "nothing to stop" would '
      + 'leave SMB running and silently change what the next run tests.',
    );
  }

  if (cifs.enable) {
    await firstValueFrom(
      client.api
        .call(TrueNasEndpoint.ServiceUpdate, [cifs.id, { enable: false }])
        .pipe(timeout(queryTimeoutMs)),
    );
  }

  if (cifs.state !== 'RUNNING') {
    return;
  }

  // The one call here that cannot be typed. `service.control`'s first parameter
  // is `ServiceControlAction`, a string enum the package declares but does not
  // export — so the literal `'STOP'` is rejected and there is no way to obtain
  // the value the signature demands. Same packaging gap as `AuthResponseType`
  // in `support/api/client.ts`; both are recorded in `docs/status.md`.
  await callUntyped(client, 'service.control', ['STOP', 'cifs', { silent: false }]);

  // `service.control` is a job, so the call returns before the service is down.
  await waitUntil(
    async () => {
      const current = await querySmbService(client);

      // `undefined` means the query came back empty, not that the service
      // stopped. That happens transiently across the reconnect a service
      // restart causes, and reading it as "stopped" would return while SMB is
      // still running — after which the next run meets the "Restart SMB
      // Service" dialog instead of "Start", `button-enable-service` never
      // renders, and a 90 second timeout is the first anyone hears of it.
      return current !== undefined && current.state !== 'RUNNING';
    },
    {
      timeoutMs: serviceStopTimeoutMs,
      message: 'SMB service did not stop; the next run will not start from a fresh state.',
    },
  );
}

interface SmbServiceState {
  id: number;
  state: string;
  enable: boolean;
}

/**
 * The `cifs` service row, or undefined when the query returns nothing.
 *
 * Typed rather than routed through `callUntyped`: `service.query` and
 * `service.update` are both in the client's curated directory, and `untyped.ts`
 * is explicit that the escape hatch is for genuine gaps only. The response still
 * needs narrowing because the directory types it as a union covering counts and
 * single entries as well as arrays — the same shape `findPool` deals with.
 * `service.control` is in the directory too but cannot be called this way; see
 * the note at its call site.
 */
async function querySmbService(client: TrueNasApiClient): Promise<SmbServiceState | undefined> {
  const services = await firstValueFrom(
    client.api
      .call(TrueNasEndpoint.ServiceQuery, [[['service', '=', 'cifs']]])
      .pipe(timeout(queryTimeoutMs)),
  );

  return (services as unknown as SmbServiceState[])[0];
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
