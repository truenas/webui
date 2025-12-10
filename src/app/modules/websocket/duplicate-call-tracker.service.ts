import { Injectable } from '@angular/core';

interface TrackedCall {
  method: string;
  paramsHash: string;
  timestamp: number;
}

/**
 * Service to detect and log duplicate API calls made within a short time window.
 * This helps identify potential bugs where the same API call is issued multiple times
 * in rapid succession.
 */
@Injectable({
  providedIn: 'root',
})
export class DuplicateCallTrackerService {
  private readonly windowMs = 20;
  private recentCalls: TrackedCall[] = [];

  /**
   * Tracks an API call and logs a warning if a duplicate call (same method and params)
   * was made within the configured time window.
   */
  trackCall(method: string, params?: unknown[]): void {
    const now = Date.now();
    const paramsHash = this.hashParams(params);

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
        new Error().stack,
      );
    }

    // Track this call
    this.recentCalls.push({
      method,
      paramsHash,
      timestamp: now,
    });
  }

  private hashParams(params?: unknown[]): string {
    if (!params || params.length === 0) {
      return '';
    }
    try {
      return JSON.stringify(params);
    } catch {
      return String(params);
    }
  }
}
