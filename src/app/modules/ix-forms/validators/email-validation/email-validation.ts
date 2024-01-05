import { ValidatorFn, FormControl } from '@angular/forms';

export function emailValidator(): ValidatorFn {
  return (control: FormControl<string>) => {
    const regex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

    if (!control.value) {
      return null;
    }

    return regex.test(control.value) ? null : { email: true };
  };
}
