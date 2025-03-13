import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { ApiErrorName } from 'app/enums/api.enum';
import { JobExceptionType } from 'app/enums/response-error-type.enum';
import {
  isApiCallError, isApiErrorDetails, isFailedJobError,
} from 'app/helpers/api.helper';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import { Job } from 'app/interfaces/job.interface';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Injectable({ providedIn: 'root' })
export class FormErrorHandlerService {
  private isFocusedOnError = false;
  private needToShowError = false;

  constructor(
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
    triggerAnchor: string | undefined = undefined,
  ): void {
    const isValidationError = isApiCallError(error)
      && isApiErrorDetails(error.error.data)
      && error.error.data.errname === ApiErrorName.Validation
      && error.error.data.extra;
    if (isValidationError) {
      this.handleValidationError(error.error.data, formGroup, fieldsMap, triggerAnchor, error);
      return;
    }

    if (
      isFailedJobError(error)
      && error.job.exc_info.type === JobExceptionType.Validation
      && error.job.exc_info.extra
    ) {
      this.handleValidationError(
        { ...error.job, extra: error.job.exc_info.extra as Job['extra'] },
        formGroup,
        fieldsMap,
        triggerAnchor,
        error,
      );
      return;
    }

    // Fallback to old error handling
    this.errorHandler.showErrorModal(error);
  }

  // TODO: Too many arguments and convoluted logic. Rewrite.
  private handleValidationError(
    error: ApiErrorDetails | Job,
    formGroup: UntypedFormGroup,
    fieldsMap: Record<string, string>,
    triggerAnchor: string | undefined,
    originalError: unknown,
  ): void {
    this.isFocusedOnError = false;
    const extra = (error as ApiErrorDetails).extra as string[][];
    for (const extraItem of extra) {
      const field = extraItem[0].split('.').pop();
      if (!field) {
        return;
      }

      const errorMessage = extraItem[1];

      const control = this.getFormField(formGroup, field, fieldsMap);
      const controlsNames = this.formService.getControlNames();

      if (triggerAnchor && control && !controlsNames.includes(field)) {
        const triggerAnchorRef = this.document.getElementById(triggerAnchor);
        if (triggerAnchorRef) {
          triggerAnchorRef.click();
          setTimeout(() => {
            this.showValidationError({
              control,
              field,
              errorMessage,
            });
          });
          return;
        }
      }

      this.showValidationError({
        control, field, errorMessage,
      });
    }

    if (this.needToShowError) {
      // Fallback to default modal error message.
      this.errorHandler.showErrorModal(originalError);
    }
  }

  private showValidationError({
    control, field, errorMessage,
  }: {
    control: AbstractControl | null;
    field: string;
    errorMessage: string;
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
        .find((controlOfArray) => isExactMatch(errorMessage, controlOfArray.value as string)) || null;
    }

    if (!control) {
      console.error(`Could not find control ${field}.`);
      this.needToShowError = true;
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

  private getFormField(
    formGroup: UntypedFormGroup,
    field: string,
    fieldsMap: Record<string, string>,
  ): AbstractControl | null {
    const fieldName = fieldsMap[field] ?? field;
    return formGroup.get(fieldName);
  }
}
