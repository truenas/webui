import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";

export const helptext_system_email = {
  fromemail: {
    placeholder: T("From E-mail"),
    tooltip: T(
      'The envelope <i>From</i> address shown in the email.\
 This can be set to make filtering mail on the\
 receiving system easier. The friendly name is set like this:\
 <i>"Friendly Name" &ltaddress@example.com&gt</i>'
    )
  },

  fromname: {
    placeholder: T("From Name"),
    tooltip: T('')
  },

  outgoingserver: {
    placeholder: T("Outgoing Mail Server"),
    tooltip: T(
      "Hostname or IP address of SMTP server to use for\
 sending this email."
    )
  },

  port: {
    placeholder: T("Mail Server Port"),
    tooltip: T(
      "SMTP port number. Typically <i>25,465</i>\
 (secure SMTP), or <i>587</i> (submission)."
    )
  },

  security: {
    placeholder: T("Security"),
    tooltip: T(
      '<a href="https://www.fastmail.com/help/technical/ssltlsstarttls.html"\
 target="_blank">Email encryption</a> type. Choices are\
 <i>Plain (No Encryption)</i>, <i>SSL (Implicit TLS)</i>, or\
 <i>TLS (STARTTLS)</i>.'
    )
  },

  smtp: {
    placeholder: T("SMTP Authentication"),
    tooltip: T(
      'Enable/disable\
 <a href="https://en.wikipedia.org/wiki/SMTP_Authentication"\
 target="_blank">SMTP AUTH</a> using PLAIN SASL.\
 Enter the required Username and Password if set.'
    )
  },

  user: {
    placeholder: T("Username"),
    tooltip: T(
      "Enter the username if the SMTP server requires\
 authentication."
    ),
    validation: [Validators.required]
  },

  pass: {
    placeholder: T("Password"),
    tooltip: T(
      "Enter the password for the SMTP server. Only plain ASCII\
 characters are accepted."
    )
  }
};
