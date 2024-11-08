import { FormControl } from '@angular/forms';
import { cpuValidator } from 'app/modules/forms/ix-forms/validators/cpu-validation/cpu-validation';

describe('cpuValidator', () => {
  let control: FormControl;

  beforeEach(() => {
    control = new FormControl('');
  });

  it('should pass validation for a valid single CPU', () => {
    control.setValue('4');
    const result = cpuValidator()(control);
    expect(result).toBeNull();
  });

  it('should pass validation for a valid CPU range', () => {
    control.setValue('0-3');
    const result = cpuValidator()(control);
    expect(result).toBeNull();
  });

  it('should pass validation for a valid CPU set and ranges', () => {
    control.setValue('0-1,2,4-6');
    const result = cpuValidator()(control);
    expect(result).toBeNull();
  });

  it('should fail validation for invalid CPU string', () => {
    control.setValue('abc');
    const result = cpuValidator()(control);
    expect(result).toEqual({ cpu: true });
  });

  it('should fail validation for invalid range', () => {
    control.setValue('3-1');
    const result = cpuValidator()(control);
    expect(result).toEqual({ cpu: true });
  });

  it('should fail validation for a combination of valid and invalid CPU sets', () => {
    control.setValue('0-1,abc,4-6');
    const result = cpuValidator()(control);
    expect(result).toEqual({ cpu: true });
  });

  it('should fail validation when start of a range is greater than the end', () => {
    control.setValue('1-0');
    const result = cpuValidator()(control);
    expect(result).toEqual({ cpu: true });
  });

  it('should pass validation for an empty string', () => {
    control.setValue('');
    const result = cpuValidator()(control);
    expect(result).toBeNull();
  });
});
