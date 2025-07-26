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

    it('should scroll to bottom when new messages arrive and auto-scroll is enabled', () => {
      const mockElement = {
        scrollHeight: 1000,
        scrollTop: 0,
      };

      spectator.component['messageViewport'] = {
        nativeElement: mockElement,
      } as ElementRef<HTMLDivElement>;

      spectator.component.autoScroll = true;
      spectator.component['shouldScrollToBottom'] = true;

      spectator.component['ngAfterViewChecked']();

      expect(mockElement.scrollTop).toBe(1000);
      expect(spectator.component['shouldScrollToBottom']).toBe(false);
    });

    it('should not scroll when auto-scroll is disabled', () => {
      const mockElement = {
        scrollHeight: 1000,
        scrollTop: 0,
      };

      spectator.component['messageViewport'] = {
        nativeElement: mockElement,
      } as ElementRef<HTMLDivElement>;

      spectator.component.autoScroll = false;
      spectator.component['shouldScrollToBottom'] = false;

      spectator.component['ngAfterViewChecked']();

      expect(mockElement.scrollTop).toBe(0);
    });
  });

  describe('trackBy function', () => {
    it('should track messages by id', () => {
      const message = {
        id: 'test-123',
        timestamp: new Date().toISOString(),
        direction: 'out' as const,
        message: {
          jsonrpc: '2.0' as const,
          id: 'test-123',
          method: 'test' as never,
        },
        formattedTime: '1s ago',
        methodName: 'test',
        messagePreview: '{}',
        isExpanded: false,
      };

      expect(spectator.component['trackByMessage'](0, message)).toBe('test-123');
    });
  });
});
