import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextServiceSnmp = {
  locationTooltip: T('Enter the location of the system.'),
  contactTooltip: T('E-mail address that will receive SNMP service messages.'),
  communityTooltip: T('Change from <i>public</i> to increase system security.\
 Can only contain alphanumeric characters, underscores,\
 dashes, periods, and spaces. This can be left empty\
 for <i>SNMPv3</i> networks.'),

  v3: {
    tooltip: T('Set to enable support for <a\
 href="https://tools.ietf.org/html/rfc3410"\
 target="_blank">SNMP version 3</a>. See <a\
 href="http://net-snmp.sourceforge.net/docs/man/snmpd.conf.html"\
 target="_blank">snmpd.conf(5)</a> for configuration\
 details.'),

    usernameTooltip: T('Enter a username to register with this service.'),
    authTypeTooltip: T('Choose an authentication method.'),
    authTypeOptions: [
      { label: 'MD5', value: 'MD5' },
      { label: 'SHA', value: 'SHA' },
    ],

    passwordTooltip: T('Enter a password of at least eight characters.'),
    privprotoTooltip: T('Choose a privacy protocol.'),
    privprotoOptions: [
      { label: 'AES', value: 'AES' },
      { label: 'DES', value: 'DES' },
    ],

    privpassphraseTooltip: T('Enter a separate privacy passphrase. <b>Password</b>\
 is used when this is left empty.'),
  },

  optionsTooltip: T('Enter any additional <a\
 href="http://net-snmp.sourceforge.net/docs/man/snmpd.conf.html"\
 target="_blank">snmpd.conf(5)</a> options. Add one\
 option for each line.'),

  loglevelTooltip: T('Choose how many log entries to create. Choices range\
 from the least log entries (<i>Emergency</i>) to the\
 most (<i>Debug</i>).'),
  loglevelOptions: [
    { label: 'Emergency', value: 0 },
    { label: 'Alert', value: 1 },
    { label: 'Critical', value: 2 },
    { label: 'Error', value: 3 },
    { label: 'Warning', value: 4 },
    { label: 'Notice', value: 5 },
    { label: 'Info', value: 6 },
    { label: 'Debug', value: 7 },
  ],
};
