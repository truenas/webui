import { T } from '../../translate-marker';
import { matchOtherValidator } from '../../pages/common/entity/entity-form/validators/password-validation';

export default {
pw_username_name : 'bsdusr_username',
pw_username_placeholder : T('Username'),
pw_current_pw_name: 'bsdusr_passwd_currnt',
pw_current_pw_placeholder : T('Current Password'),
pw_new_pw_name : 'bsdusr_password',
pw_new_pw_placeholder : T('New Password'),
pw_new_pw_tooltip : T('Passwords cannot contain a <b>?</b>. Passwords should\
 be at least eight characters and contain a mix of lower and\
 upper case, numbers, and special characters.'),
pw_confirm_pw_name: 'bsdusr_password_conf',
pw_confirm_pw_placeholder : T('Confirm Password'),
pw_confirm_pw_validation : [ matchOtherValidator('bsdusr_password') ]
}