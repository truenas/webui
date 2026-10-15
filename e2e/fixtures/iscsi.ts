/**
 * iSCSI share preconditions, cleanup and readback, over the API.
 *
 * A share is several records that only mean something together: a target, an
 * extent, and the association between them, plus the portal and initiator group
 * the target's group points at. The wizard names all of them after the share — the
 * extent and target by `name`, the portal and initiator group by `comment` — so a
 * name is enough to find, and remove, everything one share made. The zvol behind
 * the extent is storage and is left to `fixtures/storage.ts`.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { ensureServiceStopped } from './services';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** Middleware's name for the iSCSI service. */
export const iscsiServiceName = 'iscsitarget';

/** Records as middleware reports them, with their ids narrowed — see `GroupRecord`. */
type TargetEntry = Extract<CallResponse<E2eApiDirectory, 'iscsi.target.query'>, unknown[]>[number];
type ExtentEntry = Extract<CallResponse<E2eApiDirectory, 'iscsi.extent.query'>, unknown[]>[number];
type TargetExtentEntry = Extract<CallResponse<E2eApiDirectory, 'iscsi.targetextent.query'>, unknown[]>[number];
type PortalEntry = Extract<CallResponse<E2eApiDirectory, 'iscsi.portal.query'>, unknown[]>[number];
type InitiatorEntry = Extract<CallResponse<E2eApiDirectory, 'iscsi.initiator.query'>, unknown[]>[number];

export type IscsiTargetRecord = TargetEntry & { id: number };
export type IscsiExtentRecord = ExtentEntry & { id: number };
export type IscsiTargetExtentRecord = TargetExtentEntry & { id: number };
export type IscsiPortalRecord = PortalEntry & { id: number };
export type IscsiInitiatorRecord = InitiatorEntry & { id: number };

/** The target with this name, or undefined. `query`, not `queryOne` — absence is an ordinary answer here. */
export async function findIscsiTarget(client: E2eApiClient, name: string): Promise<IscsiTargetRecord | undefined> {
  const [target] = await firstValueFrom(
    client.api.query('iscsi.target.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return target as IscsiTargetRecord | undefined;
}

/** The extent with this name, or undefined. */
export async function findIscsiExtent(client: E2eApiClient, name: string): Promise<IscsiExtentRecord | undefined> {
  const [extent] = await firstValueFrom(
    client.api.query('iscsi.extent.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return extent as IscsiExtentRecord | undefined;
}

/** Every extent associated with a target. */
export async function findIscsiTargetExtents(
  client: E2eApiClient,
  targetId: number,
): Promise<IscsiTargetExtentRecord[]> {
  const associations = await firstValueFrom(
    client.api.query('iscsi.targetextent.query', [['target', '=', targetId]]).pipe(timeout(readTimeoutMs)),
  );

  return associations as IscsiTargetExtentRecord[];
}

/** The portal with this id, or undefined. */
export async function findIscsiPortal(client: E2eApiClient, id: number): Promise<IscsiPortalRecord | undefined> {
  const [portal] = await firstValueFrom(
    client.api.query('iscsi.portal.query', [['id', '=', id]]).pipe(timeout(readTimeoutMs)),
  );

  return portal as IscsiPortalRecord | undefined;
}

/** How many targets the appliance holds — what the dashboard card lists. */
export async function countIscsiTargets(client: E2eApiClient): Promise<number> {
  const targets = await firstValueFrom(
    client.api.query('iscsi.target.query', []).pipe(timeout(readTimeoutMs)),
  );

  return targets.length;
}

/**
 * Removes everything a share named `name` consists of, if present: the target and
 * its associations, the extent, and the portal and initiator group the wizard
 * labels with the name. The zvol stays.
 *
 * Target first, because an extent or a portal still in use by one is refused.
 */
export async function ensureIscsiShareAbsent(client: E2eApiClient, name: string): Promise<void> {
  const target = await findIscsiTarget(client, name);
  if (target) {
    // force: a share left by an interrupted run may still look in use.
    await firstValueFrom(
      client.api.call('iscsi.target.delete', [target.id, true, true]).pipe(timeout(slowCallTimeoutMs)),
    );
  }

  const extent = await findIscsiExtent(client, name);
  if (extent) {
    // remove: false — for a zvol extent there is no file to remove, and the zvol
    // itself is the caller's to delete.
    await firstValueFrom(
      client.api.call('iscsi.extent.delete', [extent.id, false, true]).pipe(timeout(slowCallTimeoutMs)),
    );
  }

  const portals = await firstValueFrom(
    client.api.query('iscsi.portal.query', [['comment', '=', name]]).pipe(timeout(readTimeoutMs)),
  );
  for (const portal of portals) {
    await firstValueFrom(
      client.api.call('iscsi.portal.delete', [portal.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }

  const initiators = await firstValueFrom(
    client.api.query('iscsi.initiator.query', [['comment', '=', name]]).pipe(timeout(readTimeoutMs)),
  );
  for (const initiator of initiators) {
    await firstValueFrom(
      client.api.call('iscsi.initiator.delete', [initiator.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates a target with no portal group, if none has this name.
 *
 * For a bystander, which only has to exist and be listed. Never for the share
 * under test in a create — that one goes through the wizard.
 */
export async function ensureIscsiTargetPresent(client: E2eApiClient, name: string): Promise<IscsiTargetRecord> {
  const existing = await findIscsiTarget(client, name);
  if (existing) {
    return existing;
  }

  const created = await firstValueFrom(
    client.api.call('iscsi.target.create', [{ name, groups: [] }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return created as IscsiTargetRecord;
}

/**
 * Creates a target with one extent on an existing zvol, associated as LUN 0, if
 * no target has this name. The extent takes the same name.
 *
 * For the share a delete acts on. `zvol` is the dataset id, `pool/child`.
 */
export async function ensureIscsiSharePresent(
  client: E2eApiClient,
  { name, zvol }: { name: string; zvol: string },
): Promise<void> {
  if (await findIscsiTarget(client, name)) {
    return;
  }

  const extent = await ensureIscsiZvolExtentPresent(client, { name, zvol });
  const target = await ensureIscsiTargetPresent(client, name);

  await firstValueFrom(
    client.api.call('iscsi.targetextent.create', [{ target: target.id, extent: extent.id }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Creates an extent on an existing zvol, if none has this name. `zvol` is the
 * dataset id, `pool/child`; the description is left empty unless given.
 */
export async function ensureIscsiZvolExtentPresent(
  client: E2eApiClient,
  { name, zvol, comment = '' }: { name: string; zvol: string; comment?: string },
): Promise<IscsiExtentRecord> {
  const existing = await findIscsiExtent(client, name);
  if (existing) {
    return existing;
  }

  const created = await firstValueFrom(
    client.api.call('iscsi.extent.create', [{
      name,
      comment,
      type: 'DISK',
      disk: `zvol/${zvol}`,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return created as IscsiExtentRecord;
}

/**
 * Creates a File extent, if none has this name. Middleware makes the file at
 * `path` with `filesize` bytes, and the directories above it, when it is absent.
 * `filesize` must be a multiple of the 512-byte default block size.
 */
export async function ensureIscsiFileExtentPresent(
  client: E2eApiClient,
  { name, path, filesize }: { name: string; path: string; filesize: number },
): Promise<IscsiExtentRecord> {
  const existing = await findIscsiExtent(client, name);
  if (existing) {
    return existing;
  }

  const created = await firstValueFrom(
    client.api.call('iscsi.extent.create', [{
      name,
      type: 'FILE',
      path,
      filesize,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return created as IscsiExtentRecord;
}

/**
 * Creates a portal listening on every address, labelled with `comment`, if none
 * carries that label — for a target's group to point at.
 *
 * Middleware refuses an address another portal already listens on, so this
 * fails if a portal left by another spec still holds `0.0.0.0`.
 */
export async function ensureIscsiPortalPresent(client: E2eApiClient, comment: string): Promise<IscsiPortalRecord> {
  const [existing] = await firstValueFrom(
    client.api.query('iscsi.portal.query', [['comment', '=', comment]]).pipe(timeout(readTimeoutMs)),
  );
  if (existing) {
    return existing as IscsiPortalRecord;
  }

  const created = await firstValueFrom(
    client.api.call('iscsi.portal.create', [{ listen: [{ ip: '0.0.0.0' }], comment }])
      .pipe(timeout(slowCallTimeoutMs)),
  );

  return created as IscsiPortalRecord;
}

/** Creates an initiator group that allows every initiator, labelled with `comment`, if none carries that label. */
export async function ensureIscsiInitiatorPresent(
  client: E2eApiClient,
  comment: string,
): Promise<IscsiInitiatorRecord> {
  const [existing] = await firstValueFrom(
    client.api.query('iscsi.initiator.query', [['comment', '=', comment]]).pipe(timeout(readTimeoutMs)),
  );
  if (existing) {
    return existing as IscsiInitiatorRecord;
  }

  const created = await firstValueFrom(
    client.api.call('iscsi.initiator.create', [{ initiators: [], comment }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return created as IscsiInitiatorRecord;
}

/**
 * Returns the iSCSI service to stopped and not-auto-starting.
 *
 * Same reason as SMB's: the wizard's post-save prompt is raised only while the
 * service is stopped, so a service left running makes the next run exercise a
 * different path while still reporting green.
 */
export async function ensureIscsiServiceStopped(client: E2eApiClient): Promise<void> {
  await ensureServiceStopped(
    client,
    iscsiServiceName,
    'iSCSI service did not stop; the next run will not be offered the start prompt its saves expect.',
  );
}
