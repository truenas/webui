import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ServiceWorkerService } from './service-worker.service';

describe('ServiceWorkerService', () => {
  let service: ServiceWorkerService;
  let mockDocument: Document;

  beforeEach(() => {
    // Mock document
    mockDocument = {
      querySelector: jest.fn(() => ({
        getAttribute: jest.fn(() => '/'),
      })),
      addEventListener: jest.fn(),
      hidden: false,
    } as unknown as Document;

    // Mock localStorage
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.getItem = jest.fn();

    // Mock globalThis.location
    delete (globalThis as { location?: unknown }).location;
    (globalThis as unknown as { location: { reload: jest.Mock; href: string } }).location = {
      reload: jest.fn(),
      href: 'http://localhost/',
    };

    TestBed.configureTestingModule({
      providers: [
        ServiceWorkerService,
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    service = TestBed.inject(ServiceWorkerService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not register if serviceWorker is not supported', () => {
    // Mock navigator without serviceWorker
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      configurable: true,
      value: {},
    });

    service.register();

    expect(mockDocument.addEventListener).not.toHaveBeenCalled();
  });

  it('should register service worker with correct path', async () => {
    const mockRegister = jest.fn().mockResolvedValue({
      addEventListener: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
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

    service.register();

    // Wait for async operations
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(mockRegister).toHaveBeenCalledWith('/sw.js', { updateViaCache: 'none' });
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

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    service.register();

    // Wait for async operations
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(consoleSpy).toHaveBeenCalledWith('[Main] Service Worker registration failed:', error);
  });

  it('should check service worker version', () => {
    const mockPostMessage = jest.fn();
    const mockPort = {
      onmessage: null as unknown,
    };

    // Mock MessageChannel
    (globalThis as unknown as { MessageChannel: jest.Mock }).MessageChannel = jest.fn().mockImplementation(() => ({
      port1: mockPort,
      port2: {},
    }));

    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        serviceWorker: {
          controller: {
            postMessage: mockPostMessage,
          },
        },
      },
    });

    service.checkVersion();

    expect(mockPostMessage).toHaveBeenCalledWith(
      { type: 'CHECK_VERSION' },
      expect.any(Array),
    );
  });

  it('should enable debug mode', () => {
    const mockPostMessage = jest.fn();
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        serviceWorker: {
          controller: {
            postMessage: mockPostMessage,
          },
        },
      },
    });

    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    service.enableDebug();

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'SET_DEBUG_MODE',
      enabled: true,
    });
    expect(consoleSpy).toHaveBeenCalledWith('Service Worker debug mode enabled - all requests will be logged');
  });

  it('should disable debug mode', () => {
    const mockPostMessage = jest.fn();
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        serviceWorker: {
          controller: {
            postMessage: mockPostMessage,
          },
        },
      },
    });

    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    service.disableDebug();

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'SET_DEBUG_MODE',
      enabled: false,
    });
    expect(consoleSpy).toHaveBeenCalledWith('Service Worker debug mode disabled');
  });

  it('should clear all caches', async () => {
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

    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    service.clearAllCaches();

    // Wait for async operations
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(mockKeys).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith('truenas-webui-v1');
    expect(mockDelete).toHaveBeenCalledWith('truenas-webui-v2');
    expect(consoleSpy).toHaveBeenCalledWith('Deleted cache: truenas-webui-v1');
    expect(consoleSpy).toHaveBeenCalledWith('Deleted cache: truenas-webui-v2');
  });

  describe('concurrent registration', () => {
    it('should handle concurrent registration attempts', async () => {
      const mockRegister = jest.fn().mockResolvedValue({
        addEventListener: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
        waiting: null,
      });

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

      // Attempt multiple concurrent registrations
      service.register();
      service.register();
      service.register();

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });

      // Should only register once due to isRegistered flag
      expect(mockRegister).toHaveBeenCalledTimes(1);
    });
  });

  describe('service worker lifecycle', () => {
    it('should handle waiting service worker on page load', async () => {
      const mockReload = jest.fn();
      const mockPostMessage = jest.fn();
      const waitingWorker = {
        postMessage: mockPostMessage,
      };

      (globalThis as unknown as { location: { reload: jest.Mock } }).location = {
        reload: mockReload,
      };

      const mockRegister = jest.fn().mockResolvedValue({
        addEventListener: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
        waiting: waitingWorker,
      });

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

      // Mock localStorage to allow reload
      Storage.prototype.getItem = jest.fn().mockReturnValue(null);

      service.register();

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });

    it('should handle controller change events', async () => {
      const mockReload = jest.fn();
      let controllerChangeHandler: EventListener | null = null;

      (globalThis as unknown as { location: { reload: jest.Mock } }).location = {
        reload: mockReload,
      };

      const mockRegister = jest.fn().mockResolvedValue({
        addEventListener: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
        waiting: null,
      });

      const mockAddEventListener = jest.fn((event: string, handler: EventListener) => {
        if (event === 'controllerchange') {
          controllerChangeHandler = handler;
        }
      });

      Object.defineProperty(globalThis, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          serviceWorker: {
            register: mockRegister,
            addEventListener: mockAddEventListener,
            controller: {},
          },
        },
      });

      // Mock localStorage to allow reload
      Storage.prototype.getItem = jest.fn().mockReturnValue(null);

      service.register();

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });

      // Trigger controller change
      if (controllerChangeHandler) {
        controllerChangeHandler(new Event('controllerchange'));
      }

      expect(mockReload).toHaveBeenCalled();
    });

    it('should prevent infinite reload loops', async () => {
      const mockReload = jest.fn();
      const recentTime = (Date.now() - 1000).toString(); // 1 second ago

      (globalThis as unknown as { location: { reload: jest.Mock } }).location = {
        reload: mockReload,
      };

      const mockRegister = jest.fn().mockResolvedValue({
        addEventListener: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
        waiting: { postMessage: jest.fn() },
      });

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

      // Mock localStorage to return recent reload time
      Storage.prototype.getItem = jest.fn().mockReturnValue(recentTime);

      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      service.register();

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });

      // Should not reload due to recent reload
      expect(mockReload).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('[Main] Skipping reload to prevent loop, last reload was too recent');
    });

    it('should handle localStorage failures gracefully', async () => {
      const mockReload = jest.fn();

      (globalThis as unknown as { location: { reload: jest.Mock } }).location = {
        reload: mockReload,
      };

      // Mock localStorage to throw error
      Storage.prototype.getItem = jest.fn().mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });
      Storage.prototype.setItem = jest.fn().mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const mockRegister = jest.fn().mockResolvedValue({
        addEventListener: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
        waiting: { postMessage: jest.fn() },
      });

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

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      service.register();

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(consoleSpy).toHaveBeenCalledWith('[Main] localStorage unavailable, using in-memory storage for reload protection');
    });
  });
});
