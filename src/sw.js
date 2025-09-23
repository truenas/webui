// Service Worker for TrueNAS WebUI
// This file handles caching and ensures users get the latest version after updates

// Version will be replaced during build process
const CACHE_VERSION = 'BUILD_VERSION_PLACEHOLDER';
const CACHE_NAME = `truenas-webui-${CACHE_VERSION}`;

// Install event - runs when new service worker is installed
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing version ${CACHE_VERSION}`);

  // No need to pre-cache anything since we don't support offline
  // Just activate immediately
  self.skipWaiting();
});

// Activate event - runs when service worker takes control
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] Activating version ${CACHE_VERSION}`);

  event.waitUntil(
    // Delete all old caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('truenas-webui-'))
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log(`[Service Worker] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[Service Worker] Old caches cleared');
    })
  );

  // Take control of all pages immediately
  self.clients.claim();

  // Notify all clients about the update
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_UPDATED',
        version: CACHE_VERSION
      });
    });
  });
});

// Fetch event - intercepts all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests and external requests
  if (!request.url.startsWith('http') || url.origin !== self.location.origin) {
    return;
  }

  // Skip WebSocket connections and API calls
  // These paths work both with /ui/ prefix in production and without in development
  if (url.pathname.includes('/api/') ||
      url.pathname.includes('/_upload') ||
      url.pathname.includes('/_download') ||
      url.protocol === 'ws:' ||
      url.protocol === 'wss:') {
    return;
  }

  // Network-only strategy for HTML files (always get fresh, no offline support)
  if (request.mode === 'navigate' ||
      request.headers.get('accept')?.includes('text/html') ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/' ||
      url.pathname === '/ui/' ||
      url.pathname === '/ui') {

    event.respondWith(
      fetch(request)
        .then(response => {
          // Only cache successful responses for next time
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(error => {
          // Network failed - no offline fallback needed for NAS management
          console.error('[Service Worker] Network failed for HTML:', error.message);
          // Return network error as-is
          return Promise.reject(error);
        })
    );
    return;
  }

  // Cache-first strategy for hashed assets (they never change)
  if (url.pathname.includes('/chunk-') ||
      url.pathname.match(/\.[a-f0-9]{8,}\.(js|css)$/)) {

    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response;
        }

        return fetch(request).then(fetchResponse => {
          // Only cache successful responses
          if (fetchResponse.ok) {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            });
          }
          return fetchResponse;
        });
      })
    );
    return;
  }

  // Network-first for other assets (no offline fallback)
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses for performance
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(error => {
        // Network failed - no offline fallback
        console.error('[Service Worker] Network failed for asset:', request.url, error);
        return Promise.reject(error);
      })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received skip waiting message');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CHECK_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_VERSION
    });
  }

  // Cache cleanup - remove old/stale entries
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    const maxAge = event.data.maxAge || 7 * 24 * 60 * 60 * 1000; // Default: 7 days
    const maxEntries = event.data.maxEntries || 500; // Default: 500 entries

    caches.open(CACHE_NAME).then(async cache => {
      const requests = await cache.keys();
      console.log(`[Service Worker] Cache cleanup started. Current size: ${requests.length} items`);

      // Remove old caches from other versions
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames
        .filter(name => name.startsWith('truenas-webui-'))
        .filter(name => name !== CACHE_NAME);

      for (const oldCache of oldCaches) {
        await caches.delete(oldCache);
        console.log(`[Service Worker] Deleted old cache: ${oldCache}`);
      }

      // If current cache is too large, remove oldest entries
      if (requests.length > maxEntries) {
        // Sort by URL to group similar resources, then remove oldest
        const sortedRequests = requests.sort((a, b) =>
          a.url.localeCompare(b.url)
        );

        const toRemove = sortedRequests.slice(0, requests.length - maxEntries);
        for (const request of toRemove) {
          await cache.delete(request);
        }
        console.log(`[Service Worker] Removed ${toRemove.length} old cache entries`);
      }

      // Log final cache size
      const finalRequests = await cache.keys();
      console.log(`[Service Worker] Cache cleanup complete. Final size: ${finalRequests.length} items`);
    }).catch(error => {
      console.error('[Service Worker] Cache cleanup failed:', error);
    });
  }
});