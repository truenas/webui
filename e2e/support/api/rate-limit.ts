/**
 * Middleware's rate limit on unauthenticated calls, emptied before each test. Middleware allows 20 calls
 * per method per source IP per 60s; every page load spends a few, and the suite runs from one IP, so back-to-back
 * short tests hit `[EBUSY] Rate Limit Exceeded` on sign-in. Clearing gives each test the whole budget, as
 * middleware's own suite does (`test/integration/utils/client.py`). `rate.limit.cache_clear` is private, so the
 * connection opts in with `core.set_options`, and must again after every reconnect (a new connection).
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
 * Opts `client`'s connection in to private methods now and after every reconnect, for the client's lifetime.
 * `connection.opened` emits `true` on each socket open; `close()` ends the reconnects, so the subscription
 * needs no teardown. A clear landing between a reconnect and this call still works, with one logged warning.
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
