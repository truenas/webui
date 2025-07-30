/**
 * Constants for the WebSocket Debug Panel module
 */

// Message handling limits
export const defaultMessageLimit = 200;
export const maxCacheSize = 1000;

// Timing constants (in milliseconds)
export const cacheCleanupIntervalMs = 5000;
export const scrollToBottomDelayMs = 100;

// LocalStorage keys
export const storageKeys = {
  MOCK_CONFIGS: 'websocket-debug-mock-configs',
  PANEL_OPEN: 'websocket-debug-panel-open',
  ACTIVE_TAB: 'websocket-debug-active-tab',
  MESSAGE_LIMIT: 'websocket-debug-message-limit',
  ENCLOSURE_MOCK_CONFIG: 'websocket-debug-enclosure-mock-config',
} as const;

// Tab identifiers
export const tabs = {
  WEBSOCKET: 'websocket',
  MOCK_CONFIG: 'mock-configurations',
  ENCLOSURE_MOCK: 'enclosure-mock',
} as const;

// Export file naming
export const exportFilePrefix = 'mock-configs';
