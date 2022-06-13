import { UntypedFormControl, ValidatorFn } from '@angular/forms';

export function matchOtherValidator(otherControlName: string): ValidatorFn {
  let thisControl: UntypedFormControl;
  let otherControl: UntypedFormControl;

  return function matchOtherValidate(control: UntypedFormControl) {
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

    if (otherControl.value !== thisControl.value) {
      return { matchOther: true };
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
