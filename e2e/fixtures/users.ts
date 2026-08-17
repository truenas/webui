/**
 * User preconditions and cleanup, over the API.
 *
 * These never drive the UI — that is what `flows/users.ts` is for. The split is
 * R3.1: a test must not use the API to perform the action it is testing, and
 * must not use the UI to establish state it merely depends on.
 */
import { TrueNasEndpoint, type TrueNasApiClient } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { callUntyped } from '../support/api/untyped';

const queryTimeoutMs = 30_000;

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
 * second username here. Tracked under "Hardening" in `docs/03-plan-and-status.md`.
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
export async function ensureUserAbsent(client: TrueNasApiClient, username: string): Promise<void> {
  // The element type is inferred from the call directory. It cannot be named —
  // the curated directory's `TrueNasUser` is internal to the package — but
  // inference gives it to us without a cast.
  const users = await firstValueFrom(
    client.api
      .call(TrueNasEndpoint.UserQuery, [[['username', '=', username]]])
      .pipe(timeout(queryTimeoutMs)),
  );

  const existing = users[0];
  if (!existing) {
    return;
  }

  // `user.delete` is absent from the client's curated directory — see
  // support/api/untyped.ts. Deletable once the full API surface lands.
  await callUntyped(client, 'user.delete', [existing.id, {}]);
}
