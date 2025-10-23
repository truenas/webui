import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';
import { TranslatedString } from 'app/modules/translate/translate.helper';

export interface SnackbarConfig {
  message: string;
  iconCssColor?: string;
  icon?: MarkedIcon;
  button?: {
    title: string;
    action?: () => void;
  };
}

/**
 * Configuration options for displaying snackbar notifications.
 *
 * @example
 * // Simple success message
 * snackbar.success('Data saved successfully');
 *
 * @example
 * // Custom snackbar with action button
 * snackbar.open({
 *   message: 'File deleted',
 *   icon: iconMarker('mdi-delete'),
 *   button: {
 *     title: 'Undo',
 *     action: () => restoreFile()
 *   }
 * });
 *
 * @example
 * // Error message with assertive politeness
 * snackbar.open({
 *   message: 'Connection lost',
 *   icon: iconMarker('mdi-alert-circle'),
 *   iconCssColor: 'var(--red)',
 *   politeness: 'assertive',  // Interrupts screen reader
 *   verticalPosition: 'top'
 * });
 */
export interface SnackbarOptions {
  /** The message to display in the snackbar. Should be a translated string. */
  message: TranslatedString;

  /** Optional icon to display alongside the message. Use iconMarker() to get a typed icon. */
  icon?: MarkedIcon;

  /**
   * CSS color value for the icon. Defaults to 'var(--primary)'.
   * Common values: 'var(--green)', 'var(--red)', 'var(--orange)'
   */
  iconCssColor?: string;

  /**
   * Optional action button configuration.
   * If no action is provided, the button will only dismiss the snackbar.
   */
  button?: {
    /** Button label text. Should be a translated string. */
    title: TranslatedString;
    /** Optional callback to execute when button is clicked. Button always dismisses the snackbar. */
    action?: () => void;
  };

  /** Duration in milliseconds before auto-dismissing. Defaults to 5000ms. Set to 0 to disable auto-dismiss. */
  duration?: number;

  /** Custom CSS class(es) to apply to the snackbar container. */
  panelClass?: string | string[];

  /**
   * Politeness level for screen readers (ARIA live regions).
   * - 'assertive': Important messages that should interrupt the user immediately (errors, critical alerts)
   * - 'polite': Messages that wait for a pause in user activity (default, success messages, info)
   *
   * @default 'polite'
   */
  politeness?: 'assertive' | 'polite';

  /**
   * Vertical position of the snackbar on screen.
   * - 'top': Appears at top of viewport (recommended for success messages)
   * - 'bottom': Appears at bottom of viewport (default, less intrusive)
   *
   * @default 'bottom'
   */
  verticalPosition?: 'top' | 'bottom';
}
