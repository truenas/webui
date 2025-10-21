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

export interface SnackbarOptions {
  message: TranslatedString;
  icon?: MarkedIcon;
  iconCssColor?: string;
  button?: {
    title: TranslatedString;
    action?: () => void;
  };
  duration?: number;
  panelClass?: string | string[];
  /**
   * Politeness level for screen readers.
   * - 'assertive': Important messages that should interrupt the user
   * - 'polite': Messages that wait for a pause in user activity (default)
   */
  politeness?: 'assertive' | 'polite';
  /**
   * Vertical position of the snackbar.
   * Defaults to 'bottom'
   */
  verticalPosition?: 'top' | 'bottom';
}
