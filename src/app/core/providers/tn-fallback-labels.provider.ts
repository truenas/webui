import { Provider } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TN_FALLBACK_LABELS, type TnFallbackLabels } from '@truenas/ui-components';
import { translated } from 'app/helpers/translated.helper';

const labelKeys: Record<keyof TnFallbackLabels, string> = {
  spinner: T('Loading'),
  brandedSpinner: T('Loading...'),
  progressBar: T('Progress'),
  particleProgressBar: T('Progress'),
  dialog: T('Dialog'),
  sidePanel: T('Side panel'),
  drawer: T('Drawer'),
};

/**
 * Translates the generic accessible names the library falls back to when a spinner, progress bar,
 * dialog, side panel or drawer is rendered without an `ariaLabel` of its own.
 *
 * The library ships those fallbacks in English, and the only other route to them was an identical
 * `[ariaLabel]="'Loading' | translate"` on each of the app's ~20 spinners and ~25 progress bars —
 * the copy-on-every-instance shape `TN_TABLE_PAGER_LABELS` and `TN_CALENDAR_INTL` already exist to
 * remove. Wiring the bundle once here names all of them, in whatever language the app is in.
 *
 * A per-instance `ariaLabel` still wins, and is still the right answer wherever the name can say
 * WHAT is loading ('Loading logs') rather than merely that something is. Providing the bundle also
 * stands down the library's dev-mode "unnamed component" warning for these components, which is
 * the intended reading: the app has answered the question the warning asks.
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
