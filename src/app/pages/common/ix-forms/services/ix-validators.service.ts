import { Injectable } from '@angular/core';
import {
  AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn, Validators,
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import isCidr from 'is-cidr';

@Injectable()
export default class IxValidatorsService {
  constructor(protected translate: TranslateService) {}

  /**
   * This method applies the Validators.min validator to the input
   * but applies errMessage as the custom error message.
   * @param min The minium value allowed
   * @param errMessage The error message if this validator fails
   * @returns A validator function that applies Validators.min and if failed,
   * applies errMessage as the custom error message.
   */
  min(min: number, errMessage?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const errors = Validators.min(min)(control);
      if (errors?.min) {
        errors.min.message = errMessage;
      }
      return errors;
    };
  }

  /**
   * This method applies the Validators.max validator to the input
   * but applies errMessage as the custom error message.
   * @param max The maximum value allowed
   * @param errMessage The error message if this validator fails
   * @returns A validator function that applies Validators.max and if failed,
   * applies errMessage as the custom error message.
   */
  max(max: number, errMessage?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const errors = Validators.max(max)(control);
      if (errors?.max) {
        errors.max.message = errMessage;
      }
      return errors;
    };
  }

  /**
   * This method applies the Validators.required validator to the control
   * but applies errMessage as the custom error message
   * @param errMessage The error message if this validator fails
   * @returns A validator function that applies Validators.required on the control
   * and if failed, applies errMessage as the custom error message.
   */
  required(errMessage?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const errors = Validators.required(control);
      if (errors?.required) {
        errors.required = errMessage;
      }
      return errors;
    };
  }

  /**
   * This method applies the Validators.requiredTrue validator to the control
   * but applies errMessage as the custom error message
   * @param errMessage The error message if this validator fails
   * @returns A validator function that applies Validators.requiredTrue on the control
   * and if failed, applies errMessage as the custom error message.
   */
  requiredTrue(errMessage?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const errors = Validators.requiredTrue(control);
      if (errors?.required) {
        errors.required = errMessage;
      }
      return errors;
    };
  }

  /**
   * This method applies the Validators.email validator to the control
   * but applies errMessage as the custom error message
   * @param errMessage The error message if this validator fails
   * @returns A validator function that applies Validators.email on the control
   * and if failed, applies errMessage as the custom error message.
   */
  email(errMessage?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const errors = Validators.email(control);
      if (errors?.email) {
        errors.email = errMessage;
      }
      return errors;
    };
  }

  /**
   * This method applies the Validators.minLength validator to the input
   * but applies errMessage as the custom error message.
   * @param minLength The minium length allowed
   * @param errMessage The error message if this validator fails
   * @returns A validator function that applies Validators.minLength and if failed,
   * applies errMessage as the custom error message.
   */
  minLength(minLength: number, errMessage?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const errors = Validators.minLength(minLength)(control);
      if (errors?.minlength) {
        errors.minlength.message = errMessage;
      }
      return errors;
    };
  }

  /**
   * This method applies the Validators.maxLength validator to the input
   * but applies errMessage as the custom error message.
   * @param maxLength The maximum length allowed
   * @param errMessage The error message if this validator fails
   * @returns A validator function that applies Validators.maxLength and if failed,
   * applies errMessage as the custom error message.
   */
  maxLength(maxLength: number, errMessage?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const errors = Validators.maxLength(maxLength)(control);
      if (errors?.maxlength) {
        errors.maxlength.message = errMessage;
      }
      return errors;
    };
  }

  /**
   * This method applies the Validators.pattern validator to the input
   * but applies errMessage as the custom error message.
   * @param pattern The pattern to check the control value against
   * @param errMessage The error message if this validator fails
   * @returns A validator function that applies Validators.pattern and if failed,
   * applies errMessage as the custom error message.
   */
  pattern(pattern: string | RegExp, errMessage?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const errors = Validators.pattern(pattern)(control);
      if (errors?.pattern) {
        errors.pattern.message = errMessage;
      }
      return errors;
    };
  }

  /**
   * For inclusion or Validators.nullValidator
   * @returns Validators.nullValidator
   */
  nullValidator(): ValidatorFn {
    return Validators.nullValidator;
  }

  /**
   * For inclusion or Validators.compose
   * @returns the result of Validators.compose called on the passed validator functions array
   */
  compose(validators: ValidatorFn[]): ValidatorFn | null {
    return Validators.compose(validators);
  }

  /**
   * For inclusion or Validators.composeAsync
   * @returns the result of Validators.composeAsync called on the passed validator functions array
   */
  composeAsync(validators: AsyncValidatorFn[]): AsyncValidatorFn | null {
    return Validators.composeAsync(validators);
  }

  /**
   * This function returns a validator
   * @param errMessage The error message applied if the validator fails
   * @returns a validator function that checks if the control value
   * is valid Cidr notation ip v4 or v6
   */
  ipCidrV4orCidrV6(errMessage?: string): ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.parent) {
        return null;
      }

      if (control.value == '' || control.value == undefined) {
        return null;
      }

      if (!isCidr.v4(control.value) && !isCidr.v6(control.value)) {
        return {
          ip: {
            message: errMessage || this.translate.instant('IP not in valid v4 or v6 CIDR notation'),
          },
        };
      }

      return null;
    };
  }
}
