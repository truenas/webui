import { FormControl } from '@angular/forms';
import { regexValidator } from 'app/modules/forms/ix-forms/validators/regex-validation/regex-validation';

describe('regexValidator', () => {
  const validate = regexValidator();

  describe('should not return an error for valid regex patterns', () => {
    it('should accept empty/null values', () => {
      expect(validate(new FormControl(''))).toBeNull();
      expect(validate(new FormControl(null))).toBeNull();
      expect(validate(new FormControl(undefined))).toBeNull();
    });

    it('should accept simple string patterns', () => {
      expect(validate(new FormControl('test'))).toBeNull();
      expect(validate(new FormControl('abc'))).toBeNull();
      expect(validate(new FormControl('123'))).toBeNull();
    });

    it('should accept basic regex patterns', () => {
      expect(validate(new FormControl('.*'))).toBeNull();
      expect(validate(new FormControl('^test$'))).toBeNull();
      expect(validate(new FormControl('test.*'))).toBeNull();
      expect(validate(new FormControl('[a-z]+'))).toBeNull();
    });

    it('should accept complex regex patterns', () => {
      expect(validate(new FormControl('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$'))).toBeNull();
      expect(validate(new FormControl('\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}'))).toBeNull();
      expect(validate(new FormControl('(?:auto|manual)-\\d+'))).toBeNull();
      expect(validate(new FormControl('[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}'))).toBeNull();
    });

    it('should accept character classes and quantifiers', () => {
      expect(validate(new FormControl('[a-z]'))).toBeNull();
      expect(validate(new FormControl('[A-Z]'))).toBeNull();
      expect(validate(new FormControl('[0-9]'))).toBeNull();
      expect(validate(new FormControl('[a-zA-Z0-9]'))).toBeNull();
      expect(validate(new FormControl('\\w+'))).toBeNull();
      expect(validate(new FormControl('\\d*'))).toBeNull();
      expect(validate(new FormControl('\\s?'))).toBeNull();
    });

    it('should accept anchors and boundaries', () => {
      expect(validate(new FormControl('^start'))).toBeNull();
      expect(validate(new FormControl('end$'))).toBeNull();
      expect(validate(new FormControl('\\bword\\b'))).toBeNull();
      expect(validate(new FormControl('^\\w+$'))).toBeNull();
    });
  });

  describe('should return an error for invalid regex patterns', () => {
    it('should reject unclosed brackets', () => {
      expect(validate(new FormControl('[unclosed'))).toEqual({ invalidRegex: true });
      expect(validate(new FormControl('[a-z'))).toEqual({ invalidRegex: true });
      expect(validate(new FormControl('(unclosed'))).toEqual({ invalidRegex: true });
    });

    it('should reject invalid character classes', () => {
      expect(validate(new FormControl('[z-a]'))).toEqual({ invalidRegex: true });
      expect(validate(new FormControl('[9-0]'))).toEqual({ invalidRegex: true });
    });

    it('should reject invalid quantifiers', () => {
      expect(validate(new FormControl('*invalid'))).toEqual({ invalidRegex: true });
      expect(validate(new FormControl('+invalid'))).toEqual({ invalidRegex: true });
      expect(validate(new FormControl('?invalid'))).toEqual({ invalidRegex: true });
      expect(validate(new FormControl('{2,1}'))).toEqual({ invalidRegex: true });
    });

    it('should reject unescaped special characters in invalid positions', () => {
      expect(validate(new FormControl('(?invalid'))).toEqual({ invalidRegex: true });
      expect(validate(new FormControl(')invalid'))).toEqual({ invalidRegex: true });
    });

    it('should reject incomplete escape sequences', () => {
      expect(validate(new FormControl('\\'))).toEqual({ invalidRegex: true });
    });
  });

  describe('edge cases', () => {
    it('should handle special regex characters correctly', () => {
      expect(validate(new FormControl('\\.'))).toBeNull();
      expect(validate(new FormControl('\\*'))).toBeNull();
      expect(validate(new FormControl('\\+'))).toBeNull();
      expect(validate(new FormControl('\\?'))).toBeNull();
      expect(validate(new FormControl('\\['))).toBeNull();
      expect(validate(new FormControl('\\]'))).toBeNull();
      expect(validate(new FormControl('\\('))).toBeNull();
      expect(validate(new FormControl('\\)'))).toBeNull();
    });

    it('should handle flags-like strings (which are not supported in this validator)', () => {
      // Note: This validator only validates the pattern, not flags
      expect(validate(new FormControl('test/flags'))).toBeNull();
      expect(validate(new FormControl('/pattern/gi'))).toBeNull();
    });

    it('should handle very long patterns', () => {
      const longPattern = 'a'.repeat(1000);
      expect(validate(new FormControl(longPattern))).toBeNull();

      const longInvalidPattern = '['.repeat(100);
      expect(validate(new FormControl(longInvalidPattern))).toEqual({ invalidRegex: true });
    });
  });

  describe('real-world snapshot regex patterns', () => {
    it('should accept common snapshot naming patterns', () => {
      // Auto snapshots
      expect(validate(new FormControl('auto-\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}'))).toBeNull();

      // Manual snapshots
      expect(validate(new FormControl('manual-.*'))).toBeNull();

      // Date-based patterns
      expect(validate(new FormControl('\\d{4}-\\d{2}-\\d{2}'))).toBeNull();

      // Time-based patterns
      expect(validate(new FormControl('.*_\\d{2}:\\d{2}'))).toBeNull();

      // Mixed patterns
      expect(validate(new FormControl('^(auto|manual)-\\d{4}'))).toBeNull();
    });

    it('should reject common invalid patterns users might try', () => {
      // Unmatched brackets (common mistake)
      expect(validate(new FormControl('snapshot[0-9'))).toEqual({ invalidRegex: true });

      // Invalid quantifier at start
      expect(validate(new FormControl('*snapshot'))).toEqual({ invalidRegex: true });

      // Unclosed groups
      expect(validate(new FormControl('(snapshot'))).toEqual({ invalidRegex: true });
    });
  });
});
