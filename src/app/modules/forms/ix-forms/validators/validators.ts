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
 * Rejects `/mnt` and pool roots like `/mnt/pool`: middleware requires a child dataset for operations
 * like ISO uploads and disk exports, since writing to a pool root is unsafe. Pass an already
 * translated `errorMessage`.
 */
export function validateNotPoolRoot(errorMessage: string): ValidatorFn {
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
          message: errorMessage,
        },
      };
    }

    return null;
  };
}

/**
 * Requires an exact string length, with a clearer message than `minLength` plus `maxLength`, e.g.
 * `exactLength(64, translatedMessage)` for an encryption key.
 */
export function exactLength(length: number, errorMessage?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) {
      return null; // Let required validator handle empty values
    }

    if (value.length !== length) {
      return {
        exactLength: {
          requiredLength: length,
          actualLength: value.length,
          message: errorMessage,
        },
      };
    }

    return null;
  };
}
