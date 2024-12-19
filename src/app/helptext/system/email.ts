import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemEmail = {
  fromemail: {
    tooltip: T('The user account <i>Email</i> address to use for the \
 envelope <i>From</i> email address. The user account <i>Email</i> in \
 <b>Accounts > Users > Edit</b> must be configured first.'),
  },
  fromname: {
    tooltip: T('The friendly name to show in front of the sending email \
 address. Example: <i>Storage System 01</i>&ltit@example.com&gt'),
  },
  outgoingserver: {
    tooltip: T(
      'Hostname or IP address of SMTP server to use for\
 sending this email.',
    ),
  },
  port: {
    tooltip: T(
      'SMTP port number. Typically <i>25,465</i>\
 (secure SMTP), or <i>587</i> (submission).',
    ),
  },
  security: {
    tooltip: T(
      '<a href="https://www.fastmail.com/help/technical/ssltlsstarttls.html"\
 target="_blank">Email encryption</a> type. Choices are\
 <i>Plain (No Encryption)</i>, <i>SSL (Implicit TLS)</i>, or\
 <i>TLS (STARTTLS)</i>.',
    ),
  },
  user: {
    tooltip: T(
      'Enter the username if the SMTP server requires\
 authentication.',
    ),
  },
  pass: {
    tooltip: T(
      'Enter the password for the SMTP server. Only plain ASCII\
 characters are accepted.',
    ),
  },
  send_mail_method: {
    smtp: {
      placeholder: 'SMTP',
      tooltip: T('Enable SMTP configuration'),
    },
    gmail: {
      placeholder: 'GMail OAuth',
      tooltip: T('Enable GMail OAuth authentication.'),
    },
    outlook: {
      placeholder: 'Outlook OAuth',
      tooltip: T('Enable Outlook OAuth authentication.'),
    },
  },

  auth: {
    smtp: {
      tooltip: T(
        'Enable\
   <a href="https://en.wikipedia.org/wiki/SMTP_Authentication"\
   target="_blank">SMTP AUTH</a> using PLAIN SASL.\
   Requires a valid Username and Password.',
      ),
    },
    client_id: {
      tooltip: T('Use the <i>Log In to GMail</i> button to obtain the credentials for this form.'),
    },
  },
};
