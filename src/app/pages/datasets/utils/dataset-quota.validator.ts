import {
  AbstractControl, ValidationErrors, ValidatorFn, Validators,
} from '@angular/forms';
import { GiB } from 'app/constants/bytes.constant';

/**
 * A dataset quota is 0 (no quota) or at least 1 GiB, as `pool.dataset.create` and `update` require.
 * An empty field passes, as with `Validators.min`.
 */
export function datasetQuotaValidator(errorMessage: string): ValidatorFn {
  const minValidator = Validators.min(GiB);
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === 0 || !minValidator(control)) {
      return null;
    }
    return { min: { message: errorMessage } };
  };
}
