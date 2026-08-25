import { Provider } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TN_DIALOG_LABELS, type TnDialogLabels } from '@truenas/ui-components';
import { translated } from 'app/helpers/translated.helper';

const labelKeys: Record<keyof TnDialogLabels, string> = {
  close: T('Close dialog'),
  enterFullscreen: T('Enter fullscreen'),
  exitFullscreen: T('Exit fullscreen'),
};

/**
 * Translates `tn-dialog-shell`'s own chrome — the close (X) and fullscreen buttons.
 *
 * These were literals inside the library template with no input to bind, so every dialog in
 * webui announced them in English whatever the active language. There is nothing to remove from
 * the call sites here; this provider is the only way to reach them.
 */
export function provideTnDialogLabels(): Provider {
  return {
    provide: TN_DIALOG_LABELS,
    useFactory: () => translated<TnDialogLabels>((translate) => ({
      close: translate.instant(labelKeys.close),
      enterFullscreen: translate.instant(labelKeys.enterFullscreen),
      exitFullscreen: translate.instant(labelKeys.exitFullscreen),
    })),
  };
}
