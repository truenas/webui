import { FormControl } from '@angular/forms'

export function atLeastOne(otherControlName: string, fieldPlacehoders: [string, string]) {

    let thisControl: FormControl;
    let otherControl: FormControl;
  
    return function atLeastOneHasValue(control: FormControl) {
  
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

      if (!otherControl.value && !thisControl.value) {
        return {atLeastOne: true, fields: fieldPlacehoders};
      }
  
      return null;
  
    }
}