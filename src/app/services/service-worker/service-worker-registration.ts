let isRegistered = false;
let registration: ServiceWorkerRegistration | null = null;

export function registerServiceWorker(): void {
  if (isRegistered || !('serviceWorker' in navigator)) {
    return;
  }

  isRegistered = true;

  // Register service worker - handle both development (/) and production (/ui/) paths
  const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
  const swPath = `${baseHref}sw.js`.replace(/\/+/g, '/'); // Normalize slashes

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
            console.info('[Main] New Service Worker activated, reloading...');
            // The new service worker has activated, reload immediately
            reloadWithUpdate();
          }
        });
      });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.info('[Main] Cache updated to version:', event.data.version);
          // Store the version for debugging
          localStorage.setItem('webui-cache-version', String(event.data.version));
        }
      });

      // Check if there's a waiting service worker on page load
      if (reg.waiting) {
        // There's already a new version waiting, reload immediately
        reloadWithUpdate();
      }

      // Handle controller change (when skipWaiting is called)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.info('[Main] Service Worker controller changed, reloading...');
        globalThis.location.reload();
      });
    })
    .catch((error: unknown) => {
      console.error('[Main] Service Worker registration failed:', error);
    });
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
  };
}
