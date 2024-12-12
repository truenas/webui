import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { ApiErrorName } from 'app/enums/api.enum';
import { JobExceptionType } from 'app/enums/response-error-type.enum';
import { isApiError, isErrorResponse, isFailedJob } from 'app/helpers/api.helper';
import { ApiError } from 'app/interfaces/api-error.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@Injectable({ providedIn: 'root' })
export class FormErrorHandlerService {
  private isFocusedOnError = false;
  private needToShowError = false;

  constructor(
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private formService: IxFormService,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  /**
   * @param error
   * @param formGroup
   * @param fieldsMap Overrides backend field names with frontend field names.
   * TODO: See if second `string` in fieldsMap can be typed to key of formGroup.
   */
  handleValidationErrors(
    error: unknown,
    formGroup: UntypedFormGroup,
    fieldsMap: Record<string, string> = {},
    triggerAnchor: string = undefined,
  ): void {
    const isValidationError = isErrorResponse(error)
      && isApiError(error.error.data)
      && error.error.data.errname === ApiErrorName.Validation
      && error.error.data.extra;
    if (isValidationError) {
      this.handleValidationError(error.error.data, formGroup, fieldsMap, triggerAnchor);
      return;
    }

    if (
      isFailedJob(error)
      && error.exc_info.type === JobExceptionType.Validation
      && error.exc_info.extra
    ) {
      this.handleValidationError(
        { ...error, extra: error.exc_info.extra as Job['extra'] },
        formGroup,
        fieldsMap,
        triggerAnchor,
      );
      return;
    }

    // Fallback to old error handling
    this.dialog.error(this.errorHandler.parseError(error));
  }

  private handleValidationError(
    error: ApiError | Job,
    formGroup: UntypedFormGroup,
    fieldsMap: Record<string, string>,
    triggerAnchor: string,
  ): void {
    this.isFocusedOnError = false;
    this.needToShowError = false;
    const extra = (error as ApiError).extra as string[][];
    for (const extraItem of extra) {
      const field = extraItem[0].split('.').pop();
      const errorMessage = extraItem[1];

      const control = this.getFormField(formGroup, field, fieldsMap);
      const controlsNames = this.formService.getControlNames();

      if (triggerAnchor && control && !controlsNames.includes(field)) {
        const triggerAnchorRef: HTMLElement = this.document.getElementById(triggerAnchor);
        if (triggerAnchorRef) {
          triggerAnchorRef.click();
          setTimeout(() => {
            this.showValidationError({
              control: this.getFormField(formGroup, field, fieldsMap),
              field,
              errorMessage,
              error,
            });
          });
          return;
        }
      }

      this.showValidationError({
        control, field, errorMessage, error,
      });
    }

    if (this.needToShowError) {
      // Fallback to default modal error message.
      this.dialog.error(this.errorHandler.parseError(error));
    }
  }

  private showValidationError({
    control, field, error, errorMessage,
  }: {
    control: AbstractControl;
    field: string;
    errorMessage: string;
    error: ApiError | Job;
  }): void {
    const controlsNames = this.formService.getControlNames();

    if (!control || !controlsNames.includes(field)) {
      console.error(`Could not find control ${field}.`);
      this.needToShowError = true;
      return;
    }

    if ((control as UntypedFormArray).controls?.length) {
      const isExactMatch = (text: string, match: string): boolean => new RegExp(`\\b${match}\\b`).test(text);

      control = (control as UntypedFormArray).controls
        .find((controlOfArray) => isExactMatch(errorMessage, controlOfArray.value as string));
    }

    if (!control) {
      this.dialog.error(this.errorHandler.parseError(error));
    } else {
      control.setErrors({
        manualValidateError: true,
        manualValidateErrorMsg: errorMessage,
        ixManualValidateError: { message: errorMessage },
      });
      control.markAsTouched();

      const element = this.formService.getElementByControlName(field);
      if (element && !this.isFocusedOnError) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
          this.isFocusedOnError = true;
        });
      }
    }
  }

  private getFormField(formGroup: UntypedFormGroup, field: string, fieldsMap: Record<string, string>): AbstractControl {
    const fieldName = fieldsMap[field] ?? field;
    return formGroup.get(fieldName);
  }
}
