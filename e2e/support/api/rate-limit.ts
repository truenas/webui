/**
 * Middleware's rate limit on unauthenticated calls, emptied before each test.
 *
 * Middleware allows each unauthenticated method 20 calls per source IP per 60s,
 * in a fixed window (`RateLimitConfig` in middleware). Authenticated calls are
 * exempt, so what spends the budget is page loads: every load of the app opens
 * an unauthenticated socket and calls `system.advanced.login_banner`,
 * `user.has_local_administrator_set_up` and `truenas.managed_by_truecommand`
 * once each, and a signed-in load spends `auth.login_ex` on the token as well.
 * The whole suite runs from one IP, so short tests in a row — each one sign-in,
 * some with reloads on top — pass 20 loads a minute, and the next load meets
 * `[EBUSY] Rate Limit Exceeded` on the sign-in page.
 *
 * Emptying the cache before each test gives every test the whole budget for its
 * own sign-in and reloads, whatever the tests before it spent, so each one can
 * keep a fresh page of its own. Middleware's own integration suite resets the
 * same cache for the same reason (`test/integration/utils/client.py`).
 *
 * `rate.limit.cache_clear` is a private method, so it is not in the client's
 * typed directory. The connection opts in to private methods with
 * `core.set_options`, the documented way to call them; without it middleware
 * still answers but logs a warning per call. The option belongs to the
 * connection, and a reconnect is a new connection, so `enablePrivateMethods`
 * sets it again each time the socket opens.
 */
import {
  filter, firstValueFrom, type Observable, timeout,
} from 'rxjs';
import type { E2eApiClient } from './client';

const callTimeoutMs = 15_000;

/** `api.call` without the typed directory, for the one private method the suite calls. */
type UntypedCall = (method: string, params?: unknown[]) => Observable<unknown>;

/** Clients that have already reported a failed clear, so a run says it once per worker. */
const reportedClients = new WeakSet<E2eApiClient>();

/**
 * Opts `client`'s connection in to private methods now and after every
 * reconnect, for as long as the client lives.
 *
 * `connection.opened` holds the current state and emits `true` each time a
 * socket opens, which is how the client's own authenticator signs in again
 * after a reconnect. `close()` ends the reconnects, so the subscription needs no
 * teardown of its own. A clear that lands between a reconnect and this call
 * still works; middleware logs one warning for it.
 */
export function enablePrivateMethods(client: E2eApiClient): void {
  client.connection.opened.pipe(filter(Boolean)).subscribe(() => {
    client.api.call('core.set_options', [{ private_methods: true }]).subscribe({
      // Not fatal: without the option the clear still goes through, with a warning in middleware's log.
      error: () => undefined,
    });
  });
}

/**
 * Empties middleware's rate-limit cache. Never throws: a test that cannot clear
 * it may still stay under the limit, so a failure is reported and the test runs
 * on — a run whose clears fail meets `EBUSY` the way it did before this existed.
 */
export async function clearRateLimit(client: E2eApiClient): Promise<void> {
  try {
    const call = client.api.call.bind(client.api) as unknown as UntypedCall;
    await firstValueFrom(call('rate.limit.cache_clear').pipe(timeout(callTimeoutMs)));
  } catch (error) {
    if (!reportedClients.has(client)) {
      reportedClients.add(client);
      console.warn(
        'Could not clear the middleware rate-limit cache; sign-ins may meet [EBUSY] Rate Limit Exceeded. '
        + (error instanceof Error ? error.message : String(error)),
      );
    }
  }
}
