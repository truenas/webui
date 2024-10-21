import { FormControl, FormGroup } from '@angular/forms';
import { greaterThanFg } from 'app/services/validators';

describe('ValidationService', () => {
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
    formGroup.get(value1).setValue(0);
    formGroup.get(value2).setValue(1);
    formGroup.updateValueAndValidity();
    expect(formGroup.valid).toBeFalsy();
    expect(formGroup.get(value1).errors).toEqual({
      greaterThan: { message: 'Greater than error' },
    });
  });

  it('should have greaterThan error when value1 is equal', () => {
    formGroup.get(value1).setValue(0);
    formGroup.get(value2).setValue(0);
    formGroup.updateValueAndValidity();

    expect(formGroup.get(value1).errors).toEqual({
      greaterThan: { message: 'Greater than error' },
    });
  });

  it('should not have greaterThan error when value1 is greater', () => {
    formGroup.get(value1).setValue(1);
    formGroup.get(value2).setValue(0);
    formGroup.updateValueAndValidity();
    expect(formGroup.valid).toBeTruthy();
    expect(formGroup.get(value1).errors).toBeFalsy();
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
      formGroup.get(value1).updateValueAndValidity();
    }).toThrow('greaterThanValidator(): other control is not found in the group');
  });
});
