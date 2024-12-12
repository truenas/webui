import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { when } from 'jest-when';
import { Observable, Subject, of } from 'rxjs';
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
import { ApiService } from 'app/services/websocket/api.service';
import { SubscriptionManagerService } from 'app/services/websocket/subscription-manager.service';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

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
export class MockApiService extends ApiService {
  private subscribeStream$ = new Subject<ApiEventTyped>();
  private jobIdCounter = 1;

  constructor(
    wsHandler: WebSocketHandlerService,
    subscriptionManager: SubscriptionManagerService,
    translate: TranslateService,
  ) {
    super(wsHandler, subscriptionManager, translate);

    this.call = jest.fn();
    this.job = jest.fn();
    this.startJob = jest.fn();
    this.subscribe = jest.fn(() => this.subscribeStream$.asObservable());
    this.callAndSubscribe = jest.fn();

    when(this.call).mockImplementation((method: ApiCallMethod, args: unknown) => {
      throw Error(`Unmocked api call ${method} with ${JSON.stringify(args)}`);
    });
    when(this.callAndSubscribe).mockImplementation((method: ApiCallAndSubscribeMethod, args: unknown) => {
      throw Error(`Unmocked api callAndSubscribe ${method} with ${JSON.stringify(args)}`);
    });
    when(this.job).mockImplementation((method: ApiJobMethod, args: unknown) => {
      throw Error(`Unmocked api job call ${method} with ${JSON.stringify(args)}`);
    });
  }

  mockCall<K extends ApiCallMethod>(method: K, response: CallResponseOrFactory<K>): void {
    const mockedImplementation = (_: K, params: ApiCallParams<K>): Observable<unknown> => {
      let preparedResponse = response;
      if (response instanceof Function) {
        preparedResponse = response(params);
      }

      Object.freeze(preparedResponse);

      return of(preparedResponse);
    };

    when(this.call).calledWith(method).mockImplementation(mockedImplementation);
    when(this.call)
      .calledWith(method, anyArgument as unknown as ApiCallParams<ApiCallMethod>)
      .mockImplementation(mockedImplementation);

    when(this.callAndSubscribe)
      .calledWith(method as ApiCallAndSubscribeMethod)
      .mockImplementation(mockedImplementation as jest.Mock);
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
    const getJobResponse = (params: ApiJobParams<M> = undefined): Job<ApiJobResponse<M>> => {
      let job: Job;
      if (response instanceof Function) {
        job = response(params);
      } else {
        job = response;
      }

      job = {
        ...job,
        id: this.jobIdCounter,
      };

      Object.freeze(job);
      return job as Job<ApiJobResponse<M>>;
    };
    when(this.startJob).calledWith(method).mockReturnValue(of(this.jobIdCounter));
    when(this.startJob).calledWith(method, anyArgument).mockReturnValue(of(this.jobIdCounter));
    when(this.job).calledWith(method).mockImplementation(() => of(getJobResponse()));
    when(this.job).calledWith(method, anyArgument)
      .mockImplementation((_, params) => of(getJobResponse(params)));
    when(this.call)
      .calledWith('core.get_jobs', [[['id', '=', this.jobIdCounter]]])
      .mockImplementation(() => of([getJobResponse()]));

    this.jobIdCounter += 1;
  }

  emitSubscribeEvent(event: ApiEventTyped): void {
    this.subscribeStream$.next(event);
  }
}
