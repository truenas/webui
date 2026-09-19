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
 * The generated `group.query` result declares every field optional, `id` and
 * `gid` included — so a record read straight back out of it cannot be handed to
 * `group.delete`, which wants a number. The same narrowing `UserRecord` does in
 * `fixtures/users.ts`, and for the same reason: a row that came back from a
 * query has both, and re-declaring the rest here would restate the API from
 * memory. Everything the specs assert on — `users`, `roles`, `sudo_commands` —
 * stays exactly as the package describes it.
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

/**
 * Creates a plain local group if absent.
 *
 * No members, no privileges, no sudo commands — which is not incidental. The
 * list refuses to delete a group holding any of those (see
 * {@link setGroupMembers}), so a group made here is one a deletion test can
 * actually drive through the UI.
 */
export async function ensureGroupPresent(client: E2eApiClient, name: string): Promise<void> {
  if (await findGroup(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('group.create', [{ name, smb: false }]).pipe(timeout(slowCallTimeoutMs)),
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
 * `group.users` holds auxiliary members, not only the accounts whose *primary*
 * group this is — confirmed against a v27 appliance by adding a user with the
 * group as a secondary and reading the field back. That matters because the
 * list disables Delete whenever `users` is non-empty, so a group seeded here is
 * one the UI will not let go of until its members are taken off again.
 *
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
