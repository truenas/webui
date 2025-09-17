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
  private validationErrorService = inject(ValidationErrorCommunicationService, { optional: true });

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
    // Clear any existing errors when handling new validation
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

    // Add type guard for safer type casting
    if (!this.isApiErrorDetailsWithExtra(error)) {
      console.warn('Error does not contain expected extra field structure:', error);
      return;
    }

    const extra = error.extra;
    for (const extraItem of extra) {
      const fullFieldPath = extraItem[0];
      const field = this.extractFieldName(fullFieldPath);
      if (!field) {
        console.warn(`Failed to extract field name from path: ${fullFieldPath}`);
        continue;
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
              field: mappedFieldName, // Use mapped field name for control lookup
              errorMessage,
            });
          });
          return;
        }
      }

      this.showValidationError({
        control,
        field: mappedFieldName, // Use mapped field name for control lookup
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
      const foundElement = this.document.querySelector(`[formControlName="${field}"]`);
      element = foundElement instanceof HTMLElement ? foundElement : null;
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
    // Securely notify editable components through dedicated service (if available)
    this.validationErrorService?.notifyValidationError(fieldName);
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
   * Type guard to check if error has the expected extra field structure
   * Validates that extra contains arrays of [fieldPath, errorMessage, ?errorCode]
   */
  private isApiErrorDetailsWithExtra(error: unknown): error is ApiErrorDetails & { extra: [string, string][] } {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const errorObj = error as Record<string, unknown>;

    // Check if it has extra field directly or if it's a transformed job error
    if (!('extra' in errorObj) || !Array.isArray(errorObj.extra)) {
      return false;
    }

    // Validate that extra is a non-empty array of properly structured arrays
    return errorObj.extra.length > 0 && errorObj.extra.every((item) => (
      Array.isArray(item)
      && item.length >= 2
      && typeof item[0] === 'string'
      && typeof item[1] === 'string'
      && item[0].trim().length > 0 // Field path must not be empty
      && item[1].trim().length > 0 // Error message must not be empty
    ));
  }

  /**
   * Extract the field name from full field path for form control lookup
   * Examples:
   * - 'user_update.username' -> 'username'
   * - 'user_update.sudo_commands_nopassword.0' -> 'sudo_commands_nopassword'
   * - 'user.address.street.0' -> 'street'
   * - 'config.nested.deep.field' -> 'field'
   */
  private extractFieldName(fullFieldPath: string): string {
    if (!fullFieldPath || typeof fullFieldPath !== 'string') {
      return '';
    }

    const parts = fullFieldPath.split('.');

    // Handle edge cases
    if (parts.length === 0) {
      return '';
    }

    if (parts.length === 1) {
      return parts[0];
    }

    // Find the last non-numeric part, working backwards
    // This handles nested structures better
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (part && !(/^\d+$/.test(part))) {
        return part;
      }
    }

    // Fallback to last part if all are numeric (edge case)
    return parts[parts.length - 1] || '';
  }

  /**
   * Handle error fallback - collect unhandled errors for modal display
   */
  private handleErrorFallback(field: string, message: string): void {
    this.unhandledErrors.push({ field, message });
  }

  /**
   * Clear validation errors for fields that are no longer visible or relevant
   * This should be called when form conditions change (e.g., fields become hidden)
   */
  clearValidationErrorsForHiddenFields(
    formGroups: UntypedFormGroup | UntypedFormGroup[],
    hiddenFieldNames: string[],
  ): void {
    if (!hiddenFieldNames || hiddenFieldNames.length === 0) {
      return;
    }

    const groups = Array.isArray(formGroups) ? formGroups : [formGroups];

    hiddenFieldNames.forEach((fieldName) => {
      groups.forEach((group) => {
        const control = this.findControlByPath(group, fieldName);
        if (control) {
          // Clear validation errors
          control.setErrors(null);

          // Remove from unhandled errors list if present
          this.unhandledErrors = this.unhandledErrors.filter(
            (error) => error.field !== fieldName,
          );
        }
      });
    });
  }


  /**
   * Find control by field path (supports nested paths like 'user.settings.shell')
   */
  private findControlByPath(formGroup: UntypedFormGroup, fieldPath: string): AbstractControl | null {
    if (!fieldPath) {
      return null;
    }

    const parts = fieldPath.split('.');
    let currentControl: AbstractControl = formGroup;

    for (const part of parts) {
      if (currentControl && 'controls' in currentControl) {
        const controls = (currentControl as UntypedFormGroup).controls;
        currentControl = controls[part];
      } else {
        return null;
      }
    }

    return currentControl || null;
  }

  /**
   * Check if there are unhandled errors and show modal fallback if needed
   */
  private checkForFallbackErrors(_: unknown): void {
    if (this.unhandledErrors.length > 0) {
      const unhandledErrorsString = this.unhandledErrors
        .map((error) => `${error.field}: ${error.message}`)
        .join('\n');

      const customError = new Error(`Validation errors:\n${unhandledErrorsString}`);
      this.errorHandler.showErrorModal(customError);
    }
  }
}
