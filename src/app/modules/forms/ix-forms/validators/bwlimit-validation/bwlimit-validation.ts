import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { prepareBwlimit } from 'app/helpers/bwlimit.utils';

/**
 * validator that ensures *rclone bandwidth limit strings*
 * match the specification described here:
 * https://rclone.org/docs/#bwlimit-bandwidth-spec
 *
 * on error, the validator returns the *pattern* error object which displays:
 * 'Invalid format or character'.
 */
export function bwlimitValidator(): ValidatorFn {
  return (control: AbstractControl<string[]>): ValidationErrors | null => {
    const value = control.value;

    // empty arrays are always valid since it's possible to not have a bandwidth limit at all
    if (!value || value.length === 0) {
      return null;
    }

    const parsed = prepareBwlimit(value);

    // a parsed bandwidth limit is invalid if it is `NaN`, since that means
    // that `prepareBwlimit` failed to parse it as a number at all.
    // TODO: probably want to validate the time here too? just for consistency?
    const hasInvalidBandwidth = parsed.some((limit) => {
      return Number.isNaN(limit.bandwidth);
    });

    if (hasInvalidBandwidth) {
      return { pattern: true };
    }

    return null;
  };
}
