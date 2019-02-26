import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";

export const helptext_system_email = {
  em_fromemail: {
    placeholder: T("From E-mail"),
    tooltip: T(
      "The envelope From address shown in the email.\
 This is set to assist with filtering mail on the\
 receiving system."
    )
  },

  em_outgoingserver: {
    placeholder: T("Outgoing Mail Server"),
    tooltip: T(
      "Hostname or IP address of SMTP server to use for\
 sending this email."
    )
  },

  em_port: {
    placeholder: T("Mail Server Port"),
    tooltip: T(
      "SMTP port number. Typically <i>25,465</i>\
 (secure SMTP), or <i>587</i> (submission)."
    )
  },

  em_security: {
    placeholder: T("Security"),
    tooltip: T(
      "Encryption type. Choices are <i>Plain, SSL</i>, or\
 <i>TLS</i>."
    )
  },

  em_smtp: {
    placeholder: T("SMTP Authentication"),
    tooltip: T(
      'Enable/disable\
 <a href="https://en.wikipedia.org/wiki/SMTP_Authentication"\
 target="_blank">SMTP AUTH</a> using PLAIN SASL.\
 Enter the required Username and Password if set.'
    )
  },

  em_user: {
    placeholder: T("Username"),
    tooltip: T(
      "Enter the username if the SMTP server requires\
 authentication."
    ),
    validation: [Validators.required]
  },

  em_pwmessage: {
    paraText: T('Matching passwords must be entered to submit the form, even when editing settings.')
  },

  em_pass1: {
    placeholder: T("Password"),
    tooltip: T(
      "Enter the password if the SMTP server requires\
 authentication."
    ),
    validation: [matchOtherValidator("em_pass2"), Validators.required]
  },

  em_pass2: {
    placeholder: T("Confirm Password"),
    tooltip: T(""),
    validation: [Validators.required]
  }
};
