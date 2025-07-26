import { createAction, props } from '@ngrx/store';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { WebSocketDebugMessage } from 'app/modules/websocket-debug-panel/interfaces/websocket-debug.interface';

const actionPrefix = '[WebSocket Debug]';

export const messageReceived = createAction(
  `${actionPrefix} Message Received`,
  props<{ message: WebSocketDebugMessage }>(),
);

export const messageSent = createAction(
  `${actionPrefix} Message Sent`,
  props<{ message: WebSocketDebugMessage }>(),
);

export const clearMessages = createAction(
  `${actionPrefix} Clear Messages`,
);

export const togglePanel = createAction(
  `${actionPrefix} Toggle Panel`,
);

export const setPanelOpen = createAction(
  `${actionPrefix} Set Panel Open`,
  props<{ isOpen: boolean }>(),
);

export const setActiveTab = createAction(
  `${actionPrefix} Set Active Tab`,
  props<{ tab: string }>(),
);

export const addMockConfig = createAction(
  `${actionPrefix} Add Mock Config`,
  props<{ config: MockConfig }>(),
);

export const updateMockConfig = createAction(
  `${actionPrefix} Update Mock Config`,
  props<{ config: MockConfig }>(),
);

export const deleteMockConfig = createAction(
  `${actionPrefix} Delete Mock Config`,
  props<{ id: string }>(),
);

export const toggleMockConfig = createAction(
  `${actionPrefix} Toggle Mock Config`,
  props<{ id: string }>(),
);

export const loadMockConfigs = createAction(
  `${actionPrefix} Load Mock Configs`,
);

export const mockConfigsLoaded = createAction(
  `${actionPrefix} Mock Configs Loaded`,
  props<{ configs: MockConfig[] }>(),
);

export const saveMockConfigs = createAction(
  `${actionPrefix} Save Mock Configs`,
);

export const setMessageLimit = createAction(
  `${actionPrefix} Set Message Limit`,
  props<{ limit: number }>(),
);

export const importMockConfigs = createAction(
  `${actionPrefix} Import Mock Configs`,
  props<{ configs: MockConfig[] }>(),
);

export const exportMockConfigs = createAction(
  `${actionPrefix} Export Mock Configs`,
);

export const toggleMessageExpansion = createAction(
  `${actionPrefix} Toggle Message Expansion`,
  props<{ messageId: string }>(),
);
