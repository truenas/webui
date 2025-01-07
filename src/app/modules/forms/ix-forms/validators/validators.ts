import {
  FormGroup, UntypedFormControl, ValidationErrors, ValidatorFn,
} from '@angular/forms';
import { isEmpty, isNumber, toNumber } from 'lodash-es';

export function greaterThanFg(
  controlName: string,
  comparateControlNames: string[],
  errMsg?: string,
): ValidatorFn {
  return (fg: FormGroup) => {
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
        if (!isNumber(otherControl.value) || !isNumber(subjectControl.value)) {
          throw new Error('greaterThanValidator(): Comparates are not all numeric');
        }
        if (toNumber(otherControl.value) >= toNumber(subjectControl.value)) {
          errFields.push(name);
        }
      }
    }
    if (errFields.length) {
      fg.get(controlName)?.setErrors({
        greaterThan: errMsg ? { message: errMsg } : true,
      });
      return {
        [controlName]: { greaterThan: errMsg ? { message: errMsg } : true },
      };
    }
    let prevErrors: ValidationErrors | null = { ...fg.get(controlName)?.errors };
    delete prevErrors.greaterThan;
    if (isEmpty(prevErrors)) {
      prevErrors = null;
    }
    fg.get(controlName)?.setErrors(prevErrors);
    return null;
  };
}
