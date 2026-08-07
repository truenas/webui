/**
 * Authentication token helper (R4.1, R4.4).
 *
 * webui's `scripts/playwright-helpers/generate-token.ts` does something similar,
 * but hardcodes `http://localhost:${port}` as the base URL — incompatible with
 * the `shipped` profile — and shelling out to it would imply a webui checkout,
 * which R2.10 forbids. So we own this.
 *
 * We differ from it in one deliberate way. webui asks for a `reconnect_token`
 * via `login_options`, but that field only exists from API v26.0.0 onward
 * (`AuthCommonOptions` changed in v26). `auth.generate_token` was introduced in
 * v25.10.0 and has never changed, so it works across every version the client
 * supports — and it takes an explicit TTL rather than leaving us with whatever
 * the server's default happens to be (R4.3).
 */
import { TrueNasEndpoint, type TrueNasApiClient } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';

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
  client: TrueNasApiClient,
  ttlSeconds: number = tokenTtlSeconds,
): Promise<string> {
  // Addressed via the enum, not the raw string: `ApiCallDirectory` is keyed by
  // `TrueNasEndpoint` members, and TypeScript treats string enum members
  // nominally — the literal 'auth.generate_token' is not assignable to them.
  const token = await firstValueFrom(
    client.api
      .call(TrueNasEndpoint.GenerateToken, [ttlSeconds, {}, false, false])
      .pipe(timeout(callTimeoutMs)),
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
