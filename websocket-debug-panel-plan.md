# WebSocket Debug Panel Feature Plan

## Overview
A debug panel positioned on the right side of the screen that provides WebSocket debugging capabilities with extensibility for future debugging features. The panel will be always available throughout the application.

## Architecture

### 1. Module Structure
```
src/app/modules/websocket-debug-panel/
├── websocket-debug-panel.module.ts
├── websocket-debug-panel.component.ts
├── websocket-debug-panel.component.scss
├── websocket-debug-panel.component.spec.ts
├── components/
│   ├── debug-panel-toggle/
│   │   ├── debug-panel-toggle.component.ts
│   │   ├── debug-panel-toggle.component.scss
│   │   └── debug-panel-toggle.component.spec.ts
│   ├── websocket-tab/
│   │   ├── websocket-tab.component.ts
│   │   ├── websocket-tab.component.scss
│   │   └── websocket-tab.component.spec.ts
│   ├── message-list/
│   │   ├── message-list.component.ts
│   │   ├── message-list.component.scss
│   │   └── message-list.component.spec.ts
│   └── mock-config/
│       ├── mock-config-list/
│       │   ├── mock-config-list.component.ts
│       │   ├── mock-config-list.component.scss
│       │   └── mock-config-list.component.spec.ts
│       └── mock-config-form/
│           ├── mock-config-form.component.ts
│           ├── mock-config-form.component.scss
│           └── mock-config-form.component.spec.ts
├── services/
│   ├── websocket-debug.service.ts
│   ├── websocket-debug.service.spec.ts
│   ├── mock-response.service.ts
│   └── mock-response.service.spec.ts
├── interfaces/
│   ├── websocket-debug.interface.ts
│   └── mock-config.interface.ts
└── store/
    ├── websocket-debug.actions.ts
    ├── websocket-debug.effects.ts
    ├── websocket-debug.reducer.ts
    └── websocket-debug.selectors.ts
```

### 2. Core Interfaces

```typescript
// interfaces/websocket-debug.interface.ts
export interface WebSocketDebugMessage {
  id: string;
  timestamp: Date;
  direction: 'in' | 'out';
  message: IncomingMessage | RequestMessage;
  isMocked?: boolean;
}

// interfaces/mock-config.interface.ts
export interface MockConfig {
  id: string;
  enabled: boolean;
  methodName: string;
  messagePattern?: string; // Optional regex pattern
  type: 'call' | 'job';
  response: CallMockResponse | JobMockResponse;
}

export interface CallMockResponse {
  result: unknown; // JSON response
}

export interface JobMockResponse {
  events: JobMockEvent[];
}

export interface JobMockEvent {
  delay: number; // milliseconds, default 2000
  fields: {
    description: string;
    progress: {
      percent: number;
      description: string;
    };
    result?: unknown;
    state: 'RUNNING' | 'SUCCESS' | 'FAILED';
  };
}
```

### 3. State Management

```typescript
// store/websocket-debug.reducer.ts
export interface WebSocketDebugState {
  messages: WebSocketDebugMessage[];
  mockConfigs: MockConfig[];
  isPanelOpen: boolean;
  activeTab: 'websocket' | string; // Extensible for future tabs
  messageLimit: number; // Default: 15
}
```

### 4. Service Architecture

#### WebSocketDebugService
- Intercepts WebSocket messages by injecting into WebSocketHandlerService
- Maintains a circular buffer of the last N messages
- Dispatches actions to update the store

#### MockResponseService
- Manages mock configurations
- Intercepts outgoing messages and checks against mock rules
- Generates fake job IDs (incrementing counter)
- Handles job event scheduling with configurable delays
- Persists mock configurations to localStorage

### 5. Component Details

#### WebSocketDebugPanelComponent
- Main container with tab navigation
- Positioned as fixed panel on right side
- Collapsible with animation
- Tab system for future extensibility

#### DebugPanelToggleComponent
- Small toggle button always visible on right edge
- Shows/hides the panel
- Visual indicator when mocking is active

#### WebSocketTabComponent
- Container for WebSocket debugging features
- Split view: messages on top, mock configs below

#### MessageListComponent
- Virtual scrolling for performance
- Real-time updates
- Color coding: outgoing (blue), incoming (green), mocked (orange)
- JSON syntax highlighting
- Copy to clipboard functionality
- Clear messages button

#### MockConfigListComponent
- CRUD operations for mock configurations
- Enable/disable toggle per config
- Visual indicators for active mocks
- Import/export configurations

#### MockConfigFormComponent
- Form for creating/editing mock configurations
- Method name autocomplete from existing API methods
- Regex pattern validation
- JSON editor for call responses
- Job event builder with timeline visualization

### 6. Integration Points

#### WebSocketHandlerService Modification
```typescript
// Add to websocket-handler.service.ts
private debugInterceptor$ = new Subject<WebSocketDebugMessage>();

// In send method:
if (this.debugService) {
  const mockResponse = this.mockResponseService.checkMock(message);
  if (mockResponse) {
    this.handleMockResponse(mockResponse);
    return;
  }
  this.debugService.logOutgoingMessage(message);
}

// In message handler:
if (this.debugService) {
  this.debugService.logIncomingMessage(message);
}
```

#### App Component Integration
```typescript
// Add to app.component.ts template
@if (debugModeEnabled) {
  <ix-websocket-debug-panel />
}
```

### 7. Implementation Phases

#### Phase 1: Core Infrastructure (Week 1)
1. Create module structure
2. Implement basic state management
3. Create service architecture
4. Integrate with WebSocketHandlerService

#### Phase 2: UI Components (Week 2)
1. Build panel container with tabs
2. Implement message list with virtual scrolling
3. Add toggle button and animations
4. Style with Material Design

#### Phase 3: Mock Functionality (Week 3)
1. Implement mock configuration CRUD
2. Build mock response service
3. Create job event scheduler
4. Add form components

#### Phase 4: Polish & Testing (Week 4)
1. Add comprehensive tests
2. Implement import/export
3. Add keyboard shortcuts
4. Performance optimization
5. Documentation

### 8. Technical Considerations

#### Performance
- Use virtual scrolling for message list
- Implement message buffer with configurable limit
- Debounce rapid message updates
- Use OnPush change detection

#### Security
- Only enable in development/debug builds
- Add permission check for admin users
- Sanitize displayed messages
- Prevent XSS in JSON display

#### Persistence
- Store mock configurations in localStorage
- Remember panel open/closed state
- Export/import mock configurations

#### Testing Strategy
- Unit tests for all services
- Component tests with Spectator
- Integration tests for WebSocket interception
- E2E tests for mock functionality

### 9. Future Extensibility

#### Additional Tabs
- API Performance Metrics
- Redux DevTools Integration
- Console Log Viewer
- Network Request Inspector
- Component Tree Visualizer

#### Enhanced Features
- Message filtering and search
- WebSocket connection statistics
- Message replay functionality
- Breakpoint debugging for specific messages
- Mock response templates library

### 10. Configuration

```typescript
// environments/environment.ts
export const environment = {
  // ...
  debugPanel: {
    enabled: true,
    defaultMessageLimit: 15,
    mockJobDefaultDelay: 2000,
    persistMockConfigs: true,
  },
};
```

### 11. Example Mock Configuration

```json
{
  "id": "mock-1",
  "enabled": true,
  "methodName": "pool.create",
  "type": "job",
  "response": {
    "events": [
      {
        "delay": 0,
        "fields": {
          "description": "Creating pool",
          "progress": {
            "percent": 0,
            "description": "Initializing..."
          },
          "state": "RUNNING"
        }
      },
      {
        "delay": 2000,
        "fields": {
          "description": "Creating pool",
          "progress": {
            "percent": 50,
            "description": "Configuring disks..."
          },
          "state": "RUNNING"
        }
      },
      {
        "delay": 2000,
        "fields": {
          "description": "Creating pool",
          "progress": {
            "percent": 100,
            "description": "Complete"
          },
          "result": { "id": 1, "name": "tank" },
          "state": "SUCCESS"
        }
      }
    ]
  }
}
```

## Summary

This WebSocket Debug Panel will provide developers with powerful tools to debug and test WebSocket communications in the TrueNAS WebUI. The modular architecture ensures easy extension for future debugging features while maintaining performance and security.
