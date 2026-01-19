import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that a FormArray has at least the specified number of items.
 *
 * This validator is specifically designed for FormArray controls in the Apps form schema.
 * It can be used anywhere array length validation is needed.
 *
 * @param minLength The minimum number of items required in the array
 * @returns A validator function that returns an error if the array has fewer than minLength items
 *
 * @example
 * ```typescript
 * const control = new FormArray([], minArrayLengthValidator(1));
 * // Empty array will fail validation: { minArrayLength: { requiredLength: 1, actualLength: 0 } }
 * ```
 */
export function minArrayLengthValidator(minLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Skip validation for null, undefined, or non-array values
    // This allows the validator to be used safely on controls that may not be arrays yet
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
 * Validates that a FormArray has no more than the specified number of items.
 *
 * This validator is specifically designed for FormArray controls in the Apps form schema.
 * It can be used anywhere array length validation is needed.
 *
 * @param maxLength The maximum number of items allowed in the array
 * @returns A validator function that returns an error if the array has more than maxLength items
 *
 * @example
 * ```typescript
 * const control = new FormArray([], maxArrayLengthValidator(5));
 * // Arrays with 0-5 items are valid, 6+ items will fail validation
 * ```
 */
export function maxArrayLengthValidator(maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Skip validation for null, undefined, or non-array values
    // This allows the validator to be used safely on controls that may not be arrays yet
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
