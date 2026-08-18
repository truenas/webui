/**
 * Middleware client (T3).
 *
 * Wraps `@truenas/api-client` so the rest of the suite gets a connected,
 * authenticated client without touching rxjs. Everything the suite does over
 * the API — preconditions (R3.1), teardown (R3.2), artifact collection (R7.2) —
 * goes through a client obtained here.
 */
import {
  createTrueNasClient, type ApiDirectoryV26_0_0, type AuthResponse, type TrueNasApiClient,
} from '@truenas/api-client';
import { filter, firstValueFrom, take, timeout } from 'rxjs';
import type { TargetConfig } from '../config';

/**
 * The API surface the suite is written against.
 *
 * The client is generic over a directory because the version is discovered at
 * *runtime* while the methods are typed at *compile* time; the type parameter is
 * where a caller states which surface it targets. Left unset it defaults to
 * `BaseApiDirectory`/v25.10.0, whose curated set is missing most of what the
 * fixtures call — that default is what makes `user.query` look unavailable.
 *
 * **v26, not v27**, even though the nightlies advertise v27. The ceiling is the
 * client's, not the appliance's: `MAX_SUPPORTED_VERSION` is `v26.0.0` and
 * `CLIENT_BY_VERSION_KEY` maps only `25.10` and `26`, so v27 is dropped as
 * too-new during discovery and the socket opens on `/api/v26.0.0` regardless.
 * Typing against v27 would let a v27-only method compile and then fail at
 * runtime as an unknown method — the exact failure the generic exists to
 * prevent. Nothing in the suite needs v27 today; raise this when the client
 * ships a v27 implementation, not before.
 */
export type E2eApiClient = TrueNasApiClient<ApiDirectoryV26_0_0>;

/**
 * The same version as the directory above, in a form the runtime check can use.
 *
 * Adjacent on purpose. The obvious next edit to this file is the one the comment
 * invites — raise the directory when the client ships a v27 implementation — and
 * a type parameter gives no compiler help to a constant elsewhere. Left behind,
 * the check below inverts silently: it would warn on every run that connected to
 * the right surface and stay quiet on the one case it exists to catch.
 */
const expectedApiVersion = { year: 26, label: 'v26' } as const;

/**
 * The same surface as a directory, for deriving response types.
 *
 * The package declares plenty of its entity types without exporting them, so
 * `CallResponse<E2eApiDirectory, 'some.method'>` is how a fixture names a shape
 * it needs rather than hand-writing one that can drift from the real thing.
 */
export type E2eApiDirectory = ApiDirectoryV26_0_0;

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
  const client = await createTrueNasClient<ApiDirectoryV26_0_0>({
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
  // The type parameter on `E2eApiClient` is an assertion, not a negotiation: the surface is
  // picked at runtime and nothing has checked it matches. Worth one line,
  // because there is a silent path to the wrong one — a rejected certificate
  // makes version discovery's `fetch` fail, get classified as a network error,
  // and fall back to `FALLBACK_VERSION` (v25.10.0). The suite would then run
  // typed against v26 over a v25.10 socket, and a shape difference would surface
  // as a puzzling assertion failure rather than as "we are not on the version
  // you think".
  //
  // A warning rather than a throw: every method the suite uses exists in both
  // directories, so this is information for whoever reads a failure, not a
  // reason to refuse to run.
  if (client.version.year !== expectedApiVersion.year) {
    console.warn(
      `[e2e] Connected on API ${client.version.version}, but the suite is typed against `
      + `${expectedApiVersion.label}. Version discovery may have fallen back — check for a `
      + 'certificate or network problem.',
    );
  }

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
  work: (client: E2eApiClient) => Promise<T>,
): Promise<T> {
  const client = await connectAndLogin(config);
  try {
    return await work(client);
  } finally {
    client.close();
  }
}
