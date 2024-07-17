import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { ResponseErrorType } from 'app/enums/response-error-type.enum';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@Injectable({ providedIn: 'root' })
export class FormErrorHandlerService {
  private isOnErrorFocused = false;
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
  handleWsFormError(
    error: unknown,
    formGroup: UntypedFormGroup,
    fieldsMap: Record<string, string> = {},
    triggerAnchor: string = undefined,
  ): void {
    if (this.errorHandler.isWebSocketError(error) && error.type === ResponseErrorType.Validation && error.extra) {
      this.handleValidationError(error, formGroup, fieldsMap, triggerAnchor);
      return;
    }

    if (
      this.errorHandler.isJobError(error)
      && error.exc_info.type === ResponseErrorType.Validation
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
    error: WebSocketError | Job,
    formGroup: UntypedFormGroup,
    fieldsMap: Record<string, string>,
    triggerAnchor: string,
  ): void {
    this.isOnErrorFocused = false;
    this.needToShowError = false;
    const extra = (error as WebSocketError).extra as string[][];
    for (const extraItem of extra) {
      const field = extraItem[0].split('.').pop();
      const errorMessage = extraItem[1];

      const control = this.getFormField(formGroup, field, fieldsMap);
      const controlsNames = this.formService.getControlsNames();

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
    error: WebSocketError | Job;
  }): void {
    const controlsNames = this.formService.getControlsNames();

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
      if (element && !this.isOnErrorFocused) {
        element.scrollIntoView({ behavior: 'smooth' });
        element.focus();
        this.isOnErrorFocused = true;
      }
    }
  }

  private getFormField(formGroup: UntypedFormGroup, field: string, fieldsMap: Record<string, string>): AbstractControl {
    const fieldName = fieldsMap[field] ?? field;
    return formGroup.get(fieldName);
  }
}
