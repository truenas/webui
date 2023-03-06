import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { parseString } from 'cron-parser';

export function cronValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    if (!control.value || control.value === '' || control.value === undefined) {
      return null;
    }

    return Object.keys(parseString(control.value).errors).length ? { cron: true } : null;
  };
}
