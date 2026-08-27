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
 * Accessible names the library's unnamed surfaces fall back to — a spinner, a progress bar, a
 * dialog or panel with no title. Without this the library uses its own English literals, which
 * never reach webui's `TranslateService`, and warns in dev mode on every unnamed instance.
 *
 * These names are deliberately generic and say only what the role already says. They are the floor,
 * not the goal: an `[ariaLabel]` on a particular instance still wins, and is what to reach for
 * whenever the name can say *what* is loading or *what* just opened.
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
