import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { when } from 'jest-when';
import { Observable, of, Subject } from 'rxjs';
import { ValuesType } from 'utility-types';
import { ApiDirectory, ApiMethod } from 'app/interfaces/api-directory.interface';
import { ApiEventDirectory } from 'app/interfaces/api-event-directory.interface';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';

/**
 * Better than just expect.anything() because it allows null and undefined.
 */
const anyArgument = when((_: unknown) => true);

/**
 * MockWebsocketService can be used to update websocket mocks on the fly.
 * For initial setup prefer mockWebsocket();
 *
 * To update on the fly:
 * @example
 * ```
 * // In test case:
 * const websocketService = spectator.inject(MockWebsocketService);
 * websocketService.mockCallOnce('filesystem.stat', { gid: 5 } as FileSystemStat);
 * ```
 */
@Injectable()
export class MockWebsocketService extends WebSocketService {
  private subscribeStream$ = new Subject<ApiEvent<unknown>>();
  private jobIdCounter = 1;

  constructor(
    protected router: Router,
    protected wsManager: WebsocketConnectionService,
    protected http: HttpClient,
  ) {
    super(router, wsManager, http);

    this.call = jest.fn();
    this.job = jest.fn();
    this.subscribe = jest.fn(() => this.subscribeStream$.asObservable() as Observable<ApiEvent<ValuesType<ApiEventDirectory>['response']>>);

    when(this.call).mockImplementation((method: ApiMethod, args: unknown) => {
      throw Error(`Unmocked websocket call ${method} with ${JSON.stringify(args)}`);
    });
    when(this.job).mockImplementation((method: ApiMethod, args: unknown) => {
      throw Error(`Unmocked websocket job call ${method} with ${JSON.stringify(args)}`);
    });
  }

  mockCall<K extends ApiMethod>(method: K, response: ApiDirectory[K]['response']): void {
    when(this.call).calledWith(method).mockReturnValue(of(response));
    when(this.call).calledWith(method, anyArgument).mockReturnValue(of(response));
  }

  mockCallOnce<K extends ApiMethod>(method: K, response: ApiDirectory[K]['response']): void {
    when(this.call).calledWith(method, anyArgument).mockReturnValueOnce(of(response));
  }
  mockJob<K extends ApiMethod>(method: K, response: Job<ApiDirectory[K]['response']>): void {
    const responseWithJobId = {
      ...response,
      id: this.jobIdCounter,
    };
    when(this.call).calledWith(method).mockReturnValue(of(this.jobIdCounter));
    when(this.call).calledWith(method, anyArgument).mockReturnValue(of(this.jobIdCounter));
    when(this.job).calledWith(method).mockReturnValue(of(responseWithJobId));
    when(this.job).calledWith(method, anyArgument).mockReturnValue(of(responseWithJobId));
    when(this.call)
      .calledWith('core.get_jobs', [[['id', '=', this.jobIdCounter]]])
      .mockReturnValue(of([responseWithJobId]));

    this.jobIdCounter += 1;
  }

  emitSubscribeEvent(event: ApiEvent<unknown>): void {
    this.subscribeStream$.next(event);
  }
}
