import { AbstractControl, FormGroup, UntypedFormControl, ValidatorFn } from '@angular/forms';
import _ from 'lodash';

export function greaterThanFg(
  controlName: string,
  comparateControlNames: string[],
  errMsg?: string,
): ValidatorFn {
  return (fg: FormGroup<unknown>) => {
    if (!fg?.get(controlName)) {
      return null;
    }

    const errFields: string[] = [];
    const subjectControl = fg.get(controlName) as UntypedFormControl;
    for (const name of comparateControlNames) {
      const otherControl = fg.get(name) as UntypedFormControl;
      if (!otherControl) {
        throw new Error(
          'greaterThanValidator(): other control is not found in the group',
        );
      }
      const otherValueExists = otherControl.value !== null && otherControl.value !== undefined && otherControl.value !== '';
      const subjectValueExists = subjectControl.value !== null && subjectControl.value !== undefined && subjectControl.value !== '';
      if (otherValueExists && subjectValueExists) {
        if (!_.isNumber(otherControl.value) || !_.isNumber(subjectControl.value)) {
          throw new Error('greaterThanValidator(): Comparates are not all numeric');
        }
        if (_.toNumber(otherControl.value) >= _.toNumber(subjectControl.value)) {
          errFields.push(name);
        }
      }
    }
    if (errFields.length) {
      fg.get(controlName).setErrors({
        greaterThan: errMsg ? { message: errMsg } : true,
      });
      return {
        [controlName]: { greaterThan: errMsg ? { message: errMsg } : true },
      };
    }
    let prevErrors = { ...fg.get(controlName).errors };
    delete prevErrors.greaterThan;
    if (_.isEmpty(prevErrors)) {
      prevErrors = null;
    }
    fg.get(controlName).setErrors(prevErrors);
    return null;
  };
}

export function rangeValidator(min: number, max?: number): ValidatorFn {
  let thisControl: AbstractControl;

  return function rangeValidate(control: AbstractControl) {
    let regex;
    if (min === 0) {
      regex = /^(0|[1-9]\d*)$/;
    } else {
      regex = /^[1-9]\d*$/;
    }

    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    if (!thisControl) {
      thisControl = control;
    }

    if (!thisControl.value) {
      return null;
    }

    if (regex.test(thisControl.value)) {
      const num = Number(thisControl.value);
      if (num >= min) {
        if (max) {
          if (num <= max) {
            return null;
          }
        } else {
          return null;
        }
      }
    }

    return { range: true, rangeValue: { min, max } };
  };
}
