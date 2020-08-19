import { FormControl } from '@angular/forms';
import * as _ from 'lodash';
import * as ipRegex from 'ip-regex';
import * as isCidr from 'is-cidr';

  // Accepts ipv4 or ipv6 addresses with no CIDR (ie, /24)
  export function ipv4or6Validator(control: string) {
    let thisControl: FormControl;
  
    return function ipValidate(control: FormControl) {
  
      if (!control.parent) {
        return null;
      }
  
      // Initializing the validator.
      if (!thisControl) {
        thisControl = control;
      }
  
      if(thisControl.value == "" || thisControl.value == undefined) {
        return null;
      }

      if (!ipRegex({exact: true, includeBoundaries: true }).test(thisControl.value)) {
            return {ip2 : true};
        };
      

      return null;
    }
  }

  // Accepts ipv4 or ipv6 addresses with a CIDR (ie, /24)
  export function ipv4or6cidrValidator(control: string) {
    let thisControl: FormControl;
  
    return function ipValidate(control: FormControl) {
  
      if (!control.parent) {
        return null;
      }
  
      // Initializing the validator.
      if (!thisControl) {
        thisControl = control;
      }
      if(thisControl.value == "" || thisControl.value == undefined) {
        return null;
      }

      if (!isCidr.v4(thisControl.value) && !isCidr.v6(thisControl.value)) {
            return {ip2 : true};
        };

      return null;
    }
  }

    // Accepts ipv4 or ipv6 addresses with an OPTIONAL CIDR (ie, /24)
    export function ipv4or6OptionalCidrValidator(control: string) {
      let thisControl: FormControl;
    
      return function ipValidate(control: FormControl) {
    
        if (!control.parent) {
          return null;
        }
    
        // Initializing the validator.
        if (!thisControl) {
          thisControl = control;
        }
        if(thisControl.value == "" || thisControl.value == undefined) {
          return null;
        }
  
        if (!isCidr.v4(thisControl.value) && !isCidr.v6(thisControl.value) &&
          !ipRegex({exact: true, includeBoundaries: true }).test(thisControl.value))
        {
              return {ip2 : true};
          };
  
        return null;
      }
    }

  // Accepts ipv4 addresses with no CIDR (ie, /24)
  export function ipv4Validator(control: string) {
    let thisControl: FormControl;
  
    return function ipValidate(control: FormControl) {
  
      if (!control.parent) {
        return null;
      }
  
      // Initializing the validator.
      if (!thisControl) {
        thisControl = control;
      }
  
      if(thisControl.value == "" || thisControl.value == undefined) {
        return null;
      }

      if (!ipRegex.v4({exact: true }).test(thisControl.value)) {
            return {ip2 : true};
        };
      

      return null;
    }
  }

  // Accepts ipv6 addresses with no CIDR (ie, /24)
  export function ipv6Validator(control: string) {
    let thisControl: FormControl;
  
    return function ipValidate(control: FormControl) {
  
      if (!control.parent) {
        return null;
      }
  
      // Initializing the validator.
      if (!thisControl) {
        thisControl = control;
      }
      if(thisControl.value == "" || thisControl.value == undefined) {
        return null;
      }

      if (!ipRegex.v6({exact: true }).test(thisControl.value)) {
          return {ip2 : true};
        };
      

      return null;
    }
  }

  // Used only on sharing/iscsi/portal/portal-form
export function ipValidator(type: string = 'ipv4' || 'ipv6' || 'all') {
  const ipv4_regex = ipRegex.v4();
  const ipv6_regex =  ipRegex.v6()
  let thisControl: FormControl;

  return function isValidIp(control: FormControl) {
      let error = null;

      if (!control.parent) {
          return null;
      }

      thisControl = control;

      if (thisControl.value == "" || thisControl.value == undefined) {
          return null;
      }

      function checkIp(ipType = 'ipv4' || 'ipv6') {
          const regex = ipType === 'ipv4' ? ipv4_regex : ipv6_regex;
          const wildcard = ipType === 'ipv4' ? '0.0.0.0' : '::';
          if (_.indexOf(thisControl.value, wildcard) !== -1) {
              for (let i = 0; i < thisControl.value.length; i++) {
                  if (thisControl.value[i] !== wildcard && regex.test(thisControl.value[i])) {
                      error = [ipType === 'ipv4' ? 'IPv4' : 'IPv6', wildcard, thisControl.value[i]];
                      return false;
                  }
              }
          }
          return true;
      }

      if (thisControl.value.length > 1) {
          if (type === 'all') {
              if (!checkIp('ipv4') || !checkIp('ipv6')) {
                  return { ip: true, info: error }
              }
          } else {
              if (!checkIp(type)) {
                  return { ip: true, info: error }
              }
          }
      }

      return null;
  }
}

  
