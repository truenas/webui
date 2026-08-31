/**
 * Storage preconditions and cleanup, over the API.
 *
 * Teardown matters more here than anywhere else in the suite: a pool holds its
 * member disks until it is exported, so a leaked pool starves every later run
 * of the inventory it needs (R2.2, R3.2). That is the failure R3.2 exists to
 * prevent, and storage is where it actually bites.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/**
 * Deliberately longer than the old budget. The previous code returned as soon as
 * `pool.query` stopped listing the pool; this waits for the export *job* to
 * finish, and the `destroy: true` wipe of every member disk runs after the pool
 * row is gone. Nine disks is the width `fresh-install` builds, so the wait is
 * strictly longer than the condition it replaced and the ceiling moved with it.
 */
/**
 * Long because the job outlives the pool row: `destroy: true` wipes every member
 * disk after `pool.query` stops listing it, and `fresh-install` builds nine.
 *
 * Spendable only because `playwright.config.ts` budgets the per-test timeout to
 * cover two of these — cleanup runs in both hooks. Raise one and check the other.
 */
const poolExportTimeoutMs = 6 * 60_000;
const serviceControlTimeoutMs = 60_000;

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
 * Counting the raw endpoint passes this precondition while the wizard's own
 * inventory is smaller, or empty — the width option never renders and the run
 * dies on a 20 second action timeout instead. Assert against the source the UI
 * reads, not the one that sounds equivalent.
 */
async function getSelectableDisks(client: E2eApiClient): Promise<UnusedDisk[]> {
  // `disk.details` is typed, but only as `unknown[] | Record<string, unknown>` —
  // the dump does not describe its shape, so the narrowing has to happen here.
  const details = await firstValueFrom(
    client.api.call('disk.details', []).pipe(timeout(slowCallTimeoutMs)),
  ) as unknown as DiskDetails;

  return (details.unused ?? []).filter((disk) => (
    !disk.duplicate_serial?.length && !disk.exported_zpool
  ));
}

async function getUnusedDiskBuckets(client: E2eApiClient): Promise<DiskBucket[]> {
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
 * The largest bucket is the wrong question: 5x2TB + 9x4TB satisfies "9 alike"
 * while the wizard offers 2TB first, the width select tops out at 5, and
 * `option-width-data-9` never renders.
 *
 * The cost is a false negative on mixed inventory where a larger bucket would
 * have done. Worth taking: it fails in a second with the breakdown printed, the
 * appliances this suite targets are provisioned with identical virtual disks,
 * and the alternative is teaching the flow to pick a bucket by reconstructing
 * `buildNormalizedFileSize`'s label formatting — a second normalizer to keep in
 * step with the app, which is the trap `locators/test-id.ts` documents.
 */
export async function requireUnusedDisks(client: E2eApiClient, needed: number): Promise<void> {
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

async function findPool(client: E2eApiClient, name: string): Promise<NamedPool | undefined> {
  // `query` rather than `queryOne`: the latter sends `get: true`, which makes
  // middleware error when nothing matches. Every caller here treats "no such
  // pool" as a normal answer — `ensurePoolAbsent` succeeds when the pool is
  // already gone — so an absent pool must not throw.
  const [pool] = await firstValueFrom(
    client.api.query('pool.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return pool;
}

/**
 * Removes an SMB share by name, if present.
 *
 * Done before the pool is exported so the share is not left pointing at a path
 * that no longer exists.
 */
export async function ensureSmbShareAbsent(client: E2eApiClient, name: string): Promise<void> {
  const shares = await firstValueFrom(
    client.api
      .query('sharing.smb.query', [['name', '=', name]])
      .pipe(timeout(readTimeoutMs)),
  );

  for (const share of shares) {
    await firstValueFrom(
      client.api.call('sharing.smb.delete', [share.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/** An entry of an NFSv4 ACL, named from the library rather than hand-written. */
type Nfs4Ace = Extract<
  CallResponse<E2eApiDirectory, 'filesystem.getacl'>, { acltype: 'NFS4' }
>['acl'][number];

/**
 * NFSv4 basic permission sets that allow more than reading.
 *
 * A share whose users can only read is a different product from one they can
 * write to, and the distinction is invisible in the share list.
 *
 * These are the whole of `NfsBasicPermission` that imply write: the enum is
 * `FULL_CONTROL | MODIFY | READ | TRAVERSE`. `READ_WRITE` is POSIX vocabulary
 * and matches nothing here.
 */
const writeCapablePerms = new Set(['FULL_CONTROL', 'MODIFY']);

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
 * DENY entries, or advanced (bit-flag) permission sets, so it is evidence of
 * access rather than a permission engine —
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
  client: E2eApiClient,
  username: string,
  path: string,
): Promise<Nfs4Ace[]> {
  // `query`, not `queryOne` — see `findPool`. The explanatory error below is
  // the point of looking the user up at all, and `queryOne` would pre-empt it
  // with a raw middleware error.
  const [user] = await firstValueFrom(
    client.api
      .query('user.query', [['username', '=', username]])
      .pipe(timeout(readTimeoutMs)),
  );

  if (!user) {
    throw new Error(`Cannot check filesystem access: user "${username}" does not exist.`);
  }

  // `user.groups` holds group *ids*; ACL entries carry *gids*. Different keys.
  const groups = await firstValueFrom(
    client.api
      .query('group.query', [['id', 'in', user.groups]])
      .pipe(timeout(readTimeoutMs)),
  );
  const gids = new Set(groups.map((group) => group.gid));

  // The response is a discriminated union across the ACL flavours, so the
  // flavour is checked rather than assumed. This function only understands
  // NFSv4: a POSIX dataset carries no `perms.BASIC`, so every entry would be
  // filtered out and the caller would report "no write-capable group grant"
  // without mentioning why, and a dataset with ACLs disabled has `acl: null`,
  // which would throw a `TypeError` from the filter below instead of the
  // sentence the caller wrote.
  const acl = await firstValueFrom(
    client.api
      .call('filesystem.getacl', [path, true, true])
      .pipe(timeout(readTimeoutMs)),
  );

  if (acl.acltype !== 'NFS4') {
    throw new Error(
      `Cannot check filesystem access: "${path}" has ${acl.acltype} ACLs, and this check only `
      + 'understands NFSv4. The SMB dataset preset is what normally makes it NFSv4, so this '
      + 'means the dataset was not created the way the story assumes.',
    );
  }

  return acl.acl.filter((entry) => (
    entry.tag === 'GROUP'
    && entry.type === 'ALLOW'
    // `id` is nullable on the real type, and that is not noise: `owner@` and
    // `everyone@` entries carry no id. They are the first of the documented
    // exclusions above, and the type now enforces what the old hand-written
    // interface merely assumed.
    && entry.id != null
    && gids.has(entry.id)
    // `perms` is a union: an entry carries either a basic set or the advanced
    // bit flags. Only the basic form is read here, which is the third
    // documented exclusion — an advanced entry granting write is invisible to
    // this check. The SMB preset produces basic perms, so it holds for the
    // story; anything hand-edited would need the bits decoding.
    && 'BASIC' in entry.perms
    && writeCapablePerms.has(entry.perms.BASIC)
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
export async function ensureSmbServiceStopped(client: E2eApiClient): Promise<void> {
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
        .call('service.update', [cifs.id, { enable: false }])
        .pipe(timeout(slowCallTimeoutMs)),
    );
  }

  if (cifs.state !== 'RUNNING') {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('service.control', ['STOP', 'cifs', { silent: false }]),
    {
      timeoutMs: serviceControlTimeoutMs,
      whatItCosts: 'SMB service did not stop; the next run will not start from a fresh state.',
      confirm: async () => {
        const current = await querySmbService(client);
        return current !== undefined && current.state !== 'RUNNING';
      },
    },
  );
}

interface SmbServiceState {
  id: number;
  state: string;
  enable: boolean;
}

/** The `cifs` service row, or undefined when the query returns nothing. */
async function querySmbService(client: E2eApiClient): Promise<SmbServiceState | undefined> {
  // `query`, not `queryOne` — see `findPool`. An empty result has to be
  // representable here, because the caller distinguishes it from "stopped".
  const [cifs] = await firstValueFrom(
    client.api
      .query('service.query', [['service', '=', 'cifs']])
      .pipe(timeout(readTimeoutMs)),
  );

  return cifs;
}

/**
 * Exports and destroys a pool by name, if present. Succeeds when absent.
 *
 * `destroy: true` wipes the member disks so they return to the unused
 * inventory; `cascade` removes attachments (shares, tasks) that would otherwise
 * block the export.
 */
export async function ensurePoolAbsent(client: E2eApiClient, name: string): Promise<void> {
  const pool = await findPool(client, name);
  if (!pool) {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.export', [
      pool.id,
      { cascade: true, restart_services: true, destroy: true },
    ]),
    {
      timeoutMs: poolExportTimeoutMs,
      whatItCosts:
        `Pool "${name}" was not exported, so its disks remain claimed and later runs `
        + 'will be short of inventory.',
      // No `confirm` here, deliberately: this export has no side effect that is
      // true only once it has finished. The pool row disappears while the
      // `destroy: true` wipe is still running, and free-disk counts are absolute
      // rather than per-pool — an appliance with spares satisfies any threshold
      // before the export starts. Either would report a clean teardown mid-wipe
      // and leave `requireUnusedDisks` to fail confusingly on the next run.
      //
      // The cost is that a lost job record fails loudly after the full budget
      // instead of being waved through. That is the right way round, and it is
      // rare: records live in middlewared, and `restart_services` restarts the
      // sharing services, not middlewared itself.
    },
  );
}
