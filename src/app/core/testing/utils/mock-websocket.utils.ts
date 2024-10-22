import {
  ExistingProvider, FactoryProvider, forwardRef, ValueProvider,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import {
  CallResponseOrFactory, JobResponseOrFactory,
  MockWebSocketCallResponse, MockWebSocketJobResponse,
  MockWebSocketResponseType,
} from 'app/core/testing/interfaces/mock-websocket-responses.interface';
import { ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobDirectory, ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { ApiService } from 'app/services/api.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';

/**
 * This is a sugar syntax for creating simple websocket mocks.
 * @example
 * providers: [
 *   mockWebSocket([
 *     mockCall('filesystem.stat': { gid: 0 } as FileSystemStat),
 *     mockCall('filesystem.stat', () => ({ gid: 0 } as FileSystemStat)),
 *     mockJob('filesystem.setacl', fakeSuccessfulJob()),
 *     ...
 *   }),
 * ]
 *
 * It also makes available MockWebSocketService, which allows customizing calls on the fly.
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

export function mockWebSocket(
  mockResponses?: (MockWebSocketCallResponse | MockWebSocketJobResponse)[],
): (FactoryProvider | ExistingProvider | ValueProvider)[] {
  return [
    {
      provide: ApiService,
      useFactory: (router: Router, wsManager: WebSocketConnectionService, translate: TranslateService) => {
        const mockWebSocketService = new MockWebSocketService(router, wsManager, translate);
        (mockResponses || []).forEach((mockResponse) => {
          if (mockResponse.type === MockWebSocketResponseType.Call) {
            mockWebSocketService.mockCall(mockResponse.method, mockResponse.response);
          } else if (mockResponse.type === MockWebSocketResponseType.Job) {
            mockWebSocketService.mockJob(
              mockResponse.method,
              mockResponse.response as Job<ApiJobDirectory[ApiJobMethod]['response']>,
            );
          }
        });
        return mockWebSocketService;
      },
      deps: [Router, WebSocketConnectionService, TranslateService],
    },
    {
      provide: MockWebSocketService,
      useExisting: forwardRef(() => ApiService),
    },
    {
      provide: WebSocketConnectionService,
      useValue: ({ send: jest.fn() } as unknown as WebSocketConnectionService),
    },
  ];
}

export function mockCall<M extends ApiCallMethod>(
  method: M,
  response: CallResponseOrFactory<M> = undefined,
): MockWebSocketCallResponse {
  return {
    response,
    method,
    type: MockWebSocketResponseType.Call,
  };
}

/**
 * Mocks immediate call() and job() responses and core.get_jobs when id is queried.
 * @see MockWebSocketService.mockJob()
 */
export function mockJob<M extends ApiJobMethod>(
  method: M,
  response: JobResponseOrFactory<M> = undefined,
): MockWebSocketJobResponse {
  return {
    response,
    method,
    type: MockWebSocketResponseType.Job,
  };
}
