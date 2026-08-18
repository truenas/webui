/**
 * User preconditions and cleanup, over the API.
 *
 * These never drive the UI — that is what `flows/users.ts` is for. The split is
 * R3.1: a test must not use the API to perform the action it is testing, and
 * must not use the UI to establish state it merely depends on.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
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
