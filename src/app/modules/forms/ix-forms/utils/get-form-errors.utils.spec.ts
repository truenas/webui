import {
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { getAllFormErrors } from './get-form-errors.utils';

describe('getAllFormErrors', () => {
  let form: FormGroup;

  beforeEach(() => {
    form = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.minLength(3)]),
      email: new FormControl('', [Validators.required, emailValidator()]),
      password: new FormControl('', [Validators.required]),
      confirmPassword: new FormControl(''),
      optional: new FormControl(''),
    });
  });

  it('should return empty object when no fields are specified', () => {
    const result = getAllFormErrors(form, []);

    expect(result).toEqual({});
  });

  it('should return empty object when no specified fields have errors', () => {
    form.patchValue({
      username: 'validuser',
      email: 'valid@email.com',
      password: 'validpassword',
    });
    form.updateValueAndValidity();

    const result = getAllFormErrors(form, ['username', 'email', 'password']);

    expect(result).toEqual({});
  });

  it('should return errors for fields that have validation errors', () => {
    form.patchValue({
      username: 'ab', // Too short (minLength: 3)
      email: 'invalid-email', // Invalid email format
      password: '', // Required
    });
    form.updateValueAndValidity();

    const result = getAllFormErrors(form, ['username', 'email', 'password']);

    expect(result).toEqual({
      username: { minlength: { requiredLength: 3, actualLength: 2 } },
      email: { email: true },
      password: { required: true },
    });
  });

  it('should only return errors for specified fields', () => {
    form.patchValue({
      username: '', // Required error
      email: 'invalid-email', // Email error
      password: '', // Required error
    });
    form.updateValueAndValidity();

    const result = getAllFormErrors(form, ['username', 'password']);

    expect(result).toEqual({
      username: { required: true },
      password: { required: true },
    });
    expect(result).not.toHaveProperty('email');
  });

  it('should ignore fields that do not exist in the form', () => {
    form.patchValue({
      username: '', // Required error
    });
    form.updateValueAndValidity();

    const result = getAllFormErrors(form, ['username', 'nonExistentField']);

    expect(result).toEqual({
      username: { required: true },
    });
  });

  it('should handle multiple validation errors on a single field', () => {
    form.patchValue({
      username: '', // Both required and minLength errors
    });
    form.updateValueAndValidity();

    const result = getAllFormErrors(form, ['username']);

    expect(result.username).toEqual({ required: true });
  });

  it('should handle fields with no errors mixed with fields with errors', () => {
    form.patchValue({
      username: 'validuser', // No errors
      email: 'invalid-email', // Email error
      password: 'validpassword', // No errors
      confirmPassword: 'somevalue', // No errors (no validators)
    });
    form.updateValueAndValidity();

    const result = getAllFormErrors(form, ['username', 'email', 'password', 'confirmPassword']);

    expect(result).toEqual({
      email: { email: true },
    });
  });

  it('should work with custom validators', () => {
    const customValidator = (control: FormControl): { forbidden: boolean } | null => {
      return control.value === 'forbidden' ? { forbidden: true } : null;
    };

    form.addControl('customField', new FormControl('forbidden', [customValidator]));
    form.updateValueAndValidity();

    const result = getAllFormErrors(form, ['customField']);

    expect(result).toEqual({
      customField: { forbidden: true },
    });
  });

  it('should handle empty form with all fields having errors', () => {
    // All required fields are empty, so they should have required errors
    const result = getAllFormErrors(form, ['username', 'email', 'password']);

    expect(result).toEqual({
      username: { required: true },
      email: { required: true },
      password: { required: true },
    });
  });
});
