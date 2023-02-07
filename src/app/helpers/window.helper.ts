/**
 * Prefer injecting window token instead of using window directly.
 * This will make mocking easier when writing tests.
 *
 * @example
 * ```
 * constructor(
 *   @Inject(WINDOW) private window: Window
 * )
 * ```
 */
import { InjectionToken } from '@angular/core';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const WINDOW = new InjectionToken<string>('Window');

export function getWindow(): Window {
  // eslint-disable-next-line no-restricted-globals
  return window;
}
