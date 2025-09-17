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
import { ValidationErrorCommunicationService } from 'app/modules/forms/validation-error-communication.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Injectable({ providedIn: 'root' })
export class FormErrorHandlerService {
  private errorHandler = inject(ErrorHandlerService);
  private formService = inject(IxFormService);
  private document = inject<Document>(DOCUMENT);
  private validationErrorService = inject(ValidationErrorCommunicationService);

  private isFocusedOnError = false;
  private unhandledErrors: { field: string; message: string }[] = [];

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
    // Clear any existing unhandled errors when handling new validation
    this.unhandledErrors = [];
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
      const fullFieldPath = extraItem[0];
      const field = this.extractFieldName(fullFieldPath);
      if (!field) {
        return;
      }

      const errorMessage = extraItem[1];

      const control = this.getFormField(formGroups, field, fieldsMap);


      const mappedFieldName = fieldsMap[field] ?? field; // Get the mapped field name
      const displayFieldName = this.getDisplayFieldName(fullFieldPath, mappedFieldName);

      if (triggerAnchor && control) {
        const triggerAnchorRef = this.document.getElementById(triggerAnchor);
        if (triggerAnchorRef) {
          triggerAnchorRef.click();
          setTimeout(() => {
            this.showValidationError({
              control,
              field: mappedFieldName, // Use mapped field name for control lookup
              displayField: displayFieldName, // Use display name for error messages
              errorMessage,
            });
          });
          return;
        }
      }

      this.showValidationError({
        control,
        field: mappedFieldName, // Use mapped field name for control lookup
        displayField: displayFieldName, // Use display name for error messages
        errorMessage,
      });
    }

    // Check if any errors couldn't be handled inline and need fallback
    this.checkForFallbackErrors(originalError);
  }

  private showValidationError({
    control, field, displayField, errorMessage,
  }: {
    control: AbstractControl | null;
    field: string;
    displayField?: string;
    errorMessage: string;
  }): void {
    const fieldToDisplay = displayField || field;
    if (!control) {
      console.warn(`Could not find control ${field}.`);
      this.handleErrorFallback(fieldToDisplay, errorMessage);
      return;
    }

    if ((control as UntypedFormArray).controls?.length) {
      const isExactMatch = (text: string, match: string): boolean => new RegExp(`\\b${match}\\b`).test(text);

      control = (control as UntypedFormArray).controls
        .find((controlOfArray) => isExactMatch(errorMessage, controlOfArray.value as string)) || null;
    }

    if (!control) {
      console.warn(`Could not find control ${field}.`);
      this.handleErrorFallback(fieldToDisplay, errorMessage);
      return;
    }

    control.setErrors({
      manualValidateError: true,
      manualValidateErrorMsg: errorMessage,
      ixManualValidateError: { message: errorMessage },
    });
    control.markAsTouched();

    // Notify editable components that might contain this field
    this.notifyEditablesOfValidationError(field);

    // Try to get element from IxFormService first, then fallback to querySelector
    let element = this.formService.getElementByControlName(field);
    if (!element && this.document?.querySelector) {
      // Fallback: try to find element by formControlName attribute
      element = this.document.querySelector(`[formControlName="${field}"]`) as HTMLElement;
    }

    if (!element) {
      console.warn(`Could not find DOM element for field ${field}.`);
      this.handleErrorFallback(fieldToDisplay, errorMessage);
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
    // Securely notify editable components through dedicated service
    this.validationErrorService.notifyValidationError(fieldName);
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

  /**
   * Extract the field name from full field path for form control lookup
   * Examples:
   * - 'user_update.username' -> 'username'
   * - 'user_update.sudo_commands_nopassword.0' -> 'sudo_commands_nopassword'
   */
  private extractFieldName(fullFieldPath: string): string {
    const parts = fullFieldPath.split('.');
    // Remove the prefix (like 'user_update') and array indices
    const fieldParts = parts.slice(1).find((part) => !(/^\d+$/.test(part)));
    return fieldParts || parts[parts.length - 1];
  }

  /**
   * Get a human-readable display name for the field
   * Examples:
   * - 'user_update.sudo_commands_nopassword.0' -> 'sudo_commands_nopassword[0]'
   * - 'user_update.username' -> 'username'
   */
  private getDisplayFieldName(fullFieldPath: string, fallbackName: string): string {
    const parts = fullFieldPath.split('.');

    if (parts.length <= 2) {
      // Simple field like 'user_update.username'
      return fallbackName;
    }

    // Complex field like 'user_update.sudo_commands_nopassword.0'
    const relevantParts = parts.slice(1); // Remove prefix like 'user_update'
    let result = relevantParts[0]; // Start with the main field name

    // Add array indices in bracket notation
    for (let i = 1; i < relevantParts.length; i++) {
      const part = relevantParts[i];
      if (/^\d+$/.test(part)) {
        result += `[${part}]`;
      } else {
        result += `.${part}`;
      }
    }

    return result;
  }

  /**
   * Handle error fallback - either add to form-level errors or show modal
   * based on whether a form-level error component is present
   */
  private handleErrorFallback(field: string, message: string): void {
    // Always collect for modal fallback
    this.unhandledErrors.push({ field, message });
  }

  /**
   * Check if there are unhandled errors and show modal fallback if needed
   */
  private checkForFallbackErrors(originalError: unknown): void {
    if (this.unhandledErrors.length > 0) {
      // Show modal with all unhandled errors
      this.errorHandler.showErrorModal(originalError);
    }
  }
}
