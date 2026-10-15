/**
 * iSCSI portals, initiator groups, authorized access and the global target
 * configuration: preconditions, cleanup and readback, over the API.
 *
 * Portals and initiator groups have no name, so a test labels each with a
 * `comment` and finds it by that. Authorized access entries are found by their
 * `user`. The global configuration is one record, so there is nothing to create
 * or delete — a test reads it first and writes back what it read.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { IscsiPortalRecord } from './iscsi';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type InitiatorEntry = Extract<CallResponse<E2eApiDirectory, 'iscsi.initiator.query'>, unknown[]>[number];
type AuthEntry = Extract<CallResponse<E2eApiDirectory, 'iscsi.auth.query'>, unknown[]>[number];
type GlobalConfig = CallResponse<E2eApiDirectory, 'iscsi.global.config'>;

export type IscsiInitiatorGroupRecord = InitiatorEntry & { id: number };
export type IscsiAuthorizedAccessRecord = AuthEntry & { id: number };

/** The part of the global configuration a test changes, and the part it must leave alone. */
export type IscsiGlobalSettings = Pick<
  GlobalConfig,
  'basename' | 'listen_port' | 'isns_servers' | 'pool_avail_threshold'
>;

/** Every portal carrying this comment. */
export async function findIscsiPortalsByComment(client: E2eApiClient, comment: string): Promise<IscsiPortalRecord[]> {
  const portals = await firstValueFrom(
    client.api.query('iscsi.portal.query', [['comment', '=', comment]]).pipe(timeout(readTimeoutMs)),
  );

  return portals as IscsiPortalRecord[];
}

/**
 * Creates a portal listening on `ip`, labelled with `comment`, if none carries
 * that label. Middleware refuses an address another portal already listens on,
 * so two portals made here need two addresses — `0.0.0.0` and `::` are always
 * offered.
 */
export async function ensureIscsiPortalPresent(
  client: E2eApiClient,
  { comment, ip }: { comment: string; ip: string },
): Promise<IscsiPortalRecord> {
  const [existing] = await findIscsiPortalsByComment(client, comment);
  if (existing) {
    return existing;
  }

  const created = await firstValueFrom(
    client.api.call('iscsi.portal.create', [{ listen: [{ ip }], comment }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return created as IscsiPortalRecord;
}

/** Removes every portal carrying this comment. */
export async function ensureIscsiPortalsAbsent(client: E2eApiClient, comment: string): Promise<void> {
  for (const portal of await findIscsiPortalsByComment(client, comment)) {
    await firstValueFrom(client.api.call('iscsi.portal.delete', [portal.id]).pipe(timeout(slowCallTimeoutMs)));
  }
}

/** The initiator group with this id, or undefined. */
export async function findIscsiInitiatorGroup(
  client: E2eApiClient,
  id: number,
): Promise<IscsiInitiatorGroupRecord | undefined> {
  const [group] = await firstValueFrom(
    client.api.query('iscsi.initiator.query', [['id', '=', id]]).pipe(timeout(readTimeoutMs)),
  );

  return group as IscsiInitiatorGroupRecord | undefined;
}

/** Every initiator group carrying this comment. */
export async function findIscsiInitiatorGroupsByComment(
  client: E2eApiClient,
  comment: string,
): Promise<IscsiInitiatorGroupRecord[]> {
  const groups = await firstValueFrom(
    client.api.query('iscsi.initiator.query', [['comment', '=', comment]]).pipe(timeout(readTimeoutMs)),
  );

  return groups as IscsiInitiatorGroupRecord[];
}

/** Creates an initiator group allowing these IQNs, labelled with `comment`, if none carries that label. */
export async function ensureIscsiInitiatorGroupPresent(
  client: E2eApiClient,
  { comment, initiators }: { comment: string; initiators: string[] },
): Promise<IscsiInitiatorGroupRecord> {
  const [existing] = await findIscsiInitiatorGroupsByComment(client, comment);
  if (existing) {
    return existing;
  }

  const created = await firstValueFrom(
    client.api.call('iscsi.initiator.create', [{ initiators, comment }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return created as IscsiInitiatorGroupRecord;
}

/** Removes every initiator group carrying this comment. */
export async function ensureIscsiInitiatorGroupsAbsent(client: E2eApiClient, comment: string): Promise<void> {
  for (const group of await findIscsiInitiatorGroupsByComment(client, comment)) {
    await firstValueFrom(client.api.call('iscsi.initiator.delete', [group.id]).pipe(timeout(slowCallTimeoutMs)));
  }
}

/** The authorized access entry for this user, or undefined. */
export async function findIscsiAuthorizedAccess(
  client: E2eApiClient,
  user: string,
): Promise<IscsiAuthorizedAccessRecord | undefined> {
  const [entry] = await firstValueFrom(
    client.api.query('iscsi.auth.query', [['user', '=', user]]).pipe(timeout(readTimeoutMs)),
  );

  return entry as IscsiAuthorizedAccessRecord | undefined;
}

/**
 * Creates a CHAP entry for this user, if there is none, with no peer and no
 * discovery authentication. `secret` must be 12 to 16 characters.
 */
export async function ensureIscsiAuthorizedAccessPresent(
  client: E2eApiClient,
  { tag, user, secret }: { tag: number; user: string; secret: string },
): Promise<IscsiAuthorizedAccessRecord> {
  const existing = await findIscsiAuthorizedAccess(client, user);
  if (existing) {
    return existing;
  }

  const created = await firstValueFrom(
    client.api.call('iscsi.auth.create', [{
      tag,
      user,
      secret,
      discovery_auth: 'NONE',
    }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return created as IscsiAuthorizedAccessRecord;
}

/**
 * Removes the authorized access entry for this user, if present. Middleware
 * refuses only the last entry of a group a target uses, and no target here uses one.
 */
export async function ensureIscsiAuthorizedAccessAbsent(client: E2eApiClient, user: string): Promise<void> {
  const entry = await findIscsiAuthorizedAccess(client, user);
  if (entry) {
    await firstValueFrom(client.api.call('iscsi.auth.delete', [entry.id]).pipe(timeout(slowCallTimeoutMs)));
  }
}

/** The global settings as the appliance holds them. */
export async function readIscsiGlobalSettings(client: E2eApiClient): Promise<IscsiGlobalSettings> {
  const config = await firstValueFrom(client.api.call('iscsi.global.config').pipe(timeout(readTimeoutMs)));

  return {
    basename: config.basename,
    listen_port: config.listen_port,
    isns_servers: config.isns_servers,
    pool_avail_threshold: config.pool_avail_threshold,
  };
}

/**
 * Writes back the two settings a test changes. Never the base name or the listen
 * port, which no test changes: the base name is part of every target's IQN, so a
 * restore that got it wrong would rename them all.
 */
export async function restoreIscsiGlobalSettings(
  client: E2eApiClient,
  settings: Pick<IscsiGlobalSettings, 'isns_servers' | 'pool_avail_threshold'>,
): Promise<void> {
  await firstValueFrom(
    client.api.call('iscsi.global.update', [{
      isns_servers: settings.isns_servers,
      pool_avail_threshold: settings.pool_avail_threshold,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
