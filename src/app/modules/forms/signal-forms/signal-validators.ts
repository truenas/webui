import { inject } from '@angular/core';
import {
  requiredError, required, SchemaPath, validate,
} from '@angular/forms/signals';
import { TranslateService } from '@ngx-translate/core';
import ipRegex from 'ip-regex';
import * as isCidr from 'is-cidr';

/**
 * Signal forms versions of the Reactive validators in `ix-forms/validators`, with the same messages. An empty
 * value passes, so pair them with `required()` where the field must be filled.
 */

/** `rangeValidator`: a whole number from `min` to `max`. */
export function validateRange(path: SchemaPath<number | null>, min: number, max: number): void {
  const translate = inject(TranslateService);
  validate(path, ({ value }) => {
    const number = value();
    if (number === null || number === undefined || (Number.isInteger(number) && number >= min && number <= max)) {
      return null;
    }
    return {
      kind: 'range',
      message: translate.instant('The value is out of range. Enter a value between {min} and {max}.', { min, max }),
    };
  });
}

/** `ipv4or6Validator` (no netmask) or, with `cidr`, `ipv4or6cidrValidator` (`10.0.0.1/24`). */
export function validateIpAddress(path: SchemaPath<string>, options: { cidr?: boolean } = {}): void {
  const translate = inject(TranslateService);
  validate(path, ({ value }) => {
    const address = value();
    if (!address) {
      return null;
    }
    const isValid = options.cidr
      ? isCidr.v4(address) || isCidr.v6(address)
      : ipRegex({ exact: true, includeBoundaries: true }).test(address);
    return isValid ? null : { kind: 'ip2', message: translate.instant('Invalid IP address') };
  });
}

/**
 * `required()` for a list field (a multi-select, an ordered listbox). Angular's `required()` counts `''`, `false`
 * and `null` as empty but not `[]`, so on its own it marks the field required and never fails. This keeps the
 * asterisk and adds the missing check, with the same `required` error.
 */
export function requiredList(path: SchemaPath<unknown[]>): void {
  required(path);
  validate(path, ({ value }) => (value().length ? null : requiredError()));
}
