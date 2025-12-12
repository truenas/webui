import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

interface TrackedCall {
  method: string;
  paramsHash: string;
  timestamp: number;
  stack: string;
}

/**
 * Service to detect and log duplicate API calls made within a short time window.
 * This helps identify potential bugs where the same API call is issued multiple times
 * in rapid succession.
 *
 * Only active in development mode to avoid performance overhead in production.
 */
@Injectable({
  providedIn: 'root',
})
export class DuplicateCallTrackerService {
  private enabled = !environment.production;
  private readonly windowMs = 50;
  private recentCalls: TrackedCall[] = [];

  /**
   * Allows disabling tracking at runtime (useful for testing).
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Tracks an API call and logs a warning if a duplicate call (same method and params)
   * was made within the configured time window.
   */
  trackCall(method: string, params?: unknown[]): void {
    if (!this.enabled) {
      return;
    }

    const now = Date.now();
    const paramsHash = this.hashParams(params);
    const currentStack = new Error().stack ?? '';

    // Clean up old calls outside the time window
    this.recentCalls = this.recentCalls.filter(
      (call) => now - call.timestamp < this.windowMs,
    );

    // Check for duplicate
    const duplicate = this.recentCalls.find(
      (call) => call.method === method && call.paramsHash === paramsHash,
    );

    if (duplicate) {
      const timeSince = now - duplicate.timestamp;
      console.warn(
        `[DuplicateApiCall] "${method}" called again within ${timeSince}ms with same params:`,
        params,
        '\nOriginal call:',
        duplicate.stack,
        '\nDuplicate call:',
        currentStack,
      );
    }

    // Track this call
    this.recentCalls.push({
      method,
      paramsHash,
      timestamp: now,
      stack: currentStack,
    });
  }

  private hashParams(params?: unknown[]): string {
    if (!params || params.length === 0) {
      return '';
    }
    try {
      const seen = new WeakSet<object>();
      return JSON.stringify(params, (_key, value: unknown) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      });
    } catch {
      // Fallback for non-serializable values
      return `[NonSerializable:${params.length}]`;
    }
  }
}
