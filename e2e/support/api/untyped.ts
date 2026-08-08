/**
 * Escape hatch for middleware methods absent from the client's typed surface.
 *
 * `@truenas/api-client`'s `TrueNasApi.call()` is generic over a hand-curated
 * `ApiCallDirectory` of ~65 endpoints inherited from TrueNAS Connect — not the
 * full generated API. Several methods the suite needs are missing from it,
 * including `user.delete`, `pool.create`, `pool.export` and `sharing.smb.*`.
 * See T3.1 in `docs/02-technology.md`.
 *
 * **This is the only place in the suite that casts around those types.** Keeping
 * it to one function means the eventual fix — widening the client's directory
 * upstream — has a single call site to delete, rather than casts scattered
 * through every fixture.
 *
 * Do not reach for this when a typed endpoint exists. The typing is most of why
 * this client was chosen, and each use here is a known gap, not a shortcut.
 */
import type { ApiCallMethod, TrueNasApiClient } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';

const callTimeoutMs = 60_000;

/**
 * Calls a middleware method that the client does not type.
 *
 * @param method dotted middleware method name, e.g. `user.delete`
 * @param params positional parameters, as middleware expects them
 */
export async function callUntyped<TResult>(
  client: TrueNasApiClient,
  method: string,
  params: unknown[] = [],
): Promise<TResult> {
  const result = await firstValueFrom(
    client.api
      .call(method as ApiCallMethod, params as never)
      .pipe(timeout(callTimeoutMs)),
  );

  return result as TResult;
}
