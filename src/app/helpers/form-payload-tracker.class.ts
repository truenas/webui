/**
 * Tracks the initial payload of a form and diffs it against the current
 * payload on submit, so only changed properties are sent to the backend.
 *
 * This prevents unnecessary API calls (e.g. zfs inherit) for properties
 * that the user did not actually change.
 *
 * Usage:
 * 1. After populating form with existing values, call `capture(computePayload())`.
 * 2. Before submit, either:
 *    - Call `diff(computePayload())` to get only changed properties (self-contained payloads).
 *    - Call `applyDiff(data, computePayload())` to get a new object with unchanged keys
 *      stripped from a larger payload that also contains non-diffed fields (e.g. volume size, encryption).
 *
 * Uses strict equality (===) — payload values should be primitives
 * (strings, numbers) or the inherit symbol.
 */
export class FormPayloadTracker<T extends Record<string, unknown> = Record<string, unknown>> {
  private initialPayload: T | null = null;

  /**
   * Capture the initial payload snapshot after form is populated with
   * existing values. Should be called once during edit-mode setup.
   */
  capture(payload: T): void {
    this.initialPayload = { ...payload };
  }

  /**
   * Returns only the properties that changed compared to the captured
   * initial payload. If no initial payload was captured (create mode),
   * returns the full payload unchanged.
   */
  diff(currentPayload: T): Partial<T> {
    if (!this.initialPayload) {
      return { ...currentPayload };
    }

    const result: Record<string, unknown> = { ...currentPayload };
    for (const key of Object.keys(result)) {
      if (key in this.initialPayload && result[key] === (this.initialPayload as Record<string, unknown>)[key]) {
        delete result[key];
      }
    }
    return result as Partial<T>;
  }

  /**
   * Returns the union of keys from the initial and current payloads.
   * Keys that appear only in currentPayload (not captured initially) are
   * still managed: they are first deleted from `data` and then re-added
   * via the diff result, which preserves new keys by definition.
   */
  private getManagedKeys(currentPayload: T): Set<string> {
    return new Set([
      ...Object.keys(this.initialPayload as T),
      ...Object.keys(currentPayload),
    ]);
  }

  /**
   * Returns a new object with all diff-managed keys removed from `data`,
   * then merged back with only the properties that actually changed.
   * Non-managed keys from `data` are preserved as-is.
   *
   * Returns a shallow copy of `data` if capture() was never called (create mode).
   */
  applyDiff(data: Record<string, unknown>, currentPayload: T): Record<string, unknown> {
    if (!this.initialPayload) return { ...data };

    const result = { ...data };
    const diffedPayload = this.diff(currentPayload);
    for (const key of this.getManagedKeys(currentPayload)) {
      delete result[key];
    }
    return { ...result, ...diffedPayload };
  }

  get hasCaptured(): boolean {
    return this.initialPayload !== null;
  }
}
