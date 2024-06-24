import { FormControl } from '@angular/forms';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';

describe('emailValidator', () => {
  const validate = emailValidator();

  it('should not return an error when value is valid email', () => {
    expect(validate(new FormControl('test@mail.com'))).toBeNull();
    expect(validate(new FormControl('a@a.a'))).toBeNull();
  });

  it('should return an error when value is invalid email', () => {
    expect(validate(new FormControl('test'))).toEqual({ email: true });
    expect(validate(new FormControl('test@test.'))).toEqual({ email: true });
    expect(validate(new FormControl('test@test'))).toEqual({ email: true });
    expect(validate(new FormControl('test@.test'))).toEqual({ email: true });
    expect(validate(new FormControl('test.test'))).toEqual({ email: true });
  });
});
