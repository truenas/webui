import { ValidatorFn, FormControl } from '@angular/forms';

/**
 * Valid strftime format specifiers for snapshot naming schemas
 * Based on Python's strftime and commonly used in ZFS snapshot naming
 */
const validStrftimeSpecifiers = [
  // Year
  '%Y', // 4-digit year (e.g., 2023)
  '%y', // 2-digit year (e.g., 23)

  // Month
  '%m', // Month as zero-padded number (01-12)
  '%B', // Full month name (e.g., January)
  '%b', // Abbreviated month name (e.g., Jan)

  // Day
  '%d', // Day of month as zero-padded number (01-31)
  '%j', // Day of year as zero-padded number (001-366)

  // Hour
  '%H', // Hour (24-hour clock) as zero-padded number (00-23)
  '%I', // Hour (12-hour clock) as zero-padded number (01-12)

  // Minute
  '%M', // Minute as zero-padded number (00-59)

  // Second
  '%S', // Second as zero-padded number (00-59)

  // Weekday
  '%A', // Full weekday name (e.g., Monday)
  '%a', // Abbreviated weekday name (e.g., Mon)
  '%w', // Weekday as number (0-6, Sunday is 0)
  '%u', // Weekday as number (1-7, Monday is 1)

  // Week
  '%U', // Week number of year (Sunday as first day of week) (00-53)
  '%W', // Week number of year (Monday as first day of week) (00-53)

  // AM/PM
  '%p', // AM or PM

  // Timezone
  '%Z', // Time zone name
  '%z', // UTC offset in the form +HHMM or -HHMM

  // Other
  '%%', // Literal '%' character
];

export function namingSchemaValidator(): ValidatorFn {
  return (control: FormControl<string>) => {
    const value = control.value;

    if (!value) {
      return null;
    }

    // Check for forward slashes (not allowed in ZFS snapshot names)
    if (value.includes('/')) {
      return { containsSlash: true };
    }

    // Check for invalid characters that could cause issues (be more restrictive)
    // Only allow printable ASCII characters except for problematic ones
    // eslint-disable-next-line no-control-regex, sonarjs/no-control-regex
    const invalidChars = /[<>:"\\|\u0000-\u001f\u007f]/;
    if (invalidChars.test(value)) {
      return { invalidCharacters: true };
    }

    // Check for empty string (though this should be caught by required validator)
    if (value.trim() === '') {
      return { empty: true };
    }

    // Handle percent signs more carefully
    // Split by %% first to handle literal percent signs
    const parts = value.split('%%');

    for (const part of parts) {
      // Find all % patterns in each part (excluding %%)
      const percentMatches = part.match(/%./g) || [];

      // Check if any % patterns are invalid
      for (const match of percentMatches) {
        if (!validStrftimeSpecifiers.includes(match)) {
          return { invalidStrftimeSpecifier: { specifier: match } };
        }
      }

      // Check for orphaned % at the end of this part
      // But only if it's not at a %% boundary
      if (part.endsWith('%') && !part.endsWith('%%')) {
        return { orphanedPercent: true };
      }
    }

    return null;
  };
}
