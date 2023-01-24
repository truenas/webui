import {
  ExistingProvider, FactoryProvider, forwardRef, ValueProvider,
} from '@angular/core';
import { Router } from '@angular/router';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { MockWebsocketService2 } from 'app/core/testing/classes/mock-websocket2.service';
import {
  MockWebsocketCallResponse, MockWebsocketJobResponse,
  MockWebsocketResponseType,
} from 'app/core/testing/interfaces/mock-websocket-responses.interface';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiDirectory, ApiMethod } from 'app/interfaces/api-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketService, WebSocketService2 } from 'app/services';
import { WebsocketManagerService } from 'app/services/ws-manager.service';

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
 *   mockProvider(WebSocketService, {
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
): (FactoryProvider | ExistingProvider)[] {
  return [
    {
      provide: WebSocketService,
      useFactory: (router: Router, window: Window) => {
        const mockWebsocketService = new MockWebsocketService(router, window);
        (mockResponses || []).forEach((mockResponse) => {
          if (mockResponse.type === MockWebsocketResponseType.Call) {
            mockWebsocketService.mockCall(mockResponse.method, mockResponse.response);
          } else if (mockResponse.type === MockWebsocketResponseType.Job) {
            mockWebsocketService.mockJob(mockResponse.method, mockResponse.response);
          }
        });

        return mockWebsocketService;
      },
      deps: [Router, WINDOW],
    },
    {
      provide: MockWebsocketService,
      useExisting: forwardRef(() => WebSocketService),
    },
  ];
}

export function mockWebsocket2(
  mockResponses?: (MockWebsocketCallResponse | MockWebsocketJobResponse)[],
): (FactoryProvider | ExistingProvider | ValueProvider)[] {
  return [
    {
      provide: WebSocketService2,
      useFactory: (router: Router, wsManager: WebsocketManagerService) => {
        const mockWebsocketService = new MockWebsocketService2(router, wsManager);
        (mockResponses || []).forEach((mockResponse) => {
          if (mockResponse.type === MockWebsocketResponseType.Call) {
            mockWebsocketService.mockCall(mockResponse.method, mockResponse.response);
          } else if (mockResponse.type === MockWebsocketResponseType.Job) {
            mockWebsocketService.mockJob(mockResponse.method, mockResponse.response);
          }
        });
        return mockWebsocketService;
      },
      deps: [Router, WebsocketManagerService],
    },
    {
      provide: MockWebsocketService2,
      useExisting: forwardRef(() => WebSocketService2),
    },
    {
      provide: WebsocketManagerService,
      useValue: ({ send: jest.fn() } as unknown as WebsocketManagerService),
    },
  ];
}

export function mockCall<M extends ApiMethod>(
  method: M,
  response: ApiDirectory[M]['response'] = undefined,
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
export function mockJob<M extends ApiMethod>(
  method: M,
  response: Job<ApiDirectory[M]['response']> = undefined,
): MockWebsocketJobResponse {
  return {
    response,
    method,
    type: MockWebsocketResponseType.Job,
  };
}
