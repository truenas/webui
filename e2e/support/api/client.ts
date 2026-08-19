/**
 * Middleware client (T3).
 *
 * Wraps `@truenas/api-client` so the rest of the suite gets a connected,
 * authenticated client without touching rxjs. Everything the suite does over
 * the API — preconditions (R3.1), teardown (R3.2), artifact collection (R7.2) —
 * goes through a client obtained here.
 */
import { createTrueNasClient, type AuthResponse, type TrueNasApiClient } from '@truenas/api-client';
import { filter, firstValueFrom, take, timeout } from 'rxjs';
import type { TargetConfig } from '../config';

/** Log context only — the client uses it for correlation, not identity. */
const clientUuid = 'webui-e2e';

/** How long to wait for the WebSocket to open before giving up. */
const connectTimeoutMs = 30_000;

/** How long to wait for login to resolve. */
const loginTimeoutMs = 30_000;

/**
 * Connects to middleware and authenticates.
 *
 * Note on TLS: the client speaks `wss://` exclusively (`truenas-connection.ts`
 * builds `wss://${hostname}${path}`), and test VMs present self-signed
 * certificates, which Node rejects by default. This applies in **both**
 * profiles — the profile changes where the browser loads the UI from, not where
 * this client connects. `playwright.config.ts` relaxes verification for the
 * runner process accordingly. A deliberate, documented concession for internal
 * test appliances (R2.9), not something to widen further.
 *
 * Be aware when debugging: a certificate rejection here does not surface as a
 * certificate error. Version discovery's `fetch` fails first, is classified as a
 * network error, and silently falls back to `FALLBACK_VERSION`; the visible
 * symptom is this function timing out on the socket 30 seconds later.
 *
 * @throws if the socket cannot be opened, or if login does not end in an
 * authenticated session — which includes outcomes the client itself does not
 * treat as errors, such as a two-factor challenge.
 */
export async function connectAndLogin(config: TargetConfig): Promise<TrueNasApiClient> {
  const client = await createTrueNasClient({
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

  // Deliberately outside the try. The client only *throws* on `AUTH_ERR`;
  // `OTP_REQUIRED`, `EXPIRED` and `REDIRECT` all resolve normally with the
  // session still unauthenticated, so treating a non-throwing emission as
  // success hands back a client that looks connected and then fails on its first
  // real call — up to a minute later, as an authorization error naming neither
  // the account nor the reason.
  //
  // Raising it here rather than in the block above keeps the message intact:
  // inside the try it would be caught and re-wrapped by the handler that exists
  // for transport failures, and the socket would be closed twice.
  //
  // Compared as a string because the package declares `AuthResponseType` but
  // does not export it — only the `AuthResponse` interface referencing it.
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

  return client;
}

/**
 * Runs `work` with a connected client and always closes it afterwards.
 *
 * Used wherever a client is needed for a bounded piece of work — the suite
 * should not hold long-lived connections outside a fixture.
 */
export async function withClient<T>(
  config: TargetConfig,
  work: (client: TrueNasApiClient) => Promise<T>,
): Promise<T> {
  const client = await connectAndLogin(config);
  try {
    return await work(client);
  } finally {
    client.close();
  }
}
