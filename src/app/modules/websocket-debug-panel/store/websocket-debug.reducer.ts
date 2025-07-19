import { createReducer, on } from '@ngrx/store';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { WebSocketDebugMessage } from 'app/modules/websocket-debug-panel/interfaces/websocket-debug.interface';
import * as WebSocketDebugActions from './websocket-debug.actions';

export interface WebSocketDebugState {
  messages: WebSocketDebugMessage[];
  mockConfigs: MockConfig[];
  isPanelOpen: boolean;
  activeTab: string;
  messageLimit: number;
}

export const initialState: WebSocketDebugState = {
  messages: [] as WebSocketDebugMessage[],
  mockConfigs: [] as MockConfig[],
  isPanelOpen: false,
  activeTab: 'websocket',
  messageLimit: 15,
};

export const webSocketDebugReducer = createReducer(
  initialState,
  on(WebSocketDebugActions.messageReceived, (state, { message }) => {
    const messages = [...state.messages, message];
    if (messages.length > state.messageLimit) {
      messages.splice(0, messages.length - state.messageLimit);
    }
    return { ...state, messages };
  }),
  on(WebSocketDebugActions.messageSent, (state, { message }) => {
    const messages = [...state.messages, message];
    if (messages.length > state.messageLimit) {
      messages.splice(0, messages.length - state.messageLimit);
    }
    return { ...state, messages };
  }),
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
);
