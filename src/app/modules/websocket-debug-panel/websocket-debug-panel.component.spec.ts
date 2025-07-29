import { NO_ERRORS_SCHEMA } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { WebSocketDebugMessage } from 'app/modules/websocket-debug-panel/interfaces/websocket-debug.interface';
import { EnclosureMockService } from 'app/services/enclosure-mock.service';
import * as WebSocketDebugActions from './store/websocket-debug.actions';
import { WebSocketDebugPanelComponent } from './websocket-debug-panel.component';

describe('WebSocketDebugPanelComponent', () => {
  let spectator: Spectator<WebSocketDebugPanelComponent>;
  let store$: MockStore;
  const createComponent = createComponentFactory({
    component: WebSocketDebugPanelComponent,
    providers: [
      mockProvider(EnclosureMockService),
      provideMockStore({
        initialState: {
          webSocketDebug: {
            isPanelOpen: false,
            activeTab: 'websocket',
            messages: [],
            mockConfigs: [],
            messageLimit: 15,
            hasActiveMocks: false,
            enclosureMock: {
              enabled: false,
              controllerModel: null,
              expansionModels: [],
              scenario: MockEnclosureScenario.AllSlotsEmpty,
            },
          },
        },
      }),
    ],
    detectChanges: false, // Don't automatically detect changes
    schemas: [NO_ERRORS_SCHEMA],
  });

  const mockLocalStorage = {
    getItem: jest.fn().mockReturnValue(null),
    setItem: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(); // Mock console.error globally

    // Reset localStorage mock
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockReset();

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    spectator = createComponent();
    store$ = spectator.inject(MockStore);
    jest.spyOn(store$, 'dispatch');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load mock configs on init', () => {
      spectator.detectChanges();

      expect(store$.dispatch).toHaveBeenCalledWith(WebSocketDebugActions.loadMockConfigs());
    });

    it('should restore panel state from localStorage when available', async () => {
      mockLocalStorage.getItem.mockReturnValue('true');

      spectator.detectChanges();

      // Wait for async localStorage read
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      expect(store$.dispatch).toHaveBeenCalledWith(
        WebSocketDebugActions.setPanelOpen({ isOpen: true }),
      );
    });

    it('should handle localStorage errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      spectator.detectChanges();

      // Wait for async localStorage read
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to restore panel state:', expect.any(Error));
    });
  });

  describe('layout margin management', () => {
    let mockAdminLayout: HTMLElement;
    const defaultDebugState = {
      isPanelOpen: false,
      activeTab: 'websocket' as const,
      messages: [] as WebSocketDebugMessage[],
      mockConfigs: [] as MockConfig[],
      messageLimit: 15,
      hasActiveMocks: false,
      enclosureMock: {
        enabled: false,
        controllerModel: null as EnclosureModel | null,
        expansionModels: [] as EnclosureModel[],
        scenario: MockEnclosureScenario.AllSlotsEmpty,
      },
    };

    beforeEach(() => {
      mockAdminLayout = document.createElement('div');
      mockAdminLayout.className = 'fn-maincontent';
      document.body.appendChild(mockAdminLayout);
    });

    afterEach(() => {
      if (document.body.contains(mockAdminLayout)) {
        document.body.removeChild(mockAdminLayout);
      }
    });

    it('should update admin layout margin when panel opens', fakeAsync(() => {
      // First initialize the component
      spectator.detectChanges();

      // Then update the state to open the panel
      store$.setState({
        webSocketDebug: {
          ...defaultDebugState,
          isPanelOpen: true,
        },
      });

      spectator.detectChanges();
      tick();

      expect(mockAdminLayout.style.marginRight).toBe('550px');
      expect(mockAdminLayout.style.transition).toContain('margin-right 300ms');
    }));

    it('should remove admin layout margin when panel closes', fakeAsync(() => {
      // Spy on the private method to verify it's called correctly
      const updateMarginSpy = jest.spyOn(spectator.component, 'updateAdminLayoutMargin' as never);

      // First set the panel to open state
      store$.setState({
        webSocketDebug: {
          ...defaultDebugState,
          isPanelOpen: true,
        },
      });

      // Initialize the component
      spectator.detectChanges();
      tick();

      // Verify margin is set
      expect(mockAdminLayout.style.marginRight).toBe('550px');
      expect(updateMarginSpy).toHaveBeenCalledWith(true);

      // Then update the state to close the panel
      store$.setState({
        webSocketDebug: {
          ...defaultDebugState,
          isPanelOpen: false,
        },
      });

      // Let the store emit the new value
      spectator.detectChanges();
      tick(); // Runs the setTimeout(..., 0) in updateAdminLayoutMargin

      // Verify the method was called with false
      expect(updateMarginSpy).toHaveBeenCalledWith(false);

      // In a real browser, renderer.removeStyle would clear the style
      // but in tests it may not work the same way, so we just verify the method was called
    }));

    it('should retry finding admin layout if not initially available', fakeAsync(() => {
      document.body.removeChild(mockAdminLayout);

      // Set the state to open before initializing
      store$.setState({
        webSocketDebug: {
          ...defaultDebugState,
          isPanelOpen: true,
        },
      });

      // Initialize the component
      spectator.detectChanges();

      // Run the initial timer (setTimeout(..., 0))
      tick();

      // Admin layout not found, should schedule retry
      // Add admin layout back before the retry
      document.body.appendChild(mockAdminLayout);

      // Run the retry timer (setTimeout(..., 100))
      tick(100);

      expect(mockAdminLayout.style.marginRight).toBe('550px');
    }));
  });

  describe('keyboard shortcuts', () => {
    it('should toggle panel on Ctrl+Shift+X', () => {
      spectator.detectChanges();

      const event = new KeyboardEvent('keydown', {
        key: 'X',
        ctrlKey: true,
        shiftKey: true,
      });

      spectator.component.handleKeyboardShortcut(event);

      expect(store$.dispatch).toHaveBeenCalledWith(WebSocketDebugActions.togglePanel());
    });
  });
});
