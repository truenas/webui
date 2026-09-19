/**
 * User preconditions and cleanup, over the API.
 *
 * These never drive the UI — that is what `flows/users.ts` is for. The split is
 * R3.1: a test must not use the API to perform the action it is testing, and
 * must not use the UI to establish state it merely depends on.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { ensureGroupAbsent, ensureGroupPresent, findGroup } from './groups';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/**
 * The administrator both unauthenticated journeys create, sign in as, and delete.
 *
 * One constant rather than the same literal in two specs, because it is one
 * identity: `admin-user.e2e.ts` and `fresh-install.e2e.ts` each remove this user
 * in `beforeEach` and `afterEach`, so two copies were two specs sharing state
 * while reading as though they did not.
 *
 * Fixed rather than run-scoped, which departs from R3.3. That holds under the
 * current execution model and only that one: runs are serial (`workers: 1`,
 * R3.4) against an appliance the run owns, and scaling out means sharding across
 * appliances rather than workers (D2). Two runs against a single appliance would
 * collide here — and equally on the `e2e_tank` pool and on SMB service state,
 * which is why the answer is run-scoped naming across the suite rather than a
 * second username here. Tracked under "Known gaps" in `docs/status.md`.
 */
export const testAdmin = {
  username: 'bob',
  /** Meets the appliance's complexity rules; not a credential of any real account. */
  password: 'Bob-E2E-Passw0rd!',
};

/**
 * Removes a user if present, by username. Succeeds when the user does not exist.
 *
 * Idempotent on purpose: it runs both before a test (so a leftover from an
 * interrupted run does not fail creation, R3.5) and after one (so the appliance
 * is left clean, R3.2).
 *
 * Takes an existing client rather than opening its own. Each connection costs a
 * sign-in, and middleware rate-limits *unauthenticated* calls at 20 per method
 * per IP per 60 seconds — so connections, not queries, are the scarce resource.
 * Connecting per call also modelled something no user does: signing in twice
 * just to delete an account.
 */
export async function ensureUserAbsent(client: E2eApiClient, username: string): Promise<void> {
  // `query`, not `queryOne`. `queryOne` sends `get: true`, and middleware
  // *errors* unless exactly one entry matches — so against the case this
  // function exists for, a user who is already absent, it rejects rather than
  // returning nothing. Filtering server-side and taking the first result keeps
  // absence an ordinary answer.
  const [existing] = await firstValueFrom(
    client.api
      .query('user.query', [['username', '=', username]])
      .pipe(timeout(readTimeoutMs)),
  );

  if (!existing) {
    return;
  }

  await firstValueFrom(
    client.api.call('user.delete', [existing.id]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * The appliance's own record of a user, or undefined.
 *
 * What a form test asserts against. The list showing a row says the screen
 * believed the save; this says the appliance did it, and carries the fields the
 * form never displays back — the uid it allocated, the primary group it made,
 * the roles it resolved.
 */
export async function findUser(
  client: E2eApiClient,
  username: string,
): Promise<UserRecord | undefined> {
  const [user] = await firstValueFrom(
    client.api.query('user.query', [['username', '=', username]]).pipe(timeout(readTimeoutMs)),
  );

  return user as UserRecord | undefined;
}

/**
 * A user record with its primary group and its id narrowed.
 *
 * Two fields, for two different reasons. `group` because the generated
 * `UserEntry` types it as an open record. `id` because the generated result
 * declares it optional, so a record read back out of a query cannot be handed
 * to anything that wants a number — which forced callers to re-check a field
 * every row certainly has. `fixtures/groups.ts` narrows `GroupRecord` the same
 * way and for the same reason; the two files should not answer this
 * differently.
 *
 * Nothing else is named here. Everything the specs read — `uid`, `roles`,
 * `locked` — the package already describes, and re-declaring those would
 * restate the API from memory while quietly promoting more optional fields.
 */
type UserEntry = Extract<CallResponse<E2eApiDirectory, 'user.query'>, unknown[]>[number];

export type UserRecord = UserEntry & { id: number; group: { bsdgrp_group: string } };

/**
 * Creates a plain local user if absent, for S3 to run as.
 *
 * The S3 bucket owner and access-key user pickers list non-builtin accounts
 * only, so a test that needs "some user" cannot fall back on root. The account
 * is a precondition, not the thing under test, so it is made over the API and
 * never through the user form.
 *
 * Password-disabled, on purpose: nothing signs in as it, and a password would be
 * one more secret to keep out of logs. S3 clients authenticate with an access
 * key, which the journey mints separately.
 */
export async function ensureUserPresent(
  client: E2eApiClient,
  username: string,
  options: { administrator?: boolean } = {},
): Promise<void> {
  const [existing] = await firstValueFrom(
    client.api
      .query('user.query', [['username', '=', username]])
      .pipe(timeout(readTimeoutMs)),
  );

  if (existing) {
    return;
  }

  // Roles come from group membership, and `builtin_administrators` carries
  // every one of them. An administrator here is an account that holds a role
  // a journey needs — SHARING_S3_WRITE for a bucket-managing key — not a
  // second sign-in; the account still cannot log in (password_disabled).
  const groups: number[] = [];
  if (options.administrator) {
    const [administrators] = await firstValueFrom(
      client.api.query('group.query', [['group', '=', 'builtin_administrators']]).pipe(timeout(readTimeoutMs)),
    );
    if (!administrators) {
      throw new Error('group.query returned no builtin_administrators row; cannot create an administrator.');
    }
    groups.push(administrators.id);
  }

  await firstValueFrom(
    client.api.call('user.create', [{
      username,
      full_name: `E2E ${username}`,
      group_create: true,
      groups,
      password_disabled: true,
      smb: false,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Two accounts the sign-in page must turn away. Both have working passwords —
 * these are the *authorization* refusals, not wrong credentials.
 *
 * `noPrivilege` gets `DENIED` from `auth.login_ex`; `noWebUiAccess` gets
 * `SUCCESS` with `webui_access: false`, so only the app refuses it. Confirmed
 * against a v27 appliance: `webui_access` is no input on `privilege.create`
 * and appears nowhere in the API types.
 */
export const refusedAccounts = {
  /** Can sign in; holds no privilege at all, so middleware refuses outright. */
  noPrivilege: {
    username: 'e2e_no_privilege',
    password: 'E2E-NoPriv-Passw0rd!',
  },
  /**
   * Can sign in; holds a privilege whose single role grants no UI access.
   *
   * `SHARING_SMB_WRITE` is chosen because it is unmistakably not an
   * administration role — it is the kind of grant a share-managing service
   * account would hold — so an appliance that started treating it as UI access
   * would be the thing worth failing on.
   */
  noWebUiAccess: {
    username: 'e2e_no_webui_access',
    password: 'E2E-NoUi-Passw0rd!',
    // Distinct from `username`: `user.create` runs with `group_create`, so an
    // identical name would leave two groups for the name-keyed lookups here.
    groupName: 'e2e_no_webui_access_grp',
    privilegeName: 'e2e_no_webui_access',
    role: 'SHARING_SMB_WRITE',
  },
} as const;

/**
 * Creates an account that can sign in and holds nothing.
 *
 * Unlike {@link ensureUserPresent} this one has a password: the whole point is
 * that it gets far enough to be refused for what it lacks rather than for who
 * it is.
 */
export async function ensureNoPrivilegeAccountPresent(client: E2eApiClient): Promise<void> {
  await ensureSignInCapableUser(client, refusedAccounts.noPrivilege.username, {
    password: refusedAccounts.noPrivilege.password,
    groups: [],
  });
}

/**
 * Creates an account middleware will authenticate and the UI must still refuse.
 *
 * Three objects in a chain — a group, a privilege naming that group and one
 * non-UI role, and a user in the group — because a privilege attaches to groups
 * rather than to users. {@link ensureRefusedAccountsAbsent} unwinds them in the
 * reverse order, which is the order that matters: a group cannot be deleted
 * while a privilege still names it.
 */
export async function ensureNoWebUiAccessAccountPresent(client: E2eApiClient): Promise<void> {
  const account = refusedAccounts.noWebUiAccess;

  await ensureGroupPresent(client, account.groupName);

  const group = await findGroup(client, account.groupName);
  if (!group) {
    throw new Error(`Group "${account.groupName}" was created but cannot be found, so the privilege has nothing to attach to.`);
  }

  const [existingPrivilege] = await firstValueFrom(
    client.api.query('privilege.query', [['name', '=', account.privilegeName]]).pipe(timeout(readTimeoutMs)),
  );

  if (!existingPrivilege) {
    await firstValueFrom(
      client.api.call('privilege.create', [{
        name: account.privilegeName,
        // `local_groups` takes gids, not the row ids `groups` on a user takes.
        // Passing the wrong one creates a privilege attached to some other
        // group, or to none, and the account then signs in perfectly well.
        local_groups: [group.gid],
        roles: [account.role],
        web_shell: false,
      }]).pipe(timeout(slowCallTimeoutMs)),
    );
  }

  await ensureSignInCapableUser(client, account.username, {
    password: account.password,
    groups: [group.id],
  });
}

/**
 * Removes both accounts and everything made for them.
 *
 * Unconditional and idempotent, and run before each test as well as after
 * (R3.2, R3.5). Order is user, then privilege, then group: middleware refuses
 * to delete a group a privilege still names, and the failure reads as a
 * permissions problem rather than an ordering one.
 */
export async function ensureRefusedAccountsAbsent(client: E2eApiClient): Promise<void> {
  const account = refusedAccounts.noWebUiAccess;

  await ensureUserAbsent(client, refusedAccounts.noPrivilege.username);
  await ensureUserAbsent(client, account.username);

  const [privilege] = await firstValueFrom(
    client.api.query('privilege.query', [['name', '=', account.privilegeName]]).pipe(timeout(readTimeoutMs)),
  );

  if (privilege?.id !== undefined) {
    await firstValueFrom(
      client.api.call('privilege.delete', [privilege.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }

  await ensureGroupAbsent(client, account.groupName);
}

/**
 * Creates a local user who can actually sign in, if absent.
 *
 * The counterpart to {@link ensureUserPresent}, which deliberately makes
 * password-disabled accounts because nothing signs in as them. These exist to
 * be signed in as, so they carry a password — and `smb: false` keeps them out
 * of the SMB user database, which nothing here needs them in.
 */
async function ensureSignInCapableUser(
  client: E2eApiClient,
  username: string,
  { password, groups }: { password: string; groups: number[] },
): Promise<void> {
  const [existing] = await firstValueFrom(
    client.api.query('user.query', [['username', '=', username]]).pipe(timeout(readTimeoutMs)),
  );

  if (existing) {
    return;
  }

  await firstValueFrom(
    client.api.call('user.create', [{
      username,
      full_name: `E2E ${username}`,
      password,
      group_create: true,
      groups,
      smb: false,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
