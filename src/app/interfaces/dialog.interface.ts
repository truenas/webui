export interface ConfirmOptions {
  title: string;
  message: string;
  hideCheckBox?: boolean;
  buttonMsg?: string;
  tooltip?: any;
  hideCancel?: boolean;
  cancelMsg?: string;
  disableClose?: boolean;
  textToCopy?: string;
  keyTextArea?: boolean;
}

export interface ConfirmOptionsWithSecondaryCheckbox extends ConfirmOptions {
  secondaryCheckBox: true;
  secondaryCheckBoxMsg?: string;
  method?: string;
  data?: any;
}
