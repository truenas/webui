import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { isValidCron } from 'cron-validator';

export function cronValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || control.value === '' || control.value === undefined) {
      return null;
    }

    return !isValidCron(control.value) ? { cron: true } : null;
  };
}
