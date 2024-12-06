import { FormControl, ValidatorFn } from '@angular/forms';
import ipRegex from 'ip-regex';
import * as isCidr from 'is-cidr';
import { indexOf } from 'lodash-es';

// Accepts ipv4 or ipv6 addresses with no CIDR (ie, /24)
export function ipv4or6Validator(): ValidatorFn {
  let thisControl: FormControl<string>;

  return function ipValidate(control: FormControl<string>) {
    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    if (!thisControl) {
      thisControl = control;
    }

    if (thisControl.value === '' || thisControl.value === undefined) {
      return null;
    }

    if (!ipRegex({ exact: true, includeBoundaries: true }).test(thisControl.value)) {
      return { ip2: true };
    }

    return null;
  };
}

// Accepts ipv4 or ipv6 addresses with a CIDR (ie, /24)
export function ipv4or6cidrValidator(): ValidatorFn {
  let thisControl: FormControl<string>;

  return function ipValidate(control: FormControl<string>) {
    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    if (!thisControl) {
      thisControl = control;
    }
    if (thisControl.value === '' || thisControl.value === undefined) {
      return null;
    }

    if (!isCidr.v4(thisControl.value) && !isCidr.v6(thisControl.value)) {
      return { ip2: true };
    }

    return null;
  };
}

// Accepts ipv4 or ipv6 addresses with an OPTIONAL CIDR (ie, /24)
export function ipv4or6OptionalCidrValidator(): ValidatorFn {
  let thisControl: FormControl<string>;

  return function ipValidate(control: FormControl<string>) {
    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    if (!thisControl) {
      thisControl = control;
    }
    if (thisControl.value === '' || thisControl.value === undefined) {
      return null;
    }

    if (!isCidr.v4(thisControl.value) && !isCidr.v6(thisControl.value)
      && !ipRegex({ exact: true, includeBoundaries: true }).test(thisControl.value)) {
      return { ip2: true };
    }

    return null;
  };
}

// Accepts ipv4 addresses with no CIDR (ie, /24)
export function ipv4Validator(): ValidatorFn {
  let thisControl: FormControl<string>;

  return function ipValidate(control: FormControl<string>) {
    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    if (!thisControl) {
      thisControl = control;
    }

    if (thisControl.value === '' || thisControl.value === undefined) {
      return null;
    }

    if (!ipRegex.v4({ exact: true }).test(thisControl.value)) {
      return { ip2: true };
    }

    return null;
  };
}

// Accepts ipv6 addresses with no CIDR (ie, /24)
export function ipv6Validator(): ValidatorFn {
  let thisControl: FormControl<string>;

  return function ipValidate(control: FormControl<string>) {
    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    if (!thisControl) {
      thisControl = control;
    }
    if (thisControl.value === '' || thisControl.value === undefined) {
      return null;
    }

    if (!ipRegex.v6({ exact: true }).test(thisControl.value)) {
      return { ip2: true };
    }

    return null;
  };
}

// Used only on sharing/iscsi/portal/portal-form
// TODO: Check what difference with ipv4or6Validator
export function ipValidator(type: 'ipv4' | 'ipv6' | 'all'): ValidatorFn {
  const ipv4Regex = ipRegex.v4();
  const ipv6Regex = ipRegex.v6();
  let thisControl: FormControl<string>;

  return function isValidIp(control: FormControl<string>) {
    let error = null;

    if (!control.parent) {
      return null;
    }

    thisControl = control;

    if (thisControl.value === '' || thisControl.value === undefined) {
      return null;
    }

    function checkIp(ipType: 'ipv4' | 'ipv6'): boolean {
      const regex = ipType === 'ipv4' ? ipv4Regex : ipv6Regex;
      const wildcard = ipType === 'ipv4' ? '0.0.0.0' : '::';
      if (indexOf(thisControl.value, wildcard) !== -1) {
        for (const ip of thisControl.value) {
          if (ip !== wildcard && regex.test(ip)) {
            error = [ipType === 'ipv4' ? 'IPv4' : 'IPv6', wildcard, ip];
            return false;
          }
        }
      }
      return true;
    }

    if (thisControl.value.length > 1) {
      if (type === 'all') {
        if (!checkIp('ipv4') || !checkIp('ipv6')) {
          return { ip: true, info: error };
        }
      } else if (!checkIp(type)) {
        return { ip: true, info: error };
      }
    }

    return null;
  };
}
