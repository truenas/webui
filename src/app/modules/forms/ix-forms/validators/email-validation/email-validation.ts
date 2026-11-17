import { ValidatorFn, FormControl } from '@angular/forms';

// Local part is an RFC 5322 dot-atom, so characters like `=`, `'` and `&` are accepted, matching the backend.
const atom = '[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+';
const emailRegex = new RegExp(`^${atom}(\\.${atom})*@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$`);

export function emailValidator(): ValidatorFn {
  return (control: FormControl<string>) => {
    if (!control.value) {
      return null;
    }

    return emailRegex.test(control.value) ? null : { email: true };
  };
}
