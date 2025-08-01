import { createReducer, on } from '@ngrx/store';
import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { defaultMessageLimit, tabs } from 'app/modules/websocket-debug-panel/constants';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { WebSocketDebugMessage } from 'app/modules/websocket-debug-panel/interfaces/websocket-debug.interface';
import { addMessageWithLimit } from 'app/modules/websocket-debug-panel/utils/reducer-utils';
import * as WebSocketDebugActions from './websocket-debug.actions';

export interface WebSocketDebugState {
  messages: WebSocketDebugMessage[];
  mockConfigs: MockConfig[];
  isPanelOpen: boolean;
  activeTab: string;
  messageLimit: number;
  enclosureMock: {
    enabled: boolean;
    controllerModel: EnclosureModel | null;
    expansionModels: EnclosureModel[];
    scenario: MockEnclosureScenario;
  };
}

export const initialState: WebSocketDebugState = {
  messages: [] as WebSocketDebugMessage[],
  mockConfigs: [] as MockConfig[],
  isPanelOpen: false,
  activeTab: tabs.WEBSOCKET,
  messageLimit: defaultMessageLimit,
  enclosureMock: {
    enabled: false,
    controllerModel: null,
    expansionModels: [],
    scenario: MockEnclosureScenario.FillSomeSlots,
  },
};

export const webSocketDebugReducer = createReducer(
  initialState,
  on(WebSocketDebugActions.messageReceived, (state, { message }) => addMessageWithLimit(state, message)),
  on(WebSocketDebugActions.messageSent, (state, { message }) => addMessageWithLimit(state, message)),
  on(WebSocketDebugActions.clearMessages, (state) => ({
    ...state,
    messages: [] as WebSocketDebugMessage[],
  })),
  on(WebSocketDebugActions.togglePanel, (state) => ({
    ...state,
    isPanelOpen: !state.isPanelOpen,
  })),
  on(WebSocketDebugActions.setPanelOpen, (state, { isOpen }) => ({
    ...state,
    isPanelOpen: isOpen,
  })),
  on(WebSocketDebugActions.setActiveTab, (state, { tab }) => ({
    ...state,
    activeTab: tab,
  })),
  on(WebSocketDebugActions.addMockConfig, (state, { config }) => ({
    ...state,
    mockConfigs: [...state.mockConfigs, config],
  })),
  on(WebSocketDebugActions.updateMockConfig, (state, { config }) => ({
    ...state,
    mockConfigs: state.mockConfigs.map((mockConfig) => (mockConfig.id === config.id ? config : mockConfig)),
  })),
  on(WebSocketDebugActions.deleteMockConfig, (state, { id }) => ({
    ...state,
    mockConfigs: state.mockConfigs.filter((mockConfig) => mockConfig.id !== id),
  })),
  on(WebSocketDebugActions.toggleMockConfig, (state, { id }) => ({
    ...state,
    mockConfigs: state.mockConfigs.map(
      (mockConfig) => (mockConfig.id === id ? { ...mockConfig, enabled: !mockConfig.enabled } : mockConfig),
    ),
  })),
  on(WebSocketDebugActions.mockConfigsLoaded, (state, { configs }) => ({
    ...state,
    mockConfigs: configs,
  })),
  on(WebSocketDebugActions.setMessageLimit, (state, { limit }) => ({
    ...state,
    messageLimit: limit,
  })),
  on(WebSocketDebugActions.toggleMessageExpansion, (state, { messageId }) => ({
    ...state,
    messages: state.messages.map((msg) => {
      if (msg.id === messageId) {
        return { ...msg, isExpanded: !msg.isExpanded };
      }
      return msg;
    }),
  })),
  on(WebSocketDebugActions.setEnclosureMockConfig, (state, { config }) => ({
    ...state,
    enclosureMock: config,
  })),
  on(WebSocketDebugActions.toggleEnclosureMock, (state, { enabled }) => ({
    ...state,
    enclosureMock: {
      ...state.enclosureMock,
      enabled,
    },
  })),
  on(WebSocketDebugActions.updateEnclosureScenario, (state, { scenario }) => ({
    ...state,
    enclosureMock: {
      ...state.enclosureMock,
      scenario,
    },
  })),
  on(WebSocketDebugActions.enclosureMockConfigLoaded, (state, { config }) => ({
    ...state,
    enclosureMock: config || initialState.enclosureMock,
  })),
);
