import { FormControl, FormGroup } from '@angular/forms';
import { greaterThanFg, validateNotPoolRoot } from 'app/modules/forms/ix-forms/validators/validators';

describe('ValidationService', () => {
  describe('greaterThanFg', () => {
    const value1 = 'value1';
    const value2 = 'value2';
    let formGroup: FormGroup;
    beforeEach(() => {
      formGroup = new FormGroup({
        value1: new FormControl(0),
        value2: new FormControl(0),
      }, {
        validators: [
          greaterThanFg(value1, [value2], 'Greater than error'),
        ],
      });
    });

    it('should have greaterThan error when value1 is smaller', () => {
      formGroup.get(value1)!.setValue(0);
      formGroup.get(value2)!.setValue(1);
      formGroup.updateValueAndValidity();
      expect(formGroup.valid).toBeFalsy();
      expect(formGroup.get(value1)!.errors).toEqual({
        greaterThan: { message: 'Greater than error' },
      });
    });

    it('should have greaterThan error when value1 is equal', () => {
      formGroup.get(value1)!.setValue(0);
      formGroup.get(value2)!.setValue(0);
      formGroup.updateValueAndValidity();

      expect(formGroup.get(value1)!.errors).toEqual({
        greaterThan: { message: 'Greater than error' },
      });
    });

    it('should not have greaterThan error when value1 is greater', () => {
      formGroup.get(value1)!.setValue(1);
      formGroup.get(value2)!.setValue(0);
      formGroup.updateValueAndValidity();
      expect(formGroup.valid).toBeTruthy();
      expect(formGroup.get(value1)!.errors).toBeFalsy();
    });

    it('should throw error if value2 doesnt exist in formGroup', () => {
      expect(() => {
        formGroup = new FormGroup({
          value1: new FormControl(0),
        }, {
          validators: [
            greaterThanFg(value1, [value2], 'Greater than error'),
          ],
        });
        formGroup.get(value1)!.updateValueAndValidity();
      }).toThrow('greaterThanValidator(): other control is not found in the group');
    });
  });

  describe('validateNotPoolRoot', () => {
    const errorMessage = 'Cannot select /mnt or pool root. Please select a dataset.';

    it('should accept empty values', () => {
      const validator = validateNotPoolRoot(errorMessage);
      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
      expect(validator(new FormControl(undefined))).toBeNull();
    });

    it('should accept valid dataset paths', () => {
      const validator = validateNotPoolRoot(errorMessage);
      expect(validator(new FormControl('/mnt/tank/dataset'))).toBeNull();
      expect(validator(new FormControl('/mnt/pool/data/subdataset'))).toBeNull();
      expect(validator(new FormControl('/mnt/mypool/isos/'))).toBeNull();
    });

    it('should reject /mnt itself', () => {
      const validator = validateNotPoolRoot(errorMessage);
      const result = validator(new FormControl('/mnt'));
      expect(result).toEqual({
        poolRoot: {
          message: errorMessage,
        },
      });
    });

    it('should reject /mnt with trailing slash', () => {
      const validator = validateNotPoolRoot(errorMessage);
      const result = validator(new FormControl('/mnt/'));
      expect(result).toEqual({
        poolRoot: {
          message: errorMessage,
        },
      });
    });

    it('should reject pool root paths', () => {
      const validator = validateNotPoolRoot(errorMessage);
      expect(validator(new FormControl('/mnt/tank'))).toEqual({
        poolRoot: {
          message: errorMessage,
        },
      });
      expect(validator(new FormControl('/mnt/mypool'))).toEqual({
        poolRoot: {
          message: errorMessage,
        },
      });
    });

    it('should reject pool root paths with trailing slashes', () => {
      const validator = validateNotPoolRoot(errorMessage);
      expect(validator(new FormControl('/mnt/tank/'))).toEqual({
        poolRoot: {
          message: errorMessage,
        },
      });
    });

    it('should reject pool root paths with multiple trailing slashes', () => {
      const validator = validateNotPoolRoot(errorMessage);
      expect(validator(new FormControl('/mnt/mypool///'))).toEqual({
        poolRoot: {
          message: errorMessage,
        },
      });
      expect(validator(new FormControl('/mnt/tank//////'))).toEqual({
        poolRoot: {
          message: errorMessage,
        },
      });
    });

    it('should use the provided translated error message', () => {
      const customMessage = 'Translated error message';
      const validator = validateNotPoolRoot(customMessage);
      const result = validator(new FormControl('/mnt/tank'));
      expect(result).toEqual({
        poolRoot: {
          message: customMessage,
        },
      });
    });

    it('should trim whitespace from paths', () => {
      const validator = validateNotPoolRoot(errorMessage);
      expect(validator(new FormControl('  /mnt/tank  '))).toEqual({
        poolRoot: {
          message: errorMessage,
        },
      });
    });
  });
});
