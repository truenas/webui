import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ArgsOf,
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
  defaultIfEmpty,
  defer,
  distinctUntilChanged,
  EMPTY,
  exhaustMap,
  filter,
  map,
  MonoTypeOperatorFunction,
  Observable,
  of,
  retry,
  share,
  startWith,
  switchMap,
  take,
  throttleTime,
  throwError,
  timer,
} from 'rxjs';
import { ApiErrorName } from 'app/enums/api.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { LoginExMechanism, LoginExResponseType } from 'app/interfaces/auth.interface';
import { Job } from 'app/interfaces/job.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { dispatchTypedCall } from 'app/modules/websocket/typed-api/dispatch-typed-call';
import {
  TYPED_API_CLIENT,
  WebUiApiClient,
  WebUiApiDirectory,
} from 'app/modules/websocket/typed-api/typed-api-client.token';
import { ApiCallError, TypedApiSessionError } from 'app/services/errors/error.classes';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

type D = WebUiApiDirectory;
type ClientApi = WebUiApiClient['api'];

/**
 * How long the one-shot token minted for the legacy socket stays valid, in
 * seconds. It is spent immediately, so this only has to cover the round trip.
 */
const borrowTokenTtlSeconds = 300;

/**
 * How many times a failed borrow is retried, and the base of the exponential
 * backoff between attempts (1s, 2s, 4s). Enough to ride out a `middlewared`
 * restart without holding a sign-in for long.
 */
const borrowRetries = 3;
const borrowRetryBaseDelayMs = 1000;

/**
 * How long refusals on the legacy socket are treated as one lapsed session. A
 * socket that comes back unauthenticated has every queued call refused at once,
 * and that is one borrow to make, not one each.
 */
const refusalBurstWindowMs = 500;

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
 * The typed client owns a second WebSocket, and it is the one the user is
 * logged in on: `AuthService` drives `client.authenticator`, so the typed
 * session holds the credentials, the reconnect-token chain and the session's
 * roles. The legacy socket still carries the jobs store, the debug panel and
 * every call that has not moved yet, and it is now the *borrower* — once the
 * typed session is authenticated this service mints a single-use token on it
 * and logs the legacy socket in with that. The borrow is repeated whenever the
 * legacy socket reconnects or middleware refuses a call on it for want of a
 * session, and it goes away entirely once the legacy socket does.
 *
 * Call sites therefore never authenticate here and never need to care which
 * socket a method rides on. Migrate a call by swapping the injected service.
 * Requests are held until the typed session is authenticated, which is what a
 * page loaded before sign-in, or one caught mid-reconnect, is waiting for.
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
  private destroyRef = inject(DestroyRef);

  /**
   * Emits the client once its session is authenticated. Every request waits on
   * this, so a call made before sign-in or across a reconnect is held rather
   * than refused by middleware.
   */
  private readonly ready$: Observable<WebUiApiClient> = defer(() => this.client$.pipe(
    switchMap((client) => client.authenticator.authenticated$.pipe(
      filter(Boolean),
      take(1),
      map(() => client),
    )),
  ));

  /**
   * Logs the legacy socket in to the typed session's account.
   *
   * `share()` rather than a plain `defer`, so the reactive borrow and a
   * sign-in waiting on the same borrow cannot mint two single-use tokens for
   * it. It resets when the borrow settles, so the next one starts fresh.
   */
  private readonly borrow$ = defer(() => this.borrowSession()).pipe(share());

  constructor() {
    this.projectSessionStatus();
    this.lendOnDemand();
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
      this.endSessionOnRefusal(),
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
   * Log the legacy socket in to the typed session's account, and emit once it
   * is in.
   *
   * `AuthService` awaits this before it reports a login as successful: the
   * post-login sequence — failover checks, `auth.me`, the boot calls — still
   * rides the legacy socket, and every one of them would be refused on a
   * socket that has not borrowed yet.
   *
   * Errors with `TypedApiSessionError` when the borrow fails, which the error
   * handler renders as a connection error. There is nothing else to do with
   * it: an app whose legacy socket has no session cannot proceed.
   */
  lendSessionToLegacySocket(): Observable<void> {
    return this.borrow$;
  }

  /**
   * Keeps `WebSocketStatusService` in step with the session the app runs on.
   *
   * Pushed rather than pulled so that service does not have to own the typed
   * client; see the note on `setSessionStatus`.
   */
  private projectSessionStatus(): void {
    this.client$.pipe(
      switchMap((client) => client.authenticator.authenticated$),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (isAuthenticated) => this.wsStatus.setSessionStatus(isAuthenticated),
      error: (error: unknown) => console.error('Typed API session status could not be tracked', error),
    });
  }

  /**
   * Re-lends the session to the legacy socket whenever that socket needs one
   * again: it reconnected, or middleware refused one of its calls for want of
   * a session.
   *
   * A sign-in does not rely on this — it awaits `lendSessionToLegacySocket()`
   * itself, and the two share one borrow — but a reconnect has no such caller,
   * and without it the legacy socket would come back unauthenticated and stay
   * that way.
   *
   * `sessionLost` fires once per refused call, not once per lapsed session, and
   * the ordinary case is a burst: the socket comes back, the borrow starts, and
   * every call already queued onto the still-unauthorised socket is refused a
   * moment later. Unthrottled, each of those would cancel the borrow they are
   * waiting for and abandon a token it had already minted.
   *
   * Throttled on the leading edge rather than debounced, so the first refusal
   * starts the borrow at once and the rest of the burst is ignored. A trailing
   * debounce would delay every re-borrow by the window, and would never fire at
   * all while refusals keep arriving faster than it — which is exactly what a
   * page polling on an unauthenticated socket produces. The `startWith` is after
   * it so the first borrow of all does not depend on a refusal.
   *
   * A borrow that has genuinely given up ends the app's session. That is the
   * outcome `ApiService` used to produce directly from `ENOTAUTHENTICATED`, and
   * without it a legacy socket that cannot get a session leaves the admin shell
   * rendering as though it were signed in while every call on it fails. Dropping
   * the session instead routes the user to the sign-in page, which re-establishes
   * both sides from the stored token.
   *
   * `exhaustMap`, not `switchMap`, so a trigger that lands while a borrow is
   * running is dropped rather than restarting it. Restarting looks harmless and
   * is not: the borrow's retry ladder takes seconds to exhaust, and every
   * restart hands it a fresh one, so under refusals that keep arriving — a page
   * polling on a socket that has no session — it would never reach the give-up
   * path above. The throttle alone does not close that, because it still lets
   * one refusal through per window.
   */
  private lendOnDemand(): void {
    this.client$.pipe(
      switchMap((client) => combineLatest([
        client.authenticator.authenticated$.pipe(distinctUntilChanged()),
        this.wsStatus.isConnected$.pipe(distinctUntilChanged()),
        this.legacyApi.sessionLost.pipe(
          throttleTime(refusalBurstWindowMs, undefined, { leading: true, trailing: false }),
          startWith(undefined),
        ),
      ])),
      exhaustMap(([isAuthenticated, isLegacyConnected]) => {
        if (!isAuthenticated || !isLegacyConnected) {
          return EMPTY;
        }

        return this.lendSessionToLegacySocket().pipe(
          catchError((error: unknown) => {
            console.error('Legacy socket could not borrow the typed session', error);
            this.wsStatus.setLoginStatus(false);
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      error: (error: unknown) => console.error('Legacy socket session borrowing stopped', error),
    });
  }

  /**
   * Mints a single-use token on the typed session and spends it on the legacy
   * socket.
   *
   * Retried with backoff, because the two reasons a borrow fails — middleware
   * still coming up after a restart, and a token voided by that same restart —
   * both clear on their own within a second or two.
   */
  private borrowSession(): Observable<void> {
    return this.client$.pipe(
      take(1),
      switchMap((client) => client.api.generateToken(borrowTokenTtlSeconds, true, true)),
      switchMap((token) => this.legacyApi.call('auth.login_ex', [{
        mechanism: LoginExMechanism.TokenPlain,
        token,
      }]).pipe(
        // `ApiService.call` completes without emitting when the appliance refuses
        // a call for want of a session — the very refusal a borrow exists to
        // repair. Left as an empty completion it would carry through to the
        // sign-in waiting on this, which would finish having reported neither a
        // result nor an error, leaving the button spinning. A borrow that got no
        // answer is a borrow that failed.
        defaultIfEmpty(null),
      )),
      switchMap((response) => {
        if (response?.response_type !== LoginExResponseType.Success) {
          const outcome = response?.response_type ?? 'no answer';
          return throwError(() => new Error(`Legacy socket refused the borrowed token (${outcome})`));
        }
        return of(undefined);
      }),
      retry({
        count: borrowRetries,
        delay: (_, retryCount) => timer(borrowRetryBaseDelayMs * 2 ** (retryCount - 1)),
      }),
      catchError((error: unknown) => throwError(() => new TypedApiSessionError(error))),
    );
  }

  /**
   * Ends the app's session when middleware refuses a typed call for want of
   * one, the way `ApiService` used to for the legacy socket: swallow the
   * error, drop the session, and let the app fall back to the sign-in page,
   * which logs straight back in when the stored token is still good.
   *
   * Only `call` gets this. It is the one verb that keeps the whole JSON-RPC
   * error — the client's own verbs reduce it to a reason string, and
   * `errname` is what distinguishes this refusal from any other.
   */
  private endSessionOnRefusal<T>(): MonoTypeOperatorFunction<T> {
    return catchError((error: unknown) => {
      if (error instanceof ApiCallError && error.error?.data?.errname === ApiErrorName.NotAuthenticated) {
        this.wsStatus.setLoginStatus(false);
        return EMPTY;
      }

      return throwError(() => error);
    });
  }
}
