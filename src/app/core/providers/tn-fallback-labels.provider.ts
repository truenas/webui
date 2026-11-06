import { Provider } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TN_FALLBACK_LABELS, type TnFallbackLabels } from '@truenas/ui-components';
import { translated } from 'app/helpers/translated.helper';

const labelKeys: Record<keyof TnFallbackLabels, string> = {
  spinner: T('Loading'),
  /** The library's own default differs here ('Loading...') only to preserve what already-shipped
   * branded spinners announce; webui has no such history to keep. */
  brandedSpinner: T('Loading'),
  progressBar: T('Progress'),
  particleProgressBar: T('Progress'),
  dialog: T('Dialog'),
  sidePanel: T('Side panel'),
  drawer: T('Drawer'),
};

/**
 * Translated fallback names for every spinner, progress bar and modal surface that has nothing more
 * specific to say; the library's own fallbacks are English. Providing them app-wide also stands down
 * the library's dev-mode naming warning. A component that can say what is loading still binds
 * `[ariaLabel]` (or `[title]` for a dialog or side panel), which wins.
 */
export function provideTnFallbackLabels(): Provider {
  return {
    provide: TN_FALLBACK_LABELS,
    useFactory: () => translated<TnFallbackLabels>((translate) => ({
      spinner: translate.instant(labelKeys.spinner),
      brandedSpinner: translate.instant(labelKeys.brandedSpinner),
      progressBar: translate.instant(labelKeys.progressBar),
      particleProgressBar: translate.instant(labelKeys.particleProgressBar),
      dialog: translate.instant(labelKeys.dialog),
      sidePanel: translate.instant(labelKeys.sidePanel),
      drawer: translate.instant(labelKeys.drawer),
    })),
  };
}
