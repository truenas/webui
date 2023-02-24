import { Injectable } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ResponseErrorType } from 'app/enums/response-error-type.enum';
import { ErrorReport, MultiFieldsErrorReport } from 'app/interfaces/error-report.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService } from 'app/services';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  constructor(
    private dialog: DialogService,
    private translate: TranslateService,
  ) {}

  /**
   * @param error
   * @param formGroup
   * @param fieldsMap Overrides backend field names with frontend field names.
   * TODO: See if second `string` in fieldsMap can be typed to key of formGroup.
   */
  handleWsFormError(
    error: WebsocketError | Job,
    formGroup: UntypedFormGroup,
    fieldsMap: Record<string, string> = {},
  ): void {
    if ('type' in error && error.type === ResponseErrorType.Validation && error.extra) {
      this.handleValidationError(error, formGroup, fieldsMap);
      return;
    }

    if ('exc_info' in error && error.exc_info.type === ResponseErrorType.Validation && error.exc_info.extra) {
      this.handleValidationError({ ...error, extra: error.exc_info.extra as Job['extra'] }, formGroup, fieldsMap);
      return;
    }

    // Fallback to old error handling
    (new EntityUtils()).errorReport(error, this.dialog);
  }

  private handleValidationError(
    error: WebsocketError | Job,
    formGroup: UntypedFormGroup,
    fieldsMap: Record<string, string>,
  ): void {
    for (const extraItem of (error as WebsocketError).extra) {
      const field = extraItem[0].split('.')[1];
      const errorMessage = extraItem[1];

      const control = this.getFormField(formGroup, field, fieldsMap);
      if (!control) {
        console.error(`Could not find control ${field}.`);
        // Fallback to default modal error message.
        (new EntityUtils()).errorReport(error, this.dialog);
        return;
      }

      control.setErrors({
        manualValidateError: true,
        manualValidateErrorMsg: errorMessage,
        ixManualValidateError: { message: errorMessage },
      });
      control.markAsTouched();
    }
  }

  parseWsError(error: WebsocketError): string | ErrorReport | MultiFieldsErrorReport {
    return this.parseErrorOrJob(error);
  }

  parseJobError(failedJob: Job): string | ErrorReport | MultiFieldsErrorReport {
    if (failedJob.exc_info?.extra) {
      failedJob.extra = failedJob.exc_info.extra as Record<string, unknown>;
    }

    if (failedJob.extra && Array.isArray(failedJob.extra)) {
      const multiFieldsErrors: { [field: string]: string | ErrorReport } = {};
      failedJob.extra.forEach((extraItem: [string, unknown]) => {
        const field = extraItem[0].split('.')[1];
        const error = extraItem[1] as string | WebsocketError | Job;
        multiFieldsErrors[field] = this.parseErrorOrJob(error);
      });
      return multiFieldsErrors;
    }

    return {
      title: failedJob.state,
      message: failedJob.error,
      backtrace: failedJob.exception,
    };
  }

  parseErrorOrJob(errorOrJob: WebsocketError | Job | string): ErrorReport | string {
    if (typeof errorOrJob === 'object') {
      if ('trace' in errorOrJob && errorOrJob.trace?.formatted) {
        return {
          title: errorOrJob.trace.class,
          message: errorOrJob.reason,
          backtrace: errorOrJob.trace.formatted,
        };
      }

      if ('state' in errorOrJob && errorOrJob.error && errorOrJob.exception) {
        return {
          title: errorOrJob.state,
          message: errorOrJob.error,
          backtrace: errorOrJob.exception,
        };
      }
    }
    return errorOrJob as string;
  }

  private getFormField(formGroup: UntypedFormGroup, field: string, fieldsMap: Record<string, string>): AbstractControl {
    const fieldName = fieldsMap[field] ?? field;
    return formGroup.get(fieldName);
  }
}
