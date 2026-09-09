import { Injectable } from '@angular/core';
import {
  CallMethod, CallParams, CallResponse, JobMethod, QueryEntity, QueryMethod,
} from '@truenas/api-client';
import {
  Observable, of, Subject, throwError,
} from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

type D = WebUiApiDirectory;
type QueryableMethod = QueryMethod<D['call']>;

export type TypedCallResponseOrFactory<M extends CallMethod<D>>
  = | CallResponse<D, M>
    | ((params: CallParams<D, M>) => CallResponse<D, M>);

/**
 * Test double for `TypedApiService`. Set it up with `mockTypedApi()` and
 * adjust responses on the fly through `mockCall` / `mockQuery` / `mockJob`.
 *
 * Every verb is a `jest.fn`, so specs assert on it the way they always have:
 * `expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(...)`.
 */
@Injectable()
export class MockTypedApiService {
  private readonly calls = new Map<string, unknown>();
  private readonly queries = new Map<string, unknown[]>();
  private readonly jobs = new Map<string, Job>();
  private readonly events$ = new Subject<unknown>();

  readonly call = jest.fn((method: string, params?: unknown): Observable<unknown> => {
    if (!this.calls.has(method)) {
      return throwError(() => new Error(`Unmocked typed api call ${method} with ${JSON.stringify(params)}`));
    }
    const response = this.calls.get(method);
    return of(response instanceof Function ? response(params) : response);
  });

  readonly query = jest.fn((method: string): Observable<unknown[]> => this.rowsFor(method));

  readonly queryOne = jest.fn((method: string): Observable<unknown> => {
    return this.rowsFor(method).pipe((rows$) => new Observable((subscriber) => rows$.subscribe({
      next: (rows) => subscriber.next(rows[0]),
      error: (error: unknown) => subscriber.error(error),
      complete: () => subscriber.complete(),
    })));
  });

  readonly queryCount = jest.fn((method: string): Observable<number> => {
    return new Observable((subscriber) => this.rowsFor(method).subscribe({
      next: (rows) => subscriber.next(rows.length),
      error: (error: unknown) => subscriber.error(error),
      complete: () => subscriber.complete(),
    }));
  });

  readonly job = jest.fn((method: string, params?: unknown): Observable<Job> => {
    if (!this.jobs.has(method)) {
      return throwError(() => new Error(`Unmocked typed api job ${method} with ${JSON.stringify(params)}`));
    }
    return of(this.jobs.get(method));
  });

  readonly startJob = jest.fn((method: string): Observable<number> => {
    return this.jobs.has(method) ? of(this.jobs.get(method).id) : of(1);
  });

  readonly subscribe = jest.fn((): Observable<unknown> => this.events$.asObservable());

  mockCall<M extends CallMethod<D>>(method: M, response?: TypedCallResponseOrFactory<M>): void {
    this.calls.set(method, response);
  }

  mockQuery<M extends QueryableMethod>(method: M, rows: QueryEntity<D['call'], M>[]): void {
    this.queries.set(method, rows);
  }

  mockJob<M extends JobMethod<D>>(method: M, job: Job): void {
    this.jobs.set(method, job);
  }

  emitEvent(event: unknown): void {
    this.events$.next(event);
  }

  private rowsFor(method: string): Observable<unknown[]> {
    if (!this.queries.has(method)) {
      return throwError(() => new Error(`Unmocked typed api query ${method}`));
    }
    return of(this.queries.get(method));
  }
}
