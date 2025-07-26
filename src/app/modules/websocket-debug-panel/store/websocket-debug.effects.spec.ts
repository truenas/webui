import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import * as WebSocketDebugActions from './websocket-debug.actions';
import { WebSocketDebugEffects } from './websocket-debug.effects';
import { selectMockConfigs, selectIsPanelOpen } from './websocket-debug.selectors';

describe('WebSocketDebugEffects', () => {
  let effects: WebSocketDebugEffects;
  let actions$: Observable<unknown>;
  let store$: MockStore;

  const mockConfigs: MockConfig[] = [
    {
      id: 'config-1',
      enabled: true,
      methodName: 'test.method',
      response: { result: { success: true } },
    },
    {
      id: 'config-2',
      enabled: false,
      methodName: 'another.method',
      messagePattern: 'pattern',
      response: { result: null, delay: 1000 },
    },
  ];

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock document.createElement for export functionality
    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);

    TestBed.configureTestingModule({
      providers: [
        WebSocketDebugEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: selectMockConfigs, value: mockConfigs },
            { selector: selectIsPanelOpen, value: false },
          ],
        }),
      ],
    });

    effects = TestBed.inject(WebSocketDebugEffects);
    store$ = TestBed.inject(MockStore) as MockStore;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadMockConfigs$', () => {
    it('should load configs from localStorage', async () => {
      const action = WebSocketDebugActions.loadMockConfigs();
      const completion = WebSocketDebugActions.mockConfigsLoaded({ configs: mockConfigs });

      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockConfigs));

      actions$ = of(action);

      const result = await new Promise((resolve) => {
        effects.loadMockConfigs$.subscribe(resolve);
      });
      expect(result).toEqual(completion);
    });

    it('should return empty array when localStorage is empty', async () => {
      const action = WebSocketDebugActions.loadMockConfigs();
      const completion = WebSocketDebugActions.mockConfigsLoaded({ configs: [] });

      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      actions$ = of(action);

      const result = await new Promise((resolve) => {
        effects.loadMockConfigs$.subscribe(resolve);
      });
      expect(result).toEqual(completion);
    });

    it('should handle localStorage errors gracefully', async () => {
      const action = WebSocketDebugActions.loadMockConfigs();
      const completion = WebSocketDebugActions.mockConfigsLoaded({ configs: [] });

      (localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      actions$ = of(action);

      const result = await new Promise((resolve) => {
        effects.loadMockConfigs$.subscribe(resolve);
      });
      expect(result).toEqual(completion);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'LocalStorage read error:',
        expect.any(Error),
      );
    });

    it('should handle invalid JSON in localStorage', async () => {
      const action = WebSocketDebugActions.loadMockConfigs();
      const completion = WebSocketDebugActions.mockConfigsLoaded({ configs: [] });

      (localStorage.getItem as jest.Mock).mockReturnValue('invalid json');

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      actions$ = of(action);

      const result = await new Promise((resolve) => {
        effects.loadMockConfigs$.subscribe(resolve);
      });
      expect(result).toEqual(completion);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'LocalStorage parse error:',
        expect.any(Error),
      );
    });
  });

  describe('saveMockConfigs$', () => {
    it('should save configs to localStorage on add action', async () => {
      const action = WebSocketDebugActions.addMockConfig({
        config: {
          id: 'new-config',
          enabled: true,
          methodName: 'new.method',
          response: { result: {} },
        },
      });

      actions$ = of(action);

      const subscription = effects.saveMockConfigs$.subscribe();

      // Wait for async operation to complete
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'websocket-debug-mock-configs',
        JSON.stringify(mockConfigs),
      );
      subscription.unsubscribe();
    });

    it('should save configs on update action', async () => {
      const action = WebSocketDebugActions.updateMockConfig({
        config: mockConfigs[0],
      });

      actions$ = of(action);

      const subscription = effects.saveMockConfigs$.subscribe();

      // Wait for async operation to complete
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(localStorage.setItem).toHaveBeenCalled();
      subscription.unsubscribe();
    });

    it('should save configs on delete action', async () => {
      const action = WebSocketDebugActions.deleteMockConfig({ id: 'config-1' });

      actions$ = of(action);

      const subscription = effects.saveMockConfigs$.subscribe();

      // Wait for async operation to complete
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(localStorage.setItem).toHaveBeenCalled();
      subscription.unsubscribe();
    });

    it('should save configs on toggle action', async () => {
      const action = WebSocketDebugActions.toggleMockConfig({ id: 'config-1' });

      actions$ = of(action);

      const subscription = effects.saveMockConfigs$.subscribe();

      // Wait for async operation to complete
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(localStorage.setItem).toHaveBeenCalled();
      subscription.unsubscribe();
    });

    it('should handle localStorage errors when saving', async () => {
      const action = WebSocketDebugActions.saveMockConfigs();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage full');
      });

      actions$ = of(action);

      const subscription = effects.saveMockConfigs$.subscribe();

      // Wait for async operation to complete
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'LocalStorage write error:',
        expect.any(Error),
      );
      subscription.unsubscribe();
    });
  });

  describe('persistPanelState$', () => {
    it('should persist panel state on setPanelOpen', async () => {
      const action = WebSocketDebugActions.setPanelOpen({ isOpen: true });

      store$.overrideSelector(selectIsPanelOpen, true);

      actions$ = of(action);

      const subscription = effects.persistPanelState$.subscribe();

      // Wait for async operation to complete
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'websocket-debug-panel-open',
        'true',
      );
      subscription.unsubscribe();
    });

    it('should persist panel state on togglePanel', async () => {
      const action = WebSocketDebugActions.togglePanel();

      store$.overrideSelector(selectIsPanelOpen, false);

      actions$ = of(action);

      const subscription = effects.persistPanelState$.subscribe();

      // Wait for async operation to complete
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'websocket-debug-panel-open',
        'false',
      );
      subscription.unsubscribe();
    });

    it('should handle localStorage errors when persisting panel state', async () => {
      const action = WebSocketDebugActions.setPanelOpen({ isOpen: true });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      actions$ = of(action);

      const subscription = effects.persistPanelState$.subscribe();

      // Wait for async operation to complete
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'LocalStorage write error:',
        expect.any(Error),
      );
      subscription.unsubscribe();
    });
  });

  describe('exportMockConfigs$', () => {
    it('should export configs as JSON file', () => {
      const action = WebSocketDebugActions.exportMockConfigs();
      const mockLink = document.createElement('a');

      actions$ = of(action);

      const subscription = effects.exportMockConfigs$.subscribe();

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        'href',
        expect.stringContaining('data:application/json'),
      );
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        'download',
        expect.stringMatching(/mock-configs-\d{4}-\d{2}-\d{2}\.json/),
      );
      expect(mockLink.click).toHaveBeenCalled();

      subscription.unsubscribe();
    });

    it('should encode configs correctly in data URI', () => {
      const action = WebSocketDebugActions.exportMockConfigs();
      const mockLink = document.createElement('a');

      actions$ = of(action);

      const subscription = effects.exportMockConfigs$.subscribe();

      const hrefCall = (mockLink.setAttribute as jest.Mock).mock.calls.find(
        (call: unknown[]) => call[0] === 'href',
      ) as unknown[] | undefined;
      const dataUri = hrefCall?.[1] as string;

      expect(dataUri).toContain(encodeURIComponent(JSON.stringify(mockConfigs, null, 2)));

      subscription.unsubscribe();
    });
  });
});
