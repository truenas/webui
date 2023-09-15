import { FormGroup, UntypedFormControl, ValidatorFn } from '@angular/forms';
import _ from 'lodash';

export function matchOthersFgValidator(
  controlName: string, comparateControlNames: string[], errMsg?: string,
): ValidatorFn {
  return function matchOthersFgValidate(fg: FormGroup<unknown>) {
    if (!fg?.get(controlName)) {
      return null;
    }

    const errFields: string[] = [];
    const subjectControl = fg.get(controlName) as UntypedFormControl;
    for (const name of comparateControlNames) {
      const otherControl = fg.get(name) as UntypedFormControl;
      if (!otherControl) {
        throw new Error(
          'matchOtherValidator(): other control is not found in the group',
        );
      }
      if (otherControl.value !== subjectControl.value) {
        errFields.push(name);
      }
    }
    if (errFields.length) {
      fg.get(controlName).setErrors({
        matchOther: errMsg ? { message: errMsg } : true,
      });
      return {
        [controlName]: { matchOther: errMsg ? { message: errMsg } : true },
      };
    }
    let prevErrors = { ...fg.get(controlName).errors };
    delete prevErrors.matchOther;
    if (_.isEmpty(prevErrors)) {
      prevErrors = null;
    }
    fg.get(controlName).setErrors(prevErrors);
    return null;
  };
}

export function doesNotEqualFgValidator(
  controlName: string, comparateControlNames: string[], errMsg?: string,
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
          'doesNotEqual(): other control is not found in the group',
        );
      }
      if (subjectControl.value && otherControl.value && otherControl.value === subjectControl.value) {
        errFields.push(name);
      }
    }
    if (errFields.length) {
      fg.get(controlName).setErrors({
        matchesOther: errMsg ? { message: errMsg } : true,
      });
      return {
        [controlName]: { matchesOther: errMsg ? { message: errMsg } : true },
      };
    }
    let prevErrors = { ...fg.get(controlName).errors };
    delete prevErrors.matchesOther;
    if (_.isEmpty(prevErrors)) {
      prevErrors = null;
    }
    fg.get(controlName).setErrors(prevErrors);
    return null;
  };
}
