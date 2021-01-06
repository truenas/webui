import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";
import { rangeValidator } from 'app/pages/common/entity/entity-form/validators/range-validation'
import { regexValidator } from 'app/pages/common/entity/entity-form/validators/regex-validation'

export const helptext_system_email = {
  fieldsets: {
    general: T('General Options'),
    access: T('Access')
  },
  fromemail: {
    placeholder: T("From Email"),
    validation: [Validators.required, Validators.email],
    tooltip: T('The user account <i>Email</i> address to use for the \
 envelope <i>From</i> email address. The user account <i>Email</i> in \
 <b>Accounts > Users > Edit</b> must be configured first.')
  },

  fromname: {
    placeholder: T("From Name"),
    tooltip: T('The friendly name to show in front of the sending email \
 address. Example: <i>Storage System 01</i>&ltit@example.com&gt')
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
    validation: [Validators.required, rangeValidator(0, 65535)],
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
    ), 
    validation: [regexValidator(/^[ -~]+$/)]
  },

  send_mail_method: {
    placeholder: T('Send Mail Method'),
    smtp: {
      placeholder: T('SMTP'),
      tooltip: T('Enable SMTP configuration')
    },
    gmail: {
      placeholder: T('GMail OAuth'),
      tooltip: T('Enable GMail OAuth authentication.')
    },
  },

  auth: {
    smtp: {
      placeholder: T('SMTP Authentication'),
      tooltip: T(
        'Enable\
   <a href="https://en.wikipedia.org/wiki/SMTP_Authentication"\
   target="_blank">SMTP AUTH</a> using PLAIN SASL.\
   Requires a valid Username and Password.'
      )
    },
    client_id: {
      placeholder: T('Client ID'),
      tooltip: T('Use the <i>Log In to GMail</i> button to obtain the credentials for this form.')
    },
    client_secret: T('Client Secret'),
    refresh_token: T('Refresh Token'),
    login_button: T('Log In to GMail')
  }
};
