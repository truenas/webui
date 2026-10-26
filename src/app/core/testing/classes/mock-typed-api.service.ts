import { Injectable, OnDestroy } from '@angular/core';
import {
  CallMethod, CallParams, CallResponse, EventName, EventSourceName, EventUnion, JobMethod, JobResult, QueryEntity,
  QueryMethod, SubscriptionArgs,
} from '@truenas/api-client';
import {
  createFakeClient, fakeApiError, FakeApiErrorOverrides, FakeTrueNasClient, JobUpdate, withSpies,
} from '@truenas/api-client/testing';
import { map, Observable } from 'rxjs';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { Job } from 'app/interfaces/job.interface';
import { followCollection } from 'app/modules/websocket/typed-api/follow-collection';
import { rethrowAsApiCallError } from 'app/modules/websocket/typed-api/rethrow-as-api-call-error';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

type D = WebUiApiDirectory;

/** Methods `mockCall` accepts: everything in the call directory except the `.query` family, which `mockQuery` owns. */
export type TypedCallMethod = Exclude<CallMethod<D>, QueryMethod<D['call']>>;

/** Methods `mockCallError` can refuse: calls, `.query` methods and job methods alike. */
export type TypedRefusableMethod = TypedCallMethod | QueryMethod<D['call']> | JobMethod<D>;

export type TypedCallResponseOrFactory<M extends TypedCallMethod>
  = | CallResponse<D, M>
    | ((params: CallParams<D, M>) => CallResponse<D, M>);

/**
 * The client's verbs with their generics erased. The typing lives on the
 * scripting side (`mockCall`, `mockQuery`, `mockJob`), where fixtures are
 * checked against the directory; the verbs themselves mirror
 * `TypedApiService`'s loose-argument `jest.fn` shape so specs can assert on
 * them the way they always have.
 */
interface LooseApi {
  call(method: string, params?: unknown): Observable<unknown>;
  query(method: string, filters?: unknown, options?: unknown): Observable<unknown[]>;
  queryOne(method: string, filters?: unknown, options?: unknown): Observable<unknown>;
  queryCount(method: string, filters?: unknown): Observable<number>;
  job(method: string, params?: unknown): Observable<unknown>;
  callAndGetJobId(method: string, params?: unknown): Observable<number>;
  events(event: string, params?: unknown): Observable<unknown>;
}

/**
 * Test double for `TypedApiService`, running a real `@truenas/api-client`
 * over the package's fake connection.
 *
 * Nothing here reimplements dispatch, job correlation or subscriptions: every
 * verb forwards to the real client, and `mockCall` / `mockQuery` / `mockJob`
 * script the *answers* the fake connection gives. The client is strict, so a
 * call nothing scripted fails with `UnmockedCallError` naming the method
 * rather than hanging.
 *
 * Every verb rethrows a refusal through the same `rethrowAsApiCallError` as
 * `TypedApiService`, so an error scripted with `mockCallError` surfaces as the
 * `ApiCallError` production throws, `extra` and all.
 *
 * Set it up with `mockTypedApi()`. For connection-level scenarios — a dropped
 * socket, a hand-written reply — reach the client through `client`.
 */
@Injectable()
export class MockTypedApiService implements OnDestroy {
  readonly client: FakeTrueNasClient<D> = withSpies(
    createFakeClient({ version: 'v28.0.0', strict: true }),
    jest.fn,
  );

  readonly call = jest.fn((method: string, params?: unknown) => {
    return this.api.call(method, params).pipe(rethrowAsApiCallError());
  });

  readonly callUnauthenticated = jest.fn((method: string, params?: unknown) => {
    return this.api.call(method, params).pipe(rethrowAsApiCallError());
  });

  readonly query = jest.fn((method: string, filters?: unknown, options?: unknown) => {
    return this.api.query(method, filters, options).pipe(rethrowAsApiCallError());
  });

  readonly queryOne = jest.fn((method: string, filters?: unknown, options?: unknown) => {
    return this.api.queryOne(method, filters, options).pipe(rethrowAsApiCallError());
  });

  readonly queryCount = jest.fn((method: string, filters?: unknown) => {
    return this.api.queryCount(method, filters).pipe(rethrowAsApiCallError());
  });

  /** Same contract as `TypedApiService.job`: emits every update, throws `FailedJobError` on failure. */
  readonly job = jest.fn((method: string, params?: unknown) => {
    return this.api.job(method, params).pipe(
      rethrowAsApiCallError(),
      map((job) => job as Job),
      observeJob(),
    );
  });

  readonly startJob = jest.fn((method: string, params?: unknown) => {
    return this.api.callAndGetJobId(method, params).pipe(rethrowAsApiCallError());
  });

  readonly subscribe = jest.fn((event: string, params?: unknown) => {
    return this.api.events(event, params).pipe(rethrowAsApiCallError());
  });

  /**
   * Same folding as `TypedApiService.queryAndSubscribe`: script the rows with `mockQuery`, the
   * changes with `emitEvent`.
   */
  readonly queryAndSubscribe = jest.fn((method: string, filters?: unknown, options?: unknown) => {
    return followCollection(
      this.api.query(method, filters, options) as Observable<{ id?: unknown }[]>,
      this.api.events(method) as Observable<{ msg: string; id?: unknown; fields?: { id?: unknown } }>,
    );
  });

  mockCall<M extends TypedCallMethod>(method: M, response: TypedCallResponseOrFactory<M>): void {
    this.client.mock.call(method, response);
  }

  /**
   * Answers `method` with a JSON-RPC error frame, completed by the package's
   * `fakeApiError`, which every verb throws as an `ApiCallError`: a `.query`
   * method fails `query`, a job method fails `job` before a job starts. Use it
   * for the error path of a form: `extra` carries the field-level validation
   * errors.
   */
  mockCallError(method: TypedRefusableMethod, error: FakeApiErrorOverrides = {}): void {
    const frame = fakeApiError(error);
    this.client.connection.autoReply(method, ({ id }) => {
      // On a microtask, as the package's own answers are.
      queueMicrotask(() => this.client.connection.receive({ jsonrpc: '2.0', id, error: frame }));
    });
  }

  /** Feeds `query`, `queryOne` (first row) and `queryCount` (row count) from one set of rows. */
  mockQuery<M extends QueryMethod<D['call']>>(method: M, rows: QueryEntity<D['call'], M>[]): void {
    this.client.mock.query(method, rows);
  }

  /** Answers a job with these updates in order; each is completed by the package's `fakeJob`. */
  mockJob<M extends JobMethod<D>>(
    method: M,
    updates: JobUpdate<JobResult<D, M>> | JobUpdate<JobResult<D, M>>[],
  ): void {
    this.client.mock.job(method, updates);
  }

  /** Pushes a change to the subscribers of `event`, or of an event source with these same arguments. */
  emitEvent<E extends EventName<D>>(event: E, change: EventUnion<D, E>): void;
  // Not unifiable: the two overloads constrain `E` differently, as the client's own `events` does.
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  emitEvent<E extends EventSourceName<D>>(event: E, change: EventUnion<D, E>, ...params: SubscriptionArgs<D, E>): void;
  emitEvent(event: string, change: object, params?: unknown): void {
    // Erased for the same reason as `LooseApi`: the client's overloads cannot be picked through `event`.
    type LooseEmit = (event: string, change: object, params?: unknown) => void;
    (this.client.mock.emit as LooseEmit)(event, change, params);
  }

  ngOnDestroy(): void {
    // Ordinary teardown: a fake holds no timer or socket, but closing is what
    // a consumer of the real client does, and the double should not differ.
    this.client.close();
  }

  private get api(): LooseApi {
    // The client's verbs are generic over the directory; this double takes
    // loose arguments on purpose (see `LooseApi`), so the erasure is explicit.
    return this.client.api as unknown as LooseApi;
  }
}
