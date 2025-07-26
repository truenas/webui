import { IncomingMessage } from 'app/interfaces/api-message.interface';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { WebSocketDebugMessage } from 'app/modules/websocket-debug-panel/interfaces/websocket-debug.interface';
import { WebSocketDebugState } from 'app/modules/websocket-debug-panel/store/websocket-debug.reducer';
import { addMessageWithLimit } from './reducer-utils';

describe('reducer-utils', () => {
  describe('addMessageWithLimit', () => {
    const createMockMessage = (id: string): WebSocketDebugMessage => ({
      id,
      timestamp: new Date().toISOString(),
      direction: 'in',
      message: { id: 'test-123', msg: 'test' } as IncomingMessage,
      isMocked: false,
    });

    const createMockState = (messageLimit = 3): WebSocketDebugState => ({
      messages: [],
      mockConfigs: [],
      isPanelOpen: false,
      activeTab: 'websocket',
      messageLimit,
    });

    it('should add message when under limit', () => {
      const state = createMockState();
      const message = createMockMessage('1');

      const result = addMessageWithLimit(state, message);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toBe(message);
    });

    it('should add multiple messages when under limit', () => {
      const state = createMockState();
      state.messages = [createMockMessage('1'), createMockMessage('2')];
      const message = createMockMessage('3');

      const result = addMessageWithLimit(state, message);

      expect(result.messages).toHaveLength(3);
      expect(result.messages[2]).toBe(message);
    });

    it('should remove oldest message when exceeding limit', () => {
      const state = createMockState(2);
      state.messages = [createMockMessage('1'), createMockMessage('2')];
      const message = createMockMessage('3');

      const result = addMessageWithLimit(state, message);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].id).toBe('2');
      expect(result.messages[1]).toBe(message);
    });

    it('should handle limit of 1', () => {
      const state = createMockState(1);
      state.messages = [createMockMessage('1')];
      const message = createMockMessage('2');

      const result = addMessageWithLimit(state, message);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toBe(message);
    });

    it('should handle empty message array', () => {
      const state = createMockState(5);
      const message = createMockMessage('1');

      const result = addMessageWithLimit(state, message);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toBe(message);
    });

    it('should preserve other state properties', () => {
      const state = createMockState();
      state.isPanelOpen = true;
      state.activeTab = 'mock-config';
      state.mockConfigs = [{ id: '1', name: 'test', enabled: true }] as MockConfig[];
      const message = createMockMessage('1');

      const result = addMessageWithLimit(state, message);

      expect(result.isPanelOpen).toBe(true);
      expect(result.activeTab).toBe('mock-config');
      expect(result.mockConfigs).toEqual(state.mockConfigs);
      expect(result.messageLimit).toBe(state.messageLimit);
    });

    it('should create new arrays without mutating original', () => {
      const state = createMockState();
      const originalMessages = [createMockMessage('1')];
      state.messages = originalMessages;
      const message = createMockMessage('2');

      const result = addMessageWithLimit(state, message);

      expect(result.messages).not.toBe(originalMessages);
      expect(originalMessages).toHaveLength(1);
      expect(result.messages).toHaveLength(2);
    });
  });
});
