import { Injectable } from '@angular/core';
import {
  AbstractControl, ValidationErrors, ValidatorFn,
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import isCidr from 'is-cidr';
import _ from 'lodash';

@Injectable()
export default class IxValidatorsService {
  constructor(protected translate: TranslateService) {}

  withMessage(validatorFn: ValidatorFn, errMessage?: { message: string; forProperty: string }): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const errors = validatorFn(control);
      if (errMessage && errMessage.message && errMessage.forProperty
        && errors && errors[errMessage.forProperty]
      ) {
        if (_.isPlainObject(errors[errMessage.forProperty])) {
          errors[errMessage.forProperty].message = errMessage.message;
        } else {
          errors[errMessage.forProperty] = { message: errMessage.message };
        }
      }
      return errors;
    };
  }

  /**
   * This function returns a validator
   * @param errMessage The error message applied if the validator fails
   * @returns a validator function that checks if the control value
   * is valid Cidr notation ip v4 or v6
   */
  readonly ipCidrV4orCidrV6: { forProperty: 'ip'; validatorFn: () => ValidatorFn } = {
    forProperty: 'ip',
    validatorFn: (): ValidatorFn => {
      return (control: AbstractControl) => {
        if (!control.parent) {
          return null;
        }

        if (control.value == '' || control.value == undefined) {
          return null;
        }

        if (!isCidr.v4(control.value) && !isCidr.v6(control.value)) {
          return { ip: true };
        }

        return null;
      };
    },
  };
}
