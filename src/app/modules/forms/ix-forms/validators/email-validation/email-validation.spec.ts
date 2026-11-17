import { FormControl } from '@angular/forms';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';

describe('emailValidator', () => {
  const validate = emailValidator();

  it('should not return an error when value is valid email', () => {
    expect(validate(new FormControl('test@mail.com'))).toBeNull();
    expect(validate(new FormControl('a@a.a'))).toBeNull();
    expect(validate(new FormControl('first.last+tag@sub.mail.com'))).toBeNull();
  });

  it('allows special characters RFC 5322 permits in the local part', () => {
    expect(validate(new FormControl('my.nas+admin.user=other.domain@nas.domain'))).toBeNull();
    expect(validate(new FormControl('o\'brien@mail.com'))).toBeNull();
    expect(validate(new FormControl('a!#$%&*/?^`{|}~@mail.com'))).toBeNull();
  });

  it('should return an error when value is invalid email', () => {
    expect(validate(new FormControl('test'))).toEqual({ email: true });
    expect(validate(new FormControl('test@test.'))).toEqual({ email: true });
    expect(validate(new FormControl('test@test'))).toEqual({ email: true });
    expect(validate(new FormControl('test@.test'))).toEqual({ email: true });
    expect(validate(new FormControl('test.test'))).toEqual({ email: true });
  });

  it('should return an error for malformed local parts', () => {
    expect(validate(new FormControl('.test@mail.com'))).toEqual({ email: true });
    expect(validate(new FormControl('test.@mail.com'))).toEqual({ email: true });
    expect(validate(new FormControl('te..st@mail.com'))).toEqual({ email: true });
    expect(validate(new FormControl('te st@mail.com'))).toEqual({ email: true });
    expect(validate(new FormControl('te"st@mail.com'))).toEqual({ email: true });
    expect(validate(new FormControl('a@b@mail.com'))).toEqual({ email: true });
  });
});
