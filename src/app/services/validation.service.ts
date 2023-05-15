import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class ValidationService {
  greaterThan(otherControlName: string, fieldPlaceholers: [string]) {
    return function greaterThanValidate(control: FormControl) {
      if (!control.parent) {
        return null;
      }

      // Initializing the validator.
      const thisControl = control;
      const otherControl = control.parent.get(otherControlName) as FormControl;
      if (!thisControl) {
        if (!otherControl) {
          throw new Error(
            'greaterThanValidator(): other control is not found in parent group',
          );
        }
        otherControl.valueChanges.subscribe(
          () => { thisControl.updateValueAndValidity(); },
        );
      }

      if (!otherControl) {
        return null;
      }

      const otherVal = Number(otherControl.value);
      const thisVal = Number(thisControl.value);
      if (otherVal >= thisVal) {
        return { greaterThan: true, fields: fieldPlaceholers };
      }

      return null;
    };
  }

  rangeValidator(min: number, max?: number) {
    return function rangeValidate(control: FormControl) {
      let regex;
      if (min === 0) {
        regex = /^(0|[1-9]\d*)$/;
      } else {
        regex = /^[1-9]\d*$/;
      }

      if (!control.parent) {
        return null;
      }

      // Initializing the validator.
      const thisControl = control;

      if (!thisControl.value) {
        return null;
      }

      if (regex.test(thisControl.value)) {
        const num = Number(thisControl.value);
        if (num >= min) {
          if (max) {
            if (num <= max) {
              return null;
            }
          } else {
            return null;
          }
        }
      }

      return { range: true, rangeValue: { min, max } };
    };
  }

  matchOtherValidator(otherControlName: string) {
    return function matchOtherValidate(control: FormControl) {
      if (!control.parent) {
        return null;
      }

      // Initializing the validator.
      const thisControl = control;
      const otherControl = control.parent.get(otherControlName) as FormControl;
      if (!thisControl) {
        if (!otherControl) {
          throw new Error(
            'matchOtherValidator(): other control is not found in parent group',
          );
        }
        otherControl.valueChanges.subscribe(
          () => { thisControl.updateValueAndValidity(); },
        );
      }

      if (!otherControl) {
        return null;
      }

      if (otherControl.value !== thisControl.value) {
        return { matchOther: true };
      }

      return null;
    };
  }
}
