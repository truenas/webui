import { FormControl } from '@angular/forms';
import { namingSchemaValidator } from 'app/modules/forms/ix-forms/validators/naming-schema-validation/naming-schema-validation';

describe('namingSchemaValidator', () => {
  const validate = namingSchemaValidator();

  describe('should not return an error for valid naming schemas', () => {
    it('should accept empty/null values', () => {
      expect(validate(new FormControl(''))).toBeNull();
      expect(validate(new FormControl(null))).toBeNull();
      expect(validate(new FormControl(undefined))).toBeNull();
    });

    it('should accept default TrueNAS naming schema', () => {
      expect(validate(new FormControl('auto-%Y-%m-%d_%H-%M'))).toBeNull();
    });

    it('should accept simple text without format specifiers', () => {
      expect(validate(new FormControl('manual-snapshot'))).toBeNull();
      expect(validate(new FormControl('backup'))).toBeNull();
      expect(validate(new FormControl('test-snapshot-123'))).toBeNull();
    });

    it('should accept date format specifiers', () => {
      expect(validate(new FormControl('%Y'))).toBeNull(); // Year (4-digit)
      expect(validate(new FormControl('%y'))).toBeNull(); // Year (2-digit)
      expect(validate(new FormControl('%m'))).toBeNull(); // Month
      expect(validate(new FormControl('%d'))).toBeNull(); // Day
      expect(validate(new FormControl('%j'))).toBeNull(); // Day of year
    });

    it('should accept time format specifiers', () => {
      expect(validate(new FormControl('%H'))).toBeNull(); // Hour (24-hour)
      expect(validate(new FormControl('%I'))).toBeNull(); // Hour (12-hour)
      expect(validate(new FormControl('%M'))).toBeNull(); // Minute
      expect(validate(new FormControl('%S'))).toBeNull(); // Second
    });

    it('should accept month format specifiers', () => {
      expect(validate(new FormControl('%B'))).toBeNull(); // Full month name
      expect(validate(new FormControl('%b'))).toBeNull(); // Abbreviated month name
    });

    it('should accept weekday format specifiers', () => {
      expect(validate(new FormControl('%A'))).toBeNull(); // Full weekday name
      expect(validate(new FormControl('%a'))).toBeNull(); // Abbreviated weekday name
      expect(validate(new FormControl('%w'))).toBeNull(); // Weekday as number (0-6)
      expect(validate(new FormControl('%u'))).toBeNull(); // Weekday as number (1-7)
    });

    it('should accept week format specifiers', () => {
      expect(validate(new FormControl('%U'))).toBeNull(); // Week number (Sunday first)
      expect(validate(new FormControl('%W'))).toBeNull(); // Week number (Monday first)
    });

    it('should accept other format specifiers', () => {
      expect(validate(new FormControl('%p'))).toBeNull(); // AM/PM
      expect(validate(new FormControl('%Z'))).toBeNull(); // Time zone name
      expect(validate(new FormControl('%z'))).toBeNull(); // UTC offset
      expect(validate(new FormControl('%%'))).toBeNull(); // Literal %
    });

    it('should accept complex real-world patterns', () => {
      expect(validate(new FormControl('backup-%Y%m%d_%H%M%S'))).toBeNull();
      expect(validate(new FormControl('daily-%Y-%m-%d'))).toBeNull();
      expect(validate(new FormControl('weekly-%Y-W%U'))).toBeNull();
      expect(validate(new FormControl('manual-%Y%m%d-%H%M'))).toBeNull();
      expect(validate(new FormControl('snapshot-%B-%d-%Y'))).toBeNull();
    });

    it('should accept patterns with text and separators', () => {
      expect(validate(new FormControl('auto_%Y_%m_%d_%H_%M'))).toBeNull();
      expect(validate(new FormControl('snap.%Y.%m.%d.%H.%M.%S'))).toBeNull();
      expect(validate(new FormControl('backup_%Y%m%d_%H%M'))).toBeNull();
      expect(validate(new FormControl('test-snapshot-%Y-%m-%d-%H-%M-%S'))).toBeNull();
    });
  });

  describe('should return an error for invalid naming schemas', () => {
    it('should reject schemas with forward slashes', () => {
      expect(validate(new FormControl('backup/%Y-%m-%d'))).toEqual({ containsSlash: true });
      expect(validate(new FormControl('%Y/%m/%d'))).toEqual({ containsSlash: true });
      expect(validate(new FormControl('path/to/snapshot'))).toEqual({ containsSlash: true });
    });

    it('should reject schemas with invalid characters', () => {
      expect(validate(new FormControl('backup<%Y>'))).toEqual({ invalidCharacters: true });
      expect(validate(new FormControl('backup>%Y'))).toEqual({ invalidCharacters: true });
      expect(validate(new FormControl('backup:%Y'))).toEqual({ invalidCharacters: true });
      expect(validate(new FormControl('backup"%Y'))).toEqual({ invalidCharacters: true });
      expect(validate(new FormControl('backup\\%Y'))).toEqual({ invalidCharacters: true });
      expect(validate(new FormControl('backup|%Y'))).toEqual({ invalidCharacters: true });
      expect(validate(new FormControl('backup?%Y'))).toBeNull(); // ? is actually allowed
      expect(validate(new FormControl('backup*%Y'))).toBeNull(); // * is actually allowed
      expect(validate(new FormControl('backup\t%Y'))).toEqual({ invalidCharacters: true }); // Tab character
      expect(validate(new FormControl('backup\n%Y'))).toEqual({ invalidCharacters: true }); // Newline character
    });

    it('should reject invalid strftime specifiers', () => {
      expect(validate(new FormControl('%X'))).toEqual({ invalidStrftimeSpecifier: { specifier: '%X' } });
      expect(validate(new FormControl('%Q'))).toEqual({ invalidStrftimeSpecifier: { specifier: '%Q' } });
      expect(validate(new FormControl('%1'))).toEqual({ invalidStrftimeSpecifier: { specifier: '%1' } });
      expect(validate(new FormControl('%@'))).toEqual({ invalidStrftimeSpecifier: { specifier: '%@' } });
      expect(validate(new FormControl('backup-%Y-%Z'))).toBeNull(); // %Z is valid
      expect(validate(new FormControl('backup-%Y-%F'))).toEqual({ invalidStrftimeSpecifier: { specifier: '%F' } });
    });

    it('should reject orphaned percent at the end', () => {
      expect(validate(new FormControl('backup-%Y-%m-%d%'))).toEqual({ orphanedPercent: true });
      expect(validate(new FormControl('snapshot%'))).toEqual({ orphanedPercent: true });
      expect(validate(new FormControl('%'))).toEqual({ orphanedPercent: true });
    });

    it('should reject whitespace-only schemas', () => {
      expect(validate(new FormControl('   '))).toEqual({ empty: true });
      expect(validate(new FormControl('\t\n'))).toEqual({ invalidCharacters: true }); // Control chars are invalid
    });
  });

  describe('edge cases', () => {
    it('should handle multiple percent signs correctly', () => {
      expect(validate(new FormControl('%%backup%%'))).toBeNull(); // Double %% is literal %
      expect(validate(new FormControl('%Y%%%m%%%d'))).toBeNull(); // Mixed valid specifiers and literals
    });

    it('should handle mixed valid and invalid patterns', () => {
      expect(validate(new FormControl('%Y-%Q-%m'))).toEqual({ invalidStrftimeSpecifier: { specifier: '%Q' } });
      expect(validate(new FormControl('%Y-%m-%d-%X'))).toEqual({ invalidStrftimeSpecifier: { specifier: '%X' } });
    });

    it('should handle very long patterns', () => {
      const longValidPattern = 'backup-' + '%Y-%m-%d_%H-%M-%S'.repeat(100);
      expect(validate(new FormControl(longValidPattern))).toBeNull();

      const longInvalidPattern = 'backup/' + '%Y-%m-%d_%H-%M-%S'.repeat(50);
      expect(validate(new FormControl(longInvalidPattern))).toEqual({ containsSlash: true });
    });

    it('should handle percent in the middle of text', () => {
      expect(validate(new FormControl('test%Ybackup'))).toBeNull(); // %Y is a valid specifier anywhere
      expect(validate(new FormControl('test%%backup'))).toBeNull(); // %% is literal
      expect(validate(new FormControl('100%complete'))).toEqual({ invalidStrftimeSpecifier: { specifier: '%c' } }); // %c is invalid
      expect(validate(new FormControl('100%done'))).toBeNull(); // %d is a valid specifier (day)
      expect(validate(new FormControl('100percent'))).toBeNull(); // No % character
    });

    it('should handle case sensitivity', () => {
      expect(validate(new FormControl('%y'))).toBeNull(); // lowercase y is valid
      expect(validate(new FormControl('%Y'))).toBeNull(); // uppercase Y is valid
      expect(validate(new FormControl('%h'))).toEqual({ invalidStrftimeSpecifier: { specifier: '%h' } }); // lowercase h is invalid
      expect(validate(new FormControl('%H'))).toBeNull(); // uppercase H is valid
    });
  });

  describe('real-world ZFS snapshot naming patterns', () => {
    it('should accept common ZFS snapshot naming patterns', () => {
      // TrueNAS default
      expect(validate(new FormControl('auto-%Y-%m-%d_%H-%M'))).toBeNull();

      // Common variations
      expect(validate(new FormControl('manual-%Y%m%d-%H%M'))).toBeNull();
      expect(validate(new FormControl('daily-%Y-%m-%d'))).toBeNull();
      expect(validate(new FormControl('hourly-%Y-%m-%d_%H'))).toBeNull();
      expect(validate(new FormControl('weekly-%Y-W%U'))).toBeNull();
      expect(validate(new FormControl('monthly-%Y-%m'))).toBeNull();

      // With descriptive prefixes
      expect(validate(new FormControl('backup-%Y%m%d_%H%M%S'))).toBeNull();
      expect(validate(new FormControl('replication-%Y-%m-%d_%H-%M-%S'))).toBeNull();
      expect(validate(new FormControl('system-backup-%Y%m%d'))).toBeNull();
    });

    it('should reject patterns that would cause filesystem issues', () => {
      // Forward slashes would create subdirectories
      expect(validate(new FormControl('backup/%Y/%m/%d'))).toEqual({ containsSlash: true });

      // Special characters that could cause issues
      expect(validate(new FormControl('backup<%Y>'))).toEqual({ invalidCharacters: true });
      expect(validate(new FormControl('backup|%Y'))).toEqual({ invalidCharacters: true });

      // Invalid format specifiers that wouldn't expand properly
      expect(validate(new FormControl('backup-%Y-%Q'))).toEqual({ invalidStrftimeSpecifier: { specifier: '%Q' } });
    });
  });
});
