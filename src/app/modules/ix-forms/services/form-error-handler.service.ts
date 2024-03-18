import { Injectable } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { ResponseErrorType } from 'app/enums/response-error-type.enum';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@Injectable({ providedIn: 'root' })
export class FormErrorHandlerService {
  constructor(
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  /**
   * @param error
   * @param formGroup
   * @param fieldsMap Overrides backend field names with frontend field names.
   * TODO: See if second `string` in fieldsMap can be typed to key of formGroup.
   */
  handleWsFormError(
    error: unknown,
    formGroup: UntypedFormGroup,
    fieldsMap: Record<string, string> = {},
  ): void {
    if (this.errorHandler.isWebsocketError(error) && error.type === ResponseErrorType.Validation && error.extra) {
      this.handleValidationError(error, formGroup, fieldsMap);
      return;
    }

    if (
      this.errorHandler.isJobError(error)
      && error.exc_info.type === ResponseErrorType.Validation
      && error.exc_info.extra
    ) {
      this.handleValidationError({ ...error, extra: error.exc_info.extra as Job['extra'] }, formGroup, fieldsMap);
      return;
    }

    // Fallback to old error handling
    this.dialog.error(this.errorHandler.parseError(error));
  }

  private handleValidationError(
    error: WebsocketError | Job,
    formGroup: UntypedFormGroup,
    fieldsMap: Record<string, string>,
  ): void {
    const extra = (error as WebsocketError).extra as string[][];
    for (const extraItem of extra) {
      const field = extraItem[0].split('.').pop();
      const errorMessage = extraItem[1];

      let control = this.getFormField(formGroup, field, fieldsMap);

      if (!control) {
        console.error(`Could not find control ${field}.`);
        // Fallback to default modal error message.
        this.dialog.error(this.errorHandler.parseError(error));
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
      }
    }
  }

  isErrorFieldFromAdvancedOptions(
    error: unknown,
    fieldsMap: Record<string, string> = {},
    advancedFields: string[] = [],
  ): boolean {
    if (
      this.errorHandler.isWebsocketError(error)
      && error.type === ResponseErrorType.Validation
      && error.extra
    ) {
      const errorFields = this.getFieldsNamesFromError(error, fieldsMap);
      return advancedFields.some((advancedField) => {
        return errorFields.some((field) => {
          return field.toLowerCase().includes(advancedField.toLowerCase());
        });
      });
    }

    if (
      this.errorHandler.isJobError(error)
      && error.exc_info.type === ResponseErrorType.Validation
      && error.exc_info.extra
    ) {
      const errorFields = this.getFieldsNamesFromError({ ...error, extra: error.exc_info.extra as Job['extra'] }, fieldsMap);
      return advancedFields.some((advancedField) => {
        return errorFields.some((field) => {
          return field.toLowerCase().includes(advancedField.toLowerCase());
        });
      });
    }
    return false;
  }

  private getFieldsNamesFromError(
    error: WebsocketError | Job,
    fieldsMap: Record<string, string>,
  ): string[] {
    const extra = (error as WebsocketError).extra as string[][];
    const fieldNames: string[] = [];
    for (const extraItem of extra) {
      const field = extraItem[0].split('.').pop();

      const fieldName = fieldsMap[field] ?? field;
      fieldNames.push(fieldName);
    }
    return fieldNames;
  }

  private getFormField(formGroup: UntypedFormGroup, field: string, fieldsMap: Record<string, string>): AbstractControl {
    const fieldName = fieldsMap[field] ?? field;
    return formGroup.get(fieldName);
  }
}
