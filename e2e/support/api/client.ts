/**
 * Middleware client (T3).
 *
 * Wraps `@truenas/api-client` so the rest of the suite gets a connected,
 * authenticated client without touching rxjs. Everything the suite does over
 * the API — preconditions (R3.1), teardown (R3.2), artifact collection (R7.2) —
 * goes through a client obtained here.
 */
import {
  createTrueNasClient, SUPPORTED_API_VERSIONS,
  type ApiDirectoryV27_0_0, type AuthResponse, type TrueNasApiClient,
} from '@truenas/api-client';
import { filter, firstValueFrom, take, timeout } from 'rxjs';
import type { TargetConfig } from '../config';

/**
 * The API surface the suite is written against.
 *
 * Unparameterised, the client defaults to v25.10.0, whose curated directory is
 * missing most of what the fixtures call.
 *
 * Raising this needs both ceilings to allow it: the appliance has to advertise
 * the version and `@truenas/api-client` has to implement it
 * (`MAX_SUPPORTED_VERSION`, `CLIENT_BY_VERSION_KEY`). Name a surface the client
 * cannot select and its methods compile, then fail at runtime as unknown.
 *
 * Everything else here derives from this one line — the client type below, and
 * the response shapes fixtures ask for with
 * `CallResponse<E2eApiDirectory, 'some.method'>`, which is how they name a shape
 * the package declares without exporting.
 */
export type E2eApiDirectory = ApiDirectoryV27_0_0;

/** A connected client typed against {@link E2eApiDirectory}. */
export type E2eApiClient = TrueNasApiClient<E2eApiDirectory>;

/**
 * The same version again, for the runtime check below.
 *
 * The package maps no directory to its version, so this cannot be derived from
 * {@link E2eApiDirectory} — change one and you must change the other, or the
 * check inverts: warning on every correctly-negotiated run and going quiet on
 * the fallback it exists to catch.
 *
 * `satisfies` at least holds the label to a version the package supports, so a
 * typo or a version ahead of the client fails to compile.
 */
const expectedApiVersion = {
  year: 27,
  label: 'v27.0.0' satisfies (typeof SUPPORTED_API_VERSIONS)[number],
} as const;

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
export async function connectAndLogin(config: TargetConfig): Promise<E2eApiClient> {
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

  // Outside the try deliberately: raised in it, this would be caught and
  // re-wrapped by the handler for transport failures, and the socket closed
  // twice.
  //
  // The client only *throws* on `AUTH_ERR`. `OTP_REQUIRED`, `EXPIRED` and
  // `REDIRECT` all resolve normally with the session still unauthenticated, so
  // treating a non-throwing emission as success returns a client that looks
  // connected and fails on its first real call — a minute later, as an
  // authorization error naming neither the account nor the reason.
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

  // The only check that the negotiated surface is the one the types assume.
  // A rejected certificate makes version discovery's `fetch` fail, get
  // classified as a network error, and fall back to the oldest supported API —
  // whose directory is missing most of what the fixtures call. Continuing from
  // there buys a run that dies later on unknown methods with nothing naming the
  // cause, so this fails here instead.
  if (client.version.year !== expectedApiVersion.year) {
    client.close();
    throw new Error(
      `Connected to middleware at ${config.middlewareHost} on API `
      + `${client.version.version}, but the suite is typed against `
      + `${expectedApiVersion.label}. Version discovery falls back to the oldest supported API `
      + 'when it cannot reach /api/versions, so check for a certificate or network problem '
      + 'before assuming the appliance is old.',
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
  work: (client: E2eApiClient) => Promise<T>,
): Promise<T> {
  const client = await connectAndLogin(config);
  try {
    return await work(client);
  } finally {
    client.close();
  }
}
