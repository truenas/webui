import { ApiMethod } from 'app/interfaces/api-directory.interface';

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
  secondaryCheckBox: boolean;
  secondaryCheckBoxMsg?: string;
  method?: ApiMethod;
  data?: any;
}
