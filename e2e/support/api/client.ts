/**
 * Middleware client (T3).
 *
 * Wraps `@truenas/api-client` so the rest of the suite gets a connected,
 * authenticated client without touching rxjs. Everything the suite does over
 * the API — preconditions (R3.1), teardown (R3.2), artifact collection (R7.2) —
 * goes through a client obtained here.
 */
import {
  AuthError, AuthErrorCode, createTrueNasClient, SUPPORTED_API_VERSIONS,
  type ApiDirectoryV28_0_0, type AuthResponse, type TrueNasApiClient,
} from '@truenas/api-client';
import { filter, firstValueFrom, take, timeout } from 'rxjs';
import type { TargetConfig } from '../config';
import { connectMethod, recordSpan, timeMiddleware } from '../timings';

/**
 * The API surface the suite is written against; unparameterised, the client defaults to v25.10.0,
 * which lacks most of what the fixtures call. Raising it needs the appliance to advertise the version
 * and `@truenas/api-client` to implement it (`MAX_SUPPORTED_VERSION`, `CLIENT_BY_VERSION_KEY`), or
 * methods compile and then fail at runtime as unknown. The client type and the
 * `CallResponse<E2eApiDirectory, 'some.method'>` shapes fixtures use all derive from this line.
 */
export type E2eApiDirectory = ApiDirectoryV28_0_0;

/** A connected client typed against {@link E2eApiDirectory}. */
export type E2eApiClient = TrueNasApiClient<E2eApiDirectory>;

/**
 * The same version again, for the runtime check below. It can't be derived from {@link E2eApiDirectory},
 * so change both together, or the check inverts: failing every correct run and missing the fallback
 * it exists to catch. `satisfies` makes a typo or a version ahead of the client fail to compile.
 */
const expectedApiVersion = {
  year: 28,
  label: 'v28.0.0' satisfies (typeof SUPPORTED_API_VERSIONS)[number],
} as const;

/** Log context only — the client uses it for correlation, not identity. */
const clientUuid = 'webui-e2e';

/** How long to wait for the WebSocket to open before giving up. */
const connectTimeoutMs = 30_000;

/** How long to wait for login to resolve. */
const loginTimeoutMs = 30_000;

/**
 * Connects to middleware and authenticates. The client is `wss://`-only and test VMs are self-signed in
 * both profiles, so `playwright.config.ts` relaxes TLS verification for the runner (R2.9; don't widen it).
 * A rejected certificate doesn't surface as such: discovery falls back to `FALLBACK_VERSION` and this
 * times out on the socket 30 seconds later.
 * @throws if the socket can't open or login doesn't end authenticated, including a two-factor challenge.
 */
export async function connectAndLogin(config: TargetConfig): Promise<E2eApiClient> {
  const start = Date.now();
  const client = await createTrueNasClient<E2eApiDirectory>({
    uuid: clientUuid,
    hostnames: [config.middlewareHost],
    enabled: true,
  });

  let auth: AuthResponse;

  try {
    await firstValueFrom(
      client.connection.opened.pipe(
        filter(Boolean),
        take(1),
        timeout(connectTimeoutMs),
      ),
    );

    auth = await firstValueFrom(
      client.authenticator
        .loginWithUserPass(config.username, config.password)
        .pipe(timeout(loginTimeoutMs)),
    );
  } catch (error) {
    // Don't leak the socket when setup fails — otherwise the runner hangs on exit.
    client.close();
    throw new Error(
      `Could not authenticate against middleware at ${config.middlewareHost}: `
      + (error instanceof Error ? error.message : String(error)),
      { cause: error },
    );
  }

  // Outside the try so the transport handler doesn't re-wrap it and close the socket twice.
  // The client only throws on `AUTH_ERR`; `OTP_REQUIRED`, `EXPIRED` and `REDIRECT` resolve unauthenticated,
  // and accepting them yields a client that fails its first real call with an unhelpful auth error.
  const outcome = String(auth.response_type);

  if (outcome !== 'SUCCESS') {
    client.close();
    throw new Error(
      `Middleware at ${config.middlewareHost} did not authenticate "${config.username}": `
      + `${outcome}. `
      + (outcome === 'OTP_REQUIRED'
        ? 'The account has two-factor authentication enabled. The suite cannot complete that '
        + 'challenge — point the suite at an account without it.'
        : 'The credentials were accepted but the session is not usable.'),
    );
  }

  // The only check that the negotiated surface is the one the types assume. A rejected certificate makes
  // discovery fall back to the oldest API, and the run would die later on unknown methods with no cause named.
  // It also catches the reverse: bumping the package to a newer directory without moving the pins.
  if (client.version.year !== expectedApiVersion.year) {
    client.close();
    const hint = client.version.year > expectedApiVersion.year
      ? 'The appliance and the installed @truenas/api-client both speak a newer API than the pin: '
      + 'move the pins with the package, as "Version policy" in docs/devs/typed-api-client.md describes.'
      : 'Version discovery falls back to the oldest supported API when it cannot reach '
        + '/api/versions, so check for a certificate or network problem before assuming the appliance is old.';
    throw new Error(
      `Connected to middleware at ${config.middlewareHost} on API `
      + `${client.version.version}, but the suite is typed against `
      + `${expectedApiVersion.label}. ${hint}`,
    );
  }

  recordSpan('call', connectMethod, start, true);
  timeMiddleware(client);
  return client;
}

/**
 * One API-key sign-in attempt over a fresh connection, always closed; says whether middleware accepted it.
 * A refusal (`AuthError` `API_KEY_AUTH_FAILED`, or any non-`SUCCESS` outcome) reads as `false`. Transport
 * failures and rate limits still throw: reading those as "refused" would pass a revocation check for nothing.
 * Stay on `wss://`: middleware revokes a key sent over plain `ws://`.
 */
export async function signsInWithApiKey(
  config: TargetConfig,
  credentials: { username: string; key: string },
): Promise<boolean> {
  const client = await createTrueNasClient<E2eApiDirectory>({
    uuid: clientUuid,
    hostnames: [config.middlewareHost],
    enabled: true,
  });

  try {
    await firstValueFrom(
      client.connection.opened.pipe(
        filter(Boolean),
        take(1),
        timeout(connectTimeoutMs),
      ),
    );

    const auth = await firstValueFrom(
      client.authenticator.loginWithApiKey(credentials).pipe(timeout(loginTimeoutMs)),
    ).catch((error: unknown) => {
      // Only middleware's own refusal of the key. A rate limit, a dropped
      // socket or anything else is not a verdict on the key, and rethrows.
      if (error instanceof AuthError && error.code === AuthErrorCode.ApiKeyAuthFailed) {
        return undefined;
      }
      throw error;
    });

    return String(auth?.response_type) === 'SUCCESS';
  } finally {
    client.close();
  }
}

/**
 * Runs `work` with a connected client and always closes it afterwards.
 *
 * Used wherever a client is needed for a bounded piece of work — the suite
 * should not hold long-lived connections outside a fixture.
 */
export async function withClient<T>(
  config: TargetConfig,
  work: (client: E2eApiClient) => Promise<T>,
): Promise<T> {
  const client = await connectAndLogin(config);
  try {
    return await work(client);
  } finally {
    client.close();
  }
}
