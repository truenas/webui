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
 * Names every spinner, progress bar and modal surface that has nothing more specific to say.
 *
 * The library's own fallbacks are English literals, so before this each unnamed one either
 * announced "Loading" whatever the language or carried its own `[ariaLabel]="'Loading' | translate"`
 * — the same string repeated across a dozen templates. Providing the bundle once covers all seven,
 * and, per the token's contract, stands the library's dev-mode naming warning down: an app-wide
 * fallback is a decision, not a forgotten label.
 *
 * A component that can say WHAT is loading or open still binds `[ariaLabel]` (or, for a dialog and
 * a side panel, `[title]`) itself, and that wins over this.
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
