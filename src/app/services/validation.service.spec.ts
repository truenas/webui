import { FormControl, FormGroup } from '@angular/forms';
import { ValidationService } from 'app/services/validation.service';

describe('ValidationService', () => {
  const service = new ValidationService();
  const formControlName = 'value1';
  const otherFormControlName = 'value2';
  const formControlPlaceholder = 'Value 2';
  let formGroup: FormGroup;
  beforeEach(() => {
    formGroup = new FormGroup({
      value1: new FormControl(0, [
        service.greaterThan(otherFormControlName, [formControlPlaceholder]),
      ]),
      value2: new FormControl(0),
    });
  });

  it('should have greatherThan error when value1 is smaller', () => {
    formGroup.get(formControlName).setValue(0);
    formGroup.get(otherFormControlName).setValue(1);
    formGroup.updateValueAndValidity();
    expect(formGroup.valid).toBeFalsy();
    expect(formGroup.get(formControlName).errors.greaterThan).toBeTruthy();
    expect(formGroup.get(formControlName).errors.fields[0]).toBe(formControlPlaceholder);
  });

  it('should have greatherThan error when value1 is equal', () => {
    formGroup.get(formControlName).setValue(0);
    formGroup.get(otherFormControlName).setValue(0);
    formGroup.updateValueAndValidity();
    expect(formGroup.valid).toBeFalsy();
    expect(formGroup.get(formControlName).errors.greaterThan).toBeTruthy();
    expect(formGroup.get(formControlName).errors.fields[0]).toBe(formControlPlaceholder);
  });

  it('should not have greatherThan error when value1 is greater', () => {
    formGroup.get(formControlName).setValue(1);
    formGroup.get(otherFormControlName).setValue(0);
    formGroup.updateValueAndValidity();
    expect(formGroup.valid).toBeTruthy();
    expect(formGroup.get(formControlName).errors).toBeFalsy();
  });

  it('should not have greaterThan error when control has no parent formGroup', () => {
    const value1FormControl = new FormControl(0, [
      service.greaterThan(otherFormControlName, [formControlPlaceholder]),
    ]);
    expect(value1FormControl.errors).toBeFalsy();
  });

  it('should throw error if value2 doesnt exist in formGroup', () => {
    formGroup = new FormGroup({
      value1: new FormControl(0, [
        service.greaterThan(otherFormControlName, [formControlPlaceholder]),
      ]),
    });

    expect(() => {
      formGroup.get(formControlName).updateValueAndValidity();
    }).toThrow('greaterThanValidator(): other control is not found in parent group');
  });
});
