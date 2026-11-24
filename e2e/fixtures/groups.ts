/**
 * Group preconditions and cleanup, over the API.
 *
 * Same split as `fixtures/users.ts`: these never drive the UI, and a test must
 * not use them to perform the action it is testing (R3.1). They existed there
 * first, because the S3 and user journeys needed a group to name long before
 * groups had a suite of their own.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/**
 * A group as middleware reports it, with its two identity fields narrowed.
 *
 * The generated `group.query` result makes `id` and `gid` optional, so a queried record can't be passed to
 * `group.delete`, which wants a number. Same narrowing as `UserRecord` in `fixtures/users.ts`; everything the
 * specs assert on stays as the package describes it.
 */
type GroupEntry = Extract<CallResponse<E2eApiDirectory, 'group.query'>, unknown[]>[number];

export type GroupRecord = GroupEntry & { id: number; gid: number };

/**
 * The appliance's own record of a group, or undefined.
 *
 * `query`, not `queryOne`, for the reason `fixtures/users.ts` documents:
 * `queryOne` errors when nothing matches, and absence is the normal answer here.
 */
export async function findGroup(client: E2eApiClient, name: string): Promise<GroupRecord | undefined> {
  const [group] = await firstValueFrom(
    client.api.query('group.query', [['group', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return group as GroupRecord | undefined;
}

/** What a seeded group holds beyond its name. Each one defaults to what the add form would send untouched. */
export interface GroupSeedOptions {
  /** Wire values, so `['ALL']` is a group allowed every command — the form shows that as a checkbox. */
  sudoCommands?: string[];
  sudoCommandsNopasswd?: string[];
  smb?: boolean;
}

/**
 * Creates a local group if absent, with no members and no privileges.
 *
 * Deliberately: the list disables Delete for a group holding either (`isDeleteDisabled` in
 * `group-details-row.component.ts`), so a group made here is one a deletion test can drive; see
 * {@link setGroupMembers}. An existing group is left as it is, so callers clean up first.
 */
export async function ensureGroupPresent(
  client: E2eApiClient,
  name: string,
  options: GroupSeedOptions = {},
): Promise<void> {
  if (await findGroup(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('group.create', [{
      name,
      smb: options.smb ?? false,
      sudo_commands: options.sudoCommands ?? [],
      sudo_commands_nopasswd: options.sudoCommandsNopasswd ?? [],
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** Removes a group if present, by name. Succeeds when the group does not exist. */
export async function ensureGroupAbsent(client: E2eApiClient, name: string): Promise<void> {
  const existing = await findGroup(client, name);

  if (!existing) {
    return;
  }

  await firstValueFrom(
    client.api.call('group.delete', [existing.id]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Sets a group's membership outright, as a precondition.
 *
 * `group.users` holds auxiliary members too (confirmed on v27), and the list disables Delete whenever it is
 * non-empty, so a group seeded here can't be deleted in the UI until its members are removed.
 * @throws if the group does not exist, rather than silently setting nothing.
 */
export async function setGroupMembers(
  client: E2eApiClient,
  name: string,
  userIds: number[],
): Promise<void> {
  const group = await findGroup(client, name);

  if (!group) {
    throw new Error(`Cannot set members of group "${name}": it does not exist.`);
  }

  await firstValueFrom(
    client.api.call('group.update', [group.id, { users: userIds }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Sets how a group's GID is mapped into containers, over the API: `'DIRECT'` for
 * the same GID, a number for that container GID, `null` for no mapping. What the
 * Map User/Group IDs dialog's Set and Clear call, as setup or teardown.
 *
 * @throws if the group does not exist, rather than silently setting nothing.
 */
export async function setGroupIdmap(
  client: E2eApiClient,
  name: string,
  value: GroupRecord['userns_idmap'],
): Promise<void> {
  const group = await findGroup(client, name);

  if (!group) {
    throw new Error(`Cannot set the container ID mapping of group "${name}": it does not exist.`);
  }

  await firstValueFrom(
    client.api.call('group.update', [group.id, { userns_idmap: value }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
