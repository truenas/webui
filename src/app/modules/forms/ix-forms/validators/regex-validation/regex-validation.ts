import { ValidatorFn, FormControl } from '@angular/forms';

export function regexValidator(): ValidatorFn {
  return (control: FormControl<string>) => {
    if (!control.value) {
      return null;
    }

    try {
      new RegExp(control.value);
      return null;
    } catch {
      return { invalidRegex: true };
    }
  };
}
