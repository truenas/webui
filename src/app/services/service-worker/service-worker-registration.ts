let isRegistered = false;
let registration: ServiceWorkerRegistration | null = null;
let lastReloadTimeMemory: number | null = null; // Fallback for when localStorage is unavailable

// Helper function to safely get from localStorage
function getLastReloadTime(): string | null {
  try {
    return localStorage.getItem('sw-last-reload');
  } catch {
    // Fallback to in-memory storage if localStorage throws (e.g., private browsing)
    return lastReloadTimeMemory ? lastReloadTimeMemory.toString() : null;
  }
}

// Helper function to safely set in localStorage
function setLastReloadTime(time: string): void {
  try {
    localStorage.setItem('sw-last-reload', time);
  } catch {
    // Fallback to in-memory storage if localStorage throws
    lastReloadTimeMemory = parseInt(time, 10);
    console.warn('[Main] localStorage unavailable, using in-memory storage for reload protection');
  }
}

// Helper function to check if we should reload (prevents infinite reload loops)
function shouldAllowReload(): boolean {
  const lastReloadTime = getLastReloadTime();
  const now = Date.now();
  const minTimeBetweenReloads = 5000; // 5 seconds

  if (!lastReloadTime || now - parseInt(lastReloadTime, 10) > minTimeBetweenReloads) {
    setLastReloadTime(now.toString());
    return true;
  }

  console.info('[Main] Skipping reload to prevent loop, last reload was too recent');
  return false;
}

export function registerServiceWorker(): void {
  if (isRegistered || !('serviceWorker' in navigator)) {
    return;
  }

  isRegistered = true;

  try {
    // Register service worker - handle both development (/) and production (/ui/) paths
    const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
    // Use URL constructor for proper path joining, with fallback for test environments
    let swPath: string;
    try {
      // Try using actual location first
      if (globalThis.location?.href) {
        swPath = new URL('sw.js', globalThis.location.href).pathname;
      } else {
        // Fallback for test environments - use origin with baseHref
        const origin = globalThis.location?.origin || 'http://localhost';
        swPath = new URL('sw.js', `${origin}${baseHref}`).pathname;
      }
    } catch {
      // Last resort fallback - use URL constructor with full path
      swPath = new URL('sw.js', `http://localhost${baseHref}`).pathname;
    }

    navigator.serviceWorker
      .register(swPath)
      .then((reg) => {
        registration = reg;
        console.info('[Main] Service Worker registered successfully');

        // Check for updates only on page visibility change (when user returns to tab)
        // This is sufficient since upgrades are manual and infrequent
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            reg.update().catch((error: unknown) => {
              console.error('[Main] Service Worker update check failed:', error);
            });
          }
        });

        // Listen for service worker updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              if (shouldAllowReload()) {
                console.info('[Main] New Service Worker activated, reloading...');
                reloadWithUpdate();
              }
            }
          });
        });

        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'CACHE_UPDATED') {
            console.info('[Main] Cache updated to version:', event.data.version);
            // Store the version for debugging
            try {
              localStorage.setItem('webui-cache-version', String(event.data.version));
            } catch {
              // Ignore localStorage errors (e.g., private browsing mode)
              console.warn('[Main] Could not store cache version in localStorage');
            }
          }
        });

        // Check if there's a waiting service worker on page load
        if (reg.waiting && shouldAllowReload()) {
          console.info('[Main] New version waiting, reloading...');
          reloadWithUpdate();
        }

        // Handle controller change (when skipWaiting is called)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (shouldAllowReload()) {
            console.info('[Main] Service Worker controller changed, reloading...');
            globalThis.location.reload();
          }
        });
      })
      .catch((error: unknown) => {
        console.error('[Main] Service Worker registration failed:', error);
      });
  } catch (error) {
    // Catch any synchronous errors during registration setup
    console.error('[Main] Service Worker registration setup failed:', error);
  }
}

function reloadWithUpdate(): void {
  if (registration?.waiting) {
    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  } else {
    // Just reload if no waiting worker
    globalThis.location.reload();
  }
}

// Expose functions for debugging in development
if (typeof globalThis !== 'undefined' && !isRegistered) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).serviceWorkerDebug = {
    checkVersion: () => {
      if (!navigator.serviceWorker?.controller) {
        console.info('No service worker controller');
        return;
      }

      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        console.info('Current service worker version:', event.data.version);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CHECK_VERSION' },
        [messageChannel.port2],
      );
    },
    forceUpdate: () => {
      if (registration) {
        registration.update().then(() => {
          console.info('Manual update check initiated');
        });
      }
    },
    clearCache: () => {
      if ('caches' in globalThis) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
            console.info(`Deleted cache: ${name}`);
          });
        });
      }
    },
    cleanupCache: (maxAge?: number, maxEntries?: number) => {
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEANUP_CACHE',
          maxAge,
          maxEntries,
        });
        console.info('Cache cleanup initiated');
      }
    },
  };
}
