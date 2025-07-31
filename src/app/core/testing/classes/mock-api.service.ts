import { Injectable } from '@angular/core';
import { when } from 'jest-when';
import { Observable, Subject, of, throwError, merge } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import {
  CallResponseOrFactory,
  JobResponseOrFactory,
} from 'app/core/testing/interfaces/mock-api-responses.interface';
import { ApiCallAndSubscribeMethod } from 'app/interfaces/api/api-call-and-subscribe-directory.interface';
import {
  ApiCallMethod,
  ApiCallParams,
  ApiCallResponse,
} from 'app/interfaces/api/api-call-directory.interface';
import {
  ApiJobMethod,
  ApiJobParams,
  ApiJobResponse,
} from 'app/interfaces/api/api-job-directory.interface';
import { ApiEventTyped } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';

/**
 * Better than just expect.anything() because it allows null and undefined.
 */
const anyArgument = when((_: ApiJobParams<ApiJobMethod>) => true);

/**
 * MockApiService can be used to update api mocks on the fly.
 * For initial setup prefer mockApi();
 *
 * To update on the fly:
 * @example
 * ```
 * // In test case:
 * const apiService = spectator.inject(MockApiService);
 * apiService.mockCallOnce('filesystem.stat', { gid: 5 } as FileSystemStat);
 * ```
 */
@Injectable()
export class MockApiService {
  private subscribeStream$ = new Subject<ApiEventTyped>();
  private jobIdCounter = 1;

  call: jest.Mock;
  job: jest.Mock;
  startJob: jest.Mock;
  subscribe: jest.Mock;
  callAndSubscribe: jest.Mock;
  clearSubscriptions$ = new Subject<void>();

  private mockCalls = new Map<ApiCallMethod, CallResponseOrFactory<ApiCallMethod>>();
  private mockJobs = new Map<ApiJobMethod, JobResponseOrFactory<ApiJobMethod>>();

  constructor() {
    this.call = jest.fn((method: ApiCallMethod, params?: unknown) => {
      if (this.mockCalls.has(method)) {
        const response = this.mockCalls.get(method);
        let preparedResponse = response;
        if (response instanceof Function) {
          preparedResponse = response(params);
        }
        return of(preparedResponse);
      }
      return throwError(() => new Error(`Unmocked api call ${method} with ${JSON.stringify(params)}`));
    });
    this.job = jest.fn((method: ApiJobMethod, params?: unknown) => {
      if (this.mockJobs.has(method)) {
        const getJobResponse = () => {
          const response = this.mockJobs.get(method);
          if (response instanceof Function) {
            return response(params as ApiJobParams<ApiJobMethod>);
          }
          return response;
        };

        const fullResponse$ = merge(
          of(getJobResponse()),
          this.clearSubscriptions$,
        ).pipe(
          filter((message) => message !== undefined),
          take(1),
        );

        // Also mock the core.get_jobs call
        when(this.call)
          .calledWith('core.get_jobs', [[['id', '=', this.jobIdCounter]]])
          .mockImplementation(() => of([getJobResponse()]));

        this.jobIdCounter += 1;
        return fullResponse$;
      }
      return throwError(() => new Error(`Unmocked api job call ${method} with ${JSON.stringify(params)}`));
    });
    this.startJob = jest.fn();
    this.subscribe = jest.fn(() => this.subscribeStream$.asObservable());
    this.callAndSubscribe = jest.fn((method: ApiCallAndSubscribeMethod, args: unknown) => {
      return throwError(() => new Error(`Unmocked api callAndSubscribe ${method} with ${JSON.stringify(args)}`));
    });
  }

  mockCall<K extends ApiCallMethod>(method: K, response: CallResponseOrFactory<K>): void {
    this.mockCalls.set(method, response as CallResponseOrFactory<ApiCallMethod>);
    
    // Still use jest-when for callAndSubscribe if needed
    const mockedImplementation = (_: K, params: ApiCallParams<K>): Observable<unknown> => {
      let preparedResponse = response;
      if (response instanceof Function) {
        preparedResponse = response(params);
      }
      return of(preparedResponse);
    };

    when(this.callAndSubscribe)
      .calledWith(method as ApiCallAndSubscribeMethod)
      .mockImplementation(mockedImplementation as jest.Mock);
  }

  mockCallOnce<M extends ApiCallMethod>(method: M, response: ApiCallResponse<M>): void {
    when(this.call)
      .calledWith(method, anyArgument as unknown as ApiCallParams<ApiCallMethod>)
      .mockReturnValueOnce(of(response));
  }

  mockJob<M extends ApiJobMethod>(method: M, response: JobResponseOrFactory<M>): void {
    this.mockJobs.set(method, response as JobResponseOrFactory<ApiJobMethod>);
  }

  emitSubscribeEvent(event: ApiEventTyped): void {
    this.subscribeStream$.next(event);
  }

  clearSubscriptions(): void {
    this.clearSubscriptions$.next();
  }
}
