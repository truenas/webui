import {
  FormGroup, UntypedFormControl, ValidationErrors, ValidatorFn,
} from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { isEmpty } from 'lodash-es';

export function matchOthersFgValidator(
  controlName: string,
  comparateControlNames: string[],
  errMsg?: string,
): ValidatorFn {
  return function matchOthersFgValidate(fg: FormGroup<Record<string, FormControl<string>>>) {
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
      subjectControl.setErrors({
        matchOther: errMsg ? { message: errMsg } : true,
      });
      return {
        [controlName]: { matchOther: errMsg ? { message: errMsg } : true },
      };
    }
    let prevErrors: ValidationErrors | null = { ...subjectControl.errors };
    delete prevErrors.matchOther;
    if (isEmpty(prevErrors)) {
      prevErrors = null;
    }
    if (fg.get(controlName)?.touched) {
      subjectControl.setErrors(prevErrors);
    }
    return null;
  };
}

export function doesNotEqualFgValidator(
  controlName: string,
  comparateControlNames: string[],
  errMsg?: string,
): ValidatorFn {
  return (fg: FormGroup<Record<string, FormControl<string>>>) => {
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
      subjectControl.setErrors({
        matchesOther: errMsg ? { message: errMsg } : true,
      });
      return {
        [controlName]: { matchesOther: errMsg ? { message: errMsg } : true },
      };
    }
    let prevErrors: ValidationErrors | null = { ...subjectControl.errors };
    delete prevErrors.matchesOther;
    if (isEmpty(prevErrors)) {
      prevErrors = null;
    }
    if (fg.get(controlName)?.touched) {
      subjectControl.setErrors(prevErrors);
    }
    return null;
  };
}
