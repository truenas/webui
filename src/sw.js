// Service Worker for TrueNAS WebUI
// Minimal service worker to ensure HTML pages are never cached

// Version will be replaced during build process
const CACHE_VERSION = 'BUILD_VERSION_PLACEHOLDER';

// Debug flag - set to true to see all requests in console
let DEBUG_MODE = false;

// Install event - runs when new service worker is installed
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing version ${CACHE_VERSION}`);
  // Activate immediately
  self.skipWaiting();
});

// Activate event - runs when service worker takes control
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] Activating version ${CACHE_VERSION}`);

  event.waitUntil(
    // Clear ALL caches - we don't want any caching
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          console.log(`[Service Worker] Deleting cache: ${name}`);
          return caches.delete(name);
        })
      );
    })
  );

  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - intercepts all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Debug logging - log all requests
  const isNavigate = request.mode === 'navigate';
  const acceptsHtml = request.headers.get('accept')?.includes('text/html');
  const isHtmlFile = url.pathname.endsWith('.html');
  const endsWithSlash = url.pathname.endsWith('/');
  const isUi = url.pathname === '/ui';
  const isSignin = url.pathname === '/signin' || url.pathname.startsWith('/signin/');

  // Only handle same-origin HTTP requests
  if (!request.url.startsWith('http') || url.origin !== self.location.origin) {
    return;
  }

  // For HTML pages, always fetch from network with cache-control headers
  // This includes: /, /ui, /ui/, /signin, /signin/, *.html files, and any navigation requests
  if (isNavigate || acceptsHtml || isHtmlFile || endsWithSlash || isUi || isSignin) {
    console.log('[Service Worker] Preventing cache for HTML:', {
      path: url.pathname,
      mode: request.mode,
      accept: request.headers.get('accept'),
      matches: {
        navigate: isNavigate,
        acceptsHtml,
        htmlFile: isHtmlFile,
        endsWithSlash,
        isUi,
        isSignin
      }
    });

    event.respondWith(
      fetch(request, {
        cache: 'no-store',  // Never use browser cache
      }).then(response => {
        // Clone the response and add cache-control headers
        const modifiedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers(response.headers)
        });

        // Add aggressive no-cache headers
        modifiedResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        modifiedResponse.headers.set('Pragma', 'no-cache');
        modifiedResponse.headers.set('Expires', '0');

        return modifiedResponse;
      }).catch(error => {
        console.error('[Service Worker] Network request failed:', error);
        return Promise.reject(error);
      })
    );
  } else if (DEBUG_MODE) {
    // Debug: Log requests we're NOT intercepting (only if debug mode is on)
    console.debug('[Service Worker] Passing through:', url.pathname, {
      mode: request.mode,
      accept: request.headers.get('accept')
    });
  }
  // Let all other requests go through normally without intervention
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

  if (event.data && event.data.type === 'SET_DEBUG_MODE') {
    DEBUG_MODE = !!event.data.enabled;
    console.log(`[Service Worker] Debug mode ${DEBUG_MODE ? 'enabled' : 'disabled'}`);
  }
});