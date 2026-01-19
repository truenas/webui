import { FormControl } from '@angular/forms';
import { maxArrayLengthValidator, minArrayLengthValidator } from './array-length-validation';

describe('Array Length Validators', () => {
  describe('minArrayLengthValidator', () => {
    it('should return null when array length meets minimum', () => {
      const validator = minArrayLengthValidator(2);
      const control = new FormControl(['item1', 'item2']);
      expect(validator(control)).toBeNull();
    });

    it('should return null when array length exceeds minimum', () => {
      const validator = minArrayLengthValidator(2);
      const control = new FormControl(['item1', 'item2', 'item3']);
      expect(validator(control)).toBeNull();
    });

    it('should return error when array length is below minimum', () => {
      const validator = minArrayLengthValidator(2);
      const control = new FormControl(['item1']);
      expect(validator(control)).toEqual({
        minArrayLength: {
          requiredLength: 2,
          actualLength: 1,
        },
      });
    });

    it('should return error when array is empty and minimum is 1', () => {
      const validator = minArrayLengthValidator(1);
      const control = new FormControl([]);
      expect(validator(control)).toEqual({
        minArrayLength: {
          requiredLength: 1,
          actualLength: 0,
        },
      });
    });

    it('should return null when value is null', () => {
      const validator = minArrayLengthValidator(1);
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null when value is not an array', () => {
      const validator = minArrayLengthValidator(1);
      const control = new FormControl('not an array');
      expect(validator(control)).toBeNull();
    });

    it('should return null when minimum is 0 and array is empty', () => {
      const validator = minArrayLengthValidator(0);
      const control = new FormControl([]);
      expect(validator(control)).toBeNull();
    });

    it('should return null when minimum is 0 and array has items', () => {
      const validator = minArrayLengthValidator(0);
      const control = new FormControl(['item1']);
      expect(validator(control)).toBeNull();
    });

    it('should handle negative minimum values gracefully', () => {
      const validator = minArrayLengthValidator(-1);
      const control = new FormControl([]);
      // Negative min doesn't make sense in practice, but validator handles it gracefully
      // Since 0 >= -1, validation passes
      expect(validator(control)).toBeNull();
    });
  });

  describe('maxArrayLengthValidator', () => {
    it('should return null when array length meets maximum', () => {
      const validator = maxArrayLengthValidator(3);
      const control = new FormControl(['item1', 'item2', 'item3']);
      expect(validator(control)).toBeNull();
    });

    it('should return null when array length is below maximum', () => {
      const validator = maxArrayLengthValidator(3);
      const control = new FormControl(['item1', 'item2']);
      expect(validator(control)).toBeNull();
    });

    it('should return error when array length exceeds maximum', () => {
      const validator = maxArrayLengthValidator(2);
      const control = new FormControl(['item1', 'item2', 'item3']);
      expect(validator(control)).toEqual({
        maxArrayLength: {
          requiredLength: 2,
          actualLength: 3,
        },
      });
    });

    it('should return null when value is null', () => {
      const validator = maxArrayLengthValidator(1);
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null when value is not an array', () => {
      const validator = maxArrayLengthValidator(1);
      const control = new FormControl('not an array');
      expect(validator(control)).toBeNull();
    });

    it('should return null when array is empty', () => {
      const validator = maxArrayLengthValidator(1);
      const control = new FormControl([]);
      expect(validator(control)).toBeNull();
    });

    it('should return error when maximum is 0 and array has items', () => {
      const validator = maxArrayLengthValidator(0);
      const control = new FormControl(['item1']);
      expect(validator(control)).toEqual({
        maxArrayLength: {
          requiredLength: 0,
          actualLength: 1,
        },
      });
    });

    it('should return null when maximum is 0 and array is empty', () => {
      const validator = maxArrayLengthValidator(0);
      const control = new FormControl([]);
      expect(validator(control)).toBeNull();
    });

    it('should return error even for empty array with negative maximum', () => {
      const validator = maxArrayLengthValidator(-1);
      const control = new FormControl([]);
      // Negative max doesn't make sense in practice, but validator handles it gracefully
      // Since 0 > -1 is true, even empty arrays fail validation with negative max
      expect(validator(control)).toEqual({
        maxArrayLength: {
          requiredLength: -1,
          actualLength: 0,
        },
      });
    });

    it('should return error for any array with negative maximum', () => {
      const validator = maxArrayLengthValidator(-1);
      const control = new FormControl(['item1']);
      // 1 > -1 is also true, so validation fails
      expect(validator(control)).toEqual({
        maxArrayLength: {
          requiredLength: -1,
          actualLength: 1,
        },
      });
    });
  });
});
