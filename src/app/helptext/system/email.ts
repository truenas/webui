import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";

export const helptext_system_email = {
  em_fromemail: {
    placeholder: T("From E-mail"),
    tooltip: T(
      'The envelope <i>From</i> address shown in the email.\
 This is set to assist with filtering mail on the\
 receiving system. A friendly name can be set using this syntax:\
 "friendly sender name" <<i>email address</i>>'
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
      '<a href="https://www.fastmail.com/help/technical/ssltlsstarttls.html"\
 target="_blank">Email encryption</a> type. Choices are\
 <i>Plain (No Encryption)</i>, <i>SSL (Implicit TLS)</i>, or\
 <i>TLS (STARTTLS)</i>.'
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
    paraText: T('Enter the password to submit settings changes.')
  },

  em_pass: {
    placeholder: T("Password"),
    tooltip: T(
      "Enter the password if the SMTP server requires\
 authentication."
    ),
    validation: [Validators.required]
  }
};
