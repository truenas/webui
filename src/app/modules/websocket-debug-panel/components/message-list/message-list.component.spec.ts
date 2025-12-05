/* eslint-disable @typescript-eslint/dot-notation */
import { ElementRef } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { firstValueFrom } from 'rxjs';
import { WebSocketDebugMessage } from 'app/modules/websocket-debug-panel/interfaces/websocket-debug.interface';
import * as WebSocketDebugActions from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { selectMessages } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { MessageListComponent } from './message-list.component';

describe('MessageListComponent', () => {
  let spectator: Spectator<MessageListComponent>;
  let store$: MockStore;

  const mockMessages: WebSocketDebugMessage[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5000).toISOString(),
      direction: 'out',
      message: {
        jsonrpc: '2.0',
        id: '1',
        method: 'system.info' as never,
        params: [{ foo: 'bar' }],
      },
      methodName: 'system.info',
      isExpanded: false,
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      direction: 'in',
      message: {
        jsonrpc: '2.0',
        id: '2',
        result: { success: true },
      },
      isExpanded: false,
    },
  ];

  const createComponent = createComponentFactory({
    component: MessageListComponent,
    providers: [
      provideMockStore({
        initialState: {
          webSocketDebug: {
            messages: mockMessages,
          },
        },
        selectors: [
          {
            selector: selectMessages,
            value: mockMessages,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock crypto.randomUUID
    global.crypto = {
      randomUUID: jest.fn(() => `test-uuid-${Math.random()}`),
    } as unknown as Crypto;

    spectator = createComponent();
    store$ = spectator.inject(MockStore);
    jest.spyOn(store$, 'dispatch');
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('message formatting', () => {
    it('should format messages with time, method name and preview', async () => {
      const messages = await firstValueFrom(spectator.component.formattedMessages$);
      expect(messages).toHaveLength(2);
      expect(messages[0].formattedTime).toMatch(/\d+s ago/);
      expect(messages[0].methodName).toBe('system.info');
      expect(messages[0].messagePreview).toContain('{"foo":"bar"}');

      expect(messages[1].formattedTime).toMatch(/1m ago/);
      expect(messages[1].methodName).toBe('Unknown');
    });

    it('should format time correctly for different time ranges', () => {
      const component = spectator.component;

      // Test "just now"
      const now = new Date().toISOString();
      expect(component['formatTime'](now)).toBe('just now');

      // Test seconds ago
      const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
      expect(component['formatTime'](thirtySecondsAgo)).toMatch(/30s ago/);

      // Test minutes ago
      const fiveMinutesAgo = new Date(Date.now() - 300000).toISOString();
      expect(component['formatTime'](fiveMinutesAgo)).toMatch(/5m ago/);

      // Test hours ago (should show time)
      const twoHoursAgo = new Date(Date.now() - 7200000).toISOString();
      expect(component['formatTime'](twoHoursAgo)).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should extract method names correctly', () => {
      const component = spectator.component;

      // Test outgoing message with method
      const outMessage: WebSocketDebugMessage = {
        id: '1',
        timestamp: new Date().toISOString(),
        direction: 'out',
        message: {
          jsonrpc: '2.0',
          id: '1',
          method: 'user.create' as never,
        },
        isExpanded: false,
      };
      expect(component['getMethodName'](outMessage)).toBe('user.create');

      // Test incoming response
      const inResponse: WebSocketDebugMessage = {
        id: '2',
        timestamp: new Date().toISOString(),
        direction: 'in',
        message: {
          jsonrpc: '2.0',
          id: '2',
          msg: 'method',
        } as never,
        isExpanded: false,
      };
      expect(component['getMethodName'](inResponse)).toBe('Response');

      // Test message with cached methodName
      const cachedMessage: WebSocketDebugMessage = {
        id: '3',
        timestamp: new Date().toISOString(),
        direction: 'in',
        message: {
          jsonrpc: '2.0',
          id: '3',
          result: {},
        },
        methodName: 'cached.method',
        isExpanded: false,
      };
      expect(component['getMethodName'](cachedMessage)).toBe('cached.method');
    });

    it('should create message preview with truncation', () => {
      const component = spectator.component;

      // Test short message
      const shortMessage: WebSocketDebugMessage = {
        id: '1',
        timestamp: new Date().toISOString(),
        direction: 'out',
        message: {
          jsonrpc: '2.0',
          id: '1',
          method: 'test.method' as never,
          params: [{ test: 'data' }],
        },
        isExpanded: false,
      };
      expect(component['getMessagePreview'](shortMessage)).toBe('[{"test":"data"}]');

      // Test long message (should truncate)
      const longData = { data: 'x'.repeat(200) };
      const longMessage: WebSocketDebugMessage = {
        id: '2',
        timestamp: new Date().toISOString(),
        direction: 'out',
        message: {
          jsonrpc: '2.0',
          id: '2',
          method: 'test.method' as never,
          params: [longData],
        },
        isExpanded: false,
      };
      const preview = component['getMessagePreview'](longMessage);
      // eslint-disable-next-line jest/prefer-to-have-length
      expect(preview.length).toBe(153); // 150 + '...'
      expect(preview).toContain('...');
    });
  });

  describe('actions', () => {
    it('should dispatch clearMessages action', () => {
      spectator.component['clearMessages']();
      expect(store$.dispatch).toHaveBeenCalledWith(WebSocketDebugActions.clearMessages());
    });

    it('should dispatch toggleMessageExpansion action', () => {
      spectator.component['toggleMessage']('123');
      expect(store$.dispatch).toHaveBeenCalledWith(
        WebSocketDebugActions.toggleMessageExpansion({ messageId: '123' }),
      );
    });

    it('should copy message to clipboard', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: jest.fn().mockResolvedValue(undefined) },
        configurable: true,
      });
      const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText');

      const message: WebSocketDebugMessage = {
        id: '1',
        timestamp: new Date().toISOString(),
        direction: 'out',
        message: {
          jsonrpc: '2.0',
          id: '1',
          method: 'test' as never,
          params: [{ foo: 'bar' }],
        },
        isExpanded: false,
      };

      spectator.component['copyMessage'](message);

      expect(writeTextSpy).toHaveBeenCalledWith(JSON.stringify(message.message, null, 2));
    });
  });

  describe('auto-scroll functionality', () => {
    it('should enable auto-scroll by default', () => {
      expect(spectator.component.autoScroll).toBe(true);
    });

    it('should setup auto-scroll subscription on init', async () => {
      const mockViewport = {
        nativeElement: {
          scrollTop: 0,
          scrollHeight: 1000,
        },
      } as ElementRef<HTMLDivElement>;

      spectator.component['messageViewport'] = mockViewport;
      spectator.component.autoScroll = true;

      // Trigger ngAfterViewInit
      spectator.component.ngAfterViewInit();

      // Wait for the timeout in the component
      await new Promise((resolve) => {
        setTimeout(resolve, 150);
      });
      expect(mockViewport.nativeElement.scrollTop).toBe(mockViewport.nativeElement.scrollHeight);
    });

    it('should not scroll when auto-scroll is disabled', async () => {
      const mockViewport = {
        nativeElement: {
          scrollTop: 0,
          scrollHeight: 1000,
        },
      } as ElementRef<HTMLDivElement>;

      spectator.component['messageViewport'] = mockViewport;
      spectator.component.autoScroll = false;

      // Trigger ngAfterViewInit
      spectator.component.ngAfterViewInit();

      // Wait and verify scrollTop was not changed
      await new Promise((resolve) => {
        setTimeout(resolve, 150);
      });
      expect(mockViewport.nativeElement.scrollTop).toBe(0);
    });
  });

  describe('filter functionality', () => {
    beforeEach(() => {
      // Initialize component with messages
      spectator.component.ngAfterViewInit();
      spectator.detectChanges();
    });

    it('should initialize with empty filter text', () => {
      expect(spectator.component['filterText']).toBe('');
    });

    it('should show all messages when filter is empty', () => {
      spectator.component['filterText'] = '';
      spectator.component['applyFilter']();
      expect(spectator.component['filteredMessagesArray']).toHaveLength(2);
      expect(spectator.component['hasMessages']).toBe(true);
    });

    it('should filter messages by method name (case-insensitive)', () => {
      // Test filtering for "system"
      spectator.component['filterText'] = 'system';
      spectator.component['applyFilter']();
      expect(spectator.component['filteredMessagesArray']).toHaveLength(1);
      expect(spectator.component['filteredMessagesArray'][0].methodName).toBe('system.info');

      // Test case-insensitive filtering
      spectator.component['filterText'] = 'SYSTEM';
      spectator.component['applyFilter']();
      expect(spectator.component['filteredMessagesArray']).toHaveLength(1);

      // Test partial match
      spectator.component['filterText'] = 'info';
      spectator.component['applyFilter']();
      expect(spectator.component['filteredMessagesArray']).toHaveLength(1);
      expect(spectator.component['filteredMessagesArray'][0].methodName).toBe('system.info');
    });

    it('should show no messages when filter matches nothing', () => {
      spectator.component['filterText'] = 'nonexistent';
      spectator.component['applyFilter']();
      expect(spectator.component['filteredMessagesArray']).toHaveLength(0);
      expect(spectator.component['hasMessages']).toBe(false);
    });

    it('should update hasMessages based on filtered results', () => {
      // With matching filter
      spectator.component['filterText'] = 'system';
      spectator.component['applyFilter']();
      expect(spectator.component['hasMessages']).toBe(true);

      // With non-matching filter
      spectator.component['filterText'] = 'xyz';
      spectator.component['applyFilter']();
      expect(spectator.component['hasMessages']).toBe(false);

      // Clear filter
      spectator.component['filterText'] = '';
      spectator.component['applyFilter']();
      expect(spectator.component['hasMessages']).toBe(true);
    });

    it('should trim whitespace in filter text', () => {
      spectator.component['filterText'] = '  system  ';
      spectator.component['applyFilter']();
      expect(spectator.component['filteredMessagesArray']).toHaveLength(1);
      expect(spectator.component['filteredMessagesArray'][0].methodName).toBe('system.info');
    });

    it('should handle filter for messages with Unknown method name', () => {
      spectator.component['filterText'] = 'unknown';
      spectator.component['applyFilter']();
      expect(spectator.component['filteredMessagesArray']).toHaveLength(1);
      expect(spectator.component['filteredMessagesArray'][0].methodName).toBe('Unknown');
    });
  });

  describe('create mock functionality', () => {
    it('should dispatch createMockFromResponse action with method name and result', () => {
      const message = {
        id: '1',
        timestamp: new Date().toISOString(),
        direction: 'in' as const,
        message: {
          jsonrpc: '2.0' as const,
          id: '1',
          result: { data: 'test' },
        },
        methodName: 'test.method',
        formattedTime: 'just now',
        messagePreview: '{"data":"test"}',
        isExpanded: false,
      };

      spectator.component['createMockFromMessage'](message);

      expect(store$.dispatch).toHaveBeenCalledWith(
        WebSocketDebugActions.createMockFromResponse({
          methodName: 'test.method',
          responseResult: { data: 'test' },
        }),
      );
    });

    it('should dispatch with null result when message has no result property', () => {
      const message = {
        id: '1',
        timestamp: new Date().toISOString(),
        direction: 'in' as const,
        message: {
          jsonrpc: '2.0' as const,
          id: '1',
          error: { code: -32600, message: 'Invalid Request' },
        } as never,
        methodName: 'test.method',
        formattedTime: 'just now',
        messagePreview: '{}',
        isExpanded: false,
      };

      spectator.component['createMockFromMessage'](message);

      expect(store$.dispatch).toHaveBeenCalledWith(
        WebSocketDebugActions.createMockFromResponse({
          methodName: 'test.method',
          responseResult: null,
        }),
      );
    });
  });

  describe('canCreateMock', () => {
    it('should return true for incoming response with result and valid method name', () => {
      const message = {
        id: '1',
        timestamp: new Date().toISOString(),
        direction: 'in' as const,
        message: {
          jsonrpc: '2.0' as const,
          id: '1',
          result: { data: 'test' },
        },
        methodName: 'test.method',
        formattedTime: 'just now',
        messagePreview: '{"data":"test"}',
        isExpanded: false,
      };

      expect(spectator.component['canCreateMock'](message)).toBe(true);
    });

    it('should return false for outgoing messages', () => {
      const message = {
        id: '1',
        timestamp: new Date().toISOString(),
        direction: 'out' as const,
        message: {
          jsonrpc: '2.0' as const,
          id: '1',
          method: 'test.method' as never,
        },
        methodName: 'test.method',
        formattedTime: 'just now',
        messagePreview: '[]',
        isExpanded: false,
      };

      expect(spectator.component['canCreateMock'](message)).toBe(false);
    });

    it('should return false for incoming messages without result', () => {
      const message = {
        id: '1',
        timestamp: new Date().toISOString(),
        direction: 'in' as const,
        message: {
          jsonrpc: '2.0' as const,
          id: '1',
          error: { code: -32600, message: 'Invalid Request' },
        } as never,
        methodName: 'test.method',
        formattedTime: 'just now',
        messagePreview: '{}',
        isExpanded: false,
      };

      expect(spectator.component['canCreateMock'](message)).toBe(false);
    });

    it('should return false for messages with Unknown method name', () => {
      const message = {
        id: '1',
        timestamp: new Date().toISOString(),
        direction: 'in' as const,
        message: {
          jsonrpc: '2.0' as const,
          id: '1',
          result: {},
        },
        methodName: 'Unknown',
        formattedTime: 'just now',
        messagePreview: '{}',
        isExpanded: false,
      };

      expect(spectator.component['canCreateMock'](message)).toBe(false);
    });

    it('should return false for messages with Response method name', () => {
      const message = {
        id: '1',
        timestamp: new Date().toISOString(),
        direction: 'in' as const,
        message: {
          jsonrpc: '2.0' as const,
          id: '1',
          result: {},
        },
        methodName: 'Response',
        formattedTime: 'just now',
        messagePreview: '{}',
        isExpanded: false,
      };

      expect(spectator.component['canCreateMock'](message)).toBe(false);
    });

    it('should return false for messages with empty method name', () => {
      const message = {
        id: '1',
        timestamp: new Date().toISOString(),
        direction: 'in' as const,
        message: {
          jsonrpc: '2.0' as const,
          id: '1',
          result: {},
        },
        methodName: '',
        formattedTime: 'just now',
        messagePreview: '{}',
        isExpanded: false,
      };

      expect(spectator.component['canCreateMock'](message)).toBe(false);
    });
  });
});
