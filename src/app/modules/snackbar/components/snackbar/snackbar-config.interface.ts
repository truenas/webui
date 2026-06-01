import { TnToastType } from '@truenas/ui-components';
import { TranslatedString } from 'app/modules/translate/translate.helper';

/**
 * Configuration options for displaying snackbar notifications.
 *
 * Backed by `TnToastService`; prefer the typed helpers `success()` / `error()`
 * on `SnackbarService` unless you need a custom action button.
 *
 * @example
 * // Simple success message
 * snackbar.success('Data saved successfully');
 *
 * @example
 * // Custom snackbar with action button
 * snackbar.open({
 *   message: 'File deleted',
 *   button: {
 *     title: 'Undo',
 *     action: () => restoreFile(),
 *   },
 * });
 */
export interface SnackbarOptions {
  /** The message to display. Should be a translated string. */
  message: TranslatedString;

  /**
   * Semantic toast style. Drives the icon and color picked by `tn-toast`.
   *
   * @default TnToastType.Info
   */
  type?: TnToastType;

  /**
   * Optional action button. If `action` is omitted, the button only dismisses the toast.
   */
  button?: {
    /** Button label text. Should be a translated string. */
    title: TranslatedString;
    /** Optional callback invoked when the button is clicked. */
    action?: () => void;
  };

  /** Duration in ms before auto-dismissing. Defaults to 4000ms. Set to 0 to disable. */
  duration?: number;
}
