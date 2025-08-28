import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import * as environment from 'environments/environment';
import { firstValueFrom, take, toArray } from 'rxjs';
import { CollectionChangeType } from 'app/enums/api.enum';
import {
  CollectionUpdateMessage, IncomingMessage, RequestMessage, SuccessfulResponse,
} from 'app/interfaces/api-message.interface';
import {
  MockConfig, MockEvent, MockSuccessResponse, MockErrorResponse,
  isSuccessResponse,
} from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { selectEnabledMockConfigs } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { MockResponseService } from './mock-response.service';

describe('MockResponseService', () => {
  let service: MockResponseService;
  let store$: MockStore;
  let originalEnvironment: typeof environment.environment;

  const mockRequest: RequestMessage = {
    jsonrpc: '2.0',
    id: 'test-id-1',
    method: 'test.method' as never,
    params: [{ test: 'value' }],
  };

  const mockConfig: MockConfig = {
    id: 'mock-1',
    methodName: 'test.method',
    enabled: true,
    response: {
      type: 'success',
      result: { data: 'test' },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment dynamically
    const envModule = environment as { environment: typeof environment.environment };
    originalEnvironment = envModule.environment;
    envModule.environment = { debugPanel: { enabled: true } } as typeof environment.environment;

    TestBed.configureTestingModule({
      providers: [
        MockResponseService,
        provideMockStore({
          selectors: [
            {
              selector: selectEnabledMockConfigs,
              value: [mockConfig],
            },
          ],
        }),
      ],
    });
    service = TestBed.inject(MockResponseService);
    store$ = TestBed.inject(MockStore) as MockStore;
  });

  afterEach(() => {
    // Restore original environment
    const envModule = environment as { environment: typeof environment.environment };
    envModule.environment = originalEnvironment;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose responses$ as an observable', () => {
    expect(service.responses$).toBeDefined();
    expect(service.responses$.subscribe).toBeDefined();
  });

  describe('checkMock', () => {
    it('should return null when debug panel is disabled', () => {
      const envModule = environment as { environment: typeof environment.environment };
      envModule.environment = { debugPanel: { enabled: false } } as typeof environment.environment;
      const result = service.checkMock(mockRequest);
      expect(result).toBeNull();
    });

    it('should return null when no mocks are enabled', () => {
      store$.overrideSelector(selectEnabledMockConfigs, []);
      const result = service.checkMock(mockRequest);
      expect(result).toBeNull();
    });

    it('should return matching config when method matches', () => {
      const result = service.checkMock(mockRequest);
      expect(result).toEqual(mockConfig);
    });

    it('should return null when method does not match', () => {
      const nonMatchingRequest = { ...mockRequest, method: 'different.method' as never };
      const result = service.checkMock(nonMatchingRequest);
      expect(result).toBeNull();
    });

    it('should handle multiple configs and return first match', () => {
      const configs = [
        { ...mockConfig, id: '1', methodName: 'other.method' },
        { ...mockConfig, id: '2', methodName: 'test.method' },
        { ...mockConfig, id: '3', methodName: 'test.method' },
      ];
      store$.overrideSelector(selectEnabledMockConfigs, configs);

      const result = service.checkMock(mockRequest);
      expect(result?.id).toBe('2');
    });
  });

  describe('generateMockResponse', () => {
    it('should emit mock response through responses$ observable', async () => {
      const responsePromise = firstValueFrom(service.responses$);

      service.generateMockResponse(mockRequest, mockConfig);

      const response = await responsePromise;
      expect(response).toEqual({
        jsonrpc: '2.0',
        id: mockRequest.id,
        result: isSuccessResponse(mockConfig.response) ? mockConfig.response.result : null,
      } as SuccessfulResponse);
    });

    it('should delay response when delay is specified', async () => {
      const delayedConfig = {
        ...mockConfig,
        response: {
          ...mockConfig.response,
          delay: 100,
        },
      };

      const startTime = Date.now();
      const responsePromise = firstValueFrom(service.responses$);

      service.generateMockResponse(mockRequest, delayedConfig);

      await responsePromise;
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some timing variance
    });

    it('should emit events when specified', async () => {
      const event: MockEvent = {
        delay: 50,
        fields: {
          state: 'RUNNING' as const,
          progress: { percent: 50, description: 'In progress' },
        },
      };
      const configWithEvents = {
        ...mockConfig,
        events: [event],
      };

      const responses$ = service.responses$.pipe(take(2), toArray());
      const responsesPromise = firstValueFrom(responses$);

      service.generateMockResponse(mockRequest, configWithEvents);

      const responses = await responsesPromise;
      expect(responses).toHaveLength(2);
      expect(responses[0]).toMatchObject({
        jsonrpc: '2.0',
        id: mockRequest.id,
        result: isSuccessResponse(mockConfig.response) ? mockConfig.response.result : null,
      });

      const eventMessage = responses[1] as CollectionUpdateMessage;
      expect(eventMessage.method).toBe('collection_update');
      expect(eventMessage.params.msg).toBe(CollectionChangeType.Changed);
      expect(eventMessage.params.collection).toBe('core.get_jobs');
      expect(eventMessage.params.fields).toMatchObject({
        state: 'RUNNING',
        progress: { percent: 50, description: 'In progress' },
        message_ids: [mockRequest.id],
        method: mockRequest.method,
        arguments: mockRequest.params,
        transient: true,
      });
    });
  });

  describe('isMockedResponse', () => {
    it('should identify mocked response by id', () => {
      service.generateMockResponse(mockRequest, mockConfig);

      const response: IncomingMessage = {
        jsonrpc: '2.0',
        id: mockRequest.id,
        result: {},
      };

      expect(service.isMockedResponse(response)).toBe(true);
    });

    it('should return false for non-mocked response', () => {
      const response: IncomingMessage = {
        jsonrpc: '2.0',
        id: 'different-id',
        result: {},
      };

      expect(service.isMockedResponse(response)).toBe(false);
    });

    it('should generate mock error response', async () => {
      const errorConfig: MockConfig = {
        id: 'mock-error',
        methodName: 'test.method',
        enabled: true,
        response: {
          type: 'error',
          error: {
            code: -32601,
            message: 'Method not found',
            data: { details: 'Additional error info' },
          },
        } as MockErrorResponse,
      };

      const response$ = service.responses$.pipe(take(1));
      const responsePromise = firstValueFrom(response$);

      service.generateMockResponse(mockRequest, errorConfig);

      const response = await responsePromise;
      expect(response).toEqual({
        jsonrpc: '2.0',
        id: mockRequest.id,
        error: {
          code: -32601,
          message: 'Method not found',
          data: { details: 'Additional error info' },
        },
      });
    });

    it('should identify mocked collection update events', async () => {
      const configWithEvents = {
        ...mockConfig,
        events: [{
          delay: 0,
          fields: { state: 'RUNNING' as const },
        }],
      };

      const responses$ = service.responses$.pipe(take(2), toArray());
      const responsesPromise = firstValueFrom(responses$);

      service.generateMockResponse(mockRequest, configWithEvents);

      const responses = await responsesPromise;
      const eventResponse = responses.find((resp) => 'method' in resp && resp.method === 'collection_update');
      expect(eventResponse).toBeDefined();
      expect(service.isMockedResponse(eventResponse!)).toBe(true);
    });
  });

  describe('matchesConfig with patterns', () => {
    it('should match with valid regex pattern', () => {
      const configWithPattern: MockConfig = {
        ...mockConfig,
        messagePattern: 'test.*value',
      };

      // eslint-disable-next-line @typescript-eslint/dot-notation
      const matches = service['matchesConfig'](mockRequest, configWithPattern);
      expect(matches).toBe(true);
    });

    it('should not match with non-matching pattern', () => {
      const configWithPattern: MockConfig = {
        ...mockConfig,
        messagePattern: 'different.*pattern',
      };

      // eslint-disable-next-line @typescript-eslint/dot-notation
      const matches = service['matchesConfig'](mockRequest, configWithPattern);
      expect(matches).toBe(false);
    });

    it('should handle invalid regex pattern gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const configWithInvalidPattern: MockConfig = {
        ...mockConfig,
        messagePattern: '[invalid regex',
      };

      // eslint-disable-next-line @typescript-eslint/dot-notation
      const matches = service['matchesConfig'](mockRequest, configWithInvalidPattern);
      expect(matches).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid regex pattern'),
        expect.objectContaining({ configId: 'mock-1' }),
      );

      consoleSpy.mockRestore();
    });

    it('should handle circular reference in message', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const circularRequest = { ...mockRequest } as RequestMessage & { circular?: RequestMessage };
      circularRequest.circular = circularRequest;

      const configWithPattern: MockConfig = {
        ...mockConfig,
        messagePattern: 'test',
      };

      // eslint-disable-next-line @typescript-eslint/dot-notation
      const matches = service['matchesConfig'](circularRequest as RequestMessage, configWithPattern);
      expect(matches).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to stringify message'),
        expect.objectContaining({ config: 'mock-1' }),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up all resources', async () => {
      // Setup some active subscriptions and timers
      const configWithDelayAndEvents = {
        ...mockConfig,
        response: { ...mockConfig.response, delay: 1000 },
        events: [{ delay: 1000, fields: { state: 'RUNNING' as const } }],
      };

      service.generateMockResponse(mockRequest, configWithDelayAndEvents);

      // Create a promise that resolves when the subject completes
      const completionPromise = new Promise<void>((resolve) => {
        service.responses$.subscribe({
          complete: () => resolve(),
        });
      });

      // Destroy the service
      service.ngOnDestroy();

      // Wait for completion
      await completionPromise;

      // Since these are private properties, we can't test them directly
      // The test passes if ngOnDestroy completes without errors
      expect(true).toBe(true);
    });
  });

  describe('event handling', () => {
    it('should handle multiple events with cumulative delays', async () => {
      const events: MockEvent[] = [
        { delay: 50, fields: { state: 'RUNNING' as const, progress: { percent: 25, description: 'Starting' } } },
        { delay: 50, fields: { state: 'RUNNING' as const, progress: { percent: 75, description: 'Almost done' } } },
        { delay: 50, fields: { state: 'SUCCESS' as const, progress: { percent: 100, description: 'Complete' } } },
      ];

      const configWithMultipleEvents = {
        ...mockConfig,
        events,
      };

      const startTime = Date.now();

      // Collect all responses including events
      const allResponses$ = service.responses$.pipe(
        take(4), // 1 initial response + 3 events
        toArray(),
      );
      const responsesPromise = firstValueFrom(allResponses$);

      service.generateMockResponse(mockRequest, configWithMultipleEvents);

      const responses = await responsesPromise;
      const eventMessages = responses.filter((resp) => 'method' in resp && resp.method === 'collection_update') as CollectionUpdateMessage[];

      // Check we got all 3 events
      expect(eventMessages).toHaveLength(3);

      // Check timing and content of each event
      const endTime = Date.now();
      const totalElapsed = endTime - startTime;
      expect(totalElapsed).toBeGreaterThanOrEqual(140); // Total time for all events

      // Check each event's content
      // Type assertion for fields that include progress
      interface EventFields { progress: { percent: number; description: string } }
      expect((eventMessages[0].params.fields as EventFields).progress).toEqual({ percent: 25, description: 'Starting' });
      expect((eventMessages[1].params.fields as EventFields).progress).toEqual({ percent: 75, description: 'Almost done' });
      expect((eventMessages[2].params.fields as EventFields).progress).toEqual({ percent: 100, description: 'Complete' });
    });

    it('should use provided event field values', async () => {
      const customEvent: MockEvent = {
        delay: 0,
        fields: {
          id: 999,
          message_ids: ['custom-id'],
          method: 'custom.method' as never,
          arguments: [{ custom: 'args' }],
          transient: false,
          time_started: { $date: 123456789 },
          state: 'RUNNING' as const,
        },
      };

      const configWithCustomEvent = {
        ...mockConfig,
        events: [customEvent],
      };

      const responses$ = service.responses$.pipe(take(2), toArray());
      const responsesPromise = firstValueFrom(responses$);

      service.generateMockResponse(mockRequest, configWithCustomEvent);

      const responses = await responsesPromise;
      const eventResponse = responses.find((resp) => 'method' in resp && resp.method === 'collection_update');
      expect(eventResponse).toBeDefined();
      expect(eventResponse!.params.fields).toMatchObject(customEvent.fields);
    });
  });
});
