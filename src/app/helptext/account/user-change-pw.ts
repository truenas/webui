import { Validators } from '@angular/forms';
import { matchOtherValidator } from 'app/pages/common/entity/entity-form/validators/password-validation';
import { T } from 'app/translate-marker';

export default {
  pw_form_title_name: T('Change Administrator Password'),
  pw_form_title_class: 'change-password',
  pw_username_placeholder: T('Username'),
  pw_current_pw_placeholder: T('Current Password'),
  pw_new_pw_placeholder: T('New Password'),
  pw_new_pw_tooltip: T('Passwords cannot contain a <b>?</b>. Passwords should\
 be at least eight characters and contain a mix of lower and\
 upper case, numbers, and special characters.'),
  pw_new_pw_validation: [Validators.pattern('^[^?]*$')],
  pw_confirm_pw_placeholder: T('Confirm Password'),
  pw_confirm_pw_validation: [matchOtherValidator('password')],
  pw_invalid_title: T('Incorrect Password'),
  pw_invalid_msg: T('The administrator password is incorrect.'),
  pw_updated: T('Password updated.'),
};
