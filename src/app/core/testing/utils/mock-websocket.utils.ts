import {
  ExistingProvider, FactoryProvider, forwardRef, ValueProvider,
} from '@angular/core';
import { Router } from '@angular/router';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import {
  MockWebsocketCallResponse, MockWebsocketJobResponse,
  MockWebsocketResponseType,
} from 'app/core/testing/interfaces/mock-websocket-responses.interface';
import { ApiCallDirectory, ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobDirectory, ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';

/**
 * This is a sugar syntax for creating simple websocket mocks.
 * @example
 * providers: [
 *   mockWebsocket([
 *     mockCall('filesystem.stat': { gid: 0 } as FileSystemStat),
 *     mockJob('filesystem.setacl', fakeSuccessfulJob()),
 *     ...
 *   }),
 * ]
 *
 * It also makes available MockWebsocketService, which allows customizing calls on the fly.
 *
 * If you need more customization, use ordinary mockProvider().
 * @example
 * providers: [
 *   mockProvider(WebSocketService2, {
 *     call: jest.fn((method) => {
 *       if (method === 'filesystem.stat') {
 *         return of({ user: 'john' } as FileSystemStat);
 *       }
 *     })
 *   }),
 * ]
 */

export function mockWebsocket(
  mockResponses?: (MockWebsocketCallResponse | MockWebsocketJobResponse)[],
): (FactoryProvider | ExistingProvider | ValueProvider)[] {
  return [
    {
      provide: WebSocketService,
      useFactory: (router: Router, wsManager: WebsocketConnectionService) => {
        const mockWebsocketService = new MockWebsocketService(router, wsManager);
        (mockResponses || []).forEach((mockResponse) => {
          if (mockResponse.type === MockWebsocketResponseType.Call) {
            mockWebsocketService.mockCall(mockResponse.method, mockResponse.response);
          } else if (mockResponse.type === MockWebsocketResponseType.Job) {
            mockWebsocketService.mockJob(
              mockResponse.method,
              mockResponse.response as Job<ApiJobDirectory[ApiJobMethod]['response']>,
            );
          }
        });
        return mockWebsocketService;
      },
      deps: [Router, WebsocketConnectionService],
    },
    {
      provide: MockWebsocketService,
      useExisting: forwardRef(() => WebSocketService),
    },
    {
      provide: WebsocketConnectionService,
      useValue: ({ send: jest.fn() } as unknown as WebsocketConnectionService),
    },
  ];
}

export function mockCall<M extends ApiCallMethod>(
  method: M,
  response: ApiCallDirectory[M]['response'] = undefined,
): MockWebsocketCallResponse {
  return {
    response,
    method,
    type: MockWebsocketResponseType.Call,
  };
}

/**
 * Mocks immediate call() and job() responses and core.get_jobs when id is queried.
 * @see MockWebsocketService.mockJob()
 */
export function mockJob<M extends ApiJobMethod>(
  method: M,
  response: Job<ApiJobDirectory[M]['response']> = undefined,
): MockWebsocketJobResponse {
  return {
    response,
    method,
    type: MockWebsocketResponseType.Job,
  };
}
