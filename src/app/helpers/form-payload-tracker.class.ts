/**
 * Tracks the initial payload of a form and diffs it against the current
 * payload on submit, so only changed properties are sent to the backend.
 *
 * This prevents unnecessary API calls (e.g. zfs inherit) for properties
 * that the user did not actually change.
 *
 * Usage:
 * 1. After populating form with existing values, call `capture(computePayload())`.
 * 2. Before submit, call `diff(computePayload())` to get only changed properties.
 *
 * Uses strict equality (===) — payload values should be primitives
 * (strings, numbers) or the inherit symbol.
 */
export class FormPayloadTracker {
  private initialPayload: Record<string, unknown> | null = null;

  /**
   * Capture the initial payload snapshot after form is populated with
   * existing values. Should be called once during edit-mode setup.
   */
  capture(payload: Record<string, unknown>): void {
    this.initialPayload = { ...payload };
  }

  /**
   * Returns only the properties that changed compared to the captured
   * initial payload. If no initial payload was captured (create mode),
   * returns the full payload unchanged.
   */
  diff(currentPayload: Record<string, unknown>): Record<string, unknown> {
    if (!this.initialPayload) {
      return currentPayload;
    }

    const result = { ...currentPayload };
    for (const key of Object.keys(result)) {
      if (key in this.initialPayload && result[key] === this.initialPayload[key]) {
        delete result[key];
      }
    }
    return result;
  }

  /**
   * Returns the set of all keys managed by this tracker (union of
   * initial and current keys). Useful when the caller needs to clear
   * diff-managed keys from a separate data object before merging.
   *
   * Returns an empty set when no initial payload was captured (create mode).
   * Callers must check `hasCaptured` before using this in edit-mode logic.
   */
  getManagedKeys(currentPayload: Record<string, unknown>): Set<string> {
    if (!this.initialPayload) {
      return new Set();
    }
    return new Set([
      ...Object.keys(this.initialPayload),
      ...Object.keys(currentPayload),
    ]);
  }

  get hasCaptured(): boolean {
    return this.initialPayload !== null;
  }
}
