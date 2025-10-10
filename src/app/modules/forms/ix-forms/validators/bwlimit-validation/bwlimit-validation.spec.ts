import { FormControl } from '@angular/forms';
import { bwlimitValidator } from './bwlimit-validation';

describe('bwlimitValidator', () => {
  it('should return null for empty array', () => {
    const control = new FormControl([]);
    const validator = bwlimitValidator();
    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return null for null value', () => {
    const control = new FormControl(null);
    const validator = bwlimitValidator();
    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return null for undefined value', () => {
    const control = new FormControl(undefined);
    const validator = bwlimitValidator();
    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return null for valid bandwidth limits', () => {
    const control = new FormControl(['00:00, 10MB/s', '12:00, 5GB/s']);
    const validator = bwlimitValidator();
    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return null for "off" bandwidth', () => {
    const control = new FormControl(['00:00, off']);
    const validator = bwlimitValidator();
    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return error for invalid bandwidth like "abc"', () => {
    const control = new FormControl(['00:00, abc']);
    const validator = bwlimitValidator();
    const result = validator(control);
    expect(result).toEqual({ pattern: true });
  });

  it('should return error for typos that look like numbers like "1o0"', () => {
    const control = new FormControl(['00:00, 1o0']);
    const validator = bwlimitValidator();
    const result = validator(control);
    expect(result).toEqual({ pattern: true });
  });

  it('should return error when at least one bandwidth limit is invalid', () => {
    const control = new FormControl(['00:00, 10MB/s', '12:00, abc']);
    const validator = bwlimitValidator();
    const result = validator(control);
    expect(result).toEqual({ pattern: true });
  });

  it('should return null for valid plain number', () => {
    const control = new FormControl(['100']);
    const validator = bwlimitValidator();
    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return null for time-only entries (no bandwidth)', () => {
    const control = new FormControl(['9:00']);
    const validator = bwlimitValidator();
    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return null for mixed valid entries', () => {
    const control = new FormControl(['9:00', '12:30, 2048', '18:00, off']);
    const validator = bwlimitValidator();
    const result = validator(control);
    expect(result).toBeNull();
  });
});
