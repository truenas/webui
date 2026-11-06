/**
 * Inject `WINDOW` instead of using `window` directly, so tests can mock it.
 */
import { InjectionToken } from '@angular/core';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const WINDOW = new InjectionToken<Window>('Window');

export function getWindow(): Window {
  // eslint-disable-next-line no-restricted-globals
  return window;
}
