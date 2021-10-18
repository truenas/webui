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

  private handleValidationError(error: WebsocketError, formGroup: FormGroup): void {
    error.extra.forEach((extraItem) => {
      const field = extraItem[0].split('.')[1];
      const error = extraItem[1];

      const control = formGroup.get(field);
      if (!control) {
        console.error(`Could not find control ${field}`);
        return;
      }

      control.setErrors({
        manualValidateError: true,
        manualValidateErrorMsg: error,
      });
      control.markAsTouched();
    });
  }
}
