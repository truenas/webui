import { ApiMethod } from 'app/interfaces/api-directory.interface';

export interface ConfirmOptions {
  title: string;
  message: string;
  hideCheckBox?: boolean;
  buttonMsg?: string;
  tooltip?: string;
  hideCancel?: boolean;
  cancelMsg?: string;
  disableClose?: boolean;
}

export interface ConfirmOptionsWithSecondaryCheckbox extends ConfirmOptions {
  secondaryCheckBox: true;
  secondaryCheckBoxMsg?: string;
  method?: ApiMethod;
  data?: any;
}
