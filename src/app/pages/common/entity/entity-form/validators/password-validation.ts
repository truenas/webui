import {FormControl} from '@angular/forms';

export function matchOtherValidator(otherControlName: string) {

  let thisControl: FormControl;
  let otherControl: FormControl;

  return function matchOtherValidate(control: FormControl) {

    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    if (!thisControl) {
      thisControl = control;
      otherControl = control.parent.get(otherControlName) as FormControl;
      if (!otherControl) {
        throw new Error(
            'matchOtherValidator(): other control is not found in parent group');
      }
      otherControl.valueChanges.subscribe(
          () => { thisControl.updateValueAndValidity(); });
    }

    if (!otherControl) {
      return null;
    }

    if (otherControl.value !== thisControl.value) {
      return {matchOther : true};
    }

    return null;

  }
}

export function doesNotEqual(otherControlName: string) {
  return function(control: FormControl) {
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
  }
}