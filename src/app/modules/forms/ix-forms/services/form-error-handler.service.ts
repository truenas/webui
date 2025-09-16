import { Injectable, DOCUMENT, inject } from '@angular/core';
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
  private errorHandler = inject(ErrorHandlerService);
  private formService = inject(IxFormService);
  private document = inject<Document>(DOCUMENT);

  private isFocusedOnError = false;
  private needToShowError = false;

  /**
   * @param error
   * @param formGroupOrGroups Single form group or array of form groups
   * @param fieldsMap Overrides backend field names with frontend field names.
   * TODO: See if second `string` in fieldsMap can be typed to key of formGroup.
   */
  handleValidationErrors(
    error: unknown,
    formGroupOrGroups: UntypedFormGroup | UntypedFormGroup[],
    fieldsMap: Record<string, string> = {},
    triggerAnchor: string | undefined = undefined,
  ): void {
    this.needToShowError = false;
    const isValidationError = isApiCallError(error)
      && isApiErrorDetails(error.error.data)
      && error.error.data.errname === ApiErrorName.Validation
      && error.error.data.extra;

    // Normalize input to array for consistent handling
    const formGroups = Array.isArray(formGroupOrGroups) ? formGroupOrGroups : [formGroupOrGroups];

    if (isValidationError) {
      this.handleValidationError(error.error.data, formGroups, fieldsMap, triggerAnchor, error);
      return;
    }

    if (
      isFailedJobError(error)
      && error.job.exc_info?.type === JobExceptionType.Validation
      && error.job.exc_info.extra
    ) {
      this.handleValidationError(
        { ...error.job, extra: error.job.exc_info.extra as Job['extra'] },
        formGroups,
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
    formGroups: UntypedFormGroup[],
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

      const control = this.getFormField(formGroups, field, fieldsMap);

      const mappedFieldName = fieldsMap[field] ?? field; // Get the mapped field name

      if (triggerAnchor && control) {
        const triggerAnchorRef = this.document.getElementById(triggerAnchor);
        if (triggerAnchorRef) {
          triggerAnchorRef.click();
          setTimeout(() => {
            this.showValidationError({
              control,
              field: mappedFieldName, // Use mapped field name
              errorMessage,
            });
          });
          return;
        }
      }

      this.showValidationError({
        control,
        field: mappedFieldName, // Use mapped field name
        errorMessage,
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
    if (!control) {
      console.warn(`Could not find control ${field}.`);
      this.needToShowError = true;
      return;
    }

    if ((control as UntypedFormArray).controls?.length) {
      const isExactMatch = (text: string, match: string): boolean => new RegExp(`\\b${match}\\b`).test(text);

      control = (control as UntypedFormArray).controls
        .find((controlOfArray) => isExactMatch(errorMessage, controlOfArray.value as string)) || null;
    }

    if (!control) {
      console.warn(`Could not find control ${field}.`);
      this.needToShowError = true;

      return;
    }

    control.setErrors({
      manualValidateError: true,
      manualValidateErrorMsg: errorMessage,
      ixManualValidateError: { message: errorMessage },
    });
    control.markAsTouched();

    // Notify EditableComponents that might contain this field
    this.notifyEditablesOfValidationError(field);

    // Try to get element from IxFormService first, then fallback to querySelector
    let element = this.formService.getElementByControlName(field);
    if (!element && this.document?.querySelector) {
      // Fallback: try to find element by formControlName attribute
      element = this.document.querySelector(`[formControlName="${field}"]`) as HTMLElement;
    }

    if (!element) {
      console.warn(`Could not find DOM element for field ${field}.`);
      this.needToShowError = true;
      return;
    }

    if (!this.isFocusedOnError) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        this.isFocusedOnError = true;
      });
    }
  }


  private notifyEditablesOfValidationError(fieldName: string): void {
    // Notify EditableComponents to check for errors immediately
    const errorEvent = new CustomEvent('editable-validation-error', {
      detail: { fieldName },
      bubbles: true,
    });
    this.document.dispatchEvent(errorEvent);
  }


  private getFormField(
    formGroups: UntypedFormGroup[],
    field: string,
    fieldsMap: Record<string, string>,
  ): AbstractControl | null {
    const fieldName = fieldsMap[field] ?? field;

    // Search through all form groups to find the control
    for (const formGroup of formGroups) {
      const control = formGroup.get(fieldName);
      if (control) {
        return control;
      }
    }

    return null;
  }
}
