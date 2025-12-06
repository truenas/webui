import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { prepareBwlimit } from 'app/helpers/bwlimit.utils';
import { BwLimitUpdate } from 'app/interfaces/cloud-sync-task.interface';

/**
 * validator that ensures *rclone bandwidth limit strings*
 * match the specification described here:
 * https://rclone.org/docs/#bwlimit-bwtimetable
 *
 * on error, the validator returns the *invalidRcloneBandwidthLimit* error object with
 * the original invalid value string.
 */
export function bwlimitValidator(): ValidatorFn {
  return (control: AbstractControl<string[]>): ValidationErrors | null => {
    const value = control.value;

    // empty arrays are always valid since it's possible to not have a bandwidth limit at all
    if (!value || value.length === 0) {
      return null;
    }

    // prepare the bwlimit for submission to the API
    // `parsed` requires further validation, which we do in this function
    const parsed = prepareBwlimit(value);

    // predicate that checks whether or not the bandwidth value is invalid.
    // returns `true` if the bandwidth is invalid.
    const invalidBandwidthPredicate = (limit: BwLimitUpdate): boolean => {
      return Number.isNaN(limit.bandwidth) || limit.bandwidth < 0;
    };

    // predicate that checks whether or not the time string is invalid
    // returns `true` if the time is invalid.
    const invalidTimePredicate = (limit: BwLimitUpdate): boolean => {
      const timeComponents = limit.time.split(':');
      if (timeComponents.length !== 2) {
        return true;
      }

      const hour = Number(timeComponents[0]);
      const minute = Number(timeComponents[1]);
      if (Number.isNaN(hour) || !Number.isInteger(hour) || hour < 0 || hour > 23) {
        return true;
      }

      if (Number.isNaN(minute) || !Number.isInteger(minute) || minute < 0 || minute > 59) {
        return true;
      }

      return false;
    };

    // return the first validation error
    const invalidBwLimit = parsed.findIndex((limit) => {
      return invalidTimePredicate(limit) || invalidBandwidthPredicate(limit);
    });
    return invalidBwLimit >= 0 ? { invalidRcloneBandwidthLimit: { value: value[invalidBwLimit] } } : null;
  };
}
