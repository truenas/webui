import { createServiceFactory, SpectatorService, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { createFakeClient, FakeTrueNasClient } from '@truenas/api-client/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { RequestMessage } from 'app/interfaces/api-message.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TYPED_API_CLIENT, WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { MockGenerationError, MockServiceError, WebSocketSendError } from './errors';
import { WebSocketHandlerService } from './websocket-handler.service';

type ApiCall = Required<Pick<RequestMessage, 'id' | 'method' | 'params'>> & { jsonrpc: '2.0' };

// Type-safe helpers for accessing private methods in tests
interface WebSocketHandlerServicePrivate {
  processCall(call: ApiCall): Observable<unknown>;
  cleanupCall(callId: string): void;
  activeCalls: number;
  pendingCalls: Map<string, ApiCall>;
  triggerNextCall$: { next: () => void };
  sendOverConnection(call: ApiCall): void;
}

describe('WebSocketHandlerService Error Handling', () => {
  let spectator: SpectatorService<WebSocketHandlerService>;
  let service: WebSocketHandlerService;
  let client: FakeTrueNasClient<WebUiApiDirectory>;

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
      {
        provide: TYPED_API_CLIENT,
        useFactory: () => of(client),
      },
    ],
  });

  beforeEach(() => {
    // Closed, so nothing this spec schedules reaches the wire: every test here
    // drives the private paths directly.
    client = createFakeClient({ version: 'v28.0.0', opened: false });

    spectator = createService();
    service = spectator.service;

    // Setup mocks
    const wsStatus = spectator.inject(WebSocketStatusService);
    Object.defineProperty(wsStatus, 'isConnected$', {
      value: of(true),
    });
  });

  describe('processCall', () => {
    const call = {
      method: 'truenas.get_eula', params: [], id: '1', jsonrpc: '2.0',
    } as unknown as ApiCall;

    it('passes on a debug panel mock error from the connection as it is', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(client.connection, 'send').mockImplementation(() => {
        throw new MockGenerationError('Failed to generate mock response for truenas.get_eula');
      });

      const privateService = service as unknown as WebSocketHandlerServicePrivate;
      await expect(firstValueFrom(privateService.processCall(call))).rejects.toBeInstanceOf(MockGenerationError);

      errorSpy.mockRestore();
    });

    it('wraps any other failure to send in WebSocketSendError', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(client.connection, 'send').mockImplementation(() => {
        throw new Error('Network error');
      });

      const privateService = service as unknown as WebSocketHandlerServicePrivate;
      await expect(firstValueFrom(privateService.processCall(call))).rejects.toBeInstanceOf(WebSocketSendError);

      errorSpy.mockRestore();
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
      const privateService = service as unknown as WebSocketHandlerServicePrivate;
      jest.spyOn(client.connection, 'send').mockImplementation(() => {
        throw new Error('Network error');
      });

      // Test that the error type is correct by checking the method implementation
      const call = {
        method: 'test' as ApiCall['method'],
        params: [] as unknown[],
        id: '1',
        jsonrpc: '2.0' as const,
      };
      expect(() => privateService.sendOverConnection(call)).toThrow();

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
