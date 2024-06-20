import { FormControl } from '@angular/forms';
import { rangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';

describe('rangeValidator', () => {
  const validate = rangeValidator(10, 20);

  it('should not return an error when value is in range', () => {
    expect(validate(new FormControl(15))).toBeNull();
    expect(validate(new FormControl(10))).toBeNull();
    expect(validate(new FormControl(20))).toBeNull();
  });

  it('should return an error when value is in range', () => {
    expect(validate(new FormControl(9))).toEqual({ range: true, rangeValue: { min: 10, max: 20 } });
    expect(validate(new FormControl(21))).toEqual({ range: true, rangeValue: { min: 10, max: 20 } });
  });
});
