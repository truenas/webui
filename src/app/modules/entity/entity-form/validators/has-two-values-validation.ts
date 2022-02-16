import { ValidatorFn, FormControl } from '@angular/forms';

export function hasTwoValuesValidator(otherControlName: string): ValidatorFn {
  return (control: FormControl) => {
    if (!control.parent) {
      return null;
    }

    const otherControl = control.parent.get(otherControlName);

    if (!otherControl) {
      throw new Error('hasTwoValues(): other control is not found in parent group');
    }

    if (!!otherControl.value && !!control.value) {
      return { hasTwoValues: true };
    }

    return null;
  };
}
