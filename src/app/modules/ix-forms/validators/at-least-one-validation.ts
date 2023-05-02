import { UntypedFormControl, ValidatorFn } from '@angular/forms';

export function atLeastOne(otherControlName: string, fieldPlacehoders: [string, string]): ValidatorFn {
  let thisControl: UntypedFormControl;
  let otherControl: UntypedFormControl;

  return function atLeastOneHasValue(control: UntypedFormControl) {
    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    if (!thisControl) {
      thisControl = control;
      otherControl = control.parent.get(otherControlName) as UntypedFormControl;
      if (!otherControl) {
        throw new Error(
          'matchOtherValidator(): other control is not found in parent group',
        );
      }
      otherControl.valueChanges.subscribe(
        () => { thisControl.updateValueAndValidity(); },
      );
    }

    if (!otherControl) {
      return null;
    }

    if (!otherControl.value && !thisControl.value) {
      return { atLeastOne: true, fields: fieldPlacehoders };
    }

    return null;
  };
}
