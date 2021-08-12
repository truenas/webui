import { FactoryProvider, forwardRef, ExistingProvider } from '@angular/core';
import { Router } from '@angular/router';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { MockWebsocketResponses } from 'app/core/testing/interfaces/mock-websocket-responses.interface';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { WebSocketService } from 'app/services';

/**
 * This is a sugar syntax for creating simple websocket mocks.
 * @example
 * providers: [
 *   mockWebsocket({
 *     'filesystem.stat': of({ gid: 0 } as FileSystemStat),
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
export function mockWebsocket(mockResponses: MockWebsocketResponses): (FactoryProvider | ExistingProvider)[] {
  return [
    {
      provide: WebSocketService,
      useFactory: (router: Router) => {
        const mockWebsocketService = new MockWebsocketService(router);
        Object.entries(mockResponses).forEach(([method, response$]) => {
          mockWebsocketService.mockCall(method as ApiMethod, response$);
        });

        return mockWebsocketService;
      },
      deps: [Router],
    },
    {
      provide: MockWebsocketService,
      useExisting: forwardRef(() => WebSocketService),
    },
  ];
}
