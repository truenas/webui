/**
 * Storage preconditions and cleanup, over the API.
 *
 * Teardown matters more here than anywhere else in the suite: a pool holds its
 * member disks until it is exported, so a leaked pool starves every later run
 * of the inventory it needs (R2.2, R3.2). That is the failure R3.2 exists to
 * prevent, and storage is where it actually bites.
 */
import type { CallResponse, QueryEntity } from '@truenas/api-client';
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

interface NamedPool {
  id: number;
  name: string;
  /** `ONLINE` for a healthy imported pool. */
  status: string;
}

export interface UnusedDisk {
  name: string;
  /** Device name, `sdb` — what the wizard's `topologyToPayload` puts in a vdev's `disks`. */
  devname: string;
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
 * Unused disks grouped as the pool wizard groups them: by type and size.
 *
 * `getDiskTypeSizeMap` buckets by `(type, size)`, the disk-size select offers one option per bucket, and the width
 * range comes from the *selected* bucket's count (`selectedDisks.length` in `normal-selection.component.ts`). So a
 * precondition must ask for N unused disks that are alike, not just N unused disks.
 */
export interface DiskBucket {
  type: string;
  size: number;
  count: number;
}

/**
 * The disks the pool wizard will actually offer.
 *
 * Not `disk.get_unused`: the wizard loads `disk.details` and runs `filterAllowedDisks` with the store's defaults,
 * dropping disks with a non-empty `duplicate_serial` (common on hypervisors) or an `exported_zpool`. Counting the
 * raw endpoint passes this precondition while the wizard's inventory is smaller or empty, and the run dies on an
 * action timeout. Assert against the source the UI reads.
 */
export async function getSelectableDisks(client: E2eApiClient): Promise<UnusedDisk[]> {
  // `disk.details` is typed, but only as `unknown[] | Record<string, unknown>` —
  // the dump does not describe its shape, so the narrowing has to happen here.
  const details = await firstValueFrom(
    client.api.call('disk.details', []).pipe(timeout(slowCallTimeoutMs)),
  ) as unknown as DiskDetails;

  return (details.unused ?? []).filter((disk) => (
    !disk.duplicate_serial?.length && !disk.exported_zpool
  ));
}

/** The wizard's disk-size buckets, in the order its Disk Size select offers them. */
export async function getUnusedDiskBuckets(client: E2eApiClient): Promise<DiskBucket[]> {
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
 * Fails fast, naming the shortfall, when the appliance has too few alike disks, instead of a confusing mid-wizard
 * failure (R2.2). Checks **the smallest type-and-size bucket**: width options come from the *selected* bucket
 * (`selectedDisks.length`), and `disk-size-selects.component.ts` sorts by size so the first option, which
 * `createRaidz2Pool` takes, is the smallest (5x2TB + 9x4TB fails 9-wide). A false negative on mixed inventory is
 * accepted: suite appliances use identical disks, and picking a bucket would mean re-implementing
 * `buildNormalizedFileSize`'s labels, the trap `locators/test-id.ts` documents.
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

/** The first size the wizard offers, and the next larger size of the same type. */
export interface TwoDiskSizes {
  smaller: DiskBucket;
  larger: DiskBucket;
}

/**
 * The first bucket the Disk Size select offers and the next larger bucket of the same type, or undefined.
 *
 * Same type because "Treat Disk Size as Minimum" widens only within the selected type
 * (`GroupedDisks.findSuitableDisks`); a larger disk of another type shows the checkbox but ticking it changes
 * nothing. Undefined rather than a throw: specs skip without two sizes, and identical disks aren't a fault.
 */
export async function findTwoDiskSizes(client: E2eApiClient): Promise<TwoDiskSizes | undefined> {
  const [smaller, ...others] = await getUnusedDiskBuckets(client);
  const larger = others.find((bucket) => bucket.type === smaller?.type && bucket.size > smaller.size);

  return smaller && larger ? { smaller, larger } : undefined;
}

export async function findPool(client: E2eApiClient, name: string): Promise<NamedPool | undefined> {
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
 * The part of a pool's `scan` a scrub journey reads.
 *
 * On a pool that has never been scanned, `function` and `state` are null, or the
 * scan itself is. Otherwise `function` is `SCRUB` or `RESILVER` and `state` is
 * `SCANNING`, `FINISHED` or `CANCELED`, as in webui's `PoolScanFunction` and
 * `PoolScanState`.
 */
export interface PoolScan {
  function: string | null;
  state: string | null;
  errors: number | null;
  /** When the scan began. A new scan of the same kind is told apart from the last one by this. */
  start_time: { $date: number } | null;
}

/** A pool's last or current scan, or `null` when it has none. Throws when the pool is absent. */
export async function findPoolScan(client: E2eApiClient, name: string): Promise<PoolScan | null> {
  const [pool] = await firstValueFrom(
    client.api.query('pool.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  if (!pool) {
    throw new Error(`Cannot read the scan of pool "${name}": there is no such pool.`);
  }

  // Narrowed to the fields read here, so a caller compares plain values
  // rather than depending on how the dump types the rest of the scan.
  return pool.scan as unknown as PoolScan | null;
}

/** An entry of an NFSv4 ACL, named from the library rather than hand-written. */
export type Nfs4Ace = Extract<
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
 * ACL entries that grant `username` write access to `path` by group membership: evidence the share is usable.
 *
 * `filesystem.can_access_as_user` is `@private`, so this checks the group grants the SMB preset relies on
 * (`builtin_administrators` FULL_CONTROL, `builtin_users` MODIFY). Deliberately narrow, not a permission engine:
 * no `owner@`, `everyone@`, inheritance, DENY or advanced sets, and no proof SMB serves it. It reads only the
 * auxiliary `user.groups`, so a grant to the primary group alone would read as none.
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

  // Only NFSv4 is understood, so the flavour is checked: a POSIX dataset has no `perms.BASIC` and would yield
  // "no write-capable group grant" without saying why, and `acl: null` (ACLs off) would throw a `TypeError`
  // from the filter instead of the caller's message.
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
 * Exports and destroys a pool by name, if present. Succeeds when absent.
 *
 * `destroy: true` wipes the member disks so they return to the unused
 * inventory; `cascade` removes attachments (shares, tasks) that would otherwise
 * block the export.
 *
 * Absent is tolerated *after* the query as well as before it — see the comment
 * on the catch below.
 */
export async function ensurePoolAbsent(client: E2eApiClient, name: string): Promise<void> {
  const pool = await findPool(client, name);
  if (!pool) {
    return;
  }

  try {
    await exportPool(client, pool.id, name);
  } catch (error) {
    // A journey whose subject *is* disconnecting a pool has an export in
    // flight when this runs, so the pool can go between the query above and
    // this one — middleware then fails the job with `[ENOENT] … does not
    // exist`. Re-ask rather than pattern-match the message: the pool being
    // gone is the state this function exists to reach, however it got there.
    // Anything else, including an export that genuinely failed, still throws.
    if (await findPool(client, name)) {
      throw error;
    }
  }
}

async function exportPool(client: E2eApiClient, id: number, name: string): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.export', [
      id,
      { cascade: true, restart_services: true, destroy: true },
    ]),
    {
      timeoutMs: poolExportTimeoutMs,
      whatItCosts:
        `Pool "${name}" was not exported, so its disks remain claimed and later runs `
        + 'will be short of inventory.',
      // No `confirm` here, deliberately: nothing is true only once this export has finished. The pool row goes
      // while the `destroy: true` wipe still runs, and free-disk counts may already pass, so either would call
      // teardown clean mid-wipe and break `requireUnusedDisks` next run. A lost job record fails loudly after the
      // full budget instead, which is rare: `restart_services` restarts sharing services, not middlewared.
    },
  );
}

/** One row of `pool.dataset.query`, typed from the client's own directory. */
export type DatasetEntry = QueryEntity<E2eApiDirectory['call'], 'pool.dataset.query'>;

/**
 * A dataset or zvol by its full name (`pool/child`), or undefined when absent.
 *
 * `query`, not `queryOne` — absence is the ordinary answer here, and `queryOne`
 * errors rather than returning nothing (see `CLAUDE.md`, "Talking to
 * middleware").
 */
export async function findDataset(
  client: E2eApiClient,
  name: string,
): Promise<DatasetEntry | undefined> {
  const [dataset] = await firstValueFrom(
    client.api.query('pool.dataset.query', [['id', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return dataset;
}

/** The two fields of a `pool.dataset.query` row that {@link findMixedAclChildren} reads. */
interface DatasetAclType {
  id: string;
  acltype?: { value?: string } | null;
}

/**
 * The datasets under `pool` whose ACL type is not the pool root's.
 *
 * Middleware refuses an SMB share whose path holds one ("ACL type mismatch with
 * child mountpoint"), so a share on the pool root can be made only while this
 * is empty. Filesystems only: a zvol is never mounted and has no ACL type.
 */
export async function findMixedAclChildren(client: E2eApiClient, pool: string): Promise<string[]> {
  // Narrowed to the two fields read here, as `findPoolScan` does with the scan.
  const datasets = await firstValueFrom(
    client.api
      .query('pool.dataset.query', [['pool', '=', pool], ['type', '=', 'FILESYSTEM']])
      .pipe(timeout(readTimeoutMs)),
  ) as unknown as DatasetAclType[];
  const rootAclType = datasets.find((dataset) => dataset.id === pool)?.acltype?.value;

  return datasets
    .filter((dataset) => dataset.id !== pool && dataset.acltype?.value !== rootAclType)
    .map((dataset) => dataset.id);
}

/** The full names of every zvol anywhere below `parent`, a dataset by full name. */
export async function listZvolsUnder(client: E2eApiClient, parent: string): Promise<string[]> {
  const [pool] = parent.split('/');
  const zvols = await firstValueFrom(
    client.api
      .query('pool.dataset.query', [['pool', '=', pool], ['type', '=', 'VOLUME']])
      .pipe(timeout(readTimeoutMs)),
  );

  return zvols
    .map((zvol) => zvol.id ?? '')
    .filter((id) => id.startsWith(`${parent}/`));
}

/** Creates a plain filesystem dataset by full name (`pool/name`) if absent. */
export async function ensureDatasetPresent(client: E2eApiClient, name: string): Promise<void> {
  if (await findDataset(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('pool.dataset.create', [{ name, type: 'FILESYSTEM' }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Creates a dataset with the SMB preset by full name if absent.
 *
 * The preset makes the dataset NFSv4 and gives it a non-trivial ACL. That
 * matters to the ACL editor: it offers a preset picker first for a trivial ACL,
 * and opens straight onto the entries for anything else.
 */
export async function ensureSmbDatasetPresent(client: E2eApiClient, name: string): Promise<void> {
  if (await findDataset(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api
      .call('pool.dataset.create', [{ name, type: 'FILESYSTEM', share_type: 'SMB' }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Creates a dataset with the given ACL type by full name if absent.
 *
 * With no share type its ACL is trivial, so the Permissions card's Edit opens
 * the Unix editor and the ACL editor opens on its preset picker. The aclmode is
 * the one middleware accepts for each type: it refuses POSIX with anything but
 * `DISCARD`, and NFSv4 with `DISCARD`.
 */
export async function ensureAclDatasetPresent(
  client: E2eApiClient,
  name: string,
  acltype: 'NFSV4' | 'POSIX',
): Promise<void> {
  if (await findDataset(client, name)) {
    return;
  }

  const aclmode = acltype === 'NFSV4' ? 'PASSTHROUGH' : 'DISCARD';
  await firstValueFrom(
    client.api
      .call('pool.dataset.create', [{
        name, type: 'FILESYSTEM', acltype, aclmode,
      }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Creates a zvol by full name if absent.
 *
 * Sparse and small: nothing here writes to it, and a thick 64MiB volume would
 * reserve that much from a pool the suite may have built from a single disk.
 * The size is the smallest ZFS accepts comfortably at the default block size.
 */
export async function ensureZvolPresent(client: E2eApiClient, name: string): Promise<void> {
  if (await findDataset(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api
      .call('pool.dataset.create', [{
        name, type: 'VOLUME', volsize: 64 * 1024 * 1024, sparse: true,
      }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Deletes a dataset or zvol and everything under it, if present.
 *
 * `force` because a zvol the UI displayed can stay briefly held after its page is gone. Already-gone is tolerated
 * after the query too: a UI-driven delete may still be in flight, so middleware can answer `[ENOENT] … not found`,
 * and reporting that would bury what the test was saying. Anything else still throws.
 */
export async function ensureDatasetAbsent(client: E2eApiClient, name: string): Promise<void> {
  if (!await findDataset(client, name)) {
    return;
  }

  try {
    await firstValueFrom(
      client.api
        .call('pool.dataset.delete', [name, { recursive: true, force: true }])
        .pipe(timeout(slowCallTimeoutMs)),
    );
  } catch (error) {
    // Same race as `ensurePoolAbsent`, and answered the same way: a UI-driven
    // deletion can remove the row between the query above and this call.
    if (await findDataset(client, name)) {
      throw error;
    }
  }
}

/** Where a dataset is mounted, which is what a share points at. */
export function datasetMountPath(datasetName: string): string {
  return `/mnt/${datasetName}`;
}
