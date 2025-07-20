import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { IncomingMessage, RequestMessage } from 'app/interfaces/api-message.interface';
import { WebSocketDebugMessage } from 'app/modules/websocket-debug-panel/interfaces/websocket-debug.interface';
import * as WebSocketDebugActions from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';

@Injectable({
  providedIn: 'root',
})
export class WebSocketDebugService {
  // Cache to map request IDs to method names
  private requestMethodCache = new Map<string, string>();
  // Limit cache size to prevent memory leaks
  private readonly maxCacheSize = 1000;

  constructor(
    private store$: Store,
  ) {}

  logOutgoingMessage(message: RequestMessage, isMocked = false): void {
    // Cache the method name for this request ID
    if ('id' in message && 'method' in message && message.id && message.method) {
      this.cacheRequestMethod(String(message.id), message.method);
    }

    const debugMessage: WebSocketDebugMessage = {
      id: UUID.UUID(),
      timestamp: new Date().toISOString(),
      direction: 'out',
      message,
      isMocked,
      methodName: message.method,
    };
    this.store$.dispatch(WebSocketDebugActions.messageSent({ message: debugMessage }));
  }

  logIncomingMessage(message: IncomingMessage, isMocked = false): void {
    let methodName: string | undefined;

    // For response messages, look up the method name from the cache
    if ('id' in message && message.id) {
      const messageId = String(message.id);
      methodName = this.requestMethodCache.get(messageId);
      // Clean up the cache entry after using it
      this.requestMethodCache.delete(messageId);
    }
    // For subscription/event messages that have their own method field
    if ('method' in message && message.method) {
      methodName = message.method;
    }

    const debugMessage: WebSocketDebugMessage = {
      id: UUID.UUID(),
      timestamp: new Date().toISOString(),
      direction: 'in',
      message,
      isMocked,
      methodName,
    };
    this.store$.dispatch(WebSocketDebugActions.messageReceived({ message: debugMessage }));
  }

  clearMessages(): void {
    this.store$.dispatch(WebSocketDebugActions.clearMessages());
  }

  setMessageLimit(limit: number): void {
    this.store$.dispatch(WebSocketDebugActions.setMessageLimit({ limit }));
  }

  private cacheRequestMethod(id: string, method: string): void {
    // Add to cache
    this.requestMethodCache.set(id, method);

    // Implement simple LRU-like cleanup to prevent unbounded growth
    if (this.requestMethodCache.size > this.maxCacheSize) {
      // Remove the oldest entry (first in the Map)
      const firstKey = this.requestMethodCache.keys().next().value as string | undefined;
      if (firstKey) {
        this.requestMethodCache.delete(firstKey);
      }
    }
  }
}
