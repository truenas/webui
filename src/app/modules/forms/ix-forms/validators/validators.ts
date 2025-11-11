import {
  AbstractControl, FormGroup, UntypedFormControl, ValidationErrors, ValidatorFn,
} from '@angular/forms';
import { isEmpty, isNumber, toNumber } from 'lodash-es';

export function greaterThanFg(
  controlName: string,
  comparateControlNames: string[],
  errMsg?: string,
): ValidatorFn {
  return (fg: FormGroup) => {
    if (!fg?.get(controlName)) {
      return null;
    }

    const errFields: string[] = [];
    const subjectControl = fg.get(controlName) as UntypedFormControl;
    for (const name of comparateControlNames) {
      const otherControl = fg.get(name) as UntypedFormControl;
      if (!otherControl) {
        throw new Error(
          'greaterThanValidator(): other control is not found in the group',
        );
      }
      const otherValueExists = otherControl.value !== null && otherControl.value !== undefined && otherControl.value !== '';
      const subjectValueExists = subjectControl.value !== null && subjectControl.value !== undefined && subjectControl.value !== '';
      if (otherValueExists && subjectValueExists) {
        if (!isNumber(otherControl.value) || !isNumber(subjectControl.value)) {
          throw new Error('greaterThanValidator(): Comparates are not all numeric');
        }
        if (toNumber(otherControl.value) >= toNumber(subjectControl.value)) {
          errFields.push(name);
        }
      }
    }
    if (errFields.length) {
      fg.get(controlName)?.setErrors({
        greaterThan: errMsg ? { message: errMsg } : true,
      });
      return {
        [controlName]: { greaterThan: errMsg ? { message: errMsg } : true },
      };
    }
    let prevErrors: ValidationErrors | null = { ...fg.get(controlName)?.errors };
    delete prevErrors.greaterThan;
    if (isEmpty(prevErrors)) {
      prevErrors = null;
    }
    fg.get(controlName)?.setErrors(prevErrors);
    return null;
  };
}

/**
 * Validates that the selected path is not /mnt itself or a pool root.
 * Pool roots are paths like /mnt/poolname with no subdirectories.
 * The backend requires a child dataset to be selected.
 *
 * @param errorMessage Optional custom error message. If not provided, a default message is used.
 * @returns ValidatorFn that returns null if valid, or ValidationErrors if invalid
 *
 * @example
 * // Usage in a form control
 * this.form = this.fb.group({
 *   path: ['', [validateNotPoolRoot('Cannot select pool root')]],
 * });
 */
export function validateNotPoolRoot(errorMessage?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const path = control.value?.trim() as string;
    if (!path) {
      return null; // Let required validator handle empty values
    }

    // Normalize path by removing trailing slashes for consistent validation
    const normalizedPath = path.replace(/\/+$/, '');

    // Reject /mnt itself or pool root pattern: /mnt/poolname (no subdirectories)
    const poolRootPattern = /^\/mnt\/[^/]+$/;
    if (normalizedPath === '/mnt' || poolRootPattern.test(normalizedPath)) {
      return {
        poolRoot: {
          message: errorMessage || 'Cannot select /mnt or pool root. Please select a dataset under the pool (e.g., /mnt/pool/dataset).',
        },
      };
    }

    return null;
  };
}
