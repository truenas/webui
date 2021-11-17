import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ResponseErrorType } from 'app/enums/response-error-type.enum';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService } from 'app/services';

@Injectable({ providedIn: 'root' })
export class FormErrorHandlerService {
  constructor(
    private dialog: DialogService,
  ) {}

  handleWsFormError(error: WebsocketError, formGroup: FormGroup): void {
    if (error.type === ResponseErrorType.Validation && error.extra) {
      this.handleValidationError(error, formGroup);
      return;
    }

    // Fallback to old error handling
    (new EntityUtils()).errorReport(error, this.dialog);
  }

  // TODO: Add support for api fields having different names than formgroup fields, i.e. private_key => privateKey
  // TODO: Same for nested API objects.
  private handleValidationError(error: WebsocketError, formGroup: FormGroup): void {
    for (const extraItem of error.extra) {
      const field = extraItem[0].split('.')[1];
      const errorMessage = extraItem[1];

      const control = formGroup.get(field);
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
}
