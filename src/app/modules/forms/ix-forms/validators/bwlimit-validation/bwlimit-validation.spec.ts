import { FormControl } from '@angular/forms';
import { bwlimitValidator } from './bwlimit-validation';

describe('bwlimitValidator', () => {
  const validator = bwlimitValidator();

  it('should return null for empty array', () => {
    const control = new FormControl([]);
    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return null for null value', () => {
    const control = new FormControl(null);

    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return null for undefined value', () => {
    const control = new FormControl(undefined);

    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return null for valid bandwidth limits', () => {
    const control = new FormControl(['00:00, 10MB/s', '12:00, 5GB/s']);

    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return null for "off" bandwidth', () => {
    const control = new FormControl(['00:00, off']);

    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return error for invalid bandwidth like "abc"', () => {
    const control = new FormControl(['00:00, abc']);

    const result = validator(control);
    expect(result).toEqual({
      invalidRcloneBandwidthLimit: {
        value: '00:00, abc',
      },
    });
  });

  it('should return error for typos that look like numbers like "1o0"', () => {
    const control = new FormControl(['00:00, 1o0']);

    const result = validator(control);
    expect(result).toEqual({
      invalidRcloneBandwidthLimit: {
        value: '00:00, 1o0',
      },
    });
  });

  it('should return error when at least one bandwidth limit is invalid', () => {
    const control = new FormControl(['00:00, 10MB/s', '12:00, abc']);

    const result = validator(control);
    expect(result).toEqual({
      invalidRcloneBandwidthLimit: {
        value: '12:00, abc',
      },
    });
  });

  it('should return null for valid plain number', () => {
    const control = new FormControl(['100']);

    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return null for time-only entries (no bandwidth)', () => {
    const control = new FormControl(['9:00']);

    const result = validator(control);
    expect(result).toBeNull();
  });

  it('should return null for mixed valid entries', () => {
    const control = new FormControl(['9:00', '12:30, 2048', '18:00, off']);

    const result = validator(control);
    expect(result).toBeNull();
  });

  describe('time validation', () => {
    it('should return null for valid time with hour 00 and minute 00', () => {
      const control = new FormControl(['00:00, 10MB/s']);

      const result = validator(control);
      expect(result).toBeNull();
    });

    it('should return null for valid time with hour 23 and minute 59', () => {
      const control = new FormControl(['23:59, 10MB/s']);

      const result = validator(control);
      expect(result).toBeNull();
    });

    it('should return null for valid single-digit hour', () => {
      const control = new FormControl(['9:30, 10MB/s']);

      const result = validator(control);
      expect(result).toBeNull();
    });

    it('should return error for hour greater than 23', () => {
      const control = new FormControl(['24:00, 10MB/s']);

      const result = validator(control);
      expect(result?.invalidRcloneBandwidthLimit).toBeDefined();
      expect(result?.invalidRcloneBandwidthLimit?.value).toBe('24:00, 10MB/s');
    });

    it('should return error for negative hour', () => {
      const control = new FormControl(['-1:30, 10MB/s']);

      const result = validator(control);
      expect(result?.invalidRcloneBandwidthLimit).toBeDefined();
      expect(result?.invalidRcloneBandwidthLimit?.value).toBe('-1:30, 10MB/s');
    });

    it('should return error for minute greater than 59', () => {
      const control = new FormControl(['12:60, 10MB/s']);

      const result = validator(control);
      expect(result?.invalidRcloneBandwidthLimit).toBeDefined();
      expect(result?.invalidRcloneBandwidthLimit?.value).toBe('12:60, 10MB/s');
    });

    it('should return error for negative minute', () => {
      const control = new FormControl(['12:-5, 10MB/s']);

      const result = validator(control);
      expect(result?.invalidRcloneBandwidthLimit).toBeDefined();
      expect(result?.invalidRcloneBandwidthLimit?.value).toBe('12:-5, 10MB/s');
    });

    it('should return error for time with only one component', () => {
      const control = new FormControl(['12, 10MB/s']);

      const result = validator(control);
      expect(result?.invalidRcloneBandwidthLimit).toBeDefined();
      expect(result?.invalidRcloneBandwidthLimit?.value).toBe('12, 10MB/s');
    });

    it('should return error for time with three components', () => {
      const control = new FormControl(['12:30:45, 10MB/s']);

      const result = validator(control);
      expect(result?.invalidRcloneBandwidthLimit).toBeDefined();
      expect(result?.invalidRcloneBandwidthLimit?.value).toBe('12:30:45, 10MB/s');
    });

    it('should return error for time with non-numeric hour', () => {
      const control = new FormControl(['ab:30, 10MB/s']);

      const result = validator(control);
      expect(result?.invalidRcloneBandwidthLimit).toBeDefined();
      expect(result?.invalidRcloneBandwidthLimit?.value).toBe('ab:30, 10MB/s');
    });

    it('should return error for time with non-numeric minute', () => {
      const control = new FormControl(['12:cd, 10MB/s']);

      const result = validator(control);
      expect(result?.invalidRcloneBandwidthLimit).toBeDefined();
      expect(result?.invalidRcloneBandwidthLimit?.value).toBe('12:cd, 10MB/s');
    });

    it('should return error for empty time string', () => {
      const control = new FormControl([', 10MB/s']);

      const result = validator(control);
      expect(result?.invalidRcloneBandwidthLimit).toBeDefined();
      expect(result?.invalidRcloneBandwidthLimit?.value).toBe(', 10MB/s');
    });

    it('should return error when at least one time is invalid in mixed entries', () => {
      const control = new FormControl(['09:00, 10MB/s', '25:00, 5MB/s', '18:30, off']);

      const result = validator(control);
      expect(result?.invalidRcloneBandwidthLimit).toBeDefined();
      expect(result?.invalidRcloneBandwidthLimit?.value).toBe('25:00, 5MB/s');
    });

    it('should return null for valid time-only entry', () => {
      const control = new FormControl(['12:30']);

      const result = validator(control);
      expect(result).toBeNull();
    });

    it('should return error for invalid time-only entry', () => {
      const control = new FormControl(['25:30']);

      const result = validator(control);
      expect(result?.invalidRcloneBandwidthLimit).toBeDefined();
      expect(result?.invalidRcloneBandwidthLimit?.value).toBe('25:30');
    });

    it('should return error for time with hour as decimal', () => {
      const control = new FormControl(['12.5:30, 10MB/s']);

      const result = validator(control);
      expect(result?.invalidRcloneBandwidthLimit).toBeDefined();
      expect(result?.invalidRcloneBandwidthLimit?.value).toBe('12.5:30, 10MB/s');
    });

    it('should return error for time with minute as decimal', () => {
      const control = new FormControl(['12:30.5, 10MB/s']);

      const result = validator(control);
      expect(result?.invalidRcloneBandwidthLimit).toBeDefined();
      expect(result?.invalidRcloneBandwidthLimit?.value).toBe('12:30.5, 10MB/s');
    });
  });

  describe('error message details', () => {
    it('should return original value string for invalid bandwidth', () => {
      const control = new FormControl(['09:00, abc']);

      const result = validator(control);
      expect(result).toEqual({
        invalidRcloneBandwidthLimit: {
          value: '09:00, abc',
        },
      });
    });

    it('should return original value string for invalid time', () => {
      const control = new FormControl(['25:00, 100MB/s']);

      const result = validator(control);
      expect(result).toEqual({
        invalidRcloneBandwidthLimit: {
          value: '25:00, 100MB/s',
        },
      });
    });

    it('should prioritize time errors over bandwidth errors', () => {
      const control = new FormControl(['23:00, abc', '25:00, 100M']);
      const result = validator(control);

      expect(result).toEqual({
        invalidRcloneBandwidthLimit: {
          value: '25:00, 100M',
        },
      });
    });

    it('should return first invalid entry when multiple entries are invalid', () => {
      const control = new FormControl(['25:00, 10MB/s', '12:00, abc', '30:00, 5MB/s']);

      const result = validator(control);
      expect(result).toEqual({
        invalidRcloneBandwidthLimit: {
          value: '25:00, 10MB/s',
        },
      });
    });

    it('should handle decimal bandwidth as valid', () => {
      const control = new FormControl(['12:00, 10.5MB/s']);

      const result = validator(control);
      expect(result).toBeNull();
    });
  });
});
