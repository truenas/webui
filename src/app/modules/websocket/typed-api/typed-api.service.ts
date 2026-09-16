import { inject, Injectable } from '@angular/core';
import {
  ArgsOf,
  AuthResponse,
  CallMethod,
  CallParams,
  CallResponse,
  EventName,
  EventUnion,
  JobMethod,
  JobParams,
  JobResult,
} from '@truenas/api-client';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  defer,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  Observable,
  of,
  retry,
  switchMap,
  take,
  tap,
  throwError,
  timer,
} from 'rxjs';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { Job } from 'app/interfaces/job.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { dispatchTypedCall } from 'app/modules/websocket/typed-api/dispatch-typed-call';
import {
  TYPED_API_CLIENT,
  WebUiApiClient,
  WebUiApiDirectory,
} from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiSessionError } from 'app/services/errors/error.classes';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

type D = WebUiApiDirectory;
type ClientApi = WebUiApiClient['api'];

/**
 * How long the one-shot token minted for the typed socket stays valid, in
 * seconds. It is spent immediately, so this only has to cover the round trip.
 */
const bridgeTokenTtlSeconds = 300;

/**
 * How many times a failed typed login is retried, and the base of the
 * exponential backoff between attempts (1s, 2s, 4s). Enough to ride out a
 * `middlewared` restart without holding a page's requests for long.
 */
const loginRetries = 3;
const loginRetryBaseDelayMs = 1000;

/**
 * Fully-typed API access, backed by `@truenas/api-client`.
 *
 * This is the migration target for `ApiService`. Method names, params and
 * responses come from types generated from `middlewared --dump-api`, so an
 * unknown method or a wrong param shape is a compile error rather than a
 * runtime surprise, and there is no hand-maintained directory to keep in sync.
 *
 * ## Coexistence with `ApiService`
 *
 * The typed client owns a second WebSocket. The legacy socket still carries
 * login, the jobs store, the debug panel and every call that has not moved yet.
 * This service borrows authentication from it once: when the typed socket is
 * open and the legacy session is authenticated, it mints a single-use token on
 * the legacy socket and logs the typed socket in with it. From then on the
 * typed session keeps its own token chain, the way `AuthService` does for the
 * legacy one, and only borrows again if that chain breaks. Logging out of the
 * legacy session logs the typed session out too.
 *
 * Call sites therefore never authenticate here and never need to care which
 * socket a method rides on. Migrate a call by swapping the injected service.
 * Requests are held until the typed session is authenticated. If the login
 * keeps failing they are refused with `TypedApiSessionError` once the bridge
 * has exhausted its retries, so a page reports the failure instead of
 * spinning forever.
 *
 * ## What is deliberately not here yet
 *
 * - Calls are not intercepted by the WebSocket debug panel or its mocks.
 * - There is no concurrent-call limit.
 * - An `ENOTAUTHENTICATED` error is thrown like any other, where the legacy
 *   `ApiService` logs the app out. The typed session is secondary and
 *   re-established by the bridge, so ending the legacy session over it would
 *   be wrong; this becomes the legacy behaviour when login moves here.
 * - `query` / `queryOne` / `queryCount` are exposed straight from the client
 *   until the wrapper grows its own error handling for them.
 */
@Injectable({
  providedIn: 'root',
})
export class TypedApiService {
  private client$ = inject(TYPED_API_CLIENT);
  private legacyApi = inject(ApiService);
  private wsStatus = inject(WebSocketStatusService);

  /**
   * The single-use token the typed session's last login minted for its next
   * one. Cleared the moment it is spent, since middleware consumes it whether
   * or not the login succeeds.
   */
  private reconnectToken: string | null = null;

  /**
   * Set when the bridge has given up logging the typed session in, and
   * cleared as soon as it has a fresh reason to try again (the socket reopens
   * or the legacy session comes back). While it is set, requests fail with
   * it instead of waiting.
   */
  private readonly sessionFailure$ = new BehaviorSubject<TypedApiSessionError | null>(null);

  /**
   * Emits the client once its socket is open *and* its session is
   * authenticated. Every request waits on this, so a call made during startup
   * or across a reconnect is held rather than refused by middleware. Errors
   * instead when the bridge has given up, so held requests never hang.
   */
  private readonly ready$: Observable<WebUiApiClient> = this.client$.pipe(
    switchMap((client) => combineLatest([
      client.authenticator.authenticated$,
      this.sessionFailure$,
    ]).pipe(
      filter(([isAuthenticated, failure]) => isAuthenticated || failure !== null),
      take(1),
      switchMap(([isAuthenticated, failure]) => (isAuthenticated ? of(client) : throwError(() => failure))),
    )),
  );

  constructor() {
    this.bridgeAuthentication();
  }

  /**
   * Send a request and emit its result.
   *
   * ```typescript
   * this.typedApi.call('system.info');                 // Observable<SystemInfoResult>
   * this.typedApi.call('alert.dismiss', ['uuid-1']);   // params required
   * this.typedApi.call('nope.nope');                   // compile error
   * ```
   *
   * Errors are thrown as `ApiCallError` carrying the full JSON-RPC error, the
   * same class the legacy `ApiService` throws, so `ErrorHandlerService` and
   * form validation keep working unchanged. See `dispatchTypedCall` for why
   * this does not go through the client's own `call`.
   */
  call<M extends CallMethod<D>>(method: M, ...params: ArgsOf<CallParams<D, M>>): Observable<CallResponse<D, M>> {
    return this.ready$.pipe(
      switchMap((client) => dispatchTypedCall<CallResponse<D, M>>(client, method, params[0])),
    );
  }

  /**
   * Query a collection. Typed by the entity behind the `.query` method, with
   * `select` narrowing the rows to the picked fields.
   *
   * Use `satisfies` rather than an annotation when building options into a
   * variable, or the result widens to `Partial<E>[]`.
   *
   * The query verbs are forwarded rather than declared because the types
   * their signatures need (`QueryFilters`, `QueryProjection`) are not
   * exported by the client yet. The cast restores the client's own generic
   * signature over the forwarding arrow; the arguments and return value are
   * exactly the client's, so nothing is widened at the call site.
   */
  readonly query = ((
    ...args: Parameters<ClientApi['query']>
  ) => this.ready$.pipe(switchMap((client) => client.api.query(...args)))) as ClientApi['query'];

  /** Query the single matching entry. Middleware errors unless exactly one matches. */
  readonly queryOne = ((
    ...args: Parameters<ClientApi['queryOne']>
  ) => this.ready$.pipe(switchMap((client) => client.api.queryOne(...args)))) as ClientApi['queryOne'];

  /** Count the matching entries. */
  readonly queryCount = ((
    ...args: Parameters<ClientApi['queryCount']>
  ) => this.ready$.pipe(switchMap((client) => client.api.queryCount(...args)))) as ClientApi['queryCount'];

  /**
   * Start a job and follow it to completion.
   *
   * Emits every update, completes on success and throws `FailedJobError` on
   * failure — the same contract as `ApiService.job`, so `observeJob`-based
   * consumers migrate without changes.
   */
  job<M extends JobMethod<D>>(
    method: M,
    ...params: ArgsOf<JobParams<D, M>>
  ): Observable<Job<JobResult<D, M>>> {
    return this.ready$.pipe(
      switchMap((client) => client.api.job(method, ...params)),
      // The client's Job and the UI's Job describe the same wire object; the
      // client is merely honest about a few fields being null before the job
      // starts. Narrowing to the UI's shape keeps the existing operators and
      // error classes usable until the UI adopts the client's type.
      map((job) => job as unknown as Job<JobResult<D, M>>),
      observeJob(),
    );
  }

  /**
   * Start a job and emit only its id. Use `job` when progress or the result matter.
   */
  startJob<M extends JobMethod<D>>(method: M, ...params: ArgsOf<JobParams<D, M>>): Observable<number> {
    return this.ready$.pipe(
      switchMap((client) => client.api.callAndGetJobId(method, ...params)),
    );
  }

  /**
   * Subscribe to a collection's change events.
   *
   * Held until the typed session is authenticated like every other verb:
   * middleware refuses `core.subscribe` on an unauthenticated session, and the
   * refusal is silent and one-shot rather than retried.
   *
   * The emitted union is discriminated on `msg`; narrow on it before reading
   * `fields`, since a removal carries only an `id`.
   */
  subscribe<E extends EventName<D>>(event: E): Observable<EventUnion<D, E>> {
    return this.ready$.pipe(
      switchMap((client) => client.api.events(event)),
    );
  }

  /**
   * Keeps the typed session in step with the legacy one.
   *
   * The client re-authenticates by itself only for password and API-key
   * sessions; a token session is the caller's to re-login, by design, because
   * the token is single-use. This is that caller, and it mirrors what
   * `AuthService` does for the legacy socket: every login asks middleware for
   * the next token, and every reconnect spends it.
   *
   * The chain has to be seeded, and re-seeded when it breaks. Tokens live in
   * middleware memory for a few minutes and a `middlewared` restart voids
   * them, which is a common reason the socket dropped at all. Both cases fall
   * back to minting a fresh one over the legacy socket, whose own token chain
   * `AuthService` has already repaired by then.
   *
   * A login that fails outright is retried with backoff. Nothing else would
   * prompt another attempt while the socket stays open and the legacy session
   * stays authenticated, and a single refused `auth.generate_token` must not
   * hold every typed request until the next reconnect. Once the retries are
   * spent the bridge gives up and fails the held requests instead.
   *
   * Nothing else in the chain is expected to error, but the subscription has
   * an error handler all the same: a bridge that died silently would hold
   * every request for the life of the tab, which is the one outcome this
   * service exists to avoid.
   */
  private bridgeAuthentication(): void {
    this.client$.pipe(
      switchMap((client) => combineLatest([
        client.connection.opened.pipe(distinctUntilChanged()),
        this.wsStatus.isAuthenticated$.pipe(distinctUntilChanged()),
      ]).pipe(
        switchMap(([isOpen, isLegacyAuthenticated]) => {
          this.clearSessionFailure();
          if (!isOpen) {
            return EMPTY;
          }
          if (!isLegacyAuthenticated) {
            return this.endSession(client);
          }
          if (client.authenticated) {
            return EMPTY;
          }
          return defer(() => this.login(client)).pipe(
            retry({
              count: loginRetries,
              delay: (_, retryCount) => timer(loginRetryBaseDelayMs * 2 ** (retryCount - 1)),
            }),
            catchError((error: unknown) => {
              console.error('Typed API session could not be established', error);
              this.sessionFailure$.next(new TypedApiSessionError(error));
              return EMPTY;
            }),
          );
        }),
      )),
    ).subscribe({
      error: (error: unknown) => {
        console.error('Typed API authentication bridge stopped', error);
        this.sessionFailure$.next(new TypedApiSessionError(error));
      },
    });
  }

  private clearSessionFailure(): void {
    if (this.sessionFailure$.value) {
      this.sessionFailure$.next(null);
    }
  }

  /**
   * Spends the chained token when there is one, and falls back to a fresh
   * token from the legacy session when there is not, or when middleware
   * refuses it.
   */
  private login(client: WebUiApiClient): Observable<AuthResponse> {
    const chained = this.reconnectToken;
    this.reconnectToken = null;

    const login$ = chained
      ? client.authenticator.loginWithToken(chained).pipe(
          catchError(() => this.loginWithLegacyToken(client)),
        )
      : this.loginWithLegacyToken(client);

    return login$.pipe(
      tap((response) => {
        this.reconnectToken = response.reconnect_token ?? null;
      }),
    );
  }

  private loginWithLegacyToken(client: WebUiApiClient): Observable<AuthResponse> {
    return this.legacyApi.call('auth.generate_token', [bridgeTokenTtlSeconds, {}, true, true]).pipe(
      switchMap((token) => client.authenticator.loginWithToken(token)),
    );
  }

  /**
   * Best effort. The typed socket may itself be going down, or middleware may
   * already have voided the session after a restart; a logout that fails
   * leaves nothing to clean up and must not end the bridge.
   */
  private endSession(client: WebUiApiClient): Observable<boolean> {
    this.reconnectToken = null;
    if (!client.authenticated) {
      return EMPTY;
    }
    return client.authenticator.logout().pipe(
      catchError((error: unknown) => {
        console.warn('Typed API session could not be logged out', error);
        return EMPTY;
      }),
    );
  }
}
