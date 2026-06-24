import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { TN_FORM_FIELD_ERRORS, type TnFormFieldErrorResolver } from '@truenas/ui-components';
import { provideTnFormFieldErrors } from 'app/core/providers/tn-form-field-errors.provider';

describe('provideTnFormFieldErrors', () => {
  function setup(): TnFormFieldErrorResolver {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          useValue: {
            instant: jest.fn((key: string, params?: Record<string, unknown>) => (
              params ? `${key} ${JSON.stringify(params)}` : key
            )),
          },
        },
        provideTnFormFieldErrors(),
      ],
    });

    return TestBed.inject(TN_FORM_FIELD_ERRORS);
  }

  it('translates a known error key, reading detail from the control', () => {
    const resolve = setup();
    const control = new FormControl(null);
    control.setErrors({ min: { min: 5 } });

    expect(resolve('min', { min: 5 }, control)).toBe('Minimum value is {min} {"min":5}');
  });

  it('reads sibling detail keys for errors stored separately (range)', () => {
    const resolve = setup();
    const control = new FormControl(null);
    control.setErrors({ range: true, rangeValue: { min: 1, max: 10 } });

    expect(resolve('range', true, control)).toBe(
      'The value is out of range. Enter a value between {min} and {max}. {"min":1,"max":10}',
    );
  });

  it('prefers a custom validator message over the translated default', () => {
    const resolve = setup();

    expect(resolve('whatever', { message: 'Custom problem' }, null)).toBe('Custom problem');
  });

  it('returns null for unknown keys so the library falls through to its defaults', () => {
    const resolve = setup();

    expect(resolve('someUnknownKey', true, null)).toBeNull();
  });

  it('surfaces backend validation errors stored under manualValidateError', () => {
    const resolve = setup();
    const control = new FormControl(null);
    control.setErrors({
      manualValidateError: true,
      manualValidateErrorMsg: 'Server could not be reached. Check "Force" to continue regardless.',
      ixManualValidateError: { message: 'Server could not be reached. Check "Force" to continue regardless.' },
    });

    expect(resolve('manualValidateError', true, control)).toBe(
      'Server could not be reached. Check "Force" to continue regardless.',
    );
  });

  it('ignores a blank custom message and falls through to the translated default', () => {
    const resolve = setup();

    expect(resolve('required', { message: '   ' }, null)).toBe('Field is required');
  });

  it('falls back to the error value when the control is null', () => {
    const resolve = setup();

    expect(resolve('min', { min: 5 }, null)).toBe('Minimum value is {min} {"min":5}');
  });

  it('uses the singular array-length message when the limit is 1', () => {
    const resolve = setup();
    const control = new FormControl(null);
    control.setErrors({ minArrayLength: { requiredLength: 1 } });

    expect(resolve('minArrayLength', { requiredLength: 1 }, control)).toBe(
      'List should have at least {minLength} item {"minLength":1}',
    );
  });

  it('uses the plural array-length message when the limit is greater than 1', () => {
    const resolve = setup();
    const control = new FormControl(null);
    control.setErrors({ maxArrayLength: { requiredLength: 3 } });

    expect(resolve('maxArrayLength', { requiredLength: 3 }, control)).toBe(
      'List should have no more than {maxLength} items {"maxLength":3}',
    );
  });

  // Every supported key resolves to its own translated message. The mocked
  // `instant` echoes the translation key, so asserting the key was passed
  // confirms the right switch branch ran.
  const cases: [key: string, errors: Record<string, unknown>, expected: string][] = [
    ['max', { max: { max: 5 } }, 'Maximum value is {max}'],
    ['required', { required: true }, 'Field is required'],
    ['email', { email: true }, 'Value must be a valid email address'],
    ['cpu', { cpu: true }, 'Invalid CPU configuration.'],
    ['minlength', { minlength: { requiredLength: 3 } }, 'The length of the field should be at least {minLength}'],
    ['maxlength', { maxlength: { requiredLength: 3 } }, 'The length of the field should be no more than {maxLength}'],
    ['pattern', { pattern: true }, 'Invalid format or character'],
    ['forbidden', { forbidden: true, value: 'foo' }, 'The name "{value}" is already in use.'],
    ['number', { number: true }, 'Value must be a number'],
    ['cron', { cron: true }, 'Invalid cron expression'],
    ['ip2', { ip2: true }, 'Invalid IP address'],
    ['invalidRegex', { invalidRegex: true }, 'Invalid regular expression'],
    ['invalidStrftimeSpecifier', { invalidStrftimeSpecifier: { specifier: '%Q' } }, 'Invalid format specifier: {specifier}'],
    ['containsSlash', { containsSlash: true }, 'Forward slashes are not allowed'],
    ['invalidCharacters', { invalidCharacters: true }, 'Contains invalid characters'],
    ['orphanedPercent', { orphanedPercent: true }, 'Percent sign at end must be escaped as %%'],
    ['invalidRcloneBandwidthLimit', { invalidRcloneBandwidthLimit: { value: '1x' } }, 'Invalid Rclone bandwidth limit: {value}'],
    ['selectionMustBeFile', { selectionMustBeFile: true }, 'Selected path must be a file and not a directory'],
    ['empty', { empty: true }, 'Value cannot be empty or whitespace only'],
    [
      'exactLength',
      { exactLength: { requiredLength: 5, actualLength: 3 } },
      'The length must be exactly {requiredLength} (current length: {actualLength})',
    ],
  ];

  it.each(cases)('translates the "%s" error to its dedicated message', (key, errors, expected) => {
    const resolve = setup();
    const control = new FormControl(null);
    control.setErrors(errors);

    expect(resolve(key, errors[key], control)).toContain(expected);
  });

  it('uses the plural minArrayLength message when the limit is greater than 1', () => {
    const resolve = setup();

    expect(resolve('minArrayLength', { requiredLength: 2 }, null)).toContain(
      'List should have at least {minLength} items',
    );
  });

  it('uses the singular maxArrayLength message when the limit is 1', () => {
    const resolve = setup();

    expect(resolve('maxArrayLength', { requiredLength: 1 }, null)).toContain(
      'List should have no more than {maxLength} item',
    );
  });

  it('tolerates a non-object error value, treating its detail as empty', () => {
    const resolve = setup();

    // `min`'s detail would normally be an object; a bare value must not throw.
    expect(resolve('min', true, null)).toBe('Minimum value is {min} {}');
  });
});
