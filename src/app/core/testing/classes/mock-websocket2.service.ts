import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { when } from 'jest-when';
import { Observable, of, Subject } from 'rxjs';
import { ValuesType } from 'utility-types';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiDirectory, ApiMethod } from 'app/interfaces/api-directory.interface';
import { ApiEventDirectory } from 'app/interfaces/api-event-directory.interface';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketService2 } from 'app/services/ws2.service';

@Injectable()
export class MockWebsocketService2 extends WebSocketService2 {
  private subscribeStream$ = new Subject<ApiEvent<unknown>>();
  private jobIdCounter = 1;

  constructor(
    protected router: Router,
    @Inject(WINDOW) protected window: Window,
  ) {
    super(router, window);

    this.call = jest.fn();
    this.job = jest.fn();
    this.subscribe = jest.fn(() => this.subscribeStream$.asObservable() as Observable<ApiEvent<ValuesType<ApiEventDirectory>['response']>>);

    when(this.call).mockImplementation((method: ApiMethod, args: unknown) => {
      throw Error(`2 Unmocked websocket call ${method} with ${JSON.stringify(args)}`);
    });
    when(this.job).mockImplementation((method: ApiMethod, args: unknown) => {
      throw Error(`2 Unmocked websocket job call ${method} with ${JSON.stringify(args)}`);
    });
  }

  mockCall<K extends ApiMethod>(method: K, response: ApiDirectory[K]['response']): void {
    when(this.call).calledWith(method).mockReturnValue(of(response));
    when(this.call).calledWith(method, expect.anything()).mockReturnValue(of(response));
  }

  mockCallOnce<K extends ApiMethod>(method: K, response: ApiDirectory[K]['response']): void {
    when(this.call).calledWith(method, expect.anything()).mockReturnValueOnce(of(response));
  }
  mockJob<K extends ApiMethod>(method: K, response: ApiEvent<Job<ApiDirectory[K]['response']>>): void {
    const responseWithJobId = {
      ...response,
      id: this.jobIdCounter,
    };
    when(this.call).calledWith(method).mockReturnValue(of(this.jobIdCounter));
    when(this.call).calledWith(method, expect.anything()).mockReturnValue(of(this.jobIdCounter));
    when(this.job).calledWith(method).mockReturnValue(of(responseWithJobId));
    when(this.job).calledWith(method, expect.anything()).mockReturnValue(of(responseWithJobId));
    when(this.call)
      .calledWith('core.get_jobs', [[['id', '=', this.jobIdCounter]]])
      .mockReturnValue(of([responseWithJobId]));

    this.jobIdCounter += 1;
  }

  emitSubscribeEvent(event: ApiEvent<unknown>): void {
    this.subscribeStream$.next(event);
  }

  onclose(): void {
    // Noop to avoid calling redirect.
  }

  connect(): void {
    // Noop
  }

  reconnect(): void {
    // Noop
  }
}
