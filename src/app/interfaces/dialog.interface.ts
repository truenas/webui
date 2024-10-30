export interface ConfirmOptions {
  title: string;
  message: string;
  hideCheckbox?: boolean;
  buttonText?: string;
  hideCancel?: boolean;
  cancelText?: string;
  disableClose?: boolean;
  confirmationCheckboxText?: string;
  buttonColor?: 'primary' | 'red';
}

export interface ConfirmOptionsWithSecondaryCheckbox extends ConfirmOptions {
  secondaryCheckbox: boolean;
  secondaryCheckboxText?: string;
}

export interface DialogWithSecondaryCheckboxResult {
  confirmed: boolean;
  secondaryCheckbox: boolean;
}

export interface FullScreenDialogOptions {
  title: string;
  message: string;
  showClose: boolean;
  pre: boolean;
}
