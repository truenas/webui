import {
  ExistingProvider, FactoryProvider, forwardRef, ValueProvider,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import {
  CallResponseOrFactory, JobResponseOrFactory,
  MockApiCallResponse, MockApiJobResponse,
  MockApiResponseType,
} from 'app/core/testing/interfaces/mock-api-responses.interface';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobDirectory, ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { SubscriptionManagerService } from 'app/modules/websocket/subscription-manager.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

/**
 * This is a sugar syntax for creating simple api mocks.
 * @example
 * providers: [
 *   mockApi([
 *     mockCall('filesystem.stat': { gid: 0 } as FileSystemStat),
 *     mockCall('filesystem.stat', () => ({ gid: 0 } as FileSystemStat)),
 *     mockJob('filesystem.setacl', fakeSuccessfulJob()),
 *     ...
 *   }),
 * ]
 *
 * It also makes available MockApiService, which allows customizing calls on the fly.
 *
 * If you need more customization, use ordinary mockProvider().
 * @example
 * providers: [
 *   mockProvider(ApiService, {
 *     call: jest.fn((method) => {
 *       if (method === 'filesystem.stat') {
 *         return of({ user: 'john' } as FileSystemStat);
 *       }
 *     })
 *   }),
 * ]
 */

export function mockApi(
  mockResponses?: (MockApiCallResponse | MockApiJobResponse)[],
): (FactoryProvider | ExistingProvider | ValueProvider)[] {
  return [
    {
      provide: WebSocketStatusService,
      useValue: ({
        isConnected$: of(true),
        isAuthenticated$: of(false),
      } as WebSocketStatusService),
    },
    {
      provide: WebSocketHandlerService,
      useValue: ({ send: jest.fn(), responses$: of() } as unknown as WebSocketHandlerService),
    },
    {
      provide: TranslateService,
      useValue: (() => {
        const mockInstant = (key: string, params?: Record<string, unknown>): string => {
          // Handle ICU plural syntax - can be embedded in larger strings
          let result = key;


          // Match plural expressions - need to handle nested braces carefully
          // This matches { n, plural, ... } with any content including nested {}
          const pluralRegex = /\{\s*(\w+)\s*,\s*plural\s*,\s*((?:[^{}]|\{[^}]*\})+)\s*\}/g;

          result = result.replace(pluralRegex, (match, paramName, pluralRules) => {
            if (params?.[paramName] === undefined) {
              return match;
            }

            const paramValue = Number(params[paramName]);

            // Parse plural rules - handle spaces more flexibly
            const rules = pluralRules.match(/(?:=\d+\s*\{[^}]+\}|\w+\s*\{[^}]+\})/g) || [];

            for (const rule of rules) {
              const exactMatch = rule.match(/[=](\d+)\s*\{([^}]+)\}/);
              if (exactMatch && Number(exactMatch[1]) === paramValue) {
                return exactMatch[2].replace(/#/g, String(paramValue));
              }

              const oneMatch = rule.match(/one\s*\{([^}]+)\}/);
              if (oneMatch && paramValue === 1) {
                return oneMatch[1].replace(/#/g, String(paramValue));
              }

              const otherMatch = rule.match(/other\s*\{([^}]+)\}/);
              if (otherMatch && (paramValue === 0 || paramValue > 1)) {
                return otherMatch[1].replace(/#/g, String(paramValue));
              }
            }

            return match;
          });


          // Handle simple parameter interpolation
          if (params && result.includes('{')) {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
              result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
            });
          }

          return result;
        };

        return {
          instant: mockInstant,
          get: (key: string, params?: Record<string, unknown>) => of(mockInstant(key, params)),
          stream: (key: string, params?: Record<string, unknown>) => of(mockInstant(key, params)),
          onLangChange: of({ lang: 'en' }),
          onTranslationChange: of({}),
          onDefaultLangChange: of({}),
        };
      })(),
    },
    {
      provide: SubscriptionManagerService,
      useValue: {
        subscribe: jest.fn(() => of()),
      },
    },
    {
      provide: ApiService,
      useFactory: () => {
        const mockApiService = new MockApiService();
        (mockResponses || []).forEach((mockResponse) => {
          if (mockResponse.type === MockApiResponseType.Call) {
            mockApiService.mockCall(mockResponse.method, mockResponse.response);
          } else if (mockResponse.type === MockApiResponseType.Job) {
            mockApiService.mockJob(
              mockResponse.method,
              mockResponse.response as Job<ApiJobDirectory[ApiJobMethod]['response']>,
            );
          }
        });
        return mockApiService;
      },
    },
    {
      provide: MockApiService,
      useExisting: forwardRef(() => ApiService),
    },
  ];
}

export function mockCall<M extends ApiCallMethod>(
  method: M,
  response: CallResponseOrFactory<M> = undefined,
): MockApiCallResponse {
  return {
    response,
    method,
    type: MockApiResponseType.Call,
  };
}

/**
 * Mocks immediate call() and job() responses and core.get_jobs when id is queried.
 * @see MockApiService.mockJob()
 */
export function mockJob<M extends ApiJobMethod>(
  method: M,
  response: JobResponseOrFactory<M> = fakeSuccessfulJob(),
): MockApiJobResponse {
  return {
    response,
    method,
    type: MockApiResponseType.Job,
  };
}
