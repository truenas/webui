import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class ServiceWorkerService {
  private document = inject(DOCUMENT);
  private registration = signal<ServiceWorkerRegistration | null>(null);
  private lastReloadTimeMemory: number | null = null; // Fallback for when localStorage is unavailable
  private isRegistered = false;

  // Helper function to safely get from localStorage
  private getLastReloadTime(): string | null {
    try {
      return localStorage.getItem('sw-last-reload');
    } catch {
      // Fallback to in-memory storage if localStorage throws (e.g., private browsing)
      return this.lastReloadTimeMemory ? this.lastReloadTimeMemory.toString() : null;
    }
  }

  // Helper function to safely set in localStorage
  private setLastReloadTime(time: string): void {
    try {
      localStorage.setItem('sw-last-reload', time);
    } catch {
      // Fallback to in-memory storage if localStorage throws
      this.lastReloadTimeMemory = parseInt(time, 10);
      console.warn('[Main] localStorage unavailable, using in-memory storage for reload protection');
    }
  }

  // Helper function to check if we should reload (prevents infinite reload loops)
  private shouldAllowReload(): boolean {
    const lastReloadTime = this.getLastReloadTime();
    const now = Date.now();
    const minTimeBetweenReloads = 5000; // 5 seconds

    if (!lastReloadTime || now - parseInt(lastReloadTime, 10) > minTimeBetweenReloads) {
      this.setLastReloadTime(now.toString());
      return true;
    }

    console.info('[Main] Skipping reload to prevent loop, last reload was too recent');
    return false;
  }

  private reloadWithUpdate(): void {
    const reg = this.registration();
    if (reg?.waiting) {
      // Tell the waiting service worker to skip waiting
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Just reload if no waiting worker
      globalThis.location.reload();
    }
  }

  register(): void {
    if (this.isRegistered || !('serviceWorker' in navigator)) {
      return;
    }

    this.isRegistered = true;

    // Development helper - expose service globally for debugging
    if (!environment.production) {
      (globalThis as unknown as { swDebug: unknown }).swDebug = {
        enableDebug: () => this.enableDebug(),
        disableDebug: () => this.disableDebug(),
        checkVersion: () => this.checkVersion(),
        forceUpdate: () => this.forceUpdate(),
        clearAllCaches: () => this.clearAllCaches(),
      };
      console.info('Service Worker debug available via: swDebug.enableDebug()');
    }

    try {
      // Register service worker - handle both development (/) and production (/ui/) paths
      const baseHref = this.document.querySelector('base')?.getAttribute('href') || '/';
      const swPath = `${baseHref}sw.js`;

      navigator.serviceWorker
        .register(swPath, { updateViaCache: 'none' })
        .then((reg) => {
          this.registration.set(reg);
          console.info('[Main] Service Worker registered successfully');

          // Check for updates on registration - browser will fetch if needed
          reg.update().catch((error: unknown) => {
            console.error('[Main] Service Worker initial update check failed:', error);
          });

          // Check for updates only on page visibility change (when user returns to tab)
          // This is sufficient since upgrades are manual and infrequent
          this.document.addEventListener('visibilitychange', () => {
            if (!this.document.hidden) {
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
                if (this.shouldAllowReload()) {
                  console.info('[Main] New Service Worker activated, reloading...');
                  this.reloadWithUpdate();
                }
              }
            });
          });

          // Handle messages from service worker (if any)

          // Check if there's a waiting service worker on page load
          if (reg.waiting && this.shouldAllowReload()) {
            console.info('[Main] New version waiting, reloading...');
            this.reloadWithUpdate();
          }

          // Handle controller change (when skipWaiting is called)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (this.shouldAllowReload()) {
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

  // Debug methods
  checkVersion(): void {
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
  }

  forceUpdate(): void {
    const reg = this.registration();
    if (reg) {
      reg.update().then(() => {
        console.info('Manual update check initiated');
      });
    }
  }

  clearAllCaches(): void {
    if ('caches' in globalThis) {
      caches.keys().then((names) => {
        if (names.length === 0) {
          console.info('No caches to clear');
          return;
        }
        names.forEach((name) => {
          caches.delete(name);
          console.info(`Deleted cache: ${name}`);
        });
      });
    }
  }

  enableDebug(): void {
    if (!navigator.serviceWorker?.controller) {
      console.warn('No service worker controller - try refreshing the page');
      return;
    }
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_DEBUG_MODE',
      enabled: true,
    });
    console.info('Service Worker debug mode enabled - all requests will be logged');
  }

  disableDebug(): void {
    if (!navigator.serviceWorker?.controller) {
      console.warn('No service worker controller - try refreshing the page');
      return;
    }
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_DEBUG_MODE',
      enabled: false,
    });
    console.info('Service Worker debug mode disabled');
  }
}
