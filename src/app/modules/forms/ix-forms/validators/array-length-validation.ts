import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Error structure returned by array length validators.
 */
export interface ArrayLengthValidationError {
  requiredLength: number;
  actualLength: number;
}

/**
 * Fails a FormArray with fewer than `minLength` items, returning `{ minArrayLength: { requiredLength,
 * actualLength } }`. Built for the Apps form schema but usable anywhere.
 */
export function minArrayLengthValidator(minLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Skip validation for null, undefined, or non-array values.
    // This follows Angular's validator pattern (e.g., Validators.min returns null for non-numeric values)
    // and allows safe composition with other validators. The validator assumes it's applied to
    // FormArray controls - applying it to other control types will silently pass validation.
    // Use in combination with type guards or schema validation if type safety is critical.
    if (control.value === null || control.value === undefined || !Array.isArray(control.value)) {
      return null;
    }

    const arrayLength = control.value.length;
    // Empty arrays (length 0) will fail if minLength > 0
    if (arrayLength < minLength) {
      return {
        minArrayLength: {
          requiredLength: minLength,
          actualLength: arrayLength,
        },
      };
    }

    return null;
  };
}

/**
 * Fails a FormArray with more than `maxLength` items. Built for the Apps form schema but usable anywhere.
 */
export function maxArrayLengthValidator(maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Skip validation for null, undefined, or non-array values.
    // This follows Angular's validator pattern (e.g., Validators.max returns null for non-numeric values)
    // and allows safe composition with other validators. The validator assumes it's applied to
    // FormArray controls - applying it to other control types will silently pass validation.
    // Use in combination with type guards or schema validation if type safety is critical.
    if (control.value === null || control.value === undefined || !Array.isArray(control.value)) {
      return null;
    }

    const arrayLength = control.value.length;
    // Empty arrays (length 0) are always valid since 0 <= maxLength
    if (arrayLength > maxLength) {
      return {
        maxArrayLength: {
          requiredLength: maxLength,
          actualLength: arrayLength,
        },
      };
    }

    return null;
  };
}
