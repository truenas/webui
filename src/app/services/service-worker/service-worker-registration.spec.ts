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
    (globalThis as { location: { reload: jest.Mock } }).location = { reload: jest.fn() };

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
});
