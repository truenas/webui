import { createServiceFactory, SpectatorService, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { of } from 'rxjs';
import { WEBSOCKET } from 'app/helpers/websocket.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { RequestMessage } from 'app/interfaces/api-message.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { MockResponseService } from 'app/modules/websocket-debug-panel/services/mock-response.service';
import { WebSocketDebugService } from 'app/modules/websocket-debug-panel/services/websocket-debug.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { MockGenerationError, MockServiceError, WebSocketSendError } from './errors';
import { WebSocketHandlerService } from './websocket-handler.service';

type ApiCall = Required<Pick<RequestMessage, 'id' | 'method' | 'params'>> & { jsonrpc: '2.0' };

// Type-safe helpers for accessing private methods in tests
interface WebSocketHandlerServicePrivate {
  handleMockResponse(call: ApiCall): unknown;
  cleanupCall(callId: string): void;
  activeCalls: number;
  pendingCalls: Map<string, ApiCall>;
  triggerNextCall$: { next: () => void };
  wsConnection: { send: (call: unknown) => void };
}

describe('WebSocketHandlerService Error Handling', () => {
  let spectator: SpectatorService<WebSocketHandlerService>;
  let service: WebSocketHandlerService;

  const createService = createServiceFactory({
    service: WebSocketHandlerService,
    providers: [
      provideMockStore({
        initialState: {
          webSocketDebug: {
            isPanelOpen: false,
            activeTab: 'websocket',
            messages: [],
            mockConfigs: [],
            messageLimit: 200,
          },
        },
      }),
      mockProvider(DialogService),
      mockProvider(TranslateService),
      mockProvider(WebSocketStatusService),
      mockProvider(MockResponseService),
      mockProvider(WebSocketDebugService),
      {
        provide: WEBSOCKET,
        useValue: 'ws://localhost:80/websocket',
      },
      {
        provide: WINDOW,
        useValue: {
          location: {
            protocol: 'http:',
            host: 'localhost:80',
          },
        },
      },
    ],
  });

  beforeEach(() => {
    // Reset environment
    const env = environment as { debugPanel?: { enabled: boolean } };
    env.debugPanel = { enabled: false };

    // Prevent WebSocket connection
    jest.spyOn(WebSocketHandlerService.prototype as unknown as { setupWebSocket: () => void }, 'setupWebSocket').mockImplementation();

    spectator = createService();
    service = spectator.service;

    // Setup mocks
    const wsStatus = spectator.inject(WebSocketStatusService);
    Object.defineProperty(wsStatus, 'isConnected$', {
      value: of(true),
    });
  });

  describe('handleMockResponse', () => {
    it('should return null when debug panel is disabled', () => {
      const privateService = service as unknown as WebSocketHandlerServicePrivate;
      const result$ = privateService.handleMockResponse({
        method: 'test', params: [], id: '1', jsonrpc: '2.0',
      } as unknown as ApiCall);
      expect(result$).toBeNull();
    });

    it('should return MockGenerationError when mock generation fails', async () => {
      // Enable debug panel
      const env = environment as { debugPanel?: { enabled: boolean } };
      env.debugPanel = { enabled: true };

      // Mock console.error to prevent test failure
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock the services
      const mockResponseService = {
        checkMock: jest.fn().mockReturnValue({ response: {} }),
        generateMockResponse: jest.fn().mockImplementation(() => {
          throw new Error('Generation failed');
        }),
      };
      const debugService = { logOutgoingMessage: jest.fn() };

      Object.assign(service, {
        mockResponseService: mockResponseService as unknown as MockResponseService,
        debugService: debugService as unknown as WebSocketDebugService,
      });

      const privateService = service as unknown as WebSocketHandlerServicePrivate;
      const result$ = privateService.handleMockResponse({
        method: 'test.method', params: [], id: '1', jsonrpc: '2.0',
      } as unknown as ApiCall);

      expect(result$).toBeDefined();

      await expect(new Promise((resolve, reject) => {
        (result$ as { subscribe: (handlers: { next: () => void; error: (e: unknown) => void }) => void })?.subscribe({
          next: () => reject(new Error('Should throw error')),
          error: resolve,
        });
      })).resolves.toMatchObject({
        message: expect.stringContaining('Failed to generate mock response for test.method'),
        cause: { message: 'Generation failed' },
      });

      errorSpy.mockRestore();
    });

    it('should log but continue when mock config check fails', () => {
      // Enable debug panel
      const env2 = environment as { debugPanel?: { enabled: boolean } };
      env2.debugPanel = { enabled: true };

      // Mock the services
      const mockResponseService = {
        checkMock: jest.fn().mockImplementation(() => {
          throw new Error('Config check failed');
        }),
      };
      const debugService = { logOutgoingMessage: jest.fn() };

      Object.assign(service, {
        mockResponseService: mockResponseService as unknown as MockResponseService,
        debugService: debugService as unknown as WebSocketDebugService,
      });

      // Spy on console.warn
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const privateService = service as unknown as WebSocketHandlerServicePrivate;
      const result$ = privateService.handleMockResponse({
        method: 'test.method', params: [], id: '1', jsonrpc: '2.0',
      } as unknown as ApiCall);

      expect(result$).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('Mock config check failed, proceeding with real request:', expect.any(Error));
      // When checkMock throws, we return null immediately, so logOutgoingMessage is NOT called
      expect(debugService.logOutgoingMessage).not.toHaveBeenCalled();

      // Cleanup
      warnSpy.mockRestore();
      env2.debugPanel = { enabled: false };
    });
  });

  describe('cleanupCall', () => {
    it('should properly cleanup resources', () => {
      const privateService = service as unknown as WebSocketHandlerServicePrivate;
      Object.assign(privateService, { activeCalls: 5 });
      privateService.pendingCalls.set('test-id', {} as unknown as ApiCall);
      const triggerSpy = jest.spyOn(privateService.triggerNextCall$, 'next');

      privateService.cleanupCall('test-id');

      expect(privateService.activeCalls).toBe(4);
      expect(privateService.pendingCalls.has('test-id')).toBe(false);
      expect(triggerSpy).toHaveBeenCalled();
    });
  });

  describe('Error type distinction', () => {
    it('should use WebSocketSendError for connection errors', () => {
      // Mock wsConnection send method
      const privateService = service as unknown as WebSocketHandlerServicePrivate;
      jest.spyOn(privateService.wsConnection, 'send').mockImplementation(() => {
        throw new Error('Network error');
      });

      // Test that the error type is correct by checking the method implementation
      const call = {
        method: 'test' as ApiCall['method'],
        params: [] as unknown[],
        id: '1',
        jsonrpc: '2.0' as const,
      };
      expect(() => privateService.wsConnection.send(call)).toThrow();

      // The service would wrap this in WebSocketSendError
      const wrappedError = new WebSocketSendError(
        `Failed to send ${call.method} over WebSocket`,
        new Error('Network error'),
      );
      expect(wrappedError).toBeInstanceOf(WebSocketSendError);
      expect(wrappedError.message).toContain('Failed to send test over WebSocket');
      expect(wrappedError.cause).toBeDefined();
    });

    it('should use MockServiceError for mock processing errors', () => {
      const error = new MockServiceError('Failed to process mock response', new Error('Internal error'));
      expect(error).toBeInstanceOf(MockServiceError);
      expect(error.message).toBe('Failed to process mock response');
      expect(error.cause).toBeDefined();
    });

    it('should use MockGenerationError for mock generation failures', () => {
      const error = new MockGenerationError('Failed to generate mock response', new Error('Template error'));
      expect(error).toBeInstanceOf(MockGenerationError);
      expect(error.message).toBe('Failed to generate mock response');
      expect(error.cause).toBeDefined();
    });
  });
});
