import { Injectable } from '@angular/core';
import {
  AbstractControl, ValidationErrors, ValidatorFn, Validators,
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class IxValidatorsService {
  constructor(protected translate: TranslateService) {}

  makeErrorMessage(key: string, message: string): ValidationErrors {
    return {
      [key]: {
        message,
      },
    };
  }

  withMessage(validatorFn: ValidatorFn, errorMessage: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const errors = validatorFn(control);
      if (!errors || Object.keys(errors).length === 0) {
        return null;
      }

      const errorKey = Object.keys(errors)[0];
      return this.makeErrorMessage(errorKey, errorMessage);
    };
  }

  readonly validateOnCondition = (
    condition: (control: AbstractControl) => boolean,
    validator: ValidatorFn,
  ): ValidatorFn => {
    return (control: AbstractControl): ValidationErrors | null => {
      if (condition(control)) {
        return validator(control);
      }
      return null;
    };
  };

  // TODO: Move elsewhere
  confirmValidator(name: string, validationMessage: string): ValidatorFn {
    return Validators.compose([
      this.withMessage(
        Validators.pattern(new RegExp(`^${name}$`)),
        validationMessage,
      ),
      this.withMessage(
        Validators.required,
        validationMessage,
      ),
    ]);
  }

  /**
   * Specify simple validator function returning false for invalid value and an error message.
   */
  customValidator(validatorFn: (control: AbstractControl) => boolean, message: string): ValidatorFn {
    return this.withMessage(
      (control) => {
        const isValid = validatorFn(control);

        if (isValid) {
          return null;
        }

        return { customValidator: true };
      },
      message,
    );
  }
}
