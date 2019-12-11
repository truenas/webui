import { FormControl } from '@angular/forms';
import * as _ from 'lodash';

export function ipValidator(type: string = 'ipv4' || 'ipv6' || 'all') {
    const ipv4_regex = /^((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})$/;
    const ipv6_regex = /^([0-9a-f]|:){1,4}(:([0-9a-f]{0,4})*){1,7}(:((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}))?$/i;
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
                console.log(thisControl.value)
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