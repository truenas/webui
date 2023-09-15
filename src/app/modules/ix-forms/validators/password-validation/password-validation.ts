import { FormGroup, UntypedFormControl, ValidatorFn } from '@angular/forms';

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
    return null;
  };
}

export function doesNotEqualValidator(otherControlName: string): ValidatorFn {
  return (control: UntypedFormControl) => {
    if (!control.parent) {
      return null;
    }

    const otherControl = control.parent.get(otherControlName);

    if (!otherControl) {
      throw new Error('doesNotEqual(): other control is not found in parent group');
    }

    if (otherControl.value && control.value && otherControl.value === control.value) {
      return { matchesOther: true };
    }

    return null;
  };
}
