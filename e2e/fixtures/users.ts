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
