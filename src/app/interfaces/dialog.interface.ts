import { TranslatedString } from 'app/modules/translate/translate.helper';

export interface ConfirmOptions {
  title: TranslatedString;
  message: TranslatedString;
  hideCheckbox?: boolean;
  buttonText?: TranslatedString;
  hideCancel?: boolean;
  cancelText?: TranslatedString;
  disableClose?: boolean;
  confirmationCheckboxText?: TranslatedString;
  buttonColor?: 'primary' | 'warn';
}

export interface ConfirmOptionsWithSecondaryCheckbox extends ConfirmOptions {
  secondaryCheckbox: boolean;
  secondaryCheckboxText?: TranslatedString;
}

export interface DialogWithSecondaryCheckboxResult {
  confirmed: boolean;
  secondaryCheckbox: boolean;
}

export interface FullScreenDialogOptions {
  title: TranslatedString;
  message: TranslatedString;
  showClose: boolean;
  pre: boolean;
}
