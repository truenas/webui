describe('ServiceWorkerRegistration', () => {
  let originalNavigator: typeof globalThis.navigator;
  let originalDocument: typeof globalThis.document;
  let originalConsole: typeof globalThis.console;

  beforeEach(() => {
    // Save originals
    originalNavigator = globalThis.navigator;
    originalDocument = globalThis.document;
    originalConsole = globalThis.console;

    // Mock console
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();

    // Mock localStorage
    Storage.prototype.setItem = jest.fn();

    // Mock globalThis.location.reload
    delete (globalThis as { location?: unknown }).location;
    (globalThis as unknown as { location: { reload: jest.Mock } }).location = { reload: jest.fn() };

    // Clear module cache to reset the isRegistered flag
    jest.resetModules();
  });

  afterEach(() => {
    // Restore originals
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      value: originalNavigator,
    });
    Object.defineProperty(globalThis, 'document', {
      writable: true,
      value: originalDocument,
    });
    Object.defineProperty(globalThis, 'console', {
      writable: true,
      value: originalConsole,
    });
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should not register if serviceWorker is not supported', () => {
    // Mock navigator without serviceWorker
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      configurable: true,
      value: {},
    });

    // Import module fresh
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { registerServiceWorker } = require('./service-worker-registration');
      registerServiceWorker();
    });

    expect(console.info).not.toHaveBeenCalled();
  });

  it('should register service worker with correct path', async () => {
    const mockRegister = jest.fn().mockResolvedValue({
      addEventListener: jest.fn(),
      update: jest.fn(),
      waiting: null,
    });

    // Mock navigator with serviceWorker
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        serviceWorker: {
          register: mockRegister,
          addEventListener: jest.fn(),
        },
      },
    });

    // Mock document
    Object.defineProperty(globalThis, 'document', {
      writable: true,
      configurable: true,
      value: {
        querySelector: jest.fn(() => ({
          getAttribute: jest.fn(() => '/'),
        })),
        addEventListener: jest.fn(),
        hidden: false,
      },
    });

    // Import and run
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { registerServiceWorker } = require('./service-worker-registration');
      registerServiceWorker();
    });

    // Wait for async operations
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });

  it('should register service worker with /ui/ base path', async () => {
    const mockRegister = jest.fn().mockResolvedValue({
      addEventListener: jest.fn(),
      update: jest.fn(),
      waiting: null,
    });

    // Mock navigator with serviceWorker
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        serviceWorker: {
          register: mockRegister,
          addEventListener: jest.fn(),
        },
      },
    });

    // Mock document with /ui/ base
    Object.defineProperty(globalThis, 'document', {
      writable: true,
      configurable: true,
      value: {
        querySelector: jest.fn(() => ({
          getAttribute: jest.fn(() => '/ui/'),
        })),
        addEventListener: jest.fn(),
        hidden: false,
      },
    });

    // Import and run
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { registerServiceWorker } = require('./service-worker-registration');
      registerServiceWorker();
    });

    // Wait for async operations
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(mockRegister).toHaveBeenCalledWith('/ui/sw.js');
  });

  it('should handle registration failure', async () => {
    const error = new Error('Registration failed');
    const mockRegister = jest.fn().mockRejectedValue(error);

    // Mock navigator with failing serviceWorker
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        serviceWorker: {
          register: mockRegister,
          addEventListener: jest.fn(),
        },
      },
    });

    // Mock document
    Object.defineProperty(globalThis, 'document', {
      writable: true,
      configurable: true,
      value: {
        querySelector: jest.fn(() => ({
          getAttribute: jest.fn(() => '/'),
        })),
        addEventListener: jest.fn(),
        hidden: false,
      },
    });

    // Import and run
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { registerServiceWorker } = require('./service-worker-registration');
      registerServiceWorker();
    });

    // Wait for async operations
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(console.error).toHaveBeenCalledWith('[Main] Service Worker registration failed:', error);
  });

  it('should prevent infinite reload loops when service worker is waiting', async () => {
    const mockUpdate = jest.fn();
    const mockPostMessage = jest.fn();
    const mockRegister = jest.fn().mockResolvedValue({
      addEventListener: jest.fn(),
      update: mockUpdate,
      waiting: {
        postMessage: mockPostMessage,
      },
    });

    // Mock localStorage
    const mockGetItem = jest.fn();
    const mockSetItem = jest.fn();
    Storage.prototype.getItem = mockGetItem;
    Storage.prototype.setItem = mockSetItem;

    // Mock navigator with serviceWorker
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        serviceWorker: {
          register: mockRegister,
          addEventListener: jest.fn(),
        },
      },
    });

    // Mock document
    Object.defineProperty(globalThis, 'document', {
      writable: true,
      configurable: true,
      value: {
        querySelector: jest.fn(() => ({
          getAttribute: jest.fn(() => '/'),
        })),
        addEventListener: jest.fn(),
        hidden: false,
      },
    });

    // First load - should reload
    mockGetItem.mockReturnValue(null);

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { registerServiceWorker } = require('./service-worker-registration');
      registerServiceWorker();
    });

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(mockSetItem).toHaveBeenCalledWith('sw-last-reload', expect.any(String));
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });

    // Second load within 5 seconds - should not reload
    jest.resetModules();
    mockGetItem.mockReturnValue(Date.now().toString());
    mockPostMessage.mockClear();
    mockSetItem.mockClear();

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { registerServiceWorker } = require('./service-worker-registration');
      registerServiceWorker();
    });

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(mockSetItem).not.toHaveBeenCalled();
    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith('[Main] Skipping reload to prevent loop, last reload was too recent');
  });

  it('should handle service worker messages', async () => {
    const mockAddEventListener = jest.fn();
    const mockRegister = jest.fn().mockResolvedValue({
      addEventListener: jest.fn(),
      update: jest.fn(),
      waiting: null,
    });

    // Mock localStorage
    const mockSetItem = jest.fn();
    Storage.prototype.setItem = mockSetItem;

    // Mock navigator with serviceWorker
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        serviceWorker: {
          register: mockRegister,
          addEventListener: mockAddEventListener,
        },
      },
    });

    // Mock document
    Object.defineProperty(globalThis, 'document', {
      writable: true,
      configurable: true,
      value: {
        querySelector: jest.fn(() => ({
          getAttribute: jest.fn(() => '/'),
        })),
        addEventListener: jest.fn(),
        hidden: false,
      },
    });

    // Import and run
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { registerServiceWorker } = require('./service-worker-registration');
      registerServiceWorker();
    });

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    // Verify message listener was registered
    expect(mockAddEventListener).toHaveBeenCalledWith('message', expect.any(Function));

    // Simulate CACHE_UPDATED message
    const messageHandler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === 'message',
    )[1];

    messageHandler({
      data: {
        type: 'CACHE_UPDATED',
        version: 'test-version-123',
      },
    });

    expect(mockSetItem).toHaveBeenCalledWith('webui-cache-version', 'test-version-123');
  });

  it('should handle cache cleanup message', async () => {
    const mockPostMessage = jest.fn();
    const mockRegister = jest.fn().mockResolvedValue({
      addEventListener: jest.fn(),
      update: jest.fn(),
      waiting: null,
    });

    // Mock navigator with serviceWorker
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        serviceWorker: {
          register: mockRegister,
          addEventListener: jest.fn(),
          controller: {
            postMessage: mockPostMessage,
          },
        },
      },
    });

    // Mock document
    Object.defineProperty(globalThis, 'document', {
      writable: true,
      configurable: true,
      value: {
        querySelector: jest.fn(() => ({
          getAttribute: jest.fn(() => '/'),
        })),
        addEventListener: jest.fn(),
        hidden: false,
      },
    });

    // Import module
    interface ServiceWorkerDebug {
      cleanupCache: (maxAge?: number, maxEntries?: number) => void;
    }
    let serviceWorkerDebug: ServiceWorkerDebug;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./service-worker-registration');
      serviceWorkerDebug = (globalThis as unknown as {
        serviceWorkerDebug: ServiceWorkerDebug;
      }).serviceWorkerDebug;
    });

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    // Test cleanupCache function
    serviceWorkerDebug.cleanupCache(1000, 100);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'CLEANUP_CACHE',
      maxAge: 1000,
      maxEntries: 100,
    });
    expect(console.info).toHaveBeenCalledWith('Cache cleanup initiated');
  });

  it('should handle clearCache function', async () => {
    const mockDelete = jest.fn().mockResolvedValue(true);
    const mockKeys = jest.fn().mockResolvedValue(['truenas-webui-v1', 'truenas-webui-v2']);

    // Mock caches API
    Object.defineProperty(globalThis, 'caches', {
      writable: true,
      configurable: true,
      value: {
        keys: mockKeys,
        delete: mockDelete,
      },
    });

    // Mock navigator
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        serviceWorker: {
          register: jest.fn().mockResolvedValue({
            addEventListener: jest.fn(),
            update: jest.fn(),
            waiting: null,
          }),
          addEventListener: jest.fn(),
        },
      },
    });

    // Mock document
    Object.defineProperty(globalThis, 'document', {
      writable: true,
      configurable: true,
      value: {
        querySelector: jest.fn(() => ({
          getAttribute: jest.fn(() => '/'),
        })),
        addEventListener: jest.fn(),
        hidden: false,
      },
    });

    // Import module
    interface ServiceWorkerDebugClear {
      clearCache: () => void;
    }
    let serviceWorkerDebug: ServiceWorkerDebugClear;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./service-worker-registration');
      serviceWorkerDebug = (globalThis as unknown as {
        serviceWorkerDebug: ServiceWorkerDebugClear;
      }).serviceWorkerDebug;
    });

    // Test clearCache function
    serviceWorkerDebug.clearCache();

    // Wait for async operations
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(mockKeys).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith('truenas-webui-v1');
    expect(mockDelete).toHaveBeenCalledWith('truenas-webui-v2');
    expect(console.info).toHaveBeenCalledWith('Deleted cache: truenas-webui-v1');
    expect(console.info).toHaveBeenCalledWith('Deleted cache: truenas-webui-v2');
  });
});
