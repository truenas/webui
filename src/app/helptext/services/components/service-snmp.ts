import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextServiceSmart = {
  location_tooltip: T('Enter the location of the system.'),
  contact_tooltip: T('E-mail address that will receive SNMP service messages.'),
  community_tooltip: T('Change from <i>public</i> to increase system security.\
 Can only contain alphanumeric characters, underscores,\
 dashes, periods, and spaces. This can be left empty\
 for <i>SNMPv3</i> networks.'),

  v3_tooltip: T('Set to to enable support for <a\
 href="https://tools.ietf.org/html/rfc3410"\
 target="_blank">SNMP version 3</a>. See <a\
 href="http://net-snmp.sourceforge.net/docs/man/snmpd.conf.html"\
 target="_blank">snmpd.conf(5)</a> for configuration\
 details.'),

  v3_username_tooltip: T('Enter a username to register with this service.'),
  v3_authtype_tooltip: T('Choose an authentication method.'),
  v3_authtype_options: [
    { label: 'MD5', value: 'MD5' },
    { label: 'SHA', value: 'SHA' },
  ],

  v3_password_tooltip: T('Enter a password of at least eight characters.'),
  v3_privproto_tooltip: T('Choose a privacy protocol.'),
  v3_privproto_options: [
    { label: 'AES', value: 'AES' },
    { label: 'DES', value: 'DES' },
  ],

  v3_privpassphrase_tooltip: T('Enter a separate privacy passphrase. <b>Password</b>\
 is used when this is left empty.'),

  options_tooltip: T('Enter any additional <a\
 href="http://net-snmp.sourceforge.net/docs/man/snmpd.conf.html"\
 target="_blank">snmpd.conf(5)</a> options. Add one\
 option for each line.'),

  loglevel_tooltip: T('Choose how many log entries to create. Choices range\
 from the least log entries (<i>Emergency</i>) to the\
 most (<i>Debug</i>).'),
  loglevel_options: [
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
