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
    if (subjectControl.disabled) {
      return null;
    }
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
      // Merged, not replaced: the control's own errors (e.g. `minlength`) are only recomputed when its
      // value changes, so replacing them here lets a matching confirmation clear them for good.
      subjectControl.setErrors({
        ...subjectControl.errors,
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
    if (subjectControl.disabled) {
      return null;
    }
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
      // Merged, not replaced, for the same reason as in `matchOthersFgValidator`.
      subjectControl.setErrors({
        ...subjectControl.errors,
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
