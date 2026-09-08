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
  catchError,
  combineLatest,
  defer,
  distinctUntilChanged,
  EMPTY,
  filter,
  finalize,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  TYPED_API_CLIENT,
  WebUiApiClient,
  WebUiApiDirectory,
} from 'app/modules/websocket/typed-api/typed-api-client.token';
import { ApiCallError } from 'app/services/errors/error.classes';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

type D = WebUiApiDirectory;
type ClientApi = WebUiApiClient['api'];

/**
 * How long the one-shot token minted for the typed socket stays valid, in
 * seconds. It is spent immediately, so this only has to cover the round trip.
 */
const bridgeTokenTtlSeconds = 300;

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
 *
 * ## What is deliberately not here yet
 *
 * - Calls are not intercepted by the WebSocket debug panel or its mocks.
 * - There is no concurrent-call limit.
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
   * Emits the client once its socket is open *and* its session is
   * authenticated. Every request waits on this, so a call made during startup
   * or across a reconnect is held rather than refused by middleware.
   */
  private readonly ready$: Observable<WebUiApiClient> = this.client$.pipe(
    switchMap((client) => client.authenticator.authenticated$.pipe(
      filter(Boolean),
      take(1),
      map(() => client),
    )),
  );

  /** Whether the typed session is currently authenticated. */
  readonly isAuthenticated$: Observable<boolean> = this.client$.pipe(
    switchMap((client) => client.authenticator.authenticated$),
    distinctUntilChanged(),
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
   * form validation keep working unchanged.
   */
  call<M extends CallMethod<D>>(method: M, ...params: ArgsOf<CallParams<D, M>>): Observable<CallResponse<D, M>> {
    return this.ready$.pipe(
      switchMap((client) => this.dispatch<CallResponse<D, M>>(client, method, params[0])),
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
   * The emitted union is discriminated on `msg`; narrow on it before reading
   * `fields`, since a removal carries only an `id`.
   */
  subscribe<E extends EventName<D>>(event: E): Observable<EventUnion<D, E>> {
    return this.client$.pipe(
      switchMap((client) => client.api.events(event)),
    );
  }

  /**
   * The request/response round trip, done here rather than through the
   * client's `call` because the client reduces a JSON-RPC error to its reason
   * string, and the UI needs the whole payload: `errname` drives
   * authentication handling, `extra` carries field-level validation errors.
   */
  private dispatch<R>(client: WebUiApiClient, method: string, params: unknown): Observable<R> {
    return defer(() => {
      const id = uuidv4();
      const reply$ = client.connection.messages().pipe(
        filter((message) => message.id === id),
        take(1),
        switchMap((message) => {
          if (message.error) {
            return throwError(() => new ApiCallError(message.error as unknown as JsonRpcError));
          }
          return of(message.result as R);
        }),
      );
      const sending = client.connection.send({
        jsonrpc: '2.0',
        id,
        method,
        params: params ?? [],
      });
      return reply$.pipe(finalize(() => sending.unsubscribe()));
    });
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
   */
  private bridgeAuthentication(): void {
    this.client$.pipe(
      switchMap((client) => combineLatest([
        client.connection.opened.pipe(distinctUntilChanged()),
        this.wsStatus.isAuthenticated$.pipe(distinctUntilChanged()),
      ]).pipe(
        switchMap(([isOpen, isLegacyAuthenticated]) => {
          if (!isOpen) {
            return EMPTY;
          }
          if (!isLegacyAuthenticated) {
            return this.endSession(client);
          }
          if (client.authenticated) {
            return EMPTY;
          }
          return this.login(client).pipe(
            catchError((error: unknown) => {
              console.error('Typed API session could not be established', error);
              return EMPTY;
            }),
          );
        }),
      )),
    ).subscribe();
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

  private endSession(client: WebUiApiClient): Observable<boolean> {
    this.reconnectToken = null;
    return client.authenticated ? client.authenticator.logout() : EMPTY;
  }
}
