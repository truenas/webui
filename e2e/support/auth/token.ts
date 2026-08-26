/**
 * Authentication token helper (R4.1, R4.4).
 *
 * webui's `scripts/playwright-helpers/generate-token.ts` does something similar
 * but hardcodes `http://localhost:${port}` as the base URL, which the `shipped`
 * profile cannot use. That is why the suite owns this one.
 *
 * Uses `auth.generate_token`, not the `reconnect_token` webui asks for via
 * `login_options`: that field only exists from v26.0.0, while
 * `auth.generate_token` works across every version the client supports and
 * takes an explicit TTL rather than the server's default (R4.3).
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../api/client';

/**
 * Token lifetime. Comfortably longer than the ≤45 minute suite budget (R8.1)
 * so a single acquisition covers a run, without minting anything long-lived.
 */
export const tokenTtlSeconds = 2 * 60 * 60;

const callTimeoutMs = 15_000;

/**
 * Generates a login token for the current session.
 *
 * `match_origin` is false on purpose: the token is minted by the Node runner
 * but redeemed by the browser. Those are the same host in every configuration
 * we support, but binding the token to an origin adds a failure mode that buys
 * nothing on a short-lived token against a disposable VM.
 */
export async function generateAuthToken(
  client: E2eApiClient,
  ttlSeconds: number = tokenTtlSeconds,
): Promise<string> {
  // `generateToken` is the client's own wrapper over `auth.generate_token`,
  // added in 2.0. It takes the TTL and the two booleans and fills in the
  // attributes argument itself, so this is the same call with less to get wrong
  // than the hand-assembled parameter tuple it replaces.
  const token = await firstValueFrom(
    client.api.generateToken(ttlSeconds, false, false).pipe(timeout(callTimeoutMs)),
  );

  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('auth.generate_token returned an empty token');
  }

  return token;
}

/**
 * Builds the URL that logs the browser in.
 *
 * We target `/signin` directly rather than a deep link. webui reads the token
 * in `signin.store.ts` via `queryParamMap.get('token')`, so the token must be
 * on the signin route's URL. Deep links do work — a guard redirects and
 * preserves the query param — but relying on that preservation is an extra
 * moving part in the one flow every other test depends on.
 *
 * @param uiBaseUrl absolute base URL ending in `/ui/` (see config.ts)
 */
export function buildTokenLoginUrl(uiBaseUrl: string, token: string): string {
  const url = new URL('signin', uiBaseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}
