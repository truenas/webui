import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WebSocketDebugState } from './websocket-debug.reducer';

export const selectWebSocketDebugState = createFeatureSelector<WebSocketDebugState>('webSocketDebug');

export const selectMessages = createSelector(
  selectWebSocketDebugState,
  (state) => state.messages,
);

export const selectMockConfigs = createSelector(
  selectWebSocketDebugState,
  (state) => state.mockConfigs,
);

export const selectIsPanelOpen = createSelector(
  selectWebSocketDebugState,
  (state) => state.isPanelOpen,
);

export const selectActiveTab = createSelector(
  selectWebSocketDebugState,
  (state) => state.activeTab,
);

export const selectMessageLimit = createSelector(
  selectWebSocketDebugState,
  (state) => state.messageLimit,
);

export const selectEnabledMockConfigs = createSelector(
  selectMockConfigs,
  (configs) => configs.filter((config) => config.enabled),
);

export const selectHasActiveMocks = createSelector(
  selectEnabledMockConfigs,
  (configs) => configs.length > 0,
);

export const selectMessageCount = createSelector(
  selectMessages,
  (messages) => messages.length,
);

export const selectIncomingMessages = createSelector(
  selectMessages,
  (messages) => messages.filter((msg) => msg.direction === 'in'),
);

export const selectOutgoingMessages = createSelector(
  selectMessages,
  (messages) => messages.filter((msg) => msg.direction === 'out'),
);

export const selectMockedMessages = createSelector(
  selectMessages,
  (messages) => messages.filter((msg) => msg.isMocked),
);
