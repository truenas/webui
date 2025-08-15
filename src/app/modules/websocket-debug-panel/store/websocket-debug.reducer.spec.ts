import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { WebSocketDebugMessage } from 'app/modules/websocket-debug-panel/interfaces/websocket-debug.interface';
import * as WebSocketDebugActions from './websocket-debug.actions';
import { webSocketDebugReducer, initialState, WebSocketDebugState } from './websocket-debug.reducer';

describe('WebSocketDebugReducer', () => {
  describe('initial state', () => {
    it('should return the initial state', () => {
      const action = { type: 'Unknown' };
      const state = webSocketDebugReducer(undefined, action);

      expect(state).toEqual(initialState);
      expect(state.messages).toEqual([]);
      expect(state.mockConfigs).toEqual([]);
      expect(state.isPanelOpen).toBe(false);
      expect(state.activeTab).toBe('websocket');
      expect(state.messageLimit).toBe(200);
      expect(state.enclosureMock).toEqual({
        enabled: false,
        controllerModel: null,
        expansionModels: [],
        scenario: MockEnclosureScenario.FillSomeSlots,
      });
    });
  });

  describe('message actions', () => {
    it('should add received message to state', () => {
      const message: WebSocketDebugMessage = {
        id: 'msg-1',
        timestamp: new Date().toISOString(),
        direction: 'in',
        message: { jsonrpc: '2.0', id: '1', result: {} },
      };

      const action = WebSocketDebugActions.messageReceived({ message });
      const state = webSocketDebugReducer(initialState, action);

      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]).toEqual(message);
    });

    it('should add sent message to state', () => {
      const message: WebSocketDebugMessage = {
        id: 'msg-2',
        timestamp: new Date().toISOString(),
        direction: 'out',
        message: {
          jsonrpc: '2.0', id: '2', method: 'test.method' as never, params: [],
        },
      };

      const action = WebSocketDebugActions.messageSent({ message });
      const state = webSocketDebugReducer(initialState, action);

      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]).toEqual(message);
    });

    it('should respect message limit when adding messages', () => {
      const stateWithLimit: WebSocketDebugState = {
        ...initialState,
        messageLimit: 3,
        messages: [
          {
            id: '1', timestamp: '2024-01-01', direction: 'in', message: { jsonrpc: '2.0', id: '1', result: {} },
          },
          {
            id: '2', timestamp: '2024-01-02', direction: 'out', message: { jsonrpc: '2.0', id: '2', method: 'test' as never },
          },
          {
            id: '3', timestamp: '2024-01-03', direction: 'in', message: { jsonrpc: '2.0', id: '3', result: {} },
          },
        ],
      };

      const newMessage: WebSocketDebugMessage = {
        id: '4',
        timestamp: '2024-01-04',
        direction: 'out',
        message: { jsonrpc: '2.0', id: '4', method: 'new' as never },
      };

      const action = WebSocketDebugActions.messageReceived({ message: newMessage });
      const state = webSocketDebugReducer(stateWithLimit, action);

      expect(state.messages).toHaveLength(3);
      expect(state.messages[0].id).toBe('2'); // First message removed
      expect(state.messages[2].id).toBe('4'); // New message added
    });

    it('should clear all messages', () => {
      const stateWithMessages: WebSocketDebugState = {
        ...initialState,
        messages: [
          {
            id: '1', timestamp: '2024-01-01', direction: 'in', message: { jsonrpc: '2.0', id: '1', result: {} },
          },
          {
            id: '2', timestamp: '2024-01-02', direction: 'out', message: { jsonrpc: '2.0', id: '2', method: 'test' as never },
          },
        ],
      };

      const action = WebSocketDebugActions.clearMessages();
      const state = webSocketDebugReducer(stateWithMessages, action);

      expect(state.messages).toEqual([]);
    });

    it('should toggle message expansion', () => {
      const stateWithMessages: WebSocketDebugState = {
        ...initialState,
        messages: [
          {
            id: 'msg-1', timestamp: '2024-01-01', direction: 'in', message: { jsonrpc: '2.0', id: '1', result: {} }, isExpanded: false,
          },
          {
            id: 'msg-2', timestamp: '2024-01-02', direction: 'out', message: { jsonrpc: '2.0', id: '2', method: 'test' as never }, isExpanded: true,
          },
        ],
      };

      const action = WebSocketDebugActions.toggleMessageExpansion({ messageId: 'msg-1' });
      const state = webSocketDebugReducer(stateWithMessages, action);

      expect(state.messages[0].isExpanded).toBe(true);
      expect(state.messages[1].isExpanded).toBe(true); // Unchanged
    });

    it('should set message limit', () => {
      const action = WebSocketDebugActions.setMessageLimit({ limit: 500 });
      const state = webSocketDebugReducer(initialState, action);

      expect(state.messageLimit).toBe(500);
    });
  });

  describe('panel actions', () => {
    it('should toggle panel open state', () => {
      const action = WebSocketDebugActions.togglePanel();
      const state = webSocketDebugReducer(initialState, action);

      expect(state.isPanelOpen).toBe(true);

      const state2 = webSocketDebugReducer(state, action);
      expect(state2.isPanelOpen).toBe(false);
    });

    it('should set panel open state', () => {
      const action = WebSocketDebugActions.setPanelOpen({ isOpen: true });
      const state = webSocketDebugReducer(initialState, action);

      expect(state.isPanelOpen).toBe(true);

      const action2 = WebSocketDebugActions.setPanelOpen({ isOpen: false });
      const state2 = webSocketDebugReducer(state, action2);

      expect(state2.isPanelOpen).toBe(false);
    });

    it('should set active tab', () => {
      const action = WebSocketDebugActions.setActiveTab({ tab: 'mock' });
      const state = webSocketDebugReducer(initialState, action);

      expect(state.activeTab).toBe('mock');
    });
  });

  describe('mock config actions', () => {
    const mockConfig1: MockConfig = {
      id: 'config-1',
      enabled: true,
      methodName: 'test.method',
      response: { result: { success: true } },
    };

    const mockConfig2: MockConfig = {
      id: 'config-2',
      enabled: false,
      methodName: 'another.method',
      response: { result: null },
    };

    it('should add mock config', () => {
      const action = WebSocketDebugActions.addMockConfig({ config: mockConfig1 });
      const state = webSocketDebugReducer(initialState, action);

      expect(state.mockConfigs).toHaveLength(1);
      expect(state.mockConfigs[0]).toEqual(mockConfig1);
    });

    it('should update mock config', () => {
      const stateWithConfigs: WebSocketDebugState = {
        ...initialState,
        mockConfigs: [mockConfig1, mockConfig2],
      };

      const updatedConfig: MockConfig = {
        ...mockConfig1,
        methodName: 'updated.method',
        enabled: false,
      };

      const action = WebSocketDebugActions.updateMockConfig({ config: updatedConfig });
      const state = webSocketDebugReducer(stateWithConfigs, action);

      expect(state.mockConfigs).toHaveLength(2);
      expect(state.mockConfigs[0]).toEqual(updatedConfig);
      expect(state.mockConfigs[1]).toEqual(mockConfig2); // Unchanged
    });

    it('should delete mock config', () => {
      const stateWithConfigs: WebSocketDebugState = {
        ...initialState,
        mockConfigs: [mockConfig1, mockConfig2],
      };

      const action = WebSocketDebugActions.deleteMockConfig({ id: 'config-1' });
      const state = webSocketDebugReducer(stateWithConfigs, action);

      expect(state.mockConfigs).toHaveLength(1);
      expect(state.mockConfigs[0]).toEqual(mockConfig2);
    });

    it('should toggle mock config enabled state', () => {
      const stateWithConfigs: WebSocketDebugState = {
        ...initialState,
        mockConfigs: [mockConfig1, mockConfig2],
      };

      const action = WebSocketDebugActions.toggleMockConfig({ id: 'config-1' });
      const state = webSocketDebugReducer(stateWithConfigs, action);

      expect(state.mockConfigs[0].enabled).toBe(false); // Toggled
      expect(state.mockConfigs[1].enabled).toBe(false); // Unchanged
    });

    it('should load mock configs', () => {
      const configs: MockConfig[] = [mockConfig1, mockConfig2];
      const action = WebSocketDebugActions.mockConfigsLoaded({ configs });
      const state = webSocketDebugReducer(initialState, action);

      expect(state.mockConfigs).toEqual(configs);
    });

    it('should preserve other state properties when updating mock configs', () => {
      const stateWithData: WebSocketDebugState = {
        ...initialState,
        messages: [
          {
            id: 'msg-1', timestamp: '2024-01-01', direction: 'in', message: { jsonrpc: '2.0', id: '1', result: {} },
          },
        ],
        isPanelOpen: true,
        activeTab: 'mock',
      };

      const action = WebSocketDebugActions.addMockConfig({ config: mockConfig1 });
      const state = webSocketDebugReducer(stateWithData, action);

      expect(state.messages).toEqual(stateWithData.messages);
      expect(state.isPanelOpen).toBe(true);
      expect(state.activeTab).toBe('mock');
      expect(state.mockConfigs).toHaveLength(1);
    });
  });

  describe('enclosure mock actions', () => {
    it('should set enclosure mock config', () => {
      const config = {
        enabled: true,
        controllerModel: EnclosureModel.M40,
        expansionModels: [EnclosureModel.Es24F],
        scenario: MockEnclosureScenario.FillAllSlots,
      };

      const action = WebSocketDebugActions.setEnclosureMockConfig({ config });
      const state = webSocketDebugReducer(initialState, action);

      expect(state.enclosureMock).toEqual(config);
    });

    it('should toggle enclosure mock enabled state', () => {
      const action = WebSocketDebugActions.toggleEnclosureMock({ enabled: true });
      const state = webSocketDebugReducer(initialState, action);

      expect(state.enclosureMock.enabled).toBe(true);
      expect(state.enclosureMock.controllerModel).toBeNull(); // Other properties unchanged
      expect(state.enclosureMock.expansionModels).toEqual([]);
      expect(state.enclosureMock.scenario).toBe(MockEnclosureScenario.FillSomeSlots);

      const action2 = WebSocketDebugActions.toggleEnclosureMock({ enabled: false });
      const state2 = webSocketDebugReducer(state, action2);

      expect(state2.enclosureMock.enabled).toBe(false);
    });

    it('should update enclosure scenario', () => {
      const action = WebSocketDebugActions.updateEnclosureScenario({ scenario: MockEnclosureScenario.FillAllSlots });
      const state = webSocketDebugReducer(initialState, action);

      expect(state.enclosureMock.scenario).toBe(MockEnclosureScenario.FillAllSlots);
      expect(state.enclosureMock.enabled).toBe(false); // Other properties unchanged
      expect(state.enclosureMock.controllerModel).toBeNull();
      expect(state.enclosureMock.expansionModels).toEqual([]);
    });

    it('should load enclosure mock config', () => {
      const config = {
        enabled: true,
        controllerModel: EnclosureModel.M50,
        expansionModels: [EnclosureModel.Es24F, EnclosureModel.Es60],
        scenario: MockEnclosureScenario.FillSomeSlots,
      };

      const action = WebSocketDebugActions.enclosureMockConfigLoaded({ config });
      const state = webSocketDebugReducer(initialState, action);

      expect(state.enclosureMock).toEqual(config);
    });

    it('should reset to initial enclosure mock state when loading null config', () => {
      const stateWithConfig: WebSocketDebugState = {
        ...initialState,
        enclosureMock: {
          enabled: true,
          controllerModel: EnclosureModel.M40,
          expansionModels: [EnclosureModel.Es24F],
          scenario: MockEnclosureScenario.FillAllSlots,
        },
      };

      const action = WebSocketDebugActions.enclosureMockConfigLoaded({ config: null });
      const state = webSocketDebugReducer(stateWithConfig, action);

      expect(state.enclosureMock).toEqual(initialState.enclosureMock);
      expect(state.enclosureMock.enabled).toBe(false);
      expect(state.enclosureMock.controllerModel).toBeNull();
      expect(state.enclosureMock.expansionModels).toEqual([]);
      expect(state.enclosureMock.scenario).toBe(MockEnclosureScenario.FillSomeSlots);
    });

    it('should preserve other state when updating enclosure mock', () => {
      const stateWithData: WebSocketDebugState = {
        ...initialState,
        messages: [
          {
            id: 'msg-1', timestamp: '2024-01-01', direction: 'in', message: { jsonrpc: '2.0', id: '1', result: {} },
          },
        ],
        mockConfigs: [{
          id: 'config-1',
          enabled: true,
          methodName: 'test',
          response: { result: {} },
        }],
        isPanelOpen: true,
        activeTab: 'enclosure',
      };

      const action = WebSocketDebugActions.toggleEnclosureMock({ enabled: true });
      const state = webSocketDebugReducer(stateWithData, action);

      expect(state.messages).toEqual(stateWithData.messages);
      expect(state.mockConfigs).toEqual(stateWithData.mockConfigs);
      expect(state.isPanelOpen).toBe(true);
      expect(state.activeTab).toBe('enclosure');
      expect(state.enclosureMock.enabled).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle updating non-existent mock config', () => {
      const updatedConfig: MockConfig = {
        id: 'non-existent',
        enabled: true,
        methodName: 'test',
        response: { result: {} },
      };

      const action = WebSocketDebugActions.updateMockConfig({ config: updatedConfig });
      const state = webSocketDebugReducer(initialState, action);

      expect(state.mockConfigs).toEqual([]); // No changes
    });

    it('should handle deleting non-existent mock config', () => {
      const stateWithConfig: WebSocketDebugState = {
        ...initialState,
        mockConfigs: [{
          id: 'existing',
          enabled: true,
          methodName: 'test',
          response: { result: {} },
        }],
      };

      const action = WebSocketDebugActions.deleteMockConfig({ id: 'non-existent' });
      const state = webSocketDebugReducer(stateWithConfig, action);

      expect(state.mockConfigs).toHaveLength(1); // No changes
    });

    it('should handle toggling non-existent mock config', () => {
      const stateWithConfig: WebSocketDebugState = {
        ...initialState,
        mockConfigs: [{
          id: 'existing',
          enabled: true,
          methodName: 'test',
          response: { result: {} },
        }],
      };

      const action = WebSocketDebugActions.toggleMockConfig({ id: 'non-existent' });
      const state = webSocketDebugReducer(stateWithConfig, action);

      expect(state.mockConfigs[0].enabled).toBe(true); // No changes
    });

    it('should handle toggling non-existent message expansion', () => {
      const stateWithMessage: WebSocketDebugState = {
        ...initialState,
        messages: [{
          id: 'msg-1',
          timestamp: '2024-01-01',
          direction: 'in',
          message: { jsonrpc: '2.0', id: '1', result: {} },
          isExpanded: false,
        }],
      };

      const action = WebSocketDebugActions.toggleMessageExpansion({ messageId: 'non-existent' });
      const state = webSocketDebugReducer(stateWithMessage, action);

      expect(state.messages[0].isExpanded).toBe(false); // No changes
    });
  });
});
