import { FormControl } from '@angular/forms';

export function greaterThan(otherControlName: string, fieldPlaceholers: [string]) {
  return function greaterThanValidate(control: FormControl) {
    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    const thisControl = control;
    const otherControl = control.parent.get(otherControlName) as FormControl;
    if (!otherControl) {
      throw new Error(
        'greaterThanValidator(): other control is not found in parent group',
      );
    }
    otherControl.valueChanges.subscribe(
      () => { thisControl.updateValueAndValidity(); },
    );

    if (!otherControl) {
      return null;
    }

    const otherVal = Number(otherControl.value);
    const thisVal = Number(thisControl.value);
    if (otherVal >= thisVal) {
      return { greaterThan: true, fields: fieldPlaceholers };
    }

    return null;
  };
}
