/**
 * Authentication token helper (R4.1, R4.4). The suite owns this because webui's
 * `scripts/playwright-helpers/generate-token.ts` hardcodes a localhost base URL the `shipped` profile can't use.
 * Uses `auth.generate_token` rather than `login_options.reconnect_token`, which only exists from v27.0.0;
 * it works on every supported version and takes an explicit TTL (R4.3).
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../api/client';

/**
 * Token lifetime. A token serves one browser login (`support/fixtures.ts`), so
 * this only has to outlast the gap between minting and redeeming it — seconds,
 * plus whatever a UI still coming back after a pool export adds. Five minutes
 * covers the login retry budget with room to spare without leaving anything
 * long-lived behind, though middleware drops each token with its session anyway.
 */
export const tokenTtlSeconds = 5 * 60;

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
 * Builds the URL that logs the browser in. Targets `/signin` directly because `signin.store.ts` reads the
 * `token` query param there; deep links work via a guard redirect, but that's an extra moving part in the
 * one flow every other test depends on.
 * @param uiBaseUrl absolute base URL ending in `/ui/` (see config.ts)
 */
export function buildTokenLoginUrl(uiBaseUrl: string, token: string): string {
  const url = new URL('signin', uiBaseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}
