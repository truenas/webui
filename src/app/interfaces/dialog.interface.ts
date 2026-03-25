import { Observable } from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { TranslatedString } from 'app/modules/translate/translate.helper';

export interface ConfirmOptions {
  title?: TranslatedString;
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
  secondaryCheckboxMessage?: TranslatedString;
}

export interface DialogWithSecondaryCheckboxResult {
  confirmed: boolean;
  secondaryCheckbox: boolean;
}

interface ConfirmDeleteBaseOptions {
  title?: TranslatedString;
  message: TranslatedString;
  buttonText?: TranslatedString;
  successMessage?: TranslatedString;
}

export interface ConfirmDeleteCallOptions extends ConfirmDeleteBaseOptions {
  call: () => Observable<unknown>;
}

export interface ConfirmDeleteJobOptions extends ConfirmDeleteBaseOptions {
  job: () => Observable<Job>;
  jobProgressTitle?: TranslatedString;
}

export type ConfirmDeleteOptions = ConfirmDeleteCallOptions | ConfirmDeleteJobOptions;

export interface FullScreenDialogOptions {
  title: TranslatedString;
  message: TranslatedString;
  showClose: boolean;
  pre: boolean;
}
